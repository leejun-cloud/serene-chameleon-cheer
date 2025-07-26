import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { generateNewsletterHtml } from '@/lib/newsletter-html-generator';
import { NewsletterFormData } from '@/components/newsletter-form';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for server-side access

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

// Function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const { newsletterData, aiStyles } = await request.json();

    if (!newsletterData || !newsletterData.newsletterTitle || !newsletterData.newsletterSubject) {
      return NextResponse.json({ error: 'Newsletter data is incomplete.' }, { status: 400 });
    }

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      return NextResponse.json({ error: 'Gmail API credentials are not fully configured on the server.' }, { status: 500 });
    }

    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Fetch all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers.' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers found to send the newsletter to.' }, { status: 200 });
    }

    const htmlContent = generateNewsletterHtml(newsletterData as NewsletterFormData, aiStyles);

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (const subscriber of subscribers) {
      const to = subscriber.email;
      const subject = newsletterData.newsletterSubject;

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

      try {
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedEmail,
          },
        });
        sentCount++;
        // Introduce a small delay to avoid hitting rate limits too quickly
        await delay(200); // 200ms delay per email
      } catch (error: any) {
        console.error(`Failed to send email to ${to}:`, error);
        failedCount++;
        failedEmails.push(to);
        // Consider a longer delay or breaking if too many failures
        await delay(1000); // Longer delay on failure
      }
    }

    return NextResponse.json({
      message: `Newsletter sending process completed. Sent to ${sentCount} subscribers. ${failedCount} failed.`,
      sentCount,
      failedCount,
      failedEmails,
    });

  } catch (error: any) {
    console.error('Bulk Email Sending API Error:', error);
    if (error.message?.includes('API key not valid') || error.code === 401 || error.message?.includes('Invalid Credentials')) {
      return NextResponse.json({ error: 'Authentication failed. Please check your Gmail API credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN).' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred while sending bulk emails.' }, { status: 500 });
  }
}