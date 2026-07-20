import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Skinface ships as a bundled WebView app (webDir: dist).
 * Do NOT set server.url in production — that would load a remote site instead of the APK/IPA bundle.
 * API calls use VITE_API_BASE_URL baked in at `npm run build` time.
 */
const config: CapacitorConfig = {
  appId: 'com.skinface.ai',
  appName: 'Skinface',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
