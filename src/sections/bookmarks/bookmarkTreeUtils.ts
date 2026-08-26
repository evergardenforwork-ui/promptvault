import { BookmarkItem, BookmarkFolder, DEFAULT_BOOKMARK_FOLDERS } from '../../types';

export const PATH_SEP = ' / ';
export const CUSTOM_FOLDERS_STORAGE_KEY = 'pv_custom_bookmark_folders';

/**
 * Получает список сохраненных кастомных папок из LocalStorage
 */
export function getSavedCustomFolders(): BookmarkFolder[] {
  try {
    const saved = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Сохраняет список кастомных папок в LocalStorage и уведомляет слушателей
 */
export function saveCustomFolders(folders: BookmarkFolder[]): void {
  try {
    localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pv_custom_folders_updated', { detail: folders }));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Нормализует путь папки: убирает лишние пробелы и слэши
 */
export function normalizeFolderPath(path: string | undefined | null): string {
  if (!path) return '';
  return path
    .split(/[\/\\]+/)
    .map(p => p.trim())
    .filter(Boolean)
    .join(PATH_SEP);
}

/**
 * Разбивает путь на сегменты: "AI / Фото / Upscale" -> ["AI", "Фото", "Upscale"]
 */
export function splitFolderPath(path: string | undefined | null): string[] {
  if (!path) return [];
  return path
    .split(/[\/\\]+/)
    .map(p => p.trim())
    .filter(Boolean);
}

/**
 * Возвращает имя текущей (конечной) папки: "AI / Фото" -> "Фото"
 */
export function getLeafFolderName(path: string | undefined | null): string {
  const parts = splitFolderPath(path);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/**
 * Возвращает путь родительской папки: "AI / Фото / Upscale" -> "AI / Фото", "AI" -> null
 */
export function getParentFolderPath(path: string | undefined | null): string | null {
  const parts = splitFolderPath(path);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(PATH_SEP);
}

/**
 * Соединяет родительский путь и имя под-папки
 */
export function joinFolderPath(parentPath: string | null | undefined, name: string): string {
  const cleanName = name.trim();
  const cleanParent = normalizeFolderPath(parentPath);
  if (!cleanParent) return cleanName;
  return `${cleanParent}${PATH_SEP}${cleanName}`;
}

export interface FolderNode {
  path: string;
  name: string;
  leafName: string;
  emoji: string;
  depth: number;
  directCount: number;
  totalCount: number; // Включая все вложенные папки
  isCustom?: boolean;
}

/**
 * Ищет подходящий emoji для папки по имени или сегментам
 */
export function getFolderEmoji(
  path: string,
  customFolders: BookmarkFolder[] = [],
  defaultFolders: BookmarkFolder[] = DEFAULT_BOOKMARK_FOLDERS
): string {
  const norm = normalizeFolderPath(path);
  if (!norm) return '📁';
  const leaf = getLeafFolderName(norm);

  // 1. Точное совпадение по полному пути в кастомных папках
  const exactCustom = customFolders.find(
    f => normalizeFolderPath(f.path || f.name).toLowerCase() === norm.toLowerCase()
  );
  if (exactCustom?.emoji) return exactCustom.emoji;

  // 2. Точное совпадение по имени в дефолтных папках
  const exactDef = defaultFolders.find(
    f => f.name.toLowerCase() === norm.toLowerCase()
  );
  if (exactDef?.emoji) return exactDef.emoji;

  // 3. Совпадение по leafName в кастомных папках
  const leafCustom = customFolders.find(
    f => getLeafFolderName(f.path || f.name).toLowerCase() === leaf.toLowerCase()
  );
  if (leafCustom?.emoji) return leafCustom.emoji;

  // 4. Совпадение по leafName в дефолтных папках
  const leafDef = defaultFolders.find(
    f => f.name.toLowerCase() === leaf.toLowerCase()
  );
  if (leafDef?.emoji) return leafDef.emoji;

  // 3. Эвристический подбор по ключевым словам
  const lower = norm.toLowerCase();
  if (lower.includes('ai') || lower.includes('ии') || lower.includes('нейро') || lower.includes('gpt')) return '🤖';
  if (lower.includes('фото') || lower.includes('photo') || lower.includes('image') || lower.includes('картин')) return '📷';
  if (lower.includes('видео') || lower.includes('video') || lower.includes('movie')) return '🎬';
  if (lower.includes('звук') || lower.includes('audio') || lower.includes('voice') || lower.includes('музык')) return '🎵';
  if (lower.includes('текст') || lower.includes('text') || lower.includes('chat') || lower.includes('чат')) return '💬';
  if (lower.includes('дизайн') || lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('art')) return '🎨';
  if (lower.includes('1с') || lower.includes('бух') || lower.includes('enterprise')) return '💼';
  if (lower.includes('dev') || lower.includes('разраб') || lower.includes('код') || lower.includes('git')) return '🛠️';
  if (lower.includes('doc') || lower.includes('док') || lower.includes('вики') || lower.includes('wiki')) return '📚';
  if (lower.includes('osint') || lower.includes('поиск') || lower.includes('search')) return '🕵️';
  if (lower.includes('безопас') || lower.includes('sec') || lower.includes('auth')) return '🔒';
  if (lower.includes('игры') || lower.includes('game')) return '🎮';

  return '📁';
}

/**
 * Собирает полное дерево папок из всех источников
 */
export function buildAllFoldersMap(
  bookmarks: BookmarkItem[],
  customFolders: BookmarkFolder[] = [],
  defaultFolders: BookmarkFolder[] = DEFAULT_BOOKMARK_FOLDERS
): Map<string, FolderNode> {
  const folderMap = new Map<string, FolderNode>();

  // 1. Регистрируем все пути из defaultFolders
  defaultFolders.forEach(df => {
    const norm = normalizeFolderPath(df.name);
    if (!folderMap.has(norm)) {
      folderMap.set(norm, {
        path: norm,
        name: norm,
        leafName: df.name,
        emoji: df.emoji || '📁',
        depth: 0,
        directCount: 0,
        totalCount: 0,
        isCustom: false,
      });
    }
  });

  // 2. Регистрируем все пути из customFolders (включая промежуточные родительские пути)
  customFolders.forEach(cf => {
    const norm = normalizeFolderPath(cf.path || cf.name);
    if (!norm) return;
    const parts = splitFolderPath(norm);
    let accum = '';
    parts.forEach((p, idx) => {
      accum = accum ? `${accum}${PATH_SEP}${p}` : p;
      if (!folderMap.has(accum)) {
        folderMap.set(accum, {
          path: accum,
          name: accum,
          leafName: p,
          emoji: (idx === parts.length - 1 ? cf.emoji : undefined) || getFolderEmoji(accum, customFolders, defaultFolders),
          depth: idx,
          directCount: 0,
          totalCount: 0,
          isCustom: true,
        });
      }
    });
  });

  // 3. Регистрируем все пути из закладок (включая промежуточные родительские папки)
  bookmarks.forEach(b => {
    const norm = normalizeFolderPath(b.folder || 'Общее');
    const parts = splitFolderPath(norm);
    let accum = '';
    parts.forEach((p, idx) => {
      accum = accum ? `${accum}${PATH_SEP}${p}` : p;
      if (!folderMap.has(accum)) {
        folderMap.set(accum, {
          path: accum,
          name: accum,
          leafName: p,
          emoji: getFolderEmoji(accum, customFolders, defaultFolders),
          depth: idx,
          directCount: 0,
          totalCount: 0,
          isCustom: false,
        });
      }
    });
  });

  // 4. Подсчитываем directCount и totalCount
  bookmarks.forEach(b => {
    const bNorm = normalizeFolderPath(b.folder || 'Общее');
    if (folderMap.has(bNorm)) {
      folderMap.get(bNorm)!.directCount += 1;
    }

    // Увеличиваем totalCount для всех родителей
    folderMap.forEach((node, p) => {
      if (bNorm === p || bNorm.startsWith(`${p}${PATH_SEP}`)) {
        node.totalCount += 1;
      }
    });
  });

  return folderMap;
}

/**
 * Получает список прямых подпапок для указанного родительского пути
 * parentPath === null -> папки верхнего уровня (depth = 0)
 */
export function getDirectSubfolders(
  parentPath: string | null | undefined,
  folderMap: Map<string, FolderNode>
): FolderNode[] {
  const normParent = parentPath ? normalizeFolderPath(parentPath) : null;
  const result: FolderNode[] = [];

  folderMap.forEach((node, path) => {
    if (normParent === null) {
      // Ищем корневые папки (без слэша)
      if (!path.includes(PATH_SEP)) {
        result.push(node);
      }
    } else {
      // Ищем прямых потомков: path начинается с "${normParent} / " и не содержит больше слэшей после этого
      const prefix = `${normParent}${PATH_SEP}`;
      if (path.startsWith(prefix)) {
        const rest = path.slice(prefix.length);
        if (!rest.includes(PATH_SEP)) {
          result.push(node);
        }
      }
    }
  });

  // Сортировка: сначала дефолтные/алфавит, либо по имени
  return result.sort((a, b) => a.leafName.localeCompare(b.leafName));
}
