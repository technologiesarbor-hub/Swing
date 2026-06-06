/**
 * App-wide user preferences — sound, theme, push-notifications,
 * plus a stub user profile until the backend is wired up.
 *
 * Why a single context?
 *   - All of these are tiny pieces of state read all over the app
 *     (theme by every screen, sound by composer / call screens, etc.).
 *     One provider keeps it simple.
 *
 * Profile + preferences persist to AsyncStorage so onboarding
 * details survive app restarts. Auth session is separate
 * (`auth-context`); this store is the local user profile blob.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { joinInterests } from '@/lib/interests';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  gender?: 'M' | 'F' | 'NB';
  /** Comma-separated hashtags stored on the server, e.g. "music,travel". */
  interests?: string;
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
  /** Server status row id (when synced from API). */
  id?: string;
  /** View URL — local file:// while drafting, presigned/CDN when posted. */
  uri: string;
  /** R2 object key for re-fetching a presigned view URL. */
  mediaKey?: string;
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

/** Fresh-install profile — almost everything is empty so the
 *  onboarding screens fill it in. We keep stable identity fields (id,
 *  joinedAt) populated so the rest of the app has something to render
 *  even before /profile-setup completes. */
const DEFAULT_USER: LocalUser = {
  id: 'me',
  name: '',
  username: '',
  bio: '',
  interests: '',
  joinedAt: new Date().toISOString(),
};

const PROFILE_KEY = 'swing/v1/user/profile';
const PREFS_KEY = 'swing/v1/user/prefs';

type StoredPrefs = {
  sound: boolean;
  pushNotifications: boolean;
  themePref: ThemePreference;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [themePref, setThemePref] = useState<ThemePreference>('system');
  const [user, setUser] = useState<LocalUser>(DEFAULT_USER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profileRaw, prefsRaw] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(PREFS_KEY),
        ]);
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw) as LocalUser & {
            interests?: string | string[];
          };
          const interests =
            typeof parsed.interests === 'string'
              ? parsed.interests
              : Array.isArray(parsed.interests)
                ? joinInterests(parsed.interests)
                : '';
          setUser({ ...DEFAULT_USER, ...parsed, id: 'me', interests });
        }
        if (prefsRaw) {
          const p = JSON.parse(prefsRaw) as StoredPrefs;
          if (typeof p.sound === 'boolean') setSound(p.sound);
          if (typeof p.pushNotifications === 'boolean') {
            setPushNotifications(p.pushNotifications);
          }
          if (p.themePref) setThemePref(p.themePref);
        }
      } catch {
        /* keep defaults */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(user)).catch(() => {});
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const prefs: StoredPrefs = { sound, pushNotifications, themePref };
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [sound, pushNotifications, themePref, hydrated]);

  const updateUser = useCallback((patch: Partial<LocalUser>) => {
    setUser((u) => ({ ...u, ...patch }));
  }, []);

  const deleteAccount = useCallback(() => {
    setUser(DEFAULT_USER);
    setSound(true);
    setPushNotifications(true);
    setThemePref('system');
    AsyncStorage.multiRemove([PROFILE_KEY, PREFS_KEY]).catch(() => {});
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
