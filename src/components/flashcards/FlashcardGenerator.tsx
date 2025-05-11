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
  const [maxCards, setMaxCards] = useState<number>(10);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Step 3: AI-Assisted Card Generation</h2>
      
      <div className="space-y-6">
        {/* Number of Cards */}
        <div>
          <label htmlFor="max-cards" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Cards to Generate
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="max-cards"
              min="5"
              max="50"
              step="5"
              value={maxCards}
              onChange={(e) => setMaxCards(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-12 text-center">{maxCards}</span>
          </div>
        </div>
        
        {/* Temperature Slider */}
        <div>
          <label className="flex justify-between mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Creativity Level</span>
            <span className="text-xs text-gray-500">(Higher = more creative, but potentially less accurate)</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-xs">Precise</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs">Creative</span>
            <span className="w-12 text-center">{temperature}</span>
          </div>
        </div>
        
        {/* Card Type Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            Generating {cardType} Cards
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {cardType === 'Basic' && 'Standard question and answer cards.'}
            {cardType === 'Basic (and reversed card)' && 'Creates two cards from each fact: one testing front→back and another testing back→front.'}
            {cardType === 'Cloze' && 'Creates fill-in-the-blank style cards where you recall the missing information.'}
          </p>
        </div>
        
        {/* Prompt Template */}
        <div>
          <label htmlFor="prompt-template" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Generation Prompt Template
          </label>
          <textarea
            id="prompt-template"
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            placeholder="Instructions for the AI on how to generate flashcards..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Customize how the AI generates your flashcards.
          </p>
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
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
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