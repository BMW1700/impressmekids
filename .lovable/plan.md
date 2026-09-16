# The flashing homepage — what I found and how to fix it

## Brutally honest status

I tested the live site (yubilearn.com) directly, both signed out and signed in as you, and watched it for 10+ seconds at a time. **I could not make it flash in my test browser.** So I am not going to pretend I have a confirmed root cause. Here is what I *did* verify:

- The live site has **not** been republished since my last change. It is still serving the same build as before, so nothing I changed today is on yubilearn.com. That change is not the cause.
- The site access gate ("Private Preview Gate") has not been touched since 2:24 AM and is off. Not the cause.
- No page reloads, no redirect bouncing, and no repeated navigation on the homepage in my tests.
- There are real console errors on the live homepage (invalid shape values in the illustrated demo), but those are cosmetic and don't cause flashing.

## The one real suspect in the code

The Sir Bookears hero video on the homepage has a retry loop that can fight itself:

When the video pauses for any reason, the code immediately tries to play it again — with no limit. On Safari (especially with Low Power Mode, a backgrounded tab, or a slow video load), the browser pauses the video right back. Play → pause → play → pause, many times a second. On screen that reads as the hero area strobing, and because the whole homepage sits on a blurred animated background, the flicker can look like the whole page is flashing.

This matches your symptoms: Safari, live site, homepage, nothing deployed to trigger it — it depends on the moment-to-moment state of your machine, which is why it comes and goes.

## The fix

1. **Stop the play/pause fight.** Remove the automatic "restart on pause" behaviour and replace it with a bounded retry: at most a few attempts, spaced out, and only when the video is genuinely stalled — never as a direct reaction to a pause.
2. **Fall back gracefully.** If the video still won't play after those attempts, show the still poster image instead of continuing to thrash. Visually near-identical, zero flicker.
3. **Stop re-triggering on every window event.** Today focus, page-show, visibility change and the first pointer tap all kick off a play attempt. Keep only the visibility-change retry, and only when the video is actually paused and the page is actually visible.
4. **Clean up the console errors** on the homepage demo (negative and undefined shape values) so the browser isn't logging errors on every animation frame.

## Verification before I call it done

- Load yubilearn.com in a real browser session and record the hero for 15 seconds, checking that the video's play/pause count stays at one play and zero pauses.
- Repeat with the video source blocked, to confirm it lands cleanly on the poster instead of looping.
- Re-check the console is clean.
- Then you publish, and if it still flashes on your Mac, I need one thing from you: whether the flashing stops when you scroll the hero video off screen. That single answer tells me definitively whether it's the video or something else, and I'll chase the something else.

## Technical notes

- `src/components/landing/BennyVideoHero.tsx` — `onPause={startPlayback}` (line ~91) is the loop. `startPlayback` is also wired to `onLoadedMetadata`, `onCanPlay`, `visibilitychange`, `pageshow`, `focus`, and a one-shot `pointerdown`. Replace with a `retryCount` ref capped at 3, a 400ms delay between attempts, and `setVideoFailed(true)` after the cap.
- Console errors originate in the K-12 RPG demo panel rendered by `ModeSelect` — negative `r` on `<circle>` and `undefined` on `<ellipse rx>` / `<path d>`; clamp those values at the source.
- No backend, auth, or routing changes. Presentation layer only.
