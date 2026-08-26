import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderPlus, Folder, ArrowRight } from 'lucide-react';
import { joinFolderPath, normalizeFolderPath, splitFolderPath, PATH_SEP } from './bookmarkTreeUtils';

interface FolderCreateModalProps {
  isOpen: boolean;
  parentPath?: string | null;
  availableFolders?: string[];
  onClose: () => void;
  onCreate: (fullPath: string, emoji?: string) => void;
}

const EMOJI_PRESETS = [
  '📁', '🤖', '📷', '🎬', '🎨', '💼', '🛠️', '📚', '🕵️', '💬', 
  '🎵', '⚡', '🚀', '🔒', '📦', '📊', '🎮', '💡', '💎', '🌐'
];

export default function FolderCreateModal({
  isOpen,
  parentPath,
  availableFolders = [],
  onClose,
  onCreate,
}: FolderCreateModalProps) {
  const [name, setName] = useState('');
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [emoji, setEmoji] = useState('📁');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedParent(parentPath ? normalizeFolderPath(parentPath) : '');
      setEmoji('📁');
    }
  }, [isOpen, parentPath]);

  // Вычисляем результирующий полный путь
  const fullPathPreview = useMemo(() => {
    if (!name.trim()) return '';
    return joinFolderPath(selectedParent || null, name.trim());
  }, [selectedParent, name]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalPath = joinFolderPath(selectedParent || null, name.trim());
    onCreate(finalPath, emoji);
    setName('');
    onClose();
  };

  const isSubfolder = Boolean(selectedParent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {isSubfolder ? 'Создать под-папку' : 'Создать папку'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isSubfolder ? 'Вложенный раздел для структурирования' : 'Новый раздел первого уровня'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор родительской папки */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Родительская папка
            </label>
            <select
              value={selectedParent}
              onChange={e => setSelectedParent(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all cursor-pointer font-mono"
            >
              <option value="">📁 Корневой уровень (Главная страница)</option>
              {availableFolders.map(f => {
                const depth = splitFolderPath(f).length - 1;
                const indent = '  '.repeat(depth) + (depth > 0 ? '↳ ' : '');
                return (
                  <option key={f} value={f}>
                    {indent}📁 {f}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Иконка / Emoji */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Иконка (Emoji)
            </label>
            <div className="flex items-center gap-2 flex-wrap bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-28 overflow-y-auto">
              {EMOJI_PRESETS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                    emoji === em
                      ? 'bg-cyan-500/20 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 scale-110'
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Название папки <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="например, Видео ИИ или Upscalers..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Превью пути */}
          {fullPathPreview && (
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 flex items-center gap-2 text-xs text-cyan-800 dark:text-cyan-300">
              <span className="text-base">{emoji}</span>
              <span className="font-mono truncate">{fullPathPreview}</span>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Создать
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
