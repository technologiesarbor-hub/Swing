/**
 * Tiny reanimated hook that produces a "screen content fades + slides in
 * by a hair" animated style every time a tab gains focus.
 *
 * Combined with the bottom tab bar's animated indicator and icon scaling,
 * this gives a clear "kuch hua, tab change ho gaya" feel — without needing
 * react-native-pager-view (which doesn't work inside Expo Go).
 *
 * Usage:
 *   const fadeStyle = useTabFocusFade();
 *   ...
 *   <Animated.View style={[styles.root, fadeStyle]}>...</Animated.View>
 */

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function useTabFocusFade() {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // Start a hair to the right + slightly transparent, then settle.
      opacity.value = 0.4;
      translateX.value = 12;
      opacity.value = withTiming(1, { duration: 260 });
      translateX.value = withTiming(0, { duration: 260 });
      // No cleanup — the next focus event resets the values.
    }, [opacity, translateX]),
  );

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));
}
