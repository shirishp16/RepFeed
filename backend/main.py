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
  - primary_joints: array of exactly 3 strings naming body points that form the angle being measured. Options: "shoulder", "elbow", "wrist", "hip", "knee", "ankle", "heel", "foot". Examples: ["hip", "knee", "ankle"] for squats/lunges (knee bend), ["knee", "ankle", "heel"] for calf raises (ankle plantarflexion), ["shoulder", "elbow", "wrist"] for bicep curls.
  - side: one of "left", "right", "both". Use "both" for squats/lunges, "left" or "right" for single-leg exercises.
  - rest_angle: number — approximate angle (degrees) when standing/resting (the starting position). Example: 170 for a straight leg.
  - active_angle: number — approximate angle at the peak of the exercise movement. Example: 90 for a deep squat.
  - form_good_range: [number, number] — [min, max] angle range at the peak that indicates good form. Example: [80, 100] for squats.
  - form_ok_range: [number, number] — [min, max] wider range that indicates acceptable but not great form. Example: [100, 130] for squats.

A rep counts when the angle travels from near rest_angle to near active_angle and back.
Make the ranges GENEROUS. A rep should count even if the user only gets 70% of the way to the active_angle. For example, if active_angle is 90, count a rep if they reach 120.

At least 4-5 of the 8 exercises should have canTryIt: true with detection."""

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
