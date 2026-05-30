/**
 * 1-on-1 chat thread — Instagram-DM inspired.
 *
 * Layout (top → bottom):
 *   ┌────────────────────────────────┐
 *   │ ← (avatar) Name · last seen  ⋯ │   compact header
 *   ├────────────────────────────────┤
 *   │   ┌──────────┐                 │   left-aligned bubble (partner)
 *   │   │ hello    │                 │
 *   │   └──────────┘    ┌──────────┐ │   right-aligned bubble (me)
 *   │                   │ hey!    ✓✓│
 *   │                   └──────────┘ │
 *   │   ⋯ typing                     │   typing-indicator bubble
 *   ├────────────────────────────────┤
 *   │ 😊 [ Message... 📷 GIF ]  ➤    │   composer with quick-reactions
 *   └────────────────────────────────┘
 *
 * Status flow (faked in `chats-context.ts`):
 *   sending → sent → delivered → seen
 *   ✓gray   → ✓gray → ✓✓gray   → ✓✓blue
 *
 * Long-pressing a partner message reveals a quick-reaction emoji bar that
 * toggles a heart reaction on the bubble — same as Instagram.
 *
 * "Memes / GIFs" button is a stub for now — taps insert a random emoji
 * sticker so the flow is demoable. Real Giphy integration comes later.
 */

import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChats } from '@/lib/chats-context';
import type { ChatMessage } from '@/types/chat';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '🙏'];

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getChat, sendMessage, markChatOpened, addReaction } = useChats();

  const chat = chatId ? getChat(chatId) : undefined;
  const [draft, setDraft] = useState('');
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // --- Voice recording (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
    'idle',
  );
  // Local ms counter shown next to the recording dot. Bumped every 200ms.
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef<number>(0);
  const recordTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Watch keyboard open / close so the composer can shrink its
  // bottom-padding when the keyboard is up (no more "thoda jyada gap").
  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const h = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  // Index of the last message I sent — drives the Instagram-style status
  // label ("Sent" / "Delivered" / "Seen") that appears under that message
  // only.
  const lastMineIndex = (() => {
    if (!chat) return -1;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].authorId === 'me') return i;
    }
    return -1;
  })();

  useEffect(() => {
    if (chatId) markChatOpened(chatId);
  }, [chatId, markChatOpened]);

  // Auto-scroll to bottom whenever a new message arrives.
  useEffect(() => {
    if (!chat) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [chat?.messages.length, chat?.partnerTyping, chat]);

  if (!chat) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
        <View style={styles.notFound}>
          <ThemedText style={styles.notFoundText}>Chat not found.</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={{ color: c.tint, marginTop: Spacing.md }}>
              Go back
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleSend = () => {
    if (!draft.trim()) return;
    Haptics.selectionAsync();
    sendMessage(chat.id, draft);
    setDraft('');
  };

  /**
   * Open the device gallery and send the picked photo as an image message.
   * Permission prompt is handled by `expo-image-picker` itself.
   */
  const handlePickImage = async () => {
    Haptics.selectionAsync();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow Swing to access your photos to send images in chats.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    sendMessage(chat.id, {
      kind: 'image',
      imageUri: asset.uri,
      text: '',
    });
  };

  /**
   * Toggle voice recording. Tap once to start, tap again (the send-arrow
   * which now shows a stop glyph) to stop and send. A cancel button
   * appears next to the timer for discarding.
   */
  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Allow Swing to use the microphone to record voice messages.',
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordStartRef.current = Date.now();
      setRecordMs(0);
      setRecordingState('recording');
      recordTickRef.current = setInterval(() => {
        setRecordMs(Date.now() - recordStartRef.current);
      }, 200);
    } catch (e) {
      console.warn('Failed to start recording', e);
      setRecordingState('idle');
    }
  };

  const stopAndSendRecording = async () => {
    if (recordingState !== 'recording') return;
    if (recordTickRef.current) {
      clearInterval(recordTickRef.current);
      recordTickRef.current = null;
    }
    Haptics.selectionAsync();
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const duration = Date.now() - recordStartRef.current;
      setRecordingState('idle');
      if (uri && duration > 400) {
        sendMessage(chat.id, {
          kind: 'audio',
          audioUri: uri,
          audioDurationMs: duration,
          text: '',
        });
      }
    } catch (e) {
      console.warn('Failed to stop recording', e);
      setRecordingState('idle');
    }
  };

  const cancelRecording = async () => {
    if (recordTickRef.current) {
      clearInterval(recordTickRef.current);
      recordTickRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recorder.stop();
    } catch {
      // ignore — already stopped
    }
    setRecordingState('idle');
  };

  const handleReact = (messageId: string, emoji: string) => {
    Haptics.selectionAsync();
    addReaction(chat.id, messageId, emoji);
    setReactionTarget(null);
  };

  const openPartnerProfile = () => {
    router.push(`/profile/${chat.partner.id}`);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: c.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>

        <Pressable onPress={openPartnerProfile} style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: c.tintMuted }]}>
            <ThemedText style={[styles.headerAvatarInitial, { color: c.tintPressed }]}>
              {chat.partner.name.charAt(0).toUpperCase()}
            </ThemedText>
            {chat.partner.onlineNow ? (
              <View
                style={[
                  styles.headerOnlineDot,
                  { backgroundColor: c.success, borderColor: c.background },
                ]}
              />
            ) : null}
          </View>
          <View style={styles.headerNameWrap}>
            <ThemedText style={styles.headerName} numberOfLines={1}>
              {chat.partner.name}
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: c.textMuted }]}>
              {chat.partnerTyping
                ? 'typing…'
                : chat.partner.onlineNow
                  ? 'Active now'
                  : 'Active recently'}
            </ThemedText>
          </View>
        </Pressable>

        <Pressable hitSlop={12}>
          <Ionicons name="ellipsis-vertical" size={22} color={c.text} />
        </Pressable>
      </View>

      {/* Messages + composer share one KeyboardAvoidingView so the composer
          rises with the keyboard. Composer was previously OUTSIDE the KAV,
          which is why it stayed under the keyboard.
          On iOS we use 'padding' behavior. On Android, Expo's default
          `android:windowSoftInputMode=adjustResize` already handles the
          lift, so we leave behavior undefined to avoid double-padding. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.flex}
      >
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              prevAuthorId={chat.messages[index - 1]?.authorId}
              isLastMine={index === lastMineIndex}
              onLongPress={() =>
                item.authorId !== 'me' && setReactionTarget(item.id)
              }
              reactionVisible={reactionTarget === item.id}
              onPickReaction={(emoji) => handleReact(item.id, emoji)}
              onDismissReaction={() => setReactionTarget(null)}
            />
          )}
          ListFooterComponent={
            chat.partnerTyping ? <TypingBubble /> : null
          }
        />

        {/* Composer — lives inside the KAV so it rides up with the keyboard.
            When the keyboard is open we shrink the bottom-padding so the
            composer sits snug against the keyboard (instead of leaving the
            home-indicator gap floating up there). */}
        <View
          style={[
            styles.composer,
            {
              borderTopColor: c.border,
              backgroundColor: c.surface,
              paddingBottom: keyboardOpen
                ? Spacing.xs
                : insets.bottom + Spacing.sm,
            },
          ]}
        >
          {recordingState === 'recording' ? (
            <RecordingComposer
              ms={recordMs}
              onCancel={cancelRecording}
              onSend={stopAndSendRecording}
              cancelColor={c.danger}
              sendColor={c.tint}
              barColor={c.surfaceAlt}
              borderColor={c.border}
              textColor={c.text}
              mutedColor={c.textMuted}
            />
          ) : (
            <>
              {/* Image / gallery — opens the OS file picker. */}
              <Pressable
                onPress={handlePickImage}
                hitSlop={8}
                style={styles.composerIcon}
              >
                <Ionicons name="image-outline" size={26} color={c.textMuted} />
              </Pressable>

              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: c.surfaceAlt, borderColor: c.border },
                ]}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Message..."
                  placeholderTextColor={c.textSubtle}
                  style={[styles.input, { color: c.text }]}
                  multiline
                  maxLength={1000}
                />
              </View>

              {draft.trim() ? (
                /* When the user is typing, the right button becomes Send. */
                <Pressable
                  onPress={handleSend}
                  hitSlop={8}
                  style={[
                    styles.sendButton,
                    { backgroundColor: c.tint },
                  ]}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
              ) : (
                /* Idle: tap to start voice recording. */
                <Pressable
                  onPress={startRecording}
                  hitSlop={8}
                  style={[
                    styles.sendButton,
                    { backgroundColor: c.surfaceAlt },
                  ]}
                >
                  <Ionicons name="mic" size={20} color={c.tint} />
                </Pressable>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// RecordingComposer — replaces the input row while a voice recording is in
// progress. Shows a pulsing red dot, the elapsed time, and ✕ cancel /
// ➤ send buttons (which actually stops + sends or stops + discards).
// ---------------------------------------------------------------------------

function RecordingComposer({
  ms,
  onCancel,
  onSend,
  cancelColor,
  sendColor,
  barColor,
  borderColor,
  textColor,
  mutedColor,
}: {
  ms: number;
  onCancel: () => void;
  onSend: () => void;
  cancelColor: string;
  sendColor: string;
  barColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <>
      <Pressable onPress={onCancel} hitSlop={8} style={styles.composerIcon}>
        <Ionicons name="trash-outline" size={24} color={cancelColor} />
      </Pressable>

      <View
        style={[
          styles.recordingBar,
          { backgroundColor: barColor, borderColor },
        ]}
      >
        <Animated.View
          style={[styles.recordingDot, { backgroundColor: cancelColor }, dotStyle]}
        />
        <ThemedText style={[styles.recordingTimer, { color: textColor }]}>
          {formatDuration(ms)}
        </ThemedText>
        <ThemedText style={[styles.recordingHint, { color: mutedColor }]}>
          Recording…
        </ThemedText>
      </View>

      <Pressable
        onPress={onSend}
        hitSlop={8}
        style={[styles.sendButton, { backgroundColor: sendColor }]}
      >
        <Ionicons name="send" size={18} color="#fff" />
      </Pressable>
    </>
  );
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// MessageBubble — left or right aligned, with an Instagram-style status
// label rendered BELOW the last "me" message only ("Sending…" → "Sent" →
// "Delivered" → "Seen") plus a long-press reaction emoji picker on
// partner messages.
// ---------------------------------------------------------------------------

type MessageBubbleProps = {
  message: ChatMessage;
  prevAuthorId?: string;
  isLastMine: boolean;
  onLongPress: () => void;
  reactionVisible: boolean;
  onPickReaction: (emoji: string) => void;
  onDismissReaction: () => void;
};

function MessageBubble({
  message,
  prevAuthorId,
  isLastMine,
  onLongPress,
  reactionVisible,
  onPickReaction,
  onDismissReaction,
}: MessageBubbleProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const isMe = message.authorId === 'me';
  // Group consecutive messages from the same author — only show extra
  // top-margin when the author changes.
  const isFirstInGroup = prevAuthorId !== message.authorId;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={300}
      style={[
        styles.bubbleRow,
        isMe ? styles.bubbleRowMe : styles.bubbleRowThem,
        { marginTop: isFirstInGroup ? Spacing.md : 2 },
      ]}
    >
      <View
        style={[
          // Base shape: text/audio share the padded chrome bubble; image
          // bubbles drop the padding so the photo fills the corners.
          message.kind === 'image' ? styles.imageBubble : styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          // Background + border: only text and audio get chrome; the
          // image bubble's chrome IS the photo itself.
          message.kind !== 'image' && {
            backgroundColor: isMe ? c.tint : c.surface,
            borderColor: c.border,
            borderWidth: isMe ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {message.kind === 'image' && message.imageUri ? (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.bubbleImage}
            contentFit="cover"
          />
        ) : message.kind === 'audio' && message.audioUri ? (
          <AudioBubble
            uri={message.audioUri}
            durationMs={message.audioDurationMs ?? 0}
            tint={isMe ? '#fff' : c.tint}
            mutedTint={isMe ? 'rgba(255,255,255,0.7)' : c.textMuted}
            barBg={isMe ? 'rgba(255,255,255,0.25)' : c.borderStrong}
          />
        ) : (
          <ThemedText
            style={[styles.bubbleText, { color: isMe ? '#fff' : c.text }]}
          >
            {message.text}
          </ThemedText>
        )}

        {message.reaction ? (
          <View
            style={[
              styles.reactionPill,
              isMe ? styles.reactionPillMe : styles.reactionPillThem,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <ThemedText style={styles.reactionEmoji}>
              {message.reaction}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* Status row — only under MY last message. Instagram does this:
          subtle gray text below the most recent sent message, showing
          "Sending…" → "Sent" → "Delivered" → "Seen".
          Once a NEW message is sent, the label moves to that newer one. */}
      {isMe && isLastMine ? (
        <StatusLabel status={message.status} mutedColor={c.textMuted} />
      ) : null}

      {reactionVisible ? (
        <ReactionPicker
          onPick={onPickReaction}
          onDismiss={onDismissReaction}
        />
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// AudioBubble — voice-message playback. Tap play → plays the recorded clip
// via `expo-audio`. The duration label flips to elapsed-time while playing,
// then back to total once stopped.
// ---------------------------------------------------------------------------

function AudioBubble({
  uri,
  durationMs,
  tint,
  mutedTint,
  barBg,
}: {
  uri: string;
  durationMs: number;
  tint: string;
  mutedTint: string;
  barBg: string;
}) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const elapsedMs = status.currentTime ? status.currentTime * 1000 : 0;
  const totalMs = status.duration && status.duration > 0
    ? status.duration * 1000
    : durationMs;

  const toggle = () => {
    if (isPlaying) {
      player.pause();
    } else {
      // Restart from 0 if we'd previously reached the end.
      if (status.didJustFinish || elapsedMs >= totalMs - 50) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  // 12 fake waveform bars — gives the bubble a chat-app feel without us
  // needing to analyse the audio. Heights are deterministic per bar index.
  const bars = Array.from({ length: 12 }).map((_, i) => 6 + ((i * 13) % 14));
  const playedFraction = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;

  return (
    <View style={styles.audioRow}>
      <Pressable onPress={toggle} hitSlop={6}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={tint} />
      </Pressable>
      <View style={styles.audioBars}>
        {bars.map((h, i) => {
          const filled = i / bars.length <= playedFraction;
          return (
            <View
              key={i}
              style={[
                styles.audioBar,
                {
                  height: h,
                  backgroundColor: filled ? tint : barBg,
                },
              ]}
            />
          );
        })}
      </View>
      <ThemedText style={[styles.audioDuration, { color: mutedTint }]}>
        {formatDuration(isPlaying ? elapsedMs : totalMs)}
      </ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatusLabel — Instagram-style small gray text under the last sent
// message. Shows the message's current status with a matching icon.
// ---------------------------------------------------------------------------

function StatusLabel({
  status,
  mutedColor,
}: {
  status: ChatMessage['status'];
  mutedColor: string;
}) {
  let label: string;
  let icon: keyof typeof Ionicons.glyphMap;
  let color = mutedColor;

  switch (status) {
    case 'sending':
      label = 'Sending…';
      icon = 'time-outline';
      break;
    case 'sent':
      label = 'Sent';
      icon = 'checkmark';
      break;
    case 'delivered':
      label = 'Delivered';
      icon = 'checkmark-done';
      break;
    case 'seen':
    default:
      label = 'Seen';
      icon = 'checkmark-done';
      // Match Insta's blue-ish accent for seen.
      color = '#3B82F6';
      break;
  }

  return (
    <View style={styles.statusLabelRow}>
      <Ionicons name={icon} size={12} color={color} />
      <ThemedText style={[styles.statusLabelText, { color }]}>{label}</ThemedText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TypingBubble — animated three-dot indicator from the partner side
// ---------------------------------------------------------------------------

function TypingBubble() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowThem]}>
      <View
        style={[
          styles.bubble,
          styles.bubbleThem,
          styles.typingBubble,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <TypingDot delay={0} color={c.textMuted} />
        <TypingDot delay={150} color={c.textMuted} />
        <TypingDot delay={300} color={c.textMuted} />
      </View>
    </View>
  );
}

function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.typingDot, { backgroundColor: color }, style]} />
  );
}

// ---------------------------------------------------------------------------
// ReactionPicker — floating emoji row above a long-pressed message
// ---------------------------------------------------------------------------

function ReactionPicker({
  onPick,
  onDismiss,
}: {
  onPick: (emoji: string) => void;
  onDismiss: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  return (
    <>
      <Pressable
        onPress={onDismiss}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="box-only"
      />
      <View
        style={[
          styles.reactionBar,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => onPick(emoji)}
            style={({ pressed }) => [
              styles.reactionButton,
              {
                backgroundColor: pressed ? c.surfaceAlt : 'transparent',
              },
            ]}
            hitSlop={4}
          >
            <ThemedText style={styles.reactionPickerEmoji}>{emoji}</ThemedText>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerAvatarInitial: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  headerNameWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bubbleRow: {
    width: '100%',
  },
  bubbleRowMe: {
    alignItems: 'flex-end',
  },
  bubbleRowThem: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.lg,
    position: 'relative',
  },
  imageBubble: {
    maxWidth: '70%',
    borderRadius: Radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  bubbleImage: {
    width: 220,
    height: 280,
    borderRadius: Radii.lg,
  },
  bubbleMe: {
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 180,
  },
  audioBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  audioBar: {
    width: 3,
    borderRadius: 1.5,
  },
  audioDuration: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  recordingHint: {
    fontSize: 12,
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginRight: 4,
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  reactionPill: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  reactionPillMe: {
    right: 12,
  },
  reactionPillThem: {
    left: 12,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: -4,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 4,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerEmoji: {
    fontSize: 22,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerIcon: {
    paddingBottom: 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: Spacing.sm,
  },
  inlineIcon: {
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
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
