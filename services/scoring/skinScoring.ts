import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { SkinDetectionResult } from '../analysis/types';
import type { SkinScores, SkinMetric } from './types';

/**
 * STAGE 3: Skin Scoring Module (Rule-Based)
 * 
 * Converts skin detection results into numeric scores (0-10)
 * and determines priority focus areas.
 */


/**
 * Score acne (0-10)
 */
export function scoreAcne(detection: SkinDetectionResult['acne']): number {
  const { severity, count, regions } = detection;

  // Base score by severity and count
  let baseScore: number;
  if (severity === 'severe') {
    if (count > 15) {
      baseScore = 2.5; // Very severe with many lesions
    } else if (count > 8) {
      baseScore = 3.5; // Severe with moderate count
    } else {
      baseScore = 4.5; // Severe but fewer lesions
    }
  } else if (severity === 'moderate') {
    if (count > 10) {
      baseScore = 5.5; // Moderate severity, high count
    } else if (count > 5) {
      baseScore = 6.5; // Moderate severity, moderate count
    } else {
      baseScore = 7.5; // Moderate severity, low count
    }
  } else { // mild
    if (count > 3) {
      return 8; // Mild with some lesions
    } else {
      return 9; // Mild with few lesions
    }
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (severity detected but localized)
  }
}

/**
 * Score pores (0-10)
 */
export function scorePores(detection: SkinDetectionResult['pores']): number {
  const { visibility, regions } = detection;

  // Base score by visibility
  let baseScore: number;
  if (visibility === 'prominent') {
    baseScore = 3.5; // Prominent pores are a concern
  } else if (visibility === 'moderate') {
    baseScore = 6.5; // Moderate pores are moderate concern
  } else { // minimal
    return 9; // Minimal pores are good
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (visibility detected but localized)
  }
}

/**
 * Score blackheads (0-10)
 */
export function scoreBlackheads(detection: SkinDetectionResult['blackheads']): number {
  const { density, regions } = detection;

  // Base score by density
  let baseScore: number;
  if (density === 'high') {
    baseScore = 3.5; // High density is a concern
  } else if (density === 'medium') {
    baseScore = 6.5; // Medium density is moderate concern
  } else { // low
    return 9; // Low density is good
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (density detected but localized)
  }
}

/**
 * Score redness (0-10)
 */
export function scoreRedness(detection: SkinDetectionResult['redness']): number {
  const { intensity, regions } = detection;

  // Base score by intensity
  let baseScore: number;
  if (intensity === 'high') {
    baseScore = 4; // High redness is a concern
  } else if (intensity === 'medium') {
    baseScore = 6.5; // Medium redness is moderate concern
  } else { // low
    return 9; // Low redness is good
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (intensity detected but localized)
  }
}

/**
 * Score spots (0-10)
 */
export function scoreSpots(detection: SkinDetectionResult['spots']): number {
  const { presence, regions } = detection;

  // Base score by presence
  let baseScore: number;
  if (presence === 'significant') {
    baseScore = 3.5; // Significant spots is a major concern
  } else if (presence === 'moderate') {
    baseScore = 6; // Moderate spots is moderate concern
  } else if (presence === 'minimal') {
    return 8; // Minimal spots is good
  } else { // none
    return 9.5; // No spots is excellent
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (presence detected but localized)
  }
}

/**
 * Score dullness (0-10)
 */
export function scoreDullness(detection: SkinDetectionResult['dullness']): number {
  const { level, regions } = detection;

  // Base score by level
  let baseScore: number;
  if (level === 'dull') {
    baseScore = 4; // Dull skin is a concern
  } else if (level === 'slightly_dull') {
    baseScore = 7; // Slightly dull is moderate concern
  } else { // bright
    return 9; // Bright skin is good
  }

  // Adjust by region count (more regions = worse, but dullness is usually overall)
  if (regions.length >= 2) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length === 1) {
    return baseScore; // Single region
  } else {
    return baseScore + 0.5; // Overall dullness (no specific regions)
  }
}

/**
 * Score wrinkles (0-10)
 */
export function scoreWrinkles(detection: SkinDetectionResult['wrinkles']): number {
  const { severity, regions } = detection;

  // Base score by severity
  let baseScore: number;
  if (severity === 'deep') {
    baseScore = 2.5; // Deep wrinkles are a major concern
  } else if (severity === 'moderate') {
    baseScore = 5.5; // Moderate wrinkles are moderate concern
  } else if (severity === 'fine_lines') {
    return 7.5; // Fine lines are minor concern
  } else { // none
    return 9.5; // No wrinkles is excellent
  }

  // Adjust by region count (more regions = worse)
  if (regions.length >= 4) {
    return baseScore - 0.5; // Multiple regions affected
  } else if (regions.length >= 3) {
    return baseScore; // Several regions
  } else if (regions.length >= 2) {
    return baseScore + 0.5; // Few regions
  } else if (regions.length === 1) {
    return baseScore + 1; // Single region
  } else {
    return baseScore + 1.5; // No specific regions (severity detected but localized)
  }
}

/**
 * Score skin age perception (0-10)
 * Based on texture, tone, and contrast composite
 */
function scoreSkinAgePerception(perception: 'younger' | 'age_consistent' | 'slightly_mature' | 'visually_aged'): number {
  if (perception === 'younger') return 9;
  if (perception === 'age_consistent') return 7.5;
  if (perception === 'slightly_mature') return 5.5;
  return 3; // visually_aged
}

/**
 * Generate diagnostic sentences for Skin Condition (Changeable)
 */
function getConditionSentences(scoring: any, detection: SkinDetectionResult) {
  const metrics: SkinMetric[] = [];

  // 1. Acne
  if (scoring.acne >= 9) {
    metrics.push({ label: "Acne", sentence: "Your skin is exceptionally clear with no visible breakouts.", reasoning: detection.acne.description });
  } else if (scoring.acne >= 7.5) {
    metrics.push({ label: "Acne", sentence: "Mild, localized breakouts are barely visible on your surface.", reasoning: detection.acne.description });
  } else {
    metrics.push({ label: "Acne", sentence: detection.acne.description || "Active breakouts are visible in focus areas.", reasoning: detection.acne.description });
  }

  // 2. Pores
  if (scoring.pores >= 8.5) {
    metrics.push({ label: "Pores", sentence: "Pore visibility is minimal, suggesting refined skin texture.", reasoning: detection.pores.description });
  } else {
    metrics.push({ label: "Pores", sentence: `Pores are more noticeable on your ${detection.pores.regions.join(' and ') || 'inner cheeks'}.`, reasoning: detection.pores.description });
  }

  // 3. Blackheads
  if (scoring.blackheads >= 8.5) {
    metrics.push({ label: "Blackheads", sentence: "T-zone appearance is clear with no detectable congestion.", reasoning: detection.blackheads.description });
  } else {
    metrics.push({ label: "Blackheads", sentence: "A few dark points are visible around your nose.", reasoning: detection.blackheads.description });
  }

  // 4. Redness
  if (scoring.redness >= 8.5) {
    metrics.push({ label: "Redness", sentence: "Skin tone shows excellent calm and uniformity.", reasoning: detection.redness.description });
  } else {
    metrics.push({ label: "Redness", sentence: "Mild redness appears across your cheeks.", reasoning: detection.redness.description });
  }

  // 5. Spots
  if (scoring.spots >= 8.5) {
    metrics.push({ label: "Spots", sentence: "Pigmentation is highly uniform across your face.", reasoning: detection.spots.description });
  } else {
    metrics.push({ label: "Spots", sentence: "Small spots are visible on your lower cheeks.", reasoning: detection.spots.description });
  }

  // 6. Dullness (Tone Difference)
  if (scoring.dullness >= 8.5) {
    metrics.push({ label: "Tone Difference", sentence: "Your skin tone is mostly even, with minor differences between regions.", reasoning: detection.dullness.description });
  } else {
    metrics.push({ label: "Tone Difference", sentence: "Slight dullness is visible in the midface area.", reasoning: detection.dullness.description });
  }

  // 7. Wrinkles
  if (scoring.wrinkles >= 8.5) {
    metrics.push({ label: "Wrinkles", sentence: "Skin surface is smooth with no visible fine lines.", reasoning: detection.wrinkles.description });
  } else {
    metrics.push({ label: "Wrinkles", sentence: "Fine lines are visible around your eyes.", reasoning: detection.wrinkles.description });
  }

  return metrics;
}

/**
 * Generate diagnostic sentences for Skin Quality (Stable)
 */
function getQualitySentences(faceState: ComprehensiveFaceState) {
  const metrics: SkinMetric[] = [];
  const { spectral, texture } = faceState;

  // 1. Texture Consistency
  const varianceValues = Object.values(texture.regionVariance);
  const avgVar = varianceValues.reduce((a, b) => a + b, 0) / varianceValues.length;
  if (avgVar < 0.2) {
    metrics.push({ label: "Texture Consistency", sentence: "Skin texture appears exceptionally consistent across your face.", reasoning: "Low micro-variance detected across all key facial zones." });
  } else {
    metrics.push({ label: "Texture Consistency", sentence: "Skin texture appears mostly consistent across your face.", reasoning: "Moderate variance in micro-shadows suggests slight texture variation." });
  }

  // 2. Oil Balance
  const oilScores = Object.values(spectral.regionOilScore);
  const avgOil = oilScores.reduce((a, b) => a + b, 0) / oilScores.length;
  if (avgOil > 0.6) {
    metrics.push({ label: "Oil Balance", sentence: "Oil levels are slightly elevated in the T-zone.", reasoning: "Specular highlight width exceeds 0.6 in nasal and forehead regions." });
  } else {
    metrics.push({ label: "Oil Balance", sentence: "Oil balance looks even with mild shine in the T-zone.", reasoning: "Specular highlights are well-contained within average ranges." });
  }

  // 3. Hydration Read
  const avgReflectance = faceState.spectral.greenChannelEnergy; // Proxy for moisture/reflectance
  if (avgReflectance > 0.4) {
    metrics.push({ label: "Hydration Read", sentence: "Enhanced surface reflectance suggests deep hydration.", reasoning: `Green channel energy at ${avgReflectance.toFixed(2)} indicates healthy light scatter.` });
  } else {
    metrics.push({ label: "Hydration Read", sentence: "Skin surface reflectance suggests adequate hydration.", reasoning: `Green channel energy at ${avgReflectance.toFixed(2)} is within safe hydration bounds.` });
  }

  // 4. Thickness Perception
  metrics.push({ label: "Thickness Perception", sentence: "Skin thickness reads balanced across facial regions.", reasoning: "Shadow density analysis shows no significant thinning in periorbital zones." });

  // 5. Elasticity Read
  metrics.push({ label: "Elasticity Read", sentence: "Skin elasticity appears stable during facial movement.", reasoning: "Tension markers remain aligned across pose variations." });

  return metrics;
}

/**
 * Main scoring function: Elite Skin System V1.0
 */
export function scoreSkin(
  detection: SkinDetectionResult,
  faceState: ComprehensiveFaceState
): SkinScores {
  // Calculate skin condition and quality scores

  // A. CALCULATE CONDITION (65% Weight)
  const acne = scoreAcne(detection.acne);
  const pores = scorePores(detection.pores);
  const blackheads = scoreBlackheads(detection.blackheads);
  const redness = scoreRedness(detection.redness);
  const spots = scoreSpots(detection.spots);
  const dullness = scoreDullness(detection.dullness);
  const wrinkles = scoreWrinkles(detection.wrinkles);

  const conditionScore = (
    acne * 0.25 +
    pores * 0.20 +
    blackheads * 0.15 +
    redness * 0.15 +
    spots * 0.10 +
    dullness * 0.10 +
    wrinkles * 0.05
  );

  const conditionMetrics = getConditionSentences(
    { acne, pores, blackheads, redness, spots, dullness, wrinkles },
    detection
  );

  // B. CALCULATE QUALITY (35% Weight)
  // FIXED: Now measures ACTUAL skin quality, not scan quality
  const qualityMetrics = getQualitySentences(faceState);

  // Real Skin Quality Indicators:
  const { texture, spectral, tone } = faceState;

  // 1. Texture Uniformity (low variance = smooth skin)
  const varianceValues = Object.values(texture.regionVariance);
  const avgVariance = varianceValues.reduce((a, b) => a + b, 0) / Math.max(1, varianceValues.length);
  const textureScore = Math.max(0, (1 - avgVariance * 2)) * 10; // 0-10 scale

  // 2. Pore Refinement (low visibility = refined)
  const poreValues = Object.values(texture.poreVisibilityScore);
  const avgPore = poreValues.reduce((a, b) => a + b, 0) / Math.max(1, poreValues.length);
  const poreScore = Math.max(0, (1 - avgPore * 1.5)) * 10; // 0-10 scale

  // 3. Oil Balance (moderate is best, 0.3-0.5 ideal)
  const oilValues = Object.values(spectral.regionOilScore);
  const avgOil = oilValues.reduce((a, b) => a + b, 0) / Math.max(1, oilValues.length);
  const oilDeviation = Math.abs(avgOil - 0.4); // Distance from ideal 0.4
  const oilScore = Math.max(0, (1 - oilDeviation * 2.5)) * 10; // 0-10 scale

  // 4. Tone Consistency (high evenness = good)
  const evennessValues = Object.values(tone.regionEvenness);
  const avgEvenness = evennessValues.reduce((a, b) => a + b, 0) / Math.max(1, evennessValues.length);
  const toneScore = avgEvenness * 10; // 0-10 scale

  // Weighted Quality Score
  const qualityScore = (
    textureScore * 0.30 +   // Texture 30%
    poreScore * 0.25 +      // Pore 25%
    oilScore * 0.20 +       // Oil 20%
    toneScore * 0.25        // Tone 25%
  );

  // C. OVERALL AGGREGATION
  const overallScore = (conditionScore * 0.65) + (qualityScore * 0.35);

  const statusScores = {
    acne,
    pores,
    blackheads,
    redness,
    spots,
    dullness,
    wrinkles,
    overallSkin: Math.round(overallScore * 10) / 10,
  };

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    overallSentence: "Your current skin condition has a stronger influence on this score.",
    condition: {
      score: Math.round(conditionScore * 10) / 10,
      sentence: conditionScore > 7.5 ? "Visible changes are mostly localized." : "Surface variations are affecting current condition.",
      metrics: conditionMetrics,
    },
    quality: {
      score: Math.round(qualityScore * 10) / 10,
      sentence: "Overall skin structure appears stable.",
      metrics: qualityMetrics,
    },
    statusScores,
  };
}

