# Fix the broken Sir Bookears hero playback

## Confirmed problem
The hero currently renders `yubi-hero-autoplay.webp` as an `<img>`, not as video. The asset is an 11.5 MB animated WebP with 155 full-frame 960×540 images, each displayed for about 83 ms (roughly 12 FPS). The original MP4 is 24 FPS. This conversion explains both symptoms: movement looks abnormally slow/choppy, and decoding a large animated image causes visible stutter on phones and lower-powered devices.

## Fix
- Create a dedicated lightweight autoplay MP4 from the existing Sir Bookears source at its correct 24 FPS.
- Remove its audio track, add fast-start metadata, and compress it for smooth web/iPad playback without changing its duration, timing, framing, or artwork.
- Replace the animated `<img>` in `BennyVideoHero` with a semantic `<video>` using `autoPlay`, `muted`, `loop`, `playsInline`, and `preload="auto"`.
- Use the existing Sir Bookears poster as the immediate first frame and permanent fallback if playback is blocked or fails.
- Keep the current uncropped 16:9 `object-contain` presentation so the cloud lettering and character remain fully visible.
- Remove the animated WebP from the playback path; do not alter the rest of the landing/family page design.

## Reliability behavior
- Attempt autoplay as soon as the media can play.
- If a browser blocks autoplay or reports a media error, leave the clean poster visible instead of showing a stalled or glitching animation.
- Respect reduced-motion preferences by showing the poster rather than forcing continuous playback.

## Verification
- Confirm the generated media is 24 FPS, H.264, muted, fast-start enabled, and materially smaller than the current 11.5 MB animation.
- Test the shared hero on both pages where it is used: the family page and mode-selection page.
- Verify desktop and mobile/iPad-sized viewports: automatic start, normal playback speed, smooth looping, no cropping, no controls, no layout shift, and no console/network errors.
- Check the preview build after implementation and resolve any introduced errors.

## Scope
Frontend/media-only change. No database, authentication, game, or audio-pipeline logic changes.
