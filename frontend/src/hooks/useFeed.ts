'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  type FeedCard,
  type ExerciseCard,
  type KnowledgeCard,
} from '@/data/mockData';
import type { ExerciseDetection } from '@/lib/poseDetection';
import { updatePreferences } from '@/lib/behavioralEngine';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface PreferenceVector {
  upperBody: number;
  lowerBody: number;
  core: number;
  balance: number;
  intensity: number;
}

export interface SessionData {
  exercisesCompleted: number;
  totalReps: number;
  avgFormScore: number;
  exerciseHistory: string[];
  xp: number;
  level: number;
  streak: number;
}

interface UseFeedReturn extends SessionData {
  cards: FeedCard[];
  currentIndex: number;
  preferenceVector: PreferenceVector;
  showRecalibrating: boolean;
  tryItActive: boolean;
  tryItExercise: ExerciseCard | null;
  feedLoading: boolean;
  recalibToast: boolean;
  error: string | null;
  condition: string | null;
  phase: string | null;
  onCardVisible: (index: number) => void;
  onLike: (cardId: string) => void;
  onTooEasy: (cardId: string) => void;
  onTooHard: (cardId: string) => void;
  onTryIt: (exercise: ExerciseCard) => void;
  onCompleteTryIt: (data: { reps: number; formScore: number }) => void;
  onCloseTryIt: () => void;
  startSession: (condition: string, phase: string) => void;
}

// Parse raw API exercise into our ExerciseCard type
function toExerciseCard(raw: Record<string, unknown>, idx: number): ExerciseCard {
  return {
    id: (raw.id as string) ?? `gen-ex-${idx}`,
    type: 'exercise',
    name: raw.name as string,
    targetArea: raw.targetArea as string,
    difficulty: Number(raw.difficulty) || 5,
    description: raw.description as string,
    whyItHelps: raw.whyItHelps as string,
    duration: raw.reps as string,
    xpReward: Number(raw.xpReward) || 20,
    muscleGroups: (raw.muscleGroups as string[]) ?? [],
    safetyNote: (raw.safetyNote as string) || undefined,
    canTryIt: Boolean(raw.canTryIt),
    exerciseType: (raw.exerciseType as ExerciseCard['exerciseType']) ?? undefined,
    detection: (raw.detection as ExerciseDetection) ?? null,
  };
}

function toKnowledgeCard(raw: Record<string, unknown>, idx: number): KnowledgeCard {
  return {
    id: (raw.id as string) ?? `gen-kb-${idx}`,
    type: 'knowledge',
    title: raw.title as string,
    content: raw.content as string,
    category: (raw.category as KnowledgeCard['category']) ?? 'recovery',
  };
}

// Build interleaved feed from exercise + knowledge arrays
function buildFeedFromArrays(
  exList: ExerciseCard[],
  kbList: KnowledgeCard[],
  progressOffset = 0,
): FeedCard[] {
  const result: FeedCard[] = [];
  let exIdx = 0;
  let kbIdx = 0;
  let cardCount = 0;
  let progCount = progressOffset;

  // Interleave: 2 exercises then 1 knowledge card
  while (exIdx < exList.length || kbIdx < kbList.length) {
    if (exIdx < exList.length) {
      result.push(exList[exIdx++]);
      cardCount++;
    }
    if (exIdx < exList.length) {
      result.push(exList[exIdx++]);
      cardCount++;
    }
    if (kbIdx < kbList.length) {
      result.push(kbList[kbIdx++]);
      cardCount++;
    }
    // Inject progress card every 7 cards
    if (cardCount >= 7) {
      result.push({ id: `progress-${progCount++}`, type: 'progress' });
      cardCount = 0;
    }
  }

  return result;
}

export function useFeed(): UseFeedReturn {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [recalibToast, setRecalibToast] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Session config (set after onboarding)
  const [condition, setCondition] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);

  // Session stats
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [sessionFormScores, setSessionFormScores] = useState<number[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<string[]>([]);

  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const [showRecalibrating, setShowRecalibrating] = useState(false);

  const [tryItActive, setTryItActive] = useState(false);
  const [tryItExercise, setTryItExercise] = useState<ExerciseCard | null>(null);

  const [preferenceVector, setPreferenceVector] = useState<PreferenceVector>({
    upperBody: 0.5,
    lowerBody: 0.7,
    core: 0.5,
    balance: 0.4,
    intensity: 0.5,
  });

  // Refs for use inside callbacks
  const preferenceVectorRef = useRef(preferenceVector);
  preferenceVectorRef.current = preferenceVector;
  const currentIndexRef = useRef(0);
  const cardVisibleSinceRef = useRef(Date.now());
  const lastCompletedAreaRef = useRef<string | undefined>(undefined);
  const progressOffsetRef = useRef(0);
  const exerciseHistoryRef = useRef<string[]>([]);
  exerciseHistoryRef.current = exerciseHistory;
  const conditionRef = useRef<string | null>(null);
  conditionRef.current = condition;
  const phaseRef = useRef<string | null>(null);
  phaseRef.current = phase;
  const lastRecalibIndexRef = useRef(0);
  const isFetchingRef = useRef(false);

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const avgFormScore = useMemo(
    () =>
      sessionFormScores.length > 0
        ? Math.round(sessionFormScores.reduce((a, b) => a + b, 0) / sessionFormScores.length)
        : 0,
    [sessionFormScores],
  );

  // Fetch exercises from backend API
  const fetchExercises = useCallback(
    async (cond: string, ph: string, prefs: PreferenceVector, completed: string[]) => {
      try {
        const res = await fetch(`${API_URL}/api/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            condition: cond,
            phase: ph,
            preferences: {
              upperBody: prefs.upperBody,
              lowerBody: prefs.lowerBody,
              core: prefs.core,
              balance: prefs.balance,
              intensity: prefs.intensity,
            },
            completedExercises: completed,
          }),
        });
        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }
        const data = await res.json();
        if (data.exercises && Array.isArray(data.exercises)) {
          return data.exercises.map(
            (e: Record<string, unknown>, i: number) => toExerciseCard(e, i),
          );
        }
        throw new Error('Invalid response format from backend');
      } catch (err) {
        console.error('[useFeed] Failed to fetch exercises:', err);
        throw err;
      }
    },
    [],
  );

  // Fetch knowledge cards from backend API
  const fetchKnowledge = useCallback(
    async (cond: string, ph: string) => {
      try {
        const res = await fetch(`${API_URL}/api/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ condition: cond, phase: ph }),
        });
        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }
        const data = await res.json();
        if (data.cards && Array.isArray(data.cards)) {
          return data.cards.map(
            (k: Record<string, unknown>, i: number) => toKnowledgeCard(k, i),
          );
        }
        throw new Error('Invalid response format from backend');
      } catch (err) {
        console.error('[useFeed] Failed to fetch knowledge:', err);
        throw err;
      }
    },
    [],
  );

  // Start session — called after onboarding completes
  const startSession = useCallback(
    (cond: string, ph: string) => {
      setCondition(cond);
      setPhase(ph);
      setFeedLoading(true);
      setError(null);

      // Fetch both exercise and knowledge cards in parallel
      Promise.all([
        fetchExercises(cond, ph, preferenceVectorRef.current, []),
        fetchKnowledge(cond, ph),
      ]).then(([exCards, kbCards]) => {
        const feed = buildFeedFromArrays(exCards, kbCards, 0);
        setCards(feed);
        setFeedLoading(false);
      }).catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load your feed. Make sure the backend is running.',
        );
        setFeedLoading(false);
      });
    },
    [fetchExercises, fetchKnowledge],
  );

  // Recalibration: fetch new cards when cardsViewed % 6 === 0
  const recalibrateIfNeeded = useCallback(
    (index: number) => {
      const cond = conditionRef.current;
      const ph = phaseRef.current;
      if (!cond || !ph) return;
      if (index === 0) return;
      if (index % 6 !== 0) return;
      if (index <= lastRecalibIndexRef.current) return;
      if (isFetchingRef.current) return;

      lastRecalibIndexRef.current = index;
      isFetchingRef.current = true;
      setRecalibToast(true);

      fetchExercises(
        cond,
        ph,
        preferenceVectorRef.current,
        exerciseHistoryRef.current,
      ).then((newExCards) => {
        isFetchingRef.current = false;
        setRecalibToast(false);

        progressOffsetRef.current += 10;
        const tail = buildFeedFromArrays(
          newExCards,
          [],
          progressOffsetRef.current,
        );
        setCards((prev) => [...prev, ...tail]);
      }).catch(() => {
        isFetchingRef.current = false;
        setRecalibToast(false);
      });
    },
    [fetchExercises],
  );

  const onCardVisible = useCallback(
    (index: number) => {
      // Time-on-card signal for the card being left
      const elapsed = Date.now() - cardVisibleSinceRef.current;
      if (currentIndexRef.current !== index) {
        const prevCard = cards[currentIndexRef.current];
        if (prevCard?.type === 'exercise') {
          if (elapsed < 1000) {
            setPreferenceVector((prev) =>
              updatePreferences(prev, prevCard as ExerciseCard, 'skip'),
            );
          } else if (elapsed > 3000) {
            setPreferenceVector((prev) =>
              updatePreferences(prev, prevCard as ExerciseCard, 'like'),
            );
          }
        }
      }

      cardVisibleSinceRef.current = Date.now();
      currentIndexRef.current = index;
      setCurrentIndex(index);

      const card = cards[index];
      if (!card) return;

      if (!seenCards.has(card.id)) {
        setSeenCards((prev) => new Set(prev).add(card.id));
        setXp((prev) => prev + 2);
      }

      // Trigger recalibration check
      recalibrateIfNeeded(index);
    },
    [cards, seenCards, recalibrateIfNeeded],
  );

  const onLike = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.type !== 'exercise') return;
      setPreferenceVector((prev) => updatePreferences(prev, card as ExerciseCard, 'like'));
    },
    [cards],
  );

  const onTooEasy = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.type !== 'exercise') return;
      setPreferenceVector((prev) => updatePreferences(prev, card as ExerciseCard, 'too_easy'));
    },
    [cards],
  );

  const onTooHard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.type !== 'exercise') return;
      setPreferenceVector((prev) => updatePreferences(prev, card as ExerciseCard, 'too_hard'));
    },
    [cards],
  );

  const onTryIt = useCallback((exercise: ExerciseCard) => {
    setTryItExercise(exercise);
    setTryItActive(true);
  }, []);

  const onCompleteTryIt = useCallback(
    (data: { reps: number; formScore: number }) => {
      setXp((prev) => prev + 50);
      setExercisesCompleted((prev) => prev + 1);
      setTotalReps((prev) => prev + data.reps);
      if (data.formScore > 0) {
        setSessionFormScores((prev) => [...prev, data.formScore]);
      }
      setStreak((prev) => prev + 1);

      if (tryItExercise) {
        setExerciseHistory((prev) => [...prev, tryItExercise.name]);
        lastCompletedAreaRef.current = tryItExercise.targetArea;
        setPreferenceVector((prev) =>
          updatePreferences(prev, tryItExercise, 'completed', data.formScore),
        );
      }

      setTryItActive(false);
      setTryItExercise(null);
    },
    [tryItExercise],
  );

  const onCloseTryIt = useCallback(() => {
    setTryItActive(false);
    setTryItExercise(null);
  }, []);

  return {
    cards,
    currentIndex,
    xp,
    level,
    streak,
    exercisesCompleted,
    totalReps,
    avgFormScore,
    exerciseHistory,
    preferenceVector,
    showRecalibrating,
    tryItActive,
    tryItExercise,
    feedLoading,
    recalibToast,
    error,
    condition,
    phase,
    onCardVisible,
    onLike,
    onTooEasy,
    onTooHard,
    onTryIt,
    onCompleteTryIt,
    onCloseTryIt,
    startSession,
  };
}
