import type { ExerciseType } from '@/lib/poseDetection';

export interface ExerciseCard {
  id: string;
  type: 'exercise';
  name: string;
  targetArea: string;
  difficulty: number;
  description: string;
  whyItHelps: string;
  reps?: number;
  duration?: string;
  xpReward: number;
  muscleGroups: string[];
  safetyNote?: string;
  canTryIt: boolean;
  exerciseType?: ExerciseType;
}

export interface KnowledgeCard {
  id: string;
  type: 'knowledge';
  title: string;
  content: string;
  category: 'anatomy' | 'recovery' | 'nutrition' | 'mindset';
}

export interface ProgressCardData {
  id: string;
  type: 'progress';
}

export type FeedCard = ExerciseCard | KnowledgeCard | ProgressCardData;

export const motivationalQuotes = [
  "Every rep is a vote for the athlete you're becoming.",
  "Your graft is getting stronger while you sleep. Show up tomorrow.",
  "Consistency beats intensity. Always.",
  "The body heals. The mind needs convincing.",
  "3 weeks in. This is where it counts.",
  "Trust the process — your biology is working overtime.",
];
