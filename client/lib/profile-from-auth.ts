/**
 * Map API auth user → local profile fields shown in the app.
 * Server-backed fields; status / local avatar stay in user-settings.
 */

import type { AuthUser } from '@/lib/api/auth-types';
import type { LocalUser } from '@/lib/user-settings-context';

export function ageFromDobIso(dobIso: string): number {
  const d = new Date(dobIso);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

/** Fields stored on the backend (PATCH /v1/me). */
export function authUserToLocalPatch(user: AuthUser): Partial<LocalUser> {
  const patch: Partial<LocalUser> = {
    email: user.email,
    name: user.name ?? '',
    username: user.username ?? '',
    bio: user.bio ?? '',
    interests: user.interests ?? '',
    city: user.city,
    country: user.country,
    dob: user.dob,
    gender: user.gender,
    joinedAt: user.createdAt,
  };
  if (user.dob) {
    patch.age = ageFromDobIso(user.dob);
  }
  if (user.avatarUrl) {
    patch.avatarUri = user.avatarUrl;
  }
  return patch;
}
