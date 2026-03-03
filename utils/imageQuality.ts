/**
 * Image Quality Analysis Utilities
 * Provides functions to validate and assess image quality before analysis
 */

export interface ImageQualityResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
}

/**
 * Analyzes image quality and detects potential issues
 */
export async function analyzeImageQuality(imageFile: File): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const issues: string[] = [];
      const warnings: string[] = [];
      let score = 100;

      // Check image dimensions
      if (img.width < 640 || img.height < 480) {
        issues.push('Image resolution too low (minimum 640x480)');
        score -= 30;
      } else if (img.width < 1024 || img.height < 768) {
        warnings.push('Image resolution could be higher for better accuracy');
        score -= 10;
      }

      // Check aspect ratio for face photos
      const aspectRatio = img.width / img.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        warnings.push('Unusual aspect ratio - face might be cropped');
        score -= 5;
      }

      if (!ctx) {
        resolve({ isValid: false, score: 0, issues: ['Cannot analyze image'], warnings: [] });
        return;
      }

      // Analyze pixel data for brightness and blur
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { brightness, contrast, blurScore } = analyzePixelData(imageData);

      // Check brightness
      if (brightness < 50) {
        issues.push('Image is too dark');
        score -= 20;
      } else if (brightness > 230) {
        issues.push('Image is overexposed');
        score -= 20;
      } else if (brightness < 80 || brightness > 200) {
        warnings.push('Lighting could be improved');
        score -= 10;
      }

      // Check contrast
      if (contrast < 30) {
        warnings.push('Low contrast - try better lighting');
        score -= 10;
      }

      // Check blur
      if (blurScore < 0.3) {
        issues.push('Image appears blurry or out of focus');
        score -= 25;
      } else if (blurScore < 0.5) {
        warnings.push('Image might be slightly blurry');
        score -= 10;
      }

      const isValid = score >= 40 && issues.length === 0;

      resolve({
        isValid,
        score: Math.max(0, Math.min(100, score)),
        issues,
        warnings
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        score: 0,
        issues: ['Failed to load image'],
        warnings: []
      });
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Analyzes pixel data for brightness, contrast, and blur detection
 */
function analyzePixelData(imageData: ImageData): {
  brightness: number;
  contrast: number;
  blurScore: number;
} {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  
  // Sample pixels for performance (every 4th pixel)
  const step = 4;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    sampleCount++;
  }

  const avgBrightness = totalBrightness / sampleCount;
  const contrast = maxBrightness - minBrightness;

  // Simplified blur detection using Laplacian variance
  const blurScore = detectBlur(imageData, width, height);

  return {
    brightness: avgBrightness,
    contrast,
    blurScore
  };
}

/**
 * Detects blur using Laplacian variance method
 * Higher values indicate sharper images
 */
function detectBlur(imageData: ImageData, width: number, height: number): number {
  const data = imageData.data;
  
  // Convert to grayscale and apply Laplacian
  let laplacianSum = 0;
  let count = 0;
  
  // Sample center region (avoid edges)
  const startX = Math.floor(width * 0.2);
  const endX = Math.floor(width * 0.8);
  const startY = Math.floor(height * 0.2);
  const endY = Math.floor(height * 0.8);
  
  for (let y = startY; y < endY - 1; y++) {
    for (let x = startX; x < endX - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Get neighboring pixels
      const rightIdx = (y * width + (x + 1)) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      
      const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
      const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
      
      // Simplified Laplacian
      const laplacian = Math.abs(4 * gray - rightGray - bottomGray);
      laplacianSum += laplacian;
      count++;
    }
  }
  
  // Normalize to 0-1 range
  const variance = laplacianSum / count;
  return Math.min(variance / 100, 1);
}

/**
 * Pre-processes image for better analysis
 * Returns base64 encoded optimized image
 */
export async function preprocessImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Optimal size for analysis (balance quality and API limits)
      const maxDimension = 1920;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Optional: Apply slight sharpening
      // This can help with slightly blurry images
      // applySharpening(ctx, width, height);

      // Convert to base64
      const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
      resolve(base64);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Applies unsharp mask for slight sharpening
 */
function applySharpening(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Simple sharpening kernel
  const sharpen = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * sharpen[kernelIdx];
          }
        }
        const outIdx = (y * width + x) * 4 + c;
        output[outIdx] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }

  ctx.putImageData(imageData, 0, 0);
}














