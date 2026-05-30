/**
 * Story viewer — opened from the chats list when the user taps a
 * partner's avatar *and* the partner has an active status ring.
 *
 * Phase A scope (now):
 *   - Full-screen Instagram-style chrome (top progress bar, partner
 *     name, X close).
 *   - Placeholder media area — once the backend feeds real status
 *     items for other users, we drop them in without changing the
 *     navigation / gesture layer.
 *   - Auto-dismiss after `STORY_DURATION_MS` so the viewer feels like
 *     a real story; tap-to-dismiss is also wired.
 *
 * Phase B (later): subscribe to the partner's `statusItems` and render
 * actual photo/video media with paged dots when there are multiple
 * items.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChats } from '@/lib/chats-context';
import { MOCK_PLANES } from '@/lib/mock-planes';
import type { Sender } from '@/types/plane';

/** How long a single story sits on screen before auto-dismissing. */
const STORY_DURATION_MS = 5000;

export default function StoryViewerScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { chats } = useChats();

  // Resolve who we're viewing — chats first (any active partner), then
  // fall back to the global plane index so this screen can also be
  // opened from the home cards in future.
  const partner = useMemo<Sender | null>(() => {
    const fromChat = chats.find((ch) => ch.partner.id === userId)?.partner;
    if (fromChat) return fromChat;
    const fromPlane = MOCK_PLANES.find((p) => p.sender.id === userId)?.sender;
    return fromPlane ?? null;
  }, [chats, userId]);

  // Progress bar — animates 0 → 1 over STORY_DURATION_MS, then we
  // pop the screen. We drive a JS-side timer in parallel so the
  // dismissal doesn't depend on a worklet callback.
  const progress = useSharedValue(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
    });
    const t = setTimeout(() => router.back(), STORY_DURATION_MS);
    return () => clearTimeout(t);
  }, [progress, router]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleDismiss = () => {
    Haptics.selectionAsync();
    router.back();
  };

  if (!partner) {
    // Nothing to show — bail back gracefully. Should never happen
    // because the avatar can't be tapped without a matching record.
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={styles.fallback}>
          <ThemedText style={styles.fallbackText}>Story unavailable</ThemedText>
          <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Pressable
      style={[styles.root, { backgroundColor: '#000' }]}
      onPress={handleDismiss}
      onLongPress={() => setPaused(true)}
      onPressOut={() => setPaused(false)}
    >
      {/* Top chrome — progress + identity + close */}
      <SafeAreaView edges={['top']} style={styles.chrome}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: '#fff', opacity: paused ? 0.4 : 1 },
              barStyle,
            ]}
          />
        </View>

        <View style={styles.identityRow}>
          <Avatar
            name={partner.name}
            uri={partner.avatarUrl}
            size={32}
            hasStatus={false}
          />
          <View style={styles.identityText}>
            <ThemedText style={styles.identityName}>{partner.name}</ThemedText>
            <ThemedText style={styles.identitySub}>now</ThemedText>
          </View>
          <Pressable onPress={handleDismiss} hitSlop={12}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Media area — placeholder until real status content lands. We
          centre the partner's avatar with a soft gradient feel so it
          doesn't read as "broken". */}
      <View style={styles.mediaArea}>
        <View
          style={[
            styles.mediaBubble,
            { backgroundColor: c.tint + '22', borderColor: c.tint + '55' },
          ]}
        >
          <Avatar
            name={partner.name}
            uri={partner.avatarUrl}
            size={140}
            hasStatus={false}
          />
        </View>
        <ThemedText style={styles.placeholderTitle}>
          {partner.name}&apos;s status
        </ThemedText>
        <ThemedText style={styles.placeholderHint}>
          Tap anywhere to close · hold to pause
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Top chrome — sits over the media so the story feels immersive.
  chrome: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  identityText: { flex: 1 },
  identityName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  identitySub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  mediaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mediaBubble: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },

  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 16,
  },
  closeBtn: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.pill,
  },
});
