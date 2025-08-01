import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

const GEMINI_API_KEY = "AIzaSyAYUmo4CviAuC6POOQcCI2KkeNmZYLHmPA";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured on the server.' },
        { status: 500 }
      );
    }

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

    // More aggressive cleaning of irrelevant content
    $('script, style, nav, footer, header, aside, form, .ad, .advert, .sidebar, .comments, #comments, .social-share, .author-bio').remove();
    
    let mainContent;
    // Expanded list of selectors to find the main article content
    const mainSelectors = [
        'article', 
        'main', 
        '.post-content', 
        '.entry-content', 
        'div[role="main"]', 
        '#content', 
        '#main',
        '.post',
        '.story-content'
    ];
    
    for (const selector of mainSelectors) {
        if ($(selector).length) {
            const content = $(selector).text();
            // Check if the content found is substantial enough
            if (content.replace(/\s+/g, ' ').trim().length > 200) {
                mainContent = content;
                break;
            }
        }
    }

    // Fallback to body only if no specific container yields enough content
    if (!mainContent) {
        mainContent = $('body').text();
    }
    
    const cleanedContent = mainContent.replace(/\s\s+/g, ' ').trim();

    if (cleanedContent.length < 150) {
      throw new Error('Failed to extract sufficient content. The website might use a complex layout or dynamic content loading that is not supported.');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are an expert content summarizer. Analyze the following text and provide a summary.
      The summary must be 3-4 sentences long and in the same language as the original text.
      
      Your output must conform to this JSON schema:
      {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string",
            "description": "The 3-4 sentence summary of the text."
          }
        }
      }

      Original Text to Summarize:
      ---
      ${cleanedContent.substring(0, 8000)}
      ---
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const parsedJson = JSON.parse(aiResponse.text());

    if (!parsedJson.summary) {
      console.error("AI returned valid JSON but without a summary key. Response:", aiResponse.text());
      throw new Error("AI response was missing the summary. Please try again.");
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