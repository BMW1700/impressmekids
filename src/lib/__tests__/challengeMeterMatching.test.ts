import { describe, it, expect } from 'vitest';
import {
  isWordMatchLenient,
  isWordMatchStrict,
} from '@/lib/wordMatchingModes';
import { CHALLENGE_LEVELS } from '@/lib/challengeMeter';

/**
 * Brutal-honest proof the Challenge Meter dial actually changes acceptance.
 * We assert monotonicity: anything accepted at a stricter level must also
 * be accepted at every more forgiving level.
 */
describe('Challenge Meter matcher monotonicity', () => {
  const levels = [1, 2, 3, 4, 5] as const;
  // (spoken, expected) pairs spanning perfect → messy child speech.
  const cases: Array<[string, string]> = [
    ['cat', 'cat'],           // exact
    ['catt', 'cat'],          // 1-char extra
    ['kat', 'cat'],           // 1-char sub (short word)
    ['elphant', 'elephant'],  // 1 missing char
    ['exelent', 'excellent'], // 2 missing chars
    ['da', 'the'],            // child speech variant (homophone map)
    ['free', 'three'],        // classic phonics confusion
    ['banana', 'apple'],      // totally wrong
  ];

  it('lenient acceptance shrinks monotonically from level 1 → 5', () => {
    for (const [spoken, expected] of cases) {
      const results = levels.map((lvl) =>
        isWordMatchLenient(spoken, expected, CHALLENGE_LEVELS[lvl]),
      );
      for (let i = 1; i < results.length; i++) {
        if (results[i] === true) {
          // If a stricter level accepted, every easier level must too.
          expect(results.slice(0, i).every(Boolean)).toBe(true);
        }
      }
    }
  });

  it('strict at level 5 requires exact / true-homophone matches only', () => {
    expect(isWordMatchStrict('cat', 'cat', CHALLENGE_LEVELS[5])).toBe(true);
    expect(isWordMatchStrict('two', 'to', CHALLENGE_LEVELS[5])).toBe(true);
    // "free"/"three" is a phonics-confusion pair (not a true homophone) — must fail at 5.
    expect(isWordMatchStrict('free', 'three', CHALLENGE_LEVELS[5])).toBe(false);
    expect(isWordMatchStrict('kat', 'cat', CHALLENGE_LEVELS[5])).toBe(false);
  });

  it('level 1 (Very Easy) accepts 1-char errors on short words', () => {
    expect(isWordMatchLenient('kat', 'cat', CHALLENGE_LEVELS[1])).toBe(true);
    expect(isWordMatchLenient('catt', 'cat', CHALLENGE_LEVELS[1])).toBe(true);
  });

  it('banana/apple never accepted at any level', () => {
    for (const lvl of levels) {
      expect(isWordMatchLenient('banana', 'apple', CHALLENGE_LEVELS[lvl])).toBe(false);
      expect(isWordMatchStrict('banana', 'apple', CHALLENGE_LEVELS[lvl])).toBe(false);
    }
  });
});
