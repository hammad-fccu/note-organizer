'use client';

import { useState } from 'react';
import { Flashcard } from '@/types/flashcards';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';
import { FlashcardReview } from '@/types/flashcards';
import { v4 as uuidv4 } from 'uuid';

interface ExportControlsProps {
  flashcards: Flashcard[];
  deckName: string;
  modelName?: string;
}

export default function ExportControls({ flashcards, deckName, modelName }: ExportControlsProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);
  const [exportFormat, setExportFormat] = useState<'txt' | 'json' | 'practice'>('txt');

  // Convert flashcards to the format needed for practice mode
  const convertToPracticeFormat = (cards: Flashcard[]): FlashcardReview[] => {
    return cards.map(card => ({
      id: uuidv4(),
      deckId: deckName.trim().toLowerCase().replace(/\s+/g, '-'),
      front: card.front,
      back: card.back,
      tags: card.tags || [],
      dueDate: new Date().toISOString(),
      reviewCount: 0
    }));
  };

  // Export as text format (Q/A pairs)
  const exportAsText = () => {
    try {
      // Create text content with Q/A format
      let textContent = '';
      flashcards.forEach((card) => {
        // If it's a cloze card, convert it to Q/A format
        let front = card.front;
        if (front.includes('[') && front.includes(']')) {
          front = front.replace(/\[([^\]]+)\]/g, '...');
        }
        
        textContent += `Q: ${front}\nA: ${card.back}\n\n`;
      });
      
      // Create a blob and download it
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${deckName || 'flashcards'}.txt`);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting as text:', error);
      setExportSuccess(false);
    }
  };
  
  // Export as JSON format
  const exportAsJson = () => {
    try {
      // Create JSON content
      const jsonContent = JSON.stringify(flashcards, null, 2);
      
      // Create a blob and download it
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `${deckName || 'flashcards'}.json`);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting as JSON:', error);
      setExportSuccess(false);
    }
  };
  
  // Export to practice mode - convert and navigate to practice page
  const exportToPractice = () => {
    try {
      // Convert flashcards to practice format
      const practiceCards = convertToPracticeFormat(flashcards);
      
      // Save to localStorage
      const savedDecksJSON = localStorage.getItem('practice_flashcard_decks');
      let savedDecks = savedDecksJSON ? JSON.parse(savedDecksJSON) : {};
      
      // Add or update the deck
      const deckId = deckName.trim().toLowerCase().replace(/\s+/g, '-');
      savedDecks[deckId] = practiceCards;
      
      // Save back to localStorage
      localStorage.setItem('practice_flashcard_decks', JSON.stringify(savedDecks));
      
      // Navigate to practice page
      router.push('/app/practice-flashcards');
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Error adding to practice mode:', error);
      setExportSuccess(false);
    }
  };
  
  const handleExport = async () => {
    if (flashcards.length === 0) {
      alert('No flashcards to export.');
      return;
    }
    
    setExportSuccess(null);
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'txt':
          exportAsText();
          break;
        case 'json':
          exportAsJson();
          break;
        case 'practice':
          exportToPractice();
          break;
      }
    } catch (error) {
      console.error('Error exporting flashcards:', error);
      alert(error instanceof Error ? error.message : 'Failed to export flashcards. Please try again.');
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Export Flashcards</h2>
      
      <div className="space-y-6">
        {/* Status Message */}
        {exportSuccess !== null && (
          <div className={`p-3 rounded-md border-[3px] ${exportSuccess 
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30' 
            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30'
          } mb-4`}>
            <p className={`text-sm font-medium ${exportSuccess 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-red-700 dark:text-red-300'
            }`}>
              {exportSuccess 
                ? `Successfully exported ${flashcards.length} flashcards!` 
                : 'Failed to export. Please check console for errors.'}
            </p>
          </div>
        )}
        
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Export Format
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setExportFormat('txt')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                exportFormat === 'txt'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Text File
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                exportFormat === 'json'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              JSON File
            </button>
            <button
              onClick={() => setExportFormat('practice')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                exportFormat === 'practice'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Practice Mode
            </button>
          </div>
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {exportFormat === 'txt' && "Exports as Q/A pairs in a text file that can be imported into most flashcard apps."}
            {exportFormat === 'json' && "Exports raw JSON data for advanced usage or backup."}
            {exportFormat === 'practice' && "Adds these cards to Practice Mode for immediate review within the app."}
          </p>
        </div>
        
        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={handleExport}
            disabled={isExporting || flashcards.length === 0}
            className={`
              px-6 py-2 rounded-md font-medium flex items-center justify-center min-w-[200px]
              ${isExporting || flashcards.length === 0 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all'}
            `}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                {exportFormat === 'practice' ? 'Add to Practice Mode' : 'Export Flashcards'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 