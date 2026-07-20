# Store launch checklist — Skinface (Capacitor)

## ASO (App Store Optimization) — copy to paste

### Identity (already in native projects)
- Display name: **Skinface** (iOS `CFBundleDisplayName`, Android `app_name`)
- Bundle / package: **com.skinface.ai**
- Primary category: Health & Fitness · Secondary: Lifestyle (or Beauty if available on Play)

### Apple App Store
| Field | Max | Suggested |
|--------|-----|-----------|
| Name | 30 | `Skinface: Face Scan & Glow` |
| Subtitle | 30 | `AI skin score & progress` |
| Keywords | 100 chars, comma-sep, no spaces after commas | `face scan,skincare,glow up,skin analysis,beauty,jawline,acne,selfie,ai face,skin score` |

**Promotional text** (updatable anytime):  
Track your glow-up with AI face & skin scores. Daily scans, progress charts, personalized routine.

**Description** (opening 3 lines matter most):  
Skinface turns a short face scan into clear aesthetics and skin scores — then helps you improve with daily progress and a personalized glow-up plan.

• Live camera scan (on-device landmarks)  
• Skin + Face scores with focus areas  
• Progress history and streaks  
• Personalized routine tips  
• Free: Skin + Progress (1 scan/day) · PRO: Face, Glow Up, unlimited scans  

Not a medical device. Cosmetic insights only.

### Google Play
| Field | Suggested |
|--------|-----------|
| Title (≤30) | `Skinface: Face Scan & Glow` |
| Short description (≤80) | `AI face & skin scan. Track your glow-up with scores and daily progress.` |
| Full description | Same body as Apple description above + “Download Skinface and start your first scan.” |

### Localization priority
1. **EN** (default listing)  
2. **TR** — Title: `Skinface: Yüz Tarama` · Short: `Yapay zeka ile cilt ve yüz skoru. Glow-up ilerlemeni takip et.`  
   Keywords TR: `yüz tarama,cilt analizi,glow up,cilt bakımı,sivilce,çene hattı,selfie,yapay zeka`

### Creative assets (still needed in consoles)
- [ ] App icon 1024×1024 (no transparency; matches launcher brand)
- [ ] 6–8 screenshots per platform (phone): Welcome → Scan → Results Skin → Face → Progress → Paywall
- [ ] Optional: 15–30s preview video (scan → score reveal)
- [ ] Feature graphic Play 1024×500

### ASO hygiene
- [ ] Privacy URL live: `https://skinface.ai/privacy.html`
- [ ] Support URL / email: `support@skinface.ai`
- [ ] Exact same name “Skinface” on icon text, listing title start, and in-app header
- [ ] Avoid competitor trademark keywords (e.g. other beauty-app brand names)
- [ ] Ratings prompt only after a successful scan (not on first open)

---

## Before building the AAB/IPA

- [x] Apply `supabase/migrations/001_security_hardening.sql` (+ bootstrap)
- [x] Apply streak columns: `supabase/migrations/002_profile_streak.sql`
- [x] Deploy Edge Function `delete-account`
- [x] Deploy analyze API HTTPS (`functions/v1/analyze` + `GEMINI_API_KEY` secret)
- [x] Set `.env.local` `VITE_API_BASE_URL` → `https://rgybwdcutguvyjmxdtxq.supabase.co/functions/v1`
- [ ] `npm run build && npx cap sync android && npx cap sync ios`

## Google Play

- [ ] Create app `com.skinface.ai`
- [ ] Upload AAB (Play App Signing)
- [ ] Subscriptions → link to RevenueCat
- [ ] Data safety: camera, photos (24h), purchase, account info
- [ ] Privacy policy URL: `https://skinface.ai/privacy.html`
- [ ] Host `/.well-known/assetlinks.json` for App Links
- [ ] Internal testing track → closed → production

## Apple App Store

- [ ] App Store Connect app + subscriptions
- [ ] Sign in with Apple enabled (Supabase Apple provider)
- [ ] Associated Domains: `applinks:skinface.ai` (Xcode entitlements)
- [ ] App Privacy nutrition labels (face data, camera, purchases)
- [ ] Privacy / Terms / Support URLs
- [ ] Age rating questionnaire (self-image / AI appearance)
- [ ] TestFlight → App Review

## Soft launch sign-off (device)

- [ ] Cold start → onboarding → camera scan
- [ ] API works (no localhost)
- [ ] Free: Skin + Progress only; Face/Glow Up → paywall
- [ ] Free: second scan same day blocked
- [ ] PRO purchase + restore
- [ ] Apple + Google sign-in
- [ ] Delete account removes login
- [ ] Referral `?ref=` opens app
- [ ] Legal copy matches 24h image retention
- [ ] DEV Skip still works (internal builds)
