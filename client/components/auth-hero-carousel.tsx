/**
 * Hero block displayed above the signup / signin forms.
 *
 * Three slides, swipeable horizontally with paging snap and a small
 * dot indicator at the bottom. Each slide pairs a Reanimated
 * illustration with a one-line caption to keep the eye moving:
 *
 *   1. PaperPlaneMeet   – "Meet someone new."
 *   2. PlaneJourney     – "Send a paper plane anywhere."
 *   3. ChatSpark        – "Spark a real conversation."
 *
 * Implementation notes:
 *   - Using a plain FlatList with `pagingEnabled` keeps things simple
 *     and avoids reach-around dependencies. The animations themselves
 *     are already pure-worklet; the carousel just decides which one
 *     is in view.
 *   - We track the current page on the JS side so the dots can update
 *     without entanglement with Reanimated worklets.
 */

import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ChatSpark } from '@/components/anim/chat-spark';
import { PaperPlaneMeet } from '@/components/paper-plane-meet';
import { PlaneJourney } from '@/components/anim/plane-journey';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Slide = {
  key: string;
  caption: string;
  render: (height: number) => React.ReactElement;
};

const SLIDES: Slide[] = [
  {
    key: 'meet',
    caption: 'Meet someone new.',
    render: (h) => <PaperPlaneMeet height={h} />,
  },
  {
    key: 'journey',
    caption: 'Send a paper plane anywhere.',
    render: (h) => <PlaneJourney height={h} />,
  },
  {
    key: 'chat',
    caption: 'Spark a real conversation.',
    render: (h) => <ChatSpark height={h} />,
  },
];

type Props = {
  /** Height of each slide's animation canvas. The caption + dots add
   *  ~44 dp below. */
  animationHeight?: number;
  /** Outer horizontal padding of the parent screen so each page snaps
   *  to the *full* available width. */
  horizontalPadding?: number;
};

export function AuthHeroCarousel({
  animationHeight = 200,
  horizontalPadding = Spacing.xl,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const { width: screenWidth } = useWindowDimensions();
  // Each page is the screen width minus the parent's horizontal
  // padding — so within the parent's content box each slide fills.
  const pageWidth = screenWidth - horizontalPadding * 2;

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: pageWidth }]}>
            {item.render(animationHeight)}
            <ThemedText
              style={[styles.caption, { color: c.textMuted }]}
              numberOfLines={1}
            >
              {item.caption}
            </ThemedText>
          </View>
        )}
      />

      {/* Page dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? c.tint : c.border,
                width: i === index ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: Spacing.sm,
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
