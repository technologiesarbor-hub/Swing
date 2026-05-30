/**
 * Domain types for paper planes.
 *
 * Kept intentionally small for MVP. We'll add geo, filters, and moderation
 * fields once the backend is wired up.
 */

/** Single-character gender flag rendered on the home card corner pill.
 *  We deliberately collapse to one letter so the pill stays compact:
 *    - 'M'  → male
 *    - 'F'  → female
 *    - 'NB' → non-binary (no widely-accepted single letter, so we use the
 *      two-letter abbreviation here)
 */
export type Gender = 'M' | 'F' | 'NB';

export type Sender = {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Approximate distance from the receiver, in kilometres. */
  distanceKm: number;
  /** Short age/identity tag shown in the corner pill, e.g. "21". Kept
   *  around for the profile screen — the card itself now shows gender. */
  ageBadge: string;
  /** Gender flag rendered on the card corner pill (replaces age). */
  gender?: Gender;
  /** Long-form bio shown on the profile screen. */
  bio?: string;
  city?: string;
  country?: string;
  /** A few interest tags shown on the profile screen. */
  interests?: string[];
  /** When this user joined Swing. */
  joinedAt?: string;
  /** Was the user online recently? Drives the green dot in chats list. */
  onlineNow?: boolean;
  /** Last seen timestamp (ISO) when not online. */
  lastSeenAt?: string;
  /** Has an unseen "status" (24h story) — drives the gradient ring around
   *  the avatar in the chats list. */
  hasStatus?: boolean;
};

export type Plane = {
  id: string;
  sender: Sender;
  /** The handwritten note on the plane. */
  message: string;
  /** When the plane was originally launched. */
  sentAt: string;
};
