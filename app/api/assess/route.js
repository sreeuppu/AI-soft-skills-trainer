import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario, chatHistory } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Auto-discover model (using your successful UK logic)
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    const availableModels = listData.models || [];
    const bestModel = availableModels.find(m => m.name.includes("flash"))?.name || "models/gemini-1.5-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`;

    // 2. Build the "Sparring" Prompt
    const systemPrompt = `
      You are a difficult, skeptical Stakeholder in a high-pressure business meeting.
      USER PROFILE: ${profile.level} ${profile.role}.
      SCENARIO: ${scenario.headline} (${scenario.context}).

      YOUR GOAL:
      - Evaluate the user's latest response.
      - If the response is weak (hedging, no timeline, no ownership) or too aggressive (disrespectful), you must PUSH BACK with a realistic rebuttal.
      - If the user has responded at least once and is now firm, logical, and takes ownership, you should CONCEDE and end the simulation.
      - Limit the simulation to a maximum of 3 pushbacks total.

      OUTPUT RULES:
      Return ONLY a JSON object with this structure:
      {
        "decision": "PUSHBACK" or "FINAL",
        "pushbackText": "Your rebuttal as the stakeholder (only if decision is PUSHBACK)",
        "scores": { "Clarity": 0, "Ruthlessness": 0, "Ownership": 0 }, (only if decision is FINAL)
        "feedback": "Mentor coaching notes", (only if decision is FINAL)
        "rewrite": "Masterful version of the response" (only if decision is FINAL)
      }
    `;

    // 3. Include Chat History so Gemini remembers the argument
    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...chatHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: [{ text: userInput }] }
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: "The AI session failed. Check your connection." }, { status: 500 });
  }
}
