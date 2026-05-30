/**
 * Chats tab — list of all accepted plane-conversations.
 *
 * Empty state shows the same placeholder as before. Once at least one
 * plane has been accepted, this turns into a WhatsApp / Instagram-style
 * list with avatar, name, latest message preview, time, unread dot.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { TabSwipeRegion } from '@/components/tab-swipe-region';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTabFocusFade } from '@/hooks/use-tab-focus-fade';
import { useChats } from '@/lib/chats-context';
import type { Chat } from '@/types/chat';

export default function ChatsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { chats } = useChats();
  const fadeStyle = useTabFocusFade();

  if (chats.length === 0) {
    return (
      <ScreenPlaceholder
        icon="chatbubble-outline"
        title="No chats yet"
        subtitle="Once you accept a paper plane, your conversations will land here."
        currentRoute="/chats"
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      {/* Header is its own swipe region (the FlatList below has its own
          vertical scroll; horizontal pans on it still fire the Pan gesture
          thanks to `failOffsetY`). */}
      <TabSwipeRegion currentRoute="/chats">
        <Animated.View style={[styles.header, fadeStyle]}>
          <ThemedText style={styles.title}>Chats</ThemedText>
          <View style={[styles.pill, { backgroundColor: c.surfaceAlt }]}>
            <ThemedText style={[styles.pillText, { color: c.textMuted }]}>
              {chats.length}
            </ThemedText>
          </View>
        </Animated.View>
      </TabSwipeRegion>

      <TabSwipeRegion currentRoute="/chats" style={styles.fill}>
        <Animated.View style={[styles.fill, fadeStyle]}>
          <FlatList
            data={chats}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <ChatRow
                chat={item}
                onPress={() => router.push(`/chat/${item.id}`)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: c.border }]}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      </TabSwipeRegion>
    </SafeAreaView>
  );
}

function ChatRow({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastFromMe = lastMessage?.authorId === 'me';
  // Body for the preview line — falls back to icon-prefixed labels for
  // non-text messages.
  const previewBody = lastMessage
    ? lastMessage.kind === 'image'
      ? '📷 Photo'
      : lastMessage.kind === 'audio'
        ? '🎤 Voice message'
        : lastMessage.text
    : 'Say hi 👋';
  const preview = lastMessage && lastFromMe
    ? `You: ${previewBody}`
    : previewBody;
  const ts = lastMessage ? timeAgo(lastMessage.createdAt) : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.surfaceAlt : 'transparent' },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: c.tintMuted }]}>
        <ThemedText style={[styles.avatarInitial, { color: c.tintPressed }]}>
          {chat.partner.name.charAt(0).toUpperCase()}
        </ThemedText>
        {chat.partner.onlineNow ? (
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: c.success, borderColor: c.background },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.rowText}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.rowName} numberOfLines={1}>
            {chat.partner.name}
          </ThemedText>
          <ThemedText style={[styles.rowTime, { color: c.textMuted }]}>
            {ts}
          </ThemedText>
        </View>

        <View style={styles.rowBottom}>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.rowPreview,
              {
                color: chat.unreadCount > 0 ? c.text : c.textMuted,
                fontWeight: chat.unreadCount > 0 ? '600' : '400',
              },
            ]}
          >
            {chat.partnerTyping ? 'typing…' : preview}
          </ThemedText>
          {chat.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: c.tint }]}>
              <ThemedText style={styles.unreadBadgeText}>
                {chat.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={c.textSubtle} />
    </Pressable>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60 + Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  rowTime: {
    fontSize: 12,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowPreview: {
    flex: 1,
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
