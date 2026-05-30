/**
 * Plane detail screen — opened by tapping a card in the home carousel.
 *
 * Shows the full sender info + the full (un-trimmed) message + the same
 * accept/reject actions that were on the card. Accepting from here
 * goes straight into the chat thread.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChats } from '@/lib/chats-context';
import { findPlaneById } from '@/lib/mock-planes';

export default function PlaneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { acceptPlane } = useChats();

  const plane = id ? findPlaneById(id) : undefined;

  if (!plane) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
        <View style={styles.notFound}>
          <ThemedText style={styles.notFoundText}>Plane not found.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: c.tint, marginTop: Spacing.md }}>
              Go back
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const chat = acceptPlane(plane);
    // Replace so the back button from chat lands on home, not on this
    // intermediate detail screen.
    router.replace(`/chat/${chat.id}`);
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openProfile = () => {
    router.push(`/profile/${plane.sender.id}`);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Paper plane</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sender card (tap → profile) */}
        <Pressable
          onPress={openProfile}
          style={({ pressed }) => [
            styles.senderCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: c.tintMuted }]}>
            <ThemedText style={[styles.avatarInitial, { color: c.tintPressed }]}>
              {plane.sender.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.senderText}>
            <ThemedText style={styles.senderName}>{plane.sender.name}</ThemedText>
            <ThemedText style={[styles.senderMeta, { color: c.textMuted }]}>
              {plane.sender.ageBadge} · {plane.sender.distanceKm} km away
              {plane.sender.city ? ` · ${plane.sender.city}` : ''}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.textSubtle} />
        </Pressable>

        {/* The plane "paper" itself */}
        <View
          style={[
            styles.paper,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.paperIconWrap}>
            <Ionicons name="paper-plane" size={28} color={c.tint} />
          </View>
          <ThemedText style={styles.message}>{plane.message}</ThemedText>

          {/* Dotted divider */}
          <View style={styles.dotsRow}>
            {Array.from({ length: 28 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: c.borderStrong }]}
              />
            ))}
          </View>

          <ThemedText style={[styles.timestamp, { color: c.textMuted }]}>
            Sent {timeAgo(plane.sentAt)}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { borderTopColor: c.border }]}>
        <Pressable
          onPress={handleReject}
          style={({ pressed }) => [
            styles.actionButton,
            styles.rejectButton,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="close" size={22} color={c.danger} />
          <ThemedText style={[styles.actionLabel, { color: c.danger }]}>
            Pass
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleAccept}
          style={({ pressed }) => [
            styles.actionButton,
            styles.acceptButton,
            {
              backgroundColor: c.success,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="checkmark" size={22} color="#fff" />
          <ThemedText style={[styles.actionLabel, { color: '#fff' }]}>
            Accept &amp; chat
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 26,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  senderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  senderText: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  senderMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  paper: {
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    transform: [{ rotate: '-0.6deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  paperIconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 19,
    lineHeight: 28,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  timestamp: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radii.pill,
  },
  rejectButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  acceptButton: {
    flex: 2,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
});
