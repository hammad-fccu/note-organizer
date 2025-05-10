'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { processFile, createNoteFromProcessedFile, ProcessedFile } from '@/utils/fileProcessing';
import { useNotes } from '@/store/NoteStore';

export default function ImportPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const router = useRouter();
  const { addNote } = useNotes();

  const handleFilesAccepted = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setProcessedFiles([]);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(Math.round(((i) / files.length) * 100));
        
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        
        try {
          // Process the file
          const processedFile = await processFile(file);
          console.log(`File processed: ${processedFile.title}, content length: ${processedFile.content.length}`);
          setProcessedFiles(prev => [...prev, processedFile]);
        } catch (fileErr) {
          console.error(`Error processing file ${file.name}:`, fileErr);
          setError(fileErr instanceof Error ? `Error processing ${file.name}: ${fileErr.message}` : `Unknown error processing ${file.name}`);
        }
      }
      
      setProgress(100);
      setCurrentFile(null);
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while processing files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportAll = () => {
    // Import all processed files as notes
    processedFiles.forEach(processedFile => {
      const noteData = createNoteFromProcessedFile(processedFile);
      addNote(noteData);
    });
    
    // Navigate to notes page
    router.push('/app/notes');
  };
  
  const handleCancel = () => {
    setProcessedFiles([]);
    setCurrentFile(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Import Documents</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload PDF, text, or markdown files to import them as notes
        </p>
      </div>
      
      {processedFiles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <FileUploader 
            onFilesAccepted={handleFilesAccepted}
            isLoading={isProcessing}
          />
          
          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing {currentFile}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This might take a moment for large PDFs. Text extraction quality depends on the PDF structure.
              </p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md text-sm">
              <p className="font-medium">Error processing files:</p>
              <p>{error}</p>
              <div className="mt-2">
                <p className="text-xs font-medium">Tips:</p>
                <ul className="list-disc list-inside text-xs mt-1">
                  <li>Make sure your PDF is not password-protected</li>
                  <li>Try using a different PDF file</li>
                  <li>If you're using a scanned PDF, text extraction may be limited</li>
                  <li>PDFs with complex formatting or images may not extract well</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 rounded-md text-sm">
            <p className="font-medium">PDF Import Tips:</p>
            <ul className="list-disc list-inside text-xs mt-1">
              <li>Text-based PDFs work best (not scanned documents)</li>
              <li>Complex formatting may be lost during import</li>
              <li>You can edit the extracted text after import</li>
              <li>The app will attempt to generate relevant tags automatically</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Processed Files ({processedFiles.length})</h2>
            
            <div className="space-y-4">
              {processedFiles.map((file, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-medium mb-1">{file.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {file.sourceFileName} • {(file.content.length / 1000).toFixed(1)}K characters
                  </p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                    {file.content.substring(0, 500)}
                    {file.content.length > 500 && '...'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleImportAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Import All ({processedFiles.length})
              </button>
              
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 