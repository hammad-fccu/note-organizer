'use client';

import { SessionProvider } from 'next-auth/react';
import { NoteProvider } from '@/store/NoteStore';
import { FlashcardProvider } from '@/store/FlashcardStore';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NoteProvider>
        <FlashcardProvider>
          {children}
        </FlashcardProvider>
      </NoteProvider>
    </SessionProvider>
  );
} 