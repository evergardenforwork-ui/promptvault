import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Save, Wand2, Github, Globe, Tag, Image as ImageIcon,
  Loader2, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { GitProject, GIT_CATEGORY_OPTIONS, GIT_PRICING_OPTIONS, GitProjectCategory, GitProjectPricing } from '../../types';
import { cn } from '../../utils/cn';
import AiSmartParserModal, { AiParsedResult } from './AiSmartParserModal';

interface GitProjectFormProps {
  initialData?: GitProject;
  onSave: (data: Omit<GitProject, 'id' | 'createdAt' | 'userId' | 'authorName' | 'authorEmail'>) => Promise<void>;
  onClose: () => void;
}

export default function GitProjectForm({ initialData, onSave, onClose }: GitProjectFormProps) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    title:               initialData?.title               ?? '',
    category:            initialData?.category            ?? 'tools' as GitProjectCategory,
    summary:             initialData?.summary             ?? '',
    features:            initialData?.features            ?? '',
    detailedDescription: initialData?.detailedDescription ?? '',
    installCommand:      initialData?.installCommand      ?? '',
    authorNotes:         initialData?.authorNotes         ?? '',
    githubUrl:           initialData?.githubUrl           ?? '',
    demoUrl:             initialData?.demoUrl             ?? '',
    image:               initialData?.image               ?? '',
    tags:                initialData?.tags                ?? [] as string[],
    pricing:             initialData?.pricing             ?? 'free' as GitProjectPricing,
    isPublic:            initialData?.isPublic            ?? true,
    isFavorite:          initialData?.isFavorite          ?? false,
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAiModal, setShowAiModal] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    features: true,
    details:  false,
    install:  false,
    notes:    false,
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) setField('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setField('tags', form.tags.filter(t => t !== tag));

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && form.tags.length) {
      setField('tags', form.tags.slice(0, -1));
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) setField('image', base64);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim())   errs.title   = 'Название обязательно';
    if (!form.summary.trim()) errs.summary = 'Краткое описание обязательно';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); }
    catch { /* error handled by parent */ }
    finally { setSaving(false); }
  };

  // ── AI Parser callback ────────────────────────────────────────────────────────

  const handleAiApply = (parsed: AiParsedResult) => {
    if (parsed.title)               setField('title',               parsed.title);
    if (parsed.category)            setField('category',            parsed.category as GitProjectCategory);
    if (parsed.summary)             setField('summary',             parsed.summary);
    if (parsed.features)            setField('features',            parsed.features);
    if (parsed.detailedDescription) setField('detailedDescription', parsed.detailedDescription);
    if (parsed.installCommand)      setField('installCommand',      parsed.installCommand);
    if (parsed.githubUrl)           setField('githubUrl',           parsed.githubUrl);
    if (parsed.demoUrl)             setField('demoUrl',             parsed.demoUrl);
    if (parsed.tags?.length)        setField('tags',                parsed.tags);
    if (parsed.pricing)             setField('pricing',             parsed.pricing as GitProjectPricing);
    setOpenSections({ features: true, details: true, install: true, notes: false });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center p-4 pt-16 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden mb-10 text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                {isEditing ? '✏️ Редактировать проект' : '🐙 Добавить проект'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Git Hub & AI Tools</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                <Wand2 size={14} />
                <span>🪄 AI Автозаполнение</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Image Upload */}
            <div
              className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-700 overflow-hidden cursor-pointer transition-all bg-zinc-50 dark:bg-zinc-900/40 group"
              onClick={() => document.getElementById('git-image-input')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
            >
              {form.image ? (
                <>
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <span className="text-white text-sm font-semibold">Изменить</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setField('image', ''); }}
                      className="p-1.5 bg-red-500/80 rounded-lg text-white cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors">
                  <ImageIcon size={28} />
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Скриншот / Баннер</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Перетащите или нажмите</span>
                </div>
              )}
              <input
                id="git-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Название <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Например: AutoGen Studio"
                className={cn(
                  'w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors',
                  errors.title ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                )}
              />
              {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
            </div>

            {/* Category + Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Категория</label>
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value as GitProjectCategory)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {GIT_CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{o.emoji} {o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Стоимость</label>
                <div className="flex gap-2">
                  {GIT_PRICING_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField('pricing', o.value)}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                        form.pricing === o.value ? o.color : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Краткое описание (слоган) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => setField('summary', e.target.value)}
                placeholder="Что делает этот проект? (1-2 предложения)"
                rows={2}
                className={cn(
                  'w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none',
                  errors.summary ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                )}
              />
              {errors.summary && <p className="text-xs text-rose-500 mt-1">{errors.summary}</p>}
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><Github size={12} />GitHub URL</span>
                </label>
                <input
                  value={form.githubUrl}
                  onChange={(e) => setField('githubUrl', e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><Globe size={12} />Demo / Сайт</span>
                </label>
                <input
                  value={form.demoUrl}
                  onChange={(e) => setField('demoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5"><Tag size={12} />Теги</span>
              </label>
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-wrap gap-2 focus-within:border-emerald-500 transition-colors min-h-[52px]">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold rounded-full">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500 cursor-pointer">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={addTag}
                  placeholder={form.tags.length === 0 ? 'Введите тег, Enter для добавления...' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                />
              </div>
            </div>

            {/* Accordions */}
            {[
              {
                key: 'features',
                label: '⚡ Ключевые фичи',
                placeholder: '• Поддержка мультиагентных пайплайнов\n• Встроенный веб-интерфейс\n• Интеграция с LangChain',
                field: 'features' as const,
                rows: 4,
                monospace: false,
              },
              {
                key: 'install',
                label: '🚀 Команды установки / запуска',
                placeholder: 'git clone https://github.com/...\ncd project\npip install -r requirements.txt\npython main.py',
                field: 'installCommand' as const,
                rows: 4,
                monospace: true,
              },
              {
                key: 'details',
                label: '📖 Детальное описание',
                placeholder: 'Подробное описание архитектуры, возможностей, интеграций...',
                field: 'detailedDescription' as const,
                rows: 5,
                monospace: false,
              },
              {
                key: 'notes',
                label: '💬 Личные заметки',
                placeholder: 'Мой опыт использования, советы по настройке, ограничения...',
                field: 'authorNotes' as const,
                rows: 3,
                monospace: false,
              },
            ].map(({ key, label, placeholder, field, rows, monospace }) => (
              <div key={key} className="border border-zinc-200 dark:border-zinc-800/60 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
                  {openSections[key] ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                </button>
                <AnimatePresence>
                  {openSections[key] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white dark:bg-zinc-950">
                        <textarea
                          value={form[field] ?? ''}
                          onChange={(e) => setField(field, e.target.value)}
                          placeholder={placeholder}
                          rows={rows}
                          className={cn(
                            'w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-y',
                            monospace && 'font-mono text-xs'
                          )}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Public toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Публичный проект</p>
                <p className="text-xs text-zinc-500">Виден другим пользователям</p>
              </div>
              <button
                type="button"
                onClick={() => setField('isPublic', !form.isPublic)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-all cursor-pointer',
                  form.isPublic ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm',
                  form.isPublic ? 'left-7' : 'left-1'
                )} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Сохранение...' : isEditing ? 'Обновить' : 'Добавить проект'}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* AI Smart Parser Modal — отдельный компонент */}
      <AiSmartParserModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApply={handleAiApply}
      />
    </>
  );
}
