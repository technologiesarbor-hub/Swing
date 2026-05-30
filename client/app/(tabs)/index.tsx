/**
 * Home screen — the inbox of received paper planes.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │ Swing ✈            🔔(3)    │  header
 *   │                             │
 *   │    ┌─────────────────┐      │
 *   │    │   plane card    │  →   │  one card, arrow hints "more"
 *   │    └─────────────────┘      │
 *   │           • • • •           │  page dots
 *   └─────────────────────────────┘
 *
 * Cards are swipeable horizontally with `FlatList pagingEnabled`. The
 * right-side arrow appears only when there's a next card.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaneCard } from '@/components/plane-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MOCK_PLANES } from '@/lib/mock-planes';
import type { Plane } from '@/types/plane';

const CARD_HORIZONTAL_PADDING = Spacing.xl;

// Static positions for the 5 dots in the logo's curvy trail.
//
// The trail forms a small ARCH: it starts flush against the right edge of
// the 'g' in "Swing", rises in the middle, and comes back down so the
// paper-plane icon at the end sits on the SAME baseline as the wordmark.
//
// Coordinates are relative to a 24×10 container (see styles.brandTrail).
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

  const total = MOCK_PLANES.length;
  const hasNext = index < total - 1;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <ThemedText style={styles.brandText}>Swing</ThemedText>
          {/* Curvy dotted trail arcing up toward the paper plane icon. */}
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
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={listRef}
          data={MOCK_PLANES}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              <PlaneCard plane={item} />
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          decelerationRate="fast"
        />

        {/* Right-edge arrow hint — visible only when more cards exist */}
        {hasNext && (
          <Pressable
            onPress={goNext}
            hitSlop={12}
            style={[styles.nextArrow, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Ionicons name="chevron-forward" size={22} color={c.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Page dots */}
      <View style={styles.dots}>
        {MOCK_PLANES.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? c.tint : c.borderStrong,
                width: i === index ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  bellButton: {
    padding: 4,
  },
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
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  page: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  nextArrow: {
    position: 'absolute',
    right: Spacing.sm,
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
