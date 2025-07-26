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
    // The string is not a valid JSON, so we return null.
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

    const title = $('head > title').text() || $('h1').first().text();

    let imageUrl = $('meta[property="og:image"]').attr('content');
    if (!imageUrl) {
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src) {
          const width = Number($(elem).attr('width')) || 0;
          const height = Number($(elem).attr('height')) || 0;
          if (width > 200 || height > 200) {
            imageUrl = src;
            return false;
          }
        }
      });
    }
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href;
    }

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

    if (cleanedContent.length < 150) {
      throw new Error('Could not extract enough meaningful content from the URL to summarize.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert content summarizer. Analyze the following text and provide a summary.
      
      Rules:
      1. The summary must be 3-4 sentences long.
      2. The summary must be in the same language as the original text.
      3. Your entire response MUST be a single valid JSON object.
      4. The JSON object must have a single key: "summary". The value should be the summary text as a string.
      
      Example Response:
      \`\`\`json
      {
        "summary": "This is a summary of the article in the same language."
      }
      \`\`\`

      Original Text to Summarize:
      ---
      ${cleanedContent.substring(0, 8000)}
      ---
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = await result.response.text();
    
    const parsedJson = extractJson(aiResponseText);

    if (!parsedJson || !parsedJson.summary) {
      console.error("AI returned an invalid format. Raw response:", aiResponseText);
      throw new Error("AI returned an invalid format. Please try a different article or prompt.");
    }

    return NextResponse.json({ title, summary: parsedJson.summary, imageUrl: imageUrl || '' });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    if (error.message?.includes('API key not valid')) {
        return NextResponse.json({ error: 'The provided Gemini API Key is not valid. Please check your key and try again.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}