/**
 * Skin Analysis Helper Utilities
 * 
 * Shared functions for advanced skin analysis:
 * - Laplacian filter for texture detection
 * - Blob detection for acne/pore detection
 * - Statistical utilities
 */

/**
 * Apply Laplacian filter to detect edges/texture
 * 
 * Laplacian kernel:
 * [ 0  1  0 ]
 * [ 1 -4  1 ]
 * [ 0  1  0 ]
 */
export function applyLaplacian(
    channel: Float32Array,
    width: number,
    height: number
): Float32Array {
    const result = new Float32Array(channel.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;

            const center = channel[idx];
            const top = channel[(y - 1) * width + x];
            const bottom = channel[(y + 1) * width + x];
            const left = channel[y * width + (x - 1)];
            const right = channel[y * width + (x + 1)];

            // Laplacian: -4*center + top + bottom + left + right
            result[idx] = Math.abs(-4 * center + top + bottom + left + right);
        }
    }

    return result;
}

/**
 * Simple blob detection for acne/pore detection
 */
export interface Blob {
    x: number;
    y: number;
    area: number;
    avgValue: number;
    circularity: number;
}

export interface BlobDetectorOptions {
    minArea: number;
    maxArea: number;
    minCircularity: number;
    threshold: number;
}

/**
 * Detect blobs (connected components) in a channel
 */
export function detectBlobs(
    channel: Float32Array,
    width: number,
    height: number,
    options: BlobDetectorOptions
): Blob[] {
    const { minArea, maxArea, minCircularity, threshold } = options;
    const visited = new Uint8Array(channel.length);
    const blobs: Blob[] = [];

    // Flood fill to find connected components
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            if (visited[idx] || channel[idx] < threshold) {
                continue;
            }

            // Start flood fill
            const blob = floodFill(channel, visited, width, height, x, y, threshold);

            // Filter by area and circularity
            if (blob.area >= minArea && blob.area <= maxArea && blob.circularity >= minCircularity) {
                blobs.push(blob);
            }
        }
    }

    return blobs;
}

/**
 * Flood fill algorithm to find connected component
 */
function floodFill(
    channel: Float32Array,
    visited: Uint8Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    threshold: number
): Blob {
    const stack: [number, number][] = [[startX, startY]];
    let area = 0;
    let sumX = 0;
    let sumY = 0;
    let sumValue = 0;
    let perimeter = 0;

    while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = y * width + x;

        if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || channel[idx] < threshold) {
            continue;
        }

        visited[idx] = 1;
        area++;
        sumX += x;
        sumY += y;
        sumValue += channel[idx];

        // Check neighbors
        const neighbors = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
        ];

        for (const [nx, ny] of neighbors) {
            const nIdx = ny * width + nx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (channel[nIdx] < threshold || visited[nIdx]) {
                    perimeter++;
                } else {
                    stack.push([nx, ny]);
                }
            }
        }
    }

    const centerX = sumX / area;
    const centerY = sumY / area;
    const avgValue = sumValue / area;

    // Circularity = 4π * area / perimeter²
    // Perfect circle = 1, irregular shape < 1
    const circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

    return {
        x: centerX,
        y: centerY,
        area,
        avgValue,
        circularity: Math.min(1, circularity)
    };
}

/**
 * Check if a pixel is a local maximum
 */
export function isLocalMaxima(
    channel: Float32Array,
    idx: number,
    width: number,
    height: number
): boolean {
    const x = idx % width;
    const y = Math.floor(idx / width);

    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return false;
    }

    const center = channel[idx];

    // Check 8 neighbors
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nIdx = (y + dy) * width + (x + dx);
            if (channel[nIdx] >= center) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Calculate spatial clustering of points
 * Returns 0-1 where 1 = highly clustered, 0 = evenly distributed
 */
export function calculateSpatialClustering(
    points: number[],
    width: number
): number {
    if (points.length < 2) return 0;

    // Calculate average distance to nearest neighbor
    let totalDistance = 0;

    for (const p1 of points) {
        let minDist = Infinity;

        for (const p2 of points) {
            if (p1 === p2) continue;

            const x1 = p1 % width;
            const y1 = Math.floor(p1 / width);
            const x2 = p2 % width;
            const y2 = Math.floor(p2 / width);

            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            minDist = Math.min(minDist, dist);
        }

        totalDistance += minDist;
    }

    const avgDistance = totalDistance / points.length;

    // Normalize: smaller distance = more clustered
    // Assume max distance is width/4 for normalization
    const clustering = 1 - Math.min(1, avgDistance / (width / 4));

    return clustering;
}

/**
 * Extract values from ROI with exclusion zones
 */
export function extractROIValues(
    channel: Float32Array,
    boundingBox: { x: number; y: number; w: number; h: number },
    width: number
): number[] {
    const values: number[] = [];

    const startX = Math.floor(boundingBox.x);
    const startY = Math.floor(boundingBox.y);
    const endX = Math.floor(boundingBox.x + boundingBox.w);
    const endY = Math.floor(boundingBox.y + boundingBox.h);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const idx = y * width + x;
            if (idx < channel.length) {
                values.push(channel[idx]);
            }
        }
    }

    return values;
}

/**
 * Calculate mean of array
 */
export function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate variance of array
 */
export function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = calculateMean(values);
    return values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
}

/**
 * Calculate standard deviation of array
 */
export function calculateStdDev(values: number[]): number {
    return Math.sqrt(calculateVariance(values));
}

/**
 * Calculate percentile of an array
 * @param values - Array of numbers
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at the given percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    if (percentile < 0 || percentile > 100) return 0;

    // Sort values
    const sorted = [...values].sort((a, b) => a - b);

    // Calculate index
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    // Linear interpolation
    if (lower === upper) {
        return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
