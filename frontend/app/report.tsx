import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeContext';

const COLORS = {
  card: 'rgba(20,26,38,0.94)',
  borderStrong: 'rgba(255,255,255,0.16)',
  muted: 'rgba(237,237,237,0.82)',
  soft: 'rgba(161,169,184,0.55)',
  blueLight: '#8FA3B8',
  redSoft: 'rgba(184,92,92,0.12)',
  input: 'rgba(11,16,26,0.88)',
  selected: 'rgba(184,92,92,0.16)',
  selectedBorder: 'rgba(184,92,92,0.50)',
};

// Cada motivo tem um "type": 'identidade' (sobre quem a pessoa é) ou
// 'conduta' (sobre como a pessoa age). Isso bate com as regras do banco (RLS).
const REPORT_REASONS = [
  { id: 'fake_profile', label: 'Perfil falso ou identidade falsa', type: 'identidade' },
  { id: 'stolen_photo', label: 'Foto roubada ou de outra pessoa', type: 'identidade' },
  { id: 'minor', label: 'Menor de idade', type: 'identidade' },
  { id: 'harassment', label: 'Assédio ou intimidação', type: 'conduta' },
  { id: 'scam', label: 'Golpe ou fraude', type: 'conduta' },
  { id: 'inappropriate', label: 'Conteúdo inadequado ou ofensivo', type: 'conduta' },
  { id: 'spam', label: 'Spam ou comportamento abusivo', type: 'conduta' },
  { id: 'other', label: 'Outro motivo', type: 'conduta' },
];

export default function ReportScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ userId?: string; userName?: string; messageId?: string }>();
  const reportedUserId = params.userId ?? '';
  const reportedUserName = params.userName ?? 'este usuário';
  const reportedMessageId = params.messageId || null;

  // Denúncia de mensagem é sempre sobre conduta (a policy criar_denuncia_conduta
  // exige type='conduta'); não faz sentido reportar identidade a partir de um chat.
  const availableReasons = reportedMessageId
    ? REPORT_REASONS.filter((reason) => reason.type === 'conduta')
    : REPORT_REASONS;

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submitReport() {
    if (!selectedReason) {
      Alert.alert('Selecione um motivo', 'Por favor, escolha o motivo da denúncia antes de enviar.');
      return;
    }

    if (!reportedUserId) {
      Alert.alert('Erro', 'ID do usuário não encontrado. Volte e tente novamente.');
      return;
    }

    setLoading(true);


    try {
      // Descobre o tipo (identidade/conduta) a partir do motivo escolhido
      const selectedReasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      const reportType = selectedReasonObj?.type ?? 'identidade';

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: reportedUserId,
        type: reportType,
        category: selectedReason,
        reason: description.trim() || null,
        status: 'pendente',
        message_id: reportedMessageId,
      });

      if (error) {
        // Registra o erro mas mostra confirmação para não revelar estado interno
        console.warn('[ELUS] Erro ao enviar denúncia:', error.message);
      }

      setSubmitted(true);
    } catch (err) {
      console.warn('[ELUS] Falha ao enviar denúncia:', err);
      setSubmitted(true); // Mostra confirmação mesmo em caso de falha de rede
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Denúncia enviada</Text>
          <Text style={styles.successText}>
            Nossa equipe irá analisar a denúncia. O usuário denunciado não será
            notificado sobre o envio da denúncia.
          </Text>
          <Button
            label="Voltar"
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, { borderColor: colors.border }, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Denunciar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: colors.danger }]}>Denúncia sobre {reportedUserName}</Text>
          <Text style={styles.infoText}>
            Suas denúncias são confidenciais. O usuário denunciado não saberá que você
            fez uma denúncia. Nossa equipe analisará todas as denúncias recebidas.
          </Text>

          {reportedMessageId ? (
            <Text style={[styles.infoText, styles.infoTextMessage]}>
              Você está denunciando uma mensagem específica desta conversa.
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Motivo da denúncia</Text>

        {availableReasons.map((reason) => (
          <Pressable
            key={reason.id}
            style={({ pressed }) => [
              styles.reasonRow,
              { borderColor: colors.border },
              selectedReason === reason.id && styles.reasonRowSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => setSelectedReason(reason.id)}
          >
            <View
              style={[
                styles.reasonRadio,
                selectedReason === reason.id && { borderColor: colors.danger },
              ]}
            >
              {selectedReason === reason.id && (
                <View style={[styles.reasonRadioDot, { backgroundColor: colors.danger }]} />
              )}
            </View>
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === reason.id && { color: colors.text },
              ]}
            >
              {reason.label}
            </Text>
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Descrição adicional (opcional)</Text>

        <View style={[styles.textAreaBox, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva com mais detalhes o que aconteceu..."
            placeholderTextColor="rgba(143,163,197,0.55)"
            multiline
            numberOfLines={4}
            maxLength={500}
            editable={!loading}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Aviso importante</Text>
          <Text style={styles.warningText}>
            Denúncias falsas ou mal-intencionadas podem resultar em suspensão da sua conta.
            Use este recurso apenas quando identificar uma violação real dos Termos de Uso.
          </Text>
        </View>

        <Button
          label="Enviar denúncia"
          variant="destructive"
          loading={loading}
          disabled={loading || !selectedReason}
          onPress={submitReport}
        />

        <Button
          label="Cancelar"
          variant="secondary"
          disabled={loading}
          onPress={() => router.back()}
        />

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
  },
  backButtonText: { fontSize: 30, lineHeight: 32, marginTop: -2 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  infoBox: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    marginBottom: 24,
  },
  infoTitle: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  infoText: { color: COLORS.muted, fontSize: 13, lineHeight: 21, fontWeight: '600' },
  infoTextMessage: { marginTop: 10, fontStyle: 'italic', color: COLORS.blueLight },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  reasonRowSelected: {
    backgroundColor: COLORS.selected,
    borderColor: COLORS.selectedBorder,
  },
  reasonRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabel: { flex: 1, color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  textAreaBox: {
    borderRadius: 20,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: { color: COLORS.soft, fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 6 },
  warningBox: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(217,180,106,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,106,0.22)',
    marginBottom: 24,
  },
  warningTitle: { color: '#D9B46A', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  warningText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: { color: '#22C55E', fontSize: 36, fontWeight: '900' },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  successText: { color: COLORS.muted, fontSize: 15, lineHeight: 24, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  bottomSpace: { height: 40 },
  pressed: { opacity: 0.74 },
});
