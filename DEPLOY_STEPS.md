# 🍄 Mario Calculator — সম্পূর্ণ Deploy গাইড

## PART 1 — GitHub Pages Deploy (ওয়েব অ্যাপ)

### প্রতিবার আপডেট করতে:
```bash
cd E:\Self\React\calculator
git add .
git commit -m "your message"
git push origin main
npm run deploy
```

লাইভ লিংক: https://ssumir.github.io/calculator/

---

## PART 2 — Google Play Store (Android অ্যাপ)

### Step 1 — একবারই করতে হবে (Software Install)

#### A. Java JDK 17 ডাউনলোড ও ইনস্টল করুন
- যান: https://adoptium.net/
- ডাউনলোড করুন: **Temurin 17 (LTS) — Windows x64 .msi**
- ইনস্টল করুন, পথ মনে রাখুন (যেমন: `C:\Program Files\Eclipse Adoptium\jdk-17`)

#### B. Android Command Line Tools ডাউনলোড
- যান: https://developer.android.com/studio#command-tools
- "Command line tools only" সেকশন থেকে Windows zip ডাউনলোড
- Extract করুন: `C:\Android\cmdline-tools\latest\`

#### C. Environment Variables সেট করুন (Windows)
```
Start → "Environment Variables" সার্চ করুন → Edit

System variables-এ নতুন যোগ করুন:
  ANDROID_HOME = C:\Android

Path-এ যোগ করুন:
  C:\Android\cmdline-tools\latest\bin
  C:\Android\platform-tools

JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x
```

#### D. Android SDK ও Licenses Accept করুন
```bash
# PowerShell Admin হিসেবে খুলুন
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
sdkmanager --licenses
# সব প্রশ্নে y চাপুন
```

#### E. Bubblewrap ইনস্টল করুন
```bash
npm install -g @bubblewrap/cli
```

---

### Step 2 — Android Project তৈরি করুন (একবার)

```bash
# নতুন ফোল্ডার তৈরি করুন প্রজেক্টের পাশে
mkdir E:\Self\React\calculator-android
cd E:\Self\React\calculator-android

# Init করুন
bubblewrap init --manifest https://ssumir.github.io/calculator/manifest.json
```

প্রশ্নের উত্তর:
```
Package ID:       com.ssumir.calculator
App name:         Mario Calculator
Launcher name:    Mario Calc
Display:          standalone
Orientation:      portrait
Theme color:      #667eea
Background:       #f0f4ff
Version code:     1
Version name:     1.0.0
Keystore path:    ./android.keystore
Key alias:        android
Keystore password: (নিজে একটি পাসওয়ার্ড দিন — মনে রাখুন!)
Key password:     (একই পাসওয়ার্ড দিন)
```

---

### Step 3 — Build করুন

```bash
cd E:\Self\React\calculator-android
bubblewrap build
```

তৈরি হবে:
- `app-release-bundle.aab` ← Play Store-এ দিন
- `app-release-signed.apk` ← ফোনে টেস্ট করুন

---

### Step 4 — SHA256 Fingerprint নিন ও assetlinks.json আপডেট করুন

```bash
keytool -list -v -keystore E:\Self\React\calculator-android\android.keystore -alias android
# পাসওয়ার্ড দিন

# Output থেকে এই লাইন কপি করুন:
# SHA256: XX:XX:XX:XX:XX:XX:...
```

তারপর `E:\Self\React\calculator\public\.well-known\assetlinks.json` খুলুন:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.ssumir.calculator",
    "sha256_cert_fingerprints": ["XX:XX:XX:XX:XX:XX:...আপনার SHA256 এখানে..."]
  }
}]
```

সেভ করুন, তারপর:
```bash
cd E:\Self\React\calculator
git add .
git commit -m "feat: add SHA256 fingerprint"
git push origin main
npm run deploy
```

যাচাই করুন: https://ssumir.github.io/calculator/.well-known/assetlinks.json

---

### Step 5 — Play Console-এ আপলোড

1. যান: https://play.google.com/console
2. **Create app** ক্লিক করুন
3. পূরণ করুন:
   - App name: `Mario Calculator`
   - Default language: `Bengali (বাংলা)`
   - App type: `App`
   - Free/Paid: `Free`
4. **Production → Create new release**
5. `app-release-bundle.aab` আপলোড করুন
6. Release notes লিখুন

---

### Step 6 — Store Listing পূরণ করুন

**Short description (80 char max):**
```
১০টি স্মার্ট ক্যালকুলেটর | EMI, BMI, VAT, গার্মেন্টস ও আরও
```

**Full description:**
```
🍄 Mario Calculator — বাংলাদেশের সেরা মাল্টি ক্যালকুলেটর

✅ ১০টি স্মার্ট ক্যালকুলেটর:
• 🧮 সাধারণ ও বৈজ্ঞানিক ক্যালকুলেটর
• 🏦 ইএমআই — ব্যাংক ঋণের মাসিক কিস্তি
• 🎂 বয়স — সঠিক বয়স নির্ণয়
• ⚖️ বিএমআই — শরীরের ওজন পরীক্ষা
• 🔥 ক্যালরি — দৈনিক ক্যালরি চাহিদা
• 🧾 ভ্যাট — বাংলাদেশ NBR ও আন্তর্জাতিক
• 📈 শেয়ার — DSE স্টক মার্কেট লাভ/ক্ষতি
• 👕 গার্মেন্টস মেজারমেন্ট ও সাইজ চার্ট
• 📏 ইউনিট কনভার্টার — ৬ ক্যাটাগরি

🌐 বাংলা ও English উভয় ভাষায়
💾 হিসাব সংরক্ষণ করুন
📤 WhatsApp-এ সরাসরি শেয়ার করুন
📱 সকল Android মোবাইল ও ট্যাবলেটে কাজ করে
🆓 সম্পূর্ণ বিনামূল্যে — কোনো বিজ্ঞাপন নেই
```

**Privacy Policy URL:**
```
https://ssumir.github.io/calculator/privacy-policy.html
```

**Screenshots:** Chrome DevTools দিয়ে নিন (390x844 size)

---

### Step 7 — Content Rating ও Data Safety

**Content Rating:**
- Category: `Utility`
- সব প্রশ্নে: No / None

**Data Safety:**
- Data collected: ❌ None
- Data shared: ❌ None
- Security practices: ✅ Data is encrypted in transit

---

### Step 8 — Submit ও Review

- সব সেকশন সবুজ ✅ হলে **Submit for review**
- প্রথম বার: ৩-৭ দিন সময় লাগে
- পরবর্তী আপডেট: ১-২ দিন

---

## 🔄 ভবিষ্যতে আপডেট করার নিয়ম

### শুধু Web আপডেট (UI, bug fix):
```bash
# কোড পরিবর্তন করুন VS Code-এ
git add .
git commit -m "fix: your changes"
git push origin main
npm run deploy
# Play Store-এ নতুন version দিতে হবে না ✅
```

### Play Store-এও নতুন version দিতে হলে:
```bash
# twa-manifest.json-এ version বাড়ান:
# "appVersion": "2"
# "appVersionName": "1.1.0"

cd E:\Self\React\calculator-android
bubblewrap build
# নতুন .aab Play Console-এ আপলোড করুন
```

---

## ⚠️ গুরুত্বপূর্ণ — এই ফাইলগুলো হারাবেন না!

| ফাইল | কোথায় | কেন গুরুত্বপূর্ণ |
|------|--------|-----------------|
| `android.keystore` | `calculator-android/` | এটা ছাড়া app update করা যাবে না |
| Keystore password | Password manager-এ | Keystore খুলতে দরকার |

**এখনই Google Drive-এ backup রাখুন!**
