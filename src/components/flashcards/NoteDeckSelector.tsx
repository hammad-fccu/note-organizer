import { useState, useEffect, useRef, useMemo } from 'react';
import { useNotes } from '@/store/NoteStore';
import { getTagStyle } from '@/utils/tagColors';

interface NoteDeckSelectorProps {
  onNoteSelected: (noteId: string) => void;
  onDeckNameChanged: (deckName: string) => void;
  preselectedNoteId?: string;
}

export default function NoteDeckSelector({ onNoteSelected, onDeckNameChanged, preselectedNoteId }: NoteDeckSelectorProps) {
  const { notes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(preselectedNoteId || '');
  const [deckName, setDeckName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagFilterRef = useRef<HTMLDivElement>(null);
  const previousNoteIdRef = useRef<string>('');
  const userEditedDeckName = useRef<boolean>(false);
  
  // Get the selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId);
  
  // Handle preselected note ID when the component mounts or when preselectedNoteId changes
  useEffect(() => {
    if (preselectedNoteId && preselectedNoteId !== selectedNoteId) {
      setSelectedNoteId(preselectedNoteId);
    }
  }, [preselectedNoteId]);
  
  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => {
        tagSet.add(tag);
      });
    });
    return Array.from(tagSet);
  }, [notes]);
  
  // Filter notes based on search query and selected tag
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = searchQuery === '' || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesTag = selectedTag === null || (note.tags && note.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);
  
  // Call onNoteSelected when selectedNoteId changes
  useEffect(() => {
    if (selectedNoteId && onNoteSelected) {
      onNoteSelected(selectedNoteId);
    }
  }, [selectedNoteId, onNoteSelected]);
  
  // Set deck name based on selected note
  useEffect(() => {
    // Only update the deck name if the note ID has changed
    if (selectedNoteId && selectedNoteId !== previousNoteIdRef.current) {
      const note = notes.find(note => note.id === selectedNoteId);
      if (note) {
        const newDeckName = `${note.title} Flashcards`;
        setDeckName(newDeckName);
        onDeckNameChanged(newDeckName);
        
        // Update the ref to the current note ID
        previousNoteIdRef.current = selectedNoteId;
        // Reset the user edited flag since we're setting a new default
        userEditedDeckName.current = false;
      }
    }
  }, [selectedNoteId, notes, onDeckNameChanged]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (tagFilterRef.current && !tagFilterRef.current.contains(event.target as Node)) {
        setIsTagFilterOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsDropdownOpen(false);
  };
  
  const handleDeckNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDeckName = e.target.value;
    setDeckName(newDeckName);
    onDeckNameChanged(newDeckName);
    
    // Mark that the user has manually edited the deck name
    userEditedDeckName.current = true;
  };
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if already selected
    } else {
      setSelectedTag(tag); // Select new tag
    }
    setIsTagFilterOpen(false);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
  };
  
  const toggleTagFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTagFilterOpen(!isTagFilterOpen);
    setIsDropdownOpen(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-lg font-medium mb-4">Select Note & Name Your Deck</h2>
      
      <div className="space-y-4">
        {/* Note Selection */}
        <div>
          <label htmlFor="note-search" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select a Note {selectedTag && <span className="ml-1 text-blue-600 dark:text-blue-400">• Filtered by tag: {selectedTag}</span>}
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                id="note-search"
                type="text"
                placeholder={selectedNote ? selectedNote.title : "Search and select a note..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 pr-16"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {/* Filter button */}
                <button 
                  className="flex items-center px-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={toggleTagFilter}
                  title="Filter by tag"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                  </svg>
                  {selectedTag && <span className="ml-1 w-2 h-2 rounded-full bg-blue-500"></span>}
                </button>
                
                {/* Dropdown toggle button */}
                <button 
                  className="flex items-center px-2 text-gray-500 dark:text-gray-400"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                  </svg>
                </button>
              </div>
              
              {/* Tag filter dropdown */}
              {isTagFilterOpen && (
                <div 
                  className="absolute z-20 right-8 mt-1 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg overflow-hidden"
                  ref={tagFilterRef}
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Tag</h3>
                    {selectedTag && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {allTags.length > 0 ? (
                    <div className="p-2 flex flex-wrap gap-1.5 max-h-80 overflow-y-auto">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={`px-2 py-1 text-xs rounded-full text-white transition duration-200 flex-shrink-0 ${
                            selectedTag === tag ? 'ring-2 ring-offset-1 ring-white dark:ring-offset-gray-800' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={getTagStyle(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                      No tags available
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Note dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredNotes.length > 0 ? (
                  <ul className="py-1">
                    {filteredNotes.map(note => (
                      <li 
                        key={note.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          selectedNoteId === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <div className="font-medium truncate">{note.title}</div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags.map(tag => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 text-xs rounded-full text-white ${
                                  selectedTag === tag ? 'ring-1 ring-white' : ''
                                }`}
                                style={getTagStyle(tag)}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No notes found
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedNoteId && selectedNote?.tags && selectedNote.tags.length > 0 && !isDropdownOpen && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedNote.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full text-white"
                  style={getTagStyle(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {notes.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              You don't have any notes yet. Create a note first.
            </p>
          )}
          
          {notes.length > 0 && filteredNotes.length === 0 && selectedTag && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              No notes with the tag "{selectedTag}". Try selecting a different tag.
            </p>
          )}
        </div>
        
        {/* Deck Name */}
        <div>
          <label htmlFor="deck-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Anki Deck Name
          </label>
          <input
            type="text"
            id="deck-name"
            value={deckName}
            onChange={handleDeckNameChange}
            placeholder="e.g., Biology 101 Flashcards"
            className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This will be the name of your Anki deck when imported
          </p>
        </div>
      </div>
    </div>
  );
} 