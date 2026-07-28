/**
 * Per-student scoping for RPG onboarding flags.
 *
 * Coach marks and the block-training counter used to live under a single
 * device-wide localStorage key. On a shared classroom iPad that meant the
 * first child through consumed the tutorial for everyone else on that tablet.
 *
 * These helpers suffix each key with the signed-in user id so every student
 * gets taught the fight exactly once. When there is no session (signed-out
 * demo play) we fall back to the original device-wide key, so single-user
 * devices behave exactly as before.
 */

const PROJECT_REF = 'sjigkjwkgovculkovcjy';
const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

/**
 * Reads the current user id straight out of the Supabase auth token in
 * localStorage. Synchronous by design: the arena reads these flags inside
 * `useState` initialisers, before any async auth hook has settled.
 */
function currentUserId(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = parsed?.user?.id ?? parsed?.currentSession?.user?.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/** `base` for signed-out play, `base:<uid>` for a signed-in student. */
export function scopedTutorialKey(base: string): string {
  const uid = currentUserId();
  return uid ? `${base}:${uid}` : base;
}

export function readScopedFlag(base: string): string | null {
  try {
    return localStorage.getItem(scopedTutorialKey(base));
  } catch {
    return null;
  }
}

export function writeScopedFlag(base: string, value: string) {
  try {
    localStorage.setItem(scopedTutorialKey(base), value);
  } catch {
    /* private mode — the flag is simply session-only */
  }
}
