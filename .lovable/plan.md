## Verify inactive-side pause behavior

Drive Playwright headless against `localhost:8080/` to confirm:

1. **Benny video pauses when RPG side is hovered.**
   - Land on `/`, screenshot baseline.
   - Read `videoRef` element's `.paused` property — should be `false` initially.
   - Hover the RPG panel.
   - Re-read `.paused` — should flip to `true`.
   - Screenshot.

2. **RPG battle stepper pauses when Benny side is hovered.**
   - Capture the RPG "NOW READING" word-row text.
   - Hover Benny panel, wait ~2s.
   - Re-capture the same word-row text — should be unchanged (stepper frozen).
   - Screenshot.

3. **Resuming works.**
   - Move mouse off both panels.
   - Confirm Benny video `.paused === false` again and RPG word row advances.

Report findings (pass/fail per check) with screenshot evidence. No code changes — pure verification. If any check fails, come back with a follow-up plan to fix.
