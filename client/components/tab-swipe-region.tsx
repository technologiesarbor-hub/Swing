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
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Tab order — must match (tabs)/_layout.tsx left-to-right.
const TAB_ROUTES = ['/', '/chats', '/send', '/travel', '/profile'] as const;
export type TabRoute = (typeof TAB_ROUTES)[number];

type Props = {
  currentRoute: TabRoute;
  children?: ReactNode;
  style?: ViewStyle;
};

export function TabSwipeRegion({ currentRoute, children, style }: Props) {
  const router = useRouter();
  const currentIndex = TAB_ROUTES.indexOf(currentRoute);

  const navigateTo = (offset: number) => {
    const target = currentIndex + offset;
    if (target < 0 || target >= TAB_ROUTES.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.navigate(TAB_ROUTES[target] as any);
  };

  // Tuned thresholds:
  //   activeOffsetX [-14, 14] → kicks in after 14px horizontal travel
  //                             (snappier than before, still ignores taps)
  //   failOffsetY  [-12, 12]  → bails if movement is mostly vertical
  //   onEnd threshold = 36px → past 36px OR fast velocity → commit
  //
  // We also commit on flick velocity so a quick flick over a small distance
  // still switches tabs (Instagram-like feel).
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

  // IMPORTANT: do NOT default `style` to `{ flex: 1 }`. Consumers that
  // wrap full-screen content pass `{ flex: 1 }` explicitly; consumers that
  // wrap a fixed-height band (a header, a dots row) want natural sizing.
  // Defaulting to flex:1 caused fixed-height wrappers to greedily consume
  // half the screen and push centered content out of position.
  return (
    <GestureDetector gesture={pan}>
      <View style={style}>{children}</View>
    </GestureDetector>
  );
}
