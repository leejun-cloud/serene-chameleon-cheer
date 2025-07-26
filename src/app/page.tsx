"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Eye, Edit, Trash2, Newspaper } from "lucide-react";
import { getNewsletters, deleteNewsletter, SavedNewsletter } from "@/lib/storage";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function HomePage() {
  const [newsletters, setNewsletters] = useState<SavedNewsletter[]>([]);

  useEffect(() => {
    setNewsletters(getNewsletters());
  }, []);

  const handleDelete = (id: string) => {
    deleteNewsletter(id);
    setNewsletters(getNewsletters());
    toast.success("Newsletter deleted successfully.");
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Newsletters</h1>
          <p className="text-muted-foreground">
            View, edit, or create new AI-powered newsletters.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {newsletters.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No newsletters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first newsletter.
          </p>
          <Button asChild className="mt-6">
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Newsletter
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsletters.map((newsletter) => (
            <Card key={newsletter.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate">{newsletter.newsletterTitle}</CardTitle>
                <CardDescription>
                  Last updated: {format(new Date(newsletter.updatedAt), "PPP p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Subject: {newsletter.newsletterSubject}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/view/${newsletter.id}`}>
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/create?id=${newsletter.id}`}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your newsletter.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(newsletter.id)}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <MadeWithDyad />
    </main>
  );
}