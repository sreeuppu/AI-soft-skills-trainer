import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `
      You are an elite Executive Leadership Coach. 
      
      USER PROFILE:
      - Role: ${profile.role}
      - Level: ${profile.level}
      - Industry: ${profile.industry}

      SCENARIO:
      ${scenario.headline} (${scenario.context})

      TASK:
      Evaluate the user's leadership response. 
      - If the user is ${profile.level} level, be ${profile.level === 'Executive' ? 'extremely rigorous' : 'constructive but firm'}.
      - Focus on: Framework Clarity, Ruthlessness, and Ownership.

      Return ONLY a JSON object with this structure:
      {
        "scores": { "Clarity": 0, "Ruthlessness": 0, "Ownership": 0 },
        "feedback": "2-3 sentences of direct coaching for a ${profile.role}.",
        "rewrite": "A one-sentence 'Executive Mode' version of their response."
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUSER RESPONSE: " + userInput }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(result);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI Assessment failed" }, { status: 500 });
  }
}
