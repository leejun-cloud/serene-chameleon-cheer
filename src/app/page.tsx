"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  // Note: Newsletter history will be stored in-memory for now.
  // A database is required for persistent storage.
  const newsletterHistory: any[] = []; // Placeholder for history

  return (
    <>
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Newsletters</h1>
          <Button asChild>
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Newsletter
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {newsletterHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't created any newsletters yet.</p>
                <p className="text-sm mt-2">
                  (Database integration is required to save history permanently)
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {/* History items will be listed here */}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </>
  );
}