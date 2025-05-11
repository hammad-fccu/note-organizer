'use client';

import { useState, useEffect } from 'react';
import { useFlashcards } from '@/store/FlashcardStore';
import { FlashcardReview } from '@/types/flashcards';

export default function ImportDeck({ onImport }: { onImport: (cards: FlashcardReview[]) => void }) {
  const { importCardsFromText, importCardsFromAnkiText } = useFlashcards();
  const [text, setText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewCards, setPreviewCards] = useState<FlashcardReview[]>([]);
  const [importMethod, setImportMethod] = useState<'paste' | 'file'>('paste');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAnkiFormat, setIsAnkiFormat] = useState(false);
  
  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Check on mount
    checkDarkMode();
    
    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Add event listener for toggle instructions
  useEffect(() => {
    const parentContainer = document.getElementById('import-deck-container');
    if (!parentContainer) return;
    
    const handleToggleInstructions = () => {
      setShowInstructions(prev => !prev);
    };
    
    parentContainer.addEventListener('toggle-instructions', handleToggleInstructions);
    
    return () => {
      parentContainer.removeEventListener('toggle-instructions', handleToggleInstructions);
    };
  }, []);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsPreviewVisible(false);
    
    // Auto-detect Anki format
    setIsAnkiFormat(e.target.value.includes('#notetype:') || e.target.value.includes('#separator:Tab'));
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only accept .txt files
    if (file.type !== 'text/plain') {
      alert('Please upload a text file (.txt)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      setIsPreviewVisible(false);
      
      // Try to extract deck name from filename
      const fileName = file.name.replace(/\.txt$/, '');
      if (fileName && !deckName) {
        setDeckName(fileName);
      }
      
      // Auto-detect Anki format
      setIsAnkiFormat(content.includes('#notetype:') || content.includes('#separator:Tab'));
    };
    reader.readAsText(file);
  };
  
  const handlePreview = () => {
    if (!text) return;
    
    let cards: FlashcardReview[] = [];
    
    // Use the appropriate import function based on detected format
    if (isAnkiFormat) {
      cards = importCardsFromAnkiText(text);
      // If deck name not set by user, try to extract from Anki format
      if (!deckName && text.includes('#deck:')) {
        const deckMatch = text.match(/#deck:(.*?)(\n|$)/);
        if (deckMatch && deckMatch[1]) {
          setDeckName(deckMatch[1].trim());
        }
      }
    } else {
      cards = importCardsFromText(text);
    }
    
    setPreviewCards(cards);
    setIsPreviewVisible(true);
  };
  
  const handleImport = () => {
    if (!text || !deckName) return;
    
    let cards: FlashcardReview[];
    
    // Use the appropriate import function based on detected format
    if (isAnkiFormat) {
      cards = importCardsFromAnkiText(text);
    } else {
      cards = importCardsFromText(text);
    }
    
    if (cards.length > 0) {
      // Add deck name to cards
      const cardsWithDeckName = cards.map(card => ({
        ...card,
        deckId: deckName.trim().toLowerCase().replace(/\s+/g, '-')
      }));
      
      onImport(cardsWithDeckName);
      
      // Reset form
      setText('');
      setDeckName('');
      setIsPreviewVisible(false);
      setIsAnkiFormat(false);
    }
  };
  
  return (
    <div>
      {/* Instructions Panel as a separate component above the import form */}
      {showInstructions && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-blue-200 dark:border-blue-800">
          <div className="p-4 dark:border-b-0 dark:bg-blue-900/40" 
               style={{ backgroundColor: isDarkMode ? undefined : '#f0f7ff' }}>
            <h3 className="text-md font-semibold mb-2 dark:text-blue-300"
                style={{ color: isDarkMode ? undefined : '#1e40af' }}>How to Import Flashcards</h3>
            <p className="text-sm mb-2 dark:text-blue-300"
               style={{ color: isDarkMode ? undefined : '#1e3a8a' }}>
              Import flashcards in Q&A format from a text file or paste them directly.
            </p>
            <div className="text-xs dark:text-blue-300"
                 style={{ color: isDarkMode ? undefined : '#1e3a8a' }}>
              <p className="font-medium mb-1">Supported format:</p>
              <div className="mt-1 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 overflow-x-auto shadow-sm">
                <div className="font-mono dark:text-gray-100" 
                     style={{ color: isDarkMode ? undefined : '#1f2937' }}>
                  <div className="mb-1">
                    <span className="font-semibold dark:text-green-400" 
                          style={{ color: isDarkMode ? undefined : '#059669' }}>Q:</span> What is the capital of France?
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold dark:text-blue-400" 
                          style={{ color: isDarkMode ? undefined : '#2563eb' }}>A:</span> Paris
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold dark:text-green-400" 
                          style={{ color: isDarkMode ? undefined : '#059669' }}>Q:</span> What is the largest planet in our solar system?
                  </div>
                  <div>
                    <span className="font-semibold dark:text-blue-400" 
                          style={{ color: isDarkMode ? undefined : '#2563eb' }}>A:</span> Jupiter
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Import Frame */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {/* Import Method Tabs */}
          <div className="mb-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  className={`py-2 px-4 text-sm font-medium ${
                    importMethod === 'paste'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setImportMethod('paste')}
                >
                  Paste Text
                </button>
                <button
                  className={`py-2 px-4 text-sm font-medium ${
                    importMethod === 'file'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setImportMethod('file')}
                >
                  Upload File
                </button>
              </div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors p-2"
                title="Toggle import instructions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Deck Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Deck Name</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter a name for this deck"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Import Methods */}
          {importMethod === 'paste' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Paste Your Flashcards
              </label>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Paste your flashcards here in Q/A format..."
                className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Upload Flashcard Text File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".txt"
                        className="sr-only"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Text files (.txt) in Anki format or Q/A format
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handlePreview}
              disabled={!text}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
            >
              Preview
            </button>
            <button
              onClick={handleImport}
              disabled={!text || !deckName}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex-1"
            >
              Import Deck
            </button>
          </div>
          
          {/* Preview Section */}
          {isPreviewVisible && previewCards.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Preview</h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded">
                  {previewCards.length} cards
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Front</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Back</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewCards.map((card, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 text-sm whitespace-pre-wrap">{card.front}</td>
                        <td className="p-3 text-sm whitespace-pre-wrap">{card.back}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {isPreviewVisible && previewCards.length === 0 && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-md mb-4 border-2 border-red-400 shadow-sm">
              <div className="flex flex-col">
                <p className="text-red-600 dark:text-red-300 font-semibold">
                  No valid flashcards found. Please check your format.
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  Make sure each card follows the Q: question, A: answer format or is a valid Anki export file.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 