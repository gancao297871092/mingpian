import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themeColor } from '@/utils/screenUtils';
import { useThemeStore } from '@/store/theme';
export type { ThemeMode } from '@/store/theme';

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  subText: string;
  placeholder: string;
  border: string;
  danger: string;
}

export interface Theme extends ThemeColors {
  dark: boolean;
}

const lightColors: ThemeColors = {
  primary: themeColor,
  background: '#ffffff',
  card: '#F9F9FC',
  text: '#121212',
  subText: '#666666',
  placeholder: '#999999',
  border: '#e0e0e0',
  danger: '#FF4757',
};

const darkColors: ThemeColors = {
  primary: themeColor,
  background: '#121212',
  card: '#1E1E24',
  text: '#F5F5F5',
  subText: '#A0A0A0',
  placeholder: '#666666',
  border: '#333333',
  danger: '#FF6B6B',
};

const defaultTheme: Theme = { ...lightColors, dark: false };

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode = useThemeStore(s => s.mode);
  const theme = useMemo<Theme>(() => {
    const dark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
    const colors = dark ? darkColors : lightColors;
    return { ...colors, dark };
  }, [mode, scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useThemeMode() {
  const mode = useThemeStore(s => s.mode);
  const setMode = useThemeStore(s => s.setMode);
  return { mode, setMode };
}
