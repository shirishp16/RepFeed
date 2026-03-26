'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RepCounterProps {
  reps: number;
}

export default function RepCounter({ reps }: RepCounterProps) {
  const [showPlus, setShowPlus] = useState(false);
  const [prevReps, setPrevReps] = useState(reps);

  useEffect(() => {
    if (reps > prevReps) {
      setShowPlus(true);
      const timer = setTimeout(() => setShowPlus(false), 600);
      setPrevReps(reps);
      return () => clearTimeout(timer);
    }
  }, [reps, prevReps]);

  return (
    <div className="relative">
      <motion.span
        key={reps}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="font-outfit text-[64px] font-bold text-text-primary leading-none"
      >
        {reps}
      </motion.span>
      <span className="block font-mono text-xs text-text-muted tracking-widest mt-1">
        REPS
      </span>

      <AnimatePresence>
        {showPlus && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-active"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
