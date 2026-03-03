
export interface ProductSuggestion {
  brand?: string;
  productName: string;
  reason: string;
  usageTime: 'Morning' | 'Evening' | 'Daily';
}

export interface SkinAnalysis {
  acne_grade: number; // 0-4
  acne_density: string;
  closed_comedones: number;
  open_comedones: number;
  inflamed_acne: number;
  cystic_acne_probability: number;
  texture_roughness: number;
  pore_size: number;
  redness_level: number;
  pigmentation_level: number;
  oil_level: number;
  dehydration_level: number;
  dark_circles_intensity: number;
  forehead_acne_map: string;
  beard_area_acne: string;
  scalp_acne_visibility: string;
  skin_tone: 'warm' | 'cool' | 'neutral';
  undertone_accuracy: number;
  skin_score: number;
}

export interface FaceShapeAnalysis {
  face_shape: string;
  jawline_sharpness: number; // 0-10
  chin_projection: number;
  chin_width: number;
  midface_length: number;
  cheekbone_prominence: number;
  forehead_ratio: number;
  brow_projection: number;
  eye_shape: string;
  nose_profile: string;
  structure_score: number;
}

export interface SymmetryAnalysis {
  eye_height_difference: number;
  eye_size_difference: number;
  eyebrow_height_symmetry: number;
  nostril_symmetry: number;
  lip_center_deviation: number;
  facial_axis_tilt: number;
  midline_alignment: number;
  left_right_face_ratio: number;
  symmetry_score: number;
}

export interface InstantUpgradeMap {
  recommended_hairstyles: string[];
  recommended_eyebrow_style: string;
  beard_recommendation: string;
  weight_change_recommendation: string;
  skincare_priority: string;
  supplementation_note: string;
  tan_intensity_suggestion: string;
}

export interface AestheticsAnalysis {
  attractiveness_score: number; // 0-10
  hollywood_ratio_alignment: number;
  masculinity_femininity_score: number;
  youthfulness_score: number;
  harmony_score: number;
  instant_upgrade_map: InstantUpgradeMap;
  aesthetics_score: number;
}

export interface SpectralLightAnalysis {
  title: string;
  description: string;
}

export interface SpectralAnalysisReport {
  naturalLight: SpectralLightAnalysis;
  uvLight: SpectralLightAnalysis;
  blueLight: SpectralLightAnalysis;
  redLight: SpectralLightAnalysis;
  greenLight: SpectralLightAnalysis;
  conclusion: string;
}

export interface CelebrityMatch {
  name: string;
  matchPercentage: number;
  description: string;
}

// Import new pipeline types
import type { ComprehensiveFaceState } from './services/faceScan/faceState';
import type { AnalysisResults } from './services/analysis/types';
import type { ScoringResults, SkinMetric } from './services/scoring/types';
export type { SkinMetric };
import type { RecommendationsResult } from './services/recommendations/recommendsEngine';

export interface DailyReport {
  id: string;
  date: string;
  imageUrl: string;

  // NEW PIPELINE STRUCTURE (preferred)
  faceState?: ComprehensiveFaceState;
  analysis?: AnalysisResults;
  scoring?: ScoringResults;
  recommendations?: RecommendationsResult;

  // LEGACY STRUCTURE (for backward compatibility)
  skin?: SkinAnalysis;
  face_shape?: FaceShapeAnalysis;
  symmetry?: SymmetryAnalysis;
  aesthetics?: AestheticsAnalysis;

  // Global Output
  global_score: number | null;
  low_confidence?: boolean;

  // App specific extras maintained for UX
  daily_note?: string;
  spectral_analysis?: SpectralAnalysisReport;
  celebrity_match?: CelebrityMatch;

  // Optional for backward compatibility or future use
  overallImprovement?: string;
}
