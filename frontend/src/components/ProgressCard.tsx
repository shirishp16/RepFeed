'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { motivationalQuotes } from '@/data/mockData';
import { CheckCircle } from 'lucide-react';

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

  const stats = [
    { label: 'Exercises', value: exercisesCompleted, color: '#2DD4BF' },
    { label: 'Form Score', value: avgFormScore > 0 ? `${avgFormScore}%` : '—', color: '#8B5CF6' },
    { label: 'Total Reps', value: totalReps, color: '#60A5FA' },
    { label: 'XP Earned', value: xp, color: '#F97316' },
  ];

  return (
    <div className="relative h-dvh w-full flex flex-col items-center justify-center px-5 py-16 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(45,212,191,0.04) 0%, transparent 55%)',
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
        {/* Top bar */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #2DD4BF, #8B5CF6, #F97316)', opacity: 0.7 }}
        />

        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-accent opacity-60 mb-1">
                Session Stats
              </p>
              <h2 className="font-outfit text-2xl font-bold text-text-primary">
                Your Recovery
              </h2>
            </div>
            {streak > 0 && (
              <div
                className="px-3 py-1.5 rounded-2xl text-center"
                style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.18)',
                }}
              >
                <p className="font-outfit text-xl font-bold text-warning leading-none">{streak}</p>
                <p className="text-[10px] font-outfit text-warning opacity-60 mt-0.5">streak</p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Stats grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl px-4 py-4"
              style={{
                background: `${stat.color}08`,
                border: `1px solid ${stat.color}18`,
              }}
            >
              <p
                className="font-outfit text-[28px] font-bold leading-none"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs font-outfit mt-1.5 opacity-50"
                style={{ color: stat.color }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Exercise history */}
        {exerciseHistory.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 24px' }} />
            <div className="px-6 py-4 space-y-2">
              <p className="text-xs font-outfit opacity-30 text-text-primary uppercase tracking-wider mb-3">
                Completed
              </p>
              {exerciseHistory.slice(-4).map((name, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span className="font-outfit text-sm text-text-secondary">{name}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Quote */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-center text-xs text-text-secondary font-outfit italic opacity-40">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </motion.div>
    </div>
  );
}
