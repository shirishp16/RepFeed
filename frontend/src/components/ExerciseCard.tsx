'use client';

import { motion } from 'framer-motion';
import { Camera, AlertTriangle, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ExerciseCard as ExerciseCardType } from '@/data/mockData';

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
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked((p) => !p);
    onLike(exercise.id);
  };

  const difficultyPercent = (exercise.difficulty / 10) * 100;

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-5 py-16 overflow-hidden">
      {/* Soft ambient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, rgba(45,212,191,0.05) 0%, transparent 55%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(22, 22, 26, 0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
        }}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5">
          {/* Area + XP row */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-semibold tracking-wide px-3 py-1 rounded-full"
              style={{
                background: 'rgba(45,212,191,0.1)',
                color: '#2DD4BF',
                border: '1px solid rgba(45,212,191,0.18)',
              }}
            >
              {exercise.targetArea}
            </span>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(249,115,22,0.1)',
                color: '#F97316',
                border: '1px solid rgba(249,115,22,0.18)',
              }}
            >
              +{exercise.xpReward} XP
            </span>
          </div>

          {/* Exercise name */}
          <h2 className="font-outfit text-2xl font-bold text-text-primary leading-snug mb-3">
            {exercise.name}
          </h2>

          {/* Difficulty bar */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${difficultyPercent}%`,
                  background: 'linear-gradient(90deg, #2DD4BF, #8B5CF6)',
                }}
              />
            </div>
            <span className="text-xs text-text-secondary font-outfit tabular-nums">
              {exercise.difficulty}/10
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed font-outfit">
            {exercise.description}
          </p>

          {/* Why it helps */}
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: 'rgba(45,212,191,0.05)',
              borderLeft: '2px solid rgba(45,212,191,0.4)',
            }}
          >
            <p className="text-xs text-accent font-semibold mb-1 tracking-wide">
              Why this helps
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {exercise.whyItHelps}
            </p>
          </div>

          {/* Reps + safety */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-outfit font-semibold px-3.5 py-1.5 rounded-xl text-text-primary"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {exercise.reps ? `${exercise.reps} reps` : exercise.duration}
            </span>
            {exercise.safetyNote && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                <span className="text-xs text-warning font-outfit">{exercise.safetyNote}</span>
              </div>
            )}
          </div>

          {/* Muscle tags */}
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="text-xs px-2.5 py-1 rounded-lg font-outfit"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {mg}
              </span>
            ))}
          </div>
        </div>

        {/* ── Footer: TRY IT + Actions ── */}
        <div
          className="px-6 pb-6 pt-4 space-y-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {exercise.canTryIt && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTryIt(exercise)}
              className="w-full h-12 rounded-2xl font-outfit font-semibold text-sm flex items-center justify-center gap-2 text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2DD4BF, #06B6D4)',
                boxShadow: '0 4px 16px rgba(45,212,191,0.2)',
              }}
            >
              <Camera className="w-4 h-4" />
              TRY IT — AI Form Check
            </motion.button>
          )}

          {/* Action buttons row */}
          <div className="flex items-center justify-around pt-1">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                style={{
                  background: liked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                  border: liked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Heart
                  className="w-4.5 h-4.5 transition-colors"
                  style={{
                    color: liked ? '#EF4444' : 'rgba(255,255,255,0.35)',
                    fill: liked ? '#EF4444' : 'transparent',
                    width: '18px',
                    height: '18px',
                  }}
                />
              </div>
              <span className="text-[10px] font-outfit" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Like
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onTooEasy(exercise.id)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <ChevronUp className="w-4.5 h-4.5" style={{ color: 'rgba(255,255,255,0.35)', width: '18px', height: '18px' }} />
              </div>
              <span className="text-[10px] font-outfit" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Too easy
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onTooHard(exercise.id)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <ChevronDown className="w-4.5 h-4.5" style={{ color: 'rgba(255,255,255,0.35)', width: '18px', height: '18px' }} />
              </div>
              <span className="text-[10px] font-outfit" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Too hard
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
