import React from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';

export function NewsletterPreview({ data }: { data: NewsletterFormData | null }) {
  if (!data || !data.newsletterTitle) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">Newsletter Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>Fill out the form to see your newsletter preview here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-muted rounded-t-lg p-6">
        <CardTitle className="text-3xl font-bold text-center">{data.newsletterTitle}</CardTitle>
        <p className="text-center text-sm text-muted-foreground mt-2">Subject: {data.newsletterSubject}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {data.articles && data.articles.map((article, index) => (
          <div key={index}>
            {article.imageUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4">
                <img
                  src={article.imageUrl}
                  alt={article.title || 'Article Image'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-xl font-semibold mb-2">{article.title || `Article ${index + 1}`}</h3>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{article.summary}</p>
            </div>
            {index < data.articles.length - 1 && <Separator className="my-8" />}
          </div>
        ))}
        
        <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border mt-8">
          <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </CardContent>
    </Card>
  );
}