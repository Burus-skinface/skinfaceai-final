# Google OAuth Setup

## 🔑 Google Client ID Alma

### Adım 1: Google Cloud Console'a Git
https://console.cloud.google.com/

### Adım 2: Yeni Proje Oluştur (veya mevcut projeyi seç)
1. Üstteki "Select a project" → "New Project"
2. Proje adı ver (örn: "Facial Analysis App")
3. "Create" tıkla

### Adım 3: OAuth Consent Screen Ayarla
1. Sol menüden "APIs & Services" → "OAuth consent screen"
2. "External" seç → "Create"
3. Uygulama bilgilerini doldur:
   - App name: Facial Analysis
   - User support email: Senin email'in
   - Developer contact: Senin email'in
4. "Save and Continue"
5. Scopes ekranında "Save and Continue" (default scopes yeterli)
6. Test users ekranında kendi email'ini ekle
7. "Save and Continue"

### Adım 4: OAuth Client ID Oluştur
1. Sol menüden "Credentials" → "Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "Facial Analysis Web"
4. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   ```
5. "Create" tıkla
6. **Client ID'yi kopyala!**

### Adım 5: .env Dosyasına Ekle
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

### Adım 6: Server'ı Restart Et
```bash
# Terminal'de Ctrl+C ile durdur
npm run dev
```

---

## 🧪 Test Etme

1. Login ekranında "Continue with Google" tıkla
2. Google hesap seçme popup'ı açılacak
3. Hesabını seç
4. Onboarding sorularını doldur
5. Upload screen'e gideceksin!

---

## ⚠️ Sorun Giderme

### "Google Sign-In library not loaded"
- Tarayıcı console'unda bu hatayı görürsen:
- index.html'deki Google script tag'inin yüklendiğinden emin ol
- Sayfayı yenile (F5)

### Demo Mode
- Eğer Google Client ID yoksa veya hata varsa, otomatik demo mode'a geçer
- Demo mode'da "demo@gmail.com" ile giriş olur

### Test Users
- OAuth consent screen'de TEST MODE'dayken
- Sadece eklediğin test users giriş yapabilir
- Production'a almak için Google review gerekir

---

## 🚀 Production'a Alma

1. OAuth consent screen'i "PUBLISH" yap
2. Google review için başvur
3. Domain verification yap
4. Authorized domains ekle

---

## 📝 Mevcut Durum

✅ Google OAuth entegrasyonu hazır
✅ Fallback demo mode var
✅ JWT token parsing
✅ User info extraction (email, name, photo)

Şu an Google Client ID eklenmezse demo mode çalışır!














