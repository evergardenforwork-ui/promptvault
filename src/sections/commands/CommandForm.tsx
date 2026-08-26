import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Trash2, Layers, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CommandItem, 
  CommandCategory, 
  COMMAND_CATEGORY_OPTIONS, 
  COMMAND_AI_OPTIONS, 
  SkillPackage, 
  User, 
  TargetAi 
} from '../../types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { cn } from '../../utils/cn';

interface CommandFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CommandItem>) => Promise<void>;
  initialData?: CommandItem | null;
  skills: SkillPackage[];
  user: User;
  onDelete?: (id: string) => void;
}

const QUICK_VARIABLES = ['file', 'target', 'branch', 'context', 'instructions', 'component'];

export default function CommandForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  skills,
  user,
  onDelete,
}: CommandFormProps) {
  const [title, setTitle] = useState('');
  const [commandText, setCommandText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommandCategory>('docs');
  const [targetAi, setTargetAi] = useState<TargetAi>('universal');
  const [skillId, setSkillId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setCommandText(initialData.commandText || '');
        setDescription(initialData.description || '');
        setCategory(initialData.category || 'other');
        setTargetAi(initialData.targetAi || 'universal');
        setSkillId(initialData.skillId || '');
        setTags(initialData.tags || []);
        setIsPublic(initialData.isPublic ?? true);
      } else {
        setTitle('');
        setCommandText('');
        setDescription('');
        setCategory('docs');
        setTargetAi('universal');
        setSkillId('');
        setTags([]);
        setIsPublic(true);
      }
      setTagInput('');
      setIsSaving(false);
      setShowDeleteConfirm(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen, initialData]);

  // Track if form is dirty
  const isDirty = initialData
    ? title !== initialData.title ||
      commandText !== initialData.commandText ||
      description !== (initialData.description || '') ||
      category !== initialData.category ||
      targetAi !== (initialData.targetAi || 'universal') ||
      skillId !== (initialData.skillId || '') ||
      isPublic !== (initialData.isPublic ?? true)
    : Boolean(title || commandText || description || tags.length > 0);

  // Insert variable placeholder at cursor position
  const handleInsertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{{${varName}}}`;
    const newText = commandText.substring(0, start) + placeholder + commandText.substring(end);

    setCommandText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !commandText.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        commandText: commandText.trim(),
        description: description.trim() || undefined,
        category,
        targetAi,
        skillId: skillId || null,
        tags,
        isPublic,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save command:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {initialData ? 'Редактировать команду' : 'Новая команда / Сниппет'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {initialData ? 'Измените параметры и текст команды' : 'Сохраните полезную инструкцию или промпт для быстрой вставки'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseAttempt}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Название команды <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Обнови всю документацию проекта по изменениям..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Category & Target AI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Категория
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommandCategory)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-all cursor-pointer"
                  >
                    {COMMAND_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-900">
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target AI */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Платформа ИИ
                  </label>
                  <select
                    value={targetAi}
                    onChange={(e) => setTargetAi(e.target.value as TargetAi)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-all cursor-pointer"
                  >
                    {COMMAND_AI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-900">
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Skill */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  <Layers size={13} className="text-indigo-400" />
                  <span>Привязка к скиллу (опционально)</span>
                </label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-zinc-900 text-zinc-500">— Без привязки к скиллу —</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      📦 {s.title} {s.category ? `(${s.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Command Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Текст команды / Сниппета <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {commandText.length} симв.
                  </span>
                </div>

                {/* Quick Variable Inserts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-zinc-500">Вставить параметр:</span>
                  {QUICK_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-zinc-700 text-xs font-mono transition-colors cursor-pointer"
                    >
                      + {`{{${v}}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder="Вставьте точный текст команды. Используйте {{переменная}} для параметров, которые нужно будет подставлять при копировании..."
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl p-3.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 outline-none transition-all resize-y custom-scrollbar leading-relaxed"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Описание / Когда использовать
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое пояснение, когда и как применять эту команду..."
                  rows={2}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-all resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Теги
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300 border border-zinc-700"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Введите тег и нажмите Enter..." : "Добавить..."}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none px-1"
                  />
                </div>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="commandIsPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                />
                <label htmlFor="commandIsPublic" className="text-xs text-zinc-300 select-none cursor-pointer">
                  Публичная команда (видна другим пользователям)
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/30">
              <div>
                {initialData && onDelete && (user.uid === initialData.userId || user.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Удалить команду</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving || !title.trim() || !commandText.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Сохранение...' : (initialData ? 'Сохранить изменения' : 'Создать команду')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить команду?"
        message="Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить."
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
