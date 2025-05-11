// Types for flashcard generation feature

// Flashcard represents a single Q&A pair
export interface Flashcard {
  id: string;  // Unique identifier
  front: string;  // Question/front side
  back: string;   // Answer/back side
  tags: string[]; // Tags for categorization
  extra?: string; // Optional additional information
  createdAt: Date;
}

// Card type options - standard Anki card types
export type CardType = 'Basic' | 'Basic (and reversed card)' | 'Cloze';

// Field mapping configuration
export interface FieldMapping {
  noteHeadings: 'front' | 'back' | 'extra' | 'none';
  paragraphs: 'front' | 'back' | 'extra' | 'none';
  noteTags: boolean; // Whether to include note tags
}

// Generator options for LLM-based flashcard generation
export interface GeneratorOptions {
  noteId: string;
  template: string;
  maxCards: number;
  temperature: number;
}

// Export payload format
export interface AnkiExportPayload {
  deckName: string;
  modelName: string; // Anki card model name
  cards: {
    front: string;
    back: string;
    tags: string[];
    extra?: string;
  }[];
  options?: {
    tagPrefix?: string;
    includeTags: boolean;
    bundleMedia: boolean;
  };
} 