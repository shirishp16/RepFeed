export async function POST(request: Request) {
  const { condition, recentExercises } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 },
    );
  }

  const prompt = `You are a licensed physical therapist educator. Generate 3 short educational cards for a patient recovering from:

Condition: ${condition}
Recent exercises: ${(recentExercises ?? []).join(', ')}

Return ONLY a JSON array of 3 objects. No markdown, no backticks, no preamble. Each object must have:
{
  "title": "Card Title",
  "content": "2-4 sentences of educational content relevant to their condition and recent exercises",
  "category": "anatomy" | "recovery" | "nutrition" | "mindset"
}

Make content specific to their condition. Reference their recent exercises where relevant. Mix categories.`;

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

    const cards = JSON.parse(text.replace(/```json|```/g, '').trim());
    return Response.json({ cards });
  } catch {
    return Response.json(
      { error: 'Failed to generate knowledge cards' },
      { status: 500 },
    );
  }
}
