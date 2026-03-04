import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@smart_routines_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  tabBarBg: string;
  headerBg: string;
  statusBarStyle: 'light-content' | 'dark-content';
};

const lightColors: ThemeColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3FF',
  text: '#1A1D26',
  textSecondary: '#5A6070',
  textTertiary: '#9098A8',
  primary: '#4F6DF0',
  primaryLight: '#E8EDFF',
  border: '#E2E5F0',
  danger: '#E94F4F',
  success: '#2AB77F',
  warning: '#F0983E',
  cardBg: '#FFFFFF',
  inputBg: '#F8F9FC',
  inputBorder: '#D8DCE8',
  tabBarBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  statusBarStyle: 'dark-content',
};

const darkColors: ThemeColors = {
  background: '#0F1117',
  surface: '#1A1D28',
  surfaceAlt: '#232738',
  text: '#EAECF2',
  textSecondary: '#9DA2B2',
  textTertiary: '#60667A',
  primary: '#6B8AFF',
  primaryLight: '#252D48',
  border: '#2A2E3E',
  danger: '#F06060',
  success: '#3DD99A',
  warning: '#F0A850',
  cardBg: '#1A1D28',
  inputBg: '#1F2230',
  inputBorder: '#3A3E50',
  tabBarBg: '#141620',
  headerBg: '#141620',
  statusBarStyle: 'light-content',
};

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: () => {},
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    }).catch(() => {});
  }, []);

  // Persist theme whenever it changes
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = isDark ? darkColors : lightColors;

  const toggle = useCallback(() => {
    setMode(
      mode === 'light' ? 'dark' : mode === 'dark' ? 'light' : isDark ? 'light' : 'dark',
    );
  }, [mode, isDark, setMode]);

  const value = useMemo(
    () => ({ mode, isDark, colors, setMode, toggle }),
    [mode, isDark, colors, setMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.headerBg}
      />
      {children}
    </ThemeContext.Provider>
  );
};
