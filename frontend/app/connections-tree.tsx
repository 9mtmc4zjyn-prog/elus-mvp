import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/context/AppContext';
import { useTheme, useThemeColors } from '../src/theme/ThemeContext';

type AnyUser = {
  id?: string | number;
  _id?: string | number;
  userId?: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatar?: string;
};

type AnyConnection = {
  id?: string | number;
  _id?: string | number;

  fromUserId?: string | number;
  toUserId?: string | number;

  sourceUserId?: string | number;
  targetUserId?: string | number;

  userId?: string | number;
  otherUserId?: string | number;
  connectedUserId?: string | number;

  senderId?: string | number;
  receiverId?: string | number;

  from?: any;
  to?: any;
  user?: any;
  otherUser?: any;
  connectedUser?: any;

  kind?: string;
  type?: string;
  relationship?: string;
  label?: string;
  strength?: number;
};

type TreeItem = {
  id: string;
  name: string;
  subtitle: string;
  initial: string;
  color: string;
  connectionLabel: string;
};

const COLORS = {
  panelDeep: '#080D16',
  cyan: '#5E9EAB',
  cyanSoft: 'rgba(94,158,171,0.15)',
  blue: '#5E9EAB',
  gold: '#C49A45',
  goldSoft: 'rgba(196,154,69,0.12)',
  green: '#4A9A65',
  purple: '#8B7EA8',
  purpleSoft: 'rgba(139,126,168,0.12)',
  orange: '#B87A5C',
};

const graphPositions = [
  { top: 34, left: 44 },
  { top: 54, right: 44 },
  { top: 160, left: 28 },
  { top: 178, right: 30 },
  { top: 104, left: 132 },
  { top: 226, left: 138 },
];

function getRawId(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value.id !== undefined) return String(value.id);
  if (value._id !== undefined) return String(value._id);
  if (value.userId !== undefined) return String(value.userId);

  return null;
}

function getUserId(user: AnyUser | null | undefined): string | null {
  if (!user) return null;

  if (user.id !== undefined) return String(user.id);
  if (user._id !== undefined) return String(user._id);
  if (user.userId !== undefined) return String(user.userId);

  return null;
}

function getUserName(user: AnyUser | null | undefined): string {
  if (!user) return 'Conexão';

  return (
    user.name ||
    user.fullName ||
    user.username ||
    user.email ||
    'Conexão'
  );
}

function getConnectionLabel(connection: AnyConnection): string {
  return (
    connection.kind ||
    connection.type ||
    connection.relationship ||
    connection.label ||
    'Conexão'
  );
}

function getOtherUserId(
  connection: AnyConnection,
  currentUserId: string | null
): string | null {
  const fromId =
    getRawId(connection.fromUserId) ||
    getRawId(connection.sourceUserId) ||
    getRawId(connection.senderId) ||
    getRawId(connection.from);

  const toId =
    getRawId(connection.toUserId) ||
    getRawId(connection.targetUserId) ||
    getRawId(connection.receiverId) ||
    getRawId(connection.to);

  const directOtherId =
    getRawId(connection.otherUserId) ||
    getRawId(connection.connectedUserId) ||
    getRawId(connection.otherUser) ||
    getRawId(connection.connectedUser);

  if (directOtherId) {
    return directOtherId;
  }

  if (currentUserId && fromId === currentUserId && toId) {
    return toId;
  }

  if (currentUserId && toId === currentUserId && fromId) {
    return fromId;
  }

  return toId || fromId || getRawId(connection.userId) || null;
}

function getConnectionColor(index: number): string {
  const palette = [
    COLORS.blue,
    COLORS.purple,
    COLORS.gold,
    COLORS.cyan,
    COLORS.green,
    COLORS.orange,
  ];

  return palette[index % palette.length];
}

function getConnectionIcon(label: string): keyof typeof Ionicons.glyphMap {
  const normalizedLabel = label.toLowerCase();

  if (
    normalizedLabel.includes('family') ||
    normalizedLabel.includes('família') ||
    normalizedLabel.includes('familia')
  ) {
    return 'people-outline';
  }

  if (
    normalizedLabel.includes('service') ||
    normalizedLabel.includes('serviço') ||
    normalizedLabel.includes('servico')
  ) {
    return 'construct-outline';
  }

  if (
    normalizedLabel.includes('company') ||
    normalizedLabel.includes('empresa') ||
    normalizedLabel.includes('professional') ||
    normalizedLabel.includes('profissional')
  ) {
    return 'business-outline';
  }

  if (
    normalizedLabel.includes('interest') ||
    normalizedLabel.includes('interesse')
  ) {
    return 'sparkles-outline';
  }

  return 'git-network-outline';
}

function GraphNode({
  item,
  index,
}: {
  item: TreeItem;
  index: number;
}) {
  const position = graphPositions[index] ?? graphPositions[0];
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.graphNode,
        position,
        {
          borderColor: `${item.color}AA`,
          backgroundColor: `${item.color}18`,
        },
      ]}
    >
      <View
        style={[
          styles.graphNodeInner,
          {
            backgroundColor: item.color,
          },
        ]}
      >
        <Text style={[styles.graphNodeText, { color: colors.text }]}>{item.initial}</Text>
      </View>
    </View>
  );
}

function ConnectionCard({
  item,
  index,
}: {
  item: TreeItem;
  index: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.connectionCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={styles.connectionLineBox}>
        <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />
        <View style={[styles.smallDot, { backgroundColor: item.color }]} />
      </View>

      <View
        style={[
          styles.avatar,
          {
            borderColor: `${item.color}99`,
            backgroundColor: `${item.color}18`,
          },
        ]}
      >
        <View style={[styles.avatarCore, { backgroundColor: item.color }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>{item.initial}</Text>
        </View>
      </View>

      <View style={styles.connectionContent}>
        <Text style={[styles.connectionName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={[styles.connectionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {item.subtitle}
        </Text>

        <View
          style={[
            styles.badge,
            {
              borderColor: `${item.color}55`,
              backgroundColor: `${item.color}12`,
            },
          ]}
        >
          <Ionicons
            name={getConnectionIcon(item.connectionLabel)}
            size={14}
            color={item.color}
          />
          <Text style={[styles.badgeText, { color: item.color }]}>
            {item.connectionLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.positionNumber, { color: colors.textMuted }]}>{index + 1}</Text>
    </View>
  );
}

export default function ConnectionsTreeScreen() {
  const router = useRouter();
  const app = useApp() as any;
  const colors = useThemeColors();

  const currentUser = app?.user ?? null;
  const users: AnyUser[] = Array.isArray(app?.users) ? app.users : [];
  const connections: AnyConnection[] = Array.isArray(app?.connections)
    ? app.connections
    : [];

  const currentUserId = getUserId(currentUser);
  const currentUserName = getUserName(currentUser);

  const userMap = useMemo(() => {
    const map = new Map<string, AnyUser>();

    users.forEach((item) => {
      const id = getUserId(item);

      if (id) {
        map.set(id, item);
      }
    });

    return map;
  }, [users]);

  const treeItems = useMemo<TreeItem[]>(() => {
    const filteredConnections = currentUserId
      ? connections.filter((connection) => {
          const possibleIds = [
            getRawId(connection.fromUserId),
            getRawId(connection.toUserId),
            getRawId(connection.sourceUserId),
            getRawId(connection.targetUserId),
            getRawId(connection.senderId),
            getRawId(connection.receiverId),
            getRawId(connection.userId),
            getRawId(connection.otherUserId),
            getRawId(connection.connectedUserId),
            getRawId(connection.from),
            getRawId(connection.to),
            getRawId(connection.user),
            getRawId(connection.otherUser),
            getRawId(connection.connectedUser),
          ];

          return possibleIds.includes(currentUserId);
        })
      : connections;

    const listToUse =
      filteredConnections.length > 0 ? filteredConnections : connections;

    return listToUse.slice(0, 20).map((connection, index) => {
      const otherUserId = getOtherUserId(connection, currentUserId);
      const otherUser =
        connection.otherUser ||
        connection.connectedUser ||
        connection.user ||
        (otherUserId ? userMap.get(otherUserId) : null);

      const name = getUserName(otherUser);
      const connectionLabel = getConnectionLabel(connection);

      return {
        id: String(connection.id || connection._id || `${name}-${index}`),
        name,
        subtitle: `Tipo: ${connectionLabel}`,
        initial: name.charAt(0).toUpperCase(),
        color: getConnectionColor(index),
        connectionLabel,
      };
    });
  }, [connections, currentUserId, userMap]);

  const visibleGraphItems = treeItems.slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerEyebrow}>ELUS</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Árvore de conexões</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Mapa vivo da sua rede ELUS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { borderColor: colors.borderStrong }]}>
          <View style={styles.glowCyan} />
          <View style={styles.glowPurple} />

          <View style={[styles.ringOuter, { borderColor: colors.border }]} />
          <View style={styles.ringMiddle} />
          <View style={styles.ringInner} />

          <View style={[styles.axisVertical, { backgroundColor: colors.surfaceSoft }]} />
          <View style={[styles.axisHorizontal, { backgroundColor: colors.surfaceSoft }]} />

          {visibleGraphItems.map((item, index) => (
            <GraphNode key={`graph-${item.id}`} item={item} index={index} />
          ))}

          <View style={styles.centerNode}>
            <View style={styles.mainAvatar}>
              <Text style={[styles.mainAvatarText, { color: colors.text }]}>
                {currentUserName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.mainName, { color: colors.text }]} numberOfLines={1}>
              {currentUserName}
            </Text>
            <Text style={[styles.mainLabel, { color: colors.textMuted }]}>Você no centro da rede</Text>
          </View>

          <View style={[styles.statsRow, { borderColor: colors.borderStrong }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{treeItems.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Conexões</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderStrong }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{users.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pessoas</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderStrong }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{connections.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Vínculos</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Rede próxima</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conexões próximas</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Relações encontradas no contexto do app.
          </Text>
        </View>

        {treeItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <Ionicons name="git-network-outline" size={46} color={COLORS.cyan} />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conexão encontrada</Text>

            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Quando você adicionar pessoas e vínculos, elas aparecerão aqui na
              sua árvore de conexões.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {treeItems.map((item, index) => (
              <ConnectionCard key={item.id} item={item} index={index} />
            ))}
          </View>
        )}

        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="sparkles-outline" size={22} color={COLORS.gold} />
          </View>

          <View style={styles.tipTextBox}>
            <Text style={styles.tipEyebrow}>IA ELUS</Text>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Rede contextual</Text>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>
              A árvore mostra vínculos e proximidades para ajudar você a entender
              quem está conectado ao seu campo.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },

  headerTextBox: {
    flex: 1,
  },

  headerEyebrow: {
    color: COLORS.cyan,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  headerTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '350',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  heroCard: {
    height: 430,
    backgroundColor: COLORS.panelDeep,
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  glowCyan: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: COLORS.cyanSoft,
    top: -80,
    right: -72,
  },

  glowPurple: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.purpleSoft,
    bottom: -95,
    left: -85,
  },

  ringOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    top: 48,
    left: 32,
  },

  ringMiddle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.16)',
    top: 88,
    left: 72,
  },

  ringInner: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(139,92,255,0.24)',
    top: 134,
    left: 118,
  },

  axisVertical: {
    position: 'absolute',
    width: 1,
    height: 280,
    top: 60,
    left: '50%',
  },

  axisHorizontal: {
    position: 'absolute',
    height: 1,
    width: 280,
    left: 42,
    top: 198,
  },

  graphNode: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  graphNodeInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  graphNodeText: {
    fontSize: 17,
    fontWeight: '900',
  },

  centerNode: {
    position: 'absolute',
    top: 126,
    left: 94,
    right: 94,
    alignItems: 'center',
  },

  mainAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.gold,
  },

  mainAvatarText: {
    fontSize: 38,
    fontWeight: '900',
  },

  mainName: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },

  mainLabel: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'center',
  },

  statsRow: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5,7,13,0.82)',
    borderRadius: 22,
    paddingVertical: 15,
    borderWidth: 1,
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },

  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    height: 34,
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '350',
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  emptyCard: {
    borderRadius: 25,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    textAlign: 'center',
  },

  list: {
    gap: 14,
  },

  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    padding: 15,
    borderWidth: 1,
    position: 'relative',
  },

  connectionLineBox: {
    width: 18,
    alignItems: 'center',
    marginRight: 10,
  },

  line: {
    position: 'absolute',
    width: 2,
    height: 76,
  },

  smallDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 32,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  avatarCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 20,
    fontWeight: '900',
  },

  connectionContent: {
    flex: 1,
    minWidth: 0,
  },

  connectionName: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },

  connectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '800',
  },

  positionNumber: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 10,
  },

  tipCard: {
    marginTop: 24,
    flexDirection: 'row',
    backgroundColor: COLORS.goldSoft,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.28)',
  },

  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242,169,59,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  tipEyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  tipTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },

  tipText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
});


