'use client';

import { useState, useEffect } from 'react';
import { SummaryType, AI_MODELS, generateSummary } from '@/utils/aiSummary';
import { Copy, Check } from 'lucide-react';

interface NoteSummaryProps {
  noteContent: string;
  onSummarize: (summary: string, type: SummaryType) => void;
  existingSummary?: {
    text: string;
    type: SummaryType;
    createdAt: string;
  };
}

export default function NoteSummary({ noteContent, onSummarize, existingSummary }: NoteSummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>(existingSummary?.type || 'brief');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  
  // Use localStorage for the API key
  const getApiKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openRouterApiKey') || '';
    }
    return '';
  };
  
  const handleSummarize = async () => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      alert('Please add an OpenRouter API key in settings to use summary generation');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const summary = await generateSummary({
        text: noteContent,
        type: summaryType,
        apiKey,
        model: selectedModel
      });
      
      onSummarize(summary, summaryType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">AI Summary</h3>
      
      {existingSummary ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {existingSummary.type === 'brief' ? 'Brief Summary' : 
              existingSummary.type === 'detailed' ? 'Detailed Summary' : 'Bullet Points'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Generated on {new Date(existingSummary.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(existingSummary.text);
                  const button = document.getElementById('copy-button');
                  if (button) {
                    const copyIcon = button.querySelector('.copy-icon');
                    const checkIcon = button.querySelector('.check-icon');
                    if (copyIcon && checkIcon) {
                      copyIcon.classList.add('hidden');
                      checkIcon.classList.remove('hidden');
                      
                      setTimeout(() => {
                        copyIcon.classList.remove('hidden');
                        checkIcon.classList.add('hidden');
                      }, 2000);
                    }
                  }
                }}
                id="copy-button"
                className="p-2 rounded-full text-blue-500 hover:text-blue-600"
                title="Copy summary to clipboard"
              >
                <Copy className="w-6 h-6 copy-icon" />
                <Check className="w-6 h-6 check-icon hidden" />
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
            {existingSummary.type === 'bullets' ? (
              <ul className="list-disc list-inside">
                {existingSummary.text.split('\n').map((bullet, i) => (
                  <li key={i}>{bullet.replace(/^[-•]\s*/, '')}</li>
                ))}
              </ul>
            ) : (
              <p>{existingSummary.text}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Generate an AI-powered summary of your note to quickly grasp the main points.
        </p>
      )}
      
      <div className="flex flex-col space-y-3 mb-6">
        <div>
          <label htmlFor="summaryType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Summary Type
          </label>
          <select
            id="summaryType"
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as SummaryType)}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="brief">Brief (2-3 sentences)</option>
            <option value="detailed">Detailed</option>
            <option value="bullets">Bullet Points</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI Model
          </label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md text-sm">
          <p>{error}</p>
        </div>
      )}
      
      <button
        onClick={handleSummarize}
        disabled={isGenerating}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : existingSummary ? (
          'Regenerate Summary'
        ) : (
          'Generate Summary'
        )}
      </button>
    </div>
  );
} 