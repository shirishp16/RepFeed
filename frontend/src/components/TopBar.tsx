'use client';

import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';

interface TopBarProps {
  xp: number;
  streak: number;
  phase: string;
}

export default function TopBar({ xp, streak, phase }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-4 backdrop-blur-md bg-bg/80 border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-1.5">
        <Plus className="w-5 h-5 text-accent" strokeWidth={3} />
        <span className="font-outfit text-[15px] font-bold tracking-widest">
          <span className="text-accent">RECOVER</span>
          <span className="text-text-primary">FEED</span>
        </span>
      </div>

      {/* Phase pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hidden sm:flex items-center px-3 py-1 rounded-full bg-accent-soft border border-border-accent"
      >
        <span className="text-accent text-xs font-mono font-bold tracking-wide">
          {phase}
        </span>
      </motion.div>

      {/* XP + Streak */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-accent" fill="currentColor" />
          <motion.span
            key={xp}
            initial={{ scale: 1.3, color: 'var(--accent)' }}
            animate={{ scale: 1, color: 'var(--text-primary)' }}
            className="font-mono text-sm font-bold"
          >
            {xp}
          </motion.span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-sm">🔥</span>
          <span className="font-mono text-sm font-bold text-text-primary">
            {streak}
          </span>
        </div>
      </div>
    </div>
  );
}
