/**
 * LAB Color Space Conversion Utilities
 * 
 * Converts RGB/BGR to CIE LAB color space for advanced skin analysis:
 * - L (Luminance): 0-100, brightness/texture/sebum
 * - A (Green-Red): -128 to +127, redness/acne/PIE
 * - B (Blue-Yellow): -128 to +127, sun spots/PIH
 */

/**
 * Convert RGB to XYZ color space (D65 illuminant)
 */
function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
    // Gamma correction (inverse sRGB companding)
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // RGB → XYZ transformation matrix (sRGB D65)
    const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

    return [X * 100, Y * 100, Z * 100];
}

/**
 * Convert XYZ to LAB color space
 */
function xyzToLab(X: number, Y: number, Z: number): [number, number, number] {
    // D65 reference white point
    const Xn = 95.047;
    const Yn = 100.000;
    const Zn = 108.883;

    let x = X / Xn;
    let y = Y / Yn;
    let z = Z / Zn;

    // f(t) function for LAB conversion
    const delta = 6 / 29;
    const f = (t: number) => {
        return t > delta ** 3
            ? Math.cbrt(t)
            : t / (3 * delta ** 2) + 4 / 29;
    };

    x = f(x);
    y = f(y);
    z = f(z);

    // Calculate LAB values
    const L = 116 * y - 16;
    const A = 500 * (x - y);
    const B = 200 * (y - z);

    return [L, A, B];
}

/**
 * Convert RGBA image data to LAB color space
 * 
 * @param imageData - RGBA pixel data (Uint8ClampedArray)
 * @param width - Image width
 * @param height - Image height
 * @returns Separate L, A, B channel arrays
 */
export function rgbaToLab(
    imageData: Uint8ClampedArray,
    width: number,
    height: number
): { L: Float32Array; A: Float32Array; B: Float32Array } {
    const pixelCount = width * height;
    const L = new Float32Array(pixelCount);
    const A = new Float32Array(pixelCount);
    const B = new Float32Array(pixelCount);

    for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;

        // Normalize RGB to 0-1 range
        const r = imageData[idx] / 255;
        const g = imageData[idx + 1] / 255;
        const b = imageData[idx + 2] / 255;

        // RGB → XYZ → LAB
        const [X, Y, Z] = rgbToXYZ(r, g, b);
        const [l, a, bVal] = xyzToLab(X, Y, Z);

        L[i] = l;
        A[i] = a;
        B[i] = bVal;
    }

    return { L, A, B };
}

/**
 * Extract LAB values for a specific region
 * 
 * @param L - L channel array
 * @param A - A channel array
 * @param B - B channel array
 * @param x - Region x coordinate
 * @param y - Region y coordinate
 * @param w - Region width
 * @param h - Region height
 * @param width - Image width
 * @returns Arrays of L, A, B values within the region
 */
export function extractRegionLAB(
    L: Float32Array,
    A: Float32Array,
    B: Float32Array,
    x: number,
    y: number,
    w: number,
    h: number,
    width: number
): { L: number[]; A: number[]; B: number[] } {
    const regionL: number[] = [];
    const regionA: number[] = [];
    const regionB: number[] = [];

    const startX = Math.floor(x);
    const startY = Math.floor(y);
    const endX = Math.floor(x + w);
    const endY = Math.floor(y + h);

    for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
            const idx = py * width + px;
            regionL.push(L[idx]);
            regionA.push(A[idx]);
            regionB.push(B[idx]);
        }
    }

    return { L: regionL, A: regionA, B: regionB };
}

/**
 * Calculate statistics for a channel
 */
export function calculateChannelStats(values: number[]): {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
} {
    if (values.length === 0) {
        return { mean: 0, min: 0, max: 0, stdDev: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, min, max, stdDev };
}
