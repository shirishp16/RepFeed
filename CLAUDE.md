# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

RecoverFeed is a TikTok-style physical therapy rehab app built for a hackathon. Users swipe through full-screen exercise and knowledge cards, earn XP, and the app adapts to their preferences via a client-side preference vector. All data is mock/client-side — no backend.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- No test framework is configured

## Architecture

**Stack:** Next.js 16.2.1 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Framer Motion

**Path alias:** `@/*` → `./src/*`

**Key flow:**
1. `src/app/page.tsx` is a client component that uses the `useFeed()` hook for all state
2. `src/hooks/useFeed.ts` manages feed generation, XP/level/streak, preference vector updates, and "Try It" mode
3. `src/components/FeedContainer.tsx` renders full-viewport snap-scrolling cards using Intersection Observer
4. Card types: `ExerciseCard`, `KnowledgeCard`, `ProgressCard` — interleaved by useFeed (2 exercises, then 1 knowledge card, progress card every ~7-8 cards)
5. `src/data/mockData.ts` holds all exercise/knowledge data and user stats
6. User feedback (like/too easy/too hard) updates a preference vector: `{ upperBody, lowerBody, core, balance, intensity }`

**Styling:** Dark theme via CSS custom properties in `globals.css` (no tailwind.config — uses Tailwind v4 `@theme` directive). Two fonts: Outfit (UI) and JetBrains Mono (labels). Accent color is orange (`#F97316`), active color is teal (`#2DD4BF`).

## Hydration Pitfalls

This is a client-rendered app but Next.js still SSRs it. Avoid `Math.random()`, `Date.now()`, or any non-deterministic value in the initial render. Use `useEffect` + `useState` to defer randomness to the client.
