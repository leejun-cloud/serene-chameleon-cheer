import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingSubscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error checking existing subscriber:', fetchError);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }

    if (existingSubscriber) {
      return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({ email });

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return NextResponse.json({ error: 'Failed to subscribe.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Successfully subscribed to the newsletter!' }, { status: 201 });

  } catch (error: any) {
    console.error('Subscription API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}