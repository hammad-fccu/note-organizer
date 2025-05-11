'use client';

import { useState, useCallback } from 'react';
import { useNotes } from '@/store/NoteStore';
import { Flashcard, CardType, FieldMapping } from '@/types/flashcards';

// Import components
import NoteDeckSelector from '@/components/flashcards/NoteDeckSelector';
import CardTypeMapper from '@/components/flashcards/CardTypeMapper';
import FlashcardGenerator from '@/components/flashcards/FlashcardGenerator';
import FlashcardTable from '@/components/flashcards/FlashcardTable';
import ExportControls from '@/components/flashcards/ExportControls';

export default function FlashcardsPage() {
  // State for the flashcard generation flow
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
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
        {/* Step 1 and 2 side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Note Selection */}
          <NoteDeckSelector
            onNoteSelected={handleNoteSelected}
            onDeckNameChanged={handleDeckNameChanged}
          />
          
          {/* Step 2: Card Type & Mapping */}
          <CardTypeMapper
            onCardTypeChanged={handleCardTypeChanged}
            onFieldMappingChanged={handleFieldMappingChanged}
          />
        </div>
        
        {/* Step 3: Flashcard Generation */}
        <FlashcardGenerator
          noteId={selectedNoteId}
          cardType={cardType}
          onFlashcardsGenerated={handleFlashcardsGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
        
        {/* Step 4: Preview & Edit */}
        <FlashcardTable
          flashcards={flashcards}
          onFlashcardsUpdated={handleFlashcardsUpdated}
        />
        
        {/* Step 5: Export */}
        <ExportControls
          flashcards={flashcards}
          deckName={deckName}
          modelName={cardType}
        />
      </div>
    </div>
  );
} 