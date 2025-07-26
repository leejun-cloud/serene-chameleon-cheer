"use client";

import { NewsletterFormData } from "@/components/newsletter-form";

export interface SavedNewsletter extends NewsletterFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "ai-newsletters";

// Helper to safely access localStorage
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

export const getNewsletters = (): SavedNewsletter[] => {
  const storage = getLocalStorage();
  if (!storage) return [];
  const data = storage.getItem(STORAGE_KEY);
  try {
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const getNewsletterById = (id: string): SavedNewsletter | undefined => {
  const newsletters = getNewsletters();
  return newsletters.find((n) => n.id === id);
};

export const saveNewsletter = (data: NewsletterFormData, id?: string): SavedNewsletter => {
  const storage = getLocalStorage();
  if (!storage) throw new Error("localStorage is not available.");

  const newsletters = getNewsletters();
  const now = new Date().toISOString();

  if (id) {
    // Update existing
    const index = newsletters.findIndex((n) => n.id === id);
    if (index !== -1) {
      const updatedNewsletter = { ...newsletters[index], ...data, updatedAt: now };
      newsletters[index] = updatedNewsletter;
      storage.setItem(STORAGE_KEY, JSON.stringify(newsletters));
      return updatedNewsletter;
    }
  }

  // Create new
  const newNewsletter: SavedNewsletter = {
    ...data,
    id: self.crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  newsletters.unshift(newNewsletter); // Add to the beginning
  storage.setItem(STORAGE_KEY, JSON.stringify(newsletters));
  return newNewsletter;
};

export const deleteNewsletter = (id: string): void => {
  const storage = getLocalStorage();
  if (!storage) return;

  let newsletters = getNewsletters();
  newsletters = newsletters.filter((n) => n.id !== id);
  storage.setItem(STORAGE_KEY, JSON.stringify(newsletters));
};