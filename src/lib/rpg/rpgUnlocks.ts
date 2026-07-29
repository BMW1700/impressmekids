/**
 * RPG progressive unlocks — the "focus pass".
 *
 * The problem this solves: a 7-year-old opening the Adventure was shown a
 * dashboard (store, gear locker, season pass, leaderboards, ranks, pets,
 * themes, five battle modes) before they had thrown a single punch. Nothing is
 * deleted — everything is SEQUENCED, so the first ten minutes are pure combat
 * and each system arrives later as its own celebratory moment.
 *
 * Storage is local and per-device on purpose: these gates are onboarding
 * pacing, not entitlements. Nothing here grants content a student hasn't
 * earned server-side, and losing the file just re-shows a tour.
 */

import { useCallback, useEffect, useState } from 'react';

export type UnlockKey = 'store' | 'gearLocker' | 'dailyHub' | 'leaderboard' | 'battleModes';

export interface RPGProgress {
  battlesWon: number;
  levelsCompleted: number;
  worldsCleared: number;
  /** Distinct calendar days the student has played. */
  daysPlayed: number;
  lastPlayedDay: string | null;
  /** Unlocks the student has already been shown the "NEW!" flourish for. */
  seen: UnlockKey[];
}

const KEY = 'rpg_progress_v1';

const EMPTY: RPGProgress = {
  battlesWon: 0,
  levelsCompleted: 0,
  worldsCleared: 0,
  daysPlayed: 0,
  lastPlayedDay: null,
  seen: [],
};

export function readProgress(): RPGProgress {
  if (typeof localStorage === 'undefined') return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY,
      ...parsed,
      // Coerce defensively — a hand-edited value must never crash the hub.
      battlesWon: Number(parsed?.battlesWon) || 0,
      levelsCompleted: Number(parsed?.levelsCompleted) || 0,
      worldsCleared: Number(parsed?.worldsCleared) || 0,
      daysPlayed: Number(parsed?.daysPlayed) || 0,
      seen: Array.isArray(parsed?.seen) ? parsed.seen : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

const listeners = new Set<(p: RPGProgress) => void>();

function writeProgress(next: RPGProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — pacing degrades to "everything visible" */
  }
  listeners.forEach((fn) => fn(next));
}

export function bumpProgress(patch: Partial<Omit<RPGProgress, 'seen' | 'lastPlayedDay'>>) {
  const cur = readProgress();
  writeProgress({
    ...cur,
    battlesWon: cur.battlesWon + (patch.battlesWon ?? 0),
    levelsCompleted: cur.levelsCompleted + (patch.levelsCompleted ?? 0),
    worldsCleared: cur.worldsCleared + (patch.worldsCleared ?? 0),
  });
}

/** Call once per session entry — drives the day-2 Daily Hub unlock. */
export function markPlayedToday() {
  const cur = readProgress();
  const today = new Date().toDateString();
  if (cur.lastPlayedDay === today) return;
  writeProgress({ ...cur, lastPlayedDay: today, daysPlayed: cur.daysPlayed + 1 });
}

export function markUnlockSeen(key: UnlockKey) {
  const cur = readProgress();
  if (cur.seen.includes(key)) return;
  writeProgress({ ...cur, seen: [...cur.seen, key] });
}

/* ------------------------------------------------------------------ */
/* Gates                                                               */
/* ------------------------------------------------------------------ */

// NOTE: gating is disabled — every hub panel (Shop, Gear Locker, Daily/Season,
// Ranks, Battle Modes) opens from the first session. The "NEW!" flourish logic
// below still runs so first-time discovery keeps its celebratory moment.
export const UNLOCK_RULES: Record<
  UnlockKey,
  { label: string; blurb: string; test: (p: RPGProgress) => boolean }
> = {
  store: {
    label: 'Shop',
    blurb: 'Spend your gold on gear and skins.',
    test: () => true,
  },
  gearLocker: {
    label: 'Gear Locker',
    blurb: 'Equip the loot you won in battle.',
    test: () => true,
  },
  dailyHub: {
    label: 'Daily & Season',
    blurb: 'Come back each day for streak rewards.',
    test: () => true,
  },
  leaderboard: {
    label: 'Ranks',
    blurb: 'See how your class stacks up.',
    test: () => true,
  },
  battleModes: {
    label: 'Battle Modes',
    blurb: 'Team up or duel a friend.',
    test: () => true,
  },
};


export function isUnlocked(key: UnlockKey, progress = readProgress()): boolean {
  return UNLOCK_RULES[key].test(progress);
}

/**
 * Live unlock state. `justUnlocked` is true for the first render after a gate
 * opens, so the caller can fire the "NEW!" flourish exactly once.
 */
export function useRPGUnlocks() {
  const [progress, setProgress] = useState<RPGProgress>(() => readProgress());

  useEffect(() => {
    const fn = (p: RPGProgress) => setProgress(p);
    listeners.add(fn);
    // Another tab (or the battle arena) may have written while we were away.
    setProgress(readProgress());
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const unlocked = useCallback(
    (key: UnlockKey) => UNLOCK_RULES[key].test(progress),
    [progress]
  );

  const justUnlocked = useCallback(
    (key: UnlockKey) => UNLOCK_RULES[key].test(progress) && !progress.seen.includes(key),
    [progress]
  );

  return { progress, unlocked, justUnlocked, markUnlockSeen };
}
