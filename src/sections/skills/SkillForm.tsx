import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Package, Upload, Plus } from 'lucide-react';
import { Category, SkillPackage, User } from '../../types';
import { parseZipFile } from '../../utils/zipParser';
import { api } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FileTreeViewer } from '../../components/ui/FileTreeViewer';

interface SkillFormProps {
  skill: SkillPackage | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  onAddCategory: () => void;
  user: User;
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
}

export default function SkillForm({
  skill,
  categories,
  onClose,
  onSave,
  onAddCategory,
  addToast,
}: SkillFormProps) {
  const [title, setTitle] = useState(skill?.title || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [category, setCategory] = useState(skill?.category || categories[0]?.name || '');
  const [tags, setTags] = useState<string[]>(skill?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [fileStructure, setFileStructure] = useState<any[]>(skill?.fileStructure || []);
  const [filePackageUrl] = useState(skill?.filePackageUrl || '');
  const [isPublic, setIsPublic] = useState(skill?.isPublic ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const { fileStructure: parsedStructure, fileCount } = await parseZipFile(file);
        setFileStructure(parsedStructure);
        addToast(`Архив скиллов успешно разобран (${fileCount} файлов)`, 'success');
      } catch (err: any) {
        console.error('Ошибка чтения ZIP:', err);
        addToast('Не удалось распарсить .ZIP файл', 'error');
      }
    } else {
      // Это отдельный .md, .txt, .json или код файл
      try {
        const text = await file.text();
        const newFileNode: any = {
          name: file.name,
          path: file.name,
          type: 'file',
          content: text,
          size: file.size,
        };
        setFileStructure((prev) => [...prev, newFileNode]);
        addToast(`Файл "${file.name}" добавлен в пространство`, 'success');
      } catch (err: any) {
        console.error('Ошибка чтения файла:', err);
        addToast('Не удалось прочитать файл', 'error');
      }
    }
    e.target.value = '';
  };

  const handleClearZip = () => {
    setFileStructure([]);
    addToast('Файлы пакета очищены', 'success');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Введите название для пространства', 'error');
      return;
    }

    const data = {
      title,
      description,
      category,
      tags,
      fileStructure,
      filePackageUrl,
      isPublic,
      isFavorite: skill?.isFavorite ?? false,
    };

    setIsSaving(true);
    try {
      if (skill) {
        await api.updateSkill(skill.id, data);
        addToast('Пакет скиллов успешно обновлен', 'success');
      } else {
        await api.createSkill(data);
        addToast('Пакет скиллов успешно создан', 'success');
      }
      onSave();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Ошибка сохранения', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowConfirmClose(true)}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[95vh] bg-zinc-950 border border-purple-900/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-8 py-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl font-black tracking-tighter text-white">
              {skill ? 'РЕДАКТИРОВАТЬ ПРОСТРАНСТВО СКИЛЛОВ' : 'СОЗДАТЬ НОВОЕ ПРОСТРАНСТВО'}
            </h2>
          </div>
          <button type="button" onClick={() => setShowConfirmClose(true)} className="p-2 hover:bg-zinc-900 rounded-2xl text-zinc-500 cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Файловый конструктор Пространства */}
          <div className="p-6 bg-purple-950/20 border border-purple-800/40 rounded-3xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span>Конструктор Пространства (.MD, .ZIP или ручное создание)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Загрузить .MD / .ZIP</span>
                </button>
                {fileStructure.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearZip}
                    className="px-3 py-2 bg-red-950/50 hover:bg-red-900/80 border border-red-800/50 text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Очистить всё
                  </button>
                )}
              </div>
            </div>

            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,.md,.txt,.json,.js,.ts,.py,application/zip"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Встроенный интерактивный FileTreeViewer */}
            <div className="mt-2">
              <FileTreeViewer
                files={fileStructure}
                isEditable={true}
                onFilesChange={(updatedFiles) => setFileStructure(updatedFiles)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Название пакета</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Antigravity Skills Bundle / Frontend Toolkit..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-purple-400 transition-all font-bold text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Описание пакета</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Что входит в этот набор скиллов и как им пользоваться..."
              className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-purple-400 transition-all text-sm leading-relaxed resize-none text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400">Категория</label>
                <button type="button" onClick={onAddCategory} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest cursor-pointer">
                  + Создать
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-purple-400 transition-all font-bold text-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Теги</label>
              <div className="min-h-[56px] bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-wrap gap-2 content-start">
                {tags.map((t) => (
                  <span key={t} className="px-3 py-1 bg-purple-900/40 text-purple-300 border border-purple-700/50 text-xs font-bold rounded-full flex items-center gap-1.5">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-white cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Добавить тег..."
                  className="bg-transparent border-none focus:outline-none text-sm font-medium flex-1 min-w-[80px] text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Публичный пакет</h3>
              <p className="text-xs text-zinc-500">Доступен ли данный набор скиллов остальным пользователям.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-14 h-8 rounded-full transition-all relative cursor-pointer ${isPublic ? 'bg-purple-500' : 'bg-zinc-800'}`}
            >
              <motion.div animate={{ x: isPublic ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </form>

        <div className="p-8 border-t border-zinc-900 bg-zinc-950 shrink-0 flex items-center justify-end gap-4">
          <button type="button" onClick={() => setShowConfirmClose(true)} className="px-8 py-4 text-zinc-500 font-bold hover:text-white transition-all cursor-pointer">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-10 py-4 bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 cursor-pointer hover:bg-purple-400"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить пакет'}
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirmClose}
        title="Несохраненные изменения"
        message="Вы уверены, что хотите закрыть форму пакета скиллов?"
        confirmText="Закрыть"
        cancelText="Остаться"
        variant="warning"
        onConfirm={onClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
