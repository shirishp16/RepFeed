# RepFeed

**TikTok-style physical therapy. AI-generated. Camera-tracked. Endlessly adaptive.**

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## What is RepFeed?

RepFeed is a mobile-first rehabilitation app that delivers a personalized, infinite scroll feed of physical therapy exercises and educational content — built in the style of TikTok. Users swipe vertically through full-screen cards, earn XP, and watch the feed adapt in real time to their preferences and performance.

Every exercise and knowledge card is generated fresh by GPT-4o-mini, personalized to the user's injury condition (ACL, shoulder, back, etc.), recovery phase, and a continuously evolving preference vector tracked entirely client-side. There is no database, no authentication, and no pre-written content — everything is ephemeral and session-specific.

The standout feature is **TryIt Mode**: tap any trackable exercise and your front-facing camera activates. MediaPipe Pose tracks 33 body landmarks in real time, counts your reps by measuring joint angles, and scores your form as you move — providing live feedback on whether you're hitting the target range of motion.

---

## Features

### Onboarding
- Two-screen flow with smooth slide animations
- **Condition picker**: ACL / Knee Surgery, Rotator Cuff / Shoulder, Lower Back Pain, Ankle Sprain, Wrist / Carpal Tunnel, Other
- **Phase picker**: Early Recovery (wk 0–4), Building Strength (wk 4–12), Almost There (wk 12+)
- Condition + phase are sent to the backend to personalize all generated content

### AI-Generated Feed
- GPT-4o-mini generates **8 exercise cards + 3 knowledge cards** per session call
- Exercises are conditioned on injury type (knee patients only see leg exercises, shoulder patients only see upper body), recovery phase, and the user's current preference vector
- Knowledge cards cover anatomy, recovery science, nutrition, and mindset — all condition-specific
- Feed is interleaved: 2 exercises → 1 knowledge card → repeat, with a progress card every 7 cards

### Adaptive Preference Learning
- A 5-dimension **preference vector** (`upperBody`, `lowerBody`, `core`, `balance`, `intensity`) evolves throughout the session
- **Implicit signals**: viewing a card for >3s → `like`; <1s → `skip`
- **Explicit signals**: Like button, Too Easy, Too Hard
- **Completion signal**: finishing an exercise via TryIt awards the strongest update (+0.2 to the relevant dimension)
- Learning rate: `0.1` per interaction, clamped to [0, 1]

### Infinite Feed Recalibration
- Every 6 cards viewed, the backend is silently queried with the updated preference vector
- New exercises are appended to the feed tail — the feed never ends
- Already-completed exercises are passed to the backend to avoid repetition
- A subtle "Updating your feed..." toast appears during recalibration

### TryIt Mode — Real-Time Pose Tracking
- Tap **TRY IT** on any trackable exercise to open the full-screen camera overlay
- MediaPipe Pose (`@mediapipe/tasks-vision`) tracks 33 body landmarks at up to 30fps
- Reps are counted by measuring the angle between a 3-joint triplet (e.g. hip→knee→ankle for squats) and tracking transitions between rest and active positions
- Skeleton overlay drawn on canvas (CSS-mirrored to match the front camera)
- Falls back to a demo mode (auto-counting skeleton animation) if camera is denied
- Single-side exercises show a "Switch Side" button to track the other leg/arm

### Form Scoring
- Each rep is scored based on how close the peak angle reached the LLM-specified ideal range
- **Good form** (peak in ideal range): 90–100 pts
- **Acceptable form** (wider range): 65–80 pts
- **Needs work** (outside ranges): 40–55 pts
- Score displayed as a **running average** across all reps in the set
- **Live preview** updates during each rep as you move deeper — provides real-time "go deeper!" feedback

### Gamification
- **+2 XP** for every new card viewed
- **+XP** on exercise completion: `max(10, reps × (max(formScore, 50) / 100) × 10)`
- **Streak counter** increments with each completed exercise
- **Level** derived from total XP: `floor(xp / 100) + 1`
- Progress cards show session stats: exercises completed, total reps, average form score, XP earned

### Rehab Intelligence Panel
- Floating brain button (bottom-right) expands a radar chart visualization
- Five axes map to the preference vector: Quad Strength, Flexibility, Balance, Endurance, Pain Tolerance
- Dynamically generated insights (e.g. "Lower body focus detected", "Ready for higher intensity")
- Shows "Feed Adapting..." spinner after 5+ cards viewed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.1, React 19, TypeScript (strict) |
| **Styling** | Tailwind CSS v4 (`@theme inline`), Framer Motion |
| **Pose Detection** | MediaPipe Pose (`@mediapipe/tasks-vision`) — loaded from CDN |
| **Icons** | Lucide React |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI** | OpenAI GPT-4o-mini (configurable) |
| **State** | React hooks only (`useFeed.ts`) — no Redux, no Zustand |
| **Fonts** | Outfit (UI), JetBrains Mono (labels) |

---

## Architecture

```
Onboarding (condition + phase)
        │
        ▼
  useFeed.ts ──── POST /api/feed ────▶ FastAPI ──▶ GPT-4o-mini
      │  │         POST /api/knowledge ──▶ ↗              │
      │  │                                    8 exercises + 3 knowledge cards
      │  │
      │  └── Preference Vector (behavioralEngine.ts)
      │           ▲ updated by:
      │           │   implicit: time-on-card (skip / like)
      │           │   explicit: Like, Too Easy, Too Hard, Completed
      │
      └── TryIt Mode
               │
               ▼
         PoseCamera.tsx
               │
               ▼
         MediaPipe Pose (33 landmarks, GPU delegate, VIDEO mode)
               │
               ▼
         processFrame() — measures 3-joint angle
               │
               ├── Rep state machine: resting ↔ active → count++
               └── Form score: peak angle vs. LLM-specified ranges
```

**Key design decisions:**
- All state lives in `useFeed.ts` — a single React hook. No external state library.
- No database, no auth. Every session is ephemeral.
- The backend is stateless — it receives the full context (condition, phase, preferences, history) on every request.
- MediaPipe WASM and model files load from CDN at runtime (requires internet access).
- `NEXT_PUBLIC_API_URL` is baked at build time — changing `.env.local` requires a dev server restart.

---

## Project Structure

```
RepFeed/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           Main app (onboarding → feed)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css        Tailwind v4 @theme + animations
│   │   ├── components/
│   │   │   ├── OnboardingFlow.tsx  Condition + phase selection
│   │   │   ├── FeedContainer.tsx   Scroll-snap viewport + IntersectionObserver
│   │   │   ├── ExerciseCard.tsx    Full-height exercise card
│   │   │   ├── KnowledgeCard.tsx   Educational content card
│   │   │   ├── ProgressCard.tsx    Session stats + motivational quote
│   │   │   ├── CardActions.tsx     Like / Too Easy / Too Hard buttons
│   │   │   ├── TopBar.tsx          XP, streak, phase pill header
│   │   │   ├── TryItMode.tsx       Full-screen camera overlay
│   │   │   ├── PoseCamera.tsx      MediaPipe integration + skeleton drawing
│   │   │   ├── FormScoreRing.tsx   SVG ring (green/yellow/red)
│   │   │   ├── RepCounter.tsx      Animated rep count display
│   │   │   ├── RehabProfile.tsx    Radar chart + preference insights
│   │   │   ├── FeedRecalibrating.tsx  Neural-net animation overlay
│   │   │   └── SplashCursor.tsx    Canvas fluid cursor (onboarding)
│   │   ├── hooks/
│   │   │   └── useFeed.ts          All session state + API calls
│   │   ├── lib/
│   │   │   ├── behavioralEngine.ts Preference vector update logic
│   │   │   └── poseDetection.ts    MediaPipe + angle measurement + rep state machine
│   │   └── data/
│   │       └── mockData.ts         TypeScript interfaces + motivational quotes
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.local                  NEXT_PUBLIC_API_URL
│
├── backend/
│   ├── main.py                     FastAPI app (/api/feed, /api/knowledge, /health)
│   ├── models.py                   Pydantic request/response models
│   ├── requirements.txt
│   └── .env                        OPENAI_API_KEY, OPENAI_MODEL
│
└── Makefile                        Dev commands
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Install

```bash
git clone https://github.com/shirishp16/RepFeed.git
cd RepFeed
make install
```

`make install` runs `npm install` in the frontend and sets up a Python venv with all backend dependencies.

### Environment Setup

**Backend** — create `backend/.env`:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini    # switch to gpt-4o for higher quality at higher cost
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run

```bash
# Terminal 1 — backend
make backend     # FastAPI on http://localhost:8000

# Terminal 2 — frontend
make frontend    # Next.js on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) on a mobile device or with mobile emulation in DevTools for the best experience.

---

## How Pose Detection Works

When TryIt Mode is activated, the backend has already provided a `detection` object alongside each exercise:

```json
{
  "primary_joints": ["hip", "knee", "ankle"],
  "side": "both",
  "rest_angle": 175,
  "active_angle": 80,
  "form_good_range": [65, 95],
  "form_ok_range": [95, 130]
}
```

The frontend measures the angle formed by those three joints (with the **middle joint as the vertex**) using MediaPipe landmark coordinates:

| Angle at | Joint triplet | Rest (straight) | Active (bent) |
|----------|--------------|-----------------|---------------|
| Knee | `hip → knee → ankle` | ~175° | ~80° (squat) |
| Elbow | `shoulder → elbow → wrist` | ~165° | ~40° (curl) |
| Hip | `shoulder → hip → knee` | ~175° | ~100° (leg raise) |

**Rep counting** uses a progress-based state machine:
- `progress = |angle - rest_angle| / |rest_angle - active_angle|`
- `progress < 0.3` → **resting** state
- `progress > 0.6` → **active** state
- `resting → active → resting` = **1 completed rep** (600ms cooldown between reps)

**Form scoring** checks where the peak angle reached during the rep falls relative to the LLM-specified ranges, then maintains a running average across all reps in the set.

---

## How the Behavioral Engine Works

The preference vector is a 5-float object representing the user's current profile:

```typescript
{
  upperBody: 0.5,   // affinity for upper body exercises
  lowerBody: 0.7,   // affinity for lower body exercises
  core: 0.5,        // affinity for core exercises
  balance: 0.4,     // affinity for balance/stability exercises
  intensity: 0.5,   // preferred intensity level
}
```

It updates on every interaction with a **learning rate of 0.1**, clamped to [0, 1]:

| Signal | Trigger | Effect |
|--------|---------|--------|
| `like` | Like button / viewed >3s | +0.1 to exercise's target dimension |
| `skip` | Viewed <1s | −0.05 to exercise's target dimension |
| `too_easy` | Too Easy button | +0.1 to `intensity` |
| `too_hard` | Too Hard button | −0.1 to `intensity` |
| `completed` | TryIt finished | +0.2 to target dimension; +0.05 intensity if formScore >80 |

The updated vector is sent to `/api/feed` on every recalibration, causing GPT-4o-mini to shift the exercise mix accordingly.

---

## API Reference

### `POST /api/feed`

Generates 8 personalized exercise cards.

**Request:**
```json
{
  "condition": "ACL / Knee Surgery",
  "phase": "Building Strength",
  "preferences": {
    "upperBody": 0.3,
    "lowerBody": 0.8,
    "core": 0.5,
    "balance": 0.4,
    "intensity": 0.6
  },
  "completedExercises": ["Standing Squats", "Wall Sits"]
}
```

**Response:**
```json
{
  "exercises": [
    {
      "id": "ex_001",
      "name": "Bulgarian Split Squat",
      "targetArea": "Quadriceps",
      "difficulty": 6,
      "description": "Stand 2 feet in front of a chair...",
      "whyItHelps": "Strengthens the quad without overloading the graft...",
      "reps": "3 sets of 10 each leg",
      "xpReward": 35,
      "muscleGroups": ["Quadriceps", "Glutes", "Hamstrings"],
      "safetyNote": "Keep your front knee behind your toes.",
      "canTryIt": true,
      "detection": {
        "primary_joints": ["hip", "knee", "ankle"],
        "side": "left",
        "rest_angle": 175,
        "active_angle": 85,
        "form_good_range": [70, 100],
        "form_ok_range": [100, 130]
      }
    }
  ]
}
```

### `POST /api/knowledge`

Generates 3 educational knowledge cards.

**Request:**
```json
{
  "condition": "ACL / Knee Surgery",
  "phase": "Building Strength"
}
```

**Response:**
```json
{
  "cards": [
    {
      "id": "kb_001",
      "title": "Why your quad shuts off after ACL surgery",
      "content": "Arthrogenic muscle inhibition (AMI) is a reflex response...",
      "category": "anatomy"
    }
  ]
}
```

### `GET /health`

Returns `{"status": "ok"}`. Use to verify the backend is running.

---

## Design System

Defined in `frontend/src/app/globals.css` via Tailwind v4 `@theme inline`. No `tailwind.config.js` exists — use CSS variable tokens directly.

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#F97316` | XP, highlights, primary actions |
| `--active` | `#2DD4BF` | TryIt mode, active states, teal glow |
| `--bg` | `#060606` | Page background |
| `--bg-card` | `#0e0e0e` | Card backgrounds |
| `--bg-elevated` | `#171717` | Panels, drawers |
| `--text-primary` | `#F1F1F1` | Body text |
| `--text-secondary` | `#7A7A7A` | Subtitles, labels |
| `--success` | `#22C55E` | Form score ring (good) |
| `--warning` | `#EAB308` | Form score ring (ok) |
| `--danger` | `#EF4444` | Form score ring (poor) |

**Fonts:** `Outfit` (all UI text) and `JetBrains Mono` (data labels, counters, mono readouts). Loaded via Google Fonts `@import` in `globals.css`.

---

## Commands

```bash
make install     # Install all frontend + backend dependencies
make frontend    # Start Next.js dev server on :3000
make backend     # Start FastAPI with hot reload on :8000

# Frontend only
cd frontend && npm run build    # Production build + TypeScript check
cd frontend && npm run lint     # ESLint
cd frontend && npm run dev      # Dev server

# Backend only
cd backend && uvicorn main:app --reload --port 8000
```

> No test framework is configured. Use `npm run build` to verify TypeScript — zero errors means passing.
