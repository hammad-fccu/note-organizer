import { useState, useEffect } from 'react';
import { Flashcard, GeneratorOptions, CardType } from '@/types/flashcards';
import { v4 as uuidv4 } from 'uuid';
import { useNotes } from '@/store/NoteStore';

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
    
    // Check if API key exists
    if (!apiKey) {
      throw new Error('No API key found. Please add your OpenRouter API key in the settings.');
    }
    
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
  : 'Format each card as follows:\nCard 1\nFront: (question)\nBack: (answer)\n\nCard 2\nFront: (question)\nBack: (answer)'}

Note Content:
${note.content}

Return exactly ${options.maxCards} flashcards focusing on the most important concepts.
`;
    
    try {
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
        
        throw new Error(errorMessage);
      }
      
      // Try to get the response text to debug potential JSON parsing errors
      const responseText = await response.text();
      console.log("Raw API response:", responseText.substring(0, 200) + "...");
      
      // Check if the response is empty
      if (!responseText || responseText.trim() === '') {
        console.error("Empty response received from API");
        throw new Error("The API returned an empty response. This could be due to rate limiting or an issue with the model. Please try again later.");
      }
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('API response data structure:', Object.keys(data));
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        // If we can't parse the response, try to extract text content directly
        if (responseText.length > 20) {
          console.log("Attempting to parse raw text response directly");
          return parseRawTextIntoFlashcards(responseText, note.tags || [], cardType, options.maxCards);
        }
        throw new Error("Invalid JSON response from API. Please try again.");
      }
      
      // Extract the content from the response
      let content = '';
      
      if (data.choices && data.choices.length > 0) {
        if (data.choices[0].message && data.choices[0].message.content) {
          content = data.choices[0].message.content.trim();
        } else if (data.choices[0].text) {
          content = data.choices[0].text.trim();
        }
      }
      
      if (!content) {
        console.error("No content in API response:", data);
        throw new Error("The API returned an empty response. Please try again with different settings.");
      }
      
      console.log("Extracted content:", content.substring(0, 200) + "...");
      
      // Parse the content into flashcards based on card type
      const flashcards: Flashcard[] = [];
      
      if (cardType === 'Cloze') {
        console.log("Parsing content for Cloze cards");
        
        // Look for numbered cloze cards first
        const numberedClozeRegex = /card\s*(\d+)[.\s:]*([^]*?\[.*?\].*?)(?=card\s*\d+|$)/gi;
        const numberedMatches = Array.from(content.matchAll(numberedClozeRegex));
        
        if (numberedMatches.length > 0) {
          console.log("Found numbered cloze cards: ", numberedMatches.length);
          numberedMatches.slice(0, options.maxCards).forEach((match) => {
            const text = match[2].trim();
            if (text && text.includes('[') && text.includes(']')) {
              const front = text;
              const back = text.replace(/\[([^\]]+)\]/g, '$1');
              
              flashcards.push({
                id: uuidv4(),
                front,
                back,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          });
        }
        
        // If no numbered cards found, look for any text with square brackets
        if (flashcards.length < 1) {
          console.log("Trying to find cloze deletions in text");
          
          // Split by sentences or newlines
          const sentences = content.match(/[^.!?]+\[[^\]]+\][^.!?]*[.!?]/g) || [];
          
          if (sentences.length > 0) {
            console.log("Found sentences with cloze deletions: ", sentences.length);
            sentences.slice(0, options.maxCards).forEach((sentence) => {
              if (sentence.includes('[') && sentence.includes(']')) {
                const front = sentence.trim();
                const back = sentence.replace(/\[([^\]]+)\]/g, '$1').trim();
                
                flashcards.push({
                  id: uuidv4(),
                  front,
                  back,
                  tags: note.tags || [],
                  createdAt: new Date()
                });
              }
            });
          }
        }
        
        // Last resort: look for any text fragments with square brackets
        if (flashcards.length < 1) {
          console.log("Last resort for cloze: any text with brackets");
          const fragments = content.split(/\n+/)
            .map(line => line.trim())
            .filter(line => line.includes('[') && line.includes(']'));
          
          fragments.slice(0, options.maxCards).forEach(fragment => {
            flashcards.push({
              id: uuidv4(),
              front: fragment,
              back: fragment.replace(/\[([^\]]+)\]/g, '$1'),
              tags: note.tags || [],
              createdAt: new Date()
            });
          });
        }
      } else {
        // Try multiple approaches to parse basic cards

        // First attempt: Look for numbered cards with Front and Back
        const numberedCardRegex = /card\s*(\d+)[\s\S]*?front:\s*([\s\S]*?)back:\s*([\s\S]*?)(?=card\s*\d+|$)/gi;
        const numberedMatches = Array.from(content.matchAll(numberedCardRegex));
        
        if (numberedMatches.length > 0) {
          console.log("Parsing using numbered card format with Front/Back");
          numberedMatches.slice(0, options.maxCards).forEach((match) => {
            const front = match[2].trim();
            const back = match[3].trim();
            
            if (front && back) {
              flashcards.push({
                id: uuidv4(),
                front,
                back,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          });
        }
        
        // Second attempt: Look for explicit Front: and Back: format
        if (flashcards.length < Math.min(options.maxCards, 1)) {
          console.log("Trying Front/Back format without card numbers");
          const cardRegex = /front:\s*([\s\S]*?)back:\s*([\s\S]*?)(?=front:|$)/gi;
          const matches = Array.from(content.matchAll(cardRegex));
          
          matches.slice(0, options.maxCards).forEach((match) => {
            const front = match[1].trim();
            const back = match[2].trim();
            
            if (front && back) {
              flashcards.push({
                id: uuidv4(),
                front,
                back,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          });
        }
        
        // Third attempt: Look for "Q:" and "A:" or "Question:" and "Answer:"
        if (flashcards.length < Math.min(options.maxCards, 1)) {
          console.log("Trying Q/A format");
          const qaRegex = /(?:q(?:uestion)?[\s\d]*?[:.]\s*)([\s\S]*?)(?:a(?:nswer)?[\s\d]*?[:.]\s*)([\s\S]*?)(?=q(?:uestion)?[\s\d]*?[:.:]|$)/gi;
          const qaMatches = Array.from(content.matchAll(qaRegex));
          
          qaMatches.slice(0, options.maxCards - flashcards.length).forEach((match) => {
            const front = match[1].trim();
            const back = match[2].trim();
            
            if (front && back) {
              flashcards.push({
                id: uuidv4(),
                front,
                back,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          });
        }
        
        // Fourth attempt: Look for numbered items in format "1. Question" followed by explanation
        if (flashcards.length < Math.min(options.maxCards, 1)) {
          console.log("Trying numbered format");
          const numberedLines = content.split(/\n+/).filter(line => line.trim().length > 0);
          
          // Look for patterns like "1. Question" followed by explanation text
          for (let i = 0; i < numberedLines.length; i++) {
            if (i + 1 < numberedLines.length) {
              const line = numberedLines[i];
              const nextLine = numberedLines[i + 1];
              
              // Check if this is a numbered line
              if (/^\d+\./.test(line) && !/^\d+\./.test(nextLine)) {
                // This looks like a question followed by answer
                const front = line.replace(/^\d+\.\s*/, '').trim();
                const back = nextLine.trim();
                
                if (front && back && front.length > 3 && back.length > 3) {
                  flashcards.push({
                    id: uuidv4(),
                    front,
                    back,
                    tags: note.tags || [],
                    createdAt: new Date()
                  });
                  
                  // Skip the next line since we used it as the answer
                  i++;
                }
              }
            }
          }
        }
      }
      
      // If we still didn't get enough flashcards, try a final approach as a last resort
      if (flashcards.length < 1) {
        console.warn("All parsing approaches failed, using general text splitting as last resort");
        
        // Try to split by double newlines or markers like ---, ***, etc.
        const sections = content
          .split(/\n\s*\n|\*\*\*|\-\-\-|\d+\.\s+|\n\d+\.\s+/g)
          .map(s => s.trim())
          .filter(s => s.length > 10); // Only keep substantial sections
        
        for (let i = 0; i < Math.min(sections.length, options.maxCards * 2); i += 2) {
          if (i + 1 < sections.length) {
            const front = sections[i];
            const back = sections[i + 1];
            
            if (front && back && front.length > 5 && back.length > 5) {
              flashcards.push({
                id: uuidv4(),
                front,
                back,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          }
        }
        
        // If still no flashcards, split the content into chunks and create cards
        if (flashcards.length < 1 && content.length > 50) {
          console.warn("Last resort: creating flashcards from content chunks");
          
          // Split the content into paragraphs
          const paragraphs = content.split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 15);
          
          // Create flashcards from consecutive paragraphs
          for (let i = 0; i < Math.min(paragraphs.length, options.maxCards); i++) {
            const paragraph = paragraphs[i];
            
            // If it's a long paragraph, turn it into a Q&A
            if (paragraph.length > 40) {
              // Extract a question from the paragraph
              const questionPart = paragraph.substring(0, Math.min(paragraph.length, 100));
              const answerPart = paragraph;
              
              flashcards.push({
                id: uuidv4(),
                front: `What is described in this excerpt: "${questionPart.substring(0, 50)}..."?`,
                back: answerPart,
                tags: note.tags || [],
                createdAt: new Date()
              });
            }
          }
        }
      }
      
      console.log(`Successfully parsed ${flashcards.length} flashcards`);
      if (flashcards.length === 0) {
        console.error("Failed to parse any flashcards from content:", content);
      }
      
      return flashcards.slice(0, options.maxCards);
    } catch (error) {
      console.error('Error in generateFlashcardsWithLLM:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    if (!noteId) {
      alert('Please select a note first');
      return;
    }
    
    // Check for API key
    const apiKey = localStorage.getItem('openRouterApiKey');
    if (!apiKey) {
      alert('Please add an OpenRouter API key in settings to use flashcard generation');
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
        alert(`No flashcards could be generated. This may be due to:
- The AI model's response format was unexpected
- The note content was too short or unclear
- There was an issue with the API

Please try again with different settings or a different note.`);
      }
    } catch (error) {
      console.error('Error in overall flashcard generation process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate flashcards: ${errorMessage}\n\nPlease check your API key and try again.`);
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
        flashcards.push({
          id: uuidv4(),
          front: sections[i],
          back: sections[i + 1],
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