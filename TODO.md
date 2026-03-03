# 📋 Skinface AI - Technical Roadmap

This document serves as the single source of truth for current development priorities.

## 🔴 High Priority (Immediate Action)

### 1. Google OAuth Configuration
- [ ] **Fix Origin Issues**: Configure Google Cloud Console to accept `localhost:3002` and production domains.
- [ ] **Error Handling**: Improve error messages when OAuth fails (e.g., "Popup closed by user").
- [ ] **Verification**: Ensure seamless sign-in on both local and deployed environments.

### 2. Performance & Optimization
- [ ] **Image Optimization**: Implement WebP format for all static assets.
- [ ] **Lazy Loading**: Lazy load non-critical components (e.g., `Recommendations`, `SpectralAnalysis`) to improve initial load time.
- [ ] **Bundle Size**: specific analysis of `vendor` chunk to reduce size.

### 3. UI/UX Polish
- [ ] **Progress Page**: Replace current implementation with `recharts` or `chart.js` for smoother, more interactive graphs.
- [ ] **Loading States**: Add skeleton loaders for data fetching states (instead of generic spinners).
- [ ] **Transitions**: Ensure smooth `framer-motion` transitions between tabs (Results -> Details -> Progress).

## 🟡 Medium Priority (Next Up)

### 1. Feature Enhancements
- [ ] **Face Analysis**: Add interactive tooltips to analysis metrics (explain what "Golden Ratio" means in context).
- [ ] **Recommendations**: Group recommendations by priority and add "Shop Now" links stub.

### 2. Mobile & PWA
- [ ] **Manifest**: Verify `manifest.json` coverage for PWA installability.
- [ ] **Touch Targets**: Ensure all buttons have min 44x44px touch area.
- [ ] **Offline Support**: Basic service worker configuration for offline access to history.

## 🟢 Low Priority (Future Ideas)

- [ ] **Voice Feedback**: Text-to-speech for analysis results.
- [ ] **Social Sharing**: Generate shareable "Skin Score" cards for Instagram/Twitter.
- [ ] **Multi-language**: Expand localization beyond current implementation if needed.

---
*Last Updated: 2026-01-12*
