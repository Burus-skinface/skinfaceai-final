import type { ComprehensiveFaceState } from '../faceScan/faceState';

/**
 * FACE BIG 6 — Structural Attractiveness Scoring
 *
 * Mirrors the Skin Big6 architecture.
 * Input:  ComprehensiveFaceState.geometry  (already computed in engine.ts)
 * Output: FaceBig6Scores (6 cards × 4 sub-metrics each, 0-10)
 *
 * 6 Cards:
 *   1. Eyes       — Canthal Tilt, Intercanthal Ratio, Brow Projection, Eye-Face Ratio
 *   2. Nose       — Alar/Intercanthal, Nose-Face Length, Alar Symmetry, Nasal Tip Angle
 *   3. Jawline    — Gonial Angle, Bigonial Ratio, Jaw Definition, Jaw Taper
 *   4. Chin       — Horizontal Projection, Cervicomental Angle, Vertical Height, Chin Taper
 *   5. Midface    — FWHR, Cheekbone Ratio, Malar Projection, Mid-Lower Balance
 *   6. Harmony    — Facial Thirds, Overall Symmetry, Golden Ratio, Phi Concordance
 */

// ============================================================================
// TYPES
// ============================================================================

export type FaceBig6Status = 'critical' | 'poor' | 'average' | 'good' | 'elite';

export interface FaceBig6Breakdown {
  label: string;
  score: number;   // 0-10
  tag: 'angle' | 'ratio' | 'projection' | 'symmetry' | 'morphology';
}

export interface FaceBig6Metric {
  /** 0-10 score */
  score: number;
  status: FaceBig6Status;
  statusLabel: string;
  breakdown: FaceBig6Breakdown[];
}

export interface FaceBig6Scores {
  eyes: FaceBig6Metric;
  nose: FaceBig6Metric;
  jawline: FaceBig6Metric;
  chin: FaceBig6Metric;
  midface: FaceBig6Metric;
  harmony: FaceBig6Metric;
  /** Weighted overall (0-10) */
  overallFaceBig6: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function clamp10(v: number): number {
  return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 5;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function getStatus(score: number): FaceBig6Status {
  if (score >= 8.5) return 'elite';
  if (score >= 7.0) return 'good';
  if (score >= 5.0) return 'average';
  if (score >= 3.0) return 'poor';
  return 'critical';
}

function getStatusLabel(status: FaceBig6Status): string {
  switch (status) {
    case 'elite':   return 'Elite';
    case 'good':    return 'Good';
    case 'average': return 'Average';
    case 'poor':    return 'Needs Work';
    case 'critical': return 'Critical';
  }
}

/**
 * Map a raw value to a 0-10 score using an ideal range.
 * Values within [idealMin, idealMax] → score ≥ penaltyStart (default 10).
 * Deviations are penalized linearly with penaltyRate per unit.
 */
function rangeScore(
  val: number,
  idealMin: number,
  idealMax: number,
  penaltyRate: number,
  inverted = false
): number {
  if (!isFinite(val) || val === 0) return 5; // Fallback for missing data
  let score: number;
  if (val >= idealMin && val <= idealMax) {
    score = 10;
  } else if (val < idealMin) {
    score = 10 - (idealMin - val) * penaltyRate;
  } else {
    score = 10 - (val - idealMax) * penaltyRate;
  }
  if (inverted) score = 10 - score; // For "lower is better" metrics
  return clamp10(score);
}

// ============================================================================
// 1. EYES
// ============================================================================
/**
 * Sub-metrics (all XY-ready, high accuracy):
 *   A. Canthal Tilt       — blueprint.canthalTilt (°). Positive = hunter. Ideal male 2-8°.
 *   B. Intercanthal Ratio — ruleOfFifthsRatio.    Ideal ≈ 1.0 (fifths parity).
 *   C. Brow Projection    — browProjectionRatio.  Higher = more depth → better.
 *   D. Eye-Face Ratio     — eyeSpacing.           ruleOfFifthsRatio proxy already covers, use faceWidth / eyeSpacing
 */
function scoreEyes(geo: ComprehensiveFaceState['geometry'], gender: string): FaceBig6Metric {
  const g = gender === 'female' ? 'female' : 'male';

  // A. Canthal Tilt — Ideal male: 2-8°, female: 0-5°
  const tiltMin = g === 'male' ? 2 : 0;
  const tiltMax = g === 'male' ? 8 : 5;
  const tiltScore = rangeScore(geo.blueprint.canthalTilt, tiltMin, tiltMax, 0.8);

  // B. Intercanthal / Face Width — ruleOfFifthsRatio ideal ≈ 1.0 (eye = 1/5 face width)
  const fifthsScore = rangeScore(geo.ruleOfFifthsRatio, 0.88, 1.12, 12);

  // C. Brow Projection — browProjectionRatio. Higher = deeper brow ridge.
  // 0-1 scale from the engine. Ideal male: 0.4+, female: 0.2+
  const browMin = g === 'male' ? 0.3 : 0.1;
  const browScore = rangeScore(geo.browProjectionRatio, browMin, 1.0, 8);

  // D. Eye Spacing Ratio — blueprint.eyeSpacingRatio. Ideal ≈ 0.28-0.35
  const eyeSpRatioScore = rangeScore(geo.blueprint.eyeSpacingRatio, 0.25, 0.35, 20);

  const weights = [0.40, 0.25, 0.20, 0.15];
  const score = clamp10(
    tiltScore * weights[0] +
    fifthsScore * weights[1] +
    browScore * weights[2] +
    eyeSpRatioScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'Canthal Tilt', score: tiltScore, tag: 'angle' },
      { label: 'Intercanthal Ratio', score: fifthsScore, tag: 'ratio' },
      { label: 'Brow Projection', score: browScore, tag: 'projection' },
      { label: 'Eye Spacing', score: eyeSpRatioScore, tag: 'ratio' },
    ],
  };
}

// ============================================================================
// 2. NOSE
// ============================================================================
/**
 * Replaced "Dorsal Hump (Z)" and "Tip Projection (pure Z)" with reliable XY metrics:
 *   A. Alar / Intercanthal — goldenRatioMouthNose proxy (nose-mouth balance). Ideal ≈ 1.5-1.75
 *   B. Nose-Face Length    — middleThirdRatio (Nasion-Subnasale / FaceH). Ideal ≈ 0.33
 *   C. Alar Symmetry       — symmetryNose. 0-1 where 1 = perfect.
 *   D. Nasal Tip Angle     — nasofrontalAngle (Y-Z plane, reasonable frontal proxy). Ideal 120-130°
 */
function scoreNose(geo: ComprehensiveFaceState['geometry'], gender: string): FaceBig6Metric {
  const g = gender === 'female' ? 'female' : 'male';

  // A. Alar / Intercanthal proxy — lip-nose ratio: mouthW/noseW. Ideal 1.5-1.75
  const alarScore = rangeScore(geo.goldenRatioMouthNose, 1.4, 1.8, 8);

  // B. Nose-Face Length — middleThird (Nasion-Subnasale). Ideal ≈ 0.30-0.36
  const nflScore = rangeScore(geo.middleThirdRatio, 0.28, 0.36, 30);

  // C. Alar Symmetry — 0-1, map to 0-10
  const symScore = clamp10(geo.symmetryNose * 10);

  // D. Nasal Tip Angle — nasofrontalAngle. Ideal male: 120-130°, female: 115-125°
  const nasoMin = g === 'male' ? 120 : 115;
  const nasoMax = g === 'male' ? 130 : 125;
  const nasoScore = rangeScore(geo.nasofrontalAngle, nasoMin, nasoMax, 0.5);

  const weights = [0.30, 0.25, 0.25, 0.20];
  const score = clamp10(
    alarScore * weights[0] +
    nflScore * weights[1] +
    symScore * weights[2] +
    nasoScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'Alar / Intercanthal', score: alarScore, tag: 'ratio' },
      { label: 'Nose-Face Length', score: nflScore, tag: 'ratio' },
      { label: 'Alar Symmetry', score: symScore, tag: 'symmetry' },
      { label: 'Nasal Tip Angle', score: nasoScore, tag: 'angle' },
    ],
  };
}

// ============================================================================
// 3. JAWLINE
// ============================================================================
/**
 *   A. Gonial Angle         — gonialAngle. Ideal male: 110-125°, female: 120-130°
 *   B. Bigonial/Bizygomatic — jawCheekboneRatio (jaw/cheek). Ideal male: 0.88-0.95, female: 0.82-0.90
 *   C. Jaw Definition       — jawlineSharpness + jawlineDeviation composite
 *   D. Jaw Taper            — chinJawRatio. Ideal ≈ 0.50-0.65 (V-shape)
 */
function scoreJawline(geo: ComprehensiveFaceState['geometry'], gender: string): FaceBig6Metric {
  const g = gender === 'female' ? 'female' : 'male';

  // A. Gonial Angle
  const gonialMin = g === 'male' ? 110 : 120;
  const gonialMax = g === 'male' ? 125 : 130;
  const gonialScore = rangeScore(geo.gonialAngle, gonialMin, gonialMax, 0.35);

  // B. Bigonial/Bizygomatic ratio
  const jawMin = g === 'male' ? 0.80 : 0.74;
  const jawMax = g === 'male' ? 0.95 : 0.90;
  const bigorRatioScore = rangeScore(geo.jawCheekboneRatio, jawMin, jawMax, 14);

  // C. Jaw Definition — jawlineSharpness (0-1) + penalize high jawlineDeviation
  // jawlineSharpness: higher = sharper (better)
  // jawlineDeviation: lower = cleaner jawline (better)
  const sharpScore = clamp10(geo.jawlineSharpness * 10);
  // Deviation penalty: 0 = perfect, >10° = worse
  const devPenalty = Math.min(5, geo.jawlineDeviation * 0.2);
  const defScore = clamp10(sharpScore - devPenalty);

  // D. Jaw Taper — chinJawRatio. Lower = more tapered (V-shape). Ideal 0.45-0.62
  const taperScore = rangeScore(geo.chinJawRatio, 0.42, 0.62, 14);

  const weights = [0.35, 0.30, 0.20, 0.15];
  const score = clamp10(
    gonialScore * weights[0] +
    bigorRatioScore * weights[1] +
    defScore * weights[2] +
    taperScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'Gonial Angle', score: gonialScore, tag: 'angle' },
      { label: 'Bigonial/Bizygomatic', score: bigorRatioScore, tag: 'ratio' },
      { label: 'Jaw Definition', score: defScore, tag: 'morphology' },
      { label: 'Jaw Taper', score: taperScore, tag: 'ratio' },
    ],
  };
}

// ============================================================================
// 4. CHIN
// ============================================================================
/**
 *   A. Horizontal Projection — chinProjectionRatio (Z-depth based). Ideal male: 18-28%, female: 8-20%
 *   B. Cervicomental Angle   — cervicoMentalAngle. Ideal: 90-115°
 *   C. Vertical Height       — chinHeightRatio. Ideal ≈ 0.17-0.22
 *   D. Chin Taper            — chinFaceRatio. Ideal ≈ 0.40-0.55 (wider chin = squarer)
 */
function scoreChin(geo: ComprehensiveFaceState['geometry'], gender: string): FaceBig6Metric {
  const g = gender === 'female' ? 'female' : 'male';

  // A. Horizontal Projection (Z-based % of face width)
  const chinProjMin = g === 'male' ? 15.0 : 8.0;
  const chinProjMax = g === 'male' ? 28.0 : 20.0;
  const projScore = rangeScore(geo.chinProjectionRatio, chinProjMin, chinProjMax, 0.25);

  // B. Cervicomental Angle
  const cervScore = rangeScore(geo.cervicoMentalAngle, 90, 115, 0.28);

  // C. Vertical Height
  const heightScore = rangeScore(geo.chinHeightRatio, 0.15, 0.22, 40);

  // D. Chin Taper (chinFaceRatio — chin width / face width)
  // Male: wider (square) better: 0.45-0.55. Female: narrower: 0.38-0.50
  const chinFaceMin = g === 'male' ? 0.42 : 0.35;
  const chinFaceMax = g === 'male' ? 0.56 : 0.50;
  const taperScore = rangeScore(geo.chinFaceRatio, chinFaceMin, chinFaceMax, 12);

  const weights = [0.35, 0.25, 0.25, 0.15];
  const score = clamp10(
    projScore * weights[0] +
    cervScore * weights[1] +
    heightScore * weights[2] +
    taperScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'Horizontal Projection', score: projScore, tag: 'projection' },
      { label: 'Cervicomental Angle', score: cervScore, tag: 'angle' },
      { label: 'Vertical Height', score: heightScore, tag: 'ratio' },
      { label: 'Chin Taper', score: taperScore, tag: 'ratio' },
    ],
  };
}

// ============================================================================
// 5. MIDFACE
// ============================================================================
/**
 * Replaced "Submalar Fullness" and "Infraorbital Support" (needs 3D/CT) with:
 *   A. FWHR                — midfaceRatio. Ideal male: 1.90-2.15, female: 1.70-1.85
 *   B. Cheekbone Ratio     — cheekboneWidthRatio (cheek/jaw). Ideal: 1.18-1.26
 *   C. Malar Projection    — cheekProjection (Z-depth relief). Higher = more projected.
 *   D. Mid-Lower Balance   — midLowerRatio (midH/lowerH). Ideal ≈ 0.95-1.10
 */
function scoreMidface(geo: ComprehensiveFaceState['geometry'], gender: string): FaceBig6Metric {
  const g = gender === 'female' ? 'female' : 'male';

  // A. FWHR
  const fwhrMin = g === 'male' ? 1.90 : 1.70;
  const fwhrMax = g === 'male' ? 2.15 : 1.85;
  const fwhrScore = rangeScore(geo.midfaceRatio, fwhrMin, fwhrMax, 2.5);

  // B. Cheekbone Ratio (cheek width / jaw width)
  const cheekMin = g === 'male' ? 1.18 : 1.12;
  const cheekMax = g === 'male' ? 1.30 : 1.28;
  const cheekScore = rangeScore(geo.cheekboneWidthRatio, cheekMin, cheekMax, 8);

  // C. Malar Projection — cheekProjection is z-depth diff * 10. Positive = projected.
  // Ideal: positive (> 0), higher = better. Range 0-3 typical.
  // Map: <0 → poor, 0-1 → average, 1-2 → good, >2 → elite
  const malarRaw = geo.cheekProjection;
  const malarScore = malarRaw < 0
    ? clamp10(5 + malarRaw * 2)    // Negative → below average
    : clamp10(5 + malarRaw * 2.5); // Positive → above average

  // D. Mid-Lower Balance
  const mlScore = rangeScore(geo.midLowerRatio, 0.90, 1.10, 14);

  const weights = [0.35, 0.30, 0.20, 0.15];
  const score = clamp10(
    fwhrScore * weights[0] +
    cheekScore * weights[1] +
    malarScore * weights[2] +
    mlScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'FWHR', score: fwhrScore, tag: 'ratio' },
      { label: 'Cheekbone Ratio', score: cheekScore, tag: 'ratio' },
      { label: 'Malar Projection', score: malarScore, tag: 'projection' },
      { label: 'Mid-Lower Balance', score: mlScore, tag: 'ratio' },
    ],
  };
}

// ============================================================================
// 6. HARMONY
// ============================================================================
/**
 *   A. Facial Thirds      — upper/mid/lowerThirdRatio deviation from 0.333 each
 *   B. Overall Symmetry   — symmetryAvg (0-1)
 *   C. Golden Ratio Score — goldenRatioFaceIPD (0-100 score from engine)
 *   D. Phi Concordance    — goldenRatioMouthNose (mouth/nose ratio → phi proximity)
 */
function scoreHarmony(geo: ComprehensiveFaceState['geometry']): FaceBig6Metric {
  // A. Facial Thirds — average deviation from ideal 0.333
  const IDEAL_THIRD = 1 / 3;
  const avgDev = (
    Math.abs(geo.upperThirdRatio - IDEAL_THIRD) +
    Math.abs(geo.middleThirdRatio - IDEAL_THIRD) +
    Math.abs(geo.lowerThirdRatio - IDEAL_THIRD)
  ) / 3;
  // 0% dev = 10, 5% dev = 5, 10% dev = 0
  const thirdsScore = clamp10(10 - avgDev * 200);

  // B. Overall Symmetry (0-1 → 0-10)
  const symScore = clamp10(geo.symmetryAvg * 10);

  // C. Golden Ratio Score — engine outputs 0-100 already
  const grScore = clamp10(geo.goldenRatioFaceIPD / 10);

  // D. Phi Concordance — mouth/nose ratio. Ideal ≈ 1.5-1.75 (approaching phi 1.618)
  const phiScore = rangeScore(geo.goldenRatioMouthNose, 1.45, 1.75, 6);

  const weights = [0.30, 0.30, 0.25, 0.15];
  const score = clamp10(
    thirdsScore * weights[0] +
    symScore * weights[1] +
    grScore * weights[2] +
    phiScore * weights[3]
  );
  const status = getStatus(score);

  return {
    score,
    status,
    statusLabel: getStatusLabel(status),
    breakdown: [
      { label: 'Facial Thirds', score: thirdsScore, tag: 'ratio' },
      { label: 'Overall Symmetry', score: symScore, tag: 'symmetry' },
      { label: 'Golden Ratio', score: grScore, tag: 'ratio' },
      { label: 'Phi Concordance', score: phiScore, tag: 'ratio' },
    ],
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Compute the Face Big 6 scores from the geometry object inside ComprehensiveFaceState.
 * Returns null if geometry is unavailable or all-zero (bad scan).
 */
export function computeFaceBig6(
  faceState?: ComprehensiveFaceState,
  gender: string = 'male'
): FaceBig6Scores | null {
  if (!faceState?.geometry) return null;

  const geo = faceState.geometry;

  // Sanity check: if the entire geometry is zeroed out (failed scan), return null
  if (geo.midfaceRatio === 0 && geo.gonialAngle === 0 && geo.symmetryAvg === 0) return null;

  const g = gender.toLowerCase();

  const eyes     = scoreEyes(geo, g);
  const nose     = scoreNose(geo, g);
  const jawline  = scoreJawline(geo, g);
  const chin     = scoreChin(geo, g);
  const midface  = scoreMidface(geo, g);
  const harmony  = scoreHarmony(geo);

  // Weighted overall
  // Harmony & Eyes carry highest attractiveness weight in literature
  const overallFaceBig6 = clamp10(
    harmony.score  * 0.22 +
    eyes.score     * 0.20 +
    jawline.score  * 0.18 +
    midface.score  * 0.18 +
    chin.score     * 0.12 +
    nose.score     * 0.10
  );

  return {
    eyes,
    nose,
    jawline,
    chin,
    midface,
    harmony,
    overallFaceBig6,
  };
}
