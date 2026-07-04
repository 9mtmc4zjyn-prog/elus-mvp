import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useApp } from '../../src/context/AppContext';
import type { ConnectionKind } from '../../src/context/AppContext';

type IconName = keyof typeof Ionicons.glyphMap;

function transparentColor(hexColor: string, opacity: number) {
  if (!hexColor || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return 'rgba(255,255,255,0.06)';
  }
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${opacity})`;
}

function connectionIcon(kind: ConnectionKind): IconName {
  if (kind === 'family') return 'people-outline';
  if (kind === 'company') return 'business-outline';
  if (kind === 'interest') return 'sparkles-outline';
  if (kind === 'preference') return 'heart-outline';
  if (kind === 'service') return 'construct-outline';
  if (kind === 'assisted') return 'accessibility-outline';
  return 'ellipse-outline';
}

export default function RequestAccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    users,
    relationshipColors,
    requestFamilyConnection,
    toggleConnection,
  } = useApp();

  const target = (users || []).find((item) => item.id === id);

  if (!target) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.silver} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Solicitar acesso</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.empty}>Perfil não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const allowedKinds: ConnectionKind[] =
    target.profileType === 'business'
      ? ['company', 'interest']
      : target.profileType === 'assisted'
      ? ['family', 'assisted', 'interest']
      : ['family', 'interest', 'preference', 'service'];

  function handleRequest(kind: ConnectionKind) {
    if (!target) return;

    if (kind === 'family') {
      requestFamilyConnection(target.id);
      Alert.alert(
        'Vínculo familiar',
        `Pedido de vínculo familiar criado com ${target.name}. No app real, os dois perfis precisam concordar.`
      );
      router.back();
      return;
    }

    toggleConnection(target.id, kind, relationshipColors[kind].label);
    Alert.alert('Vínculo criado', `Você criou um vínculo de ${relationshipColors[kind].label} com ${target.name}.`);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.silver} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Solicitar acesso</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroWrap}>
          <Text style={styles.title}>Criar vínculo</Text>
          <Text style={styles.subtitle}>
            Escolha o tipo de vínculo que você quer estabelecer com{'\n'}
            <Text style={styles.targetName}>{target.name}</Text>.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de vínculo disponíveis</Text>

          {allowedKinds.map((kind) => {
            const relation = relationshipColors[kind];
            const color = relation?.color || colors.cyan;

            return (
              <TouchableOpacity
                key={kind}
                style={[
                  styles.kindCard,
                  {
                    borderColor: transparentColor(color, 0.4),
                    backgroundColor: transparentColor(color, 0.05),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleRequest(kind)}
              >
                <View
                  style={[
                    styles.kindIcon,
                    {
                      borderColor: color,
                      backgroundColor: transparentColor(color, 0.15),
                    },
                  ]}
                >
                  <Ionicons name={connectionIcon(kind)} size={22} color={color} />
                </View>

                <View style={styles.kindTextBox}>
                  <Text style={[styles.kindTitle, { color }]}>{relation.label}</Text>
                  <Text style={styles.kindSubtitle}>
                    {kind === 'family'
                      ? 'Requer confirmação dos dois lados.'
                      : 'Aceito automaticamente neste MVP.'}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.silver} />
          <Text style={styles.noteText}>
            O ELUS protege presença e dados. Apenas vínculos aceitos revelam mais informações do perfil.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topTitle: {
    color: colors.silver,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  heroWrap: { paddingHorizontal: 24, paddingVertical: 30 },
  title: { color: colors.white, fontSize: 28, fontWeight: '300' },
  subtitle: {
    color: colors.silver,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  targetName: { color: colors.white, fontWeight: '700' },
  section: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  kindCard: {
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  kindIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kindTextBox: { flex: 1 },
  kindTitle: { fontSize: 15, fontWeight: '800' },
  kindSubtitle: { color: colors.textTertiary, fontSize: 12, marginTop: 3 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    color: colors.silver,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    marginLeft: 8,
  },
  empty: { color: colors.silver, textAlign: 'center', marginTop: 40 },
});