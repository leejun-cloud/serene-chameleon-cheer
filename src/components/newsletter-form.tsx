"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Trash2, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const articleSchema = z.object({
  url: z.string().url("Please enter a valid URL."),
  title: z.string().optional(),
  summary: z.string().optional(),
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
}

export function NewsletterForm({ onFormChange }: NewsletterFormProps) {
  const [summarizingIndex, setSummarizingIndex] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newsletterTitle: "Weekly Digest",
      newsletterSubject: "Your weekly news update!",
      articles: [{ url: "", title: "", summary: "", imageUrl: "" }],
    },
  });

  // Load API key from local storage on initial render
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save API key to local storage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("geminiApiKey", apiKey);
    } else {
      // If user clears the input, remove it from storage
      localStorage.removeItem("geminiApiKey");
    }
  }, [apiKey]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  // This is the correct way to subscribe to form changes and update the parent
  // without causing an infinite loop.
  const { watch } = form;
  useEffect(() => {
    // Set initial data for the preview on first render
    onFormChange(form.getValues());
    
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

    if (!apiKey) {
      toast.error("Please enter your Google Gemini API Key before summarizing.");
      return;
    }

    setSummarizingIndex(index);
    const toastId = toast.loading(`Fetching content from article ${index + 1}...`);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize content.");
      }

      const data = await response.json();
      form.setValue(`articles.${index}.title`, data.title, { shouldValidate: true });
      form.setValue(`articles.${index}.summary`, data.summary, { shouldValidate:true });
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
    console.log(values);
    toast.success("Newsletter ready! (Data logged to console)");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <FormItem>
            <FormLabel>Google Gemini API Key</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Enter your API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Your key is stored in your browser for convenience and is not sent to our servers.
            </FormDescription>
          </FormItem>
          <Separator />
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
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com/article" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => handleSummarize(index)}
                  disabled={summarizingIndex !== null}
                  className="w-full"
                >
                  {summarizingIndex === index ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Fetch & Summarize Article
                </Button>
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
                <FormField
                  control={form.control}
                  name={`articles.${index}.summary`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl><Textarea placeholder="Article summary appears here" className="min-h-[100px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`articles.${index}.imageUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
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
            onClick={() => append({ url: "", title: "", summary: "", imageUrl: "" })}
            className="w-full mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Article
          </Button>
        </div>
        
        <Separator />

        <Button type="submit" className="w-full text-lg py-6">Generate Newsletter</Button>
      </form>
    </Form>
  );
}