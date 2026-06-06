/**
 * Keeps user-settings profile fields in sync with /v1/me when signed in.
 * Preferences + client-only fields (status, local avatar) are untouched.
 */

import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';
import { authUserToLocalPatch } from '@/lib/profile-from-auth';
import { useUserSettings } from '@/lib/user-settings-context';

export function AuthProfileSync() {
  const auth = useAuth();
  const { updateUser } = useUserSettings();

  useEffect(() => {
    if (auth.status !== 'signed-in' || !auth.user) return;
    updateUser(authUserToLocalPatch(auth.user));
  }, [auth.status, auth.user, updateUser]);

  return null;
}
