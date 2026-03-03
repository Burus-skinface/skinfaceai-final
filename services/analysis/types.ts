export interface SkinDetectionResult {
  // Core 7 categories
  acne: {
    regions: string[];
    severity: 'mild' | 'moderate' | 'severe';
    count: number;
    description: string;
  };

  pores: {
    regions: string[];
    visibility: 'minimal' | 'moderate' | 'prominent';
    description: string;
  };

  blackheads: {
    regions: string[];
    density: 'low' | 'medium' | 'high';
    description: string;
  };

  redness: {
    regions: string[];
    intensity: 'low' | 'medium' | 'high';
    description: string;
  };

  spots: {
    regions: string[];
    presence: 'none' | 'minimal' | 'moderate' | 'significant';
    description: string;
  };

  dullness: {
    regions: string[];
    level: 'bright' | 'slightly_dull' | 'dull';
    description: string;
  };

  wrinkles: {
    regions: string[];
    severity: 'none' | 'fine_lines' | 'moderate' | 'deep';
    description: string;
  };

  // Overall scores
  overallSkinScore: number;  // 0-10, average of 7 core categories
  overallSkinSummary: string; // ONE short sentence summarizing overall skin condition

  // Skin Profile (Gemini-generated)
  profile?: {
    skinType: { value: string; description: string };    // value: "Dry", description: "Requires consistent hydration layers."
    moisture: { value: string; description: string };     // value: "Low", description: "Levels appear low across facial regions."
    oiliness: { value: string; description: string };     // value: "Minimal", description: "Oil distribution is extremely low."
    skinTone: { value: string; description: string };     // value: "Warm", description: "Medium depth with warm undertones."
    elasticity: { value: string; description: string };   // value: "Good", description: "Skin shows firm and resilient texture."
    dailySummary: string;     // Daily summary text
  };
}

export interface FaceStructureDetectionResult {
  jawlineDefinition: {
    sharpness: 'soft' | 'moderate' | 'sharp';
    regions: string[];  // ["jaw_left", "jaw_right", "chin"]
    description: string;
  };

  facialProportions: {
    thirdsBalance: 'balanced' | 'unbalanced';
    fifthsBalance: 'balanced' | 'unbalanced';
    description: string;
  };

  cheekboneProminence: {
    level: 'low' | 'moderate' | 'high';
    description: string;
  };

  symmetry: {
    overall: 'symmetric' | 'slightly_asymmetric' | 'asymmetric';
    primaryDeviation: string;  // e.g. "left eye slightly higher"
    description: string;
  };

  profileBalance: {
    chinProjection: 'recessed' | 'balanced' | 'prominent';
    noseProfile: 'straight' | 'convex' | 'concave';
    description: string;
  };

  faceLengthWidthBalance: {
    balance: 'well_balanced' | 'slightly_long' | 'slightly_wide' | 'long' | 'wide';
    ratio: number;
    description: string;
  };

  browTilt: {
    tilt: 'positive' | 'neutral' | 'negative';
    value: number;
    description: string;
  };

  eyeTilt: {
    tilt: 'hunter_eye' | 'neutral' | 'negative';
    value: number;
    description: string;
  };

  jawCheekboneRatio: {
    ratio: number;
    description: string;
  };

  jawNeckDefinition: {
    definition: 'strong' | 'moderate' | 'weak';
    value: number;
    description: string;
  };

  chinBalance: {
    balance: 'well_balanced' | 'chin_dominant' | 'philtrum_dominant';
    ratio: number;
    description: string;
  };

  // Face Profile (Gemini-generated)
  profile?: {
    faceShape: string;        // e.g., "Oval", "Round", "Square", "Heart", "Diamond"
    eyeShape: string;         // e.g., "Almond", "Round", "Hooded", "Deep-set"
  };
}

export interface SpectralDetectionResult {
  // 1. Pigment Uniformity (Tone consistency)
  pigmentUniformity: {
    uniformityIndex: number; // 0-1 (1 = perfect uniformity)
    regions: string[];
    technique: string;
    description: string;
  };

  // 2. Redness Signal (Inflammation/Sensitivity)
  rednessSignal: {
    intensity: 'low' | 'medium' | 'high';
    distribution: 'localized' | 'scattered' | 'widespread';
    technique: string;
    description: string;
  };

  // 3. Oil Reflectance Pattern
  oilReflectance: {
    intensity: 'matte' | 'balanced' | 'oily';
    zone: 't-zone-only' | 't-zone-cheeks' | 'widespread';
    technique: string;
    description: string;
  };

  // 4. Optical Clarity (Skin 'clearness')
  opticalClarity: {
    score: number; // 0-10
    noiseLevel: 'clean' | 'moderate_texture' | 'high_noise';
    technique: string;
    description: string;
  };

  // 5. Texture Frequency Balance
  textureFrequency: {
    balance: 'refined' | 'balanced' | 'coarse';
    dominantFrequency: 'low' | 'mid' | 'high'; // 'high' means fine texture, 'low' means coarse
    technique: string;
    description: string;
  };

  // 6. Under-Eye Spectral Freshness
  underEyeFreshness: {
    vitalityScore: number; // 0-10
    concerns: string[]; // ['darkness', 'thinness', 'hollow']
    technique: string;
    description: string;
  };

  // 7. Chromatic Stability (Lighting reaction)
  chromaticStability: {
    stabilityScore: number; // 0-10
    variance: 'stable' | 'reactive';
    technique: string;
    description: string;
  };

  // 8. Spectral Noise (Signal quality)
  spectralNoise: {
    noiseLevel: number; // 0-1 (0 = clean signal)
    quality: 'studio_grade' | 'standard' | 'noisy';
    technique: string;
    description: string;
  };

  /**
   * Overall Spectral Score (0-100)
   * Weighted average of the 8 categories.
   */
  overallScore: number;

  /**
   * Heatmaps for UI visualization.
   * Base64 encoded PNGs or raw data arrays.
   * Dimensions should match the "retained" crop size.
   */
  maps: {
    diffuseMapBase64?: string;
    specularMapBase64?: string; // Oil/Shine map
    rednessMapBase64?: string;
    pigmentMapBase64?: string;
    sallownessMapBase64?: string; // New
    illuminationMapBase64?: string; // New
    textureMapBase64?: string;
  };
}

export interface AnalysisResults {
  scanId: string;
  timestamp: number;
  skin: SkinDetectionResult;
  face: FaceStructureDetectionResult;
  spectral: SpectralDetectionResult;
}

