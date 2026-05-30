/**
 * In-app notifications shown on the bell screen.
 *
 * Kept intentionally narrow for MVP — once the backend is wired up
 * these will come from a Firestore listener / FCM push. The shape
 * stays the same.
 */

export type NotificationKind =
  | 'plane-received' // someone sent you a plane
  | 'plane-accepted' // someone accepted your plane
  | 'plane-rejected' // your plane was rejected
  | 'message' // new chat message
  | 'reaction' // someone reacted to your message
  | 'friend-online' // a friend came online
  | 'system'; // app announcement

export type Notification = {
  id: string;
  kind: NotificationKind;
  /** Title (one-liner) shown in bold. */
  title: string;
  /** Optional secondary line, e.g. message preview. */
  body?: string;
  /** ISO timestamp. */
  createdAt: string;
  /** Whether the user has tapped / dismissed this. */
  read: boolean;
  /** Optional avatar initial / sender name for the row. */
  fromName?: string;
  /** Optional deep-link route ("/chat/foo", "/plane/bar"). */
  deepLink?: string;
};
