import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDismissKeyboardOnBackground } from '@/hooks/use-dismiss-keyboard-on-background';
import { ChatsProvider } from '@/lib/chats-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { PlaneBalanceProvider } from '@/lib/plane-balance-context';
import { SentPlanesProvider } from '@/lib/sent-planes-context';
import { UserSettingsProvider } from '@/lib/user-settings-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    // `GestureHandlerRootView` must wrap the entire app for the tab-swipe
    // regions to receive touch events.
    //
    // `UserSettingsProvider` is the outermost data provider because the
    // theme override (`themePref`) needs to be readable by the
    // `ThemeProvider` below — see `<ThemedRoot/>`.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserSettingsProvider>
        <ThemedRoot />
      </UserSettingsProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out from `RootLayout` so we can call `useColorScheme()`
 * (which depends on `UserSettingsProvider`) inside the React tree.
 */
function ThemedRoot() {
  const colorScheme = useColorScheme();
  // Dismiss any focused input + keyboard the moment the app leaves the
  // foreground — fixes the "input glitches on resume" bug.
  useDismissKeyboardOnBackground();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NotificationsProvider>
        <PlaneBalanceProvider>
          <SentPlanesProvider>
            <ChatsProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />

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
              </Stack>
              <StatusBar style="auto" />
            </ChatsProvider>
          </SentPlanesProvider>
        </PlaneBalanceProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}
