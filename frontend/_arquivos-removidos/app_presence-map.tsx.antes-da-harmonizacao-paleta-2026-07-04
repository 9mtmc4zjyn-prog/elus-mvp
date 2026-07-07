import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useApp, type AppUser } from '../src/context/AppContext';
import { appUserToProfile } from '../src/utils/adaptSupabaseProfile';
import type { Profile } from '../src/data/profiles';

const ELUS_LOGO = require('../assets/images/elus-logo.png');
const ELUS_SYMBOL = require('../assets/images/elus-symbol-cyan-purple.png');
const ELUS_UNVERIFIED = require('../assets/images/elus-unverified-red.png');
const ELUS_VERIFIED_GREEN = require('../assets/images/elus-verified-green.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  background: '#03050A',
  mapBase: '#060A13',
  panel: 'rgba(8,12,22,0.82)',
  panelStrong: 'rgba(8,12,22,0.94)',
  panelSoft: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.10)',
  borderSoft: 'rgba(255,255,255,0.065)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.64)',
  mutedSoft: 'rgba(255,255,255,0.42)',
  cyan: '#22D3EE',
  cyanSoft: 'rgba(34,211,238,0.12)',
  green: '#36D399',
  gold: '#D9B46A',
  goldSoft: 'rgba(217,180,106,0.12)',
  blueLight: '#9DBBFF',
  blueSoft: 'rgba(157,187,255,0.13)',
  purple: '#A855F7',
  purpleSoft: 'rgba(168,85,247,0.10)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255,107,107,0.12)',
};

type FilterKey = 'all' | 'people' | 'business' | 'services' | 'groups';

type PresenceKind = 'person' | 'business' | 'service' | 'group';

type IdentityPhase = 'verified' | 'in_review' | 'unverified';

type PresenceNode = {
  profile: Profile;
  x: number;
  y: number;
  kind: PresenceKind;
  phase: IdentityPhase;
};

const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT * 0.53;

const NODE_LAYOUT = [
  { x: CENTER_X - 114, y: CENTER_Y - 122 },
  { x: CENTER_X + 118, y: CENTER_Y - 112 },
  { x: CENTER_X - 82, y: CENTER_Y + 118 },
  { x: CENTER_X + 128, y: CENTER_Y + 92 },
  { x: CENTER_X - 4, y: CENTER_Y - 38 },
  { x: CENTER_X + 22, y: CENTER_Y + 166 },
];

const FILTERS: {
  key: FilterKey;
  label: string;
  color: string;
}[] = [
  { key: 'all', label: 'Todos', color: COLORS.cyan },
  { key: 'people', label: 'Pessoas', color: COLORS.cyan },
  { key: 'business', label: 'Empresas', color: COLORS.gold },
  { key: 'services', label: 'Serviços', color: COLORS.blueLight },
  { key: 'groups', label: 'Grupos', color: COLORS.purple },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCurrentUserIdentityPhase(user?: AppUser | null): IdentityPhase {
  const status = normalizeText(String(user?.verificationStatus ?? ''));

  const verifiedStatuses = ['verified', 'verificado', 'approved', 'aprovado'];

  const inReviewStatuses = [
    'in_review',
    'review',
    'under_review',
    'awaiting',
    'awaiting_review',
    'aguardando',
    'aguardando_verificacao',
    'aguardando_verificação',
    'em_analise',
    'em_análise',
    'analysis_submitted',
    'submitted',
    'document_submitted',
    'documento_enviado',
    'doc_sent',
    'pending',
    'pendente',
  ];

  const unverifiedStatuses = [
    '',
    'none',
    'unverified',
    'not_verified',
    'nao_verificado',
    'não_verificado',
    'verification_pending',
    'verificacao_pendente',
    'verificação_pendente',
    'rejected',
    'recusado',
  ];

  if (inReviewStatuses.includes(status)) {
    return 'in_review';
  }

  if (verifiedStatuses.includes(status)) {
    return 'verified';
  }

  if (unverifiedStatuses.includes(status)) {
    return 'unverified';
  }

  if (user?.verified === true) {
    return 'verified';
  }

  return 'unverified';
}

function getIdentityPhase(profile: Profile): IdentityPhase {
  const status = normalizeText(
    String((profile as any).verificationStatus ?? profile.status ?? '')
  );

  if (
    status === 'verified' ||
    status === 'verificado' ||
    status === 'approved' ||
    status === 'aprovado' ||
    status === 'official_protected' ||
    status === 'perfil_oficial_protegido' ||
    status === 'oficial_protegido'
  ) {
    return 'verified';
  }

  if (
    status === 'in_review' ||
    status === 'pending' ||
    status === 'review' ||
    status === 'awaiting' ||
    status === 'aguardando' ||
    status === 'aguardando_verificacao' ||
    status === 'em_analise'
  ) {
    return 'in_review';
  }

  return 'unverified';
}

function shouldProtectTargetIdentityPhase({
  currentUserPhase,
  targetPhase,
}: {
  currentUserPhase: IdentityPhase;
  targetPhase: IdentityPhase;
}) {
  return currentUserPhase !== 'verified' && targetPhase === 'verified';
}

function getVisibleIdentityPhase({
  currentUserPhase,
  targetPhase,
}: {
  currentUserPhase: IdentityPhase;
  targetPhase: IdentityPhase;
}): IdentityPhase {
  if (
    shouldProtectTargetIdentityPhase({
      currentUserPhase,
      targetPhase,
    })
  ) {
    return 'in_review';
  }

  return targetPhase;
}

function getVisibleTooltipPhaseLabel({
  currentUserPhase,
  targetPhase,
}: {
  currentUserPhase: IdentityPhase;
  targetPhase: IdentityPhase;
}) {
  if (
    shouldProtectTargetIdentityPhase({
      currentUserPhase,
      targetPhase,
    })
  ) {
    return 'perfil protegido';
  }

  if (targetPhase === 'verified') {
    return 'verificado';
  }

  if (targetPhase === 'in_review') {
    return 'em análise';
  }

  return 'não verificado';
}

function getPresenceKind(profile: Profile): PresenceKind {
  const text = normalizeText(
    [
      profile.kind,
      profile.role,
      profile.area,
      profile.purpose,
      profile.bio,
      ...(profile.interests ?? []),
    ].join(' ')
  );

  if (profile.kind === 'Grupo') {
    return 'group';
  }

  if (profile.kind === 'Empresa') {
    return 'business';
  }

  if (
    text.includes('servico') ||
    text.includes('servicos') ||
    text.includes('prestador') ||
    text.includes('atendimento') ||
    text.includes('manutencao')
  ) {
    return 'service';
  }

  return 'person';
}

function getKindLabel(kind: PresenceKind) {
  if (kind === 'business') {
    return 'Empresa';
  }

  if (kind === 'service') {
    return 'Serviço';
  }

  if (kind === 'group') {
    return 'Grupo';
  }

  return 'Pessoa';
}

function getKindColor(kind: PresenceKind) {
  if (kind === 'business') {
    return COLORS.gold;
  }

  if (kind === 'service') {
    return COLORS.blueLight;
  }

  if (kind === 'group') {
    return COLORS.purple;
  }

  return COLORS.cyan;
}

function getPhaseColor(phase: IdentityPhase) {
  if (phase === 'verified') {
    return COLORS.green;
  }

  if (phase === 'in_review') {
    return COLORS.blueLight;
  }

  return COLORS.danger;
}

function getStatusImage(phase: IdentityPhase): ImageSourcePropType {
  if (phase === 'verified') {
    return ELUS_VERIFIED_GREEN;
  }

  if (phase === 'in_review') {
    return ELUS_SYMBOL;
  }

  return ELUS_UNVERIFIED;
}

function getPublicName(profile: Profile) {
  if (profile.kind === 'Pessoa') {
    return profile.firstName || profile.name.split(' ')[0] || profile.name;
  }

  return profile.name;
}

function getShortName(profile: Profile) {
  const name = getPublicName(profile);

  if (name.length <= 10) {
    return name;
  }

  return `${name.slice(0, 9)}…`;
}

function filterMatchesKind(kind: PresenceKind, filter: FilterKey) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'people') {
    return kind === 'person';
  }

  if (filter === 'business') {
    return kind === 'business';
  }

  if (filter === 'services') {
    return kind === 'service';
  }

  if (filter === 'groups') {
    return kind === 'group';
  }

  return true;
}

function ConnectionLine({
  node,
  zoomScale,
}: {
  node: PresenceNode;
  zoomScale: number;
}) {
  const dx = node.x - CENTER_X;
  const dy = node.y - CENTER_Y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const color = getKindColor(node.kind);

  if (zoomScale < 0.72) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.connectionLine,
        {
          width: length,
          left: CENTER_X,
          top: CENTER_Y,
          borderColor: `${color}33`,
          transform: [{ rotate: `${angle}rad` }],
        },
      ]}
    />
  );
}

function PresenceNodeView({
  node,
  selected,
  onPress,
  zoomScale,
  currentUserPhase,
}: {
  node: PresenceNode;
  selected: boolean;
  onPress: () => void;
  zoomScale: number;
  currentUserPhase: IdentityPhase;
}) {
  const kindColor = getKindColor(node.kind);
  const visiblePhase = getVisibleIdentityPhase({
    currentUserPhase,
    targetPhase: node.phase,
  });
  const phaseColor = getPhaseColor(visiblePhase);
  const showLabel = zoomScale >= 0.72;
  const useStatusSymbol = visiblePhase !== 'verified';
  const borderColor = useStatusSymbol ? phaseColor : kindColor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.nodeWrap,
        {
          left: node.x,
          top: node.y,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.nodeHalo,
          selected
            ? {
                borderColor: `${borderColor}88`,
                backgroundColor: `${borderColor}16`,
              }
            : {
                borderColor: `${borderColor}38`,
                backgroundColor: `${borderColor}08`,
              },
        ]}
      >
        <View
          style={[
            styles.nodeAvatar,
            {
              borderColor: `${borderColor}CC`,
            },
          ]}
        >
          {useStatusSymbol ? (
            <Image
              source={getStatusImage(visiblePhase)}
              style={styles.nodeSymbol}
              resizeMode="contain"
            />
          ) : node.profile.photoUrl ? (
            <Image
              source={{ uri: node.profile.photoUrl }}
              style={styles.nodePhoto}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={getStatusImage(visiblePhase)}
              style={styles.nodeSymbol}
              resizeMode="contain"
            />
          )}
        </View>
      </View>

      {showLabel ? (
        <View
          style={[
            styles.nodeLabel,
            {
              borderColor: `${borderColor}42`,
              backgroundColor: selected
                ? `${borderColor}20`
                : 'rgba(3,5,10,0.82)',
            },
          ]}
        >
          <Text
            style={[
              styles.nodeLabelText,
              {
                color: useStatusSymbol ? phaseColor : COLORS.text,
              },
            ]}
            numberOfLines={1}
          >
            {getShortName(node.profile)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function CenterNode() {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.centerNode,
        {
          left: CENTER_X,
          top: CENTER_Y,
        },
      ]}
    >
      <View style={styles.centerPulseOuter} />
      <View style={styles.centerPulseInner} />

      <View style={styles.centerAvatar}>
        <Image source={ELUS_SYMBOL} style={styles.centerSymbol} resizeMode="contain" />
      </View>

      <View style={styles.centerLabel}>
        <Text style={styles.centerLabelText}>Você</Text>
      </View>
    </View>
  );
}

export default function PresenceMapScreen() {
  const { user, realUsers } = useApp() as any;
  const currentUserPhase = getCurrentUserIdentityPhase(user);

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [zoomScale, setZoomScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const panStartRef = useRef({ x: 0, y: 0 });
  const zoomStartRef = useRef(1);

  const nodes = useMemo<PresenceNode[]>(() => {
    const profiles = (realUsers as AppUser[])
      .map(appUserToProfile)
      .slice(0, NODE_LAYOUT.length);

    return profiles.map((profile, index) => {
      const fallbackPosition = NODE_LAYOUT[index] ?? {
        x: CENTER_X,
        y: CENTER_Y,
      };

      return {
        profile,
        x: fallbackPosition.x,
        y: fallbackPosition.y,
        kind: getPresenceKind(profile),
        phase: getIdentityPhase(profile),
      };
    });
  }, [realUsers]);

  const filteredNodes = useMemo(() => {
    const query = normalizeText(searchText);

    return nodes.filter((node) => {
      const matchesFilter = filterMatchesKind(node.kind, activeFilter);

      const searchable = normalizeText(
        [
          node.profile.name,
          node.profile.firstName,
          node.profile.kind,
          node.profile.role,
          node.profile.area,
          node.profile.city,
          node.profile.state,
          node.profile.purpose,
          ...(node.profile.interests ?? []),
        ].join(' ')
      );

      const matchesSearch = query.length === 0 || searchable.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, nodes, searchText]);

  const selectedNode =
    filteredNodes.find((node) => node.profile.id === selectedNodeId) ?? null;

  const selectedNodePhaseLabel = selectedNode
    ? getVisibleTooltipPhaseLabel({
        currentUserPhase,
        targetPhase: selectedNode.phase,
      })
    : '';

  const typeCounters = useMemo(() => {
    return {
      people: nodes.filter((node) => node.kind === 'person').length,
      business: nodes.filter((node) => node.kind === 'business').length,
      services: nodes.filter((node) => node.kind === 'service').length,
      groups: nodes.filter((node) => node.kind === 'group').length,
    };
  }, [nodes]);

  const visibleCount = filteredNodes.length;

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      panStartRef.current = offset;
    })
    .onUpdate((event) => {
      setOffset({
        x: clamp(panStartRef.current.x + event.translationX, -260, 260),
        y: clamp(panStartRef.current.y + event.translationY, -260, 260),
      });
    });

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      zoomStartRef.current = zoomScale;
    })
    .onUpdate((event) => {
      setZoomScale(clamp(zoomStartRef.current * event.scale, 0.65, 1.85));
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  function zoomIn() {
    setZoomScale((current) => clamp(current + 0.15, 0.65, 1.85));
  }

  function zoomOut() {
    setZoomScale((current) => clamp(current - 0.15, 0.65, 1.85));
  }

  function resetView() {
    setOffset({ x: 0, y: 0 });
    setZoomScale(1);
    setSelectedNodeId(null);
  }

  function selectNode(node: PresenceNode) {
    setSelectedNodeId((current) =>
      current === node.profile.id ? null : node.profile.id
    );
  }

  function openSelectedProfile() {
    if (!selectedNode) {
      return;
    }

    router.push(`/profile/${selectedNode.profile.id}` as never);
  }

  function goBack() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.screen}>
        <View style={styles.gridLayer}>
          {Array.from({ length: 12 }).map((_, index) => (
            <View
              key={`v-${index}`}
              style={[
                styles.gridLineVertical,
                {
                  left: `${index * 10}%`,
                },
              ]}
            />
          ))}

          {Array.from({ length: 14 }).map((_, index) => (
            <View
              key={`h-${index}`}
              style={[
                styles.gridLineHorizontal,
                {
                  top: `${index * 8}%`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.softGlowTopRight} />
        <View style={styles.softGlowBottomLeft} />

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={goBack}
          >
            <Ionicons name="chevron-back" size={25} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Image source={ELUS_LOGO} style={styles.headerLogo} resizeMode="contain" />
            <Text style={styles.headerSub}>Campo de Presença</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.searchArea}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.mutedSoft} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar pessoas, empresas, serviços ou regiões aproximadas"
              placeholderTextColor={COLORS.mutedSoft}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {searchText.length > 0 ? (
              <Pressable onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.mutedSoft} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.key;

              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={[
                    styles.filterChip,
                    active
                      ? {
                          borderColor: `${filter.color}88`,
                          backgroundColor: `${filter.color}18`,
                        }
                      : null,
                  ]}
                >
                  <View
                    style={[
                      styles.filterDot,
                      {
                        backgroundColor: filter.color,
                        opacity: active ? 1 : 0.55,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.filterText,
                      active
                        ? {
                            color: filter.color,
                          }
                        : null,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <GestureDetector gesture={composedGesture}>
          <View style={styles.mapTouchArea}>
            <View
              style={[
                styles.mapCanvas,
                {
                  transform: [
                    { translateX: offset.x },
                    { translateY: offset.y },
                    { scale: zoomScale },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.sonarRing,
                  styles.sonarRingOuter,
                  {
                    left: CENTER_X - 210,
                    top: CENTER_Y - 210,
                  },
                ]}
              />

              <View
                style={[
                  styles.sonarRing,
                  styles.sonarRingMiddle,
                  {
                    left: CENTER_X - 145,
                    top: CENTER_Y - 145,
                  },
                ]}
              />

              <View
                style={[
                  styles.sonarRing,
                  styles.sonarRingInner,
                  {
                    left: CENTER_X - 78,
                    top: CENTER_Y - 78,
                  },
                ]}
              />

              <View
                style={[
                  styles.regionShapeOne,
                  {
                    left: CENTER_X + 32,
                    top: CENTER_Y - 246,
                  },
                ]}
              />

              <View
                style={[
                  styles.regionShapeTwo,
                  {
                    left: CENTER_X - 330,
                    top: CENTER_Y + 118,
                  },
                ]}
              />

              {filteredNodes.map((node) => (
                <ConnectionLine
                  key={`line-${node.profile.id}`}
                  node={node}
                  zoomScale={zoomScale}
                />
              ))}

              <CenterNode />

              {filteredNodes.map((node) => (
                <PresenceNodeView
                  key={node.profile.id}
                  node={node}
                  selected={selectedNodeId === node.profile.id}
                  onPress={() => selectNode(node)}
                  zoomScale={zoomScale}
                  currentUserPhase={currentUserPhase}
                />
              ))}
            </View>
          </View>
        </GestureDetector>

        <View style={styles.zoomControl}>
          <Pressable
            style={({ pressed }) => [
              styles.zoomButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={zoomIn}
          >
            <Ionicons name="add" size={24} color={COLORS.text} />
          </Pressable>

          <View style={styles.zoomValueBox}>
            <Text style={styles.zoomValueText}>{zoomScale.toFixed(1)}x</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.zoomButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={zoomOut}
          >
            <Ionicons name="remove" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.regionBadge}>
          <View>
            <Text style={styles.regionKicker}>Região aproximada</Text>
            <Text style={styles.regionTitle}>Itamarandiba · MG</Text>
          </View>

          <View style={styles.regionCount}>
            <Text style={styles.regionCountText}>{visibleCount}</Text>
          </View>
        </View>

        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed-outline" size={14} color={COLORS.gold} />
          <Text style={styles.securityNoticeText}>
            O Campo mostra sinais aproximados por região. Conexões reais exigem identidade verificada e aprovação explícita.
          </Text>
        </View>

        {selectedNode ? (
          <View style={styles.tooltip}>
            <View style={styles.tooltipTop}>
              <View
                style={[
                  styles.tooltipDot,
                  {
                    backgroundColor: getKindColor(selectedNode.kind),
                  },
                ]}
              />

              <View style={styles.tooltipInfo}>
                <Text style={styles.tooltipName} numberOfLines={1}>
                  {getPublicName(selectedNode.profile)}
                </Text>

                <Text style={styles.tooltipMeta}>
                  {getKindLabel(selectedNode.kind)} · {selectedNodePhaseLabel} · sinal aproximado
                </Text>
              </View>

              <Pressable onPress={() => setSelectedNodeId(null)}>
                <Ionicons name="close" size={18} color={COLORS.muted} />
              </Pressable>
            </View>

            <Pressable style={styles.connectButton} onPress={openSelectedProfile}>
              <Text style={styles.connectButtonText}>Ver perfil restrito</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.bottomBar}>
          <ScrollView
            style={styles.bottomStatsScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomStats}
          >
            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: COLORS.cyan }]} />
              <Text style={styles.statText}>{typeCounters.people} pessoas</Text>
            </View>

            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: COLORS.gold }]} />
              <Text style={styles.statText}>{typeCounters.business} empresas</Text>
            </View>

            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: COLORS.blueLight }]} />
              <Text style={styles.statText}>{typeCounters.services} serviços</Text>
            </View>

            <View style={styles.statPill}>
              <View style={[styles.statDot, { backgroundColor: COLORS.purple }]} />
              <Text style={styles.statText}>{typeCounters.groups} grupos</Text>
            </View>
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={resetView}
          >
            <Ionicons name="refresh" size={18} color="#061019" />
            <Text style={styles.refreshText}>Atualizar</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },

  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },

  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },

  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.032)',
  },

  softGlowTopRight: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: 120,
    right: -150,
    backgroundColor: 'rgba(34,211,238,0.075)',
  },

  softGlowBottomLeft: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    bottom: -110,
    left: -180,
    backgroundColor: 'rgba(168,85,247,0.075)',
  },

  header: {
    position: 'absolute',
    top: 10,
    left: 18,
    right: 18,
    height: 56,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLogo: {
    width: 94,
    height: 28,
  },

  headerSub: {
    marginTop: -2,
    color: COLORS.mutedSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  headerRightSpacer: {
    width: 44,
    height: 44,
  },

  searchArea: {
    position: 'absolute',
    top: 80,
    left: 18,
    right: 18,
    zIndex: 35,
  },

  searchBox: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(4,7,13,0.82)',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
  },

  filtersContent: {
    paddingTop: 12,
    paddingRight: 12,
  },

  filterChip: {
    height: 38,
    paddingHorizontal: 14,
    marginRight: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(4,7,13,0.70)',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '900',
  },

  mapTouchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
  },

  sonarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  sonarRingOuter: {
    width: 420,
    height: 420,
    borderRadius: 210,
  },

  sonarRingMiddle: {
    width: 290,
    height: 290,
    borderRadius: 145,
    borderColor: 'rgba(34,211,238,0.13)',
  },

  sonarRingInner: {
    width: 156,
    height: 156,
    borderRadius: 78,
    borderColor: 'rgba(168,85,247,0.14)',
  },

  regionShapeOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(34,211,238,0.055)',
  },

  regionShapeTwo: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(168,85,247,0.05)',
  },

  connectionLine: {
    position: 'absolute',
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    transformOrigin: 'left',
  },

  centerNode: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -33 }, { translateY: -33 }],
  },

  centerPulseOuter: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.28)',
    top: -8,
    left: -8,
  },

  centerPulseInner: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.30)',
    top: 2,
    left: 2,
  },

  centerAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(4,7,13,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerSymbol: {
    width: 42,
    height: 42,
  },

  centerLabel: {
    marginTop: -6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(3,5,10,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  centerLabelText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },

  nodeWrap: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -31 }, { translateY: -31 }],
  },

  nodeHalo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nodeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#06080E',
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nodePhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  nodeSymbol: {
    width: 31,
    height: 31,
  },

  nodeLabel: {
    marginTop: -4,
    maxWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  nodeLabelText: {
    fontSize: 12,
    fontWeight: '900',
  },

  zoomControl: {
    position: 'absolute',
    right: 18,
    top: SCREEN_HEIGHT * 0.44,
    zIndex: 32,
    width: 54,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(4,7,13,0.86)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  zoomButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoomValueBox: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  zoomValueText: {
    color: COLORS.blueLight,
    fontSize: 14,
    fontWeight: '900',
  },

  regionBadge: {
    position: 'absolute',
    left: 18,
    bottom: 128,
    right: 96,
    zIndex: 30,
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(4,7,13,0.82)',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  regionKicker: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  regionTitle: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '900',
  },

  regionCount: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.32)',
  },

  regionCountText: {
    color: COLORS.cyan,
    fontSize: 22,
    fontWeight: '900',
  },

  securityNotice: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 84,
    zIndex: 31,
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(217,180,106,0.105)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,106,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  securityNoticeText: {
    flex: 1,
    marginLeft: 9,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },

  tooltip: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 182,
    zIndex: 45,
    padding: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(6,10,18,0.96)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tooltipTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  tooltipInfo: {
    flex: 1,
    minWidth: 0,
  },

  tooltipName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  tooltipMeta: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  connectButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  connectButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    minHeight: 74,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(3,5,10,0.94)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },

  bottomStatsScroll: {
    flex: 1,
  },

  bottomStats: {
    paddingRight: 10,
    alignItems: 'center',
  },

  statPill: {
    height: 38,
    paddingHorizontal: 13,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '900',
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#35E6B5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  refreshText: {
    marginLeft: 7,
    color: '#061019',
    fontSize: 13,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.72,
  },
});