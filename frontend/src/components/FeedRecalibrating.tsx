'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface FeedRecalibratingProps {
  show: boolean;
}

function NeuralNetIcon() {
  const dots = [
    { cx: 30, cy: 30 },
    { cx: 70, cy: 20 },
    { cx: 50, cy: 50 },
    { cx: 20, cy: 70 },
    { cx: 80, cy: 70 },
    { cx: 50, cy: 90 },
  ];

  const lines = [
    [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [0, 1], [3, 4],
  ];

  return (
    <div className="spin-slow">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {lines.map(([a, b], i) => (
          <line
            key={i}
            x1={dots[a].cx}
            y1={dots[a].cy}
            x2={dots[b].cx}
            y2={dots[b].cy}
            stroke="#2DD4BF"
            strokeWidth="1"
            opacity={0.3}
            style={{ filter: 'drop-shadow(0 0 3px rgba(45,212,191,0.3))' }}
          />
        ))}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={4}
            fill="#2DD4BF"
            opacity={0.8}
            style={{ filter: 'drop-shadow(0 0 6px rgba(45,212,191,0.5))' }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function FeedRecalibrating({ show }: FeedRecalibratingProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] mesh-gradient flex flex-col items-center justify-center gap-6"
          style={{
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Floating orbs */}
          <div className="orb orb-teal" />
          <div className="orb orb-purple" />

          <NeuralNetIcon />
          <p
            className="font-mono text-sm text-text-secondary tracking-wide"
            style={{ textShadow: '0 0 15px rgba(45,212,191,0.15)' }}
          >
            Recalibrating your feed...
          </p>
          {/* Gradient progress bar */}
          <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{
                backgroundImage: 'linear-gradient(90deg, #2DD4BF, #06B6D4, #8B5CF6)',
                boxShadow: '0 0 12px rgba(45,212,191,0.4)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
