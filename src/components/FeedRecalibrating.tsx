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
            stroke="var(--accent)"
            strokeWidth="1"
            opacity={0.4}
          />
        ))}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={4}
            fill="var(--accent)"
            opacity={0.8}
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
          className="fixed inset-0 z-[60] bg-bg/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
        >
          <NeuralNetIcon />
          <p className="font-mono text-sm text-text-secondary tracking-wide">
            Recalibrating your feed...
          </p>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
