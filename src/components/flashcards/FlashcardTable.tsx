import { useState } from 'react';
import { Flashcard } from '@/types/flashcards';
import ConfirmationModal from '@/components/ConfirmationModal';

interface FlashcardTableProps {
  flashcards: Flashcard[];
  onFlashcardsUpdated: (flashcards: Flashcard[]) => void;
}

export default function FlashcardTable({ flashcards, onFlashcardsUpdated }: FlashcardTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{front: string, back: string, tags: string}>({
    front: '',
    back: '',
    tags: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const handleEdit = (flashcard: Flashcard) => {
    setEditingId(flashcard.id);
    setEditValues({
      front: flashcard.front,
      back: flashcard.back,
      tags: flashcard.tags.join(', ')
    });
  };
  
  const handleSave = (id: string) => {
    const updatedFlashcards = flashcards.map(card => {
      if (card.id === id) {
        return {
          ...card,
          front: editValues.front,
          back: editValues.back,
          tags: editValues.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        };
      }
      return card;
    });
    
    onFlashcardsUpdated(updatedFlashcards);
    setEditingId(null);
  };
  
  const handleDelete = (id: string) => {
    setCardToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      const updatedFlashcards = flashcards.filter(card => card.id !== cardToDelete);
      onFlashcardsUpdated(updatedFlashcards);
      setShowDeleteModal(false);
      setCardToDelete(null);
    }
  };
  
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const updatedFlashcards = [...flashcards];
    [updatedFlashcards[index - 1], updatedFlashcards[index]] = 
      [updatedFlashcards[index], updatedFlashcards[index - 1]];
    
    onFlashcardsUpdated(updatedFlashcards);
  };
  
  const handleMoveDown = (index: number) => {
    if (index === flashcards.length - 1) return;
    
    const updatedFlashcards = [...flashcards];
    [updatedFlashcards[index], updatedFlashcards[index + 1]] = 
      [updatedFlashcards[index + 1], updatedFlashcards[index]];
    
    onFlashcardsUpdated(updatedFlashcards);
  };
  
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Preview & Edit Flashcards</h2>
        <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
          {flashcards.length} Cards
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Front (Question)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Back (Answer)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {flashcards.map((flashcard, index) => (
              <tr key={flashcard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center space-y-1">
                    <span>{index + 1}</span>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleMoveUp(index)} 
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)} 
                        disabled={index === flashcards.length - 1}
                        className={`p-1 rounded ${index === flashcards.length - 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {editingId === flashcard.id ? (
                    <textarea 
                      value={editValues.front} 
                      onChange={(e) => setEditValues({...editValues, front: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                      rows={3}
                    />
                  ) : (
                    <div className="max-h-24 overflow-y-auto">{flashcard.front}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {editingId === flashcard.id ? (
                    <textarea 
                      value={editValues.back} 
                      onChange={(e) => setEditValues({...editValues, back: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                      rows={3}
                    />
                  ) : (
                    <div className="max-h-24 overflow-y-auto">{flashcard.back}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {editingId === flashcard.id ? (
                    <input 
                      type="text" 
                      value={editValues.tags} 
                      onChange={(e) => setEditValues({...editValues, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {flashcard.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === flashcard.id ? (
                    <button onClick={() => handleSave(flashcard.id)} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3">
                      Save
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(flashcard)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">
                      Edit
                    </button>
                  )}
                  <button onClick={() => handleDelete(flashcard.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
} 