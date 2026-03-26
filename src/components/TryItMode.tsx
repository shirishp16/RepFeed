'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ExerciseCard } from '@/data/mockData';
import RepCounter from './RepCounter';
import FormScoreRing from './FormScoreRing';

interface TryItModeProps {
  active: boolean;
  exercise: ExerciseCard | null;
  onComplete: () => void;
  onClose: () => void;
}

// SVG skeleton figure for placeholder
function SkeletonFigure() {
  return (
    <svg
      viewBox="0 0 120 200"
      className="w-32 h-48 opacity-30"
      stroke="var(--text-muted)"
      strokeWidth="2"
      fill="none"
    >
      {/* Head */}
      <circle cx="60" cy="25" r="12" />
      {/* Body */}
      <line x1="60" y1="37" x2="60" y2="100" />
      {/* Arms */}
      <line x1="60" y1="55" x2="30" y2="80" />
      <line x1="60" y1="55" x2="90" y2="80" />
      {/* Legs */}
      <line x1="60" y1="100" x2="40" y2="150" />
      <line x1="60" y1="100" x2="80" y2="150" />
      {/* Feet */}
      <line x1="40" y1="150" x2="30" y2="155" />
      <line x1="80" y1="150" x2="90" y2="155" />
    </svg>
  );
}

export default function TryItMode({
  active,
  exercise,
  onComplete,
  onClose,
}: TryItModeProps) {
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // Simulated demo: auto-increment reps
  useEffect(() => {
    if (!active) {
      setReps(0);
      setFormScore(0);
      setShowComplete(false);
      return;
    }

    const interval = setInterval(() => {
      setReps((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    // Animate form score after a short delay
    const scoreTimer = setTimeout(() => {
      setFormScore(84);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(scoreTimer);
    };
  }, [active]);

  // Show complete button at 5 reps
  useEffect(() => {
    if (reps >= 5) {
      setShowComplete(true);
    }
  }, [reps]);

  return (
    <AnimatePresence>
      {active && exercise && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[70] bg-bg flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-outfit text-lg font-bold text-text-primary">
              {exercise.name}
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-bg-elevated"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Camera placeholder */}
          <div className="flex-1 relative flex items-center justify-center bg-bg-card">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <SkeletonFigure />
              </motion.div>
              <p className="font-mono text-xs text-text-muted tracking-wide">
                Camera will activate here
              </p>
            </div>

            {/* Rep counter — top left */}
            <div className="absolute top-4 left-4">
              <RepCounter reps={reps} />
            </div>

            {/* Form score ring — top right */}
            <div className="absolute top-4 right-4">
              <FormScoreRing score={formScore} />
            </div>
          </div>

          {/* Bottom banner */}
          <div className="px-4 py-4 border-t border-border bg-bg-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-outfit text-sm text-text-primary font-bold">
                  {exercise.name}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {exercise.reps
                    ? `Target: ${exercise.reps} reps`
                    : exercise.duration}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-active-soft text-active text-xs font-mono font-bold">
                +50 XP
              </span>
            </div>

            <AnimatePresence>
              {showComplete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={onComplete}
                  className="w-full h-12 rounded-xl bg-success text-white font-outfit font-bold text-base flex items-center justify-center"
                >
                  Complete Exercise ✓
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
