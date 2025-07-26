import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

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

    // Step 1: Fetch HTML and extract metadata with Cheerio
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html;charset=UTF-8',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch content from ${url}. Status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Title and Image URL directly - more reliable than asking AI
    const title = $('head > title').text() || $('h1').first().text() || 'Title not found';
    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, url).href;
    }

    // Step 2: Prepare text content for summarization
    $('script, style, noscript, iframe, footer, nav, aside, header, form').remove();
    const mainContentText = $('body').text();
    const cleanedContent = mainContentText.replace(/\s\s+/g, ' ').trim();

    if (cleanedContent.length < 150) {
        throw new Error('Could not extract enough meaningful text from the URL to create a summary.');
    }

    // Step 3: Ask Gemini for a summary ONLY. This is more robust.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Please provide a concise, 3-4 sentence summary of the following text.
      The summary must be in the same language as the text.
      Do not add any extra commentary, just the summary itself.

      Text to summarize:
      ---
      ${cleanedContent.substring(0, 15000)}
      ---
    `;

    const result = await model.generateContent(prompt);
    const summaryResponse = await result.response;
    const summary = summaryResponse.text().trim();

    if (!summary) {
        throw new Error("AI was unable to generate a summary for the provided text.");
    }

    // Step 4: Construct the final JSON response
    return NextResponse.json({
        title: title,
        summary: summary,
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