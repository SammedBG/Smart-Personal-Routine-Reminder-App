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
  background: '#f7f8fc',
  surface: '#ffffff',
  surfaceAlt: '#f0f6ff',
  text: '#222222',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#4A90D9',
  primaryLight: '#e8ecf4',
  border: '#e0e0e0',
  danger: '#d9534f',
  success: '#27ae60',
  warning: '#e67e22',
  cardBg: '#ffffff',
  inputBg: '#fafafa',
  inputBorder: '#dddddd',
  tabBarBg: '#ffffff',
  headerBg: '#ffffff',
  statusBarStyle: 'dark-content',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceAlt: '#252836',
  text: '#e8e8e8',
  textSecondary: '#a0a0a0',
  textTertiary: '#707070',
  primary: '#5a9ee6',
  primaryLight: '#2a3040',
  border: '#333333',
  danger: '#e5534b',
  success: '#3fb950',
  warning: '#d29922',
  cardBg: '#1e1e1e',
  inputBg: '#252525',
  inputBorder: '#444444',
  tabBarBg: '#1a1a1a',
  headerBg: '#1a1a1a',
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
