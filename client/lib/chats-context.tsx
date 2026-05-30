/**
 * Chats store — accepted paper-plane conversations.
 *
 * Lives in React Context (same shape as `PlaneBalanceProvider`) so it can
 * be migrated to a Firestore listener later without changing consumers.
 *
 * Capabilities exposed by the hook:
 *   - `chats`                 — list of all accepted chats, newest first
 *   - `getChat(id)`           — single chat by id
 *   - `acceptPlane(plane)`    — create a new chat from an accepted plane
 *                               (seeded with the plane's message as the
 *                               first message FROM the partner)
 *   - `sendMessage(id, text)` — append a message from the local user,
 *                               then run a fake "delivered → seen →
 *                               typing → auto-reply" pipeline so the
 *                               Instagram-style status flow can be
 *                               demoed without a backend
 *   - `markChatOpened(id)`    — clear unread counter when entering a thread
 *   - `addReaction(id, mid)`  — toggle a heart reaction (used by long-press)
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Chat, ChatMessage, ChatMessageKind } from '@/types/chat';
import type { Plane } from '@/types/plane';

export type SendPayload = {
  /** Default 'text'. */
  kind?: ChatMessageKind;
  /** Body for text messages; also used as alt-text for images / audio. */
  text?: string;
  imageUri?: string;
  audioUri?: string;
  audioDurationMs?: number;
};

type ChatsContextValue = {
  chats: Chat[];
  getChat: (chatId: string) => Chat | undefined;
  acceptPlane: (plane: Plane) => Chat;
  sendMessage: (chatId: string, payload: SendPayload | string) => void;
  markChatOpened: (chatId: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;
};

const ChatsContext = createContext<ChatsContextValue | null>(null);

const AUTO_REPLY_LINES = [
  "Hey 👋 wasn't expecting a reply this fast.",
  "Okay, that's actually really sweet of you to say.",
  "Tell me more — what are you up to today?",
  "haha you're funny",
  "Same energy. Big same energy.",
  "Okay you've earned a follow-up plane from me 🛩️",
];

function nowIso() {
  return new Date().toISOString();
}

function pickAutoReply() {
  return AUTO_REPLY_LINES[Math.floor(Math.random() * AUTO_REPLY_LINES.length)];
}

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  // Tracks timeouts so they can be cleared if the component unmounts during
  // a fake reply sequence (avoids warnings about setState on unmounted refs).
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const updateChat = useCallback(
    (chatId: string, updater: (chat: Chat) => Chat) => {
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? updater(chat) : chat)),
      );
    },
    [],
  );

  const updateMessage = useCallback(
    (
      chatId: string,
      messageId: string,
      updater: (msg: ChatMessage) => ChatMessage,
    ) => {
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === messageId ? updater(m) : m,
        ),
      }));
    },
    [updateChat],
  );

  const acceptPlane = useCallback((plane: Plane): Chat => {
    const chatId = `chat_${plane.sender.id}`;

    const seedMessage: ChatMessage = {
      id: `${chatId}_seed`,
      authorId: plane.sender.id,
      kind: 'text',
      text: plane.message,
      createdAt: plane.sentAt,
      status: 'seen',
    };

    const next: Chat = {
      id: chatId,
      partner: plane.sender,
      messages: [seedMessage],
      unreadCount: 0,
      partnerTyping: false,
      createdAt: nowIso(),
    };

    setChats((prev) => {
      // De-dupe — if the same sender's chat already exists (e.g. multiple
      // planes from them), bring it to the top instead of duplicating.
      const existingIdx = prev.findIndex((c) => c.id === chatId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const [existing] = copy.splice(existingIdx, 1);
        return [existing, ...copy];
      }
      return [next, ...prev];
    });

    return next;
  }, []);

  const markChatOpened = useCallback(
    (chatId: string) => {
      updateChat(chatId, (chat) => ({ ...chat, unreadCount: 0 }));
    },
    [updateChat],
  );

  const sendMessage = useCallback(
    (chatId: string, payload: SendPayload | string) => {
      // Normalise legacy `sendMessage(chatId, 'hi')` calls.
      const p: SendPayload =
        typeof payload === 'string' ? { kind: 'text', text: payload } : payload;

      const kind: ChatMessageKind = p.kind ?? 'text';
      const text = (p.text ?? '').trim();

      // Drop empties — but only for text messages. Image / audio messages
      // are valid even without a text body.
      if (kind === 'text' && !text) return;

      const msgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: ChatMessage = {
        id: msgId,
        authorId: 'me',
        kind,
        text,
        imageUri: p.imageUri,
        audioUri: p.audioUri,
        audioDurationMs: p.audioDurationMs,
        createdAt: nowIso(),
        status: 'sending',
      };

      updateChat(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, optimistic],
      }));

      // Fake the delivered → seen → typing → reply pipeline so the UI's
      // status flow is fully demoable without a real backend.
      const t1 = setTimeout(() => {
        updateMessage(chatId, msgId, (m) => ({ ...m, status: 'sent' }));
      }, 250);

      const t2 = setTimeout(() => {
        updateMessage(chatId, msgId, (m) => ({ ...m, status: 'delivered' }));
      }, 900);

      const t3 = setTimeout(() => {
        updateMessage(chatId, msgId, (m) => ({ ...m, status: 'seen' }));
        updateChat(chatId, (chat) => ({ ...chat, partnerTyping: true }));
      }, 1800);

      const t4 = setTimeout(() => {
        updateChat(chatId, (chat) => ({
          ...chat,
          partnerTyping: false,
          messages: [
            ...chat.messages,
            {
              id: `m_${Date.now()}_reply`,
              authorId: chat.partner.id,
              kind: 'text',
              text: pickAutoReply(),
              createdAt: nowIso(),
              status: 'seen',
            },
          ],
          unreadCount: chat.unreadCount + 1,
        }));
      }, 3500);

      pendingTimers.current.push(t1, t2, t3, t4);
    },
    [updateChat, updateMessage],
  );

  const addReaction = useCallback(
    (chatId: string, messageId: string, emoji: string) => {
      updateMessage(chatId, messageId, (m) => ({
        ...m,
        reaction: m.reaction === emoji ? undefined : emoji,
      }));
    },
    [updateMessage],
  );

  const getChat = useCallback(
    (chatId: string) => chats.find((c) => c.id === chatId),
    [chats],
  );

  const value = useMemo<ChatsContextValue>(
    () => ({
      chats,
      getChat,
      acceptPlane,
      sendMessage,
      markChatOpened,
      addReaction,
    }),
    [chats, getChat, acceptPlane, sendMessage, markChatOpened, addReaction],
  );

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats(): ChatsContextValue {
  const ctx = useContext(ChatsContext);
  if (!ctx) {
    throw new Error('useChats must be used inside <ChatsProvider>');
  }
  return ctx;
}
