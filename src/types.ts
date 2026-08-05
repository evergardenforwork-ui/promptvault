export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user';
}

export interface SubSection {
  title: string;
  text: string;
  imageBefore?: string;
  imageAfter?: string;
  originalImageBefore?: string;
  originalImageAfter?: string;
  originalImageSlot2?: string;
  additionalImages?: string[];
  imageLayoutType?: string;
}

export type MediaType = 'photo' | 'video' | 'text' | 'music';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number;
  children?: FileNode[];
}

export interface Prompt {
  id: string;
  userId: string;
  title: string;
  category: string;
  tags: string[];
  subSections: SubSection[];
  mainPrompt: string;
  /** Тип медиа: фото, видео, текст, музыка. По умолчанию 'photo' (обратная совместимость) */
  mediaType?: MediaType;
  /** Подсказки для пользователей: как пользоваться шаблоном */
  usageNotes?: string;
  /** Ссылка на загруженный оригинальный .ZIP архив пакета скиллов/файлов */
  filePackageUrl?: string;
  /** Дерево файлов и скиллов, распарсенное из ZIP или добавленное вручную */
  fileStructure?: FileNode[];
  imageBefore?: string;
  imageAfter?: string;
  originalImageBefore?: string;
  originalImageAfter?: string;
  originalImageSlot2?: string;
  additionalImages: string[];
  imageLayoutType?: string;
  isFavorite: boolean;
  isPublic: boolean;
  promptOrigin?: 'own' | 'web';
  authorName: string;
  authorEmail: string;
  usageCount: number;
  createdAt: string;
}

export interface SkillPackage {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  fileStructure: FileNode[];
  filePackageUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  promptId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  createdAt: string;
}

export interface AssistantConfig {
  systemPrompt: string;
}

export interface SkillHint {
  id: string;
  skillId: string;
  userId: string;
  title: string;
  text: string;
  createdAt: string;
}
