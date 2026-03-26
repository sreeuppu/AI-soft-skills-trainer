import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    // Using the Stable v1 endpoint for better reliability in the UK/EU
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `
      You are an elite Executive Leadership Coach. 
      USER PROFILE: Role: ${profile.role}, Level: ${profile.level}, Industry: ${profile.industry}.
      SCENARIO: ${scenario.headline}.
      
      TASK: Evaluate the response. 
      Return ONLY a JSON object:
      {
        "scores": { "Clarity": 0, "Ruthlessness": 0, "Ownership": 0 },
        "feedback": "2 sentences of coaching.",
        "rewrite": "A one-sentence version."
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUSER RESPONSE: " + userInput }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini Error:", data.error.message);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // CLEANING LOGIC: This prevents the "Page couldn't load" error
    let rawText = data.candidates[0].content.parts[0].text;
    
    // Remove markdown blocks if Gemini includes them
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const result = JSON.parse(cleanJson);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "The AI took too long or sent back bad data." }, { status: 500 });
  }
}
