import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { AnalysisResults } from '../analysis/types';
import type { ScoringResults } from '../scoring/types';
import type { RecommendationsResult, UserPreferences } from '../recommendations/recommendsEngine';
import type { DailyReport } from '../../types';

import { detectSkinIssues } from '../analysis/skinDetection';
import { detectFaceStructure } from '../analysis/faceStructureDetection';
import { detectSpectralSignals } from '../analysis/spectralDetection';

import { scoreSkin } from '../scoring/skinScoring';
import { scoreFace } from '../scoring/faceScoring';
import { scoreSpectral } from '../scoring/spectralScoring';
import { computeFaceBig6 } from '../scoring/faceBig6Scoring';

import { generateRecommendations } from '../recommendations/recommendsEngine';
import { debugLog } from '../../utils/debugLog';

/**
 * STAGE 5: Pipeline Orchestrator
 * 
 * Coordinates all analysis stages in the correct order:
 * FACE_STATE → Detection → Scoring → Recommendations
 */

export interface PipelineResult {
  faceState: ComprehensiveFaceState;
  analysis: AnalysisResults;
  scoring: ScoringResults;
  recommendations: RecommendationsResult;
}

/**
 * Run the complete analysis pipeline
 */
export async function runFullPipeline(
  faceState: ComprehensiveFaceState,
  userPreferences?: UserPreferences,
  previousScanData?: DailyReport,
  onLog?: (msg: string) => void
): Promise<PipelineResult> {
  if (!faceState.scanId) {
    throw new Error("[PIPELINE] Invalid FACE_STATE — missing scanId");
  }

  debugLog.info('PIPELINE', `Starting analysis for scan ${faceState.scanId}`);
  onLog?.('⏳ Stage 2: Detection starting...');

  // STAGE 2: Detection Modules (parallel execution)
  debugLog.info('PIPELINE', 'Stage 2: Running detection modules...');

  let skinDetection, faceDetection, spectralDetection;
  try {
    [skinDetection, faceDetection, spectralDetection] = await Promise.all([
      detectSkinIssues(faceState).catch(err => {
        throw new Error(`Skin detection failed: ${err?.message || String(err)}`);
      }),
      detectFaceStructure(faceState).catch(err => {
        throw new Error(`Face structure detection failed: ${err?.message || String(err)}`);
      }),
      detectSpectralSignals(faceState).catch(err => {
        throw new Error(`Spectral detection failed: ${err?.message || String(err)}`);
      }),
    ]);
  } catch (err: any) {
    debugLog.error('PIPELINE', 'Stage 2 failed', err?.message);
    throw new Error(`Detection stage failed: ${err?.message || String(err)}`);
  }

  const analysis: AnalysisResults = {
    scanId: faceState.scanId,
    timestamp: Date.now(),
    skin: skinDetection,
    face: faceDetection,
    spectral: spectralDetection,
  };

  debugLog.info('PIPELINE', 'Stage 2 complete ✓');
  onLog?.('✅ Stage 2: Detection done');

  // STAGE 3: Scoring Modules (parallel execution)
  onLog?.('⏳ Stage 3: Scoring...');
  debugLog.info('PIPELINE', 'Stage 3: Running scoring modules...');

  const [skinScores, faceScores, spectralScores] = await Promise.all([
    Promise.resolve(scoreSkin(skinDetection, faceState)),
    Promise.resolve(scoreFace(faceDetection, faceState, userPreferences?.gender || 'male')),
    Promise.resolve(scoreSpectral(spectralDetection, faceState)),
  ]);

  // Calculate global score (weighted: Skin 45%, Structure 45%, Spectral 10%)
  const normalizedStructure = faceScores.statusScores.overallStructure / 10;

  const globalScore =
    0.45 * skinScores.overallScore +
    0.45 * normalizedStructure +
    0.10 * spectralScores.statusScores.overallSpectral;

  // Potential Score: Dynamic based on current scores (diminishing returns)
  const potentialSkin = skinScores.overallScore + ((10 - skinScores.overallScore) * 0.6);
  const potentialStructure = normalizedStructure + ((10 - normalizedStructure) * 0.15);
  const potentialSpectral = spectralScores.statusScores.overallSpectral + ((10 - spectralScores.statusScores.overallSpectral) * 0.5);
  const potentialScore = (0.45 * potentialSkin) + (0.45 * potentialStructure) + (0.10 * potentialSpectral);

  // Compute Face Big 6 from geometry (wraps faceScores, does not replace them)
  const faceBig6 = computeFaceBig6(faceState, userPreferences?.gender || 'male');

  const scoring: ScoringResults = {
    scanId: faceState.scanId,
    skin: skinScores,
    face: faceScores,
    spectral: {
      ...spectralDetection,
      ...spectralScores,
      overallScore: spectralScores.statusScores.overallSpectral
    },
    advancedSkinMetrics: faceState.advancedSkinMetrics ? {
      forehead: faceState.advancedSkinMetrics.forehead,
      leftCheek: faceState.advancedSkinMetrics.leftCheek,
      rightCheek: faceState.advancedSkinMetrics.rightCheek,
      chin: faceState.advancedSkinMetrics.chin,
      avgHealthScore: faceState.advancedSkinMetrics.avgHealthScore,
      avgQualityScore: faceState.advancedSkinMetrics.avgQualityScore,
    } : undefined,
    faceBig6: faceBig6 ?? undefined,
    globalScore: Math.round(globalScore * 10) / 10,
    potentialScore: Math.round(Math.max(globalScore, potentialScore) * 10) / 10,
  };

  debugLog.info('PIPELINE', `Stage 3 complete ✓ — Global Score: ${scoring.globalScore}/10`);
  onLog?.(`✅ Stage 3: Score = ${scoring.globalScore}/10`);

  // STAGE 4: Recommendations Engine (LLM reasoning)
  onLog?.('⏳ Stage 4: Calling Gemini LLM (may take 30s)...');
  debugLog.info('PIPELINE', 'Stage 4: Generating recommendations...');

  let recommendations;
  try {
    recommendations = await generateRecommendations(
      analysis,
      scoring,
      userPreferences,
      previousScanData
    );
  } catch (err: any) {
    debugLog.error('PIPELINE', 'Stage 4 failed', err?.message);
    throw new Error(`Recommendations stage failed: ${err?.message || String(err)}`);
  }

  debugLog.info('PIPELINE', 'Pipeline complete ✓');
  onLog?.('✅ Stage 4: LLM recommendations received');

  return {
    faceState,
    analysis,
    scoring,
    recommendations,
  };
}


