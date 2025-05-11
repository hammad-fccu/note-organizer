import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FlashcardReview, GradeType, ReviewResult, ReviewSession } from '@/types/flashcards';

interface FlashcardContextType {
  // Flashcard practice functions
  reviewCards: FlashcardReview[];
  currentIndex: number;
  session: ReviewSession | null;
  isFlipped: boolean;
  loadPracticeCards: (cards: FlashcardReview[]) => void;
  startSession: () => void;
  endSession: () => ReviewSession | null;
  gradeCard: (grade: GradeType) => void;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  skipCard: () => void;
  importCardsFromText: (text: string) => FlashcardReview[];
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export function useFlashcards() {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}

interface FlashcardProviderProps {
  children: ReactNode;
}

// Simple SRS algorithm to calculate next interval
const calculateNextInterval = (grade: GradeType, currentInterval?: number): number => {
  const baseInterval = currentInterval || 86400000; // 1 day in ms as default
  
  switch (grade) {
    case 'again': 
      return 86400000 / 4; // 6 hours
    case 'hard': 
      return baseInterval * 1.2;
    case 'good': 
      return baseInterval * 2.5;
    case 'easy': 
      return baseInterval * 4;
    default:
      return baseInterval;
  }
};

export function FlashcardProvider({ children }: FlashcardProviderProps) {
  const [reviewCards, setReviewCards] = useState<FlashcardReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Load practice cards
  const loadPracticeCards = (cards: FlashcardReview[]) => {
    setReviewCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };
  
  // Start a new practice session
  const startSession = () => {
    const newSession: ReviewSession = {
      id: uuidv4(),
      startedAt: new Date().toISOString(),
      cardsReviewed: 0,
      cardsRemaining: reviewCards.length,
      results: []
    };
    setSession(newSession);
    setStartTime(Date.now());
  };
  
  // End the current session and return stats
  const endSession = () => {
    // Save to localStorage if needed
    if (session) {
      localStorage.setItem(`flashcard_session_${session.id}`, JSON.stringify(session));
    }
    return session;
  };
  
  // Grade the current card
  const gradeCard = (grade: GradeType) => {
    if (!session || currentIndex >= reviewCards.length) return;
    
    const currentCard = reviewCards[currentIndex];
    const reviewTime = Date.now() - startTime;
    
    // Calculate next interval
    const nextInterval = calculateNextInterval(grade, currentCard.nextInterval);
    const nextDueDate = new Date(Date.now() + nextInterval).toISOString();
    
    // Create a result for this review
    const result: ReviewResult = {
      cardId: currentCard.id,
      grade,
      reviewTime,
      reviewedAt: new Date().toISOString()
    };
    
    // Update the session
    const updatedSession = {
      ...session,
      cardsReviewed: session.cardsReviewed + 1,
      cardsRemaining: session.cardsRemaining - 1,
      results: [...session.results, result]
    };
    
    // Update the card with new review data
    const updatedCards = [...reviewCards];
    updatedCards[currentIndex] = {
      ...currentCard,
      dueDate: nextDueDate,
      reviewCount: currentCard.reviewCount + 1,
      lastReviewed: new Date().toISOString(),
      nextInterval
    };
    
    setSession(updatedSession);
    setReviewCards(updatedCards);
    nextCard();
  };
  
  // Card interaction functions
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };
  
  const nextCard = () => {
    if (currentIndex < reviewCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setStartTime(Date.now());
    }
  };
  
  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setStartTime(Date.now());
    }
  };
  
  const skipCard = () => {
    if (currentIndex >= reviewCards.length - 1) return;
    
    // Move current card to the end
    const updatedCards = [...reviewCards];
    const currentCard = updatedCards.splice(currentIndex, 1)[0];
    updatedCards.push(currentCard);
    
    setReviewCards(updatedCards);
    setIsFlipped(false);
    setStartTime(Date.now());
    // We don't increment currentIndex because we just shifted everything
  };
  
  // Import flashcards from text (compatible with the export format)
  const importCardsFromText = (text: string): FlashcardReview[] => {
    // Parse the text format (assuming format: Q: question\nA: answer\n\n)
    const cards: FlashcardReview[] = [];
    const pairs = text.split('\n\n').filter(pair => pair.trim());
    
    for (const pair of pairs) {
      const lines = pair.split('\n');
      let front = '';
      let back = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Q:')) {
          front = line.substring(2).trim();
        } else if (line.startsWith('A:')) {
          back = line.substring(2).trim();
        }
      }
      
      if (front && back) {
        cards.push({
          id: uuidv4(),
          front,
          back,
          tags: [],
          dueDate: new Date().toISOString(), 
          reviewCount: 0
        });
      }
    }
    
    return cards;
  };
  
  const value = {
    reviewCards,
    currentIndex,
    session,
    isFlipped,
    loadPracticeCards,
    startSession,
    endSession,
    gradeCard,
    flipCard,
    nextCard,
    prevCard,
    skipCard,
    importCardsFromText
  };
  
  return <FlashcardContext.Provider value={value}>{children}</FlashcardContext.Provider>;
} 