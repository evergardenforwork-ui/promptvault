import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Palette } from 'lucide-react';
import { Workspace, WORKSPACE_COLOR_OPTIONS } from '../../types';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  workspace?: Workspace | null;
}

const PRESET_EMOJIS = ['📁', '💼', '🏢', '🤖', '🧠', '🎨', '🛠️', '⚡', '📊', '💻', '🚀', '📦', '🎯', '📚', '🔒', '✨'];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  workspace,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('sky-400');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setIcon(workspace.icon || '📁');
      setColor(workspace.color || 'sky-400');
    } else {
      setName('');
      setIcon('📁');
      setColor('sky-400');
    }
    setError(null);
  }, [workspace, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите название пространства');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({ name: name.trim(), icon, color });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения пространства');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace?.id || !onDelete) return;
    try {
      setIsSubmitting(true);
      await onDelete(workspace.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-lg">
                {icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  {workspace ? 'Редактировать пространство' : 'Новое рабочее пространство'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Изолированный профиль для задач, сайтов и проектов
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Название */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Название пространства <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="например: 1С Предприятие, Личное, AI Исследования..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Выбор эмодзи */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Иконка (Emoji)
              </label>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                      icon === emoji
                        ? 'bg-sky-500/20 border border-sky-500 text-sky-600 dark:text-white scale-110'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор цвета */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" /> Цветовой акцент
              </label>
              <div className="flex flex-wrap gap-2">
                {WORKSPACE_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                      color === c.value
                        ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {workspace && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 text-xs text-black bg-sky-400 hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {workspace ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
