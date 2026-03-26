'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { mockUserStats, motivationalQuotes } from '@/data/mockData';

interface ProgressCardProps {
  xp: number;
}

export default function ProgressCard({ xp }: ProgressCardProps) {
  const stats = mockUserStats;
  const [quote, setQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const rom = stats.rangeOfMotion;
  const romData = [
    { label: 'Week 1', value: rom.week1 },
    { label: 'Week 2', value: rom.week2 },
    { label: 'Week 3', value: rom.week3 },
    { label: 'Current', value: rom.current },
  ];

  const gridStats = [
    { label: 'Exercises', value: stats.exercisesCompleted },
    { label: 'Form Score', value: `${stats.avgFormScore}%` },
    { label: 'Total Reps', value: stats.totalReps },
    { label: 'XP Earned', value: xp },
  ];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col justify-center px-6 py-20 overflow-hidden">
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

        {/* ROM bar chart */}
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
          <span className="font-mono text-xs text-text-muted tracking-wide">
            RANGE OF MOTION (degrees)
          </span>
          <div className="space-y-2">
            {romData.map((item, i) => {
              const isCurrentWeek = i === romData.length - 1;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted w-16 shrink-0">
                    {item.label}
                  </span>
                  <div className="flex-1 h-5 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 120) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className={`h-full rounded-full ${
                        isCurrentWeek
                          ? 'bg-accent shadow-[0_0_12px_var(--accent-glow)]'
                          : 'bg-accent/50'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-primary w-8 text-right">
                    {item.value}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational quote */}
        <p className="text-center text-sm text-text-secondary font-outfit italic">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
