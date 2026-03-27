'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeed } from '@/hooks/useFeed';
import TopBar from '@/components/TopBar';
import FeedContainer from '@/components/FeedContainer';
import TryItMode from '@/components/TryItMode';
import OnboardingFlow from '@/components/OnboardingFlow';
import FeedRecalibrating from '@/components/FeedRecalibrating';

/* ── Body Scan skeleton data (same as OnboardingFlow) ──────────── */
const bodyJoints = [
  { cx: 42, cy: 170, delay: 0 },   { cx: 58, cy: 170, delay: 0.1 },
  { cx: 42, cy: 140, delay: 0.2 }, { cx: 58, cy: 140, delay: 0.3 },
  { cx: 42, cy: 110, delay: 0.4 }, { cx: 58, cy: 110, delay: 0.5 },
  { cx: 45, cy: 80, delay: 0.6 },  { cx: 55, cy: 80, delay: 0.7 },
  { cx: 50, cy: 60, delay: 0.8 },  { cx: 30, cy: 55, delay: 0.9 },
  { cx: 70, cy: 55, delay: 1.0 },  { cx: 25, cy: 70, delay: 1.1 },
  { cx: 75, cy: 70, delay: 1.2 },  { cx: 20, cy: 85, delay: 1.3 },
  { cx: 80, cy: 85, delay: 1.4 },  { cx: 50, cy: 35, delay: 1.5 },
  { cx: 50, cy: 20, delay: 1.7 },
];

const bodyLines = [
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7],
  [6, 8], [7, 8], [8, 9], [8, 10], [9, 11], [10, 12],
  [11, 13], [12, 14], [8, 15], [15, 16],
];

const loadingTexts = [
  'Generating your exercises...',
  'Building knowledge cards...',
  'Assembling your feed...',
];

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const feed = useFeed();

  const handleOnboardingComplete = (data: { condition: string; phase: string }) => {
    setShowOnboarding(false);
    feed.startSession(data.condition, data.phase);
  };

  return (
    <div className="relative h-[100dvh] w-full bg-bg overflow-hidden">
      {/* Top Bar */}
      <TopBar xp={feed.xp} streak={feed.streak} phase={feed.phase ?? ''} />

      {/* ── Premium Loading Screen ─────────────────────────────── */}
      <AnimatePresence>
        {feed.feedLoading && !showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[60] mesh-gradient flex flex-col items-center justify-center gap-6"
          >
            {/* Floating orbs */}
            <div className="orb orb-teal" />
            <div className="orb orb-purple" />

            {/* Body scan SVG */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-40 h-40 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(139,92,246,0.05) 50%, transparent 70%)',
                    filter: 'blur(30px)',
                  }}
                />
              </div>
              <svg width={160} height={200} viewBox="0 0 100 200" className="relative z-10">
                {bodyLines.map(([a, b], i) => (
                  <line
                    key={`line-${i}`}
                    x1={bodyJoints[a].cx} y1={bodyJoints[a].cy}
                    x2={bodyJoints[b].cx} y2={bodyJoints[b].cy}
                    stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1.5"
                  />
                ))}
                {bodyJoints.map((joint, i) => (
                  <circle
                    key={`joint-${i}`}
                    cx={joint.cx} cy={joint.cy} r={4}
                    fill="#2DD4BF"
                    className="body-scan-dot"
                    style={{ animationDelay: `${joint.delay}s` }}
                  />
                ))}
                <circle cx={50} cy={20} r={10} fill="none" stroke="#2DD4BF" strokeWidth="1.5"
                  className="body-scan-dot" style={{ animationDelay: '1.7s' }} />
              </svg>
            </div>

            {/* Typewriter loading text */}
            <div className="h-6 flex items-center">
              <RotatingText texts={loadingTexts} />
            </div>

            {/* Glowing progress bar */}
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 8, ease: 'easeInOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #2DD4BF, #06B6D4, #8B5CF6)',
                  boxShadow: '0 0 12px rgba(45,212,191,0.4)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {feed.error && !showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] mesh-gradient flex flex-col items-center justify-center gap-4 px-6 text-center"
          >
            <div className="orb orb-teal" />
            <div className="text-4xl">⚠️</div>
            <h2 className="font-outfit text-lg font-bold text-text-primary"
              style={{ textShadow: '0 0 30px rgba(45,212,191,0.15)' }}
            >
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
              className="px-6 py-3 rounded-xl font-outfit font-bold text-white relative overflow-hidden"
              style={{
                backgroundImage: 'linear-gradient(135deg, #2DD4BF, #06B6D4, #8B5CF6)',
                backgroundSize: '200% 200%',
                animation: 'mesh-shift 4s ease-in-out infinite',
                boxShadow: '0 0 20px rgba(45,212,191,0.3), 0 4px 15px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-lg text-text-secondary text-sm font-outfit"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(45,212,191,0.15)',
              boxShadow: '0 0 15px rgba(45,212,191,0.08)',
            }}
          >
            Updating your feed...
          </motion.div>
        )}
      </AnimatePresence>


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

/* ── Helper: rotating typewriter text ─────────────────────────── */
function RotatingText({ texts }: { texts: string[] }) {
  const [index, setIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, 2500);
    return () => clearInterval(interval);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }}
        className="font-mono text-sm text-white/35"
      >
        {texts[index]}
      </motion.p>
    </AnimatePresence>
  );
}
