import type { DailyReport } from '../../types';
import type { FaceBig6Scores, FaceBig6Metric } from '../../services/scoring/faceBig6Scoring';
import { localized } from '../../localization';

export type FaceFeatureId = 'eyes' | 'nose' | 'jawline' | 'chin' | 'midface' | 'harmony';

export const FACE_FEATURE_IDS: FaceFeatureId[] = ['eyes', 'nose', 'jawline', 'chin', 'midface', 'harmony'];

/** Weights mirror computeFaceBig6() so opportunity impact matches the real overall formula. */
export const FACE_FEATURE_WEIGHTS: Record<FaceFeatureId, number> = {
  harmony: 0.22,
  eyes: 0.20,
  jawline: 0.18,
  midface: 0.18,
  chin: 0.12,
  nose: 0.10,
};

interface FaceFeatureMeta {
  /** Material Symbols icon name */
  icon: string;
  title: () => string;
  /** Short list description — page 2 rows ("Eye openness, under-eye quality...") */
  description: () => string;
  /** Short opportunity hint — page 1 "Biggest Opportunities" subtitle */
  opportunityHint: () => string;
  /** Identity chip label used when this feature is one of the user's strongest */
  traitChip: () => string;
  /** Non-medical improvement tips for page 3 */
  tips: () => { icon: string; title: string; body: string }[];
}

export const FACE_FEATURE_META: Record<FaceFeatureId, FaceFeatureMeta> = {
  eyes: {
    icon: 'visibility',
    title: () => localized('Eye Area', 'Göz Bölgesi'),
    description: () => localized('Eye openness, spacing, and overall eye definition.', 'Göz açıklığı, aralığı ve genel göz tanımı.'),
    opportunityHint: () => localized('Brighter, more open eyes', 'Daha parlak, daha açık bakış'),
    traitChip: () => localized('Expressive', 'Etkileyici'),
    tips: () => [
      { icon: 'bedtime', title: localized('Improve sleep quality', 'Uyku kalitesini artır'), body: localized('Helps reduce under-eye darkness.', 'Göz altı koyuluğunu azaltmaya yardımcı olur.') },
      { icon: 'water_drop', title: localized('Use eye brightening care', 'Göz aydınlatıcı bakım kullan'), body: localized('Look for vitamin C and caffeine.', 'C vitamini ve kafein içeren ürünlere bak.') },
    ],
  },
  nose: {
    icon: 'air',
    title: () => localized('Nose', 'Burun'),
    description: () => localized('Nose proportion, symmetry, and balance with your face.', 'Burun oranı, simetrisi ve yüzle dengesi.'),
    opportunityHint: () => localized('Better nose-face balance', 'Daha iyi burun-yüz dengesi'),
    traitChip: () => localized('Refined', 'Zarif'),
    tips: () => [
      { icon: 'face_retouching_natural', title: localized('Track your angles', 'Açılarını takip et'), body: localized('Scan at the same neutral angle for consistent readings.', 'Tutarlı ölçüm için aynı nötr açıyla tara.') },
      { icon: 'light_mode', title: localized('Mind the lighting', 'Işığa dikkat et'), body: localized('Even, frontal light gives the most accurate symmetry signal.', 'Dengeli ön ışık en doğru simetri sinyalini verir.') },
    ],
  },
  jawline: {
    icon: 'architecture',
    title: () => localized('Jawline', 'Çene Hattı'),
    description: () => localized('Jaw definition, gonial angle and lower face structure.', 'Çene tanımı, gonial açı ve alt yüz yapısı.'),
    opportunityHint: () => localized('Stronger, more defined jaw', 'Daha güçlü, daha belirgin çene hattı'),
    traitChip: () => localized('Defined', 'Keskin Hatlı'),
    tips: () => [
      { icon: 'monitor_weight', title: localized('Reduce puffiness', 'Şişkinliği azalt'), body: localized('Lower sodium and better hydration sharpen definition.', 'Daha az sodyum ve iyi hidrasyon hatları belirginleştirir.') },
      { icon: 'accessibility_new', title: localized('Fix your posture', 'Duruşunu düzelt'), body: localized('Neutral head posture improves jaw-neck separation.', 'Nötr baş duruşu çene-boyun ayrımını iyileştirir.') },
    ],
  },
  chin: {
    icon: 'change_history',
    title: () => localized('Chin', 'Çene Ucu'),
    description: () => localized('Chin projection, height and balance with your lips.', 'Çene projeksiyonu, yüksekliği ve dudaklarla dengesi.'),
    opportunityHint: () => localized('Better chin-lip balance', 'Daha iyi çene-dudak dengesi'),
    traitChip: () => localized('Sculpted', 'Oturmuş'),
    tips: () => [
      { icon: 'self_improvement', title: localized('Avoid chin tucking', 'Çene sıkıştırmadan kaçın'), body: localized('Scanning with a level chin keeps projection readings honest.', 'Düz çene ile taramak projeksiyon ölçümünü doğru tutar.') },
      { icon: 'straighten', title: localized('Watch neck angle', 'Boyun açısını izle'), body: localized('A clean cervicomental angle improves the whole lower third.', 'Temiz bir boyun-çene açısı tüm alt üçlüyü iyileştirir.') },
    ],
  },
  midface: {
    icon: 'face',
    title: () => localized('Midface', 'Orta Yüz'),
    description: () => localized('Midface volume, cheekbone structure and facial thirds alignment.', 'Orta yüz hacmi, elmacık yapısı ve yüz üçlüleri hizası.'),
    opportunityHint: () => localized('More lifted midface look', 'Daha dolgun orta yüz görünümü'),
    traitChip: () => localized('Youthful', 'Genç Görünümlü'),
    tips: () => [
      { icon: 'sentiment_satisfied', title: localized('Keep a neutral expression', 'Nötr ifade koru'), body: localized('Smiling compresses the midface and shifts ratios.', 'Gülümseme orta yüzü sıkıştırır ve oranları değiştirir.') },
      { icon: 'nights_stay', title: localized('Sleep and hydration', 'Uyku ve hidrasyon'), body: localized('Both directly affect cheek volume and skin firmness.', 'İkisi de yanak hacmini ve cilt sıkılığını doğrudan etkiler.') },
    ],
  },
  harmony: {
    icon: 'balance',
    title: () => localized('Harmony', 'Uyum'),
    description: () => localized('Overall harmony and balance between your facial features.', 'Yüz hatların arasındaki genel uyum ve denge.'),
    opportunityHint: () => localized('Better feature balance', 'Daha iyi hat dengesi'),
    traitChip: () => localized('Balanced', 'Dengeli'),
    tips: () => [
      { icon: 'balance', title: localized('Scan consistently', 'Tutarlı tara'), body: localized('Same distance and angle make harmony trends reliable.', 'Aynı mesafe ve açı, uyum trendini güvenilir kılar.') },
      { icon: 'timeline', title: localized('Track the trend', 'Trendi takip et'), body: localized('Harmony moves slowly — compare weeks, not days.', 'Uyum yavaş değişir — günleri değil haftaları karşılaştır.') },
    ],
  },
};

/** Deterministic score → "Top X%" mapping (no real population data yet). */
export function scoreToTopPercent(score: number): number {
  if (score >= 9.0) return 8;
  if (score >= 8.5) return 10;
  if (score >= 8.0) return 15;
  if (score >= 7.5) return 22;
  if (score >= 7.0) return 28;
  if (score >= 6.0) return 40;
  if (score >= 5.0) return 50;
  return 65;
}

export function scoreLabel(score: number): string {
  if (score >= 8.5) return localized('Excellent', 'Mükemmel');
  if (score >= 8.0) return localized('Very Good', 'Çok İyi');
  if (score >= 7.0) return localized('Good', 'İyi');
  if (score >= 5.5) return localized('Average', 'Orta');
  return localized('Needs Work', 'Gelişmeli');
}

export function scoreColor(score: number): string {
  if (score >= 8.5) return '#B8860B';
  if (score >= 7.0) return '#16a34a';
  if (score >= 5.5) return '#d97706';
  return '#dc2626';
}

/** Resolve FaceBig6Scores from a report — pipeline stores it at scoring.faceBig6, dev mocks at scoring.face.faceBig6. */
export function resolveFaceBig6(data: DailyReport | null | undefined): FaceBig6Scores | undefined {
  const scoring: any = data?.scoring;
  return (scoring?.faceBig6 ?? scoring?.face?.faceBig6) as FaceBig6Scores | undefined;
}

export function getFeatureMetric(scores: FaceBig6Scores | undefined, id: FaceFeatureId): FaceBig6Metric | undefined {
  return scores?.[id] as FaceBig6Metric | undefined;
}

export interface FaceOpportunity {
  id: FaceFeatureId;
  score: number;
  impact: number; // potential overall gain, e.g. 0.3
}

/** Top-N opportunities: (10 - score) * weight, sorted desc. */
export function computeOpportunities(scores: FaceBig6Scores | undefined, count = 3): FaceOpportunity[] {
  if (!scores) return [];
  return FACE_FEATURE_IDS
    .map((id) => {
      const metric = getFeatureMetric(scores, id);
      const score = typeof metric?.score === 'number' ? metric.score : NaN;
      return {
        id,
        score,
        impact: Math.round((10 - score) * FACE_FEATURE_WEIGHTS[id] * 10) / 10,
      };
    })
    .filter((o) => isFinite(o.score) && o.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, count);
}
