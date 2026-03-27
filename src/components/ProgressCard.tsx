'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { motivationalQuotes } from '@/data/mockData';

interface ProgressCardProps {
  xp: number;
  exercisesCompleted: number;
  avgFormScore: number;
  totalReps: number;
  streak: number;
  exerciseHistory: string[];
}

export default function ProgressCard({
  xp,
  exercisesCompleted,
  avgFormScore,
  totalReps,
  streak,
  exerciseHistory,
}: ProgressCardProps) {
  const [quote, setQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const gridStats = [
    { label: 'Exercises', value: exercisesCompleted },
    { label: 'Form Score', value: avgFormScore > 0 ? `${avgFormScore}%` : '—' },
    { label: 'Total Reps', value: totalReps },
    { label: 'XP Earned', value: xp },
  ];

  return (
    <div className="relative h-dvh w-full flex flex-col justify-center px-6 py-20 overflow-hidden">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-accent tracking-widest">
            YOUR RECOVERY
          </span>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        </div>

        {/* 2x2 stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {gridStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-card border border-border rounded-xl p-4 flex flex-col"
            >
              <span className="font-outfit text-[48px] font-bold text-text-primary leading-none">
                {stat.value}
              </span>
              <span className="font-mono text-xs text-text-muted mt-1 tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Session streak */}
        {streak > 0 && (
          <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <span className="font-outfit text-3xl font-bold text-accent">{streak}</span>
            <div>
              <p className="font-outfit text-sm font-bold text-text-primary">
                Exercise{streak !== 1 ? 's' : ''} completed this session
              </p>
              <p className="font-mono text-xs text-text-muted tracking-wide">STREAK</p>
            </div>
          </div>
        )}

        {/* Exercise history */}
        {exerciseHistory.length > 0 ? (
          <div className="bg-bg-card border border-border rounded-xl p-4 space-y-2">
            <span className="font-mono text-xs text-text-muted tracking-wide">
              COMPLETED THIS SESSION
            </span>
            <div className="space-y-1 mt-2">
              {exerciseHistory.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-success text-xs">✓</span>
                  <span className="font-outfit text-sm text-text-primary">{name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <p className="font-outfit text-sm text-text-secondary text-center">
              Complete an exercise to track your progress
            </p>
          </div>
        )}

        {/* Motivational quote */}
        <p className="text-center text-sm text-text-secondary font-outfit italic">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
