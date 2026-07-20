import type { ComprehensiveFaceState } from '../faceScan/faceState';
import type { AnalysisResults } from '../analysis/types';
import type { ScoringResults } from '../scoring/types';
import type { RecommendationsResult, UserPreferences } from '../recommendations/recommendsEngine';
import type { DailyReport } from '../../types';

import { detectSkinIssues } from '../analysis/skinDetection';
import { detectFaceStructure } from '../analysis/faceStructureDetection';
import { detectSpectralSignals, createSpectralFallback } from '../analysis/spectralDetection';

import { scoreSkin } from '../scoring/skinScoring';
import { scoreFace } from '../scoring/faceScoring';
import { scoreSpectral } from '../scoring/spectralScoring';
import { computeFaceBig6 } from '../scoring/faceBig6Scoring';

import { generateRecommendations } from '../recommendations/recommendsEngine';
import { debugLog } from '../../utils/debugLog';

export interface PipelineResult {
  faceState: ComprehensiveFaceState;
  analysis: AnalysisResults;
  scoring: ScoringResults;
  recommendations: RecommendationsResult;
  partial?: boolean;
}

const MINIMAL_RECOMMENDATIONS: RecommendationsResult = {
  big6Insights: {
    acneClarity: '',
    texturePores: '',
    barrierDefense: '',
    sebumDynamics: '',
    toneUniformity: '',
    visualFatigue: '',
  },
  faceBig6Insights: {
    eyes: '',
    nose: '',
    jawline: '',
    chin: '',
    midface: '',
    harmony: '',
  },
  priorityOrder: [],
  focusAreas: [],
  dailyRoutine: { morning: [], evening: [] },
  monthlyGoals: { month1: '', month3: '', month6: '', month12: '' },
  motivationalNote: 'Your scan is complete. Recommendations will appear when the connection is restored.',
  recommendedProducts: [],
};

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

  const [skinResult, faceResult, spectralResult] = await Promise.all([
    detectSkinIssues(faceState).catch(err => {
      debugLog.error('PIPELINE', 'Skin detection failed', err?.message);
      throw new Error(`Skin detection failed: ${err?.message || String(err)}`);
    }),
    detectFaceStructure(faceState).catch(err => {
      debugLog.error('PIPELINE', 'Face structure detection failed', err?.message);
      throw new Error(`Face structure detection failed: ${err?.message || String(err)}`);
    }),
    detectSpectralSignals(faceState).catch(err => {
      debugLog.warn('PIPELINE', 'Spectral detection skipped (non-blocking)', err?.message);
      return null;
    }),
  ]);

  const spectralDetection = spectralResult ?? createSpectralFallback();

  const analysis: AnalysisResults = {
    scanId: faceState.scanId,
    timestamp: Date.now(),
    skin: skinResult,
    face: faceResult,
    spectral: spectralDetection,
  };

  debugLog.info('PIPELINE', 'Stage 2 complete ✓');
  onLog?.('✅ Stage 2: Detection done');

  onLog?.('⏳ Stage 3: Scoring...');
  const [skinScores, faceScores, spectralScores] = await Promise.all([
    Promise.resolve(scoreSkin(skinResult, faceState)),
    Promise.resolve(scoreFace(faceResult, faceState, userPreferences?.gender || 'male')),
    Promise.resolve(scoreSpectral(spectralDetection, faceState)),
  ]);

  const normalizedStructure = faceScores.statusScores.overallStructure / 10;
  const spectralWeight = spectralResult ? 0.1 : 0;
  const skinWeight = spectralResult ? 0.45 : 0.5;
  const structureWeight = spectralResult ? 0.45 : 0.5;

  const globalScore =
    skinWeight * skinScores.overallScore +
    structureWeight * normalizedStructure +
    spectralWeight * spectralScores.statusScores.overallSpectral;

  const potentialSkin = skinScores.overallScore + ((10 - skinScores.overallScore) * 0.6);
  const potentialStructure = normalizedStructure + ((10 - normalizedStructure) * 0.15);
  const potentialSpectral = spectralScores.statusScores.overallSpectral + ((10 - spectralScores.statusScores.overallSpectral) * 0.5);
  const potentialScore =
    skinWeight * potentialSkin +
    structureWeight * potentialStructure +
    spectralWeight * potentialSpectral;

  const faceBig6 = computeFaceBig6(faceState, userPreferences?.gender || 'male');

  const scoring: ScoringResults = {
    scanId: faceState.scanId,
    skin: skinScores,
    face: faceScores,
    spectral: {
      ...spectralDetection,
      ...spectralScores,
      overallScore: spectralScores.statusScores.overallSpectral,
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

  onLog?.('⏳ Stage 4: Calling Gemini LLM (may take 30s)...');
  let recommendations: RecommendationsResult;
  let partial = false;

  try {
    recommendations = await generateRecommendations(
      analysis,
      scoring,
      userPreferences,
      previousScanData
    );
  } catch (err: any) {
    debugLog.error('PIPELINE', 'Stage 4 failed — returning partial report', err?.message);
    onLog?.('⚠️ Recommendations unavailable — saving scores only');
    recommendations = MINIMAL_RECOMMENDATIONS;
    partial = true;
  }

  debugLog.info('PIPELINE', partial ? 'Pipeline complete (partial) ✓' : 'Pipeline complete ✓');
  onLog?.(partial ? '✅ Partial report ready (retry recommendations later)' : '✅ Stage 4: LLM recommendations received');

  return { faceState, analysis, scoring, recommendations, partial };
}
