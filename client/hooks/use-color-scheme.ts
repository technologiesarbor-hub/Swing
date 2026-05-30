/**
 * Drop-in replacement for RN's `useColorScheme()` that respects the
 * user's manual override in `UserSettingsContext`.
 *
 *   themePref === 'system' → follow the OS appearance
 *   themePref === 'light'  → always light
 *   themePref === 'dark'   → always dark
 *
 * Falling back to `'light'` keeps consumers simple (no `null` handling).
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

import { useUserSettings } from '@/lib/user-settings-context';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const { themePref } = useUserSettings();

  if (themePref === 'light') return 'light';
  if (themePref === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
