# Benny Idle: Animate → Hold Last Frame 2s → Repeat

## What you're asking for

Right now `benny-idle.webp` is a 151-frame animated WebP that loops continuously at ~30fps. The "janky" feel comes from the loop point — the last frame snaps back to the first frame instantly, so any subtle position/pose difference reads as a hitch.

The fix you proposed is exactly right and is 100% feasible: play the animation once, freeze on the final frame for 2 seconds, then loop. Animated WebP supports a **per-frame duration**, so we can give the last frame a 2000ms delay while all other frames stay at ~33ms. No code changes, no extra assets — just a re-encode of the same WebP. The browser handles the pause natively in `<img>` on every modern browser including Safari.

## Honest take

This is the right call and it's a common professional technique (Lottie loops, sprite-sheet idles, and game character idles all do this). One small caveat: the **first** frame and the **last** frame of the current clip are not identical poses — the source video ends mid-motion. So after the 2s hold, the jump from "frame 151 pose" back to "frame 1 pose" will still be visible as a small pop.

Two ways to handle that, pick one:

- **A. Hold + accept tiny pop** (fastest, ~5 min). Just add the 2s delay on the last frame. The pop is much less noticeable than the current continuous loop because the 2s pause resets the viewer's eye — by the time it loops, they're not tracking subpixel motion anymore. This is what 90% of pro character idles actually do.
- **B. Hold + ping-pong** (cleanest, ~10 min). After the forward pass, append the same frames in reverse, then hold 2s on frame 1, then forward again. Zero pop because the animation always returns to its starting pose before pausing. Doubles file size from ~1.3MB to ~2.5MB. Worth it for a hero character.

I recommend **B** for Benny since he's meant to emotionally connect with kids — the seamless boomerang reads as "breathing" rather than "looping clip." But A is genuinely fine if you want to ship fast.

## Plan (assuming B — say the word if you want A)

### 1. Re-encode `benny-idle.webp` with ping-pong + hold

In `/tmp/`, using the 151 PNG frames already extracted from the last pass (re-extract from the source MP4 if they're gone):

1. Build the frame sequence: `[f1, f2, ..., f151, f150, f149, ..., f2]` — 300 frames total, seamless boomerang.
2. Build the per-frame delay list: `33ms` for every frame **except the very first**, which gets `2000ms`. (When the loop restarts at frame 1, that 2s hold plays before motion resumes.)
3. Encode with `webpmux` (part of libwebp, already used in the previous pass):
   ```
   webpmux -frame f001.webp +2000+0+0+0-b \
           -frame f002.webp +33+0+0+0-b \
           ... (frames 2..151 forward, then 150..2 reverse) \
           -loop 0 \
           -bgcolor 0,0,0,0 \
           -o /tmp/benny-idle-v3.webp
   ```
   (Each PNG gets converted to a per-frame WebP first with `cwebp -q 80 -alpha_q 100`.)
4. Verify: `webpinfo /tmp/benny-idle-v3.webp` shows 300 frames, frame 1 duration = 2000ms, others = 33ms, loop count = 0 (infinite), canvas size 420×480.

### 2. Sanity-check the alpha is still clean

Same QA as last pass — sample frames 0, 75, 150, 225 with PIL, assert corners are `alpha=0` and histogram is bimodal. The reverse frames are the same PNGs as the forward frames, so if forward is clean, reverse is clean.

### 3. Upload + swap the asset pointer

`lovable-assets create --file /tmp/benny-idle-v3.webp --filename benny-idle.webp` → overwrite `src/assets/benny-idle.webp.asset.json`. New `asset_id` busts the CDN cache automatically.

### 4. No component changes

`BennyDog.tsx` and `NabuScene.tsx` already point at `@/assets/benny-idle.webp.asset.json`. The browser's `<img>` decoder reads the new per-frame timing for free.

## Out of scope

- Sir Valor video/Safari fallback (separate file, untouched)
- Benny celebrate/sad sprites (still PNG, untouched)
- Skin shop, inventory, economy (untouched)

## Risk / open question

- File size goes from ~1.3 MB to ~2.5 MB with ping-pong. Still well under any reasonable budget for a hero asset, and it's cached after first load.
- If you prefer option **A** (hold-only, ~1.3 MB, small pop on loop), tell me and I'll skip the reverse pass.
