'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  exercises,
  knowledgeCards,
  type FeedCard,
  type ExerciseCard,
  type KnowledgeCard,
} from '@/data/mockData';
import { updatePreferences, scoreExercise } from '@/lib/behavioralEngine';

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
  onCardVisible: (index: number) => void;
  onLike: (cardId: string) => void;
  onTooEasy: (cardId: string) => void;
  onTooHard: (cardId: string) => void;
  onTryIt: (exercise: ExerciseCard) => void;
  onCompleteTryIt: (data: { reps: number; formScore: number }) => void;
  onCloseTryIt: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Map exercise target areas to preferred knowledge card categories
const AREA_TO_KB_CATEGORY: Record<string, KnowledgeCard['category']> = {
  Quadriceps: 'anatomy',
  'Full Lower Body': 'anatomy',
  'Inner Quad & Glutes': 'anatomy',
  Hamstrings: 'anatomy',
  'Posterior Chain': 'anatomy',
  Calves: 'anatomy',
  'Lower Leg': 'anatomy',
  'Knee ROM': 'recovery',
  Proprioception: 'recovery',
  'Single Leg Strength': 'recovery',
  'Plyometric Power': 'mindset',
};

function buildFeed(
  shuffle: boolean,
  pref?: PreferenceVector,
  lastArea?: string,
  progressOffset = 0,
): FeedCard[] {
  let exList = shuffle ? shuffleArray(exercises) : [...exercises];

  // Sort by preference score if provided
  if (pref) {
    exList = [...exList].sort((a, b) => scoreExercise(b, pref) - scoreExercise(a, pref));
  }

  // Sort knowledge cards — preferred category first if lastArea provided
  let kbList = shuffle ? shuffleArray(knowledgeCards) : [...knowledgeCards];
  if (lastArea) {
    const preferredCat = AREA_TO_KB_CATEGORY[lastArea];
    if (preferredCat) {
      kbList = [
        ...kbList.filter((k) => k.category === preferredCat),
        ...kbList.filter((k) => k.category !== preferredCat),
      ];
    }
  }

  // Interleave: 2 exercises → 1 knowledge card
  const mixed: FeedCard[] = [];
  let exIdx = 0;
  let kbIdx = 0;
  while (exIdx < exList.length || kbIdx < kbList.length) {
    if (exIdx < exList.length) mixed.push(exList[exIdx++]);
    if (exIdx < exList.length) mixed.push(exList[exIdx++]);
    if (kbIdx < kbList.length) mixed.push(kbList[kbIdx++]);
  }

  // Inject progress cards every 7 cards
  const result: FeedCard[] = [];
  let progCount = progressOffset;
  for (let i = 0; i < mixed.length; i++) {
    result.push(mixed[i]);
    if ((i + 1) % 7 === 0 && i > 0) {
      result.push({ id: `progress-${progCount++}`, type: 'progress' });
    }
  }

  return result;
}

export function useFeed(): UseFeedReturn {
  // Feed cards — SSR-safe: deterministic first, shuffle on client
  const [cards, setCards] = useState<FeedCard[]>(() => buildFeed(false));
  useEffect(() => {
    setCards(buildFeed(true));
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Session stats — all start at 0
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [sessionFormScores, setSessionFormScores] = useState<number[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<string[]>([]);

  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const [showRecalibrating, setShowRecalibrating] = useState(false);
  const [, setCardsViewedSinceRecalib] = useState(0);

  const [tryItActive, setTryItActive] = useState(false);
  const [tryItExercise, setTryItExercise] = useState<ExerciseCard | null>(null);

  const [preferenceVector, setPreferenceVector] = useState<PreferenceVector>({
    upperBody: 0.5,
    lowerBody: 0.7,
    core: 0.5,
    balance: 0.4,
    intensity: 0.5,
  });

  // Refs for use inside callbacks without stale closures
  const preferenceVectorRef = useRef(preferenceVector);
  preferenceVectorRef.current = preferenceVector;
  const currentIndexRef = useRef(0);
  const cardVisibleSinceRef = useRef(Date.now());
  const lastCompletedAreaRef = useRef<string | undefined>(undefined);
  const progressOffsetRef = useRef(0);

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const avgFormScore = useMemo(
    () =>
      sessionFormScores.length > 0
        ? Math.round(sessionFormScores.reduce((a, b) => a + b, 0) / sessionFormScores.length)
        : 0,
    [sessionFormScores],
  );

  const onCardVisible = useCallback(
    (index: number) => {
      // Time-on-card signal for the card being left
      const elapsed = Date.now() - cardVisibleSinceRef.current;
      if (currentIndexRef.current !== index) {
        const prevCard = cards[currentIndexRef.current];
        if (prevCard?.type === 'exercise') {
          if (elapsed < 1000) {
            // Quick scroll — slight negative signal
            setPreferenceVector((prev) =>
              updatePreferences(prev, prevCard as ExerciseCard, 'skip'),
            );
          } else if (elapsed > 3000) {
            // Lingered — slight positive signal
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

      setCardsViewedSinceRecalib((prev) => {
        const next = prev + 1;
        if (next >= 8) {
          setShowRecalibrating(true);
          setTimeout(() => setShowRecalibrating(false), 1500);

          // Re-sort the tail of the feed based on updated preferences
          progressOffsetRef.current += 10;
          const newTail = buildFeed(
            true,
            preferenceVectorRef.current,
            lastCompletedAreaRef.current,
            progressOffsetRef.current,
          );
          setCards((prevCards) => [...prevCards.slice(0, index + 1), ...newTail]);

          return 0;
        }
        return next;
      });
    },
    [cards, seenCards],
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
    onCardVisible,
    onLike,
    onTooEasy,
    onTooHard,
    onTryIt,
    onCompleteTryIt,
    onCloseTryIt,
  };
}
