import React from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';

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
      <CardFooter className="flex flex-col items-start gap-4 bg-muted/50 p-6 border-t">
        <div className="w-full">
          <Label htmlFor="design-prompt" className="text-sm font-semibold flex items-center">
            <Wand2 className="mr-2 h-4 w-4" />
            Request AI Design Changes
          </Label>
          <Textarea 
            id="design-prompt"
            placeholder="e.g., 'Make the design more modern and minimalist', 'Use a blue color scheme', 'Change the font to be more readable'..."
            className="mt-2"
          />
        </div>
        <Button onClick={() => toast.info("AI design modification is coming soon!")} className="w-full">
          Redesign with AI
        </Button>
      </CardFooter>
    </Card>
  );
}