import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to extract JSON from a string that might contain markdown
function extractJson(str: string): any | null {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
      return null;
    }
  }
  // Fallback for string that is just the JSON object
  try {
    return JSON.parse(str);
  } catch(e) {
    console.error("Failed to parse raw string as JSON:", e);
  }
  return null;
}


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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a web design assistant specializing in Tailwind CSS.
      Based on the user's request, generate a JSON object containing Tailwind CSS utility classes to style a newsletter.
      The JSON object should have the following keys: "card", "header", "mainTitle", "articleContainer", "articleTitle", "footer".
      Only provide Tailwind classes as string values for these keys. Do not add any other properties.
      User's design request: "${designPrompt}"
      
      Example response for a "dark mode" request:
      {
        "card": "bg-gray-900 text-gray-100 border border-gray-700",
        "header": "bg-gray-800 border-b border-gray-700",
        "mainTitle": "text-blue-400",
        "articleContainer": "p-4 rounded-lg bg-gray-800/50",
        "articleTitle": "text-blue-300",
        "footer": "bg-gray-950 border-t border-gray-800"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonResponse = extractJson(text);

    if (!jsonResponse) {
        throw new Error("AI failed to return a valid JSON format. Please try a different prompt.");
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