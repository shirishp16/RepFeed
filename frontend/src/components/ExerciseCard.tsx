'use client';

import { motion } from 'framer-motion';
import { Camera, AlertTriangle } from 'lucide-react';
import type { ExerciseCard as ExerciseCardType } from '@/data/mockData';
import CardActions from './CardActions';

interface ExerciseCardProps {
  exercise: ExerciseCardType;
  onLike: (id: string) => void;
  onTooEasy: (id: string) => void;
  onTooHard: (id: string) => void;
  onTryIt: (exercise: ExerciseCardType) => void;
}

export default function ExerciseCard({
  exercise,
  onLike,
  onTooEasy,
  onTooHard,
  onTryIt,
}: ExerciseCardProps) {
  const difficultyDots = Array.from({ length: 10 }, (_, i) => i < exercise.difficulty);

  return (
    <div className="relative h-[100dvh] w-full flex flex-col justify-center px-6 py-20 overflow-hidden">
      {/* Subtle ambient glow behind card */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <CardActions
        cardId={exercise.id}
        onLike={onLike}
        onTooEasy={onTooEasy}
        onTooHard={onTooHard}
      />

      <div className="max-w-md mx-auto w-full space-y-5 pr-14">
        {/* Top pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide text-accent"
            style={{
              background: 'rgba(45, 212, 191, 0.1)',
              border: '1px solid rgba(45, 212, 191, 0.2)',
              boxShadow: '0 0 8px rgba(45,212,191,0.06)',
            }}
          >
            {exercise.targetArea}
          </span>

          <div className="flex items-center gap-0.5">
            {difficultyDots.map((filled, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: filled ? '#2DD4BF' : 'rgba(255,255,255,0.08)',
                  boxShadow: filled ? '0 0 4px rgba(45,212,191,0.4)' : 'none',
                }}
              />
            ))}
          </div>

          <span
            className="ml-auto px-2 py-0.5 rounded-full text-xs font-mono font-bold text-accent"
            style={{
              background: 'rgba(45, 212, 191, 0.1)',
              border: '1px solid rgba(45, 212, 191, 0.15)',
              boxShadow: '0 0 6px rgba(45,212,191,0.08)',
            }}
          >
            +{exercise.xpReward} XP
          </span>
        </div>

        {/* Name */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-outfit text-[28px] font-bold text-text-primary leading-tight"
          style={{ textShadow: '0 0 40px rgba(45,212,191,0.08)' }}
        >
          {exercise.name}
        </motion.h2>

        {/* Description */}
        <p className="text-base text-text-secondary leading-relaxed">
          {exercise.description}
        </p>

        {/* Why It Helps — glass card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl p-4"
          style={{
            background: 'rgba(45, 212, 191, 0.04)',
            backdropFilter: 'blur(8px)',
            borderLeft: '3px solid rgba(45, 212, 191, 0.5)',
            border: '1px solid rgba(45, 212, 191, 0.1)',
            borderLeftWidth: '3px',
            borderLeftColor: 'rgba(45, 212, 191, 0.5)',
            boxShadow: '0 0 15px rgba(45,212,191,0.03)',
          }}
        >
          <p className="text-xs font-mono font-bold text-accent mb-1.5 tracking-wide"
            style={{ textShadow: '0 0 8px rgba(45,212,191,0.3)' }}
          >
            WHY THIS HELPS
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {exercise.whyItHelps}
          </p>
        </motion.div>

        {/* Reps / Duration */}
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1.5 rounded-full text-text-primary text-sm font-mono font-bold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {exercise.reps ? `${exercise.reps} reps` : exercise.duration}
          </span>

          {exercise.safetyNote && (
            <div className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-outfit">{exercise.safetyNote}</span>
            </div>
          )}
        </div>

        {/* Muscle group tags */}
        <div className="flex flex-wrap gap-2">
          {exercise.muscleGroups.map((mg) => (
            <span
              key={mg}
              className="px-2 py-0.5 rounded-md text-xs font-mono"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {mg}
            </span>
          ))}
        </div>

        {/* TRY IT button — premium gradient */}
        {exercise.canTryIt && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTryIt(exercise)}
            className="w-full h-14 rounded-2xl font-outfit font-bold text-base flex items-center justify-center gap-2 text-white relative overflow-hidden"
            style={{
              backgroundImage: 'linear-gradient(135deg, #2DD4BF, #06B6D4, #8B5CF6)',
              backgroundSize: '200% 200%',
              animation: 'mesh-shift 4s ease-in-out infinite',
              boxShadow: '0 0 25px rgba(45,212,191,0.25), 0 0 50px rgba(139,92,246,0.1), 0 4px 15px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Camera className="w-5 h-5 relative z-10" />
            <span className="relative z-10">TRY IT</span>
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer-btn 3s infinite',
              }}
            />
          </motion.button>
        )}
      </div>
    </div>
  );
}
