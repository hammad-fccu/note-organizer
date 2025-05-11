'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FlashcardsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/app/practice-flashcards?tab=generate');
  }, [router]);
  
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen">
      <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting to new flashcards page...</p>
      <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
    </div>
  );
} 