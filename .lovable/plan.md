## Pre-K Benny upgrade

Targets the Pre-K Nabu adventure: `NabuAdventure.tsx` (state/triggers), `NabuScene.tsx` (in-scene sprite + grounding), `BennyDog.tsx` (mood images + crossfade + animations), `preKAdventures.ts` (copy), plus 4 new asset pointers.

### 1. Copy fix
- `src/data/preKAdventures.ts`: `goal: "Help Nabu visit Grandma!"` → `"Help Benny visit Grandma!"`. (This is the string shown top-center.)

### 2. Upload 7 new mood images
Per Lovable conventions, binary assets live on the Lovable CDN, not `public/assets/`. Each uploaded PNG becomes a `.asset.json` pointer under `src/assets/`. Pointers will be imported in `BennyDog.tsx` and keyed by mood:

- `benny-idle.png.asset.json` (replace — happy sitting, image #2)
- `benny-celebrate.png.asset.json` (replace — confetti jump, image #1)
- `benny-sad.png.asset.json` (replace — sad sitting, image #7)
- `benny-happy.png.asset.json` (new — image #2, happy sitting; reused tone for streak)
- `benny-excited.png.asset.json` (new — image #3, standing arms out)
- `benny-cheering.png.asset.json` (new — image #1 confetti, reused for level-complete fanfare)
- `benny-thinking.png.asset.json` (new — image #4, paw to chin)
- `benny-surprised.png.asset.json` (new — image #5, mouth open)
- `benny-sleepy.png.asset.json` (new — image #6, "zzz")

(Two pointers reuse a CDN image because the user supplied 7 photos for 9 named moods — `happy` reuses idle's smile; `cheering` reuses celebrate.)

### 3. `BennyDog.tsx` rewrite
New `BennyMood` union: `"idle" | "celebrate" | "sad" | "happy" | "excited" | "cheering" | "thinking" | "surprised" | "sleepy"`.

- Stack all 9 `<img>` elements absolutely positioned, all permanently mounted; only the active one has `opacity: 1`, others `opacity: 0`. Transition: `opacity 0.3s ease-in-out`. No unmount → no flicker.
- Inject a single `<style>` block of keyframes (once via `ensureKeyframes`):
  - `benny-idle-bounce` 1.8s infinite ease-in-out, translateY 0→-8→0
  - `benny-celebrate` 0.4s infinite, translateY -20px + scale 1.15
  - `benny-sad-shake` 0.4s ease-in-out 3 iterations, translateX ±8px
  - `benny-excited` 0.5s infinite, translateY bounce + rotate 360deg
  - `benny-cheering` 0.6s infinite, scale 1.2 + jump
  - `benny-happy` 1s infinite, gentle translateY bounce
  - `benny-thinking` 2s infinite, rotate ±6deg
  - `benny-surprised` 0.3s ease-out 1 iteration, scale 1.2 → 1
  - `benny-sleepy` 3s infinite ease-in-out, rotate ±3deg
- Active-mood class applied to a wrapper `<div>` that contains the stacked images, so the animation runs on the whole sprite while the crossfade happens underneath.
- For one-shot moods (`sad`, `surprised`) keep a `nonce` ref so re-entering the same mood replays the animation (re-key the wrapper).
- Default `size` 280; component absolute-positionable via `style`/`className`.

### 4. Feet planted on grass — `NabuScene.tsx`
Current rendering puts Benny inside the SVG via `<image y={-size}>` anchored at `NABU_START.y = 370` (grass top is `GROUND_Y = 380`). The uploaded PNGs contain transparent padding below the paws (~8–12% of the image height), so even with `y={-size}` the visible feet float above the grass.

Fix:
- Bump default `size` from 140 to 280 in `BennySprite`.
- Add a `FEET_PADDING_RATIO` constant (start at `0.08`) and render with `y = -size + size * FEET_PADDING_RATIO` so the visible feet sit on `GROUND_Y`. Tune by eye in the build step against the live preview.
- Replace the in-SVG `<image>` rendering with an HTML `<BennyDog>` overlay via `<foreignObject>` so the new crossfade + CSS keyframes work as written (SVG `<image>` cannot host stacked HTML or CSS animation classes). The `<foreignObject>` is wrapped in the existing `<motion.g>` so all per-scene `anim` helpers (jumpArc, bouncyWalk, walkTo, etc.) keep driving Benny's position unchanged.
- Adjust scene `anim` helpers that used `y: 370` etc. only if visual grounding requires it; the offset above means existing y-targets continue to mean "feet on grass."

### 5. Mood wiring in `NabuAdventure.tsx`
Extend `bennyMood` state to the full union and add timers/refs:

- `correct answer` → `celebrate` 2000ms → `idle` (existing)
- `wrong answer` → `sad` 1500ms → `idle` (existing)
- Track `correctStreak`; on streak reaching 3 → `happy` 2000ms → `idle` (overrides celebrate fade-down)
- `new word appears` (phase enters `reading` for a new `index`) → `surprised` 1000ms → `idle`
- Idle inactivity timer reset on any mic activity / phase change:
  - 5s with no result → `thinking`
  - 15s with no result → `sleepy`
- End-of-level: if `correct === total && total >= 5` → `excited` 3000ms; on `ending` phase → `cheering` 3000ms (cheering wins if both apply).

All mood transitions go through a single `setMood(mood, ms)` helper that clears the previous timer so overlapping triggers don't fight. Existing scoring, speech, scene phases, RPGWordReader, and progress dots are untouched.

### Files touched
- Edit: `src/data/preKAdventures.ts` (1 string)
- Edit: `src/components/BennyDog.tsx` (full rewrite — 9 moods, crossfade, keyframes)
- Edit: `src/components/aura/game/rpg/NabuScene.tsx` (sprite swap to `<foreignObject><BennyDog/>`, size 280, feet offset)
- Edit: `src/components/aura/game/rpg/NabuAdventure.tsx` (mood state machine + timers)
- Create: 6 new `.asset.json` pointers in `src/assets/` (happy, excited, cheering, thinking, surprised, sleepy), and re-upload idle/celebrate/sad from the new images
- No changes to game logic, scoring, mic, scene environments, or story copy beyond item #1.

### Out of scope
- Renaming "Nabu" in spoken dialogue / story copy elsewhere.
- Changing scene environments, mic/echo retry, or scoring thresholds.
