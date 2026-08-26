import React, { useRef, useState } from 'react';
import { LayoutGrid, List, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Prompt, Category, User, MediaType } from '../../types';
import { cn } from '../../utils/cn';
import { usePromptFilters } from '../../hooks/usePromptFilters';
import PhotoCard from '../photo/PhotoCard';

interface PromptsSectionProps {
  prompts: Prompt[];
  categories: Category[];
  user: User;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (f: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  sortBy: 'date' | 'name' | 'usage';
  setSortBy: (s: 'date' | 'name' | 'usage') => void;
  sourceFilter: 'all' | 'my-all' | 'my-own' | 'my-web' | 'others';
  setSourceFilter: (sf: 'all' | 'my-all' | 'my-own' | 'my-web' | 'others') => void;
  mediaFilter: 'all' | MediaType;
  setMediaFilter: (mf: 'all' | MediaType) => void;
  onViewPrompt: (p: Prompt) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCategoryModal: () => void;
  gridColumns?: number;
}

export default function PromptsSection({
  prompts,
  categories,
  user,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  showFavoritesOnly,
  setShowFavoritesOnly,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sourceFilter,
  setSourceFilter,
  mediaFilter,
  setMediaFilter,
  onViewPrompt,
  onToggleFavorite,
  onOpenCategoryModal,
  gridColumns = 3,
}: PromptsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(24);

  // --- Filtering & Sorting ---
  const { filteredPrompts, allTags, counts, mediaCounts } = usePromptFilters({
    prompts,
    user,
    searchQuery,
    selectedCategory,
    showFavoritesOnly,
    sourceFilter,
    mediaFilter,
    sortBy,
  });

  // Сброс пагинации при смене любого фильтра
  const prevFilterKey = useRef('');
  const filterKey = `${searchQuery}|${selectedCategory}|${showFavoritesOnly}|${sourceFilter}|${mediaFilter}|${sortBy}`;
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (visibleCount !== 24) setVisibleCount(24);
  }

  const PAGE_SIZE = 24;
  const visiblePrompts = filteredPrompts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPrompts.length;

  return (
    <div className="space-y-8">
      {/* Prompts Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Left group: Layout and Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2.5 rounded-xl transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-sky-400 text-black font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              )}
              title="Сетка"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2.5 rounded-xl transition-all cursor-pointer",
                viewMode === 'list' ? "bg-sky-400 text-black font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              )}
              title="Список"
            >
              <List size={18} />
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-400 focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="date">Сначала новые</option>
              <option value="name">По алфавиту</option>
              <option value="usage">По популярности</option>
            </select>
          </div>

          {/* Middle group: Ownership / Source Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-x-auto max-w-full">
            {[
              { id: 'all', name: 'Все (+ чужие)', count: counts.all },
              { id: 'my-all', name: 'Все мои', count: counts.myAll },
              { id: 'my-own', name: 'Мои (Авторские)', count: counts.own },
              { id: 'my-web', name: 'Мои (Из сети)', count: counts.web },
              { id: 'others', name: 'Чужие (Публичные)', count: counts.others }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  sourceFilter === tab.id 
                    ? "bg-sky-400 text-black font-black shadow-md shadow-sky-400/10" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
                )}
              >
                <span>{tab.name}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors",
                  sourceFilter === tab.id
                    ? "bg-black/25 text-black"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Media Type Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            {[
              { id: 'all', label: 'Все', count: mediaCounts.all },
              { id: 'photo', label: '📷', count: mediaCounts.photo },
              { id: 'video', label: '🎬', count: mediaCounts.video },
              { id: 'text', label: '📝', count: mediaCounts.text },
              { id: 'music', label: '🎵', count: mediaCounts.music },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMediaFilter(tab.id as any)}
                title={tab.id === 'all' ? 'Все типы' : tab.id === 'photo' ? 'Фото' : tab.id === 'video' ? 'Видео' : tab.id === 'text' ? 'Текст' : 'Музыка'}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1",
                  mediaFilter === tab.id
                    ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/20"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors",
                  mediaFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right group: Categories Pills (Horizontal Scrolling container) */}
        <div className="flex-1 min-w-0 flex items-center gap-2 justify-end lg:max-w-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full" id="categories-scroll-container">
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                (selectedCategory === null && !allTags.includes(searchQuery))
                  ? "bg-sky-400 text-black border-sky-400 font-extrabold"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-200"
              )}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.name); setSearchQuery(''); }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                  selectedCategory === cat.name
                    ? "bg-sky-400 text-black border-sky-400 font-extrabold shadow-md shadow-sky-400/10"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-200"
                )}
              >
                <span>{cat.emoji}</span> <span className="ml-1">{cat.name}</span>
              </button>
            ))}

            {allTags.length > 0 && <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />}

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setSearchQuery(tag); setSelectedCategory(null); }}
                className={cn(
                  "px-3.5 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                  searchQuery === tag
                    ? "bg-indigo-400 text-black border-indigo-400 font-extrabold shadow-md shadow-indigo-400/10"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-200"
                )}
              >
                #{tag}
              </button>
            ))}

            <button
              onClick={onOpenCategoryModal}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-sky-500 hover:text-sky-500 text-zinc-500 shrink-0 transition-all cursor-pointer flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/40"
              title="Создать новую категорию"
            >
              <Plus size={13} /> Категория
            </button>
          </div>
          
          <button
            onClick={() => {
              const el = document.getElementById('categories-scroll-container');
              if (el) {
                const isEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
                el.scrollTo({ left: isEnd ? 0 : el.scrollLeft + 150, behavior: 'smooth' });
              }
            }}
            className="p-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white shrink-0 cursor-pointer shadow-sm dark:shadow-none"
            title="Прокрутить дальше"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="text-sm text-zinc-500 font-medium shrink-0 flex items-center gap-3">
          {(searchQuery || selectedCategory || showFavoritesOnly || sourceFilter !== 'all' || mediaFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setShowFavoritesOnly(false);
                setSourceFilter('all');
                setMediaFilter('all');
              }}
              className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold transition-colors cursor-pointer"
            >
              Сбросить фильтр <X size={12} />
            </button>
          )}
          <span>Найдено: <span className="text-zinc-900 dark:text-white font-bold">{filteredPrompts.length}</span></span>
        </div>
      </div>

      {/* Prompts Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid'
          ? (gridColumns === 5 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" :
             gridColumns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" :
             "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")
          : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {visiblePrompts.map((prompt) => (
            <PhotoCard 
              key={prompt.id} 
              prompt={prompt} 
              viewMode={viewMode}
              searchQuery={searchQuery}
              onView={() => onViewPrompt(prompt)}
              onToggleFavorite={() => onToggleFavorite(prompt.id)}
              effectiveUser={user}
              onPickTag={(tag) => { setSearchQuery(tag); setSelectedCategory(null); }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Pagination */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3 pt-4 pb-8">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="group flex items-center gap-2.5 px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer shadow-sm dark:shadow-none"
          >
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
            Загрузить ещё
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 rounded-lg text-[11px] font-black text-zinc-600 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors">
              +{Math.min(PAGE_SIZE, filteredPrompts.length - visibleCount)}
            </span>
          </button>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-600 font-medium">
            Показано {visibleCount} из {filteredPrompts.length}
          </p>
        </div>
      )}
    </div>
  );
}
