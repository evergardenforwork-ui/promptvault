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
  { value: 'skill',       label: 'Скилл',          emoji: '🧠' },
  { value: 'agent',       label: 'Агент',          emoji: '🤖' },
  { value: 'mcp',         label: 'MCP',            emoji: '🔌' },
  { value: 'config',      label: 'Конфиг',         emoji: '⚙️' },
  { value: 'rules',       label: 'Правила',        emoji: '📜' },
  { value: 'template',    label: 'Шаблон',         emoji: '📋' },
  { value: 'hooks',       label: 'Хуки',           emoji: '🪝' },
  { value: 'other',       label: 'Разное',         emoji: '📦' },
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

// ─── Git Projects / AI Tools Hub ──────────────────────────────────────────────

export type GitProjectCategory = 'agents' | 'tools' | 'models' | 'media' | 'scrapers' | 'other';
export type GitProjectPricing = 'free' | 'freemium' | 'paid';

export const GIT_CATEGORY_OPTIONS: { value: GitProjectCategory; label: string; emoji: string }[] = [
  { value: 'agents',   label: 'ИИ-Агенты',    emoji: '🤖' },
  { value: 'tools',    label: 'Инструменты',  emoji: '🛠️' },
  { value: 'models',   label: 'Модели',       emoji: '🧠' },
  { value: 'media',    label: 'Медиа',        emoji: '🎬' },
  { value: 'scrapers', label: 'Скрейперы',    emoji: '🕷️' },
  { value: 'other',    label: 'Другое',       emoji: '📦' },
];

export const GIT_PRICING_OPTIONS: { value: GitProjectPricing; label: string; color: string }[] = [
  { value: 'free',     label: 'Бесплатно', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' },
  { value: 'freemium', label: 'Freemium',  color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' },
  { value: 'paid',     label: 'Платный',   color: 'text-rose-400 bg-rose-950/60 border-rose-800/40' },
];

export interface GitProject {
  id: string;
  userId: string;
  title: string;
  category: GitProjectCategory;
  summary: string;
  features?: string;
  detailedDescription?: string;
  installCommand?: string;
  authorNotes?: string;
  githubUrl?: string;
  demoUrl?: string;
  image?: string;
  tags: string[];
  pricing: GitProjectPricing;
  isFavorite?: boolean;
  isPublic?: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface ParseToolRequest {
  url?: string;
  text?: string;
  imageBase64?: string;
}

// ─── AI Commands & Workflows ──────────────────────────────────────────────────

export type CommandCategory = 
  | 'docs' 
  | 'refactor' 
  | 'audit' 
  | 'tests' 
  | 'git' 
  | 'agent' 
  | 'database' 
  | 'other';

export const COMMAND_CATEGORY_OPTIONS: { value: CommandCategory; label: string; emoji: string }[] = [
  { value: 'docs',     label: 'Документация',     emoji: '📝' },
  { value: 'refactor', label: 'Рефакторинг',      emoji: '🔄' },
  { value: 'audit',    label: 'Аудит & Защита',   emoji: '🛡️' },
  { value: 'tests',    label: 'Тестирование',     emoji: '🧪' },
  { value: 'git',      label: 'Git & Деплой',     emoji: '🐙' },
  { value: 'agent',    label: 'Агенты & Промпты', emoji: '🤖' },
  { value: 'database', label: 'База & SQL',       emoji: '🗄️' },
  { value: 'other',    label: 'Разное',           emoji: '✨' },
];

export const COMMAND_AI_OPTIONS: { value: TargetAi; label: string; emoji: string }[] = [
  { value: 'universal', label: 'Универсальная', emoji: '🌐' },
  { value: 'claude',    label: 'Claude',        emoji: '🟣' },
  { value: 'gemini',    label: 'Gemini',        emoji: '🔵' },
  { value: 'chatgpt',   label: 'ChatGPT',       emoji: '🟢' },
  { value: 'cursor',    label: 'Cursor',        emoji: '🟠' },
  { value: 'deepseek',  label: 'DeepSeek',      emoji: '🐳' },
  { value: 'other',     label: 'Другой ИИ',     emoji: '✨' },
];

export interface CommandItem {
  id: string;
  userId: string;
  title: string;
  commandText: string;
  description?: string;
  category: CommandCategory;
  skillId?: string | null;
  skillTitle?: string;
  targetAi?: TargetAi;
  tags: string[];
  variables?: string[];
  isFavorite?: boolean;
  isPublic?: boolean;
  authorName: string;
  authorEmail: string;
  usageCount: number;
  createdAt: string;
}

// ─── Web Bookmarks & Sites ───────────────────────────────────────────────────

export interface BookmarkFolder {
  id: string;
  name: string;
  emoji: string;
  color?: string;
}

export const DEFAULT_BOOKMARK_FOLDERS: BookmarkFolder[] = [
  { id: 'design',  name: 'Design & UI',      emoji: '🎨' },
  { id: 'osint',   name: 'OSINT & Поиск',    emoji: '🕵️' },
  { id: '1c',      name: '1С Предприятие',   emoji: '💼' },
  { id: 'ai',      name: 'AI & Нейросети',   emoji: '🤖' },
  { id: 'dev',     name: 'Dev & Тулзы',      emoji: '🛠️' },
  { id: 'docs',    name: 'Документация',     emoji: '📚' },
  { id: 'general', name: 'Общее',            emoji: '📁' },
];

export interface BookmarkItem {
  id: string;
  userId: string;
  title: string;
  url: string;
  description?: string;
  folder: string;          // Название папки/вкладки (например "Design", "1C", "OSINT")
  category: string;        // Подкатегория/фильтр внутри папки (например "1С База", "UI Kits")
  image?: string | null;   // Скриншот или превью
  favicon?: string | null; // Favicon иконка сайта
  tags: string[];
  isFavorite?: boolean;
  isPublic?: boolean;
  authorName: string;
  authorEmail: string;
  clickCount: number;
  createdAt: string;
}

