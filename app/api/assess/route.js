import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userInput, profile, scenario } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing in Vercel settings" }, { status: 500 });
    }

    // CHANGED: Using v1beta and adding "-latest" to the model name for UK stability
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const systemPrompt = `
      You are an elite Executive Leadership Coach. 
      USER PROFILE: Role: ${profile.role}, Level: ${profile.level}, Industry: ${profile.industry}.
      SCENARIO: ${scenario.headline}.
      
      TASK: Evaluate the response based on leadership standards.
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
        contents: [{ parts: [{ text: systemPrompt + "\n\nUSER RESPONSE: " + userInput }] }],
        // Forcing the AI to stay in JSON mode
        generationConfig: {
            response_mime_type: "application/json",
        }
      })
    });

    const data = await response.json();

    // If Google sends back an error (400), we catch it here
    if (data.error) {
      console.error("Gemini rejected request:", data.error.message);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Extracting and cleaning the result
    const rawText = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(rawText);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Critical Server Error:", error);
    return NextResponse.json({ error: "The AI assessment failed. Please try again." }, { status: 500 });
  }
}
