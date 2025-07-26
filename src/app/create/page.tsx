"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from "react";
import { NewsletterForm, NewsletterFormData } from "@/components/newsletter-form";
import { NewsletterPreview } from "@/components/newsletter-preview";
import { getNewsletterById, SavedNewsletter } from "@/lib/storage";
import { Skeleton } from '@/components/ui/skeleton';

function NewsletterCreator() {
  const searchParams = useSearchParams();
  const newsletterId = searchParams.get('id');
  
  const [initialData, setInitialData] = useState<SavedNewsletter | null>(null);
  const [formData, setFormData] = useState<NewsletterFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (newsletterId) {
      const data = getNewsletterById(newsletterId);
      if (data) {
        setInitialData(data);
        setFormData(data);
      }
    } else {
      // For new newsletters, initialize with default form data for preview
      setFormData({
        newsletterTitle: "Weekly Digest",
        newsletterSubject: "Your weekly news update!",
        articles: [{ url: "" }],
      });
    }
    setIsLoading(false);
  }, [newsletterId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-center mb-2">
        {newsletterId ? "Edit Newsletter" : "Create a New Newsletter"}
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        {newsletterId ? "Modify your existing newsletter." : "Add articles by URL, let AI summarize them, and see a live preview."}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="lg:col-span-1">
          <NewsletterForm 
            onFormChange={setFormData} 
            initialData={initialData}
            newsletterId={newsletterId}
          />
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4 text-center">Live Preview</h2>
          <NewsletterPreview data={formData} />
        </div>
      </div>
    </div>
  );
}

export default function NewsletterCreatorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsletterCreator />
    </Suspense>
  );
}