"use client";

import { useState, useEffect } from 'react';
import { NewsletterForm, NewsletterFormData } from '@/components/newsletter-form';
import { NewsletterPreview } from '@/components/newsletter-preview';

export default function Home() {
  const [formData, setFormData] = useState<NewsletterFormData | null>(null);
  const [apiKey, setApiKey] = useState("");

  // Load API key from local storage on initial render
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Save API key to local storage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("geminiApiKey", apiKey);
    } else {
      localStorage.removeItem("geminiApiKey");
    }
  }, [apiKey]);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">AI Newsletter Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create beautiful newsletters in minutes. Just drop in article links and let AI do the rest.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="lg:sticky top-8">
          <NewsletterForm 
            onFormChange={setFormData} 
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        </div>
        <NewsletterPreview data={formData} apiKey={apiKey} />
      </div>
    </main>
  );
}