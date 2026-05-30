/**
 * Profile tab — the user's own profile, styled like Instagram but
 * with "Friends" instead of Followers/Following.
 *
 * Sections (top-to-bottom):
 *   1. Header strip (@username + settings gear)
 *   2. Avatar (tappable to change PFP) + stats row (Planes / Friends)
 *   3. Name + bio + tags
 *   4. Action buttons: [Edit profile] [Share] [Activity]
 *   5. Segment tabs: [Planes] [Friends] — switching swaps the list below
 *
 * State lives in:
 *   - `useUserSettings`  → user details + avatar
 *   - `useChats`         → friends
 *   - `useSentPlanes`    → planes sent
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { HashtagEditor } from '@/components/hashtag-editor';
import { TabSwipeRegion } from '@/components/tab-swipe-region';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTabFocusFade } from '@/hooks/use-tab-focus-fade';
import { useChats } from '@/lib/chats-context';
import { useSentPlanes } from '@/lib/sent-planes-context';
import { useUserSettings } from '@/lib/user-settings-context';
import type { Chat } from '@/types/chat';
import type { SentPlane } from '@/types/sent-plane';

type Segment = 'planes' | 'friends';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const fadeStyle = useTabFocusFade();
  const { user, updateUser } = useUserSettings();
  const { chats } = useChats();
  const { sentPlanes, total: planesSentTotal } = useSentPlanes();

  // Friends are accepted-chat partners that aren't blocked.
  const friends = useMemo(
    () => chats.filter((chat) => !chat.isBlocked),
    [chats],
  );

  const [segment, setSegment] = useState<Segment>('planes');
  // Tag overflow drawer — opens when the user taps the "+N" pill on the
  // profile header tag line. Lets them browse the full tag list and
  // jump into the editor without leaving the screen.
  const [showAllTags, setShowAllTags] = useState(false);
  const [showHashtagEditor, setShowHashtagEditor] = useState(false);

  const handleChangeAvatar = async () => {
    Haptics.selectionAsync();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow Swing to access your photos to change your profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;
    updateUser({ avatarUri: result.assets[0].uri });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Find me on Swing — @${user.username}. Send me a paper plane: https://swing.app/u/${user.username}`,
      });
    } catch {
      // user cancelled — no-op
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      <TabSwipeRegion currentRoute="/profile">
        <Animated.View style={[styles.header, fadeStyle]}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
            {user.city || user.country ? (
              <ThemedText style={[styles.usernameSub, { color: c.textMuted }]}>
                · {user.city ?? user.country}
              </ThemedText>
            ) : null}
          </View>

          <Pressable
            hitSlop={10}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: c.surfaceAlt },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={c.text} />
          </Pressable>
        </Animated.View>
      </TabSwipeRegion>

      <TabSwipeRegion currentRoute="/profile" style={styles.fill}>
        <Animated.View style={[styles.fill, fadeStyle]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar + stats */}
            <View style={styles.topRow}>
              <View>
                <Avatar
                  uri={user.avatarUri}
                  name={user.name}
                  size={88}
                  hasStatus={(user.statusItems?.length ?? 0) > 0}
                  onPress={handleChangeAvatar}
                />
                {/* Edit pencil — sits in the bottom-right of the avatar so
                    users immediately know it's tappable. */}
                <Pressable
                  onPress={handleChangeAvatar}
                  hitSlop={6}
                  style={[
                    styles.avatarEdit,
                    {
                      backgroundColor: c.tint,
                      borderColor: c.background,
                    },
                  ]}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.stats}>
                <Stat
                  label="Planes"
                  value={planesSentTotal}
                  onPress={() => router.push('/planes')}
                />
                <Stat
                  label="Friends"
                  value={friends.length}
                  onPress={() => setSegment('friends')}
                />
              </View>
            </View>

            {/* Name + bio + tags */}
            <View style={styles.about}>
              <ThemedText style={styles.fullName}>{user.name}</ThemedText>
              {user.age ? (
                <ThemedText style={[styles.metaLine, { color: c.textMuted }]}>
                  {user.age} · {user.city ?? user.country}
                </ThemedText>
              ) : null}
              {user.bio ? (
                <ThemedText style={styles.bio}>{user.bio}</ThemedText>
              ) : null}
              {user.interests && user.interests.length > 0 ? (
                <TagPillsLine
                  tags={user.interests}
                  onShowAll={() => setShowAllTags(true)}
                />
              ) : null}
            </View>

            {/* Action buttons — all three share the same outlined-pill
                styling for a consistent Insta-like row. */}
            <View style={styles.actions}>
              <ActionButton
                label="Edit profile"
                onPress={() => router.push('/profile/edit')}
              />
              <ActionButton
                label="Share"
                onPress={handleShare}
              />
              <ActionButton
                label="Activity"
                onPress={() => router.push('/notifications')}
              />
            </View>

            {/* Segment tabs */}
            <View style={[styles.segmentRow, { borderBottomColor: c.border }]}>
              <SegmentTab
                icon="paper-plane-outline"
                label="Planes"
                active={segment === 'planes'}
                onPress={() => setSegment('planes')}
              />
              <SegmentTab
                icon="people-outline"
                label="Friends"
                active={segment === 'friends'}
                onPress={() => setSegment('friends')}
              />
            </View>

            {segment === 'planes' ? (
              <PlanesSegment
                planes={sentPlanes}
                onSeeAll={() => router.push('/planes')}
              />
            ) : (
              <FriendsSegment
                friends={friends}
                onOpenChat={(id) => router.push(`/chat/${id}`)}
              />
            )}

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </Animated.View>
      </TabSwipeRegion>

      {/* "+N" overflow sheet — all tags + pencil to enter editor */}
      <AllTagsSheet
        visible={showAllTags}
        tags={user.interests ?? []}
        onClose={() => setShowAllTags(false)}
        onEdit={() => {
          setShowAllTags(false);
          setShowHashtagEditor(true);
        }}
      />

      {/* The actual editor sheet */}
      <HashtagEditor
        visible={showHashtagEditor}
        tags={user.interests ?? []}
        onClose={() => setShowHashtagEditor(false)}
        onChange={(next) => updateUser({ interests: next })}
      />
    </SafeAreaView>
  );
}

// ── All-tags bottom sheet ───────────────────────────────────────────────────

function AllTagsSheet({
  visible,
  tags,
  onClose,
  onEdit,
}: {
  visible: boolean;
  tags: string[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.tagsBackdrop} />
      <View
        style={[
          styles.tagsSheet,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <View style={styles.tagsSheetHandle} />
        <View style={styles.tagsSheetHeader}>
          <ThemedText style={styles.tagsSheetTitle}>Your tags</ThemedText>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onEdit();
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.tagsSheetEdit,
              { backgroundColor: c.tintMuted },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="pencil" size={16} color={c.tint} />
          </Pressable>
        </View>

        {tags.length === 0 ? (
          <View style={styles.tagsSheetEmpty}>
            <ThemedText
              style={[styles.tagsSheetEmptyText, { color: c.textMuted }]}
            >
              No tags yet. Tap the pencil to add some.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.tagsSheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tagsSheetWrap}>
              {tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagsSheetPill,
                    { backgroundColor: c.surfaceAlt, borderColor: c.border },
                  ]}
                >
                  <ThemedText
                    style={[styles.tagsSheetPillText, { color: c.text }]}
                  >
                    #{tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

/**
 * Single-line list of tag pills that gracefully ellipses when the tags
 * would overflow the available width. We measure the container width on
 * layout, then char-budget the tag list — anything that doesn't fit
 * collapses into a "+N" pill on the right.
 */
function TagPillsLine({
  tags,
  onShowAll,
}: {
  tags: string[];
  onShowAll?: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [containerWidth, setContainerWidth] = useState(0);

  // Rough character budget — at ~7px per char + 24px pill chrome we can
  // fit about (width / 11) characters across the row. Tuned empirically.
  const CHAR_PX = 7;
  const PILL_CHROME_PX = 24;
  const GAP_PX = 6;
  const OVERFLOW_PILL_PX = 38; // "+N" pill

  let used = 0;
  const shown: string[] = [];
  if (containerWidth > 0) {
    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
      const w = t.length * CHAR_PX + PILL_CHROME_PX + (shown.length ? GAP_PX : 0);
      // Reserve room for the overflow pill if there are tags AFTER this one.
      const reserve = i < tags.length - 1 ? OVERFLOW_PILL_PX + GAP_PX : 0;
      if (used + w + reserve > containerWidth) break;
      shown.push(t);
      used += w;
    }
  } else {
    // First pass — render everything so onLayout reports the right width.
    shown.push(...tags);
  }
  const hiddenCount = tags.length - shown.length;

  return (
    <View
      style={styles.tags}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {shown.map((tag) => (
        <View
          key={tag}
          style={[
            styles.tag,
            { backgroundColor: c.surfaceAlt, borderColor: c.border },
          ]}
        >
          <ThemedText
            style={[styles.tagText, { color: c.textMuted }]}
            numberOfLines={1}
          >
            #{tag}
          </ThemedText>
        </View>
      ))}
      {hiddenCount > 0 ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onShowAll?.();
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.tag,
            { backgroundColor: c.tintMuted, borderColor: c.tint },
            pressed && { opacity: 0.7 },
          ]}
        >
          <ThemedText style={[styles.tagText, { color: c.tintPressed }]}>
            +{hiddenCount}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.stat, pressed && { opacity: 0.6 }]}
    >
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: c.textMuted }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  // All three buttons (Edit profile / Share / Activity) share the same
  // outlined-pill look — transparent fill, subtle border — for a
  // clean Insta-like row.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: 'transparent',
          borderColor: c.border,
        },
        pressed && { opacity: 0.6 },
      ]}
    >
      <ThemedText style={[styles.actionBtnText, { color: c.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SegmentTab({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentTab,
        active && { borderBottomColor: c.text },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? c.text : c.textMuted}
      />
      <ThemedText
        style={[
          styles.segmentLabel,
          { color: active ? c.text : c.textMuted },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// ── Planes segment ──────────────────────────────────────────────────────────

/**
 * Mini outbox shown inside the profile tab. Same Accepted + On air
 * buckets as the full /planes screen, but capped (3 entries per bucket).
 * Each bucket header has a chevron that navigates to /planes for the
 * full list.
 */
function PlanesSegment({
  planes,
  onSeeAll,
}: {
  planes: SentPlane[];
  onSeeAll: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();

  const buckets = useMemo(() => {
    const accepted: SentPlane[] = [];
    const onAir: SentPlane[] = [];
    for (const p of planes) {
      if (p.status === 'accepted') accepted.push(p);
      else if (p.status === 'flying' || p.status === 'pending') onAir.push(p);
    }
    const sortNewestFirst = (a: SentPlane, b: SentPlane) =>
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    accepted.sort(sortNewestFirst);
    onAir.sort(sortNewestFirst);
    return { accepted, onAir };
  }, [planes]);

  const visibleCount = buckets.accepted.length + buckets.onAir.length;

  if (visibleCount === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: c.surfaceAlt, borderColor: c.border },
        ]}
      >
        <Ionicons name="paper-plane-outline" size={28} color={c.tint} />
        <ThemedText style={styles.emptyTitle}>No planes yet</ThemedText>
        <ThemedText style={[styles.emptySub, { color: c.textMuted }]}>
          Send your first plane from the Send tab.
        </ThemedText>
      </View>
    );
  }

  const openPlane = (plane: SentPlane) => {
    router.push({
      pathname: '/plane/[id]',
      params: { id: plane.id, readOnly: '1' },
    });
  };

  return (
    <View style={styles.segmentList}>
      <PlanesBucket
        title="Accepted"
        tint={c.success}
        icon="checkmark-circle"
        items={buckets.accepted.slice(0, 3)}
        total={buckets.accepted.length}
        onPressHeader={onSeeAll}
        onOpen={openPlane}
      />
      <PlanesBucket
        title="On air"
        tint={c.warning}
        icon="paper-plane"
        items={buckets.onAir.slice(0, 3)}
        total={buckets.onAir.length}
        onPressHeader={onSeeAll}
        onOpen={openPlane}
      />

      {planes.length > visibleCount + 0 ? (
        <Pressable onPress={onSeeAll} style={styles.seeAll}>
          <ThemedText style={[styles.seeAllText, { color: c.tint }]}>
            See all {planes.length} planes
          </ThemedText>
          <Ionicons name="chevron-forward" size={14} color={c.tint} />
        </Pressable>
      ) : null}
    </View>
  );
}

function PlanesBucket({
  title,
  tint,
  icon,
  items,
  total,
  onPressHeader,
  onOpen,
}: {
  title: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: SentPlane[];
  total: number;
  onPressHeader: () => void;
  onOpen: (plane: SentPlane) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <View style={styles.bucket}>
      <Pressable onPress={onPressHeader} style={styles.bucketHeader}>
        <View style={[styles.bucketDot, { backgroundColor: tint }]} />
        <Ionicons name={icon} size={15} color={tint} />
        <ThemedText style={[styles.bucketTitle, { color: tint }]}>
          {title}
        </ThemedText>
        <View style={[styles.bucketCount, { backgroundColor: tint + '22' }]}>
          <ThemedText style={[styles.bucketCountText, { color: tint }]}>
            {total}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.textSubtle} />
      </Pressable>

      {items.length === 0 ? (
        <View
          style={[
            styles.bucketEmpty,
            { backgroundColor: c.surfaceAlt, borderColor: c.border },
          ]}
        >
          <ThemedText
            style={[styles.bucketEmptyText, { color: c.textMuted }]}
          >
            {title === 'Accepted'
              ? "No-one's accepted yet."
              : 'Nothing in the air.'}
          </ThemedText>
        </View>
      ) : (
        <View
          style={[
            styles.bucketList,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          {items.map((plane, i) => (
            <Pressable
              key={plane.id}
              onPress={() => onOpen(plane)}
              style={({ pressed }) => [
                styles.bucketRow,
                i < items.length - 1 && {
                  borderBottomColor: c.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
                pressed && { backgroundColor: c.surfaceAlt },
              ]}
            >
              <Avatar
                name={plane.recipient?.name ?? plane.recipientName ?? '?'}
                uri={plane.recipient?.avatarUrl}
                size={32}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.bucketRowMessage} numberOfLines={2}>
                  {plane.message}
                </ThemedText>
                <ThemedText
                  style={[styles.bucketRowMeta, { color: c.textMuted }]}
                >
                  {plane.recipientName ? `To ${plane.recipientName} · ` : ''}
                  {timeAgo(plane.sentAt)}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={c.textSubtle}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Friends segment ─────────────────────────────────────────────────────────

function FriendsSegment({
  friends,
  onOpenChat,
}: {
  friends: Chat[];
  onOpenChat: (chatId: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  if (friends.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: c.surfaceAlt, borderColor: c.border },
        ]}
      >
        <Ionicons name="people-outline" size={28} color={c.tint} />
        <ThemedText style={styles.emptyTitle}>No friends yet</ThemedText>
        <ThemedText style={[styles.emptySub, { color: c.textMuted }]}>
          Accept a plane to make your first friend on Swing.
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={(c) => c.id}
      scrollEnabled={false} // ScrollView already scrolls
      ItemSeparatorComponent={() => (
        <View style={[styles.friendSeparator, { backgroundColor: c.border }]} />
      )}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => onOpenChat(item.id)}
          style={({ pressed }) => [
            styles.friendRow,
            // Top border on the very first row so the segregation reads
            // consistently with the separators below.
            index === 0 && {
              borderTopColor: c.border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
            pressed && { backgroundColor: c.surfaceAlt },
          ]}
        >
          <Avatar
            uri={item.partner.avatarUrl}
            name={item.partner.name}
            size={48}
            hasStatus={item.partner.hasStatus}
            online={item.partner.onlineNow}
          />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.friendName}>
              {item.partner.name}
            </ThemedText>
            <ThemedText
              style={[styles.friendSub, { color: c.textMuted }]}
              numberOfLines={1}
            >
              {item.partner.city ?? item.partner.country ?? 'On Swing'}
            </ThemedText>
          </View>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={c.tint}
          />
        </Pressable>
      )}
    />
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  username: { fontSize: 22, fontWeight: '700' },
  usernameSub: { fontSize: 13 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },

  about: {
    marginTop: Spacing.lg,
    gap: 4,
  },
  fullName: { fontSize: 16, fontWeight: '700' },
  metaLine: { fontSize: 13 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  tags: {
    flexDirection: 'row',
    // Single line — overflow is collapsed into a "+N" pill by
    // `TagPillsLine`, so wrapping is intentionally disabled.
    flexWrap: 'nowrap',
    gap: 6,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: 11, fontWeight: '500' },

  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  segmentRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  segmentList: { marginTop: Spacing.md, gap: Spacing.lg },

  // Bucketed planes list (mirrors /planes screen, capped to 3 entries)
  bucket: { gap: Spacing.sm },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: Spacing.xs,
  },
  bucketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  bucketTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    flex: 1,
  },
  bucketCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  bucketCountText: { fontSize: 11, fontWeight: '700' },
  bucketEmpty: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  bucketEmptyText: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  bucketList: {
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  bucketRowMessage: { fontSize: 13, lineHeight: 18 },
  bucketRowMeta: { fontSize: 11, marginTop: 2 },

  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  seeAllText: { fontSize: 13, fontWeight: '600' },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  friendSeparator: {
    height: StyleSheet.hairlineWidth,
    // Full-width separator that runs across the avatar column too — the
    // user wanted the divider to "cover till circle".
  },
  friendName: { fontSize: 15, fontWeight: '600' },
  friendSub: { fontSize: 12, marginTop: 2 },

  emptyCard: {
    alignItems: 'center',
    gap: 6,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptySub: { fontSize: 13, textAlign: 'center' },

  // All-tags overflow drawer (opens when "+N" pill is tapped)
  tagsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tagsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  tagsSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: Spacing.sm,
  },
  tagsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tagsSheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  tagsSheetEdit: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsSheetContent: { paddingBottom: Spacing.sm },
  tagsSheetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagsSheetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagsSheetPillText: { fontSize: 13, fontWeight: '500' },
  tagsSheetEmpty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  tagsSheetEmptyText: { fontSize: 13, textAlign: 'center' },
});
