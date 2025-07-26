"use client";

import { useState, useEffect } from 'react';
import { NewsletterPreview } from '@/components/newsletter-preview';
import { getNewsletterById, SavedNewsletter } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ViewNewsletterPage({ params }: { params: { id: string } }) {
  const [newsletter, setNewsletter] = useState<SavedNewsletter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const data = getNewsletterById(params.id);
      setNewsletter(data || null);
    }
    setIsLoading(false);
  }, [params.id]);

  if (isLoading) {
    return <Skeleton className="w-full max-w-2xl h-[80vh] mx-auto mt-8" />
  }

  if (!newsletter) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Newsletter not found</h1>
        <p className="text-muted-foreground">The requested newsletter does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="bg-muted/20 min-h-screen py-8">
      <div className="container mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Newsletters
            </Link>
          </Button>
        </div>
        <NewsletterPreview data={newsletter} isReadOnly={true} />
      </div>
    </main>
  );
}