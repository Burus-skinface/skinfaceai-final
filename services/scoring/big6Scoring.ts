import type { AdvancedSkinMetrics, SkinHealthMetrics, SkinQualityMetrics } from './types';

/**
 * BIG 6 — UI-Facing Skin Metrics Aggregation
 * 
 * Combines the 12 raw per-region metrics (6 health + 6 quality) into
 * 6 user-facing categories scored 0-10.
 * 
 * Mapping:
 *   1. Acne & Clarity    ← activeAcne + marks (PIE/PIH)
 *   2. Texture & Pores   ← smoothness + poreCongestion + poreVisibility
 *   3. Barrier Defense    ← barrier + inflammation
 *   4. Sebum Dynamics     ← sebum + oilHydration
 *   5. Tone Uniformity    ← toneEvenness + rednessUniformity
 *   6. Visual Fatigue     ← radiance (+ underEye geometry in future)
 */

// ============================================================================
// TYPES
// ============================================================================

export type Big6Status = 'critical' | 'poor' | 'average' | 'good' | 'elite';

export interface Big6Metric {
    /** 0-10 score */
    score: number;
    /** Human-readable status */
    status: Big6Status;
    /** Short status label for UI */
    statusLabel: string;
    /** Key contributing sub-scores for tooltip/detail */
    breakdown: {
        label: string;
        score: number;
    }[];
}

export interface Big6Scores {
    acneClarity: Big6Metric;
    texturePores: Big6Metric;
    barrierDefense: Big6Metric;
    sebumDynamics: Big6Metric;
    toneUniformity: Big6Metric;
    visualFatigue: Big6Metric;
    /** Weighted overall (0-10) */
    overallBig6: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Clamp a value between 0 and 10 */
function clamp10(v: number): number {
    return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

/** Map a 0-1 raw score to 0-10 (invert if needed) */
function toTen(raw01: number, invert = false): number {
    const v = invert ? (1 - raw01) : raw01;
    return clamp10(v * 10);
}

/** Average an array of numbers */
function avg(arr: number[]): number {
    if (arr.length === 0) return 5;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Read 0–1 metric safely; legacy/mock scans may omit nested fields */
function read01(value: number | undefined, fallback = 0.5): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapRegionScores(
    regions: RegionData[],
    read: (r: RegionData) => number | undefined,
    invert = false,
    fallback = 0.5
): number[] {
    return regions.map((r) => toTen(read01(read(r), fallback), invert));
}

/** Determine status from 0-10 score */
function getStatus(score: number): Big6Status {
    if (score >= 8.5) return 'elite';
    if (score >= 7.0) return 'good';
    if (score >= 5.0) return 'average';
    if (score >= 3.0) return 'poor';
    return 'critical';
}

/** Determine UI label from status */
function getStatusLabel(status: Big6Status): string {
    switch (status) {
        case 'elite': return 'Elite';
        case 'good': return 'Good';
        case 'average': return 'Average';
        case 'poor': return 'Needs Work';
        case 'critical': return 'Critical';
    }
}

// ============================================================================
// REGION AVERAGING
// ============================================================================

type RegionData = { health: SkinHealthMetrics; quality: SkinQualityMetrics };

function getRegions(adv: AdvancedSkinMetrics): RegionData[] {
    return [adv.forehead, adv.leftCheek, adv.rightCheek, adv.chin].filter(
        (r): r is RegionData =>
            r != null &&
            typeof r === 'object' &&
            r.health != null &&
            r.quality != null
    );
}

// ============================================================================
// INDIVIDUAL BIG 6 SCORERS
// ============================================================================

/**
 * 1. ACNE & CLARITY
 * Sources: activeAcne.acneScore (0-1, 0=worst) + marks.pieScore/pihScore (0-1, 0=worst)
 * 
 * Weight: 60% active acne, 40% marks
 */
function scoreAcneClarity(regions: RegionData[]): Big6Metric {
    const acneScores = mapRegionScores(
        regions,
        (r) => r.health.activeAcne?.acneScore,
        true
    );
    const marksScores = mapRegionScores(regions, (r) => {
        const pie = r.health.marks?.pieScore;
        const pih = r.health.marks?.pihScore;
        if (typeof pie !== 'number' || typeof pih !== 'number') return undefined;
        return (pie + pih) / 2;
    }, true);

    const acneAvg = avg(acneScores);
    const marksAvg = avg(marksScores);
    const score = clamp10(acneAvg * 0.6 + marksAvg * 0.4);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Active Acne', score: clamp10(acneAvg) },
            { label: 'Marks (PIE/PIH)', score: clamp10(marksAvg) },
        ],
    };
}

/**
 * 2. TEXTURE & PORES
 * Sources: smoothness.smoothnessScore (0-1, 1=best) + 
 *          poreCongestion.congestionScore (0-1, 0=worst) + 
 *          poreVisibility.visibilityScore (0-1, 0=worst)
 * 
 * Weight: 40% smoothness, 30% congestion, 30% visibility
 */
function scoreTexturePores(regions: RegionData[]): Big6Metric {
    const smoothScores = mapRegionScores(
        regions,
        (r) => r.quality.smoothness?.smoothnessScore
    );
    const congestionScores = mapRegionScores(
        regions,
        (r) => r.health.poreCongestion?.congestionScore,
        true
    );
    const visibilityScores = mapRegionScores(
        regions,
        (r) => r.quality.poreVisibility?.visibilityScore,
        true
    );

    const smoothAvg = avg(smoothScores);
    const congAvg = avg(congestionScores);
    const visAvg = avg(visibilityScores);
    const score = clamp10(smoothAvg * 0.4 + congAvg * 0.3 + visAvg * 0.3);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Smoothness', score: clamp10(smoothAvg) },
            { label: 'Pore Congestion', score: clamp10(congAvg) },
            { label: 'Pore Visibility', score: clamp10(visAvg) },
        ],
    };
}

/**
 * 3. BARRIER DEFENSE
 * Sources: barrier.barrierScore (0-1, 1=healthy) + 
 *          inflammation.loadScore (0-1, 0=worst)
 * 
 * Weight: 55% barrier, 45% inflammation
 */
function scoreBarrierDefense(regions: RegionData[]): Big6Metric {
    const barrierScores = regions.map(r => toTen(r.health.barrier.barrierScore));
    const inflammationScores = regions.map(r => toTen(r.health.inflammation.loadScore, true));

    const barrierAvg = avg(barrierScores);
    const inflamAvg = avg(inflammationScores);
    const score = clamp10(barrierAvg * 0.55 + inflamAvg * 0.45);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Barrier Integrity', score: clamp10(barrierAvg) },
            { label: 'Inflammation', score: clamp10(inflamAvg) },
        ],
    };
}

/**
 * 4. SEBUM DYNAMICS
 * Sources: sebum.sebumScore (0-1, 0=worst high oil) + 
 *          oilHydration.balanceScore (0-1, 1=balanced)
 * 
 * Weight: 50% sebum, 50% oil-hydration balance
 */
function scoreSebumDynamics(regions: RegionData[]): Big6Metric {
    const sebumScores = mapRegionScores(
        regions,
        (r) => r.health.sebum?.sebumScore,
        true
    );
    const balanceScores = mapRegionScores(
        regions,
        (r) => r.quality.oilHydration?.balanceScore
    );

    const sebumAvg = avg(sebumScores);
    const balanceAvg = avg(balanceScores);
    const score = clamp10(sebumAvg * 0.5 + balanceAvg * 0.5);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Sebum Activity', score: clamp10(sebumAvg) },
            { label: 'Oil-Hydration Balance', score: clamp10(balanceAvg) },
        ],
    };
}

/**
 * 5. TONE UNIFORMITY
 * Sources: toneEvenness.evennessScore (0-1, 1=even) + 
 *          rednessUniformity.uniformityScore (0-1, 1=uniform)
 * 
 * Weight: 55% tone evenness, 45% redness distribution
 */
function scoreToneUniformity(regions: RegionData[]): Big6Metric {
    const toneScores = mapRegionScores(
        regions,
        (r) => r.quality.toneEvenness?.evennessScore
    );
    const rednessScores = mapRegionScores(
        regions,
        (r) => r.quality.rednessUniformity?.uniformityScore
    );

    const toneAvg = avg(toneScores);
    const rednessAvg = avg(rednessScores);
    const score = clamp10(toneAvg * 0.55 + rednessAvg * 0.45);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Tone Evenness', score: clamp10(toneAvg) },
            { label: 'Redness Distribution', score: clamp10(rednessAvg) },
        ],
    };
}

/**
 * 6. VISUAL FATIGUE
 * Sources: radiance.radianceScore (0-1, 1=radiant)
 * 
 * Future: + underEye hooding / puffiness metrics
 * For now: 100% radiance score
 */
function scoreVisualFatigue(regions: RegionData[]): Big6Metric {
    const radianceScores = mapRegionScores(
        regions,
        (r) => r.quality.radiance?.radianceScore
    );

    const radianceAvg = avg(radianceScores);
    const score = clamp10(radianceAvg);
    const status = getStatus(score);

    return {
        score,
        status,
        statusLabel: getStatusLabel(status),
        breakdown: [
            { label: 'Radiance', score: clamp10(radianceAvg) },
        ],
    };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Compute the Big 6 scores from AdvancedSkinMetrics.
 * Returns null if advancedSkinMetrics is undefined (scan didn't compute them).
 */
export function computeBig6(advancedSkinMetrics?: AdvancedSkinMetrics): Big6Scores | null {
    if (!advancedSkinMetrics) return null;

    const regions = getRegions(advancedSkinMetrics);
    if (regions.length === 0) return null;

    const acneClarity = scoreAcneClarity(regions);
    const texturePores = scoreTexturePores(regions);
    const barrierDefense = scoreBarrierDefense(regions);
    const sebumDynamics = scoreSebumDynamics(regions);
    const toneUniformity = scoreToneUniformity(regions);
    const visualFatigue = scoreVisualFatigue(regions);

    // Overall: weighted average
    // Acne & Barrier heavier (more impactful on daily appearance)
    const overallBig6 = clamp10(
        acneClarity.score * 0.22 +
        texturePores.score * 0.18 +
        barrierDefense.score * 0.18 +
        sebumDynamics.score * 0.15 +
        toneUniformity.score * 0.15 +
        visualFatigue.score * 0.12
    );

    return {
        acneClarity,
        texturePores,
        barrierDefense,
        sebumDynamics,
        toneUniformity,
        visualFatigue,
        overallBig6,
    };
}
