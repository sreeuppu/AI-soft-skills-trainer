import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing in Vercel Environment Variables" }, { status: 500 });

    // We will try Flash first and capture its specific error if it fails
    const modelName = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const systemPrompt = `Role: Leadership Coach. Profile: ${profile.level} ${profile.role}. Scenario: ${scenario.headline}. Task: Score (1-10) for Clarity, Ruthlessness, Ownership. Return JSON: {"scores": {"Clarity":0, "Ruthlessness":0, "Ownership":0}, "feedback": "text", "rewrite": "text"}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUser Response: " + userInput }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // THIS IS THE IMPORTANT PART: It tells us exactly why Google said no
      const errorMessage = data.error?.message || "Unknown Google Error";
      const errorStatus = data.error?.status || "Unknown Status";
      console.error(`Google API Rejected (${errorStatus}): ${errorMessage}`);
      
      return NextResponse.json({ 
        error: `Google API Error: ${errorMessage}`,
        details: `Status: ${errorStatus}`
      }, { status: response.status });
    }

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Critical Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
