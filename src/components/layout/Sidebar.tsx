import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Users } from 'lucide-react';
import { Category, Prompt } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
            className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 z-50 p-6 flex flex-col gap-8 overflow-y-auto text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tighter">БИБЛИОТЕКА</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Фильтры</h3>
              <button 
                onClick={() => { onToggleFavorites(); onClose(); }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                  showFavoritesOnly ? "bg-sky-400 text-black font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star size={18} fill={showFavoritesOnly ? "currentColor" : "none"} />
                  <span className="text-sm font-bold">Избранное</span>
                </div>
                <span className="text-xs opacity-60">{prompts.filter(p => p.isFavorite).length}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Категории</h3>
              <div className="grid gap-2">
                {categories.map(cat => {
                  const count = prompts.filter(p => p.category === cat.name).length;
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => { onSelectCategory(isActive ? null : cat.name); onClose(); }}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all group cursor-pointer ${
                        isActive ? "bg-sky-400 text-black font-bold" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-sm font-bold">{cat.name}</span>
                      </div>
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Облако тегов</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button 
                    key={tag}
                    type="button"
                    onClick={() => { onPickTag(tag); onClose(); }}
                    className={`px-3 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border text-xs font-bold rounded-full transition-all cursor-pointer ${
                      searchQuery === tag ? "border-sky-400 text-sky-500 dark:text-sky-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {user && user.role === 'admin' && (
              <div className="space-y-4 mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-900 shrink-0">
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-all font-bold text-xs cursor-pointer"
                  >
                    <Users size={14} />
                    Управление пользователями
                  </button>
                )}
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Резервная копия</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all font-bold text-xs cursor-pointer border border-zinc-200 dark:border-zinc-800"
                  >
                    <span>💾</span> Экспорт
                  </button>
                  <label 
                    className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all font-bold text-xs cursor-pointer text-center border border-zinc-200 dark:border-zinc-800"
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
                        e.target.value = ''; // Reset file input
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
