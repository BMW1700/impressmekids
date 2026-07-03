## What is actually broken

The editor page still has an old R2 shortcut in `PreKLevelBuilder.tsx`.

Even though the runtime/editor resolver was patched to sign storage URLs first and only use R2 when the CDN object exists, the actual trim editor uses its own `useSignedSrc()` hook. That hook still does this:

```text
storage path -> cdn.nabulearn.com URL immediately -> video tries to load R2 -> new upload 404s -> black video / 0.000 duration
```

So the previous fix did not reach the visible editor shown in your screenshot.

## Fix plan

1. **Patch the actual editor video source resolver**
   - Update `useSignedSrc()` in `src/pages/superadmin/PreKLevelBuilder.tsx`.
   - Remove the CDN-only short circuit.
   - Always create a signed backend storage URL for relative upload paths.
   - Then call `resolveCdnOrFallback()` so:
     - existing mirrored files still use R2/CDN,
     - brand-new uploads fall back to backend storage immediately.

2. **Keep the money-saving behavior**
   - Do not disable R2 globally.
   - Do not remove CDN support.
   - Only fallback for files that are missing from R2.
   - Old migrated files keep using `cdn.nabulearn.com`.

3. **Make failures visible instead of silent black boxes**
   - Add a minimal error state in `VideoTrimEditor` when video metadata fails to load.
   - This avoids another silent black rectangle with `0.000s` if a future file/path/content-type issue happens.

4. **Verify the specific failure path**
   - Confirm no editor code still imports `getCdnUrl` directly for Pre-K video playback.
   - Confirm all Pre-K editor/runtime paths now use signed URL + CDN probe fallback.

## Expected result

After this patch, a newly uploaded Benny level video should load in the backend editor, show a real duration, play, scrub, trim, and save. Existing R2-hosted videos should continue using R2, so the cost savings stay intact.