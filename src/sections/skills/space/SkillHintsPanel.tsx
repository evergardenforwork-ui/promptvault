import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Lightbulb, Copy, Check, Trash2, Plus, Loader2, Pin
} from 'lucide-react';
import { SkillHint, User } from '../../../types';
import { api } from '../../../services/api';
import { cn } from '../../../utils/cn';

interface SkillHintsPanelProps {
  skillId: string;
  skillTitle: string;
  effectiveUser: User | null;
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
  onClose: () => void;
  onHintsCountChange: (count: number) => void;
}

export default function SkillHintsPanel({
  skillId,
  skillTitle,
  effectiveUser,
  addToast,
  onClose,
  onHintsCountChange,
}: SkillHintsPanelProps) {
  const [hints, setHints] = useState<SkillHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHints();
  }, [skillId]);

  useEffect(() => {
    if (showForm) setTimeout(() => formRef.current?.focus(), 100);
  }, [showForm]);

  async function loadHints() {
    setLoading(true);
    try {
      const data = await api.getSkillHints(skillId);
      setHints(data);
      onHintsCountChange(data.length);
    } catch {
      addToast('Не удалось загрузить подсказки', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formTitle.trim() || !formText.trim()) return;
    setSaving(true);
    try {
      const hint = await api.createSkillHint(skillId, {
        title: formTitle.trim(),
        text: formText.trim(),
      });
      setHints(prev => {
        const next = [...prev, hint];
        onHintsCountChange(next.length);
        return next;
      });
      setFormTitle('');
      setFormText('');
      setShowForm(false);
      addToast('Подсказка создана', 'success');
    } catch {
      addToast('Не удалось создать подсказку', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hintId: string) {
    setDeletingId(hintId);
    try {
      await api.deleteSkillHint(skillId, hintId);
      setHints(prev => {
        const next = prev.filter(h => h.id !== hintId);
        onHintsCountChange(next.length);
        return next;
      });
      addToast('Подсказка удалена');
    } catch {
      addToast('Не удалось удалить', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy(hint: SkillHint) {
    navigator.clipboard.writeText(hint.text);
    setCopiedId(hint.id);
    addToast('Подсказка скопирована в буфер');
    setTimeout(() => setCopiedId(id => id === hint.id ? null : id), 2000);
  }

  const canDeleteHint = (hint: SkillHint) =>
    effectiveUser && (effectiveUser.uid === hint.userId || effectiveUser.role === 'admin');

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="hints-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          key="hints-panel"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 flex flex-col max-h-[85vh] overflow-hidden text-zinc-900 dark:text-white"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">Подсказки</h2>
                <p className="text-[11px] text-zinc-500 truncate max-w-[260px]">{skillTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-500 dark:text-violet-400 animate-spin" />
              </div>
            ) : hints.length === 0 && !showForm ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/15 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-amber-500/60 dark:text-amber-400/60" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Нет подсказок</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                  Создайте короткие промпты-подсказки, которые можно быстро скопировать для работы с этим скиллом
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {hints.map(hint => (
                  <motion.div
                    key={hint.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group relative bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/40 hover:border-zinc-300 dark:hover:border-zinc-600/60 rounded-xl p-4 transition-all"
                  >
                    {/* Hint header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Pin className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{hint.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(hint)}
                          className={cn(
                            'p-1.5 rounded-lg transition-all cursor-pointer',
                            copiedId === hint.id
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          )}
                          title="Копировать"
                        >
                          {copiedId === hint.id
                            ? <Check className="w-3.5 h-3.5" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                        {canDeleteHint(hint) && (
                          <button
                            onClick={() => handleDelete(hint.id)}
                            disabled={deletingId === hint.id}
                            className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            title="Удалить"
                          >
                            {deletingId === hint.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hint text */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {hint.text}
                    </p>

                    {/* Quick copy overlay on text click */}
                    <button
                      onClick={() => handleCopy(hint)}
                      className="absolute inset-0 rounded-xl opacity-0 cursor-pointer"
                      aria-label={`Копировать: ${hint.title}`}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Create form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-50 dark:bg-zinc-800/80 border border-violet-500/30 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-300 flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" /> Новая подсказка
                    </p>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="Заголовок подсказки..."
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-violet-500 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-colors"
                      onKeyDown={e => e.key === 'Escape' && setShowForm(false)}
                    />
                    <textarea
                      ref={formRef}
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      placeholder="Текст подсказки (промпт для ИИ)..."
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-violet-500 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none transition-colors leading-relaxed"
                      onKeyDown={e => {
                        if (e.key === 'Escape') setShowForm(false);
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleCreate();
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-600">Ctrl+Enter — сохранить</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setShowForm(false); setFormTitle(''); setFormText(''); }}
                          className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all cursor-pointer"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleCreate}
                          disabled={!formTitle.trim() || !formText.trim() || saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Сохранить
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setShowForm(v => !v)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer',
                showForm
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-950 dark:hover:text-white'
                  : 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/20 hover:text-violet-800 dark:hover:text-violet-300'
              )}
            >
              {showForm ? (
                <><X className="w-4 h-4" /> Свернуть</>
              ) : (
                <><Plus className="w-4 h-4" /> Создать подсказку</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
