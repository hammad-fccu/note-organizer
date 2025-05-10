'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotes } from '@/store/NoteStore';
import { Folder } from '@/types/note';

export default function FolderList() {
  const { folders, addFolder, updateFolder, deleteFolder, getNotesInFolder } = useNotes();
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  const handleSaveEdit = (folderId: string) => {
    if (editFolderName.trim()) {
      updateFolder(folderId, { name: editFolderName.trim() });
      setEditingFolderId(null);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? Notes in this folder will be moved back to the main notes section.')) {
      deleteFolder(folderId);
    }
  };

  return (
    <div className="mt-2 mb-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folders</h3>
        <button 
          onClick={() => setIsAddingFolder(!isAddingFolder)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title="Add folder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>

      {isAddingFolder && (
        <div className="px-2 mb-2">
          <div className="flex items-center">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 p-1 text-sm border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <button
              onClick={handleAddFolder}
              className="ml-2 p-1 text-green-600 hover:text-green-700"
              title="Save"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
            <button
              onClick={() => setIsAddingFolder(false)}
              className="ml-1 p-1 text-red-600 hover:text-red-700"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Folders List */}
      <div className="space-y-1">
        {folders.length > 0 ? (
          folders.map(folder => {
            const notesCount = getNotesInFolder(folder.id).length;
            
            return (
              <div key={folder.id} className="group relative">
                {editingFolderId === folder.id ? (
                  <div className="flex items-center px-2 py-1">
                    <input
                      type="text"
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      className="flex-1 p-1 text-sm border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(folder.id)}
                    />
                    <button
                      onClick={() => handleSaveEdit(folder.id)}
                      className="ml-2 p-1 text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingFolderId(null)}
                      className="ml-1 p-1 text-red-600 hover:text-red-700"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/app/folders/${folder.id}`}
                    className="flex items-center justify-between w-full px-2 py-1 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center max-w-[75%]">
                      <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                      </svg>
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 rounded-full px-1.5 py-0.5">{notesCount}</span>
                  </Link>
                )}
                
                {/* Edit/Delete buttons shown on hover */}
                {editingFolderId !== folder.id && (
                  <div className="absolute right-0 top-0 h-full hidden group-hover:flex items-center pr-2 bg-gradient-to-l from-white dark:from-gray-800 via-white dark:via-gray-800">
                    <button
                      onClick={() => handleEditFolder(folder)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Edit folder"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete folder"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-2 italic">No folders yet</div>
        )}
      </div>
    </div>
  );
} 