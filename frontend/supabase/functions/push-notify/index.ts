import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Chamado pelo próprio client ELUS logo após uma ação bem-sucedida (enviar
// mensagem, aceitar conexão, criar solicitação) — não é webhook de
// terceiro, é o app autenticado avisando "algo aconteceu, manda push pro
// destinatário". Por isso verify_jwt normal (Authorization do usuário
// chamador) em vez do esquema de assinatura usado no didit-webhook.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type NotifyBody =
  | { type: 'message'; messageId: string }
  | { type: 'connection_accepted'; connectionId: string }
  | { type: 'connection_request'; requestId: string }
  | { type: 'contact_request'; requestId: string };

async function getProfileName(admin: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await admin.from('profiles').select('name').eq('id', userId).maybeSingle();
  return (data?.name as string) || 'Alguém';
}

async function sendPushToUser(
  admin: ReturnType<typeof createClient>,
  recipientId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { data: tokenRows } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientId);

  const tokens = (tokenRows ?? []).map((row: { token: string }) => row.token).filter(Boolean);
  if (tokens.length === 0) return;

  const messages = tokens.map((token: string) => ({
    to: token,
    title,
    body,
    sound: 'default',
    data,
  }));

  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('push-notify: erro ao chamar a API de push da Expo:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado' }, 401);
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ error: 'Sessão inválida' }, 401);
  }

  const callerId = authData.user.id;

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400);
  }

  // service_role: precisa ler push_tokens de OUTRO usuário (RLS restringe
  // a própria linha) e os registros das tabelas de origem pra montar o
  // texto real da notificação — nunca confia em texto vindo do client.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (body.type === 'message') {
      const { data: message } = await admin
        .from('messages')
        .select('conversation_id, sender_id')
        .eq('id', body.messageId)
        .maybeSingle();

      if (!message || message.sender_id !== callerId) {
        return jsonResponse({ ok: true, warning: 'mensagem não encontrada ou não é do chamador' });
      }

      const { data: conversation } = await admin
        .from('conversations')
        .select('from_user_id, to_user_id')
        .eq('id', message.conversation_id)
        .maybeSingle();

      if (!conversation) return jsonResponse({ ok: true, warning: 'conversa não encontrada' });

      const recipientId =
        conversation.from_user_id === callerId ? conversation.to_user_id : conversation.from_user_id;
      const senderName = await getProfileName(admin, callerId);

      await sendPushToUser(admin, recipientId, `Nova mensagem de ${senderName}`, '', {
        type: 'message',
        conversationId: message.conversation_id,
      });
    } else if (body.type === 'connection_accepted') {
      const { data: connection } = await admin
        .from('connections')
        .select('from_user_id, to_user_id')
        .eq('id', body.connectionId)
        .maybeSingle();

      if (!connection || connection.from_user_id !== callerId) {
        return jsonResponse({ ok: true, warning: 'conexão não encontrada ou não é do chamador' });
      }

      const accepterName = await getProfileName(admin, callerId);

      await sendPushToUser(admin, connection.to_user_id, 'Conexão aceita', `${accepterName} aceitou sua conexão.`, {
        type: 'connection_accepted',
      });
    } else if (body.type === 'connection_request') {
      const { data: request } = await admin
        .from('connection_requests')
        .select('from_user_id, to_user_id')
        .eq('id', body.requestId)
        .maybeSingle();

      if (!request || request.from_user_id !== callerId) {
        return jsonResponse({ ok: true, warning: 'solicitação não encontrada ou não é do chamador' });
      }

      const requesterName = await getProfileName(admin, callerId);

      await sendPushToUser(
        admin,
        request.to_user_id,
        'Nova solicitação de conexão',
        `${requesterName} quer se conectar com você.`,
        { type: 'connection_request' },
      );
    } else if (body.type === 'contact_request') {
      const { data: request } = await admin
        .from('contact_requests')
        .select('from_user_id, to_user_id')
        .eq('id', body.requestId)
        .maybeSingle();

      if (!request || request.from_user_id !== callerId) {
        return jsonResponse({ ok: true, warning: 'solicitação não encontrada ou não é do chamador' });
      }

      const requesterName = await getProfileName(admin, callerId);

      await sendPushToUser(
        admin,
        request.to_user_id,
        'Nova solicitação de contato',
        `${requesterName} pediu suas informações de contato.`,
        { type: 'contact_request' },
      );
    } else {
      return jsonResponse({ error: 'Tipo de notificação desconhecido' }, 400);
    }
  } catch (err) {
    console.error('push-notify: erro inesperado:', err);
    return jsonResponse({ ok: true, warning: 'falha ao enviar push, ignorado' });
  }

  return jsonResponse({ ok: true });
});
