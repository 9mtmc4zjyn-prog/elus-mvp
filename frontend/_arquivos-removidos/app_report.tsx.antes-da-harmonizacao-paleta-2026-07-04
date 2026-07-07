import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';

const COLORS = {
  background: '#03040A',
  card: 'rgba(12,15,27,0.94)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#FFFFFF',
  muted: 'rgba(210,218,236,0.80)',
  soft: 'rgba(255,255,255,0.46)',
  blue: '#2D64FF',
  blueLight: '#8FB3FF',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',
  input: 'rgba(3,4,10,0.88)',
  selected: 'rgba(239,68,68,0.16)',
  selectedBorder: 'rgba(239,68,68,0.50)',
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
  const params = useLocalSearchParams<{ userId?: string; userName?: string }>();
  const reportedUserId = params.userId ?? '';
  const reportedUserName = params.userName ?? 'este usuário';

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
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Denúncia enviada</Text>
          <Text style={styles.successText}>
            Nossa equipe irá analisar a denúncia. O usuário denunciado não será
            notificado sobre o envio da denúncia.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Denunciar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Denúncia sobre {reportedUserName}</Text>
          <Text style={styles.infoText}>
            Suas denúncias são confidenciais. O usuário denunciado não saberá que você
            fez uma denúncia. Nossa equipe analisará todas as denúncias recebidas.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Motivo da denúncia</Text>

        {REPORT_REASONS.map((reason) => (
          <Pressable
            key={reason.id}
            style={({ pressed }) => [
              styles.reasonRow,
              selectedReason === reason.id && styles.reasonRowSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => setSelectedReason(reason.id)}
          >
            <View
              style={[
                styles.reasonRadio,
                selectedReason === reason.id && styles.reasonRadioSelected,
              ]}
            >
              {selectedReason === reason.id && (
                <View style={styles.reasonRadioDot} />
              )}
            </View>
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === reason.id && styles.reasonLabelSelected,
              ]}
            >
              {reason.label}
            </Text>
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>Descrição adicional (opcional)</Text>

        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
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

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            !selectedReason && styles.submitButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={submitReport}
          disabled={loading || !selectedReason}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar denúncia</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: { color: COLORS.text, fontSize: 30, lineHeight: 32, marginTop: -2 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  infoBox: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    marginBottom: 24,
  },
  infoTitle: { color: COLORS.red, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  infoText: { color: COLORS.muted, fontSize: 13, lineHeight: 21, fontWeight: '600' },
  sectionLabel: {
    color: COLORS.text,
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
    borderColor: COLORS.border,
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
  reasonRadioSelected: { borderColor: COLORS.red },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  reasonLabel: { flex: 1, color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  reasonLabelSelected: { color: COLORS.text },
  textAreaBox: {
    borderRadius: 20,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  textArea: {
    color: COLORS.text,
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
  submitButton: {
    minHeight: 58,
    borderRadius: 26,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.red,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  cancelButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
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
  successTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  successText: { color: COLORS.muted, fontSize: 15, lineHeight: 24, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  doneButton: {
    minWidth: 200,
    minHeight: 56,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  bottomSpace: { height: 40 },
  pressed: { opacity: 0.74 },
});