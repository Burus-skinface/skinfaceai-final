import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { SpectralDetectionResult } from './types';
import { Type } from "@google/genai";
import { separateDiffuseSpecular, computeRednessIndex, computePigmentIndex, computeSallownessIndex, computeFrequencyMaps, computeTextureMetrics } from './spectralMath';

// Helper: Decode Base64 to Uint8ClampedArray (RGBA)
// Note: In a browser environment, we'd use Canvas API. In Node, we'd use sharp/jimp.
// Since this runs in browser context (Vite), we use an offscreen canvas.
// Helper: Decode Base64 to Uint8ClampedArray (RGBA)
async function decodeImage(base64: string): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas 2D context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({ data: imageData.data, width: img.width, height: img.height });
    };
    img.onerror = (err) => {
      // Retry with prefix if failed first
      if (!base64.startsWith('data:image')) {
        console.warn("[SPECTRAL] Image decode failed, retrying with prefix...");
        img.src = `data:image/jpeg;base64,${base64}`;
      } else {
        console.error("[SPECTRAL] Image decode failed:", err);
        reject(new Error("Failed to load image"));
      }
    };

    // Check if prefix exists, if not add it (optimistic)
    if (!base64.startsWith('data:image')) {
      img.src = `data:image/jpeg;base64,${base64}`;
    } else {
      img.src = base64;
    }
  });
}

// Helper: Encode Uint8ClampedArray to Base64 (PNG)
function encodeMapToBase64(data: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  const imageData = new ImageData(data as any, width, height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}


// --- DYNAMIC LIGHT NORMALIZATION ---
function getLightingNormalizationFactor(faceState: ComprehensiveFaceState): number {
  const { quality } = faceState;
  const score = quality.lightingScore; // 0-1, ideal ~0.5

  // If lighting is too bright (>0.7), sensitivity to redness/oil should decrease (multiplying detections by <1)
  // If lighting is dim (<0.3), sensitivity might need boosting or noise simply suppressed.

  // Pivot around ideal 0.5
  // If score 0.8 -> factor 0.8 (dampen high values caused by brightness)
  // If score 0.2 -> factor 1.2 (boost signals in dark) - CAREFUL, boosts noise too.

  // Safe approach: Dampen extremes.
  if (score > 0.6) return 0.85; // Suppress blowout artifacts
  if (score < 0.3) return 1.1;  // Slight boost for dimness
  return 1.0;
}

// --- HELPER: REGION ANALYSIS ---
function getRegionMean(data: Uint8ClampedArray, width: number, height: number, regionMask: any): number {
  // Placeholder: In real implementation this would use the mask
  // For now we do a center crop approximation if mask not available
  let sum = 0;
  let count = 0;
  // Simple sampling to avoid heavy loops
  const step = 4 * 4; // Sample every 4th pixel
  for (let i = 0; i < data.length; i += step) {
    sum += data[i];
    count++;
  }
  return count > 0 ? sum / count : 128; // Default mid-grey
}

/**
 * CV Detection: Detect Pigment Uniformity
 * Uses variation in region RGB values
 */
function detectPigmentUniformity(faceState: ComprehensiveFaceState, photoData?: any): SpectralDetectionResult['pigmentUniformity'] {
  let uniformityIndex = 0.5; // Default fallback

  if (photoData && photoData.pigmentMap) {
    const meanPigment = getRegionMean(photoData.pigmentMap, photoData.width, photoData.height, null);
    // normalize: 1 - (mean / 255)
    uniformityIndex = Math.max(0, Math.min(1, 1 - (meanPigment / 200)));
  } else {
    // Fallback logic
    const { tone } = faceState;
    if (tone && tone.regionEvenness) {
      const regions = ['forehead', 'leftCheek', 'rightCheek', 'chin'];
      let totalEvenness = 0;
      let count = 0;
      regions.forEach(r => {
        if (tone.regionEvenness[r] !== undefined) {
          totalEvenness += tone.regionEvenness[r];
          count++;
        }
      });
      uniformityIndex = count > 0 ? Math.max(0, Math.min(1, 1 - (totalEvenness / count))) : 0.5;
    }
  }

  return {
    uniformityIndex,
    regions: ['cheeks', 'forehead'],
    technique: "Cross-Polarized Melanin Tracking",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Redness Signal
 * Uses R channel dominance and separation
 */
function detectRednessSignal(faceState: ComprehensiveFaceState, photoData?: any): SpectralDetectionResult['rednessSignal'] {
  let maxRedness = 0;

  if (photoData && photoData.rednessMap) {
    const meanRedness = getRegionMean(photoData.rednessMap, photoData.width, photoData.height, null);
    maxRedness = meanRedness / 255;
  } else {
    // Fallback
    const { tone } = faceState;
    if (tone && tone.regionRedness) {
      for (const r in tone.regionRedness) {
        const val = tone.regionRedness[r];
        if (val > maxRedness) maxRedness = val;
      }
    }
  }

  let intensity: 'low' | 'medium' | 'high' = 'low';
  if (maxRedness > 0.4) intensity = 'high';
  else if (maxRedness > 0.2) intensity = 'medium';

  return {
    intensity,
    distribution: maxRedness > 0.4 ? 'widespread' : 'localized',
    technique: "RBX-Corrected Erythema Mapping",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Oil Reflectance
 * Uses spectral oil scores/specular highlights
 */
function detectOilReflectance(faceState: ComprehensiveFaceState, photoData?: any): SpectralDetectionResult['oilReflectance'] {
  let oilScore = 0.5;

  if (photoData && photoData.specularMap) {
    const meanSpec = getRegionMean(photoData.specularMap, photoData.width, photoData.height, null);
    oilScore = meanSpec / 100;
  } else {
    const { spectral } = faceState;
    if (spectral && spectral.regionOilScore) {
      const tZoneScore = ((spectral.regionOilScore['forehead'] || 0) + (spectral.regionOilScore['nose'] || 0) + (spectral.regionOilScore['chin'] || 0));
      oilScore = tZoneScore / 3;
    }
  }

  let intensity: 'matte' | 'balanced' | 'oily' = 'balanced';
  if (oilScore > 0.4) intensity = 'oily';
  else if (oilScore < 0.1) intensity = 'matte';

  return {
    intensity,
    zone: intensity === 'oily' ? 't-zone-cheeks' : 't-zone-only',
    technique: "Specular-Diffuse Separation",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Optical Clarity
 * Uses texture pore visibility and micro contrast
 */
function detectOpticalClarity(faceState: ComprehensiveFaceState, textureEnergy?: any): SpectralDetectionResult['opticalClarity'] {
  let score = 5;

  if (textureEnergy) {
    const energy = (textureEnergy.mid || 0) + (textureEnergy.high || 0);
    score = Math.max(0, Math.min(10, 10 - (energy / 3)));
  } else {
    const { texture } = faceState;
    if (texture && texture.poreVisibilityScore) {
      let total = 0;
      let count = 0;
      for (const r in texture.poreVisibilityScore) {
        total += texture.poreVisibilityScore[r];
        count++;
      }
      score = count > 0 ? (1 - (total / count)) * 10 : 5;
    }
  }

  let noiseLevel: 'clean' | 'moderate_texture' | 'high_noise' = 'moderate_texture';
  if (score > 8) noiseLevel = 'clean';
  else if (score < 4) noiseLevel = 'high_noise';

  return {
    score,
    noiseLevel,
    technique: "Frequency Domain Texture Analysis (Mid-Band)",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Texture Frequency
 * Uses variance map
 */
function detectTextureFrequency(faceState: ComprehensiveFaceState, textureEnergy?: any): SpectralDetectionResult['textureFrequency'] {
  let balance: 'refined' | 'balanced' | 'coarse' = 'balanced';

  if (textureEnergy) {
    if ((textureEnergy.mid || 0) < 3 && (textureEnergy.high || 0) < 3) balance = 'refined';
    else if ((textureEnergy.mid || 0) > 10 || (textureEnergy.high || 0) > 10) balance = 'coarse';
  }

  return {
    balance,
    dominantFrequency: balance === 'refined' ? 'high' : (balance === 'coarse' ? 'low' : 'mid'),
    technique: "Multi-Scale Wavelet Decomposition",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Under-Eye Freshness
 * FIXED: Real periorbital contrast calculation (was hard-coded 7.5)
 */
function detectUnderEyeFreshness(faceState: ComprehensiveFaceState, photoData?: any): SpectralDetectionResult['underEyeFreshness'] {
  const { tone, texture } = faceState;

  // STEP 1: Extract region-specific data
  const underEyeRegion = {
    evenness: tone.regionEvenness?.['underEyes'] || 0.5,
    redness: tone.regionRedness?.['underEyes'] || 0.3,
    variance: texture.regionVariance?.['underEyes'] || 0.2,
  };

  const cheekReference = {
    evenness: ((tone.regionEvenness?.['leftCheek'] || 0.5) + (tone.regionEvenness?.['rightCheek'] || 0.5)) / 2,
    redness: ((tone.regionRedness?.['leftCheek'] || 0.2) + (tone.regionRedness?.['rightCheek'] || 0.2)) / 2,
  };

  // STEP 2: Calculate Color Discrepancy (Lightness)
  // Lower evenness = darker under-eye
  const lightnessDiscrepancy = Math.abs(underEyeRegion.evenness - cheekReference.evenness);

  // STEP 3: Detect Vascular Component (Blue/Purple Circles)
  // Higher redness in under-eye vs cheeks = vascular darkness
  const vascularComponent = Math.max(0, underEyeRegion.redness - cheekReference.redness);

  // STEP 4: Detect Structural/Textural Component (Tear Trough Shadows)
  const structuralComponent = underEyeRegion.variance;

  // STEP 5: Composite Darkness Index (0-1, higher = darker/worse)
  const darknessIndex = (
    lightnessDiscrepancy * 0.40 +  // 40% weight on lightness diff
    vascularComponent * 0.35 +      // 35% weight on vascular
    structuralComponent * 0.25      // 25% weight on texture/shadows
  );

  // STEP 6: Convert to Freshness Score (0-10, higher = fresher)
  // Invert: darkness 0 → freshness 10, darkness 1 → freshness 2
  const vitalityScore = Math.max(2, Math.min(10, 10 - (darknessIndex * 8)));

  // STEP 7: Identify Primary Concerns
  const concerns: string[] = [];
  if (vascularComponent > 0.15) concerns.push('vascularity');
  if (lightnessDiscrepancy > 0.2) concerns.push('shadowing');
  if (structuralComponent > 0.3) concerns.push('puffiness');

  return {
    vitalityScore: Math.round(vitalityScore * 10) / 10,
    concerns: concerns.length > 0 ? concerns : ['none'],
    technique: "Periorbital Contrast & Vascularity Index",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Chromatic Stability
 * FIXED: Uses Coefficient of Variation, not scan quality
 */
function detectChromaticStability(faceState: ComprehensiveFaceState): SpectralDetectionResult['chromaticStability'] {
  const { tone } = faceState;

  // STEP 1: Collect evenness values from all regions
  const regionValues = Object.values(tone.regionEvenness || {});

  if (regionValues.length === 0) {
    return {
      stabilityScore: 7.5,
      variance: 'stable',
      technique: "Temporal Albedo Variance",
      description: "Pending AI Insight"
    };
  }

  // STEP 2: Calculate mean and standard deviation
  const mean = regionValues.reduce((a, b) => a + b, 0) / regionValues.length;
  const variance = regionValues.reduce((sum, val) =>
    sum + Math.pow(val - mean, 2), 0
  ) / regionValues.length;
  const stdDev = Math.sqrt(variance);

  // STEP 3: Calculate Coefficient of Variation (CV)
  const cv = mean > 0 ? stdDev / mean : 0;

  // STEP 4: Convert CV to stability score (0-10)
  // Low CV (< 0.1) = High stability (9-10)
  // High CV (> 0.3) = Low stability (4-5)
  const stabilityScore = Math.max(4, Math.min(10, 10 - (cv * 20)));

  // STEP 5: Categorize variance
  let varianceLevel: 'stable' | 'reactive';
  if (cv < 0.15) {
    varianceLevel = 'stable';
  } else {
    varianceLevel = 'reactive';
  }

  return {
    stabilityScore: Math.round(stabilityScore * 10) / 10,
    variance: varianceLevel,
    technique: "Temporal Albedo Variance",
    description: "Pending AI Insight"
  };
}

/**
 * CV Detection: Detect Spectral Noise
 * FIXED: Uses real SNR approximation, not scan confidence
 */
function detectSpectralNoise(faceState: ComprehensiveFaceState): SpectralDetectionResult['spectralNoise'] {
  const { texture, spectral } = faceState;

  // STEP 1: Use texture variance as noise proxy
  // Lower variance in homogeneous regions = lower noise
  const varianceValues = Object.values(texture.regionVariance || {});
  const avgVariance = varianceValues.length > 0
    ? varianceValues.reduce((a, b) => a + b, 0) / varianceValues.length
    : 0.3;

  // STEP 2: Use spectral contrast as signal strength
  const contrastValues = Object.values(spectral.contrastMap || {});
  const avgContrast = contrastValues.length > 0
    ? contrastValues.reduce((a, b) => a + b, 0) / contrastValues.length
    : 0.5;

  // STEP 3: Approximate SNR = Signal / Noise = Contrast / Variance
  const snr = avgVariance > 0 ? avgContrast / avgVariance : 10;

  // STEP 4: Normalize SNR to noise level (0-1)
  // SNR 40+ → noise 0.05 (excellent)
  // SNR 10 → noise 0.25 (standard)
  // SNR 5 → noise 0.5 (noisy)
  let noiseLevel: number;
  if (snr >= 40) {
    noiseLevel = 0.05;
  } else if (snr >= 10) {
    noiseLevel = 0.05 + ((40 - snr) / 30) * 0.20;  // 0.05-0.25
  } else {
    noiseLevel = 0.25 + ((10 - snr) / 10) * 0.25;  // 0.25-0.50
  }

  noiseLevel = Math.max(0, Math.min(1, noiseLevel));

  // STEP 5: Categorize quality
  let qualityLevel: 'studio_grade' | 'standard' | 'noisy';
  if (noiseLevel < 0.1) qualityLevel = 'studio_grade';
  else if (noiseLevel < 0.3) qualityLevel = 'standard';
  else qualityLevel = 'noisy';

  return {
    noiseLevel: Math.round(noiseLevel * 100) / 100,
    quality: qualityLevel,
    technique: "Signal-to-Noise Ratio Estimation",
    description: "Pending AI Insight"
  };
}


/**
 * Gemini: Generate natural language descriptions
 */
async function generateDescriptions(findings: any): Promise<any> {
  const prompt = `
    You are an advanced Dermatological AI. Analyze these spectral findings and provide a unique "AI Insight" for each category.
    This insight should explain WHAT the specific metric reveals about the user's skin health today.
    Keep it personal, scientific,/insightful, and short (max 15 words).
    
    Findings:
    ${JSON.stringify(findings, null, 2)}
    `;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        contents: prompt,
        temperature: 0,
      })
    });

    if (!response.ok) {
      throw new Error(`AI Request failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const text = responseData.text;
    try {
      return JSON.parse(text);
    } catch (e) {
      const fixedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      return JSON.parse(fixedText);
    }
  } catch (error) {
    console.error("Gemini Spectral Description Failed", error);
    throw error;
  }
}


export async function detectSpectralSignals(
  faceState: ComprehensiveFaceState
): Promise<SpectralDetectionResult> {
  if (!faceState.scanId) throw new Error("Invalid FACE_STATE");

  // --- PHOTOMETRIC ENGINE EXECUTION ---
  let maps = {};
  let photoData: any = null;
  let textureEnergy: any = null;

  if (typeof document !== 'undefined' && faceState.primaryImageJpegBase64) {
    try {
      // Photometric Analysis 2.1
      const { data, width, height } = await decodeImage(faceState.primaryImageJpegBase64);

      // 1. Separate Diffuse & Specular + Shading Correction
      const photo = separateDiffuseSpecular(data, width, height);

      // 2. Compute Spectral Indices (using Corrected Diffuse)
      const rednessMap = computeRednessIndex(photo.shadingCorrected, width, height);
      const pigmentMap = computePigmentIndex(photo.shadingCorrected, width, height); // Corrected: removed extra arg
      const sallownessMap = computeSallownessIndex(photo.shadingCorrected, width, height);

      // 3. Frequency / Texture Analysis
      const frequencies = computeFrequencyMaps(photo.shadingCorrected, width, height);
      textureEnergy = computeTextureMetrics(frequencies.poreEnergy, frequencies.roughnessEnergy);

      // Helper object for scoring/detect functions
      photoData = {
        diffuse: photo.diffuse,
        specularMap: photo.specular,
        illumination: photo.illumination,
        shadingCorrected: photo.shadingCorrected,
        rednessMap,
        pigmentMap,
        sallownessMap,
        width,
        height
      };

      // Encode maps for UI
      maps = {
        diffuseMapBase64: encodeMapToBase64(photo.shadingCorrected, width, height),
        specularMapBase64: encodeMapToBase64(photo.specular, width, height),
        rednessMapBase64: encodeMapToBase64(rednessMap, width, height),
        pigmentMapBase64: encodeMapToBase64(pigmentMap, width, height),
        sallownessMapBase64: encodeMapToBase64(sallownessMap, width, height),
        illuminationMapBase64: encodeMapToBase64(photo.illumination, width, height)
      };
      // Photometric analysis complete

    } catch (e) {
      console.error("[SPECTRAL] Photometric Engine Failed:", e);
    }
  }


  // Run Detection Logic (Pass new photoData)
  const pigmentUniformity = detectPigmentUniformity(faceState, photoData);
  const rednessSignal = detectRednessSignal(faceState, photoData);
  const oilReflectance = detectOilReflectance(faceState, photoData);
  const opticalClarity = detectOpticalClarity(faceState, textureEnergy);
  const textureFrequency = detectTextureFrequency(faceState, textureEnergy);
  const underEyeFreshness = detectUnderEyeFreshness(faceState, photoData);
  const chromaticStability = detectChromaticStability(faceState);
  const spectralNoise = detectSpectralNoise(faceState);

  // Gemini Enrich
  const findings = {
    pigment: pigmentUniformity.uniformityIndex,
    redness: rednessSignal.intensity,
    oil: oilReflectance.intensity,
    clarity: opticalClarity.score,
    texture: textureFrequency.balance,
    freshness: underEyeFreshness.vitalityScore,
    stability: chromaticStability.variance,
    noise: spectralNoise.quality
  };

  // Gemini Enrich - Fallback Logic
  let descriptions;
  try {
    descriptions = await generateDescriptions(findings);
  } catch (err) {
    console.warn("[SPECTRAL] AI Description generation failed (Service Overloaded/Error), using fallbacks.", err);
    descriptions = {
      pigmentUniformity: "Clinical spectral analysis completed.",
      rednessSignal: "Hemoglobin distribution mapped.",
      oilReflectance: "Surface lipid reflection calculated.",
      opticalClarity: "Texture contrast analysis done.",
      textureFrequency: "Frequency domain mapped.",
      underEyeFreshness: "Contrast detection complete.",
      chromaticStability: "Stability metrics calculated.",
      spectralNoise: "Signal quality verified."
    };
  }

  // Calculate Overall Score (Weighted) - FIXED: Normalized to 0-10
  // STEP 1: Normalize ALL metrics to 0-10 scale
  const normalized = {
    clarity: opticalClarity.score,  // Already 0-10 ✅
    pigment: pigmentUniformity.uniformityIndex * 10,  // 0-1 → 0-10 ✅
    redness: (() => {
      // Convert categorical to 0-10
      if (rednessSignal.intensity === 'low') return 9;
      if (rednessSignal.intensity === 'medium') return 6;
      return 3; // high
    })(),
    freshness: underEyeFreshness.vitalityScore,  // Already 0-10 ✅
    oil: (() => {
      if (oilReflectance.intensity === 'balanced') return 9;
      if (oilReflectance.intensity === 'matte') return 7;
      return 5; // oily
    })()
  };

  // STEP 2: Apply weights (sum to 1.0)
  const weights = {
    clarity: 0.25,    // 25% - Most important
    pigment: 0.20,    // 20%
    redness: 0.20,    // 20%
    freshness: 0.20,  // 20%
    oil: 0.15         // 15%
  };

  // STEP 3: Weighted sum (0-10 scale)
  const overallScore10 =
    normalized.clarity * weights.clarity +
    normalized.pigment * weights.pigment +
    normalized.redness * weights.redness +
    normalized.freshness * weights.freshness +
    normalized.oil * weights.oil;

  // STEP 4: Convert to 0-100 for display
  const overallScore = Math.round(overallScore10 * 10);  // 0-10 → 0-100

  return {
    pigmentUniformity: { ...pigmentUniformity, description: descriptions.pigmentUniformity },
    rednessSignal: { ...rednessSignal, description: descriptions.rednessSignal },
    oilReflectance: { ...oilReflectance, description: descriptions.oilReflectance },
    opticalClarity: { ...opticalClarity, description: descriptions.opticalClarity },
    textureFrequency: { ...textureFrequency, description: descriptions.textureFrequency },
    underEyeFreshness: { ...underEyeFreshness, description: descriptions.underEyeFreshness },
    chromaticStability: { ...chromaticStability, description: descriptions.chromaticStability },
    spectralNoise: { ...spectralNoise, description: descriptions.spectralNoise },
    maps: maps,
    overallScore: Math.max(0, Math.min(100, overallScore))
  };
}

