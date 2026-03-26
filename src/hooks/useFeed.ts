'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  exercises,
  knowledgeCards,
  type FeedCard,
  type ExerciseCard,
} from '@/data/mockData';

interface PreferenceVector {
  upperBody: number;
  lowerBody: number;
  core: number;
  balance: number;
  intensity: number;
}

interface UseFeedReturn {
  cards: FeedCard[];
  currentIndex: number;
  xp: number;
  level: number;
  streak: number;
  preferenceVector: PreferenceVector;
  showRecalibrating: boolean;
  tryItActive: boolean;
  tryItExercise: ExerciseCard | null;
  onCardVisible: (index: number) => void;
  onLike: (cardId: string) => void;
  onTooEasy: (cardId: string) => void;
  onTooHard: (cardId: string) => void;
  onTryIt: (exercise: ExerciseCard) => void;
  onCompleteTryIt: () => void;
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

function buildFeed(shuffle: boolean): FeedCard[] {
  const exList = shuffle ? shuffleArray(exercises) : [...exercises];
  const kbList = shuffle ? shuffleArray(knowledgeCards) : [...knowledgeCards];

  const mixed: FeedCard[] = [];
  let exIdx = 0;
  let kbIdx = 0;

  // Interleave: ~2 exercises then 1 knowledge card
  while (exIdx < exList.length || kbIdx < kbList.length) {
    if (exIdx < exList.length) mixed.push(exList[exIdx++]);
    if (exIdx < exList.length) mixed.push(exList[exIdx++]);
    if (kbIdx < kbList.length) mixed.push(kbList[kbIdx++]);
  }

  // Inject progress cards every 7-8 cards
  const withProgress: FeedCard[] = [];
  let progressCount = 0;
  for (let i = 0; i < mixed.length; i++) {
    withProgress.push(mixed[i]);
    if ((i + 1) % 7 === 0 && i > 0) {
      withProgress.push({ id: `progress-${progressCount++}`, type: 'progress' });
    }
  }

  return withProgress;
}

export function useFeed(): UseFeedReturn {
  // Start with deterministic order for SSR, then shuffle on client
  const [cards, setCards] = useState<FeedCard[]>(() => buildFeed(false));

  useEffect(() => {
    setCards(buildFeed(true));
  }, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [xp, setXp] = useState(340);
  const [streak] = useState(3);
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

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);

  const [cardsViewedSinceRecalib, setCardsViewedSinceRecalib] = useState(0);

  const onCardVisible = useCallback(
    (index: number) => {
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
      setPreferenceVector((prev) => ({
        ...prev,
        lowerBody: Math.min(1, prev.lowerBody + 0.05),
        intensity: Math.min(1, prev.intensity + 0.02),
      }));
    },
    [cards],
  );

  const onTooEasy = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.type !== 'exercise') return;
      setPreferenceVector((prev) => ({
        ...prev,
        intensity: Math.min(1, prev.intensity + 0.1),
      }));
    },
    [cards],
  );

  const onTooHard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.type !== 'exercise') return;
      setPreferenceVector((prev) => ({
        ...prev,
        intensity: Math.max(0, prev.intensity - 0.1),
      }));
    },
    [cards],
  );

  const onTryIt = useCallback((exercise: ExerciseCard) => {
    setTryItExercise(exercise);
    setTryItActive(true);
  }, []);

  const onCompleteTryIt = useCallback(() => {
    setXp((prev) => prev + 50);
    setTryItActive(false);
    setTryItExercise(null);
  }, []);

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
