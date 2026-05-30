/**
 * Authentication context — sits at the top of the provider tree and
 * exposes a tiny surface for sign-up / sign-in / sign-out flows.
 *
 * Phase A (now): the backend is a *mock* sitting on AsyncStorage. We
 * persist a "registry" of created accounts and a single active session
 * so the flow feels real (restart the app → still logged in) without
 * needing Firebase set up.
 *
 * Phase B (later): swap the bodies of `signUpWithEmail` /
 * `signInWithEmail` / `signInWithGoogle` / `signOut` to call the
 * Firebase SDK. The exported hook contract stays exactly the same so
 * UI screens don't need to change.
 *
 * Why this design:
 *   - Decouples UI from backend choice (Firebase / Supabase / custom)
 *   - Lets us click through the full registration journey today
 *   - Makes the Firebase swap a single-file change
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { z } from 'zod';

import {
  pseudoHash,
  readRegistry,
  readSession,
  type RegistryRecord,
  writeRegistry,
  writeSession,
} from '@/lib/auth-storage';

// ── Public types ──────────────────────────────────────────────────────────

/** Minimal auth identity. Profile data (name, DOB, gender, avatar,
 *  etc.) lives on `UserSettings.user` so the rest of the app keeps
 *  working unmodified. The `profileComplete` flag drives whether the
 *  user lands on /profile-setup vs the home tabs. */
export type AuthUser = {
  id: string;
  email: string;
  provider: 'password' | 'google';
  createdAt: string;
  /** Set to true once /profile-setup has been completed at least once. */
  profileComplete: boolean;
};

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signed-out'; user: null }
  | { status: 'signed-in'; user: AuthUser };

type AuthContextValue = AuthState & {
  signUpWithEmail: (email: string, password: string) => Promise<AuthUser>;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
  /** Mark profile-setup as complete; called by the profile-setup screen
   *  once the user taps "Let's fly". */
  markProfileComplete: () => Promise<void>;
};

// ── Validation ────────────────────────────────────────────────────────────
//
// We use `safeParse` (not `.parse`) so we never let zod throw a raw
// `ZodError` object into the UI — its `message` is a stringified JSON
// dump that's terrible to surface in a toast/alert. Instead we re-
// throw as `AuthError` with the first issue's friendly message.

export const emailSchema = z.email('Please enter a valid email');
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

function validateEmail(email: string): void {
  const result = emailSchema.safeParse(email.trim());
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Invalid email';
    throw new AuthError('INVALID_EMAIL', msg);
  }
}

function validatePassword(password: string): void {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    const msg =
      result.error.issues[0]?.message ?? 'Invalid password';
    throw new AuthError('INVALID_PASSWORD', msg);
  }
}

// ── Context plumbing ──────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });

  // Bootstrap from AsyncStorage on mount so a "logged-in" session
  // survives app restart.
  useEffect(() => {
    (async () => {
      const session = await readSession();
      setState(
        session
          ? { status: 'signed-in', user: session }
          : { status: 'signed-out', user: null },
      );
    })();
  }, []);

  // ── Mock backend operations ─────────────────────────────────────────────

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      validateEmail(email);
      validatePassword(password);

      const registry = await readRegistry();
      const lowered = email.trim().toLowerCase();

      if (registry.some((r) => r.email === lowered)) {
        throw new AuthError(
          'EMAIL_IN_USE',
          'An account with this email already exists. Try logging in.',
        );
      }

      const record: RegistryRecord = {
        id: `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        email: lowered,
        passwordHash: pseudoHash(password),
        provider: 'password',
        createdAt: new Date().toISOString(),
      };
      await writeRegistry([...registry, record]);

      const user: AuthUser = {
        id: record.id,
        email: record.email,
        provider: record.provider,
        createdAt: record.createdAt,
        profileComplete: false,
      };
      await writeSession(user);
      setState({ status: 'signed-in', user });
      return user;
    },
    [],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      validateEmail(email);
      validatePassword(password);

      const registry = await readRegistry();
      const lowered = email.trim().toLowerCase();
      const record = registry.find((r) => r.email === lowered);
      if (!record) {
        throw new AuthError(
          'USER_NOT_FOUND',
          'No account with this email. Create one?',
        );
      }
      if (record.passwordHash !== pseudoHash(password)) {
        throw new AuthError('WRONG_PASSWORD', 'Incorrect password.');
      }

      // For the mock backend we treat re-login as profile-complete if
      // the registry has any profile data attached — but since we
      // don't store profile data in the registry, we just persist the
      // last known `profileComplete` flag from the previous session.
      const previous = await readSession();
      const user: AuthUser = {
        id: record.id,
        email: record.email,
        provider: record.provider,
        createdAt: record.createdAt,
        profileComplete: previous?.id === record.id
          ? previous.profileComplete
          : true, // re-login on a fresh device skips setup
      };
      await writeSession(user);
      setState({ status: 'signed-in', user });
      return user;
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    // Mock: pretend we got a Google identity back. Real OAuth flow
    // happens in Phase B via @react-native-google-signin or
    // expo-auth-session. We fabricate a stable email for the mock so
    // re-tapping "Continue with Google" finds the same account.
    const mockEmail = 'you@google.swing.app';

    const registry = await readRegistry();
    let record = registry.find((r) => r.email === mockEmail);

    if (!record) {
      record = {
        id: `g_${Date.now()}`,
        email: mockEmail,
        passwordHash: '',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      await writeRegistry([...registry, record]);
    }

    const previous = await readSession();
    const user: AuthUser = {
      id: record.id,
      email: record.email,
      provider: 'google',
      createdAt: record.createdAt,
      // First Google login → profile-setup. Subsequent → straight to
      // home (if previously completed).
      profileComplete: previous?.id === record.id
        ? previous.profileComplete
        : false,
    };
    await writeSession(user);
    setState({ status: 'signed-in', user });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await writeSession(null);
    setState({ status: 'signed-out', user: null });
  }, []);

  const markProfileComplete = useCallback(async () => {
    setState((prev) => {
      if (prev.status !== 'signed-in') return prev;
      const next: AuthUser = { ...prev.user, profileComplete: true };
      // fire-and-forget persist
      writeSession(next).catch(() => {});
      return { status: 'signed-in', user: next };
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    if (state.status === 'loading') {
      return {
        status: 'loading',
        user: null,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        markProfileComplete,
      };
    }
    if (state.status === 'signed-out') {
      return {
        status: 'signed-out',
        user: null,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        markProfileComplete,
      };
    }
    return {
      status: 'signed-in',
      user: state.user,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      markProfileComplete,
    };
  }, [
    state,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    markProfileComplete,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ── Error type ────────────────────────────────────────────────────────────

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'EMAIL_IN_USE'
  | 'USER_NOT_FOUND'
  | 'WRONG_PASSWORD'
  | 'NETWORK'
  | 'UNKNOWN';

/** A typed auth error so screens can surface a precise message. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

/**
 * Turn any caught error into a string that's safe to render in the UI.
 *
 * Why this exists: zod's `.parse()` throws a `ZodError` whose
 * `.message` is the entire issue tree serialised as JSON — surfacing
 * that to a user looks like a JS stack trace. Same hazard with
 * arbitrary `Error.toString()` results. This helper:
 *   1. Prefers our typed `AuthError.message` (already user-friendly).
 *   2. Recognises a `ZodError` and uses its first issue's message.
 *   3. Falls back to `error.message` only if it looks like a plain
 *      sentence (short, no curly braces).
 *   4. Otherwise returns the provided fallback.
 */
export function humanizeAuthError(err: unknown, fallback: string): string {
  if (err instanceof AuthError) return err.message;
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? fallback;
  }
  if (err instanceof Error) {
    const m = err.message ?? '';
    // Heuristic: anything that *looks* like JSON or a stack frame is
    // almost certainly not meant for end users.
    if (m && m.length < 160 && !m.includes('{') && !m.includes('\n')) {
      return m;
    }
  }
  return fallback;
}
