import React from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // Import toast for notifications

interface NewsletterPreviewProps {
  data: NewsletterFormData | null;
}

// Function to generate a simple HTML email structure
const generateNewsletterHtml = (data: NewsletterFormData) => {
  const primaryBgLight = 'hsl(0 0% 9%)'; // --primary for light theme
  const primaryFgLight = 'hsl(0 0% 98%)'; // --primary-foreground for light theme
  const primaryBgDark = 'hsl(0 0% 98%)'; // --primary for dark theme
  const primaryFgDark = 'hsl(0 0% 9%)'; // --primary-foreground for dark theme

  const imageUrlHtml = data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.title}" style="max-width: 100%; height: auto; display: block; margin-bottom: 20px; border-radius: 8px;">` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.title}</title>
<style>
  body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
  .header { padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 28px; }
  .header p { margin-top: 5px; font-size: 14px; opacity: 0.9; }
  .content { padding: 20px 0; }
  .content p { margin-bottom: 1em; }
  .cta-button { display: inline-block; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 18px; }
  .footer { text-align: center; font-size: 12px; padding-top: 20px; margin-top: 20px; border-top: 1px solid #eee; }
  .footer p { margin: 5px 0; }

  /* Light Theme */
  body { color: #333; }
  .header { background-color: ${primaryBgLight}; color: ${primaryFgLight}; }
  .cta-button { background-color: ${primaryBgLight}; color: ${primaryFgLight} !important; }
  .footer { color: #777; }

  /* Dark Theme */
  @media (prefers-color-scheme: dark) {
    body { background-color: hsl(0 0% 3.9%); color: hsl(0 0% 98%); }
    .container { background-color: hsl(0 0% 3.9%); box-shadow: 0 0 10px rgba(255,255,255,0.1); }
    .header { background-color: ${primaryBgDark}; color: ${primaryFgDark}; }
    .cta-button { background-color: ${primaryBgDark}; color: ${primaryFgDark} !important; }
    .footer { color: hsl(0 0% 63.9%); border-top: 1px solid hsl(0 0% 14.9%); }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.title}</h1>
      <p>Subject: ${data.subject}</p>
    </div>
    <div class="content">
      ${imageUrlHtml}
      <p>${data.content.replace(/\n/g, '<br>')}</p>
      <div style="text-align: center; padding-top: 20px;">
        <a href="${data.ctaLink}" class="cta-button" target="_blank">${data.ctaText}</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      <p>This email was sent to you because you subscribed to our newsletter.</p>
    </div>
  </div>
</body>
</html>`;
};

export function NewsletterPreview({ data }: NewsletterPreviewProps) {
  const handleCopyHtml = () => {
    if (data) {
      const htmlContent = generateNewsletterHtml(data);
      navigator.clipboard.writeText(htmlContent)
        .then(() => {
          toast.success("Newsletter HTML copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy HTML: ", err);
          toast.error("Failed to copy HTML.");
        });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
        <CardTitle className="text-3xl font-bold text-center">{data?.title || 'Newsletter Preview'}</CardTitle>
        {data && <p className="text-center text-sm opacity-80 mt-2">Subject: {data.subject}</p>}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {data ? (
          <>
            {data.imageUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-lg">
                <img
                  src={data.imageUrl}
                  alt="Newsletter Image"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
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
            <div className="text-center mt-6">
              <Button onClick={handleCopyHtml} className="w-full">
                Copy HTML
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Fill out the form to see your newsletter preview here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}