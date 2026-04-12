# Setup Instructions

## ⚠️ Önemli: Node.js Gerekli

Bu proje için **Node.js** yüklü olmalı.

## 🚀 Kurulum Adımları

### 1. Node.js Yükle
- [Node.js İndir (Windows)](https://nodejs.org/en/download/)
- LTS versiyonunu öner
- İndirip yükle

### 2. Node.js Yüklü mü Kontrol Et
```bash
node --version
npm --version
```

### 3. Projeyi Kur
```bash
# Proje dizinine git
cd c:\Users\emreb\OneDrive\Masaüstü\mis602\cdz

# Paketleri yükle
npm install
```

### 4. Environment Variables Ayarla
`.env` dosyası oluştur:
```env
VITE_API_KEY=your_gemini_api_key_here
```

### 5. Projeyi Çalıştır
```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` açılacak.

## 📦 Yüklenen Paketler

### Dependencies
- `react` ^19.2.0
- `react-dom` ^19.2.0
- `@google/genai` ^1.28.0
- `recharts` ^3.3.0

### Dev Dependencies
- `@types/react` ^19.0.0 ⭐ YENİ
- `@types/react-dom` ^19.0.0 ⭐ YENİ
- `@types/node` ^22.14.0
- `typescript` ~5.8.2
- `vite` ^6.2.0
- `@vitejs/plugin-react` ^5.0.0

## 🔧 TypeScript Ayarları

### `tsconfig.json`
- JSX runtime: react-jsx
- Module resolution: bundler
- Skip lib check: true

### `global.d.ts`
- Vite env variables tanımlandı
- `import.meta.env.VITE_API_KEY` kullanılabilir

## ❌ Yaygın Hatalar

### "Cannot find module 'react'"
**Çözüm:** `npm install` çalıştır

### "Cannot find module '@google/genai'"
**Çözüm:** `npm install` çalıştır

### "npm is not recognized"
**Çözüm:** Node.js yükle ve PATH'e eklendiğinden emin ol

## 🎉 Başarılı Kurulum Sonrası

Terminal'de şunu görmelisin:
```
VITE v6.2.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Proje hazır! 🚀


















