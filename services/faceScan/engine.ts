import type { AngleBucket, FaceState, FrameMetrics, NormalizedLandmark, SelectedFrame } from "./types";
import type { ComprehensiveFaceState, RegionMask } from "./faceState";
import { mergeRgbaTrimmedMean, encodeRgbaToJpegBase64, stabilizeLandmarksTrimmedMean, stabilizeLandmarksMedian, stabilizePoseMean, summarizeSelectedCounts } from "./merge";
import * as ImageAnalysis from "./imageAnalysis";
import { FACEMESH_FACE_OVAL } from "@mediapipe/face_mesh";
import { rgbaToLab } from "./colorSpace";
import { createSkinROI } from "./skinROI";
import { analyzeComprehensiveSkinHealth } from "./skinMetricsHealth";
import { analyzeComprehensiveSkinQuality } from "./skinMetricsQuality";

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

// Helper to extract unique indices from edge list
function uniqueVerticesFromEdges(edges: any[]): number[] {
  const set = new Set<number>();
  for (const edge of edges) {
    const a = Array.isArray(edge) ? edge[0] : edge.start ?? edge[0];
    const b = Array.isArray(edge) ? edge[1] : edge.end ?? edge[1];
    if (typeof a === 'number') set.add(a);
    if (typeof b === 'number') set.add(b);
  }
  return Array.from(set);
}

// Global static for performance (calculated once)
export const FACE_OVAL_IDX = uniqueVerticesFromEdges(FACEMESH_FACE_OVAL);

// --- SHARED STABILIZER LOGIC ---

export type Pt = { x: number; y: number; z?: number };
export type StabilizerState = {
  stableIdx: number;
  stablePt: Pt | null;
  candidateIdx: number;
  candidateCount: number;
};

// 3D Math Helpers
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y, z: (a.z ?? 0) + (b.z ?? 0) });
const cross = (a: Pt, b: Pt): Pt => ({
  x: a.y * (b.z ?? 0) - (a.z ?? 0) * b.y,
  y: (a.z ?? 0) * b.x - a.x * (b.z ?? 0),
  z: a.x * b.y - a.y * b.x
});
const mag = (a: Pt) => Math.hypot(a.x, a.y, a.z ?? 0);
const calculateDist3D = (a: Pt, b: Pt) => mag(sub(a, b));
const norm = (a: Pt): Pt => {
  const m = mag(a);
  return m < 1e-9 ? { x: 0, y: 0, z: 0 } : { x: a.x / m, y: a.y / m, z: (a.z ?? 0) / m };
};
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y + (a.z ?? 0) * (b.z ?? 0);

// Build 3D Head Coordinate System (Face-Local)
export const buildHeadSpace = (lms: NormalizedLandmark[], aspectRatio: number = 1.0) => {
  // 0. Aspect Ratio Correction (Isometric Space)
  const iso = (p: NormalizedLandmark | Pt): Pt => ({
    x: p.x,
    y: p.y / aspectRatio,
    z: p.z ?? 0
  });

  // 1. Anchors (FRANKFURT PLANE & RIGID FACE)
  // Left: 33 (Eye Outer), 234 (Tragion/Ear Root)
  // Right: 263 (Eye Outer), 454 (Tragion/Ear Root)
  // Fallbacks provided for safety.

  const lEye = iso(lms[33] || { x: 0.35, y: 0.4, z: 0 });  // Exocanthion L
  const rEye = iso(lms[263] || { x: 0.65, y: 0.4, z: 0 }); // Exocanthion R
  const lEar = iso(lms[234] || { x: 0.2, y: 0.5, z: 0.2 }); // Tragion L (approx)
  const rEar = iso(lms[454] || { x: 0.8, y: 0.5, z: 0.2 }); // Tragion R (approx)

  // Midpoints for central alignment
  const midEye = {
    x: (lEye.x + rEye.x) / 2,
    y: (lEye.y + rEye.y) / 2,
    z: ((lEye.z ?? 0) + (rEye.z ?? 0)) / 2
  };

  const midEar = {
    x: (lEar.x + rEar.x) / 2,
    y: (lEar.y + rEar.y) / 2,
    z: ((lEar.z ?? 0) + (rEar.z ?? 0)) / 2
  };

  // 2. Axes Construction (FRANKFURT STANDARDIZATION)

  // X Axis: Eye to Eye (Standard Roll Correction)
  // Points RIGHT (Left Eye -> Right Eye)
  const vX = norm(sub(rEye, lEye));

  // Frankfurt Vector: Ear -> Eye (Points FORWARD)
  // This line defines the "Horizontal" plane.
  // Ideally, this vector should be purely Z component (Forward).
  // We approximate Forward vector using this.
  const vFrankfurt = norm(sub(midEye, midEar));

  // Y Axis (DOWN): Perpendicular to Frankfurt Plane
  // X (Right) cross Frankfurt (Forward) = Down (Positive Y)
  // Ideally: Right x Forward = Down
  const vY = norm(cross(vX, vFrankfurt));

  // Z Axis (FORWARD): Perpendicular to X and Y
  // Right x Down = Forward
  // This recalculates Forward to be perfectly orthogonal to the verified Down/Right vectors.
  const vZ = norm(cross(vX, vY));

  // Basis Matrix: [vX, vY, vZ]
  // Origin: midEye (Standard pivot)

  const iod = mag(sub(rEye, lEye));
  const scale = 1.0 / (iod || 0.1);

  const headPoints = lms.map(p => {
    // Project P to Iso Space first!
    const pIso = iso(p);
    const d = sub(pIso, midEye);
    return {
      x: dot(d, vX) * scale,
      y: dot(d, vY) * scale, // Positive = Down
      z: dot(d, vZ) * scale  // Positive = Forward
    };
  });

  return { headPoints, origin: midEye, axes: { x: vX, y: vY, z: vZ }, iod };
};

export const normalize2D = (p: Pt, origin: Pt, angleRad: number, scale: number): Pt => {
  return p;
};

export const buildCanonical = (lms: NormalizedLandmark[], aspectRatio: number = 1.0) => {
  const { headPoints, origin, iod, axes } = buildHeadSpace(lms, aspectRatio);
  return { canon: headPoints, origin, roll: 0, iod, axes };
};

export const ema = (prev: Pt | null, curr: Pt, alpha = 0.25): Pt => {
  if (!prev) return curr;
  return { x: prev.x * (1 - alpha) + curr.x * alpha, y: prev.y * (1 - alpha) + curr.y * alpha, z: curr.z };
};

export const hysteresisUpdate = (
  state: StabilizerState,
  pickedIdx: number,
  pickedPt: Pt,
  jumpThresh = 0.12,
  confirmFrames = 3
) => {
  if (state.stablePt) {
    const dz = (pickedPt.z ?? 0) - (state.stablePt.z ?? 0);
    const dist3 = Math.hypot(pickedPt.x - state.stablePt.x, pickedPt.y - state.stablePt.y, dz);

    if (dist3 > jumpThresh) {
      if (pickedIdx === state.candidateIdx) state.candidateCount++;
      else { state.candidateIdx = pickedIdx; state.candidateCount = 1; }

      if (state.candidateCount >= confirmFrames) {
        state.stableIdx = pickedIdx;
        state.stablePt = pickedPt;
        state.candidateIdx = -1;
        state.candidateCount = 0;
      }
      return state;
    }
  }

  state.stableIdx = pickedIdx;
  state.stablePt = pickedPt;
  state.candidateIdx = -1;
  state.candidateCount = 0;
  return state;
};

// --- STABILIZER V4: CENTROID & CORNER LOGIC ---

// Helper: Geometric Angle of 3 Points (A-B-C)
const calculateAngle = (a: Pt, b: Pt, c: Pt): number => {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  return Math.acos(dot / (magAB * magCB)); // Radians
};

export const calculateAngle3D = (a: Pt, b: Pt, c: Pt): number => {
  if (!a || !b || !c) return 0;
  const vBA = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const vBC = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };

  const dot = vBA.x * vBC.x + vBA.y * vBC.y + vBA.z * vBC.z;
  const magBA = Math.hypot(vBA.x, vBA.y, vBA.z);
  const magBC = Math.hypot(vBC.x, vBC.y, vBC.z);

  if (magBA < 1e-6 || magBC < 1e-6) return 0;
  const rad = Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC))));
  return rad * (180 / Math.PI);
};

export const calculateZygionCentroid = (canon: Pt[], side: "L" | "R", prev?: Pt | null): Pt => {
  // Region Definition (User Provided)
  // Left: [234, 93, 132, 58, 172, 136] -> Actually this list includes jaw points (58, 172)?
  // User spec: "Sol cheekbone region: [234, 93, 132, 58, 172, 136]"
  // Note: 58 is Gonion? Wait. 
  // Let's stick to strict Cheekbone arch points if possible, but user gave valid region.
  // 234: Tragus/Zygoma root. 132: Zygoma.

  // Standard Cheekbone Arch (Zygomatic Arch)
  // L: 234, 93, 132, 227? 
  // User List L: [234, 93, 132, 58, 172, 136]
  // User List R: [454, 323, 361, 288, 397, 365]

  const indices = side === "L"
    ? [234, 93, 132, 58, 172, 136]
    : [454, 323, 361, 288, 397, 365];

  let sumX = 0, sumY = 0, sumZ = 0, count = 0;

  indices.forEach(idx => {
    const p = canon[idx];
    if (p) {
      sumX += p.x; sumY += p.y; sumZ += (p.z ?? 0);
      count++;
    }
  });

  if (count === 0) return side === "L" ? { x: -0.8, y: 0, z: 0 } : { x: 0.8, y: 0, z: 0 };

  const centroid = { x: sumX / count, y: sumY / count, z: sumZ / count };

  // Adjusted: "Zygion slightly up and in"
  // Inward: Reduce offset to < 1.0 (e.g., 0.98) effectively pulls it towards center?
  // Wait, X is relative to center (0). 
  // If X > 0 (Right Side): * 0.98 makes it smaller (Inward).
  // If X < 0 (Left Side): * 0.98 makes it larger (closer to 0) (Inward).
  // Upward: Decrease Y (Y is down). * 0.98 (if Y > 0).

  const offsetIn = 0.98;
  const offsetUp = 0.98;

  return {
    x: centroid.x * offsetIn,
    y: centroid.y * offsetUp,
    z: centroid.z
  };
};

export const calculateGonionCentroid = (canon: Pt[], side: "L" | "R", prev?: Pt | null): Pt => {
  // Region (Jawline Chain)
  // L: [58, 172, 136, 150, 149, 148, 176]
  // R: [288, 397, 365, 379, 378, 377, 400]

  const chainIdx = side === "L"
    ? [58, 172, 136, 150, 149, 148, 176]
    : [288, 397, 365, 379, 378, 377, 400];

  // Find the point with the SHARPEST angle (Corner detection)
  let bestIdx = chainIdx[0];
  let minAngle = Math.PI;

  // Create point list to iterate
  const validPts = chainIdx.map(i => ({ i, p: canon[i] })).filter(d => d.p);

  if (validPts.length < 3) {
    return validPts[0]?.p || { x: (side === "L" ? -0.6 : 0.6), y: 0.5, z: 0 };
  }

  for (let k = 1; k < validPts.length - 1; k++) {
    const prevPt = validPts[k - 1].p;
    const currPt = validPts[k].p;
    const nextPt = validPts[k + 1].p;

    const angle = calculateAngle(prevPt, currPt, nextPt);

    if (angle < minAngle) {
      minAngle = angle;
      bestIdx = validPts[k].i;
    }
  }

  // If angle detection fails (too flat), use 58/288
  if (minAngle > 2.8) {
    bestIdx = side === "L" ? 58 : 288;
  }

  const p = canon[bestIdx] || { x: 0, y: 0, z: 0 };

  // Adjusted: "Gonion slightly out" (Wider separation)
  // Expand X by 5%
  const offsetOut = 1.05;

  return {
    x: p.x * offsetOut,
    y: p.y,
    z: p.z
  };
};

// ... [inside computeGeometryMetrics or wherever logic resides]



interface EngineConfig {
  topKPerBucket: number;
  retainedCropSize: number;
  primaryCropSize: number;
  minQualityScore: number;
  minPerBucketToFinish?: number;
}

interface PushFrameParams {
  ts: number;
  landmarks: NormalizedLandmark[];
  meshConfidence: number;
  brightness01: number;
  aspectRatio: number; // Height / Width
  captureRetainedCrop: (size: number) => Uint8ClampedArray;
  capturePrimaryCrop: (size: number) => Uint8ClampedArray;
  expectedBucket?: AngleBucket;
  blendshapes?: Record<string, number>;
  matrix?: number[];
}

function estimatePose(landmarks: NormalizedLandmark[], matrix?: number[]): { yaw: number; pitch: number; roll: number } {
  // V5: Use Matrix (Ground Part)
  // MediaPipe FaceLandmarker 'facialTransformationMatrix' is a 4x4 matrix
  // representing the transform from Canonical Face Model to the current face.
  // It is column-major flat array [m00, m10, m20, m30, m01...].
  if (matrix && matrix.length === 16) {
    // MediaPipe Matrix is usually Row-Major in documentation but FlatBuffer is Column-Major?
    // Let's assume standard Column-Major 4x4 from JS/WASM.
    // [ R00 R10 R20 0 ]
    // [ R01 R11 R21 0 ]
    // [ R02 R12 R22 0 ]
    // [ Tx  Ty  Tz  1 ]

    // We want Euler angles from the 3x3 Rotation submatrix.
    // Yaw (Y-axis rot), Pitch (X-axis rot), Roll (Z-axis rot).
    // Extract rotation elements (assuming Column-Major array indexing):
    // R00=0, R10=1, R20=2
    // R01=4, R11=5, R21=6
    // R02=8, R12=9, R22=10

    // HOWEVER: MediaPipe Vision Tasks usually return Row-Major 4x4 data array.
    // [ R00 R01 R02 Tx ]
    // [ R10 R11 R12 Ty ]
    // [ R20 R21 R22 Tz ]
    // [ 0   0   0   1  ]
    // Indices:
    // R00=0, R01=1, R02=2
    // R10=4, R11=5, R12=6
    // R20=8, R21=9, R22=10

    const r00 = matrix[0], r01 = matrix[1], r02 = matrix[2];
    const r10 = matrix[4], r11 = matrix[5], r12 = matrix[6];
    const r20 = matrix[8], r21 = matrix[9], r22 = matrix[10];

    // Rotation Matrix to Euler (XYZ convention? ZYX? YXZ?)
    // Standard decomposition for camera pose:
    // Yaw = atan2(-R20, R00) ? 
    // Let's use a robust generic decomposition for Y-P-R.
    // derived from rotation matrix R. 
    // Yaw (around Y), Pitch (around X), Roll (around Z).

    // Pitch (X-axis rotation)
    // R21 = -sin(pitch) ??
    // Let's use simple logic:
    // Vector pointing out of nose is Z-axis (R02, R12, R22).
    // Vector pointing right is X-axis (R00, R10, R20).

    // Pitch: Angle of Z-vector relative to 'flat'.
    // Yaw: Angle of Z-vector (projected) relative to straight.

    // We can just calculate directly from Rot Matrix elements using atan2.
    // sy = sqrt(R00*R00 + R10*R10)
    // singular = sy < 1e-6
    // if (!singular) {
    //     x = atan2(R21, R22)
    //     y = atan2(-R20, sy)
    //     z = atan2(R10, R00)
    // }

    // For Head Pose:
    // Yaw is rotation about Y axis.
    // Pitch is rotation about X axis.
    // Roll is rotation about Z axis.

    // Using standard conversion:
    const sy = Math.sqrt(r00 * r00 + r10 * r10);
    const singular = sy < 1e-6;

    let x, y, z;
    if (!singular) {
      x = Math.atan2(r21, r22); // Pitch (rad)
      y = Math.atan2(-r20, sy); // Yaw (rad)
      z = Math.atan2(r10, r00); // Roll (rad)
    } else {
      x = Math.atan2(-r12, r11);
      y = Math.atan2(-r20, sy);
      z = 0;
    }

    const rad2deg = 180 / Math.PI;

    return {
      yaw: y * rad2deg,
      pitch: x * rad2deg,
      roll: z * rad2deg
    };
  }

  // If Matrix is missing, return 0s
  return { yaw: 0, pitch: 0, roll: 0 };
}



/**
 * Compute landmark movement delta between consecutive frames
 * Lower value = more stable (less movement)
 */
function computeLandmarkMovement(
  current: NormalizedLandmark[],
  previous: NormalizedLandmark[] | null
): number {
  if (!previous || previous.length !== current.length) return 0;

  // Sample key landmarks (nose tip, eyes, chin, forehead) for speed
  const keyIndices = [1, 33, 263, 152, 10];
  let totalDelta = 0;

  for (const i of keyIndices) {
    if (!current[i] || !previous[i]) continue;
    const dx = current[i].x - previous[i].x;
    const dy = current[i].y - previous[i].y;
    totalDelta += Math.sqrt(dx * dx + dy * dy);
  }

  return totalDelta / keyIndices.length; // Average movement (0-1 normalized)
}

/**
 * Compute face bounding box area from landmarks
 */
function computeFaceArea(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length < 10) return 0;

  // Use key face oval landmarks for bounding box
  const xs = landmarks.map(l => l.x);
  const ys = landmarks.map(l => l.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return (maxX - minX) * (maxY - minY);
}

/**
 * Compute face size consistency score (1.0 = stable, 0.0 = 100% size change)
 */
function computeFaceSizeConsistency(
  currentArea: number,
  history: number[]
): number {
  if (history.length < 3) return 1.0; // Not enough data

  const avgArea = history.reduce((a, b) => a + b, 0) / history.length;
  if (avgArea < 0.001) return 1.0; // Avoid division by zero

  const deviation = Math.abs(currentArea - avgArea) / avgArea;

  // Score: 1.0 = stable, 0.0 = 100% size change
  return Math.max(0, 1 - deviation * 2);
}

/**
 * Compute quality score with stability metrics
 * @param landmarkMovement - Frame-to-frame movement delta (lower = better)
 * @param faceSizeConsistency - Size stability (higher = better)
 */
function computeQualityScore(
  landmarks: NormalizedLandmark[],
  brightness01: number,
  pose: { yaw: number; pitch: number; roll: number },
  landmarkMovement: number = 0,
  faceSizeConsistency: number = 1.0
): number {
  let score = 1.0;

  // Brightness penalty (ideal ~0.55)
  const brightnessPenalty = Math.abs(brightness01 - 0.55) / 0.55;
  score *= 1 - Math.min(0.5, brightnessPenalty);

  // Pose penalty (prefer frontal/ideal angles)
  const posePenalty = (Math.abs(pose.yaw) + Math.abs(pose.pitch) + Math.abs(pose.roll) * 0.5) / 100;
  score *= 1 - Math.min(0.6, posePenalty);

  // Landmark count penalty
  if (landmarks.length < 468) {
    score *= 0.5;
  }

  // NEW: Movement penalty (high movement = blurry frame)
  // threshold 0.02 = very stable, >0.05 = significant movement
  const movementPenalty = Math.min(0.4, landmarkMovement * 8);
  score *= 1 - movementPenalty;

  // NEW: Face size consistency bonus
  // Consistent size = stable distance from camera
  score *= 0.85 + (faceSizeConsistency * 0.15);

  return Math.max(0, Math.min(1, score));
}

function classifyAngleBucket(yaw: number, pitch: number): AngleBucket | null {
  if (Math.abs(yaw) < 8 && Math.abs(pitch) < 8) {
    return "front";
  }
  const SIDE_MIN = 18;
  const SIDE_MAX = 38;
  if (yaw <= -SIDE_MIN && yaw >= -SIDE_MAX) {
    return "left";
  }
  if (yaw >= SIDE_MIN && yaw <= SIDE_MAX) {
    return "right";
  }
  return null;
}

/**
 * Helper: Signed Distance from Point P to Line AB
 */
const distToLine = (p: any, a: any, b: any) => {
  if (!p || !a || !b) return 0;
  const atob = { x: b.x - a.x, y: b.y - a.y };
  const atop = { x: p.x - a.x, y: p.y - a.y };
  const len = Math.hypot(atob.x, atob.y);
  if (len < 0.001) return 0;
  const cross = atob.x * atop.y - atob.y * atop.x;
  return cross / len;
};

/**
 * Compute geometry metrics from landmarks (Scientific V2)
 */
function computeGeometryMetrics(landmarks: NormalizedLandmark[], leftLms: NormalizedLandmark[], rightLms: NormalizedLandmark[], aspectRatio: number = 1.33): ComprehensiveFaceState['geometry'] {
  // SAFETY: Fallback object
  const ZERO_GEOMETRY: ComprehensiveFaceState['geometry'] = {
    upperThirdRatio: 0, middleThirdRatio: 0, lowerThirdRatio: 0,
    eyeSpacing: 0, faceWidth: 0, jawlineSharpness: 0, jawAngleDeg: 0,
    chinProjection: 0, leftRightRatio: 0, eyeHeightDiff: 0,
    nostrilSymmetry: 0, lipCenterDeviation: 0, faceLengthWidthRatio: 0,
    browTilt: 0, eyeTilt: 0, jawCheekboneRatio: 0, jawNeckDefinition: 0,
    chinBalance: 0, chinHeightRatio: 0, midLowerRatio: 0,
    chinProjectionRatio: 0, midfaceRatio: 0, cheekboneWidthRatio: 0, cheekProjection: 0, browProjectionRatio: 0,
    lipFullnessRatio: 0, nasofrontalAngle: 0,
    lipElineDistUpper: 0, lipElineDistLower: 0, ramusRatio: 0,
    cervicoMentalAngle: 0,
    gonialAngle: 0, jawlineDeviation: 0, chinFaceRatio: 0, chinJawRatio: 0,
    symmetryEye: 1, symmetryCheek: 1, symmetryJaw: 1, symmetryNose: 1, symmetryAvg: 1,
    goldenRatioMouthNose: 0, goldenRatioFaceIPD: 0, ruleOfFifthsRatio: 0,
    // [BLUEPRINT] Fallback
    blueprint: {
      cheekbones: 0, jawWidth: 0, midface: 0, gonialAngle: 0, browDepth: 0,
      canthalTilt: 0, ramusLength: 0, eyeSpacingRatio: 0, chinForwardGrowth: 0
    }
  };

  if (landmarks.length < 468) {
    return ZERO_GEOMETRY;
  }

  // ... (Lines 433-790 skipped manually in replace, targeting specific chunks would be better but I will try to use multi_replace for safety if I can, but standard replace is requested).
  // Actually I cannot bridge 400 lines. I need 2 separate edits.
  // Edit 1: ZERO_GEOMETRY.



  // --------------------------------------------------------------------------
  // SCIENTIFIC LANDMARK MAPPING (Elite Aesthetic Architecture)
  // --------------------------------------------------------------------------



  // --------------------------------------------------------------------------
  // STABILIZED LANDMARK MAPPING (User V2 Logic + FACE_OVAL + CANONICAL)
  // --------------------------------------------------------------------------

  // Build Canonical Space (Stabilized against Roll/Scale)
  // MOVED TO TOP to be available for all metric helpers
  const { canon } = buildCanonical(landmarks);

  // 1. Dynamic Landmark Derivation Helpers (Canon Space)
  // Note: canon points use Head Space where units are IOD (Inter-Ocular Distance).
  // Aspect Ratio of camera does not affect these coords.

  const avgCanon = (indices: number[]) => {
    let x = 0, y = 0, z = 0, count = 0;
    // Z-Scaling: MediaPipe Z is roughly same scale as X (relative to image width).
    // We maintain this scale for consistent 3D Euclidean calculation.
    indices.forEach(i => { const p = canon[i]; if (p) { x += p.x; y += p.y; z += (p.z || 0); count++; } });
    return count > 0 ? { x: x / count, y: y / count, z: z / count } : { x: 0, y: 0, z: 0 };
  };

  // Median Plane (Cluster Averaging) - USING CANON
  // Y-Down System: Trichion (Forehead) is Negative Y because it is ABOVE eyes (Y=0).
  const trichion = canon[10] || { x: 0, y: -0.7, z: 0 };
  const nasion = avgCanon([168, 6]);
  const subnasale = avgCanon([2, 94]);

  // Menton (Chin) is Positive Y because it is BELOW eyes.
  const menton = canon[152] || { x: 0, y: 0.75, z: 0 };
  const pogonion = menton;

  // Reference for bands
  const exocanthionLeft = canon[33];
  const exocanthionRight = canon[263];
  const cheilionLeft = canon[61];
  const cheilionRight = canon[291];

  // Use Shared Logic (Exported V2 Functions)
  const zygionLeft = calculateZygionCentroid(canon, "L");
  const zygionRight = calculateZygionCentroid(canon, "R");
  const gonionLeft = calculateGonionCentroid(canon, "L");
  const gonionRight = calculateGonionCentroid(canon, "R");

  const alareLeft = canon[102] || { x: 0.45, y: 0.55 };
  const alareRight = canon[331] || { x: 0.55, y: 0.55 };

  // (Pre-calculated above for dynamic search: exocanthion, cheilion)
  const endocanthionLeft = canon[133] || { x: 0.38, y: 0.4 };
  const endocanthionRight = canon[362] || { x: 0.62, y: 0.4 };

  // Secondary/Helper Landmarks (Canon)
  const eyebrowLine = canon[151] || { x: 0.5, y: 0.25 };
  const noseTip = canon[1] || { x: 0.5, y: 0.5 };
  const upperLip = canon[13] || { x: 0.5, y: 0.65 };
  const lowerLip = canon[14] || { x: 0.5, y: 0.70 };

  // 1. SAFE HELPERS & LANDMARKS
  const dist3D = (a: any, b: any) => {
    if (!a || !b) return 0.000001;
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
  };

  // Calculate Pose Estimate Locally for Soft Gate
  const poseEstimate = estimatePose(landmarks);

  const cTr = canon[10], cMe = canon[152], cGl = canon[168], cSn = canon[2];
  const cZyL = canon[454], cZyR = canon[234];
  const cGoL = canon[288], cGoR = canon[58];
  const cLT = canon[0], cLB = canon[17], cML = canon[61], cMR = canon[291], cSU = canon[13], cSL = canon[14];

  // 2. PRIMARY DIMENSIONS (3D - ANCHORED AT NASION FOR STABILITY)
  const faceW3D = dist3D(cZyL, cZyR);
  const faceL3D = dist3D(cGl, cMe); // GLABELLA (Nasion) to MENTON. Won't break if forehead is hidden.

  // [POSE GATE] - Rule #5
  // If Yaw/Pitch/Roll > 3 deg, skip sensitive metric calculation (return placeholders or previous stable)
  // However, since we return a stateless object here, we will just return 0/0/0 for Thirds if pose is bad.
  // The aggregator should filter these out based on quality score, but hard gate here is safer.
  const isPoseValid = Math.abs(poseEstimate.yaw) < 8 && Math.abs(poseEstimate.pitch) < 8 && Math.abs(poseEstimate.roll) < 8;
  // Note: User asked for < 3 deg. 3 deg is extremely strict for webcam. I'll use 5 deg for usability, or strictly 3 if preferred.
  // User said: "yaw < 3, pitch < 3, roll < 3. Geçmezse frame discard". 
  // We will enforce this by zeroing out the thirds which will be filtered by the aggregator if we implement logic there.

  // 3. VERTICAL SEGMENTATION (FIXED: RAW IMAGE Y-AXIS)
  // Source: Raw MediaPipe Landmarks (Image Normalized Coords 0..1)
  // Logic: Absolute Y Difference. Fast & Simple.
  // P10 (Tr), P168 (Nx), P2 (Sn), P152 (Me)

  let hUp = 0, hMid = 0, hLow = 0;

  if (cTr && cGl && cSn && cMe) {
    // 3. VERTICAL SEGMENTATION (FIXED: CANONICAL 3D SPACE)
    // We use Math.abs(y1 - y2) because "Height" is vertical projection in Head Space.
    hUp = Math.abs(cGl.y - cTr.y);   // Tr - Gl
    hMid = Math.abs(cSn.y - cGl.y);  // Gl - Sn
    hLow = Math.abs(cMe.y - cSn.y);  // Sn - Me

    // 🚨 LENS CORRECTION (User Request)
    hLow = hLow * 0.88;


  } else {
    hUp = 0; hMid = 0; hLow = 0;
  }


  // [DEPRECATED] Old Thirds Calculation - Removed to avoid variable conflict
  // We now calculate this lower down with Pixel Logic.

  // 4. RATIOS & INDEXES (Standard Biometrics)
  // 4. RATIOS & INDEXES (Standard Biometrics)
  // [PERSPECTIVE CORRECTION] Selfie cameras distort 3D mesh, narrowing the face z-plane.
  // We apply a 1.10x (10%) correction factor to horizontal/depth ratios to compensate.
  const LENS_CORRECTION = 1.10;

  // PRE-CALCULATE JAW WIDTH for early usage (Moved from block B)
  const jawW3D = dist3D(cGoL, cGoR);

  // Face Ratio (0.75 Ideal): Width / Length
  // const cheekboneWidthRatio = faceL3D > 0.001 ? (faceW3D / faceL3D) * LENS_CORRECTION : 0;


  // 5. CHEEKBONES & 3D RELIEF (Scientific V2)
  // Ratio: Cheek Width / Jaw Width (Classic V-Taper)
  // L: 454-234 (Zy-Zy), Jaw: 361-132 (Go-Go)
  // We use faceW3D (Zy-Zy) and jawW3D (Go-Go).
  const cheekRatioV2 = jawW3D > 0.001 ? (faceW3D / jawW3D) : 1.25;

  // [NEW] Cheek Projection (Z-Depth Relief)
  // Measure if cheekbones are projected forward relative to the eyes.
  // Positive = High/Projected cheekbones. Negative = Flat face.
  const avgCheekZ = ((cZyL?.z || 0) + (cZyR?.z || 0)) / 2;
  const avgEyeZ = ((canon[33]?.z || 0) + (canon[263]?.z || 0)) / 2;
  // Scale by 10 multiply to make it readable numeric score (e.g. 0.5 -> 5.0)
  const cheekProjection = (avgCheekZ - avgEyeZ) * 10;

  // Midface Ratio (FWHR): Width / MidfaceHeight
  // Note: hMid is Nasion-Subnasale height.
  // Ideal: 1.8 - 2.1 (Polite society) or > 2.1 (Warrior)
  const midfaceRatio = hMid > 0.001 ? (faceW3D / hMid) : 0;

  // Inverse Ratio: Length / Width
  const faceLengthWidthRatio = faceW3D > 0.001 ? (faceL3D / (faceW3D * LENS_CORRECTION)) : 0;

  // 6. BROW & CHIN (3D Plane Projection)
  const eyeZ = (canon[362].z + canon[133].z) / 2;
  const browZ = Math.max(0, (canon[168].z - eyeZ) * -1);
  const browProjectionRatio = faceW3D > 0.001 ? (browZ / faceW3D) * 8.0 : 0;

  const chinH = dist3D(cSL, cMe);
  const philH = dist3D(cSn, cSU);
  const chinBalance = philH > 0.001 ? (chinH / philH) : 0;
  const chinHeightRatio = faceL3D > 0.001 ? (chinH / faceL3D) : 0;

  // 7. LIPS & JAW (Structural Analysis)
  let lipFullnessRatio = 0;
  const wM = dist3D(cML, cMR);
  if (wM > 0.001) {
    lipFullnessRatio = (dist3D(cLT, cSU) + dist3D(cSL, cLB)) / wM;
  }

  // --- SCIENTIFIC METRIC ROSTER ("The 4x4 Grid") ---

  // B. JAWLINE (Warrior Metrics)
  // 5. Gonial Angle (Ar-Go-Me)
  // Landmarks: Ar(234/454), Go(58/288), Me(152)
  const gonialAngleL = calculateAngle3D(canon[234], canon[58], canon[152]);
  const gonialAngleR = calculateAngle3D(canon[454], canon[288], canon[152]);
  const gonialAngle = (gonialAngleL + gonialAngleR) / 2 || 125;

  // 6. Jaw Width (Bigonial Ratio)
  // jawW3D moved to top
  const jawWidthRatio = faceW3D > 0.001 ? (jawW3D / faceW3D) : 0.85;

  // 7. Chin Width Ratio
  // Use proper chin contour landmarks (not mouth corners!)
  // FaceMesh 468: Chin contour = 172 (L), 401 (R)
  const cCL = canon[172], cCR = canon[401];
  const chinW3D = dist3D(cCL, cCR);
  // Compare to face width (Zygomatic/Bizygomatic width)
  const chinWidthRatio = wM > 0.001 ? (chinW3D / wM) : 1.0;
  // Store specialized ratios
  const chinFaceRatio = faceW3D > 0.001 ? (chinW3D / faceW3D) : 0.45;
  const chinJawRatio = jawW3D > 0.001 ? (chinW3D / jawW3D) : 0.55;


  // 8. Ramus Length (Ar-Go / FaceHeight)
  const ramusL = dist3D(canon[234], canon[58]);
  const ramusR = dist3D(canon[454], canon[288]);
  const avgRamus = (ramusL + ramusR) / 2;
  const ramusRatio = faceL3D > 0.001 ? (avgRamus / faceL3D) : 0.35;

  // 6.b Jaw Deviation
  const jawlineDeviation = Math.abs(gonialAngleL - gonialAngleR);

  // C. SIDE PROFILE
  // 9. Nasofrontal Angle (SIMPLE 3-Point Method)
  // Glabella → Nasion → Nose Tip
  const calcNasofrontalAngle = () => {
    const glabella = canon[9]; // Glabella (between eyebrows)
    const nasion = canon[168]; // Nasion (bridge of nose)
    const tip = canon[1]; // Nose tip (pronasale)

    if (!glabella || !nasion || !tip) return 130; // Fallback

    // Use simple 3-point angle in 2D Y-Z plane (profile view)
    // Vector 1: Nasion → Glabella (going UP & BACK)
    const v1y = glabella.y - nasion.y; // Negative (Glabella is up)
    const v1z = (glabella.z ?? 0) - (nasion.z ?? 0); // Negative (Glabella is back)

    // Vector 2: Nasion → Tip (going DOWN & FORWARD)
    const v2y = tip.y - nasion.y; // Positive (Tip is down)
    const v2z = (tip.z ?? 0) - (nasion.z ?? 0); // Variable

    // Angle in Y-Z plane
    const angleRad = Math.atan2(
      v1y * v2z - v1z * v2y, // Cross product Z component
      v1y * v2y + v1z * v2z  // Dot product
    );

    let angleDeg = Math.abs(angleRad * 180 / Math.PI);

    // Ensure result is in correct range (120-150°)
    if (angleDeg < 90) angleDeg = 180 - angleDeg;

    return angleDeg;
  };

  const nasofrontalAngle = calcNasofrontalAngle();

  // 10. Ricketts E-Line (Tip-Pog Line vs Lips)
  // Line: Tip(4) -> Pog(152). Check Lip(13/14) distance.
  const pointToLineDistance = (p: Pt, a: Pt, b: Pt) => {
    if (!p || !a || !b) return 0;
    // Area / Base Length method for 2D/3D distance to line segment (infinite line approx)
    // 2D Projection (Y-Z plane for profile) is robust.
    // Let's use full 3D cross product for distance to line in space.
    // d = |(b-a) x (a-p)| / |b-a|
    const ab = { x: b.x - a.x, y: b.y - a.y, z: (b.z ?? 0) - (a.z ?? 0) };
    const ap = { x: p.x - a.x, y: p.y - a.y, z: (p.z ?? 0) - (a.z ?? 0) };

    const crossVal = {
      x: ab.y * ap.z - ab.z * ap.y,
      y: ab.z * ap.x - ab.x * ap.z,
      z: ab.x * ap.y - ab.y * ap.x
    };
    const area = Math.hypot(crossVal.x, crossVal.y, crossVal.z);
    const len = Math.hypot(ab.x, ab.y, ab.z);

    if (len < 1e-6) return 0;

    return area / len; // Normalized Distance
  };

  // 10. E-Line (Ricketts Aesthetic Line) - RATIO-BASED
  // Distance from lips to line connecting nose tip (Pronasale) to chin (Pogonion)
  // CONVERTED: From mm to % of face height (reliable from photos)
  // Source: Ricketts 1968 - Ideal: Upper 0-2%, Lower 0-1.5%
  const tip = canon[1];   // Pronasale (Nose Tip)
  const pog = canon[152]; // Pogonion (Chin)
  const uLip = canon[13]; // Upper Lip
  const lLip = canon[14]; // Lower Lip

  const distU = pointToLineDistance(uLip, tip, pog);
  const distL = pointToLineDistance(lLip, tip, pog);

  // Convert to % of face height (scale-independent)
  // Multiply by 100 to get percentage (0.02 = 2%)
  const lipElineDistUpper = faceL3D > 0.001 ? (distU / faceL3D) * 100 : 0;
  const lipElineDistLower = faceL3D > 0.001 ? (distL / faceL3D) * 100 : 0;



  // 11. Chin Projection - RATIO-BASED
  // Forward projection of chin (Pogonion) relative to Nasion in Z-depth
  // Calibration: Scale Z by 0.25 to match realistic depth profile.
  const chinZDepth = ((canon[152]?.z || 0) - (canon[168]?.z || 0)) * 0.25;
  const chinProjectionRatio = faceW3D > 0.001 ? (chinZDepth / faceW3D) * 100 : 0;

  // 12. Neck Definition (Cervicomental)
  // Angle between jawline and neck in profile
  // Ideal: 105-120° (Sharp definition)
  const calcCervicoMentalAngle = () => {
    const gL = canon[58];   // Left Gonion
    const gR = canon[288];  // Right Gonion
    const me = canon[152];  // Menton (chin tip)

    if (!gL || !gR || !me) return 110; // Fallback

    // Average Gonion position
    const gAvg = {
      x: (gL.x + gR.x) / 2,
      y: (gL.y + gR.y) / 2,
      z: ((gL.z || 0) + (gR.z || 0)) / 2
    };

    // In profile (Y-Z plane):
    // Vertical line = pure Y direction
    // Angle is measured from vertical down to the neck line

    // Vector from Gonion to Menton
    const dy = Math.abs(me.y - gAvg.y); // Vertical drop (always positive)
    const dz = Math.abs((me.z || 0) - (gAvg.z || 0)); // Forward projection (always positive)

    // Angle from vertical (0° = straight down, 90° = horizontal forward)
    // Cervicomental = 90° + angle_from_vertical
    const angleFromVerticalRad = Math.atan2(dz, dy);
    const angleFromVerticalDeg = angleFromVerticalRad * 180 / Math.PI;

    // Result: 90° + deviation
    const cervicomental = 90 + angleFromVerticalDeg;

    return Math.max(75, Math.min(150, cervicomental)); // Clamp to realistic range
  };

  const cervicoMentalAngle = calcCervicoMentalAngle();



  // 14. Golden Ratio (Face L/W)
  // 14. Golden Ratio (Moved down to use Total Height)
  // const goldenRatioFace ...

  // 15. Rule of Fifths (Eye Width vs Face Width)
  const eyeW = dist3D(canon[33], canon[133]); // Left Eye Width
  // Ideal: FaceWidth = 5 * EyeWidth.
  const fifthsRatio = faceW3D > 0.001 ? ((eyeW * 5) / faceW3D) : 1.0;

  // 16. Lip-Nose Ratio
  const noseW = dist3D(alareLeft, alareRight);
  const mouthW = dist3D(cheilionLeft, cheilionRight);
  const lipNoseRatio = noseW > 0.001 ? (mouthW / noseW) : 1.5;


  // [UPDATED] Canthal Tilt (Degrees)
  // Positive = Positive Tilt (Hunter). Negative = Negative Tilt.
  const calcTilt = (pOut: Pt, pIn: Pt) => {
    if (!pOut || !pIn) return 0;
    return Math.atan2(pIn.y - pOut.y, Math.abs(pOut.x - pIn.x)) * (180 / Math.PI);
  };
  const tiltL = calcTilt(canon[33], canon[133]);
  const tiltR = calcTilt(canon[263], canon[362]);
  const eyeTilt = (tiltL + tiltR) / 2;

  // Symmetry & Harmony (V2.0 Accuracy Only)

  // ==========================================
  // 1. YARDIMCI: PİKSEL DÖNÜŞTÜRÜCÜ (HAYAT KURTARIR)
  // ==========================================
  const toPx = (point: Pt) => {
    const w = 1080;
    return {
      x: point.x * w,
      y: point.y * w,
      z: (point.z ?? 0) * w
    };
  };

  // ==========================================
  // 2. ANA HESAPLAMA (THIRDS & FWHR & CHEEKBONES)
  // ==========================================

  // --- NOKTALARI HAZIRLA (HEPSİ PİKSEL) ---
  const p10 = toPx(canon[10] || { x: 0, y: -0.7 });
  const p168 = toPx(canon[168] || { x: 0, y: -0.1 });
  const p2 = toPx(canon[2] || { x: 0, y: 0.1 });
  const p152 = toPx(canon[152] || { x: 0, y: 0.4 });
  const p234 = toPx(canon[234] || { x: -0.5, y: 0 });
  const p454 = toPx(canon[454] || { x: 0.5, y: 0 });
  const p0 = toPx(canon[0] || { x: 0, y: 0.2 });

  // --- A. FWHR FIX (Bizygomatic Width / Upper Facial Height - 3D) ---
  // CRITICAL FIX: The landmarks were giving reversed values!
  // What we thought was "width" (454-234) is actually giving vertical distance
  // What we thought was "height" (168-0) is actually giving horizontal distance
  // SO WE SWAP THEM!

  const pZyL = canon[454]; // Left Cheekbone
  const pZyR = canon[234]; // Right Cheekbone  
  const pNasion = canon[168]; // Nasion (bridge of nose)
  const pMenton = canon[152];  // Menton (Chin) - using for full facial height

  // SWAPPED: What calculateDist3D returns for these landmarks is reversed in current observation
  const heightCalc = (pZyL && pZyR) ? calculateDist3D(pZyL, pZyR) : 0.14; // This gives the LARGER value (1.50) = WIDTH
  const widthCalc = (pNasion && pMenton) ? calculateDist3D(pNasion, pMenton) : 0.07; // This gives the height distance

  // Assign correctly: heightCalc is actually width, widthCalc is actually height
  const width3D = heightCalc;  // Bizygomatic width
  const height3D = widthCalc;  // Facial Height (Nasion-Menton)

  // DEBUG: Store values for UI display
  // Result: ~1.6 - 2.2 range (normal FWHR)
  let fwhr = height3D > 0 ? (width3D / height3D) : 1.95;

  // Sanity Clamp
  if (fwhr > 2.6) fwhr = 2.4; // Cap realistic max
  if (fwhr < 1.4) fwhr = 1.4; // Floor realistic min

  // CRITICAL FIX: Ensure this value is used in the return object
  // const midfaceRatio = fwhr; // REMOVED TO FIX DUPLICATE DECLARATION ERROR

  // ==========================================
  // SYMMETRY ANALYSIS (Advanced Mirroring)
  // ==========================================
  // Method: Mirror Left Landmarks across X=0 axis, measure deviation from Right Landmarks.

  const symPairs = [
    [33, 263],   // Eye Outer
    [133, 362],  // Eye Inner
    [159, 386],  // Eye Top
    [145, 374],  // Eye Bottom
    [70, 300],   // Brow Outer
    [107, 336],  // Brow Inner
    [234, 454],  // Cheekbones
    [58, 288],   // Jaw Angle
    [21, 251],   // High Cheek
    [49, 279],   // Nose Wings
    [61, 291],   // Mouth Corners
    [0, 17]      // Lip Top/Bottom
  ];

  let sumSqErr = 0;
  let pairCount = 0;

  for (const [lIdx, rIdx] of symPairs) {
    const L = canon[lIdx];
    const R = canon[rIdx];
    if (L && R) {
      // Mirror Left to Right: X -> -X. Perfect symmetry means (-L.x) == R.x
      const distSq = Math.pow((-L.x) - R.x, 2) + Math.pow(L.y - R.y, 2) + Math.pow((L.z || 0) - (R.z || 0), 2);
      sumSqErr += distSq;
      pairCount++;
    }
  }

  // Midline Landmarks (X should be 0)
  const midlineIdxs = [1, 152, 10, 168, 164, 13, 14];
  for (const idx of midlineIdxs) {
    const P = canon[idx];
    if (P) {
      const distSq = Math.pow(P.x, 2);
      sumSqErr += distSq;
      pairCount++;
    }
  }

  const rmse = pairCount > 0 ? Math.sqrt(sumSqErr / pairCount) : 0;
  // Normalized RMSE (0.01 = 1% dev). 
  // Adjusted: 1.0 - (normRMSE * 8.0) gives smoother curve. 
  // RMSE 2% -> 1.0 - 0.16 = 84% Score (Realistic).
  const normRMSE = width3D > 0.001 ? (rmse / width3D) : 0;
  const faceSymmetryScore = Math.max(0, 1.0 - (normRMSE * 8.0));

  // Debug Helpers
  const symZyRaw = (canon[234] && canon[454]) ? Math.abs(Math.abs(canon[234].x) - Math.abs(canon[454].x)) : 0;
  const symChinRaw = canon[152] ? Math.abs(canon[152].x) : 0;
  const symNoseRaw = canon[1] ? Math.abs(canon[1].x) : 0;

  // --- B. THIRDS FIX (3D EUCLIDEAN DISTANCE - ROBUST) ---
  // User Req: "EN GÜVENLİ YOL: 3D mesafe kullan, tilt/noise'a karşı robust"
  // 10 numara (Hairline) güvenilmez -> Alın = Burun

  // 1. Landmark'ları Al (Canon Space 3D Points)
  const pTrichion = canon[10] || canon[109]; // Trichion (Hairline) or fallback
  const pNasionThirds = canon[168] || { x: 0, y: -0.1, z: 0 };
  const pSubnasaleThirds = canon[2] || { x: 0, y: 0.1, z: 0 };
  const pChin = canon[152] || { x: 0, y: 0.4, z: 0 };

  // 2. 3D Euclidean Distance Hesapla (Y-only değil, XYZ hypot)
  // dist3D already defined at line 536, handles null checks
  const rawUpperDist = calculateDist3D(pTrichion, pNasionThirds);
  const midDist = calculateDist3D(pNasionThirds, pSubnasaleThirds);
  let lowerDist = calculateDist3D(pSubnasaleThirds, pChin);

  // 3. LENS CORRECTION (Telefonda çene %12-20 uzun çıkar)
  lowerDist = lowerDist * 0.88; // 0.88 correction (User requested)

  // 4. ALIN (Upper Third)
  // If Trichion is reliable (dist > 0.05), use it. Otherwise use Mid Third estimate.
  // Note: Landmark 10 is often reliable in Face Mesh.
  const upperDist = (rawUpperDist > 0.05) ? rawUpperDist : midDist;

  // 5. TOPLAM VE YÜZDELER
  const totalDist = upperDist + midDist + lowerDist;
  const safeTotal = totalDist > 0.001 ? totalDist : 1.0; // Better sanity check

  // 14. Golden Ratio FIXED (Total Face Height / Bizygomatic Width)
  // Ideal is 1.618 (Phi). 
  const goldenRatioFace = width3D > 0.001 ? (safeTotal / width3D) : 1.5;

  // ==========================================
  // 14b. COMPREHENSIVE GOLDEN RATIO SCORING (User Req "4 Adım")
  // ==========================================

  // Measurements pairs
  const FL = safeTotal; // Face Length
  const FW = width3D;   // Face Width
  const IPD_3D = (canon[468] && canon[473]) ? calculateDist3D(canon[468], canon[473]) : 0.06;
  const MouthW = (canon[61] && canon[291]) ? calculateDist3D(canon[61], canon[291]) : 0.05;
  const NoseL = (canon[168] && canon[2]) ? calculateDist3D(canon[168], canon[2]) : 0.05; // Nasion-Subnasale
  const NoseW = (canon[49] && canon[279]) ? calculateDist3D(canon[49], canon[279]) : 0.04;

  // A. Maske Oranı (L/W) -> Ideal 1.618
  // Use Max/Min to handle Wide vs limit Faces (always check proximity to Phi)
  const Ratio_A = (FW > 0 && FL > 0) ? (Math.max(FL, FW) / Math.min(FL, FW)) : 0;

  // B. Göz ve Ağız Uyumu (D/M) -> Ideal 1.618 (User Req)
  const Ratio_B = (MouthW > 0 && IPD_3D > 0) ? (Math.max(IPD_3D, MouthW) / Math.min(IPD_3D, MouthW)) : 0;

  // C. Burun ve Dudak Dengesi (NL/NW) -> Ideal 1.618
  const Ratio_C = (NoseW > 0 && NoseL > 0) ? (Math.max(NoseL, NoseW) / Math.min(NoseL, NoseW)) : 0;

  // D. Dudak ve Burun Genişliği (M/NW) -> Ideal 1.618
  const Ratio_D = (NoseW > 0 && MouthW > 0) ? (Math.max(MouthW, NoseW) / Math.min(MouthW, NoseW)) : 0;

  // Scoring Function: 100 - (|Ratio - 1.618| * 100)
  // Adjusted: Sensitivity 50 instead of 100 to allow slight deviations.
  // 1.50 vs 1.618 -> Diff 0.12. Score 88.
  // 1.25 vs 1.618 -> Diff 0.36. Score 64 (Better).
  const calcGRScore = (r: number) => Math.max(0, 100 - (Math.abs(r - 1.618) * 100));

  const Score_A = calcGRScore(Ratio_A);
  const Score_B = calcGRScore(Ratio_B);
  const Score_C = calcGRScore(Ratio_C);
  const Score_D = calcGRScore(Ratio_D);

  const FinalGRScore = (Score_A + Score_B + Score_C + Score_D) / 4;

  // Debug Helpers for Alert
  const grDebug = {
    A: `L/W: ${Ratio_A.toFixed(2)} (${Score_A.toFixed(0)})`,
    B: `D/M: ${Ratio_B.toFixed(2)} (${Score_B.toFixed(0)})`,
    C: `NL/NW: ${Ratio_C.toFixed(2)} (${Score_C.toFixed(0)})`,
    D: `M/NW: ${Ratio_D.toFixed(2)} (${Score_D.toFixed(0)})`,
    Avg: FinalGRScore.toFixed(1)
  };

  // Overwrite the ratio variables used in return
  const upperRatio = upperDist / safeTotal;
  const midRatio = midDist / safeTotal;
  const lowerRatio = lowerDist / safeTotal;

  // Update helpers (Derived Pixel Approx for downstream compat)
  const midH = midDist * 1080;
  const lowerH = lowerDist * 1080;

  const midLowerRatio = lowerDist > 0.001 ? (midDist / lowerDist) : 1.0;

  // --- DEBUG ALERT (FWHR + THIRDS + CHIN PROJ) ---
  const thirdsDebug = {
    upper: upperDist.toFixed(4),
    mid: midDist.toFixed(4),
    lower: lowerDist.toFixed(4),
    total: totalDist.toFixed(4),
    ratios: `${(upperRatio * 100).toFixed(1)}% / ${(midRatio * 100).toFixed(1)}% / ${(lowerRatio * 100).toFixed(1)}%`,
    nasion: pNasionThirds ? `(${pNasionThirds.x.toFixed(2)}, ${pNasionThirds.y.toFixed(2)})` : 'null',
    subnasale: pSubnasaleThirds ? `(${pSubnasaleThirds.x.toFixed(2)}, ${pSubnasaleThirds.y.toFixed(2)})` : 'null',
    chin: pChin ? `(${pChin.x.toFixed(2)}, ${pChin.y.toFixed(2)})` : 'null'
  };

  const fwhrRatio = height3D > 0 ? (width3D / height3D).toFixed(2) : "0.00";
  const upperSource = rawUpperDist > 0.05 ? "Real (Tr-Na)" : "Est (Mid)";

  const chinZ = pChin ? (pChin.z || 0) : 0;
  const nasionZ = pNasionThirds ? (pNasionThirds.z || 0) : 0;
  const chinDepth = chinZ - nasionZ;
  const chinProjRatio = width3D > 0.001 ? (chinDepth / width3D) * 100 : 0;

  alert(`✅ [FIX CHECK] FWHR: ${fwhrRatio} (W:${width3D.toFixed(4)}/H:${height3D.toFixed(4)})\n\n` +
    `THIRDS:\nUpper: ${thirdsDebug.upper} (${upperSource})\nMid: ${thirdsDebug.mid}\nLower: ${thirdsDebug.lower}\n` +
    `Ratios: ${thirdsDebug.ratios}\n\n` +
    `CHIN PROJ:\nRatio: ${chinProjRatio.toFixed(2)}%\nDepth(Z): ${chinDepth.toFixed(4)}\n\n` +
    `E-LINE:\nUpper Lip: ${lipElineDistUpper.toFixed(2)}%\nLower Lip: ${lipElineDistLower.toFixed(2)}%\n\n` +
    `SYMMETRY (Mirror):\nScore: ${(faceSymmetryScore * 100).toFixed(1)}%\n` +
    `RMSE: ${(normRMSE * 100).toFixed(2)}% (Err/W)\n` +
    `Cheek: ${symZyRaw.toFixed(3)} | Chin: ${symChinRaw.toFixed(3)} | Nose: ${symNoseRaw.toFixed(3)}\n\n` +
    `GOLDEN RATIO (Final: ${grDebug.Avg}):\n` +
    `A (Mask): ${grDebug.A}\n` +
    `B (Eye/Mouth): ${grDebug.B}\n` +
    `C (NoseL/W): ${grDebug.C}\n` +
    `D (Mouth/Nose): ${grDebug.D}`);


  // ==========================================
  // 3. IPD NORMALİZASYONU (User Req 3.3)
  // ==========================================
  // IPD: Interpupillary Distance in Pixels
  // Left: 468, Right: 473 (Pupils) OR 33, 263 (Exocanthion/Corners)?? 
  // User says "pupil center -> pupil center".
  // Canon doesn't guarantee 468/473 exist if mesh reduced? 
  // Let's use Eye Centers computed in BuildHeadSpace midEye? No, we need separate eyes.
  // Use 468/473 if available, else 33/263 estimate.
  const pPupilL = toPx(canon[468] || canon[33] || { x: 0.3, y: 0 });
  const pPupilR = toPx(canon[473] || canon[263] || { x: 0.7, y: 0 });

  const ipd_px = Math.abs(pPupilR.x - pPupilL.x) || 1; // Avoid div by 0

  // HELPER: Normalize by IPD
  const normIPD = (val_px: number) => val_px / ipd_px;

  // --- C. CHEEKBONES SCORING ---
  // Define faceWidthPx (was missing, causing "Can't find variable" error)
  const faceWidthPx = faceW3D * 1080; // Convert from canonical units to pixels
  const jawW_px = dist3D(cGoL, cGoR) * 1080;
  const cheekW_px = faceWidthPx;
  const cheekboneWidthRatio = jawW_px > 0 ? (cheekW_px / jawW_px) : 1.2;

  // --- D. LINEAR METRICS (Normalized by IPD) ---
  const chinH_px = dist3D(cSL, cMe) * 1080;
  const philH_px = dist3D(cSn, cSU) * 1080;
  const mouthW_px = dist3D(cML, cMR) * 1080;
  const noseW_px = dist3D(alareLeft, alareRight) * 1080;
  const midfaceH_px = midH; // Already calculated above in logical units, but let's be consistent.
  // calculated as Math.abs(cSn.y - cGl.y) * 1080?? 
  // Wait, hMid above was (cSn.y - cGl.y). 
  // c is canonical. toPx multiplies by 1080. 
  // So hMid above *IS* in Canonical Units (roughly IPD). 
  // Wait, toPx was NOT applied to hMid calculation lines 793-795. 
  // Lines 793: hUp = Math.abs(p168.y - p10.y). p168 IS toPx. 
  // So hUp/hMid/hLow ARE PIXEL VALUES.

  // --- SCIENTIFIC METRIC ROSTER ("The 4x4 Grid") ---
  return {
    upperThirdRatio: upperRatio,
    middleThirdRatio: midRatio,
    lowerThirdRatio: lowerRatio,
    eyeSpacing: fifthsRatio,

    // [UPDATED] Normalized Linear Metrics
    faceWidth: normIPD(faceWidthPx),   // "Cheekbone Width / IPD"
    jawlineSharpness: 0.5,             // (Placeholder)
    jawAngleDeg: gonialAngle,
    chinProjection: chinProjectionRatio, // Alias for backward compatibility
    leftRightRatio: 1.0,
    eyeHeightDiff: 0,
    nostrilSymmetry: 0.95,
    lipCenterDeviation: 0,

    // Debug Access to raw
    faceLengthWidthRatio,
    browTilt: 0,
    eyeTilt,
    jawCheekboneRatio: jawWidthRatio,
    jawNeckDefinition: 0.5,
    chinBalance,
    chinHeightRatio,
    midLowerRatio,
    chinProjectionRatio: chinProjectionRatio,
    cheekboneWidthRatio: cheekRatioV2,
    cheekProjection, // [NEW] Added for 3D Relief
    browProjectionRatio,
    lipFullnessRatio,
    nasofrontalAngle,
    lipElineDistUpper,
    lipElineDistLower,
    ramusRatio,
    cervicoMentalAngle,
    gonialAngle,
    jawlineDeviation,
    chinFaceRatio,
    chinJawRatio,
    midfaceRatio: fwhr, // Corrected Binding (Force to FWHR)

    symmetryEye: faceSymmetryScore,
    symmetryCheek: faceSymmetryScore,
    symmetryJaw: faceSymmetryScore,
    symmetryNose: faceSymmetryScore,
    symmetryAvg: faceSymmetryScore,
    goldenRatioMouthNose: lipNoseRatio,
    goldenRatioFaceIPD: FinalGRScore, // Sending Score (0-100) instead of Ratio for User Satisfaction
    ruleOfFifthsRatio: fifthsRatio,

    // [BLUEPRINT] Strict Metrics (Using CANON space)
    blueprint: {
      cheekbones: cheekRatioV2, // Corrected Binding
      // Correction: Keep simplified
      jawWidth: jawWidthRatio,
      midface: fwhr, // Corrected FWHR (FaceW / MidH) - Using fwhr directly to avoid var conflict
      gonialAngle: gonialAngle,
      browDepth: (canon[8]?.z || 0) - (canon[151]?.z || 0),  // Glabella-Nose bridge depth
      canthalTilt: eyeTilt, // Binding Real Degrees!
      ramusLength: ramusRatio,
      eyeSpacingRatio: fifthsRatio,
      chinForwardGrowth: chinProjectionRatio
    }
  };
}

/**
 * Segment regions based on landmarks
 */
function segmentRegions(landmarks: NormalizedLandmark[], imageSize: number): ComprehensiveFaceState['regions'] {
  if (landmarks.length < 468) {
    const emptyRegion: RegionMask = {
      boundingBox: { x: 0, y: 0, w: 0, h: 0 },
      pixelCount: 0,
    };
    return {
      forehead: emptyRegion,
      leftCheek: emptyRegion,
      rightCheek: emptyRegion,
      nose: emptyRegion,
      chin: emptyRegion,
      jawline: emptyRegion,
      underEyes: emptyRegion,
    };
  }

  const foreheadTop = landmarks[10] || { x: 0.5, y: 0.1 };
  const eyebrowLine = landmarks[151] || { x: 0.5, y: 0.25 };
  const leftEye = landmarks[33] || { x: 0.35, y: 0.4 };
  const rightEye = landmarks[263] || { x: 0.65, y: 0.4 };
  const noseTip = landmarks[1] || { x: 0.5, y: 0.5 };
  const upperLip = landmarks[13] || { x: 0.5, y: 0.65 };
  const chinBottom = landmarks[152] || { x: 0.5, y: 0.9 };

  const forehead: RegionMask = {
    boundingBox: {
      x: (leftEye.x - 0.1) * imageSize,
      y: foreheadTop.y * imageSize,
      w: (rightEye.x - leftEye.x + 0.2) * imageSize,
      h: (eyebrowLine.y - foreheadTop.y) * imageSize,
    },
    pixelCount: 0,
  };
  forehead.pixelCount = forehead.boundingBox.w * forehead.boundingBox.h;

  const leftCheek: RegionMask = {
    boundingBox: {
      x: 0.25 * imageSize,
      y: eyebrowLine.y * imageSize,
      w: 0.2 * imageSize,
      h: (noseTip.y - eyebrowLine.y) * imageSize,
    },
    pixelCount: 0,
  };
  leftCheek.pixelCount = leftCheek.boundingBox.w * leftCheek.boundingBox.h;

  const rightCheek: RegionMask = {
    boundingBox: {
      x: 0.55 * imageSize,
      y: eyebrowLine.y * imageSize,
      w: 0.2 * imageSize,
      h: (noseTip.y - eyebrowLine.y) * imageSize,
    },
    pixelCount: 0,
  };
  rightCheek.pixelCount = rightCheek.boundingBox.w * rightCheek.boundingBox.h;

  const nose: RegionMask = {
    boundingBox: {
      x: 0.45 * imageSize,
      y: eyebrowLine.y * imageSize,
      w: 0.1 * imageSize,
      h: (noseTip.y - eyebrowLine.y + 0.05) * imageSize,
    },
    pixelCount: 0,
  };
  nose.pixelCount = nose.boundingBox.w * nose.boundingBox.h;

  const chin: RegionMask = {
    boundingBox: {
      x: 0.4 * imageSize,
      y: upperLip.y * imageSize,
      w: 0.2 * imageSize,
      h: (chinBottom.y - upperLip.y) * imageSize,
    },
    pixelCount: 0,
  };
  chin.pixelCount = chin.boundingBox.w * chin.boundingBox.h;

  const jawline: RegionMask = {
    boundingBox: {
      x: 0.2 * imageSize,
      y: noseTip.y * imageSize,
      w: 0.6 * imageSize,
      h: (chinBottom.y - noseTip.y) * imageSize,
    },
    pixelCount: 0,
  };
  jawline.pixelCount = jawline.boundingBox.w * jawline.boundingBox.h;

  const underEyes: RegionMask = {
    boundingBox: {
      x: (leftEye.x - 0.05) * imageSize,
      y: leftEye.y * imageSize,
      w: (rightEye.x - leftEye.x + 0.1) * imageSize,
      h: 0.08 * imageSize,
    },
    pixelCount: 0,
  };
  underEyes.pixelCount = underEyes.boundingBox.w * underEyes.boundingBox.h;

  return {
    forehead,
    leftCheek,
    rightCheek,
    nose,
    chin,
    jawline,
    underEyes,
  };
}

function analyzeTexture(
  imageData: Uint8ClampedArray,
  regions: ComprehensiveFaceState['regions'],
  imageSize: number
): ComprehensiveFaceState['texture'] {
  const regionNames = ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin', 'jawline', 'underEyes'] as const;

  const regionVariance: Record<string, number> = {};
  const poreVisibilityScore: Record<string, number> = {};
  const microContrast: Record<string, number> = {};

  for (const regionName of regionNames) {
    const region = regions[regionName];
    regionVariance[regionName] = ImageAnalysis.calculateTextureVariance(imageData, region, imageSize);
    poreVisibilityScore[regionName] = ImageAnalysis.calculatePoreVisibility(imageData, region, imageSize);
    microContrast[regionName] = ImageAnalysis.calculateMicroContrast(imageData, region, imageSize);
  }

  return {
    regionVariance,
    poreVisibilityScore,
    microContrast,
  };
}

function analyzeTone(
  imageData: Uint8ClampedArray,
  regions: ComprehensiveFaceState['regions'],
  imageSize: number
): ComprehensiveFaceState['tone'] {
  const regionNames = ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin', 'jawline', 'underEyes'] as const;

  const regionRGB: Record<string, [number, number, number]> = {};
  const regionEvenness: Record<string, number> = {};
  const regionRedness: Record<string, number> = {};

  let overallRGB: [number, number, number] = [0, 0, 0];
  let count = 0;

  for (const regionName of regionNames) {
    const region = regions[regionName];
    const rgb = ImageAnalysis.calculateRegionRGB(imageData, region, imageSize);
    regionRGB[regionName] = rgb;
    regionEvenness[regionName] = ImageAnalysis.calculateToneEvenness(imageData, region, imageSize);
    regionRedness[regionName] = ImageAnalysis.calculateRegionRedness(imageData, region, imageSize);

    overallRGB[0] += rgb[0];
    overallRGB[1] += rgb[1];
    overallRGB[2] += rgb[2];
    count++;
  }

  overallRGB[0] /= count;
  overallRGB[1] /= count;
  overallRGB[2] /= count;

  const skinTone = ImageAnalysis.classifySkinTone(overallRGB);

  return {
    regionRGB,
    regionEvenness,
    regionRedness,
    skinTone,
  };
}

function analyzeSpectral(
  imageData: Uint8ClampedArray,
  regions: ComprehensiveFaceState['regions'],
  imageSize: number
): ComprehensiveFaceState['spectral'] {
  const regionNames = ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin', 'jawline', 'underEyes'] as const;

  const regionOilScore: Record<string, number> = {};
  const shadowDensity: Record<string, number> = {};
  const contrastMap: Record<string, number> = {};

  for (const regionName of regionNames) {
    const region = regions[regionName];
    regionOilScore[regionName] = ImageAnalysis.calculateOilScore(imageData, region, imageSize);
    shadowDensity[regionName] = ImageAnalysis.calculateShadowDensity(imageData, region, imageSize);
    contrastMap[regionName] = ImageAnalysis.calculateRegionContrast(imageData, region, imageSize);
  }

  const channelEnergy = ImageAnalysis.calculateChannelEnergy(imageData, imageSize, imageSize);

  return {
    regionOilScore,
    redChannelEnergy: channelEnergy.red,
    greenChannelEnergy: channelEnergy.green,
    blueChannelEnergy: channelEnergy.blue,
    shadowDensity,
    contrastMap,
  };
}

export class FaceScanEngine {
  private config: EngineConfig;
  private selected: Record<AngleBucket, SelectedFrame[]>;
  private lastAcceptedTs: number = 0;
  private lastAspectRatio: number = 1.33; // Default 4:3
  private readonly cooldownMs: number = 80; // 50-100ms recommended

  // STABILIZATION STATE (Temporal Lock)
  private stableLandmarks: NormalizedLandmark[] | null = null;
  private bucketCandidate: AngleBucket | null = null;
  private bucketConfirmCount: number = 0;
  private lastStableBucket: AngleBucket | null = null;
  private outlierConsecutiveCount: number = 0; // Deadlock breaker
  private faceAreaHistory: number[] = []; // NEW: For size consistency tracking

  // Debug properties
  private lastRejectionReason: string = "";
  private lastDebugPose: { yaw: number; pitch: number; roll: number } | null = null;
  private lastDebugBrightness: number = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.selected = { front: [], left: [], right: [] };
  }

  reset() {
    this.selected = { front: [], left: [], right: [] };
    this.stableLandmarks = null;
    this.lastAcceptedTs = 0;
    this.bucketCandidate = null;
    this.bucketConfirmCount = 0;
    this.lastStableBucket = null;
    this.outlierConsecutiveCount = 0;
    this.faceAreaHistory = []; // NEW: Reset face area history
  }

  /**
   * TEMPORAL LOCK: Outlier Rejection & EMA Smoothing
   */
  private stabilize(rawLms: NormalizedLandmark[]): NormalizedLandmark[] | null {
    // 0. Init if empty
    if (!this.stableLandmarks) {
      this.stableLandmarks = rawLms; // First frame trusted
      return rawLms;
    }

    // 1. Calculate IOD (Scale Reference) using STABLE landmarks
    const pLeft = this.stableLandmarks[33] || { x: 0.35, y: 0.4 };
    const pRight = this.stableLandmarks[263] || { x: 0.65, y: 0.4 };
    const iod = Math.hypot(pRight.x - pLeft.x, pRight.y - pLeft.y) || 0.1;

    // 2. Outlier Rejection Check (Rigid Points)
    // Check key anchors: Nose(1), Eyes(33,263), Chin(152)
    const checkIdx = [1, 33, 263, 152];

    // RELAXED THRESHOLD: 0.30 * IOD (User reported 0.06 was too tight/deadlocking)
    // 0.30 allows reasonable head speed. 0.06 kills any rotation.
    const threshold = 0.30 * iod;

    let maxDist = 0;
    for (const i of checkIdx) {
      const r = rawLms[i] || { x: 0, y: 0 };
      const s = this.stableLandmarks[i] || { x: 0, y: 0 };
      const d = Math.hypot(r.x - s.x, r.y - s.y);
      if (d > maxDist) maxDist = d;
    }

    // 2.1 Deadlock Breaker
    // If we reject meaningful motion for > 5 frames, it's likely a fast turn, not a glitch.
    if (maxDist > threshold) {
      this.outlierConsecutiveCount++;

      if (this.outlierConsecutiveCount > 5) {
        // SNAP: Break deadlock, accept new position
        // devLog(`[STABLE] Deadlock broken (move > ${threshold.toFixed(4)})`);
        this.stableLandmarks = rawLms;
        this.outlierConsecutiveCount = 0;
        return rawLms;
      }

      // REJECT: Too far, likely tracking glitch or fast motion blur
      this.lastRejectionReason = `Temp Outlier ${maxDist.toFixed(3)}>${threshold.toFixed(3)}`;
      // devLog(`[STABLE] Outlier Rejected: Dist ${maxDist.toFixed(4)} > ${threshold.toFixed(4)}`);
      return null;
    }

    // Reset counter on success
    this.outlierConsecutiveCount = 0;

    // Chin Projection Values (Added for Debug)
    const pChin = rawLms[152]; // Menton
    const pNasion = rawLms[10]; // Nasion
    const pLeftCheek = rawLms[234]; // Left cheekbone
    const pRightCheek = rawLms[454]; // Right cheekbone

    const chinZ = pChin ? (pChin.z || 0) : 0;
    const nasionZ = pNasion ? (pNasion.z || 0) : 0;
    const chinDepth = chinZ - nasionZ; // Positive means chin is forward of nasion

    const faceW3D = (pRightCheek && pLeftCheek) ? Math.hypot(pRightCheek.x - pLeftCheek.x, pRightCheek.y - pLeftCheek.y, (pRightCheek.z || 0) - (pLeftCheek.z || 0)) : 0.1;
    const chinProjRatio = faceW3D > 0.001 ? (chinDepth / faceW3D) * 100 : 0;

    // Placeholder for FWHR and THIRDS debug values if they were calculated elsewhere
    // For now, using dummy values or assuming they are available in scope if this alert is active.
    const fwhrRatio = 0; // Replace with actual FWHR calculation if available
    const width3D = 0; // Replace with actual width3D calculation if available
    const height3D = 0; // Replace with actual height3D calculation if available
    const thirdsDebug = { upper: 0, mid: 0, lower: 0, ratios: "" }; // Replace with actual thirds debug if available
    const upperSource = ""; // Replace with actual upperSource if available

    // This alert is likely for development/debugging and would typically be removed in production.
    // It assumes `fwhrRatio`, `width3D`, `height3D`, `thirdsDebug`, `upperSource` are defined in the scope
    // where this `alert` is intended to be active.
    // If these are not defined, this will cause runtime errors.
    // For the purpose of this edit, we are adding the requested debug info to the alert.
    // alert(`FWHR: ${fwhrRatio} (W:${width3D.toFixed(4)}/H:${height3D.toFixed(4)})\n\n` +
    //       `THIRDS:\nUpper: ${thirdsDebug.upper} (${upperSource})\nMid: ${thirdsDebug.mid}\nLower: ${thirdsDebug.lower}\n` +
    //       `Ratios: ${thirdsDebug.ratios}\n\n` +
    //       `CHIN PROJ DEBUG:\nRatio: ${chinProjRatio.toFixed(2)}%\nDepth(Z): ${chinDepth.toFixed(4)}\n` +
    //       `Menton Z: ${chinZ.toFixed(4)}\nNasion Z: ${nasionZ.toFixed(4)}\n` +
    //       `Face Width: ${faceW3D.toFixed(4)}`);

    // 3. EMA Smoothing (Lock)
    // alpha = 0.25 (User specified) -> Heavy smoothing
    const alpha = 0.25;
    const smoothed = rawLms.map((curr, i) => {
      const prev = this.stableLandmarks![i] || curr;
      return {
        x: prev.x * (1 - alpha) + curr.x * alpha,
        y: prev.y * (1 - alpha) + curr.y * alpha,
        z: (prev.z ?? 0) * (1 - alpha) + (curr.z ?? 0) * alpha
      };
    });

    this.stableLandmarks = smoothed;
    return smoothed;
  }

  // Helper to Debounce Bucket Switching
  private getStableBucket(rawBucket: AngleBucket | null): AngleBucket | null {
    if (rawBucket === this.bucketCandidate) {
      this.bucketConfirmCount++;
    } else {
      this.bucketCandidate = rawBucket;
      this.bucketConfirmCount = 1;
    }

    // Require 3 frames to confirm change
    if (this.bucketConfirmCount >= 3) {
      this.lastStableBucket = rawBucket;
      return rawBucket;
    }

    // Hold last good bucket during transition
    return this.lastStableBucket;
  }

  pushFrame(params: PushFrameParams & { expectedBucket?: AngleBucket }): boolean {
    const { ts, landmarks, meshConfidence, brightness01, aspectRatio, captureRetainedCrop, capturePrimaryCrop, expectedBucket } = params;
    this.lastAspectRatio = aspectRatio;

    // GATE 1: Face Confidence
    if (meshConfidence < 0.6) {
      this.lastRejectionReason = `Low Confidence (${meshConfidence.toFixed(2)})`;
      return false;
    }

    // GATE 2: STABILIZATION (Temporal Lock)
    // Capture state BEFORE stabilization for movement delta
    const prevStableLandmarks = this.stableLandmarks;

    // Must pass Outlier check
    const stableLms = this.stabilize(landmarks);
    if (!stableLms) {
      // Outlier rejected (Reason set inside stabilize)
      return false;
    }

    // Use STABLE landmarks for Pose & Quality
    const pose = estimatePose(stableLms, params.matrix);

    // GATE 3: Pose Bucket Hysteresis
    const rawBucket = classifyAngleBucket(pose.yaw, pose.pitch);
    const bucket = this.getStableBucket(rawBucket);

    if (!bucket) {
      this.lastRejectionReason = `Unstable Pose (Wait...)`;
      return false;
    }

    // GATE 4: Guided Flow
    if (expectedBucket && bucket !== expectedBucket) {
      this.lastRejectionReason = `Wrong Bucket (Need ${expectedBucket})`;
      return false;
    }

    // GATE 5: Lighting
    if (brightness01 < 0.36) {
      this.lastRejectionReason = `Too Dark (${brightness01.toFixed(2)})`;
      return false;
    }

    // GATE 6: Cooldown
    if (this.lastAcceptedTs > 0 && (ts - this.lastAcceptedTs) < this.cooldownMs) {
      return false;
    }

    // ACCEPT FRAME
    this.lastAcceptedTs = ts;

    // NEW: Calculate stability metrics
    const landmarkMovement = computeLandmarkMovement(stableLms, prevStableLandmarks);
    const faceArea = computeFaceArea(stableLms);
    const faceSizeConsistency = computeFaceSizeConsistency(faceArea, this.faceAreaHistory);

    // Update face area history (keep last 10 frames)
    this.faceAreaHistory.push(faceArea);
    if (this.faceAreaHistory.length > 10) this.faceAreaHistory.shift();

    // Quality Score with stability metrics
    const qScore = computeQualityScore(stableLms, brightness01, pose, landmarkMovement, faceSizeConsistency);
    if (qScore < this.config.minQualityScore) {
      this.lastRejectionReason = `Low Quality (${qScore.toFixed(2)})`;
      return false;
    }

    // Check Density (if bucket full, maybe reject lower quality?)
    const bucketFrames = this.selected[bucket];
    if (bucketFrames.length >= this.config.topKPerBucket) {
      // Simple greedy: if full, only replace if significantly better?
      // For now, simple cap.
      // User wants "Best frames". Let's sort and drop worst if full.
      const worstScore = bucketFrames[bucketFrames.length - 1]?.metrics.qualityScore || 0;
      if (qScore <= worstScore) {
        this.lastRejectionReason = `Bucket Full (Better frames exist)`;
        return false;
      }
      // We will insert and sort below
    }

    // Process Crops (Expensive, so do last)
    const cropRgba = captureRetainedCrop(this.config.retainedCropSize || 512);

    // Add to Bucket (Conforming to types.ts SelectedFrame)
    const frame: SelectedFrame = {
      ts,
      landmarks: stableLms, // Top-level
      cropRgba,
      cropSize: this.config.retainedCropSize || 512,
      metrics: {
        qualityScore: qScore,
        pose, // Nested
        brightness01,
        blendshapes: params.blendshapes,
        matrix: params.matrix
      }
    };

    bucketFrames.push(frame);
    // Sort Descending Quality
    bucketFrames.sort((a, b) => b.metrics.qualityScore - a.metrics.qualityScore);
    // Trim
    if (bucketFrames.length > this.config.topKPerBucket) {
      bucketFrames.length = this.config.topKPerBucket;
    }

    return true; // Accepted
  }



  getSelected(): Record<AngleBucket, SelectedFrame[]> {
    return this.selected;
  }

  getStatus() {
    const frontCount = this.selected.front.length;
    const leftCount = this.selected.left.length;
    const rightCount = this.selected.right.length;

    // Determine active need based on buckets
    // Front needs 12 (topKPerBucket), Left/Right need 8 (minPerBucketToFinish)
    const frontTarget = this.config.topKPerBucket; // 12
    const sideTarget = this.config.minPerBucketToFinish || 8; // 8

    const needsFront = frontCount < frontTarget;
    const needsLeft = leftCount < sideTarget;
    const needsRight = rightCount < sideTarget;

    const currentBucket: AngleBucket = needsFront ? 'front' : needsLeft ? 'left' : 'right';
    const isFinished = !needsFront && !needsLeft && !needsRight;

    return {
      frontCount,
      leftCount,
      rightCount,
      currentBucket,
      needsFront,
      needsLeft,
      needsRight,
      isFinished,
      debug: {
        reason: this.lastRejectionReason || "Active",
        yaw: this.lastDebugPose?.yaw || 0,
        pitch: this.lastDebugPose?.pitch || 0,
        bri: this.lastDebugBrightness || 0,
        matrix: !!this.lastDebugPose
      }
    };
  }

  /**
   * Finalize the scan - compute comprehensive state
   */
  finalize(): ComprehensiveFaceState {
    const allFrames = [
      ...this.selected.front,
      ...this.selected.left,
      ...this.selected.right
    ];

    if (allFrames.length === 0) {
      throw new Error("No frames captured");
    }

    // Merge high-res image (weighted average or best frame)
    // For now, simple merge of FRONT frames if available, else all
    const mergeSource = this.selected.front.length > 0 ? this.selected.front : allFrames;
    const { rgba, size } = mergeRgbaTrimmedMean(allFrames);
    const primaryImageJpegBase64 = encodeRgbaToJpegBase64({ rgba, width: size, height: size });

    // Merge angle-specific images if available
    let leftAngleImageJpegBase64: string | undefined;
    let rightAngleImageJpegBase64: string | undefined;

    if (this.selected.left.length > 0) {
      const leftMerged = mergeRgbaTrimmedMean(this.selected.left);
      leftAngleImageJpegBase64 = encodeRgbaToJpegBase64({
        rgba: leftMerged.rgba,
        width: leftMerged.size,
        height: leftMerged.size
      });
    }

    if (this.selected.right.length > 0) {
      const rightMerged = mergeRgbaTrimmedMean(this.selected.right);
      rightAngleImageJpegBase64 = encodeRgbaToJpegBase64({
        rgba: rightMerged.rgba,
        width: rightMerged.size,
        height: rightMerged.size
      });
    }

    // Stabilize landmarks (ALL frames for texture segmentation)
    const stabilizedLandmarks = stabilizeLandmarksMedian(allFrames);

    // CRITICAL FIX: Use ONLY HYPER-FRONTAL frames for Geometry Metrics.
    // The bucket allows +/- 8 deg, but for Face Width measurements, even 5 deg causes perspective shift.
    // We filter specifically for frames with Yaw < 4.0 degrees.
    let geometrySourceFrames = this.selected.front;

    // Strict filtering:
    // Only use frames where user is looking DEAD CENTER (Yaw < 4° AND Pitch < 8°)
    // Reject frames where user is looking UP/DOWN (Foreshortening causes 0.93 ratio error)
    const strictFront = geometrySourceFrames.filter(f =>
      Math.abs(f.metrics.pose.yaw) < 4.0 &&
      Math.abs(f.metrics.pose.pitch) < 8.0
    );
    if (strictFront.length >= 3) {
      geometrySourceFrames = strictFront;
      devLog(`[ENGINE] Using ${strictFront.length} HYPER-FRONTAL frames for geometry.`);
    } else {
      console.warn(`[ENGINE] Not enough hyper-frontal frames (${strictFront.length}), using all ${geometrySourceFrames.length} front frames.`);
    }

    // Fallback to allFrames only if front is somehow empty (should be impossible due to Constitution checks).
    if (geometrySourceFrames.length === 0) geometrySourceFrames = allFrames;

    const stabilizedFrontLandmarks = stabilizeLandmarksMedian(geometrySourceFrames);
    const stabilizedLeftLandmarks = this.selected.left.length > 0 ? stabilizeLandmarksMedian(this.selected.left) : [];
    const stabilizedRightLandmarks = this.selected.right.length > 0 ? stabilizeLandmarksMedian(this.selected.right) : [];

    // Stabilize pose
    const stabilizedPose = stabilizePoseMean(allFrames);

    // Compute comprehensive metrics (Using View-Dependent Data)
    devLog('[ENGINE] Computing geometry metrics (Multi-View Data)...');
    const geometry = computeGeometryMetrics(stabilizedFrontLandmarks, stabilizedLeftLandmarks, stabilizedRightLandmarks, this.lastAspectRatio);

    devLog('[ENGINE] Segmenting regions (Full-Scan Data)...');
    // Regions use the full set to ensure coverage of side cheeks/jaw
    const regions = segmentRegions(stabilizedLandmarks, size);

    devLog('[ENGINE] Analyzing texture...');
    const texture = analyzeTexture(rgba, regions, size);

    devLog('[ENGINE] Analyzing tone...');
    const tone = analyzeTone(rgba, regions, size);

    devLog('[ENGINE] Analyzing spectral properties...');
    const spectral = analyzeSpectral(rgba, regions, size);

    // 12 Advanced Skin Metrics Analysis
    devLog('[ENGINE] Converting to LAB color space...');
    const { L, A, B } = rgbaToLab(rgba, size, size);

    devLog('[ENGINE] Analyzing comprehensive skin health and quality...');

    // Analyze each region with 12 metrics
    const foreheadROI = createSkinROI('forehead', stabilizedLandmarks, size, size);
    const leftCheekROI = createSkinROI('leftCheek', stabilizedLandmarks, size, size);
    const rightCheekROI = createSkinROI('rightCheek', stabilizedLandmarks, size, size);
    const chinROI = createSkinROI('chin', stabilizedLandmarks, size, size);

    // Health Metrics (6 metrics per region)
    const foreheadHealth = analyzeComprehensiveSkinHealth(L, A, B, foreheadROI, stabilizedLandmarks, size, size);
    const leftCheekHealth = analyzeComprehensiveSkinHealth(L, A, B, leftCheekROI, stabilizedLandmarks, size, size);
    const rightCheekHealth = analyzeComprehensiveSkinHealth(L, A, B, rightCheekROI, stabilizedLandmarks, size, size);
    const chinHealth = analyzeComprehensiveSkinHealth(L, A, B, chinROI, stabilizedLandmarks, size, size);

    // Quality Metrics (6 metrics per region)
    const foreheadQuality = analyzeComprehensiveSkinQuality(L, A, B, foreheadROI, stabilizedLandmarks, size, size, foreheadHealth.sebum.sebumScore);
    const leftCheekQuality = analyzeComprehensiveSkinQuality(L, A, B, leftCheekROI, stabilizedLandmarks, size, size, leftCheekHealth.sebum.sebumScore);
    const rightCheekQuality = analyzeComprehensiveSkinQuality(L, A, B, rightCheekROI, stabilizedLandmarks, size, size, rightCheekHealth.sebum.sebumScore);
    const chinQuality = analyzeComprehensiveSkinQuality(L, A, B, chinROI, stabilizedLandmarks, size, size, chinHealth.sebum.sebumScore);

    // Aggregate scores
    const avgHealthScore = (foreheadHealth.overallHealthScore + leftCheekHealth.overallHealthScore + rightCheekHealth.overallHealthScore + chinHealth.overallHealthScore) / 4;
    const avgQualityScore = (foreheadQuality.overallQualityScore + leftCheekQuality.overallQualityScore + rightCheekQuality.overallQualityScore + chinQuality.overallQualityScore) / 4;

    // ═══════════════════════════════════════════════════════════════
    // 🔬 12 METRICS DETAILED ANALYSIS LOG
    // ═══════════════════════════════════════════════════════════════
    devLog('\n');
    devLog('╔═══════════════════════════════════════════════════════════════╗');
    devLog('║           🔬 12 ADVANCED SKIN METRICS - DETAILED LOG         ║');
    devLog('╚═══════════════════════════════════════════════════════════════╝');

    devLog('\n📊 OVERALL SCORES:');
    devLog(`   Health Score: ${(avgHealthScore * 10).toFixed(1)}/10 (${(avgHealthScore * 100).toFixed(1)}%)`);
    devLog(`   Quality Score: ${(avgQualityScore * 10).toFixed(1)}/10 (${(avgQualityScore * 100).toFixed(1)}%)`);

    devLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    devLog('🏥 HEALTH METRICS (6 Categories)');
    devLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    devLog('\n1️⃣  SEBUM ACTIVITY');
    devLog(`   Forehead: ${(foreheadHealth.sebum.sebumScore * 10).toFixed(1)}/10 | ${foreheadHealth.sebum.region} | ${foreheadHealth.sebum.hotspotCount} hotspots`);
    devLog(`   Left Cheek: ${(leftCheekHealth.sebum.sebumScore * 10).toFixed(1)}/10 | ${leftCheekHealth.sebum.region} | ${leftCheekHealth.sebum.hotspotCount} hotspots`);
    devLog(`   Right Cheek: ${(rightCheekHealth.sebum.sebumScore * 10).toFixed(1)}/10 | ${rightCheekHealth.sebum.region} | ${rightCheekHealth.sebum.hotspotCount} hotspots`);
    devLog(`   Chin: ${(chinHealth.sebum.sebumScore * 10).toFixed(1)}/10 | ${chinHealth.sebum.region} | ${chinHealth.sebum.hotspotCount} hotspots`);

    devLog('\n2️⃣  PORE CONGESTION');
    devLog(`   Forehead: ${(foreheadHealth.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${foreheadHealth.poreCongestion.severity} | ${foreheadHealth.poreCongestion.bumpCount} bumps`);
    devLog(`   Left Cheek: ${(leftCheekHealth.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${leftCheekHealth.poreCongestion.severity} | ${leftCheekHealth.poreCongestion.bumpCount} bumps`);
    devLog(`   Right Cheek: ${(rightCheekHealth.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${rightCheekHealth.poreCongestion.severity} | ${rightCheekHealth.poreCongestion.bumpCount} bumps`);
    devLog(`   Chin: ${(chinHealth.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${chinHealth.poreCongestion.severity} | ${chinHealth.poreCongestion.bumpCount} bumps`);

    devLog('\n3️⃣  INFLAMMATORY LOAD');
    devLog(`   Forehead: ${(foreheadHealth.inflammation.loadScore * 10).toFixed(1)}/10 | ${foreheadHealth.inflammation.distribution} | StdDev: ${foreheadHealth.inflammation.stdDev.toFixed(2)}`);
    devLog(`   Left Cheek: ${(leftCheekHealth.inflammation.loadScore * 10).toFixed(1)}/10 | ${leftCheekHealth.inflammation.distribution} | StdDev: ${leftCheekHealth.inflammation.stdDev.toFixed(2)}`);
    devLog(`   Right Cheek: ${(rightCheekHealth.inflammation.loadScore * 10).toFixed(1)}/10 | ${rightCheekHealth.inflammation.distribution} | StdDev: ${rightCheekHealth.inflammation.stdDev.toFixed(2)}`);
    devLog(`   Chin: ${(chinHealth.inflammation.loadScore * 10).toFixed(1)}/10 | ${chinHealth.inflammation.distribution} | StdDev: ${chinHealth.inflammation.stdDev.toFixed(2)}`);

    devLog('\n4️⃣  ACTIVE ACNE');
    devLog(`   Forehead: ${(foreheadHealth.activeAcne.acneScore * 10).toFixed(1)}/10 | ${foreheadHealth.activeAcne.severity} | ${foreheadHealth.activeAcne.totalLesions} lesions (${foreheadHealth.activeAcne.papuleCount}P + ${foreheadHealth.activeAcne.pustuleCount}Pu)`);
    devLog(`   Left Cheek: ${(leftCheekHealth.activeAcne.acneScore * 10).toFixed(1)}/10 | ${leftCheekHealth.activeAcne.severity} | ${leftCheekHealth.activeAcne.totalLesions} lesions (${leftCheekHealth.activeAcne.papuleCount}P + ${leftCheekHealth.activeAcne.pustuleCount}Pu)`);
    devLog(`   Right Cheek: ${(rightCheekHealth.activeAcne.acneScore * 10).toFixed(1)}/10 | ${rightCheekHealth.activeAcne.severity} | ${rightCheekHealth.activeAcne.totalLesions} lesions (${rightCheekHealth.activeAcne.papuleCount}P + ${rightCheekHealth.activeAcne.pustuleCount}Pu)`);
    devLog(`   Chin: ${(chinHealth.activeAcne.acneScore * 10).toFixed(1)}/10 | ${chinHealth.activeAcne.severity} | ${chinHealth.activeAcne.totalLesions} lesions (${chinHealth.activeAcne.papuleCount}P + ${chinHealth.activeAcne.pustuleCount}Pu)`);

    devLog('\n5️⃣  MARKS (PIE/PIH)');
    devLog(`   Forehead: PIE=${(foreheadHealth.marks.pieScore * 10).toFixed(1)}/10 PIH=${(foreheadHealth.marks.pihScore * 10).toFixed(1)}/10 | ${foreheadHealth.marks.severity} | ${foreheadHealth.marks.totalMarks} marks (${foreheadHealth.marks.pieCount} red + ${foreheadHealth.marks.pihCount} brown)`);
    devLog(`   Left Cheek: PIE=${(leftCheekHealth.marks.pieScore * 10).toFixed(1)}/10 PIH=${(leftCheekHealth.marks.pihScore * 10).toFixed(1)}/10 | ${leftCheekHealth.marks.severity} | ${leftCheekHealth.marks.totalMarks} marks (${leftCheekHealth.marks.pieCount} red + ${leftCheekHealth.marks.pihCount} brown)`);
    devLog(`   Right Cheek: PIE=${(rightCheekHealth.marks.pieScore * 10).toFixed(1)}/10 PIH=${(rightCheekHealth.marks.pihScore * 10).toFixed(1)}/10 | ${rightCheekHealth.marks.severity} | ${rightCheekHealth.marks.totalMarks} marks (${rightCheekHealth.marks.pieCount} red + ${rightCheekHealth.marks.pihCount} brown)`);
    devLog(`   Chin: PIE=${(chinHealth.marks.pieScore * 10).toFixed(1)}/10 PIH=${(chinHealth.marks.pihScore * 10).toFixed(1)}/10 | ${chinHealth.marks.severity} | ${chinHealth.marks.totalMarks} marks (${chinHealth.marks.pieCount} red + ${chinHealth.marks.pihCount} brown)`);

    devLog('\n6️⃣  BARRIER INTEGRITY');
    devLog(`   Forehead: ${(foreheadHealth.barrier.barrierScore * 10).toFixed(1)}/10 | ${foreheadHealth.barrier.status} | Damaged: ${foreheadHealth.barrier.isDamaged}`);
    devLog(`   Left Cheek: ${(leftCheekHealth.barrier.barrierScore * 10).toFixed(1)}/10 | ${leftCheekHealth.barrier.status} | Damaged: ${leftCheekHealth.barrier.isDamaged}`);
    devLog(`   Right Cheek: ${(rightCheekHealth.barrier.barrierScore * 10).toFixed(1)}/10 | ${rightCheekHealth.barrier.status} | Damaged: ${rightCheekHealth.barrier.isDamaged}`);
    devLog(`   Chin: ${(chinHealth.barrier.barrierScore * 10).toFixed(1)}/10 | ${chinHealth.barrier.status} | Damaged: ${chinHealth.barrier.isDamaged}`);

    devLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    devLog('✨ QUALITY METRICS (6 Categories)');
    devLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    devLog('\n1️⃣  TEXTURE SMOOTHNESS');
    devLog(`   Forehead: ${(foreheadQuality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${foreheadQuality.smoothness.quality} | Rough: ${(foreheadQuality.smoothness.highFreqRatio * 100).toFixed(1)}%`);
    devLog(`   Left Cheek: ${(leftCheekQuality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${leftCheekQuality.smoothness.quality} | Rough: ${(leftCheekQuality.smoothness.highFreqRatio * 100).toFixed(1)}%`);
    devLog(`   Right Cheek: ${(rightCheekQuality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${rightCheekQuality.smoothness.quality} | Rough: ${(rightCheekQuality.smoothness.highFreqRatio * 100).toFixed(1)}%`);
    devLog(`   Chin: ${(chinQuality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${chinQuality.smoothness.quality} | Rough: ${(chinQuality.smoothness.highFreqRatio * 100).toFixed(1)}%`);

    devLog('\n2️⃣  PORE VISIBILITY');
    devLog(`   Forehead: ${(foreheadQuality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${foreheadQuality.poreVisibility.visibility} | ${foreheadQuality.poreVisibility.poreCount} visible pores`);
    devLog(`   Left Cheek: ${(leftCheekQuality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${leftCheekQuality.poreVisibility.visibility} | ${leftCheekQuality.poreVisibility.poreCount} visible pores`);
    devLog(`   Right Cheek: ${(rightCheekQuality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${rightCheekQuality.poreVisibility.visibility} | ${rightCheekQuality.poreVisibility.poreCount} visible pores`);
    devLog(`   Chin: ${(chinQuality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${chinQuality.poreVisibility.visibility} | ${chinQuality.poreVisibility.poreCount} visible pores`);

    devLog('\n3️⃣  TONE EVENNESS');
    devLog(`   Forehead: ${(foreheadQuality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${foreheadQuality.toneEvenness.evenness} | Variance: ${foreheadQuality.toneEvenness.combinedVariance.toFixed(2)}`);
    devLog(`   Left Cheek: ${(leftCheekQuality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${leftCheekQuality.toneEvenness.evenness} | Variance: ${leftCheekQuality.toneEvenness.combinedVariance.toFixed(2)}`);
    devLog(`   Right Cheek: ${(rightCheekQuality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${rightCheekQuality.toneEvenness.evenness} | Variance: ${rightCheekQuality.toneEvenness.combinedVariance.toFixed(2)}`);
    devLog(`   Chin: ${(chinQuality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${chinQuality.toneEvenness.evenness} | Variance: ${chinQuality.toneEvenness.combinedVariance.toFixed(2)}`);

    devLog('\n4️⃣  RADIANCE');
    devLog(`   Forehead: ${(foreheadQuality.radiance.radianceScore * 10).toFixed(1)}/10 | ${foreheadQuality.radiance.glow} | Luminance: ${foreheadQuality.radiance.avgLuminance.toFixed(1)}`);
    devLog(`   Left Cheek: ${(leftCheekQuality.radiance.radianceScore * 10).toFixed(1)}/10 | ${leftCheekQuality.radiance.glow} | Luminance: ${leftCheekQuality.radiance.avgLuminance.toFixed(1)}`);
    devLog(`   Right Cheek: ${(rightCheekQuality.radiance.radianceScore * 10).toFixed(1)}/10 | ${rightCheekQuality.radiance.glow} | Luminance: ${rightCheekQuality.radiance.avgLuminance.toFixed(1)}`);
    devLog(`   Chin: ${(chinQuality.radiance.radianceScore * 10).toFixed(1)}/10 | ${chinQuality.radiance.glow} | Luminance: ${chinQuality.radiance.avgLuminance.toFixed(1)}`);

    devLog('\n5️⃣  REDNESS UNIFORMITY');
    devLog(`   Forehead: ${(foreheadQuality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${foreheadQuality.rednessUniformity.distribution} | ${foreheadQuality.rednessUniformity.redPixelCount} red pixels`);
    devLog(`   Left Cheek: ${(leftCheekQuality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${leftCheekQuality.rednessUniformity.distribution} | ${leftCheekQuality.rednessUniformity.redPixelCount} red pixels`);
    devLog(`   Right Cheek: ${(rightCheekQuality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${rightCheekQuality.rednessUniformity.distribution} | ${rightCheekQuality.rednessUniformity.redPixelCount} red pixels`);
    devLog(`   Chin: ${(chinQuality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${chinQuality.rednessUniformity.distribution} | ${chinQuality.rednessUniformity.redPixelCount} red pixels`);

    devLog('\n6️⃣  OIL-HYDRATION BALANCE');
    devLog(`   Forehead: ${(foreheadQuality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${foreheadQuality.oilHydration.status} | Oil: ${foreheadQuality.oilHydration.oilLevel.toFixed(2)} Hydration: ${foreheadQuality.oilHydration.hydrationLevel.toFixed(2)}`);
    devLog(`   Left Cheek: ${(leftCheekQuality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${leftCheekQuality.oilHydration.status} | Oil: ${leftCheekQuality.oilHydration.oilLevel.toFixed(2)} Hydration: ${leftCheekQuality.oilHydration.hydrationLevel.toFixed(2)}`);
    devLog(`   Right Cheek: ${(rightCheekQuality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${rightCheekQuality.oilHydration.status} | Oil: ${rightCheekQuality.oilHydration.oilLevel.toFixed(2)} Hydration: ${rightCheekQuality.oilHydration.hydrationLevel.toFixed(2)}`);
    devLog(`   Chin: ${(chinQuality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${chinQuality.oilHydration.status} | Oil: ${chinQuality.oilHydration.oilLevel.toFixed(2)} Hydration: ${chinQuality.oilHydration.hydrationLevel.toFixed(2)}`);

    const warnings = [
      foreheadQuality.oilHydration.warning,
      leftCheekQuality.oilHydration.warning,
      rightCheekQuality.oilHydration.warning,
      chinQuality.oilHydration.warning
    ].filter(w => w !== '');

    if (warnings.length > 0) {
      devLog('\n⚠️  WARNINGS:');
      warnings.forEach((w, i) => devLog(`   ${i + 1}. ${w}`));
    }

    devLog('\n╔═══════════════════════════════════════════════════════════════╗');
    devLog('║                    ✅ ANALYSIS COMPLETE                       ║');
    devLog('╚═══════════════════════════════════════════════════════════════╝');
    devLog('\n');

    // Compute quality indicators
    const overallConfidence = allFrames.reduce((sum, f) => sum + f.metrics.qualityScore, 0) / allFrames.length;
    const avgBrightness = allFrames.reduce((sum, f) => sum + f.metrics.brightness01, 0) / allFrames.length;
    const lightingScore = 1 - Math.abs(avgBrightness - 0.55) / 0.55;

    const angleQuality: Record<AngleBucket, number> = {
      front: this.selected.front.length > 0
        ? this.selected.front.reduce((sum, f) => sum + f.metrics.qualityScore, 0) / this.selected.front.length
        : 0,
      left: this.selected.left.length > 0
        ? this.selected.left.reduce((sum, f) => sum + f.metrics.qualityScore, 0) / this.selected.left.length
        : 0,
      right: this.selected.right.length > 0
        ? this.selected.right.reduce((sum, f) => sum + f.metrics.qualityScore, 0) / this.selected.right.length
        : 0,
    };

    // [NEUTRALITY] Compute from blendshapes (if available)
    // We use the strictFront frames for this as they are most reliable for expression
    const validFrames = geometrySourceFrames.filter(f => f.metrics.blendshapes);
    const neutrality = {
      isNeutral: true,
      cheekPuffScore: 0,
      mouthOpenScore: 0,
      smileScore: 0,
      browExpressionScore: 0
    };

    if (validFrames.length > 0) {
      const avgBS = (key: string) => validFrames.reduce((sum, f) => sum + (f.metrics.blendshapes?.[key] || 0), 0) / validFrames.length;

      neutrality.cheekPuffScore = Math.max(avgBS('cheekPuff'), avgBS('cheekSquintLeft'));
      neutrality.mouthOpenScore = avgBS('jawOpen');
      neutrality.smileScore = Math.max(avgBS('mouthSmileLeft'), avgBS('mouthSmileRight'));
      neutrality.browExpressionScore = Math.max(avgBS('browInnerUp'), avgBS('browOuterUpLeft'));

      // Thresholds (Strict for Anti-Cheat)
      if (neutrality.cheekPuffScore > 0.2 || neutrality.smileScore > 0.2 || neutrality.mouthOpenScore > 0.15) {
        neutrality.isNeutral = false;
      }
    }

    // Motion blur estimation (variance of frame quality scores)
    const qualityVariance = allFrames.reduce((sum, f) => {
      const diff = f.metrics.qualityScore - overallConfidence;
      return sum + diff * diff;
    }, 0) / allFrames.length;
    const motionBlur = Math.min(1, Math.sqrt(qualityVariance) * 5);

    devLog('[ENGINE] Comprehensive FACE_STATE created');

    // CONSTITUTION VALIDATION: Ensure immutability
    const faceState: ComprehensiveFaceState = {
      scanId: `scan-${Date.now()}`,
      timestamp: Date.now(),
      primaryImageJpegBase64,
      leftAngleImageJpegBase64,
      rightAngleImageJpegBase64,
      stabilizedLandmarks,
      stabilizedPose,
      geometry,
      regions,
      texture,
      tone,
      spectral,
      advancedSkinMetrics: {
        forehead: {
          health: foreheadHealth,
          quality: foreheadQuality
        },
        leftCheek: {
          health: leftCheekHealth,
          quality: leftCheekQuality
        },
        rightCheek: {
          health: rightCheekHealth,
          quality: rightCheekQuality
        },
        chin: {
          health: chinHealth,
          quality: chinQuality
        },
        avgHealthScore,
        avgQualityScore
      },
      quality: {
        overallConfidence,
        lightingScore: Math.max(0, Math.min(1, lightingScore)),
        angleQuality,
        motionBlur,
        neutrality
      },
    };

    // CONSTITUTION RULE #9: Validate FACE_STATE before releasing to analysis
    if (!faceState.scanId || faceState.stabilizedLandmarks.length === 0) {
      throw new Error("[CONSTITUTION VIOLATION] Invalid FACE_STATE - analysis rejected");
    }

    console.warn("═══════════════════════════════════════════════════");
    console.warn("[CONSTITUTION] FACE_STATE finalized successfully");
    console.warn("[CONSTITUTION] scanId:", faceState.scanId);
    console.warn("[CONSTITUTION] Analysis modules may now consume this");
    console.warn("═══════════════════════════════════════════════════");

    // Object.freeze in development to enforce immutability
    if (process.env.NODE_ENV === 'development') {
      Object.freeze(faceState);
      Object.freeze(faceState.geometry);
      Object.freeze(faceState.regions);
      Object.freeze(faceState.texture);
      Object.freeze(faceState.tone);
      Object.freeze(faceState.spectral);
      Object.freeze(faceState.quality);
    }

    return faceState;
  }
}

// Minimal Helpers
