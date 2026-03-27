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

export type ActiveLeg = 'left' | 'right' | 'both';

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
  lastRepTime: number | null;
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
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
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

  // Rep state — relaxed threshold so mini squats (~135°) register
  let repState: ExerciseState['repState'] = 'hold';
  if (kneeAngle < 140) repState = 'down';
  else if (kneeAngle > 160) repState = 'up';

  // Form score — start at 100, deduct for each form error
  let formScore = 100;

  // Knees caving inward (left knee x < left ankle x, right knee x > right ankle x)
  const lk = landmarks[LEFT_KNEE];
  const la = landmarks[LEFT_ANKLE];
  const rk = landmarks[RIGHT_KNEE];
  const ra = landmarks[RIGHT_ANKLE];
  if ((lk.visibility ?? 0) > 0.5 && (la.visibility ?? 0) > 0.5) {
    if (lk.x < la.x) formScore -= 15;
  }
  if ((rk.visibility ?? 0) > 0.5 && (ra.visibility ?? 0) > 0.5) {
    if (rk.x > ra.x) formScore -= 15;
  }

  // Back not straight (shoulder-hip angle > 20° from vertical)
  const leanDeg =
    Math.atan2(Math.abs(shoulder.x - hip.x), Math.abs(hip.y - shoulder.y + 0.001)) *
    (180 / Math.PI);
  if (leanDeg > 20) formScore -= Math.min(20, (leanDeg - 20) * 1.5);

  // Uneven weight distribution (left vs right knee angle diff > 15°)
  const leftKneeAngle = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);
  const rightKneeAngle = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);
  if (Math.abs(leftKneeAngle - rightKneeAngle) > 15) formScore -= 10;

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

  // Form score — start at 100
  let formScore = 100;

  // Knee angle should be 80-100° (deduct based on distance from 90°)
  const angleDeviation = Math.abs(kneeAngle - 90);
  if (angleDeviation > 10) formScore -= Math.min(20, (angleDeviation - 10) * 2);

  // Back not flat (shoulder-hip not vertically aligned)
  const backLeanDeg =
    Math.atan2(Math.abs(shoulder.x - hip.x), Math.abs(hip.y - shoulder.y + 0.001)) *
    (180 / Math.PI);
  if (backLeanDeg > 10) formScore -= Math.min(15, (backLeanDeg - 10) * 1.5);

  // Knees past toes (knee x vs ankle x lateral offset)
  const kneeForward = Math.abs(knee.x - ankle.x);
  if (kneeForward > 0.06) formScore -= Math.min(10, (kneeForward - 0.06) * 150);

  formScore = Math.max(0, Math.round(formScore));
  return { repState, angle: Math.round(kneeAngle), formScore };
}

export function detectCalfRaise(
  landmarks: NormalizedLandmark[],
  activeLeg: ActiveLeg = 'both',
): ExerciseState {
  const side = activeLeg === 'right' ? 'right' : activeLeg === 'left' ? 'left' : null;

  const knee = side
    ? landmarks[side === 'right' ? RIGHT_KNEE : LEFT_KNEE]
    : avg(landmarks, LEFT_KNEE, RIGHT_KNEE);
  const ankle = side
    ? landmarks[side === 'right' ? RIGHT_ANKLE : LEFT_ANKLE]
    : avg(landmarks, LEFT_ANKLE, RIGHT_ANKLE);
  const heel = side
    ? landmarks[side === 'right' ? RIGHT_HEEL : LEFT_HEEL]
    : avg(landmarks, LEFT_HEEL, RIGHT_HEEL);
  const toe = side
    ? landmarks[side === 'right' ? RIGHT_FOOT_INDEX : LEFT_FOOT_INDEX]
    : avg(landmarks, LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX);
  const hip = side
    ? landmarks[side === 'right' ? RIGHT_HIP : LEFT_HIP]
    : avg(landmarks, LEFT_HIP, RIGHT_HIP);

  const heelLift = toe.y - heel.y;

  let repState: ExerciseState['repState'] = 'hold';
  if (heelLift > 0.02) repState = 'up';
  else if (heelLift < 0.005) repState = 'down';

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const shoulderAvg = avg(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);
  const hipAvg = avg(landmarks, LEFT_HIP, RIGHT_HIP);

  // Form score — start at 100
  let formScore = 100;

  // Knees bending during raise (knee angle < 165°)
  if (kneeAngle < 165) formScore -= Math.min(20, (165 - kneeAngle) * 2);

  // Leaning forward (shoulder x deviates from hip x)
  const forwardLean = Math.abs(shoulderAvg.x - hipAvg.x);
  if (forwardLean > 0.06) formScore -= Math.min(15, (forwardLean - 0.06) * 200);

  // Uneven rise — bilateral only (left vs right ankle y difference)
  if (!side) {
    const leftAnkleY = landmarks[LEFT_ANKLE].y;
    const rightAnkleY = landmarks[RIGHT_ANKLE].y;
    const ankleYDiff = Math.abs(leftAnkleY - rightAnkleY);
    if (ankleYDiff > 0.03) formScore -= Math.min(10, (ankleYDiff - 0.03) * 200);
  }

  formScore = Math.max(0, Math.round(formScore));
  return { repState, angle: Math.round(kneeAngle), formScore };
}

export function detectHamstringCurl(
  landmarks: NormalizedLandmark[],
  activeLeg: ActiveLeg = 'both',
): ExerciseState {
  // Use the specific active leg; default to left when 'both'
  const side = activeLeg === 'right' ? 'right' : 'left';
  const hipIdx = side === 'right' ? RIGHT_HIP : LEFT_HIP;
  const kneeIdx = side === 'right' ? RIGHT_KNEE : LEFT_KNEE;
  const ankleIdx = side === 'right' ? RIGHT_ANKLE : LEFT_ANKLE;

  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];
  const shoulder = avg(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);

  const kneeAngle = calculateAngle(hip, knee, ankle);

  let repState: ExerciseState['repState'] = 'hold';
  if (kneeAngle > 160) repState = 'up';       // leg straight (standing)
  else if (kneeAngle < 130) repState = 'down'; // foot kicked back toward glute

  // Form score — start at 100
  let formScore = 100;
  const oppHipIdx = side === 'right' ? LEFT_HIP : RIGHT_HIP;
  const oppHip = landmarks[oppHipIdx];

  // Hip tilting (left vs right hip y difference — instability)
  const hipYDiff = Math.abs(hip.y - oppHip.y);
  if (hipYDiff > 0.05) formScore -= Math.min(20, (hipYDiff - 0.05) * 400);

  // Upper body leaning (shoulder-hip angle from vertical)
  const avgHipX = (hip.x + oppHip.x) / 2;
  const avgHipY = (hip.y + oppHip.y) / 2;
  const torsoLeanDeg =
    Math.atan2(Math.abs(shoulder.x - avgHipX), Math.abs(avgHipY - shoulder.y + 0.001)) *
    (180 / Math.PI);
  if (torsoLeanDeg > 15) formScore -= Math.min(15, (torsoLeanDeg - 15) * 1.5);

  // Curl not reaching full range (when 'down', angle should be < 130°)
  if (repState === 'down' && kneeAngle >= 130) formScore -= 10;

  formScore = Math.max(0, Math.round(formScore));
  return { repState, angle: Math.round(kneeAngle), formScore };
}

// ---------------------------------------------------------------------------
// Active leg detection
// ---------------------------------------------------------------------------

/** Examine a buffer of frames and return which leg moved more (higher angle variance). */
export function detectActiveLeg(frameBuffer: NormalizedLandmark[][]): ActiveLeg {
  if (frameBuffer.length < 3) return 'left';

  const leftAngles = frameBuffer.map((lms) => {
    const h = lms[LEFT_HIP], k = lms[LEFT_KNEE], a = lms[LEFT_ANKLE];
    if (!h || !k || !a) return 0;
    return calculateAngle(h, k, a);
  });
  const rightAngles = frameBuffer.map((lms) => {
    const h = lms[RIGHT_HIP], k = lms[RIGHT_KNEE], a = lms[RIGHT_ANKLE];
    if (!h || !k || !a) return 0;
    return calculateAngle(h, k, a);
  });

  const variance = (arr: number[]) => {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  };

  const leftVar = variance(leftAngles);
  const rightVar = variance(rightAngles);

  // If variance is similar, prefer the leg closer to camera (lower z in MediaPipe)
  if (Math.abs(leftVar - rightVar) < 5) {
    const last = frameBuffer[frameBuffer.length - 1];
    const leftZ = last[LEFT_KNEE]?.z ?? 0;
    const rightZ = last[RIGHT_KNEE]?.z ?? 0;
    return leftZ < rightZ ? 'left' : 'right';
  }

  return leftVar > rightVar ? 'left' : 'right';
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
    lastRepTime: null,
  };
}

export function updateRepCount(
  tracker: RepTracker,
  state: ExerciseState,
  exerciseType: ExerciseType,
): RepTracker {
  const next: RepTracker = { ...tracker, currentAngle: state.angle };

  // Push form score (rolling window of 15 frames)
  next.formScores = [...tracker.formScores, state.formScore].slice(-15);

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
    // Rep-based: count on down → up transition with 500ms cooldown
    if (tracker.lastState === 'down' && state.repState === 'up') {
      const now = performance.now();
      const cooldownOk = tracker.lastRepTime === null || now - tracker.lastRepTime > 500;
      if (cooldownOk) {
        next.count = tracker.count + 1;
        next.lastRepTime = now;
      }
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
