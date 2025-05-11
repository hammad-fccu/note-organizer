'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotes } from '@/store/NoteStore';
import { generateTags } from '@/utils/aiSummary';
import { Zap } from 'lucide-react';

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
  
  // Return the unique tags with their original casing
  return Array.from(uniqueTags.values());
};

export default function NewNotePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNote, getFolderById } = useNotes();
  
  // Get folder ID from query parameters (if any)
  const folderId = searchParams.get('folderId');
  
  // Get folder name for better UX
  const folder = folderId ? getFolderById(folderId) : null;
  const folderName = folder?.name || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new note
    const noteData = {
      title: title.trim() || 'Untitled Note',
      content,
      contentHtml: content.replace(/\n/g, '<br>'),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      favorite: false,
      folderId: folderId || undefined,
    };
    
    addNote(noteData);
    
    // Navigate to the appropriate page
    if (folderId) {
      router.push(`/app/folders/${folderId}`);
    } else {
      router.push('/app/notes');
    }
  };

  // Add generate tags handler
  const handleGenerateTags = async () => {
    if (!content || content.trim().length === 0) {
      alert('Please add some content to your note before generating tags');
      return;
    }
    
    setIsGeneratingTags(true);
    
    try {
      console.log('Starting tag generation with content:', content.substring(0, 50) + '...');
      
      // Use the default model and API key from localStorage
      const model = 'google/gemini-2.0-flash-exp:free';
      const apiKey = localStorage.getItem('openRouterApiKey') || '';
      
      if (!apiKey) {
        alert('Please add an OpenRouter API key in settings to use tag generation');
        setIsGeneratingTags(false);
        return;
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
      
      // Update local state
      setTags(newTagsString);
    } catch (error) {
      console.error('Failed to generate tags:', error);
      alert('Failed to generate tags. Please try again later.');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Create New Note</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {folder 
            ? `Adding note to folder: ${folderName}`
            : 'Write your note content and add relevant tags'}
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
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
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags (comma-separated)
              </label>
              <button
                type="button"
                onClick={handleGenerateTags}
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
                    <Zap className="w-4 h-4 mr-1" />
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
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Note
            </button>
            
            <button
              type="button"
              onClick={() => folderId ? router.push(`/app/folders/${folderId}`) : router.push('/app/notes')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 