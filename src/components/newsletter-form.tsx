// ... (기존 imports 유지)
import { ExternalLink } from 'lucide-react';

// ... (기존 코드 유지)

export function NewsletterForm({ onFormChange, initialData, newsletterId }: NewsletterFormProps) {
  // ... (기존 코드 유지)

  return (
    <Form {...form}>
      {/* ... (기존 폼 헤더 유지) */}
      <div>
        {/* ... (기존 아티클 필드 유지) */}
        {fields.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
            {/* ... (기존 필드들 유지) */}
            
            {/* 기사 보기 버튼 추가 */}
            {watch(`articles.${index}.url`) && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="w-full"
              >
                <a 
                  href={watch(`articles.${index}.url`)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  기사 보기
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </Form>
  );
}