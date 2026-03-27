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
  anatomy: { color: 'text-accent', bg: 'bg-accent-soft', border: 'border-accent', gradient: 'from-accent/[0.02]' },
  recovery: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400', gradient: 'from-blue-400/[0.02]' },
  nutrition: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400', gradient: 'from-green-400/[0.02]' },
  mindset: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400', gradient: 'from-purple-400/[0.02]' },
};

export default function KnowledgeCard({ card }: KnowledgeCardProps) {
  const config = categoryConfig[card.category];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col justify-center px-6 py-20 overflow-hidden">
      {/* Subtle gradient */}
      <div
        className={`absolute top-0 left-0 w-64 h-64 bg-gradient-to-br ${config.gradient} to-transparent rounded-full blur-3xl pointer-events-none`}
      />

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Category pill */}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`inline-block px-3 py-1 rounded-full ${config.bg} ${config.color} text-xs font-mono font-bold tracking-wide uppercase`}
        >
          {card.category}
        </motion.span>

        {/* Left accent border + Title */}
        <div className={`border-l-[3px] ${config.border} pl-4`}>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-outfit text-[26px] font-bold text-text-primary leading-tight"
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
