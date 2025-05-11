'use client';

import { useState, useEffect } from 'react';
import { useFlashcards } from '@/store/FlashcardStore';
import FlashcardPractice from '@/components/flashcards/FlashcardPractice';
import ImportDeck from '@/components/flashcards/ImportDeck';
import { FlashcardReview } from '@/types/flashcards';
import { v4 as uuidv4 } from 'uuid';

enum PracticeMode {
  IMPORT = 'import',
  PRACTICE = 'practice'
}

export default function PracticeFlashcardsPage() {
  const { reviewCards, loadPracticeCards, startSession, endSession } = useFlashcards();
  const [mode, setMode] = useState<PracticeMode>(PracticeMode.IMPORT);
  const [savedDecks, setSavedDecks] = useState<{[key: string]: FlashcardReview[]}>({});
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('decks');
  
  // Load saved flashcards from localStorage
  useEffect(() => {
    const loadSavedDecks = () => {
      try {
        setIsLoading(true);
        const savedDecksJSON = localStorage.getItem('practice_flashcard_decks');
        if (savedDecksJSON) {
          const parsedDecks = JSON.parse(savedDecksJSON);
          setSavedDecks(parsedDecks);
        }
      } catch (error) {
        console.error('Failed to load saved decks', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedDecks();
  }, []);
  
  // Save decks to localStorage when they change
  useEffect(() => {
    if (Object.keys(savedDecks).length > 0) {
      localStorage.setItem('practice_flashcard_decks', JSON.stringify(savedDecks));
    }
  }, [savedDecks]);
  
  // Handle import of new cards
  const handleImportCards = (cards: FlashcardReview[]) => {
    if (!cards.length || !cards[0].deckId) return;
    
    const deckId = cards[0].deckId;
    setSavedDecks(prevDecks => ({
      ...prevDecks,
      [deckId]: cards
    }));
    
    // Optionally switch to practice mode right away
    setSelectedDeck(deckId);
    handleStartPractice(deckId);
  };
  
  // Start practicing with a specific deck
  const handleStartPractice = (deckId: string) => {
    const deckToLoad = savedDecks[deckId];
    if (deckToLoad && deckToLoad.length > 0) {
      loadPracticeCards(deckToLoad);
      startSession();
      setMode(PracticeMode.PRACTICE);
      setSelectedDeck(deckId);
    }
  };
  
  // End current practice session and return to deck selection
  const handleEndPractice = () => {
    const sessionResult = endSession();
    if (sessionResult) {
      // Update stats in the savedDecks
      if (selectedDeck && sessionResult.results.length > 0) {
        const updatedDeck = [...reviewCards];
        setSavedDecks(prevDecks => ({
          ...prevDecks,
          [selectedDeck]: updatedDeck
        }));
      }
    }
    setMode(PracticeMode.IMPORT);
  };
  
  // Delete a deck
  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck?')) {
      setSavedDecks(prevDecks => {
        const newDecks = { ...prevDecks };
        delete newDecks[deckId];
        return newDecks;
      });
    }
  };
  
  // Get the total count of cards across all decks
  const getTotalCardCount = () => {
    return Object.values(savedDecks).reduce((total, deck) => total + deck.length, 0);
  };
  
  // Get formatted date for the next review
  const getNextReviewDate = (cards: FlashcardReview[]) => {
    if (!cards || cards.length === 0) return null;
    
    // Find the earliest due date
    const earliest = cards.reduce((min, card) => {
      const cardDate = new Date(card.dueDate).getTime();
      return cardDate < min ? cardDate : min;
    }, Number.MAX_SAFE_INTEGER);
    
    if (earliest === Number.MAX_SAFE_INTEGER) return null;
    
    const date = new Date(earliest);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Format as "Today", "Tomorrow", or date
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="h-full">
      {mode === PracticeMode.IMPORT ? (
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold">Flashcards</h1>
            
            {/* Stats */}
            {!isLoading && Object.keys(savedDecks).length > 0 && (
              <div className="flex gap-4 text-sm">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-500 px-3 py-1 rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {Object.keys(savedDecks).length} Decks
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-500 px-3 py-1 rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {getTotalCardCount()} Cards
                </div>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button 
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'decks'
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-transparent'
                  }`}
                  onClick={() => setActiveTab('decks')}
                >
                  Your Flashcard Decks
                  {Object.keys(savedDecks).length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                      {Object.keys(savedDecks).length}
                    </span>
                  )}
                </button>
              </li>
              <li className="mr-2">
                <button 
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === 'import' 
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-transparent'
                  }`}
                  onClick={() => setActiveTab('import')}
                >
                  Import New Deck
                </button>
              </li>
            </ul>
          </div>
          
          {/* Tab Content */}
          <div className="mt-6">
            {/* Import Tab */}
            {activeTab === 'import' && (
              <div>
                <div id="import-deck-container">
                  <ImportDeck onImport={handleImportCards} />
                </div>
              </div>
            )}
            
            {/* Decks Tab */}
            {activeTab === 'decks' && (
              <div>
                {isLoading ? (
                  // Loading state
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow animate-pulse">
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : Object.keys(savedDecks).length > 0 ? (
                  // Deck grid
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(savedDecks).map(([deckId, cards]) => {
                      const nextReview = getNextReviewDate(cards);
                      const totalReviews = cards.reduce((sum, card) => sum + card.reviewCount, 0);
                      
                      return (
                        <div
                          key={deckId}
                          className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-medium text-lg">
                              {deckId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </h3>
                            <button 
                              onClick={() => handleDeleteDeck(deckId)} 
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="Delete deck"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {cards.length} cards
                            </div>
                            
                            {totalReviews > 0 && (
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {totalReviews} reviews
                              </div>
                            )}
                          </div>
                          
                          {nextReview && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Next review: {nextReview}
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleStartPractice(deckId)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Practice Now
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Empty state
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Flashcard Decks Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Switch to the "Import New Deck" tab to create your first deck.
                    </p>
                    <button
                      onClick={() => setActiveTab('import')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Import New Deck
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full relative">
          <FlashcardPractice />
          <div className="absolute top-4 right-4">
            <button 
              onClick={handleEndPractice}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 