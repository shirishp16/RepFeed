# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

RecoverFeed is a TikTok-style physical therapy rehab app built for a hackathon. Users swipe through full-screen exercise and knowledge cards, earn XP, and the app adapts to their preferences via a client-side preference vector. Exercises and knowledge cards are generated dynamically by a Python FastAPI backend powered by Claude.

## Project Structure

```
/frontend   — Next.js 16.2.1 app (React 19, TypeScript, Tailwind v4)
/backend    — Python FastAPI app (Anthropic SDK, Pydantic)
/Makefile   — Convenience commands to run both
```

## Commands

- `make frontend` — start Next.js dev server (port 3000)
- `make backend` — start FastAPI dev server (port 8000)
- `make install` — install deps for both frontend and backend
- `cd frontend && npm run build` — production build
- `cd frontend && npm run lint` — run ESLint
- No test framework is configured

## Architecture

### Frontend (`frontend/`)

**Stack:** Next.js 16.2.1 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Framer Motion

**Path alias:** `@/*` → `./src/*`

**Key flow:**
1. `src/app/page.tsx` is a client component that uses the `useFeed()` hook for all state
2. `src/hooks/useFeed.ts` manages feed state, fetches exercises/knowledge from the backend API, handles XP/level/streak, preference vector updates, and "Try It" mode
3. `src/components/FeedContainer.tsx` renders full-viewport snap-scrolling cards using Intersection Observer
4. Card types: `ExerciseCard`, `KnowledgeCard`, `ProgressCard` — interleaved by useFeed (2 exercises, then 1 knowledge card, progress card every ~7-8 cards)
5. `src/data/mockData.ts` holds TypeScript interfaces and motivational quotes only — no hardcoded exercise/knowledge data
6. User feedback (like/too easy/too hard) updates a preference vector: `{ upperBody, lowerBody, core, balance, intensity }`

**Environment:** `NEXT_PUBLIC_API_URL` in `.env.local` (defaults to `http://localhost:8000`)

### Backend (`backend/`)

**Stack:** Python, FastAPI, Anthropic SDK, Pydantic

**Endpoints:**
- `POST /api/feed` — generates 8 personalized exercises via Claude based on condition, phase, and preference vector
- `POST /api/knowledge` — generates 3 educational knowledge cards via Claude
- `GET /health` — health check

**Environment:** `ANTHROPIC_API_KEY` in `.env`

**Styling:** Dark theme via CSS custom properties in `globals.css` (no tailwind.config — uses Tailwind v4 `@theme` directive). Two fonts: Outfit (UI) and JetBrains Mono (labels). Accent color is orange (`#F97316`), active color is teal (`#2DD4BF`).

## Hydration Pitfalls

This is a client-rendered app but Next.js still SSRs it. Avoid `Math.random()`, `Date.now()`, or any non-deterministic value in the initial render. Use `useEffect` + `useState` to defer randomness to the client.
