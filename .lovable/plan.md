# Chasing the flashing — catch it, then kill it

## Where I actually am

I loaded yubilearn.com myself — signed out, signed in as you, on the homepage and on the Super Admin page — and sampled the screen every fraction of a second for 10+ seconds each time. No reloads, no page bouncing, no theme flipping, nothing strobing. **I have not reproduced it, so I am not going to name a cause I can't prove.**

What I did rule out:
- Nothing I changed today is on yubilearn.com. The live site has not been republished — it's still the older build. My change is not the trigger.
- The Private Preview Gate hasn't been touched since 2:24 AM and is off. Not it.
- No redirect loop between the homepage and a dashboard.

## Step 1 — Catch it on your machine

I add a small, temporary recorder to the app that runs only for you (super admin) and logs the things that cause visible flashing: how often the page re-renders, video play/pause events, theme changes, live-data updates, and route changes. It writes a timestamped trail you can see.

You then load yubilearn.com, let it flash for ten seconds, and I read the trail. That turns "it's flashing" into an exact culprit instead of me guessing.

## Step 2 — Fix the defects I already found while I'm in there

These are real regardless of whether they're your flash:

1. **The Sir Bookears hero video fights itself.** Every time the video pauses, the code instantly tries to play it again with no limit. In Safari (Low Power Mode, backgrounded tab, slow load) the browser pauses it right back — a play/pause strobe. Replace with at most 3 spaced retries, then fall back cleanly to the still image.
2. **Two separate live connections watch the same settings row** — one from the site-access gate, one from the Super Admin panel. If one can't connect it silently retries forever. Consolidate to a single shared watcher.
3. **Console errors on every animation frame** on the homepage demo (invalid shape values). Clamp them so the browser isn't erroring continuously.

## Step 3 — Remove the recorder

Once the culprit is confirmed and fixed, the recorder comes out. It never ships to students or teachers — it's gated to your account only.

## Technical notes

- Recorder: a dev-only hook mounted in `App.tsx` behind `useIsSuperAdmin`, logging to `console` and an in-memory ring buffer: React commit counts per second (Profiler `onRender`), `play`/`pause`/`stalled`/`waiting` on every `<video>`, `documentElement.className` mutations via MutationObserver, Supabase realtime channel state changes, and `location.pathname` changes.
- `src/components/landing/BennyVideoHero.tsx`: `onPause={startPlayback}` is the loop; also remove the `focus` / `pageshow` / `pointerdown` retry listeners, keep a guarded `visibilitychange`, cap retries with a ref, then `setVideoFailed(true)`.
- `src/components/DemoGate.tsx` (`app_settings_gate`) and `src/components/student/sections/SiteSettingsSection.tsx` (`app_settings_admin`) both subscribe to `public.app_settings` — merge into one shared subscription module.
- `ModeSelect`'s K-12 demo panel emits negative `<circle r>` and undefined `<ellipse rx>` / `<path d>`; clamp at the source.
- No backend, auth, schema, or routing changes.
