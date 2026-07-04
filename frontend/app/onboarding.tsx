import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from './theme';

const { width } = Dimensions.get('window');

type IconName = ComponentProps<typeof Ionicons>['name'];

type OnboardingSlide = {
  icon: IconName;
  title: string;
  text: string;
};

const SLIDES: OnboardingSlide[] = [
  {
    icon: 'planet-outline',
    title: 'O ELUS mostra presenças reais ao seu redor.',
    text: 'Um campo humano vivo de pessoas, empresas, serviços e comunidades.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Você controla o que compartilha.',
    text: 'Cada informação fica protegida. Você decide quem pode ver o quê.',
  },
  {
    icon: 'layers-outline',
    title: 'Cada informação pode ser liberada por camada.',
    text: 'Da presença pública aos contatos privados, tudo em camadas progressivas.',
  },
  {
    icon: 'infinite-outline',
    title: 'Conecte necessidades, ofertas, pessoas e empresas.',
    text: 'Com mais segurança e contexto. Sem feed superficial. Sem ruído.',
  },
];

export default function Onboarding() {
  const router = useRouter();

  const [step, setStep] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);

    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fade, step]);

  function next() {
    if (step < SLIDES.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    router.replace('/signup' as never);
  }

  function skip() {
    router.replace('/login' as never);
  }

  const currentSlide = SLIDES[step];
  const isLastStep = step === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} testID="onboarding-screen">
      <View style={styles.top}>
        <TouchableOpacity
          testID="onboarding-skip"
          onPress={skip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.iconBox}>
          <Ionicons
            name={currentSlide.icon}
            size={32}
            color={colors.cyan}
          />
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.text}>{currentSlide.text}</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.progress}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[styles.bar, index === step && styles.barActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          testID="onboarding-next"
          style={styles.cta}
          onPress={next}
          activeOpacity={0.86}
        >
          <Text style={styles.ctaText}>
            {isLastStep ? 'Vamos começar' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
  },

  top: {
    paddingTop: 12,
    alignItems: 'flex-end',
  },

  skipText: {
    color: colors.silver,
    fontSize: 13,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(94,158,171,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94,158,171,0.25)',
    marginBottom: 32,
  },

  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '200',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.3,
  },

  text: {
    color: colors.silver,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '300',
    maxWidth: width - 80,
  },

  bottom: {
    paddingBottom: 28,
    alignItems: 'center',
  },

  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 22,
  },

  bar: {
    width: 26,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },

  barActive: {
    backgroundColor: colors.cyan,
  },

  cta: {
    backgroundColor: colors.cyan,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 56,
  },

  ctaText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});