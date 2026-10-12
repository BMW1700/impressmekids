# Make the Speech Lab findable (one card, nothing else)

## What will change
The Speech Lab already exists at `/speech-lab` (super-admin only, on-device Whisper-tiny test room). It is invisible because nothing links to it — you had to type the URL.

Add one card to the Super Admin Dashboard (`/super-admin`), in the same grid as the existing cards:

- Title: **Speech Lab**
- Icon: microphone
- Description: "Test the new on-device reading engine against today's mic. Read a sentence, see which words each one hears. Nothing here touches the live game."
- Links to `/speech-lab`

No changes to the Speech Lab itself, the live game, the mic, or any other page.

## Also answering "is Sherpa set up?"
No. Nothing Sherpa is installed anywhere in the project. The lab uses **Whisper-tiny** (on-device, ~40 MB, cached after first load). Results from this lab therefore test Whisper, not Sherpa — good lab results would not prove Sherpa is better.

## Verification
- Open `/super-admin` as a super admin, confirm the new card appears and opens `/speech-lab`.
- Confirm the lab loads and the model-progress line appears.
- Build log shows no errors.
