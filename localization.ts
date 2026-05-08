
const translations = {
  en: {
    // App.tsx
    results: 'Skin',
    details: 'Face',
    spectral: 'Spectral',
    recommendations: 'Glow Up',
    progress: 'Progress',

    // UploadScreen.tsx
    uploadScreenTitle: 'Track your glow up streak day by day',
    uploadScreenSubtitle: (day: number) => `Day ${day} Analysis`,
    analyzing: "Reading today's glow up signals...",
    greatJobToday: (day: number) => `Glow check logged. Day ${day} streak is active.`,
    viewProgress: 'View My Progress',
    uploadTodaysPhoto: "Upload Photo",
    skipForNow: 'Skip',
    analysisFailed: 'Analysis failed. Please try again.',

    // Results.tsx (Skin & Global)
    noAnalysisYet: 'No analysis yet.',
    startJourney: 'Upload a photo to start!',
    dayReport: (day: number) => `glowcheck${day} 🔥`,
    progressScore: 'Your Glow Score',
    detailedResult: 'Your Skin Signals',
    problemAnalysis: 'Daily Skin Check',
    basicSkinFeatures: 'Your Skin Signature',

    // Skin Fields (Renamed to Positive Attributes for 10-scale)
    acne_grade: 'Skin Clarity',
    texture_roughness: 'Smoothness',
    oil_level: 'Oil Control',
    redness_level: 'Tone Evenness',
    pore_size: 'Pore Tightness',
    pigmentation_level: 'Pigmentation Balance',
    hydration: 'Hydration Level',
    skin_tone: 'Skin Tone',
    skin_score: 'Dermal Health Score',
    acne_density: 'Acne Density',
    closed_comedones: 'Closed Comedones',
    open_comedones: 'Open Comedones',
    inflamed_acne: 'Inflamed Acne',
    cystic_acne: 'Non-Cystic Score', // Inverse of Cystic Probability
    dark_circles: 'Eye Brightness',
    scalp_visibility: 'Scalp Visibility',

    // Skin Profile & Summary
    dailySummary: 'Daily Summary',
    skinProfile: 'Your Skin Profile',
    skinType: 'Skin Type',
    moisture: 'Moisture',
    oiliness: 'Oiliness',
    skinTone: 'Skin Tone',
    elasticity: 'Elasticity',
    skinCondition: 'Skin Highlights',
    skinConditionDesc: 'Changeable factors',
    skinQuality: 'Skin Foundation',
    skinQualityDesc: 'Your unique markers',

    // Skin Analysis - Region-Specific
    skinAnalysis: 'Skin Analysis',
    activeFormations: 'Active Formations',
    textureIrregularity: 'Texture Irregularity',
    oilShineDistribution: 'Oil & Shine Distribution',
    toneVariation: 'Tone Variation',
    visualFatigue: 'Visual Fatigue',
    regionalAnalysis: 'Regional Analysis',
    forehead: 'Forehead',
    beardArea: 'Beard Area',

    // FaceAnalysis.tsx (Structure & Symmetry)
    noFaceData: 'No structural data.',
    uploadForDetailedAnalysis: 'Upload to analyze bone structure.',
    detailedAnalysisForDay: (day: number) => `Day ${day}: Structural Metrics`,
    facialStructureAnalysis: 'Face Shape & Geometry',
    symmetryAnalysis: 'Symmetry Analysis',

    // Structure Fields
    face_shape: 'Face Shape',
    jawline_sharpness: 'Jawline Sharpness',
    cheekbone_prominence: 'Cheekbone Prominence',
    chin_projection: 'Chin Projection',
    chin_width: 'Chin Width',
    midface_length: 'Midface Length',
    forehead_ratio: 'Forehead Ratio',
    brow_projection: 'Brow Projection',
    structure_score: 'Structure Score',

    // Symmetry Fields
    symmetry_score: 'Symmetry Score',
    eye_symmetry: 'Eye Height Diff',
    midline_alignment: 'Midline Alignment',
    eye_size_diff: 'Eye Size Diff',
    eyebrow_height_sym: 'Eyebrow Height Sym',
    nostril_symmetry: 'Nostril Symmetry',
    lip_deviation: 'Lip Deviation',
    face_axis_tilt: 'Facial Axis Tilt',
    left_right_ratio: 'L/R Face Ratio',

    // Recommendations.tsx (Aesthetics)
    noRecommendations: 'No glow plan yet.',
    uploadForRecommendations: 'Scan once to unlock your looksmaxx plan.',
    personalizedRecommendations: 'Your Glow Up Plan',
    actionableTips: 'Small steps keep the streak alive.',

    // Aesthetics Fields
    attractiveness_score: 'Attractiveness',
    youthfulness_score: 'Youthfulness',
    masculinity_femininity_score: 'Masc/Fem Balance',
    harmony_score: 'Facial Harmony',
    hollywood_ratio: 'Hollywood Ratio',
    hairstyle: 'Recommended Hairstyles',
    skincare_priority: 'Skincare Priority',
    beard_recommendation: 'Beard Style',
    weight_rec: 'Weight Recommendation',

    // Recommendations.tsx (Glowup Guide)
    glowupActionPlan: 'Your Looksmaxx Plan',
    glowupActionPlanDesc: 'Do not leave today blank',
    archetypeDiscovery: 'Read Your Signal',
    morningProtocol: 'Morning Task',
    morningProtocolDesc: 'Protect the score',
    eveningProtocol: 'Night Task',
    eveningProtocolDesc: 'Repair the signal',
    strategicMemo: 'Coach Note',

    // FacialAnalysisResult.tsx (4-Card Architecture)
    frontArchitecture: 'Balanced Face',
    sideProfileAnalysis: 'Your Profile',
    jawlineStrength: 'Defined Jawline',
    harmonySymmetry: 'Perfect Balance',
    facialThirds: 'Facial Thirds',
    cheekbones: 'Cheekbones',
    browRidge: 'Brow Ridge',
    midface: 'Midface',
    nasofrontalAngle: 'Nasofrontal Angle',
    rickettsELine: 'Ricketts E-Line',
    ramus: 'Ramus',
    neckPosture: 'Neck Posture',
    gonialAngle: 'Gonial Angle',
    definition: 'Definition',
    chinMass: 'Chin Mass',
    ramusLength: 'Ramus Length',
    bilateralSymmetry: 'Bilateral Symmetry',
    goldenRatio: 'Golden Ratio',
    ruleOfFifths: 'Rule of Fifths',
    facialAnalysisTitle: 'Your Facial Insights',
    facialAnalysisDesc: 'A direct read on your structure.',
    structuralIntegrityReport: 'Your Balanced Face Profile',
    calculatingInsights: 'Reading your structural signals...',
    dailyNote: 'Daily Note',
    dailyAICommentary: 'Daily AI Analysis Report',

    // Progress.tsx
    noHistoryYet: 'No history yet.',
    progressAfterFirstAnalysis: 'Your global score chart will appear here.',
    yourProgressJourney: 'Score Streak History',
    progressScoreLine: 'Global Score',
    analysisHistory: 'History',
    score: 'Score',

    // SpectralAnalysis.tsx
    noSpectralData: 'No spectral data.',
    uploadForSpectralAnalysis: 'Upload a photo for a spectral analysis.',
    spectralAnalysis: 'Spectral Analysis',
    spectralAnalysisSubtitle: 'Discover the hidden layers of your skin under different lights.',
    conclusion: 'Conclusion',
    targetedCarePlan: 'Targeted Care Plan',
    targetedCarePlanDescription: 'Get a custom care plan for issues revealed by each light spectrum.',

    // FaceScanCamera.tsx (Help / Privacy)
    faceScanHelpTitle: "Why do we scan your face?",
    faceScanHelpBody:
      "SkinFace AI evaluates your face with a brief scan to maximize analysis quality. No photo or video is stored during the scan; your privacy is always protected.",
    scanComplete: 'Scan Complete!',
    faceScan: 'Face Scan',
    startScanDescription: 'Identify skin health, structure, and spectral biomarkers in seconds.',
    startScan: 'Start Live Scan',
    findCelebrityMatch: 'Find Celebrity Match',
    backToResults: 'Back to Results',
    undertoneAccuracy: 'Undertone Accuracy',
    acneProfile: 'Acne Profile',
    unlockPremium: 'Unlock Glow Plan',
    unlockPremiumDesc: 'Unlock detailed signals and the 7-day looksmaxx plan.',

    // BeforeAfter.tsx
    shareProgressTitle: 'My Glow Up Streak',
    shareProgressCopied: 'Copied to clipboard!',
    beforeAfterBefore: 'Before',
    beforeAfterAfter: 'After',
    beforeAfterShare: 'Share Progress',
    shareProgressText: (days: number, before: number, after: number, diff: number, improved: boolean) =>
      `My ${days}-day glow up streak on SkinFace AI: ${before} to ${after} (${improved ? '+' : ''}${diff}).`,
    beforeAfterTitle: (days: number) => `${days}-Day Glow Change`,
    beforeAfterPoints: (points: number, improved: boolean) => `${improved ? '+' : ''}${points} pts`,

    rating: '4.9 Rating',
    users: '10k+ Users',
    signInWithEmail: 'Sign in with email',
    dontHaveAccount: "I don't have an account",
    continueAsGuest: 'Continue as Guest',
    enterEmail: 'Enter your email',
    alreadyHaveAccount: 'Already have an account? Sign In',
    continueWithGoogle: 'Continue with Google',
    back: 'Back',
    or: 'or',
    premiumFeature1: 'Advanced Skin Analysis',
    premiumFeature2: 'Personalized Routine',
    premiumFeature3: 'Product Recommendations',
    premiumFeature4: 'Expert Consultation',
    loading: 'Loading...',
    signUp: 'Sign Up',
    signIn: 'Sign In',
    upgradeToProPlus: 'Upgrade to Pro+',
    startingFrom: 'Starting from $4.99',


    // NotificationSettings.tsx
    notificationsNotSupported: 'Notifications are not supported on this device.',
    dailyReminders: 'Daily Reminders',
    dailyRemindersDesc: 'Stay consistent with your routine.',
    enableNotifications: 'Enable Notifications',
    dailyScanReminder: 'Daily Scan Reminder',
    dailyScanReminderDesc: 'Get reminded to scan your face daily.',
    reminderTime: 'Reminder Time',
    streakWarnings: 'Streak Protection',
    streakWarningsDesc: 'Get warned before your streak breaks.',
    reportReady: 'Report Ready',
    reportReadyDesc: 'Know instantly when your analysis is done.',
    sendTestNotification: 'Send Test Notification',
    whyEnableNotifications: 'Why enable notifications?',
    notificationBenefit1: 'Do not leave a day blank',
    notificationBenefit2: 'Maintain your analysis streak',
    notificationBenefit3: 'Get instant analysis alerts',
    notificationBenefit4: 'Receive weekly progress reports',
  },
  tr: {
    // App.tsx
    results: 'Skin',
    details: 'Face',
    spectral: 'Spektral',
    recommendations: 'Glow Up',
    progress: 'Gelişim',

    // UploadScreen.tsx
    uploadScreenTitle: 'Glow up serini günbegün takip et',
    uploadScreenSubtitle: (day: number) => `${day}. Gün Analizi`,
    analyzing: "Bugünkü glow up sinyalleri okunuyor...",
    greatJobToday: (day: number) => `Glow check kaydedildi. ${day}. gün serisi aktif.`,
    viewProgress: 'Gelişimimi Görüntüle',
    uploadTodaysPhoto: "Fotoğraf Yükle",
    skipForNow: 'Atla',
    analysisFailed: 'Analiz başarısız oldu. Lütfen tekrar deneyin.',

    // Results.tsx (Skin & Global)
    noAnalysisYet: 'Henüz analiz yapılmadı.',
    startJourney: 'Başlamak için bir fotoğraf yükle!',
    dayReport: (day: number) => `glowcheck${day} 🔥`,
    progressScore: 'Glow Skorun',
    detailedResult: 'Cilt Sinyallerin',
    problemAnalysis: 'Günlük Cilt Kontrolü',
    basicSkinFeatures: 'Cilt İmzan',

    // Skin Fields (Renamed to Positive Attributes)
    acne_grade: 'Cilt Temizliği', // Skin Clarity
    texture_roughness: 'Pürüzsüzlük', // Smoothness
    oil_level: 'Yağ Dengesi', // Oil Balance
    redness_level: 'Ton Eşitliği', // Tone Evenness
    pore_size: 'Gözenek Sıkılığı', // Pore Tightness
    pigmentation_level: 'Leke Dengesi', // Pigmentation Balance
    hydration: 'Nem Seviyesi',
    skin_tone: 'Cilt Tonu',
    skin_score: 'Dermal Sağlık Puanı',
    acne_density: 'Akne Yoğunluğu',
    closed_comedones: 'Kapalı Komedon',
    open_comedones: 'Açık Komedon',
    inflamed_acne: 'İltihaplı Akne',
    cystic_acne: 'Kist Risk Puanı', // Non-Cystic Score
    dark_circles: 'Göz Çevresi Aydınlığı', // Eye Brightness
    scalp_visibility: 'Saç Derisi Görünürlüğü',

    // Skin Profile & Summary
    dailySummary: 'Günlük Özet',
    skinProfile: 'Cilt Profilin',
    skinType: 'Cilt Tipi',
    moisture: 'Nem',
    oiliness: 'Yağlılık',
    skinTone: 'Cilt Tonu',
    elasticity: 'Elastikiyet',
    skinCondition: 'Cilt Durumu',
    skinConditionDesc: 'Günlük değişkenler',
    skinQuality: 'Cilt Temeli',
    skinQualityDesc: 'Sana özel belirteçler',

    // Skin Analysis - Region-Specific
    skinAnalysis: 'Cilt Analizi',
    activeFormations: 'Aktif Oluşumlar',
    textureIrregularity: 'Doku Düzensizliği',
    oilShineDistribution: 'Yağ ve Parlaklık Dağılımı',
    toneVariation: 'Ton Varyasyonu',
    visualFatigue: 'Görsel Yorgunluk',
    regionalAnalysis: 'Bölgesel Analiz',
    forehead: 'Alın',
    beardArea: 'Sakal Bölgesi',

    // FaceAnalysis.tsx (Structure & Symmetry)
    noFaceData: 'Yapısal veri yok.',
    uploadForDetailedAnalysis: 'Kemik yapısını analiz etmek için yükle.',
    detailedAnalysisForDay: (day: number) => `${day}. Gün: Yapısal Metrikler`,
    facialStructureAnalysis: 'Yüz Şekli ve Geometri',
    symmetryAnalysis: 'Simetri Analizi',

    // Structure Fields
    face_shape: 'Yüz Şekli',
    jawline_sharpness: 'Çene Hattı Keskinliği',
    cheekbone_prominence: 'Elmacık Kemiği Belirginliği',
    chin_projection: 'Çene Çıkıklığı',
    chin_width: 'Çene Genişliği',
    midface_length: 'Orta Yüz Uzunluğu',
    forehead_ratio: 'Alın Oranı',
    brow_projection: 'Kaş Çıkıklığı',
    structure_score: 'Yapı Puanı',

    // Symmetry Fields
    symmetry_score: 'Simetri Puanı',
    eye_symmetry: 'Göz Hizası Farkı',
    midline_alignment: 'Orta Hat Hizası',
    eye_size_diff: 'Göz Boyut Farkı',
    eyebrow_height_sym: 'Kaş Yüksekliği Simetrisi',
    nostril_symmetry: 'Burun Deliği Simetrisi',
    lip_deviation: 'Dudak Sapması',
    face_axis_tilt: 'Yüz Eksen Eğikliği',
    left_right_ratio: 'Sol/Sağ Yüz Oranı',

    // Recommendations.tsx (Aesthetics)
    noRecommendations: 'Glow planı yok.',
    uploadForRecommendations: 'Looksmaxx planını açmak için bir ölçüm al.',
    personalizedRecommendations: 'Glow Up Planın',
    actionableTips: 'Küçük görevler seriyi yaşatır.',

    // Aesthetics Fields
    attractiveness_score: 'Çekicilik Endeksi',
    youthfulness_score: 'Gençlik',
    masculinity_femininity_score: 'Maskülen/Feminen Denge',
    harmony_score: 'Yüz Uyumu',
    hollywood_ratio: 'Hollywood Ratio',
    hairstyle: 'Önerilen Saç Stilleri',
    skincare_priority: 'Cilt Bakım Önceliği',
    beard_recommendation: 'Sakal Stili',
    weight_rec: 'Kilo Önerisi',

    // Recommendations.tsx (Glowup Guide)
    glowupActionPlan: 'Looksmaxx Planın',
    glowupActionPlanDesc: 'Bugünü boş bırakma',
    archetypeDiscovery: 'Sinyalini Oku',
    morningProtocol: 'Sabah Görevi',
    morningProtocolDesc: 'Skoru koru',
    eveningProtocol: 'Gece Görevi',
    eveningProtocolDesc: 'Sinyali onar',
    strategicMemo: 'Koç Notu',

    // FacialAnalysisResult.tsx (4-Card Architecture)
    frontArchitecture: 'Dengeli Yüz',
    sideProfileAnalysis: 'Profil Analizi',
    jawlineStrength: 'Belirgin Çene',
    harmonySymmetry: 'Mükemmel Uyum',
    facialThirds: 'Yüz Üçlemesi',
    cheekbones: 'Elmacık Kemikleri',
    browRidge: 'Kaş Çıkıntısı',
    midface: 'Orta Yüz',
    nasofrontalAngle: 'Nazofrontal Açı',
    rickettsELine: 'Ricketts E-Hattı',
    ramus: 'Ramus',
    neckPosture: 'Boyun Duruşu',
    gonialAngle: 'Gonyal Açı',
    definition: 'Keskinlik',
    chinMass: 'Çene Kütlesi',
    ramusLength: 'Ramus Uzunluğu',
    bilateralSymmetry: 'Bilateral Simetri',
    goldenRatio: 'Altın Oran',
    ruleOfFifths: 'Beşli Kuralı',
    facialAnalysisTitle: 'Yüz Hattı Bilgilerin',
    facialAnalysisDesc: 'Yüz yapına direkt bir okuma.',
    structuralIntegrityReport: 'Senin Yüz Profilin',
    calculatingInsights: 'Yapısal sinyallerin okunuyor...',
    dailyNote: 'Günlük Not',
    dailyAICommentary: 'DAİLY Aİ ANALİZ SONUCU YORUMU',

    // Progress.tsx
    noHistoryYet: 'Henüz geçmiş yok.',
    progressAfterFirstAnalysis: "Skor serini görmek için ilk ölçümü al.",
    googleLogin: "Google Giriş",
    signOut: "Çıkış Yap",
    yourProgressJourney: 'Skor Serisi Geçmişi',
    progressScoreLine: 'Global Puan',
    analysisHistory: 'Geçmiş',
    score: 'Puan',

    // SpectralAnalysis.tsx
    noSpectralData: 'Spektral veri yok.',
    uploadForSpectralAnalysis: 'Spektral analiz için bir fotoğraf yükle.',
    spectralAnalysis: 'Spektral Analiz',
    spectralAnalysisSubtitle: 'Cildinin farklı ışıklar altındaki gizli katmanlarını keşfet.',
    conclusion: 'Sonuç',
    targetedCarePlan: 'Hedefli Bakım Planı',
    targetedCarePlanDescription: 'Her ışık türünün ortaya çıkardığı sorunlara özel bir bakım planı al.',

    // FaceScanCamera.tsx (Help / Privacy)
    faceScanHelpTitle: "Neden yüz taraması yapıyoruz?",
    faceScanHelpBody:
      "SkinFace AI, analiz kalitesini en üst seviyeye taşımak için yüzünü birkaç saniyelik bir taramayla değerlendirir. Tarama sırasında hiçbir fotoğraf veya video saklanmaz; gizliliğin her zaman korunur.",
    scanComplete: 'Tarama Tamamlandı!',
    faceScan: 'Yüz Taraması',
    startScanDescription: 'Cilt sağlığını, yapısını ve spektral biyobelirteçleri saniyeler içinde belirleyin.',
    startScan: 'Canlı Taramayı Başlat',
    findCelebrityMatch: 'Ünlü Benzerini Bul',
    backToResults: 'Sonuçlara Dön',
    undertoneAccuracy: 'Alt Ton Doğruluğu',
    acneProfile: 'Akne Profili',
    unlockPremium: 'Glow Planı Aç',
    unlockPremiumDesc: 'Detaylı sinyaller ve 7 günlük looksmaxx planını aç.',

    // BeforeAfter.tsx
    shareProgressTitle: 'Glow Up Serim',
    shareProgressCopied: 'Panoya kopyalandı!',
    beforeAfterBefore: 'Önce',
    beforeAfterAfter: 'Sonra',
    beforeAfterShare: 'Gelişimi Paylaş',
    shareProgressText: (days: number, before: number, after: number, diff: number, improved: boolean) =>
      `SkinFace AI'da ${days} günlük glow up serim: ${before}'den ${after}'e (${improved ? '+' : ''}${diff}).`,
    beforeAfterTitle: (days: number) => `${days} Günlük Glow Değişimi`,
    beforeAfterPoints: (points: number, improved: boolean) => `${improved ? '+' : ''}${points} p`,

    rating: '4.9 Puan',
    users: '10k+ Kullanıcı',
    signInWithEmail: 'E-posta ile giriş yap',
    dontHaveAccount: "Hesabım yok",
    continueAsGuest: 'Misafir olarak devam et',
    enterEmail: 'E-postanızı girin',
    alreadyHaveAccount: 'Zaten hesabınız var mı? Giriş Yap',
    continueWithGoogle: 'Google ile devam et',
    back: 'Geri',
    or: 'veya',
    premiumFeature1: 'Gelişmiş Cilt Analizi',
    premiumFeature2: 'Kişiselleştirilmiş Rutin',
    premiumFeature3: 'Ürün Önerileri',
    premiumFeature4: 'Uzman Danışmanlığı',
    upgradeToProPlus: 'Pro+ Yükselt',
    startingFrom: 'Başlangıç fiyatı $4.99',

    // NotificationSettings.tsx
    notificationsNotSupported: 'Bu cihazda bildirimler desteklenmiyor.',
    dailyReminders: 'Günlük Hatırlatıcılar',
    dailyRemindersDesc: 'Rutininize sadık kalın.',
    enableNotifications: 'Bildirimleri Aç',
    dailyScanReminder: 'Günlük Tarama Hatırlatıcısı',
    dailyScanReminderDesc: 'Yüzünüzü taramayı unutmayın.',
    reminderTime: 'Hatırlatma Saati',
    streakWarnings: 'Seri Koruma',
    streakWarningsDesc: 'Seriniz bozulmadan önce uyarı alın.',
    reportReady: 'Rapor Hazır',
    reportReadyDesc: 'Analiz bittiğinde anında haberdar olun.',
    sendTestNotification: 'Test Bildirimi Gönder',
    whyEnableNotifications: 'Neden bildirimleri açmalıyım?',
    notificationBenefit1: 'Bugünü boş bırakma',
    notificationBenefit2: 'Analiz serini koru',
    notificationBenefit3: 'Anında analiz sonuçlarını gör',
    notificationBenefit4: 'Haftalık gelişim raporları al',

    // ReferralCard.tsx
    referralTitle: 'Arkadaşını Davet Et, Pro+ Kazan',
    referralDesc: 'Özel davet kodunu arkadaşlarınla paylaş. Onlar ilk analizlerini yaptıklarında, ikiniz de 1 hafta ücretsiz Pro+ kazanın!',
    referralCode: 'DAVET KODUN',
    referralCopied: 'Kopyalandı!',
    referralCopy: 'Kopyala',
    referralStep1: 'Bağlantıyı paylaş',
    referralStep2: 'Arkadaşın kaydolsun',
    referralStep3: 'Ödülünü kazan',
    referralFriendsInvited: 'Davet Edilen',
    referralRewardsEarned: 'Kazanılan Hafta',
  }
};

export type SupportedLanguage = 'en' | 'tr';

let currentLanguage: SupportedLanguage = 'en';

if (typeof navigator !== 'undefined') {
  const preferredLanguage = navigator.languages?.[0] || navigator.language || 'en';
  const userLang = preferredLanguage.toLowerCase().split('-')[0];
  if (userLang === 'tr') {
    currentLanguage = 'tr';
  }
}

export type Translation = typeof translations.en;
export const t: Translation = translations[currentLanguage] as Translation;

export const getLanguage = (): SupportedLanguage => currentLanguage;
export const getLocale = () => currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
export const localized = <T,>(en: T, tr: T): T => currentLanguage === 'tr' ? tr : en;
