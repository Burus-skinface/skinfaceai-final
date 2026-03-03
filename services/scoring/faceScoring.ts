import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { FaceStructureDetectionResult } from '../analysis/types';
import type { FaceScores, ArchetypeDebug, ImpactFactor } from './types';

/**
 * SKINFACE AI MASTER BLUEPRINT - SCORING & ARCHETYPE ENGINE (V5.0 RECOVERY)
 * Tech Stack: Linear Scoring + Data-Driven Calibration + Logic Inversion
 */

// ----------------------------------------------------------------------------
// 1. HELPER: LINEAR SCORING UTILITY (Recovered)
// ----------------------------------------------------------------------------

function calculateMetricScore(
  val: number,
  idealMin: number,
  idealMax: number,
  penaltyScale: number,
  unitName: string,
  maxScore = 100
): { score: number; verdict: string; log: string; raw: number } {
  // Safety check
  if (val === 0 || isNaN(val)) {
    return { score: 75, verdict: "Analyzing...", log: "Data pending...", raw: 0 };
  }

  let penalty = 0;
  let dev = 0;
  let verdict = "Ideal";

  if (val < idealMin) {
    dev = idealMin - val;
    penalty = dev * penaltyScale;
    verdict = "Under"; // Context-dependent meaning (Narrow, Recessed, Short)
  } else if (val > idealMax) {
    dev = val - idealMax;
    penalty = dev * penaltyScale;
    verdict = "Over"; // Context-dependent meaning (Wide, Strong, Long)
  }

  // Linear clamp
  const finalScore = Math.max(50, Math.min(100, Math.round(maxScore - penalty)));

  const sign = val > idealMax ? "+" : (val < idealMin ? "-" : "");
  const log = `${val.toFixed(2)}${unitName} (${sign}${dev.toFixed(2)}) -> ${finalScore}`;

  // Default verdict mapping (Can be overridden by custom logic)
  let humanVerdict = "Balanced";
  if (finalScore >= 95) humanVerdict = "Elite";
  else if (finalScore >= 88) humanVerdict = "Strong";
  else if (finalScore >= 80) humanVerdict = "Good";
  else if (finalScore >= 70) humanVerdict = "Average";
  else humanVerdict = "Deviated";

  return { score: finalScore, verdict: humanVerdict, log, raw: val };
}

// ----------------------------------------------------------------------------
// 2. MASTER SCORING CONTROLLER
// ----------------------------------------------------------------------------

export function scoreFace(
  detection: FaceStructureDetectionResult,
  faceState: ComprehensiveFaceState,
  gender: string = 'male'
): FaceScores {
  const g = (gender.toLowerCase() === 'female') ? 'female' : 'male';
  const geo = faceState.geometry;

  // =========================================================================
  // CATEGORY A: FRONT ARCHITECTURE
  // =========================================================================

  // 1. Cheekbone Width (Bizygomatic Ratio)
  // Elite Range: 1.22 - 1.26 (Strict)
  // Ideal Range: 1.18 - 1.28
  const idealCheekMin = g === 'male' ? 1.22 : 1.16;
  const idealCheekMax = g === 'male' ? 1.26 : 1.25;

  const scoreCheekbones = calculateMetricScore(geo.cheekboneWidthRatio || 1.15, idealCheekMin, idealCheekMax, 100, " ratio");

  // Custom Verdict
  if (g === 'male') {
    if (geo.cheekboneWidthRatio < 1.18) scoreCheekbones.verdict = "Below Avg";
    else if (geo.cheekboneWidthRatio < 1.22) scoreCheekbones.verdict = "Average"; // 1.18 - 1.22
    else if (scoreCheekbones.score >= 90) scoreCheekbones.verdict = "Elite";     // 1.22 - 1.26
    else scoreCheekbones.verdict = "Strong";                                      // > 1.26
  }

  // 2. FWHR (Midface Compactness)
  // Target: 1.90 - 2.15 (Male) - Adjusted per user req
  const idealFWHRMin = g === 'male' ? 1.90 : 1.70;
  const idealFWHRMax = g === 'male' ? 2.15 : 1.85;

  const scoreFWHR = calculateMetricScore(geo.midfaceRatio, idealFWHRMin, idealFWHRMax, 60, " ratio"); // Relaxed penalty

  if (scoreFWHR.score < 75) {
    scoreFWHR.verdict = geo.midfaceRatio < idealFWHRMin ? "Long/Narrow" : "Short/Wide";
  }

  // 3. Facial Thirds (Vertical Balance)
  // Ideal: 0.333 each. Check deviation of ALL thirds.
  const diffUpper = Math.abs(geo.upperThirdRatio - 0.333);
  const diffMid = Math.abs(geo.middleThirdRatio - 0.333);
  const diffLower = Math.abs(geo.lowerThirdRatio - 0.333);

  const avgDev = (diffUpper + diffMid + diffLower) / 3;
  // Penalty: 0.02 avg dev is acceptable. 0.05 is bad.
  const thirdScoreVal = Math.max(50, 100 - (avgDev * 1000));

  let thirdVerdict = "Balanced";
  if (thirdScoreVal < 80) thirdVerdict = "Imbalanced";
  else if (thirdScoreVal >= 90) thirdVerdict = "Elite";

  const scoreThirds = {
    score: Math.round(thirdScoreVal),
    verdict: thirdVerdict,
    log: `Avg Dev: ${(avgDev * 100).toFixed(1)}%`,
    raw: avgDev
  };
  const devThirds = avgDev;

  // AGGREGATE FRONT
  // User Request: FWHR 45%, Cheekbones 35%, Thirds 20%
  const frontScore = Math.round((scoreFWHR.score * 0.45) + (scoreCheekbones.score * 0.35) + (scoreThirds.score * 0.20));


  // =========================================================================
  // CATEGORY B: JAWLINE
  // =========================================================================

  // 4. Gonial Angle
  const idealGonialMin = g === 'male' ? 110 : 120;
  const idealGonialMax = g === 'male' ? 125 : 130;
  const scoreGonial = calculateMetricScore(geo.gonialAngle, idealGonialMin, idealGonialMax, 2.5, "°");

  // 5. Jaw Width
  const idealJawMin = g === 'male' ? 0.88 : 0.82;
  const idealJawMax = g === 'male' ? 0.95 : 0.90;
  const scoreJawWidth = calculateMetricScore(geo.jawCheekboneRatio, idealJawMin, idealJawMax, 150, " ratio");

  // 6. Ramus Length
  const idealRamusMin = g === 'male' ? 0.42 : 0.38;
  const idealRamusMax = g === 'male' ? 0.52 : 0.45;
  const scoreRamus = calculateMetricScore(geo.ramusRatio, idealRamusMin, idealRamusMax, 200, " ratio");

  // AGGREGATE JAW
  const jawScore = Math.round((scoreGonial.score * 0.45) + (scoreJawWidth.score * 0.35) + (scoreRamus.score * 0.20));


  // =========================================================================
  // CATEGORY C: SIDE PROFILE
  // =========================================================================

  // 7. Nasofrontal Angle
  const idealNasoMin = g === 'male' ? 120 : 115;
  const idealNasoMax = g === 'male' ? 130 : 125;
  const scoreNaso = calculateMetricScore(geo.nasofrontalAngle, idealNasoMin, idealNasoMax, 3.0, "°");

  // 8. Chin Projection - CALIBRATED LOGIC (User Data: 28% = Strong)
  // New "Strong" Target: 20% - 35%
  const chinRatio = geo.chinProjectionRatio; // e.g. 28.0

  let chinScoreVal = 70;
  let chinVerdict = "Average";

  if (g === 'male') {
    if (chinRatio < 10.0) { chinScoreVal = 50; chinVerdict = "Recessed"; }
    else if (chinRatio < 18.0) { chinScoreVal = 75; chinVerdict = "Average"; }
    else if (chinRatio < 28.0) { chinScoreVal = 95; chinVerdict = "Strong"; } // Sweet spot
    else if (chinRatio < 35.0) { chinScoreVal = 90; chinVerdict = "Very Prominent"; }
    else { chinScoreVal = 70; chinVerdict = "Prognathic"; } // Too forward
  } else {
    // Female scale slightly lower
    if (chinRatio < 8.0) { chinScoreVal = 50; chinVerdict = "Recessed"; }
    else if (chinRatio < 20.0) { chinScoreVal = 85; chinVerdict = "Balanced"; }
    else { chinScoreVal = 70; chinVerdict = "Strong"; }
  }

  const scoreChinProj = {
    score: Math.round(chinScoreVal),
    verdict: chinVerdict,
    log: `Proj: ${chinRatio.toFixed(1)}%`,
    raw: chinRatio
  };

  // 9. E-Line - INVERTED LOGIC
  // Positive = Lips Forward (Protrusive).
  // Ideal: -2% to +2%
  const lipRatio = (geo.lipElineDistUpper + geo.lipElineDistLower) / 2;

  let elineScoreVal = 100;
  let elineVerdict = "Balanced";

  if (lipRatio > 4.0) {
    // Too far forward
    elineScoreVal = Math.max(50, 100 - ((lipRatio - 4) * 8));
    elineVerdict = "Protrusive";
  } else if (lipRatio < -4.0) {
    // Too far back
    elineScoreVal = Math.max(50, 100 - ((-4 - lipRatio) * 8));
    elineVerdict = "Retrusive";
  } else {
    // Balanced (-4 to +4 range approx)
    elineScoreVal = 95;
    elineVerdict = "Balanced";
  }

  const scoreEline = {
    score: Math.round(elineScoreVal),
    verdict: elineVerdict,
    log: `LipDist: ${lipRatio.toFixed(1)}%`,
    raw: lipRatio
  };

  // 10. Neck (Internal)
  const scoreNeck = calculateMetricScore(geo.cervicoMentalAngle, 95, 115, 3.0, "°");

  // AGGREGATE SIDE
  const sideScore = Math.round((scoreNaso.score * 0.30) + (scoreChinProj.score * 0.40) + (scoreEline.score * 0.30));


  // =========================================================================
  // CATEGORY D: HARMONY
  // =========================================================================

  // 11. Symmetry
  // Relaxed: 85+ is Good, 95+ is Elite
  const scoreSym = calculateMetricScore(geo.symmetryAvg * 100, 88, 100, 3.0, "%"); // Penalty reduced

  // 12. Golden Ratio (Pre-calculated Score from Engine)
  const grVal = geo.goldenRatioFaceIPD; // e.g. 72.1
  const scoreGolden = {
    score: Math.round(grVal),
    // Updated Verdicts: 85+ Elite
    verdict: grVal >= 85 ? "Elite" : (grVal >= 70 ? "Good" : "Average"),
    log: `Score: ${grVal.toFixed(1)}`,
    raw: grVal
  };

  // 13. Lip-Nose
  const scoreLipNose = calculateMetricScore(geo.goldenRatioMouthNose, 1.45, 1.75, 40, " ratio");

  // AGGREGATE HARMONY
  const harmonyScore = Math.round((scoreSym.score * 0.4) + (scoreGolden.score * 0.3) + (scoreLipNose.score * 0.3));


  // 4. OUTPUT CONSTRUCTION
  return {
    statusScores: {
      faceLengthWidthBalance: frontScore,
      verticalFacialDistribution: scoreThirds.score,
      eyeAxisTiltQuality: 88,
      browRidgeProjection: scoreNaso.score,
      jawCheekboneRatio: scoreJawWidth.score,
      jawNeckSeparation: scoreNeck.score,
      chinPhiltrumProportion: scoreRamus.score,
      overallStructure: Math.round((frontScore + jawScore + sideScore + harmonyScore) / 4),
      overallSideProfile: sideScore
    },
    priority: {
      primaryFocus: jawScore < 80 ? 'Jawline Definition' : 'Facial Harmony',
      potentialImpact: (100 - harmonyScore) * 0.1
    },
    archetype: "THE WARRIOR",
    measurements: {
      facialThirds: {
        upper: geo.upperThirdRatio, mid: geo.middleThirdRatio, lower: geo.lowerThirdRatio,
        score: scoreThirds.score, verdict: scoreThirds.verdict, deviation: devThirds,
        debugLog: scoreThirds.log,
        impacts: [
          { metric: "Cheekbones", state: scoreCheekbones.verdict, val: geo.cheekboneWidthRatio?.toFixed(2) || "N/A", reasoning: scoreCheekbones.log, rawScore: scoreCheekbones.score, measurementLabel: "Width Ratio" },
          { metric: "FWHR", state: scoreFWHR.verdict, val: scoreFWHR.raw.toFixed(2), reasoning: scoreFWHR.log, rawScore: scoreFWHR.score, measurementLabel: "Ratio" },
          { metric: "Facial Thirds", state: scoreThirds.verdict, val: `${(geo.upperThirdRatio * 100).toFixed(0)}/${(geo.middleThirdRatio * 100).toFixed(0)}/${(geo.lowerThirdRatio * 100).toFixed(0)}`, reasoning: scoreThirds.log, rawScore: scoreThirds.score, measurementLabel: "U/M/L %" }
        ]
      },
      verticalRatio: geo.faceLengthWidthRatio, eyeTilt: geo.eyeTilt, browProjection: scoreNaso.score,
      cheekboneRatio: geo.cheekboneWidthRatio, jawRatio: geo.jawCheekboneRatio, chinProjection: geo.chinProjectionRatio,

      fwhr: geo.midfaceRatio,
      cheekbones: { ratio: geo.cheekboneWidthRatio, score: scoreCheekbones.score, verdict: scoreCheekbones.verdict },
      browRidge: { ratio: 0, score: 0, verdict: "N/A" },

      jawAngularity: {
        gonialAngle: geo.gonialAngle, gonialScore: scoreGonial.score, overallScore: jawScore,
        gonialVerdict: scoreGonial.verdict, definitionVerdict: scoreNeck.verdict, ramusVerdict: scoreRamus.verdict,
        definitionScore: scoreNeck.score, ramusScore: scoreRamus.score,
        impacts: [
          { metric: "Gonial Angle", state: scoreGonial.verdict, val: scoreGonial.raw.toFixed(1) + "°", reasoning: scoreGonial.log, rawScore: scoreGonial.score, measurementLabel: "Angle" },
          { metric: "Jaw Width", state: scoreJawWidth.verdict, val: scoreJawWidth.raw.toFixed(2), reasoning: scoreJawWidth.log, rawScore: scoreJawWidth.score, measurementLabel: "Ratio" },
          { metric: "Ramus Length", state: scoreRamus.verdict, val: scoreRamus.raw.toFixed(2), reasoning: scoreRamus.log, rawScore: scoreRamus.score, measurementLabel: "Ratio" }
        ],
        debugLog: `Gonial: ${scoreGonial.score}`
      },
      jawSupport: { ratio: 0, score: 0, verdict: "N/A" },

      sideProfile: {
        overallScore: sideScore,
        nasofrontalAngle: { angle: geo.nasofrontalAngle, score: scoreNaso.score, verdict: scoreNaso.verdict },
        rickettsELine: { upperDist: geo.lipElineDistUpper, lowerDist: geo.lipElineDistLower, score: scoreEline.score, verdict: scoreEline.verdict },
        ramus: { ratio: geo.ramusRatio, score: scoreRamus.score, verdict: scoreRamus.verdict },
        impacts: [
          { metric: "Nasofrontal", state: scoreNaso.verdict, val: scoreNaso.raw.toFixed(1) + "°", reasoning: scoreNaso.log, rawScore: scoreNaso.score, measurementLabel: "Angle" },
          { metric: "Chin Projection", state: scoreChinProj.verdict, val: scoreChinProj.raw.toFixed(1) + "%", reasoning: scoreChinProj.log, rawScore: scoreChinProj.score, measurementLabel: "Projection" },
          { metric: "E-Line", state: scoreEline.verdict, val: scoreEline.raw.toFixed(1) + "%", reasoning: scoreEline.log, rawScore: scoreEline.score, measurementLabel: "Lip Position" }
        ],
        debugLog: `Naso: ${scoreNaso.score} | Chin: ${scoreChinProj.score}`,
        _scoring_formula: "Score = (Nasofrontal * 30%) + (Chin Proj * 40%) + (E-Line * 30%)"
      },

      harmony: {
        overallScore: harmonyScore,
        symmetry: geo.symmetryAvg, symmetryVerdict: scoreSym.verdict,
        goldenRatioScore: scoreGolden.score, goldenRatioVerdict: scoreGolden.verdict,
        impacts: [
          { metric: "Symmetry", state: scoreSym.verdict, val: scoreSym.raw.toFixed(1) + "%", reasoning: scoreSym.log, rawScore: scoreSym.score, measurementLabel: "Variance" },
          { metric: "Golden Ratio", state: scoreGolden.verdict, val: "%" + scoreGolden.score.toFixed(0), reasoning: scoreGolden.log, rawScore: scoreGolden.score, measurementLabel: "Match" },
          { metric: "Lip-Nose Ratio", state: scoreLipNose.verdict, val: scoreLipNose.raw.toFixed(2), reasoning: scoreLipNose.log, rawScore: scoreLipNose.score, measurementLabel: "Ratio" }
        ],
        debugLog: `Sym: ${scoreSym.score} | Golden: ${scoreGolden.score}`
      },

      lipFullness: { ratio: 0, score: 0, verdict: "N/A", impacts: [] }
    }
  };
}
