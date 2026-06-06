/**
 * Persist auth tokens in the device secure store (not AsyncStorage).
 */

import * as SecureStore from 'expo-secure-store';

// SecureStore keys: only [A-Za-z0-9._-] — no slashes (expo-secure-store rejects them).
const ACCESS_KEY = 'swing.auth.access';
const REFRESH_KEY = 'swing.auth.refresh';

export async function readTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function writeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
