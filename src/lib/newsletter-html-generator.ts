import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { NewsletterFormData } from '@/components/newsletter-form';

interface AiStyles {
  card?: string;
  header?: string;
  mainTitle?: string;
  articleContainer?: string;
  articleTitle?: string;
  footer?: string;
}

export const generateNewsletterHtml = (
  newsletterData: NewsletterFormData,
  styles: AiStyles
): string => {
  const articlesHtml = newsletterData.articles
    .map(
      (article, index) => {
        const contentHtml = article.contentType === 'html'
          ? (article.content || '')
          : marked.parse(article.content || '');
        
        return `
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
              ${contentHtml}
            </div>
            ${article.url ? `
            <div style="margin-top: 1rem;">
              <a href="${article.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; text-decoration: none; color: #374151; font-size: 0.875rem;">
                기사 보기
              </a>
            </div>
            ` : ''}
          </div>
          ${index < newsletterData.articles.length - 1 ? '<hr class="my-6 border-gray-200" />' : ''}
        `
      }
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-T-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsletterData.newsletterTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
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
            <p>&copy; ${new Date().getFullYear()} <a href="#" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; color: #3b82f6;">Your Company</a>. All rights reserved.</p>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
};