import React, { useState } from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Wand2, Loader2, Download, ExternalLink, Send, Users } from 'lucide-react'; // Added Users icon
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { generateNewsletterHtml } from '@/lib/newsletter-html-generator'; // Import from utility

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
  isReadOnly?: boolean;
}

export function NewsletterPreview({ data, isReadOnly = false }: NewsletterPreviewProps) {
  const [designPrompt, setDesignPrompt] = useState('');
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [aiStyles, setAiStyles] = useState<AiStyles>({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false); // New state for bulk sending loading

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

  const handleSendEmail = async () => {
    if (!data) {
      toast.error("No newsletter data to send.");
      return;
    }
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    setIsSendingEmail(true);
    const toastId = toast.loading(`Sending newsletter to ${recipientEmail}...`);

    try {
      const htmlContent = generateNewsletterHtml(data, aiStyles);
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: data.newsletterSubject,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email.");
      }

      toast.success("Newsletter sent successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast.error(error.message || "An unexpected error occurred while sending the email.", { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!data) {
      toast.error("No newsletter data to send.");
      return;
    }

    setIsSendingBulk(true);
    const toastId = toast.loading("Sending newsletter to all subscribers...");

    try {
      const response = await fetch('/api/send-bulk-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletterData: data,
          aiStyles: aiStyles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send bulk email.");
      }

      const result = await response.json();
      toast.success(result.message, { id: toastId });
      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} emails failed to send. Check server logs for details.`);
      }

    } catch (error: any) {
      console.error("Bulk email sending error:", error);
      toast.error(error.message || "An unexpected error occurred while sending bulk emails.", { id: toastId });
    } finally {
      setIsSendingBulk(false);
    }
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
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{
                __html: article.contentType === 'html'
                  ? (article.content || '')
                  : marked.parse(article.content || '')
              }}
            />
            {article.url && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    기사 보기
                  </a>
                </Button>
              </div>
            )}
            {index < data.articles.length - 1 && <Separator className="my-8" />}
          </div>
        ))}
        
        <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border mt-8">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <a href="#" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              Your Company
            </a>
            . All rights reserved.
          </p>
        </div>
      </CardContent>
      {!isReadOnly && (
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
            <Label htmlFor="recipient-email" className="text-sm font-semibold flex items-center">
              <Send className="mr-2 h-4 w-4" />
              Send Newsletter via Gmail (Single Recipient)
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Enter recipient email to send this newsletter. (Limited by Gmail API daily quota)
            </p>
            <Input
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleSendEmail} className="w-full" disabled={isSendingEmail}>
              {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Email
            </Button>
          </div>

          <Separator className="my-4 w-full" />

          <div className="w-full">
            <Label className="text-sm font-semibold flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Send to All Subscribers (Bulk)
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Sends this newsletter to all active subscribers in your database.
              <span className="font-bold text-red-500"> (Subject to Gmail API rate limits: ~500-2000 emails/day)</span>
            </p>
            <Button onClick={handleSendBulkEmail} className="w-full" disabled={isSendingBulk}>
              {isSendingBulk ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send to All Subscribers
            </Button>
          </div>

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
      )}
    </Card>
  );
}