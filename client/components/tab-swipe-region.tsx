/**
 * Transparent wrapper that turns any region into a "swipe to switch tab"
 * surface. Drop it anywhere on a tab screen and a horizontal pan over
 * its area jumps to the previous / next tab.
 *
 * This is the Expo-Go-friendly alternative to MaterialTopTabs+PagerView
 * (which would need a custom dev build to ship the native pager module).
 * The transition itself is instant, but the bottom tab bar's animated
 * indicator slides smoothly between cells and each tab's content fades
 * in via Reanimated layout animations — that combination gives a clear
 * "this is a tab switch" feel.
 *
 * Designed to coexist with horizontally-scrolling content inside it
 * (e.g. a `FlatList pagingEnabled`): the native ScrollView wins
 * touches that start on its area, while the pan gesture only fires on
 * surrounding space. To keep that promise, do NOT wrap a horizontal
 * FlatList directly — instead place TabSwipeRegions above/below/around
 * it as separate siblings.
 *
 * Tab order is kept in `TAB_ROUTES`. Edit that constant if you reorder
 * tabs in `(tabs)/_layout.tsx`.
 *
 * Usage:
 *   <TabSwipeRegion currentRoute="/" style={{ flex: 1 }}>
 *     {...content...}
 *   </TabSwipeRegion>
 */

import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Tab order — must match (tabs)/_layout.tsx left-to-right.
export const TAB_ROUTES = ['/', '/chats', '/send', '/travel', '/profile'] as const;
export type TabRoute = (typeof TAB_ROUTES)[number];

type Props = {
  currentRoute: TabRoute;
  children?: ReactNode;
  style?: ViewStyle;
  /**
   * When the child is a RNGH `FlatList` / `ScrollView`, set this so
   * horizontal tab swipes and vertical list scroll work together.
   */
  withNativeScroll?: boolean;
};

export function TabSwipeRegion({
  currentRoute,
  children,
  style,
  withNativeScroll,
}: Props) {
  const router = useRouter();
  const currentIndex = TAB_ROUTES.indexOf(currentRoute);

  const gesture = useMemo(() => {
    const navigateTo = (offset: number) => {
      const target = currentIndex + offset;
      if (target < 0 || target >= TAB_ROUTES.length) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.navigate(TAB_ROUTES[target] as any);
    };

    const pan = Gesture.Pan()
      .activeOffsetX([-14, 14])
      .failOffsetY([-12, 12])
      .onEnd((e) => {
        'worklet';
        const SWIPE_DIST = 36;
        const FLICK_VEL = 600;
        if (
          e.translationX < -SWIPE_DIST ||
          (e.velocityX < -FLICK_VEL && e.translationX < -10)
        ) {
          runOnJS(navigateTo)(1);
        } else if (
          e.translationX > SWIPE_DIST ||
          (e.velocityX > FLICK_VEL && e.translationX > 10)
        ) {
          runOnJS(navigateTo)(-1);
        }
      });

    if (!withNativeScroll) return pan;
    return Gesture.Simultaneous(pan, Gesture.Native());
  }, [currentIndex, router, withNativeScroll]);

  // IMPORTANT: do NOT default `style` to `{ flex: 1 }`. Consumers that
  // wrap full-screen content pass `{ flex: 1 }` explicitly; consumers that
  // wrap a fixed-height band (a header, a dots row) want natural sizing.
  return (
    <GestureDetector gesture={gesture}>
      <View style={style}>{children}</View>
    </GestureDetector>
  );
}
