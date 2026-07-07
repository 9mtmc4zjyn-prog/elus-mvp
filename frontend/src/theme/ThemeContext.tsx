// frontend/src/theme/ThemeContext.tsx
//
// Provider/hook de tema do app ELUS.
// Puramente aditivo: quem não usar useTheme() continua funcionando
// exatamente como antes, com suas próprias cores locais.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_THEME_MODE, THEMES, type ThemeColors, type ThemeMode } from './theme';

const THEME_STORAGE_KEY = 'elus_theme_mode';

interface ThemeContextValue {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;

        if (stored === 'hybrid' || stored === 'monoDark' || stored === 'monoLight') {
          setThemeModeState(stored);
        }
      })
      .catch(() => {
        // Mantém o tema padrão se a leitura falhar.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // Falha ao persistir não deve travar a troca de tema em memória.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      colors: THEMES[themeMode],
      setThemeMode,
    }),
    [themeMode, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme precisa ser usado dentro de ThemeProvider');
  }

  return context;
}
