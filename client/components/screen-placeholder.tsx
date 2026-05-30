/**
 * Shared empty-state for screens that aren't built yet.
 * Replace with real screens as the MVP grows.
 */

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle: string;
  icon: IoniconName;
};

export function ScreenPlaceholder({ title, subtitle, icon }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: c.tintMuted }]}>
          <Ionicons name={icon} size={36} color={c.tint} />
        </View>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: c.textMuted }]}>
          {subtitle}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
