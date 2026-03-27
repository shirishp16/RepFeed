import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, APIError

from models import FeedRequest, KnowledgeRequest

load_dotenv()

app = FastAPI(title="RecoverFeed API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
client = OpenAI()


def parse_json_response(text: str) -> list | dict:
    """Strip markdown fences and parse JSON from LLM output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:]  # drop opening ```json or ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)
    return json.loads(cleaned)


@app.post("/api/feed")
async def generate_feed(req: FeedRequest):
    prefs = req.preferences
    completed = ", ".join(req.completedExercises) if req.completedExercises else "none"

    system_prompt = (
        "You are a licensed physical therapist generating a personalized exercise feed. "
        "Return ONLY valid JSON, no markdown, no explanation."
    )

    user_prompt = f"""Generate 8 exercise cards for a patient recovering from {req.condition} in the {req.phase} phase.
Their preferences (0-1 scale): upperBody={prefs.upperBody}, lowerBody={prefs.lowerBody}, core={prefs.core}, balance={prefs.balance}, intensity={prefs.intensity}.
Avoid repeating these already completed exercises: {completed}.

Return a JSON array of 8 objects. Every exercise must be standing (no floor work, no equipment).
Each object must have exactly these fields:
- id: unique string (e.g. "ex_001")
- name: string
- targetArea: string (e.g. "Quadriceps")
- difficulty: number 1-10
- description: string (1-2 sentences, what to do)
- whyItHelps: string (1-2 sentences, specific to their condition)
- reps: string (e.g. "3 sets of 12" or "Hold 30 seconds")
- xpReward: number (10-50 based on difficulty)
- muscleGroups: string[]
- safetyNote: string (one short safety tip)
- canTryIt: boolean (true if the exercise involves a clear repetitive motion that a front-facing camera can track — squats, curls, raises, lunges, knee flexion, hip hinges, etc. Set false for isometric holds, balance exercises, or movements that are hard to track from the front.)
- detection: object or null. Required when canTryIt is true. When canTryIt is false, set to null. The detection object tells the app how to count reps via camera pose tracking. Fields:
  - joint_triplet: array of exactly 3 strings naming body points that form the angle being measured. Options: "shoulder", "elbow", "wrist", "hip", "knee", "ankle", "heel", "foot". Examples: ["hip", "knee", "ankle"] for squats/lunges (knee bend), ["knee", "ankle", "heel"] for calf raises (ankle plantarflexion), ["shoulder", "elbow", "wrist"] for bicep curls.
  - side: one of "single_leg", "both_legs", "single_arm". Use "both_legs" for squats/lunges, "single_leg" for single-leg curls/raises.
  - start_angle_min: number — minimum angle (degrees) at the resting/start position. Example: 155 for standing straight.
  - start_angle_max: number — maximum angle at rest. Example: 180.
  - end_angle_min: number — minimum angle at the peak of the movement. Example: 60 for a deep squat.
  - end_angle_max: number — maximum angle at the peak. Example: 130 for a shallow squat.
  - rep_direction: "high_to_low" if the angle decreases during the exercise (squats, knee flexion), "low_to_high" if it increases.
  - form_checks: array of objects, each with: "check" (string, one of: "upper_body_upright", "knees_over_toes", "back_straight", "knee_straight", "hip_stable"), "description" (string, short tip for the user), "penalty" (number, points deducted from 100 for bad form, typically 10-20). Use "upper_body_upright" for squats/lunges, "knees_over_toes" for squats, "back_straight" for hinges, "knee_straight" for straight-leg exercises like calf raises, "hip_stable" for single-leg exercises.

IMPORTANT: Use WIDE, GENEROUS angle ranges so reps are easy to count. A rep should register even if the user only KIND OF completes the movement. For example, a standing knee flexion: start 155-180, end 60-130 (not a strict 90 target). At least 4-5 of the 8 exercises should have canTryIt: true with detection."""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=4096,
        )
        text = response.choices[0].message.content or ""
        exercises = parse_json_response(text)
        return {"exercises": exercises}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")


@app.post("/api/knowledge")
async def generate_knowledge(req: KnowledgeRequest):
    system_prompt = (
        "You are a licensed physical therapist educator. "
        "Return ONLY valid JSON, no markdown, no explanation."
    )

    user_prompt = f"""Generate 3 educational knowledge cards for a patient recovering from {req.condition} in the {req.phase} phase.

Return a JSON array of 3 objects. Each object must have exactly these fields:
- id: unique string (e.g. "kb_001")
- title: string (engaging, specific to their condition, e.g. "Why your quad shuts off after ACL surgery")
- content: string (2-4 sentences of educational content relevant to their condition and recovery phase)
- category: one of "anatomy" | "recovery" | "nutrition" | "mindset"

Mix categories. Make content specific and evidence-based."""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
        )
        text = response.choices[0].message.content or ""
        cards = parse_json_response(text)
        return {"cards": cards}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")


@app.get("/health")
async def health():
    return {"status": "ok"}
