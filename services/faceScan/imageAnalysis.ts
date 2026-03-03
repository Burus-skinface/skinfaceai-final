import type { RegionMask } from "./faceState";

/**
 * ENGINE CONSTITUTION RULE #4: CHEAP METRICS ONLY
 * 
 * All functions here MUST be O(pixels) or cheaper.
 * 
 * ❌ FORBIDDEN:
 * - FFT
 * - Laplacian blur (full convolution)
 * - Color constancy models
 * - Matrix decompositions
 * 
 * ✅ ALLOWED:
 * - Mean/variance
 * - Simple neighbor comparisons
 * - Histogram operations
 * 
 * Goal: "Is this frame reliable for analysis?"
 * NOT: "Is this photo beautiful?"
 */

/**
 * Calculate texture variance within a region
 * Higher variance = rougher texture
 * Complexity: O(pixels) - CHEAP
 */
export function calculateTextureVariance(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let sum = 0;
  let sumSquared = 0;
  let count = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      // Convert to grayscale using luminance formula
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      sum += luminance;
      sumSquared += luminance * luminance;
      count++;
    }
  }
  
  if (count === 0) return 0;
  
  const mean = sum / count;
  const variance = (sumSquared / count) - (mean * mean);
  
  // Normalize to 0-1 range (assuming max variance around 10000)
  return Math.min(1, variance / 10000);
}

/**
 * Calculate pore visibility using high-frequency content detection
 * Uses SIMPLE 4-neighbor comparison (NOT full Laplacian convolution)
 * Complexity: O(pixels) - CHEAP
 */
export function calculatePoreVisibility(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let edgeSum = 0;
  let count = 0;
  
  // Simple edge detection: compare each pixel to its neighbors
  for (let py = Math.floor(y) + 1; py < Math.floor(y + h) - 1; py++) {
    for (let px = Math.floor(x) + 1; px < Math.floor(x + w) - 1; px++) {
      const idx = (py * imageWidth + px) * 4;
      const centerLum = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      
      // Compare to 4 neighbors
      const topIdx = ((py - 1) * imageWidth + px) * 4;
      const bottomIdx = ((py + 1) * imageWidth + px) * 4;
      const leftIdx = (py * imageWidth + (px - 1)) * 4;
      const rightIdx = (py * imageWidth + (px + 1)) * 4;
      
      const topLum = 0.299 * imageData[topIdx] + 0.587 * imageData[topIdx + 1] + 0.114 * imageData[topIdx + 2];
      const bottomLum = 0.299 * imageData[bottomIdx] + 0.587 * imageData[bottomIdx + 1] + 0.114 * imageData[bottomIdx + 2];
      const leftLum = 0.299 * imageData[leftIdx] + 0.587 * imageData[leftIdx + 1] + 0.114 * imageData[leftIdx + 2];
      const rightLum = 0.299 * imageData[rightIdx] + 0.587 * imageData[rightIdx + 1] + 0.114 * imageData[rightIdx + 2];
      
      const edgeMagnitude = Math.abs(centerLum - topLum) + Math.abs(centerLum - bottomLum) +
                            Math.abs(centerLum - leftLum) + Math.abs(centerLum - rightLum);
      
      edgeSum += edgeMagnitude;
      count++;
    }
  }
  
  if (count === 0) return 0;
  
  const avgEdge = edgeSum / count;
  // Normalize to 0-1 range (assuming max avg edge around 200)
  return Math.min(1, avgEdge / 200);
}

/**
 * Calculate micro-contrast (fine detail)
 * Complexity: O(pixels) - CHEAP
 */
export function calculateMicroContrast(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let minLum = 255;
  let maxLum = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      minLum = Math.min(minLum, luminance);
      maxLum = Math.max(maxLum, luminance);
    }
  }
  
  // Michelson contrast formula
  const contrast = (maxLum - minLum) / (maxLum + minLum + 1);
  return Math.min(1, contrast);
}

/**
 * Calculate average RGB values for a region
 */
export function calculateRegionRGB(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): [number, number, number] {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      sumR += imageData[idx];
      sumG += imageData[idx + 1];
      sumB += imageData[idx + 2];
      count++;
    }
  }
  
  if (count === 0) return [0, 0, 0];
  
  return [sumR / count, sumG / count, sumB / count];
}

/**
 * Calculate tone evenness (standard deviation of luminance)
 */
export function calculateToneEvenness(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let sum = 0;
  let sumSquared = 0;
  let count = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      sum += luminance;
      sumSquared += luminance * luminance;
      count++;
    }
  }
  
  if (count === 0) return 1; // Perfect evenness if no data
  
  const mean = sum / count;
  const variance = (sumSquared / count) - (mean * mean);
  const stdDev = Math.sqrt(variance);
  
  // Convert to evenness score (0-1, where 1 is perfectly even)
  // Lower std dev = more even
  return Math.max(0, 1 - (stdDev / 50)); // Normalize assuming max stdDev around 50
}

/**
 * Calculate redness (R-G channel separation)
 */
export function calculateRegionRedness(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let rednessSum = 0;
  let count = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const r = imageData[idx];
      const g = imageData[idx + 1];
      // Redness = how much red exceeds green
      const redness = Math.max(0, r - g);
      rednessSum += redness;
      count++;
    }
  }
  
  if (count === 0) return 0;
  
  const avgRedness = rednessSum / count;
  // Normalize to 0-1 range (assuming max avg redness around 100)
  return Math.min(1, avgRedness / 100);
}

/**
 * Classify overall skin tone as warm, cool, or neutral
 */
export function classifySkinTone(averageRGB: [number, number, number]): 'warm' | 'cool' | 'neutral' {
  const [r, g, b] = averageRGB;
  
  // Warm tones: R > B, yellow undertone
  // Cool tones: B > R, blue/pink undertone
  // Neutral: balanced
  
  const warmScore = r - b;
  const coolScore = b - r;
  
  if (Math.abs(warmScore) < 10 && Math.abs(coolScore) < 10) {
    return 'neutral';
  }
  
  return warmScore > coolScore ? 'warm' : 'cool';
}

/**
 * Calculate oil/shine score using specular highlight detection
 * Detects bright spots that indicate oil reflection
 */
export function calculateOilScore(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let brightPixelCount = 0;
  let totalPixelCount = 0;
  const brightnessThreshold = 200; // Pixels brighter than this are considered specular
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      
      if (luminance > brightnessThreshold) {
        brightPixelCount++;
      }
      totalPixelCount++;
    }
  }
  
  if (totalPixelCount === 0) return 0;
  
  // Return ratio of bright pixels
  return brightPixelCount / totalPixelCount;
}

/**
 * Calculate color channel energy
 */
export function calculateChannelEnergy(
  imageData: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number
): { red: number; green: number; blue: number } {
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let count = 0;
  
  for (let i = 0; i < imageData.length; i += 4) {
    redSum += imageData[i] * imageData[i];
    greenSum += imageData[i + 1] * imageData[i + 1];
    blueSum += imageData[i + 2] * imageData[i + 2];
    count++;
  }
  
  if (count === 0) return { red: 0, green: 0, blue: 0 };
  
  const total = redSum + greenSum + blueSum;
  
  return {
    red: redSum / total,
    green: greenSum / total,
    blue: blueSum / total,
  };
}

/**
 * Calculate shadow density (low luminance regions)
 */
export function calculateShadowDensity(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let darkPixelCount = 0;
  let totalPixelCount = 0;
  const darknessThreshold = 80; // Pixels darker than this are considered shadows
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      
      if (luminance < darknessThreshold) {
        darkPixelCount++;
      }
      totalPixelCount++;
    }
  }
  
  if (totalPixelCount === 0) return 0;
  
  return darkPixelCount / totalPixelCount;
}

/**
 * Calculate overall contrast for a region
 */
export function calculateRegionContrast(
  imageData: Uint8ClampedArray,
  region: RegionMask,
  imageWidth: number
): number {
  const { boundingBox } = region;
  const { x, y, w, h } = boundingBox;
  
  let minLum = 255;
  let maxLum = 0;
  let count = 0;
  
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) {
      const idx = (py * imageWidth + px) * 4;
      const luminance = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
      minLum = Math.min(minLum, luminance);
      maxLum = Math.max(maxLum, luminance);
      count++;
    }
  }
  
  if (count === 0 || maxLum + minLum === 0) return 0;
  
  // RMS contrast
  return (maxLum - minLum) / (maxLum + minLum);
}

