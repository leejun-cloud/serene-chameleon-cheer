"use client";

import { useState } from "react";
import { NewsletterForm, NewsletterFormData } from "@/components/newsletter-form";
import { NewsletterPreview } from "@/components/newsletter-preview";

export default function NewsletterCreatorPage() {
  const [formData, setFormData] = useState<NewsletterFormData | null>(null);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-center mb-2">Create a New Newsletter</h1>
      <p className="text-center text-muted-foreground mb-8">
        Add articles by URL, let AI summarize them, and see a live preview.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="lg:col-span-1">
          <NewsletterForm onFormChange={setFormData} />
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4 text-center">Live Preview</h2>
          <NewsletterPreview data={formData} />
        </div>
      </div>
    </div>
  );
}