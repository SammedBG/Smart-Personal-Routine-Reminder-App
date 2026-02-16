import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'auth_tokens';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword('auth', JSON.stringify(tokens), {
    service: TOKEN_KEY,
  });
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const result = await Keychain.getGenericPassword({ service: TOKEN_KEY });
  if (!result) return null;
  try {
    return JSON.parse(result.password) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_KEY });
}

