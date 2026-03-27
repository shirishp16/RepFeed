// MediaPipe Pose Detection Engine
// Pure TypeScript — no React. Imported by PoseCamera.tsx.

import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

// ---------------------------------------------------------------------------
// Joint index mapping — joint name → MediaPipe landmark indices
// ---------------------------------------------------------------------------

export const JOINT_INDEX: Record<string, { left: number; right: number }> = {
  shoulder: { left: 11, right: 12 },
  elbow:    { left: 13, right: 14 },
  wrist:    { left: 15, right: 16 },
  hip:      { left: 23, right: 24 },
  knee:     { left: 25, right: 26 },
  ankle:    { left: 27, right: 28 },
  heel:     { left: 29, right: 30 },
  foot:     { left: 31, right: 32 },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Detection {
  primary_joints: [string, string, string];
  side: 'left' | 'right' | 'both';
  rest_angle: number;
  active_angle: number;
  form_good_range: [number, number];
  form_ok_range: [number, number];
}

export interface RepState {
  count: number;
  phase: 'resting' | 'active' | 'between';
  currentAngle: number;
  formScore: number;
  formScores: number[];
  lastRepTime: number;
}

// Leg index sets (MediaPipe indices) — used by PoseCamera for dimming
export const LEFT_LEG_SET = new Set([23, 25, 27, 29, 31]);
export const RIGHT_LEG_SET = new Set([24, 26, 28, 30, 32]);

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
  // Left foot
  [27, 29],
  [29, 31],
  // Right foot
  [28, 30],
  [30, 32],
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
// Geometry
// ---------------------------------------------------------------------------

export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

// ---------------------------------------------------------------------------
// Angle measurement
// ---------------------------------------------------------------------------

export function getAngle(
  landmarks: NormalizedLandmark[],
  detection: Detection,
  activeSide: 'left' | 'right',
): number {
  const [jA, jB, jC] = detection.primary_joints;
  const mapA = JOINT_INDEX[jA];
  const mapB = JOINT_INDEX[jB];
  const mapC = JOINT_INDEX[jC];
  if (!mapA || !mapB || !mapC) return 0;

  if (detection.side === 'both') {
    const leftAngle = calculateAngle(
      landmarks[mapA.left], landmarks[mapB.left], landmarks[mapC.left],
    );
    const rightAngle = calculateAngle(
      landmarks[mapA.right], landmarks[mapB.right], landmarks[mapC.right],
    );
    return Math.round((leftAngle + rightAngle) / 2);
  }

  const side = activeSide;
  return calculateAngle(
    landmarks[mapA[side]], landmarks[mapB[side]], landmarks[mapC[side]],
  );
}

// ---------------------------------------------------------------------------
// Rep state machine
// ---------------------------------------------------------------------------

export function createRepState(): RepState {
  return {
    count: 0,
    phase: 'resting',
    currentAngle: 0,
    formScore: 0,
    formScores: [],
    lastRepTime: 0,
  };
}

export function processFrame(
  landmarks: NormalizedLandmark[],
  detection: Detection,
  activeSide: 'left' | 'right',
  state: RepState,
): RepState {
  const angle = getAngle(landmarks, detection, activeSide);
  const now = Date.now();
  const updated: RepState = { ...state, currentAngle: angle };

  // How far through the movement (0 = resting, 1 = fully active)
  const totalRange = Math.abs(detection.rest_angle - detection.active_angle);
  if (totalRange === 0) return updated;

  const distFromRest = Math.abs(angle - detection.rest_angle);
  const progress = Math.min(1, distFromRest / totalRange);

  // Generous thresholds:
  // "resting" = within 30% of rest position
  // "active" = past 60% of the way to active position
  const isResting = progress < 0.3;
  const isActive = progress > 0.6;

  const goesDown = detection.rest_angle > detection.active_angle;

  // State machine
  if (state.phase === 'resting' && isActive) {
    // Moved from rest to active — score form at this point
    updated.phase = 'active';

    const [goodMin, goodMax] = detection.form_good_range;
    const [okMin, okMax] = detection.form_ok_range;

    let repFormScore = 55; // default: poor but counts
    if (goesDown) {
      if (angle >= goodMin && angle <= goodMax) repFormScore = 95;
      else if (angle >= okMin && angle <= okMax) repFormScore = 75;
    } else {
      if (angle >= goodMin && angle <= goodMax) repFormScore = 95;
      else if (angle >= okMin && angle <= okMax) repFormScore = 75;
    }
    updated.formScore = repFormScore;

  } else if (state.phase === 'active' && isResting) {
    // Returned to rest from active — completed a rep
    if (now - state.lastRepTime > 600) {
      updated.count = state.count + 1;
      updated.lastRepTime = now;
      updated.formScores = [...state.formScores, state.formScore];
      const allScores = updated.formScores;
      updated.formScore = Math.round(
        allScores.reduce((a, b) => a + b, 0) / allScores.length,
      );
    }
    updated.phase = 'resting';

  } else if (state.phase === 'between') {
    if (isResting) updated.phase = 'resting';
    else if (isActive) updated.phase = 'active';
  } else if (!isResting && !isActive && state.phase !== 'active') {
    updated.phase = 'between';
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Helpers for PoseCamera
// ---------------------------------------------------------------------------

/** Get highlighted joint indices for the detection's primary joints + side. */
export function getHighlightedJoints(
  detection: Detection,
  activeSide: 'left' | 'right',
): number[] {
  const joints: number[] = [];
  for (const jointName of detection.primary_joints) {
    const joint = JOINT_INDEX[jointName];
    if (!joint) continue;
    if (detection.side === 'both') {
      joints.push(joint.left, joint.right);
    } else {
      joints.push(joint[activeSide]);
    }
  }
  return joints;
}

/** Get the vertex (middle joint) landmark index for angle display. */
export function getVertexIdx(
  detection: Detection,
  activeSide: 'left' | 'right',
): number | null {
  const vertexName = detection.primary_joints[1];
  const joint = JOINT_INDEX[vertexName];
  if (!joint) return null;
  if (detection.side === 'both') return joint.left;
  return joint[activeSide];
}
