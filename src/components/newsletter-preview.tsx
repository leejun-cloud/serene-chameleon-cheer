import React, { useState } from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Wand2, Loader2, Download } from 'lucide-react';
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
}

export function NewsletterPreview({ data }: NewsletterPreviewProps) {
  const [designPrompt, setDesignPrompt] = useState('');
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [aiStyles, setAiStyles] = useState<AiStyles>({});

  async function handleRedesign() {
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
        body: JSON.stringify({ designPrompt }),
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

  const generateNewsletterHtml = (
    newsletterData: NewsletterFormData,
    styles: AiStyles
  ): string => {
    const articlesHtml = newsletterData.articles
      .map(
        (article, index) => `
      <div class="${cn('py-4', styles.articleContainer)}">
        ${
          article.imageUrl
            ? `
          <div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden; border-radius: 0.5rem; margin-bottom: 1rem;">
            <img
              src="${article.imageUrl}"
              alt="${article.title || 'Article Image'}"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
            />
          </div>`
            : ''
        }
        <h3 class="${cn('text-xl font-semibold mb-2', styles.articleTitle)}">${article.title || ''}</h3>
        <div class="prose prose-sm max-w-none">
          <p style="white-space: pre-wrap;">${article.summary || ''}</p>
        </div>
      </div>
      ${index < newsletterData.articles.length - 1 ? '<hr class="my-6 border-gray-200" />' : ''}
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${newsletterData.newsletterTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: sans-serif; }
          .prose { color: #374151; line-height: 1.6; }
          .prose h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
          .prose p { margin-top: 0; margin-bottom: 1rem; }
        </style>
      </head>
      <body class="bg-gray-100 p-4 md:p-8">
        <div class="${cn('w-full max-w-2xl mx-auto shadow-lg bg-white rounded-lg overflow-hidden', styles.card)}">
          <header class="${cn('p-6', styles.header)}">
            <h1 class="${cn('text-3xl font-bold text-center', styles.mainTitle)}">${newsletterData.newsletterTitle}</h1>
            <p class="text-center text-sm text-gray-500 mt-2">Subject: ${newsletterData.newsletterSubject}</p>
          </header>
          <main class="p-6">
            ${articlesHtml}
            <div class="text-center text-xs text-gray-400 pt-6 border-t border-gray-200 mt-8">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </main>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadHtml = () => {
    if (!data) {
      toast.error("No newsletter data to download.");
      return;
    }
    const htmlContent = generateNewsletterHtml(data, aiStyles);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.newsletterTitle.replace(/\s+/g, '_').toLowerCase()}_newsletter.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Newsletter HTML downloaded!");
  };

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
      <CardHeader className={cn("rounded-t-lg p-6", aiStyles.header)}>
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
      <CardFooter className={cn("flex flex-col items-start gap-4 p-6 border-t", aiStyles.footer)}>
        <div className="w-full">
          <Label htmlFor="design-prompt" className="text-sm font-semibold flex items-center">
            <Wand2 className="mr-2 h-4 w-4" />
            Request AI Design Changes
          </Label>
          <Textarea 
            id="design-prompt"
            placeholder="e.g., 'Make it sky blue', 'Use a dark theme', 'Change the font to serif'..."
            className="mt-2"
            value={designPrompt}
            onChange={(e) => setDesignPrompt(e.target.value)}
          />
        </div>
        <Button onClick={handleRedesign} className="w-full" disabled={isRedesigning}>
          {isRedesigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Redesign with AI
        </Button>
        
        <Separator className="my-4 w-full" />

        <div className="w-full">
          <Label className="text-sm font-semibold flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export Newsletter
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Download the final newsletter as a single HTML file.</p>
          <Button onClick={handleDownloadHtml} className="w-full" variant="secondary">
            Download HTML
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}