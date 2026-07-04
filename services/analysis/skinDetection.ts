import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { SkinDetectionResult } from './types';
import { Type } from "@google/genai";
import { debugLog } from '../../utils/debugLog';
import { callAnalyzeProxy } from '../analyzeProxy';
// Scoring imports removed - scoring is done in Stage 3 (skinScoring.ts), not here

/**
 * STAGE 2: Skin Detection Module (Hybrid CV + Gemini)
 * 
 * This module detects skin issues using computer vision algorithms,
 * then uses Gemini to generate natural language descriptions.
 */


/**
 * CV Detection: Detect acne
 * Uses advancedSkinMetrics (activeAcne) when available;
 * falls back to texture variance + redness composite
 */
function detectAcne(faceState: ComprehensiveFaceState): {
  regions: string[];
  severity: 'mild' | 'moderate' | 'severe';
  count: number;
  description: string;
} {
  const adv = faceState.advancedSkinMetrics;

  // Prefer advanced metrics when available
  if (adv) {
    const regions = ['forehead', 'leftCheek', 'rightCheek', 'chin'] as const;
    const affectedRegions: string[] = [];
    let totalLesions = 0;

    for (const r of regions) {
      const health = adv[r]?.health;
      if (health?.activeAcne?.totalLesions > 0) {
        affectedRegions.push(r);
        totalLesions += health.activeAcne.totalLesions;
      }
    }

    const avgAcneScore = regions.reduce((s, r) =>
      s + (adv[r]?.health?.activeAcne?.acneScore || 0), 0) / regions.length;

    let severity: 'mild' | 'moderate' | 'severe';
    if (avgAcneScore > 0.6) severity = 'severe';
    else if (avgAcneScore > 0.3) severity = 'moderate';
    else severity = 'mild';

    return {
      regions: affectedRegions,
      severity,
      count: totalLesions,
      description: `Detected ${severity} acne affecting ${affectedRegions.length} regions.`
    };
  }

  // Fallback: texture variance + redness composite
  const { texture, tone } = faceState;
  const affectedRegions: string[] = [];
  let severityScore = 0;
  let estimatedCount = 0;

  const regionNames = ['forehead', 'leftCheek', 'rightCheek', 'chin', 'jawline'];

  for (const region of regionNames) {
    const variance = texture.regionVariance[region] || 0;
    const redness = tone.regionRedness[region] || 0;

    if (variance > 0.5 && redness > 0.3) {
      affectedRegions.push(region);
      severityScore += variance + redness;
      if (variance > 0.7 && redness > 0.5) estimatedCount += 4;
      else if (variance > 0.5 && redness > 0.3) estimatedCount += 2;
      else estimatedCount += 1;
    }
  }

  let severity: 'mild' | 'moderate' | 'severe';
  if (severityScore > 2.5 || estimatedCount > 15) {
    severity = 'severe';
  } else if (severityScore > 1.2 || estimatedCount > 8) {
    severity = 'moderate';
  } else {
    severity = 'mild';
  }

  return {
    regions: affectedRegions,
    severity,
    count: estimatedCount,
    description: `Detected ${severity} acne concerns affecting ${affectedRegions.length} regions.`
  };
}

/**
 * CV Detection: Detect pores visibility
 */
function detectPores(faceState: ComprehensiveFaceState): {
  regions: string[];
  visibility: 'minimal' | 'moderate' | 'prominent';
  description: string;
} {
  const { texture } = faceState;
  const affectedRegions: string[] = [];
  let totalPoreVisibility = 0;
  let count = 0;

  const regionNames = ['forehead', 'nose', 'chin', 'leftCheek', 'rightCheek'];

  for (const region of regionNames) {
    const poreVisibility = texture.poreVisibilityScore[region] || 0;

    if (poreVisibility > 0.4) {
      affectedRegions.push(region);
    }

    totalPoreVisibility += poreVisibility;
    count++;
  }

  const avgPoreVisibility = totalPoreVisibility / count;

  let visibility: 'minimal' | 'moderate' | 'prominent';
  if (avgPoreVisibility > 0.6) {
    visibility = 'prominent';
  } else if (avgPoreVisibility > 0.3) {
    visibility = 'moderate';
  } else {
    visibility = 'minimal';
  }

  return {
    regions: affectedRegions,
    visibility,
    description: `Pore visibility appears ${visibility} in ${affectedRegions.length} regions.`
  };
}

/**
 * CV Detection: Detect blackheads
 * FIXED: Clinical weighting 60/40 (pore/contrast)
 */
function detectBlackheads(faceState: ComprehensiveFaceState): {
  regions: string[];
  density: 'low' | 'medium' | 'high';
  description: string;
} {
  const { texture, spectral } = faceState;
  const affectedRegions: string[] = [];
  let totalDensity = 0;
  let count = 0;

  const regionNames = ['nose', 'forehead', 'chin'];

  for (const region of regionNames) {
    const poreVisibility = texture.poreVisibilityScore[region] || 0;
    const contrast = spectral.contrastMap[region] || 0;

    // FIXED: Clinical weighting 60/40
    // Pore visibility is PRIMARY (60%), Contrast is SECONDARY (40%)
    const density = (poreVisibility * 0.60) + (contrast * 0.40);

    if (density > 0.4) {
      affectedRegions.push(region);
    }

    totalDensity += density;
    count++;
  }

  const avgDensity = totalDensity / count;

  let densityLevel: 'low' | 'medium' | 'high';
  if (avgDensity > 0.6) {
    densityLevel = 'high';
  } else if (avgDensity > 0.3) {
    densityLevel = 'medium';
  } else {
    densityLevel = 'low';
  }

  return {
    regions: affectedRegions,
    density: densityLevel,
    description: `Blackhead density is ${densityLevel}.`
  };
}

/**
 * CV Detection: Detect redness
 */
function detectRedness(faceState: ComprehensiveFaceState): {
  regions: string[];
  intensity: 'low' | 'medium' | 'high';
  description: string;
} {
  const { tone } = faceState;
  const affectedRegions: string[] = [];
  let totalRedness = 0;
  let count = 0;

  const regionNames = ['forehead', 'nose', 'chin', 'leftCheek', 'rightCheek'];

  for (const region of regionNames) {
    const redness = tone.regionRedness[region] || 0;

    if (redness > 0.3) {
      affectedRegions.push(region);
    }

    totalRedness += redness;
    count++;
  }

  const avgRedness = totalRedness / count;

  let intensity: 'low' | 'medium' | 'high';
  if (avgRedness > 0.5) {
    intensity = 'high';
  } else if (avgRedness > 0.25) {
    intensity = 'medium';
  } else {
    intensity = 'low';
  }

  return {
    regions: affectedRegions,
    intensity,
    description: `Redness intensity is ${intensity}.`
  };
}

/**
 * CV Detection: Detect spots/pigmentation
 */
function detectSpots(faceState: ComprehensiveFaceState): {
  regions: string[];
  presence: 'none' | 'minimal' | 'moderate' | 'significant';
  description: string;
} {
  const { tone, spectral } = faceState;
  const affectedRegions: string[] = [];
  let totalUnevenness = 0;
  let count = 0;

  const regionNames = ['forehead', 'leftCheek', 'rightCheek', 'chin'];

  for (const region of regionNames) {
    const evenness = tone.regionEvenness[region] || 0;
    const redness = tone.regionRedness[region] || 0;
    const contrast = spectral.contrastMap[region] || 0;

    // Composite: unevenness (40%) + high local contrast (30%) + redness deviation (30%)
    const unevenness = ((1 - evenness) * 0.4) + (contrast * 0.3) + (redness * 0.3);

    if (unevenness > 0.3) {
      affectedRegions.push(region);
    }

    totalUnevenness += unevenness;
    count++;
  }

  const avgUnevenness = totalUnevenness / count;

  let presence: 'none' | 'minimal' | 'moderate' | 'significant';
  if (avgUnevenness > 0.5) {
    presence = 'significant';
  } else if (avgUnevenness > 0.3) {
    presence = 'moderate';
  } else if (avgUnevenness > 0.15) {
    presence = 'minimal';
  } else {
    presence = 'none';
  }

  return {
    regions: affectedRegions,
    presence,
    description: `Pigmentation/Spots presence is ${presence}.`
  };
}

/**
 * CV Detection: Detect dullness
 * FIXED: Uses actual skin metrics instead of scan lighting quality
 */
function detectDullness(faceState: ComprehensiveFaceState): {
  regions: string[];
  level: 'bright' | 'slightly_dull' | 'dull';
  description: string;
} {
  const { spectral, tone, texture } = faceState;
  const affectedRegions: string[] = [];

  // FIXED: Use actual skin indicators, not scan quality
  // 1. Contrast (low = dull skin)
  const avgContrast = Object.values(spectral.contrastMap).reduce((a, b) => a + b, 0) /
    Math.max(1, Object.keys(spectral.contrastMap).length);

  // 2. Tone Evenness (high evenness = healthy glow)
  const avgEvenness = Object.values(tone.regionEvenness).reduce((a, b) => a + b, 0) /
    Math.max(1, Object.keys(tone.regionEvenness).length);

  // 3. Texture Variance (high variance = rough/dull appearance)
  const avgVariance = Object.values(texture.regionVariance).reduce((a, b) => a + b, 0) /
    Math.max(1, Object.keys(texture.regionVariance).length);

  // Composite dullness score:
  // Low contrast + Low evenness + High variance = Dull skin
  const dullnessScore = ((1 - avgContrast) * 0.4) + ((1 - avgEvenness) * 0.3) + (avgVariance * 0.3);

  let level: 'bright' | 'slightly_dull' | 'dull';
  if (dullnessScore > 0.5) {
    level = 'dull';
    affectedRegions.push('overall');
  } else if (dullnessScore > 0.3) {
    level = 'slightly_dull';
    affectedRegions.push('overall');
  } else {
    level = 'bright';
  }

  return {
    regions: affectedRegions,
    level,
    description: `Skin tone appears ${level}.`
  };
}

/**
 * CV Detection: Detect wrinkles
 * Uses advancedSkinMetrics when available for real smoothness/roughness data;
 * falls back to texture variance + microContrast composite
 */
function detectWrinkles(faceState: ComprehensiveFaceState): {
  regions: string[];
  severity: 'none' | 'fine_lines' | 'moderate' | 'deep';
  description: string;
} {
  const adv = faceState.advancedSkinMetrics;

  // Prefer advanced metrics (real high-freq texture analysis)
  if (adv) {
    const foreheadRoughness = adv.forehead?.quality?.smoothness?.roughnessLevel || 0;
    const foreheadHFR = adv.forehead?.quality?.smoothness?.highFreqRatio || 0;
    const chinRoughness = adv.chin?.quality?.smoothness?.roughnessLevel || 0;

    const wrinkleScore = (foreheadRoughness * 0.4 + foreheadHFR * 0.3 + chinRoughness * 0.3);
    const affectedRegions: string[] = [];

    if (foreheadRoughness > 0.3) affectedRegions.push('forehead');
    if (chinRoughness > 0.25) affectedRegions.push('chin');

    let severity: 'none' | 'fine_lines' | 'moderate' | 'deep';
    if (wrinkleScore > 0.5) severity = 'deep';
    else if (wrinkleScore > 0.3) severity = 'moderate';
    else if (wrinkleScore > 0.15) severity = 'fine_lines';
    else severity = 'none';

    return { regions: affectedRegions, severity, description: `Wrinkle severity is ${severity}.` };
  }

  // Fallback: texture variance + microContrast composite
  const { texture } = faceState;
  const affectedRegions: string[] = [];

  const foreheadVariance = texture.regionVariance['forehead'] || 0;
  const underEyeVariance = texture.regionVariance['underEyes'] || 0;
  const microContrast = Object.values(texture.microContrast).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(texture.microContrast).length);

  let severity: 'none' | 'fine_lines' | 'moderate' | 'deep';

  if (foreheadVariance > 0.4 || underEyeVariance > 0.4) {
    severity = 'deep';
    if (foreheadVariance > 0.4) affectedRegions.push('forehead');
    if (underEyeVariance > 0.4) affectedRegions.push('under_eyes');
  } else if (foreheadVariance > 0.25 || underEyeVariance > 0.25 || microContrast > 0.35) {
    severity = 'moderate';
    if (foreheadVariance > 0.25) affectedRegions.push('forehead');
    if (underEyeVariance > 0.25) affectedRegions.push('under_eyes');
  } else if (microContrast > 0.2) {
    severity = 'fine_lines';
    affectedRegions.push('overall');
  } else {
    severity = 'none';
  }

  return {
    regions: affectedRegions,
    severity,
    description: `Wrinkle severity is ${severity}.`
  };
}

/**
 * CV Detection: Detect skin age perception
 * Assesses overall visual maturity of the skin surface based on texture, tone, and contrast composite
 */
function detectSkinAgePerception(faceState: ComprehensiveFaceState): {
  regions: string[];
  perception: 'younger' | 'age_consistent' | 'slightly_mature' | 'visually_aged';
} {
  const { texture, tone, spectral } = faceState;

  // Composite score: texture variance + tone unevenness + contrast reduction
  const avgTextureVariance = Object.values(texture.regionVariance).reduce((a, b) => a + b, 0) / Object.keys(texture.regionVariance).length;
  const avgToneEvenness = Object.values(tone.regionRedness).reduce((a, b) => a + b, 0) / Object.keys(tone.regionRedness).length;
  const avgContrast = Object.values(spectral.contrastMap).reduce((a, b) => a + b, 0) / Object.keys(spectral.contrastMap).length;

  // Lower contrast = more mature appearance
  const ageScore = (avgTextureVariance * 0.4) + (avgToneEvenness * 0.3) + ((1 - avgContrast) * 0.3);

  const affectedRegions: string[] = [];
  let perception: 'younger' | 'age_consistent' | 'slightly_mature' | 'visually_aged';

  // Compare upper vs lower face (upper cheeks typically appear fresher)
  const upperCheekVariance = ((texture.regionVariance['leftCheek'] || 0) + (texture.regionVariance['rightCheek'] || 0)) / 2;
  const lowerFaceVariance = ((texture.regionVariance['chin'] || 0) + (texture.regionVariance['jawline'] || 0)) / 2;

  if (ageScore < 0.3) {
    perception = 'younger';
  } else if (ageScore < 0.5) {
    perception = 'age_consistent';
    if (lowerFaceVariance > upperCheekVariance * 1.2) {
      affectedRegions.push('lower_face');
    }
  } else if (ageScore < 0.7) {
    perception = 'slightly_mature';
    if (lowerFaceVariance > upperCheekVariance * 1.2) {
      affectedRegions.push('lower_face');
    } else {
      affectedRegions.push('overall');
    }
  } else {
    perception = 'visually_aged';
    affectedRegions.push('overall');
  }

  // If upper cheeks appear fresher, note it
  if (upperCheekVariance < lowerFaceVariance * 0.8 && perception !== 'younger') {
    affectedRegions.push('upper_cheeks');
  }

  return {
    regions: affectedRegions.length > 0 ? affectedRegions : ['overall'],
    perception,
  };
}

/**
 * Scoring functions (inline)
 */
function scoreSkinAgePerception(perception: 'younger' | 'age_consistent' | 'slightly_mature' | 'visually_aged'): number {
  if (perception === 'younger') return 9;
  if (perception === 'age_consistent') return 7.5;
  if (perception === 'slightly_mature') return 5.5;
  return 3;
}

/**
 * Gemini: Generate descriptions for skin findings (NEW SYSTEM: 7 core categories with scores)
 */
async function generateDescriptions(findings: {
  acne: Omit<ReturnType<typeof detectAcne>, 'description'>;
  pores: Omit<ReturnType<typeof detectPores>, 'description'>;
  blackheads: Omit<ReturnType<typeof detectBlackheads>, 'description'>;
  redness: Omit<ReturnType<typeof detectRedness>, 'description'>;
  spots: Omit<ReturnType<typeof detectSpots>, 'description'>;
  dullness: Omit<ReturnType<typeof detectDullness>, 'description'>;
  wrinkles: Omit<ReturnType<typeof detectWrinkles>, 'description'>;
  scores: {
    acne: number;
    pores: number;
    blackheads: number;
    redness: number;
    spots: number;
    dullness: number;
    wrinkles: number;
  };
}): Promise<{
  acne: string;
  pores: string;
  blackheads: string;
  redness: string;
  spots: string;
  dullness: string;
  wrinkles: string;
  overallSkinScore: number;
  overallSkinSummary: string;
}> {


  // Calculate overall skin score (weighted average)
  // Weighting based on visual impact and importance
  const overallSkinScore = Math.round((
    findings.scores.acne * 0.25 +        // 25% - Most visible and impactful
    findings.scores.pores * 0.20 +        // 20% - Texture visibility
    findings.scores.blackheads * 0.15 +  // 15% - T-zone prominence
    findings.scores.redness * 0.15 +      // 15% - Tone evenness indicator
    findings.scores.spots * 0.10 +        // 10% - Pigmentation
    findings.scores.dullness * 0.10 +     // 10% - Visual freshness
    findings.scores.wrinkles * 0.05       // 5% - Age-related, less critical
  ) * 10) / 10;



  const schema = {
    type: Type.OBJECT,
    properties: {
      acne: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it reduces skin clarity. Example: 'Occasional breakouts and blemishes are present around your chin, reducing overall skin clarity.'"
      },
      pores: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it reduces texture smoothness. Example: 'Pores are more visible in your T-zone, reducing skin texture smoothness.'"
      },
      blackheads: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it affects T-zone appearance. Example: 'A few blackheads are noticeable on your nose, affecting T-zone appearance.'"
      },
      redness: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it causes tone unevenness. Example: 'Skin shows minor redness on your cheeks, causing slight tone unevenness.'"
      },
      spots: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it impacts pigmentation. Example: 'No significant dark spots detected to impact pigmentation.'"
      },
      dullness: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), explaining that it reduces natural glow. Example: 'Your skin shows uneven tone, reducing natural glow.'"
      },
      wrinkles: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), mentioning exact facial regions and explaining that it impacts barrier smoothness. Example: 'No major fine lines are apparent to impact barrier smoothness.'"
      },
      overallSkinSummary: {
        type: Type.STRING,
        description: "ONE short sentence (max 20 words) in second person ('your'), summarizing overall skin condition and scoring influence. Example: 'Your overall skin condition appears balanced, with a few texture areas influencing the score.'"
      },
    },
    required: ["acne", "pores", "blackheads", "redness", "spots", "dullness", "wrinkles", "overallSkinSummary"],
  };

  const prompt = `You are the SKIN ANALYSIS engine of a face scanning application.
Your task is to analyze visible skin quality based on FACE_STATE data and produce user-facing outputs.

CORE INPUT: FACE_STATE (single scan, multi-frame, stabilized)

OUTPUT LANGUAGE RULES (MANDATORY):
- Speak directly to the user (second person)
- Use calm, premium, user-friendly language
- Observational tone (no judgment)
- One short sentence per category (max 20 words)
- Briefly state WHY the issue impacts or reduces the score (explain score drop)

REFERENCE SENTENCE STYLE (MANDATORY):
"Pores are more visible in your T-zone, reducing skin texture smoothness."

SKIN SUB-CATEGORIES (0–10):

For EACH sub-category output:
- Numeric score (0–10) - already calculated
- Exact facial regions affected
- ONE short user-facing sentence explaining how it lowers/impacts the score

A. Acne
Score: ${findings.scores.acne}/10
Severity: ${findings.acne.severity}, Count: ${findings.acne.count} estimated
Regions: ${findings.acne.regions.join(', ') || 'none'}
Output example: "Occasional breakouts and blemishes are present around your chin, reducing overall skin clarity."

B. Pores
Score: ${findings.scores.pores}/10
Visibility: ${findings.pores.visibility}
Regions: ${findings.pores.regions.join(', ') || 'none'}
Output example: "Pores are more visible in your T-zone, reducing skin texture smoothness."

C. Blackheads
Score: ${findings.scores.blackheads}/10
Density: ${findings.blackheads.density}
Regions: ${findings.blackheads.regions.join(', ') || 'none'}
Output example: "A few blackheads are noticeable on your nose, affecting T-zone appearance."

D. Redness
Score: ${findings.scores.redness}/10
Intensity: ${findings.redness.intensity}
Regions: ${findings.redness.regions.join(', ') || 'none'}
Output example: "Skin shows minor redness on your cheeks, causing slight tone unevenness."

E. Spots
Score: ${findings.scores.spots}/10
Presence: ${findings.spots.presence}
Regions: ${findings.spots.regions.join(', ') || 'none'}
Output example: "No significant dark spots detected to impact pigmentation."

F. Dullness
Score: ${findings.scores.dullness}/10
Level: ${findings.dullness.level}
Regions: ${findings.dullness.regions.join(', ') || 'none'}
Output example: "Your skin shows uneven tone, reducing natural glow."

G. Wrinkles
Score: ${findings.scores.wrinkles}/10
Severity: ${findings.wrinkles.severity}
Regions: ${findings.wrinkles.regions.join(', ') || 'none'}
Output example: "No major fine lines are apparent to impact barrier smoothness."

OVERALL SKIN SCORE: ${overallSkinScore}/10
Purpose: Represent the overall visible skin condition in a single score.
Generate ONE short user-facing summary sentence (max 20 words) in second person, indicating what main area influenced the score.
Example: "Your overall skin condition appears balanced, with a few texture areas influencing the score."

FINAL RULES:
- Second-person language only ("your")
- One sentence per category
- Max 20 words per sentence
- Explain how/why it impacts the score or skin quality
- Calm, premium, user-friendly language
- Observational tone (no judgment)
- No medical claims
- No advice
- No technical explanations

Generate user-facing outputs for all 7 categories + overall summary.`;

  // Dev-only opt-in mock (gated by both DEV build AND opt-in env flag).
  // Production builds must call the real backend; throwing below makes that obvious.
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_RECOMMENDS === 'true') {
    console.warn('[SKIN DETECTION] DEV BYPASS active — returning mock descriptions. Will NOT run in production.');
    return {
      acne: "Occasional breakouts and blemishes are present around the jawline, slightly reducing overall clarity.",
      pores: "Pores are more visible in your T-zone, reducing skin quality smoothness.",
      blackheads: "A few blackheads are noticeable on the nose, affecting T-zone appearance.",
      redness: "Skin shows minor redness on the cheeks, causing slight tone unevenness.",
      spots: "No significant dark spots detected to impact pigmentation.",
      dullness: "Your skin shows uneven tone, reducing natural glow.",
      wrinkles: "No major fine lines are apparent to impact barrier smoothness.",
      overallSkinSummary: "Your skin exhibits excellent overall health and balance.",
      overallSkinScore,
    };
  }

  try {
    const result = await callAnalyzeProxy<Omit<Awaited<ReturnType<typeof generateDescriptions>>, 'overallSkinScore'>>(prompt, schema);
    return { ...result, overallSkinScore };
  } catch (err) {
    debugLog.error('SKIN', 'Gemini description call failed — using CV fallback', err);
    return buildDescriptionFallback(findings, overallSkinScore);
  }
}

function buildDescriptionFallback(
  findings: Parameters<typeof generateDescriptions>[0],
  overallSkinScore: number
): {
  acne: string;
  pores: string;
  blackheads: string;
  redness: string;
  spots: string;
  dullness: string;
  wrinkles: string;
  overallSkinScore: number;
  overallSkinSummary: string;
} {
  const region = (regions: string[]) => (regions.length ? regions.join(', ') : 'your face');
  return {
    acne: findings.acne.count > 0
      ? `Breakouts are visible around ${region(findings.acne.regions)}, slightly reducing clarity.`
      : 'No significant breakouts detected to impact your skin clarity.',
    pores: findings.pores.visibility !== 'minimal'
      ? `Pores are more visible in ${region(findings.pores.regions)}, reducing texture smoothness.`
      : 'Pores appear refined with minimal impact on texture smoothness.',
    blackheads: findings.blackheads.density !== 'low'
      ? `Blackheads are noticeable on ${region(findings.blackheads.regions)}, affecting T-zone appearance.`
      : 'No significant blackheads detected in your T-zone.',
    redness: findings.redness.intensity !== 'low'
      ? `Minor redness appears on ${region(findings.redness.regions)}, causing slight tone unevenness.`
      : 'Your skin tone appears even with minimal redness.',
    spots: findings.spots.presence !== 'none'
      ? `Dark spots are present on ${region(findings.spots.regions)}, affecting pigmentation.`
      : 'No significant dark spots detected to impact pigmentation.',
    dullness: findings.dullness.level !== 'bright'
      ? 'Your skin shows uneven tone, reducing natural glow.'
      : 'Your skin maintains a healthy, natural glow.',
    wrinkles: findings.wrinkles.severity !== 'none'
      ? `Fine lines are visible on ${region(findings.wrinkles.regions)}, affecting smoothness.`
      : 'No major fine lines are apparent to impact barrier smoothness.',
    overallSkinSummary: overallSkinScore >= 7
      ? 'Your overall skin condition appears balanced with strong fundamentals.'
      : 'Your overall skin condition shows a few areas influencing the score.',
    overallSkinScore,
  };
}

/**
 * Gemini: Generate skin profile and daily summary
 */
async function generateSkinProfile(
  faceState: ComprehensiveFaceState,
  detection: SkinDetectionResult
): Promise<{
  skinType: { value: string; description: string };
  moisture: { value: string; description: string };
  oiliness: { value: string; description: string };
  skinTone: { value: string; description: string };
  elasticity: { value: string; description: string };
  dailySummary: string;
}> {
  // Get actual oil scores from all regions (including cheeks)
  const oilScores = {
    forehead: faceState.spectral.regionOilScore.forehead || 0,
    nose: faceState.spectral.regionOilScore.nose || 0,
    chin: faceState.spectral.regionOilScore.chin || 0,
    leftCheek: faceState.spectral.regionOilScore.leftCheek || 0,
    rightCheek: faceState.spectral.regionOilScore.rightCheek || 0,
  };

  const avgCheeks = (oilScores.leftCheek + oilScores.rightCheek) / 2;
  const avgTZone = (oilScores.forehead + oilScores.nose) / 2;

  // Extract key FACE_STATE metrics for Gemini
  const textureVariance = Object.entries(faceState.texture.regionVariance).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');
  const poreVisibility = Object.entries(faceState.texture.poreVisibilityScore).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');
  const toneEvenness = Object.entries(faceState.tone.regionEvenness).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');
  const redness = Object.entries(faceState.tone.regionRedness).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');
  const regionRGB = Object.entries(faceState.tone.regionRGB).map(([region, rgb]) => `${region}: [${rgb[0].toFixed(0)}, ${rgb[1].toFixed(0)}, ${rgb[2].toFixed(0)}]`).join(', ');
  const shadowDensity = Object.entries(faceState.spectral.shadowDensity).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');
  const contrastMap = Object.entries(faceState.spectral.contrastMap).map(([region, value]) => `${region}: ${value.toFixed(3)}`).join(', ');

  const schema = {
    type: Type.OBJECT,
    properties: {
      skinType: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "ONE WORD only: 'Dry', 'Oily', 'Combination', or 'Normal'" },
          description: { type: Type.STRING, description: "Short explanation (max 8 words)" }
        },
        required: ["value", "description"]
      },
      moisture: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "ONE WORD only: 'Low', 'Balanced', or 'High'" },
          description: { type: Type.STRING, description: "Short explanation (max 8 words)" }
        },
        required: ["value", "description"]
      },
      oiliness: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "ONE WORD only: 'Minimal', 'Moderate', or 'High'" },
          description: { type: Type.STRING, description: "Short explanation (max 8 words)" }
        },
        required: ["value", "description"]
      },
      skinTone: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "ONE WORD only: 'Warm', 'Cool', or 'Neutral'" },
          description: { type: Type.STRING, description: "Short explanation (max 8 words)" }
        },
        required: ["value", "description"]
      },
      elasticity: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "ONE WORD only: 'Good', 'Moderate', or 'Low'" },
          description: { type: Type.STRING, description: "Short explanation (max 8 words)" }
        },
        required: ["value", "description"]
      },
      dailySummary: {
        type: Type.STRING,
        description: "Daily summary: one concise paragraph (max 40 words, English)"
      },
    },
    required: ["skinType", "moisture", "oiliness", "skinTone", "elasticity", "dailySummary"],
  };

  const prompt = `You are an expert dermatologist analyzing comprehensive facial skin data.Create a detailed skin profile based on all the provided metrics and measurements.

=== SKIN DETECTION RESULTS ===
  Acne: ${detection.acne.severity} severity, ${detection.acne.count} count
    - Affected regions: ${detection.acne.regions.join(', ') || 'none'}

Pores: ${detection.pores.visibility} visibility
  - Affected regions: ${detection.pores.regions.join(', ') || 'none'}

Blackheads: ${detection.blackheads.density} density
  - Affected regions: ${detection.blackheads.regions.join(', ') || 'none'}

Redness: ${detection.redness.intensity} intensity
  - Affected regions: ${detection.redness.regions.join(', ') || 'none'}

Spots: ${detection.spots.presence} presence
  - Affected regions: ${detection.spots.regions.join(', ') || 'none'}

Dullness: ${detection.dullness.level} level
  - Affected regions: ${detection.dullness.regions.join(', ') || 'none'}

Wrinkles: ${detection.wrinkles.severity} severity
  - Affected regions: ${detection.wrinkles.regions.join(', ') || 'none'}

=== REGIONAL OIL SCORES(0 - 1 scale, higher = more oily) ===
  Forehead: ${oilScores.forehead.toFixed(3)}
Nose: ${oilScores.nose.toFixed(3)}
Chin: ${oilScores.chin.toFixed(3)}
Left Cheek: ${oilScores.leftCheek.toFixed(3)}
Right Cheek: ${oilScores.rightCheek.toFixed(3)}
T - Zone Average(forehead + nose): ${avgTZone.toFixed(3)}
Cheeks Average(left + right): ${avgCheeks.toFixed(3)}

=== TEXTURE METRICS(per region) ===
  Texture Variance(higher = rougher): ${textureVariance}
Pore Visibility(0 - 1, higher = more visible): ${poreVisibility}
Micro Contrast(fine detail level): ${Object.entries(faceState.texture.microContrast).map(([r, v]) => `${r}: ${v.toFixed(3)}`).join(', ')}

=== TONE / COLOR METRICS(per region) ===
  Skin Tone Classification: ${faceState.tone.skinTone} undertone
Region RGB Values: ${regionRGB}
Tone Evenness(lower = more even): ${toneEvenness}
Redness Level(0 - 1): ${redness}

=== SPECTRAL / REFLECTANCE METRICS ===
  Shadow Density(0 - 1): ${shadowDensity}
Contrast Map(0 - 1): ${contrastMap}
Channel Energy - Red: ${faceState.spectral.redChannelEnergy.toFixed(3)}, Green: ${faceState.spectral.greenChannelEnergy.toFixed(3)}, Blue: ${faceState.spectral.blueChannelEnergy.toFixed(3)}

=== GEOMETRY METRICS(facial structure indicators) ===
  Jawline Sharpness: ${faceState.geometry.jawlineSharpness.toFixed(3)} (0 - 1, higher = sharper)
Jaw Angle: ${faceState.geometry.jawAngleDeg.toFixed(1)}°
Chin Projection: ${faceState.geometry.chinProjection.toFixed(3)}
Facial Symmetry(left / right ratio): ${faceState.geometry.leftRightRatio.toFixed(3)} (1.0 = perfect)
Eye Height Difference: ${faceState.geometry.eyeHeightDiff.toFixed(2)} pixels
Nostril Symmetry: ${faceState.geometry.nostrilSymmetry.toFixed(3)} (0 - 1)
Lip Center Deviation: ${faceState.geometry.lipCenterDeviation.toFixed(2)} pixels
Facial Proportions - Upper Third: ${faceState.geometry.upperThirdRatio.toFixed(3)}, Middle Third: ${faceState.geometry.middleThirdRatio.toFixed(3)}, Lower Third: ${faceState.geometry.lowerThirdRatio.toFixed(3)}

=== QUALITY INDICATORS ===
  Overall Confidence: ${faceState.quality.overallConfidence.toFixed(3)} (0 - 1)
Lighting Score: ${faceState.quality.lightingScore.toFixed(3)} (0 - 1, 0.4 - 0.7 ideal)
Motion Blur: ${faceState.quality.motionBlur.toFixed(3)} (0 - 1, lower = better)

  === YOUR ANALYSIS TASKS ===

    For EACH of the 5 profile fields below, provide:
- "value": ONE WORD only(from the allowed options)
  - "description": Short explanation(max 8 words)

1. SKIN TYPE:
- value: ONE WORD only: "Dry", "Oily", "Combination", or "Normal"
  - description: Max 8 words explaining why
    - Example: { value: "Dry", description: "Requires consistent hydration layers." }

2. MOISTURE:
- value: ONE WORD only: "Low", "Balanced", or "High"
  - description: Max 8 words explaining why
    - Example: { value: "Low", description: "Levels appear low across facial regions." }

3. OILINESS:
- value: ONE WORD only: "Minimal", "Moderate", or "High"
  - description: Max 8 words explaining why
    - Example: { value: "Minimal", description: "Oil distribution is extremely low." }

4. SKIN TONE:
- value: ONE WORD only: "Warm", "Cool", or "Neutral"
  - description: Max 8 words explaining why
    - Example: { value: "Warm", description: "Medium depth with warm undertones." }

5. ELASTICITY:
- value: ONE WORD only: "Good", "Moderate", or "Low"
  - description: Max 8 words explaining why
    - Example: { value: "Good", description: "Skin shows firm and resilient texture." }

6. DAILY SUMMARY(string only, not object):
   Write a brief paragraph(max 40 words) summarizing overall skin condition.Style: Professional, encouraging, balanced.

CRITICAL RULES:
- Values must be ONE WORD only
  - Descriptions must be MAX 8 WORDS
    - All outputs in English

All outputs must be in English.`;

  if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_RECOMMENDS === 'true') {
    console.warn('[SKIN DETECTION] DEV BYPASS active — returning mock profile. Will NOT run in production.');
    return {
      skinType: { value: "Normal", description: "Balanced hydration and sebum." },
      moisture: { value: "Balanced", description: "Good water retention levels." },
      oiliness: { value: "Minimal", description: "Low sebum across regions." },
      skinTone: { value: "Neutral", description: "Balanced undertones." },
      elasticity: { value: "Good", description: "High resilience and bounce." },
      dailySummary: "Your skin is in excellent shape today. Maintain your current routine."
    };
  }

  try {
    return await callAnalyzeProxy(prompt, schema);
  } catch (err) {
    debugLog.error('SKIN', 'Gemini profile call failed — using fallback', err);
    return {
      skinType: { value: "Normal", description: "Balanced hydration and sebum." },
      moisture: { value: "Balanced", description: "Good water retention levels." },
      oiliness: { value: "Minimal", description: "Low sebum across regions." },
      skinTone: { value: "Neutral", description: "Balanced undertones." },
      elasticity: { value: "Good", description: "High resilience and bounce." },
      dailySummary: "Your skin scan is complete. Review your scores and routine suggestions.",
    };
  }
}
/**
 * Main detection function (Hybrid CV + Gemini)
 * 
 * CONSTITUTION RULE #10: Gemini's Role
 * ❌ Does NOT measure
 * ❌ Does NOT compute
 * ❌ Does NOT stabilize
 * ✅ Interprets features
 * ✅ Generates descriptions
 */
export async function detectSkinIssues(
  faceState: ComprehensiveFaceState
): Promise<SkinDetectionResult> {


  // CONSTITUTION VALIDATION: Ensure we're consuming FACE_STATE only
  if (!faceState.scanId) {
    throw new Error("[CONSTITUTION VIOLATION] Invalid FACE_STATE - skin detection rejected");
  }

  debugLog.info('SKIN', 'Running Computer Vision Algorithms...');

  // Step 1: CV Detection (algorithmic)
  const acne = detectAcne(faceState);
  const pores = detectPores(faceState);
  const blackheads = detectBlackheads(faceState);
  const redness = detectRedness(faceState);
  const spots = detectSpots(faceState);
  const dullness = detectDullness(faceState);
  const wrinkles = detectWrinkles(faceState);


  // Step 2: Severity-based score estimates for Gemini description context
  // Full scoring happens in scoreSkin() (Stage 3)
  const scores = {
    acne: acne.severity === 'severe' ? 3 : acne.severity === 'moderate' ? 6 : 8.5,
    pores: pores.visibility === 'prominent' ? 3.5 : pores.visibility === 'moderate' ? 6.5 : 9,
    blackheads: blackheads.density === 'high' ? 3.5 : blackheads.density === 'medium' ? 6 : 8.5,
    redness: redness.intensity === 'high' ? 3 : redness.intensity === 'medium' ? 6 : 9,
    spots: spots.presence === 'significant' ? 3 : spots.presence === 'moderate' ? 5.5 : spots.presence === 'minimal' ? 7.5 : 9.5,
    dullness: dullness.level === 'dull' ? 3.5 : dullness.level === 'slightly_dull' ? 6 : 9,
    wrinkles: wrinkles.severity === 'deep' ? 3 : wrinkles.severity === 'moderate' ? 5 : wrinkles.severity === 'fine_lines' ? 7.5 : 9.5,
  };

  // Step 3: Gemini Descriptions (no image, just findings + scores)
  debugLog.info('SKIN', 'Calculating Scores & Preparing AI Request');



  const descriptions = await generateDescriptions({
    acne,
    pores,
    blackheads,
    redness,
    spots,
    dullness,
    wrinkles,
    scores,
  });

  debugLog.success('SKIN', 'Gemini descriptions received');

  // Build detection result first
  const detectionResult: SkinDetectionResult = {
    // Core 7 categories
    acne: {
      ...acne,
      description: descriptions.acne,
    },
    pores: {
      ...pores,
      description: descriptions.pores,
    },
    blackheads: {
      ...blackheads,
      description: descriptions.blackheads,
    },
    redness: {
      ...redness,
      description: descriptions.redness,
    },
    spots: {
      ...spots,
      description: descriptions.spots,
    },
    dullness: {
      ...dullness,
      description: descriptions.dullness,
    },
    wrinkles: {
      ...wrinkles,
      description: descriptions.wrinkles,
    },
    // Overall scores
    overallSkinScore: descriptions.overallSkinScore,
    overallSkinSummary: descriptions.overallSkinSummary,
  };



  // Step 3: Gemini Skin Profile (YENİ)
  debugLog.info('SKIN', 'Generating detailed skin profile...');
  try {
    const profile = await generateSkinProfile(faceState, detectionResult);
    debugLog.success('SKIN', 'Skin profile generated');

    // Add profile to result
    return {
      ...detectionResult,
      profile,
    } as SkinDetectionResult;
  } catch (err: any) {
    console.error('[SKIN DETECTION] Profile generation failed, continuing without profile:', err);
    debugLog.warn('SKIN', 'Profile generation failed (non-fatal)', err.message);

    // Profile olmadan devam et
    return detectionResult;
  }
}

