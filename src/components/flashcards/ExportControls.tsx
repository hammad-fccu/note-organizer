import { useState } from 'react';
import { Flashcard, AnkiExportPayload } from '@/types/flashcards';

interface ExportControlsProps {
  flashcards: Flashcard[];
  deckName: string;
  modelName: string; // basic, basic-reversed, cloze
}

export default function ExportControls({ flashcards, deckName, modelName }: ExportControlsProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'apkg'>('json');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Prepare the export payload
  const prepareExportPayload = (): AnkiExportPayload => {
    return {
      deckName: deckName || 'My Flashcards',
      modelName,
      cards: flashcards.map(card => ({
        front: card.front,
        back: card.back,
        tags: card.tags,
        extra: card.extra
      })),
      options: {
        tagPrefix: 'SNO-', // Smart Note Organizer prefix
        includeTags: true,
        bundleMedia: false
      }
    };
  };
  
  // Function to handle JSON download
  const downloadJSON = (payload: AnkiExportPayload) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${deckName.replace(/\s+/g, '-').toLowerCase()}_anki_cards.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Function to export as .apkg (stub)
  const exportApkg = (payload: AnkiExportPayload) => {
    // In a real implementation, this would call an API endpoint that uses AnkiConnect
    // or a server-side package like genanki to create an .apkg file
    console.log('Exporting as .apkg:', payload);
    alert('Anki .apkg export would be implemented in a production version. For now, please use the JSON export.');
  };
  
  const handleExport = async () => {
    if (flashcards.length === 0) {
      alert('No flashcards to export.');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const payload = prepareExportPayload();
      
      if (exportFormat === 'json') {
        downloadJSON(payload);
      } else if (exportFormat === 'apkg') {
        exportApkg(payload);
      }
    } catch (error) {
      console.error('Error exporting flashcards:', error);
      alert('Failed to export flashcards. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    const payload = prepareExportPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      .then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard. Please try again.');
      });
  };
  
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Step 5: Export Flashcards</h2>
      
      <div className="space-y-6">
        {/* Export Format */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="export-format"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Anki JSON</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="export-format"
                value="apkg"
                checked={exportFormat === 'apkg'}
                onChange={() => setExportFormat('apkg')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Anki .apkg (Requires Anki Connect)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {exportFormat === 'json' ? 
              'Export as JSON which can be manually imported into Anki' : 
              'Export directly to a .apkg file that can be opened in Anki'}
          </p>
        </div>
        
        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
            <svg 
              className={`ml-1 w-4 h-4 transition-transform ${showAdvanced ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-medium mb-2">Advanced Export Settings</h3>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="tag-prefix" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Tag Prefix
                  </label>
                  <input
                    type="text"
                    id="tag-prefix"
                    defaultValue="SNO-"
                    className="mt-1 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded w-full"
                    placeholder="e.g., SNO-"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Added to the beginning of each tag for organization
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="bundle-media"
                    defaultChecked={false}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="bundle-media" className="ml-2 block text-xs text-gray-700 dark:text-gray-300">
                    Bundle media files (images) with export
                  </label>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    JSON Schema
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">
                    {`{
  "deckName": "String",
  "modelName": "String", // basic, basic-reversed, cloze
  "cards": [
    { "front": "String", "back": "String", "tags": ["String"] }
  ],
  "options": { "tagPrefix": "String", ... }
}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting || flashcards.length === 0}
            className={`
              px-4 py-2 rounded-md font-medium flex items-center justify-center
              ${isExporting || flashcards.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
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
                {exportFormat === 'json' ? 'Download JSON' : 'Export to Anki'}
              </>
            )}
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            disabled={isExporting || flashcards.length === 0}
            className={`
              px-4 py-2 rounded-md font-medium flex items-center justify-center
              ${isExporting || flashcards.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}
            `}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
            {showCopiedMessage ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
} 