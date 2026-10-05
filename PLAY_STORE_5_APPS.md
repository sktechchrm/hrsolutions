# Publishing 5 separate apps from this one project

This project can ship as **one combined app** ("HR Smart Solutions", all 5
tools in a Home grid) **and/or** as **5 separate standalone Play Store apps**
— Maternity Benefit, Final Settlement, Wages Grid, Share File, Video Call —
all from this same codebase and the same deployed website. No code fork is
needed; it's controlled by a URL parameter.

## How single-app mode works

Loading the site with `?app=<id>` in the URL skips the Home grid and opens
directly into that one tool, with no way to browse into the other four
(see `src/App.tsx`, `SINGLE_APP`). Each app also gets its own installable
manifest at `public/manifest-<id>.json`, with its own name, icon and theme
color — that's what makes it show up as a distinct app on the phone.

| App | `?app=` id | Manifest file | Suggested package name |
|---|---|---|---|
| Maternity Benefit | `maternity` | `manifest-maternity.json` | `com.sktechchrm.maternity` |
| Final Settlement | `finalsettlement` | `manifest-finalsettlement.json` | `com.sktechchrm.finalsettlement` |
| Wages Grid | `wagesgrid` | `manifest-wagesgrid.json` | `com.sktechchrm.wagesgrid` |
| Share File | `driveshare` | `manifest-driveshare.json` | `com.sktechchrm.sharefile` |
| Video Call | `call` | `manifest-call.json` | `com.sktechchrm.videocall` |

The combined app keeps using `public/manifest.json` and needs nothing
special — it's unaffected by any of this.

**App icons:** `public/icons/apps/<id>-192.png` / `-512.png` (+ `-maskable`
variants) are placeholder icons generated from each app's existing accent
color and a simple glyph — good enough to build and test with, but you'll
likely want real designed icons before a public launch. Swap the PNG files
in that folder (keep the same filenames/sizes) and nothing else needs to
change.

## One-time setup (do this once, covers all 5 apps)

1. **Deploy as usual first**: `npm run build && npm run deploy`. The 5
   manifests and icons are plain static files under `public/`, so they
   deploy automatically with everything else — nothing extra to configure.
2. **Install Bubblewrap** (Google's CLI that turns a web manifest into an
   Android Studio project — this is the piece Android Studio itself doesn't
   have):
   ```bash
   npm install -g @bubblewrap/cli
   ```
3. Bubblewrap will ask for a Java JDK and Android SDK path the first time;
   if you already have Android Studio installed, point it at Android
   Studio's bundled JDK/SDK when asked (Android Studio → Settings → SDK
   Manager/… shows the exact paths).

## Per app (repeat 5 times)

Replace `maternity` / `com.sktechchrm.maternity` below with the row from
the table above for the app you're building.

```bash
mkdir maternity-app && cd maternity-app
bubblewrap init --manifest=https://sktechchrm.github.io/calculator/manifest-maternity.json
```

Bubblewrap will ask a series of questions — these are the ones worth
setting deliberately, everything else can take the suggested default:
- **Application ID**: `com.sktechchrm.maternity`
- **Application name / Short name**: pulled from the manifest already — just confirm
- **Signing key**: choose *"Create a new one"* the first time (or point at
  your existing `android.keystore` — reusing one keystore across all 5 apps
  is fine and simpler to manage than 5 separate ones)

This generates a full Android Studio project in `./maternity-app`.

**Open that folder in Android Studio** → let Gradle sync → then
`Build → Generate Signed Bundle / APK` → choose **Android App Bundle
(.aab)** (Play Store requires AAB for new apps, not APK) → use the same
keystore you just created/chose.

### Digital Asset Links (required — without this the app opens with a visible browser address bar instead of looking native)

TWA apps need to prove they're allowed to represent your website. Bubblewrap
prints a fingerprint after signing; or get it anytime with:
```bash
keytool -list -v -keystore android.keystore -alias android
```
Add/merge an entry for **each app's package name + fingerprint** into one
shared file hosted at `https://sktechchrm.github.io/.well-known/assetlinks.json`
(all 5 apps' entries go in the *same* file, since they share one domain —
Bubblewrap can also generate this file for you per-app; merge the arrays).

## Play Console — one listing per app

Create 5 separate app listings under your one developer account (no extra
fee per app). For each: store listing text/screenshots, privacy policy link
(`https://sktechchrm.github.io/calculator/privacy-policy.html` — same URL
works for all 5), content rating questionnaire, and the **Data Safety
form** — this is the one part that genuinely differs per app:

- Maternity Benefit, Final Settlement, Wages Grid, Video Call → declare
  **no data collected**
- Share File → declare file data is uploaded to the user's own Google
  Drive via Google Sign-In; purpose "App functionality"; user can delete
  via their own Drive

Upload each `.aab` under **Internal testing** first, install it on a real
phone from the internal-testing link, and confirm it opens full-screen
with no address bar (that's the asset-links check passing) before
promoting any of them to Production.
