import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useApp } from '../../src/context/AppContext';
import { useThemeColors } from '../../src/theme/ThemeContext';
import IconButton from '../../src/components/IconButton';
import {
  MESSAGE_CONTENT_MAX_LENGTH,
  fetchConversationParticipants,
  fetchMessages,
  sendMessage,
  subscribeToConversationMessages,
  type ConversationParticipants,
  type MessageRow,
} from '../../src/utils/messagesApi';

function getRouteId(id: string | string[] | undefined): string {
  if (Array.isArray(id)) return id[0] ?? '';
  return id ?? '';
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = getRouteId(params.id);
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useApp();

  const [participants, setParticipants] = useState<ConversationParticipants | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<MessageRow> | null>(null);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    let active = true;

    (async () => {
      const [participantsData, messagesData] = await Promise.all([
        fetchConversationParticipants(conversationId, user.id),
        fetchMessages(conversationId),
      ]);

      if (!active) return;
      setParticipants(participantsData);
      setMessages(messagesData);
      setLoading(false);
    })();

    const channel = subscribeToConversationMessages(conversationId, (newMessage) => {
      setMessages((current) => {
        if (current.some((m) => m.id === newMessage.id)) return current;
        return [...current, newMessage];
      });
    });

    return () => {
      active = false;
      channel.unsubscribe();
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || !user?.id || sending) return;

    setSending(true);
    const { message, error } = await sendMessage({
      conversationId,
      senderId: user.id,
      content: trimmed,
    });
    setSending(false);

    if (error || !message) {
      Alert.alert('Não foi possível enviar', error || 'Tente novamente.');
      return;
    }

    setContent('');
    setMessages((current) => {
      if (current.some((m) => m.id === message.id)) return current;
      return [...current, message];
    });
  }

  function handleLongPressMessage(message: MessageRow) {
    if (!participants || message.sender_id === user.id) return;

    Alert.alert('Mensagem', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Denunciar mensagem',
        style: 'destructive',
        onPress: () => {
          router.push(
            `/report?userId=${participants.otherUserId}&userName=${encodeURIComponent(
              participants.otherUserName,
            )}&messageId=${message.id}` as never,
          );
        },
      },
    ]);
  }

  const remaining = MESSAGE_CONTENT_MAX_LENGTH - content.length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} backgroundColor={colors.surface} />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {participants?.otherUserName || 'Conversa'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user.id;
              return (
                <Pressable
                  onLongPress={() => handleLongPressMessage(item)}
                  style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMine
                        ? { backgroundColor: colors.accent }
                        : { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: isMine ? colors.background : colors.text }]}>
                      {item.content}
                    </Text>
                    <Text
                      style={[
                        styles.bubbleTime,
                        { color: isMine ? colors.background : colors.textSoft },
                      ]}
                    >
                      {formatMessageTime(item.created_at)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Envie a primeira mensagem para começar a conversa.
              </Text>
            }
          />
        )}

        <View style={[styles.inputBar, { borderColor: colors.border }]}>
          <View style={styles.inputWrap}>
            <TextInput
              value={content}
              onChangeText={(text) => setContent(text.slice(0, MESSAGE_CONTENT_MAX_LENGTH))}
              placeholder="Escreva uma mensagem..."
              placeholderTextColor={colors.textSoft}
              multiline
              maxLength={MESSAGE_CONTENT_MAX_LENGTH}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            />
            <Text style={[styles.counter, { color: remaining < 100 ? colors.danger : colors.textSoft }]}>
              {content.length}/{MESSAGE_CONTENT_MAX_LENGTH}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: colors.accent, opacity: pressed || !content.trim() || sending ? 0.6 : 1 },
            ]}
            onPress={handleSend}
            disabled={!content.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={[styles.sendButtonText, { color: colors.background }]}>Enviar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 21 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end', fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  inputWrap: { flex: 1 },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  sendButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { fontSize: 14, fontWeight: '800' },
});
