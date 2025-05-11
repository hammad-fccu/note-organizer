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

// Practice flashcards types
export interface FlashcardReview {
  id: string;
  deckId?: string;
  noteId?: string;
  front: string;
  back: string;
  tags: string[];
  dueDate: string;
  reviewCount: number;
  lastReviewed?: string;
  nextInterval?: number;
}

export type GradeType = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewResult {
  cardId: string;
  grade: GradeType;
  reviewTime: number; // milliseconds spent reviewing
  reviewedAt: string; // ISO timestamp
}

export interface ReviewSession {
  id: string;
  userId?: string;
  startedAt: string;
  cardsReviewed: number;
  cardsRemaining: number;
  results: ReviewResult[];
} 