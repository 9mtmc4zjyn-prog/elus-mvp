import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const DIDIT_SESSION_ENDPOINT = 'https://verification.didit.me/v3/session/';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ error: 'Não autenticado' }, 401);
    }

    // Client autenticado como o PRÓPRIO usuário (não service_role) — as
    // operações abaixo em `verifications` respeitam a RLS normalmente.
    // As policies user_insert_own_verification / user_update_own_verification
    // já permitem upsert com status='pending' (só bloqueiam status='verified'),
    // então não precisamos elevar privilégio aqui.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ error: 'Sessão inválida' }, 401);
    }

    const userId = authData.user.id;

    // Passo 2: upsert em verifications — status='pending', method='didit'.
    // Mesmo onConflict usado hoje no fluxo manual (verification.tsx), já que
    // verifications_user_id_key é UNIQUE(user_id) (documentado na migration 020).
    const { error: upsertError } = await supabase.from('verifications').upsert(
      {
        user_id: userId,
        status: 'pending',
        verification_method: 'didit',
      },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      console.error('create-didit-session: erro no upsert:', upsertError);
      return jsonResponse({ error: upsertError.message }, 500);
    }

    const diditApiKey = Deno.env.get('DIDIT_API_KEY');
    const diditWorkflowId = Deno.env.get('DIDIT_WORKFLOW_ID');
    // Callback ainda "a definir" (Fase 4 decide o mecanismo de retorno pro
    // app — deep link vs. WebView). Lido de env var pra poder mudar sem
    // precisar reimplantar a function.
    const diditCallbackUrl = Deno.env.get('DIDIT_CALLBACK_URL') || '';

    if (!diditApiKey || !diditWorkflowId) {
      // Esperado até o Cleber configurar as secrets reais da Didit.
      return jsonResponse(
        { error: 'Verificação instantânea ainda não configurada no servidor.' },
        500
      );
    }

    // Passo 3: cria a sessão na Didit.
    let diditResponse: Response;

    try {
      diditResponse = await fetch(DIDIT_SESSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': diditApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: diditWorkflowId,
          vendor_data: userId,
          callback: diditCallbackUrl,
        }),
      });
    } catch (fetchError) {
      console.error('create-didit-session: erro de rede ao chamar Didit:', fetchError);
      return jsonResponse(
        { error: 'Não foi possível iniciar a verificação instantânea. Tente novamente.' },
        502
      );
    }

    if (!diditResponse.ok) {
      const body = await diditResponse.text();
      console.error('create-didit-session: Didit respondeu com erro:', diditResponse.status, body);
      return jsonResponse(
        { error: 'Não foi possível iniciar a verificação instantânea. Tente novamente.' },
        502
      );
    }

    const diditData = (await diditResponse.json()) as {
      url?: string;
      session_id?: string;
      id?: string;
    };

    // Nomes de campo confirmados contra a documentação oficial da Didit
    // (2026-08): `url` e `session_id` na resposta de POST /v3/session/.
    const sessionUrl = diditData?.url;
    const sessionId = diditData?.session_id ?? diditData?.id ?? null;

    if (!sessionUrl) {
      console.error('create-didit-session: resposta da Didit sem url:', JSON.stringify(diditData));
      return jsonResponse({ error: 'Resposta inesperada do serviço de verificação.' }, 502);
    }

    // Guarda o session_id assim que soubermos dele — best-effort, não bloqueia
    // a resposta ao client se falhar (a url da sessão já foi obtida com sucesso).
    if (sessionId) {
      const { error: sessionIdError } = await supabase
        .from('verifications')
        .update({ didit_session_id: String(sessionId) })
        .eq('user_id', userId);

      if (sessionIdError) {
        console.warn('create-didit-session: falha ao salvar didit_session_id:', sessionIdError);
      }
    }

    return jsonResponse({ url: sessionUrl, session_id: sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('create-didit-session error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
