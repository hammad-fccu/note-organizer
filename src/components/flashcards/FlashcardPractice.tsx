'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFlashcards } from '@/store/FlashcardStore';
import { GradeType } from '@/types/flashcards';

// Keyboard shortcut mapping
const KEYBOARD_SHORTCUTS = {
  flip: ['Space', 'Enter'],
  next: ['ArrowRight'],
  prev: ['ArrowLeft'],
  again: ['1', 'KeyA'],
  hard: ['2', 'KeyH'],
  good: ['3', 'KeyG'],
  easy: ['4', 'KeyE'],
  skip: ['KeyS'],
};

export default function FlashcardPractice() {
  const { 
    reviewCards, 
    currentIndex, 
    isFlipped, 
    session,
    flipCard, 
    nextCard, 
    prevCard, 
    skipCard, 
    gradeCard 
  } = useFlashcards();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.code;
    setActiveKey(key);
    
    // Clear the active key after a short delay
    setTimeout(() => setActiveKey(null), 200);
    
    if (KEYBOARD_SHORTCUTS.flip.includes(key)) {
      event.preventDefault();
      flipCard();
    } else if (KEYBOARD_SHORTCUTS.next.includes(key)) {
      event.preventDefault();
      nextCard();
    } else if (KEYBOARD_SHORTCUTS.prev.includes(key)) {
      event.preventDefault();
      prevCard();
    } else if (KEYBOARD_SHORTCUTS.skip.includes(key)) {
      event.preventDefault();
      skipCard();
    }
    
    // Grade card shortcuts (only when flipped)
    if (isFlipped) {
      if (KEYBOARD_SHORTCUTS.again.includes(key)) {
        event.preventDefault();
        gradeCard('again');
      } else if (KEYBOARD_SHORTCUTS.hard.includes(key)) {
        event.preventDefault();
        gradeCard('hard');
      } else if (KEYBOARD_SHORTCUTS.good.includes(key)) {
        event.preventDefault();
        gradeCard('good');
      } else if (KEYBOARD_SHORTCUTS.easy.includes(key)) {
        event.preventDefault();
        gradeCard('easy');
      }
    }
  }, [isFlipped, flipCard, nextCard, prevCard, skipCard, gradeCard]);
  
  // Set up keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // No cards to review
  if (!reviewCards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-6 text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">No cards to review</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Import cards from your notes or add a deck to get started.
        </p>
      </div>
    );
  }
  
  const currentCard = reviewCards[currentIndex];
  
  // Calculate progress
  const progress = session ? Math.round((session.cardsReviewed / (session.cardsReviewed + session.cardsRemaining)) * 100) : 0;
  
  return (
    <div className="h-full flex flex-col">
      {/* Progress Header - Fixed at top */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">Flashcards</h1>
          <div className="flex items-center gap-2">
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Keyboard shortcuts"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Card {currentIndex + 1} / {reviewCards.length}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          ></div>
        </div>
        
        {/* Keyboard Shortcuts Panel */}
        {showKeyboardShortcuts && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm border border-gray-200 dark:border-gray-600">
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
              <div className="flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Space</kbd>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Flip card</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">←</kbd>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Previous card</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">→</kbd>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Next card</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">S</kbd>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Skip card</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">1-4</kbd>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Grade card</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Card Container with fixed padding */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full py-8 flex flex-col items-center">
          {/* Flashcard */}
          <div
            className={`w-full max-w-xl aspect-[3/2] cursor-pointer rounded-xl mb-8 ${
              isTransitioning ? 'pointer-events-none' : ''
            }`}
            onClick={() => {
              setIsTransitioning(true);
              flipCard();
              setTimeout(() => setIsTransitioning(false), 400);
            }}
            style={{
              perspective: '1000px',
            }}
            aria-label={isFlipped ? "Click to see question" : "Click to see answer"}
          >
            <div
              className={`relative w-full h-full transition-transform duration-400 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              aria-live="polite"
            >
              {/* Card Front */}
              <div
                className={`absolute w-full h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg p-6 flex flex-col backface-hidden ${
                  isFlipped ? 'hidden' : ''
                }`}
              >
                <div className="flex-1 flex items-center justify-center overflow-auto">
                  <div className="text-xl text-center">{currentCard.front}</div>
                </div>
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Click to flip or press Space
                </div>
              </div>
              
              {/* Card Back */}
              <div
                className={`absolute w-full h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg p-6 flex flex-col backface-hidden rotate-y-180 ${
                  !isFlipped ? 'hidden' : ''
                }`}
              >
                <div className="flex-1 flex items-center justify-center overflow-auto">
                  <div className="text-xl text-center">{currentCard.back}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card counters */}
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {currentCard.reviewCount} reviews
            </div>
            {currentCard.nextInterval && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Next review: {new Date(currentCard.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          {/* Navigation Controls */}
          <div className="flex w-full max-w-xl justify-between mb-6">
            <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center ${
                activeKey === 'ArrowLeft' ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              aria-label="Previous card"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="ml-1 hidden sm:inline">Previous</span>
            </button>
            
            <button
              onClick={skipCard}
              className={`px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center ${
                activeKey === 'KeyS' ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              aria-label="Skip card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Skip
            </button>
            
            <button
              onClick={nextCard}
              disabled={currentIndex >= reviewCards.length - 1}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center ${
                activeKey === 'ArrowRight' ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              aria-label="Next card"
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Grading Controls - Only shown when card is flipped */}
          {isFlipped && (
            <div className="w-full max-w-xl grid grid-cols-4 gap-2">
              <GradeButton grade="again" active={activeKey === '1' || activeKey === 'KeyA'} onClick={() => gradeCard('again')} />
              <GradeButton grade="hard" active={activeKey === '2' || activeKey === 'KeyH'} onClick={() => gradeCard('hard')} />
              <GradeButton grade="good" active={activeKey === '3' || activeKey === 'KeyG'} onClick={() => gradeCard('good')} />
              <GradeButton grade="easy" active={activeKey === '4' || activeKey === 'KeyE'} onClick={() => gradeCard('easy')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GradeButtonProps {
  grade: GradeType;
  active?: boolean;
  onClick: () => void;
}

function GradeButton({ grade, active = false, onClick }: GradeButtonProps) {
  const colors = {
    again: {
      default: 'bg-red-500 hover:bg-red-600 text-white',
      active: 'bg-red-600 ring-4 ring-red-200 dark:ring-red-900/30 text-white',
    },
    hard: {
      default: 'bg-orange-500 hover:bg-orange-600 text-white',
      active: 'bg-orange-600 ring-4 ring-orange-200 dark:ring-orange-900/30 text-white',
    },
    good: {
      default: 'bg-green-500 hover:bg-green-600 text-white',
      active: 'bg-green-600 ring-4 ring-green-200 dark:ring-green-900/30 text-white',
    },
    easy: {
      default: 'bg-blue-500 hover:bg-blue-600 text-white',
      active: 'bg-blue-600 ring-4 ring-blue-200 dark:ring-blue-900/30 text-white',
    },
  };
  
  const labels = {
    again: '1) Again',
    hard: '2) Hard',
    good: '3) Good',
    easy: '4) Easy',
  };
  
  const descriptions = {
    again: 'Forgot completely',
    hard: 'Difficult to recall',
    good: 'Answered correctly',
    easy: 'Very easy to recall',
  };
  
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-md font-medium transition-all ${active ? colors[grade].active : colors[grade].default}`}
      aria-label={`Grade as ${grade}`}
    >
      <div className="text-sm">{labels[grade]}</div>
      <div className="text-xs opacity-80 hidden sm:block">{descriptions[grade]}</div>
    </button>
  );
}

// Add these styles to support 3D card flip animation
const styles = `
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .duration-400 {
    transition-duration: 400ms;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 