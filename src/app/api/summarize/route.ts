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

    const genAI = new GoogleGenerativeAI(apiKey);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch content from ${url}. Status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Title
    const title = $('head > title').text() || $('h1').first().text();

    // 2. Extract Representative Image (og:image is best)
    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (!imageUrl) {
      // Fallback to the first large image
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src) {
          const width = Number($(elem).attr('width')) || 0;
          const height = Number($(elem).attr('height')) || 0;
          if (width > 200 || height > 200) {
            imageUrl = src;
            return false; // stop iterating
          }
        }
      });
    }
    // Ensure the URL is absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href;
    }


    // 3. Improved content extraction
    $('script, style, nav, footer, header, aside, form').remove();
    
    let mainContent;
    const mainSelectors = ['main', 'article', 'div[role="main"]', 'div#main', 'div#content', '.post-content'];
    for (const selector of mainSelectors) {
        if ($(selector).length) {
            mainContent = $(selector).text();
            break;
        }
    }
    if (!mainContent) {
        mainContent = $('body').text();
    }
    
    const cleanedContent = mainContent.replace(/\s\s+/g, ' ').trim();

    if (!cleanedContent) {
      throw new Error('Could not extract meaningful content from the URL.');
    }

    // 4. More robust prompt for Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a text summarization expert. Your task is to create a concise summary of the provided text.
Follow these rules strictly:
1. The summary must be 3-4 sentences long.
2. The summary MUST be in the exact same language as the original text provided.
3. Your response must contain ONLY the summary text, with no additional explanations, greetings, or introductory phrases like "Here is the summary:".

Original Text:
---
${cleanedContent.substring(0, 10000)}
---
`;

    const result = await model.generateContent(prompt);
    const summaryResponse = await result.response;
    const summary = summaryResponse.text();

    return NextResponse.json({ title, summary, imageUrl: imageUrl || '' });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    if (error.message?.includes('API key not valid')) {
        return NextResponse.json({ error: 'The provided Gemini API Key is not valid. Please check your key and try again.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}