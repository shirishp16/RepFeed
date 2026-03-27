'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  initPoseLandmarker,
  detectSquat,
  detectWallSit,
  detectCalfRaise,
  detectHamstringCurl,
  updateRepCount,
  createRepTracker,
  avgFormScore,
  POSE_CONNECTIONS,
  EXERCISE_JOINTS,
  type ExerciseType,
  type RepTracker,
} from '@/lib/poseDetection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PoseCameraProps {
  exerciseType: ExerciseType;
  onRepCounted: (newCount: number) => void;
  onFormUpdate: (score: number) => void;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Detector dispatch
// ---------------------------------------------------------------------------

function detect(type: ExerciseType, landmarks: NormalizedLandmark[]) {
  switch (type) {
    case 'squat':
      return detectSquat(landmarks);
    case 'wall_sit':
      return detectWallSit(landmarks);
    case 'calf_raise':
      return detectCalfRaise(landmarks);
    case 'hamstring_curl':
      return detectHamstringCurl(landmarks);
    // Unsupported types fall through to a simple skeleton display
    default:
      return detectSquat(landmarks); // use squat as generic fallback
  }
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
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror landmarks for drawing (webcam is mirrored via CSS)
  const mirrored = landmarks.map((l) => ({
    ...l,
    x: 1 - l.x,
  }));

  // Draw connections
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = mirrored[startIdx];
    const end = mirrored[endIdx];
    if ((start.visibility ?? 0) > 0.5 && (end.visibility ?? 0) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Draw landmarks
  const highlightSet = new Set(highlightedJoints);
  for (let idx = 0; idx < mirrored.length; idx++) {
    const lm = mirrored[idx];
    if ((lm.visibility ?? 0) < 0.5) continue;

    const cx = lm.x * canvas.width;
    const cy = lm.y * canvas.height;
    const isHighlighted = highlightSet.has(idx);

    // Glow behind highlighted joints
    if (isHighlighted) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, isHighlighted ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = isHighlighted ? '#F97316' : '#2DD4BF';
    ctx.fill();
  }

  // Draw angle near the measured joint (knee for most exercises)
  if (exerciseType !== 'generic' && angle > 0) {
    // Pick the knee midpoint for display
    const leftKnee = mirrored[25];
    const rightKnee = mirrored[26];
    const kneeVis = Math.max(leftKnee.visibility ?? 0, rightKnee.visibility ?? 0);
    if (kneeVis > 0.5) {
      const kx = ((leftKnee.x + rightKnee.x) / 2) * canvas.width + 20;
      const ky = ((leftKnee.y + rightKnee.y) / 2) * canvas.height;
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

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        // Get webcam stream
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

        // Init MediaPipe
        const pose = await initPoseLandmarker();
        if (cancelled) return;

        setLoading(false);

        // Set canvas dimensions to match video
        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d')!;
        const highlightedJoints = EXERCISE_JOINTS[exerciseType] ?? [];

        // Detection loop
        function detectFrame() {
          if (cancelled) return;

          const results = pose.detectForVideo(video, performance.now());

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const state = detect(exerciseType, landmarks);

            // Update tracker
            trackerRef.current = updateRepCount(
              trackerRef.current,
              state,
              exerciseType,
            );

            // Notify parent of rep changes
            if (trackerRef.current.count > lastRepCount.current) {
              lastRepCount.current = trackerRef.current.count;
              onRepCounted(trackerRef.current.count);
            }

            // Notify parent of form score (rolling avg)
            onFormUpdate(avgFormScore(trackerRef.current));

            // Draw skeleton
            drawSkeleton(
              ctx,
              landmarks,
              canvas,
              highlightedJoints,
              state.angle,
              exerciseType,
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
  }, [isActive, exerciseType, onRepCounted, onFormUpdate, cleanup]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

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

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-text-muted tracking-wide">
              Loading pose model...
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
