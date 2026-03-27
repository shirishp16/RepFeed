'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeed } from '@/hooks/useFeed';
import TopBar from '@/components/TopBar';
import FeedContainer from '@/components/FeedContainer';
import TryItMode from '@/components/TryItMode';
import OnboardingFlow from '@/components/OnboardingFlow';
import RehabProfile from '@/components/RehabProfile';
import FeedRecalibrating from '@/components/FeedRecalibrating';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const feed = useFeed();

  const handleOnboardingComplete = (data: { condition: string; phase: string }) => {
    setShowOnboarding(false);
    feed.startSession(data.condition, data.phase);
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[480px] mx-auto bg-bg overflow-hidden">
      {/* Top Bar */}
      <TopBar xp={feed.xp} streak={feed.streak} phase={feed.phase ?? ''} />

      {/* Loading State */}
      {feed.feedLoading && !showOnboarding && (
        <div className="absolute inset-0 z-[60] bg-bg flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="font-outfit text-lg font-bold text-text-primary"
          >
            Building your feed...
          </motion.div>
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {feed.error && !showOnboarding && (
        <div className="absolute inset-0 z-[60] bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="font-outfit text-lg font-bold text-text-primary">
            Couldn&apos;t load your feed
          </h2>
          <p className="font-outfit text-sm text-text-secondary max-w-xs">
            {feed.error}
          </p>
          <button
            onClick={() => {
              if (feed.condition && feed.phase) {
                feed.startSession(feed.condition, feed.phase);
              }
            }}
            className="px-6 py-3 rounded-xl bg-accent text-white font-outfit font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Feed */}
      <FeedContainer
        cards={feed.cards}
        xp={feed.xp}
        exercisesCompleted={feed.exercisesCompleted}
        avgFormScore={feed.avgFormScore}
        totalReps={feed.totalReps}
        streak={feed.streak}
        exerciseHistory={feed.exerciseHistory}
        onCardVisible={feed.onCardVisible}
        onLike={feed.onLike}
        onTooEasy={feed.onTooEasy}
        onTooHard={feed.onTooHard}
        onTryIt={feed.onTryIt}
      />

      {/* Safe-area bottom padding */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
        style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
      />

      {/* Recalibration toast */}
      <AnimatePresence>
        {feed.recalibToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-secondary text-sm font-outfit backdrop-blur-md"
          >
            Updating your feed...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rehab Profile */}
      <RehabProfile
        preferenceVector={feed.preferenceVector}
        cardsViewed={feed.currentIndex}
      />

      {/* TryIt Overlay */}
      <TryItMode
        active={feed.tryItActive}
        exercise={feed.tryItExercise}
        onComplete={feed.onCompleteTryIt}
        onClose={feed.onCloseTryIt}
      />

      {/* Feed Recalibrating */}
      <FeedRecalibrating show={feed.showRecalibrating} />

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
