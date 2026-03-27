// MediaPipe Pose Detection Engine
// Pure TypeScript — no React. Imported by PoseCamera.tsx.

import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExerciseType =
  | 'squat'
  | 'wall_sit'
  | 'calf_raise'
  | 'hamstring_curl'
  | 'single_leg_balance'
  | 'single_leg_rdl'
  | 'generic';

export interface ExerciseState {
  repState: 'up' | 'down' | 'hold';
  angle: number;
  formScore: number;
}

export interface RepTracker {
  count: number;
  lastState: 'up' | 'down' | 'hold' | null;
  formScores: number[];
  currentAngle: number;
  isHolding: boolean;
  holdStartTime: number | null;
  holdDuration: number;
}

// ---------------------------------------------------------------------------
// Landmark indices
// ---------------------------------------------------------------------------

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;
const LEFT_HEEL = 29;
const RIGHT_HEEL = 30;
const LEFT_FOOT_INDEX = 31;
const RIGHT_FOOT_INDEX = 32;

// ---------------------------------------------------------------------------
// Connections & highlight maps (used by PoseCamera for drawing)
// ---------------------------------------------------------------------------

export const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
];

export const EXERCISE_JOINTS: Record<ExerciseType, number[]> = {
  squat: [23, 24, 25, 26, 27, 28],
  wall_sit: [23, 24, 25, 26, 27, 28],
  calf_raise: [25, 26, 27, 28, 29, 30, 31, 32],
  hamstring_curl: [23, 24, 25, 26, 27, 28],
  single_leg_balance: [23, 24, 25, 26, 27, 28],
  single_leg_rdl: [11, 12, 23, 24, 25, 26],
  generic: [],
};

// ---------------------------------------------------------------------------
// Singleton landmarker
// ---------------------------------------------------------------------------

let landmarker: PoseLandmarker | null = null;
let initPromise: Promise<PoseLandmarker> | null = null;

export async function initPoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { PoseLandmarker, FilesetResolver } = await import(
      '@mediapipe/tasks-vision'
    );

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );

    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });

    return landmarker;
  })();

  return initPromise;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number }, // vertex
  c: { x: number; y: number },
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/** Average a landmark pair (left/right) weighted by visibility. */
function avg(
  landmarks: NormalizedLandmark[],
  leftIdx: number,
  rightIdx: number,
): { x: number; y: number; vis: number } {
  const l = landmarks[leftIdx];
  const r = landmarks[rightIdx];
  const lv = l.visibility ?? 0;
  const rv = r.visibility ?? 0;
  const total = lv + rv || 1;
  return {
    x: (l.x * lv + r.x * rv) / total,
    y: (l.y * lv + r.y * rv) / total,
    vis: Math.max(lv, rv),
  };
}

// ---------------------------------------------------------------------------
// Exercise detectors
// ---------------------------------------------------------------------------

export function detectSquat(landmarks: NormalizedLandmark[]): ExerciseState {
  const hip = avg(landmarks, LEFT_HIP, RIGHT_HIP);
  const knee = avg(landmarks, LEFT_KNEE, RIGHT_KNEE);
  const ankle = avg(landmarks, LEFT_ANKLE, RIGHT_ANKLE);
  const shoulder = avg(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);

  const kneeAngle = calculateAngle(hip, knee, ankle);

  // Rep state
  let repState: ExerciseState['repState'] = 'hold';
  if (kneeAngle < 120) repState = 'down';
  else if (kneeAngle > 160) repState = 'up';

  // Form score — start at realistic baseline, penalise form errors
  let formScore = 85;
  // Penalise knees going too far past toes (knee x vs ankle x)
  const kneeOverToe = Math.abs(knee.x - ankle.x);
  if (kneeOverToe > 0.06) formScore -= Math.min(25, (kneeOverToe - 0.06) * 400);
  // Penalise forward lean (shoulder x far from hip x)
  const lean = Math.abs(shoulder.x - hip.x);
  if (lean > 0.08) formScore -= Math.min(25, (lean - 0.08) * 300);
  formScore = Math.max(0, Math.round(formScore));

  return { repState, angle: Math.round(kneeAngle), formScore };
}

export function detectWallSit(landmarks: NormalizedLandmark[]): ExerciseState {
  const hip = avg(landmarks, LEFT_HIP, RIGHT_HIP);
  const knee = avg(landmarks, LEFT_KNEE, RIGHT_KNEE);
  const ankle = avg(landmarks, LEFT_ANKLE, RIGHT_ANKLE);
  const shoulder = avg(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);

  const kneeAngle = calculateAngle(hip, knee, ankle);

  let repState: ExerciseState['repState'] = 'up';
  if (kneeAngle >= 70 && kneeAngle <= 110) repState = 'hold';

  // Form: back should be vertical (shoulder x ≈ hip x)
  let formScore = 85;
  const backLean = Math.abs(shoulder.x - hip.x);
  if (backLean > 0.05) formScore -= Math.min(35, (backLean - 0.05) * 400);
  formScore = Math.max(0, Math.round(formScore));

  return { repState, angle: Math.round(kneeAngle), formScore };
}

export function detectCalfRaise(
  landmarks: NormalizedLandmark[],
): ExerciseState {
  const knee = avg(landmarks, LEFT_KNEE, RIGHT_KNEE);
  const ankle = avg(landmarks, LEFT_ANKLE, RIGHT_ANKLE);
  const heel = avg(landmarks, LEFT_HEEL, RIGHT_HEEL);
  const toe = avg(landmarks, LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX);

  // Heel height relative to toe: when heel is above toe → raised
  const heelLift = toe.y - heel.y; // positive = heel raised

  let repState: ExerciseState['repState'] = 'hold';
  if (heelLift > 0.02) repState = 'up';
  else if (heelLift < 0.005) repState = 'down';

  // Angle for display: knee straightness
  const hipAvg = avg(landmarks, LEFT_HIP, RIGHT_HIP);
  const kneeAngle = calculateAngle(hipAvg, knee, ankle);

  // Form: knees should stay straight (> 170°)
  let formScore = 85;
  if (kneeAngle < 170) formScore -= Math.min(35, (170 - kneeAngle) * 2.5);
  formScore = Math.max(0, Math.round(formScore));

  return { repState, angle: Math.round(kneeAngle), formScore };
}

export function detectHamstringCurl(
  landmarks: NormalizedLandmark[],
): ExerciseState {
  const hip = avg(landmarks, LEFT_HIP, RIGHT_HIP);
  const knee = avg(landmarks, LEFT_KNEE, RIGHT_KNEE);
  const ankle = avg(landmarks, LEFT_ANKLE, RIGHT_ANKLE);
  const shoulder = avg(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);

  // Hip-knee-ankle angle: ~170° when standing straight, ~90-130° when curled
  const kneeAngle = calculateAngle(hip, knee, ankle);

  let repState: ExerciseState['repState'] = 'hold';
  if (kneeAngle > 160) repState = 'up';       // leg straight (standing)
  else if (kneeAngle < 130) repState = 'down'; // foot kicked back toward glute

  // Form score: hip stability (hip y shouldn't drift) + upright torso
  let formScore = 85; // realistic baseline — not perfect by default
  // Penalise hip hiking (shoulder-hip vertical delta: torso should stay upright)
  const torsoLean = Math.abs(shoulder.x - hip.x);
  if (torsoLean > 0.06) formScore -= Math.min(25, (torsoLean - 0.06) * 400);
  // Penalise hip moving forward/backward relative to knee
  const hipDrift = Math.abs(hip.x - knee.x);
  if (hipDrift > 0.15) formScore -= Math.min(20, (hipDrift - 0.15) * 200);
  formScore = Math.max(0, Math.round(formScore));

  return { repState, angle: Math.round(kneeAngle), formScore };
}

// ---------------------------------------------------------------------------
// Rep tracking
// ---------------------------------------------------------------------------

export function createRepTracker(): RepTracker {
  return {
    count: 0,
    lastState: null,
    formScores: [],
    currentAngle: 0,
    isHolding: false,
    holdStartTime: null,
    holdDuration: 0,
  };
}

export function updateRepCount(
  tracker: RepTracker,
  state: ExerciseState,
  exerciseType: ExerciseType,
): RepTracker {
  const next: RepTracker = { ...tracker, currentAngle: state.angle };

  // Push form score (rolling window of 10)
  next.formScores = [...tracker.formScores, state.formScore].slice(-10);

  const isHoldExercise =
    exerciseType === 'wall_sit' || exerciseType === 'single_leg_balance';

  if (isHoldExercise) {
    if (state.repState === 'hold') {
      if (!tracker.isHolding) {
        // Started holding
        next.isHolding = true;
        next.holdStartTime = performance.now();
        next.holdDuration = 0;
      } else {
        // Continue holding
        next.holdDuration = performance.now() - (tracker.holdStartTime ?? performance.now());
        // Every 5 seconds of hold counts as 1 "rep"
        const holdReps = Math.floor(next.holdDuration / 5000);
        if (holdReps > tracker.count) {
          next.count = holdReps;
        }
      }
    } else {
      // Stopped holding
      next.isHolding = false;
      next.holdStartTime = null;
    }
  } else {
    // Rep-based: count on down → up transition
    if (tracker.lastState === 'down' && state.repState === 'up') {
      next.count = tracker.count + 1;
    }
  }

  next.lastState = state.repState;
  return next;
}

/** Average of the rolling form score window. */
export function avgFormScore(tracker: RepTracker): number {
  if (tracker.formScores.length === 0) return 0;
  const sum = tracker.formScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / tracker.formScores.length);
}
