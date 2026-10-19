# Getting YubiLearn submitted tonight: who does what

## Short answer
I can't upload the app to Apple for you. Apple only accepts uploads from Xcode on a Mac, signed in with your paid Apple Developer account. I don't have a Mac or your Apple login. Everything inside the app itself is something I can handle.

## What I'll do when you approve
1. **Reviewer test accounts:** Create one student, teacher, and parent account with email and password. Then check that each one can sign in.
2. **Submission guide:** Put those logins, the reviewer notes, the description, and the privacy answers into one copy-paste guide, so you can fill in Apple's forms quickly.
3. **Final check:** Make sure the latest code is synced to your GitHub so your Mac gets the newest version.

## What only you can do (in order, about 2 to 3 hours)
1. **Apple Developer account:** You need a paid one ($99 a year) at developer.apple.com. If you're not enrolled yet, Apple's approval can take up to 2 days, and nothing below can happen until it comes through.
2. **On your Mac, open Terminal and paste:**
   ```bash
   git clone https://github.com/BMW1700/impressmekids.git
   cd impressmekids
   npm install
   npm run build:ios
   npx cap open ios
   ```
   Xcode opens.
3. **In Xcode:** Click "App", then "Signing & Capabilities". Check "Automatically manage signing" and pick your Team.
4. **Test it:** Plug in your iPhone and press the Play button. Sign in with a demo account, read a word to Benny, and play one RPG battle.
5. **Screenshots:** In the iPhone 15 Pro Max simulator and the iPad Pro 13" simulator, press Cmd+S on 4 to 6 screens.
6. **App Store Connect** (appstoreconnect.apple.com): Click New App and pick `app.lovable.yubilearn`. Paste everything from my guide, set the age rating to 4+, and add your screenshots.
7. **Upload:** In Xcode, choose Product, then Archive, then Distribute App, then App Store Connect, then Upload. Wait about 15 minutes, attach the build in App Store Connect, and press Submit for Review.

## If you get stuck
Send me a screenshot of any Xcode or Apple error and I'll tell you exactly what to click.
