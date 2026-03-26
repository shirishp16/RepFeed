'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, User, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { id: 'feed', label: 'Feed', icon: Layers },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function BottomBar() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [showToast, setShowToast] = useState(false);

  const handleTabClick = (id: TabId) => {
    if (id !== 'feed') {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
      return;
    }
    setActiveTab(id);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 h-[56px] bg-bg-card border-t border-border flex items-center justify-around px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              />
              <span
                className={`text-[10px] font-outfit transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-dot"
                  className="absolute -bottom-0 w-1 h-1 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Coming Soon Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-secondary text-sm font-outfit"
        >
          Coming Soon
        </motion.div>
      )}
    </>
  );
}
