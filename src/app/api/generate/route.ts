export async function POST(request: Request) {
  const { condition, phase, preferences, recentExercises } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 },
    );
  }

  const prompt = `You are a licensed physical therapist AI. Generate 5 rehabilitation exercises for a patient with the following profile:

Condition: ${condition}
Recovery Phase: ${phase}
Preferences: Likes ${(preferences?.likes ?? []).join(', ')}. Dislikes ${(preferences?.dislikes ?? []).join(', ')}.
Recently completed: ${(recentExercises ?? []).join(', ')}

Return ONLY a JSON array of 5 exercise objects. No markdown, no backticks, no preamble. Each object must have:
{
  "name": "Exercise Name",
  "targetArea": "QUADRICEPS" | "HAMSTRINGS" | "CALVES" | "CORE" | "BALANCE" | "HIP",
  "difficulty": 1-10,
  "description": "2-3 sentences explaining the movement",
  "whyItHelps": "1-2 sentences connecting to their specific condition",
  "reps": "3 × 12 reps" or "Hold 30s × 3",
  "xpReward": 15-50,
  "muscleGroups": ["muscle1", "muscle2"],
  "canTryIt": true/false,
  "exerciseType": "squat" | "wall_sit" | "calf_raise" | "leg_raise" | null,
  "safetyNote": "optional safety warning" | null
}

Make exercises progressively harder. Vary between strength, mobility, and balance. Only set canTryIt: true and exerciseType for exercises that involve visible leg/body movements trackable by a camera (squats, wall sits, calf raises, leg raises). Do NOT set canTryIt for exercises requiring equipment or floor work.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '';

    const exercises = JSON.parse(text.replace(/```json|```/g, '').trim());
    return Response.json({ exercises });
  } catch {
    return Response.json(
      { error: 'Failed to generate exercises' },
      { status: 500 },
    );
  }
}
