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
  anatomy:   { color: '#2DD4BF', glow: 'rgba(45,212,191,0.3)',  bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.2)' },
  recovery:  { color: '#60A5FA', glow: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
  nutrition: { color: '#4ADE80', glow: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)' },
  mindset:   { color: '#A78BFA', glow: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
};

export default function KnowledgeCard({ card }: KnowledgeCardProps) {
  const config = categoryConfig[card.category];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col justify-center px-6 py-20 overflow-hidden">
      {/* Floating orb in category color */}
      <div
        className="absolute top-10 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.bg} 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      <div className="max-w-md mx-auto w-full space-y-6 relative z-10">
        {/* Category pill */}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase"
          style={{
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
            boxShadow: `0 0 10px ${config.bg}`,
          }}
        >
          {card.category}
        </motion.span>

        {/* Left accent border + Title */}
        <div
          className="pl-4"
          style={{
            borderLeft: `3px solid ${config.color}`,
            filter: `drop-shadow(0 0 6px ${config.glow})`,
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-outfit text-[26px] font-bold text-text-primary leading-tight"
            style={{ textShadow: `0 0 30px ${config.bg}` }}
          >
            {card.title}
          </motion.h2>
        </div>

        {/* Content */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-base text-text-secondary leading-[1.7] font-outfit"
        >
          {card.content}
        </motion.p>
      </div>
    </div>
  );
}
