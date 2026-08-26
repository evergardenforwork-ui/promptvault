import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Image as ImageIcon,
  FolderTree
} from 'lucide-react';
import { BookmarkItem, User, BookmarkFolder, DEFAULT_BOOKMARK_FOLDERS } from '../../types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { 
  splitFolderPath, 
  normalizeFolderPath, 
  getFolderEmoji, 
  buildAllFoldersMap, 
  getSavedCustomFolders, 
  saveCustomFolders 
} from './bookmarkTreeUtils';
import FolderCreateModal from './FolderCreateModal';

interface BookmarkFormProps {
  isOpen: boolean;
  initialData?: BookmarkItem | null;
  defaultFolder?: string | null;
  folders?: BookmarkFolder[];
  bookmarks?: BookmarkItem[];
  existingFolders?: string[];
  existingCategories?: { [folder: string]: string[] };
  user: User;
  onSave: (data: Partial<BookmarkItem>) => Promise<void>;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function BookmarkForm({
  isOpen,
  initialData,
  defaultFolder,
  folders,
  bookmarks,
  existingFolders,
  existingCategories = {},
  user,
  onSave,
  onDelete,
  onClose,
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
  const [isInnerFolderModalOpen, setIsInnerFolderModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Пользовательские созданные папки
  const [customFolders, setCustomFolders] = useState<BookmarkFolder[]>(getSavedCustomFolders);

  // Синхронизация кастомных папок при изменении в других окнах / модалках
  useEffect(() => {
    const handleSync = () => {
      setCustomFolders(getSavedCustomFolders());
    };
    window.addEventListener('pv_custom_folders_updated', handleSync);
    return () => window.removeEventListener('pv_custom_folders_updated', handleSync);
  }, []);

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
      setFolder(defaultFolder ? normalizeFolderPath(defaultFolder) : 'Общее');
      setCategory('');
      setImage(null);
      setFavicon(null);
      setTags([]);
      setIsPublic(true);
    }
    setIsDirty(false);
  }, [initialData, isOpen, defaultFolder]);

  if (!isOpen) return null;

  // Автоматическое определение favicon и домена по ссылке
  const handleUrlBlur = () => {
    if (!url.trim()) return;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = parsed.hostname.replace(/^www\./, '');
      
      if (!title.trim()) {
        const cleanName = domain.split('.')[0];
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      
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
        folder: normalizeFolderPath(folder) || 'Общее',
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

  // Собираем полный список всех папок и подпапок с сохранением иерархии
  const allFolderOptions = useMemo(() => {
    const folderMap = buildAllFoldersMap(
      bookmarks || [],
      customFolders,
      folders || DEFAULT_BOOKMARK_FOLDERS
    );

    // Добавляем папки из existingFolders (если переданы)
    if (existingFolders && existingFolders.length > 0) {
      existingFolders.forEach(f => {
        const norm = normalizeFolderPath(f);
        if (norm && !folderMap.has(norm)) {
          const parts = splitFolderPath(norm);
          let accum = '';
          parts.forEach((p, idx) => {
            accum = accum ? `${accum} / ${p}` : p;
            if (!folderMap.has(accum)) {
              folderMap.set(accum, {
                path: accum,
                name: accum,
                leafName: p,
                emoji: getFolderEmoji(accum, customFolders, folders || DEFAULT_BOOKMARK_FOLDERS),
                depth: idx,
                directCount: 0,
                totalCount: 0,
              });
            }
          });
        }
      });
    }

    // Гарантируем присутствие initialData, defaultFolder и текущего folder
    const extraPaths = [initialData?.folder, defaultFolder, folder].filter(Boolean) as string[];
    extraPaths.forEach(p => {
      const norm = normalizeFolderPath(p);
      if (norm && !folderMap.has(norm)) {
        const parts = splitFolderPath(norm);
        let accum = '';
        parts.forEach((part, idx) => {
          accum = accum ? `${accum} / ${part}` : part;
          if (!folderMap.has(accum)) {
            folderMap.set(accum, {
              path: accum,
              name: accum,
              leafName: part,
              emoji: getFolderEmoji(accum, customFolders, folders || DEFAULT_BOOKMARK_FOLDERS),
              depth: idx,
              directCount: 0,
              totalCount: 0,
            });
          }
        });
      }
    });

    return Array.from(folderMap.keys()).sort((a, b) => a.localeCompare(b));
  }, [bookmarks, customFolders, folders, existingFolders, initialData?.folder, defaultFolder, folder]);

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
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[92vh] overflow-y-auto text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Globe size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {initialData ? 'Редактировать закладку' : 'Добавить сайт / закладку'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Сохранение ссылки, скриншота и организация по папкам
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSafeClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Ссылка на сайт (URL) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="https://example.com или dribbble.com..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setIsDirty(true); }}
                  onBlur={handleUrlBlur}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Title & Favicon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Название сайта <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="например, Mobbin — UI Patterns"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Favicon / Иконка
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                    {favicon ? (
                      <img src={favicon} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Globe size={18} className="text-zinc-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="URL иконки..."
                    value={favicon || ''}
                    onChange={e => { setFavicon(e.target.value); setIsDirty(true); }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Folder Selection (Hierarchical Tree) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderTree size={14} className="text-cyan-500" />
                  Папка / Раздел <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsInnerFolderModalOpen(true)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus size={13} />
                  <span>+ Создать папку / под-папку</span>
                </button>
              </div>

              <div className="space-y-2">
                <select
                  value={folder}
                  onChange={e => { setFolder(e.target.value); setIsDirty(true); }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-all cursor-pointer font-mono"
                >
                  {allFolderOptions.map(fPath => {
                    const depth = splitFolderPath(fPath).length - 1;
                    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '↳ ' : '');
                    const emoji = getFolderEmoji(fPath, customFolders, folders || DEFAULT_BOOKMARK_FOLDERS);
                    return (
                      <option key={fPath} value={fPath} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                        {indent}{emoji} {fPath}
                      </option>
                    );
                  })}
                </select>

                {/* Быстрый ввод / редактирование пути */}
                <input
                  type="text"
                  placeholder="Или введите путь папки (например: AI & Нейросети / Фото ИИ)..."
                  value={folder}
                  onChange={e => { setFolder(e.target.value); setIsDirty(true); }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/60 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Описание / Заметки к сайту
              </label>
              <textarea
                rows={2}
                placeholder="Зачем нужен этот сервис, полезные ссылки внутри, логины/заметки..."
                value={description}
                onChange={e => { setDescription(e.target.value); setIsDirty(true); }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Теги
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input
                      type="text"
                      placeholder="Добавить тег (нажмите Enter)..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    + Добавить
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tags.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Screenshot / Image Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Скриншот или превью сайта (необязательно)
              </label>

              {image ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 max-h-48 group">
                  <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImage(null); setIsDirty(true); }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition-all cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10"
                >
                  <ImageIcon size={28} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Нажмите чтобы загрузить скриншот
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    PNG, JPG, WebP до 5MB
                  </p>
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

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                {isPublic ? (
                  <Unlock size={16} className="text-emerald-500" />
                ) : (
                  <Lock size={16} className="text-zinc-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {isPublic ? 'Публичная закладка' : 'Приватная закладка'}
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    {isPublic ? 'Видна всем пользователям сервиса' : 'Видна только вам'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setIsPublic(!isPublic); setIsDirty(true); }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isPublic ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                {initialData && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all cursor-pointer"
                    title="Удалить закладку"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSafeClose}
                  className="px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={saving || !title.trim() || !url.trim()}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? 'Сохранение...' : initialData ? 'Сохранить изменения' : 'Добавить сайт'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Модалка создания подпапки прямо из формы */}
      <FolderCreateModal
        isOpen={isInnerFolderModalOpen}
        parentPath={folder}
        availableFolders={allFolderOptions}
        onClose={() => setIsInnerFolderModalOpen(false)}
        onCreate={(newPath, emoji) => {
          const norm = normalizeFolderPath(newPath);
          if (norm) {
            const newFolder: BookmarkFolder = {
              id: norm.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-'),
              name: norm,
              path: norm,
              emoji: emoji || '📁',
            };
            const updated = [
              ...customFolders.filter(f => normalizeFolderPath(f.path || f.name) !== norm),
              newFolder,
            ];
            setCustomFolders(updated);
            saveCustomFolders(updated);
            setFolder(norm);
            setIsDirty(true);
          }
        }}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Несохраненные изменения"
        message="У вас есть несохраненные данные. Закрыть форму без сохранения?"
        confirmText="Закрыть"
        cancelText="Остаться"
        onConfirm={() => {
          setShowCloseConfirm(false);
          setIsDirty(false);
          onClose();
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удаление закладки"
        message="Вы уверены, что хотите удалить эту закладку? Это действие необратимо."
        confirmText="Удалить"
        variant="danger"
        onConfirm={() => {
          if (initialData?.id && onDelete) {
            onDelete(initialData.id);
            setShowDeleteConfirm(false);
            onClose();
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
