import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_tokens';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const result = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!result) return null;
  try {
    return JSON.parse(result) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}


