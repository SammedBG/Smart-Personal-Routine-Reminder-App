import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';
import { saveTokens, clearTokens, loadTokens } from '../services/SecureStorage';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
};

type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type User = {
  id: string;
  email: string;
  full_name?: string | null;
};

export async function login(payload: LoginPayload): Promise<void> {
  const tokenPair = await apiClient.post<TokenPair>('/auth/login', payload).then((r) => r.data);
  const user = await apiClient
    .get<User>('/users/me', {
      headers: { Authorization: `Bearer ${tokenPair.access_token}` },
    })
    .then((r) => r.data);

  useAuthStore.getState().setSession(user, tokenPair.access_token, tokenPair.refresh_token);
  await saveTokens({ accessToken: tokenPair.access_token, refreshToken: tokenPair.refresh_token });
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post('/auth/register', payload);
  await login({ email: payload.email, password: payload.password });
}

export async function restoreSessionFromStorage(): Promise<void> {
  const stored = await loadTokens();
  if (!stored) return;
  try {
    const user = await apiClient
      .get<User>('/users/me', {
        headers: { Authorization: `Bearer ${stored.accessToken}` },
      })
      .then((r) => r.data);
    useAuthStore.getState().setSession(user, stored.accessToken, stored.refreshToken);
  } catch {
    await clearTokens();
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore network/logout errors
  } finally {
    useAuthStore.getState().clearSession();
    await clearTokens();
  }
}


