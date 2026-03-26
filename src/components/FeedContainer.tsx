'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { FeedCard } from '@/data/mockData';
import ExerciseCard from './ExerciseCard';
import KnowledgeCard from './KnowledgeCard';
import ProgressCard from './ProgressCard';
import type { ExerciseCard as ExerciseCardType } from '@/data/mockData';

interface FeedContainerProps {
  cards: FeedCard[];
  xp: number;
  onCardVisible: (index: number) => void;
  onLike: (id: string) => void;
  onTooEasy: (id: string) => void;
  onTooHard: (id: string) => void;
  onTryIt: (exercise: ExerciseCardType) => void;
}

export default function FeedContainer({
  cards,
  xp,
  onCardVisible,
  onLike,
  onTooEasy,
  onTooHard,
  onTryIt,
}: FeedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setCardRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      cardRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (index !== -1) {
              onCardVisible(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      },
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [cards, onCardVisible]);

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] overflow-y-scroll"
      style={{
        scrollSnapType: 'y mandatory',
        touchAction: 'pan-y',
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          ref={setCardRef(index)}
          className="h-[100dvh]"
          style={{ scrollSnapAlign: 'start' }}
        >
          {card.type === 'exercise' && (
            <ExerciseCard
              exercise={card}
              onLike={onLike}
              onTooEasy={onTooEasy}
              onTooHard={onTooHard}
              onTryIt={onTryIt}
            />
          )}
          {card.type === 'knowledge' && <KnowledgeCard card={card} />}
          {card.type === 'progress' && <ProgressCard xp={xp} />}
        </div>
      ))}
    </div>
  );
}
