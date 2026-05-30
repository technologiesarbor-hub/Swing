/**
 * Notifications store — the bell-icon list.
 *
 * Seeded from `MOCK_NOTIFICATIONS`. The bell icon on the home header
 * shows the count of unread (`!read`) notifications.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { MOCK_NOTIFICATIONS } from '@/lib/mock-notifications';
import type { Notification } from '@/types/notification';

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  /** Mark a single notification as read (called when tapped). */
  markRead: (id: string) => void;
  /** Mark ALL as read — invoked when the user opens the notifications screen. */
  markAllRead: () => void;
  /** Remove a single notification (swipe-to-delete style). */
  dismiss: (id: string) => void;
  /** Clear the entire list. */
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(
    MOCK_NOTIFICATIONS,
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      dismiss,
      clearAll,
    }),
    [notifications, unreadCount, markRead, markAllRead, dismiss, clearAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used inside <NotificationsProvider>',
    );
  }
  return ctx;
}
