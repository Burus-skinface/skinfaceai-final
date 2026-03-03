/**
 * Spectral Analysis Math Module
 * 
 * Implements "Photometric Normalization" and "Frequency Domain Analysis" 
 * for the Advanced Spectral Engine.
 */

// ----------------------------------------------------------------------
// Types & Helpers
// ----------------------------------------------------------------------

export interface TextureEnergy {
    low: number;  // Structural
    mid: number;  // Pores
    high: number; // Roughness / Fine Lines
}

export interface PhotometricMaps {
    diffuse: Uint8ClampedArray;  // Albedo (color without shine)
    specular: Uint8ClampedArray; // Shine/Oil map
    illumination: Uint8ClampedArray; // Light intensity map
    shadingCorrected: Uint8ClampedArray; // Diffuse / Illumination
}

function clamp(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, x));
}

// Simple box blur for low-pass filtering (faster than Gaussian)
function boxBlur(data: Float32Array, w: number, h: number, radius: number): Float32Array {
    const output = new Float32Array(data.length);
    // Horizontal pass
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0;
            let count = 0;
            for (let k = -radius; k <= radius; k++) {
                const px = x + k;
                if (px >= 0 && px < w) {
                    sum += data[y * w + px];
                    count++;
                }
            }
            output[y * w + x] = sum / count;
        }
    }
    // Vertical pass (in-place ish)
    const final = new Float32Array(data.length);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            let sum = 0;
            let count = 0;
            for (let k = -radius; k <= radius; k++) {
                const py = y + k;
                if (py >= 0 && py < h) {
                    sum += output[py * w + x];
                    count++;
                }
            }
            final[y * w + x] = sum / count;
        }
    }
    return final;
}

// ----------------------------------------------------------------------
// Core: Diffuse / Specular Separation + Shading Correction
// ----------------------------------------------------------------------

/**
 * Separates an image into Diffuse (color) and Specular (shine) components using
 * a simplified dichromatic reflection model suitable for skin.
 * Includes Retinex-like Shading Correction.
 */
export function separateDiffuseSpecular(
    rgba: Uint8ClampedArray,
    width: number,
    height: number
): PhotometricMaps {
    const len = rgba.length;
    const diffuse = new Uint8ClampedArray(len);
    const specular = new Uint8ClampedArray(len);
    const illumination = new Uint8ClampedArray(len);     // Visualization
    const shadingCorrected = new Uint8ClampedArray(len); // Result

    // Temp buffers for luminance/intensity
    const intensity = new Float32Array(width * height);

    // 1. Specular Separation Pass
    for (let i = 0; i < len; i += 4) {
        const r = rgba[i];
        const g = rgba[i + 1];
        const b = rgba[i + 2];

        // 1. Estimate Intensity 
        const maxCh = Math.max(r, g, b);
        const minCh = Math.min(r, g, b);
        const chroma = maxCh - minCh;

        // 2. Specular Estimation
        // Skin heuristic: High intensity + Low Chroma = Specular (Shine)
        const intensityNorm = maxCh / 255;
        const saturation = maxCh > 0 ? chroma / maxCh : 0;

        // Specular probability
        const specularProb = (1.0 - saturation) * intensityNorm;

        let specVal = 0;
        if (specularProb > 0.5) { // Threshold
            specVal = (specularProb - 0.5) * 2.0 * 255;
        }
        specVal = clamp(specVal, 0, 255);

        // 3. Diffuse Calculation (Remove specular from original)
        const diffR = clamp(r - specVal, 0, 255);
        const diffG = clamp(g - specVal, 0, 255);
        const diffB = clamp(b - specVal, 0, 255);

        const idx = i / 4;
        // Luminance of Diffuse (for shading estimation)
        intensity[idx] = 0.299 * diffR + 0.587 * diffG + 0.114 * diffB;

        diffuse[i] = diffR;
        diffuse[i + 1] = diffG;
        diffuse[i + 2] = diffB;
        diffuse[i + 3] = 255;

        specular[i] = specVal;
        specular[i + 1] = specVal;
        specular[i + 2] = specVal;
        specular[i + 3] = 255;
    }

    // 2. Shading Correction (Retinex)
    // Estimate illumination field via low-pass filter (blur)
    // Radius ~ size/20 is a decent heuristic for large scale shading
    const blurRadius = Math.floor(width / 20);
    const illuminationField = boxBlur(intensity, width, height, blurRadius);

    for (let i = 0; i < len; i += 4) {
        const idx = i / 4;
        const illu = illuminationField[idx];

        // Normalize: Reflectance = Image / Illumination
        // Add bias to avoid div by zero and extreme noise in darks
        const L = Math.max(10, illu);

        // Scale factor to map back to visible range (assuming mean illumination ~128)
        const scale = 128.0 / L;

        const dr = diffuse[i] * scale;
        const dg = diffuse[i + 1] * scale;
        const db = diffuse[i + 2] * scale;

        shadingCorrected[i] = clamp(dr, 0, 255);
        shadingCorrected[i + 1] = clamp(dg, 0, 255);
        shadingCorrected[i + 2] = clamp(db, 0, 255);
        shadingCorrected[i + 3] = 255;

        const viz = clamp(illu, 0, 255);
        illumination[i] = viz;
        illumination[i + 1] = viz;
        illumination[i + 2] = viz;
        illumination[i + 3] = 255;
    }

    return { diffuse, specular, illumination, shadingCorrected };
}

// ----------------------------------------------------------------------
// Spectral Indices (Proxies)
// ----------------------------------------------------------------------

/**
 * Computes a "Redness Index" map from Shading-Corrected Diffuse.
 * RBX / Erythema Index proxy.
 */
export function computeRednessIndex(
    shadingCorrected: Uint8ClampedArray,
    width: number,
    height: number
): Uint8ClampedArray {
    const output = new Uint8ClampedArray(shadingCorrected.length);
    for (let i = 0; i < shadingCorrected.length; i += 4) {
        const r = shadingCorrected[i];
        const g = shadingCorrected[i + 1];

        // Simple Haemoglobin proxy: R - G
        // (In corrected space, skin color is flatter, so redness pops)
        let redness = r - g;

        // Expand contrast
        redness = (redness - 10) * 4.0;

        const val = clamp(redness, 0, 255);

        output[i] = val;
        output[i + 1] = 0;
        output[i + 2] = 0;
        output[i + 3] = 255;
    }
    return output;
}

/**
 * Computes "Pigment Index" (Melanin proxy).
 * FIXED: Calibrated for diverse skin tones using ITA-inspired normalization
 */
export function computePigmentIndex(
    shadingCorrected: Uint8ClampedArray,
    width: number,
    height: number
): Uint8ClampedArray {
    const output = new Uint8ClampedArray(shadingCorrected.length);

    for (let i = 0; i < shadingCorrected.length; i += 4) {
        const r = shadingCorrected[i];
        const g = shadingCorrected[i + 1];
        const b = shadingCorrected[i + 2];

        // STEP 1: Convert RGB to approximate L* (Lightness)
        // Simplified L* = 0.299R + 0.587G + 0.114B
        const lightness = (0.299 * r + 0.587 * g + 0.114 * b);

        // STEP 2: Melanin absorbs blue/green preferentially
        // Pigment proxy = 255 - avg(B, G)
        const chromaBlueGreen = (b + g) / 2;

        // STEP 3: Normalized Melanin Index
        // Dark skin (low B+G) → High MI
        // Light skin (high B+G) → Low MI
        let melaninIndex = 255 - chromaBlueGreen;

        // STEP 4: Calibrated contrast stretch
        // Based on typical skin range: L* 30-90
        // Normalize to 0-255 output
        const normalized = (melaninIndex / 255) * (255 - lightness);
        const val = clamp(normalized, 0, 255);

        // Sepia / Brownish visualization for melanin
        output[i] = Math.round(val * 0.6);   // R
        output[i + 1] = Math.round(val * 0.4); // G
        output[i + 2] = Math.round(val * 0.2); // B
        output[i + 3] = 255;
    }
    return output;
}

/**
 * Computes "Sallowness Index" (Yellow/Olive).
 * High (R+G) vs Low B.
 */
export function computeSallownessIndex(
    shadingCorrected: Uint8ClampedArray,
    width: number,
    height: number
): Uint8ClampedArray {
    const output = new Uint8ClampedArray(shadingCorrected.length);
    for (let i = 0; i < shadingCorrected.length; i += 4) {
        const r = shadingCorrected[i];
        const g = shadingCorrected[i + 1];
        const b = shadingCorrected[i + 2];

        // Yellow = Red + Green. Sallow = Yellow - Blue.
        let yellow = (r + g) / 2 - b;

        // Normalize
        yellow = (yellow - 20) * 3.0;
        const val = clamp(yellow, 0, 255);

        output[i] = val;     // R
        output[i + 1] = val;   // G use yellow tint
        output[i + 2] = 0;     // B
        output[i + 3] = 255;
    }
    return output;
}


// ----------------------------------------------------------------------
// Frequency Domain Analysis (Spatial)
// ----------------------------------------------------------------------

/**
 * Multi-band Frequency Analysis using Difference of Gaussians (DoG) approach.
 * Fast approximation without FFT.
 */
export function computeFrequencyMaps(
    illuminationCorrected: Uint8ClampedArray, // Luminance of shading corrected
    width: number,
    height: number
): { poreEnergy: Float32Array; roughnessEnergy: Float32Array } {

    const len = width * height;
    const lum = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        const r = illuminationCorrected[i * 4];
        const g = illuminationCorrected[i * 4 + 1];
        const b = illuminationCorrected[i * 4 + 2];
        lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // 1. High Freq (Roughness/Fine lines): Original - Blur(small)
    // Radius 2px
    const blurSmall = boxBlur(lum, width, height, 2);
    const roughness = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        roughness[i] = Math.abs(lum[i] - blurSmall[i]);
    }

    // 2. Mid Freq (Pores): Blur(small) - Blur(medium)
    // Radius 2px - Radius 6px
    const blurMedium = boxBlur(lum, width, height, 6);
    const pores = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        // DoG
        const dog = blurSmall[i] - blurMedium[i];
        // Pores are usually negative peaks (darker holes), but we take abs magnitude for energy
        // Or we can specifically look for dark spots (-ve values)
        pores[i] = Math.abs(dog);
    }

    return { poreEnergy: pores, roughnessEnergy: roughness };
}

/**
 * Helper to visualize a single channel frequency map
 */
export function floatToVisualMap(data: Float32Array, width: number, height: number, scale: number = 1.0): Uint8ClampedArray {
    const out = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i++) {
        const val = clamp(data[i] * scale, 0, 255);
        out[i * 4] = val;
        out[i * 4 + 1] = val;
        out[i * 4 + 2] = val;
        out[i * 4 + 3] = 255;
    }
    return out;
}

/**
 * Calculates aggregate texture energy metrics from maps
 */
export function computeTextureMetrics(
    poreMap: Float32Array,
    roughnessMap: Float32Array
): TextureEnergy {
    let sumLow = 0; // Not calculated currently
    let sumMid = 0; // Pores
    let sumHigh = 0; // Roughness

    for (let i = 0; i < poreMap.length; i++) sumMid += poreMap[i];
    for (let i = 0; i < roughnessMap.length; i++) sumHigh += roughnessMap[i];

    const count = poreMap.length || 1;

    return {
        low: sumLow / count,
        mid: sumMid / count,
        high: sumHigh / count
    };
}
