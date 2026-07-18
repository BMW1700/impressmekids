import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useChallengeSettings } from '@/hooks/useChallengeSettings';
import {
  DEFAULT_CHALLENGE_LEVEL,
  getChallengeThresholds,
  type ChallengeLevel,
  type ChallengeThresholds,
} from '@/lib/challengeMeter';
import {
  isWordMatchLenient,
  isWordMatchStrict,
  isWordMatchBattle,
  matchWithPhonemes,
  findWordInWindow,
  findWordInFullTranscript,
  matchWithAlternatives,
  analyzeWordMatch,
} from '@/lib/wordMatchingModes';

interface ChallengeContextValue {
  level: ChallengeLevel;
  thresholds: ChallengeThresholds;
  matchers: {
    lenient: (spoken: string, expected: string) => boolean;
    strict: (spoken: string, expected: string) => boolean;
    battle: (spoken: string, expected: string) => boolean;
    phonemes: (spoken: string, expected: string) => ReturnType<typeof matchWithPhonemes>;
    findInWindow: (
      spoken: string,
      expectedWords: string[],
      startIdx: number,
      windowSize?: number,
      useLenient?: boolean,
    ) => ReturnType<typeof findWordInWindow>;
    findInTranscript: (expected: string, transcript: string, useLenient?: boolean) => boolean;
    alternatives: (
      alts: string[],
      expected: string,
      useLenient?: boolean,
    ) => ReturnType<typeof matchWithAlternatives>;
    analyze: (
      spoken: string,
      expected: string,
      speechConfidence?: number,
      isStrictMode?: boolean,
    ) => ReturnType<typeof analyzeWordMatch>;
  };
}

const defaultThresholds = getChallengeThresholds(DEFAULT_CHALLENGE_LEVEL);
const ChallengeCtx = createContext<ChallengeContextValue | null>(null);

/**
 * Provider wired to a specific student. Any reader inside the tree can call
 * useChallengeMatchers() to get thresholds-aware matcher functions that
 * update live when the parent or teacher moves the slider.
 */
export function ChallengeProvider({
  studentId,
  children,
}: {
  studentId: string | null | undefined;
  children: ReactNode;
}) {
  const { level, thresholds } = useChallengeSettings(studentId);

  const value = useMemo<ChallengeContextValue>(() => ({
    level,
    thresholds,
    matchers: {
      lenient: (s, e) => isWordMatchLenient(s, e, thresholds),
      strict: (s, e) => isWordMatchStrict(s, e, thresholds),
      battle: (s, e) => isWordMatchBattle(s, e, thresholds),
      phonemes: (s, e) => matchWithPhonemes(s, e, undefined, thresholds),
      findInWindow: (s, ew, si, ws = 5, ul = true) =>
        findWordInWindow(s, ew, si, ws, ul, thresholds),
      findInTranscript: (e, t, ul = true) => findWordInFullTranscript(e, t, ul, thresholds),
      alternatives: (alts, e, ul = true) => matchWithAlternatives(alts, e, ul, thresholds),
      analyze: (s, e, sc = 1, strict = false) => analyzeWordMatch(s, e, sc, strict, thresholds),
    },
  }), [level, thresholds]);

  return <ChallengeCtx.Provider value={value}>{children}</ChallengeCtx.Provider>;
}

/**
 * Falls back to level-3 (Standard) matchers when used outside a provider so
 * existing readers continue to work exactly as they do today.
 */
export function useChallengeMatchers(): ChallengeContextValue {
  const ctx = useContext(ChallengeCtx);
  if (ctx) return ctx;
  return {
    level: DEFAULT_CHALLENGE_LEVEL,
    thresholds: defaultThresholds,
    matchers: {
      lenient: (s, e) => isWordMatchLenient(s, e),
      strict: (s, e) => isWordMatchStrict(s, e),
      battle: (s, e) => isWordMatchBattle(s, e),
      phonemes: (s, e) => matchWithPhonemes(s, e),
      findInWindow: (s, ew, si, ws = 5, ul = true) => findWordInWindow(s, ew, si, ws, ul),
      findInTranscript: (e, t, ul = true) => findWordInFullTranscript(e, t, ul),
      alternatives: (alts, e, ul = true) => matchWithAlternatives(alts, e, ul),
      analyze: (s, e, sc = 1, strict = false) => analyzeWordMatch(s, e, sc, strict),
    },
  };
}
