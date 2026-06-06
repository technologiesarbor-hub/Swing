/**
 * Google Sign-In via expo-auth-session (Expo Go + dev builds).
 * Setup: client/GOOGLE-AUTH-SETUP.md
 *
 * Expo Go on iPhone requires an iOS OAuth client with bundle host.exp.Exponent.
 */

import {
  AccessTokenRequest,
  type AuthSessionResult,
  type AuthRequest,
} from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { discovery } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';

import {
  GoogleSignInError,
  googleSetupDevHint,
  googleSetupUserMessage,
  humanizeGoogleFailure,
} from '@/lib/google-user-messages';

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

const EXPO_GO_IOS_REDIRECT = 'host.exp.Exponent:/oauthredirect';
const EXPO_GO_ANDROID_REDIRECT = 'host.exp.exponent:/oauthredirect';

/** Google Console shows this scheme for each iOS/Android OAuth client. */
function redirectUriForClientId(clientId: string): string {
  const stem = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${stem}:/oauthredirect`;
}

function googleRedirectUri(): string | undefined {
  // Expo Go must match bundle host.exp.Exponent — not com.rahulsaw.swing.
  if (Constants.appOwnership === 'expo') {
    if (Platform.OS === 'ios') return EXPO_GO_IOS_REDIRECT;
    if (Platform.OS === 'android') return EXPO_GO_ANDROID_REDIRECT;
  }
  if (Platform.OS === 'ios' && iosClientId) {
    return redirectUriForClientId(iosClientId);
  }
  if (Platform.OS === 'android' && androidClientId) {
    return redirectUriForClientId(androidClientId);
  }
  return undefined;
}

const redirectUri = googleRedirectUri();

function extractIdToken(result: AuthSessionResult): string | undefined {
  if (result.type !== 'success') return undefined;
  const params = result.params as Record<string, string | undefined>;
  if (params.id_token) return params.id_token;
  const auth = (
    result as AuthSessionResult & { authentication?: { idToken?: string } }
  ).authentication;
  return auth?.idToken;
}

/** Auth code → id_token (iOS/Android). Must use the same client + redirect as the auth request. */
async function exchangeAuthCode(
  request: AuthRequest,
  code: string,
): Promise<string> {
  if (!request.codeVerifier) {
    throw new GoogleSignInError(
      'Could not sign in with Google. Try again or use email and password.',
      'PKCE code_verifier missing on auth request',
    );
  }
  if (!request.redirectUri) {
    throw new GoogleSignInError(
      'Could not sign in with Google. Try again or use email and password.',
      'redirectUri missing on auth request',
    );
  }

  try {
    const tokens = await new AccessTokenRequest({
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      code,
      extraParams: {
        code_verifier: request.codeVerifier,
      },
    }).performAsync(discovery);

    if (!tokens.idToken) {
      throw new GoogleSignInError(
        'Could not sign in with Google. Try again or use email and password.',
        'token endpoint returned no id_token',
      );
    }
    return tokens.idToken;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    if (__DEV__) {
      console.warn('[Google OAuth] code exchange failed:', detail);
      if (Constants.appOwnership === 'expo') {
        console.warn(
          '[Google OAuth] Expo Go fix: create iOS OAuth client with bundle host.exp.Exponent, paste client ID in .env, add Gmail under Test users',
        );
      }
    }
    throw new GoogleSignInError(
      'Could not sign in with Google. Try again or use email and password.',
      detail,
    );
  }
}

async function resolveGoogleIdToken(
  result: AuthSessionResult,
  request: AuthRequest | null,
): Promise<string | undefined> {
  const direct = extractIdToken(result);
  if (direct) return direct;

  if (result.type !== 'success') return undefined;
  const code = (result.params as { code?: string }).code;
  if (!code || !request) return undefined;

  return exchangeAuthCode(request, code);
}

if (__DEV__) {
  const hint = googleSetupDevHint(webClientId, iosClientId, androidClientId);
  if (hint) {
    console.warn('[Google OAuth setup]', hint);
  } else if (webClientId) {
    console.log('[Google OAuth] redirectUri:', redirectUri ?? '(default)');
    if (Constants.appOwnership === 'expo' && Platform.OS === 'ios') {
      console.log(
        '[Google OAuth] Expo Go needs iOS client bundle host.exp.Exponent (not com.rahulsaw.swing)',
      );
    }
  }
}

export function useGoogleSignIn() {
  const setupError = googleSetupUserMessage(
    webClientId,
    iosClientId,
    androidClientId,
  );
  const signingIn = useRef(false);

  const [request, , promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    redirectUri,
    shouldAutoExchangeCode: false,
  });

  const signIn = useCallback(async (): Promise<string> => {
    if (signingIn.current) {
      throw new GoogleSignInError('Could not sign in with Google. Try again.');
    }
    if (setupError) {
      throw new GoogleSignInError(
        setupError,
        googleSetupDevHint(webClientId, iosClientId, androidClientId) ?? undefined,
      );
    }
    if (!request) {
      throw new GoogleSignInError(
        'Google sign-in is not available right now. Use email and password.',
        'auth request not loaded yet',
      );
    }

    signingIn.current = true;
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        const raw =
          (result as { error?: { message?: string } }).error?.message ??
          (result as { params?: { error?: string; error_description?: string } })
            .params?.error_description ??
          (result as { params?: { error?: string } }).params?.error;
        throw humanizeGoogleFailure(result.type, raw);
      }

      const idToken = await resolveGoogleIdToken(result, request);
      if (idToken) return idToken;

      throw new GoogleSignInError(
        'Could not sign in with Google. Try again or use email and password.',
        (result.params as { code?: string }).code
          ? 'auth code received but token exchange failed'
          : 'success response missing id_token',
      );
    } finally {
      signingIn.current = false;
    }
  }, [promptAsync, request, setupError]);

  return useMemo(
    () => ({
      signIn,
      ready: !!request && !setupError,
      setupError,
    }),
    [request, signIn, setupError],
  );
}
