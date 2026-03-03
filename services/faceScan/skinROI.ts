import type { NormalizedLandmark } from './types';

/**
 * Skin Region of Interest (ROI) Definition
 * 
 * Defines tissue regions for skin analysis with exclusion zones
 * to avoid contamination from eyes, eyebrows, and lips.
 */

export interface SkinROI {
    name: 'forehead' | 'leftCheek' | 'rightCheek' | 'chin';
    landmarks: number[];        // MediaPipe landmark indices defining the region
    exclusionZones: number[][]; // Landmark indices to exclude (eyes, brows, lips)
    boundingBox: { x: number; y: number; w: number; h: number };
}

/**
 * MediaPipe Face Mesh Landmark Definitions for Skin Regions
 * 
 * Based on 478-point face mesh topology
 */
export const SKIN_REGION_LANDMARKS = {
    /**
     * FOREHEAD (Alın)
     * Upper face region above eyebrows
     * Excludes: Eyebrows
     */
    forehead: {
        landmarks: [
            10,   // Forehead center top
            338, 297, 332, 284, 251, 389, 356, 454, // Right forehead
            323, 361, 288, 397, 365, 379, 378, 400, // Right temple
            377, 152, 148, 176, 149, 150, 136, 172, // Center forehead
            58, 132, 93, 234, 127, 162, 21, 54,     // Left forehead
            103, 67, 109                             // Left temple
        ],
        exclusionZones: [
            // Left eyebrow
            [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
            // Right eyebrow
            [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]
        ]
    },

    /**
     * LEFT CHEEK (Sol Yanak)
     * Left side of face between eye and jawline
     * Excludes: Left eye
     */
    leftCheek: {
        landmarks: [
            234, 93, 132, 58, 172, 136, 150, 149, 176, 148,
            152, 377, 400, 378, 379, 365, 397, 288, 361, 323,
            454, 356, 389, 251, 284, 332, 297, 338
        ],
        exclusionZones: [
            // Left eye region
            [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        ]
    },

    /**
     * RIGHT CHEEK (Sağ Yanak)
     * Right side of face between eye and jawline
     * Excludes: Right eye
     */
    rightCheek: {
        landmarks: [
            454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
            152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
            234, 127, 162, 21, 54, 103, 67, 109
        ],
        exclusionZones: [
            // Right eye region
            [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
        ]
    },

    /**
     * CHIN (Çene)
     * Lower face region below mouth
     * Excludes: Lips
     */
    chin: {
        landmarks: [
            152, 377, 400, 378, 379, 365, 397, 288, 361, 323,
            454, 356, 389, 251, 284, 332, 297, 338, 10, 109,
            67, 103, 54, 21, 162, 127, 234, 93, 132, 58,
            172, 136, 150, 149, 176, 148
        ],
        exclusionZones: [
            // Upper lip
            [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
            // Lower lip
            [146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
        ]
    }
};

/**
 * Create bounding box from landmarks
 */
export function createBoundingBox(
    landmarks: NormalizedLandmark[],
    indices: number[]
): { x: number; y: number; w: number; h: number } {
    if (indices.length === 0) {
        return { x: 0, y: 0, w: 0, h: 0 };
    }

    let minX = 1, minY = 1, maxX = 0, maxY = 0;

    for (const idx of indices) {
        const lm = landmarks[idx];
        if (lm) {
            minX = Math.min(minX, lm.x);
            minY = Math.min(minY, lm.y);
            maxX = Math.max(maxX, lm.x);
            maxY = Math.max(maxY, lm.y);
        }
    }

    return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
    };
}

/**
 * Check if a point is inside exclusion zones
 */
export function isInExclusionZone(
    x: number,
    y: number,
    landmarks: NormalizedLandmark[],
    exclusionZones: number[][]
): boolean {
    for (const zone of exclusionZones) {
        const bbox = createBoundingBox(landmarks, zone);

        // Add padding to exclusion zones
        const padding = 0.02;
        if (
            x >= bbox.x - padding &&
            x <= bbox.x + bbox.w + padding &&
            y >= bbox.y - padding &&
            y <= bbox.y + bbox.h + padding
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Create ROI with exclusion zones applied
 */
export function createSkinROI(
    name: 'forehead' | 'leftCheek' | 'rightCheek' | 'chin',
    landmarks: NormalizedLandmark[],
    imageWidth: number,
    imageHeight: number
): SkinROI {
    const regionDef = SKIN_REGION_LANDMARKS[name];
    const boundingBox = createBoundingBox(landmarks, regionDef.landmarks);

    // Convert normalized coordinates to pixel coordinates
    return {
        name,
        landmarks: regionDef.landmarks,
        exclusionZones: regionDef.exclusionZones,
        boundingBox: {
            x: boundingBox.x * imageWidth,
            y: boundingBox.y * imageHeight,
            w: boundingBox.w * imageWidth,
            h: boundingBox.h * imageHeight
        }
    };
}
