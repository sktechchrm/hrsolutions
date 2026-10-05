# Google Play Publish Checklist — HR Smart Solutions

A short checklist to run through before every Play Store release. For the
full step-by-step build process, see `PLAY_STORE_GUIDE.md` (combined app)
or `PLAY_STORE_5_APPS.md` (5 separate apps) — this file assumes you've
already built an `.aab` using one of those.

## Before every build

- [ ] Website deployed and live (`npm run build && npm run deploy`) —
      Bubblewrap builds from the live manifest, not local files
- [ ] `public/.well-known/assetlinks.json` has the correct SHA256
      fingerprint for the keystore you're signing with
- [ ] Tested the signed APK on a real phone — opens full-screen, no
      browser address bar, Share File's Google sign-in works

## Keystore safety

- [ ] Keystore file backed up somewhere other than this computer (cloud
      storage, USB drive) — **if lost, you can never update this app
      again on Play Store**
- [ ] Keystore password stored in a password manager, not in a text file
      sitting next to the keystore

## Play Console — per app

- [ ] App name matches the manifest's `name` field
- [ ] Short description (80 chars max) — describes what this specific app
      actually does, not a generic/stale feature list
- [ ] Full description (4000 chars max)
- [ ] Privacy policy URL: `https://sktechchrm.github.io/calculator/privacy-policy.html`
- [ ] App category: Tools or Business
- [ ] Content rating questionnaire completed → Everyone
- [ ] Data safety form completed — **differs per app**, see the table in
      `PLAY_STORE_5_APPS.md`
- [ ] App icon: 512×512 PNG, no alpha channel
- [ ] Feature graphic: 1024×500 PNG
- [ ] Screenshots: at least 2, ideally 4–8, taken from the actual current
      app (not placeholders)

## Build info (combined app)

- Package ID: `com.sktechchrm.calculator`
- Min Android: 7.0 (API 24) · Target: latest required by Play Console at submission time

(5 separate apps use the package IDs listed in `PLAY_STORE_5_APPS.md`.)

## After publishing

- `versionCode` must increase by 1 with every update (1 → 2 → 3…) — set
  this in `twa-manifest.json` before running `bubblewrap build` again
- `versionName` is just the display string (1.0.0 → 1.0.1 → 1.1.0…)
- Web-only changes (bug fixes, UI tweaks) don't need a new Play Store
  release at all — just redeploy the website
