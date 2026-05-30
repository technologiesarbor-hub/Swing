/**
 * Plane balance — how many planes the user can still send.
 *
 * Lives in React Context for now so it's accessible from the Send screen
 * (to decrement on launch) and any future screen that wants to display the
 * count (Home header, profile, etc.).
 *
 * When we wire up Firebase, swap the local state for a Firestore listener
 * on `users/{uid}.planesRemaining` and keep the same hook API.
 */

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

const INITIAL_BALANCE = 5;

type PlaneBalance = {
  count: number;
  /** Spend one plane. Returns true if the spend succeeded. */
  spendOne: () => boolean;
  /** Add planes (e.g. after watching a rewarded ad). */
  add: (amount: number) => void;
};

const PlaneBalanceContext = createContext<PlaneBalance | null>(null);

export function PlaneBalanceProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(INITIAL_BALANCE);

  const value = useMemo<PlaneBalance>(
    () => ({
      count,
      spendOne: () => {
        if (count <= 0) return false;
        setCount((c) => c - 1);
        return true;
      },
      add: (amount: number) => setCount((c) => c + amount),
    }),
    [count],
  );

  return (
    <PlaneBalanceContext.Provider value={value}>{children}</PlaneBalanceContext.Provider>
  );
}

export function usePlaneBalance(): PlaneBalance {
  const ctx = useContext(PlaneBalanceContext);
  if (!ctx) {
    throw new Error('usePlaneBalance must be used inside <PlaneBalanceProvider>');
  }
  return ctx;
}
