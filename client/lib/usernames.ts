/**
 * Username plumbing for the onboarding flow.
 *
 * Phase A (now): the "is this username taken?" check is a mock backed
 * by AsyncStorage so the entire flow feels real without a backend.
 *
 * Phase B (later): swap `isUsernameAvailable` and `markUsernameTaken`
 * to hit Firestore — the rest of the call sites stay identical. We
 * deliberately make the API async-first so the swap is non-invasive.
 *
 * Why this lives next to `auth-context` and not inside it:
 *   - The auth identity (email/google sub) is a separate concept from
 *     the *display* identity (username). They have different storage
 *     lifecycles and we may eventually want a username-change feature
 *     that doesn't touch auth.
 *   - Keeping it in its own file makes the regex / wordlist easy to
 *     iterate on without churning the auth surface.
 */

/** Reserved short list so casual griefers can't impersonate the app
 *  itself. Augmented server-side in Phase B. */
const RESERVED = new Set([
  'admin',
  'administrator',
  'swing',
  'official',
  'support',
  'help',
  'team',
  'mod',
  'moderator',
  'staff',
  'root',
  'system',
  'security',
  'paperplane',
  'paper_plane',
]);

// Word lists tuned for the Reddit-style "adjective_noun_NN" pattern.
// Picked so combinations read as friendly and pronounceable; avoid
// anything sharp-edged or that bears on demographics.
const ADJECTIVES = [
  'clever', 'silent', 'brave', 'lucky', 'quirky', 'happy', 'swift',
  'dreamy', 'wild', 'cosmic', 'lazy', 'fancy', 'bold', 'calm', 'shy',
  'merry', 'mighty', 'rusty', 'wise', 'tiny', 'jolly', 'noble',
  'crafty', 'fuzzy', 'witty', 'snug', 'epic', 'humble', 'mellow',
  'neat', 'loyal', 'dapper', 'groovy', 'zesty', 'smooth', 'spicy',
  'moonlit', 'sunny', 'fearless', 'graceful', 'gentle', 'sleepy',
  'curious', 'silver', 'amber', 'velvet', 'breezy', 'glowing',
];

const NOUNS = [
  'panda', 'falcon', 'tiger', 'fox', 'wolf', 'otter', 'lemur', 'raven',
  'eagle', 'comet', 'rocket', 'pixel', 'whale', 'owl', 'rabbit',
  'hedgehog', 'narwhal', 'phoenix', 'dragon', 'koala', 'yeti', 'hawk',
  'kite', 'wave', 'ember', 'puffin', 'lynx', 'moose', 'robin', 'swan',
  'tortoise', 'dolphin', 'bison', 'stag', 'gazelle', 'axolotl',
  'platypus', 'macaw', 'orchid', 'planet', 'meteor', 'aurora', 'nebula',
  'cloud', 'compass', 'lantern', 'feather', 'pebble',
];

/** Random-pick helper that's not biased toward index 0. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a friendly, lower-case `adjective_noun_NN` username.
 * The numeric suffix gives us a wide collision-free space without
 * making the username feel like a serial number.
 */
export function generateUsername(): string {
  const adj = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const num = Math.floor(Math.random() * 90) + 10; // 10..99
  return `${adj}_${noun}_${num}`;
}

/**
 * Sync validation. Returns a human-readable error or `null` if the
 * input is locally valid (it still has to pass the async availability
 * check before it can be claimed).
 */
export function validateUsername(input: string): string | null {
  const v = input.trim();
  if (v.length === 0) return 'Username is required';
  if (v.length < 3) return 'Use at least 3 characters';
  if (v.length > 20) return 'Keep it under 20 characters';
  // Only lowercase a-z, 0-9 and underscore. No spaces, no hyphens.
  // Forces the namespace to feel like an actual handle.
  if (!/^[a-z0-9_]+$/.test(v)) {
    return 'Only lowercase letters, numbers and underscores';
  }
  if (/^_|_$/.test(v)) return 'Cannot start or end with an underscore';
  if (/__/.test(v)) return 'Avoid consecutive underscores';
  if (RESERVED.has(v)) return 'That username is reserved';
  return null;
}

/**
 * Check if a username is free via the API.
 * Returns `false` for locally-invalid inputs as well.
 */
export async function isUsernameAvailable(input: string): Promise<boolean> {
  const v = input.trim().toLowerCase();
  if (validateUsername(v) !== null) return false;
  const { checkUsernameAvailable } = await import('@/lib/api/auth-api');
  try {
    return await checkUsernameAvailable(v);
  } catch {
    // Offline fallback for dev — treat as unavailable to avoid false positives.
    return false;
  }
}

/** Server claims username on PATCH /v1/me — kept for profile-setup call site. */
export async function markUsernameTaken(_input: string): Promise<void> {
  return;
}

/**
 * Suggest a username that's both locally-valid AND available. We loop
 * a small number of times before giving up and returning the last
 * candidate as-is — the calling screen will surface the "taken" state
 * and the user can tap Suggest again.
 */
export async function suggestAvailableUsername(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = generateUsername();
    // eslint-disable-next-line no-await-in-loop -- sequential by design
    if (await isUsernameAvailable(candidate)) {
      return candidate;
    }
  }
  return generateUsername();
}
