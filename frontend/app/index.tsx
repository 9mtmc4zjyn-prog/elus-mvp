import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { useTheme } from '../src/theme/ThemeContext';
import { Button } from '../src/components/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  useApp();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View
        style={[styles.backgroundGlow, { backgroundColor: colors.accentSoft }]}
      />

      <View style={styles.container}>
        <View style={styles.brandArea}>
          <View
            style={[
              styles.symbolHalo,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.border,
                shadowColor: colors.accent,
              },
            ]}
          >
            <View
              style={[
                styles.symbolRing,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image
                source={require('../assets/brand/elus_symbol_main_transparent.png')}
                style={styles.symbol}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={[styles.brandText, { color: colors.text }]}>E L U S</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>Conexões que importam.</Text>
        </View>

        <View
          style={[
            styles.pitchCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.pitchGlow, { backgroundColor: colors.accentSoft }]} />

          <Text style={[styles.pitchTitle, { color: colors.text }]}>
            Sua rede de conexões reais
          </Text>
          <Text style={[styles.pitchSubtitle, { color: colors.textMuted }]}>
            Organize relações, descubra vínculos e fortaleça conexões
            importantes.
          </Text>

          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.pillDotGold, { color: colors.goldVivid }]}>•</Text>
              <Text style={[styles.pillText, { color: colors.textMuted }]}>Identidade</Text>
            </View>

            <View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.pillDotCyan, { color: colors.cyanVivid }]}>•</Text>
              <Text style={[styles.pillText, { color: colors.textMuted }]}>Contexto</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Entrar" variant="primary" onPress={() => router.push('/login')} />
          <Button label="Criar conta" variant="secondary" onPress={() => router.push('/signup')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  backgroundGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: 80,
    alignSelf: 'center',
  },

  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },

  brandArea: {
    alignItems: 'center',
    marginTop: 46,
  },

  symbolHalo: {
    width: 178,
    height: 178,
    borderRadius: 89,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOpacity: 0.35,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 },
  },

  symbolRing: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  symbol: {
    width: 116,
    height: 116,
  },

  brandText: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 9,
    marginTop: 26,
  },

  tagline: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.3,
  },

  pitchCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    alignItems: 'center',
  },

  pitchGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    right: -70,
  },

  pitchTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
    letterSpacing: -0.4,
  },

  pitchSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: '600',
  },

  pillRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  pill: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 13,
    marginHorizontal: 5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  pillDotGold: {
    fontSize: 20,
    lineHeight: 20,
    marginRight: 7,
  },

  pillDotCyan: {
    fontSize: 20,
    lineHeight: 20,
    marginRight: 7,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '900',
  },

  actions: {
    gap: 14,
  },
});
