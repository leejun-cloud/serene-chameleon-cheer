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

    // Fetching HTML content from the URL
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
    const title = $('head > title').text() || $('h1').first().text() || $('meta[property="og:title"]').attr('content') || 'Untitled';

    // 2. Extract Representative Image (og:image is best)
    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (!imageUrl) {
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
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, url).href;
      } catch (e) {
        console.warn(`Could not construct absolute URL for image: ${imageUrl}`);
        imageUrl = '';
      }
    }

    // 3. Improved content extraction
    $('script, style, nav, footer, header, aside, form, noscript').remove();
    
    let mainContent = '';
    // Try to find semantic main content tags first
    const mainTagContent = $('main').text();
    const articleTagContent = $('article').text();

    if (mainTagContent && mainTagContent.trim().length > 200) {
      mainContent = mainTagContent;
    } else if (articleTagContent && articleTagContent.trim().length > 200) {
      mainContent = articleTagContent;
    } else {
      // Fallback to the whole body if specific tags fail
      mainContent = $('body').text();
    }
    
    mainContent = mainContent.replace(/\s\s+/g, ' ').trim();

    if (!mainContent || mainContent.length < 100) {
      throw new Error('Could not extract sufficient meaningful content from the URL. The page might be rendered with JavaScript or be too sparse.');
    }

    // 4. Generate Summary with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Please provide a concise, engaging summary (about 3-4 sentences) of the following web page content. The summary MUST be in the same language as the original text. Focus on the key points and main ideas. The content is: "${mainContent.substring(0, 15000)}"`;

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