import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../src/theme/ThemeContext';
import { Button } from '../src/components/Button';
import IconButton from '../src/components/IconButton';
import { supabase } from '../src/lib/supabase';

type VerificationExportRow = {
  id: string;
  user_id: string;
  status: string;
  document_type: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  is_current: boolean;
  created_at: string;
};

export default function ExportDataScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const uid = user.id;

      const [
        profileResult,
        verificationResult,
        outgoingConnectionsResult,
        incomingConnectionsResult,
        outgoingConnectionRequestsResult,
        incomingConnectionRequestsResult,
        outgoingContactRequestsResult,
        incomingContactRequestsResult,
        reportsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase
          .from('verifications')
          .select(
            'id, user_id, status, document_type, submitted_at, reviewed_at, rejection_reason, is_current, created_at'
          )
          .eq('user_id', uid),
        supabase.from('connections').select('*').eq('from_user_id', uid),
        supabase.from('connections').select('*').eq('to_user_id', uid),
        supabase.from('connection_requests').select('*').eq('from_user_id', uid),
        supabase.from('connection_requests').select('*').eq('to_user_id', uid),
        supabase
          .from('contact_requests')
          .select(
            'id, from_user_id, to_user_id, requested_method_ids, approved_method_ids, status, created_at'
          )
          .eq('from_user_id', uid),
        supabase
          .from('contact_requests')
          .select(
            'id, from_user_id, to_user_id, requested_method_ids, approved_method_ids, status, created_at'
          )
          .eq('to_user_id', uid),
        supabase
          .from('reports')
          .select('id, reporter_id, reported_id, type, category, reason, status, created_at')
          .eq('reporter_id', uid),
      ]);

      const firstError =
        profileResult.error ||
        verificationResult.error ||
        outgoingConnectionsResult.error ||
        incomingConnectionsResult.error ||
        outgoingConnectionRequestsResult.error ||
        incomingConnectionRequestsResult.error ||
        outgoingContactRequestsResult.error ||
        incomingContactRequestsResult.error ||
        reportsResult.error;

      if (firstError) {
        throw new Error(firstError.message);
      }

      const verifications = (verificationResult.data ?? []) as VerificationExportRow[];

      const exportPayload = {
        exportado_em: new Date().toISOString(),
        conta: {
          id: uid,
          email: user.email ?? null,
          criado_em: user.created_at,
        },
        profiles: profileResult.data ?? null,
        connections: {
          enviadas: outgoingConnectionsResult.data ?? [],
          recebidas: incomingConnectionsResult.data ?? [],
        },
        connection_requests: {
          enviadas: outgoingConnectionRequestsResult.data ?? [],
          recebidas: incomingConnectionRequestsResult.data ?? [],
        },
        contact_requests: {
          enviadas: outgoingContactRequestsResult.data ?? [],
          recebidas: incomingContactRequestsResult.data ?? [],
        },
        verifications,
        reports: reportsResult.data ?? [],
      };

      const json = JSON.stringify(exportPayload, null, 2);

      setLoading(false);

      await Share.share({
        title: 'Meus dados ELUS',
        message: json,
      });
    } catch (err: unknown) {
      setLoading(false);
      const message =
        err instanceof Error ? err.message : 'Erro ao exportar dados. Tente novamente.';
      setError(message);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => router.back()} backgroundColor={colors.surface} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Exportar meus dados</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>
          Você pode baixar uma cópia dos seus dados pessoais no ELUS, conforme a LGPD
          (Lei nº 13.709/2018).
        </Text>

        <View style={styles.list}>
          {[
            'Dados do perfil (profiles)',
            'Conexões enviadas e recebidas',
            'Solicitações de conexão',
            'Solicitações de contato (inclui approved_method_ids)',
            'Status de verificação de identidade (sem arquivos de imagem)',
            'Denúncias que você enviou (não as recebidas sobre você)',
          ].map((item) => (
            <Text key={item} style={[styles.listItem, { color: colors.textSoft }]}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            O arquivo é gerado em formato JSON e aberto no menu de compartilhamento do
            dispositivo — você escolhe salvar, enviar por e-mail ou compartilhar.
          </Text>
        </View>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <Button
            label="Exportar meus dados"
            variant="primary"
            onPress={handleExport}
            containerStyle={styles.button}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 24, gap: 16 },
  text: { fontSize: 16, lineHeight: 24 },
  list: { gap: 8, marginVertical: 4 },
  listItem: { fontSize: 15, lineHeight: 22 },
  infoBox: { padding: 16, borderRadius: 12, marginVertical: 8 },
  infoText: { fontSize: 14, lineHeight: 20 },
  button: { marginTop: 8 },
  error: { fontSize: 14, textAlign: 'center' },
  loader: { marginVertical: 24 },
});
