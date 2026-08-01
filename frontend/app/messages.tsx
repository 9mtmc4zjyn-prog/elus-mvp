import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useApp } from '../src/context/AppContext';
import { useThemeColors } from '../src/theme/ThemeContext';
import IconButton from '../src/components/IconButton';
import {
  fetchConversationsInbox,
  type ConversationListItem,
} from '../src/utils/messagesApi';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function ConversationRow({
  item,
  onPress,
  colors,
}: {
  item: ConversationListItem;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const initials = (item.otherUserName || 'EL').trim().slice(0, 2).toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border },
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      {item.otherUserPhotoUrl ? (
        <Image source={{ uri: item.otherUserPhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.avatarFallbackText, { color: colors.text }]}>{initials}</Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={[styles.time, { color: colors.textSoft }]}>
            {formatRelativeTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
          {item.lastMessagePreview}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MessagesInboxScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useApp();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const rows = await fetchConversationsInbox(user.id);
    setConversations(rows);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} backgroundColor={colors.surface} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mensagens</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conversa ainda</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Quando você trocar a primeira mensagem com uma conexão aprovada, ela aparece aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              colors={colors}
              onPress={() => router.push(`/messages/${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  loader: { marginTop: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  list: { padding: 12, gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { fontSize: 16, fontWeight: '800' },
  rowInfo: { flex: 1, gap: 4 },
  rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  time: { fontSize: 12, fontWeight: '600' },
  preview: { fontSize: 13 },
  rowPressed: { opacity: 0.7 },
});
