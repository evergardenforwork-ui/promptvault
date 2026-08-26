import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FolderPlus, Tag } from 'lucide-react';

interface FolderCreateModalProps {
  isOpen: boolean;
  mode: 'folder' | 'category';
  activeFolder?: string;
  onClose: () => void;
  onCreate: (name: string, emoji?: string) => void;
}

const EMOJI_PRESETS = ['📁', '🎨', '🕵️', '💼', '🤖', '🛠️', '📚', '🌐', '💎', '🚀', '⚡', '🔒', '📦', '📊', '🎮', '💡'];

export default function FolderCreateModal({
  isOpen,
  mode,
  activeFolder,
  onClose,
  onCreate,
}: FolderCreateModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(mode === 'folder' ? '📁' : '🏷️');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), emoji);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              {mode === 'folder' ? <FolderPlus size={20} /> : <Tag size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {mode === 'folder' ? 'Создать папку / раздел' : 'Создать подкатегорию'}
              </h3>
              {mode === 'category' && activeFolder && (
                <p className="text-xs text-zinc-400">Внутри папки: <span className="text-cyan-400 font-semibold">{activeFolder}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'folder' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Иконка (Emoji)
              </label>
              <div className="flex items-center gap-2 flex-wrap bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
                {EMOJI_PRESETS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      emoji === em
                        ? 'bg-cyan-500/20 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 scale-110'
                        : 'hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {mode === 'folder' ? 'Название папки' : 'Название подкатегории'} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={mode === 'folder' ? 'например, 1С Предприятие или OSINT...' : 'например, 1С База или UI Kits...'}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-all cursor-pointer"
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
