// Behavioral Preference Engine
// Updates user preference vector based on exercise interactions.

import type { PreferenceVector } from '@/hooks/useFeed';
import type { ExerciseCard } from '@/data/mockData';

const LEARNING_RATE = 0.1;

type Signal =
  | 'like'
  | 'skip'
  | 'too_easy'
  | 'too_hard'
  | 'tried_it'
  | 'completed';

// Map exercise target areas to preference dimensions
const AREA_MAP: Record<string, keyof PreferenceVector> = {
  Quadriceps: 'lowerBody',
  'Quadriceps & Glutes': 'lowerBody',
  'Quadriceps & Hip Flexors': 'lowerBody',
  'Full Lower Body': 'lowerBody',
  Hamstrings: 'lowerBody',
  'Posterior Chain': 'lowerBody',
  'Hip Abductors': 'lowerBody',
  Calves: 'lowerBody',
  'Lower Leg': 'lowerBody',
  'Knee ROM': 'lowerBody',
  Proprioception: 'balance',
  'Plyometric Power': 'intensity',
  Core: 'core',
};

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function updatePreferences(
  current: PreferenceVector,
  exercise: ExerciseCard,
  signal: Signal,
  formScore?: number,
): PreferenceVector {
  const updated = { ...current };
  const dim = AREA_MAP[exercise.targetArea] ?? 'lowerBody';

  switch (signal) {
    case 'like':
    case 'tried_it':
      updated[dim] = clamp(updated[dim] + LEARNING_RATE);
      break;
    case 'skip':
      updated[dim] = clamp(updated[dim] - LEARNING_RATE * 0.5);
      break;
    case 'too_easy':
      updated.intensity = clamp(updated.intensity + LEARNING_RATE);
      break;
    case 'too_hard':
      updated.intensity = clamp(updated.intensity - LEARNING_RATE);
      break;
    case 'completed':
      updated[dim] = clamp(updated[dim] + LEARNING_RATE * 2);
      if (formScore && formScore > 80) {
        updated.intensity = clamp(updated.intensity + LEARNING_RATE * 0.5);
      }
      break;
  }

  return updated;
}

/** Score how well an exercise matches the current preference vector (0-1). */
export function scoreExercise(
  exercise: ExerciseCard,
  preferences: PreferenceVector,
): number {
  const dim = AREA_MAP[exercise.targetArea] ?? 'lowerBody';
  const areaPref = preferences[dim];

  // Normalise difficulty to 0-1
  const normDiff = exercise.difficulty / 10;
  const intensityMatch = 1 - Math.abs(normDiff - preferences.intensity);

  // Weighted combination: 60% area preference, 40% intensity match
  return areaPref * 0.6 + intensityMatch * 0.4;
}
