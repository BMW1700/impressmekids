/**
 * Challenge Meter matcher self-check.
 *
 * Not wired to a test runner — call `runChallengeMeterSelfCheck()` from a
 * dev script or the browser console to verify the dial actually changes
 * acceptance without pulling a new test framework into the bundle.
 */

import {
  isWordMatchLenient,
  isWordMatchStrict,
} from '@/lib/wordMatchingModes';
import { CHALLENGE_LEVELS } from '@/lib/challengeMeter';

export function runChallengeMeterSelfCheck(): { passed: number; failed: string[] } {
  const failed: string[] = [];
  let passed = 0;
  const assert = (name: string, cond: boolean) => {
    if (cond) passed++;
    else failed.push(name);
  };

  const levels = [1, 2, 3, 4, 5] as const;
  const cases: Array<[string, string]> = [
    ['cat', 'cat'], ['catt', 'cat'], ['kat', 'cat'],
    ['elphant', 'elephant'], ['exelent', 'excellent'],
    ['da', 'the'], ['free', 'three'], ['banana', 'apple'],
  ];

  // Monotonicity: if a stricter level accepts, every easier level must too.
  for (const [spoken, expected] of cases) {
    const results = levels.map((lvl) =>
      isWordMatchLenient(spoken, expected, CHALLENGE_LEVELS[lvl]),
    );
    for (let i = 1; i < results.length; i++) {
      if (results[i]) {
        assert(
          `monotonic("${spoken}","${expected}") level ${levels[i]}`,
          results.slice(0, i).every(Boolean),
        );
      }
    }
  }

  assert('strict L5 accepts exact', isWordMatchStrict('cat', 'cat', CHALLENGE_LEVELS[5]));
  assert('strict L5 accepts true homophone', isWordMatchStrict('two', 'to', CHALLENGE_LEVELS[5]));
  assert('strict L5 rejects phonics confusion', !isWordMatchStrict('free', 'three', CHALLENGE_LEVELS[5]));
  assert('strict L5 rejects 1-char sub on short', !isWordMatchStrict('kat', 'cat', CHALLENGE_LEVELS[5]));
  assert('L1 accepts 1-char sub short', isWordMatchLenient('kat', 'cat', CHALLENGE_LEVELS[1]));
  assert('L1 accepts extra char short', isWordMatchLenient('catt', 'cat', CHALLENGE_LEVELS[1]));

  for (const lvl of levels) {
    assert(`L${lvl} rejects banana/apple lenient`, !isWordMatchLenient('banana', 'apple', CHALLENGE_LEVELS[lvl]));
    assert(`L${lvl} rejects banana/apple strict`, !isWordMatchStrict('banana', 'apple', CHALLENGE_LEVELS[lvl]));
  }

  return { passed, failed };
}
