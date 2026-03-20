/**
 * Global pre-warming utility for MediaPipe FaceLandmarker.
 * Uses window global to guarantee cross-chunk sharing (Vite splits static/dynamic imports).
 */
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Use window global so the promise is shared across ALL chunks
declare global {
    interface Window {
        __mp_warmup_promise?: Promise<FaceLandmarker>;
        __mp_warmup_ready?: FaceLandmarker;
    }
}

/**
 * Start pre-loading the FaceLandmarker model.
 * Safe to call multiple times — only runs once.
 */
export function startMediaPipeWarmup(): void {
    if (window.__mp_warmup_promise) return; // Already started

    console.log("🚀 MediaPipe warmup started");

    window.__mp_warmup_promise = (async () => {
        const t0 = performance.now();

        const filesetResolver = await FilesetResolver.forVisionTasks(
            "/models/mediapipe/"
        );

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `/models/mediapipe/face_landmarker.task`,
                delegate: "CPU"
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.7
        });

        window.__mp_warmup_ready = landmarker;
        console.log(`✅ MediaPipe ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
        return landmarker;
    })();
}

/**
 * Get the pre-warmed FaceLandmarker.
 * If warmup hasn't started yet, starts it now.
 */
export async function getPrewarmedLandmarker(): Promise<FaceLandmarker> {
    // Fast path: already loaded
    if (window.__mp_warmup_ready) {
        console.log("⚡ Using pre-warmed landmarker (instant)");
        return window.__mp_warmup_ready;
    }
    // Warmup started but not finished — wait for it
    if (window.__mp_warmup_promise) {
        console.log("⏳ Waiting for warmup to complete...");
        return window.__mp_warmup_promise;
    }
    // Never started — start now (fallback)
    console.log("🔄 Warmup not started, starting now (fallback)");
    startMediaPipeWarmup();
    return window.__mp_warmup_promise!;
}

/**
 * Check if the landmarker is already loaded (synchronous).
 */
export function isLandmarkerReady(): boolean {
    return !!window.__mp_warmup_ready;
}
