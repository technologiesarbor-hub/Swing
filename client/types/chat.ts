/**
 * Chat domain types — kept intentionally small for MVP.
 *
 * One Chat corresponds to a 1-on-1 conversation that opened because the
 * receiver accepted a paper plane. Messages are stored inline on the
 * chat for simplicity; once Firestore lands they'll move to a
 * subcollection.
 */

import type { Sender } from '@/types/plane';

export type ChatMessageStatus =
  | 'sending' // optimistic, not yet "delivered" by the mock layer
  | 'sent' // single tick
  | 'delivered' // double tick (gray)
  | 'seen'; // double tick (blue)

export type ChatMessageKind = 'text' | 'image' | 'audio';

export type ChatMessage = {
  id: string;
  /** Sender of this individual message. `'me'` for the local user,
   *  otherwise the partner's user id. */
  authorId: 'me' | string;
  /** What kind of payload this message carries. Default is text. */
  kind: ChatMessageKind;
  /** Text body for `kind === 'text'`; also used as alt-text fallback. */
  text: string;
  /** Local URI for the picked photo (when `kind === 'image'`). */
  imageUri?: string;
  /** Local URI for the recorded voice clip (when `kind === 'audio'`). */
  audioUri?: string;
  /** Duration of the voice clip in milliseconds. */
  audioDurationMs?: number;
  /** ISO timestamp. */
  createdAt: string;
  status: ChatMessageStatus;
  /** Optional reaction emoji from the other side. */
  reaction?: string;
};

export type Chat = {
  id: string;
  /** The other person in this chat. */
  partner: Sender;
  /** Full message log, oldest first. */
  messages: ChatMessage[];
  /** How many partner-messages the local user hasn't opened yet. */
  unreadCount: number;
  /** Drives a "typing..." bubble while a mock auto-reply is in flight. */
  partnerTyping: boolean;
  /** ISO timestamp the chat was created (i.e. the plane was accepted). */
  createdAt: string;
};
