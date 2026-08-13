import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const MESSAGE_CONTENT_MAX_LENGTH = 2000;

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
};

export type ConversationListItem = {
  id: string;
  connectionId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoUrl: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unread: boolean;
};

export type ConversationParticipants = {
  id: string;
  fromUserId: string;
  toUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoUrl: string | null;
};

/** Dados da conversa (id, outro participante) para o header da tela de chat. */
export async function fetchConversationParticipants(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationParticipants | null> {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, from_user_id, to_user_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !conversation) {
    if (error) console.error('fetchConversationParticipants:', error);
    return null;
  }

  const otherUserId =
    conversation.from_user_id === currentUserId
      ? conversation.to_user_id
      : conversation.from_user_id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, photo_url')
    .eq('id', otherUserId)
    .maybeSingle();

  return {
    id: conversation.id as string,
    fromUserId: conversation.from_user_id as string,
    toUserId: conversation.to_user_id as string,
    otherUserId,
    otherUserName: profile?.name || 'Usuário ELUS',
    otherUserPhotoUrl: profile?.photo_url ?? null,
  };
}

/**
 * Marca a conversa como lida pra quem está chamando. Usa uma function no
 * banco (mark_conversation_read, migration 024) pra gravar com now() do
 * servidor — gravar com o relógio do aparelho podia ficar atrasado em
 * relação a last_message_at e o badge de não lida nunca sumir. Falha
 * silenciosa: não deve travar a tela de chat por causa disso.
 */
export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.warn('markConversationRead:', error.message);
  }
}

function isConversationUnread(row: {
  from_user_id: string;
  to_user_id: string;
  last_message_at: string | null;
  from_user_read_at: string | null;
  to_user_read_at: string | null;
}, userId: string): boolean {
  if (!row.last_message_at) return false;

  const readAt = row.from_user_id === userId ? row.from_user_read_at : row.to_user_read_at;
  if (!readAt) return true;

  return new Date(row.last_message_at).getTime() > new Date(readAt).getTime();
}

/** Conversa com pelo menos 1 mensagem, ordenada por last_message_at desc. */
export async function fetchConversationsInbox(
  userId: string,
): Promise<ConversationListItem[]> {
  const { data: conversationRows, error } = await supabase
    .from('conversations')
    .select(
      'id, connection_id, from_user_id, to_user_id, last_message_at, from_user_read_at, to_user_read_at',
    )
    .not('last_message_at', 'is', null)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('fetchConversationsInbox:', error);
    return [];
  }

  if (!conversationRows || conversationRows.length === 0) return [];

  const otherUserIds = Array.from(
    new Set(
      conversationRows.map((c) =>
        c.from_user_id === userId ? c.to_user_id : c.from_user_id,
      ),
    ),
  );
  const conversationIds = conversationRows.map((c) => c.id);

  const [{ data: profileRows }, { data: messageRows }] = await Promise.all([
    supabase.from('profiles').select('id, name, photo_url').in('id', otherUserIds),
    supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true }),
  ]);

  const profileMap = new Map<string, { name: string; photo_url: string | null }>();
  (profileRows ?? []).forEach((p: any) => {
    profileMap.set(p.id, { name: p.name, photo_url: p.photo_url ?? null });
  });

  // Percorrendo em ordem crescente de created_at, o último valor gravado
  // por conversation_id é sempre a mensagem mais recente.
  const lastMessageMap = new Map<string, string>();
  (messageRows ?? []).forEach((m: any) => {
    lastMessageMap.set(m.conversation_id, m.content as string);
  });

  return conversationRows.map((c: any) => {
    const otherUserId = c.from_user_id === userId ? c.to_user_id : c.from_user_id;
    const profile = profileMap.get(otherUserId);

    return {
      id: c.id as string,
      connectionId: c.connection_id as string,
      otherUserId,
      otherUserName: profile?.name || 'Usuário ELUS',
      otherUserPhotoUrl: profile?.photo_url ?? null,
      lastMessageAt: c.last_message_at as string,
      lastMessagePreview: lastMessageMap.get(c.id) ?? '',
      unread: isConversationUnread(c, userId),
    };
  });
}

/** Quantas conversas têm mensagem não lida (badge no acesso a Mensagens). */
export async function fetchUnreadConversationsCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('conversations')
    .select('from_user_id, to_user_id, last_message_at, from_user_read_at, to_user_read_at')
    .not('last_message_at', 'is', null);

  if (error) {
    console.error('fetchUnreadConversationsCount:', error);
    return 0;
  }

  return (data ?? []).filter((row: any) => isConversationUnread(row, userId)).length;
}

/**
 * Encontra a conversa da connection (UNIQUE em connection_id) ou cria uma
 * nova. Trata corrida: se dois inserts concorrerem, o segundo esbarra na
 * constraint UNIQUE (23505) e a função busca a conversa que o outro criou.
 */
export async function findOrCreateConversation(input: {
  connectionId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<{ id: string } | { error: string }> {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('connection_id', input.connectionId)
    .maybeSingle();

  if (findError) {
    console.error('findOrCreateConversation (find):', findError);
    return { error: findError.message };
  }

  if (existing) return { id: existing.id as string };

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      connection_id: input.connectionId,
      from_user_id: input.fromUserId,
      to_user_id: input.toUserId,
    })
    .select('id')
    .single();

  if (created) return { id: created.id as string };

  if (createError?.code === '23505') {
    const { data: raceExisting } = await supabase
      .from('conversations')
      .select('id')
      .eq('connection_id', input.connectionId)
      .maybeSingle();

    if (raceExisting) return { id: raceExisting.id as string };
  }

  console.error('findOrCreateConversation (create):', createError);
  return { error: createError?.message || 'Não foi possível abrir a conversa.' };
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchMessages:', error);
    return [];
  }

  return (data ?? []) as MessageRow[];
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<{ message: MessageRow | null; error: string | null }> {
  const trimmed = input.content.trim();

  if (trimmed.length === 0 || trimmed.length > MESSAGE_CONTENT_MAX_LENGTH) {
    return { message: null, error: 'Mensagem inválida.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: trimmed,
    })
    .select('id, conversation_id, sender_id, content, created_at, deleted_at')
    .single();

  if (error) {
    console.error('sendMessage:', error);
    return { message: null, error: error.message };
  }

  return { message: data as MessageRow, error: null };
}

/** Novas mensagens da conversa aberta, em tempo real (Supabase Realtime). */
export function subscribeToConversationMessages(
  conversationId: string,
  onInsert: (message: MessageRow) => void,
): RealtimeChannel {
  return supabase
    .channel(`messages:conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .subscribe();
}
