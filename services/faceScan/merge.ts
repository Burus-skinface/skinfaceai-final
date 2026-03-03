import type { AngleBucket, NormalizedLandmark, PoseEstimateDeg, SelectedFrame } from "./types";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Merge RGBA frames using TRIMMED MEAN (20% cut)
 * 
 * For skin metrics (pore, redness, oil, texture):
 * - Same ROI per frame
 * - Same mask per frame
 * - Drop worst 20% and best 20%
 * - Average the remaining 60%
 * 
 * This is more robust than simple min/max removal.
 */
export function mergeRgbaTrimmedMean(frames: SelectedFrame[], trimPercent = 0.20): { rgba: Uint8ClampedArray; size: number } {
  if (frames.length === 0) {
    throw new Error("mergeRgbaTrimmedMean: no frames");
  }

  const size = frames[0].cropSize;
  for (const f of frames) {
    if (f.cropSize !== size) throw new Error("mergeRgbaTrimmedMean: inconsistent crop sizes");
  }

  const n = frames.length;
  const out = new Uint8ClampedArray(size * size * 4);

  // For each channel of each pixel
  for (let i = 0; i < out.length; i++) {
    const values: number[] = [];

    // Collect values from all frames
    for (let j = 0; j < n; j++) {
      values.push(frames[j].cropRgba[i]);
    }

    // Sort values
    values.sort((a, b) => a - b);

    // Trim 20% from each end
    const trimCount = Math.floor(n * trimPercent);
    const startIdx = Math.min(trimCount, Math.floor(n / 3)); // Safety: don't trim more than 1/3
    const endIdx = Math.max(n - trimCount, Math.ceil(2 * n / 3)); // Safety: keep at least 1/3

    // Calculate mean of middle values
    let sum = 0;
    let count = 0;
    for (let k = startIdx; k < endIdx; k++) {
      sum += values[k];
      count++;
    }

    // Fallback to median if trimming removed everything
    out[i] = count > 0 ? Math.round(sum / count) : values[Math.floor(n / 2)];
  }

  // Force alpha opaque (avoid weird browser alpha behavior)
  for (let p = 3; p < out.length; p += 4) out[p] = 255;

  return { rgba: out, size };
}

export function encodeRgbaToJpegBase64(params: {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  quality?: number; // 0..1
}): string {
  const { rgba, width, height, quality = 0.92 } = params;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("encodeRgbaToJpegBase64: no 2d context");

  const img = new ImageData(rgba as any, width, height);
  ctx.putImageData(img, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", clamp01(quality));
  return dataUrl.split(",")[1] ?? "";
}

/**
 * ENGINE CONSTITUTION RULE #8.1 (FINAL):
 * Landmark merge uses PURE MEDIAN
 * 
 * Why:
 * - Median kills outlier frames automatically
 * - Eliminates micro-tremors
 * - No need for trimming - median is already robust
 * - Simpler and faster than trimmed median
 */
function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) {
    return (arr[mid - 1] + arr[mid]) / 2;
  }
  return arr[mid];
}

export function stabilizeLandmarksMedian(frames: SelectedFrame[]): NormalizedLandmark[] {
  if (frames.length === 0) return [];
  const startRef = frames[0].landmarks;
  const L = startRef.length;
  const out: NormalizedLandmark[] = new Array(L);

  for (let i = 0; i < L; i++) {
    const xs: number[] = [];
    const ys: number[] = [];
    const zs: number[] = [];

    // Collect all values from all frames
    for (const f of frames) {
      const lm = f.landmarks[i];
      if (lm) {
        xs.push(lm.x);
        ys.push(lm.y);
        zs.push(lm.z ?? 0);
      }
    }

    if (xs.length === 0) {
      out[i] = { x: 0, y: 0, z: 0 };
      continue;
    }

    // Pure median - no trimming needed
    out[i] = {
      x: getMedian(xs),
      y: getMedian(ys),
      z: getMedian(zs)
    };
  }

  return out;
}

// Legacy function kept for backward compatibility
export function stabilizeLandmarksTrimmedMean(frames: SelectedFrame[]): NormalizedLandmark[] {
  return stabilizeLandmarksMedian(frames);
}

export function stabilizePoseMean(frames: SelectedFrame[]): PoseEstimateDeg {
  if (frames.length === 0) return { yaw: 0, pitch: 0, roll: 0 };
  let yaw = 0,
    pitch = 0,
    roll = 0;
  for (const f of frames) {
    yaw += f.metrics.pose.yaw;
    pitch += f.metrics.pose.pitch;
    roll += f.metrics.pose.roll;
  }
  const n = frames.length;
  return { yaw: yaw / n, pitch: pitch / n, roll: roll / n };
}

export function summarizeSelectedCounts(selected: Record<AngleBucket, SelectedFrame[]>): Record<AngleBucket, number> {
  return {
    front: selected.front.length,
    left: selected.left.length,
    right: selected.right.length,
  };
}


