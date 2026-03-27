'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronUp, ChevronDown } from 'lucide-react';

interface CardActionsProps {
  cardId: string;
  onLike: (id: string) => void;
  onTooEasy: (id: string) => void;
  onTooHard: (id: string) => void;
}

export default function CardActions({
  cardId,
  onLike,
  onTooEasy,
  onTooHard,
}: CardActionsProps) {
  const [liked, setLiked] = useState(false);
  const [easyFlash, setEasyFlash] = useState(false);
  const [hardFlash, setHardFlash] = useState(false);

  const handleLike = () => {
    setLiked((prev) => !prev);
    onLike(cardId);
  };

  const handleTooEasy = () => {
    onTooEasy(cardId);
    setEasyFlash(true);
    setTimeout(() => setEasyFlash(false), 400);
  };

  const handleTooHard = () => {
    onTooHard(cardId);
    setHardFlash(true);
    setTimeout(() => setHardFlash(false), 400);
  };

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleLike}
        className="relative w-12 h-12 rounded-full bg-bg-elevated/80 border border-border flex items-center justify-center"
      >
        <AnimatePresence>
          {liked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full bg-danger/20"
            />
          )}
        </AnimatePresence>
        <motion.div
          animate={liked ? { scale: 1.4 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              liked ? 'text-danger fill-danger' : 'text-text-secondary'
            }`}
          />
        </motion.div>
      </motion.button>

      {/* Too Easy */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleTooEasy}
        className={`w-12 h-12 rounded-full bg-bg-elevated/80 border border-border flex items-center justify-center transition-colors ${
          easyFlash ? 'bg-success/20 border-success/50' : ''
        }`}
      >
        <ChevronUp
          className={`w-5 h-5 transition-colors ${
            easyFlash ? 'text-success' : 'text-text-secondary'
          }`}
        />
      </motion.button>

      {/* Too Hard */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleTooHard}
        className={`w-12 h-12 rounded-full bg-bg-elevated/80 border border-border flex items-center justify-center transition-colors ${
          hardFlash ? 'bg-warning/20 border-warning/50' : ''
        }`}
      >
        <ChevronDown
          className={`w-5 h-5 transition-colors ${
            hardFlash ? 'text-warning' : 'text-text-secondary'
          }`}
        />
      </motion.button>
    </div>
  );
}
