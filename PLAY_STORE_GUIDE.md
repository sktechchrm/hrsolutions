# 🍄 Mario Calculator — Google Play Store Publishing Guide

## ✅ Step 1: Prerequisites (Install once)

```bash
# 1. Node.js 18+ (already have it)
node --version

# 2. Java JDK 17 — Download from https://adoptium.net/
java -version

# 3. Android command-line tools
# Download: https://developer.android.com/studio#command-tools
# Extract to C:\Android\cmdline-tools\latest\

# Set environment variables (Windows):
# ANDROID_HOME = C:\Android
# PATH += C:\Android\cmdline-tools\latest\bin
# PATH += C:\Android\platform-tools

# Accept Android licenses
sdkmanager --licenses

# 4. Bubblewrap CLI
npm install -g @bubblewrap/cli
```

---

## ✅ Step 2: Build the Android App (Do once)

```bash
# Go to your project folder
cd D:\React\calculator

# Create a new folder for the Android app
mkdir ..\calculator-android
cd ..\calculator-android

# Initialize TWA from your deployed manifest
bubblewrap init --manifest https://ssumir.github.io/calculator/manifest.json

# Answer the questions:
# Package name:     com.ssumir.calculator
# App name:         Mario Calculator
# Launch URL:       https://ssumir.github.io/calculator/
# Display:          standalone
# Orientation:      portrait
# Theme color:      #667eea
# Version code:     1
# Version name:     1.0.0

# Build the Android App Bundle (AAB)
bubblewrap build
```

This creates:
- `app-release-bundle.aab` ← Upload to Play Store
- `app-release-signed.apk` ← Test on your phone
- `android.keystore` ← KEEP THIS SAFE! Never delete or lose!

---

## ✅ Step 3: Get SHA256 Fingerprint

```bash
keytool -list -v -keystore ./android.keystore -alias android
# Enter the password you set during bubblewrap init

# Copy the SHA256 line, example:
# SHA256: AB:12:CD:34:EF:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
```

---

## ✅ Step 4: Update assetlinks.json

Open `D:\React\calculator\public\.well-known\assetlinks.json`

Replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with your actual SHA256:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ssumir.calculator",
    "sha256_cert_fingerprints": ["AB:12:CD:34:EF:56:78:90:...YOUR ACTUAL SHA256..."]
  }
}]
```

Then push to GitHub:
```bash
cd D:\React\calculator
git add .
git commit -m "feat: add assetlinks for TWA"
git push origin main
```

Verify it works: https://ssumir.github.io/calculator/.well-known/assetlinks.json

---

## ✅ Step 5: Upload to Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **Mario Calculator**
   - Default language: **Bengali (বাংলা)**
   - App or game: **App**
   - Free or paid: **Free**
4. Go to **Production** → **Create new release**
5. Upload `app-release-bundle.aab`
6. Fill release notes (both Bengali & English)

### Store Listing (required):
- **Short description** (80 chars max):
  `১০টি স্মার্ট ক্যালকুলেটর | EMI, BMI, VAT, গার্মেন্টস ও আরও`
- **Full description**: (see below)
- **Screenshots**: Take 2-8 screenshots from Chrome DevTools (390x844)
- **Feature graphic**: 1024x500 PNG (design in Canva)
- **Privacy Policy URL**: `https://ssumir.github.io/calculator/privacy-policy.html`

### Full Description (copy-paste):
```
🍄 Mario Calculator — বাংলাদেশের সেরা মাল্টি ক্যালকুলেটর অ্যাপ

✅ ১০টি স্মার্ট ক্যালকুলেটর:
• 🧮 সাধারণ ও বৈজ্ঞানিক ক্যালকুলেটর
• 🏦 ইএমআই — ব্যাংক ঋণের কিস্তি হিসাব
• 🎂 বয়স ক্যালকুলেটর — সঠিক বয়স জানুন
• ⚖️ বিএমআই — শরীরের ওজন পরীক্ষা
• 🔥 ক্যালরি — দৈনিক ক্যালরি চাহিদা
• 🧾 ভ্যাট — বাংলাদেশ NBR ও আন্তর্জাতিক
• 📈 শেয়ার — DSE স্টক মার্কেট লাভ/ক্ষতি
• 👕 গার্মেন্টস মেজারমেন্ট ও সাইজ চার্ট
• 📏 ইউনিট কনভার্টার — ৬ ক্যাটাগরি

🌐 বাংলা ও English উভয় ভাষায়
💾 হিসাব সংরক্ষণ করুন
📤 WhatsApp-এ শেয়ার করুন
📱 সকল মোবাইল ও ট্যাবলেটে কাজ করে
```

---

## ✅ Step 6: Content Rating & Review

1. Complete **Content rating** questionnaire (select "Utility/Calculator")
2. Complete **Target audience** (All ages)
3. Complete **Data safety** section (select: No data collected)
4. Submit for review (takes 2-7 days for new apps)

---

## 🔄 Future Updates Workflow

### For web-only updates (UI, bug fixes, new features):
```bash
# Just push to GitHub — NO new Play Store submission needed!
cd D:\React\calculator
git add .
git commit -m "feat: your changes"
git push origin main
# GitHub Actions auto-deploys → app updates automatically!
```

### For Play Store update (new version number required when):
- Changing app name or package name
- Major new feature that needs promotion
- Play Store policy requires it

```bash
cd ..\calculator-android

# Update version in twa-manifest.json:
# "appVersion": "2",
# "appVersionName": "1.1.0"

bubblewrap build
# Upload new .aab to Play Console → Create new release
```

---

## 🔑 IMPORTANT: Keep These Safe!

| File | Location | Why |
|------|----------|-----|
| `android.keystore` | `calculator-android/` | Signs your app — NEVER LOSE |
| Keystore password | Your memory/password manager | Required to sign updates |
| SHA256 fingerprint | `assetlinks.json` | Verifies TWA |

**If you lose the keystore, you CANNOT update your app on Play Store.**
Back it up to Google Drive, email, USB — anywhere safe!

---

## 📞 Need Help?
WhatsApp: +880 1732 484884
Privacy Policy: https://ssumir.github.io/calculator/privacy-policy.html
