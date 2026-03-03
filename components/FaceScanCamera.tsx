import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Webcam from "react-webcam";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ScanFace, CheckCircle2, AlertCircle } from "lucide-react";

import { FaceScanEngine } from "../services/faceScan/engine";
import type { AngleBucket, NormalizedLandmark } from "../services/faceScan/types";
import type { ComprehensiveFaceState } from "../services/faceScan/faceState";
import FaceMeshOverlay from "./FaceMeshOverlay";
import { t } from "../localization";

export interface FaceScanCameraProps {
  onFaceState: (faceState: ComprehensiveFaceState) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
  durationMs?: number;
  topKPerBucket?: number;
  minPerBucketToFinish?: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Minimal helpers for image processing
function computeBrightness01FromRgba(rgba: Uint8ClampedArray) {
  let sum = 0;
  const n = rgba.length / 4;
  for (let i = 0; i < rgba.length; i += 4) {
    sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return clamp(sum / n / 255, 0, 1);
}

type Phase = "loading" | "waiting_face" | "scanning" | "complete";

const FaceScanCamera: React.FC<FaceScanCameraProps> = ({
  onFaceState,
  onError,
  onClose,
  durationMs = 2500,
  topKPerBucket = 12,
  minPerBucketToFinish = 8,
}) => {
  const tAny = t as any;
  const webcamRef = useRef<Webcam | null>(null);

  // V5: FaceLandmarker
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  const finishedRef = useRef(false);
  const startTsRef = useRef<number>(0);
  const latestLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const lastProgressUiRef = useRef<number>(0);
  const permissionGrantedAtRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("loading");
  const [scanActive, setScanActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [targetBucketUi, setTargetBucketUi] = useState<AngleBucket>("front");
  const [helpOpen, setHelpOpen] = useState(false);
  const [lightOk, setLightOk] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [uiDimensions, setUiDimensions] = useState({ w: 0, h: 0 });
  const [videoDimensions, setVideoDimensions] = useState({ w: 0, h: 0 });
  const [progress01, setProgress01] = useState(0);

  // Refs for loop access
  const phaseRef = useRef<Phase>("loading");
  const scanActiveRef = useRef(false);
  const videoReadyRef = useRef(false);
  const targetBucketRef = useRef<AngleBucket>("front");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scanActiveRef.current = scanActive; }, [scanActive]);
  useEffect(() => { videoReadyRef.current = videoReady; }, [videoReady]);

  const engine = useMemo(() => {
    return new FaceScanEngine({
      topKPerBucket,
      retainedCropSize: 256,
      primaryCropSize: 768,
      minQualityScore: 0.55,
    });
  }, [topKPerBucket]);

  const [debugStats, setDebugStats] = useState<any>(null); // Forcing UI updates
  const lastDebugUpdateRef = useRef<number>(0);
  const [modelStatus, setModelStatus] = useState<string>("init");

  const canvasesRef = useRef<{
    sample: HTMLCanvasElement;
    retained: HTMLCanvasElement;
    primary: HTMLCanvasElement;
  } | null>(null);

  if (!canvasesRef.current && typeof document !== "undefined") {
    canvasesRef.current = {
      sample: document.createElement("canvas"),
      retained: document.createElement("canvas"),
      primary: document.createElement("canvas"),
    };
  }

  // --- INIT FACE LANDMARKER (V5) ---
  useEffect(() => {
    let active = true;
    const initLandmarker = async () => {
      try {
        setModelStatus("wasm_load");
        // Loading logs removed
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        if (!active) return;

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
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

        if (!active) return;
        // Logic loaded
        setModelStatus("ready");
        landmarkerRef.current = landmarker;
      } catch (e) {
        console.error("Failed to load FaceLandmarker", e);
        if (active) { setError("AI Model Failed to Load. Check connection."); setModelStatus("error"); }
      }
    };

    initLandmarker();
    return () => { active = false; landmarkerRef.current?.close(); };
  }, []);

  const stop = useCallback((reason: string = "unknown") => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    finishedRef.current = true;
  }, []);

  const finalizeOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Finalizing scan
    try {
      const faceState = engine.finalize();
      setPhase("complete");
      onFaceState(faceState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
      onError?.(e);
    }
  }, [engine, onError, onFaceState]);

  // --- PROCESSING LOOP ---
  const processFrame = useCallback((now: number) => {
    if (finishedRef.current) return;

    rafRef.current = requestAnimationFrame(processFrame);

    // Safety checks
    const video = webcamRef.current?.video;
    const landmarker = landmarkerRef.current;

    // Video dimension polling
    if (video && video.videoWidth > 0 && (video.videoWidth !== videoDimensions.w || video.videoHeight !== videoDimensions.h)) {
      setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
      setVideoReady(true); // Signal valid video
    }

    if (!video || !landmarker || video.readyState < 2) return;

    // Detect
    let results;
    try {
      // Pass timestamp. Important for smoothing.
      results = landmarker.detectForVideo(video, now);
    } catch (e) {
      console.error("Tracking Error:", e);
      return;
    }

    const landmarks = results.faceLandmarks?.[0] as NormalizedLandmark[];
    if (!landmarks) {
      // No face
      if (scanActiveRef.current && phaseRef.current === "scanning") {
        setPhase("waiting_face");
      }
      latestLandmarksRef.current = null;
      return;
    }

    latestLandmarksRef.current = landmarks;

    // Face Found transition
    if (phaseRef.current === "waiting_face" || (phaseRef.current === "loading" && videoReadyRef.current && landmarker)) {
      setPhase("waiting_face");
    }

    // V5 Outputs
    const blendshapes = results.faceBlendshapes?.[0]?.categories?.reduce((acc, cat) => {
      acc[cat.categoryName] = cat.score;
      return acc;
    }, {} as Record<string, number>);

    const matrix = results.facialTransformationMatrixes?.[0]?.data;

    // Calculate pose angles from matrix for debug
    let yawVal = 0, pitchVal = 0;
    if (matrix && matrix.length === 16) {
      const r00 = matrix[0], r20 = matrix[8], r21 = matrix[9], r22 = matrix[10];
      const sy = Math.sqrt(r00 * r00 + matrix[4] * matrix[4]);
      if (sy > 1e-6) {
        pitchVal = Math.atan2(r21, r22) * (180 / Math.PI);
        yawVal = Math.atan2(-r20, sy) * (180 / Math.PI);
      }
    }

    // DEBUG: Update stats immediately with results keys AND engine status
    const engineStatus = engine.getStatus();
    setDebugStats({
      reason: scanActiveRef.current ? (engineStatus.debug?.reason || "Scanning...") : "NOT STARTED",
      yaw: yawVal,
      pitch: pitchVal,
      bri: engineStatus.debug?.bri || 0,
      matrix: !!matrix,
      keys: `PRG:${progress01.toFixed(2)} | F:${engineStatus.frontCount} L:${engineStatus.leftCount} R:${engineStatus.rightCount} | DONE:${engineStatus.isFinished ? 'YES' : 'NO'}`
    });

    // Debug logs removed

    // --- LOGIC LOOP ---
    if (!scanActiveRef.current || finishedRef.current) return;

    // CHECK COMPLETION FIRST
    const quickStatus = engine.getStatus();
    if (quickStatus.isFinished && !finishedRef.current) {
      // Scan complete logic
      setProgress01(0.99); // Fill ring to 99% (finalize will do 100%)
      setPhase("complete");
      finalizeOnce(); // Call immediately, no delay
      return;
    }

    if (startTsRef.current === 0) startTsRef.current = now;
    const elapsed = now - startTsRef.current;

    // Canvas Helpers
    const cvs = canvasesRef.current;
    if (!cvs) return;

    // UPDATE TARGET BUCKET BEFORE PUSHFRAME
    const statusBefore = engine.getStatus();
    if (statusBefore.needsFront) {
      targetBucketRef.current = "front";
    } else if (statusBefore.needsLeft) {
      targetBucketRef.current = "left";
    } else if (statusBefore.needsRight) {
      targetBucketRef.current = "right";
    }

    // 1. Capture tiny crop for Brightness
    const ctxSample = cvs.sample.getContext("2d");
    if (ctxSample) {
      cvs.sample.width = 32; cvs.sample.height = 32;
      ctxSample.drawImage(video, 0, 0, 32, 32);
    }
    const tinyData = ctxSample?.getImageData(0, 0, 32, 32).data || new Uint8ClampedArray();
    const brightness = computeBrightness01FromRgba(tinyData);

    // Helpers for capturing crops (only called if frame accepted)
    const captureCrop = (size: number) => {
      const c = renderCtx(size === 256 ? cvs.retained : cvs.primary, size);
      return c?.getImageData(0, 0, size, size).data || new Uint8ClampedArray();
    }
    const renderCtx = (c: HTMLCanvasElement, size: number) => {
      c.width = size; c.height = size;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      // Center crop strategy:
      // Shortest side = size.
      const vw = video.videoWidth, vh = video.videoHeight;
      const scale = Math.max(size / vw, size / vh);
      const dx = (size - vw * scale) / 2;
      const dy = (size - vh * scale) / 2;
      ctx.drawImage(video, dx, dy, vw * scale, vh * scale);
      return ctx;
    }

    // ENGINE PUSH

    const accepted = engine.pushFrame({
      ts: now,
      landmarks,
      meshConfidence: 0.9, // Landmarker threshold handled internally
      brightness01: brightness,
      aspectRatio: video.videoHeight / video.videoWidth,
      captureRetainedCrop: (s) => captureCrop(s),
      capturePrimaryCrop: (s) => captureCrop(s),
      expectedBucket: targetBucketRef.current,
      blendshapes, // V5
      matrix: matrix as unknown as number[] // V5
    });


    if (accepted && phaseRef.current === "waiting_face") {
      setPhase("scanning");
    }

    // FEEDBACK
    const status = engine.getStatus();
    const totalReq = topKPerBucket + 8 + 8; // 28
    const totalHave = status.frontCount + status.leftCount + status.rightCount;
    const localP = Math.min(0.99, totalHave / totalReq);
    setProgress01(localP); // Run every frame for smoothness

    if (elapsed - lastProgressUiRef.current > 50) {
      lastProgressUiRef.current = elapsed;

      // Warning Logic
      if (brightness < 0.2) setScanWarning((t as any)("lighting_too_dark") || "Lighting too dark");
      else if (status.currentBucket !== targetBucketRef.current) {
        if (targetBucketRef.current === 'front') setScanWarning("Look Forward");
        else if (targetBucketRef.current === 'left') setScanWarning("Turn Left");
        else if (targetBucketRef.current === 'right') setScanWarning("Turn Right");
      } else {
        setScanWarning(null);
      }

      // Update debug stats
      setDebugStats({
        reason: "Scanning...",
        yaw: 0,
        pitch: 0,
        bri: brightness,
        matrix: !!matrix,
        keys: `PRG:${localP.toFixed(2)} | F:${status.frontCount} L:${status.leftCount} R:${status.rightCount} | DONE:${status.isFinished ? 'YES' : 'NO'}`
      });

      // Progress log removed

      // Next Bucket Guidance - UPDATE targetBucketRef!
      // Next Bucket Guidance - FORCE UI SYNC
      if (status.needsFront) {
        if (targetBucketRef.current !== "front") targetBucketRef.current = "front";
        if (targetBucketUi !== "front") setTargetBucketUi("front");
      } else if (status.needsLeft) {
        if (targetBucketRef.current !== "left") targetBucketRef.current = "left";
        if (targetBucketUi !== "left") setTargetBucketUi("left");
      } else if (status.needsRight) {
        if (targetBucketRef.current !== "right") targetBucketRef.current = "right";
        if (targetBucketUi !== "right") setTargetBucketUi("right");
      }
    }

  }, [engine, topKPerBucket, durationMs, finalizeOnce]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [processFrame]);

  // UI Setup - Resize Observer for Container
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setUiDimensions({ w: width, h: height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const VIEW_TRANSFORM = "scale(1.0) scaleX(-1)";

  // ELLIPSE LOGIC
  const ellipse = useMemo(() => {
    const w = uiDimensions.w;
    const h = uiDimensions.h;
    if (w === 0 || h === 0) return { cx: 0, cy: 0, rx: 0, ry: 0 };
    const ellipseW = w * 0.85;
    const ellipseH = h * 0.52;
    const top = h * 0.15;
    const cx = w * 0.5;
    const cy = top + ellipseH / 2;
    const rx = ellipseW / 2;
    const ry = ellipseH / 2;
    return { cx, cy, rx, ry };
  }, [uiDimensions]);

  const handleStartScan = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (Date.now() - permissionGrantedAtRef.current < 900) return;
    // Require FaceLandmarker ready (implicit via phase)
    if (!latestLandmarksRef.current || latestLandmarksRef.current.length < 200) {
      setPhase("waiting_face");
      return;
    }
    // Start logic
    setError(null);
    setScanWarning(null);
    setTargetBucketUi("front");
    targetBucketRef.current = "front";
    engine.reset();
    setProgress01(0);
    finishedRef.current = false;
    startTsRef.current = Date.now();
    setScanActive(true);
    setPhase("scanning");
  }, [engine]);

  const handleClose = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    stop("user_close");
    onClose?.();
  }, [onClose, stop]);


  // FULLSCREEN UI (Restored Structure)
  const fullscreenUI = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{ touchAction: "manipulation" }}
    >
      {/* Top bar - glassy controls */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 pt-6">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="h-12 w-12 rounded-full border border-white/25 bg-white/10 backdrop-blur text-white text-lg flex items-center justify-center"
        >
          ?
        </button>

        <div className="flex-1 flex justify-center">
          {/* Light check logic could be restored here if engine exposed brightness */}
        </div>

        <button
          type="button"
          onClick={handleClose}
          onTouchStart={handleClose}
          className="h-12 w-12 rounded-full border border-white/25 bg-white/10 backdrop-blur text-white text-lg flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Video container */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30, max: 60 }
            }}
            className="absolute w-full h-full object-cover"
            onUserMedia={() => {
              // Webcam ready logs removed
              permissionGrantedAtRef.current = Date.now();
              // We don't need manual constraints as much with V5 but can add if needed
              setVideoReady(true);
            }}
            onUserMediaError={(err) => setError("Camera error")}
          />

          {/* Soft vignette overlay */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 90%)" }}
          />

          {/* Face mesh overlay - CLIPPED to ellipse */}
          {videoReady && (
            <div className="absolute inset-0 pointer-events-none z-45">
              <FaceMeshOverlay
                landmarks={latestLandmarksRef.current} // React 18 ref usage might need .current logic in overlay
                landmarksRef={latestLandmarksRef}
                width={uiDimensions.w}
                height={uiDimensions.h}
                videoWidth={videoDimensions.w} // Use polled video dims
                videoHeight={videoDimensions.h}
                stride={2}
                scanActive={scanActive}
                scanDurationMs={durationMs}
                scanBoundsPx={{ top: ellipse.cy - ellipse.ry, bottom: ellipse.cy + ellipse.ry }}
                clipEllipse={ellipse}
              />
            </div>
          )}



          {/* PRODUCTION: Ellipse hole mask */}
          {!error && uiDimensions.w > 0 && uiDimensions.h > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none z-20"
              width={uiDimensions.w}
              height={uiDimensions.h}
              style={{ overflow: "visible" }}
            >
              <defs>
                <mask id="holeMask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <ellipse cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} fill="black" />
                </mask>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#holeMask)" />
              <ellipse cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="2" />
            </svg>
          )}

          {/* Progress ring - ellipse segmented */}
          {!error && uiDimensions.w > 0 && uiDimensions.h > 0 && scanActive && (
            <div className="absolute pointer-events-none z-30" style={{ left: ellipse.cx, top: ellipse.cy, transform: "translate(-50%, -50%)" }}>
              <svg width={ellipse.rx * 2 + 48} height={ellipse.ry * 2 + 48} style={{ overflow: "visible" }}>
                <g transform={`translate(${ellipse.rx + 24}, ${ellipse.ry + 24})`}>
                  {Array.from({ length: 120 }).map((_, i) => {
                    const angle = (i / 120) * Math.PI * 2 - Math.PI / 2;
                    const x1 = ellipse.rx * Math.cos(angle);
                    const y1 = ellipse.ry * Math.sin(angle);
                    const x2 = (ellipse.rx + 7) * Math.cos(angle);
                    const y2 = (ellipse.ry + 7) * Math.sin(angle);

                    const exactIndex = progress01 * 120;
                    let opacity = 0.18;
                    if (i <= Math.floor(exactIndex)) {
                      opacity = 0.95;
                    } else if (i === Math.floor(exactIndex) + 1) {
                      const fraction = exactIndex - Math.floor(exactIndex);
                      opacity = 0.18 + fraction * (0.95 - 0.18);
                    }

                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={`rgba(255,255,255,${opacity})`}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 150ms ease-out' }}
                      />
                    );
                  })}
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom instruction + Start button */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-16 flex flex-col items-center gap-14">
        {/* Instruction pill */}
        {/* Animated Instruction Pill */}
        <div className="flex flex-col items-center gap-2 max-w-[85vw]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${targetBucketUi}-${scanActive}`}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`px-6 py-3.5 rounded-2xl md:rounded-full bg-black/75 text-white text-base font-semibold text-center shadow-2xl backdrop-blur-lg border flex items-center gap-3 ${scanWarning || error ? "border-red-500/50" :
                targetBucketUi !== "front" && phase === "scanning" ? "border-blue-400/50 shadow-blue-500/20" :
                  "border-white/15"
                }`}
            >
              {phase === "loading" && <span className="animate-pulse flex items-center gap-2"><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Initializing AI...</span>}
              {phase === "waiting_face" && !scanActive && (
                <>
                  <ScanFace className="w-5 h-5 opacity-70" />
                  <span>Align your face in the oval</span>
                </>
              )}
              {phase === "waiting_face" && scanActive && (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Looking for face...</span>
                </>
              )}
              {phase === "scanning" && targetBucketUi === "front" && (
                <>
                  {/* Face silhouette looking straight */}
                  <motion.svg animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </motion.svg>
                  <span>Look straight into camera</span>
                </>
              )}
              {phase === "scanning" && targetBucketUi === "left" && (
                <>
                  {/* Animated face turning left */}
                  <motion.svg animate={{ rotateY: [0, 35, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" style={{ transformStyle: 'preserve-3d' }}>
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </motion.svg>
                  <motion.div animate={{ x: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4 text-blue-400" />
                    <span>Slowly turn LEFT</span>
                  </motion.div>
                </>
              )}
              {phase === "scanning" && targetBucketUi === "right" && (
                <>
                  <motion.div animate={{ x: [3, -3, 3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-1">
                    <span>Slowly turn RIGHT</span>
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </motion.div>
                  {/* Animated face turning right */}
                  <motion.svg animate={{ rotateY: [0, -35, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" style={{ transformStyle: 'preserve-3d' }}>
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </motion.svg>
                </>
              )}
              {phase === "complete" && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-50">Scan complete!</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {(scanWarning || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm font-medium flex items-center gap-1.5 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-red-500/30"
              >
                <AlertCircle className="w-4 h-4" />
                {error || scanWarning}
              </motion.div>
            )}
          </AnimatePresence>

          {/* GIANT DEBUG BOX */}
          {/* Debug Box Removed */}
          {/* GIANT DEBUG BOX was here */}
        </div>

        {/* Start button */}
        {!scanActive && phase === "waiting_face" && !error && (
          <div className="relative flex items-center justify-center" style={{ touchAction: "manipulation" }}>
            {/* Outer glow layers */}
            <div className="absolute w-[120px] h-[120px] rounded-full bg-black/60 blur-xl" />
            <div className="absolute w-[104px] h-[104px] rounded-full bg-white/10 blur-sm" />

            {/* Spinning dashed ring */}
            <motion.svg
              className="absolute pointer-events-none"
              width="108" height="108"
              viewBox="0 0 108 108"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              style={{ zIndex: 140 }}
            >
              <circle
                cx="54" cy="54" r="50"
                fill="none"
                stroke="rgba(168,85,247,0.5)"
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />
            </motion.svg>

            {/* Second ring, counter-rotating */}
            <motion.svg
              className="absolute pointer-events-none"
              width="96" height="96"
              viewBox="0 0 96 96"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              style={{ zIndex: 140 }}
            >
              <circle
                cx="48" cy="48" r="44"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
            </motion.svg>

            {/* Inner soft glow ring */}
            <motion.div
              className="absolute w-[94px] h-[94px] rounded-full bg-white/[0.12]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.22, 0.12] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />

            {/* Main button */}
            <button
              type="button"
              onClick={handleStartScan}
              onTouchStart={handleStartScan}
              className="relative w-[78px] h-[78px] rounded-full bg-white text-black font-semibold text-base shadow-2xl cursor-pointer active:scale-90 transition-transform flex items-center justify-center"
              style={{ zIndex: 150, pointerEvents: "auto", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              Start
            </button>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {
        helpOpen && (
          <div className="absolute inset-0 z-[100000] bg-black/70 flex items-center justify-center p-6" onClick={() => setHelpOpen(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-neutral-900 text-white p-5 border border-white/10 shadow-2xl" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <div className="text-lg font-semibold mb-2">{tAny.faceScanHelpTitle}</div>
              <div className="text-sm text-white/80 space-y-2">
                <p>{tAny.faceScanHelpBody}</p>
              </div>
              <button type="button" className="mt-4 w-full rounded-xl bg-white text-black py-2 font-semibold" onClick={() => setHelpOpen(false)}>
                {tAny.faceScanHelpClose}
              </button>
            </div>
          </div>
        )
      }
    </div >
  );

  if (typeof document === "undefined") return null;
  return createPortal(fullscreenUI, document.body);
};

export default FaceScanCamera;
