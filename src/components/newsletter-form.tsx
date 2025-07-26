"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Trash2, Loader2, Wand2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { toast } from "sonner";
import { saveNewsletter, SavedNewsletter } from "@/lib/storage";
import { useRouter } from "next/navigation";

const articleSchema = z.object({
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  title: z.string().optional(),
  content: z.string().optional(),
  contentType: z.enum(['markdown', 'html']).default('markdown'),
  imageUrl: z.string().optional(),
});

const formSchema = z.object({
  newsletterTitle: z.string().min(2, "Title is too short.").max(100),
  newsletterSubject: z.string().min(2, "Subject is too short.").max(150),
  articles: z.array(articleSchema).min(1, "Please add at least one article."),
});

export type NewsletterFormData = z.infer<typeof formSchema>;

interface NewsletterFormProps {
  onFormChange: Dispatch<SetStateAction<NewsletterFormData | null>>;
  initialData?: SavedNewsletter | null;
  newsletterId?: string | null;
}

export function NewsletterForm({ onFormChange, initialData, newsletterId }: NewsletterFormProps) {
  const [summarizingIndex, setSummarizingIndex] = useState<number | null>(null);
  const router = useRouter();

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newsletterTitle: "Weekly Digest",
      newsletterSubject: "Your weekly news update!",
      articles: [{ url: "", title: "", content: "", contentType: "markdown", imageUrl: "" }],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  const { watch } = form;
  useEffect(() => {
    const subscription = watch((value) => {
      onFormChange(value as NewsletterFormData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFormChange, form]);


  async function handleSummarize(index: number) {
    const url = form.getValues(`articles.${index}.url`);
    if (!url) {
      toast.error("Please enter a URL for the article first.");
      return;
    }

    setSummarizingIndex(index);
    const toastId = toast.loading(`Fetching content from article ${index + 1}...`);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize content.");
      }

      const data = await response.json();
      form.setValue(`articles.${index}.title`, data.title, { shouldValidate: true });
      form.setValue(`articles.${index}.content`, data.summary, { shouldValidate:true });
      form.setValue(`articles.${index}.contentType`, 'markdown');
      form.setValue(`articles.${index}.imageUrl`, data.imageUrl, { shouldValidate: true });
      
      toast.success(`Article ${index + 1} summarized successfully!`, { id: toastId });
    } catch (error: any) {
      console.error("Summarization error:", error);
      toast.error(error.message || "An unexpected error occurred.", { id: toastId });
    } finally {
      setSummarizingIndex(null);
    }
  }

  function onSubmit(values: NewsletterFormData) {
    try {
      saveNewsletter(values, newsletterId || undefined);
      toast.success(`Newsletter ${newsletterId ? 'updated' : 'saved'} successfully!`);
      router.push('/');
      router.refresh(); // To ensure the homepage list is updated
    } catch (error) {
      toast.error("Failed to save newsletter.");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form id="newsletter-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
           <FormField
            control={form.control}
            name="newsletterTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Newsletter Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Weekly Tech Digest" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newsletterSubject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Subject Line</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Your Weekly Update is Here!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Articles</h3>
          <div className="space-y-6">
            {fields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
                <FormLabel className="font-semibold">Article {index + 1}</FormLabel>
                <FormField
                  control={form.control}
                  name={`articles.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (Optional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com/article" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => handleSummarize(index)}
                    disabled={summarizingIndex !== null || !watch(`articles.${index}.url`)}
                    className="w-full"
                  >
                    {summarizingIndex === index ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    가져오기 및 요약
                  </Button>
                  <Button 
                    variant="outline" 
                    asChild
                    className="w-full"
                    disabled={!watch(`articles.${index}.url`)}
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
                </div>
                <FormField
                  control={form.control}
                  name={`articles.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input placeholder="Article title appears here" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>기사 작성</FormLabel>
                  <div className="flex items-center gap-2 my-2">
                    <Button
                      type="button"
                      variant={watch(`articles.${index}.contentType`) === 'markdown' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => form.setValue(`articles.${index}.contentType`, 'markdown')}
                    >
                      Markdown
                    </Button>
                    <Button
                      type="button"
                      variant={watch(`articles.${index}.contentType`) === 'html' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => form.setValue(`articles.${index}.contentType`, 'html')}
                    >
                      HTML
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`articles.${index}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={
                              watch(`articles.${index}.contentType`) === 'markdown'
                                ? "마크다운을 사용하여 기사 내용을 작성하세요. 이미지: ![](image_url)"
                                : "HTML을 사용하여 기사 내용을 작성하세요."
                            }
                            className="min-h-[200px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`articles.${index}.imageUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl><Input placeholder="Image URL appears here" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2"
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ url: "", title: "", content: "", contentType: "markdown", imageUrl: "" })}
            className="w-full mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> 다른 기사 추가
          </Button>
        </div>
      </form>
    </Form>
  );
}