/**
 * Full-screen modal that blocks all taps while an async action runs.
 */

import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  visible: boolean;
  message?: string;
};

export function BlockingLoader({ visible, message }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={c.tint} />
        {message ? (
          <ThemedText style={[styles.message, { color: c.text }]}>
            {message}
          </ThemedText>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
});
