export interface SkinMetric {
  label: string;
  sentence: string;
  reasoning?: string;
}

export interface SkinScores {
  overallScore: number;     // (Condition * 0.65) + (Quality * 0.35)
  overallSentence: string;

  condition: {
    score: number;          // Weighted average of acne, pores, etc.
    sentence: string;       // e.g., "Visible changes are mostly localized."
    metrics: SkinMetric[];  // Acne, Pores, Blackheads, etc. (Sentences only for UI)
  };

  quality: {
    score: number;          // Weighted average of texture, oil, etc.
    sentence: string;       // e.g., "Overall skin structure appears stable."
    metrics: SkinMetric[];  // Texture, Oil, Hydration, etc.
  };

  // Status scores (Legacy/Internal support if needed)
  statusScores: {
    acne: number;
    pores: number;
    blackheads: number;
    redness: number;
    spots: number;
    dullness: number;
    wrinkles: number;
    overallSkin: number;
  };
}

// ============================================================================
// 12 ADVANCED SKIN METRICS (NEW)
// ============================================================================

export interface SkinHealthMetrics {
  sebum: {
    sebumScore: number;
    region: string;
    hotspotCount: number;
    hotspotDensity: number;
  };
  poreCongestion: {
    congestionScore: number;
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
    bumpCount: number;
    bumpDensity: number;
  };
  inflammation: {
    loadScore: number;
    distribution: 'localized' | 'diffuse';
    isLocalized: boolean;
    stdDev: number;
  };
  activeAcne: {
    acneScore: number;
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
    papuleCount: number;
    pustuleCount: number;
    totalLesions: number;
  };
  marks: {
    pieScore: number;
    pihScore: number;
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
    pieCount: number;
    pihCount: number;
    totalMarks: number;
  };
  barrier: {
    barrierScore: number;
    status: 'healthy' | 'compromised' | 'damaged';
    isDamaged: boolean;
    diffuseRedness: boolean;
    textureNoise: boolean;
  };
  overallHealthScore: number;
}

export interface SkinQualityMetrics {
  smoothness: {
    smoothnessScore: number;
    quality: 'glass' | 'smooth' | 'normal' | 'rough';
    highFreqRatio: number;
    roughnessLevel: number;
  };
  poreVisibility: {
    visibilityScore: number;
    visibility: 'invisible' | 'minimal' | 'visible' | 'prominent';
    poreCount: number;
    poreDensity: number;
  };
  toneEvenness: {
    evennessScore: number;
    evenness: 'perfect' | 'even' | 'uneven' | 'patchy';
    aVariance: number;
    bVariance: number;
    combinedVariance: number;
  };
  radiance: {
    radianceScore: number;
    glow: 'radiant' | 'healthy' | 'dull' | 'flat';
    isHomogeneous: boolean;
    avgLuminance: number;
    luminanceVariance: number;
  };
  rednessUniformity: {
    uniformityScore: number;
    distribution: 'uniform' | 'scattered' | 'clustered' | 'spotted';
    isLocalized: boolean;
    clusteringScore: number;
    redPixelCount: number;
  };
  oilHydration: {
    balanceScore: number;
    status: 'balanced' | 'oily' | 'dehydrated' | 'oily-dehydrated';
    isOilyDehydrated: boolean;
    oilLevel: number;
    hydrationLevel: number;
    warning: string;
  };
  overallQualityScore: number;
}

export interface AdvancedSkinMetrics {
  forehead: {
    health: SkinHealthMetrics;
    quality: SkinQualityMetrics;
  };
  leftCheek: {
    health: SkinHealthMetrics;
    quality: SkinQualityMetrics;
  };
  rightCheek: {
    health: SkinHealthMetrics;
    quality: SkinQualityMetrics;
  };
  chin: {
    health: SkinHealthMetrics;
    quality: SkinQualityMetrics;
  };
  avgHealthScore: number;
  avgQualityScore: number;
}

export interface ImpactFactor {
  metric: string;
  state: string;
  val: string;
  rawScore: number;
  measurementLabel?: string; // e.g. "125°" or "0.15x"
  reasoning: string;
}

export interface ArchetypeDebug {
  traits: Record<string, number>;
  candidates: {
    id: string;
    displayName: string;
    score: number;
    passedGate: boolean;
    gateTrait: string;
    gateLevel: string; // "ELITE", "STRONG", etc.
    gateValue: number;
    gateThreshold: number;
  }[];
}

export interface FaceScores {
  statusScores: {
    faceLengthWidthBalance: number;      // 0-10
    verticalFacialDistribution: number;  // 0-10
    eyeAxisTiltQuality: number;          // 0-10
    browRidgeProjection: number;         // 0-10
    jawCheekboneRatio: number;           // 0-10
    jawNeckSeparation: number;           // 0-10
    chinPhiltrumProportion: number;      // 0-10
    overallStructure: number;            // 0-10
    overallSideProfile: number;          // 0-10 (Weighted Calculation)
  };

  priority: {
    primaryFocus: string;
    potentialImpact: number;
  };

  archetype: string;
  archetypeDebug?: ArchetypeDebug;

  measurements: {
    fwhr: number;
    verticalRatio: number;
    eyeTilt: number;
    browProjection: number;
    cheekboneRatio: number;
    jawRatio: number;
    chinProjection: number;
    facialThirds: {
      upper: number;
      mid: number;
      lower: number;
      deviation: number;
      score: number;
      verdict: string;
      impacts?: ImpactFactor[];
      debugLog?: string;
      _scoring_formula?: string;
    };
    cheekbones: {
      ratio: number;
      score: number;
      verdict: string;
      impacts?: ImpactFactor[];
      debugLog?: string;
      _scoring_formula?: string;
    };
    jawSupport: {
      ratio: number;
      score: number;
      verdict: string;
      impacts?: ImpactFactor[];
      debugLog?: string;
    };
    jawAngularity: {
      gonialAngle: number;
      gonialScore: number;
      gonialVerdict: string;
      definitionScore: number;
      definitionVerdict: string;
      ramusScore: number;
      ramusVerdict: string;
      overallScore: number;
      impacts?: ImpactFactor[];
      debugLog?: string;
      _scoring_formula?: string;
    };
    harmony: {
      symmetry: number;
      symmetryVerdict: string;
      goldenRatioScore: number;
      goldenRatioVerdict: string;
      overallScore: number;
      impacts?: ImpactFactor[];
      debugLog?: string;
      _scoring_formula?: string;
    };
    browRidge: {
      ratio: number;
      score: number;
      verdict: string;
      impacts?: ImpactFactor[];
      debugLog?: string;
    };
    lipFullness: {
      ratio: number;
      score: number;
      verdict: string;
      impacts?: ImpactFactor[];
      debugLog?: string;
    };
    sideProfile: {
      nasofrontalAngle: { angle: number; score: number; verdict: string };
      rickettsELine: { upperDist: number; lowerDist: number; score: number; verdict: string };
      ramus: { ratio: number; score: number; verdict: string };
      overallScore: number;
      impacts?: ImpactFactor[];
      debugLog?: string;
      _scoring_formula?: string;
    };
  };
}

import type { SpectralDetectionResult } from '../analysis/types';

export interface SpectralScores extends Partial<SpectralDetectionResult> {
  statusScores: {
    pigmentUniformity: number;
    rednessSignal: number;
    oilReflectance: number;
    opticalClarity: number;
    textureFrequency: number;
    underEyeFreshness: number;
    chromaticStability: number;
    spectralNoise: number;

    overallSpectral: number; // Weighted average
  };

  signals: {
    stressSignature: 'low' | 'medium' | 'high';
    recoveryIndicator: number;
  };

  overallScore?: number;
}

export interface ScoringResults {
  scanId: string;
  skin: SkinScores;
  face: FaceScores;
  spectral: SpectralScores;
  advancedSkinMetrics?: AdvancedSkinMetrics; // NEW: 12 Advanced Metrics
  globalScore: number;  // weighted average of overalls
  potentialScore: number; // Glow Up Potential
}

