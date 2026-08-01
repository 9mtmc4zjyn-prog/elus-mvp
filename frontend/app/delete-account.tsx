import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../src/theme/ThemeContext';
import { Button } from '../src/components/Button';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';

export default function DeleteAccountScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { logout } = useApp();

  const [step, setStep] = useState<'info' | 'confirm'>('info');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      setError('Digite EXCLUIR MINHA CONTA exatamente como escrito');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: funcError } = await supabase.functions.invoke('delete-account', {
        body: { user_id: user.id },
      });

      if (funcError) throw funcError;

      await supabase.auth.signOut().catch(() => {
        // Sessão já pode estar inválida após deleteUser no servidor.
      });
      logout();

      Alert.alert(
        'Conta excluída',
        'Sua conta e todos os seus dados foram removidos conforme a LGPD. Sentiremos sua falta.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'info') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.danger }]}>Excluir minha conta</Text>

          <Text style={[styles.text, { color: colors.text }]}>
            Essa ação é irreversível. Ao excluir sua conta:
          </Text>

          <View style={styles.list}>
            {[
              'Seu perfil será removido permanentemente',
              'Suas conexões serão desfeitas',
              'Suas mensagens enviadas e recebidas serão apagadas (a conversa inteira some para você e para quem conversou com você)',
              'Seus dados de verificação serão apagados',
              'Suas solicitações e bloqueios serão removidos',
              'O cancelamento é imediato e sem possibilidade de recuperação',
            ].map((item, i) => (
              <Text key={i} style={[styles.listItem, { color: colors.textSoft }]}>
                • {item}
              </Text>
            ))}
          </View>

          <View style={[styles.warningBox, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.warningText, { color: colors.text }]}>
              A exclusão segue a LGPD (Lei nº 13.709/2018). Seus dados serão removidos em até 30
              dias.
            </Text>
          </View>

          <Button
            label="Quero excluir minha conta"
            variant="destructive"
            onPress={() => setStep('confirm')}
            containerStyle={styles.button}
          />

          <Button
            label="Cancelar"
            variant="secondary"
            onPress={() => router.back()}
            containerStyle={styles.button}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.danger }]}>Confirmação final</Text>

        <Text style={[styles.text, { color: colors.text }]}>
          Digite <Text style={styles.bold}>EXCLUIR MINHA CONTA</Text> para confirmar que você
          entendeu e deseja prosseguir.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: error ? colors.danger : colors.border,
            },
          ]}
          placeholder="EXCLUIR MINHA CONTA"
          placeholderTextColor={colors.textMuted}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
        />

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={colors.danger} style={styles.loader} />
        ) : (
          <>
            <Button
              label="Sim, excluir permanentemente"
              variant="destructive"
              onPress={handleDelete}
              disabled={confirmText !== 'EXCLUIR MINHA CONTA'}
              containerStyle={styles.button}
            />
            <Button
              label="Voltar"
              variant="secondary"
              onPress={() => setStep('info')}
              containerStyle={styles.button}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, lineHeight: 24 },
  bold: { fontWeight: '700' },
  list: { gap: 8, marginVertical: 12 },
  listItem: { fontSize: 15, lineHeight: 22 },
  warningBox: { padding: 16, borderRadius: 12, marginVertical: 8 },
  warningText: { fontSize: 14, lineHeight: 20 },
  button: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
  },
  error: { fontSize: 14, textAlign: 'center' },
  loader: { marginVertical: 24 },
});
