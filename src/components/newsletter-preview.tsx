import React, { useState } from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AiStyles {
  card?: string;
  header?: string;
  mainTitle?: string;
  articleContainer?: string;
  articleTitle?: string;
  footer?: string;
}

interface NewsletterPreviewProps {
  data: NewsletterFormData | null;
  apiKey: string;
}

export function NewsletterPreview({ data, apiKey }: NewsletterPreviewProps) {
  const [designPrompt, setDesignPrompt] = useState('');
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [aiStyles, setAiStyles] = useState<AiStyles>({});

  async function handleRedesign() {
    if (!apiKey) {
      toast.error("Please enter your Google Gemini API Key first.");
      return;
    }
    if (!designPrompt) {
      toast.error("Please enter a design request before redesigning.");
      return;
    }

    setIsRedesigning(true);
    const toastId = toast.loading("AI is redesigning your newsletter...");

    try {
      const response = await fetch('/api/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designPrompt, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get design from AI.");
      }

      const newStyles = await response.json();
      setAiStyles(newStyles);
      toast.success("Newsletter redesigned successfully!", { id: toastId });

    } catch (error: any) {
      console.error("Redesign error:", error);
      toast.error(error.message || "An unexpected error occurred.", { id: toastId });
    } finally {
      setIsRedesigning(false);
    }
  }

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
    <Card className={cn("w-full max-w-2xl mx-auto shadow-lg", aiStyles.card)}>
      <CardHeader className={cn("bg-muted rounded-t-lg p-6", aiStyles.header)}>
        <CardTitle className={cn("text-3xl font-bold text-center", aiStyles.mainTitle)}>{data.newsletterTitle}</CardTitle>
        <p className="text-center text-sm text-muted-foreground mt-2">Subject: {data.newsletterSubject}</p>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {data.articles && data.articles.map((article, index) => (
          <div key={index} className={cn(aiStyles.articleContainer)}>
            {article.imageUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4">
                <img
                  src={article.imageUrl}
                  alt={article.title || 'Article Image'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className={cn("text-xl font-semibold mb-2", aiStyles.articleTitle)}>{article.title || `Article ${index + 1}`}</h3>
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
      <CardFooter className={cn("flex flex-col items-start gap-4 bg-muted/50 p-6 border-t", aiStyles.footer)}>
        <div className="w-full">
          <Label htmlFor="design-prompt" className="text-sm font-semibold flex items-center">
            <Wand2 className="mr-2 h-4 w-4" />
            Request AI Design Changes
          </Label>
          <Textarea 
            id="design-prompt"
            placeholder="e.g., 'Make the design more modern and minimalist', 'Use a blue color scheme', 'Change the font to be more readable'..."
            className="mt-2"
            value={designPrompt}
            onChange={(e) => setDesignPrompt(e.target.value)}
          />
        </div>
        <Button onClick={handleRedesign} className="w-full" disabled={isRedesigning}>
          {isRedesigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Redesign with AI
        </Button>
      </CardFooter>
    </Card>
  );
}