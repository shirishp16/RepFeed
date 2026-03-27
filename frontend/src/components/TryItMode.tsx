'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Play } from 'lucide-react';
import type { ExerciseCard } from '@/data/mockData';
import type { ExerciseType } from '@/lib/poseDetection';
import PoseCamera from './PoseCamera';
import RepCounter from './RepCounter';
import FormScoreRing from './FormScoreRing';

interface TryItModeProps {
  active: boolean;
  exercise: ExerciseCard | null;
  onComplete: (data: { reps: number; formScore: number }) => void;
  onClose: () => void;
}

type CameraPhase = 'prompt' | 'countdown' | 'tracking' | 'fallback';

// SVG skeleton figure for the fallback/demo mode
function SkeletonFigure() {
  return (
    <svg
      viewBox="0 0 120 200"
      className="w-32 h-48 opacity-30"
      stroke="var(--text-muted)"
      strokeWidth="2"
      fill="none"
    >
      <circle cx="60" cy="25" r="12" />
      <line x1="60" y1="37" x2="60" y2="100" />
      <line x1="60" y1="55" x2="30" y2="80" />
      <line x1="60" y1="55" x2="90" y2="80" />
      <line x1="60" y1="100" x2="40" y2="150" />
      <line x1="60" y1="100" x2="80" y2="150" />
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
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>('prompt');
  const [countdown, setCountdown] = useState(3);

  const exerciseType: ExerciseType = exercise?.exerciseType ?? 'generic';
  const targetReps = exercise?.reps ?? 5;

  // Derive showComplete from reps — no effect needed
  const showComplete = reps >= Math.min(targetReps, 5);

  // Reset state when overlay is dismissed by the parent
  useEffect(() => {
    if (!active) {
      setReps(0);
      setFormScore(0);
      setCameraPhase('prompt');
      setCountdown(3);
    }
  }, [active]);

  // Countdown timer
  useEffect(() => {
    if (cameraPhase !== 'countdown') return;

    const timer = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setCameraPhase('tracking');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cameraPhase, countdown]);

  // Fallback auto-demo mode (original behaviour)
  useEffect(() => {
    if (cameraPhase !== 'fallback' || !active) return;

    const interval = setInterval(() => {
      setReps((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    const scoreTimer = setTimeout(() => setFormScore(84), 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(scoreTimer);
    };
  }, [cameraPhase, active]);

  // PoseCamera callbacks
  const handleRepCounted = useCallback((count: number) => {
    setReps(count);
  }, []);

  const handleFormUpdate = useCallback((score: number) => {
    setFormScore(score);
  }, []);

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

          {/* Main area */}
          <div className="flex-1 relative flex items-center justify-center bg-bg-card overflow-hidden">
            {/* Phase: Camera permission prompt */}
            {cameraPhase === 'prompt' && (
              <div className="flex flex-col items-center gap-6 px-6 max-w-sm">
                <div className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center">
                  <Camera className="w-10 h-10 text-accent" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-outfit text-base font-bold text-text-primary">
                    Real-time Form Tracking
                  </p>
                  <p className="font-outfit text-sm text-text-secondary leading-relaxed">
                    Your camera will track your body to count reps and score
                    your form. No video is recorded or sent anywhere.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => {
                      setCountdown(3);
                      setCameraPhase('countdown');
                    }}
                    className="w-full h-12 rounded-xl bg-accent text-white font-outfit font-bold text-base flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Enable Camera
                  </button>
                  <button
                    onClick={() => setCameraPhase('fallback')}
                    className="w-full h-10 rounded-xl bg-bg-elevated text-text-secondary font-outfit text-sm flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Skip (Demo Mode)
                  </button>
                </div>
              </div>
            )}

            {/* Phase: Countdown */}
            {cameraPhase === 'countdown' && (
              <div className="flex flex-col items-center gap-4">
                <p className="font-mono text-sm text-text-muted tracking-widest">
                  GET READY
                </p>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="font-outfit text-[120px] font-bold text-accent leading-none"
                  >
                    {countdown > 0 ? countdown : 'GO!'}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {/* Phase: Live camera tracking */}
            {cameraPhase === 'tracking' && (
              <PoseCamera
                exerciseType={exerciseType}
                onRepCounted={handleRepCounted}
                onFormUpdate={handleFormUpdate}
                isActive={true}
              />
            )}

            {/* Phase: Fallback demo */}
            {cameraPhase === 'fallback' && (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <SkeletonFigure />
                </motion.div>
                <p className="font-mono text-xs text-text-muted tracking-wide">
                  Demo Mode — Auto-tracking
                </p>
              </div>
            )}

            {/* Overlays: Rep counter & form score (all phases except prompt) */}
            {cameraPhase !== 'prompt' && (
              <>
                <div className="absolute top-4 left-4 z-10">
                  <RepCounter reps={reps} />
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <FormScoreRing score={formScore} />
                </div>
              </>
            )}
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
                  onClick={() => onComplete({ reps, formScore })}
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
