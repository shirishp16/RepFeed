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
      <CardActions
        cardId={exercise.id}
        onLike={onLike}
        onTooEasy={onTooEasy}
        onTooHard={onTooHard}
      />

      <div className="max-w-md mx-auto w-full space-y-5 pr-14">
        {/* Top pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-mono font-bold tracking-wide">
            {exercise.targetArea}
          </span>

          <div className="flex items-center gap-0.5">
            {difficultyDots.map((filled, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  filled ? 'bg-accent' : 'bg-text-muted'
                }`}
              />
            ))}
          </div>

          <span className="ml-auto px-2 py-0.5 rounded-full bg-active-soft text-active text-xs font-mono font-bold">
            +{exercise.xpReward} XP
          </span>
        </div>

        {/* Name */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-outfit text-[28px] font-bold text-text-primary leading-tight"
        >
          {exercise.name}
        </motion.h2>

        {/* Description */}
        <p className="text-base text-text-secondary leading-relaxed">
          {exercise.description}
        </p>

        {/* Why It Helps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-accent-soft rounded-lg p-4 border-l-[3px] border-accent"
        >
          <p className="text-xs font-mono font-bold text-accent mb-1.5 tracking-wide">
            WHY THIS HELPS
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {exercise.whyItHelps}
          </p>
        </motion.div>

        {/* Reps / Duration */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-bg-elevated border border-border text-text-primary text-sm font-mono font-bold">
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
              className="px-2 py-0.5 rounded-md bg-bg-elevated text-text-muted text-xs font-mono"
            >
              {mg}
            </span>
          ))}
        </div>

        {/* TRY IT button */}
        {exercise.canTryIt && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            onClick={() => onTryIt(exercise)}
            className="pulse-border w-full h-14 rounded-xl border-2 border-active bg-transparent text-active font-outfit font-bold text-base flex items-center justify-center gap-2 hover:bg-active-soft transition-colors"
          >
            <Camera className="w-5 h-5" />
            TRY IT
          </motion.button>
        )}
      </div>
    </div>
  );
}
