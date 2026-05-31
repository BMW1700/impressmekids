# Plan: Today's Three Workstreams

Three things you asked about. Below is the truth on each, with the exact steps.

---

## 1. App Store remaining items — walkthrough for today

You can finish everything code-side today. The 4 manual items need a Mac with Xcode + a paid Apple Developer account ($99/yr). If you don't have those, the code is ready and you just press pause until you do.

### A. Seed the demo reviewer accounts (5 min, you do it)
1. Open the published app, sign in as a platform admin.
2. Open browser DevTools → Console.
3. Paste:
   ```js
   const { data, error } = await window.supabase.functions.invoke('seed-demo-accounts');
   console.log(data, error);
   ```
4. Verify the 3 accounts exist by signing into each:
   - `demo-student@nabulearn.com / DemoStudent2026!`
   - `demo-teacher@nabulearn.com / DemoTeacher2026!`
   - `demo-parent@nabulearn.com / DemoParent2026!`

### B. Add iOS native project (15 min, on Mac)
1. `git pull` your GitHub export
2. `npm install`
3. `npx cap add ios`
4. Open `ios/App/App/Info.plist`, paste the 4 keys from `docs/ios-info-plist-additions.md`
5. `npx capacitor-assets generate` (uses `resources/icon.png` + `resources/splash.png` we already created)
6. `npm run build && npx cap sync ios`
7. `npx cap open ios`

### C. Xcode signing + capabilities (10 min)
1. Signing & Capabilities tab → select your Apple Developer team
2. Click "+ Capability" → add "Sign In with Apple"
3. Click "+ Capability" → add "Push Notifications" (only if you want native pushes at launch; otherwise skip)

### D. Apple Developer Console (15 min, web)
1. developer.apple.com → Certificates, IDs & Profiles → Identifiers → your bundle ID → enable "Sign In with Apple"
2. (Optional) Keys → create APNs key, download `.p8`, upload to Lovable Cloud → Auth → Push if you enabled push capability

### E. App Store Connect (30–45 min, web)
1. Create the app (use bundle ID, Education category, age 4+)
2. App Privacy → paste the nutrition-label table from `docs/app-store-submission.md` § 2
3. App Review → paste reviewer notes from `docs/app-store-submission.md` § 7
4. Pricing → Free
5. Upload screenshots (see next step)

### F. Capture screenshots (30 min)
On the iPhone simulator (Xcode → Window → Devices and Simulators), run the app and capture the 6 scenes listed in `docs/app-store-submission.md` § 8. Drag into App Store Connect.

### G. Archive + upload (15 min)
1. Xcode → Product → Archive
2. Distribute App → App Store Connect → Upload
3. Wait ~10 min for processing
4. Submit for review

**Total today if you have a Mac + Apple dev account: 2–3 hours.**
**Apple review turnaround: usually 24–48h.**

---

## 2. Why Elara / Cypher feel "less accurate" in 5-word mode

Looking at your screenshot, the ECHO indicator IS firing ("ECHO! 1.1s" on `flooded`). So the system is detecting wrong words. But you're right to be suspicious — the **5-word batch reader** (`WordByWordReader.tsx`) takes a different code path than the single-word characters.

### The accuracy difference (audit findings)
- Single-word characters use a tight per-word recogniser that retries up to 3× before marking wrong, plays the correct pronunciation, and shows a "Thinking…" state while the recogniser settles.
- The 5-word batch reader uses **continuous recognition** with `pending-incorrect` grace states (3s) and **silent fail** — comment in code literally says *"incorrect words are tracked silently"* (line 991).
- That means for Elara/Cypher, when you miss a word: no audio pronunciation replay, no "Thinking…" pill in the gap, and the echo retry only fires on the LAST word of the batch (because the batch keeps flowing).

### What we'll fix to match single-word accuracy
1. **Play correct pronunciation** for every word marked incorrect in batch mode (currently suppressed)
2. **Show "Thinking…" pulse** during the 3s pending-incorrect grace window
3. **Add per-word ECHO retry** inside batches — not only at batch-end — so a missed word gets one re-listen pass before the batch advances
4. **Use the same phoneme/homophone matcher** the single-word path uses (verify they're aligned)
5. **Lower the speed-bonus damage multiplier slightly** if accuracy < 80% so kids can't cheese fast-mode by slurring

Net effect: same evaluation quality as Valor/Architect, just delivered in 5-word bursts.

---

## 3. Castle Swarm Defense — brutally honest audit

**Verdict: it's solid but not "addicting." It's a 1-week-of-play game right now.** Here's what's missing for "kids play it for months":

### What exists today
- 10 levels per grade mode (K-5 + 6-12) ✅
- 5 enemy types (goblin, skeleton, bat, shaman, orc) ✅
- 3 upgrade tracks (HP / Damage / Summon Cap) ✅
- One hero type (knight) ❌ — you're right, this is thin
- No infinite mode ❌
- No PvP / raids ❌
- No armor / loadout ❌
- ~10 stories shared with RPG ❌ (needs castle-specific lore)

### What we'll build (in order of impact)

#### Phase 1 — Depth (1–2 sessions)
1. **Infinite Mode ("Endless Siege")** — waves scale forever, leaderboard by waves survived + words read. Reads as long as the kid wants. Gold rewards scale with wave count. This alone doubles session length.
2. **3 new hero classes** beyond Knight:
   - **Archer** — ranged, low HP, cheap
   - **Paladin** — tank, heals nearby knights every 5 correct words
   - **Mage** — AoE, expensive but clears bats instantly
   Selectable from castle, mixed in your summon roster.
3. **Armor / Equipment system** — 8 slots (helm, chest, gloves, boots, weapon, shield, ring, banner). Drops from boss waves. Affects HP/DMG/crit/word-bonus. Inventory page.

#### Phase 2 — Content (1 session)
4. **+15 levels per grade mode** (total 25 each) with 4 new enemy types: Necromancer (summons skeletons), Wyvern (fast flyer), Berserker (rages low HP), Lich (boss).
5. **5 new castle-specific story arcs** (replaces shared RPG stories): "The Goblin King's Return", "Frost Invasion", "Sky Pirates", "Necromancer's Tower", "The Final Siege" — each is a 5-level mini-campaign with cutscene cards.
6. **10 new upgrade tracks**: Wall HP, Gate HP, Tower Range, Tower DPS, Critical Chance, Gold Find, Knight Speed, Mana Regen, Spell Cooldown, Boss Damage.

#### Phase 3 — Multiplayer Raids (the addiction loop, 2 sessions)
7. **Kingdom Raids (async PvP)** — each kid's castle has a defense layout (stored). Other kids can "invade" by playing a defensive version where the attacker reads and the AI defends with the defender's loadout. Win = steal 10% of their gold + trophies. Lose = small trophy penalty.
8. **Trophy leaderboard** — weekly classroom + global. Top 3 each week get a cosmetic banner.
9. **Revenge notifications** — if someone raids you, you get a "Counter-Raid" button.
10. **Defense replays** — watch a raid attempt on your castle.

#### Phase 4 — Retention hooks
11. **Daily Castle Quests** — "Read 50 words", "Win 3 raids", "Defeat a Lich" → bonus chests
12. **Battle Pass-style season track** (free) — 30 tiers of cosmetic rewards over 30 days
13. **Achievement system** — 60+ achievements with titles

### Technical notes
- All data already RLS-scoped on `castle_*` tables; PvP needs a new `castle_raids` table + edge function for matchmaking.
- Hero classes = enum extension on `castle_upgrades` + sprite components (reuse RPG sprite system).
- Armor = new `castle_equipment` table + inventory hook.
- Infinite mode = new `castle_swarm_runs.mode = 'infinite'` discriminator + leaderboard view.

---

## What I recommend you approve today

**Option A — "Ship it" focus:** Do workstream 1 (App Store) + workstream 2 (Elara/Cypher accuracy fix) only. Submit to Apple tonight/tomorrow. Ship Castle Swarm depth in v1.1.

**Option B — "Make it addicting first":** Do workstream 2 (accuracy) + workstream 3 Phase 1 + Phase 2 (heroes, armor, infinite, +15 levels). Skip App Store for 3–4 days. Submit a much stronger v1.0.

**Option C — "All of it":** Everything above. ~4–5 days of build, then submit. Highest quality v1.0 but delays distribution.

My honest recommendation: **Option B.** Apple review is a 24–48h queue anyway, and "Endless Siege + Raids + 4 heroes" is the difference between a kid playing for a week vs. a year. The App Store form-filling can happen in parallel while I build.

Tell me A, B, or C and I'll execute.
