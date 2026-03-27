# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Project Overview

**RecoverFeed** is a TikTok-style physical therapy rehabilitation app built for a hackathon. Users swipe vertically through full-screen exercise and educational cards, earn XP, and the feed dynamically adapts to their preferences via a client-side behavioral engine. All exercise and knowledge content is generated in real-time by a Python FastAPI backend calling the OpenAI API (GPT-4o-mini), personalized to the user's injury condition, recovery phase, and evolving preference vector.

There is no database and no authentication. Everything is ephemeral per session. The app is optimized for mobile viewport.

---

## Repository Structure

```
/
├── frontend/          — Next.js 16.2.1 app (React 19, TypeScript, Tailwind v4)
│   ├── src/
│   │   ├── app/           — Next.js App Router pages and global CSS
│   │   ├── components/    — All UI components (14 total)
│   │   ├── data/          — TypeScript interfaces + motivational quotes
│   │   ├── hooks/         — useFeed hook (all state management)
│   │   └── lib/           — Behavioral engine + MediaPipe pose detection
│   ├── public/            — Static assets (SVGs)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.local         — NEXT_PUBLIC_API_URL=http://localhost:8000
│
├── backend/           — Python FastAPI app
│   ├── main.py            — FastAPI app with /api/feed and /api/knowledge
│   ├── models.py          — Pydantic request models
│   ├── requirements.txt   — fastapi, uvicorn, openai, python-dotenv
│   └── .env               — OPENAI_API_KEY, OPENAI_MODEL=gpt-4o-mini
│
├── Makefile           — Commands to run both services
├── .gitignore
└── CLAUDE.md          — This file
```

---

## Commands

```bash
make frontend       # Start Next.js dev server on port 3000
make backend        # Start FastAPI server on port 8000 (hot reload)
make install        # npm install (frontend) + pip3 install (backend)

# Frontend only
cd frontend && npm run build    # Production build + TypeScript check
cd frontend && npm run lint     # ESLint
cd frontend && npm run dev      # Dev server

# Backend only
cd backend && uvicorn main:app --reload --port 8000
```

No test framework is configured. Verify frontend with `npm run build` (zero TS errors = passing).

---

## Frontend Architecture

### Stack
- **Next.js 16.2.1** (App Router), **React 19**, **TypeScript** (strict mode)
- **Tailwind CSS v4** (`@theme inline` directive — no `tailwind.config.js`)
- **Framer Motion** for all animations
- **@mediapipe/tasks-vision** for real-time pose detection in TryIt mode
- **lucide-react** for icons
- Path alias: `@/*` → `frontend/src/*`

### App Flow

```
page.tsx
  └── useFeed() hook          ← all state lives here
       ├── OnboardingFlow      ← shown first, sets condition + phase
       ├── TopBar              ← fixed header (XP, streak, phase pill)
       ├── FeedContainer       ← scroll-snap viewport
       │    ├── ExerciseCard   ← with CardActions (like/easy/hard) + TRY IT button
       │    ├── KnowledgeCard
       │    └── ProgressCard   ← stats + motivational quote
       ├── TryItMode overlay   ← full-screen pose camera
       ├── RehabProfile panel  ← brain button, radar chart, insights
       ├── FeedRecalibrating   ← neural-net animation overlay
       └── Error/Loading UI
```

### `useFeed.ts` — The Core Hook

Located at `frontend/src/hooks/useFeed.ts`. This is the single source of truth for all app state.

**State it manages:**
- `cards: FeedCard[]` — the assembled feed (exercises + knowledge + progress cards interleaved)
- `currentIndex` — which card the user is looking at
- `preferenceVector` — `{ upperBody, lowerBody, core, balance, intensity }` floats 0–1
- `xp`, `level` (derived: `floor(xp/100)+1`), `streak`
- `exercisesCompleted`, `totalReps`, `avgFormScore`
- `exerciseHistory: string[]` — names of completed exercises (sent to backend to avoid repeats)
- `feedLoading`, `recalibToast`, `error`, `condition`, `phase`
- `tryItActive`, `tryItExercise` — TryIt overlay state
- `showRecalibrating` — full-screen recalibrating animation

**Key functions:**
- `startSession(condition, phase)` — called by OnboardingFlow; fetches `/api/feed` and `/api/knowledge` in parallel, builds the initial feed
- `onCardVisible(index)` — called by FeedContainer's IntersectionObserver; handles time-on-card signals, XP for new cards (+2 each), and triggers recalibration
- `recalibrateIfNeeded(index)` — fires when `index % 6 === 0`; silently fetches 8 new exercises and appends them to the feed tail
- `onLike / onTooEasy / onTooHard` — explicit feedback signals that update preferenceVector
- `onCompleteTryIt` — called after a TryIt session; awards +50 XP, updates exerciseHistory, updates preferenceVector

**Feed interleaving pattern** (`buildFeedFromArrays`):
```
[Exercise, Exercise, Knowledge, Exercise, Exercise, Knowledge, Progress, ...]
```
Progress cards are injected every 7 cards. Uses a `progressOffset` ref to give unique IDs across recalibration cycles.

**Recalibration cycle:**
- Every 6 cards viewed, `fetchExercises()` is called with the updated preference vector and `exerciseHistory` (to avoid repeats)
- New cards are appended to the end of `cards` array — the feed is effectively infinite
- A "Updating your feed..." toast shows while fetching

**Time-on-card implicit signals:**
- Viewed < 1 second → `'skip'` signal
- Viewed > 3 seconds → `'like'` signal

### `behavioralEngine.ts` — Preference Learning

Located at `frontend/src/lib/behavioralEngine.ts`.

Maintains a 5-dimension preference vector. Learning rate is `0.1` (clamped 0–1).

**Signal effects:**
| Signal | Effect |
|--------|--------|
| `like` / `tried_it` | +0.1 to the exercise's area dimension |
| `skip` | -0.05 to the exercise's area dimension |
| `too_easy` | +0.1 to `intensity` |
| `too_hard` | -0.1 to `intensity` |
| `completed` | +0.2 to the exercise's area dimension; if formScore > 80, +0.05 to `intensity` |

**Area mapping** (exercise `targetArea` → preference dimension):
- Quadriceps, Hamstrings, Calves, Hip Abductors, etc. → `lowerBody`
- Proprioception → `balance`
- Plyometric Power → `intensity`
- Core → `core`
- Everything else defaults to `lowerBody`

### Feed Cards — TypeScript Interfaces

Defined in `frontend/src/data/mockData.ts`. **No hardcoded exercise or knowledge data exists** — this file is interfaces + `motivationalQuotes[]` only.

```typescript
interface ExerciseCard {
  id: string; type: 'exercise';
  name: string; targetArea: string; difficulty: number; // 1-10
  description: string; whyItHelps: string;
  reps?: number; duration?: string; xpReward: number;
  muscleGroups: string[]; safetyNote?: string;
  canTryIt: boolean;
  exerciseType?: 'squat' | 'calf_raise' | 'wall_sit' | 'hamstring_curl';
}

interface KnowledgeCard {
  id: string; type: 'knowledge';
  title: string; content: string;
  category: 'anatomy' | 'recovery' | 'nutrition' | 'mindset';
}

interface ProgressCardData { id: string; type: 'progress'; }

type FeedCard = ExerciseCard | KnowledgeCard | ProgressCardData;
```

**Important:** The API returns `reps` as a string (e.g. `"3 sets of 12"`). `useFeed.ts` maps this to the `duration` field in `ExerciseCard` since the interface expects `reps` as `number`.

### Component Reference

| Component | Purpose |
|-----------|---------|
| `OnboardingFlow.tsx` | 3-screen flow: condition select → phase select → body-scan animation. Passes `{condition, phase}` to `page.tsx` via `onComplete` callback. Conditions: ACL, Shoulder, Back, Ankle, Wrist, Other. Phases: Early Recovery (wk 0-4), Building Strength (wk 4-12), Almost There (wk 12+). |
| `FeedContainer.tsx` | Full-viewport scroll-snap container. Uses IntersectionObserver (threshold 0.6) to detect the active card. Scrolls to top on mount. `ready` state gates the observer setup. |
| `ExerciseCard.tsx` | Full-height exercise card with difficulty badge, muscle groups, safety note, and "TRY IT" button (only shown when `canTryIt: true`). |
| `KnowledgeCard.tsx` | Editorial content card with category pill (anatomy/recovery/nutrition/mindset). |
| `ProgressCard.tsx` | Stats grid (XP, streak, exercises, avg form score) + random motivational quote from `mockData.ts`. |
| `CardActions.tsx` | Floating right-side buttons: heart (like), chevron-up (too easy), chevron-down (too hard). |
| `TopBar.tsx` | Fixed 52px header with logo, phase pill (hidden on mobile), XP counter (animates on change), streak counter. |
| `TryItMode.tsx` | Full-screen overlay that activates `PoseCamera` for the selected exercise. |
| `PoseCamera.tsx` | MediaPipe PoseLandmarker integration. Draws skeleton on canvas, tracks reps, calculates form score. Handles leg calibration for single-leg exercises. |
| `FormScoreRing.tsx` | SVG ring showing form score 0–100. Green ≥80, yellow ≥60, red <60. |
| `RepCounter.tsx` | Animated rep count display with spring animation. |
| `RehabProfile.tsx` | Floating brain button (bottom-right). Expands into a panel with SVG pentagon radar chart mapping the 5 preference dimensions. Insights are computed dynamically from the preference vector. Shows "Feed Adapting..." spinner after 5 cards viewed. |
| `FeedRecalibrating.tsx` | Full-screen neural-net animation overlay (currently wired to `showRecalibrating` which is not actively triggered — placeholder). |
| `SplashCursor.tsx` | Canvas-based fluid cursor effect shown during onboarding. |

### Pose Detection (`poseDetection.ts`)

Uses `@mediapipe/tasks-vision` PoseLandmarker (loaded from CDN). Supports these `exerciseType` values:
- `squat` — tracks knee angle, counts reps on up/down transitions
- `wall_sit` — tracks knee angle for hold duration
- `calf_raise` — tracks ankle/heel elevation
- `hamstring_curl` — tracks knee flexion on the active leg
- `single_leg_balance` — balance hold timer
- `single_leg_rdl` — single-leg Romanian deadlift

Form scoring thresholds are exercise-specific. The `ActiveLeg` type (`'left' | 'right' | 'both'`) gates which MediaPipe landmarks are used.

### Design System

Defined in `frontend/src/app/globals.css` using Tailwind v4 `@theme inline`.

**Color tokens:**
| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#F97316` (orange) | Primary actions, XP, highlights |
| `--active` | `#2DD4BF` (teal) | TryIt mode, active state |
| `--bg` | `#060606` | Page background |
| `--bg-card` | `#0e0e0e` | Card background |
| `--bg-elevated` | `#171717` | Elevated panels |
| `--text-primary` | `#F1F1F1` | Body text |
| `--text-secondary` | `#7A7A7A` | Subtitles |
| `--success` | `#22C55E` | Form score ring (good) |
| `--warning` | `#EAB308` | Form score ring (ok) |
| `--danger` | `#EF4444` | Form score ring (bad) |

**Fonts:** `Outfit` (UI text) and `JetBrains Mono` (labels, mono data). Loaded via `@import url()` from Google Fonts — **not** via `next/font`.

**Onboarding** uses a separate visual system: dark mesh gradient background with floating teal/purple/blue orbs and a `SplashCursor` fluid effect. These styles are defined in `globals.css` under `.mesh-gradient`, `.orb`, `body-scan-dot`, etc.

---

## Backend Architecture

### Stack
- **Python**, **FastAPI**, **OpenAI Python SDK**, **Pydantic v2**, **python-dotenv**
- Runs on port 8000

### Environment Variables (`backend/.env`)
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
`OPENAI_MODEL` defaults to `gpt-4o-mini` if not set. Change to `gpt-4o` for higher quality at higher cost.

### Endpoints

**`POST /api/feed`**

Request body (from `FeedRequest` Pydantic model):
```json
{
  "condition": "ACL",
  "phase": "Building Strength",
  "preferences": {
    "upperBody": 0.5, "lowerBody": 0.7,
    "core": 0.5, "balance": 0.4, "intensity": 0.5
  },
  "completedExercises": ["Standing Calf Raises", "Wall Sits"]
}
```

Response:
```json
{ "exercises": [ ...8 ExerciseCard objects... ] }
```

The prompt instructs GPT-4o-mini to:
- Generate 8 **standing** exercises (no floor work, no equipment)
- Tailor difficulty and focus to the condition/phase and preference weights
- Avoid exercises listed in `completedExercises`
- Return a JSON array with exact field names matching the `ExerciseCard` interface
- `canTryIt: true` only for squats, calf raises, wall sits, or hamstring curls
- `exerciseType` must be one of the 4 supported types or `null`

**`POST /api/knowledge`**

Request body:
```json
{ "condition": "ACL", "phase": "Building Strength" }
```

Response:
```json
{ "cards": [ ...3 KnowledgeCard objects... ] }
```

Instructs GPT-4o-mini to generate 3 educational cards mixing categories (anatomy, recovery, nutrition, mindset), specific and evidence-based for the given condition/phase.

**`GET /health`** — Returns `{"status": "ok"}`.

### JSON Parsing

Both endpoints use a `parse_json_response()` helper that strips markdown code fences (` ```json `) before `json.loads()`, since LLMs sometimes wrap JSON in fences despite instructions not to.

### CORS

Configured to allow `http://localhost:3000` only. Update `allow_origins` in `main.py` if deploying to a different domain.

---

## Hydration Rules

This is a `'use client'` app but Next.js still SSRs the initial render. Rules:
- **Never** use `Math.random()`, `Date.now()`, or any non-deterministic value in `useState` initializers or top-level render code
- Defer any randomness to `useEffect` (e.g., `ProgressCard` picks a random quote in `useEffect`, not in `useState`)
- All initial state must be deterministic to avoid hydration mismatches

---

## Known Gotchas

1. **API `reps` field mismatch** — The backend returns `reps` as a string (e.g. `"3 sets of 12"`), but `ExerciseCard.reps` is typed as `number`. `useFeed.ts` remaps `raw.reps → duration` to work around this.

2. **`FeedContainer` scroll position** — The feed must start at card 0 on mount. `FeedContainer` uses a 50ms delay before setting up the IntersectionObserver and a `ready` state gate to prevent false positives during the scroll-to-top.

3. **Tailwind v4 has no `tailwind.config.js`** — All theme tokens are in `globals.css` via `@theme inline`. Do not create a config file; use CSS variable tokens instead.

4. **MediaPipe loads from CDN** — `PoseCamera.tsx` loads the WASM/model files from `https://cdn.jsdelivr.net/...`. This requires internet access and will fail in offline environments.

5. **`NEXT_PUBLIC_API_URL` is baked at build time** — Changing `.env.local` requires a dev server restart. The value defaults to `http://localhost:8000` if the variable is absent.

6. **Recalibration deduplication** — `lastRecalibIndexRef` and `isFetchingRef` prevent double-fetches. Do not remove these guards.
