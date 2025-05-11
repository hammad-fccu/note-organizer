import { useState } from 'react';
import { Flashcard } from '@/types/flashcards';

interface ExportControlsProps {
  flashcards: Flashcard[];
  deckName: string;
  modelName: string; // basic, basic-reversed, cloze
}

export default function ExportControls({ flashcards, deckName, modelName }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);
  
  // Convert our model name to Anki model name
  const getAnkiModelName = (): string => {
    switch(modelName) {
      case 'Basic':
        return 'Basic';
      case 'Basic (and reversed card)':
        return 'Basic (and reversed card)';
      case 'Cloze':
        return 'Cloze';
      default:
        return 'Basic';
    }
  };
  
  // Function to escape TSV field values
  const escapeTSV = (field: string): string => {
    if (!field) return '';
    // Replace tabs with spaces to prevent field confusion
    return field.replace(/\t/g, '    ');
  };
  
  // Function to generate TSV content for direct Anki import
  const generateTSV = (): string => {
    let tsv = '';
    
    // Add headers that Anki recognizes
    tsv += `#notetype:${getAnkiModelName()}\n`;
    tsv += `#deck:${deckName || 'My Flashcards'}\n`;
    tsv += '#html:true\n';
    tsv += '#separator:Tab\n';
    tsv += '#columns:';
    
    // Add column names differently to avoid the first row being treated as a card
    if (modelName === 'Cloze') {
      tsv += 'Text\tExtra\tTags\n';
    } else {
      tsv += 'Front\tBack\tTags\n';
    }
    
    // Add data rows
    flashcards.forEach(card => {
      let front = card.front;
      
      // Format cloze deletions if needed
      if (modelName === 'Cloze') {
        front = front.replace(/\[([^\]]+)\]/g, '{{c1::$1}}');
      }
      
      // Format tags without prefix
      const tagsStr = card.tags.join(' ');
      
      // Add the row with escaped fields
      if (modelName === 'Cloze') {
        tsv += `${escapeTSV(front)}\t${escapeTSV(card.extra || '')}\t${escapeTSV(tagsStr)}\n`;
      } else {
        tsv += `${escapeTSV(front)}\t${escapeTSV(card.back)}\t${escapeTSV(tagsStr)}\n`;
      }
    });
    
    return tsv;
  };
  
  // Function to handle TSV download
  const downloadAnkiFile = () => {
    const tsv = generateTSV();
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `${deckName.replace(/\s+/g, '-').toLowerCase()}_anki_cards.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(null), 3000);
    URL.revokeObjectURL(url);
  };
  
  const handleExport = async () => {
    if (flashcards.length === 0) {
      alert('No flashcards to export.');
      return;
    }
    
    setExportSuccess(null);
    setIsExporting(true);
    
    try {
      downloadAnkiFile();
    } catch (error) {
      console.error('Error exporting flashcards:', error);
      alert(error instanceof Error ? error.message : 'Failed to export flashcards. Please try again.');
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
    }
  };
  
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Step 5: Export Flashcards</h2>
      
      <div className="space-y-6">
        {/* Success/error message */}
        {exportSuccess !== null && (
          <div className={`p-3 rounded-md ${exportSuccess ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'}`}>
            {exportSuccess 
              ? `Successfully exported ${flashcards.length} flashcards!` 
              : 'Failed to export. Please check console for errors.'}
          </div>
        )}
        
        {/* Card info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Current Deck:</span> {deckName || 'My Flashcards'}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Card Type:</span> {modelName}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Cards:</span> {flashcards.length} flashcards
          </p>
        </div>
        
        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={handleExport}
            disabled={isExporting || flashcards.length === 0}
            className={`
              px-6 py-2 rounded-md font-medium flex items-center justify-center min-w-[200px]
              ${isExporting || flashcards.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all'}
            `}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download for Anki
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 