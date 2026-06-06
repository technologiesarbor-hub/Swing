/**
 * User-facing API error copy. Never show raw server or native error text for
 * INTERNAL/UNKNOWN — those are logged on the server only.
 */

const BY_CODE: Record<string, string> = {
  EMAIL_IN_USE:
    'An account with this email already exists. Try logging in.',
  USER_NOT_FOUND: 'No account with this email. Create one?',
  WRONG_PASSWORD: 'Incorrect password.',
  INVALID_TOKEN: 'Session expired. Please sign in again.',
  INVALID_INPUT: 'Please check your email and password.',
  INVALID_BODY: 'Please check your input and try again.',
  UNAUTHORIZED: 'Please sign in again.',
  NETWORK:
    'Cannot reach the server. Check your connection and API URL.',
  INTERNAL: 'Something went wrong. Please try again later.',
  UNKNOWN: 'Something went wrong. Please try again later.',
  USERNAME_TAKEN: 'That username is already taken.',
  USERNAME_INVALID:
    'Choose a valid username (3–20 chars, lowercase letters, numbers, underscores).',
  USERNAME_RESERVED: 'That username is reserved.',
  GOOGLE_AUTH_FAILED: 'Google sign-in failed. Try again.',
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not set up yet. Use email for now.',
  STORAGE_NOT_CONFIGURED:
    'Photo upload is not set up on the server yet. Try again later.',
  UPLOAD_FAILED: 'Could not upload photo. Try again.',
};

/** Codes where the server message is already safe to show verbatim. */
const TRUST_SERVER_MESSAGE = new Set([
  'EMAIL_IN_USE',
  'USER_NOT_FOUND',
  'WRONG_PASSWORD',
  'INVALID_TOKEN',
  'INVALID_INPUT',
  'INVALID_BODY',
  'UNAUTHORIZED',
  'NETWORK',
  'USERNAME_TAKEN',
  'USERNAME_INVALID',
  'USERNAME_RESERVED',
  'GOOGLE_AUTH_FAILED',
  'GOOGLE_NOT_CONFIGURED',
  'STORAGE_NOT_CONFIGURED',
  'UPLOAD_FAILED',
]);

export function messageForApiCode(
  code: string,
  serverMessage?: string,
): string {
  if (
    serverMessage &&
    TRUST_SERVER_MESSAGE.has(code) &&
    isPlainUserMessage(serverMessage)
  ) {
    return serverMessage;
  }
  return BY_CODE[code] ?? BY_CODE.UNKNOWN;
}

function isPlainUserMessage(text: string): boolean {
  if (!text || text.length > 200) return false;
  if (text.includes('{') || text.includes('\n') || text.includes('sql')) {
    return false;
  }
  return true;
}

export function codeFromHttpStatus(status: number): string {
  if (status >= 500) return 'INTERNAL';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 409) return 'EMAIL_IN_USE';
  if (status >= 400) return 'INVALID_BODY';
  return 'UNKNOWN';
}
