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

  const btnBase: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleLike}
        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          ...btnBase,
          borderColor: liked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.08)',
          boxShadow: liked ? '0 0 15px rgba(239,68,68,0.2)' : 'none',
        }}
      >
        <AnimatePresence>
          {liked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)' }}
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
            style={{ filter: liked ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 'none' }}
          />
        </motion.div>
      </motion.button>

      {/* Too Easy */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleTooEasy}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          ...btnBase,
          borderColor: easyFlash ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)',
          boxShadow: easyFlash ? '0 0 15px rgba(34,197,94,0.2)' : 'none',
          background: easyFlash ? 'rgba(34,197,94,0.08)' : btnBase.background,
        }}
      >
        <ChevronUp
          className={`w-5 h-5 transition-colors ${
            easyFlash ? 'text-success' : 'text-text-secondary'
          }`}
          style={{ filter: easyFlash ? 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' : 'none' }}
        />
      </motion.button>

      {/* Too Hard */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleTooHard}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          ...btnBase,
          borderColor: hardFlash ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.08)',
          boxShadow: hardFlash ? '0 0 15px rgba(234,179,8,0.2)' : 'none',
          background: hardFlash ? 'rgba(234,179,8,0.08)' : btnBase.background,
        }}
      >
        <ChevronDown
          className={`w-5 h-5 transition-colors ${
            hardFlash ? 'text-warning' : 'text-text-secondary'
          }`}
          style={{ filter: hardFlash ? 'drop-shadow(0 0 4px rgba(234,179,8,0.5))' : 'none' }}
        />
      </motion.button>
    </div>
  );
}
