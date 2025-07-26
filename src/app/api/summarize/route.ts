import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// 1. 환경 변수에서 Gemini API 키를 가져옵니다.
const geminiApiKey = process.env.GEMINI_API_KEY;

// API 키가 설정되지 않은 경우 오류를 기록하고 AI 클라이언트를 null로 설정합니다.
if (!geminiApiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function POST(request: Request) {
  // AI 서비스가 설정되지 않은 경우(API 키 누락) 오류를 반환합니다.
  if (!genAI) {
    return NextResponse.json(
      { error: 'AI service is not configured. Please set the GEMINI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 2. 제공된 URL에서 웹페이지 콘텐츠를 가져옵니다.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch content from ${url}. Status: ${response.status}`);
    }
    const html = await response.text();

    // 3. Cheerio를 사용하여 HTML에서 의미 있는 텍스트를 추출합니다.
    const $ = cheerio.load(html);
    // 불필요한 태그(스크립트, 스타일, 네비게이션 등)를 제거합니다.
    $('script, style, nav, footer, header, aside, form').remove();
    const mainContent = $('body').text();
    // 여러 공백을 하나로 줄여 텍스트를 정리합니다.
    const cleanedContent = mainContent.replace(/\s\s+/g, ' ').trim();

    if (!cleanedContent) {
        throw new Error('Could not extract meaningful content from the URL.');
    }

    // 4. 정리된 콘텐츠를 Gemini API로 보내 요약을 요청합니다.
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Please provide a concise summary of the following web page content. Focus on the key points and main ideas. The content is: "${cleanedContent.substring(0, 30000)}"`; // API 제한을 위해 콘텐츠 크기를 제한합니다.

    const result = await model.generateContent(prompt);
    const summaryResponse = await result.response;
    const summary = summaryResponse.text();

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('API Summarize Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred during summarization.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}