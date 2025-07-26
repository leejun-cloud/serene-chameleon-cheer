"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Dispatch, SetStateAction } from "react";

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
});

export type NewsletterFormData = z.infer<typeof formSchema>;

interface NewsletterFormProps {
  onFormChange: Dispatch<SetStateAction<NewsletterFormData | null>>;
}

export function NewsletterForm({ onFormChange }: NewsletterFormProps) {
  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      ctaText: "Read More",
      ctaLink: "https://www.example.com",
    },
  });

  // Watch for changes and update parent state
  form.watch((data) => {
    onFormChange(data as NewsletterFormData);
  });

  function onSubmit(values: NewsletterFormData) {
    // In a real app, you might send this data to a backend
    console.log(values);
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
        <Button type="submit">Generate Newsletter</Button>
      </form>
    </Form>
  );
}