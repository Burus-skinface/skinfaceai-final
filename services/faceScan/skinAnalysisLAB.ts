import type { SkinROI } from './skinROI';
import type { NormalizedLandmark } from './types';
import { extractRegionLAB, calculateChannelStats } from './colorSpace';
import { isInExclusionZone } from './skinROI';

/**
 * LAB-based Skin Analysis Functions
 * 
 * Uses LAB color space for scientific skin analysis:
 * - L channel: Texture, Sebum (oil)
 * - A channel: Redness, Acne, PIE (Post-Inflammatory Erythema)
 * - B channel: Sun spots, PIH (Post-Inflammatory Hyperpigmentation)
 */

export interface TextureAnalysis {
    variance: number;      // L channel variance (0-1)
    roughness: number;     // Normalized roughness score (0-1)
    smoothness: number;    // Inverse of roughness (0-1)
}

export interface SebumAnalysis {
    oilScore: number;      // Overall oil/shine score (0-1)
    shinePixelRatio: number; // Ratio of high-L pixels
    avgLuminance: number;  // Average L value
}

export interface RednessAnalysis {
    redness: number;       // Overall redness score (0-1)
    acneScore: number;     // High-A pixel ratio (potential acne)
    pieScore: number;      // Moderate-A pixel ratio (PIE)
    avgA: number;          // Average A channel value
}

export interface PigmentationAnalysis {
    sunSpots: number;      // High-B pixel ratio (sun damage)
    pihScore: number;      // Moderate-B pixel ratio (PIH)
    yellowness: number;    // Overall yellowness (0-1)
    avgB: number;          // Average B channel value
}

/**
 * Analyze texture using L channel
 * 
 * Higher variance in L = rougher texture
 * Smooth skin has low L variance
 */
export function analyzeTextureLAB(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    imageWidth: number
): TextureAnalysis {
    const { boundingBox, exclusionZones } = roi;
    const values: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    // Extract L values, excluding eyes/brows/lips
    for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
            // Normalize to 0-1 range for exclusion check
            const normX = px / imageWidth;
            const normY = py / imageWidth; // Assuming square image

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = py * imageWidth + px;
                if (idx < L.length) {
                    values.push(L[idx]);
                }
            }
        }
    }

    if (values.length === 0) {
        return { variance: 0, roughness: 0, smoothness: 1 };
    }

    const stats = calculateChannelStats(values);

    // Normalize variance to 0-1 range
    // Typical L variance for skin: 0-200
    const normalizedVariance = Math.min(1, stats.stdDev / 15);
    const roughness = normalizedVariance;
    const smoothness = 1 - roughness;

    return {
        variance: stats.stdDev,
        roughness,
        smoothness
    };
}

/**
 * Analyze sebum (oil/shine) using L channel
 * 
 * High L values (>80) indicate specular highlights = oil
 */
export function analyzeSebumLAB(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    imageWidth: number
): SebumAnalysis {
    const { boundingBox, exclusionZones } = roi;
    const SHINE_THRESHOLD = 80; // L > 80 = bright/oily

    let shineCount = 0;
    let totalCount = 0;
    let sumL = 0;

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
            const normX = px / imageWidth;
            const normY = py / imageWidth;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = py * imageWidth + px;
                if (idx < L.length) {
                    const lValue = L[idx];
                    sumL += lValue;
                    totalCount++;

                    if (lValue > SHINE_THRESHOLD) {
                        shineCount++;
                    }
                }
            }
        }
    }

    if (totalCount === 0) {
        return { oilScore: 0, shinePixelRatio: 0, avgLuminance: 0 };
    }

    const shinePixelRatio = shineCount / totalCount;
    const avgLuminance = sumL / totalCount;

    // Oil score: combination of shine ratio and average luminance
    const oilScore = Math.min(1, shinePixelRatio * 2 + (avgLuminance - 50) / 50);

    return {
        oilScore: Math.max(0, oilScore),
        shinePixelRatio,
        avgLuminance
    };
}

/**
 * Analyze redness using A channel
 * 
 * Positive A = red, negative A = green
 * High A (>30) = acne/inflammation
 * Moderate A (20-50) = PIE (Post-Inflammatory Erythema)
 */
export function analyzeRednessLAB(
    A: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    imageWidth: number
): RednessAnalysis {
    const { boundingBox, exclusionZones } = roi;
    const values: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
            const normX = px / imageWidth;
            const normY = py / imageWidth;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = py * imageWidth + px;
                if (idx < A.length) {
                    values.push(A[idx]);
                }
            }
        }
    }

    if (values.length === 0) {
        return { redness: 0, acneScore: 0, pieScore: 0, avgA: 0 };
    }

    const stats = calculateChannelStats(values);

    // Count pixels in different A ranges
    const highACount = values.filter(v => v > 30).length; // Acne/inflammation
    const moderateACount = values.filter(v => v > 20 && v <= 50).length; // PIE

    const acneScore = highACount / values.length;
    const pieScore = moderateACount / values.length;

    // Overall redness: normalize avgA to 0-1 range
    // Typical A range for skin: -20 to +60
    const redness = Math.max(0, Math.min(1, (stats.mean + 20) / 80));

    return {
        redness,
        acneScore,
        pieScore,
        avgA: stats.mean
    };
}

/**
 * Analyze pigmentation using B channel
 * 
 * Positive B = yellow (sun spots, PIH)
 * High B (>40) = sun damage/hyperpigmentation
 * Moderate B (25-55) = PIH (Post-Inflammatory Hyperpigmentation)
 */
export function analyzePigmentationLAB(
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    imageWidth: number
): PigmentationAnalysis {
    const { boundingBox, exclusionZones } = roi;
    const values: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
            const normX = px / imageWidth;
            const normY = py / imageWidth;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = py * imageWidth + px;
                if (idx < B.length) {
                    values.push(B[idx]);
                }
            }
        }
    }

    if (values.length === 0) {
        return { sunSpots: 0, pihScore: 0, yellowness: 0, avgB: 0 };
    }

    const stats = calculateChannelStats(values);

    // Count pixels in different B ranges
    const highBCount = values.filter(v => v > 40).length; // Sun damage
    const moderateBCount = values.filter(v => v > 25 && v <= 55).length; // PIH

    const sunSpots = highBCount / values.length;
    const pihScore = moderateBCount / values.length;

    // Overall yellowness: normalize avgB to 0-1 range
    // Typical B range for skin: -20 to +60
    const yellowness = Math.max(0, Math.min(1, (stats.mean + 20) / 80));

    return {
        sunSpots,
        pihScore,
        yellowness,
        avgB: stats.mean
    };
}

/**
 * Comprehensive LAB-based skin analysis for a region
 */
export interface ComprehensiveSkinAnalysisLAB {
    texture: TextureAnalysis;
    sebum: SebumAnalysis;
    redness: RednessAnalysis;
    pigmentation: PigmentationAnalysis;
}

export function analyzeRegionLAB(
    L: Float32Array,
    A: Float32Array,
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    imageWidth: number
): ComprehensiveSkinAnalysisLAB {
    return {
        texture: analyzeTextureLAB(L, roi, landmarks, imageWidth),
        sebum: analyzeSebumLAB(L, roi, landmarks, imageWidth),
        redness: analyzeRednessLAB(A, roi, landmarks, imageWidth),
        pigmentation: analyzePigmentationLAB(B, roi, landmarks, imageWidth)
    };
}
