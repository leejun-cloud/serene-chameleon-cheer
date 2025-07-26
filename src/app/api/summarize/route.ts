import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

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
    const { url, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please provide a Gemini API Key.' },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Step 1: Fetch the raw HTML content of the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch content from ${url}. Status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // Clean up the HTML to reduce token count before sending to AI
    $('script, style, noscript, iframe, footer, nav, aside, header').remove();
    const bodyContent = $('body').text() || '';

    if (!bodyContent.trim()) {
        throw new Error('Could not extract any meaningful text content from the page body.');
    }

    // Step 2: Ask Gemini to extract, summarize, and return JSON
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert web content processor. From the provided web page text content, perform the following tasks:
      1.  Extract the main article title.
      2.  Generate a concise, 3-4 sentence summary of the main article content.
      3.  The summary MUST be in the same language as the article.

      Your response MUST be a single, clean JSON object and nothing else. Do not wrap it in markdown or add any explanations.
      The JSON object must have this exact structure: { "title": "...", "summary": "..." }

      Web page text content to process:
      ---
      ${bodyContent.substring(0, 20000)}
      ---
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    const jsonData = extractJson(aiResponseText);

    if (!jsonData || !jsonData.title || !jsonData.summary) {
        console.error("AI response was not valid JSON:", aiResponseText);
        throw new Error("AI failed to process the article. The website's structure might be too complex or the content is not suitable for summarization.");
    }
    
    // Find image URL separately using cheerio as a reliable fallback
    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, url).href;
    }

    return NextResponse.json({
        title: jsonData.title,
        summary: jsonData.summary,
        imageUrl: imageUrl || ''
    });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    if (error.message?.includes('API key not valid')) {
        return NextResponse.json({ error: 'The provided Gemini API Key is not valid. Please check your key and try again.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}