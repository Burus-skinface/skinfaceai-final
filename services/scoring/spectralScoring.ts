import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { SpectralDetectionResult } from '../analysis/types';
import type { SpectralScores } from './types';

/**
 * STAGE 3: Spectral Scoring Module (Rule-Based)
 * 
 * Converts spectral detection results into numeric scores (0-10)
 * and determines stress signals and recovery indicators.
 */

/**
 * Score energy balance (0-10)
 */


/**
 * Score Pigment Uniformity (0-10)
 */
function scorePigment(detection: SpectralDetectionResult['pigmentUniformity']): number {
  return Math.round(detection.uniformityIndex * 10);
}

/**
 * Score Redness Signal (0-10)
 * Low intensity/distribution is better
 */
function scoreRedness(detection: SpectralDetectionResult['rednessSignal']): number {
  if (detection.intensity === 'high') return 4;
  if (detection.distribution === 'widespread') return 5;
  if (detection.intensity === 'medium') return 7;
  return 9; // low + localized
}

/**
 * Score Oil Reflectance (0-10)
 * Balanced = high score, Oily/Matte = lower
 */
function scoreOil(detection: SpectralDetectionResult['oilReflectance']): number {
  if (detection.intensity === 'balanced') return 9;
  if (detection.zone === 't-zone-only') return 7;
  return 5; // e.g., oily + widespread
}

/**
 * Score Optical Clarity (0-10)
 * Already computed as score in detection
 */
function scoreClarity(detection: SpectralDetectionResult['opticalClarity']): number {
  return Math.round(detection.score);
}

/**
 * Score Texture Frequency (0-10)
 * Refined/Balanced = good
 */
function scoreTexture(detection: SpectralDetectionResult['textureFrequency']): number {
  if (detection.balance === 'refined') return 9;
  if (detection.balance === 'balanced') return 8;
  return 6; // coarse
}

/**
 * Score Under-Eye Freshness (0-10)
 * Already computed
 */
function scoreUnderEye(detection: SpectralDetectionResult['underEyeFreshness']): number {
  return Math.round(detection.vitalityScore);
}

/**
 * Score Chromatic Stability (0-10)
 * Already computed
 */
function scoreStability(detection: SpectralDetectionResult['chromaticStability']): number {
  return Math.round(detection.stabilityScore);
}

/**
 * Score Spectral Noise (0-10)
 * Low noise = high score
 */
function scoreNoise(detection: SpectralDetectionResult['spectralNoise']): number {
  const rawScore = (1 - detection.noiseLevel) * 10;
  return Math.round(Math.max(0, Math.min(10, rawScore)));
}


export function scoreSpectral(
  detection: SpectralDetectionResult,
  faceState: ComprehensiveFaceState
): SpectralScores {
  // Scoring 8 spectral metrics

  const pigment = scorePigment(detection.pigmentUniformity);
  const redness = scoreRedness(detection.rednessSignal);
  const oil = scoreOil(detection.oilReflectance);
  const clarity = scoreClarity(detection.opticalClarity);
  const texture = scoreTexture(detection.textureFrequency);
  const underEye = scoreUnderEye(detection.underEyeFreshness);
  const stability = scoreStability(detection.chromaticStability);
  const noise = scoreNoise(detection.spectralNoise);

  // Overall Spectral Score (Weighted Average)
  // User weights: Optical Clarity, Pigment, Redness heavier
  const weightedSum =
    (clarity * 0.20) +
    (pigment * 0.15) +
    (redness * 0.15) +
    (oil * 0.10) +
    (texture * 0.10) +
    (underEye * 0.10) +
    (stability * 0.10) +
    (noise * 0.10);

  const overallSpectral = Math.round(weightedSum * 10) / 10;

  const statusScores = {
    pigmentUniformity: pigment,
    rednessSignal: redness,
    oilReflectance: oil,
    opticalClarity: clarity,
    textureFrequency: texture,
    underEyeFreshness: underEye,
    chromaticStability: stability,
    spectralNoise: noise,
    overallSpectral
  };

  // Signals logic
  let stress = 0;
  if (redness < 6) stress++;
  if (underEye < 6) stress++;
  if (noise < 6) stress++;

  let stressSignature: 'low' | 'medium' | 'high' = 'low';
  if (stress > 2) stressSignature = 'high';
  else if (stress > 0) stressSignature = 'medium';

  return {
    statusScores,
    signals: {
      stressSignature,
      recoveryIndicator: overallSpectral // Simplified proxy
    }
  };
}




