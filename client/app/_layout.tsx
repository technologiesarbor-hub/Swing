import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDismissKeyboardOnBackground } from '@/hooks/use-dismiss-keyboard-on-background';
import { AuthProfileSync } from '@/components/auth-profile-sync';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ChatsProvider } from '@/lib/chats-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { PlaneBalanceProvider } from '@/lib/plane-balance-context';
import { SentPlanesProvider } from '@/lib/sent-planes-context';
import { UserSettingsProvider } from '@/lib/user-settings-context';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    // `GestureHandlerRootView` must wrap the entire app for the tab-swipe
    // regions to receive touch events.
    //
    // Provider order matters:
    //   AuthProvider → UserSettings → ThemedRoot
    // because the auth guard inside ThemedRoot needs to read auth
    // status, and UserSettings supplies the theme override used by
    // useColorScheme().
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserSettingsProvider>
          <AuthProfileSync />
          <ThemedRoot />
        </UserSettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out from `RootLayout` so we can call `useColorScheme()`
 * (which depends on `UserSettingsProvider`) inside the React tree.
 */
function ThemedRoot() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];
  // Dismiss any focused input + keyboard the moment the app leaves the
  // foreground — fixes the "input glitches on resume" bug.
  useDismissKeyboardOnBackground();
  // Auth routing — sends unauthenticated users into /(auth)/splash and
  // pulls authenticated ones back to /(tabs).
  const { status, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'signed-out' && !inAuthGroup) {
      // Not logged in but trying to view the app → start onboarding.
      router.replace('/(auth)/splash');
      return;
    }
    if (status === 'signed-in' && inAuthGroup) {
      // Already logged in but stuck in the auth stack — bounce them
      // out. Profile-setup is the one allowed auth-group route post-
      // signin (when the profile is not complete yet).
      const currentRoute = (segments as readonly string[])[1];
      if (user.profileComplete) {
        router.replace('/(tabs)');
      } else if (currentRoute !== 'profile-setup') {
        router.replace('/(auth)/profile-setup');
      }
    }
  }, [status, user, segments, router]);

  // While we resolve the saved session, show a tiny holding screen so
  // we don't flash content from the wrong stack.
  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={c.tint} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NotificationsProvider>
        <PlaneBalanceProvider>
          <SentPlanesProvider>
            <ChatsProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                {/* Onboarding stack — splash / signup / signin / profile-setup */}
                <Stack.Screen name="(auth)" />

                {/* Plane detail — pushed via router.push('/plane/p1') */}
                <Stack.Screen
                  name="plane/[id]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Sender profile — opened by tapping a card's avatar */}
                <Stack.Screen
                  name="profile/[userId]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Own-profile edit screen */}
                <Stack.Screen
                  name="profile/edit"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Chat thread — opened by tapping a chat row, or on accept */}
                <Stack.Screen
                  name="chat/[chatId]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Notifications list — opened by the bell in home header */}
                <Stack.Screen
                  name="notifications"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Outbox of every plane the user has sent. */}
                <Stack.Screen
                  name="planes"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Settings — opened from the profile screen */}
                <Stack.Screen
                  name="settings"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Status (Insta/WhatsApp-style story uploader) — opened
                    from the "+" profile icon on the chats header. */}
                <Stack.Screen
                  name="status"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                {/* Story viewer — opened by tapping a partner's status
                    ring in the chats list. Modal-ish fade transition so
                    it feels like Instagram. */}
                <Stack.Screen
                  name="story/[userId]"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    headerShown: false,
                    statusBarStyle: 'light',
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
            </ChatsProvider>
          </SentPlanesProvider>
        </PlaneBalanceProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}
