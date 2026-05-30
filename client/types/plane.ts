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
};

export type Plane = {
  id: string;
  sender: Sender;
  /** The handwritten note on the plane. */
  message: string;
  /** When the plane was originally launched. */
  sentAt: string;
};
