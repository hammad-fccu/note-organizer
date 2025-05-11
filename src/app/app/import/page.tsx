'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { processFile, ProcessedFile } from '@/utils/fileProcessing';
import { useNotes } from '@/store/NoteStore';
import Link from 'next/link';
import { generateTags } from '@/utils/aiSummary';

// Add a function to normalize and deduplicate tags (reusing the same function pattern from other pages)
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

export default function ImportPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [generatingTagsForFile, setGeneratingTagsForFile] = useState<string | null>(null);
  const [tagsProgress, setTagsProgress] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNote, getFolderById, folders, updateNoteTags } = useNotes();

  // Get folderId from query params if available
  useEffect(() => {
    const queryFolderId = searchParams.get('folderId');
    if (queryFolderId) {
      setFolderId(queryFolderId);
      const folder = getFolderById(queryFolderId);
      if (folder) {
        setFolderName(folder.name);
      }
    }
  }, [searchParams, getFolderById]);

  // Add some information about API key status
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if API key is set
    if (typeof window !== 'undefined') {
      const apiKey = localStorage.getItem('openRouterApiKey') || '';
      setHasApiKey(!!apiKey);
    }
  }, []);

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

  // Function to safely generate tags without throwing errors
  const safelyGenerateTags = async (noteId: string, fileContent: string, fileTitle: string): Promise<void> => {
    try {
      // Get API key, checking both possible storage keys
      const apiKey = localStorage.getItem('openRouterApiKey') || '';
      
      if (!apiKey || fileContent.length < 50) {
        console.log('Skipping tag generation: ' + 
          (!apiKey ? 'No API key available' : 'Content too short'));
        return;
      }
      
      // Set the default model
      const model = 'google/gemini-2.0-flash-exp:free';
      
      // Truncate content if it's very long to improve performance
      const maxContentLength = 8000;
      const textToProcess = fileContent.length > maxContentLength 
        ? fileContent.substring(0, maxContentLength) + "... (content truncated for tag generation)"
        : fileContent;
      
      console.log(`Generating tags for "${fileTitle}" (length: ${textToProcess.length})`);
      
      // Generate tags using the model
      const generatedTags = await generateTags({
        text: textToProcess,
        title: fileTitle,
        model,
        apiKey
      });
      
      // Validate the tags array
      if (!generatedTags || !Array.isArray(generatedTags)) {
        console.log(`Invalid tags result for ${fileTitle}:`, generatedTags);
        return;
      }
      
      // Only update if we actually got tags back
      if (generatedTags.length > 0) {
        // Normalize and deduplicate tags
        const uniqueTags = normalizeTags(generatedTags);
        console.log(`Tags generated for ${fileTitle}:`, uniqueTags);
        
        // Update the note's tags in the store
        updateNoteTags(noteId, uniqueTags);
      } else {
        console.log(`No tags generated for ${fileTitle}`);
      }
    } catch (error) {
      // Just log the error but don't throw - we don't want to disrupt the import process
      console.error(`Tag generation error for ${fileTitle}:`, error);
    }
  };

  const handleImportAll = async () => {
    // Import all processed files as notes immediately
    for (const processedFile of processedFiles) {
      try {
        // Create basic note object
        const basicNoteData = {
          title: processedFile.title,
          content: processedFile.content,
          contentHtml: processedFile.content.replace(/\n/g, '<br>'),
          tags: [], // Start with empty tags
          favorite: false,
          sourceFileName: processedFile.sourceFileName,
          sourceFileType: processedFile.sourceFileType,
          folderId: folderId || undefined,
        };
        
        // Add note immediately
        const noteId = addNote(basicNoteData);
        
        // If API key exists, start tag generation but don't wait for it
        if (typeof window !== 'undefined') {
          // Fire and forget - don't await this
          safelyGenerateTags(noteId, processedFile.content, processedFile.title)
            .catch(err => {
              // This should never happen due to the error handling in safelyGenerateTags,
              // but just in case there's some uncaught error
              console.error(`Unhandled error in tag generation for ${processedFile.title}:`, err);
            });
        }
      } catch (error) {
        console.error(`Error creating note from file ${processedFile.sourceFileName}:`, error);
      }
    }
    
    // Navigate immediately, don't wait for tag generation
    if (folderId) {
      router.push(`/app/folders/${folderId}`);
    } else {
      router.push('/app/notes');
    }
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
          {folderName && <span> in folder <strong>{folderName}</strong></span>}
        </p>
        {folderId && (
          <Link 
            href={`/app/folders/${folderId}`}
            className="inline-flex items-center text-blue-600 hover:underline mt-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to folder
          </Link>
        )}
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
                {currentFile?.toLowerCase().endsWith('.pdf') && (
                  <span> If the PDF contains scanned pages, OCR will be attempted to extract text from images.</span>
                )}
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
              <li>For scanned documents, OCR will attempt to extract text</li>
              <li>OCR works best with clear, well-scanned documents</li>
              <li>Complex formatting may be lost during import</li>
              <li>You can edit the extracted text after import</li>
              <li>
                {hasApiKey === null ? (
                  "Checking API key status..."
                ) : hasApiKey ? (
                  "Relevant tags will be generated based on content (if API key is set in settings)"
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Add an OpenRouter API key in settings to enable automatic tag generation
                  </span>
                )}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">
              Processed Files ({processedFiles.length})
              {folderId && folderName && (
                <span className="text-sm font-normal ml-2 text-gray-500">
                  Will be imported to folder: {folderName}
                </span>
              )}
            </h2>
            
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
            
            {hasApiKey && (
              <div className="mt-4 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Note:</span> Tags will be automatically generated in the background after import. You can continue using the app while this happens.
                </p>
              </div>
            )}
            
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