import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';

export default function WelcomeScreen() {
  const router = useRouter();
  useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <View style={styles.backgroundGlowThree} />

      <View style={styles.container}>
        <View style={styles.brandArea}>
          <View style={styles.symbolHalo}>
            <View style={styles.symbolRing}>
              <Image
                source={require('../assets/brand/elus_symbol_main_transparent.png')}
                style={styles.symbol}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.brandText}>E L U S</Text>
          <Text style={styles.tagline}>Conexões que importam.</Text>
        </View>

        <View style={styles.pitchCard}>
          <View style={styles.pitchGlow} />

          <Text style={styles.pitchTitle}>Sua rede de conexões reais</Text>
          <Text style={styles.pitchSubtitle}>
            Organize relações, descubra vínculos e fortaleça conexões
            importantes.
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillDotGold}>•</Text>
              <Text style={styles.pillText}>Identidade</Text>
            </View>

            <View style={styles.pill}>
              <Text style={styles.pillDotCyan}>•</Text>
              <Text style={styles.pillText}>Contexto</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/signup')}
            activeOpacity={0.78}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#03040A',
  },

  backgroundGlowOne: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(45,100,255,0.16)',
    top: 80,
    alignSelf: 'center',
  },

  backgroundGlowTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(139,92,255,0.12)',
    top: 230,
    right: -130,
  },

  backgroundGlowThree: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(38,217,255,0.07)',
    bottom: 70,
    left: -140,
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
    backgroundColor: 'rgba(45,100,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(143,179,255,0.16)',
    shadowColor: '#2D64FF',
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
    backgroundColor: 'rgba(3,4,10,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  symbol: {
    width: 116,
    height: 116,
  },

  brandText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 9,
    marginTop: 26,
  },

  tagline: {
    color: 'rgba(255,255,255,0.62)',
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
    backgroundColor: 'rgba(12,15,27,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },

  pitchGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(45,100,255,0.12)',
    top: -120,
    right: -70,
  },

  pitchTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
    letterSpacing: -0.4,
  },

  pitchSubtitle: {
    fontSize: 16,
    color: 'rgba(210,218,236,0.78)',
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  pillDotGold: {
    color: '#D9B46A',
    fontSize: 20,
    lineHeight: 20,
    marginRight: 7,
  },

  pillDotCyan: {
    color: '#26D9FF',
    fontSize: 20,
    lineHeight: 20,
    marginRight: 7,
  },

  pillText: {
    color: 'rgba(210,218,236,0.86)',
    fontSize: 12,
    fontWeight: '900',
  },

  actions: {
    gap: 14,
  },

  primaryButton: {
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2D64FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D64FF',
    shadowOpacity: 0.52,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  secondaryButton: {
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});