export interface Note {
  id: string;
  title: string;
  content: string;
  contentHtml?: string;
  tags: string[];
  favorite: boolean;
  sourceFileName?: string;
  sourceFileType?: string;
  createdAt: string;
  updatedAt: string;
} 