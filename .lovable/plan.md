## Fix the Challenge Meter popover

Right now the popover locks students out by role. That's wrong. The dial should be open to whoever is using the app so a kid or a parent can bump it up or down themselves. The only lock is one the parent chooses to add — a PIN they set and only they know.

### What changes

**1. Popover — open by default**
- Remove the "Ask a grown-up" role gate.
- Everyone signed in sees the full slider + Save button by default.
- Chip label + slider behavior stays exactly as it is now.

**2. Optional parent PIN lock**
- Add a "Lock this setting" section in `/parent/challenge-settings` (parent-only page).
- Parent can:
  - Set a 4–6 digit PIN → future edits from the popover require it.
  - Change the PIN (must enter current one).
  - Remove the lock entirely.
- When a lock exists:
  - Popover shows the slider read-only + a small "🔒 Locked — enter PIN to change" input.
  - Correct PIN unlocks the Save button for that session only (not persisted).
  - Wrong PIN → toast + no change.
- When no lock exists → popover behaves openly as in step 1.

**3. Where the PIN lives**
- New columns on `challenge_settings`:
  - `lock_pin_hash text` (bcrypt-style hash via `crypto.subtle` on the client → stored as SHA-256 hex; simple + adequate for a 4-digit gate, no server round-trip needed).
  - `lock_set_by uuid` (the parent user_id that set it).
  - `lock_enabled boolean default false`.
- RLS: parents/teachers keep write access as today; the popover just reads `lock_enabled` + verifies the hash client-side.

**4. School Mode gate — untouched**
- `/school/setup` role-selection remains exactly as it is. This change only touches the ChallengeQuickAdjust popover and the parent settings page. Nothing else moves.

### Files touched

- `src/components/challenge/ChallengeQuickAdjust.tsx` — drop role gate, add PIN entry UI when `lock_enabled`.
- `src/pages/parent/ChallengeSettings.tsx` — add "Lock with PIN" card (set / change / remove).
- `src/hooks/useChallengeSettings.ts` — surface `lock_enabled` + `lock_pin_hash`; add `setLock(pin)` / `clearLock()` helpers.
- Migration: add the three columns to `challenge_settings`.

### Out of scope
- No changes to School Mode setup, RPG dashboard chip placement, Pre-K header chip placement, or matcher logic. Level values continue to save live to the same row.
