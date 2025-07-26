"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react"; // Import icons

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
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner"; // Import toast for notifications

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }).max(100, {
    message: "Title must not exceed 100 characters.",
  }),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }).max(150, {
    message: "Subject must not exceed 150 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }).max(5000, {
    message: "Content must not exceed 5000 characters.",
  }),
  ctaText: z.string().min(1, {
    message: "CTA text is required.",
  }).max(50, {
    message: "CTA text must not exceed 50 characters.",
  }),
  ctaLink: z.string().url({
    message: "Must be a valid URL.",
  }),
  emails: z.array(z.string().email("Invalid email address.")).optional(), // Array of emails
  imageUrl: z.string().url("Invalid URL.").or(z.literal("")).optional(), // Optional image URL
  summarizeUrl: z.string().url("Invalid URL.").or(z.literal("")).optional(), // Optional URL for summarization
});

export type NewsletterFormData = z.infer<typeof formSchema>;

interface NewsletterFormProps {
  onFormChange: Dispatch<SetStateAction<NewsletterFormData | null>>;
}

export function NewsletterForm({ onFormChange }: NewsletterFormProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      ctaText: "Read More",
      ctaLink: "https://www.example.com",
      emails: [""], // Start with one empty email field
      imageUrl: "",
      summarizeUrl: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails",
  });

  // Watch for changes and update parent state
  form.watch((data) => {
    onFormChange(data as NewsletterFormData);
  });

  async function handleSummarize() {
    const urlToSummarize = form.getValues("summarizeUrl");
    if (!urlToSummarize) {
      toast.error("Please enter a URL to summarize.");
      return;
    }

    setIsSummarizing(true);
    toast.loading("Summarizing content...");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToSummarize }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize content.");
      }

      const data = await response.json();
      form.setValue("content", data.summary, { shouldValidate: true });
      toast.success("Content summarized successfully!");
    } catch (error: any) {
      console.error("Summarization error:", error);
      toast.error(error.message || "An unexpected error occurred during summarization.");
    } finally {
      setIsSummarizing(false);
    }
  }

  function onSubmit(values: NewsletterFormData) {
    // In a real app, you might send this data to a backend
    console.log(values);
    toast.success("Newsletter data submitted (console logged).");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Newsletter Title</FormLabel>
              <FormControl>
                <Input placeholder="Weekly Update" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Subject Line</FormLabel>
              <FormControl>
                <Input placeholder="Exciting News Inside!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* AI Summarization Section */}
        <div className="space-y-2 border p-4 rounded-md">
          <h3 className="text-lg font-semibold">AI Content Summarization</h3>
          <FormField
            control={form.control}
            name="summarizeUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL to Summarize</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/article" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="button" 
            onClick={handleSummarize} 
            disabled={isSummarizing || !form.getValues("summarizeUrl")}
            className="w-full"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Summarizing...
              </>
            ) : (
              "Summarize Content"
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Enter a URL and click "Summarize Content" to automatically fill the content field.
            (Requires backend setup for AI integration)
          </p>
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your newsletter content here..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Representative Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ctaText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call to Action Text</FormLabel>
              <FormControl>
                <Input placeholder="Click Here" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ctaLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call to Action Link</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://yourwebsite.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Email Inputs */}
        <div>
          <FormLabel>Recipient Emails</FormLabel>
          {fields.map((item, index) => (
            <FormField
              control={form.control}
              key={item.id}
              name={`emails.${index}`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 mb-2">
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1} // Disable remove if only one field
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append("")}
            className="w-full mt-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Email
          </Button>
        </div>

        <Button type="submit" className="w-full">Generate Newsletter</Button>
      </form>
    </Form>
  );
}