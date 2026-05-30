/**
 * Home screen — the inbox of received paper planes.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │ Swing ✈            🔔(3)    │  header
 *   │                             │
 *   │  ←  ┌────────────────┐  →   │  card carousel (fixed height)
 *   │     │   plane card   │      │  side arrows enable when applicable
 *   │     └────────────────┘      │
 *   │     ─── • • • • ───         │  animated page dots (smooth slide)
 *   │                             │
 *   └─────────────────────────────┘
 *
 * Card carousel uses a horizontal `Animated.FlatList`. `scrollX` (shared
 * value) drives the page-dot animation in real time so the active dot
 * smoothly slides between positions, not snap.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaneCard } from '@/components/plane-card';
import { TabSwipeRegion } from '@/components/tab-swipe-region';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTabFocusFade } from '@/hooks/use-tab-focus-fade';
import { useChats } from '@/lib/chats-context';
import { MOCK_PLANES } from '@/lib/mock-planes';
import type { Plane } from '@/types/plane';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Plane>);

const CARD_HORIZONTAL_PADDING = Spacing.xl;
const CARD_AREA_HEIGHT = 480;

// Static positions for the 5 dots in the logo's curvy trail.
const LOGO_TRAIL_DOTS = [
  { x: 0, y: 7 },
  { x: 5, y: 3 },
  { x: 11, y: 1 },
  { x: 17, y: 3 },
  { x: 22, y: 7 },
] as const;

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Plane>>(null);
  const [index, setIndex] = useState(0);
  const fadeStyle = useTabFocusFade();
  const router = useRouter();
  const { acceptPlane, chats } = useChats();
  // Locally rejected ids; combined with accepted-sender ids (derived from
  // `chats`) to filter the inbox. Using `chats` as part of the source of
  // truth means accepts done from the plane-detail screen also propagate
  // back here automatically.
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(() => new Set());
  const acceptedSenderIds = useMemo(
    () => new Set(chats.map((c) => c.partner.id)),
    [chats],
  );
  const visiblePlanes = useMemo<Plane[]>(
    () =>
      MOCK_PLANES.filter(
        (p) => !rejectedIds.has(p.id) && !acceptedSenderIds.has(p.sender.id),
      ),
    [rejectedIds, acceptedSenderIds],
  );

  const openPlane = (plane: Plane) => {
    router.push(`/plane/${plane.id}`);
  };

  const openProfile = (plane: Plane) => {
    router.push(`/profile/${plane.sender.id}`);
  };

  const handleAccept = (plane: Plane) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const chat = acceptPlane(plane);
    router.push(`/chat/${chat.id}`);
  };

  const handleReject = (plane: Plane) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.add(plane.id);
      return next;
    });
    // Keep the carousel index sensible after removal.
    setIndex((i) => Math.max(0, Math.min(i, visiblePlanes.length - 2)));
  };

  // Live horizontal scroll offset. Drives the animated page dots so they
  // slide smoothly while the user is still dragging.
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const total = visiblePlanes.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goPrev = () => {
    if (!hasPrev) return;
    listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  };

  const goNext = () => {
    if (!hasNext) return;
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      {/* Header is its own tab-swipe region. The card carousel below has
          its own horizontal FlatList for card-by-card swiping, so wrapping
          it in TabSwipeRegion would fight the FlatList's pan. Wrapping the
          header + dots as separate swipe regions gives the user "swipe
          anywhere except on a card to change tab" — Instagram-style. */}
      <TabSwipeRegion currentRoute="/">
        <Animated.View style={[styles.header, fadeStyle]}>
          <View style={styles.brand}>
            <ThemedText style={styles.brandText}>Swing</ThemedText>
            <View style={styles.brandTrail}>
              {LOGO_TRAIL_DOTS.map((dot, i) => (
                <View
                  key={i}
                  style={[
                    styles.brandTrailDot,
                    {
                      backgroundColor: c.tint,
                      left: dot.x,
                      top: dot.y,
                    },
                  ]}
                />
              ))}
            </View>
            <Ionicons name="paper-plane" size={18} color={c.tint} />
          </View>

          <Pressable hitSlop={10} style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={24} color={c.text} />
            <View style={[styles.badge, { backgroundColor: c.danger }]}>
              <ThemedText style={styles.badgeText}>3</ThemedText>
            </View>
          </Pressable>
        </Animated.View>
      </TabSwipeRegion>

      {/* Body fills the space between header and bottom-tab-bar, and
          vertically centres the (carousel + dots) block inside it. */}
      <View style={styles.body}>
      {/* Card carousel — horizontal paged FlatList. */}
      <View style={styles.carouselContainer}>
        {visiblePlanes.length === 0 ? (
          <View style={styles.emptyInbox}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="paper-plane-outline" size={40} color={c.textSubtle} />
            </View>
            <ThemedText style={styles.emptyTitle}>Inbox empty</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: c.textMuted }]}>
              New paper planes will land here as people send them your way.
            </ThemedText>
          </View>
        ) : (
          <AnimatedFlatList
            ref={listRef as React.RefObject<FlatList<Plane>>}
            data={visiblePlanes}
            keyExtractor={(p) => p.id}
            extraData={visiblePlanes.length}
            renderItem={({ item }) => (
              <View style={[styles.page, { width }]}>
                <PlaneCard
                  plane={item}
                  onOpen={openPlane}
                  onOpenProfile={openProfile}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumEnd}
            decelerationRate="fast"
          />
        )}

        <Pressable
          onPress={goPrev}
          disabled={!hasPrev}
          hitSlop={12}
          style={[
            styles.sideArrow,
            styles.prevArrow,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: hasPrev ? 1 : 0.35,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={c.textMuted} />
        </Pressable>

        <Pressable
          onPress={goNext}
          disabled={!hasNext}
          hitSlop={12}
          style={[
            styles.sideArrow,
            styles.nextArrow,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: hasNext ? 1 : 0.35,
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={22} color={c.textMuted} />
        </Pressable>
      </View>

      {/* Animated page dots — each dot's width / colour interpolates as
          `scrollX` slides through page boundaries. Wrapped in a TabSwipeRegion
          so the bottom band below the cards is also a tab-swipe surface. */}
      <TabSwipeRegion currentRoute="/" style={styles.dotsSwipe}>
        <View style={styles.dots}>
          {visiblePlanes.map((_, i) => (
            <PageDot
              key={i}
              index={i}
              pageWidth={width}
              scrollX={scrollX}
              activeColor={c.tint}
              inactiveColor={c.borderStrong}
            />
          ))}
        </View>
      </TabSwipeRegion>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PageDot — single animated dot that grows / colours based on how close the
// scroll is to its index.
// ---------------------------------------------------------------------------

type PageDotProps = {
  index: number;
  pageWidth: number;
  scrollX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
};

function PageDot({ index, pageWidth, scrollX, activeColor, inactiveColor }: PageDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Three reference points: prev page centre, this dot's page centre,
    // next page centre. Width / colour peak when scroll is exactly on
    // this index, and decay to the inactive values one page away.
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 18, 6],
      Extrapolation.CLAMP,
    );
    const backgroundColor = interpolateColor(
      scrollX.value,
      inputRange,
      [inactiveColor, activeColor, inactiveColor],
    );
    return { width, backgroundColor };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandTrail: {
    width: 24,
    height: 10,
    marginLeft: 1,
    marginRight: 2,
    position: 'relative',
  },
  brandTrailDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.55,
  },
  bellButton: { padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContainer: {
    height: CARD_AREA_HEIGHT,
    position: 'relative',
  },
  page: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sideArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  prevArrow: { left: Spacing.sm },
  nextArrow: { right: Spacing.sm },
  emptyInbox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dotsSwipe: {
    // Fixed-height swipe band wrapping the page dots; no flex.
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
