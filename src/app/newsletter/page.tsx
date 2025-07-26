"use client";

import { useState } from "react";
import { NewsletterForm, NewsletterFormData } from "@/components/newsletter-form";
import { NewsletterPreview } from "@/components/newsletter-preview";
import { Separator } from "@/components/ui/separator";

export default function NewsletterCreatorPage() {
  const [formData, setFormData] = useState<NewsletterFormData | null>(null);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Newsletter Creator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">Create Your Newsletter</h2>
          <NewsletterForm onFormChange={setFormData} />
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
          <NewsletterPreview data={formData} />
        </div>
      </div>
    </div>
  );
}