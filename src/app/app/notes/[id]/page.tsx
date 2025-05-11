'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotes } from '@/store/NoteStore';
import NoteSummary from '@/components/NoteSummary';
import NoteTabs from '@/components/NoteTabs';
import { SummaryType } from '@/utils/aiSummary';
import { getTagStyle } from '@/utils/tagColors';

// Add these imports for the API call
import { generateTags } from '@/utils/aiSummary';

// Add a function to normalize and deduplicate tags
const normalizeTags = (tags: string[]): string[] => {
  // Convert all tags to lowercase for comparison
  const lowercaseTags = tags.map(tag => tag.toLowerCase().trim());
  
  // Create a map of lowercase to preferred case (keeping the first occurrence's casing)
  const uniqueTags = new Map<string, string>();
  
  // First pass: exact matches
  tags.forEach((tag, index) => {
    const normalizedTag = lowercaseTags[index];
    // Only add the first occurrence of each tag (keeping original casing)
    if (!uniqueTags.has(normalizedTag)) {
      uniqueTags.set(normalizedTag, tag.trim());
    }
  });
  
  // Second pass: handle similar tags, plurals, etc.
  const finalTags = new Map<string, string>();
  const processedKeys: Set<string> = new Set();
  
  Array.from(uniqueTags.entries()).forEach(([key, value]) => {
    if (processedKeys.has(key)) return;
    
    // Check for plural/singular forms (simple s/es suffix)
    let isMerged = false;
    for (const [otherKey, otherValue] of uniqueTags.entries()) {
      if (key === otherKey || processedKeys.has(otherKey)) continue;
      
      // Skip if length difference is too large (likely different concepts)
      if (Math.abs(key.length - otherKey.length) > 3) continue;
      
      // Check for plural form
      if ((key + 's' === otherKey) || (key === otherKey + 's') ||
          (key + 'es' === otherKey) || (key === otherKey + 'es')) {
        // Keep the shorter one generally (singular form)
        const preferred = key.length <= otherKey.length ? value : otherValue;
        finalTags.set(key.length <= otherKey.length ? key : otherKey, preferred);
        processedKeys.add(key);
        processedKeys.add(otherKey);
        isMerged = true;
        break;
      }
      
      // Check for hyphenated vs space variants (e.g., "real-time" vs "real time")
      const keyNoSpace = key.replace(/[-\s]/g, '');
      const otherKeyNoSpace = otherKey.replace(/[-\s]/g, '');
      if (keyNoSpace === otherKeyNoSpace) {
        // Prefer the form with spaces
        const preferred = key.includes('-') ? otherValue : value;
        finalTags.set(key.includes('-') ? otherKey : key, preferred);
        processedKeys.add(key);
        processedKeys.add(otherKey);
        isMerged = true;
        break;
      }
    }
    
    if (!isMerged && !processedKeys.has(key)) {
      finalTags.set(key, value);
      processedKeys.add(key);
    }
  });
  
  // Return the unique tags with their original casing
  return Array.from(finalTags.values());
};

interface NotePageProps {
  params: {
    id: string;
  };
}

export default function NotePage({ params }: NotePageProps) {
  const { id } = params;
  const router = useRouter();
  const { getNoteById, updateNote, deleteNote, favoriteNote, addSummaryToNote, folders, moveNoteToFolder } = useNotes();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<{
    text: string;
    type: SummaryType;
    createdAt: string;
  } | undefined>(undefined);
  // Add state for tag generation
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  // Add state to force re-render when tags update
  const [tagUpdateCount, setTagUpdateCount] = useState(0);
  
  // Load note data
  useEffect(() => {
    const note = getNoteById(id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.join(', '));
      setIsFavorite(note.favorite);
      setSummary(note.summary);
      setFolderId(note.folderId);
    } else {
      setNotFound(true);
    }
  }, [id, getNoteById]);
  
  // Add debugging effect to monitor tags changes
  useEffect(() => {
    console.log('Tags state updated:', tags);
  }, [tags]);
  
  // Refresh note data when switching between edit and view modes
  useEffect(() => {
    if (!isEditing) {
      const note = getNoteById(id);
      if (note) {
        setTags(note.tags.join(', '));
      }
    }
  }, [isEditing, id, getNoteById]);
  
  // Refresh note data when tagUpdateCount changes
  useEffect(() => {
    if (tagUpdateCount > 0) {
      const note = getNoteById(id);
      if (note) {
        setTags(note.tags.join(', '));
        console.log('Updated tags from effect:', note.tags);
      }
    }
  }, [tagUpdateCount, id, getNoteById]);
  
  const handleSave = () => {
    // Split tags, trim them, and filter out empty tags
    const tagList = tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    // Deduplicate tags using the normalizeTags function
    const uniqueTags = normalizeTags(tagList);
    
    updateNote(id, {
      title: title.trim() || 'Untitled Note',
      content,
      contentHtml: content.replace(/\n/g, '<br>'),
      tags: uniqueTags,
    });
    
    // Handle folder change separately if changed
    moveNoteToFolder(id, folderId || null);
    
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
      router.push('/app/notes');
    }
  };
  
  const handleToggleFavorite = () => {
    favoriteNote(id, !isFavorite);
    setIsFavorite(!isFavorite);
  };
  
  const handleSummarize = (summaryText: string, type: SummaryType) => {
    const newSummary = {
      text: summaryText,
      type,
      createdAt: new Date().toISOString()
    };
    addSummaryToNote(id, summaryText, type);
    setSummary(newSummary);
  };

  // Add generate tags handler
  const handleGenerateTags = async () => {
    if (!content || content.trim().length === 0) {
      alert('Please add some content to your note before generating tags');
      return Promise.reject('No content');
    }
    
    setIsGeneratingTags(true);
    
    try {
      console.log('Starting tag generation with content:', content.substring(0, 50) + '...');
      
      // Use the default model and API key - in a real app you'd get these from settings
      // For demo we're mocking this functionality
      const model = 'google/gemini-2.0-flash-exp:free';
      const apiKey = localStorage.getItem('openrouter_api_key') || '';
      
      if (!apiKey) {
        alert('Please add an OpenRouter API key in settings to use tag generation');
        setIsGeneratingTags(false);
        return Promise.reject('No API key');
      }
      
      const generatedTags = await generateTags({
        text: content,
        title: title || 'Untitled Note',
        model,
        apiKey
      });
      
      console.log('Received generated tags:', generatedTags);
      
      // If we have existing tags, merge them with the generated ones
      const existingTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t !== '') : [];
      const allTags = [...existingTags, ...generatedTags];
      
      // Normalize and deduplicate tags
      const uniqueTags = normalizeTags(allTags);
      const newTagsString = uniqueTags.join(', ');
      
      console.log('Merged tags string:', newTagsString);
      console.log('Current tags before update:', tags);
      
      // Update local state
      setTags(newTagsString);
      
      // Make sure to create a clean array of tags for storing in the note
      const cleanTags = uniqueTags;
      
      console.log('Clean tags for store update:', cleanTags);
      
      // Save changes to store
      updateNote(id, {
        title,
        content,
        contentHtml: content.replace(/\n/g, '<br>'),
        tags: cleanTags,
      });
      
      // Reload note data to ensure UI is in sync with store
      const updatedNote = getNoteById(id);
      if (updatedNote) {
        console.log('Updated note tags from store:', updatedNote.tags);
      }
      
      return Promise.resolve(cleanTags);
    } catch (error) {
      console.error('Failed to generate tags:', error);
      alert('Failed to generate tags. Please try again later.');
      return Promise.reject(error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Get current folder name
  const currentFolder = folderId ? folders.find(f => f.id === folderId) : null;

  // Render note content tab
  const renderNoteContent = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{title || 'Untitled Note'}</h2>
        <div className="prose dark:prose-invert max-w-none">
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      {/* Always show the Tags section, even when empty */}
      <div className="mb-4">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags:</h3>
        </div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 flex flex-wrap gap-2">
            {tags ? tags.split(',').map((tag, index) => (
              tag.trim() && (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={getTagStyle(tag.trim())}
                >
                  {tag.trim()}
                </span>
              )
            )) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">No tags yet. Click "Generate Tags" to create tags based on your note content.</span>
            )}
          </div>
          <button
            onClick={() => {
              handleGenerateTags().then(() => {
                console.log('Tags updated in view mode');
                setTagUpdateCount(prev => prev + 1);
              }).catch(err => console.error('Tag generation error:', err));
            }}
            disabled={isGeneratingTags || !content}
            className={`px-3 py-1 bg-gray-800 text-blue-400 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] min-w-fit ${isGeneratingTags ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Generate or enhance tags based on note content"
          >
            {isGeneratingTags ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Tags
              </>
            )}
          </button>
        </div>
      </div>
      
      {currentFolder && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Folder:</h3>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <Link href={`/app/folders/${folderId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
              {currentFolder.name}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render AI tools tab
  const renderAITools = () => (
    <NoteSummary 
      noteContent={content}
      onSummarize={handleSummarize}
      existingSummary={summary}
    />
  );
  
  if (notFound) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-xl font-medium mb-2">Note not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The note you're looking for doesn't exist or has been deleted
          </p>
          <Link
            href="/app/notes"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link
            href="/app/notes"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Notes
          </Link>
          {isEditing ? (
            <h1 className="text-2xl font-bold">Edit Note</h1>
          ) : (
            <h1 className="text-2xl font-bold">{title || 'Untitled Note'}</h1>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
          </button>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-2 rounded-full text-green-500 hover:text-green-600"
              title="Save changes"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full text-blue-500 hover:text-blue-600"
              title="Edit note"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-red-500 hover:text-red-600"
            title="Delete note"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {isEditing ? (
          <div>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={12}
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags (comma-separated)
                </label>
                <button
                  onClick={() => {
                    handleGenerateTags().then(() => {
                      console.log('Tags updated in edit mode');
                      setTagUpdateCount(prev => prev + 1);
                    }).catch(err => console.error('Tag generation error:', err));
                  }}
                  disabled={isGeneratingTags || !content}
                  className={`px-3 py-1 bg-gray-800 text-blue-400 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] ${isGeneratingTags ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Auto-generate tags based on content"
                >
                  {isGeneratingTags ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Tags
                    </>
                  )}
                </button>
              </div>
              <div className="mt-3">
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. research, science, biology"
                  className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Click "Generate Tags" to automatically create relevant tags based on your note content.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder
              </label>
              <div className="flex items-center">
                <select
                  id="folder"
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || undefined)}
                  className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None (All Notes)</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <NoteTabs tabs={[
              {
                id: 'content',
                label: 'Note',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                ),
                content: renderNoteContent()
              },
              {
                id: 'ai',
                label: 'AI Tools',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                ),
                content: renderAITools()
              }
            ]} />
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 