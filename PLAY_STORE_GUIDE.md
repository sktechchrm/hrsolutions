# HR Smart Solutions — Google Play Store Publishing Guide

This guide builds the **combined app** (all 4 calculators + Video Call, in
one app with a Home grid) as a single Play Store listing using Bubblewrap
(TWA). If you want each tool as its **own separate Play Store app**
instead, see `PLAY_STORE_5_APPS.md` — same tools, same Bubblewrap process,
just pointed at a different manifest file per app.

This project does not use Capacitor — Google Sign-In (needed by Share
File) is blocked inside Capacitor's embedded WebView, but works normally
in the real Chrome tab that TWA uses. See `DRIVE_SETUP.md` for why.

## Step 1: Prerequisites (install once)

```bash
# Node.js 18+ (already have it)
node --version

# Java JDK 17 — https://adoptium.net/
java -version

# Android command-line tools — https://developer.android.com/studio#command-tools
# Extract to, e.g., C:\Android\cmdline-tools\latest\
# Set ANDROID_HOME and add platform-tools / cmdline-tools\latest\bin to PATH

sdkmanager --licenses   # accept all

# Bubblewrap CLI
npm install -g @bubblewrap/cli
```

## Step 2: Deploy the website first

Bubblewrap reads your **live** manifest, so deploy before building the app:
```bash
npm run build
npm run deploy
```

## Step 3: Build the Android app (do once per app)

```bash
# Outside this repo, next to it
mkdir ../calculator-android
cd ../calculator-android

bubblewrap init --manifest https://sktechchrm.github.io/calculator/manifest.json
```

Answer the prompts:
- **Package name**: `com.sktechchrm.calculator`
- **App name**: `HR Smart Solutions`
- **Launch URL**: `https://sktechchrm.github.io/calculator/`
- **Display**: `standalone`
- **Orientation**: `portrait`
- **Keystore**: create a new one the first time — write the password down
  somewhere safe immediately, there is no recovery if you lose it

```bash
bubblewrap build
```

This creates:
- `app-release-bundle.aab` ← upload this to Play Store
- `app-release-signed.apk` ← install this on your phone to test first
- `android.keystore` ← **back this up now.** Losing it means you can never
  update this app on Play Store again, ever.

## Step 4: Digital Asset Links (required for the app to look native)

Without this step the app opens with a visible browser address bar instead
of looking like a native app.

```bash
keytool -list -v -keystore ./android.keystore -alias android
# copy the SHA256 line from the output
```

Edit `public/.well-known/assetlinks.json` in this repo:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.sktechchrm.calculator",
    "sha256_cert_fingerprints": ["YOUR ACTUAL SHA256 HERE"]
  }
}]
```
Then deploy again (`npm run build && npm run deploy`) and check it's live
at: `https://sktechchrm.github.io/.well-known/assetlinks.json`

Install the APK on a real phone and confirm it opens full-screen with no
address bar before uploading anything to Play Console.

## Step 5: Play Console

1. [play.google.com/console](https://play.google.com/console) → **Create app**
   - App name: `HR Smart Solutions` · Default language: `Bengali (বাংলা)` · Free
2. **Production → Create new release** → upload `app-release-bundle.aab`
3. **Store listing**:
   - Privacy policy URL: `https://sktechchrm.github.io/calculator/privacy-policy.html`
   - Screenshots: 2–8, taken from Chrome DevTools device mode (390×844 works well)
   - Short/full description — describe the actual 5 tools (Maternity
     Benefit, Final Settlement, Wages Grid, Share File, Video Call), not a
     generic calculator list
4. **Content rating**: category "Utility", answer No/None throughout → lands on "Everyone"
5. **Data safety**: see the per-app breakdown in `PLAY_STORE_5_APPS.md` —
   for the combined app, since it includes Share File, declare file data
   uploaded to the user's own Google Drive via Google Sign-In, purpose
   "App functionality"
6. **Submit for review** — first submission typically takes a few days

## Future updates

**Web-only changes** (UI, bug fixes, new calculator logic) — just redeploy, no new Play Store release needed:
```bash
npm run build && npm run deploy
```

**Changes that need a new Play Store release** (app name, package ID, or
you just want to bump the version shown in Play Store):
```bash
cd ../calculator-android
# bump versionCode/versionName in twa-manifest.json first
bubblewrap build
# upload the new .aab in Play Console → Production → Create new release
```

## Keep these safe

| File | Why |
|---|---|
| `android.keystore` | Signs your app — lose it and you can never update this app again |
| Keystore password | Needed every time you build a new release |
| `public/.well-known/assetlinks.json` | Proves your app owns this website — wrong/missing SHA256 breaks the native look |

Support: +880 1732 484884 · `https://sktechchrm.github.io/calculator/privacy-policy.html`
