/**
 * Story viewer — swipe down or X to close. Remounts per `userId` so
 * opening a second person's story after reload works reliably.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { useChats } from '@/lib/chats-context';
import { MOCK_PLANES } from '@/lib/mock-planes';
import type { Sender } from '@/types/plane';

const STORY_DURATION_MS = 5000;
const HEADER_BAR_HEIGHT = 52;

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return <StoryViewerContent key={userId} userId={userId} />;
}

function StoryViewerContent({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chats } = useChats();

  const partner = useMemo<Sender | null>(() => {
    const fromChat = chats.find((ch) => ch.partner.id === userId)?.partner;
    if (fromChat) return fromChat;
    return MOCK_PLANES.find((p) => p.sender.id === userId)?.sender ?? null;
  }, [chats, userId]);

  const progress = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    cancelAnimation(progress);
    router.back();
  }, [clearDismissTimer, progress, router]);

  const startProgress = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
    });
    clearDismissTimer();
    dismissTimer.current = setTimeout(() => dismiss(), STORY_DURATION_MS);
  }, [clearDismissTimer, dismiss, progress]);

  useFocusEffect(
    useCallback(() => {
      startProgress();
      return () => {
        clearDismissTimer();
        cancelAnimation(progress);
      };
    }, [clearDismissTimer, progress, startProgress]),
  );

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleDismiss = () => {
    Haptics.selectionAsync();
    dismiss();
  };

  const swipeDown = Gesture.Pan()
    .activeOffsetY([24, 999])
    .failOffsetX([-30, 30])
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 72 || e.velocityY > 650) {
        runOnJS(handleDismiss)();
      }
    });

  const topPad = insets.top;

  if (!partner) {
    return (
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={[styles.topChrome, { paddingTop: topPad }]}>
          <View style={styles.fallbackHeader}>
            <Pressable onPress={handleDismiss} style={styles.closeCircle}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={swipeDown}>
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={[styles.topChrome, { paddingTop: topPad }]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>

          <View style={styles.identityRow}>
            <Avatar
              name={partner.name}
              uri={partner.avatarUrl}
              size={36}
              hasStatus={false}
            />
            <View style={styles.identityText}>
              <ThemedText style={styles.identityName} numberOfLines={1}>
                {partner.name}
              </ThemedText>
            </View>
            <Pressable onPress={handleDismiss} hitSlop={12} style={styles.closeHit}>
              <View style={styles.closeCircle}>
                <Ionicons name="close" size={20} color="#fff" />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.mediaArea}>
          <Avatar
            name={partner.name}
            uri={partner.avatarUrl}
            size={160}
            hasStatus={false}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topChrome: {
    width: '100%',
  },
  progressTrack: {
    height: 3,
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#fff',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: HEADER_BAR_HEIGHT,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  identityName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  closeHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHeader: {
    height: HEADER_BAR_HEIGHT,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
