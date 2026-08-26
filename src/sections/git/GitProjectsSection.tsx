import React, { useState, useMemo } from 'react';
import { LayoutGrid, List, X, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GitProject, GIT_CATEGORY_OPTIONS, GitProjectCategory, User } from '../../types';
import { cn } from '../../utils/cn';
import GitProjectCard from './GitProjectCard';

interface GitProjectsSectionProps {
  projects: GitProject[];
  user: User;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  onViewProject: (p: GitProject) => void;
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  gridColumns?: number;
}

type SortBy = 'date' | 'name';
type CategoryFilter = 'all' | GitProjectCategory;
type SourceFilter = 'all' | 'my' | 'others';

export default function GitProjectsSection({
  projects,
  user,
  viewMode,
  setViewMode,
  onViewProject,
  onToggleFavorite,
  searchQuery,
  gridColumns = 3,
}: GitProjectsSectionProps) {
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');

  const filtered = useMemo(() => {
    let result = [...projects];

    // Поиск
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        (p.features || '').toLowerCase().includes(q)
      );
    }

    // Категория
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Источник
    if (sourceFilter === 'my') {
      result = result.filter(p => p.userId === user.uid);
    } else if (sourceFilter === 'others') {
      result = result.filter(p => p.userId !== user.uid && p.isPublic);
    }

    // Прайсинг
    if (pricingFilter !== 'all') {
      result = result.filter(p => p.pricing === pricingFilter);
    }

    // Избранное
    if (showFavoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }

    // Сортировка
    if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [projects, searchQuery, categoryFilter, sourceFilter, pricingFilter, showFavoritesOnly, sortBy, user.uid]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    for (const opt of GIT_CATEGORY_OPTIONS) {
      counts[opt.value] = projects.filter(p => p.category === opt.value).length;
    }
    return counts;
  }, [projects]);

  const hasActiveFilters = categoryFilter !== 'all' || sourceFilter !== 'all' || pricingFilter !== 'all' || showFavoritesOnly;

  const resetFilters = () => {
    setCategoryFilter('all');
    setSourceFilter('all');
    setPricingFilter('all');
    setShowFavoritesOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-4">
        {/* Верхняя строка */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-2.5 rounded-xl transition-all cursor-pointer", viewMode === 'grid' ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}
                title="Сетка"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-2.5 rounded-xl transition-all cursor-pointer", viewMode === 'list' ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}
                title="Список"
              >
                <List size={18} />
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="date">Сначала новые</option>
                <option value="name">По алфавиту</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              {[
                { id: 'all', name: 'Все' },
                { id: 'my', name: 'Мои' },
                { id: 'others', name: 'Чужие' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSourceFilter(tab.id as SourceFilter)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                    sourceFilter === tab.id ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Pricing Filter */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              {[
                { id: 'all', name: 'Любая цена' },
                { id: 'free', name: '✓ Бесплатно' },
                { id: 'freemium', name: '⚡ Freemium' },
                { id: 'paid', name: '💳 Платный' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPricingFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                    pricingFilter === tab.id ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Избранное */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                showFavoritesOnly
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <Star size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
              <span>Избранное</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
                <span>Сбросить</span>
              </button>
            )}
          </div>
        </div>

        {/* Категории */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
              categoryFilter === 'all'
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none"
            )}
          >
            📂 Все ({categoryCounts.all})
          </button>
          {GIT_CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                categoryFilter === opt.value
                  ? "bg-emerald-500 text-white"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none"
              )}
            >
              {opt.emoji} {opt.label} ({categoryCounts[opt.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-zinc-500">
        Найдено: <span className="text-emerald-400 font-bold">{filtered.length}</span> из {projects.length}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <span className="text-6xl mb-4">🐙</span>
          <p className="text-lg font-semibold">Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуйте изменить фильтры или добавьте первый проект</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className={cn(
            viewMode === 'grid'
              ? (gridColumns === 5 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" :
                 gridColumns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" :
                 "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4")
              : "flex flex-col gap-3",
            viewMode === 'grid' && "grid"
          )}>
            {filtered.map(project => (
              <GitProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                searchQuery={searchQuery}
                onView={() => onViewProject(project)}
                onToggleFavorite={() => onToggleFavorite(project.id)}
                effectiveUser={user}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
