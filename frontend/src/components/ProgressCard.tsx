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
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(45,212,191,0.08) 0%, rgba(139,92,246,0.03) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-md mx-auto w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm font-bold tracking-widest text-accent"
            style={{ textShadow: '0 0 15px rgba(45,212,191,0.3)' }}
          >
            YOUR RECOVERY
          </span>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-accent"
            style={{ boxShadow: '0 0 6px rgba(45,212,191,0.5)' }}
          />
        </div>

        {/* 2x2 stats grid — glass cards */}
        <div className="grid grid-cols-2 gap-3">
          {gridStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(45, 212, 191, 0.1)',
                boxShadow: '0 0 15px rgba(45,212,191,0.03), 0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              <span className="font-outfit text-[48px] font-bold leading-none gradient-text">
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
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(45, 212, 191, 0.15)',
              boxShadow: '0 0 20px rgba(45,212,191,0.06)',
              animation: 'pulse-border 3s infinite',
            }}
          >
            <span className="font-outfit text-3xl font-bold gradient-text">{streak}</span>
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
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="font-mono text-xs text-text-muted tracking-wide">
              COMPLETED THIS SESSION
            </span>
            <div className="space-y-1 mt-2">
              {exerciseHistory.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-success text-xs" style={{ textShadow: '0 0 6px rgba(34,197,94,0.4)' }}>✓</span>
                  <span className="font-outfit text-sm text-text-primary">{name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="font-outfit text-sm text-text-secondary text-center">
              Complete an exercise to track your progress
            </p>
          </div>
        )}

        {/* Motivational quote */}
        <p
          className="text-center text-sm text-text-secondary font-outfit italic"
          style={{ textShadow: '0 0 20px rgba(45,212,191,0.06)' }}
        >
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
