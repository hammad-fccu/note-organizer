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

// Generate a summary prompt based on the summary type
function getSummaryPrompt(text: string, type: SummaryType): string {
  switch (type) {
    case 'brief':
      return `Summarize the following text in 2-3 concise sentences capturing the main points. DO NOT include phrases like "Here is a summary" or "In summary". DO NOT add any introduction or conclusion. ONLY output the summary text itself:\n\n${text}`;
    case 'detailed':
      return `Provide a detailed summary of the following text explaining the main concepts and important details. DO NOT include phrases like "Here is a summary" or "In conclusion". DO NOT add any introduction or conclusion. ONLY output the summary text itself:\n\n${text}`;
    case 'bullets':
      return `Summarize the following text as 3-5 bullet points highlighting the key takeaways. DO NOT include phrases like "Here are the bullet points" or any other introduction. Start directly with the bullet points:\n\n${text}`;
    default:
      return `Summarize the following text in 2-3 sentences. DO NOT include phrases like "Here is a summary" or any other introduction or conclusion. ONLY output the summary text itself:\n\n${text}`;
  }
}

// Function to generate a summary using OpenRouter API
export async function generateSummary({ text, type, model, apiKey }: SummaryOptions): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Truncate text if it's too long
  const maxTextLength = 10000;
  const truncatedText = text.length > maxTextLength 
    ? text.substring(0, maxTextLength) + "... (text truncated due to length)"
    : text;
  
  // Create the prompt based on summary type
  const prompt = getSummaryPrompt(truncatedText, type);
  
  try {
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
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText || "Unknown error occurred");
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
      throw new Error("The model returned an empty response");
    }
    
    // Clean up the summary
    summaryText = summaryText.trim();
    
    // Remove common introductory phrases
    const phrasesToRemove = [
      /^here is a summary:?\s*/i,
      /^here are the key points:?\s*/i, 
      /^summary:?\s*/i,
      /^in summary:?\s*/i,
      /^the summary is:?\s*/i,
      /^here are the bullet points:?\s*/i,
      /^bullet points:?\s*/i,
      /^key takeaways:?\s*/i,
      /^to summarize:?\s*/i,
      /^in conclusion:?\s*/i
    ];
    
    for (const phrase of phrasesToRemove) {
      summaryText = summaryText.replace(phrase, '');
    }
    
    return summaryText;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error generating summary: ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
}

// Function to generate tags using LLMs
export async function generateTags({ text, title, model, apiKey }: TagGenerationOptions): Promise<string[]> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Truncate text if it's too long
  const maxTextLength = 10000;
  const truncatedText = text.length > maxTextLength 
    ? text.substring(0, maxTextLength) + "... (text truncated due to length)"
    : text;
  
  // Create the prompt for tag generation
  const prompt = `Please analyze the following note titled "${title}" and generate 3-7 relevant tags or keywords that best categorize this content. Tags should be single words or short phrases (max 2-3 words) that capture the main topics, concepts, and themes. Return only the tags separated by commas without any other text or explanation.\n\nNote content:\n${truncatedText}`;
  
  try {
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
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText || "Unknown error occurred");
    }
    
    const data = await response.json();
    
    // Extract response text
    let tagsText = '';
    if (data.choices && data.choices.length > 0) {
      if (data.choices[0].message && data.choices[0].message.content) {
        tagsText = data.choices[0].message.content.trim();
      } else if (data.choices[0].text) {
        tagsText = data.choices[0].text.trim();
      }
    }
    
    if (!tagsText) {
      throw new Error("The model returned an empty response");
    }
    
    // Process the response to extract clean tags
    // Split by commas, remove empty entries, and trim whitespace
    const tags = tagsText.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    return tags;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error generating tags: ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
} 