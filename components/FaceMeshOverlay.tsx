import React, { useEffect, useRef } from "react";
import {
  FACEMESH_TESSELATION,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_RIGHT_EYEBROW,
} from "@mediapipe/face_mesh";
import type { NormalizedLandmark } from "../services/faceScan/types";
import {
  FACE_OVAL_IDX,
  buildCanonical,
  calculateZygionCentroid,
  calculateGonionCentroid,
  hysteresisUpdate,
  ema,
  type StabilizerState
} from "../services/faceScan/engine";

export interface FaceMeshOverlayProps {
  landmarks: NormalizedLandmark[] | null;
  landmarksRef?: React.MutableRefObject<NormalizedLandmark[] | null>;
  width: number;
  height: number;
  videoWidth?: number;
  videoHeight?: number;
  scanActive?: boolean;
  scanDurationMs?: number;
  scanBoundsPx?: { top: number; bottom: number };
  stride?: number;
  className?: string;
  clipEllipse?: { cx: number; cy: number; rx: number; ry: number };
}

const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({
  landmarks,
  landmarksRef,
  width,
  height,
  videoWidth = 480,
  videoHeight = 640,
  scanActive = false,
  scanDurationMs = 2500,
  scanBoundsPx,
  stride = 4,
  className,
  clipEllipse,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanStartRef = useRef<number>(0);
  const scanActiveRef = useRef<boolean>(false);

  // Stabilizer States
  const sZyL = useRef<StabilizerState>({ stableIdx: 234, stablePt: null, candidateIdx: -1, candidateCount: 0 });
  const sZyR = useRef<StabilizerState>({ stableIdx: 454, stablePt: null, candidateIdx: -1, candidateCount: 0 });
  const sGoL = useRef<StabilizerState>({ stableIdx: 58, stablePt: null, candidateIdx: -1, candidateCount: 0 });
  const sGoR = useRef<StabilizerState>({ stableIdx: 288, stablePt: null, candidateIdx: -1, candidateCount: 0 });

  // GHOST MESH: Persistent storage for smoothed points
  // We only initialize this once
  const smoothedLandmarksRef = useRef<NormalizedLandmark[] | null>(null);

  // LERP Helper
  const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastPaint = 0;

    const paint = (now: number) => {
      if (now - lastPaint < 33) {
        raf = requestAnimationFrame(paint);
        return;
      }
      lastPaint = now;

      if (scanActive && !scanActiveRef.current) {
        scanStartRef.current = now;
      }
      scanActiveRef.current = !!scanActive;

      // Update Canvas Size
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      // 1. GET RAW INPUT
      const rawLm = (landmarksRef?.current ?? landmarks) as NormalizedLandmark[] | null;
      if (!rawLm || rawLm.length < 468) {
        raf = requestAnimationFrame(paint);
        return;
      }

      // 2. SMOOTHING (The "Ghost Mesh" Logic)
      if (!smoothedLandmarksRef.current || smoothedLandmarksRef.current.length !== rawLm.length) {
        // First frame: Just copy raw
        smoothedLandmarksRef.current = JSON.parse(JSON.stringify(rawLm));
      } else {
        // Subsequent frames: LERP towards raw
        // Factor 0.75 = Snappy/Fast (User Request). 0.35 was too slow.
        const factor = 0.75;
        const ghost = smoothedLandmarksRef.current;
        for (let i = 0; i < rawLm.length; i++) {
          const r = rawLm[i];
          const g = ghost[i];
          g.x = lerp(g.x, r.x, factor);
          g.y = lerp(g.y, r.y, factor);
          g.z = lerp(g.z, r.z, factor);
        }
      }

      // 3. USE SMOOTHED MESH FOR DRAWING
      const lm = smoothedLandmarksRef.current; // Override 'lm' to be the ghost mesh

      // COVER mapping (Video -> Canvas)
      let drawX = 0, drawY = 0, drawW = width, drawH = height;
      if (videoWidth > 0 && videoHeight > 0) {
        const screenRatio = width / height, videoRatio = videoWidth / videoHeight;
        let scale = screenRatio > videoRatio ? width / videoWidth : height / videoHeight;
        drawW = videoWidth * scale; drawH = videoHeight * scale;
        drawX = (width - drawW) / 2; drawY = (height - drawH) / 2;
      }

      // COORDINATE SYSTEM:
      // MediaPipe: x=0 (Actual Right/Stage Left) -> x=1 (Actual Left/Stage Right)
      // Mirror Mode: We flip the video horizontally.
      const mapX = (nx: number) => {
        // Mirror: 1.0 - nx
        return drawX + (1.0 - nx) * drawW;
      };
      const mapY = (ny: number) => drawY + ny * drawH;

      // Scan light
      const bTop = scanBoundsPx?.top ?? 0, bBot = scanBoundsPx?.bottom ?? height;
      const span = Math.max(1, bBot - bTop);
      const t = scanActiveRef.current ? ((now - scanStartRef.current) % scanDurationMs) / scanDurationMs : 0;
      const centerY = bTop + t * span;
      const bandHalf = Math.max(18, span * 0.06);
      const glowAtY = (yPx: number) => {
        const d = Math.abs(yPx - centerY);
        return Math.pow(Math.max(0, 1 - d / bandHalf), 2);
      };

      const drawConnections = (conn: any, stroke: string, lw: number, gs: number) => {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (const c of conn as any[]) {
          const a = Array.isArray(c) ? c[0] : c.start, b = Array.isArray(c) ? c[1] : c.end;
          const p1 = lm[a], p2 = lm[b]; if (!p1 || !p2) continue;
          const midY = (mapY(p1.y) + mapY(p2.y)) * 0.5;
          const g = scanActiveRef.current ? glowAtY(midY) : 0;
          ctx.strokeStyle = stroke.replace("__A__", String(Math.min(1, 0.3 + g * gs)));
          ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(mapX(p1.x), mapY(p1.y)); ctx.lineTo(mapX(p2.x), mapY(p2.y)); ctx.stroke();
        }
      };

      const drawPt = (idx: number, color: string, r = 4) => {
        const p = lm[idx]; if (!p) return;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mapX(p.x), mapY(p.y), r, 0, Math.PI * 2); ctx.fill();
      };

      // --- STABILIZER V4 LOGIC (Centroids) ---
      // 1. Canonical Space (Using SMOOTHED lm)
      const { canon } = buildCanonical(lm);

      // 2. Calculated Centroids (Virtual Points)
      // Note: We are now smoothing TWICE for centroids (Ghost Mesh + EMA). 
      // This is fine, it makes HUD super stable.
      const virtualZyL = calculateZygionCentroid(canon, "L", sZyL.current.stablePt);
      const virtualZyR = calculateZygionCentroid(canon, "R", sZyR.current.stablePt);
      const virtualGoL = calculateGonionCentroid(canon, "L", sGoL.current.stablePt);
      const virtualGoR = calculateGonionCentroid(canon, "R", sGoR.current.stablePt);

      // 3. Hysteresis Update
      const updateState = (ref: any, pt: any) => {
        ref.current.stablePt = ema(ref.current.stablePt, pt, 0.3);
      }

      updateState(sZyL, virtualZyL);
      updateState(sZyR, virtualZyR);
      updateState(sGoL, virtualGoL);
      updateState(sGoR, virtualGoR);

      // 4. Transform Virtual Points from Head Space to Screen Space for Drawing
      const { origin, axes, iod, canon: allCanon } = buildCanonical(lm);

      const toScreen = (p: { x: number, y: number, z?: number }) => {
        const dx = (p.x * axes.x.x + p.y * axes.y.x + (p.z || 0) * axes.z.x);
        const dy = (p.x * axes.x.y + p.y * axes.y.y + (p.z || 0) * axes.z.y);
        const sx = origin.x + dx * iod;
        const sy = origin.y + dy * iod;
        return { x: sx, y: sy };
      };

      const drawVirtual = (pt: any, color: string, r = 7) => {
        if (!pt) return;
        const s = toScreen(pt);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mapX(s.x), mapY(s.y), r, 0, Math.PI * 2); ctx.fill();
      };

      const nIdx = 168, meIdx = 152;

      // --- MESH CLIPPING (internal) ---
      ctx.save();
      if (clipEllipse) {
        ctx.beginPath();
        ctx.ellipse(clipEllipse.cx, clipEllipse.cy, clipEllipse.rx, clipEllipse.ry, 0, 0, Math.PI * 2);
        ctx.clip();
      }

      // Draw Mesh Wireframe (UX)
      drawConnections(FACEMESH_TESSELATION, "rgba(255,255,255,__A__)", 0.4, 0.4);
      drawConnections(FACEMESH_LEFT_EYEBROW, "rgba(255,255,255,__A__)", 0.8, 0.7);
      drawConnections(FACEMESH_RIGHT_EYEBROW, "rgba(255,255,255,__A__)", 0.8, 0.7);

      // (DEBUG DOTS REMOVED)

      ctx.restore();

      // (HUD REMOVED)


      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [height, width, videoWidth, videoHeight, landmarks, landmarksRef, scanActive, scanDurationMs, scanBoundsPx, stride, clipEllipse]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FaceMeshOverlay;
