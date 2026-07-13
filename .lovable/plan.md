## Brutally honest audit result

The music pipeline is not failing because of timeline placement, R2, track 89, or the frontend button.

The backend is now reaching LALAL correctly, and LALAL is rejecting the split with this exact live log:

```text
LALAL split [400]: {"detail": "Premium license required to access this feature."}
```

So the actual blocker is the saved `LALAL_API_KEY`: it is not a LALAL license/key with API stem separation access. LALAL's pricing page shows API Access is Pro-only, and their API docs require `X-License-Key` for `/api/v1/split/stem_separator/`.

## What needs fixing right now

1. **Replace/upgrade the LALAL key**
   - Use a LALAL account/license that includes API Access, likely Pro or business/API access.
   - Save the new value into the existing `LALAL_API_KEY` secret.
   - No code change can bypass this provider-side license block.

2. **Improve the app message so we stop flying blind**
   - Update the Music error UI/parser to display the full provider message clearly:
     - `LALAL split failed — Premium license required to access this feature.`
   - Right now the screenshot truncates the JSON after `{...`, which makes it look like the app is still broken instead of showing the provider/account issue.

3. **Add a backend preflight check before a Music run**
   - Have `prek-clip-music-extract` call LALAL `/limits/minutes_left/` before upload/split.
   - If the key lacks API access or minutes, fail immediately with a clear message before uploading any media.
   - This avoids burning time and makes future errors obvious.

4. **Optional safety fallback**
   - If the key is not premium/API-enabled, disable or label Music buttons with a clear admin-facing error state instead of letting every scene fail one by one.

## Technical details

- The function source currently calls:
  - `POST https://www.lalal.ai/api/v1/upload/`
  - `POST https://www.lalal.ai/api/v1/split/stem_separator/`
  - `POST https://www.lalal.ai/api/v1/check/`
- The live log confirms the failure is at the split step, after upload/auth reached LALAL.
- The exact failed provider response is HTTP 400 with:

```json
{"detail":"Premium license required to access this feature."}
```

## Not the problem

- Track 89 placement is not the current failure.
- Redub/ElevenLabs is not the current failure.
- R2 storage is not the current failure.
- The client polling loop is not the current failure.
- The LALAL endpoint shape is now correct enough to reach the provider's license gate.

## After approval

I will implement the app-side improvements only:

- clearer Music error display,
- LALAL license/minutes preflight in the backend function,
- and deploy the updated function.

Then you still need to replace/upgrade the `LALAL_API_KEY`; once that key has API stem separation access, the Music track should generate and auto-land on Track 89.