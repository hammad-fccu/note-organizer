import { useState, useEffect } from 'react';
import { Flashcard, GeneratorOptions, CardType } from '@/types/flashcards';
import { v4 as uuidv4 } from 'uuid';

interface FlashcardGeneratorProps {
  noteId: string;
  cardType: CardType;
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

export default function FlashcardGenerator({ 
  noteId, 
  cardType,
  onFlashcardsGenerated,
  isGenerating,
  setIsGenerating
}: FlashcardGeneratorProps) {
  const [maxCards, setMaxCards] = useState<number>(5);
  const [temperature, setTemperature] = useState<number>(0.7);
  
  // Dynamic prompt template based on card type
  const getDefaultPromptTemplate = (type: CardType) => {
    switch(type) {
      case 'Basic':
        return "Generate concise question-answer flashcards based on this note. Each card should have a specific question on the front and comprehensive but concise answer on the back.";
      case 'Basic (and reversed card)':
        return "Generate concise two-way flashcards based on this note. Each piece of information should work as both a question and an answer. Create cards where both sides can stand alone as complete statements.";
      case 'Cloze':
        return "Generate cloze deletion flashcards based on this note. Write complete sentences and enclose key terms or concepts in [square brackets] to indicate what should be deleted and tested.";
      default:
        return "Generate concise Q&A flashcards covering each heading and key term in this note.";
    }
  };
  
  // Store prompt template based on card type, but don't expose it to user
  const [promptTemplate, setPromptTemplate] = useState<string>(getDefaultPromptTemplate('Basic'));
  
  // Update prompt template when card type changes
  useEffect(() => {
    setPromptTemplate(getDefaultPromptTemplate(cardType));
  }, [cardType]);

  // Function to handle flashcard generation (stub)
  const generateFlashcardsWithLLM = async (options: GeneratorOptions): Promise<Flashcard[]> => {
    // This would be replaced with actual API call in production
    console.log('Generating flashcards with options:', options);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock flashcards based on card type
    if (cardType === 'Cloze') {
      return Array(options.maxCards).fill(0).map((_, index) => ({
        id: uuidv4(),
        front: `This is a sample cloze deletion card #${index + 1}. The capital of France is [Paris], which is located in [Europe].`,
        back: `This is a sample cloze deletion card #${index + 1}. The capital of France is Paris, which is located in Europe.`,
        tags: ['sample', 'demo'],
        createdAt: new Date()
      }));
    } else {
      return Array(options.maxCards).fill(0).map((_, index) => ({
        id: uuidv4(),
        front: `Question ${index + 1}: What is the key concept from section ${index + 1}?`,
        back: `Answer ${index + 1}: This is a simulated answer for demonstration purposes.`,
        tags: ['sample', 'demo'],
        createdAt: new Date()
      }));
    }
  };

  const handleGenerate = async () => {
    if (!noteId) {
      alert('Please select a note first');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const options: GeneratorOptions = {
        noteId,
        template: promptTemplate,
        maxCards,
        temperature
      };
      
      const flashcards = await generateFlashcardsWithLLM(options);
      onFlashcardsGenerated(flashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate position percentages for slider thumbs
  const maxCardsPercent = ((maxCards - 1) / 9) * 100;
  const temperaturePercent = ((temperature - 0.1) / 0.9) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Step 3: AI-Assisted Card Generation</h2>
      
      <div className="space-y-6">
        {/* Number of Cards */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="max-cards" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of Cards to Generate
            </label>
            <span className="text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {maxCards}
            </span>
          </div>
          <div className="mt-2 relative h-7 flex items-center">
            <div className="absolute top-1/2 -translate-y-1/2 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-300/70 to-blue-500/70 dark:from-blue-400/70 dark:to-blue-600/70" 
                style={{ width: `${maxCardsPercent}%` }}
              ></div>
            </div>
            <div 
              className="absolute h-4 w-4 bg-white border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-sm z-10"
              style={{ left: `calc(${maxCardsPercent}% - 8px)` }}
            ></div>
            <input
              type="range"
              id="max-cards"
              min="1"
              max="10"
              step="1"
              value={maxCards}
              onChange={(e) => setMaxCards(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute top-5 inset-x-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        </div>
        
        {/* Temperature Slider */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="temperature" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Creativity Level
            </label>
            <span className="text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {temperature.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Higher values produce more creative but potentially less accurate content
          </p>
          <div className="mt-1 relative h-7 flex items-center">
            <div className="absolute top-1/2 -translate-y-1/2 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-300/70 to-purple-400/70 dark:from-blue-400/70 dark:to-purple-500/70" 
                style={{ width: `${temperaturePercent}%` }}
              ></div>
            </div>
            <div 
              className="absolute h-4 w-4 bg-white border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-sm z-10"
              style={{ left: `calc(${temperaturePercent}% - 8px)` }}
            ></div>
            <input
              type="range"
              id="temperature"
              min="0.1"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute top-5 inset-x-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !noteId}
            className={`
              px-6 py-2 rounded-md font-medium flex items-center justify-center min-w-[200px]
              ${isGenerating || !noteId 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all'}
            `}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Flashcards'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 