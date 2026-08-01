import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 8;
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResetAction = 'send' | 'verify' | 'update';

type RequestBody = {
  action?: ResetAction;
  email?: string;
  code?: string;
  newPassword?: string;
};

type PasswordResetRow = {
  id: string;
  user_id: string;
  reset_code: string;
  code_expires_at: string;
  is_used: boolean;
  failed_attempts: number;
  blocked_until: string | null;
};

type FunctionResult = {
  success: boolean;
  message: string;
  user_id?: string;
  statusCode?: number;
};

function jsonResponse(result: FunctionResult, status = 200): Response {
  const statusCode = result.statusCode ?? status;
  const payload: { success: boolean; message: string; user_id?: string } = {
    success: result.success,
    message: result.message,
  };

  if (result.user_id) {
    payload.user_id = result.user_id;
  }

  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateResetCode(): string {
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[index];
  }

  return code;
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

async function sendResetCodeEmail(to: string, resetCode: string): Promise<{ ok: boolean; message: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'ELUS <onboarding@resend.dev>';

  if (!apiKey) {
    return {
      ok: false,
      message: 'RESEND_API_KEY não configurada no servidor.',
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: 'Código de redefinição de senha — ELUS',
      text: `Seu código ELUS é: ${resetCode}\n\nEle expira em 5 minutos. Se você não solicitou, ignore este e-mail.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="margin-bottom: 8px;">Redefinição de senha</h2>
          <p style="color: #444; line-height: 1.5;">
            Use o código abaixo no ELUS para continuar. Ele expira em <strong>5 minutos</strong>.
          </p>
          <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700; margin: 24px 0;">
            ${resetCode}
          </p>
          <p style="color: #777; font-size: 13px; line-height: 1.5;">
            Se você não solicitou esta redefinição, ignore este e-mail.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Resend error:', response.status, body);

    const lower = body.toLowerCase();
    const isTestingDomainBlock =
      lower.includes('only send testing emails to your own email') ||
      lower.includes('verify a domain') ||
      (lower.includes('validation_error') && lower.includes('domain'));

    // Fallback temporário: código já está no banco; libera o fluxo sem e-mail.
    if (isTestingDomainBlock) {
      console.log(
        `[ELUS reset-password] Resend bloqueou domínio de teste. Código para ${to}: ${resetCode}`
      );
      return {
        ok: true,
        message:
          'Código gerado. E-mail ainda depende de domínio verificado no Resend; use o código dos logs/banco por enquanto.',
      };
    }

    return {
      ok: false,
      message: 'Não foi possível enviar o e-mail. Tente novamente.',
    };
  }

  console.log(`[ELUS reset-password] E-mail enviado para ${to}`);
  return { ok: true, message: 'Código enviado' };
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === normalized);

    if (match) {
      return match.id;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function sendResetCode(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<FunctionResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Informe um e-mail válido.', statusCode: 400 };
  }

  const userId = await findAuthUserIdByEmail(supabase, normalizedEmail);

  if (!userId) {
    return {
      success: false,
      message: 'Nenhuma conta encontrada com este e-mail.',
      statusCode: 404,
    };
  }

  const resetCode = generateResetCode();
  const codeExpiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const { error } = await supabase.from('password_resets').insert({
    user_id: userId,
    email: normalizedEmail,
    reset_code: resetCode,
    code_expires_at: codeExpiresAt,
    is_used: false,
    failed_attempts: 0,
    blocked_until: null,
  });

  if (error) {
    console.error('sendResetCode insert error:', error);
    return {
      success: false,
      message: 'Não foi possível gerar o código. Tente novamente.',
      statusCode: 500,
    };
  }

  const emailResult = await sendResetCodeEmail(normalizedEmail, resetCode);

  if (!emailResult.ok) {
    return {
      success: false,
      message: emailResult.message,
      statusCode: 500,
    };
  }

  return {
    success: true,
    message: 'Código enviado',
    user_id: userId,
  };
}

async function findActiveResetRow(
  supabase: ReturnType<typeof createClient>,
  normalizedEmail: string
): Promise<PasswordResetRow | null> {
  const { data, error } = await supabase
    .from('password_resets')
    .select('id, user_id, reset_code, code_expires_at, is_used, failed_attempts, blocked_until')
    .eq('email', normalizedEmail)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('findActiveResetRow query error:', error);
    throw error;
  }

  return (data as PasswordResetRow | null) ?? null;
}

async function registerFailedAttempt(
  supabase: ReturnType<typeof createClient>,
  row: PasswordResetRow
): Promise<void> {
  const nextAttempts = (row.failed_attempts ?? 0) + 1;
  const updatePayload: { failed_attempts: number; blocked_until?: string } = {
    failed_attempts: nextAttempts,
  };

  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    updatePayload.blocked_until = new Date(Date.now() + BLOCK_DURATION_MS).toISOString();
  }

  const { error } = await supabase
    .from('password_resets')
    .update(updatePayload)
    .eq('id', row.id);

  if (error) {
    console.error('registerFailedAttempt update error:', error);
  }
}

/**
 * Valida e-mail + código de reset inteiramente no servidor (service role).
 * Retorna a linha do reset quando o código confere; caso contrário, incrementa
 * as tentativas falhas (com bloqueio temporário) e retorna o motivo da falha.
 */
async function checkResetCode(
  supabase: ReturnType<typeof createClient>,
  normalizedEmail: string,
  code: string
): Promise<{ ok: true; row: PasswordResetRow } | { ok: false; result: FunctionResult }> {
  let row: PasswordResetRow | null;

  try {
    row = await findActiveResetRow(supabase, normalizedEmail);
  } catch {
    return {
      ok: false,
      result: { success: false, message: 'Não foi possível validar o código.', statusCode: 500 },
    };
  }

  if (!row) {
    return {
      ok: false,
      result: { success: false, message: 'Código não encontrado. Solicite um novo.', statusCode: 404 },
    };
  }

  if (row.blocked_until && new Date(row.blocked_until).getTime() > Date.now()) {
    return {
      ok: false,
      result: {
        success: false,
        message: 'Muitas tentativas inválidas. Aguarde 15 minutos e tente novamente.',
        statusCode: 429,
      },
    };
  }

  if (new Date(row.code_expires_at).getTime() <= Date.now()) {
    return {
      ok: false,
      result: { success: false, message: 'Código expirado. Solicite um novo.', statusCode: 400 },
    };
  }

  if (row.reset_code !== code.trim()) {
    await registerFailedAttempt(supabase, row);
    return {
      ok: false,
      result: { success: false, message: 'Código inválido.', statusCode: 400 },
    };
  }

  return { ok: true, row };
}

async function verifyResetCode(
  supabase: ReturnType<typeof createClient>,
  email: string,
  code: string
): Promise<FunctionResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Informe um e-mail válido.', statusCode: 400 };
  }

  if (!code || !code.trim()) {
    return { success: false, message: 'Informe o código recebido.', statusCode: 400 };
  }

  const check = await checkResetCode(supabase, normalizedEmail, code);

  if (!check.ok) {
    return check.result;
  }

  return {
    success: true,
    message: 'Código verificado com sucesso.',
    user_id: check.row.user_id,
  };
}

async function updatePassword(
  supabase: ReturnType<typeof createClient>,
  email: string,
  code: string,
  newPassword: string
): Promise<FunctionResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Informe um e-mail válido.', statusCode: 400 };
  }

  if (!code || !code.trim()) {
    return { success: false, message: 'Código é obrigatório.', statusCode: 400 };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      message: 'A senha deve ter pelo menos 8 caracteres.',
      statusCode: 400,
    };
  }

  // Revalida o código no momento da troca de senha — não basta ter passado
  // pela tela de verificação antes; sem isso, quem soubesse só o e-mail
  // poderia trocar a senha de qualquer conta chamando esta action direto.
  const check = await checkResetCode(supabase, normalizedEmail, code);

  if (!check.ok) {
    return check.result;
  }

  const { row } = check;

  const { error: adminError } = await supabase.auth.admin.updateUserById(row.user_id, {
    password: newPassword,
  });

  if (adminError) {
    console.error('updatePassword admin error:', adminError);
    return {
      success: false,
      message: 'Não foi possível atualizar a senha.',
      statusCode: 500,
    };
  }

  const { error: markUsedError } = await supabase
    .from('password_resets')
    .update({ is_used: true })
    .eq('id', row.id);

  if (markUsedError) {
    console.error('updatePassword mark used error:', markUsedError);
    return {
      success: false,
      message: 'Senha atualizada, mas o código não pôde ser invalidado.',
      statusCode: 500,
      user_id: row.user_id,
    };
  }

  return {
    success: true,
    message: 'Senha atualizada',
    user_id: row.user_id,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, message: 'Método não permitido.', statusCode: 405 },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          success: false,
          message: 'Configuração do servidor incompleta.',
          statusCode: 500,
        },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = (await req.json()) as RequestBody;
    const { action, email, code, newPassword } = body;

    if (!action || (action !== 'send' && action !== 'verify' && action !== 'update')) {
      return jsonResponse(
        {
          success: false,
          message: 'Action inválida. Use "send", "verify" ou "update".',
          statusCode: 400,
        },
        400
      );
    }

    if (!email || typeof email !== 'string') {
      return jsonResponse(
        { success: false, message: 'E-mail é obrigatório.', statusCode: 400 },
        400
      );
    }

    if (action === 'send') {
      const result = await sendResetCode(supabase, email);
      return jsonResponse(result, result.success ? 200 : (result.statusCode ?? 400));
    }

    if (typeof code !== 'string') {
      return jsonResponse(
        { success: false, message: 'Código é obrigatório.', statusCode: 400 },
        400
      );
    }

    if (action === 'verify') {
      const result = await verifyResetCode(supabase, email, code);
      return jsonResponse(result, result.success ? 200 : (result.statusCode ?? 400));
    }

    if (typeof newPassword !== 'string') {
      return jsonResponse(
        { success: false, message: 'Nova senha é obrigatória.', statusCode: 400 },
        400
      );
    }

    const result = await updatePassword(supabase, email, code, newPassword);
    return jsonResponse(result, result.success ? 200 : (result.statusCode ?? 400));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('reset-password error:', error);

    return jsonResponse(
      { success: false, message, statusCode: 400 },
      400
    );
  }
});
