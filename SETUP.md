# Skinface Setup — Mobile (Capacitor) first

Skinface ships as a **native app** (APK/AAB + IPA), not a web product. Browser `npm run dev` is for development only.

## 1. Install

```bash
npm install
```

Requires Node.js LTS.

## 2. Environment

Copy `.env.example` → `.env.local` and fill values.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client build | Auth + scans |
| `VITE_API_BASE_URL` | Client build | Absolute Gemini proxy (required for device builds) |
| `VITE_APP_URL` | Client | Referral / legal base (`https://skinface.ai`) |
| `VITE_REVENUECAT_*` / `VITE_RC_ENTITLEMENT_ID` | Client | Native IAP (`premium`) |
| `VITE_GOOGLE_CLIENT_ID` | Client | Google OAuth (no hardcoded fallback) |
| `GEMINI_API_KEY` | **Server only** | Express `/api/analyze` |
| `SUPABASE_JWT_SECRET` | Server | Optional Bearer verify |

Local web: leave `VITE_API_BASE_URL` empty so Vite proxies `/api` → `localhost:3003`.

```bash
npm run server   # Express on :3003
npm run dev      # Vite (proxies /api)
```

## 3. Supabase security (before any store build)

In Supabase SQL Editor, run:

[`supabase/migrations/001_security_hardening.sql`](supabase/migrations/001_security_hardening.sql)

Then schedule daily (pg_cron or manual):

```sql
SELECT public.purge_scan_biometrics_older_than_24h();
```

This enables RLS, referral completion on `scans` INSERT, blocks client `premium_rewards` inserts, and strips cloud images after 24h (scores remain).

## 4. Mobile release build

```bash
# Bake production env into the bundle
npm run build
npx cap sync android
npx cap sync ios
```

- Open **Android Studio** → Build App Bundle / APK  
- Open **Xcode** → Archive → TestFlight  

Production Capacitor config uses **bundled `dist`** — do not set `server.url` to a remote site.

## 5. Deploy analyze API

**Current production path:** Supabase Edge Function `analyze` (HTTPS).

- Secret: `GEMINI_API_KEY` (set via `supabase secrets set`)
- Client: `VITE_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1`
- Local Express still works: leave `VITE_API_BASE_URL` empty + `npm run server` on `:3003`

Optional later: host `server.js` on Railway/Fly if you outgrow edge limits.

## 6. Monetization (single PRO)

| Free | PRO (IAP entitlement `premium`) |
|------|----------------------------------|
| Skin + Progress | + Face + Glow Up |
| 1 scan / day | Unlimited scans |

See [`docs/STORE_LAUNCH_CHECKLIST.md`](docs/STORE_LAUNCH_CHECKLIST.md).
