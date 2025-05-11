'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  
  useEffect(() => {
    // Redirect logged-in users to /app
    if (session) {
      router.push('/app');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Notematic</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {!isLoading && !session && (
            <div className="flex space-x-2">
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 pb-1">
              Organize your notes with AI
            </h2>
            <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-600 dark:text-gray-300">
              Import PDFs and notes, get AI-powered summaries, automatic tagging, and create Anki-style flashcards.
            </p>
            <p className="text-green-600 dark:text-green-400 mb-8 font-medium">
              No credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup" 
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl inline-block"
              >
                Sign Up Free
              </Link>
              <Link 
                href="/auth/signin" 
                className="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors inline-block"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Students and Researchers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">PDF & Rich-text Import</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Import your PDFs, including scanned documents. Our OCR technology makes even handwritten notes searchable.</p>
                <ul className="text-gray-600 dark:text-gray-300 list-disc list-inside text-sm">
                  <li>Support for PDF and text files</li>
                  <li>OCR for scanned documents</li>
                  <li>Extract text from images</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">AI-Powered Organization</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Automatic tagging, linking between related notes, and AI-generated summaries to quickly grasp key points.</p>
                <ul className="text-gray-600 dark:text-gray-300 list-disc list-inside text-sm">
                  <li>Automatic topic detection</li>
                  <li>Smart linking of related concepts</li>
                  <li>Concise 2-3 sentence summaries</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Flashcard Export</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Create Anki-style flashcards from your notes for better retention. Perfect for exam preparation.</p>
                <ul className="text-gray-600 dark:text-gray-300 list-disc list-inside text-sm">
                  <li>Anki-compatible JSON export</li>
                  <li>Automatic Q&A generation</li>
                  <li>Track study progress</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Global Search Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Find Anything in Seconds</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our powerful global search helps you find any information across all your notes, 
                tags, and summaries in one unified interface.
              </p>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Search across all your notes at once
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Filter by tags, dates, or content type
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Find related notes with smart suggestions
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <div className="flex space-x-2 items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto font-medium text-sm">Search Demo</div>
                </div>
                <div className="p-4">
                  <div className="relative mb-4">
                    <input 
                      type="text" 
                      placeholder="Search your notes..."
                      value="photosynthesis"
                      readOnly
                      className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Biology - Photosynthesis</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Yesterday</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Process by which green plants and some other organisms convert light energy into chemical energy...</p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Plant Cells & Photosynthesis</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">2 days ago</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Chloroplasts are the site of photosynthesis. They contain chlorophyll which absorbs light energy...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Final CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-400 to-purple-400 text-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform how you organize your notes?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of students and researchers who've improved their productivity.</p>
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl inline-block"
            >
              Get Started - It's Free!
            </Link>
            <p className="mt-4 text-sm opacity-80">No credit card required. Start organizing today.</p>
          </div>
        </section>
      </main>
      
      <footer className="p-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center text-gray-600 dark:text-gray-400">
        <div className="max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} Notematic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
