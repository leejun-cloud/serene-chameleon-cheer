import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function POST(request: Request) {
  if (!genAI) {
    return NextResponse.json(
      { error: 'AI service is not configured. Please set the GEMINI_API_KEY.' },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

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
          // A simple check for a reasonably sized image
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


    // 3. Extract and clean content for summary
    $('script, style, nav, footer, header, aside, form').remove();
    const mainContent = $('body').text().replace(/\s\s+/g, ' ').trim();
    if (!mainContent) {
      throw new Error('Could not extract meaningful content from the URL.');
    }

    // 4. Generate Summary with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Please provide a concise, engaging summary (about 3-4 sentences) of the following web page content. Focus on the key points and main ideas. The content is: "${mainContent.substring(0, 15000)}"`;

    const result = await model.generateContent(prompt);
    const summaryResponse = await result.response;
    const summary = summaryResponse.text();

    return NextResponse.json({ title, summary, imageUrl: imageUrl || '' });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}