## What is actually happening

The new Benny Level 6 opening video exists in backend storage, but it is **not recorded as copied to R2**.

So the app currently does this on load:

```text
new upload path -> assume R2 CDN URL exists -> video tag tries cdn.nabulearn.com -> black/glitch -> fallback to signed backend URL
```

On your Mac, the browser fails over after ~2 seconds and then plays. On the Dell, the failed CDN attempt / media decode path is not recovering cleanly, so the black/glitch state can persist.

There is also a separate codec risk: the current uploaded MP4 is H.264 High Profile. That plays on most Macs, but Windows/Dell browser setups can be more fragile depending on Chrome/Edge codec support, graphics drivers, or OS media extensions. We should not rely on “it works on my Mac.”

## Fix plan

1. **Stop showing the broken CDN attempt in the admin editor**
   - In the Pre-K level editor, use the signed backend storage URL as the primary preview source.
   - Keep R2 savings for student/public playback, not for admin editing previews.
   - This removes the 1–2 second black/glitch window in the backend editor.

2. **Add copy-through to R2 for every new Pre-K upload**
   - Extend the existing `migrate-to-r2` backend function with a `copy-path` action.
   - After the browser uploads a Pre-K video to backend storage, immediately call `copy-path` for that exact file.
   - This makes new uploads available at `cdn.nabulearn.com` right away instead of waiting for a manual migration scan/batch.

3. **Only publish/store CDN-first paths after the file has a real R2 copy path**
   - Keep the database storing the normal bucket-relative path.
   - The runtime can still derive the R2 URL for cost savings.
   - But newly uploaded videos will actually exist in R2 by the time students load them.

4. **Backfill the currently broken Level 6 file**
   - Run the new `copy-path` action for the current Benny Level 6 opening video.
   - Confirm it appears in `r2_migration_log` as copied.
   - That removes the CDN 404 for the existing file.

5. **Improve video readiness behavior**
   - Hide the video surface behind a neutral loading layer until `loadedmetadata`/`canplay` fires.
   - Only show controls/duration after metadata is real.
   - If fallback is ever needed, call `load()` after swapping source so Windows browsers reliably restart media loading.

6. **Add codec guardrails for Dell/Windows compatibility**
   - Add an upload-time browser check using `video.canPlayType()` and metadata load.
   - If the uploaded video cannot load metadata in the current browser, block it with a clear error instead of saving a file that some devices cannot play.
   - Add a visible warning for `.mov` files and unusual MP4 encodes; MP4 H.264/AAC should be the required production format.

## Expected result

- No more initial black/glitch box in the editor.
- New uploaded videos are copied to R2 immediately, preserving the money savings.
- Student/runtime playback continues to use R2 for copied files.
- If a Dell/Windows browser cannot decode a video, the editor tells us immediately instead of silently saving broken media.