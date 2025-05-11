import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFilesAccepted: (files: File[]) => void;
  accept?: Record<string, string[]>;
  isLoading?: boolean;
}

export default function FileUploader({
  onFilesAccepted,
  accept = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
  },
  isLoading = false,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      onFilesAccepted(acceptedFiles);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    disabled: isLoading,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map(rejection => {
        if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          return `${rejection.file.name} is not an accepted file type`;
        }
        return `Error with ${rejection.file.name}: ${rejection.errors[0]?.message || 'Unknown error'}`;
      });
      setError(errors.join('. '));
    }
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${isDragReject ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <svg 
            className={`w-12 h-12 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing files...</p>
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports PDF, TXT, and MD files
              </p>
              <p className="mt-2 text-xs text-blue-500">
                Or click to browse files
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 