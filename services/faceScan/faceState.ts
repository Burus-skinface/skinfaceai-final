import type { NormalizedLandmark, PoseEstimateDeg, AngleBucket } from "./types";

/**
 * ENGINE CONSTITUTION RULE #0:
 * 
 * FACE_STATE is the SINGLE TRUTH SOURCE
 * 
 * - Frame ≠ analysis input
 * - Landmark ≠ analysis input  
 * - Video ≠ analysis input
 * - FACE_STATE = stabilized, summarized, analysis-ready object
 * 
 * Gemini ONLY reads this. Nothing else.
 */

export interface RegionMask {
  boundingBox: { x: number; y: number; w: number; h: number };
  pixelCount: number;
}

export interface ComprehensiveFaceState {
  // Core scan data
  readonly scanId: string;
  readonly timestamp: number;

  // Images
  readonly primaryImageJpegBase64: string;      // Front view merged
  readonly leftAngleImageJpegBase64?: string;   // Left 15-25° merged
  readonly rightAngleImageJpegBase64?: string;  // Right 15-25° merged

  // Landmarks (already have this)
  readonly stabilizedLandmarks: readonly NormalizedLandmark[];
  readonly stabilizedPose: PoseEstimateDeg;

  // GEOMETRY METRICS
  readonly geometry: {
    // Facial thirds
    readonly upperThirdRatio: number;   // forehead / face height
    readonly middleThirdRatio: number;  // midface / face height
    readonly lowerThirdRatio: number;   // lower face / face height

    // Facial fifths
    readonly eyeSpacing: number;        // inter-pupillary distance
    readonly faceWidth: number;

    // Jawline
    readonly jawlineSharpness: number;  // 0-1 based on angle gradients
    readonly jawAngleDeg: number;       // gonial angle
    readonly chinProjection: number;    // distance from lip plane

    // Symmetry
    readonly leftRightRatio: number;    // left face area / right face area
    readonly eyeHeightDiff: number;     // pixel difference
    readonly nostrilSymmetry: number;   // 0-1
    readonly lipCenterDeviation: number; // pixels from midline

    // New metrics
    readonly faceLengthWidthRatio: number;  // face_length / face_width
    readonly browTilt: number;              // lateral_brow_height - medial_brow_height (positive = positive tilt)
    readonly eyeTilt: number;               // outer_canthus_height - inner_canthus_height (positive = hunter eye)
    readonly jawCheekboneRatio: number;     // jaw_width / cheekbone_width
    readonly jawNeckDefinition: number;     // 0-1, higher = better definition (cervicomental angle proxy)
    readonly chinBalance: number;           // chin_height / philtrum_length
    readonly chinHeightRatio: number;       // chin_height / face_height (approx 0.18 ideal)
    readonly midLowerRatio: number;         // midface_height / lower_face_height (d(N,Sn) / d(Sn,Me))
    readonly chinProjectionRatio: number;   // 3D forward projection of chin vs facial plane
    readonly midfaceRatio: number;          // FWHR: face_width / midface_height
    readonly cheekboneWidthRatio: number;   // W / L (Zy-Zy / N-Me)
    readonly cheekProjection: number;       // Z-Depth of cheeks relative to eyes (3D Relief)
    readonly browProjectionRatio: number;   // 3D Brow Projection (Glabella vs Eye Plane)
    readonly lipFullnessRatio: number;      // (Upper + Lower Height) / Mouth Width
    readonly nasofrontalAngle: number;      // Angle (Glabella-Nasion-Pronasale) for Side Profile
    readonly lipElineDistUpper: number;     // Distance of Upper Lip to E-Line (mm est)
    readonly lipElineDistLower: number;     // Distance of Lower Lip to E-Line (mm est)
    readonly ramusRatio: number;            // Ramus Length / Face Height
    readonly cervicoMentalAngle: number;    // Estimated Neck Posture Angle (90-105 Ideal)
    readonly gonialAngle: number;           // Jaw Corner Angle (Local Fit)
    readonly jawlineDeviation: number;      // Jawline Definition (RMSE / Length)
    readonly chinFaceRatio: number;         // Chin Width / Face Width
    readonly chinJawRatio: number;          // Chin Width / Jaw Width

    // Harmony & Symmetry (V1.0)
    readonly symmetryEye: number;           // 0-1 (1 = Perfect)
    readonly symmetryCheek: number;         // 0-1
    readonly symmetryJaw: number;           // 0-1
    readonly symmetryNose: number;          // 0-1
    readonly symmetryAvg: number;           // 0-1

    readonly goldenRatioMouthNose: number;  // MouthWidth / NoseWidth
    readonly goldenRatioFaceIPD: number;    // FaceWidth / IPD
    readonly ruleOfFifthsRatio: number;     // EyeWidth / EyeSpacing

    // BLUEPRINT SPECIFIC (Strict Indices)
    readonly blueprint: {
      readonly cheekbones: number;    // 234-454 / 93-323
      readonly jawWidth: number;      // 172-397 / 93-323
      readonly midface: number;       // 168-2 / 234-454
      readonly gonialAngle: number;   // 127-172-152 (deg)
      readonly browDepth: number;     // 10-151 (Z-diff)
      readonly canthalTilt: number;   // 33-133 (Slope)
      readonly ramusLength: number;   // 127-172
      readonly eyeSpacingRatio: number; // IPD / Face Width
      readonly chinForwardGrowth: number; // 152-10 (Z-diff)
    };
  };

  // REGION MASKS (pixel coordinates)
  readonly regions: {
    readonly forehead: RegionMask;
    readonly leftCheek: RegionMask;
    readonly rightCheek: RegionMask;
    readonly nose: RegionMask;
    readonly chin: RegionMask;
    readonly jawline: RegionMask;
    readonly underEyes: RegionMask;
  };

  // TEXTURE METRICS
  readonly texture: {
    // Per-region texture variance
    readonly regionVariance: Readonly<Record<string, number>>;  // higher = rougher

    // Pore visibility (high-freq content)
    readonly poreVisibilityScore: Readonly<Record<string, number>>;

    // Micro-contrast (fine detail)
    readonly microContrast: Readonly<Record<string, number>>;
  };

  // TONE/COLOR METRICS
  readonly tone: {
    // Average RGB per region
    readonly regionRGB: Readonly<Record<string, readonly [number, number, number]>>;

    // Tone evenness (std dev of luminance)
    readonly regionEvenness: Readonly<Record<string, number>>;

    // Redness (R-G channel separation)
    readonly regionRedness: Readonly<Record<string, number>>;

    // Overall skin tone classification
    readonly skinTone: 'warm' | 'cool' | 'neutral';
  };

  // SPECTRAL/REFLECTANCE METRICS
  readonly spectral: {
    // Oil/shine detection (specular highlights)
    readonly regionOilScore: Readonly<Record<string, number>>;

    // Color channel separation
    readonly redChannelEnergy: number;
    readonly greenChannelEnergy: number;
    readonly blueChannelEnergy: number;

    // Shadow maps (low luminance regions)
    readonly shadowDensity: Readonly<Record<string, number>>;

    // Contrast distribution
    readonly contrastMap: Readonly<Record<string, number>>;
  };

  // 12 ADVANCED SKIN METRICS (NEW)
  readonly advancedSkinMetrics?: {
    readonly forehead: {
      readonly health: any; // Will be typed properly from skinMetricsHealth
      readonly quality: any; // Will be typed properly from skinMetricsQuality
    };
    readonly leftCheek: {
      readonly health: any;
      readonly quality: any;
    };
    readonly rightCheek: {
      readonly health: any;
      readonly quality: any;
    };
    readonly chin: {
      readonly health: any;
      readonly quality: any;
    };
    readonly avgHealthScore: number;
    readonly avgQualityScore: number;
  };

  // QUALITY INDICATORS
  readonly quality: {
    readonly overallConfidence: number;  // 0-1
    readonly lightingScore: number;      // 0-1 (0.4-0.7 ideal)
    readonly angleQuality: Readonly<Record<AngleBucket, number>>;
    readonly motionBlur: number;         // 0-1 (lower better)
    readonly neutrality: {
      readonly isNeutral: boolean;
      readonly cheekPuffScore: number;
      readonly mouthOpenScore: number;
      readonly smileScore: number;
      readonly browExpressionScore: number;
    };
  };
}

