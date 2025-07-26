import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// 1. 환경 변수에서 Gemini API 키를 가져옵니다.
const geminiApiKey = process.env.GEMINI_API_KEY;
console.log('Checking for GEMINI_API_KEY...');

// API 키가 설정되지 않은 경우 오류를 기록하고 AI 클라이언트를 null로 설정합니다.
if (!geminiApiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables.');
} else {
  console.log('GEMINI_API_KEY found.');
}
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function POST(request: Request) {
  console.log('Summarize API endpoint hit.');

  // AI 서비스가 설정되지 않은 경우(API 키 누락) 오류를 반환합니다.
  if (!genAI) {
    console.error('Attempted to call summarize API without configured AI service.');
    return NextResponse.json(
      { error: 'AI service is not configured. Please set the GEMINI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();
    console.log(`Received URL to summarize: ${url}`);

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 2. 제공된 URL에서 웹페이지 콘텐츠를 가져옵니다.
    console.log(`Fetching content from ${url}...`);
    // User-Agent를 추가하여 일부 웹사이트의 차단을 우회합니다.
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    if (!response.ok) {
      console.error(`Failed to fetch content. Status: ${response.status}`);
      throw new Error(`Failed to fetch content from ${url}. Status: ${response.status}`);
    }
    const html = await response.text();
    console.log('Successfully fetched HTML content.');

    // 3. Cheerio를 사용하여 HTML에서 의미 있는 텍스트를 추출합니다.
    const $ = cheerio.load(html);
    // 불필요한 태그(스크립트, 스타일, 네비게이션 등)를 제거합니다.
    $('script, style, nav, footer, header, aside, form').remove();
    const mainContent = $('body').text();
    // 여러 공백을 하나로 줄여 텍스트를 정리합니다.
    const cleanedContent = mainContent.replace(/\s\s+/g, ' ').trim();
    console.log(`Extracted and cleaned content (first 200 chars): ${cleanedContent.substring(0, 200)}...`);

    if (!cleanedContent) {
        console.error('Could not extract meaningful content from the URL.');
        throw new Error('Could not extract meaningful content from the URL.');
    }

    // 4. 정리된 콘텐츠를 Gemini API로 보내 요약을 요청합니다.
    console.log('Sending content to Gemini API for summarization...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Please provide a concise summary of the following web page content. Focus on the key points and main ideas. The content is: "${cleanedContent.substring(0, 30000)}"`; // API 제한을 위해 콘텐츠 크기를 제한합니다.

    const result = await model.generateContent(prompt);
    const summaryResponse = await result.response;
    const summary = summaryResponse.text();
    console.log('Successfully received summary from Gemini API.');

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred during summarization.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}