/**
 * Hard-coded planes for UI development.
 *
 * Replace with a Firestore query once the backend lands. The shape must
 * match the `Plane` type so swapping is a one-liner.
 */

import type { Plane, Sender } from '@/types/plane';

export const MOCK_PLANES: Plane[] = [
  {
    id: 'p1',
    sender: {
      id: 'u1',
      name: 'Aanya',
      distanceKm: 2,
      ageBadge: '21',
      gender: 'F',
      bio: "Architecture student. Coffee snob. Will absolutely cry over a good sunset.",
      city: 'Mumbai',
      country: 'India',
      interests: ['design', 'film photography', 'long walks', 'jazz'],
      joinedAt: '2026-03-12T00:00:00Z',
      onlineNow: true,
      hasStatus: true,
    },
    message:
      "Hey! Just wanted to say you have a really good vibe. I was sitting at a cafe nearby and saw your plane drift past — felt like it was meant to land here. Tell me one thing that made you smile today?",
    sentAt: '2026-05-23T14:30:00Z',
  },
  {
    id: 'p2',
    sender: {
      id: 'u2',
      name: 'Kabir',
      distanceKm: 1.5,
      ageBadge: '24',
      gender: 'M',
      bio: 'Music producer by night, broke engineer by day. Always one playlist away from a feeling.',
      city: 'Bengaluru',
      country: 'India',
      interests: ['music production', 'vinyl', 'late-night coding', 'biryani'],
      joinedAt: '2026-02-04T00:00:00Z',
      onlineNow: false,
      lastSeenAt: '2026-05-23T12:10:00Z',
    },
    message:
      "Love your taste in music. What are you listening to right now? I just discovered an artist that genuinely re-arranged something in my chest — happy to send a link if you're curious.",
    sentAt: '2026-05-23T13:10:00Z',
  },
  {
    id: 'p3',
    sender: {
      id: 'u3',
      name: 'Mira',
      distanceKm: 4.2,
      ageBadge: '27',
      gender: 'NB',
      bio: 'Traveller, ex-journalist, full-time noticer of small things. Currently in your city for the next three weeks.',
      city: 'Goa',
      country: 'India',
      interests: ['solo travel', 'writing', 'sunrises', 'sketchbooks'],
      joinedAt: '2026-04-19T00:00:00Z',
      onlineNow: true,
      hasStatus: true,
    },
    message:
      "I believe in energy. You have it. I don't know who you are or what you do, but the timing of this plane finding you means something — at least I'd like to think so.",
    sentAt: '2026-05-23T11:45:00Z',
  },
  {
    id: 'p4',
    sender: {
      id: 'u4',
      name: 'Ishaan',
      distanceKm: 0.8,
      ageBadge: '23',
      gender: 'M',
      bio: 'Book nerd. Pretending to be a grown-up. Currently reading: anything with a tortured protagonist and 800+ pages.',
      city: 'Delhi',
      country: 'India',
      interests: ['books', 'tea', 'philosophy', 'rain'],
      joinedAt: '2026-01-22T00:00:00Z',
      onlineNow: false,
      lastSeenAt: '2026-05-23T07:55:00Z',
    },
    message:
      "Just finished a book I think you would love. Curious? It's the kind where you read the last line and then sit completely still for ten minutes. Send me a hi and I'll tell you the title.",
    sentAt: '2026-05-23T09:20:00Z',
  },
];

/**
 * Quick lookup by user id — used by the profile route which receives just
 * a userId param. Once the backend is wired, replace this with a Firestore
 * `doc(users, uid)` read.
 */
export function findSenderById(userId: string): Sender | undefined {
  return MOCK_PLANES.find((p) => p.sender.id === userId)?.sender;
}

/**
 * Quick lookup by plane id — used by the plane detail route.
 */
export function findPlaneById(planeId: string): Plane | undefined {
  return MOCK_PLANES.find((p) => p.id === planeId);
}
