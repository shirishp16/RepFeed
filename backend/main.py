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

IMPORTANT — How angle measurement works in our app:

We use MediaPipe Pose which tracks 33 body landmarks. We measure angles between THREE joints where the MIDDLE joint is the vertex of the angle.

How angles work:
- A completely straight limb = approximately 170-180 degrees
- A fully bent limb = approximately 30-60 degrees
- The angle ALWAYS measures the interior angle at the middle joint

Specific examples:
- Joint triplet ["hip", "knee", "ankle"] measures the angle AT THE KNEE:
  - Standing straight with legs straight: ~170-180°
  - Deep squat (knees fully bent): ~50-70°
  - Hamstring curl (foot kicked back toward glute while standing): knee angle goes from ~170° (straight) down to ~40-60° (fully curled)

- Joint triplet ["shoulder", "elbow", "wrist"] measures the angle AT THE ELBOW:
  - Arm fully extended straight: ~160-180°
  - Arm fully bent (bicep curl peak): ~30-50°
  - Wall push-up (arms bending): goes from ~160° (arms straight) down to ~70-90° (arms bent against wall)

- Joint triplet ["shoulder", "hip", "knee"] measures the angle AT THE HIP:
  - Standing straight: ~170-180°
  - Leg raised forward (hip flexion): ~90-120°

Key rules for setting thresholds:
- rest_angle is ALWAYS the angle when the person is standing still doing nothing. For legs this is ~170-180. For straight arms this is ~160-180.
- active_angle is ALWAYS the angle at the PEAK of the exercise movement. This is always LESS than rest_angle for most exercises (because joints bend = angle decreases).
- form_good_range should be centered around the ideal active_angle with ±15 degrees tolerance
- form_ok_range should be wider, ±30 degrees tolerance
- ALWAYS make ranges generous. It is better to count a rep that wasn't perfect than to miss a rep that was.

DO NOT set rest_angle lower than active_angle unless the exercise specifically involves extending/straightening from a bent position. For 95% of exercises, rest_angle > active_angle because you start straight and bend.

Here are example detection objects for common exercises:

Standing Hamstring Curl (bending knee behind body):
{{"primary_joints": ["hip", "knee", "ankle"], "side": "single", "rest_angle": 175, "active_angle": 60, "form_good_range": [45, 75], "form_ok_range": [75, 110]}}

Bodyweight Squat (both legs bending together):
{{"primary_joints": ["hip", "knee", "ankle"], "side": "both", "rest_angle": 175, "active_angle": 80, "form_good_range": [65, 95], "form_ok_range": [95, 130]}}

Wall Push-Up (arms bending against wall):
{{"primary_joints": ["shoulder", "elbow", "wrist"], "side": "both", "rest_angle": 165, "active_angle": 80, "form_good_range": [65, 95], "form_ok_range": [95, 130]}}

Standing Calf Raise (rising on toes):
{{"primary_joints": ["hip", "knee", "ankle"], "side": "both", "rest_angle": 175, "active_angle": 155, "form_good_range": [145, 160], "form_ok_range": [135, 170]}}

CRITICAL: ALL exercises MUST be specifically for rehabilitating the user's condition: {req.condition}

- If the condition involves the KNEE or LEG (ACL, knee surgery, ankle sprain):
  ALL exercises must target lower body. Do NOT include any arm or shoulder exercises.
  Use joint triplet ["hip", "knee", "ankle"] for all canTryIt exercises.

- If the condition involves the SHOULDER or ARM (rotator cuff, wrist, carpal tunnel):
  ALL exercises must target upper body. Do NOT include any leg exercises.
  Use joint triplet ["shoulder", "elbow", "wrist"] for all canTryIt exercises.

- If the condition involves the BACK (lower back pain):
  Include a mix of standing core stability and hip hinge exercises.
  Use joint triplet ["shoulder", "hip", "knee"] for hip hinge exercises.

Do NOT mix body regions. A knee rehab patient should NEVER see bicep curls. A shoulder rehab patient should NEVER see squats.

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
  - primary_joints: array of exactly 3 strings naming body points that form the angle being measured. Options: "shoulder", "elbow", "wrist", "hip", "knee", "ankle", "heel", "foot".
  - side: one of "left", "right", "both". Use "both" for bilateral exercises, "left" or "right" for single-side exercises.
  - rest_angle: number — angle when standing still (see examples above).
  - active_angle: number — angle at peak of movement (see examples above).
  - form_good_range: [number, number] — tight range around ideal active angle.
  - form_ok_range: [number, number] — wider acceptable range.

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
