'use client';

import { motion } from 'framer-motion';

interface KnowledgeCardProps {
  card: {
    id: string;
    title: string;
    content: string;
    category: 'anatomy' | 'recovery' | 'nutrition' | 'mindset';
  };
}

const categoryConfig = {
  anatomy:   { accent: '#2DD4BF', label: 'Anatomy',   dot: 'rgba(45,212,191,0.8)' },
  recovery:  { accent: '#60A5FA', label: 'Recovery',  dot: 'rgba(96,165,250,0.8)' },
  nutrition: { accent: '#4ADE80', label: 'Nutrition', dot: 'rgba(74,222,128,0.8)' },
  mindset:   { accent: '#A78BFA', label: 'Mindset',   dot: 'rgba(167,139,250,0.8)' },
};

export default function KnowledgeCard({ card }: KnowledgeCardProps) {
  const cfg = categoryConfig[card.category];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-5 py-16 overflow-hidden">
      {/* Soft ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 25% 30%, ${cfg.accent}0d 0%, transparent 55%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(22, 22, 26, 0.97)',
          border: `1px solid ${cfg.accent}18`,
          boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.accent}08, 0 1px 0 rgba(255,255,255,0.05) inset`,
        }}
      >
        {/* Thin top color line */}
        <div className="h-0.5 w-full" style={{ background: cfg.accent, opacity: 0.7 }} />

        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
            />
            <span
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: cfg.accent }}
            >
              {cfg.label}
            </span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="font-outfit text-2xl font-bold text-text-primary leading-snug"
          >
            {card.title}
          </motion.h2>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Content */}
        <div className="px-6 py-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="text-sm text-text-secondary leading-[1.8] font-outfit"
          >
            {card.content}
          </motion.p>
        </div>

        {/* Footer separator */}
        <div
          className="mx-6 mb-6 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span
            className="text-xs font-outfit opacity-30"
            style={{ color: cfg.accent }}
          >
            Learn · {cfg.label}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
