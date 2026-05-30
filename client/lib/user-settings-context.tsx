/**
 * App-wide user preferences — sound, theme, push-notifications,
 * plus a stub user profile until the backend is wired up.
 *
 * Why a single context?
 *   - All of these are tiny pieces of state read all over the app
 *     (theme by every screen, sound by composer / call screens, etc.).
 *     One provider keeps it simple.
 *
 * Note: persistence (AsyncStorage / SecureStore) is intentionally
 * skipped for MVP — values reset between app launches. Wire up
 * `expo-secure-store` once the account flow lands.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export type LocalUser = {
  id: 'me';
  name: string;
  username: string;
  /** Short bio shown on the profile — Insta calls this "bio", we call it
   *  "status" in the edit form because it doubles as a vibe. */
  bio: string;
  /** Optional local file URI of the avatar (set by the image picker on
   *  the profile screen). Falls back to a coloured initial when empty. */
  avatarUri?: string;
  city?: string;
  country?: string;
  /** Date of birth (ISO yyyy-mm-dd). When set, `age` is derived from this
   *  and the explicit `age` field is kept around only for legacy reads. */
  dob?: string;
  age?: number;
  interests?: string[];
  joinedAt: string; // ISO

  // ── Account info shown on the edit-profile screen ──────────────────
  phone?: string;
  email?: string;

  // ── Story (WhatsApp/Insta-style ephemeral upload) ──────────────────
  /** Posted status slides — every entry is one "frame" of the user's
   *  story. Insta-style: tapping the user's avatar would play them in
   *  order. Triggers a colored ring around the avatar everywhere when
   *  non-empty. We keep them client-side for now — real expiry / sync
   *  lives on the backend. */
  statusItems?: StatusItem[];

  /** Status slides the user has picked from the gallery but hasn't
   *  uploaded yet. We hold them in the user object (rather than local
   *  component state in the status screen) so they survive navigating
   *  away from the screen and back — the user can keep adding drafts
   *  across multiple visits before tapping Upload. */
  statusDrafts?: StatusDraft[];
};

export type StatusItem = {
  /** Local file URI of the media. */
  uri: string;
  /** image or video — drives the preview renderer. */
  kind: 'image' | 'video';
  /** ISO timestamp of when this slide was posted. Used for the
   *  "posted 5m ago" chip + future 24h auto-expiry. */
  postedAt: string;
};

export type StatusDraft = {
  uri: string;
  kind: 'image' | 'video';
};

type UserSettingsContextValue = {
  // Preferences
  sound: boolean;
  setSound: (v: boolean) => void;
  pushNotifications: boolean;
  setPushNotifications: (v: boolean) => void;
  themePref: ThemePreference;
  setThemePref: (v: ThemePreference) => void;

  // Local user (until auth lands)
  user: LocalUser;
  updateUser: (patch: Partial<LocalUser>) => void;

  /** Stub — wipes context state and would call the auth/delete endpoint
   *  in a real build. */
  deleteAccount: () => void;
};

const DEFAULT_USER: LocalUser = {
  id: 'me',
  name: 'Rahul',
  username: 'rahul',
  bio: 'Sending paper planes into the wind ✈️',
  city: 'Bengaluru',
  country: 'India',
  dob: '2001-08-15',
  age: 24,
  interests: ['music', 'late-night walks', 'photography', 'philosophy'],
  joinedAt: '2026-04-01T00:00:00Z',
  phone: '+91 99999 88888',
  email: 'rahul@swing.app',
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [themePref, setThemePref] = useState<ThemePreference>('system');
  const [user, setUser] = useState<LocalUser>(DEFAULT_USER);

  const updateUser = useCallback((patch: Partial<LocalUser>) => {
    setUser((u) => ({ ...u, ...patch }));
  }, []);

  const deleteAccount = useCallback(() => {
    // TODO: call auth/delete endpoint when backend is wired up.
    // For now just reset the in-memory state.
    setUser(DEFAULT_USER);
    setSound(true);
    setPushNotifications(true);
    setThemePref('system');
  }, []);

  const value = useMemo<UserSettingsContextValue>(
    () => ({
      sound,
      setSound,
      pushNotifications,
      setPushNotifications,
      themePref,
      setThemePref,
      user,
      updateUser,
      deleteAccount,
    }),
    [sound, pushNotifications, themePref, user, updateUser, deleteAccount],
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): UserSettingsContextValue {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) {
    throw new Error(
      'useUserSettings must be used inside <UserSettingsProvider>',
    );
  }
  return ctx;
}
