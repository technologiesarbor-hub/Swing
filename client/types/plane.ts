/**
 * Domain types for paper planes.
 *
 * Kept intentionally small for MVP. We'll add geo, filters, and moderation
 * fields once the backend is wired up.
 */

export type Sender = {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Approximate distance from the receiver, in kilometres. */
  distanceKm: number;
  /** Short age/identity tag shown in the corner pill, e.g. "21". */
  ageBadge: string;
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
};

export type Plane = {
  id: string;
  sender: Sender;
  /** The handwritten note on the plane. */
  message: string;
  /** When the plane was originally launched. */
  sentAt: string;
};
