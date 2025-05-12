// Types for summarization
export type SummaryType = 'brief' | 'detailed' | 'bullets';

export interface SummaryOptions {
  text: string;
  type: SummaryType;
  apiKey: string;
  model: string;
}

// New interface for tag generation
export interface TagGenerationOptions {
  text: string;
  title: string;
  apiKey: string;
  model: string;
}

// Available AI models
export const AI_MODELS = [
  { id: 'openai/gpt-3.5-turbo', name: 'OpenAI GPT-3.5 Turbo (Free)' },
  { id: 'anthropic/claude-3-haiku', name: 'Anthropic Claude 3 Haiku (Free)' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Meta Llama 3 8B Instruct (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)' },
];

// Gemini API key for fallback
const GEMINI_API_KEY = "AIzaSyBAISSbMog7i4VjD1ala_V9G9yePCYJI-8";

// Function to call Gemini API as a fallback
export const callGeminiApi = async (prompt: string): Promise<string> => {
  console.log("Falling back to Gemini API");
  
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts:[{text: prompt}]
      }]
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
};

// Function to get the appropriate prompt for a summary
function getSummaryPrompt(text: string, type: SummaryType): string {
  switch (type) {
    case 'brief':
      return `Please provide a brief summary (2-3 sentences) of the following text:\n\n${text}`;
    case 'bullets':
      return `Please provide a bulleted summary (5-7 key points) of the following text. Use a simple bullet point format with one line per point:\n\n${text}`;
    case 'detailed':
      return `Please provide a detailed summary (1-2 paragraphs) of the following text, covering all the main points and important details:\n\n${text}`;
    default:
      return `Please summarize the following text:\n\n${text}`;
  }
}

// Function to generate a summary using OpenRouter API
export async function generateSummary({ text, type, model, apiKey }: SummaryOptions): Promise<string> {
  // Truncate text if it's too long
  const maxTextLength = 10000;
  const truncatedText = text.length > maxTextLength 
    ? text.substring(0, maxTextLength) + "... (text truncated due to length)"
    : text;
  
  // Create the prompt based on summary type
  const prompt = getSummaryPrompt(truncatedText, type);
  
  try {
    // If no API key, use Gemini directly
    if (!apiKey) {
      console.log("No OpenRouter API key found, using Gemini API directly for summary");
      const summaryText = await callGeminiApi(prompt);
      console.log("Successfully retrieved summary from Gemini API");
      return summaryText.trim();
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "Smart Note Organizer"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      // Try the fallback to Gemini API
      console.log("OpenRouter API call failed in generateSummary, trying Gemini API fallback");
      const summaryText = await callGeminiApi(prompt);
      console.log("Successfully retrieved summary from Gemini API fallback");
      return summaryText.trim();
    }
    
    const data = await response.json();
    
    // Extract the summary from the response
    let summaryText = '';
    if (data.choices && data.choices.length > 0) {
      if (data.choices[0].message && data.choices[0].message.content) {
        summaryText = data.choices[0].message.content;
      } else if (data.choices[0].text) {
        summaryText = data.choices[0].text;
      }
    }
    
    if (!summaryText) {
      // Try the fallback to Gemini API if OpenRouter returned empty content
      console.log("OpenRouter API returned empty content, trying Gemini API fallback");
      summaryText = await callGeminiApi(prompt);
      console.log("Successfully retrieved summary from Gemini API fallback");
    }
    
    // Clean up the summary
    return summaryText.trim();
  } catch (error) {
    console.error("Error in generateSummary:", error);
    
    // Try the fallback to Gemini API as a last resort
    try {
      console.log("Error with OpenRouter in generateSummary, trying Gemini API as last resort");
      const summaryText = await callGeminiApi(prompt);
      console.log("Successfully retrieved summary from Gemini API last resort");
      return summaryText.trim();
    } catch (geminiError) {
      console.error("Both OpenRouter and Gemini API failed:", geminiError);
      throw new Error("Failed to generate summary. Both primary and fallback APIs failed.");
    }
  }
}

// Function to normalize tags
export function normalizeTags(tags: string[]): string[] {
  // Step 1: Clean each tag - lowercase, trim whitespace, remove symbols
  let cleanedTags = tags.map(tag => 
    tag.toLowerCase()
      .trim()
      .replace(/^[#\s]+/, '') // Remove leading # and spaces
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces, hyphens
      .trim()
  );
  
  // Step 2: Filter out empty tags and duplicates
  cleanedTags = [...new Set(cleanedTags)].filter(tag => tag !== '');
  
  return cleanedTags;
}

// Function to generate tags using LLMs
export async function generateTags({ text, title, model, apiKey }: TagGenerationOptions): Promise<string[]> {
  console.log('generateTags called with:', { 
    textLength: text?.length || 0, 
    title: title || 'Untitled', 
    model: model || 'default', 
    hasApiKey: !!apiKey 
  });
  
  if (!text || text.trim().length === 0) {
    console.error('Text content is empty or undefined');
    return []; // Return empty tags array instead of throwing error
  }
  
  // Truncate text if it's too long
  const maxTextLength = 10000;
  const truncatedText = text.length > maxTextLength 
    ? text.substring(0, maxTextLength) + "... (text truncated due to length)"
    : text;
  
  // Create the prompt for tag generation
  const safeTitle = title || 'Untitled';
  const prompt = `Please analyze the following note titled "${safeTitle}" and generate 3-7 relevant tags or keywords that best categorize this content. Tags should be single words or short phrases (max 2-3 words) that capture the main topics, concepts, and themes. Return only the tags separated by commas without any other text or explanation.\n\nNote content:\n${truncatedText}`;
  
  // If no API key, use Gemini directly
  if (!apiKey) {
    console.log("No OpenRouter API key found, using Gemini API directly for tag generation");
    try {
      const tagsText = await callGeminiApi(prompt);
      console.log("Successfully retrieved tags from Gemini API");
      
      // Process the response to extract clean tags
      const tags = tagsText.split(',')
        .map(tag => (tag || '').trim())
        .filter(tag => tag !== '');
      
      return normalizeTags(tags);
    } catch (geminiError) {
      console.error("Gemini API failed:", geminiError);
      return []; // Return empty array
    }
  }
  
  console.log(`Sending request to OpenRouter API with model: ${model}`);
  
  try {
    // Safe URL handling
    let referer;
    try {
      referer = typeof window !== 'undefined' ? 
        (window.location?.href || 'http://localhost') : 
        'http://localhost';
    } catch (err) {
      console.error('Error getting window location:', err);
      referer = 'http://localhost';
    }
    
    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": referer,
          "X-Title": "Smart Note Organizer"
        },
        body: JSON.stringify({
          model: model || 'google/gemini-2.0-flash-exp:free', // Use default model if not specified
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
    } catch (fetchErr) {
      console.error('Fetch error in generateTags:', fetchErr);
      // Try the fallback to Gemini API
      try {
        console.log("Fetch error in generateTags, trying Gemini API fallback");
        const tagsText = await callGeminiApi(prompt);
        console.log("Successfully retrieved tags from Gemini API fallback");
        
        // Process the response to extract clean tags
        const tags = tagsText.split(',')
          .map(tag => (tag || '').trim())
          .filter(tag => tag !== '');
        
        return normalizeTags(tags);
      } catch (geminiError) {
        console.error("Gemini API fallback also failed:", geminiError);
        return []; // Return empty array
      }
    }
    
    if (!response) {
      console.error('No response received from API');
      // Try the fallback to Gemini API
      try {
        console.log("No response in generateTags, trying Gemini API fallback");
        const tagsText = await callGeminiApi(prompt);
        console.log("Successfully retrieved tags from Gemini API fallback");
        
        // Process the response to extract clean tags
        const tags = tagsText.split(',')
          .map(tag => (tag || '').trim())
          .filter(tag => tag !== '');
        
        return normalizeTags(tags);
      } catch (geminiError) {
        console.error("Gemini API fallback also failed:", geminiError);
        return []; // Return empty array
      }
    }
    
    console.log(`Response status: ${response.status}`);
    
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
      
      console.error(errorMessage);
      
      // Try the fallback to Gemini API
      try {
        console.log("OpenRouter API error in generateTags, trying Gemini API fallback");
        const tagsText = await callGeminiApi(prompt);
        console.log("Successfully retrieved tags from Gemini API fallback");
        
        // Process the response to extract clean tags
        const tags = tagsText.split(',')
          .map(tag => (tag || '').trim())
          .filter(tag => tag !== '');
        
        return normalizeTags(tags);
      } catch (geminiError) {
        console.error("Gemini API fallback also failed:", geminiError);
        return []; // Return empty array
      }
    }
    
    let data;
    try {
      data = await response.json();
      console.log('API response data:', data);
    } catch (err) {
      console.error('Failed to parse JSON response:', err);
      
      // Try the fallback to Gemini API
      try {
        console.log("Failed to parse JSON in generateTags, trying Gemini API fallback");
        const tagsText = await callGeminiApi(prompt);
        console.log("Successfully retrieved tags from Gemini API fallback");
        
        // Process the response to extract clean tags
        const tags = tagsText.split(',')
          .map(tag => (tag || '').trim())
          .filter(tag => tag !== '');
        
        return normalizeTags(tags);
      } catch (geminiError) {
        console.error("Gemini API fallback also failed:", geminiError);
        return []; // Return empty array
      }
    }
    
    // Extract response text
    let tagsText = '';
    if (data?.choices && data.choices.length > 0) {
      if (data.choices[0]?.message && data.choices[0].message.content) {
        tagsText = data.choices[0].message.content.trim();
      } else if (data.choices[0]?.text) {
        tagsText = data.choices[0].text.trim();
      }
    }
    
    if (!tagsText) {
      console.error('Empty response from API:', data);
      
      // Try the fallback to Gemini API
      try {
        console.log("Empty response in generateTags, trying Gemini API fallback");
        tagsText = await callGeminiApi(prompt);
        console.log("Successfully retrieved tags from Gemini API fallback");
      } catch (geminiError) {
        console.error("Gemini API fallback also failed:", geminiError);
        return []; // Return empty array
      }
    }
    
    console.log('Raw tags response:', tagsText);
    
    // Process the response to extract clean tags
    // Split by commas, remove empty entries, and trim whitespace
    const tags = tagsText.split(',')
      .map(tag => (tag || '').trim())
      .filter(tag => tag !== '');
    
    console.log('Final processed tags:', tags);
    return normalizeTags(tags);
  } catch (error) {
    console.error('Unexpected error in generateTags:', error);
    return []; // Return empty array as a fallback
  }
} 