import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { profile, focusArea } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    // List of models to try for the UK region
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    const prompt = `
      You are a leadership coach. Create a high-stakes scenario for a ${profile.level} ${profile.role}.
      Focus Area: ${focusArea}.
      
      Return ONLY JSON:
      {
        "headline": "A 1-sentence high-stakes problem statement.",
        "context": "A quote from a difficult stakeholder pushing for the WRONG thing.",
        "stakeholderTitle": "Job title of the person speaking"
      }
    `;

    for (const modelName of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const cleanJson = data.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
          return NextResponse.json(JSON.parse(cleanJson));
        }
      } catch (e) {
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }

    throw new Error("All models failed to generate scenario.");

  } catch (error) {
    console.error("Generator Error:", error.message);
    return NextResponse.json({ 
        headline: "Google API is busy", 
        context: "Your quota might be low or the model is resetting. Try again in 30 seconds.", 
        stakeholderTitle: "System" 
    });
  }
}
