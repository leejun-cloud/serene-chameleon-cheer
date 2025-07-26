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

    // Step 2: Advanced content extraction
    $('script, style, noscript, iframe, footer, nav, aside, header, form, [role="navigation"], [role="banner"], [role="complementary"], [role="search"]').remove();

    let mainContentText = '';
    const mainSelectors = ['article', 'main', '[role="main"]', '.post-content', '.article-body', '#content', '.entry-content'];
    for (const selector of mainSelectors) {
        if ($(selector).length) {
            mainContentText = $(selector).text();
            break;
        }
    }

    if (!mainContentText || mainContentText.length < 200) {
        const paragraphs: string[] = [];
        $('body p').each((i, elem) => {
            const pText = $(elem).text().trim();
            if (pText.length > 100) {
                paragraphs.push(pText);
            }
        });
        if (paragraphs.length > 0) {
            mainContentText = paragraphs.join('\n\n');
        } else {
            mainContentText = $('body').text();
        }
    }

    const cleanedContent = mainContentText.replace(/\s\s+/g, ' ').trim();

    if (cleanedContent.length < 150) {
        throw new Error('Could not extract enough meaningful text from the URL to create a summary.');
    }

    // Step 3: Ask Gemini to extract, summarize, and return JSON
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: "You are a highly specialized web content analysis API. Your only function is to process text and return a single, clean JSON object with the keys 'title' and 'summary'. Do not add any other text, markdown, or explanations. Your output must be only the JSON object."
    });

    const prompt = `
      Analyze the following web page text content and perform these tasks:
      1.  Identify the primary article title.
      2.  Write a concise, 3-4 sentence summary of the article.
      3.  The summary's language must match the article's language.

      Return the result as a JSON object with this exact structure: { "title": "...", "summary": "..." }

      Web page text content:
      ---
      ${cleanedContent.substring(0, 20000)}
      ---
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    const jsonData = extractJson(aiResponseText);

    if (!jsonData || !jsonData.title || !jsonData.summary) {
        console.error("AI response was not valid JSON:", aiResponseText);
        throw new Error("AI failed to process the article. The website's structure might be too complex or the content is not suitable for summarization.");
    }
    
    // Step 4: Find image URL separately using cheerio as a reliable fallback
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