/**
 * Visual card for a single received paper plane.
 *
 * Pure presentational — receives a `Plane` and renders it. Accept / reject
 * actions are passed in via callbacks so the screen owning the carousel can
 * decide what to do (advance to next, mark as accepted, etc.).
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Plane } from '@/types/plane';

type Props = {
  plane: Plane;
  onAccept?: (plane: Plane) => void;
  onReject?: (plane: Plane) => void;
};

export function PlaneCard({ plane, onAccept, onReject }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const avatarInitial = plane.sender.name.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      {/* Top: sender info + age pill */}
      <View style={styles.topRow}>
        <View style={styles.senderRow}>
          <View style={[styles.avatar, { backgroundColor: c.tintMuted }]}>
            <ThemedText style={[styles.avatarInitial, { color: c.tintPressed }]}>
              {avatarInitial}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.senderName} numberOfLines={1}>
              {plane.sender.name}
            </ThemedText>
            <ThemedText style={[styles.distance, { color: c.textMuted }]}>
              {plane.sender.distanceKm} km away
            </ThemedText>
          </View>
        </View>

        <View style={[styles.agePill, { backgroundColor: c.surfaceAlt }]}>
          <ThemedText style={[styles.ageText, { color: c.textMuted }]}>
            {plane.sender.ageBadge}
          </ThemedText>
        </View>
      </View>

      {/* Plane illustration (placeholder icon — swap with custom artwork later) */}
      <View style={styles.illustration}>
        <Ionicons name="paper-plane-outline" size={96} color={c.tint} />
      </View>

      {/* Message */}
      <ThemedText style={styles.message}>{plane.message}</ThemedText>

      {/* Decorative dotted divider */}
      <View style={styles.dotsRow}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: c.borderStrong }]}
          />
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onReject?.(plane)}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={28} color={c.danger} />
        </Pressable>

        <Pressable
          onPress={() => onAccept?.(plane)}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Ionicons name="checkmark" size={28} color={c.success} />
        </Pressable>
      </View>

      {/* Paper-fold corner accent (subtle visual nod to the design) */}
      <View
        style={[
          styles.foldCorner,
          { borderColor: c.border, backgroundColor: c.surfaceAlt },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    fontSize: 13,
    marginTop: 2,
  },
  agePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    minWidth: 40,
    alignItems: 'center',
  },
  ageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  foldCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderTopLeftRadius: Radii.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
