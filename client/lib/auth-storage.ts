/**
 * Thin AsyncStorage wrapper used by the auth layer.
 *
 * Why this lives separately from `auth-context`:
 *   - Keeps the context file focused on React state + lifecycle.
 *   - Lets us mock storage in tests by stubbing this module.
 *   - When we swap the mock backend for Firebase (Phase B), only
 *     `auth-context.tsx` changes — the persistence keys / shape stay
 *     here so any other module that needs to read the saved session
 *     (e.g. analytics warm-up) doesn't break.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser } from '@/lib/auth-context';

/** Single AsyncStorage namespace for the entire app. */
const PREFIX = 'swing/v1';

export const STORAGE_KEYS = {
  /** Active session — the currently signed-in user, or absent. */
  session: `${PREFIX}/auth/session`,
  /** Mock backend: array of every "registered" user (email + hashed
   *  password). Replace with Firebase Auth in Phase B. */
  registry: `${PREFIX}/auth/registry`,
} as const;

/** Stored user — the auth identity. Profile fields (name, DOB, gender,
 *  avatar, interests…) live on the `UserSettings` user object so the
 *  rest of the app keeps working unchanged. */
export type StoredSession = AuthUser;

/** Internal record shape persisted in the mock registry. */
export type RegistryRecord = {
  id: string;
  email: string;
  /** Pseudo-hashed — see `pseudoHash` below. NOT cryptographically
   *  secure; only there so a casual dev tool peek doesn't expose
   *  passwords. Real auth runs through Firebase in Phase B. */
  passwordHash: string;
  /** Created via "Continue with Google" — no password. */
  provider: 'password' | 'google';
  createdAt: string;
};

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession | null) {
  if (session) {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.session);
  }
}

export async function readRegistry(): Promise<RegistryRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.registry);
    return raw ? (JSON.parse(raw) as RegistryRecord[]) : [];
  } catch {
    return [];
  }
}

export async function writeRegistry(records: RegistryRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.registry, JSON.stringify(records));
}

/** Toy obfuscation — NOT a real password hash. Replace with Firebase
 *  Auth (which never exposes raw passwords to the client) in Phase B. */
export function pseudoHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // 32-bit int
  }
  return `mock_${h.toString(36)}_${input.length}`;
}
