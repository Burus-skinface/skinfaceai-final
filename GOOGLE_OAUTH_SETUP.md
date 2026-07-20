# Google OAuth Setup (Skinface)

App uses **Supabase Auth** Google provider (`signInWithOAuth`), not the old GIS popup alone.

## Why Google shows the wrong name

| What you see | Where it comes from |
|---|---|
| “Continue to **Skinface**” | Google Cloud → **OAuth consent screen → App name** |
| URL `….supabase.co` | Normal for hosted Supabase Auth (not the product name) |
| Dashboard project name | Cosmetic only — we renamed the cloud project to **Skinface** |

## Steps

### 1. Google Cloud → OAuth consent screen
1. https://console.cloud.google.com/apis/credentials/consent
2. **App name: `Skinface`** (this is what users see)
3. Support + developer emails → Save

### 2. Create OAuth Web client
1. Credentials → Create → OAuth client ID → **Web application**
2. Name: `Skinface Web`
3. Authorized redirect URI (required):
   ```
   https://rgybwdcutguvyjmxdtxq.supabase.co/auth/v1/callback
   ```
4. Optional JS origins for local web:
   ```
   http://localhost:3000
   http://localhost:3003
   ```
5. Copy **Client ID** + **Client Secret**

### 3. Enable Google in Supabase
Dashboard → Authentication → Providers → **Google** → Enable  
Paste Client ID + Secret → Save

Auth → URL Configuration (already set via API for local):
- Site URL: `http://localhost:3000`
- Redirect allow list includes `localhost:3000/3003` and `capacitor://localhost`

### 4. App env (optional GIS / native extras)
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

## Notes
- New project Google provider starts **disabled** until you paste ID/Secret (secrets cannot be copied from the old paused project).
- After changing consent **App name**, wait a few minutes and hard-refresh Google’s login page.
- Revoke any access token you pasted in chat: https://supabase.com/dashboard/account/tokens
