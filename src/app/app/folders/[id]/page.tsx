'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/store/NoteStore';
import { getTagStyle } from '@/utils/tagColors';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function FolderPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id } = use(params);
  const router = useRouter();
  const { 
    folders, 
    notes, 
    getFolderById, 
    getNotesInFolder, 
    updateFolder, 
    deleteFolder,
    deleteNote,
    favoriteNote,
    moveNoteToFolder
  } = useNotes();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [isEditing, setIsEditing] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [showRemoveNoteModal, setShowRemoveNoteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [noteToRemove, setNoteToRemove] = useState<string | null>(null);
  
  // Get folder
  const folder = getFolderById(id);
  
  // Get notes in this folder
  const folderNotes = getNotesInFolder(id);
  
  // If folder doesn't exist, redirect to notes page
  if (!folder) {
    router.push('/app/notes');
    return null;
  }
  
  // Initialize folder name for editing
  if (folderName === '' && folder.name) {
    setFolderName(folder.name);
  }
  
  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    return folderNotes
      .filter(note => 
        searchTerm === '' || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else {
          return a.title.localeCompare(b.title);
        }
      });
  }, [folderNotes, searchTerm, sortBy]);
  
  const handleSaveFolder = () => {
    if (folderName.trim()) {
      updateFolder(id, { name: folderName.trim() });
    }
    setIsEditing(false);
  };
  
  const handleDeleteFolder = () => {
    setShowDeleteFolderModal(true);
  };

  const confirmDeleteFolder = () => {
    deleteFolder(id);
    router.push('/app/notes');
  };
  
  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteNoteModal(true);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete);
      setShowDeleteNoteModal(false);
      setNoteToDelete(null);
    }
  };
  
  const handleToggleFavorite = (noteId: string, isFavorite: boolean) => {
    favoriteNote(noteId, !isFavorite);
  };
  
  const handleRemoveFromFolder = (noteId: string) => {
    setNoteToRemove(noteId);
    setShowRemoveNoteModal(true);
  };

  const confirmRemoveFromFolder = () => {
    if (noteToRemove) {
      moveNoteToFolder(noteToRemove, null);
      setShowRemoveNoteModal(false);
      setNoteToRemove(null);
    }
  };

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
            <div className="flex items-center">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="text-2xl font-bold py-1 px-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
              />
              <button
                onClick={handleSaveFolder}
                className="ml-2 p-1 text-green-600 hover:text-green-700"
                title="Save"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="ml-1 p-1 text-red-600 hover:text-red-700"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h1 className="text-2xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                {folder.name}
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Edit folder name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Link
            href={`/app/new?folderId=${id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            New Note
          </Link>
          
          <Link
            href={`/app/import?folderId=${id}`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Import Document
          </Link>
          
          <button
            onClick={handleDeleteFolder}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete Folder
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="search"
              className="w-full p-2 pl-10 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search in this folder"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-1 md:max-w-xs">
            <select
              className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium truncate pr-4">{note.title}</h3>
                  <button
                    onClick={() => handleToggleFavorite(note.id, note.favorite)}
                    className={note.favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
                  >
                    <svg className="w-5 h-5" fill={note.favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
                  {note.content.substring(0, 150)}{note.content.length > 150 ? '...' : ''}
                </p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap mb-3 gap-1">
                    {note.tags.map(tag => (
                      <Link 
                        key={tag} 
                        href={`/app/notes?tag=${tag}`}
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={getTagStyle(tag)}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last edited: {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/app/notes/${note.id}`}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleRemoveFromFolder(note.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                      title="Remove from folder"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
          <h3 className="text-xl font-medium mb-2">This folder is empty</h3>
          
          {searchTerm ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No notes match your search
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add notes to this folder to organize your content
            </p>
          )}
          
          <Link 
            href={`/app/new?folderId=${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create New Note
          </Link>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteFolderModal}
        onClose={() => setShowDeleteFolderModal(false)}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? Notes in this folder will be moved back to the main notes section."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Note Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteNoteModal}
        onClose={() => setShowDeleteNoteModal(false)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Remove Note from Folder Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveNoteModal}
        onClose={() => setShowRemoveNoteModal(false)}
        onConfirm={confirmRemoveFromFolder}
        title="Remove from Folder"
        message="Remove this note from the folder? It will still be available in All Notes."
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
} 