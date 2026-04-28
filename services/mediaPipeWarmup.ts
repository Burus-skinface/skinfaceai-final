/**
 * Global pre-warming utility for MediaPipe FaceLandmarker.
 * Uses window global to guarantee cross-chunk sharing (Vite splits static/dynamic imports).
 */
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Use window global so the promise is shared across ALL chunks
declare global {
    interface Window {
        __mp_warmup_promise_v2?: Promise<FaceLandmarker>;
        __mp_warmup_ready_v2?: FaceLandmarker;
    }
}

/**
 * Start pre-loading the FaceLandmarker model.
 * Safe to call multiple times — only runs once.
 */
export function startMediaPipeWarmup(): void {
    if (window.__mp_warmup_promise_v2) return; // Already started

    console.log("🚀 MediaPipe warmup started");

    window.__mp_warmup_promise_v2 = (async () => {
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

        window.__mp_warmup_ready_v2 = landmarker;
        console.log(`✅ MediaPipe ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
        return landmarker;
    })();
}

export async function getPrewarmedLandmarker(): Promise<FaceLandmarker> {
    // Fast path: already loaded (check if still valid)
    if (window.__mp_warmup_ready_v2) {
        try {
            // Test if it's been closed (calling a method might throw if WASM memory is detached)
            const test = window.__mp_warmup_ready_v2.setOptions;
            if (test) {
                console.log("⚡ Using pre-warmed landmarker (instant)");
                return window.__mp_warmup_ready_v2;
            }
        } catch (e) {
            console.warn("⚠️ Cached landmarker was closed, clearing cache...");
            window.__mp_warmup_ready_v2 = undefined;
            window.__mp_warmup_promise_v2 = undefined;
        }
    }
    // Warmup started but not finished — wait for it
    if (window.__mp_warmup_promise_v2) {
        console.log("⏳ Waiting for warmup to complete...");
        return window.__mp_warmup_promise_v2;
    }
    // Never started — start now (fallback)
    console.log("🔄 Warmup not started, starting now (fallback)");
    startMediaPipeWarmup();
    return window.__mp_warmup_promise_v2!;
}

/**
 * Check if the landmarker is already loaded (synchronous).
 */
export function isLandmarkerReady(): boolean {
    return !!window.__mp_warmup_ready_v2;
}
