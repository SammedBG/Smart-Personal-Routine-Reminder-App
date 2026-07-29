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

import { register } from '../../api/authApi';
import { useTheme } from '../../theme/ThemeContext';
import type { AuthStackParamList } from '../../navigation/auth/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ email: email.trim(), password, full_name: fullName.trim() || undefined });
    } catch (e: any) {
      const serverMsg = e?.response?.data?.detail || e?.message;
      setError(serverMsg ? `Registration failed: ${serverMsg}` : 'Registration failed. Try a different email.');
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
        {/* Branding header */}
        <View style={styles.brandSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoIcon}>{'\u{23F0}'}</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>SmartRoutine</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '15' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.inputGroup, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>{'\u{1F464}'}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              value={fullName}
              onChangeText={setFullName}
              accessibilityLabel="Full name"
            />
          </View>
          <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>{'\u{2709}'}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="Email address"
            />
          </View>
          <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>{'\u{1F512}'}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password (min 8 chars)"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              accessibilityLabel="Password"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={loading ? 'Creating account' : 'Register'}>
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.link, { color: colors.primary }]}> Sign in</Text>
          </TouchableOpacity>
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
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  logoIcon: {
    fontSize: 28,
    color: '#fff',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  errorBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontWeight: '700',
    fontSize: 14,
  },
});

