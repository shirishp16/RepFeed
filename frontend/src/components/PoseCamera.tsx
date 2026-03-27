'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  initPoseLandmarker,
  processFrame,
  createRepState,
  POSE_CONNECTIONS,
  LEFT_LEG_SET,
  RIGHT_LEG_SET,
  getHighlightedJoints,
  getVertexIdx,
  type Detection,
  type RepState,
} from '@/lib/poseDetection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PoseCameraProps {
  detection: Detection;
  onRepCounted: (newCount: number) => void;
  onFormUpdate: (score: number) => void;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Landmark smoothing
// ---------------------------------------------------------------------------

const SMOOTH_FRAMES = 5;

function smoothLandmarks(
  raw: NormalizedLandmark[],
  bufferRef: { current: NormalizedLandmark[][] },
): NormalizedLandmark[] {
  bufferRef.current.push(raw);
  if (bufferRef.current.length > SMOOTH_FRAMES) bufferRef.current.shift();
  const n = bufferRef.current.length;
  return raw.map((_, idx) => {
    let sx = 0, sy = 0, sz = 0, sv = 0;
    for (const frame of bufferRef.current) {
      sx += frame[idx].x;
      sy += frame[idx].y;
      sz += frame[idx].z ?? 0;
      sv += frame[idx].visibility ?? 0;
    }
    return { x: sx / n, y: sy / n, z: sz / n, visibility: sv / n };
  });
}

// ---------------------------------------------------------------------------
// Skeleton drawing
// ---------------------------------------------------------------------------

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  canvas: HTMLCanvasElement,
  highlightedJoints: number[],
  angle: number,
  angleJointIdx: number | null,
  activeSide: 'left' | 'right' | 'both',
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror landmarks (video is CSS-flipped, canvas coordinates must match)
  const mirrored = landmarks.map((l) => ({ ...l, x: 1 - l.x }));

  const isInactive = (idx: number) => {
    if (activeSide === 'both') return false;
    return activeSide === 'left' ? RIGHT_LEG_SET.has(idx) : LEFT_LEG_SET.has(idx);
  };

  // Draw connections
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = mirrored[startIdx];
    const end = mirrored[endIdx];
    if (!start || !end) continue;
    if ((start.visibility ?? 0) <= 0.5 || (end.visibility ?? 0) <= 0.5) continue;

    const dimmed = isInactive(startIdx) && isInactive(endIdx);
    ctx.beginPath();
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.strokeStyle = dimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = dimmed ? 2 : 3;
    ctx.stroke();
  }

  // Draw landmarks
  const highlightSet = new Set(highlightedJoints);
  for (let idx = 0; idx < mirrored.length; idx++) {
    const lm = mirrored[idx];
    if ((lm.visibility ?? 0) < 0.5) continue;

    const cx = lm.x * canvas.width;
    const cy = lm.y * canvas.height;
    const dimmed = isInactive(idx);
    const highlighted = highlightSet.has(idx) && !dimmed;

    if (dimmed) {
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#2DD4BF';
      ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }

    if (highlighted) {
      const pulse = Math.sin(performance.now() / 150) * 0.15 + 1.0;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14 * pulse, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, highlighted ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = highlighted ? '#F97316' : '#2DD4BF';
    ctx.fill();
  }

  // Draw angle near the vertex joint (middle of the triplet)
  if (angleJointIdx != null && angle > 0) {
    const joint = mirrored[angleJointIdx];
    if (joint && (joint.visibility ?? 0) > 0.5) {
      const jx = joint.x * canvas.width + 20;
      const jy = joint.y * canvas.height;
      ctx.font = 'bold 18px JetBrains Mono, monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(`${angle}°`, jx, jy);
      ctx.fillText(`${angle}°`, jx, jy);
    }
  }
}

// ---------------------------------------------------------------------------
// Body framing guide SVG
// ---------------------------------------------------------------------------

function BodyFramingGuide() {
  return (
    <svg
      viewBox="0 0 60 130"
      className="w-10 h-24 opacity-60"
      stroke="white"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="30" cy="10" r="7" />
      <line x1="30" y1="17" x2="30" y2="58" />
      <line x1="30" y1="30" x2="14" y2="50" />
      <line x1="30" y1="30" x2="46" y2="50" />
      <line x1="30" y1="58" x2="20" y2="90" />
      <line x1="30" y1="58" x2="40" y2="90" />
      <line x1="20" y1="90" x2="16" y2="118" />
      <line x1="40" y1="90" x2="44" y2="118" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PoseCamera({
  detection,
  onRepCounted,
  onFormUpdate,
  isActive,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const repStateRef = useRef<RepState>(createRepState());
  const streamRef = useRef<MediaStream | null>(null);
  const lastRepCount = useRef(0);
  const frameCountRef = useRef(0);

  // Smoothing buffer
  const landmarkBufferRef = useRef<NormalizedLandmark[][]>([]);

  // Stable refs for props (avoid useEffect re-triggers)
  const detectionRef = useRef(detection);
  const onRepCountedRef = useRef(onRepCounted);
  const onFormUpdateRef = useRef(onFormUpdate);
  detectionRef.current = detection;
  onRepCountedRef.current = onRepCounted;
  onFormUpdateRef.current = onFormUpdate;

  // Active side for single-side exercises
  const activeSideRef = useRef<'left' | 'right'>('left');
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');

  // UI state
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const isSingleSide = detection.side !== 'both';

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    repStateRef.current = createRepState();
    lastRepCount.current = 0;
    landmarkBufferRef.current = [];
    frameCountRef.current = 0;
  }, []);

  const switchSide = useCallback(() => {
    const next = activeSideRef.current === 'left' ? 'right' as const : 'left' as const;
    activeSideRef.current = next;
    setActiveSide(next);
    repStateRef.current = createRepState();
    lastRepCount.current = 0;
    landmarkBufferRef.current = [];
  }, []);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      setLoading(true);
      setReady(false);
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;

        // Wait for video metadata so dimensions are available
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) resolve();
          else video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });

        await video.play();

        const pose = await initPoseLandmarker();
        if (cancelled) return;

        setLoading(false);

        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;

        // Short delay then mark ready (let user see themselves first)
        setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 500);

        function detectFrame() {
          if (cancelled || !pose) return;

          try {
            frameCountRef.current++;

            // Throttle: only run detection every other frame to reduce load
            if (frameCountRef.current % 2 !== 0) {
              animFrameRef.current = requestAnimationFrame(detectFrame);
              return;
            }

            // Don't call detectForVideo until video is actually playing
            if (video.readyState < 2) {
              animFrameRef.current = requestAnimationFrame(detectFrame);
              return;
            }

            const results = pose.detectForVideo(video, performance.now());
            const landmarks = results.landmarks?.[0];

            if (landmarks) {
              const smoothed = smoothLandmarks(landmarks, landmarkBufferRef);
              const det = detectionRef.current;
              const side = activeSideRef.current;

              // Process rep state
              repStateRef.current = processFrame(
                smoothed,
                det,
                side,
                repStateRef.current,
              );

              // Notify parent of rep count changes
              if (repStateRef.current.count > lastRepCount.current) {
                lastRepCount.current = repStateRef.current.count;
                onRepCountedRef.current(repStateRef.current.count);
              }

              // Throttle form updates to every 10 frames
              if (frameCountRef.current % 10 === 0) {
                onFormUpdateRef.current(repStateRef.current.formScore);
              }

              // Debug logging every 60 frames (~1s)
              if (frameCountRef.current % 60 === 0) {
                console.log('[PoseCamera]', {
                  angle: repStateRef.current.currentAngle,
                  phase: repStateRef.current.phase,
                  count: repStateRef.current.count,
                  formScore: repStateRef.current.formScore,
                });
              }

              // Draw skeleton
              const joints = getHighlightedJoints(det, side);
              const vertexIdx = getVertexIdx(det, side);
              drawSkeleton(
                ctx,
                smoothed,
                canvas,
                joints,
                repStateRef.current.currentAngle,
                vertexIdx,
                det.side === 'both' ? 'both' : side,
              );
            }
            // If no landmarks detected, skip drawing — leave previous frame visible
            // (do NOT clear canvas, which causes black flashing)

            animFrameRef.current = requestAnimationFrame(detectFrame);
          } catch (err) {
            console.error('[PoseCamera] Detection error:', err);
            animFrameRef.current = requestAnimationFrame(detectFrame);
          }
        }

        animFrameRef.current = requestAnimationFrame(detectFrame);
      } catch (err: unknown) {
        if (cancelled) return;
        if (
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'NotFoundError')
        ) {
          setPermissionDenied(true);
        }
        setLoading(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isActive, cleanup]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (permissionDenied) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-card">
        <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <p className="font-outfit text-sm text-text-secondary text-center max-w-[260px]">
          Camera access is needed for pose tracking. Please allow camera access
          in your browser settings.
        </p>
      </div>
    );
  }

  const sideLabel = activeSide === 'left' ? 'LEFT' : 'RIGHT';

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-text-muted tracking-wide">
              Loading pose model...
            </p>
          </div>
        </div>
      )}

      {/* "Get ready" overlay before tracking starts */}
      <AnimatePresence>
        {!loading && !ready && (
          <motion.div
            key="get_ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/55"
          >
            <BodyFramingGuide />
            <p className="font-outfit text-2xl font-bold text-white text-center leading-tight">
              Step back so your<br />full body is visible
            </p>
            <p className="font-mono text-xs text-white/60 tracking-wide">
              Tracking will start automatically
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webcam feed (CSS-mirrored) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Canvas skeleton overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Switch side button (single-side exercises only) */}
      {isSingleSide && ready && (
        <button
          onClick={switchSide}
          className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white text-xs font-mono tracking-wide"
        >
          {sideLabel} — Tap to switch
        </button>
      )}
    </div>
  );
}
