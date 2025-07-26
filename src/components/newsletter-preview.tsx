import React from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NewsletterPreviewProps {
  data: NewsletterFormData | null;
}

export function NewsletterPreview({ data }: NewsletterPreviewProps) {
  if (!data) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Newsletter Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Fill out the form to see your newsletter preview here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
        <CardTitle className="text-3xl font-bold text-center">{data.title}</CardTitle>
        <p className="text-center text-sm opacity-80 mt-2">Subject: {data.subject}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap">{data.content}</p>
        </div>
        <div className="text-center pt-4">
          <Button asChild className="px-8 py-3 text-lg">
            <a href={data.ctaLink} target="_blank" rel="noopener noreferrer">
              {data.ctaText}
            </a>
          </Button>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border mt-6">
          <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>This email was sent to you because you subscribed to our newsletter.</p>
        </div>
      </CardContent>
    </Card>
  );
}