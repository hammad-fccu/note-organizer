import { useState, useEffect, useCallback } from 'react';
import { Flashcard, GeneratorOptions, CardType, FieldMapping } from '@/types/flashcards';
import { v4 as uuidv4 } from 'uuid';
import { useNotes } from '@/store/NoteStore';
import InfoModal from '@/components/InfoModal';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import CardTypeMapper from '@/components/flashcards/CardTypeMapper';
import FlashcardTable from '@/components/flashcards/FlashcardTable';
import ExportControls from '@/components/flashcards/ExportControls';
import NoteDeckSelector from '@/components/flashcards/NoteDeckSelector';

// Gemini API key for fallback
const GEMINI_API_KEY = "AIzaSyBAISSbMog7i4VjD1ala_V9G9yePCYJI-8";

// Function to call Gemini API as a fallback
const callGeminiApi = async (prompt: string): Promise<string> => {
  console.log("Falling back to Gemini API");
  
  // Enhance the prompt for Gemini to ensure proper formatting
  const enhancedPrompt = 
    `I need you to generate well-formatted flashcards based on the content below. You MUST follow these formatting rules EXACTLY:

${prompt.includes('Cloze') ? 
`For CLOZE cards:
1. Each card must be clearly separated with "Card X" (where X is the card number) on its own line
2. Each cloze card must have exactly ONE term in [square brackets]
3. Format your response exactly like this:

Card 1
The [mitochondria] is the powerhouse of the cell.

Card 2
[Photosynthesis] is the process by which plants convert light energy into chemical energy.

IMPORTANT: Keep each sentence on a single line.` : 
`For BASIC cards:
1. Format each card EXACTLY like this:

Card 1
Front: What is the capital of France?
Back: Paris

Card 2
Front: What is the largest planet in our solar system?
Back: Jupiter

2. CRITICAL FORMATTING RULES:
   - Always use question words (What, How, Why, etc.) to start each question
   - Never split words across lines
   - Always put "Front:" and "Back:" labels exactly as shown
   - Keep the entire question on ONE line
   - Put "Back:" on its OWN LINE
   - DO NOT use any lines with just "FRONT" or "BACK"`}

Original request:
${prompt}

FOLLOW THESE FORMATTING RULES EXACTLY:
1. DO NOT split words across lines - especially question words like "What"
2. Keep each question on a single line
3. Use proper spacing between cards
4. Use clear "Front:" and "Back:" labels for each card
5. Each "Front:" and "Back:" MUST be on separate lines
6. ONLY create flashcards from the actual note content provided
7. DO NOT include instructions, examples, or meta-commentary as flashcard content`;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts:[{text: enhancedPrompt}]
        }],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent formatting
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract content from Gemini API response
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error("Failed to extract content from Gemini API response");
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    throw error;
  }
};

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
  const { getNoteById } = useNotes();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ title: '', message: '' });
  
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

  // Function to handle flashcard generation with actual API call
  const generateFlashcardsWithLLM = async (options: GeneratorOptions): Promise<Flashcard[]> => {
    console.log('Generating flashcards with options:', options);
    
    // Get API key from localStorage
    const apiKey = localStorage.getItem('openRouterApiKey');
    
    // Get the note content
    const note = getNoteById(options.noteId);
    if (!note) {
      throw new Error('Note not found');
    }
    
    // Create the prompt based on card type and note content
    const instructions = options.template;
    const prompt = `
Generate ${options.maxCards} high-quality flashcards based on this note content:

Note Title: ${note.title}

${instructions}

${cardType === 'Cloze' 
  ? 'Create cloze deletion cards with exactly ONE key term in [square brackets] per card. Example: "The [mitochondria] is the powerhouse of the cell."' 
  : `Format each card EXACTLY as follows:

Card 1
Front: What is the capital of France?
Back: Paris

Card 2
Front: What is the largest planet in our solar system?
Back: Jupiter

CRITICAL FORMATTING RULES:
1. Always include "Front:" and "Back:" labels
2. NEVER split words across lines (especially question words)
3. Keep each question on a SINGLE LINE
4. Every "Back:" MUST be on its own line
5. Start each front with What, How, Why, When, Where, etc.
6. DO NOT repeat question words multiple times`}

Note Content:
${note.content}

Return exactly ${options.maxCards} flashcards focusing on the most important concepts.

IMPORTANT: Create flashcards ONLY from the actual note content provided above. DO NOT create flashcards from these instructions or include any meta-commentary in the flashcards.
`;
    
    let content = '';
    let usedFallback = false;
    
    try {
      // If no OpenRouter API key is set, use Gemini directly
      if (!apiKey) {
        console.log("No OpenRouter API key found, using Gemini API directly");
        content = await callGeminiApi(prompt);
        usedFallback = true;
        console.log("Successfully retrieved content from Gemini API");
      } else {
        // Make the API call to OpenRouter
        // Get safe URL for referer
        let referer = "https://smart-note-organizer.com";
        try {
          if (typeof window !== 'undefined' && window.location && window.location.href) {
            referer = window.location.href;
          }
        } catch (error) {
          console.error("Error getting window location:", error);
        }
        
        console.log("Making OpenRouter API call with model: google/gemini-2.0-flash-exp:free");
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": referer,
            "X-Title": "Smart Note Organizer"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: options.temperature
          })
        });
        
        // Log the response status for debugging
        console.log(`API response status: ${response.status}`);
        
        if (!response.ok) {
          let errorMessage = `API error (${response.status}): `;
          
          try {
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              errorMessage += errorData.error?.message || response.statusText || "Unknown error occurred";
              console.error('API error response:', errorData);
            } catch {
              errorMessage += errorText || response.statusText || "Unknown error occurred";
              console.error('API error (non-JSON):', errorText);
            }
          } catch (err) {
            console.error('Failed to read error response:', err);
            errorMessage += 'Failed to read error response';
          }
          
          // Try the fallback to Gemini API
          console.log("OpenRouter API call failed, trying Gemini API fallback");
          content = await callGeminiApi(prompt);
          usedFallback = true;
          console.log("Successfully retrieved content from Gemini API fallback");
        } else {
          // Try to get the response text to debug potential JSON parsing errors
          const responseText = await response.text();
          console.log("Raw API response:", responseText.substring(0, 200) + "...");
          
          // Check if the response is empty
          if (!responseText || responseText.trim() === '') {
            console.error("Empty response received from API");
            // Try the fallback to Gemini API
            console.log("Empty response from OpenRouter, trying Gemini API fallback");
            content = await callGeminiApi(prompt);
            usedFallback = true;
            console.log("Successfully retrieved content from Gemini API fallback");
          } else {
            // Parse JSON response
            let data;
            try {
              data = JSON.parse(responseText);
              console.log('API response data structure:', Object.keys(data));
              
              // Extract the content from the response
              if (data.choices && data.choices.length > 0) {
                if (data.choices[0].message && data.choices[0].message.content) {
                  content = data.choices[0].message.content.trim();
                } else if (data.choices[0].text) {
                  content = data.choices[0].text.trim();
                }
              }
              
              if (!content) {
                console.error("No content in API response:", data);
                // Try the fallback to Gemini API
                console.log("No content in OpenRouter response, trying Gemini API fallback");
                content = await callGeminiApi(prompt);
                usedFallback = true;
                console.log("Successfully retrieved content from Gemini API fallback");
              }
            } catch (parseError) {
              console.error("Failed to parse API response:", parseError);
              
              // If we can't parse the response, try to extract text content directly or use fallback
              if (responseText.length > 20) {
                console.log("Attempting to parse raw text response directly");
                return parseRawTextIntoFlashcards(responseText, note.tags || [], cardType, options.maxCards);
              } else {
                // Try the fallback to Gemini API
                console.log("Failed to parse OpenRouter response, trying Gemini API fallback");
                content = await callGeminiApi(prompt);
                usedFallback = true;
                console.log("Successfully retrieved content from Gemini API fallback");
              }
            }
          }
        }
      }
      
      console.log("Using content for parsing flashcards. Source:", usedFallback ? "Gemini API (fallback)" : "OpenRouter API");
      console.log("Extracted content:", content.substring(0, 200) + "...");
      
      // Parse the content into flashcards based on card type
      return parseContentIntoFlashcards(content, note.tags || [], cardType, options.maxCards);
    } catch (error) {
      console.error("Error in generateFlashcardsWithLLM:", error);
      
      // Last resort: try the Gemini API if not already tried
      if (!usedFallback) {
        try {
          console.log("Error with OpenRouter, trying Gemini API as last resort");
          content = await callGeminiApi(prompt);
          console.log("Successfully retrieved content from Gemini API last resort");
          
          // Continue with parsing the content from Gemini
          // Since we're in the catch block, we'll need to return the result directly
          return parseContentIntoFlashcards(content, note.tags || [], cardType, options.maxCards);
        } catch (geminiError) {
          console.error("Both OpenRouter and Gemini API failed:", geminiError);
          throw new Error("Failed to generate flashcards. Both primary and fallback APIs failed.");
        }
      }
      
      // If we're here, both APIs failed or we've already tried the fallback
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!noteId) {
      setInfoModalContent({
        title: 'No Note Selected',
        message: 'Please select a note first'
      });
      setShowInfoModal(true);
      return;
    }
    
    // Start generating regardless of API key presence - we'll use Gemini if no OpenRouter key
    setIsGenerating(true);
    
    try {
      const options: GeneratorOptions = {
        noteId,
        template: promptTemplate,
        maxCards,
        temperature
      };
      
      console.log(`Starting flashcard generation for note ID: ${noteId}, card type: ${cardType}`);
      
      // Wrap the entire process in a try-catch for extra safety
      try {
        const flashcards = await generateFlashcardsWithLLM(options);
        
        if (flashcards && Array.isArray(flashcards) && flashcards.length > 0) {
          console.log(`Generated ${flashcards.length} flashcards successfully`);
          onFlashcardsGenerated(flashcards);
        } else {
          console.error("No flashcards generated - empty array or invalid result");
          throw new Error("No valid flashcards were generated");
        }
      } catch (innerError) {
        console.error('Error during flashcard generation process:', innerError);
        
        // Try one more time with a simpler prompt as a fallback
        console.log("Attempting flashcard generation with a simplified approach");
        
        try {
          // Create a simpler prompt for the fallback attempt
          const fallbackOptions = { 
            ...options, 
            template: cardType === 'Cloze' 
              ? "Create simple cloze deletion cards with terms in [square brackets]." 
              : "Create basic question and answer cards."
          };
          
          const fallbackCards = await generateFlashcardsWithLLM(fallbackOptions);
          
          if (fallbackCards && fallbackCards.length > 0) {
            console.log(`Generated ${fallbackCards.length} flashcards with fallback approach`);
            onFlashcardsGenerated(fallbackCards);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback generation also failed:', fallbackError);
          // Continue to the error message below
        }
        
        // If we get here, both attempts failed
        setInfoModalContent({
          title: 'Flashcard Generation Failed',
          message: 'No flashcards could be generated. This may be due to:\n\n' +
            '- The AI model\'s response format was unexpected\n' +
            '- The note content was too short or unclear\n' +
            '- There was an issue with the API\n\n' +
            'Please try again with different settings or a different note.'
        });
        setShowInfoModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setInfoModalContent({
        title: 'Flashcard Generation Failed',
        message: `Failed to generate flashcards: ${errorMessage}. Please check your API key and try again.`
      });
      setShowInfoModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate position percentages for slider thumbs
  const maxCardsPercent = ((maxCards - 1) / 9) * 100;
  const temperaturePercent = ((temperature - 0.1) / 0.9) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">AI-Assisted Card Generation</h2>
      
      <div className="space-y-6">
        {/* Number of Cards */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="max-cards" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of Cards to Generate
            </label>
            <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
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
            <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
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

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalContent.title}
        message={infoModalContent.message}
      />
    </div>
  );
}

const parseRawTextIntoFlashcards = (text: string, tags: string[], cardType: CardType, maxCards: number): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  
  if (cardType === 'Cloze') {
    // For cloze, find any text with square brackets
    const clozeMatches = text.match(/[^.!?]+\[[^\]]+\][^.!?]*[.!?]/g) || [];
    
    clozeMatches.slice(0, maxCards).forEach(match => {
      if (match.includes('[') && match.includes(']')) {
        flashcards.push({
          id: uuidv4(),
          front: match.trim(),
          back: match.replace(/\[([^\]]+)\]/g, '$1').trim(),
          tags: tags,
          createdAt: new Date()
        });
      }
    });
  } else {
    // For basic cards, split by double newlines or numbered items
    const sections = text.split(/\n\s*\n|\d+\.\s+/g)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    for (let i = 0; i < Math.min(sections.length, maxCards * 2); i += 2) {
      if (i + 1 < sections.length) {
        // Fix the 't ' prefix issue in front text
        const frontText = sections[i].replace(/^t\s+/i, "What ");
        const backText = sections[i + 1];
        
        flashcards.push({
          id: uuidv4(),
          front: frontText,
          back: backText,
          tags: tags,
          createdAt: new Date()
        });
      }
    }
  }
  
  // If all else fails, create single cards from paragraphs
  if (flashcards.length === 0) {
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 30);
    
    paragraphs.slice(0, maxCards).forEach(p => {
      flashcards.push({
        id: uuidv4(),
        front: `Summarize this information: "${p.substring(0, 40)}..."`,
        back: p,
        tags: tags,
        createdAt: new Date()
      });
    });
  }
  
  return flashcards.slice(0, maxCards);
};

// Helper function to parse content into flashcards (extracted from main function for reuse)
const parseContentIntoFlashcards = (content: string, tags: string[], cardType: CardType, maxCards: number): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  
  // Log the raw content for debugging
  console.log("Raw content to parse:", content.substring(0, 200) + "...");
  
  // STEP 1: Initial cleanup to fix common formatting issues
  let processedContent = content
    // Fix repeated question words and fix fragmented "What"/"Wh"/"t" issues
    .replace(/\b(What\s+)+/gi, "What ")
    .replace(/\b(Wh\s*)\s*\n*\s*(t\s+)/gi, "What ")
    .replace(/\bWh\b\s*\n*\s*\bt\b/gi, "What")
    .replace(/\bt\s+is\b/gi, "What is")
    .replace(/\bt\s+/gi, "What ")
    .replace(/\bWh\s+/gi, "What ")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/Card\s+\d+\s*/g, "\n\n") // Replace "Card X" with double newlines for separation
    .replace(/Front:/gi, "\nFront:") // Ensure Front: is on its own line
    .replace(/Back:/gi, "\nBack:"); // Ensure Back: is on its own line
    
  // Log the processed content
  console.log("Basic processed content:", processedContent.substring(0, 200) + "...");
  
  // STEP 2: Parse according to card type
  if (cardType === 'Cloze') {
    // For cloze cards, look for sentences with terms in [square brackets]
    const clozeRegex = /([^.!?]+\[[^\]]+\][^.!?]*[.!?])/g;
    const matches = processedContent.match(clozeRegex) || [];
    
    for (const match of matches.slice(0, maxCards)) {
      if (match.includes('[') && match.includes(']')) {
        // Skip cards that contain instruction-like content
        if (shouldSkipInstructionContent(match)) {
          console.log("Skipping invalid cloze card with instruction-like content:", match);
          continue;
        }
        
        flashcards.push({
          id: uuidv4(),
          front: match.trim(),
          back: match.replace(/\[([^\]]+)\]/g, '$1').trim(),
          tags,
          createdAt: new Date()
        });
      }
    }
    
    // If no cloze deletions found, look for any text with square brackets
    if (flashcards.length === 0) {
      const fragments = processedContent.split(/\n+/).filter(line => 
        line.includes('[') && line.includes(']')
      );
      
      for (const fragment of fragments.slice(0, maxCards)) {
        // Skip cards that contain instruction-like content
        if (shouldSkipInstructionContent(fragment)) {
          console.log("Skipping invalid cloze card with instruction-like content:", fragment);
          continue;
        }
        
        flashcards.push({
          id: uuidv4(),
          front: fragment.trim(),
          back: fragment.replace(/\[([^\]]+)\]/g, '$1').trim(),
          tags,
          createdAt: new Date()
        });
      }
    }
  } else {
    // For basic cards, use a simpler approach focusing on clear patterns
    
    // STEP 3: Split content into potential card chunks
    // Try to split by clear card boundaries first
    let cardChunks: string[] = [];
    
    if (processedContent.includes("Front:") && processedContent.includes("Back:")) {
      // Cards with explicit Front:/Back: labels
      const frontBackPattern = /Front:(.*?)Back:(.*?)(?=Front:|$)/gis;
      const matches = Array.from(processedContent.matchAll(frontBackPattern));
      
      if (matches.length > 0) {
        for (const match of matches) {
          const front = match[1].trim();
          const back = match[2].trim();
          
          if (front && back) {
            const flashcard = createBasicFlashcard(front, back, tags);
            if (flashcard) {
              flashcards.push(flashcard);
            }
          }
        }
      }
    } else if (/What\s+is|How\s+|Why\s+|When\s+|Where\s+/i.test(processedContent)) {
      // Structure is likely "What is X? Back: Y" or similar question patterns
      
      // Find all question patterns followed by answers
      const questionAnswerPattern = /(What|How|Why|When|Where|Which|Describe|Explain|List|Define|Name|Identify)[^?]+\??(?:\s+Back:|\n+)(.*?)(?=(?:What|How|Why|When|Where|Which|Describe|Explain|List|Define|Name|Identify)[^?]+\??(?:\s+Back:|\n+)|$)/gis;
      
      const matches = Array.from(processedContent.matchAll(questionAnswerPattern));
      if (matches.length > 0) {
        for (const match of matches) {
          const fullMatch = match[0];
          if (fullMatch.includes("Back:")) {
            const [frontPart, backPart] = fullMatch.split(/\s+Back:|Back:/);
            if (frontPart && backPart) {
              const flashcard = createBasicFlashcard(frontPart.trim(), backPart.trim(), tags);
              if (flashcard) {
                flashcards.push(flashcard);
              }
            }
          } else {
            // Try to find a natural split between question and answer
            const lines = fullMatch.split(/\n+/);
            if (lines.length >= 2) {
              const front = lines[0].trim();
              const back = lines.slice(1).join(' ').trim();
              if (front && back) {
                const flashcard = createBasicFlashcard(front, back, tags);
                if (flashcard) {
                  flashcards.push(flashcard);
                }
              }
            }
          }
        }
      }
    }
    
    // If we still don't have cards, try a more aggressive approach
    if (flashcards.length === 0) {
      // Split content by double newlines to identify card boundaries
      cardChunks = processedContent.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 0);
      
      // If we have an odd number of chunks, assume they're paired
      if (cardChunks.length >= 2) {
        for (let i = 0; i < cardChunks.length - 1 && flashcards.length < maxCards; i += 2) {
          const front = cardChunks[i].trim();
          const back = cardChunks[i + 1].trim();
          
          if (front && back) {
            const flashcard = createBasicFlashcard(front, back, tags);
            if (flashcard) {
              flashcards.push(flashcard);
            }
          }
        }
      } else {
        // Last resort: try to parse each chunk individually
        for (const chunk of cardChunks) {
          // Check if the chunk contains both a question and answer
          if (chunk.includes("Back:")) {
            const [frontPart, backPart] = chunk.split(/\s+Back:|Back:/);
            if (frontPart && backPart) {
              const flashcard = createBasicFlashcard(frontPart.trim(), backPart.trim(), tags);
              if (flashcard) {
                flashcards.push(flashcard);
              }
            }
          } else if (chunk.includes("?")) {
            // Split by the question mark to separate question and answer
            const parts = chunk.split(/\?/, 2);
            if (parts.length === 2) {
              const front = (parts[0] + "?").trim();
              const back = parts[1].trim();
              if (front && back) {
                const flashcard = createBasicFlashcard(front, back, tags);
                if (flashcard) {
                  flashcards.push(flashcard);
                }
              }
            }
          }
        }
      }
    }
  }
  
  return flashcards.slice(0, maxCards);
};

// Helper function to check if content contains instruction-like text
const shouldSkipInstructionContent = (content: string): boolean => {
  const lowercased = content.toLowerCase();
  return (
    // Check for instruction-like phrases
    lowercased.includes("how many") ||
    lowercased.includes("quiz questions") ||
    lowercased.includes("follow these") ||
    lowercased.includes("formatting rules") ||
    lowercased.includes("create flashcards") ||
    lowercased.includes("create cards") ||
    lowercased.includes("format each") ||
    lowercased.includes("critical") ||
    lowercased.includes("important formatting") ||
    lowercased.includes("example:") ||
    lowercased.includes("example card") ||
    lowercased.includes("card 1") ||
    lowercased.includes("card 2") ||
    // Check for content that doesn't make sense as flashcards
    lowercased.includes("front:") && lowercased.includes("back:") ||
    // Check for square brackets that are likely part of the instructions
    lowercased.includes("[square brackets]")
  );
};

// Helper function to create a properly formatted basic flashcard
const createBasicFlashcard = (front: string, back: string, tags: string[]): Flashcard | null => {
  // Filter out flashcards that contain instruction-like content
  if (shouldSkipInstructionContent(front) || shouldSkipInstructionContent(back) || 
      // Additional checks specific to basic flashcards
      back.length < 3 ||
      front.length < 10 ||
      (front.includes("how many") && back.match(/^\d+$/))
  ) {
    // Skip this flashcard
    console.log("Skipping invalid flashcard with instruction-like content:", front);
    return null;
  }

  // Clean up front text
  let cleanFront = front
    .replace(/^front:/i, "")
    .replace(/^t\s+is/i, "What is")
    .replace(/^t\s+/i, "What ")
    .trim();
  
  // Ensure front text is a proper question
  if (!cleanFront.match(/^(what|how|why|describe|explain|when|who|where|which|list|define|name|identify)/i)) {
    cleanFront = "What " + cleanFront;
  }
  
  // Clean up back text
  const cleanBack = back
    .replace(/^back:/i, "")
    .trim();
  
  return {
    id: uuidv4(),
    front: cleanFront,
    back: cleanBack,
    tags,
    createdAt: new Date()
  };
};

// This is a wrapper component for using the flashcard generator in the practice-flashcards page
export function GeneratorTab() {
  // Get the noteId from the URL if present
  const searchParams = useSearchParams();
  const noteId = searchParams.get('noteId');
  
  // State and functionality from the original FlashcardsPage component
  const [selectedNoteId, setSelectedNoteId] = useState<string>(noteId || '');
  const [deckName, setDeckName] = useState<string>('');
  const [cardType, setCardType] = useState<CardType>('Basic');
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    noteHeadings: 'front',
    paragraphs: 'back',
    noteTags: true
  });
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Get notes store
  const { notes } = useNotes();
  
  // Get the selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId);
  
  // Effect to handle noteId from URL parameter
  useEffect(() => {
    if (noteId) {
      setSelectedNoteId(noteId);
    }
  }, [noteId]);
  
  // Handlers (memoized with useCallback to prevent unnecessary rerenders)
  const handleNoteSelected = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    // Clear flashcards when note changes
    setFlashcards([]);
  }, []);
  
  const handleDeckNameChanged = useCallback((name: string) => {
    setDeckName(name);
  }, []);
  
  const handleCardTypeChanged = useCallback((type: CardType) => {
    setCardType(type);
    // Clear flashcards when card type changes as they need to be regenerated
    setFlashcards([]);
  }, []);
  
  const handleFieldMappingChanged = useCallback((mapping: FieldMapping) => {
    setFieldMapping(mapping);
  }, []);
  
  const handleFlashcardsGenerated = useCallback((newFlashcards: Flashcard[]) => {
    setFlashcards(newFlashcards);
  }, []);
  
  const handleFlashcardsUpdated = useCallback((updatedFlashcards: Flashcard[]) => {
    setFlashcards(updatedFlashcards);
  }, []);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Generate Flashcards</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Turn your notes into Anki-compatible flashcards for effective studying
        </p>
      </div>
      
      {/* Main content */}
      <div className="space-y-6">
        {/* Note selection and card type configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Note Selection */}
          <NoteDeckSelector
            onNoteSelected={handleNoteSelected}
            onDeckNameChanged={handleDeckNameChanged}
            preselectedNoteId={selectedNoteId}
          />
          
          {/* Card Type & Mapping */}
          <CardTypeMapper
            onCardTypeChanged={handleCardTypeChanged}
            onFieldMappingChanged={handleFieldMappingChanged}
          />
        </div>
        
        {/* Flashcard Generation */}
        <FlashcardGenerator
          noteId={selectedNoteId}
          cardType={cardType}
          onFlashcardsGenerated={handleFlashcardsGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
        
        {/* Preview & Edit */}
        <FlashcardTable
          flashcards={flashcards}
          onFlashcardsUpdated={handleFlashcardsUpdated}
        />
        
        {/* Export */}
        <ExportControls
          flashcards={flashcards}
          deckName={deckName}
          modelName={cardType}
        />
      </div>
    </div>
  );
} 