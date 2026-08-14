// phonicsSegmenter — turn a word into an ordered list of TTS segments so the
// Teach flow plays tiny, controlled phoneme chunks with real pauses between
// each piece instead of ElevenLabs mumbling everything in one take.

export type SegKind =
  | "whole"      // the whole word, spoken naturally
  | "narration"  // Sir Bookears narrator lines like "Let's sound it out."
  | "letter"     // a letter name ("C", "S H" for digraphs)
  | "sound"      // isolated phoneme(s), or the full sounded-out word
  | "syllable"   // one syllable of a multi-syllable word
  | "blend";     // the syllables/sounds blended: "rab — bit"

export interface Segment {
  kind: SegKind;
  /** The exact text sent to ElevenLabs. Deterministic — used as cache key. */
  text: string;
  /** How long to wait (ms) after this segment finishes, before the next. */
  gapAfterMs: number;
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const DIGRAPHS = ["sh", "ch", "th", "ph", "wh", "ck", "ng"];

// Sound-out spellings ElevenLabs pronounces reasonably. Keep short.
const SHORT_SOUND: Record<string, string> = {
  a: "aaa", b: "buh", c: "kuh", d: "duh", e: "ehh", f: "fff",
  g: "guh", h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll",
  m: "mmm", n: "nnn", o: "aah", p: "puh", q: "kwuh", r: "rrr",
  s: "sss", t: "tuh", u: "uh", v: "vvv", w: "wuh", x: "ks",
  y: "yuh", z: "zzz",
  sh: "shhh", ch: "chuh", th: "thh", ph: "fff", wh: "wuh", ck: "kuh", ng: "ngg",
};

const LONG_VOWEL: Record<string, string> = {
  a: "ayy", e: "eee", i: "eye", o: "ohh", u: "yoo",
};

/** Break the word into letter/digraph tokens (case-insensitive input). */
function tokenize(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    const pair = w.slice(i, i + 2);
    if (DIGRAPHS.includes(pair)) {
      out.push(pair);
      i++;
    } else {
      out.push(w[i]);
    }
  }
  return out;
}

/** Detect classic silent-e CVCe pattern (cake, kite, bone, cube). */
function isSilentE(word: string): boolean {
  const w = word.toLowerCase();
  return /^[bcdfghjklmnpqrstvwxyz]+[aeiou][bcdfghjklmnpqrstvwxyz]e$/.test(w);
}

/** Rough syllable split for multi-vowel words (rabbit → rab-bit, apple → ap-ple). */
function splitSyllables(word: string): string[] {
  const w = word.toLowerCase();
  const parts: string[] = [];
  let cur = "";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    const isVowel = VOWELS.has(ch);
    cur += ch;
    // Split at a vowel-then-consonant boundary once we already have a vowel
    if (
      isVowel &&
      !prevVowel &&
      cur.length > 1 &&
      i + 1 < w.length &&
      !VOWELS.has(w[i + 1])
    ) {
      // Take the next consonant with the current syllable for VCCV → VC-CV
      if (i + 2 < w.length && !VOWELS.has(w[i + 2])) {
        cur += w[i + 1];
        i++;
      }
      parts.push(cur);
      cur = "";
    }
    prevVowel = isVowel;
  }
  if (cur) parts.push(cur);
  return parts.length > 0 ? parts : [w];
}

/** Letter-name text for TTS. Digraphs read as separated letters ("S H"). */
function letterName(token: string): string {
  return token.toUpperCase().split("").join(" ");
}

/** Sound text for TTS for a single token, honoring silent-e for the vowel. */
function tokenSound(token: string, silentELongVowel: boolean): string {
  if (silentELongVowel && token.length === 1 && LONG_VOWEL[token]) {
    return LONG_VOWEL[token];
  }
  return SHORT_SOUND[token] ?? token;
}

const NARRATION = "Let's sound it out.";

export function segmentWord(rawWord: string): Segment[] {
  const word = (rawWord ?? "").trim();
  if (!word) return [];
  const clean = word.replace(/[^a-zA-Z']/g, "");
  if (!clean) return [];

  const tokens = tokenize(clean);
  const silentE = isSilentE(clean);
  // Effective tokens for the silent-e case: drop the trailing 'e' from
  // sounding out but keep it in the letter-name pass.
  const soundTokens = silentE ? tokens.slice(0, -1) : tokens;

  const isShort = tokens.length <= 4 && splitSyllables(clean).length <= 1;

  const segs: Segment[] = [];
  // 1) narrator lead-in. Do not say the whole word first: the word is already
  // on screen, and saying it at both ends made Teach sound repetitive.
  segs.push({ kind: "narration", text: NARRATION, gapAfterMs: 500 });

  if (isShort) {
    // 2) isolated phoneme sounds, one at a time
    soundTokens.forEach((tok, i) => {
      segs.push({
        kind: "sound",
        text: tokenSound(tok, silentE),
        gapAfterMs: i === soundTokens.length - 1 ? 700 : 600,
      });
    });
    // 3) blend the phonemes together
    const soundText = soundTokens.map((t) => tokenSound(t, silentE)).join(" — ");
    segs.push({ kind: "blend", text: soundText, gapAfterMs: 700 });
  } else {
    // multi-syllable path
    const syls = splitSyllables(clean);
    syls.forEach((s, i) => {
      segs.push({
        kind: "syllable",
        text: s,
        gapAfterMs: i === syls.length - 1 ? 700 : 550,
      });
    });
    segs.push({
      kind: "blend",
      text: syls.join(" — "),
      gapAfterMs: 700,
    });
  }

  // 5) final whole word (the "click" moment)
  segs.push({ kind: "whole", text: clean, gapAfterMs: 0 });
  return segs;
}

/** Stable slug for the storage cache path — matches edge function slugify. */
export function slugSegmentText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Enumerate the (kind, text) pairs a prewarm run must cache for one word. */
export function segmentCacheEntries(word: string): Array<{ kind: SegKind; text: string; slug: string }> {
  const seen = new Set<string>();
  const out: Array<{ kind: SegKind; text: string; slug: string }> = [];
  for (const seg of segmentWord(word)) {
    const slug = slugSegmentText(seg.text);
    const key = `${seg.kind}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: seg.kind, text: seg.text, slug });
  }
  return out;
}
