import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChatsProvider } from '@/lib/chats-context';
import { PlaneBalanceProvider } from '@/lib/plane-balance-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // GestureHandlerRootView is required for `react-native-gesture-handler`
    // (used by the tab-swipe regions on each screen) to receive touch events.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PlaneBalanceProvider>
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
              {/* Chat thread — opened by tapping a chat row, or on accept */}
              <Stack.Screen
                name="chat/[chatId]"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ChatsProvider>
        </PlaneBalanceProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
