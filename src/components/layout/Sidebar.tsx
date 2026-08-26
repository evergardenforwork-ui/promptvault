import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Users, Plus, Settings2, Globe, Sparkles, FolderKanban } from 'lucide-react';
import { Category, Prompt, Workspace } from '../../types';

interface SidebarStats {
  promptsCount?: number;
  skillsCount?: number;
  gitCount?: number;
  commandsCount?: number;
  bookmarksCount?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces?: Workspace[];
  selectedWorkspace?: string | null;
  onSelectWorkspace?: (id: string | null) => void;
  onOpenCreateWorkspace?: () => void;
  onOpenEditWorkspace?: (ws: Workspace) => void;
  stats?: SidebarStats;
  activeSection?: string;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  prompts: Prompt[];
  user: any;
  searchQuery: string;
  onPickTag: (tag: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onOpenAdmin?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  workspaces = [],
  selectedWorkspace = null,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenEditWorkspace,
  stats,
  activeSection = 'prompts',
  categories,
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavorites,
  prompts,
  user,
  searchQuery,
  onPickTag,
  onExportBackup,
  onImportBackup,
  onOpenAdmin,
}: SidebarProps) {
  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags || [])));
  const currentWorkspaceObj = workspaces.find(w => w.id === selectedWorkspace);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-84 bg-zinc-950 light:bg-white border-r border-zinc-900 light:border-zinc-200 z-50 p-6 flex flex-col gap-6 overflow-y-auto text-zinc-100 light:text-zinc-900 transition-colors custom-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 light:border-zinc-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tighter text-white light:text-zinc-950">БИБЛИОТЕКА</h2>
                  <p className="text-[10px] text-zinc-500 light:text-zinc-400 uppercase tracking-widest font-semibold">
                    {currentWorkspaceObj ? `${currentWorkspaceObj.icon} ${currentWorkspaceObj.name}` : 'Все материалы'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-zinc-900 light:hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-900 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. РАБОЧИЕ ПРОСТРАНСТВА (WORKSPACES) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-sky-400" /> Пространства
                </h3>
                {onOpenCreateWorkspace && (
                  <button
                    type="button"
                    onClick={() => { onOpenCreateWorkspace(); }}
                    className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 transition-all text-xs flex items-center gap-1 font-semibold cursor-pointer"
                    title="Создать под-пространство (например 1С, Дизайн)"
                  >
                    <Plus size={13} />
                    <span className="text-[10px]">Создать</span>
                  </button>
                )}
              </div>

              <div className="grid gap-1.5">
                {/* Все материалы (без фильтра) */}
                <button
                  type="button"
                  onClick={() => { onSelectWorkspace?.(null); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedWorkspace === null
                      ? "bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-950 border border-sky-400/40 shadow-sm"
                      : "bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:bg-zinc-900 light:hover:bg-zinc-200 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={15} className="text-sky-400" />
                    <span>Все материалы</span>
                  </div>
                  {selectedWorkspace === null && (
                    <span className="text-[10px] bg-sky-400/20 text-sky-400 px-1.5 py-0.5 rounded-md font-bold">
                      Активно
                    </span>
                  )}
                </button>

                {/* Список пользовательских пространств */}
                {workspaces.map((ws) => {
                  const isActive = selectedWorkspace === ws.id;
                  return (
                    <div
                      key={ws.id}
                      className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-950 border border-sky-400/40 shadow-sm"
                          : "bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:bg-zinc-900 light:hover:bg-zinc-200 hover:text-zinc-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => { onSelectWorkspace?.(ws.id); }}
                        className="flex items-center gap-2.5 flex-1 text-left truncate cursor-pointer"
                      >
                        <span className="text-base">{ws.icon || '📁'}</span>
                        <span className="truncate">{ws.name}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {onOpenEditWorkspace && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditWorkspace(ws);
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-900 rounded-md hover:bg-zinc-800 light:hover:bg-zinc-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Настройки пространства"
                          >
                            <Settings2 size={13} />
                          </button>
                        )}
                        {isActive && (
                          <span className="text-[10px] bg-sky-400/20 text-sky-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                            Активно
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. СВОДКА ТЕКУЩЕГО ПРОСТРАНСТВА (STATS) */}
            {stats && (
              <div className="p-3 bg-zinc-900/70 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-200 rounded-2xl space-y-2">
                <div className="text-[10px] font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">
                  В этом пространстве
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div className="p-1.5 bg-zinc-950/60 light:bg-white rounded-lg border border-zinc-800 light:border-zinc-200">
                    <div className="text-xs">📷</div>
                    <div className="text-[10px] font-bold mt-0.5 text-sky-400">{stats.promptsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 light:bg-white rounded-lg border border-zinc-800 light:border-zinc-200">
                    <div className="text-xs">📦</div>
                    <div className="text-[10px] font-bold mt-0.5 text-purple-400">{stats.skillsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 light:bg-white rounded-lg border border-zinc-800 light:border-zinc-200">
                    <div className="text-xs">🐙</div>
                    <div className="text-[10px] font-bold mt-0.5 text-emerald-400">{stats.gitCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 light:bg-white rounded-lg border border-zinc-800 light:border-zinc-200">
                    <div className="text-xs">⚡</div>
                    <div className="text-[10px] font-bold mt-0.5 text-amber-400">{stats.commandsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 light:bg-white rounded-lg border border-zinc-800 light:border-zinc-200">
                    <div className="text-xs">🌐</div>
                    <div className="text-[10px] font-bold mt-0.5 text-cyan-400">{stats.bookmarksCount ?? 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ИЗБРАННОЕ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">Фильтры</h3>
              <button 
                onClick={() => { onToggleFavorites(); onClose(); }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                  showFavoritesOnly 
                    ? "bg-sky-400 text-black font-bold shadow-md shadow-sky-500/20" 
                    : "bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 hover:bg-zinc-800 light:hover:bg-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star size={17} fill={showFavoritesOnly ? "currentColor" : "none"} />
                  <span className="text-sm font-bold">Избранное</span>
                </div>
                <span className="text-xs opacity-70 font-bold">{prompts.filter(p => p.isFavorite).length}</span>
              </button>
            </div>

            {/* 4. КАТЕГОРИИ */}
            {categories.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">Категории</h3>
                <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const count = prompts.filter(p => p.category === cat.name).length;
                    const isActive = selectedCategory === cat.name;
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => { onSelectCategory(isActive ? null : cat.name); onClose(); }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all group cursor-pointer text-xs font-bold ${
                          isActive 
                            ? "bg-sky-400 text-black shadow-sm" 
                            : "bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:bg-zinc-800 light:hover:bg-zinc-200 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-[10px] opacity-60">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. ТЕГИ */}
            {allTags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 light:text-zinc-500 uppercase tracking-widest">Облако тегов</h3>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => { onPickTag(tag); onClose(); }}
                      className={`px-2.5 py-1 bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        searchQuery === tag 
                          ? "border-sky-400 text-sky-400 bg-sky-400/10" 
                          : "border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-200 light:hover:text-zinc-900"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ADMIN & BACKUP */}
            {user && user.role === 'admin' && (
              <div className="space-y-3 mt-auto pt-4 border-t border-zinc-900 light:border-zinc-200 shrink-0">
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 light:text-violet-600 hover:text-violet-300 light:hover:text-violet-700 transition-all font-bold text-xs cursor-pointer"
                  >
                    <Users size={14} />
                    Управление пользователями
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-950 transition-all font-bold text-xs cursor-pointer border border-zinc-800 light:border-zinc-200"
                  >
                    <span>💾</span> Экспорт
                  </button>
                  <label 
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-950 transition-all font-bold text-xs cursor-pointer text-center border border-zinc-800 light:border-zinc-200"
                  >
                    <span>📥</span> Импорт
                    <input 
                      type="file" 
                      accept=".zip" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImportBackup(file);
                          onClose();
                        }
                        e.target.value = '';
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

