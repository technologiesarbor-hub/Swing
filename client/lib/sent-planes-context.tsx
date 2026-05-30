/**
 * Outgoing-planes store — every plane the local user has launched,
 * along with its delivery status.
 *
 * The home-screen "planes" icon and the profile-tab "Planes" tab both
 * read from here so the lists stay in sync.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { MOCK_SENT_PLANES } from '@/lib/mock-sent-planes';
import type { SentPlane, SentPlaneStatus } from '@/types/sent-plane';

type SentPlanesContextValue = {
  sentPlanes: SentPlane[];
  /** Called by the compose screen — adds a new 'flying' plane. */
  recordSent: (message: string, filters?: SentPlane['filters']) => SentPlane;
  /** Move a plane to a new status (e.g. when the receiver accepts). */
  updateStatus: (
    id: string,
    status: SentPlaneStatus,
    recipientName?: string,
  ) => void;
  /** Total planes regardless of status. */
  total: number;
  /** Useful counts for headers / profile stats. */
  acceptedCount: number;
  pendingCount: number;
};

const SentPlanesContext = createContext<SentPlanesContextValue | null>(null);

const nowIso = () => new Date().toISOString();

export function SentPlanesProvider({ children }: { children: ReactNode }) {
  const [sentPlanes, setSentPlanes] = useState<SentPlane[]>(MOCK_SENT_PLANES);

  const recordSent = useCallback(
    (message: string, filters?: SentPlane['filters']) => {
      const plane: SentPlane = {
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        message,
        sentAt: nowIso(),
        status: 'flying',
        filters,
      };
      setSentPlanes((prev) => [plane, ...prev]);
      return plane;
    },
    [],
  );

  const updateStatus = useCallback(
    (id: string, status: SentPlaneStatus, recipientName?: string) => {
      setSentPlanes((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                respondedAt: nowIso(),
                recipientName: recipientName ?? p.recipientName,
              }
            : p,
        ),
      );
    },
    [],
  );

  const total = sentPlanes.length;
  const acceptedCount = sentPlanes.filter((p) => p.status === 'accepted').length;
  const pendingCount = sentPlanes.filter(
    (p) => p.status === 'flying' || p.status === 'pending',
  ).length;

  const value = useMemo<SentPlanesContextValue>(
    () => ({
      sentPlanes,
      recordSent,
      updateStatus,
      total,
      acceptedCount,
      pendingCount,
    }),
    [sentPlanes, recordSent, updateStatus, total, acceptedCount, pendingCount],
  );

  return (
    <SentPlanesContext.Provider value={value}>
      {children}
    </SentPlanesContext.Provider>
  );
}

export function useSentPlanes(): SentPlanesContextValue {
  const ctx = useContext(SentPlanesContext);
  if (!ctx) {
    throw new Error(
      'useSentPlanes must be used inside <SentPlanesProvider>',
    );
  }
  return ctx;
}
