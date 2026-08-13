import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, useThemeColors } from '../src/theme/ThemeContext';
import { Button } from '../src/components/Button';
import IconButton from '../src/components/IconButton';

const themeOptions = [
  { key: 'hybrid', label: 'Híbrido (padrão)', description: 'Azul institucional com fundo escuro' },
  { key: 'monoDark', label: 'Monocromático escuro', description: 'Preto e branco, modo escuro' },
  { key: 'monoLight', label: 'Monocromático claro', description: 'Preto e branco, modo claro' },
];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { themeMode, setThemeMode } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => router.back()} backgroundColor={colors.surface} />
        <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Tema visual</Text>
        {themeOptions.map((option) => (
          <View key={option.key} style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: themeMode === option.key ? colors.accent : colors.border }]}>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
              <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{option.description}</Text>
            </View>
            {themeMode === option.key ? (
              <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>
              </View>
            ) : (
              <Button label="Usar" variant="secondary" onPress={() => setThemeMode(option.key as any)} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Conta</Text>
        <Button label="Trocar senha" variant="secondary" onPress={() => router.push('/change-password')} containerStyle={styles.actionButton} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Dados e privacidade</Text>
        <Button label="Política de Privacidade" variant="secondary" onPress={() => router.push('/privacy-policy')} containerStyle={styles.actionButton} />
        <Button label="Exportar meus dados" variant="secondary" onPress={() => router.push('/export-data')} containerStyle={styles.actionButton} />
        <Button label="Excluir minha conta" variant="destructiveSecondary" onPress={() => router.push('/delete-account')} containerStyle={styles.actionButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  themeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1 },
  themeInfo: { flex: 1, marginRight: 12 },
  themeLabel: { fontSize: 16, fontWeight: '600' },
  themeDesc: { fontSize: 13, marginTop: 2 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionButton: { marginTop: 4 },
});
