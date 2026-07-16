import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Só o próprio usuário pode excluir a própria conta
    if (user_id !== authData.user.id) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Remove conexões
    await supabase
      .from('connections')
      .delete()
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`);

    // 2. Remove solicitações de conexão e de contato
    await supabase
      .from('connection_requests')
      .delete()
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`);

    await supabase
      .from('contact_requests')
      .delete()
      .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`);

    // 3. Remove bloqueios
    await supabase
      .from('blocked_users')
      .delete()
      .or(`blocker_id.eq.${user_id},blocked_id.eq.${user_id}`);

    // 4. Remove denúncias (reporter ou reported — reports não tem ON DELETE CASCADE)
    await supabase
      .from('reports')
      .delete()
      .or(`reporter_id.eq.${user_id},reported_id.eq.${user_id}`);

    // 5. Remove arquivos de verificação do Storage (paths reais no banco)
    const { data: verificationRows } = await supabase
      .from('verifications')
      .select(
        'selfie_storage_path, document_storage_path, selfie_with_document_storage_path'
      )
      .eq('user_id', user_id);

    if (verificationRows && verificationRows.length > 0) {
      const paths = verificationRows
        .flatMap((row) => [
          row.selfie_storage_path,
          row.document_storage_path,
          row.selfie_with_document_storage_path,
        ])
        .filter((path): path is string => Boolean(path && path.length > 0));

      if (paths.length > 0) {
        await supabase.storage.from('verification-files').remove(paths);
      }
    }

    // 6. Remove registros de verificação
    await supabase.from('verifications').delete().eq('user_id', user_id);

    // 7. Remove avatar do Storage
    const { data: profile } = await supabase
      .from('profiles')
      .select('photo_url')
      .eq('id', user_id)
      .maybeSingle();

    if (profile?.photo_url) {
      await supabase.storage.from('avatars').remove([`${user_id}/avatar.jpg`]);
    }

    // 8. Remove o perfil
    await supabase.from('profiles').delete().eq('id', user_id);

    // 9. Remove de public.users (cascata cobre companies etc.)
    await supabase.from('users').delete().eq('id', user_id);

    // 10. Remove o auth user (último passo)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      throw new Error(`Erro ao deletar auth: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Conta e dados removidos com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
