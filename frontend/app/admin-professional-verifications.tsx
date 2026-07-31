import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { useTheme } from '../src/theme/ThemeContext';
import { getCouncilById } from '../src/data/professionalCouncils';

type ReviewStatus = 'in_review' | 'verified' | 'rejected';

type ProfessionalVerificationRow = {
  id: string;
  user_id: string;
  council_id: string;
  registration_number: string;
  registered_name: string;
  registration_state: string;
  status: ReviewStatus;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

const STATUS_TABS: { key: ReviewStatus; label: string }[] = [
  { key: 'in_review', label: 'Em conferência' },
  { key: 'verified', label: 'Aprovados' },
  { key: 'rejected', label: 'Rejeitados' },
];

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function Header() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={[styles.headerTitle, { color: colors.text }]}>ELUS</Text>

      <View style={styles.headerSpace} />
    </View>
  );
}

function VerificationCard({
  item,
  onApprove,
  onReject,
  busy,
}: {
  item: ProfessionalVerificationRow;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const council = getCouncilById(item.council_id);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.councilBadge, { borderColor: colors.border }]}>
          <Text style={[styles.councilBadgeText, { color: colors.text }]}>{item.council_id}</Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.textSoft }]}>{formatDate(item.submitted_at)}</Text>
      </View>

      <Text style={[styles.cardName, { color: colors.text }]}>{item.registered_name}</Text>

      <Text style={[styles.cardDetail, { color: colors.textMuted }]}>
        {`Registro ${item.registration_number}${item.registration_state ? ` · UF ${item.registration_state}` : ''}`}
      </Text>

      {council ? (
        <Pressable onPress={() => Linking.openURL(council.lookupUrl)}>
          <Text style={[styles.lookupLink, { color: colors.accent }]}>
            {`Conferir na consulta pública: ${council.lookupUrl}`}
          </Text>
        </Pressable>
      ) : null}

      {item.status === 'rejected' && item.rejection_reason ? (
        <Text style={[styles.rejectionReason, { color: colors.danger }]}>
          {`Motivo da rejeição: ${item.rejection_reason}`}
        </Text>
      ) : null}

      {item.status === 'in_review' ? (
        rejecting ? (
          <View style={styles.rejectBox}>
            <TextInput
              style={[styles.reasonInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Motivo da rejeição (visível ao profissional)"
              placeholderTextColor={colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <View style={styles.rejectActions}>
              <Button
                label="Cancelar"
                variant="secondary"
                containerStyle={styles.rejectActionButton}
                onPress={() => {
                  setRejecting(false);
                  setReason('');
                }}
              />
              <Button
                label="Confirmar rejeição"
                variant="destructive"
                disabled={reason.trim().length < 3 || busy}
                containerStyle={styles.rejectActionButton}
                onPress={() => onReject(item.id, reason.trim())}
              />
            </View>
          </View>
        ) : (
          <View style={styles.cardActions}>
            <Button
              label="Rejeitar"
              variant="destructiveSecondary"
              containerStyle={styles.cardActionButton}
              disabled={busy}
              onPress={() => setRejecting(true)}
            />
            <Button
              label="Aprovar"
              variant="success"
              containerStyle={styles.cardActionButton}
              disabled={busy}
              onPress={() => onApprove(item.id)}
            />
          </View>
        )
      ) : null}
    </View>
  );
}

export default function AdminProfessionalVerificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useApp() as any;

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<ReviewStatus>('in_review');
  const [items, setItems] = useState<ProfessionalVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', authUser.id)
          .maybeSingle();

        if (active) {
          setIsAdmin(Boolean(data?.is_admin) || user?.isAdmin === true);
        }
      } catch {
        if (active) setIsAdmin(user?.isAdmin === true);
      } finally {
        if (active) setCheckingAccess(false);
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItems = useCallback(async (status: ReviewStatus) => {
    const { data, error } = await supabase
      .from('professional_verifications')
      .select('id, user_id, council_id, registration_number, registered_name, registration_state, status, submitted_at, reviewed_at, rejection_reason')
      .eq('status', status)
      .eq('is_current', true)
      .order('submitted_at', { ascending: true });

    if (error) {
      Alert.alert('Erro ao carregar', error.message);
      return [];
    }

    return (data as ProfessionalVerificationRow[]) || [];
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    setLoading(true);

    loadItems(activeTab).then((data) => {
      if (active) {
        setItems(data);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [isAdmin, activeTab, loadItems]);

  async function handleRefresh() {
    setRefreshing(true);
    const data = await loadItems(activeTab);
    setItems(data);
    setRefreshing(false);
  }

  async function handleApprove(id: string) {
    setBusyId(id);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('professional_verifications')
        .update({
          status: 'verified',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authUser?.id,
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) {
        Alert.alert('Erro ao aprovar', error.message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setBusyId(id);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('professional_verifications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authUser?.id,
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) {
        Alert.alert('Erro ao rejeitar', error.message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (checkingAccess) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <Header />
        <View style={styles.content}>
          <View style={[styles.noticeCard, styles.dangerCard]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.danger} />
            <View style={styles.noticeTextWrap}>
              <Text style={[styles.noticeTitle, { color: colors.text }]}>Acesso restrito</Text>
              <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                Esta área é só para a equipe do ELUS conferir registros profissionais.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <Header />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: colors.warning }]}>Painel administrativo</Text>
          <Text style={[styles.title, { color: colors.text }]}>Registros profissionais</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Confira o registro na consulta pública oficial do conselho antes de aprovar.
          </Text>
        </View>

        <View style={styles.chipsWrap}>
          {STATUS_TABS.map((tab) => (
            <Chip
              key={tab.key}
              label={tab.label}
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loadingSpinner} />
        ) : items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSoft }]}>
            Nenhum registro nesta categoria.
          </Text>
        ) : (
          items.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busyId === item.id}
            />
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  header: {
    height: 92,
    paddingTop: 44,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },

  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 5,
  },

  headerSpace: { width: 38, height: 38 },

  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 34,
  },

  titleBlock: { marginBottom: 18 },

  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginBottom: 5,
  },

  subtitle: { fontSize: 12, lineHeight: 18 },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  loadingSpinner: { marginTop: 40 },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 40,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  councilBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  councilBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  cardDate: { fontSize: 11 },

  cardName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },

  cardDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },

  lookupLink: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
    textDecorationLine: 'underline',
  },

  rejectionReason: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },

  cardActionButton: { flex: 1 },

  rejectBox: { marginTop: 6 },

  reasonInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 64,
    fontSize: 13,
    marginBottom: 10,
    textAlignVertical: 'top',
  },

  rejectActions: {
    flexDirection: 'row',
    gap: 10,
  },

  rejectActionButton: { flex: 1 },

  noticeCard: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },

  dangerCard: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: 'rgba(255,107,107,0.30)',
  },

  noticeTextWrap: { flex: 1, marginLeft: 12 },

  noticeTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  noticeText: {
    fontSize: 11,
    lineHeight: 16,
  },

  bottomSpace: { height: 22 },
});
