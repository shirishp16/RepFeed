'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface PreferenceVector {
  upperBody: number;
  lowerBody: number;
  core: number;
  balance: number;
  intensity: number;
}

interface RehabProfileProps {
  preferenceVector: PreferenceVector;
  cardsViewed: number;
}

const radarLabels = ['Quad Strength', 'Flexibility', 'Balance', 'Endurance', 'Pain Tolerance'];

function getRadarPoints(values: number[], cx: number, cy: number, r: number): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const x = cx + r * v * Math.cos(angle);
      const y = cy + r * v * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');
}

function getAxisPoint(i: number, total: number, cx: number, cy: number, r: number) {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function RehabProfile({
  preferenceVector,
  cardsViewed,
}: RehabProfileProps) {
  const [expanded, setExpanded] = useState(false);

  const values = [
    preferenceVector.lowerBody,
    preferenceVector.upperBody,
    preferenceVector.balance,
    preferenceVector.core,
    preferenceVector.intensity,
  ];

  const cx = 110;
  const cy = 110;
  const r = 80;

  const insights = [
    'Lower body focus detected',
    'Moderate intensity preference',
    'Balance training needed',
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-[280px] h-[360px] bg-bg-card border border-accent rounded-2xl p-4 mb-2 overflow-hidden"
          >
            <h4 className="font-mono text-xs font-bold text-accent tracking-widest mb-3">
              REHAB INTELLIGENCE
            </h4>

            {/* Radar chart */}
            <div className="flex justify-center">
              <svg width={220} height={220}>
                {/* Grid pentagons */}
                {[0.25, 0.5, 0.75, 1].map((scale) => (
                  <polygon
                    key={scale}
                    points={getRadarPoints(
                      Array(5).fill(scale),
                      cx,
                      cy,
                      r,
                    )}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                ))}
                {/* Axis lines */}
                {radarLabels.map((_, i) => {
                  const pt = getAxisPoint(i, 5, cx, cy, r);
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={pt.x}
                      y2={pt.y}
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Data polygon */}
                <motion.polygon
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  points={getRadarPoints(values, cx, cy, r)}
                  fill="var(--accent-soft)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                {/* Data dots */}
                {values.map((v, i) => {
                  const pt = getAxisPoint(i, 5, cx, cy, r * v);
                  return (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={3}
                      fill="var(--accent)"
                    />
                  );
                })}
                {/* Labels */}
                {radarLabels.map((label, i) => {
                  const pt = getAxisPoint(i, 5, cx, cy, r + 18);
                  return (
                    <text
                      key={label}
                      x={pt.x}
                      y={pt.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-text-muted text-[8px] font-mono"
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Adapting spinner */}
            {cardsViewed >= 5 && (
              <div className="flex items-center gap-2 mt-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full"
                />
                <span className="font-mono text-[10px] text-text-muted">
                  Feed Adapting...
                </span>
              </div>
            )}

            {/* Insight pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {insights.map((insight) => (
                <span
                  key={insight}
                  className="px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted font-mono text-[9px]"
                >
                  {insight}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setExpanded((prev) => !prev)}
        className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent-glow"
      >
        <Brain className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  );
}
