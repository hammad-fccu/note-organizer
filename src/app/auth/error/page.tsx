'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function AuthError() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('An error occurred during authentication.');
  
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error === 'CredentialsSignin') {
      setErrorMessage('Invalid email or password.');
    } else if (error) {
      setErrorMessage(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
      <header className="flex justify-between items-center p-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-2xl font-bold">Smart Note Organizer</Link>
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            
            <h1 className="mt-4 text-2xl font-bold text-red-600 dark:text-red-400">Authentication Error</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{errorMessage}</p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/auth/signin" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Signing In Again
            </Link>
            
            <Link 
              href="/" 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="p-4 text-center text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Smart Note Organizer</p>
      </footer>
    </div>
  );
} 