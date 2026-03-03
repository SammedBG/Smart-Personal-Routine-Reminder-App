import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { login } from '../../api/authApi';
import { useTheme } from '../../theme/ThemeContext';
import type { AuthStackParamList } from '../../navigation/auth/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError('Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput
          style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBg }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email address"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBg }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Password"
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={loading ? 'Logging in' : 'Login'}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Don&apos;t have an account?</Text>
          <Text
            style={[styles.link, { color: colors.primary }]}
            onPress={() => navigation.navigate('Register')}
            accessibilityRole="link">
            Sign up
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  error: {
    color: '#d9534f',
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  link: {
    fontWeight: '600',
  },
});

