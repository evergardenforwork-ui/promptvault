import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Globe, 
  Upload, 
  Link2, 
  FolderPlus, 
  Tag as TagIcon, 
  Trash2, 
  Sparkles, 
  Lock, 
  Unlock,
  Image as ImageIcon
} from 'lucide-react';
import { BookmarkItem, User, BookmarkFolder } from '../../types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface BookmarkFormProps {
  isOpen: boolean;
  initialData?: BookmarkItem | null;
  folders: BookmarkFolder[];
  existingFolders: string[];
  existingCategories: { [folder: string]: string[] };
  user: User;
  onSave: (data: Partial<BookmarkItem>) => Promise<void>;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onOpenCreateFolderModal?: () => void;
}

export default function BookmarkForm({
  isOpen,
  initialData,
  folders,
  existingFolders,
  existingCategories,
  user,
  onSave,
  onDelete,
  onClose,
  onOpenCreateFolderModal,
}: BookmarkFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('Общее');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setUrl(initialData.url || '');
      setDescription(initialData.description || '');
      setFolder(initialData.folder || 'Общее');
      setCategory(initialData.category === 'default' ? '' : initialData.category || '');
      setImage(initialData.image || null);
      setFavicon(initialData.favicon || null);
      setTags(initialData.tags || []);
      setIsPublic(initialData.isPublic ?? true);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setFolder('Общее');
      setCategory('');
      setImage(null);
      setFavicon(null);
      setTags([]);
      setIsPublic(true);
    }
    setIsDirty(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Автоматическое определение favicon и домена по ссылке
  const handleUrlBlur = () => {
    if (!url.trim()) return;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = parsed.hostname.replace(/^www\./, '');
      
      // Если названия ещё нет, подставим домен
      if (!title.trim()) {
        const cleanName = domain.split('.')[0];
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      
      // Favicon
      if (!favicon) {
        setFavicon(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      }
    } catch {
      // Игнорируем неполный URL
    }
  };

  // Image Upload (Base64)
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  // Tag Management
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      setIsDirty(true);
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(x => x !== t));
    setIsDirty(true);
  };

  // Safe Close
  const handleSafeClose = () => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        url: finalUrl,
        description: description.trim() || undefined,
        folder: folder.trim() || 'Общее',
        category: category.trim() || 'default',
        image,
        favicon,
        tags,
        isPublic,
      });
      setIsDirty(false);
      onClose();
    } catch {
      // Ошибка обрабатывается родительским тостом
    } finally {
      setSaving(false);
    }
  };

  // Объединяем список доступных папок
  const allFolderNames = Array.from(
    new Set([
      'Общее',
      ...folders.map(f => f.name),
      ...existingFolders,
      ...(initialData?.folder ? [initialData.folder] : []),
    ])
  ).filter(Boolean);

  // Категории для текущей выбранной папки
  const categoriesInFolder = existingCategories[folder] || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSafeClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Globe size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {initialData ? 'Редактировать закладку' : 'Добавить сайт / закладку'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Сохранение ссылки, скриншота и организация по папкам
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSafeClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Ссылка на сайт (URL) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  required
                  placeholder="https://example.com или dribbble.com..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setIsDirty(true); }}
                  onBlur={handleUrlBlur}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Title & Favicon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Название сайта <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="например, Mobbin — UI Patterns"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Favicon / Иконка
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                    {favicon ? (
                      <img src={favicon} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Globe size={18} className="text-zinc-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="URL иконки..."
                    value={favicon || ''}
                    onChange={e => { setFavicon(e.target.value); setIsDirty(true); }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Folder & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Folder Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Папка / Раздел <span className="text-red-400">*</span>
                  </label>
                  {onOpenCreateFolderModal && (
                    <button
                      type="button"
                      onClick={onOpenCreateFolderModal}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      + Создать папку
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <select
                    value={folder}
                    onChange={e => { setFolder(e.target.value); setIsDirty(true); }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                  >
                    {allFolderNames.map(fName => (
                      <option key={fName} value={fName}>
                        📁 {fName}
                      </option>
                    ))}
                  </select>
                  {/* Or Custom Folder input */}
                  <input
                    type="text"
                    placeholder="Или введите новое имя папки..."
                    value={folder}
                    onChange={e => { setFolder(e.target.value); setIsDirty(true); }}
                    className="w-full bg-zinc-950/60 border border-zinc-800/60 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              {/* Subcategory / Tab inside folder */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Подкатегория / Фильтр
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="например, 1С База, UI Kits, Отчеты..."
                    value={category}
                    onChange={e => { setCategory(e.target.value); setIsDirty(true); }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  {categoriesInFolder.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-zinc-500 mr-1">Быстрый выбор:</span>
                      {categoriesInFolder.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCategory(c); setIsDirty(true); }}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            category === c
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Описание / Заметки к сайту
              </label>
              <textarea
                rows={2}
                placeholder="Зачем нужен этот сервис, полезные ссылки внутри, логины/заметки..."
                value={description}
                onChange={e => { setDescription(e.target.value); setIsDirty(true); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all resize-none"
              />
            </div>

            {/* Screenshot / Image Preview */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Скриншот или Баннер сайта
              </label>
              {image ? (
                <div className="relative rounded-2xl border border-zinc-800 overflow-hidden h-40 group">
                  <img src={image} alt="Превью" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImage(null); setIsDirty(true); }}
                      className="px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-950/40 hover:bg-zinc-950 group"
                >
                  <ImageIcon className="mx-auto text-zinc-600 group-hover:text-cyan-400 mb-2 transition-colors" size={28} />
                  <p className="text-xs text-zinc-400 font-semibold">Нажмите для загрузки скриншота</p>
                  <p className="text-[11px] text-zinc-600 mt-1">PNG, JPG, WebP до 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Теги (через Enter)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    placeholder="Добавить тег..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
                >
                  + Тег
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Public checkbox */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                {isPublic ? <Unlock size={16} className="text-emerald-400" /> : <Lock size={16} className="text-amber-400" />}
                <div>
                  <p className="text-xs font-bold text-white">
                    {isPublic ? 'Публичная закладка' : 'Приватная закладка'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {isPublic ? 'Видна всем пользователям сервиса' : 'Видна только вам'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => { setIsPublic(e.target.checked); setIsDirty(true); }}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              {initialData && onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-2xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Удалить</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !url.trim()}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{initialData ? 'Сохранить изменения' : 'Добавить сайт'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить закладку?"
        message="Вы уверены, что хотите удалить эту закладку? Это действие необратимо."
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        onConfirm={() => {
          if (initialData?.id && onDelete) {
            onDelete(initialData.id);
            onClose();
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Close Confirm */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Несохранённые изменения"
        message="У вас есть несохранённые данные. Закрыть форму без сохранения?"
        confirmText="Закрыть"
        cancelText="Продолжить редактирование"
        variant="warning"
        onConfirm={() => {
          setShowCloseConfirm(false);
          onClose();
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}
