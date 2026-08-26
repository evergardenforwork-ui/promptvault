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
  Tag as TagIcon, 
  ArrowUpDown,
  Flame,
  Search,
  ExternalLink
} from 'lucide-react';
import { BookmarkItem, User, BookmarkFolder, DEFAULT_BOOKMARK_FOLDERS } from '../../types';
import { cn } from '../../utils/cn';
import BookmarkCard from './BookmarkCard';
import FolderCreateModal from './FolderCreateModal';

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
  onOpenCreateModal: () => void;
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
}: BookmarksSectionProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'my' | 'others'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'clicks' | 'name'>('date');

  // Custom User Folders (LocalStorage)
  const [customFolders, setCustomFolders] = useState<BookmarkFolder[]>(() => {
    try {
      const saved = localStorage.getItem('pv_custom_bookmark_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'folder' | 'category'>('folder');

  // Save custom folders
  useEffect(() => {
    try {
      localStorage.setItem('pv_custom_bookmark_folders', JSON.stringify(customFolders));
    } catch {
      // ignore
    }
  }, [customFolders]);

  // Combine default and custom folders + any folders from existing bookmarks
  const allFolders = useMemo(() => {
    const map = new Map<string, BookmarkFolder>();
    
    DEFAULT_BOOKMARK_FOLDERS.forEach(f => map.set(f.name.toLowerCase(), f));
    customFolders.forEach(f => map.set(f.name.toLowerCase(), f));

    bookmarks.forEach(b => {
      if (b.folder && !map.has(b.folder.toLowerCase())) {
        map.set(b.folder.toLowerCase(), {
          id: b.folder.toLowerCase().replace(/\s+/g, '-'),
          name: b.folder,
          emoji: '📁',
        });
      }
    });

    return Array.from(map.values());
  }, [customFolders, bookmarks]);

  // Subcategories inside the currently selected folder
  const subcategoriesInSelectedFolder = useMemo(() => {
    if (!selectedFolder) return [];
    const set = new Set<string>();
    bookmarks.forEach(b => {
      if (b.folder?.toLowerCase() === selectedFolder.toLowerCase() && b.category && b.category !== 'default') {
        set.add(b.category);
      }
    });
    return Array.from(set);
  }, [bookmarks, selectedFolder]);

  // Category counts per folder map
  const existingCategoriesMap = useMemo(() => {
    const map: { [folder: string]: string[] } = {};
    bookmarks.forEach(b => {
      const f = b.folder || 'Общее';
      if (!map[f]) map[f] = [];
      if (b.category && b.category !== 'default' && !map[f].includes(b.category)) {
        map[f].push(b.category);
      }
    });
    return map;
  }, [bookmarks]);

  // Folder bookmarks count map
  const folderCounts = useMemo(() => {
    const counts: { [folderName: string]: number } = {};
    bookmarks.forEach(b => {
      const f = b.folder || 'Общее';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  // Subcategory count map inside current folder
  const subcategoryCounts = useMemo(() => {
    if (!selectedFolder) return {};
    const counts: { [cat: string]: number } = {};
    bookmarks.forEach(b => {
      if (b.folder?.toLowerCase() === selectedFolder.toLowerCase() && b.category && b.category !== 'default') {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    return counts;
  }, [bookmarks, selectedFolder]);

  // Filtering Logic
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      // 1. Folder filter
      if (selectedFolder && b.folder?.toLowerCase() !== selectedFolder.toLowerCase()) {
        return false;
      }

      // 2. Subcategory filter
      if (selectedCategory && b.category !== selectedCategory) {
        return false;
      }

      // 3. Source ownership filter
      if (sourceFilter === 'my' && b.userId !== user.uid) return false;
      if (sourceFilter === 'others' && b.userId === user.uid) return false;

      // 4. Favorites filter
      if (showFavoritesOnly && !b.isFavorite) return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inUrl = b.url.toLowerCase().includes(q);
        const inDesc = (b.description || '').toLowerCase().includes(q);
        const inFolder = (b.folder || '').toLowerCase().includes(q);
        const inCat = (b.category || '').toLowerCase().includes(q);
        const inTags = (b.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inUrl && !inDesc && !inFolder && !inCat && !inTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'clicks') return (b.clickCount || 0) - (a.clickCount || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [bookmarks, selectedFolder, selectedCategory, sourceFilter, showFavoritesOnly, searchQuery, sortBy, user.uid]);

  // Handler to create new folder or subcategory
  const handleCreateFolderOrCategory = (name: string, emoji?: string) => {
    if (folderModalMode === 'folder') {
      const newF: BookmarkFolder = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        emoji: emoji || '📁',
      };
      setCustomFolders(prev => [...prev, newF]);
      setSelectedFolder(name);
      setSelectedCategory(null);
    } else {
      // Subcategory created
      setSelectedCategory(name);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── LEVEL 1: FOLDERS / TABS BAR ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              📂 Папки закладок
            </span>
            <span className="text-xs text-zinc-500 font-mono">({bookmarks.length} сайтов)</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setFolderModalMode('folder');
              setIsFolderModalOpen(true);
            }}
            className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/20 transition-all cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>+ Создать вкладку / папку</span>
          </button>
        </div>

        {/* Scrollable Folder Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <button
            onClick={() => {
              setSelectedFolder(null);
              setSelectedCategory(null);
            }}
             className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
              selectedFolder === null
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 scale-105"
                : "bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
            )}
          >
            <span>📁 Все закладки</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black",
              selectedFolder === null ? "bg-black/20 text-black" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
            )}>
              {bookmarks.length}
            </span>
          </button>

          {allFolders.map(f => {
            const count = folderCounts[f.name] || 0;
            const isSelected = selectedFolder?.toLowerCase() === f.name.toLowerCase();

            return (
              <button
                key={f.id || f.name}
                onClick={() => {
                  setSelectedFolder(isSelected ? null : f.name);
                  setSelectedCategory(null);
                }}
                className={cn(
                  "px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 scale-105"
                    : "bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
                )}
              >
                <span>{f.emoji || '📁'} {f.name}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black",
                    isSelected ? "bg-black/20 text-black" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── LEVEL 2: SUBCATEGORIES ACCORDION / PILLS (IF A FOLDER IS SELECTED) ─── */}
      {selectedFolder && subcategoriesInSelectedFolder.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 overflow-x-auto p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl"
        >
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0 px-2">
            Подкатегории:
          </span>

          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {subcategoriesInSelectedFolder.map(cat => {
              const isCatSelected = selectedCategory === cat;
              const cCount = subcategoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isCatSelected ? null : cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                    isCatSelected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none"
                  )}
                >
                  <span>🏷️ {cat}</span>
                  {cCount > 0 && <span className="text-[10px] opacity-75">({cCount})</span>}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setFolderModalMode('category');
              setIsFolderModalOpen(true);
            }}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>+ Подкатегория</span>
          </button>
        </motion.div>
      )}

      {/* ─── LEVEL 3: TOOLBAR (FILTERS, SEARCH, SORT & ACTIONS) ───────────────── */}
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
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Добавить сайт</span>
          </button>
        </div>
      </div>

      {/* ─── LEVEL 4: CARDS GRID / LIST ──────────────────────────────────────── */}
      {filteredBookmarks.length > 0 ? (
        <div className={cn(
          "transition-all",
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-3"
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
                onPickFolder={f => { setSelectedFolder(f); setSelectedCategory(null); }}
                onPickCategory={c => setSelectedCategory(c)}
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
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Закладки не найдены</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {searchQuery
                ? 'Ни один сайт не соответствует поисковому запросу.'
                : selectedFolder
                ? `В папке «${selectedFolder}» пока нет сохраненных сайтов.`
                : 'Сохраняйте полезные веб-сайты, онлайн-сервисы, дизайн-вдохновения и базы знаний.'}
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Добавить первый сайт</span>
          </button>
        </div>
      )}

      {/* ─── MODAL: CREATE FOLDER / CATEGORY ─────────────────────────────────── */}
      <FolderCreateModal
        isOpen={isFolderModalOpen}
        mode={folderModalMode}
        activeFolder={selectedFolder || undefined}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolderOrCategory}
      />
    </div>
  );
}
