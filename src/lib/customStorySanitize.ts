/**
 * Custom Story sanitization + tokenization.
 *
 * Used by:
 *   - The editor (client-side validation before submit)
 *   - K-12 RPG reader (tokenize override into word/phrase list)
 *   - Castle Swarm StoryRunner (build a synthetic story from override text)
 */

const MIN_BODY = 50;
const MAX_BODY = 5000;
const MAX_TITLE = 80;

// Tiny on-device profanity wall. The DB CHECK constraints + RLS already cap
// length; this catches obvious cases before submission. Intentionally short —
// "light tier" per product decision.
const BLOCKED_WORDS = [
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "fag",
  "nigger", "nigga", "retard", "slut", "whore", "bastard",
];

const URL_RE = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9.-]+\.(?:com|net|org|io|co|gg|tv|app|dev|me|us|uk|edu|gov)\b/i;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;

export interface SanitizeResult {
  ok: boolean;
  error?: string;
  cleaned?: string;
}

export function sanitizeTitle(raw: string): SanitizeResult {
  const t = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!t) return { ok: false, error: "Please give it a title." };
  if (t.length > MAX_TITLE) return { ok: false, error: `Title must be ${MAX_TITLE} characters or fewer.` };
  if (containsProfanity(t)) return { ok: false, error: "Please use kid-friendly language in the title." };
  return { ok: true, cleaned: t };
}

export function sanitizeBody(raw: string): SanitizeResult {
  // Normalize whitespace: collapse runs of spaces/tabs, allow up to 2 line breaks.
  const stripped = (raw ?? "")
    // Drop control chars except \n and \t
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    // Normalize windows line endings
    .replace(/\r\n?/g, "\n")
    // Cap consecutive blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Collapse runs of spaces/tabs
    .replace(/[ \t]+/g, " ")
    .trim();

  if (stripped.length < MIN_BODY) {
    return { ok: false, error: `Story must be at least ${MIN_BODY} characters.` };
  }
  if (stripped.length > MAX_BODY) {
    return { ok: false, error: `Story must be ${MAX_BODY} characters or fewer.` };
  }
  if (URL_RE.test(stripped)) {
    return { ok: false, error: "Links aren't allowed in stories." };
  }
  if (EMAIL_RE.test(stripped)) {
    return { ok: false, error: "Email addresses aren't allowed in stories." };
  }
  if (containsProfanity(stripped)) {
    return { ok: false, error: "Please use kid-friendly language." };
  }
  return { ok: true, cleaned: stripped };
}

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
}

// ---------- Tokenization for gameplay ----------

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z"'(\u2018\u201C])/g;
const WORD_TOKEN = /[a-zA-Z']+/g;

export function splitIntoSentences(body: string): string[] {
  return body
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Word list suitable for RPGWordReader (lowercased, 1-20 chars, alpha+apostrophes). */
export function tokenizeWords(body: string): string[] {
  const out: string[] = [];
  for (const match of body.toLowerCase().matchAll(WORD_TOKEN)) {
    const w = match[0];
    if (w.length >= 1 && w.length <= 20) out.push(w);
  }
  return out;
}

export const CUSTOM_STORY_LIMITS = {
  MIN_BODY,
  MAX_BODY,
  MAX_TITLE,
};
