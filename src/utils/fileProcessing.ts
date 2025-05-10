import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Note } from '@/types/note';

// Set the workerSrc property of the pdf.js library
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ProcessedFile {
  title: string;
  content: string;
  sourceFileName: string;
  sourceFileType: string;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = pdf.numPages;
    
    let extractedText = '';
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

/**
 * Perform OCR on an image
 * Note: For demo purposes, this is simplified. In a real app, you'd need to handle
 * the image data properly and use a more sophisticated approach.
 */
export async function performOcr(imageUrl: string): Promise<string> {
  try {
    const worker = await createWorker();
    // @ts-ignore - Tesseract typings are not up-to-date
    await worker.load();
    // @ts-ignore
    await worker.loadLanguage('eng');
    // @ts-ignore
    await worker.initialize('eng');
    
    // @ts-ignore
    const { data } = await worker.recognize(imageUrl);
    // @ts-ignore
    await worker.terminate();
    
    return data.text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

/**
 * Check if a PDF is scanned (mostly images)
 */
export async function isPdfScanned(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // If there's very little text on the first page, it's likely a scanned document
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();
    
    return pageText.length < 100; // Arbitrary threshold
  } catch (error) {
    console.error('Error checking if PDF is scanned:', error);
    return false;
  }
}

/**
 * Process a PDF file, including OCR if needed
 * Note: For demo purposes, we're simplifying the OCR process
 */
export async function processPdfFile(file: File): Promise<ProcessedFile> {
  let content = '';
  const isScanned = await isPdfScanned(file);
  
  if (isScanned) {
    // For demo purposes, we'll just extract what text we can
    // In a real app, you'd render the PDF pages to images and use OCR
    content = await extractTextFromPdf(file);
    content += "\n\n[Note: This appears to be a scanned document. In a full implementation, OCR would be applied to extract all text from images.]";
  } else {
    // For regular PDFs, extract text directly
    content = await extractTextFromPdf(file);
  }
  
  return {
    title: file.name.replace(/\.[^/.]+$/, '') || 'Untitled Document',
    content,
    sourceFileName: file.name,
    sourceFileType: file.type,
  };
}

/**
 * Process a text file
 */
export async function processTextFile(file: File): Promise<ProcessedFile> {
  const text = await file.text();
  
  return {
    title: file.name.replace(/\.[^/.]+$/, '') || 'Untitled Document',
    content: text,
    sourceFileName: file.name,
    sourceFileType: file.type,
  };
}

/**
 * Process any supported file type
 */
export async function processFile(file: File): Promise<ProcessedFile> {
  if (file.type === 'application/pdf') {
    return processPdfFile(file);
  } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
    return processTextFile(file);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

/**
 * Create a note object from a processed file
 */
export function createNoteFromProcessedFile(processedFile: ProcessedFile): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
  // Try to auto-generate tags based on content
  const autoTags = generateTagsFromContent(processedFile.content);
  
  return {
    title: processedFile.title,
    content: processedFile.content,
    contentHtml: processedFile.content.replace(/\n/g, '<br>'),
    tags: autoTags,
    favorite: false,
    sourceFileName: processedFile.sourceFileName,
    sourceFileType: processedFile.sourceFileType,
  };
}

/**
 * Auto-generate tags from content
 */
function generateTagsFromContent(content: string): string[] {
  // This is a very simple implementation
  // In a real app, you would use NLP or machine learning for more intelligent tagging
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from']);
  
  // Count word frequency and filter out common words and short words
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length >= 4 && !commonWords.has(cleanWord)) {
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
    }
  });
  
  // Convert to array and sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 5); // Take top 5 words as tags
  
  return [...new Set(sortedWords)]; // Deduplicate
} 