# Share File — one-time Google setup

The Share File app saves files into the **user's own** Google Drive, so the app
needs a (free) Google OAuth **Client ID**. There is no server and no secret key —
the Client ID is public and safe to ship in the app.

## 1. Create the Client ID
1. Go to <https://console.cloud.google.com> → create a project (e.g. "HR Smart Solutions").
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience):
   - User type **External**, app name "HR Smart Solutions", support e-mail, developer e-mail.
   - **Data access / Scopes** → add only `.../auth/drive.file`
     (non-sensitive: the app can touch only files it created itself).
   - **Publish the app to "In production"**. While in "Testing" only listed
     test users can sign in and their sign-in expires after 7 days.
     Google may ask for basic branding verification (logo, privacy-policy URL:
     `https://sktechchrm.github.io/calculator/privacy-policy.html`).
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   **Authorized JavaScript origins** (origin only, no path, no trailing slash):
   - `https://sktechchrm.github.io`
   - `http://localhost:5173` (for local testing)
   Leave *redirect URIs* empty.
5. Copy the Client ID (`123456-abc.apps.googleusercontent.com`).

## 2. Put it in the app
```bash
cp .env.example .env
# edit .env  →  VITE_GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
npm run build && npm run deploy
```
The ID is baked in at build time, so rebuild after changing it.

## 3. Android / Play Store note
The TWA build opens your site in Chrome, so Google sign-in works. A plain
Capacitor WebView does **not** — Google blocks OAuth in embedded WebViews.
Publish through the TWA (Bubblewrap) route, not the Capacitor one, for this app.

## How the flow works
Sign in (Google popup) → file uploads to Drive folder "HR Smart Solutions - Shared"
→ permission "anyone with the link: viewer" → link
`https://drive.google.com/uc?export=download&id=<id>` is shared on WhatsApp →
receiver taps it and the download starts. "Stop sharing" removes the permission.
Very large files (roughly >100 MB) or files Google cannot virus-scan show a
one-tap "Download anyway" page first — that is Google's behaviour.
