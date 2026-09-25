# Google Play Publish Checklist — Mario Calculator

## Before Every Build

### 1. Set up local.properties (one-time)
Copy `android/local.properties.example` to `android/local.properties` and fill in:
```
sdk.dir=/path/to/your/Android/sdk
KEY_STORE_FILE=android.keystore
KEY_STORE_PASSWORD=Saiful@1985
KEY_ALIAS=android
KEY_PASSWORD=Saiful@1985
```
⚠️ NEVER commit local.properties to git. It is in .gitignore.

### 2. Keep your keystore safe
- File: `android.keystore` (in .gitignore)
- Back it up to a USB drive or cloud storage
- If lost, you can NEVER update the app on Play Store

### 3. Build for release
```bash
# Step 1: Build the web app
npm run build

# Step 2: Sync to Android
npx cap sync android

# Step 3: Open in Android Studio and generate signed APK/AAB
npx cap open android
# In Android Studio: Build > Generate Signed Bundle / APK
# Choose AAB (Android App Bundle) for Play Store
```

## Play Store Submission Checklist

### App details (in Play Console)
- [ ] App name: Mario Calculator
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max) — mention 13 calculators, bilingual
- [ ] Privacy policy URL: https://sktechchrm.github.io/calculator/privacy-policy.html
- [ ] App category: Tools
- [ ] Content rating: Everyone

### Graphics required
- [ ] App icon: 512×512 PNG (no alpha)
- [ ] Feature graphic: 1024×500 PNG
- [ ] Screenshots: minimum 2, recommended 4-8
  - Phone screenshots: 1080×1920 or similar
  - Current available: home.png, calc.png
  - Still needed: BMI, VAT, size chart, unit converter

### Build info
- Package ID: com.ssumir.calculator
- Version: 1.0.0 (versionCode 1)
- Min Android: 7.0 (API 24)
- Target Android: 14 (API 35)

## After Publishing
- versionCode must increase by 1 with every update (1 → 2 → 3...)
- versionName is for display only (1.0.0 → 1.0.1 → 1.1.0...)
