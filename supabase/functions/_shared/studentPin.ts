/**
 * Student PIN hashing + classroom username helpers.
 *
 * Zero-plaintext policy: PINs are stored only as PBKDF2-SHA256 hashes
 * with a per-student random salt. The plaintext PIN exists exactly once,
 * in the response of the provisioning/reset call, so the teacher can
 * print it. It is never written to the database or to logs.
 */

const PBKDF2_ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

export function generatePin(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time-ish comparison. */
export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return diff === 0;
}

export const isValidPin = (v: string) => /^\d{6}$/.test(v);

/** first name + last initial, lowercased, e.g. "maria.g" */
export function baseUsername(fullName: string): string {
  const clean = fullName.trim().toLowerCase().replace(/[^a-z\s'-]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = (parts[0] || 'student').replace(/[^a-z]/g, '').slice(0, 12) || 'student';
  const lastInitial = (parts[1] || '').replace(/[^a-z]/g, '').slice(0, 1);
  return lastInitial ? `${first}.${lastInitial}` : first;
}

/** Ensure uniqueness within a set of already-taken usernames. */
export function uniqueUsername(fullName: string, taken: Set<string>): string {
  const base = baseUsername(fullName);
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}${i}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  const fallback = `${base}${Date.now().toString().slice(-4)}`;
  taken.add(fallback);
  return fallback;
}

export const isValidUsername = (v: string) => /^[a-z0-9._-]{2,32}$/.test(v);
