import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Ask Google what models YOUR specific UK account is allowed to use
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    // 2. Automatically find the best "Flash" model available to you
    // This will find "gemini-3-flash" or "gemini-1.5-flash" automatically
    const availableModels = listData.models || [];
    const bestModel = availableModels.find(m => m.name.includes("flash"))?.name || "models/gemini-1.5-flash";

    console.log("UK Region - Using Model:", bestModel);

    // 3. Run the assessment
    const url = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Role: Leadership Coach. Profile: ${profile.level} ${profile.role}. Scenario: ${scenario.headline}. User Response: "${userInput}". Return JSON: {"scores": {"Clarity":0, "Ruthlessness":0, "Ownership":0}, "feedback": "text", "rewrite": "text"}` }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: "Please verify your API key and Billing setup in Google AI Studio." }, { status: 500 });
  }
}
