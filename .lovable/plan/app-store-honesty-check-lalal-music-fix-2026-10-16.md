# App Store honesty check + LALAL music fix

## Straight answers
- **Is it wrapped in Capacitor?** Yes. The iPhone/iPad app project already exists. It shows the same screens as the website.
- **Do the videos go with it?** They aren't packed inside the app. They stream from your online storage, just like on the website. That's normal and Apple allows it. It does mean the app needs internet, and big videos may load slowly on weak school Wi-Fi.
- **Is it exactly the same as the website?** Almost. Inside the app only, pricing, sales, Speech Lab, and super admin pages are hidden, because Apple doesn't allow them there.
- **Will it work perfectly?** I can't promise that. The app has never run on a real iPhone or iPad. The riskiest parts are the mic in RPG mode, video autoplay, and Google sign-in coming back to the app. You need to test these on a real device before you submit. If something breaks there, I fix it, and then you submit.
- **Will Apple approve it?** Not guaranteed. The three most common reasons for rejection are covered by the earlier plan: Apple sign-in, hidden pricing, and demo accounts.

## The LALAL music problem
Your screenshot shows LALAL refusing every request with "Premium license required." A LALAL key is already saved, but it's on a plan that doesn't include API access. The code itself is fine.

## What I'll do when you approve
1. Open a secure form so you can paste your new LALAL key. It replaces the old one, and the key never appears in chat.
2. Run one Music split on a real clip to confirm it works.
3. If LALAL still blocks it, the only fix is upgrading your LALAL plan to one with API access. I'll tell you that plainly instead of retrying.

## Technical notes
- Update the `LALAL_API_KEY` secret with update_secret. The `prek-clip-music-extract` function reads it at runtime, so no code changes are needed.
- Check the result in the edge function logs.
