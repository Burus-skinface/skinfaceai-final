export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number; // Normalized Z (depth) - origin at face center
}

export interface PoseEstimateDeg {
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
}

/**
 * Jitter metric: frame-to-frame landmark stability
 * Lower = more stable (better quality)
 */
export interface JitterMetrics {
  readonly jitterScore: number;  // 0-1, lower is better
  readonly landmarkDelta: number; // Average landmark movement (normalized)
}

export type AngleBucket = "front" | "left" | "right";

export interface FrameMetrics {
  readonly pose: PoseEstimateDeg;
  readonly qualityScore: number;
  readonly brightness01: number;
  readonly blendshapes?: Record<string, number>; // V5: "jawOpen": 0.5
  readonly matrix?: number[]; // V5: 16-element transformation matrix
}

/**
 * ENGINE CONSTITUTION RULE #3:
 * FramePacket is IMMUTABLE
 * 
 * Why:
 * - Debug easy
 * - Thread-safe
 * - Prevents accidental "re-analysis"
 */
export interface SelectedFrame {
  readonly ts: number;
  readonly landmarks: readonly NormalizedLandmark[];
  readonly cropRgba: Uint8ClampedArray; // Cannot make TypedArray readonly, but treated as immutable
  readonly cropSize: number;
  readonly metrics: FrameMetrics;
}

// Legacy FaceState for backward compatibility
export interface FaceState {
  mergedJpegBase64: string;
  stabilizedLandmarks: NormalizedLandmark[];
  stabilizedPose: PoseEstimateDeg;
  selectedCounts: Record<AngleBucket, number>;
}

// Re-export ComprehensiveFaceState for convenience
export type { ComprehensiveFaceState } from './faceState';

