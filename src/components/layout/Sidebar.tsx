import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Plus, Settings2, Globe, Sparkles, FolderKanban, LayoutGrid } from 'lucide-react';
import { Workspace } from '../../types';

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
  gridColumns?: number;
  onChangeGridColumns?: (cols: number) => void;
  stats?: SidebarStats;
  user: any;
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
  gridColumns = 3,
  onChangeGridColumns,
  stats,
  user,
  onExportBackup,
  onImportBackup,
  onOpenAdmin,
}: SidebarProps) {
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
            className="fixed top-0 left-0 bottom-0 w-84 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 z-50 p-6 flex flex-col gap-6 overflow-y-auto text-zinc-900 dark:text-zinc-100 transition-colors custom-scrollbar shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tighter text-zinc-900 dark:text-white">БИБЛИОТЕКА</h2>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">
                    {currentWorkspaceObj ? `${currentWorkspaceObj.icon} ${currentWorkspaceObj.name}` : 'Все материалы'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. РАБОЧИЕ ПРОСТРАНСТВА (WORKSPACES) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-sky-500" /> Пространства
                </h3>
                {onOpenCreateWorkspace && (
                  <button
                    type="button"
                    onClick={() => { onOpenCreateWorkspace(); }}
                    className="p-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 border border-sky-500/20 transition-all text-xs flex items-center gap-1 font-semibold cursor-pointer"
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
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white border border-sky-400/40 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={15} className="text-sky-500" />
                    <span>Все материалы</span>
                  </div>
                  {selectedWorkspace === null && (
                    <span className="text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md font-bold">
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
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white border border-sky-400/40 shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
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
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Настройки пространства"
                          >
                            <Settings2 size={13} />
                          </button>
                        )}
                        {isActive && (
                          <span className="text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">
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
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  В этом пространстве
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div className="p-1.5 bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="text-xs">📷</div>
                    <div className="text-[10px] font-bold mt-0.5 text-sky-600 dark:text-sky-400">{stats.promptsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="text-xs">📦</div>
                    <div className="text-[10px] font-bold mt-0.5 text-purple-600 dark:text-purple-400">{stats.skillsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="text-xs">🐙</div>
                    <div className="text-[10px] font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.gitCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="text-xs">⚡</div>
                    <div className="text-[10px] font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.commandsCount ?? 0}</div>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                    <div className="text-xs">🌐</div>
                    <div className="text-[10px] font-bold mt-0.5 text-cyan-600 dark:text-cyan-400">{stats.bookmarksCount ?? 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. КОЛОНКИ СЕТКИ КАРТОЧЕК (3, 4, 5) */}
            {onChangeGridColumns && (
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <LayoutGrid size={13} className="text-sky-500" />
                    <span>Сетка карточек</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-md">
                    {gridColumns} {gridColumns === 3 ? 'колонки' : 'колонок'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map((cols) => {
                    const isActive = gridColumns === cols;
                    return (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => onChangeGridColumns(cols)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isActive
                            ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-400"
                            : "bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-black">{cols}</span>
                        <span className="text-[9px] opacity-80 uppercase tracking-tighter">
                          {cols === 3 ? '3 в ряд' : cols === 4 ? '4 в ряд' : '5 в ряд'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ADMIN & BACKUP */}
            {user && user.role === 'admin' && (
              <div className="space-y-3 mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-900 shrink-0">
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-all font-bold text-xs cursor-pointer"
                  >
                    <Users size={14} />
                    Управление пользователями
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all font-bold text-xs cursor-pointer border border-zinc-200 dark:border-zinc-800"
                  >
                    <span>💾</span> Экспорт
                  </button>
                  <label 
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all font-bold text-xs cursor-pointer text-center border border-zinc-200 dark:border-zinc-800"
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

