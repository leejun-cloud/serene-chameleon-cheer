import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { designPrompt, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required for AI services.' }, { status: 400 });
    }
    if (!designPrompt) {
      return NextResponse.json({ error: 'Design prompt is required.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use JSON mode for reliable, structured output
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are a web design assistant specializing in Tailwind CSS.
      Based on the user's request, generate Tailwind CSS utility classes to style a newsletter.
      
      User's design request: "${designPrompt}"

      Your output must conform to this JSON schema:
      {
        "type": "object",
        "properties": {
          "card": { "type": "string", "description": "Tailwind classes for the main container card." },
          "header": { "type": "string", "description": "Tailwind classes for the header section." },
          "mainTitle": { "type": "string", "description": "Tailwind classes for the main H1 title." },
          "articleContainer": { "type": "string", "description": "Tailwind classes for the container of each article." },
          "articleTitle": { "type": "string", "description": "Tailwind classes for each article's H3 title." },
          "footer": { "type": "string", "description": "Tailwind classes for the footer section." }
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = JSON.parse(response.text());

    if (typeof jsonResponse !== 'object' || jsonResponse === null) {
        throw new Error("AI failed to return a valid style object.");
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error('API Redesign Error:', error);
    if (error.message?.includes('API key not valid')) {
        return NextResponse.json({ error: 'The provided Gemini API Key is not valid.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}