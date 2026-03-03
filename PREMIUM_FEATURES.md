# Premium Features - PRO & PRO+ System

## 🎯 Subscription Tiers

### FREE (Ücretsiz)
- ✅ **Results sayfası** - Gün boyunca sınırsız erişim
- ✅ Temel cilt analizi
- ✅ Global score
- ❌ Detaylı yüz analizi
- ❌ Spectral analiz
- ❌ Öneriler
- ❌ İlerleme takibi

### PRO ($2.99/hafta)
- ✅ **Tüm FREE özellikler**
- ✅ **Progress Tracking** - İlerleme grafikleri ve geçmiş
- ✅ Temel raporlar
- ❌ Detaylı yüz analizi
- ❌ Spectral analiz
- ❌ Kişiselleştirilmiş öneriler

### PRO+ ($4.99/hafta) ⭐ EN POPÜLER
- ✅ **Tüm PRO özellikler**
- ✅ **Detailed Face Analysis** - Yüz yapısı, simetri, oranlar
- ✅ **Spectral Light Analysis** - UV, Blue, Red, Green ışık altında cilt analizi
- ✅ **Personalized Recommendations** - Kişiselleştirilmiş iyileştirme önerileri
- ✅ **Advanced Symmetry Metrics** - Detaylı simetri ölçümleri
- ✅ **Unlimited Scans** - Sınırsız tarama
- ✅ **Priority Support** - Öncelikli destek

## 📁 Dosya Yapısı

```
cdz/
├── types/
│   └── subscription.ts          # Subscription types ve helper functions
├── hooks/
│   └── useSubscription.ts       # Subscription state management hook
├── components/
│   ├── Paywall.tsx              # PRO & PRO+ pricing screen
│   ├── Results.tsx              # Premium teaser ile güncellenmiş
│   └── App.tsx                  # Premium kontrolleri ile güncellenmiş
```

## 🔧 Teknik Detaylar

### Subscription Types (`types/subscription.ts`)

```typescript
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PRO_PLUS = 'pro_plus'
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  features: {
    results: boolean;
    face: boolean;
    spectral: boolean;
    recommendations: boolean;
    progress: boolean;
    unlimitedScans: boolean;
  };
}
```

### useSubscription Hook

```typescript
const { 
  subscription,      // Mevcut subscription durumu
  hasAccess,        // Feature erişim kontrolü
  upgradeTo,        // Tier upgrade fonksiyonu
  isPro,            // PRO tier kontrolü
  isProPlus,        // PRO+ tier kontrolü
  isFree            // FREE tier kontrolü
} = useSubscription();
```

### LocalStorage

Subscription durumu otomatik olarak `localStorage`'da saklanır:
- Key: `facial_analysis_subscription`
- Format: JSON string
- Expiration: 7 gün (haftalık subscription)

## 🎨 UI/UX Özellikleri

### 1. Bottom Navigation Lock Icons
- Kilitli özelliklerde **kilit ikonu** görünür
- PRO+ badge'i (sarı renk)
- PRO badge'i (sarı renk)

### 2. Premium Teaser (Results Sayfası)
- FREE kullanıcılar için Results sayfasının sonunda
- Premium özelliklerin listesi
- "Upgrade to PRO+" butonu
- Gradient background (purple-teal)

### 3. Paywall Screen
- İki plan gösterimi (PRO ve PRO+)
- PRO+ için "BEST VALUE" badge'i
- Her plan için özellik listesi
- Radio button selection
- "Start [PLAN] Now" butonu

### 4. Subscription Badge
- PRO+ kullanıcıları için sağ üstte badge
- Gradient background (teal-cyan)
- "PRO+" yazısı

## 🔒 Erişim Kontrolü

### Tab Geçişlerinde
```typescript
const changeTab = (tab: string) => {
  const feature = featureMap[tab];
  if (feature && !hasAccess(feature)) {
    setIsPaywallVisible(true); // Paywall göster
    return;
  }
  // Tab'ı değiştir
};
```

### Feature Gereksinimleri
- **results**: FREE ✅
- **progress**: PRO 🔓
- **face**: PRO+ 🔒
- **spectral**: PRO+ 🔒
- **recommendations**: PRO+ 🔒

## 💳 Satın Alma Akışı

1. Kullanıcı kilitli bir özelliğe tıklar
2. Paywall açılır
3. Kullanıcı PRO veya PRO+ seçer
4. "Start [PLAN] Now" butonuna tıklar
5. `upgradeTo(tier)` fonksiyonu çağrılır
6. Subscription localStorage'a kaydedilir
7. Paywall kapanır
8. Özellikler açılır

**Not:** Şu anda gerçek ödeme entegrasyonu yok. Demo amaçlı localStorage kullanılıyor.

## 🚀 Gelecek İyileştirmeler

### Ödeme Entegrasyonu
- [ ] Stripe integration
- [ ] PayPal integration
- [ ] Apple Pay / Google Pay
- [ ] Receipt validation
- [ ] Server-side subscription verification

### Ek Özellikler
- [ ] Trial period (7 gün ücretsiz deneme)
- [ ] Promo codes (indirim kodları)
- [ ] Annual plans (yıllık planlar - %30 indirim)
- [ ] Lifetime access option
- [ ] Restore purchases (satın almaları geri yükle)

### Analytics
- [ ] Conversion tracking
- [ ] A/B testing farklı fiyatlar
- [ ] Paywall görüntüleme analizi
- [ ] Upgrade rates

## 🧪 Test Senaryoları

### FREE Kullanıcı
1. ✅ Results sayfasına erişebilir
2. ❌ Face sayfasına tıklayınca paywall açılır
3. ❌ Spectral sayfasına tıklayınca paywall açılır
4. ❌ Recommendations sayfasına tıklayınca paywall açılır
5. ❌ Progress sayfasına tıklayınca paywall açılır
6. ✅ Results sayfasında premium teaser görünür

### PRO Kullanıcı
1. ✅ Results sayfasına erişebilir
2. ❌ Face sayfasına tıklayınca paywall açılır
3. ❌ Spectral sayfasına tıklayınca paywall açılır
4. ❌ Recommendations sayfasına tıklayınca paywall açılır
5. ✅ Progress sayfasına erişebilir
6. ❌ Premium teaser görünmez

### PRO+ Kullanıcı
1. ✅ Tüm sayfalara erişebilir
2. ✅ Sağ üstte "PRO+" badge'i görünür
3. ✅ Bottom navigation'da kilit ikonları yok
4. ❌ Premium teaser görünmez

## 📊 Pricing Strategy

### Haftalık Fiyatlandırma
- **PRO:** $2.99/hafta = ~$12.96/ay
- **PRO+:** $4.99/hafta = ~$21.56/ay

### Önerilen Aylık Fiyatlar (Gelecek)
- **PRO:** $9.99/ay (23% indirim)
- **PRO+:** $16.99/ay (21% indirim)

### Önerilen Yıllık Fiyatlar (Gelecek)
- **PRO:** $79.99/yıl (38% indirim)
- **PRO+:** $129.99/yıl (41% indirim)

## 🎁 Marketing Stratejileri

1. **7-Day Free Trial:** İlk 7 gün ücretsiz, sonra otomatik ücretlendirme
2. **Limited Time Offer:** İlk 1000 kullanıcıya %50 indirim
3. **Referral Program:** Arkadaşını getir, 1 hafta ücretsiz kazan
4. **Seasonal Promotions:** Özel günlerde indirimler
5. **Bundle Deals:** 3 ay + 1 ay ücretsiz

## 📱 Kullanıcı Onboarding

1. **İlk Kullanım:** FREE tier ile başla
2. **2. Tarama Sonrası:** Premium teaser göster
3. **5. Tarama Sonrası:** Paywall popup (soft reminder)
4. **Locked Feature Click:** Immediate paywall

## 🔐 Güvenlik

- ✅ LocalStorage encryption (şu anda plain text)
- ⚠️ Server-side validation gerekli (production için)
- ⚠️ Receipt validation (mobil uygulamalar için)
- ⚠️ Anti-fraud measures

## 📞 Destek

### Müşteri Sorularına Yanıtlar

**S: PRO ve PRO+ arasındaki fark nedir?**
C: PRO ile temel progress tracking, PRO+ ile tüm detaylı analizler (face, spectral, recommendations) açılır.

**S: İptal edebilir miyim?**
C: Evet, istediğiniz zaman iptal edebilirsiniz. Mevcut dönem sonuna kadar erişiminiz devam eder.

**S: Ödeme güvenli mi?**
C: Evet, tüm ödemeler SSL ile şifrelenmiş ve güvenli ödeme sağlayıcıları üzerinden yapılır.

**S: Trial period var mı?**
C: Evet, 7 gün ücretsiz deneme sunuyoruz. (İleride eklenecek)

---

## 🚀 Hızlı Başlangıç

### Demo Subscription Aktifleştirme (Development)

```javascript
// Chrome Console'da çalıştır
localStorage.setItem('facial_analysis_subscription', JSON.stringify({
  tier: 'pro_plus',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  features: {
    results: true,
    face: true,
    spectral: true,
    recommendations: true,
    progress: true,
    unlimitedScans: true
  }
}));
// Sayfayı yenile
location.reload();
```

### Subscription Sıfırlama

```javascript
localStorage.removeItem('facial_analysis_subscription');
location.reload();
```

---

**Son Güncelleme:** 2025-11-27
**Versiyon:** 1.0.0















