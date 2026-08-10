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

/** Предустановленные типы скилл-пакетов (мультиселект) */
export const SKILL_TYPE_OPTIONS = [
  { value: 'skill',       label: 'Скилл',         emoji: '🧠' },
  { value: 'agent',       label: 'Агент',          emoji: '🤖' },
  { value: 'mcp',         label: 'MCP',            emoji: '🔌' },
  { value: 'skill+agent', label: 'Скилл + Агент',  emoji: '⚡' },
  { value: 'skill+mcp',   label: 'Скилл + MCP',    emoji: '🧩' },
  { value: 'toolkit',     label: 'Toolkit',        emoji: '🛠️' },
  { value: 'template',    label: 'Шаблон',         emoji: '📋' },
  { value: 'other',       label: 'Другое',         emoji: '📦' },
] as const;

export type SkillType = typeof SKILL_TYPE_OPTIONS[number]['value'];

/** Предустановленные поддерживаемые ИИ / Платформы для скилла (мультиселект) */
export const TARGET_AI_OPTIONS = [
  { value: 'universal', label: 'Универсальный', emoji: '🌐' },
  { value: 'claude',    label: 'Claude',        emoji: '🧡' },
  { value: 'gemini',    label: 'Gemini',        emoji: '✨' },
  { value: 'chatgpt',   label: 'ChatGPT',       emoji: '🟢' },
  { value: 'deepseek',  label: 'DeepSeek',      emoji: '🐋' },
  { value: 'cursor',    label: 'Cursor / IDE',  emoji: '💻' },
  { value: 'other',     label: 'Другое',         emoji: '⚙️' },
] as const;

export type TargetAi = typeof TARGET_AI_OPTIONS[number]['value'];

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
  /** Типы пакета: skill, agent, mcp и т.д. (мультиселект) */
  skillTypes: string[];
  /** Поддерживаемые ИИ платформы: universal, claude, gemini, chatgpt, deepseek, cursor (мультиселект) */
  targetAis?: string[];
  tags: string[];
  fileStructure: FileNode[];
  filePackageUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  skillOrigin?: 'own' | 'web';
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
