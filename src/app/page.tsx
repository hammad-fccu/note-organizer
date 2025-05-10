'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  
  // Check if user is logged in (stub function for now)
  const isLoggedIn = false;

  useEffect(() => {
    // Redirect logged-in users to /app
    if (isLoggedIn) {
      router.push('/app');
    }
  }, [isLoggedIn, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Smart Note Organizer</h1>
        <ThemeToggle />
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Organize your notes with AI
          </h2>
          <p className="text-xl max-w-2xl mb-8 text-gray-600 dark:text-gray-300">
            Import PDFs and notes, get AI-powered summaries, automatic tagging, and create Anki-style flashcards.
          </p>
          <p className="text-green-600 dark:text-green-400 mb-8 font-medium">
            No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={() => alert('Sign up functionality would go here')}
            >
              Sign Up
            </button>
            <button 
              className="px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => alert('Sign in functionality would go here')}
            >
              Sign In
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-3">PDF & Rich-text Import</h3>
            <p className="text-gray-600 dark:text-gray-300">Import your documents and extract text with OCR technology.</p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-3">AI-Powered Organization</h3>
            <p className="text-gray-600 dark:text-gray-300">Automatic tagging, linking, and summarization with OpenAI.</p>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Flashcard Export</h3>
            <p className="text-gray-600 dark:text-gray-300">Create Anki-style flashcards from your notes for better retention.</p>
          </div>
        </div>
      </main>
      
      <footer className="p-4 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Smart Note Organizer. All rights reserved.</p>
      </footer>
    </div>
  );
}
