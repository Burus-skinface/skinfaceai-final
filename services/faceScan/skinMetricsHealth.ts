import type { SkinROI } from './skinROI';
import type { NormalizedLandmark } from './types';
import {
    applyLaplacian,
    detectBlobs,
    isLocalMaxima,
    calculateSpatialClustering,
    extractROIValues,
    calculateMean,
    calculateStdDev,
    calculateVariance,
    calculatePercentile,
    type Blob
} from './skinHelpers';
import { isInExclusionZone } from './skinROI';

/**
 * 6 Critical Skin Health Metrics
 * 
 * Medical/dermatological assessment of skin conditions
 */

// ============================================================================
// 1. SEBUM ACTIVITY
// ============================================================================

export interface SebumActivityResult {
    sebumScore: number;        // 0-1 overall score
    hotspotCount: number;      // Number of specular highlights
    hotspotDensity: number;    // Ratio of bright pixels
    region: 'low' | 'moderate' | 'high' | 'very-high';
}

/**
 * Measure oil/shine using specular detection
 * L > 240 = very bright specular highlights = oil
 */
export function analyzeSebumActivity(
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): SebumActivityResult {
    const { boundingBox, exclusionZones } = roi;

    // Collect all L values first for adaptive threshold
    const lValues: number[] = [];
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
                    lValues.push(L[idx]);
                }
            }
        }
    }

    // ADAPTIVE: Use Mean + 1.5 * StdDev (Statistical Outlier Detection)
    // Matte skin: Low StdDev -> High threshold -> Few hotspots
    // Oily skin: High StdDev -> Threshold met -> Many hotspots
    const meanL = calculateMean(lValues);
    const stdDevL = calculateStdDev(lValues);

    // Base threshold is mean + 1.5 sigma
    // If image is very flat (stdDev < 10), force a higher threshold to prevent noise detection
    const sigma = Math.max(10, stdDevL);
    const SPECULAR_THRESHOLD = meanL + (1.5 * sigma);

    let hotspotCount = 0;
    for (const val of lValues) {
        if (val > SPECULAR_THRESHOLD) {
            hotspotCount++;
        }
    }

    const totalPixels = lValues.length;
    const hotspotDensity = totalPixels > 0 ? hotspotCount / totalPixels : 0;

    // Adjusted scoring: 
    // 2% density is already significant for outliers
    const sebumScore = Math.min(1, hotspotDensity * 50);

    let region: 'low' | 'moderate' | 'high' | 'very-high';
    if (sebumScore < 0.3) region = 'low';
    else if (sebumScore < 0.6) region = 'moderate';
    else if (sebumScore < 0.8) region = 'high';
    else region = 'very-high';

    // DEBUG LOG
    console.log(`[SEBUM] ROI: ${roi.name}`);
    console.log(`  Stats: Mean=${meanL.toFixed(1)}, StdDev=${stdDevL.toFixed(1)}`);
    console.log(`  Threshold: ${SPECULAR_THRESHOLD.toFixed(1)} (Mean + 1.5*${sigma.toFixed(1)})`);
    console.log(`  Hotspots: ${hotspotCount}/${totalPixels} (${(hotspotDensity * 100).toFixed(2)}%)`);
    console.log(`  Score: ${sebumScore.toFixed(3)}`);

    return { sebumScore, hotspotCount, hotspotDensity, region };
}

// ============================================================================
// 2. PORE CONGESTION
// ============================================================================

export interface PoreCongestionResult {
    congestionScore: number;   // 0-1 overall score
    bumpCount: number;         // Number of bumps/comedones
    bumpDensity: number;       // Bumps per 1000 pixels
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
}

/**
 * Detect clogged pores (closed comedones)
 * Bumps that are NOT red = congestion
 */
export function analyzePoreCongestion(
    L: Float32Array,
    A: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): PoreCongestionResult {
    // Apply Laplacian to detect texture bumps
    const laplacian = applyLaplacian(L, width, height);

    const { boundingBox, exclusionZones } = roi;
    let bumpCount = 0;
    let totalPixels = 0;

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
                    totalPixels++;

                    // Local maxima in Laplacian = bump
                    // NOT red (A < 5) = not inflamed = congestion
                    if (isLocalMaxima(laplacian, idx, width, height) &&
                        laplacian[idx] > 10 &&
                        A[idx] < 5) {
                        bumpCount++;
                    }
                }
            }
        }
    }

    const bumpDensity = totalPixels > 0 ? (bumpCount / totalPixels) * 1000 : 0;
    const congestionScore = Math.min(1, bumpCount / 100);

    let severity: 'clear' | 'mild' | 'moderate' | 'severe';
    if (congestionScore < 0.1) severity = 'clear';
    else if (congestionScore < 0.3) severity = 'mild';
    else if (congestionScore < 0.6) severity = 'moderate';
    else severity = 'severe';

    return { congestionScore, bumpCount, bumpDensity, severity };
}

// ============================================================================
// 3. INFLAMMATORY LOAD
// ============================================================================

export interface InflammatoryLoadResult {
    loadScore: number;         // 0-1 overall score
    stdDev: number;            // A channel standard deviation
    isLocalized: boolean;      // Clustered vs diffuse
    distribution: 'none' | 'diffuse' | 'localized' | 'severe';
}

/**
 * Measure overall inflammation level
 * High A channel dispersion = localized inflammation
 */
export function analyzeInflammatoryLoad(
    A: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): InflammatoryLoadResult {
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
                if (idx < A.length) {
                    values.push(A[idx]);
                }
            }
        }
    }

    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);

    // Consider both mean redness AND variance
    // High mean = overall redness (diffuse inflammation)
    // High stdDev = localized inflammation (spots)
    const isLocalized = stdDev > 10;  // Lowered from 15

    // Combine mean and stdDev for load score
    const meanContribution = Math.min(1, mean / 20);  // Mean A > 20 = high inflammation
    const stdDevContribution = Math.min(1, stdDev / 20);  // Lowered from 30
    const loadScore = Math.max(meanContribution, stdDevContribution);

    let distribution: 'none' | 'diffuse' | 'localized' | 'severe';
    if (loadScore < 0.2) distribution = 'none';
    else if (loadScore < 0.4 && !isLocalized) distribution = 'diffuse';
    else if (loadScore < 0.7) distribution = 'localized';
    else distribution = 'severe';

    return { loadScore, stdDev, isLocalized, distribution };
}

// ============================================================================
// 4. ACTIVE ACNE
// ============================================================================

export interface ActiveAcneResult {
    acneScore: number;         // 0-1 overall score
    papuleCount: number;       // Red bumps (no pus)
    pustuleCount: number;      // White/yellow heads (pus)
    totalLesions: number;      // Total count
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
}

/**
 * Count and classify acne lesions
 * Blob detection on A channel + L channel for classification
 */
export function analyzeActiveAcne(
    A: Float32Array,
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): ActiveAcneResult {
    const { boundingBox } = roi;

    // Collect A channel values for adaptive threshold
    const aValues: number[] = [];
    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const idx = y * width + x;
            if (idx < A.length) {
                aValues.push(A[idx]);
            }
        }
    }

    // ADAPTIVE: Use mean + 1.5*stdDev for outlier detection
    const meanA = calculateMean(aValues);
    const stdDevA = calculateStdDev(aValues);
    const adaptiveThreshold = meanA + 1.5 * stdDevA;

    // Detect red blobs with adaptive threshold
    const blobs = detectBlobs(A, width, height, {
        minArea: 3,  // Lowered even more (3) for dark images
        maxArea: 500,
        minCircularity: 0.3,
        threshold: adaptiveThreshold
    });

    let papuleCount = 0;
    let pustuleCount = 0;

    // Filter blobs within ROI and classify
    for (const blob of blobs) {
        // Check if blob center is in ROI
        if (blob.x >= boundingBox.x &&
            blob.x <= boundingBox.x + boundingBox.w &&
            blob.y >= boundingBox.y &&
            blob.y <= boundingBox.y + boundingBox.h) {

            // Get average L value in blob area
            const blobIdx = Math.floor(blob.y) * width + Math.floor(blob.x);
            const avgL = L[blobIdx];

            // Pustule = bright center (pus), L > 200
            // Papule = normal/dark center, L <= 200
            if (avgL > 200) {
                pustuleCount++;
            } else {
                papuleCount++;
            }
        }
    }

    const totalLesions = papuleCount + pustuleCount;
    // Pustules are worse, so weight them 1.5x
    const acneScore = Math.min(1, (papuleCount + pustuleCount * 1.5) / 20);

    let severity: 'clear' | 'mild' | 'moderate' | 'severe';
    if (totalLesions === 0) severity = 'clear';
    else if (totalLesions <= 5) severity = 'mild';
    else if (totalLesions <= 15) severity = 'moderate';
    else severity = 'severe';

    return { acneScore, papuleCount, pustuleCount, totalLesions, severity };
}

// ============================================================================
// 5. MARKS (PIE/PIH)
// ============================================================================

export interface MarksResult {
    pieScore: number;          // Post-Inflammatory Erythema (red)
    pihScore: number;          // Post-Inflammatory Hyperpigmentation (brown)
    totalMarks: number;        // Total mark count
    pieCount: number;          // Red mark count
    pihCount: number;          // Brown mark count
    severity: 'clear' | 'mild' | 'moderate' | 'severe';
}

/**
 * Detect and classify post-acne marks
 * PIE: High A, low B (red/vascular)
 * PIH: High B, moderate A (brown/pigmentation)
 */
export function analyzeMarks(
    A: Float32Array,
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number
): MarksResult {
    const { boundingBox, exclusionZones } = roi;

    let pieCount = 0;
    let pihCount = 0;
    let totalPixels = 0;

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
                    const a = A[idx];
                    const b = B[idx];

                    // PIE: High A (>20), low B (<15) = red marks
                    if (a > 20 && b < 15) {
                        pieCount++;
                    }

                    // PIH: High B (>25), moderate A (5-25) = brown marks
                    if (b > 25 && a > 5 && a < 25) {
                        pihCount++;
                    }

                    totalPixels++;
                }
            }
        }
    }

    const pieScore = totalPixels > 0 ? pieCount / totalPixels : 0;
    const pihScore = totalPixels > 0 ? pihCount / totalPixels : 0;
    const totalMarks = pieCount + pihCount;

    const combinedScore = pieScore + pihScore;
    let severity: 'clear' | 'mild' | 'moderate' | 'severe';
    if (combinedScore < 0.05) severity = 'clear';
    else if (combinedScore < 0.15) severity = 'mild';
    else if (combinedScore < 0.30) severity = 'moderate';
    else severity = 'severe';

    return { pieScore, pihScore, totalMarks, pieCount, pihCount, severity };
}

// ============================================================================
// 6. BARRIER INTEGRITY
// ============================================================================

export interface BarrierIntegrityResult {
    barrierScore: number;      // 0-1 score (1 = healthy)
    isDamaged: boolean;        // Compromised barrier
    diffuseRedness: boolean;   // Widespread redness
    textureNoise: boolean;     // Rough/flaky texture
    status: 'healthy' | 'compromised' | 'damaged';
}

/**
 * Assess skin barrier health
 * Damaged barrier = diffuse redness + high texture noise
 */
export function analyzeBarrierIntegrity(
    A: Float32Array,
    L: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): BarrierIntegrityResult {
    const { boundingBox, exclusionZones } = roi;

    // Extract A values for redness check
    const aValues: number[] = [];
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
                }
            }
        }
    }

    // Check for diffuse redness
    const avgA = calculateMean(aValues);
    const diffuseRedness = avgA > 15;

    // Check for texture noise (rough/flaky)
    const laplacian = applyLaplacian(L, width, height);
    const lapValues = extractROIValues(laplacian, boundingBox, width);
    const textureNoiseValue = calculateStdDev(lapValues);
    const textureNoise = textureNoiseValue > 20;

    // Damaged barrier = red + rough
    const isDamaged = diffuseRedness && textureNoise;

    let barrierScore: number;
    let status: 'healthy' | 'compromised' | 'damaged';

    if (isDamaged) {
        barrierScore = 0.3;
        status = 'damaged';
    } else if (diffuseRedness || textureNoise) {
        barrierScore = 0.6;
        status = 'compromised';
    } else {
        barrierScore = 0.9;
        status = 'healthy';
    }

    return { barrierScore, isDamaged, diffuseRedness, textureNoise, status };
}

// ============================================================================
// COMPREHENSIVE HEALTH ANALYSIS
// ============================================================================

export interface ComprehensiveSkinHealth {
    sebum: SebumActivityResult;
    poreCongestion: PoreCongestionResult;
    inflammation: InflammatoryLoadResult;
    activeAcne: ActiveAcneResult;
    marks: MarksResult;
    barrier: BarrierIntegrityResult;
    overallHealthScore: number; // 0-1 combined score
}

export function analyzeComprehensiveSkinHealth(
    L: Float32Array,
    A: Float32Array,
    B: Float32Array,
    roi: SkinROI,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): ComprehensiveSkinHealth {
    const sebum = analyzeSebumActivity(L, roi, landmarks, width);
    const poreCongestion = analyzePoreCongestion(L, A, roi, landmarks, width, height);
    const inflammation = analyzeInflammatoryLoad(A, roi, landmarks, width);
    const activeAcne = analyzeActiveAcne(A, L, roi, landmarks, width, height);
    const marks = analyzeMarks(A, B, roi, landmarks, width);
    const barrier = analyzeBarrierIntegrity(A, L, roi, landmarks, width, height);

    // Calculate overall health score (inverse of problems)
    const overallHealthScore = (
        (1 - sebum.sebumScore * 0.5) + // Sebum is less critical
        (1 - poreCongestion.congestionScore) +
        (1 - inflammation.loadScore) +
        (1 - activeAcne.acneScore * 1.5) + // Acne is more critical
        (1 - (marks.pieScore + marks.pihScore)) +
        barrier.barrierScore
    ) / 6;

    return {
        sebum,
        poreCongestion,
        inflammation,
        activeAcne,
        marks,
        barrier,
        overallHealthScore
    };
}
