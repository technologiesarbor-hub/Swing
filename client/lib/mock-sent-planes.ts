/**
 * Seed data for the user's outgoing plane history.
 * Replace with a Firestore query / paginated listener post-MVP.
 *
 * Every plane has a real recipient — the system pairs each message
 * with a matching user the moment it's launched, even if they haven't
 * acted on it yet.
 */

import type { SentPlane } from '@/types/sent-plane';

export const MOCK_SENT_PLANES: SentPlane[] = [
  {
    id: 'sp1',
    message: "If you could relive one summer, which one would it be?",
    sentAt: '2026-05-29T10:15:00Z',
    status: 'accepted',
    recipientName: 'Aanya',
    recipient: {
      id: 'u_aanya',
      name: 'Aanya',
      avatarUrl: 'https://i.pravatar.cc/200?img=47',
      location: 'Mumbai, India',
    },
    respondedAt: '2026-05-29T10:42:00Z',
    filters: { country: 'India', ageRange: [22, 28] },
  },
  {
    id: 'sp2',
    message:
      "Honest opinion — is it weird to write love letters to strangers? Asking for me.",
    sentAt: '2026-05-28T19:02:00Z',
    status: 'pending',
    recipientName: 'Mira',
    recipient: {
      id: 'u_mira',
      name: 'Mira',
      avatarUrl: 'https://i.pravatar.cc/200?img=32',
      location: 'Pune, India',
    },
    filters: { radiusKm: 50, gender: 'any' },
  },
  {
    id: 'sp3',
    message: "Drop a song you'd dance to at 3 AM in your kitchen.",
    sentAt: '2026-05-27T23:11:00Z',
    status: 'pending',
    recipientName: 'Devansh',
    recipient: {
      id: 'u_devansh',
      name: 'Devansh',
      avatarUrl: 'https://i.pravatar.cc/200?img=12',
      location: 'Delhi, India',
    },
    filters: { country: 'India' },
  },
  {
    id: 'sp4',
    message: "Tell me about the last book that ruined you (in a good way).",
    sentAt: '2026-05-26T14:45:00Z',
    status: 'accepted',
    recipientName: 'Kabir',
    recipient: {
      id: 'u_kabir',
      name: 'Kabir',
      avatarUrl: 'https://i.pravatar.cc/200?img=68',
      location: 'Bengaluru, India',
    },
    respondedAt: '2026-05-26T15:30:00Z',
    filters: { country: 'India', ageRange: [20, 30] },
  },
  {
    id: 'sp5',
    message: "Coffee or chai? Don't lie — there's only one right answer.",
    sentAt: '2026-05-30T08:00:00Z',
    status: 'flying',
    recipientName: 'Ishita',
    recipient: {
      id: 'u_ishita',
      name: 'Ishita',
      avatarUrl: 'https://i.pravatar.cc/200?img=24',
      location: 'Hyderabad, India',
    },
    filters: { radiusKm: 25, country: 'India' },
  },
];
