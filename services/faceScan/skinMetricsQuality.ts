import type { SkinROI } from './skinROI';
import type { NormalizedLandmark } from './types';
import {
    applyLaplacian,
    detectBlobs,
    calculateSpatialClustering,
    extractROIValues,
    calculateMean,
    calculateStdDev,
    calculateVariance,
    calculatePercentile
} from './skinHelpers';
import { isInExclusionZone } from './skinROI';

/**
 * 6 Aesthetic Skin Quality Metrics
 * 
 * Measures visual appearance and "glass skin" quality
 */

// ============================================================================
// 1. TEXTURE SMOOTHNESS
// ============================================================================

export interface TextureSmoothnessResult {
    smoothnessScore: number;   // 0-1 (1 = glass skin)
    highFreqRatio: number;     // Ratio of rough pixels
    roughnessLevel: number;    // Raw Laplacian variance
    quality: 'glass' | 'smooth' | 'normal' | 'rough';
}

/**
 * Measure "glass skin" quality using Laplacian filter
 * Lower high-frequency content = smoother skin
 */
export function analyzeTextureSmoothness(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): TextureSmoothnessResult {
    const laplacian = applyLaplacian(L, width, height);
    const { boundingBox, exclusionZones } = roi;

    let highFreqCount = 0;
    let totalPixels = 0;
    const lapValues: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const normX = x / width;
            const normY = y / width;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = y * width + x;
                if (idx < laplacian.length) {
                    const lapValue = laplacian[idx];
                    lapValues.push(lapValue);

                    // High frequency = rough texture
                    if (lapValue > 10) {
                        highFreqCount++;
                    }
                    totalPixels++;
                }
            }
        }
    }

    const highFreqRatio = totalPixels > 0 ? highFreqCount / totalPixels : 0;
    const roughnessLevel = calculateStdDev(lapValues);
    const smoothnessScore = Math.max(0, 1 - Math.min(1, highFreqRatio * 2));

    let quality: 'glass' | 'smooth' | 'normal' | 'rough';
    if (smoothnessScore > 0.85) quality = 'glass';
    else if (smoothnessScore > 0.65) quality = 'smooth';
    else if (smoothnessScore > 0.40) quality = 'normal';
    else quality = 'rough';

    return { smoothnessScore, highFreqRatio, roughnessLevel, quality };
}

// ============================================================================
// 2. PORE VISIBILITY
// ============================================================================

export interface PoreVisibilityResult {
    visibilityScore: number;   // 0-1 (1 = invisible pores)
    poreCount: number;         // Number of visible pores
    poreDensity: number;       // Pores per 1000 pixels
    visibility: 'invisible' | 'minimal' | 'visible' | 'prominent';
}

/**
 * Count visible pores using dark circular spot detection
 */
export function analyzePoreVisibility(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): PoreVisibilityResult {
    const { boundingBox } = roi;

    // Detect dark circular spots (pores are darker than surrounding skin)
    const blobs = detectBlobs(L, width, height, {
        minArea: 2,  // Lowered from 3 for smaller pores
        maxArea: 50,
        minCircularity: 0.5,  // Lowered from 0.6 for irregular pores
        threshold: -100 // Inverted: looking for dark spots
    });

    // Count pores within ROI
    let poreCount = 0;
    for (const blob of blobs) {
        if (blob.x >= boundingBox.x &&
            blob.x <= boundingBox.x + boundingBox.w &&
            blob.y >= boundingBox.y &&
            blob.y <= boundingBox.y + boundingBox.h) {
            // Additional check: must be darker than average
            if (blob.avgValue < 100) {
                poreCount++;
            }
        }
    }

    const roiArea = boundingBox.w * boundingBox.h;
    const poreDensity = roiArea > 0 ? (poreCount / roiArea) * 1000 : 0;
    const visibilityScore = Math.max(0, 1 - Math.min(1, poreCount / 100));

    let visibility: 'invisible' | 'minimal' | 'visible' | 'prominent';
    if (visibilityScore > 0.85) visibility = 'invisible';
    else if (visibilityScore > 0.65) visibility = 'minimal';
    else if (visibilityScore > 0.40) visibility = 'visible';
    else visibility = 'prominent';

    return { visibilityScore, poreCount, poreDensity, visibility };
}

// ============================================================================
// 3. TONE EVENNESS
// ============================================================================

export interface ToneEvennessResult {
    evennessScore: number;     // 0-1 (1 = perfectly even)
    aVariance: number;         // A channel variance
    bVariance: number;         // B channel variance
    combinedVariance: number;  // Average variance
    evenness: 'perfect' | 'even' | 'uneven' | 'patchy';
}

/**
 * Measure color uniformity using A/B channel variance
 * Lower variance = more even tone
 */
export function analyzeToneEvenness(
    A: Float32Array,
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): ToneEvennessResult {
    const { boundingBox, exclusionZones } = roi;
    const aValues: number[] = [];
    const bValues: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const normX = x / width;
            const normY = y / width;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = y * width + x;
                if (idx < A.length) {
                    aValues.push(A[idx]);
                    bValues.push(B[idx]);
                }
            }
        }
    }

    const aVariance = calculateVariance(aValues);
    const bVariance = calculateVariance(bValues);
    const combinedVariance = (aVariance + bVariance) / 2;

    // Lower variance = more even
    const evennessScore = Math.max(0, 1 - Math.min(1, combinedVariance / 100));

    let evenness: 'perfect' | 'even' | 'uneven' | 'patchy';
    if (evennessScore > 0.85) evenness = 'perfect';
    else if (evennessScore > 0.65) evenness = 'even';
    else if (evennessScore > 0.40) evenness = 'uneven';
    else evenness = 'patchy';

    return { evennessScore, aVariance, bVariance, combinedVariance, evenness };
}

// ============================================================================
// 4. RADIANCE
// ============================================================================

export interface RadianceResult {
    radianceScore: number;     // 0-1 (1 = healthy glow)
    isHomogeneous: boolean;    // Even glow vs oily shine
    avgLuminance: number;      // Average L value
    luminanceVariance: number; // L variance
    glow: 'radiant' | 'healthy' | 'dull' | 'flat';
}

/**
 * Measure healthy glow (not oil)
 * Homogeneous moderate luminance = radiance
 * Heterogeneous high luminance = oil
 */
export function analyzeRadiance(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): RadianceResult {
    const { boundingBox, exclusionZones } = roi;
    const values: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const normX = x / width;
            const normY = y / width;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = y * width + x;
                if (idx < L.length) {
                    values.push(L[idx]);
                }
            }
        }
    }

    const avgLuminance = calculateMean(values);
    const lVariance = calculateVariance(values);
    const lStdDev = Math.sqrt(lVariance);

    // Coefficient of Variation (CV) = relative variance
    // Normalizes variance against brightness (dark images naturally have lower absolute variance but maybe high CV)
    const cv = avgLuminance > 0 ? lStdDev / avgLuminance : 0;

    // Healthy radiance:
    // 1. Homogeneous (low CV < 0.25)
    // 2. Good Contrast (some variance is needed, not 0)
    // 3. Relative Brightness (avg should be reasonable relative to 95th percentile)
    const p95 = calculatePercentile(values, 95);
    const brightnessRatio = p95 > 0 ? avgLuminance / p95 : 0;

    const isHomogeneous = cv < 0.25; // Relative homogeneity
    const hasGlow = brightnessRatio > 0.4 && brightnessRatio < 0.8; // Not too flat, not too washed out

    let radianceScore: number;
    if (isHomogeneous && hasGlow) {
        radianceScore = 0.85;
    } else if (isHomogeneous) {
        radianceScore = 0.65;
        // Penalize if too dark relative to own highlights
        if (brightnessRatio < 0.3) radianceScore -= 0.1;
    } else if (hasGlow) {
        radianceScore = 0.55;
    } else {
        radianceScore = 0.35;
    }

    // Boost score slightly for dark images if homogeneity is good
    if (avgLuminance < 100 && isHomogeneous) {
        radianceScore = Math.min(0.9, radianceScore + 0.1);
    }

    let glow: 'radiant' | 'healthy' | 'dull' | 'flat';
    if (radianceScore > 0.75) glow = 'radiant';
    else if (radianceScore > 0.55) glow = 'healthy';
    else if (radianceScore > 0.35) glow = 'dull';
    else glow = 'flat';

    return { radianceScore, isHomogeneous, avgLuminance, luminanceVariance: lVariance, glow };
}

// ============================================================================
// 5. REDNESS UNIFORMITY
// ============================================================================

export interface RednessUniformityResult {
    uniformityScore: number;   // 0-1 (1 = uniform)
    isLocalized: boolean;      // Clustered vs diffuse
    clusteringScore: number;   // Spatial clustering
    redPixelCount: number;     // Number of red pixels
    distribution: 'uniform' | 'scattered' | 'clustered' | 'spotted';
}

/**
 * Check if redness is localized (acne) or diffuse (rosacea/sensitivity)
 */
export function analyzeRednessUniformity(
    A: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): RednessUniformityResult {
    const { boundingBox, exclusionZones } = roi;
    const aValues: number[] = [];
    const redPixelIndices: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    // Collect all A values first for adaptive threshold
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const normX = x / width;
            const normY = y / width;

            if (!isInExclusionZone(normX, normY, landmarks, exclusionZones)) {
                const idx = y * width + x;
                if (idx < A.length) {
                    aValues.push(A[idx]);
                }
            }
        }
    }

    // ADAPTIVE: Use Mean + 1.2 * StdDev (Statistical Outlier)
    const meanA = calculateMean(aValues);
    const stdDevA = calculateStdDev(aValues);

    // If skin is very uniform (low stdDev), threshold is tight (but we need min sigma)
    const sigmaA = Math.max(5, stdDevA);
    const rednessThreshold = meanA + (1.2 * sigmaA);

    // Count red pixels using adaptive threshold
    for (let i = 0; i < aValues.length; i++) {
        if (aValues[i] > rednessThreshold) {
            redPixelIndices.push(i);
        }
    }

    const redPixelCount = redPixelIndices.length;

    // Calculate spatial clustering
    const clusteringScore = redPixelIndices.length > 1
        ? calculateSpatialClustering(redPixelIndices, width)
        : 0;

    // Localized = clustered (acne, bad for uniformity)
    const isLocalized = clusteringScore > 0.7;

    // Use Valid Pixels (aValues.length) for ratio
    const validPixels = aValues.length;
    const redRatio = validPixels > 0 ? redPixelCount / validPixels : 0;

    // FIX: Scoring for statistical outliers
    // Since we are now detecting TRUE outliers (not just top 30%), 
    // any detection is significant.
    // 5% outliers is "normal" for gaussian, anything above is redness.

    let uniformityScore: number;
    if (redPixelCount === 0) {
        uniformityScore = 1.0;
    } else if (redRatio <= 0.05) {
        // Normal distribution tails (expected ~2-5%)
        uniformityScore = 0.9;
    } else {
        // Excess outliers = redness
        // Penalty: e.g. 10% outliers -> 0.05 excess -> 0.25 penalty -> 0.65 score
        const excessRatio = redRatio - 0.05;
        const penalty = excessRatio * 5.0;

        const baseScore = isLocalized ? 0.8 : 0.9;
        uniformityScore = Math.max(0.2, baseScore - penalty);
    }

    let distribution: 'uniform' | 'scattered' | 'clustered' | 'spotted';
    if (redPixelCount === 0) distribution = 'uniform';
    else if (clusteringScore < 0.3) distribution = 'scattered';
    else if (clusteringScore < 0.7) distribution = 'clustered';
    else distribution = 'spotted';

    return { uniformityScore, isLocalized, clusteringScore, redPixelCount, distribution };
}

// ============================================================================
// 6. OIL-HYDRATION BALANCE
// ============================================================================

export interface OilHydrationBalanceResult {
    balanceScore: number;      // 0-1 (1 = balanced)
    isOilyDehydrated: boolean; // High oil + high roughness
    oilLevel: number;          // From sebum score
    hydrationLevel: number;    // Inverse of texture noise
    status: 'balanced' | 'oily' | 'dehydrated' | 'oily-dehydrated';
    warning: string;
}

/**
 * Detect oily-dehydrated skin
 * High sebum + High texture noise = oily-dehydrated
 */
export function analyzeOilHydrationBalance(
    sebumScore: number,
    textureNoiseScore: number
): OilHydrationBalanceResult {
    const oilLevel = sebumScore;
    const hydrationLevel = 1 - textureNoiseScore;

    // Oily-Dehydrated = High oil + Low hydration
    const isOilyDehydrated = oilLevel > 0.6 && hydrationLevel < 0.5;

    let balanceScore: number;
    let status: 'balanced' | 'oily' | 'dehydrated' | 'oily-dehydrated';
    let warning: string;

    if (isOilyDehydrated) {
        balanceScore = 0.3;
        status = 'oily-dehydrated';
        warning = 'Oily-Dehydrated: Use lightweight hydration, avoid heavy oils';
    } else if (oilLevel > 0.7) {
        balanceScore = 0.5;
        status = 'oily';
        warning = 'Oily: Use oil-control and mattifying products';
    } else if (hydrationLevel < 0.4) {
        balanceScore = 0.4;
        status = 'dehydrated';
        warning = 'Dehydrated: Increase hydration with humectants';
    } else {
        balanceScore = 0.9;
        status = 'balanced';
        warning = '';
    }

    return { balanceScore, isOilyDehydrated, oilLevel, hydrationLevel, status, warning };
}

// ============================================================================
// COMPREHENSIVE QUALITY ANALYSIS
// ============================================================================

export interface ComprehensiveSkinQuality {
    smoothness: TextureSmoothnessResult;
    poreVisibility: PoreVisibilityResult;
    toneEvenness: ToneEvennessResult;
    radiance: RadianceResult;
    rednessUniformity: RednessUniformityResult;
    oilHydration: OilHydrationBalanceResult;
    overallQualityScore: number; // 0-1 combined score
}

export function analyzeComprehensiveSkinQuality(
    L: Float32Array,
    A: Float32Array,
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number,
    sebumScore: number
): ComprehensiveSkinQuality {
    const smoothness = analyzeTextureSmoothness(L, roi, landmarks, width, height);
    const poreVisibility = analyzePoreVisibility(L, roi, landmarks, width, height);
    const toneEvenness = analyzeToneEvenness(A, B, roi, landmarks, width);
    const radiance = analyzeRadiance(L, roi, landmarks, width);
    const rednessUniformity = analyzeRednessUniformity(A, roi, landmarks, width);
    const oilHydration = analyzeOilHydrationBalance(sebumScore, smoothness.highFreqRatio);

    // Calculate overall quality score
    const overallQualityScore = (
        smoothness.smoothnessScore +
        poreVisibility.visibilityScore +
        toneEvenness.evennessScore +
        radiance.radianceScore +
        rednessUniformity.uniformityScore +
        oilHydration.balanceScore
    ) / 6;

    return {
        smoothness,
        poreVisibility,
        toneEvenness,
        radiance,
        rednessUniformity,
        oilHydration,
        overallQualityScore
    };
}
