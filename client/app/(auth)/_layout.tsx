/**
 * Stack layout for the unauthenticated journey:
 *   /(auth)/splash         → 3s logo screen, then signup
 *   /(auth)/signup         → email/password/Google form
 *   /(auth)/signin         → existing-user login
 *   /(auth)/profile-setup  → first-time profile setup after signup
 *
 * The root layout's AuthGuard is responsible for sending unauthenticated
 * users INTO this group; this file just configures the stack itself
 * (no headers, custom back gestures, etc.).
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // no swipe-back during onboarding
        animation: 'fade',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
