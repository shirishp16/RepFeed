'use client';

import { motion } from 'framer-motion';


interface TopBarProps {
  xp: number;
  streak: number;
  phase: string;
}

export default function TopBar({ xp, streak, phase }: TopBarProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-4"
      style={{
        background: 'rgba(6, 6, 6, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(45, 212, 191, 0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1.5">
        {/* Teal medical cross */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent">
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="currentColor" opacity="0.9" />
        </svg>
        <span className="font-outfit text-[15px] font-bold tracking-widest">
          <span
            className="gradient-text"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.3))',
            }}
          >
            RECOVER
          </span>
          <span className="text-text-primary">FEED</span>
        </span>
      </div>

      {/* Phase pill */}
      {phase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden sm:flex items-center px-3 py-1 rounded-full"
          style={{
            background: 'rgba(45, 212, 191, 0.08)',
            border: '1px solid rgba(45, 212, 191, 0.15)',
            boxShadow: '0 0 8px rgba(45,212,191,0.06)',
          }}
        >
          <span className="text-accent text-xs font-mono font-bold tracking-wide">
            {phase}
          </span>
        </motion.div>
      )}

    </div>
  );
}
