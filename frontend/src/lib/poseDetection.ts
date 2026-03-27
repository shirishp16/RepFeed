// MediaPipe Pose Detection Engine
// Pure TypeScript — no React. Imported by PoseCamera.tsx.

import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Backwards-compat type — no longer used for detection dispatch. */
export type ExerciseType =
  | 'squat'
  | 'wall_sit'
  | 'calf_raise'
  | 'hamstring_curl'
  | 'single_leg_balance'
  | 'single_leg_rdl'
  | 'generic';

export type ActiveLeg = 'left' | 'right' | 'both';

export interface ExerciseDetection {
  joint_triplet: [string, string, string];
  side: 'single_leg' | 'both_legs' | 'single_arm';
  start_angle_min: number;
  start_angle_max: number;
  end_angle_min: number;
  end_angle_max: number;
  rep_direction: 'high_to_low' | 'low_to_high';
  form_checks: Array<{
    check: string;
    description: string;
    penalty: number;
  }>;
}

// Leg index sets (MediaPipe indices) — used by PoseCamera for dimming
export const LEFT_LEG_SET = new Set([23, 25, 27, 29, 31]);
export const RIGHT_LEG_SET = new Set([24, 26, 28, 30, 32]);

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
  lastRepTime: number | null;
}

// ---------------------------------------------------------------------------
// Joint map — maps detection param names to MediaPipe landmark indices
// ---------------------------------------------------------------------------

/** Maps joint name → [leftIdx, rightIdx] in MediaPipe landmark space. */
export const JOINT_MAP: Record<string, [number, number]> = {
  shoulder: [11, 12],
  elbow: [13, 14],
  wrist: [15, 16],
  hip: [23, 24],
  knee: [25, 26],
  ankle: [27, 28],
  heel: [29, 30],
  foot: [31, 32],
};

/** Get all MediaPipe indices involved in a detection's joint triplet. */
export function getJointsFromDetection(detection: ExerciseDetection): number[] {
  const joints: number[] = [];
  for (const name of detection.joint_triplet) {
    const pair = JOINT_MAP[name];
    if (pair) joints.push(pair[0], pair[1]);
  }
  return joints;
}

/** Get the vertex (middle joint) index for the active side — used for angle display. */
export function getVertexJointIdx(
  detection: ExerciseDetection,
  activeLeg: ActiveLeg,
): number | null {
  const vertexName = detection.joint_triplet[1];
  const pair = JOINT_MAP[vertexName];
  if (!pair) return null;
  if (detection.side === 'both_legs' || activeLeg === 'both') {
    // Default to left for display purposes
    return pair[0];
  }
  return activeLeg === 'left' ? pair[0] : pair[1];
}

// ---------------------------------------------------------------------------
// Connections (used by PoseCamera for skeleton drawing)
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

// ---------------------------------------------------------------------------
// Generic exercise detector — replaces all specific detect functions
// ---------------------------------------------------------------------------

/**
 * Detect rep state and form score using the LLM-provided detection params.
 * Works for ANY exercise — no hardcoded exercise types.
 */
export function detectGeneric(
  landmarks: NormalizedLandmark[],
  detection: ExerciseDetection,
  activeLeg: ActiveLeg,
): ExerciseState {
  const [jointA, jointB, jointC] = detection.joint_triplet;
  const pairA = JOINT_MAP[jointA];
  const pairB = JOINT_MAP[jointB];
  const pairC = JOINT_MAP[jointC];

  if (!pairA || !pairB || !pairC) {
    return { repState: 'hold', angle: 0, formScore: 100 };
  }

  let angle: number;

  if (detection.side === 'both_legs' || activeLeg === 'both') {
    // Average both sides
    const leftAngle = calculateAngle(
      landmarks[pairA[0]],
      landmarks[pairB[0]],
      landmarks[pairC[0]],
    );
    const rightAngle = calculateAngle(
      landmarks[pairA[1]],
      landmarks[pairB[1]],
      landmarks[pairC[1]],
    );
    angle = (leftAngle + rightAngle) / 2;
  } else {
    // Single side
    const sideIdx = activeLeg === 'left' ? 0 : 1;
    angle = calculateAngle(
      landmarks[pairA[sideIdx]],
      landmarks[pairB[sideIdx]],
      landmarks[pairC[sideIdx]],
    );
  }

  angle = Math.round(angle);

  // Determine rep state with generous ±10° tolerance
  const inStart =
    angle >= detection.start_angle_min - 10 &&
    angle <= detection.start_angle_max + 10;
  const inEnd =
    angle >= detection.end_angle_min - 10 &&
    angle <= detection.end_angle_max + 10;
  // "Past end" — user went deeper than the expected range
  const pastEnd =
    detection.rep_direction === 'high_to_low'
      ? angle < detection.end_angle_min - 10
      : angle > detection.end_angle_max + 10;

  let repState: ExerciseState['repState'] = 'hold';
  if (inEnd || pastEnd) repState = 'down';
  else if (inStart) repState = 'up';

  const formScore = calculateFormScore(landmarks, detection);

  return { repState, angle, formScore };
}

// ---------------------------------------------------------------------------
// Form score calculation
// ---------------------------------------------------------------------------

function calculateFormScore(
  landmarks: NormalizedLandmark[],
  detection: ExerciseDetection,
): number {
  let score = 100;

  for (const check of detection.form_checks) {
    switch (check.check) {
      case 'upper_body_upright': {
        const shoulder = landmarks[11]; // left shoulder
        const hip = landmarks[23]; // left hip
        const lean = Math.abs(shoulder.x - hip.x);
        if (lean > 0.08) score -= check.penalty;
        break;
      }
      case 'knees_over_toes': {
        const knee = landmarks[25]; // left knee
        const ankle = landmarks[27]; // left ankle
        if (Math.abs(knee.x - ankle.x) > 0.06) score -= check.penalty;
        break;
      }
      case 'back_straight': {
        const shoulder = landmarks[11];
        const hip = landmarks[23];
        const leanDeg =
          Math.atan2(
            Math.abs(shoulder.x - hip.x),
            Math.abs(hip.y - shoulder.y + 0.001),
          ) *
          (180 / Math.PI);
        if (leanDeg > 20) score -= check.penalty;
        break;
      }
      case 'knee_straight': {
        const kHip = landmarks[23];
        const kKnee = landmarks[25];
        const kAnkle = landmarks[27];
        const kneeAngle = calculateAngle(kHip, kKnee, kAnkle);
        if (kneeAngle < 165) score -= check.penalty;
        break;
      }
      case 'hip_stable': {
        // Check hip level (left vs right hip y difference)
        const hipDiff = Math.abs(landmarks[23].y - landmarks[24].y);
        if (hipDiff > 0.05) score -= check.penalty;
        break;
      }
      default:
        // Unknown check — skip silently
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Active leg detection
// ---------------------------------------------------------------------------

const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;

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
    lastRepTime: null,
  };
}

/**
 * State machine: up → down → up = 1 completed rep.
 * 800ms cooldown between reps to prevent double-counting.
 */
export function updateRepCount(
  tracker: RepTracker,
  state: ExerciseState,
): RepTracker {
  const next: RepTracker = { ...tracker, currentAngle: state.angle };

  // Rolling form score window (15 frames)
  next.formScores = [...tracker.formScores, state.formScore].slice(-15);

  // State machine
  if (tracker.lastState === null) {
    // First frame — initialize
    next.lastState = state.repState;
  } else if (tracker.lastState === 'up' && state.repState === 'down') {
    // Entered the down position
    next.lastState = 'down';
  } else if (tracker.lastState === 'down' && state.repState === 'up') {
    // Completed a rep — apply cooldown
    const now = performance.now();
    const cooldownOk = tracker.lastRepTime === null || now - tracker.lastRepTime > 800;
    if (cooldownOk) {
      next.count = tracker.count + 1;
      next.lastRepTime = now;
    }
    next.lastState = 'up';
  } else if (state.repState !== 'hold') {
    // Update lastState for non-hold transitions
    next.lastState = state.repState;
  }

  return next;
}

/** Average of the rolling form score window. */
export function avgFormScore(tracker: RepTracker): number {
  if (tracker.formScores.length === 0) return 0;
  const sum = tracker.formScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / tracker.formScores.length);
}
