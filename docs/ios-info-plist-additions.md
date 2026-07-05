# iOS Info.plist Additions (App Store Required)

After running `npx cap add ios`, open `ios/App/App/Info.plist` and add the
following keys inside the top-level `<dict>`. These are **mandatory** for
Apple review — missing usage strings are an automatic rejection.

## Required usage strings

```xml
<key>NSMicrophoneUsageDescription</key>
<string>YubiLearn uses the microphone so your child can read aloud during AURA literacy practice. Audio is processed on-device and only sent to your teacher when you enable recording in Parent Settings.</string>

<key>NSSpeechRecognitionUsageDescription</key>
<string>YubiLearn uses speech recognition to check whether words are read correctly during reading practice. Speech is transcribed on-device whenever possible.</string>

<key>NSCameraUsageDescription</key>
<string>YubiLearn uses the camera only when you choose to scan a worksheet or attach a photo to an assignment.</string>
```

## App category + encryption

```xml
<key>LSApplicationCategoryType</key>
<string>public.app-category.education</string>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

## App Transport Security

Default ATS is fine — do **not** add `NSAllowsArbitraryLoads`. All YubiLearn
endpoints are HTTPS.

## Sign in with Apple capability

In Xcode → Signing & Capabilities → `+ Capability` → **Sign in with Apple**.
No Info.plist change needed; Xcode writes the entitlement automatically.

## Verifying

```bash
plutil -p ios/App/App/Info.plist | grep -E 'Usage|Category|Encryption'
```

Should print all four keys above.
