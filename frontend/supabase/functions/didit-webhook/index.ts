import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Endpoint público — só a Didit chama isto. Sem verify_jwt (não há usuário
// ELUS autenticado aqui), a segurança vem inteiramente da validação de
// assinatura abaixo. NÃO habilitar CORS amplo aqui seria mais seguro, mas
// webhooks de servidor-a-servidor não passam por preflight de browser; o
// bloco OPTIONS existe só por precaução caso a Didit valide com um preflight.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-signature, x-timestamp',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const diditWebhookSecret = Deno.env.get('DIDIT_WEBHOOK_SECRET');

// Janela de tolerância pra X-Timestamp, em segundos.
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

// Formato de uuid (qualquer variante) — usado pra distinguir vendor_data
// real (user_id do ELUS) de valores de teste da Didit (ex.: "test-vendor-data-123").
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * HMAC-SHA256 do corpo bruto, em hex.
 *
 * Confirmado em produção (01/08/2026, teste real via console Didit): a
 * requisição inclui um header X-Signature puro, além de X-Signature-Simple
 * e X-Signature-V2 — o esquema simples (HMAC-SHA256 hex sobre corpo bruto)
 * implementado aqui é o correto.
 */
export async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparação em tempo constante — não usar === simples pra segredo/assinatura. */
export function timingSafeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;

  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    diff |= charA ^ charB;
  }

  return diff === 0;
}

export function isTimestampFresh(timestampHeader: string, nowMs: number = Date.now()): boolean {
  const timestampSeconds = Number(timestampHeader);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const diffSeconds = Math.abs(nowMs / 1000 - timestampSeconds);

  return diffSeconds <= TIMESTAMP_TOLERANCE_SECONDS;
}

export type WebhookVerificationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Verifica X-Signature + X-Timestamp contra o corpo bruto. Extraída como
 * função pura e exportada para dar pra testar sem precisar de conta Didit
 * real nem subir a function (só precisa de um secret local qualquer).
 */
export async function verifyWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  now?: number;
}): Promise<WebhookVerificationResult> {
  const { rawBody, signatureHeader, timestampHeader, secret, now } = params;

  if (!signatureHeader) {
    return { valid: false, reason: 'X-Signature ausente' };
  }

  if (!timestampHeader) {
    return { valid: false, reason: 'X-Timestamp ausente' };
  }

  if (!isTimestampFresh(timestampHeader, now)) {
    return { valid: false, reason: 'X-Timestamp fora da janela de 5 minutos' };
  }

  const expectedSignature = await computeHmacSha256Hex(secret, rawBody);

  if (!timingSafeEqual(expectedSignature, signatureHeader)) {
    return { valid: false, reason: 'Assinatura inválida' };
  }

  return { valid: true };
}

type DiditWebhookPayload = {
  session_id?: string;
  status?: string;
  vendor_data?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405);
  }

  if (!diditWebhookSecret) {
    // Esperado até o Cleber configurar a secret real — rejeita sem
    // processar nada (nunca aceitar webhook sem segredo configurado).
    console.error('didit-webhook: DIDIT_WEBHOOK_SECRET não configurada.');
    return jsonResponse({ error: 'Webhook não configurado no servidor.' }, 500);
  }

  let rawBody: string;
  let verification: WebhookVerificationResult;

  try {
    // Lê o corpo BRUTO antes de qualquer parse — reserializar (ex.: via
    // req.json() e depois JSON.stringify de novo) muda espaçamento/ordem de
    // chaves e quebra a validação de assinatura, que é sobre os bytes exatos
    // que a Didit enviou.
    rawBody = await req.text();

    const signatureHeader = req.headers.get('X-Signature');
    const timestampHeader = req.headers.get('X-Timestamp');

    verification = await verifyWebhookSignature({
      rawBody,
      signatureHeader,
      timestampHeader,
      secret: diditWebhookSecret,
    });
  } catch (verificationError) {
    // Qualquer erro inesperado nesta etapa (corpo ilegível, crypto falhando,
    // header em formato inesperado etc.) é tratado como "não deu pra
    // validar a assinatura" — um endpoint público nunca deve vazar stack
    // trace nem responder 500 por causa de payload/headers malformados.
    console.error('didit-webhook: erro inesperado ao validar assinatura:', verificationError);
    return jsonResponse({ error: 'Assinatura inválida' }, 401);
  }

  if (!verification.valid) {
    console.warn('didit-webhook: assinatura rejeitada:', verification.reason);
    return jsonResponse({ error: 'Assinatura inválida' }, 401);
  }

  let payload: DiditWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as DiditWebhookPayload;
  } catch (parseError) {
    console.error('didit-webhook: corpo não é JSON válido:', parseError);
    return jsonResponse({ error: 'Corpo inválido' }, 400);
  }

  const { session_id: sessionId, status, vendor_data: userId } = payload;

  if (!userId || !status) {
    console.error('didit-webhook: payload sem vendor_data ou status:', JSON.stringify(payload));
    // Responde 200 mesmo assim — payload malformado não deve fazer a Didit
    // ficar re-tentando indefinidamente; só logamos pra investigar depois.
    return jsonResponse({ ok: true, warning: 'payload incompleto, ignorado' });
  }

  // vendor_data devia ser sempre um user_id real (uuid) do ELUS, mas os
  // eventos de TESTE da Didit mandam um valor de mentira (ex.:
  // "test-vendor-data-123"). Sem essa checagem, o UPDATE abaixo estoura
  // 22P02 (invalid input syntax for type uuid) sem tratamento -> 500.
  // Trata como evento de teste/inválido: loga e responde 200 sem tocar
  // no banco, em vez de derrubar a function.
  if (!UUID_REGEX.test(userId)) {
    console.warn(`didit-webhook: vendor_data não é um UUID válido (provável evento de teste da Didit): "${userId}"`);
    return jsonResponse({ ok: true, warning: 'vendor_data não é um UUID válido, ignorado' });
  }

  // service_role — contorna a RLS que bloqueia o próprio usuário de setar
  // status='verified' (user_update_own_verification). Só este caminho
  // privilegiado pode aprovar automaticamente.
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (status === 'Approved') {
      const { error } = await supabase
        .from('verifications')
        .update({
          status: 'verified',
          verification_method: 'didit',
          didit_session_id: sessionId ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else if (status === 'In Review') {
      const { error } = await supabase
        .from('verifications')
        .update({
          status: 'in_review',
          didit_session_id: sessionId ?? null,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else if (status === 'Declined' || status === 'Abandoned') {
      // Não grava nada permanente — fica como estava (usuário pode tentar
      // de novo, instantâneo ou manual), conforme decisão de produto.
      console.log(`didit-webhook: ${status} para user_id=${userId}, nenhuma mudança gravada.`);
    } else {
      console.warn(`didit-webhook: status desconhecido da Didit: ${status}`);
    }
  } catch (dbError) {
    console.error('didit-webhook: erro ao atualizar verifications:', dbError);
    return jsonResponse({ error: 'Erro ao processar webhook' }, 500);
  }

  return jsonResponse({ ok: true });
});
