/**
 * Global keyboard-on-resume guard.
 *
 * Symptom this fixes: when an input is focused (chat composer, plane
 * compose, edit-profile, hashtag editor, search bar, ...) and the user
 * switches to another app while the keyboard is up, on return the
 * RN keyboard listeners can be in an inconsistent state — the
 * `KeyboardAvoidingView` / our manual `paddingBottom` tracking is stuck
 * with stale values, leaving the input either floating up the screen or
 * the layout collapsed.
 *
 * Fix: when the app goes anywhere other than `active`, force the
 * keyboard down. That way, whenever the user returns, the layout is in
 * a fresh state and the next focus event re-runs the keyboard show
 * sequence cleanly.
 *
 * Mount this hook ONCE at the root of the app.
 */

import { useEffect } from 'react';
import { AppState, Keyboard } from 'react-native';

export function useDismissKeyboardOnBackground() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        Keyboard.dismiss();
      }
    });
    return () => sub.remove();
  }, []);
}
