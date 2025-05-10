import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Note } from '@/types/note';

// Set the worker source for PDF.js
if (typeof window !== 'undefined') {
  // Use the worker file from the public directory
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
}

export interface ProcessedFile {
  title: string;
  content: string;
  sourceFileName: string;
  sourceFileType: string;
}

/**
 * Extract text from a PDF file using a more reliable method
 * This serves as a fallback if the primary method fails
 */
async function extractTextFromPdfFallback(file: File): Promise<string> {
  try {
    console.log('Using fallback PDF extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = pdf.numPages;
    
    let extractedText = '';
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Process text differently to try to capture more content
        let text = '';
        let lastY = -1;
        
        for (const item of textContent.items) {
          if ('str' in item) {
            // Try to detect new lines based on position
            const currentY = (item as any).transform[5];
            if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
              text += '\n';
            }
            text += item.str + ' ';
            lastY = currentY;
          }
        }
        
        extractedText += text.trim() + '\n\n';
      } catch (pageError) {
        console.error(`Error with fallback extraction on page ${pageNum}:`, pageError);
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return '';
  }
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log('Extracting text from PDF...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = pdf.numPages;
    console.log(`PDF has ${maxPages} pages`);
    
    let extractedText = '';
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Processing page ${pageNum}`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
    }
    
    console.log('Text extraction complete');
    
    // If we extracted very little text, try the fallback method
    if (extractedText.trim().length < 50 && maxPages > 0) {
      console.log('Primary extraction yielded little text, trying fallback method...');
      const fallbackText = await extractTextFromPdfFallback(file);
      
      if (fallbackText.length > extractedText.length) {
        console.log('Fallback method produced more text, using it instead');
        return fallbackText;
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF, trying fallback:', error);
    // If standard extraction fails, try fallback
    return extractTextFromPdfFallback(file);
  }
}

/**
 * Perform OCR on an image
 * Note: For demo purposes, this is simplified. In a real app, you'd need to handle
 * the image data properly and use a more sophisticated approach.
 */
export async function performOcr(imageUrl: string): Promise<string> {
  try {
    console.log('Starting OCR process...');
    
    // Completely ignore type checking for Tesseract.js
    // @ts-ignore
    const worker = await createWorker();
    
    // @ts-ignore
    await worker.load();
    // @ts-ignore
    await worker.loadLanguage('eng');
    // @ts-ignore
    await worker.initialize('eng');
    
    // @ts-ignore
    const { data } = await worker.recognize(imageUrl);
    // @ts-ignore
    await worker.terminate();
    
    console.log('OCR completed successfully');
    return data.text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

/**
 * Convert PDF page to an image for OCR processing
 */
async function pdfPageToImage(page: any): Promise<string> {
  try {
    // Set scale for better OCR results
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // Convert canvas to image data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error converting PDF page to image:', error);
    return '';
  }
}

/**
 * Check if a PDF is scanned (mostly images)
 */
export async function isPdfScanned(file: File): Promise<boolean> {
  try {
    console.log('Checking if PDF is scanned...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Check the first page (or up to 3 pages if available)
    const pagesToCheck = Math.min(3, pdf.numPages);
    let totalTextLength = 0;
    
    for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      totalTextLength += pageText.length;
      console.log(`Page ${pageNum} text length: ${pageText.length}`);
    }
    
    // Calculate average text per page
    const avgTextPerPage = totalTextLength / pagesToCheck;
    console.log(`Average text per page: ${avgTextPerPage}`);
    
    // More sophisticated check - if very little text on average per page,
    // it's likely a scanned document
    return avgTextPerPage < 200; // Threshold increased from 100 to 200
  } catch (error) {
    console.error('Error checking if PDF is scanned:', error);
    return false;
  }
}

/**
 * Process a PDF file, including OCR if needed
 */
export async function processPdfFile(file: File): Promise<ProcessedFile> {
  console.log(`Processing PDF file: ${file.name}`);
  
  try {
    // First try standard text extraction
    let content = await extractTextFromPdf(file);
    console.log(`Initial extraction got ${content.length} characters`);
    
    // If we got very little text, try to determine if it's a scanned document
    if (!content || content.length < 100) {
      console.log("Very little text found, trying fallback extraction...");
      
      // Try the fallback method directly without checking if scanned
      const fallbackText = await extractTextFromPdfFallback(file);
      if (fallbackText && fallbackText.length > 0) {
        console.log(`Fallback extraction successful: ${fallbackText.length} characters`);
        content = fallbackText;
      } else {
        // If both methods failed, check if it's a scanned document
        console.log("Fallback extraction also failed, checking if scanned...");
        const isScanned = await isPdfScanned(file);
        
        if (isScanned) {
          console.log("PDF appears to be scanned, attempting OCR...");
          
          try {
            // Try OCR on the first page
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // For demo purposes, only process the first page with OCR
            // In a production app, you'd process more pages
            if (pdf.numPages > 0) {
              const page = await pdf.getPage(1);
              const imageUrl = await pdfPageToImage(page);
              
              if (imageUrl) {
                console.log("Converted PDF page to image, running OCR...");
                const ocrText = await performOcr(imageUrl);
                
                if (ocrText && ocrText.length > 0) {
                  console.log(`OCR successful: ${ocrText.length} characters`);
                  content = ocrText;
                  
                  // Add note about OCR
                  content += "\n\n[Note: This text was extracted using OCR from a scanned document. Some inaccuracies may be present.]";
                } else {
                  content = "OCR processing failed. This appears to be a scanned document, but text extraction was unsuccessful. Try a clearer scan or manually type the content.";
                }
              } else {
                content = "Failed to convert PDF to image for OCR processing. This appears to be a scanned document.";
              }
            } else {
              content = "The PDF appears to be empty or could not be processed.";
            }
          } catch (ocrError) {
            console.error("OCR processing error:", ocrError);
            content = "This appears to be a scanned document. OCR processing failed. Try a different document or manually type the content.";
          }
        } else {
          console.log("PDF is not scanned but text extraction failed");
          content = content || "No text could be extracted from this PDF. The document might be using non-standard fonts, contain only images, or be protected. You can manually type the content or try converting it to text using an external tool.";
        }
      }
    }
    
    return {
      title: file.name.replace(/\.[^/.]+$/, '') || 'Untitled Document',
      content: content || "Failed to extract content from PDF",
      sourceFileName: file.name,
      sourceFileType: file.type,
    };
  } catch (error) {
    console.error("PDF processing failed completely:", error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  console.log("Generating tags from content");
  // If content is very short, don't try to generate tags
  if (!content || content.length < 50) {
    console.log("Content too short for tag generation");
    return ["untagged"];
  }
  
  // This is a simple implementation
  // In a real app, you would use NLP or machine learning for more intelligent tagging
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
    'for', 'with', 'by', 'of', 'from', 'this', 'that', 'these', 
    'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
    'shall', 'should', 'can', 'could', 'may', 'might'
  ]);
  
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
  
  const tags = [...new Set(sortedWords)]; // Deduplicate
  
  console.log(`Generated ${tags.length} tags:`, tags);
  
  // If no tags could be generated, add a default tag
  if (tags.length === 0) {
    return ["untagged"];
  }
  
  return tags;
} 