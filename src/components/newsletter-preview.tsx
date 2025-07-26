import React, { useState } from 'react';
import { NewsletterFormData } from './newsletter-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Wand2, Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ... (기존 인터페이스 유지)

export function NewsletterPreview({ data, isReadOnly = false }: NewsletterPreviewProps) {
  // ... (기존 상태 및 함수 유지)

  return (
    <Card className={cn("w-full max-w-2xl mx-auto shadow-lg", aiStyles.card)}>
      {/* ... (기존 헤더 유지) */}
      <CardContent className="p-6 space-y-8">
        {data.articles && data.articles.map((article, index) => (
          <div key={index} className={cn(aiStyles.articleContainer)}>
            {/* ... (기존 이미지 및 제목 유지) */}
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{article.summary}</p>
            </div>
            
            {/* 기사 보기 버튼 추가 */}
            {article.url && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="w-full sm:w-auto"
                >
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    기사 보기
                  </a>
                </Button>
              </div>
            )}

            {index < data.articles.length - 1 && <Separator className="my-8" />}
          </div>
        ))}
        
        {/* ... (기존 푸터 유지) */}
      </CardContent>
      {/* ... (기존 푸터 섹션 유지) */}
    </Card>
  );
}