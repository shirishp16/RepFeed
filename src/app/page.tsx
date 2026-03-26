'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFeed } from '@/hooks/useFeed';
import TopBar from '@/components/TopBar';
import BottomBar from '@/components/BottomBar';
import FeedContainer from '@/components/FeedContainer';
import TryItMode from '@/components/TryItMode';
import OnboardingFlow from '@/components/OnboardingFlow';
import RehabProfile from '@/components/RehabProfile';
import FeedRecalibrating from '@/components/FeedRecalibrating';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const feed = useFeed();

  return (
    <div className="relative h-[100dvh] w-full max-w-[480px] mx-auto bg-bg overflow-hidden">
      {/* Top Bar */}
      <TopBar xp={feed.xp} streak={feed.streak} phase="Building Strength" />

      {/* Feed */}
      <FeedContainer
        cards={feed.cards}
        xp={feed.xp}
        onCardVisible={feed.onCardVisible}
        onLike={feed.onLike}
        onTooEasy={feed.onTooEasy}
        onTooHard={feed.onTooHard}
        onTryIt={feed.onTryIt}
      />

      {/* Bottom Bar */}
      <BottomBar />

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
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
