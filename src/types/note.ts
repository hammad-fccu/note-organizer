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
  folderId?: string;
  summary?: {
    text: string;
    type: 'brief' | 'detailed' | 'bullets';
    createdAt: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  color?: string;
} 