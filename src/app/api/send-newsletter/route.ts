import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json();

    if (!to || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Recipient, subject, and HTML content are required.' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      return NextResponse.json({ error: 'Gmail API credentials are not fully configured on the server.' }, { status: 500 });
    }

    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlContent,
    ].join('\n');

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return NextResponse.json({ message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.code === 401 || error.message?.includes('Invalid Credentials')) {
      return NextResponse.json({ error: 'Authentication failed. Please check your Gmail API credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN).' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred while sending the email.' }, { status: 500 });
  }
}