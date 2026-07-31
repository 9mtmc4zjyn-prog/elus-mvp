import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import {
  PROFESSIONAL_COUNCILS,
  getCouncilById,
  type ProfessionalCouncil,
} from '../src/data/professionalCouncils';

type ProfessionalVerificationStatus =
  | 'unverified'
  | 'in_review'
  | 'verified'
  | 'rejected';

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

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

export default function ProfessionalVerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useApp() as any;

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<ProfessionalVerificationStatus>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const [councilId, setCouncilId] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [registrationState, setRegistrationState] = useState('');

  const identityVerified =
    user?.verified === true || user?.verificationStatus === 'verified';

  const selectedCouncil: ProfessionalCouncil | undefined = useMemo(
    () => (councilId ? getCouncilById(councilId) : undefined),
    [councilId],
  );

  const needsState = selectedCouncil?.lookupScope === 'by_state';

  useEffect(() => {
    let active = true;

    async function loadExisting() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data } = await supabase
          .from('professional_verifications')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('is_current', true)
          .maybeSingle();

        if (!active || !data) return;

        setStatus((data.status as ProfessionalVerificationStatus) ?? 'unverified');
        setRejectionReason(data.rejection_reason ?? null);
        setCouncilId(data.council_id ?? '');
        setRegistrationNumber(data.registration_number ?? '');
        setRegisteredName(data.registered_name ?? '');
        setRegistrationState(data.registration_state ?? '');
      } catch {
        // Mantém formulário vazio se a busca falhar.
      } finally {
        if (active) setChecking(false);
      }
    }

    loadExisting();

    return () => {
      active = false;
    };
  }, []);

  const isInReview = status === 'in_review';
  const isVerified = status === 'verified';
  const isRejected = status === 'rejected';
  const formLocked = isInReview || isVerified;

  const canSubmit =
    !formLocked &&
    Boolean(councilId) &&
    registrationNumber.trim().length >= 2 &&
    registeredName.trim().length >= 5 &&
    (!needsState || registrationState.length === 2);

  async function handleSubmit() {
    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
        router.replace('/login' as never);
        return;
      }

      // Desativa registro anterior (ex.: reenvio após rejeição).
      await supabase
        .from('professional_verifications')
        .update({ is_current: false })
        .eq('user_id', authUser.id)
        .eq('is_current', true);

      const { error } = await supabase.from('professional_verifications').insert({
        user_id: authUser.id,
        council_id: councilId,
        registration_number: registrationNumber.trim(),
        registered_name: registeredName.trim(),
        registration_state: needsState ? registrationState : '',
        status: 'in_review',
        is_current: true,
      });

      if (error) {
        Alert.alert(
          'Erro ao enviar',
          error.message || 'Não foi possível enviar. Verifique sua conexão.',
        );
        return;
      }

      setStatus('in_review');
      setRejectionReason(null);

      Alert.alert(
        'Enviado para conferência',
        'Nossa equipe vai conferir seu registro na consulta pública do conselho. Você será avisado quando a análise terminar.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <Header />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleBlock}>
            <Text style={[styles.eyebrow, { color: colors.warning }]}>Verificação profissional</Text>
            <Text style={[styles.title, { color: colors.text }]}>Registro em conselho</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Informe seu conselho e número de registro. Nossa equipe confere na
              consulta pública oficial do conselho antes de aprovar.
            </Text>
          </View>

          {!identityVerified ? (
            <View style={[styles.noticeCard, styles.dangerCard]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.danger} />
              <View style={styles.noticeTextWrap}>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>
                  Verifique sua identidade primeiro
                </Text>
                <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                  O registro profissional é uma camada sobre a identidade
                  aprovada. Conclua a verificação de documento + selfie para
                  continuar.
                </Text>
                <Button
                  label="Verificar identidade"
                  variant="destructive"
                  icon="shield-checkmark-outline"
                  onPress={() => router.push('/verification' as never)}
                />
              </View>
            </View>
          ) : (
            <>
              {isVerified ? (
                <View style={[styles.noticeCard, styles.successCard]}>
                  <Ionicons name="ribbon-outline" size={20} color={colors.success} />
                  <View style={styles.noticeTextWrap}>
                    <Text style={[styles.noticeTitle, { color: colors.text }]}>
                      Registro profissional confirmado
                    </Text>
                    <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                      {`Seu registro ${councilId} ${registrationNumber} foi conferido na consulta pública do conselho.`}
                    </Text>
                  </View>
                </View>
              ) : null}

              {isInReview ? (
                <View style={[styles.noticeCard, styles.reviewCard]}>
                  <Ionicons name="time-outline" size={20} color={colors.warning} />
                  <View style={styles.noticeTextWrap}>
                    <Text style={[styles.noticeTitle, { color: colors.text }]}>
                      Registro em conferência
                    </Text>
                    <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                      Estamos conferindo seu registro na consulta pública do
                      conselho. Você será avisado quando a análise terminar.
                    </Text>
                  </View>
                </View>
              ) : null}

              {isRejected ? (
                <View style={[styles.noticeCard, styles.dangerCard]}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                  <View style={styles.noticeTextWrap}>
                    <Text style={[styles.noticeTitle, { color: colors.text }]}>
                      Registro não confirmado
                    </Text>
                    <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                      {rejectionReason ||
                        'Não conseguimos confirmar seu registro na consulta pública. Confira os dados e envie novamente.'}
                    </Text>
                  </View>
                </View>
              ) : null}

              {!formLocked ? (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Conselho</Text>
                  <View style={styles.chipsWrap}>
                    {PROFESSIONAL_COUNCILS.map((council) => (
                      <Chip
                        key={council.id}
                        label={council.id}
                        selected={councilId === council.id}
                        onPress={() => {
                          setCouncilId(council.id);
                          setRegistrationState('');
                        }}
                      />
                    ))}
                  </View>

                  {selectedCouncil ? (
                    <Text style={[styles.councilHint, { color: colors.textSoft }]}>
                      {`${selectedCouncil.profession} · consulta ${selectedCouncil.lookupScope === 'national' ? 'nacional' : 'por estado'} (${selectedCouncil.federalBody})`}
                    </Text>
                  ) : null}

                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Número de registro</Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="card-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder={councilId ? `Número do ${councilId}` : 'Número de registro'}
                      placeholderTextColor={colors.textMuted}
                      value={registrationNumber}
                      onChangeText={setRegistrationNumber}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Nome como consta no registro</Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Nome completo no conselho"
                      placeholderTextColor={colors.textMuted}
                      value={registeredName}
                      onChangeText={setRegisteredName}
                      autoCorrect={false}
                    />
                  </View>

                  {needsState ? (
                    <>
                      <Text style={[styles.sectionLabel, { color: colors.text }]}>UF do registro</Text>
                      <View style={styles.chipsWrap}>
                        {BRAZIL_STATES.map((uf) => (
                          <Chip
                            key={uf}
                            label={uf}
                            selected={registrationState === uf}
                            onPress={() => setRegistrationState(uf)}
                          />
                        ))}
                      </View>
                    </>
                  ) : null}

                  <View style={[styles.noticeCard, styles.infoCard]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                    <View style={styles.noticeTextWrap}>
                      <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                        A conferência é feita por pessoas, na consulta pública
                        oficial do conselho. Registro profissional não substitui a
                        verificação de identidade e não libera contato.
                      </Text>
                    </View>
                  </View>

                  <Button
                    label={loading ? 'Enviando...' : 'Enviar para conferência'}
                    icon="arrow-forward"
                    disabled={!canSubmit || loading}
                    onPress={handleSubmit}
                  />
                </>
              ) : null}
            </>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
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

  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 8,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  councilHint: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },

  inputBox: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  inputIcon: { marginRight: 10 },

  input: { flex: 1, fontSize: 16 },

  noticeCard: {
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 16,
  },

  infoCard: {
    backgroundColor: 'rgba(91,141,239,0.10)',
    borderColor: 'rgba(91,141,239,0.30)',
  },

  reviewCard: {
    backgroundColor: 'rgba(242,169,59,0.10)',
    borderColor: 'rgba(242,169,59,0.28)',
  },

  successCard: {
    backgroundColor: 'rgba(74,154,101,0.12)',
    borderColor: 'rgba(74,154,101,0.34)',
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
    marginBottom: 8,
  },

  bottomSpace: { height: 22 },
});
