## RPG Retention & Trust Pass

Four workstreams to close the retention and reliability gaps before the App Store port. Additive only — no changes to existing combat balance beyond what is already shipped.

---

### A. PvP regression smoke test (do first)

Combat math changed when loot attack bonuses and passive HP regen were added. Two-player PvP has not been re-verified since.

- Drive two browser sessions against the live preview, join the same PvP room, and play a full match to a win/loss.
- Verify: HP totals agree on both clients, loot bonuses apply symmetrically, regen does not desync turn state, the winner/loser rank award fires exactly once each.
- Fix whatever the run surfaces. If nothing breaks, record it and move on — no speculative refactor.

**Why first:** a desync on launch day is the single highest-cost defect, and it gates whether B–D are worth building on top.

---

### B. RPG onboarding coach-marks

Loot Locker, gear equipping, Season Pass, Ranks, and highlight sharing are all reachable but nothing teaches them. New students never find the depth.

- New component: a lightweight 5-step coach-mark overlay (spotlight + tooltip + Next/Skip), styled with existing design tokens.
- Steps: Gear Locker → Equip an item → Daily Hub / Quests → Season Pass tiers → Ranks tab.
- Shown once per user; completion flag persisted so it never re-nags. Re-runnable from the game header settings gear.
- Respects the existing visual-restraint rule: solid colors, no bouncing, slow fades.

---

### C. Weekly parent digest email

Parents currently have no recurring reason to see value from RPG mode — this is the purchase trigger.

- New app-email template: "This week in the Adventure" — bosses defeated, battles won, current rank/tier, active title, words/phonemes practiced, one shareable highlight link.
- Sent once weekly per linked parent, using the existing parent-student link and notification-preference tables so opted-out parents are excluded.
- Scheduled weekly via the backend scheduler; each send is a single recipient triggered by that child's own week — not a bulk list.
- Requires the project's email domain to be configured; if it isn't yet, that setup dialog runs first.

---

### D. Database-driven seasons

`CURRENT_SEASON` is hardcoded in `src/lib/rpgSeasonPass.ts` as `season-2026-w30`, running `2026-07-20` → `2026-07-27`. When it ends, there is no next season and no way to add one without a code deploy.

- New `rpg_seasons` table (id, name, theme color, starts/ends, tiers as JSONB, active flag) with grants + RLS: everyone reads, only super admins write.
- Seed it with the current Ember Trials config so nothing regresses.
- New hook reads the active season from the database; `CURRENT_SEASON` stays exported as a fallback constant so existing call sites keep compiling during the swap.
- Small super-admin screen to create/activate the next season and edit tier rewards.

Also in scope here: widen the daily-quest pool. Today only three quest types exist (`defeat_enemies`, `defeat_bosses`, `battle_wins`). Add several more (perfect-accuracy battles, words read, streak days, minigame wins) and have the daily roll pick 3 from the pool so the board actually varies day to day.

---

### Explicitly out of scope

New bosses, new loot rarities, boss audio stingers, in-battle friend-activity ticker. All post-launch.

---

### Technical notes

- Order matters: A gates the rest. B and C are independent and can land in parallel. D touches the database and should land last so the seasons migration doesn't collide with anything.
- C and D both need migrations; each will be surfaced for approval separately.
- Typecheck after each workstream, not just at the end.
