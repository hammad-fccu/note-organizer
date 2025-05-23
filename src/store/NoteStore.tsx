import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note, Folder } from '@/types/note';
import { SummaryType } from '@/utils/aiSummary';
import { useSession } from 'next-auth/react';

interface NoteContextType {
  notes: Note[];
  folders: Folder[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  favoriteNote: (id: string, favorite: boolean) => void;
  addTagToNote: (id: string, tag: string) => void;
  removeTagFromNote: (id: string, tag: string) => void;
  getNotesWithTag: (tag: string) => Note[];
  getFavorites: () => Note[];
  getAllTags: () => string[];
  addSummaryToNote: (id: string, summary: string, type: SummaryType) => void;
  updateNoteTags: (id: string, tags: string[]) => void;
  
  // Folder management
  addFolder: (name: string, parentId?: string, color?: string) => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  getFolderById: (id: string) => Folder | undefined;
  getNotesInFolder: (folderId: string) => Note[];
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
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
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  
  // Clear notes and folders when user signs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      setNotes([]);
      setFolders([]);
    }
  }, [status]);
  
  // Load notes and folders from localStorage on mount or when user changes
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const storageKey = `notes_${session.user.id}`;
    const folderKey = `folders_${session.user.id}`;
    
    const savedNotes = localStorage.getItem(storageKey);
    const savedFolders = localStorage.getItem(folderKey);
    
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
    
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error('Failed to parse saved folders', e);
      }
    }
  }, [session?.user?.id, status]);
  
  // Save notes and folders to localStorage whenever they change
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    const storageKey = `notes_${session.user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, session?.user?.id, status]);
  
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    const folderKey = `folders_${session.user.id}`;
    localStorage.setItem(folderKey, JSON.stringify(folders));
  }, [folders, session?.user?.id, status]);
  
  // Note management functions
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const newNote: Note = {
      ...noteData,
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    setNotes(prevNotes => [...prevNotes, newNote]);
    return newNote.id;
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
  
  const addSummaryToNote = (id: string, summary: string, type: SummaryType) => {
    updateNote(id, { 
      summary: {
        text: summary,
        type,
        createdAt: new Date().toISOString()
      } 
    });
  };
  
  const updateNoteTags = (id: string, tags: string[]) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, tags, updatedAt: new Date().toISOString() } 
          : note
      )
    );
  };
  
  // Folder management functions
  const addFolder = (name: string, parentId?: string, color?: string) => {
    const timestamp = new Date().toISOString();
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      parentId,
      color
    };
    
    setFolders(prevFolders => [...prevFolders, newFolder]);
    return newFolder;
  };
  
  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders(prevFolders => 
      prevFolders.map(folder => 
        folder.id === id 
          ? { ...folder, ...updates, updatedAt: new Date().toISOString() } 
          : folder
      )
    );
  };
  
  const deleteFolder = (id: string) => {
    // When deleting a folder, remove all notes from that folder
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.folderId === id
          ? { ...note, folderId: undefined, updatedAt: new Date().toISOString() }
          : note
      )
    );
    
    // Delete the folder itself
    setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
  };
  
  const getFolderById = (id: string) => {
    return folders.find(folder => folder.id === id);
  };
  
  const getNotesInFolder = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId);
  };
  
  const moveNoteToFolder = (noteId: string, folderId: string | null) => {
    updateNote(noteId, { folderId: folderId || undefined });
  };
  
  const value = {
    notes,
    folders,
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
    addSummaryToNote,
    updateNoteTags,
    addFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    getNotesInFolder,
    moveNoteToFolder,
  };
  
  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
} 