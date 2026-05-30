/**
 * Hard-coded planes for UI development.
 *
 * Replace with a Firestore query once the backend lands. The shape must
 * match the `Plane` type so swapping is a one-liner.
 */

import type { Plane } from '@/types/plane';

export const MOCK_PLANES: Plane[] = [
  {
    id: 'p1',
    sender: {
      id: 'u1',
      name: 'A girl with dreams',
      distanceKm: 2,
      ageBadge: '21',
    },
    message: 'Hey! Just wanted to say you have a really good vibe.',
    sentAt: '2026-05-23T14:30:00Z',
  },
  {
    id: 'p2',
    sender: {
      id: 'u2',
      name: 'Music lover',
      distanceKm: 1.5,
      ageBadge: '24',
    },
    message: 'Love your taste in music. What are you listening to right now?',
    sentAt: '2026-05-23T13:10:00Z',
  },
  {
    id: 'p3',
    sender: {
      id: 'u3',
      name: 'Curious traveller',
      distanceKm: 4.2,
      ageBadge: '27',
    },
    message: 'I believe in energy. You have it.',
    sentAt: '2026-05-23T11:45:00Z',
  },
  {
    id: 'p4',
    sender: {
      id: 'u4',
      name: 'Bookworm',
      distanceKm: 0.8,
      ageBadge: '23',
    },
    message: 'Just finished a book I think you would love. Curious?',
    sentAt: '2026-05-23T09:20:00Z',
  },
];
