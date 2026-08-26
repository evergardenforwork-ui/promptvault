import React, { useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';

interface CategoryFormProps {
  onClose: () => void;
  onSave: () => void;
}

export default function CategoryForm({ onClose, onSave }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('#7c6af7');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.createCategory({ name, emoji, color, userId: '' }); // userId added by backend
      onSave();
    } catch (err) {
      console.error('Ошибка создания категории:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 space-y-6 shadow-2xl text-zinc-900 dark:text-zinc-100"
      >
        <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">НОВАЯ КАТЕГОРИЯ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Название</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-sky-400 transition-all font-bold text-zinc-900 dark:text-white" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Эмодзи</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={(e) => setEmoji(e.target.value)} 
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-center text-xl text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Цвет</label>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-full h-[52px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 cursor-pointer" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold cursor-pointer transition-colors">Отмена</button>
            <button type="submit" className="px-6 py-3 bg-sky-400 text-black font-bold rounded-xl shadow-lg shadow-sky-400/20 cursor-pointer hover:bg-sky-300 transition-colors">Создать</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
