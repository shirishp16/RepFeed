'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashCursor from './SplashCursor';

interface OnboardingFlowProps {
  onComplete: (data: { condition: string; phase: string }) => void;
}

// ─── SVG Icon Components ────────────────────────────────────────────────────

function KneeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 8 8 8 12C8 16 12 22 12 22" />
      <path d="M12 2C12 2 16 8 16 12C16 16 12 22 12 22" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function ShoulderIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      <path d="M12 8v4" />
      <path d="M8 8C5 9 3 11 3 14" />
      <path d="M16 8c3 1 5 3 5 6" />
      <path d="M10 12l-3 6" />
      <path d="M14 12l3 6" />
    </svg>
  );
}

function SpineIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M8 5h8" />
      <path d="M9 9h6" />
      <path d="M8 13h8" />
      <path d="M9 17h6" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="9" r="1" fill="currentColor" />
      <circle cx="12" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function AnkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8" />
      <path d="M12 10c-2 3-5 5-5 8a5 5 0 0 0 10 0c0-3-3-5-5-8z" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

function WristIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14V6a2 2 0 0 1 4 0v1" />
      <path d="M12 7V4a2 2 0 0 1 4 0v6" />
      <path d="M16 10V8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8H9a8 8 0 0 1-5-2" />
      <path d="M4 14a2 2 0 0 1 4 0v1" />
    </svg>
  );
}

function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

const conditions = [
  { id: 'acl', label: 'ACL', Icon: KneeIcon },
  { id: 'shoulder', label: 'Shoulder', Icon: ShoulderIcon },
  { id: 'back', label: 'Back', Icon: SpineIcon },
  { id: 'ankle', label: 'Ankle', Icon: AnkleIcon },
  { id: 'wrist', label: 'Wrist', Icon: WristIcon },
  { id: 'other', label: 'Other', Icon: PlusIcon },
];

const phases = [
  {
    id: 'early',
    label: 'Early Recovery',
    desc: 'Weeks 0–4 · Reduce swelling, restore basic mobility',
    weeks: '0–4',
  },
  {
    id: 'building',
    label: 'Building Strength',
    desc: 'Weeks 4–12 · Progressive loading & functional exercises',
    weeks: '4–12',
  },
  {
    id: 'almost',
    label: 'Almost There',
    desc: 'Months 3–6+ · Sport-specific training & return-to-play',
    weeks: '12+',
  },
];

// Skeleton body
const bodyJoints = [
  { cx: 42, cy: 170, delay: 0 }, { cx: 58, cy: 170, delay: 0.1 },
  { cx: 42, cy: 140, delay: 0.2 }, { cx: 58, cy: 140, delay: 0.3 },
  { cx: 42, cy: 110, delay: 0.4 }, { cx: 58, cy: 110, delay: 0.5 },
  { cx: 45, cy: 80, delay: 0.6 }, { cx: 55, cy: 80, delay: 0.7 },
  { cx: 50, cy: 60, delay: 0.8 }, { cx: 30, cy: 55, delay: 0.9 },
  { cx: 70, cy: 55, delay: 1.0 }, { cx: 25, cy: 70, delay: 1.1 },
  { cx: 75, cy: 70, delay: 1.2 }, { cx: 20, cy: 85, delay: 1.3 },
  { cx: 80, cy: 85, delay: 1.4 }, { cx: 50, cy: 35, delay: 1.5 },
  { cx: 50, cy: 20, delay: 1.7 },
];

const bodyLines = [
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7],
  [6, 8], [7, 8], [8, 9], [8, 10], [9, 11], [10, 12],
  [11, 13], [12, 14], [8, 15], [15, 16],
];

const typewriterTexts = ['Mapping your recovery profile...', 'Your journey starts now.'];

// ─── Animation variants ─────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const cardPop = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [screen, setScreen] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [animDone, setAnimDone] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (screen === 2) {
      const timer = setTimeout(() => setAnimDone(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 2 && typewriterIndex < typewriterTexts.length - 1) {
      const timer = setTimeout(() => setTypewriterIndex((i) => i + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, typewriterIndex]);

  const goNext = () => {
    setDirection(1);
    setScreen((s) => s + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] mesh-gradient flex flex-col overflow-hidden"
    >
      {/* Fluid cursor effect */}
      <SplashCursor />

      {/* Floating orbs — bigger & glowier */}
      <div className="orb orb-teal" />
      <div className="orb orb-purple" />
      <div className="orb orb-blue" />

      {/* ── Branding at top ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="flex flex-col items-center pt-10 pb-2 relative z-10"
      >
        <h1
          className="font-outfit text-[28px] font-extrabold tracking-[0.25em] uppercase"
          style={{
            background: 'linear-gradient(135deg, #2DD4BF 0%, #6EE7B7 30%, #06B6D4 60%, #8B5CF6 100%)',
            backgroundSize: '200% 200%',
            animation: 'mesh-shift 4s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 25px rgba(45, 212, 191, 0.5)) drop-shadow(0 0 50px rgba(139, 92, 246, 0.25))',
          }}
        >
          RecoverFeed
        </h1>
        <div
          className="w-16 h-0.5 rounded-full mt-3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)',
          }}
        />
      </motion.div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 pb-4 relative z-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              width: i === screen ? 28 : 8,
              backgroundColor: i === screen ? '#2DD4BF' : 'rgba(255,255,255,0.12)',
              boxShadow: i === screen ? '0 0 12px rgba(45,212,191,0.5)' : 'none',
            }}
            transition={{ duration: 0.4, ease }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ─── Screen 1: Condition Selection ───────────────────────── */}
          {screen === 0 && (
            <motion.div
              key="screen-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-sm space-y-7"
            >
              {/* Title */}
              <div className="text-center space-y-3">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-outfit text-[28px] font-bold leading-tight"
                  style={{
                    color: 'rgba(255,255,255,0.92)',
                    textShadow: '0 0 40px rgba(45,212,191,0.2), 0 0 80px rgba(139,92,246,0.1)',
                  }}
                >
                  What are you recovering from?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-sm text-white/35 font-outfit tracking-wide"
                >
                  Select your condition to personalize your feed
                </motion.p>
              </div>

              {/* Condition Cards */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-3 gap-3"
              >
                {conditions.map((cond) => {
                  const selected = selectedCondition === cond.id;
                  return (
                    <motion.button
                      key={cond.id}
                      variants={cardPop}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedCondition(cond.id)}
                      className="relative flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-300"
                      style={{
                        background: selected
                          ? 'rgba(45, 212, 191, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: selected
                          ? '1.5px solid rgba(45, 212, 191, 0.4)'
                          : '1.5px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: selected
                          ? '0 0 20px rgba(45,212,191,0.15), 0 0 40px rgba(45,212,191,0.05), inset 0 1px 0 rgba(45,212,191,0.15)'
                          : '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {/* Glow ring behind icon when selected */}
                      {selected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute top-3 w-10 h-10 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)',
                          }}
                        />
                      )}
                      <div
                        className="relative z-10 transition-all duration-300"
                        style={{
                          color: selected ? '#2DD4BF' : 'rgba(255,255,255,0.4)',
                          filter: selected ? 'drop-shadow(0 0 8px rgba(45,212,191,0.4))' : 'none',
                        }}
                      >
                        <cond.Icon />
                      </div>
                      <span
                        className="relative z-10 font-outfit text-[13px] font-medium tracking-wider transition-colors duration-300"
                        style={{
                          color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                          textShadow: selected ? '0 0 10px rgba(45,212,191,0.3)' : 'none',
                        }}
                      >
                        {cond.label}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Other text input */}
              {selectedCondition === 'other' && (
                <motion.input
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="text"
                  placeholder="Describe your condition..."
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl font-mono text-sm text-white/90 placeholder:text-white/20 outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              )}

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={goNext}
                disabled={!selectedCondition}
                className="w-full h-14 rounded-2xl font-outfit text-[15px] font-semibold tracking-wider relative overflow-hidden disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300"
                style={{
                  backgroundImage: selectedCondition
                    ? 'linear-gradient(135deg, #2DD4BF, #06B6D4, #8B5CF6)'
                    : 'linear-gradient(135deg, #2DD4BF, #06B6D4)',
                  backgroundSize: '200% 200%',
                  animation: 'mesh-shift 4s ease-in-out infinite',
                  color: '#fff',
                  boxShadow: selectedCondition
                    ? '0 0 25px rgba(45,212,191,0.3), 0 0 50px rgba(139,92,246,0.15), 0 4px 15px rgba(0,0,0,0.3)'
                    : 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="relative z-10">Continue</span>
                {/* Shimmer */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer-btn 3s infinite',
                  }}
                />
              </motion.button>
            </motion.div>
          )}

          {/* ─── Screen 2: Phase Selection ───────────────────────────── */}
          {screen === 1 && (
            <motion.div
              key="screen-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-sm space-y-7"
            >
              {/* Title */}
              <div className="text-center space-y-3">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-outfit text-[28px] font-bold leading-tight"
                  style={{
                    color: 'rgba(255,255,255,0.92)',
                    textShadow: '0 0 40px rgba(45,212,191,0.2), 0 0 80px rgba(139,92,246,0.1)',
                  }}
                >
                  Where are you in recovery?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-sm text-white/35 font-outfit tracking-wide"
                >
                  This helps us set the right difficulty
                </motion.p>
              </div>

              {/* Phase Cards */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {phases.map((phase, idx) => {
                  const selected = selectedPhase === phase.id;
                  return (
                    <motion.button
                      key={phase.id}
                      variants={cardPop}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPhase(phase.id)}
                      className="w-full text-left p-5 rounded-2xl flex items-start gap-4 cursor-pointer transition-all duration-300"
                      style={{
                        background: selected
                          ? 'rgba(45, 212, 191, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: selected
                          ? '1.5px solid rgba(45, 212, 191, 0.4)'
                          : '1.5px solid rgba(255, 255, 255, 0.06)',
                        boxShadow: selected
                          ? '0 0 20px rgba(45,212,191,0.12), 0 0 40px rgba(45,212,191,0.05), inset 0 1px 0 rgba(45,212,191,0.12)'
                          : '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {/* Timeline dot + connector */}
                      <div className="flex flex-col items-center pt-1.5 shrink-0">
                        <div
                          className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{
                            background: selected ? '#2DD4BF' : 'rgba(255,255,255,0.12)',
                            border: selected ? '2px solid #2DD4BF' : '2px solid rgba(255,255,255,0.15)',
                            boxShadow: selected ? '0 0 10px rgba(45,212,191,0.5), 0 0 20px rgba(45,212,191,0.2)' : 'none',
                          }}
                        />
                        {idx < phases.length - 1 && (
                          <div className="w-px h-8 mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className="font-outfit text-[15px] font-semibold transition-all duration-300"
                            style={{
                              color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
                              textShadow: selected ? '0 0 15px rgba(45,212,191,0.2)' : 'none',
                            }}
                          >
                            {phase.label}
                          </span>
                          <span
                            className="font-mono text-[11px] px-2.5 py-0.5 rounded-full transition-all duration-300"
                            style={{
                              background: selected ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.04)',
                              color: selected ? '#2DD4BF' : 'rgba(255,255,255,0.25)',
                              border: selected ? '1px solid rgba(45,212,191,0.25)' : '1px solid transparent',
                              boxShadow: selected ? '0 0 8px rgba(45,212,191,0.15)' : 'none',
                            }}
                          >
                            wk {phase.weeks}
                          </span>
                        </div>
                        <span
                          className="font-outfit text-[13px] mt-1.5 block leading-relaxed transition-colors duration-300"
                          style={{ color: selected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}
                        >
                          {phase.desc}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={goNext}
                disabled={!selectedPhase}
                className="w-full h-14 rounded-2xl font-outfit text-[15px] font-semibold tracking-wider relative overflow-hidden disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300"
                style={{
                  backgroundImage: selectedPhase
                    ? 'linear-gradient(135deg, #2DD4BF, #06B6D4, #8B5CF6)'
                    : 'linear-gradient(135deg, #2DD4BF, #06B6D4)',
                  backgroundSize: '200% 200%',
                  animation: 'mesh-shift 4s ease-in-out infinite',
                  color: '#fff',
                  boxShadow: selectedPhase
                    ? '0 0 25px rgba(45,212,191,0.3), 0 0 50px rgba(139,92,246,0.15), 0 4px 15px rgba(0,0,0,0.3)'
                    : 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="relative z-10">Continue</span>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer-btn 3s infinite',
                  }}
                />
              </motion.button>
            </motion.div>
          )}

          {/* ─── Screen 3: Body Scan ────────────────────────────────── */}
          {screen === 2 && (
            <motion.div
              key="screen-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-sm flex flex-col items-center gap-8"
            >
              {/* SVG skeleton body */}
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

              {/* Typewriter */}
              <div className="h-6 flex items-center">
                <motion.p
                  key={typewriterIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-sm text-white/35 typewriter"
                >
                  {typewriterTexts[typewriterIndex]}
                </motion.p>
              </div>

              {/* Start button */}
              <AnimatePresence>
                {animDone && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onComplete({
                      condition: selectedCondition === 'other' ? otherText || 'General' : selectedCondition || 'ACL',
                      phase: phases.find(p => p.id === selectedPhase)?.label || 'Building Strength',
                    })}
                    className="w-full h-14 rounded-2xl font-outfit font-bold text-base tracking-wider relative overflow-hidden"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #2DD4BF, #06B6D4, #8B5CF6)',
                      backgroundSize: '200% 200%',
                      animation: 'mesh-shift 4s ease-in-out infinite',
                      color: '#fff',
                      boxShadow: '0 0 30px rgba(45,212,191,0.35), 0 0 60px rgba(139,92,246,0.15), 0 4px 20px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <span className="relative z-10">Start Scrolling →</span>
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        animation: 'shimmer-btn 2s infinite',
                      }}
                    />
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
