import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '@/types/note';

interface NoteContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  favoriteNote: (id: string, favorite: boolean) => void;
  addTagToNote: (id: string, tag: string) => void;
  removeTagFromNote: (id: string, tag: string) => void;
  getNotesWithTag: (tag: string) => Note[];
  getFavorites: () => Note[];
  getAllTags: () => string[];
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}

interface NoteProviderProps {
  children: ReactNode;
}

export function NoteProvider({ children }: NoteProviderProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
  }, []);
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);
  
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const newNote: Note = {
      ...noteData,
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    setNotes(prevNotes => [...prevNotes, newNote]);
    return newNote;
  };
  
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() } 
          : note
      )
    );
  };
  
  const deleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };
  
  const getNoteById = (id: string) => {
    return notes.find(note => note.id === id);
  };
  
  const favoriteNote = (id: string, favorite: boolean) => {
    updateNote(id, { favorite });
  };
  
  const addTagToNote = (id: string, tag: string) => {
    const note = getNoteById(id);
    if (note && !note.tags.includes(tag)) {
      updateNote(id, { tags: [...note.tags, tag] });
    }
  };
  
  const removeTagFromNote = (id: string, tag: string) => {
    const note = getNoteById(id);
    if (note) {
      updateNote(id, { tags: note.tags.filter(t => t !== tag) });
    }
  };
  
  const getNotesWithTag = (tag: string) => {
    return notes.filter(note => note.tags.includes(tag));
  };
  
  const getFavorites = () => {
    return notes.filter(note => note.favorite);
  };
  
  const getAllTags = () => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagSet.add(tag);
      });
    });
    return Array.from(tagSet);
  };
  
  const value = {
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    favoriteNote,
    addTagToNote,
    removeTagFromNote,
    getNotesWithTag,
    getFavorites,
    getAllTags,
  };
  
  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
} 