'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  initPoseLandmarker,
  detectSquat,
  detectWallSit,
  detectCalfRaise,
  detectHamstringCurl,
  detectActiveLeg,
  updateRepCount,
  createRepTracker,
  avgFormScore,
  POSE_CONNECTIONS,
  EXERCISE_JOINTS,
  type ExerciseType,
  type ActiveLeg,
  type RepTracker,
} from '@/lib/poseDetection';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type CalibrationPhase = 'stand_back' | 'detecting' | 'confirmed' | 'tracking';

// Exercises that need single-leg calibration
const SINGLE_LEG_EXERCISES = new Set<ExerciseType>([
  'hamstring_curl',
  'calf_raise',
  'single_leg_balance',
]);

// Leg index sets (MediaPipe indices)
const LEFT_LEG_SET = new Set([23, 25, 27, 29, 31]);
const RIGHT_LEG_SET = new Set([24, 26, 28, 30, 32]);

interface PoseCameraProps {
  exerciseType: ExerciseType;
  onRepCounted: (newCount: number) => void;
  onFormUpdate: (score: number) => void;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Detector dispatch
// ---------------------------------------------------------------------------

function detect(
  type: ExerciseType,
  landmarks: NormalizedLandmark[],
  activeLeg: ActiveLeg,
) {
  switch (type) {
    case 'squat':
      return detectSquat(landmarks);
    case 'wall_sit':
      return detectWallSit(landmarks);
    case 'calf_raise':
      return detectCalfRaise(landmarks, activeLeg);
    case 'hamstring_curl':
      return detectHamstringCurl(landmarks, activeLeg);
    default:
      return detectSquat(landmarks);
  }
}

// ---------------------------------------------------------------------------
// Visibility helpers
// ---------------------------------------------------------------------------

function lowerBodyVisible(landmarks: NormalizedLandmark[]): boolean {
  return [23, 24, 25, 26, 27, 28].every(
    (i) => (landmarks[i]?.visibility ?? 0) > 0.5,
  );
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
  exerciseType: ExerciseType,
  activeLeg: ActiveLeg,
  isTracking: boolean,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror landmarks (video is CSS-flipped, canvas coordinates must match)
  const mirrored = landmarks.map((l) => ({ ...l, x: 1 - l.x }));

  const isInactive = (idx: number) => {
    if (!isTracking || activeLeg === 'both') return false;
    return activeLeg === 'left' ? RIGHT_LEG_SET.has(idx) : LEFT_LEG_SET.has(idx);
  };

  // Draw connections
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = mirrored[startIdx];
    const end = mirrored[endIdx];
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
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(249,115,22,0.35)';
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, highlighted ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = highlighted ? '#F97316' : '#2DD4BF';
    ctx.fill();
  }

  // Draw angle near the active leg's knee
  if (exerciseType !== 'generic' && angle > 0) {
    const kneeIdx = activeLeg === 'right' ? 26 : 25;
    const knee = mirrored[kneeIdx];
    if ((knee.visibility ?? 0) > 0.5) {
      const kx = knee.x * canvas.width + 20;
      const ky = knee.y * canvas.height;
      ctx.font = 'bold 18px JetBrains Mono, monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(`${angle}°`, kx, ky);
      ctx.fillText(`${angle}°`, kx, ky);
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
  exerciseType,
  onRepCounted,
  onFormUpdate,
  isActive,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const trackerRef = useRef<RepTracker>(createRepTracker());
  const streamRef = useRef<MediaStream | null>(null);
  const lastRepCount = useRef(0);

  // Calibration refs — updated synchronously in the animation loop
  const calibPhaseRef = useRef<CalibrationPhase>('stand_back');
  const activeLegRef = useRef<ActiveLeg>('both');
  const frameBufferRef = useRef<NormalizedLandmark[][]>([]);
  const phaseStartRef = useRef<number>(0);

  // UI state — drives re-renders
  const [calibPhase, setCalibPhase] = useState<CalibrationPhase>('stand_back');
  const [activeLeg, setActiveLeg] = useState<ActiveLeg>('both');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSingleLeg = SINGLE_LEG_EXERCISES.has(exerciseType);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    trackerRef.current = createRepTracker();
    lastRepCount.current = 0;
    calibPhaseRef.current = 'stand_back';
    activeLegRef.current = 'both';
    frameBufferRef.current = [];
  }, []);

  const switchLeg = useCallback(() => {
    const next: ActiveLeg =
      activeLegRef.current === 'left' ? 'right' : 'left';
    activeLegRef.current = next;
    setActiveLeg(next);
    // Reset tracker when switching legs mid-exercise
    trackerRef.current = createRepTracker();
    lastRepCount.current = 0;
  }, []);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      setCalibPhase('stand_back');
      setActiveLeg('both');
      setLoading(true);
      return;
    }

    let cancelled = false;

    // Two-leg exercises skip calibration
    const initialPhase: CalibrationPhase = isSingleLeg ? 'stand_back' : 'tracking';
    calibPhaseRef.current = initialPhase;
    activeLegRef.current = isSingleLeg ? 'both' : 'both';
    phaseStartRef.current = performance.now();
    setCalibPhase(initialPhase);

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
        await video.play();

        const pose = await initPoseLandmarker();
        if (cancelled) return;

        setLoading(false);
        phaseStartRef.current = performance.now();

        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;

        function detectFrame() {
          if (cancelled) return;

          const results = pose.detectForVideo(video, performance.now());
          const landmarks = results.landmarks?.[0];

          if (landmarks) {
            const phase = calibPhaseRef.current;
            const elapsed = performance.now() - phaseStartRef.current;

            // ── Calibration phase transitions ──────────────────────────────
            if (phase === 'stand_back') {
              if (elapsed > 2000 || lowerBodyVisible(landmarks)) {
                calibPhaseRef.current = 'detecting';
                phaseStartRef.current = performance.now();
                frameBufferRef.current = [];
                setCalibPhase('detecting');
              }
            } else if (phase === 'detecting') {
              frameBufferRef.current.push(landmarks);
              if (elapsed > 1500) {
                const leg = detectActiveLeg(frameBufferRef.current);
                activeLegRef.current = leg;
                calibPhaseRef.current = 'confirmed';
                phaseStartRef.current = performance.now();
                setActiveLeg(leg);
                setCalibPhase('confirmed');
              }
            } else if (phase === 'confirmed') {
              if (elapsed > 1000) {
                calibPhaseRef.current = 'tracking';
                setCalibPhase('tracking');
              }
            } else {
              // ── Normal tracking ────────────────────────────────────────
              const state = detect(
                exerciseType,
                landmarks,
                activeLegRef.current,
              );

              trackerRef.current = updateRepCount(
                trackerRef.current,
                state,
                exerciseType,
              );

              if (trackerRef.current.count > lastRepCount.current) {
                lastRepCount.current = trackerRef.current.count;
                onRepCounted(trackerRef.current.count);
              }

              onFormUpdate(avgFormScore(trackerRef.current));

              drawSkeleton(
                ctx,
                landmarks,
                canvas,
                EXERCISE_JOINTS[exerciseType] ?? [],
                state.angle,
                exerciseType,
                activeLegRef.current,
                true,
              );

              animFrameRef.current = requestAnimationFrame(detectFrame);
              return;
            }

            // Draw skeleton during calibration (no dimming, highlight lower body)
            drawSkeleton(
              ctx,
              landmarks,
              canvas,
              [23, 24, 25, 26, 27, 28],
              0,
              exerciseType,
              'both',
              false,
            );
          }

          animFrameRef.current = requestAnimationFrame(detectFrame);
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
  }, [isActive, exerciseType, isSingleLeg, onRepCounted, onFormUpdate, cleanup]);

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

  const legLabel = activeLeg === 'left' ? 'LEFT LEG' : 'RIGHT LEG';

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

      {/* ── Calibration overlays ──────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Phase 1: Stand back */}
        {calibPhase === 'stand_back' && (
          <motion.div
            key="stand_back"
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
              We need to see your legs clearly
            </p>
          </motion.div>
        )}

        {/* Phase 2: Detecting active leg */}
        {calibPhase === 'detecting' && (
          <motion.div
            key="detecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="flex gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="w-2 h-2 rounded-full bg-accent" />
            </motion.div>
            <p className="font-mono text-sm text-white tracking-widest">
              DETECTING ACTIVE LEG
            </p>
          </motion.div>
        )}

        {/* Phase 3: Leg confirmed */}
        {calibPhase === 'confirmed' && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/50"
          >
            <motion.p
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="font-outfit text-5xl font-bold text-accent leading-none"
            >
              {legLabel}
            </motion.p>
            <p className="font-mono text-sm text-white/70 tracking-widest">
              DETECTED
            </p>
            <button
              onClick={switchLeg}
              className="mt-2 px-5 py-2 rounded-full border border-white/30 bg-white/10 text-white text-sm font-outfit"
            >
              Switch Leg
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Switch Leg button during tracking (single-leg only) ───────────── */}
      {calibPhase === 'tracking' && isSingleLeg && (
        <button
          onClick={switchLeg}
          className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white text-xs font-mono tracking-wide"
        >
          Switch Leg
        </button>
      )}
    </div>
  );
}
