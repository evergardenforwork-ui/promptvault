import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, List, Star, X, Sparkles, Plus, Terminal, Filter 
} from 'lucide-react';
import { 
  CommandItem, 
  CommandCategory, 
  COMMAND_CATEGORY_OPTIONS, 
  COMMAND_AI_OPTIONS, 
  SkillPackage, 
  User, 
  TargetAi 
} from '../../types';
import { cn } from '../../utils/cn';
import CommandCard from './CommandCard';
import CommandFillModal from './CommandFillModal';

interface CommandsSectionProps {
  commands: CommandItem[];
  skills: SkillPackage[];
  user: User;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  searchQuery: string;
  onEditCommand: (cmd: CommandItem) => void;
  onDeleteCommand: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyCommand: (cmd: CommandItem) => void;
  onOpenSkill?: (skillId: string) => void;
  onOpenCreateModal: () => void;
}

type SortBy = 'date' | 'popular' | 'name';
type CategoryFilter = 'all' | CommandCategory;
type SourceFilter = 'all' | 'my' | 'others';

export default function CommandsSection({
  commands,
  skills,
  user,
  viewMode,
  setViewMode,
  searchQuery,
  onEditCommand,
  onDeleteCommand,
  onToggleFavorite,
  onCopyCommand,
  onOpenSkill,
  onOpenCreateModal,
}: CommandsSectionProps) {
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [targetAiFilter, setTargetAiFilter] = useState<'all' | TargetAi>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Active command for fill-in modal
  const [fillingCommand, setFillingCommand] = useState<CommandItem | null>(null);

  // Filter & Search logic
  const filteredCommands = useMemo(() => {
    let result = [...commands];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.commandText.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.skillTitle || '').toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        (c.variables || []).some(v => v.toLowerCase().includes(q))
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }

    // Target AI
    if (targetAiFilter !== 'all') {
      result = result.filter(c => c.targetAi === targetAiFilter || c.targetAi === 'universal');
    }

    // Linked Skill
    if (skillFilter !== 'all') {
      result = result.filter(c => c.skillId === skillFilter);
    }

    // Source
    if (sourceFilter === 'my') {
      result = result.filter(c => c.userId === user.uid);
    } else if (sourceFilter === 'others') {
      result = result.filter(c => c.userId !== user.uid && c.isPublic);
    }

    // Favorites
    if (showFavoritesOnly) {
      result = result.filter(c => c.isFavorite);
    }

    // Sorting
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [
    commands,
    searchQuery,
    categoryFilter,
    targetAiFilter,
    skillFilter,
    sourceFilter,
    showFavoritesOnly,
    sortBy,
    user.uid,
  ]);

  // Counts for categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: commands.length };
    for (const opt of COMMAND_CATEGORY_OPTIONS) {
      counts[opt.value] = commands.filter(c => c.category === opt.value).length;
    }
    return counts;
  }, [commands]);

  // Unique skills that are referenced by commands
  const linkedSkills = useMemo(() => {
    const skillIdsWithCommands = new Set(commands.map(c => c.skillId).filter(Boolean));
    return skills.filter(s => skillIdsWithCommands.has(s.id));
  }, [commands, skills]);

  const hasActiveFilters = 
    categoryFilter !== 'all' || 
    targetAiFilter !== 'all' || 
    skillFilter !== 'all' || 
    sourceFilter !== 'all' || 
    showFavoritesOnly;

  const resetFilters = () => {
    setCategoryFilter('all');
    setTargetAiFilter('all');
    setSkillFilter('all');
    setSourceFilter('all');
    setShowFavoritesOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-zinc-900 pb-4">
        {/* Row 1: View mode, Sort, Source, Favorites, Target AI */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-xl transition-all cursor-pointer",
                  viewMode === 'grid'
                    ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
                title="Сетка"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-xl transition-all cursor-pointer",
                  viewMode === 'list'
                    ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
                title="Компактный список"
              >
                <List size={17} />
              </button>

              <div className="h-6 w-px bg-zinc-800 mx-1" />

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="date" className="bg-zinc-900">Сначала новые</option>
                <option value="popular" className="bg-zinc-900">Популярные (🔥)</option>
                <option value="name" className="bg-zinc-900">По алфавиту</option>
              </select>
            </div>

            {/* Source filter */}
            <div className="flex bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800 shrink-0">
              {[
                { id: 'all', name: 'Все' },
                { id: 'my', name: 'Мои' },
                { id: 'others', name: 'Чужие' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSourceFilter(tab.id as SourceFilter)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                    sourceFilter === tab.id
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Target AI filter */}
            <select
              value={targetAiFilter}
              onChange={(e) => setTargetAiFilter(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer shrink-0"
            >
              <option value="all" className="bg-zinc-900">🌐 Все платформы ИИ</option>
              {COMMAND_AI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900">
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>

            {/* Linked Skill Filter (if any) */}
            {linkedSkills.length > 0 && (
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 max-w-[180px] truncate"
              >
                <option value="all" className="bg-zinc-900">📦 Все скиллы</option>
                {linkedSkills.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900">
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right: Favorites & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                showFavoritesOnly
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              <Star size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
              <span>Избранное</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Сбросить все фильтры"
              >
                <X size={14} />
                <span>Сбросить</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              categoryFilter === 'all'
                ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                : "bg-zinc-900/70 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700"
            )}
          >
            <span>⚡ Все команды</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", categoryFilter === 'all' ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400")}>
              {categoryCounts.all || 0}
            </span>
          </button>

          {COMMAND_CATEGORY_OPTIONS.map((cat) => {
            const count = categoryCounts[cat.value] || 0;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  categoryFilter === cat.value
                    ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                    : "bg-zinc-900/70 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", categoryFilter === cat.value ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commands List / Grid */}
      {filteredCommands.length > 0 ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              : "flex flex-col gap-2.5"
          )}
        >
          {filteredCommands.map((command) => (
            <CommandCard
              key={command.id}
              command={command}
              user={user}
              viewMode={viewMode}
              onEdit={onEditCommand}
              onDelete={onDeleteCommand}
              onToggleFavorite={onToggleFavorite}
              onCopy={onCopyCommand}
              onFillVariables={(cmd) => setFillingCommand(cmd)}
              onOpenSkill={onOpenSkill}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20 border border-zinc-800/60 rounded-2xl border-dashed">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <Terminal size={32} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {searchQuery || hasActiveFilters ? 'Команды не найдены' : 'Список команд пуст'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-5 leading-relaxed">
            {searchQuery || hasActiveFilters
              ? 'Попробуйте изменить поисковый запрос или сбросить фильтры.'
              : 'Сохраняйте повторяющиеся инструкции, системные промпты и сниппеты для мгновенной вставки в ИИ.'}
          </p>

          {searchQuery || hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer"
            >
              Сбросить фильтры
            </button>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Создать первую команду</span>
            </button>
          )}
        </div>
      )}

      {/* Fill Variables Modal */}
      <CommandFillModal
        isOpen={Boolean(fillingCommand)}
        command={fillingCommand}
        onClose={() => setFillingCommand(null)}
        onCopy={(finalText) => {
          if (fillingCommand) {
            onCopyCommand({ ...fillingCommand, commandText: finalText });
          }
        }}
      />
    </div>
  );
}
