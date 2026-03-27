'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: (data: { condition: string; phase: string }) => void;
}

const conditions = [
  { id: 'acl', label: 'ACL', icon: '🦵' },
  { id: 'shoulder', label: 'Shoulder', icon: '💪' },
  { id: 'back', label: 'Back', icon: '🔙' },
  { id: 'ankle', label: 'Ankle', icon: '🦶' },
  { id: 'wrist', label: 'Wrist', icon: '✋' },
  { id: 'other', label: 'Other', icon: '➕' },
];

const phases = [
  {
    id: 'early',
    label: 'Early Recovery',
    desc: 'Weeks 0–4: Focus on reducing swelling and restoring basic mobility',
  },
  {
    id: 'building',
    label: 'Building Strength',
    desc: 'Weeks 4–12: Progressive loading and functional exercises',
  },
  {
    id: 'almost',
    label: 'Almost There',
    desc: 'Months 3–6+: Sport-specific training and return-to-play prep',
  },
];

// Skeleton body joint positions (feet→head order for staggered animation)
const bodyJoints = [
  { cx: 42, cy: 170, delay: 0 },     // left foot
  { cx: 58, cy: 170, delay: 0.1 },    // right foot
  { cx: 42, cy: 140, delay: 0.2 },    // left ankle
  { cx: 58, cy: 140, delay: 0.3 },    // right ankle
  { cx: 42, cy: 110, delay: 0.4 },    // left knee
  { cx: 58, cy: 110, delay: 0.5 },    // right knee
  { cx: 45, cy: 80, delay: 0.6 },     // left hip
  { cx: 55, cy: 80, delay: 0.7 },     // right hip
  { cx: 50, cy: 60, delay: 0.8 },     // spine
  { cx: 30, cy: 55, delay: 0.9 },     // left shoulder
  { cx: 70, cy: 55, delay: 1.0 },     // right shoulder
  { cx: 25, cy: 70, delay: 1.1 },     // left elbow
  { cx: 75, cy: 70, delay: 1.2 },     // right elbow
  { cx: 20, cy: 85, delay: 1.3 },     // left wrist
  { cx: 80, cy: 85, delay: 1.4 },     // right wrist
  { cx: 50, cy: 35, delay: 1.5 },     // neck
  { cx: 50, cy: 20, delay: 1.7 },     // head
];

const bodyLines = [
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], // legs
  [6, 8], [7, 8], // hips to spine
  [8, 9], [8, 10], // spine to shoulders
  [9, 11], [10, 12], // shoulders to elbows
  [11, 13], [12, 14], // elbows to wrists
  [8, 15], [15, 16], // spine to head
];

const typewriterTexts = [
  'Mapping your recovery profile...',
  'Your journey starts now.',
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [screen, setScreen] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [animDone, setAnimDone] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);

  // Screen 3: show button after body animation completes
  useEffect(() => {
    if (screen === 2) {
      const timer = setTimeout(() => setAnimDone(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Typewriter text cycling
  useEffect(() => {
    if (screen === 2 && typewriterIndex < typewriterTexts.length - 1) {
      const timer = setTimeout(() => setTypewriterIndex((i) => i + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, typewriterIndex]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    setScreen((s) => s + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-bg flex flex-col"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === screen ? 'bg-accent' : 'bg-text-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Screen 1: Condition Selection */}
          {screen === 0 && (
            <motion.div
              key="screen-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-outfit text-2xl font-bold text-text-primary">
                  What are you recovering from?
                </h2>
                <p className="text-sm text-text-secondary font-outfit">
                  Select your condition to personalize your feed
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {conditions.map((cond) => (
                  <button
                    key={cond.id}
                    onClick={() => setSelectedCondition(cond.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedCondition === cond.id
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-bg-card hover:border-border-accent'
                    }`}
                  >
                    <span className="text-2xl">{cond.icon}</span>
                    <span className="font-outfit text-sm text-text-primary">
                      {cond.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Other text input */}
              {selectedCondition === 'other' && (
                <motion.input
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="text"
                  placeholder="Describe your condition..."
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl font-mono text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                />
              )}

              <button
                onClick={goNext}
                disabled={!selectedCondition}
                className="w-full h-12 rounded-xl bg-accent text-white font-outfit font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Screen 2: Phase Selection */}
          {screen === 1 && (
            <motion.div
              key="screen-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-outfit text-2xl font-bold text-text-primary">
                  Where are you in recovery?
                </h2>
                <p className="text-sm text-text-secondary font-outfit">
                  This helps us set the right difficulty
                </p>
              </div>

              <div className="space-y-3">
                {phases.map((phase) => (
                  <motion.button
                    key={phase.id}
                    whileTap={{ scale: 0.98 }}
                    animate={
                      selectedPhase === phase.id ? { scale: 1.02 } : { scale: 1 }
                    }
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPhase === phase.id
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-bg-card hover:border-border-accent'
                    }`}
                  >
                    <span className="font-outfit text-base font-bold text-text-primary block">
                      {phase.label}
                    </span>
                    <span className="font-outfit text-sm text-text-secondary mt-1 block">
                      {phase.desc}
                    </span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={goNext}
                disabled={!selectedPhase}
                className="w-full h-12 rounded-xl bg-accent text-white font-outfit font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Screen 3: Body Scan Animation */}
          {screen === 2 && (
            <motion.div
              key="screen-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm flex flex-col items-center gap-6"
            >
              {/* SVG skeleton body with joints lighting up */}
              <div className="relative">
                <svg
                  width={160}
                  height={200}
                  viewBox="0 0 100 200"
                  className="drop-shadow-lg"
                >
                  {/* Body lines */}
                  {bodyLines.map(([a, b], i) => (
                    <line
                      key={`line-${i}`}
                      x1={bodyJoints[a].cx}
                      y1={bodyJoints[a].cy}
                      x2={bodyJoints[b].cx}
                      y2={bodyJoints[b].cy}
                      stroke="var(--text-muted)"
                      strokeWidth="1.5"
                      opacity={0.5}
                    />
                  ))}
                  {/* Joint dots with staggered animation */}
                  {bodyJoints.map((joint, i) => (
                    <circle
                      key={`joint-${i}`}
                      cx={joint.cx}
                      cy={joint.cy}
                      r={4}
                      fill="var(--accent)"
                      className="body-scan-dot"
                      style={{ animationDelay: `${joint.delay}s` }}
                    />
                  ))}
                  {/* Head circle */}
                  <circle
                    cx={50}
                    cy={20}
                    r={10}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    className="body-scan-dot"
                    style={{ animationDelay: '1.7s' }}
                  />
                </svg>
              </div>

              {/* Typewriter text */}
              <div className="h-6 flex items-center">
                <motion.p
                  key={typewriterIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-sm text-text-secondary typewriter"
                >
                  {typewriterTexts[typewriterIndex]}
                </motion.p>
              </div>

              {/* Start button */}
              <AnimatePresence>
                {animDone && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onComplete({
                      condition: selectedCondition === 'other' ? otherText || 'General' : selectedCondition || 'ACL',
                      phase: phases.find(p => p.id === selectedPhase)?.label || 'Building Strength',
                    })}
                    className="relative w-full h-14 rounded-xl bg-accent text-white font-outfit font-bold text-base overflow-hidden"
                  >
                    <span className="relative z-10">Start Scrolling →</span>
                    <div className="absolute inset-0 shimmer opacity-30" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
