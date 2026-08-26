import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  LayoutGrid, 
  List, 
  FolderPlus, 
  Plus, 
  Star, 
  Folder, 
  ArrowUpDown,
  Flame,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Trash2,
  FolderTree,
  FolderOpen
} from 'lucide-react';
import { BookmarkItem, User, BookmarkFolder, DEFAULT_BOOKMARK_FOLDERS } from '../../types';
import { cn } from '../../utils/cn';
import BookmarkCard from './BookmarkCard';
import FolderCreateModal from './FolderCreateModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { 
  buildAllFoldersMap, 
  getDirectSubfolders, 
  splitFolderPath, 
  normalizeFolderPath, 
  getParentFolderPath, 
  getLeafFolderName,
  getFolderEmoji,
  FolderNode,
  PATH_SEP
} from './bookmarkTreeUtils';

interface BookmarksSectionProps {
  bookmarks: BookmarkItem[];
  user: User;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  searchQuery: string;
  onEditBookmark: (bookmark: BookmarkItem) => void;
  onDeleteBookmark: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenWebsite: (bookmark: BookmarkItem) => void;
  onCopyUrl: (bookmark: BookmarkItem) => void;
  onOpenCreateModal: (defaultFolder?: string) => void;
  gridColumns?: number;
}

export default function BookmarksSection({
  bookmarks,
  user,
  viewMode,
  setViewMode,
  searchQuery,
  onEditBookmark,
  onDeleteBookmark,
  onToggleFavorite,
  onOpenWebsite,
  onCopyUrl,
  onOpenCreateModal,
  gridColumns = 3,
}: BookmarksSectionProps) {
  // Текущий открытый путь папки (null = Все закладки / корень)
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'my' | 'others'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'clicks' | 'name'>('date');

  // Пользовательские созданные папки (LocalStorage)
  const [customFolders, setCustomFolders] = useState<BookmarkFolder[]>(() => {
    try {
      const saved = localStorage.getItem('pv_custom_bookmark_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderNode | null>(null);

  // Сохраняем кастомные папки
  useEffect(() => {
    try {
      localStorage.setItem('pv_custom_bookmark_folders', JSON.stringify(customFolders));
    } catch {
      // ignore
    }
  }, [customFolders]);

  // Полная карта всех известных папок с подсчетом сайтов
  const folderMap = useMemo(() => {
    return buildAllFoldersMap(bookmarks, customFolders, DEFAULT_BOOKMARK_FOLDERS);
  }, [bookmarks, customFolders]);

  // Список всех уникальных путей папок (для модалки выбора родителя)
  const allFolderPaths = useMemo(() => {
    return Array.from(folderMap.keys()).sort((a, b) => a.localeCompare(b));
  }, [folderMap]);

  // Прямые подпапки текущего пути
  const currentSubfolders = useMemo(() => {
    return getDirectSubfolders(currentPath, folderMap);
  }, [currentPath, folderMap]);

  // Сегменты текущего пути для Breadcrumbs: "AI / Фото / Upscale" -> [{ name: "AI", path: "AI" }, ...]
  const breadcrumbSegments = useMemo(() => {
    if (!currentPath) return [];
    const parts = splitFolderPath(currentPath);
    let accum = '';
    return parts.map((p, idx) => {
      accum = accum ? `${accum}${PATH_SEP}${p}` : p;
      return {
        name: p,
        path: accum,
        emoji: getFolderEmoji(accum, customFolders, DEFAULT_BOOKMARK_FOLDERS),
        isLast: idx === parts.length - 1,
      };
    });
  }, [currentPath, customFolders]);

  // Родительский путь для кнопки «Назад»
  const parentPath = useMemo(() => {
    return getParentFolderPath(currentPath);
  }, [currentPath]);

  // Фильтрация закладок
  const filteredBookmarks = useMemo(() => {
    const normCurrent = currentPath ? normalizeFolderPath(currentPath) : null;

    return bookmarks.filter(b => {
      const bFolder = normalizeFolderPath(b.folder || 'Общее');

      // 1. Фильтрация по текущей папке
      if (normCurrent !== null) {
        if (includeSubfolders) {
          // Либо в этой папке, либо в любой её подпапке
          if (bFolder !== normCurrent && !bFolder.startsWith(`${normCurrent}${PATH_SEP}`)) {
            return false;
          }
        } else {
          // Только строго в этой папке
          if (bFolder !== normCurrent) {
            return false;
          }
        }
      }

      // 2. Фильтр владельца (Мои / Чужие)
      if (sourceFilter === 'my' && b.userId !== user.uid) return false;
      if (sourceFilter === 'others' && b.userId === user.uid) return false;

      // 3. Избранное
      if (showFavoritesOnly && !b.isFavorite) return false;

      // 4. Поиск
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inUrl = b.url.toLowerCase().includes(q);
        const inDesc = (b.description || '').toLowerCase().includes(q);
        const inFolder = (b.folder || '').toLowerCase().includes(q);
        const inTags = (b.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inUrl && !inDesc && !inFolder && !inTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'clicks') return (b.clickCount || 0) - (a.clickCount || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [bookmarks, currentPath, includeSubfolders, sourceFilter, showFavoritesOnly, searchQuery, sortBy, user.uid]);

  // Создание новой папки / подпапки
  const handleCreateFolder = (fullPath: string, emoji?: string) => {
    const norm = normalizeFolderPath(fullPath);
    if (!norm) return;

    const newFolder: BookmarkFolder = {
      id: norm.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-'),
      name: norm,
      path: norm,
      emoji: emoji || '📁',
    };

    setCustomFolders(prev => {
      // Исключаем дубликаты
      const filtered = prev.filter(f => normalizeFolderPath(f.path || f.name) !== norm);
      return [...filtered, newFolder];
    });

    // Переходим в созданную папку
    setCurrentPath(norm);
  };

  // Удаление кастомной папки
  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    const targetPath = normalizeFolderPath(folderToDelete.path);

    setCustomFolders(prev => prev.filter(f => {
      const p = normalizeFolderPath(f.path || f.name);
      return p !== targetPath && !p.startsWith(`${targetPath}${PATH_SEP}`);
    }));

    // Если удаляем текущую открытую папку, переходим к родителю
    if (currentPath && (currentPath === targetPath || currentPath.startsWith(`${targetPath}${PATH_SEP}`))) {
      setCurrentPath(parentPath);
    }

    setFolderToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* ─── HIERARCHICAL FOLDERS & BREADCRUMBS CONTAINER ─────────────────────── */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm dark:shadow-xl space-y-4">
        
        {/* Top Bar: Breadcrumb Trail + Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Кнопка «Назад» на один уровень */}
            {currentPath !== null && (
              <button
                onClick={() => setCurrentPath(parentPath)}
                title="На один уровень вверх"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer mr-1"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            {/* Корень: Все закладки */}
            <button
              onClick={() => setCurrentPath(null)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                currentPath === null
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <span>📁 Все закладки</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black",
                currentPath === null ? "bg-black/20 text-black" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              )}>
                {bookmarks.length}
              </span>
            </button>

            {/* Сегменты пути */}
            {breadcrumbSegments.map(seg => (
              <React.Fragment key={seg.path}>
                <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-600 shrink-0" />
                <button
                  onClick={() => setCurrentPath(seg.path)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer max-w-[200px] truncate",
                    seg.isLast
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  )}
                  title={seg.path}
                >
                  <span>{seg.emoji}</span>
                  <span className="truncate">{seg.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black",
                    seg.isLast ? "bg-black/20 text-black" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  )}>
                    {folderMap.get(seg.path)?.totalCount || 0}
                  </span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Кнопка создания папки / подпапки */}
          <button
            type="button"
            onClick={() => setIsFolderModalOpen(true)}
            className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            <FolderPlus size={15} />
            <span>{currentPath ? '+ Создать под-папку' : '+ Создать папку'}</span>
          </button>
        </div>

        {/* ─── SUBFOLDER CARDS GRID ────────────────────────────────────────── */}
        {currentSubfolders.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <FolderTree size={12} className="text-cyan-500" />
                {currentPath ? 'Вложенные под-папки' : 'Разделы закладок'}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {currentSubfolders.length} {currentSubfolders.length === 1 ? 'папка' : 'папок'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {currentSubfolders.map(sub => (
                <div
                  key={sub.path}
                  onClick={() => setCurrentPath(sub.path)}
                  className="group relative bg-zinc-50 dark:bg-zinc-950/80 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 border border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl p-3 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {sub.emoji}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                        {sub.totalCount}
                      </span>
                      {sub.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToDelete(sub);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity text-zinc-400"
                          title="Удалить пустую папку"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate mt-1">
                    {sub.leafName}
                  </span>
                </div>
              ))}

              {/* Быстрая карточка «+ Добавить под-папку» */}
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(true)}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all cursor-pointer min-h-[72px] bg-zinc-50/40 dark:bg-zinc-950/40 hover:bg-cyan-50/30"
              >
                <FolderPlus size={18} />
                <span className="text-[11px] font-bold">
                  {currentPath ? '+ Под-папка' : '+ Папка'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          currentPath && (
            <div className="flex items-center justify-between py-1 text-xs text-zinc-500">
              <span>В этой папке пока нет вложенных под-папок.</span>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(true)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus size={13} />
                <span>Создать первую под-папку</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* ─── TOOLBAR: SEARCH, FILTERS, SORT & ACTIONS ────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Source & Favorite Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source Tabs */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setSourceFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                sourceFilter === 'all' ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              Все
            </button>
            <button
              onClick={() => setSourceFilter('my')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                sourceFilter === 'my' ? "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              Мои
            </button>
            <button
              onClick={() => setSourceFilter('others')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                sourceFilter === 'others' ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              Чужие
            </button>
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
              showFavoritesOnly
                ? "bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/10"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-500"
            )}
          >
            <Star size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
            <span>Избранное</span>
          </button>

          {/* Toggle "Включая под-папки" (только когда внутри папки) */}
          {currentPath && (
            <button
              onClick={() => setIncludeSubfolders(!includeSubfolders)}
              className={cn(
                "px-3 py-2 rounded-2xl text-xs font-semibold transition-all border cursor-pointer",
                includeSubfolders
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
              )}
            >
              {includeSubfolders ? '✓ Включая под-папки' : 'Только в этой папке'}
            </button>
          )}
        </div>

        {/* Right: Sort, View Toggle, Add Button */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-2xl text-xs">
            <ArrowUpDown size={14} className="text-zinc-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="date" className="bg-white dark:bg-zinc-900">Сначала новые</option>
              <option value="clicks" className="bg-white dark:bg-zinc-900">По кликам (🔥)</option>
              <option value="name" className="bg-white dark:bg-zinc-900">По алфавиту (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              title="Сетка"
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-cyan-50 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Список"
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                viewMode === 'list' ? "bg-cyan-50 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              )}
            >
              <List size={16} />
            </button>
          </div>

          {/* Add Bookmark Button */}
          <button
            onClick={() => onOpenCreateModal(currentPath || undefined)}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Добавить сайт</span>
          </button>
        </div>
      </div>

      {/* ─── CARDS GRID / LIST ───────────────────────────────────────────────── */}
      {filteredBookmarks.length > 0 ? (
        <div className={cn(
          "transition-all",
          viewMode === 'grid'
            ? (gridColumns === 5 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" :
               gridColumns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" :
               "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6")
            : "space-y-3",
          viewMode === 'grid' && "grid"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredBookmarks.map(bookmark => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                user={user}
                viewMode={viewMode}
                onOpenWebsite={onOpenWebsite}
                onCopyUrl={onCopyUrl}
                onEdit={onEditBookmark}
                onDelete={onDeleteBookmark}
                onToggleFavorite={onToggleFavorite}
                onPickFolder={f => setCurrentPath(f)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-600 dark:text-cyan-400">
            <Globe size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {currentPath ? `В папке «${getLeafFolderName(currentPath)}» пока нет сайтов` : 'Закладки не найдены'}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {searchQuery
                ? 'Ни один сайт не соответствует поисковому запросу.'
                : currentPath
                ? `Сохраните первый сайт в раздел «${currentPath}».`
                : 'Сохраняйте полезные веб-сайты, онлайн-сервисы, дизайн-вдохновения и базы знаний.'}
            </p>
          </div>
          <button
            onClick={() => onOpenCreateModal(currentPath || undefined)}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{currentPath ? `Добавить сайт в эту папку` : 'Добавить первый сайт'}</span>
          </button>
        </div>
      )}

      {/* ─── MODAL: CREATE FOLDER / SUBFOLDER ────────────────────────────────── */}
      <FolderCreateModal
        isOpen={isFolderModalOpen}
        parentPath={currentPath}
        availableFolders={allFolderPaths}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* ─── CONFIRM DELETE FOLDER DIALOG ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(folderToDelete)}
        title="Удаление папки"
        message={`Вы уверены, что хотите удалить папку «${folderToDelete?.leafName}»? Закладки останутся в базе данных.`}
        confirmText="Удалить папку"
        variant="danger"
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => setFolderToDelete(null)}
      />
    </div>
  );
}
