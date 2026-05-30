/**
 * Hard-coded notifications for the bell screen.
 *
 * Replace with a Firestore listener (or FCM-driven local cache) when
 * the backend lands.
 */

import type { Notification } from '@/types/notification';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    kind: 'plane-accepted',
    title: 'Aanya accepted your plane',
    body: 'Tap to start chatting',
    fromName: 'Aanya',
    createdAt: '2026-05-30T14:55:00Z',
    read: false,
    deepLink: '/chat/chat_u1',
  },
  {
    id: 'n2',
    kind: 'plane-received',
    title: 'New plane from Mira',
    body: 'I believe in energy. You have it.',
    fromName: 'Mira',
    createdAt: '2026-05-30T11:45:00Z',
    read: false,
    deepLink: '/plane/p3',
  },
  {
    id: 'n3',
    kind: 'reaction',
    title: 'Kabir reacted ❤️',
    body: 'to your message',
    fromName: 'Kabir',
    createdAt: '2026-05-30T10:21:00Z',
    read: false,
    deepLink: '/chat/chat_u2',
  },
  {
    id: 'n4',
    kind: 'friend-online',
    title: 'Ishaan is online',
    fromName: 'Ishaan',
    createdAt: '2026-05-30T09:10:00Z',
    read: true,
    deepLink: '/profile/u4',
  },
  {
    id: 'n5',
    kind: 'system',
    title: 'Welcome to Swing',
    body: "You've got 5 paper planes to send. Use them wisely.",
    createdAt: '2026-05-29T18:00:00Z',
    read: true,
  },
];
