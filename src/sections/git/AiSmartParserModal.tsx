import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Upload, Loader2, ShieldCheck, AlertCircle, ImagePlus, Trash2, Link, FileText, Image } from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

export interface AiParsedResult {
  title?: string;
  category?: string;
  summary?: string;
  features?: string;
  detailedDescription?: string;
  installCommand?: string;
  githubUrl?: string;
  demoUrl?: string;
  tags?: string[];
  pricing?: string;
}

interface AiSmartParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsed: AiParsedResult) => void;
}

const MAX_TEXT_LENGTH = 12000;
const MAX_URL_LENGTH = 500;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 5;

export default function AiSmartParserModal({ isOpen, onClose, onApply }: AiSmartParserModalProps) {
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const hasAnyInput = aiUrl.trim() || aiText.trim() || aiImages.length > 0;

  const addImageFiles = (files: FileList | File[]) => {
    if (aiLoading) return;
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - aiImages.length;
    if (remaining <= 0) { setAiError(`Максимум ${MAX_IMAGES} скриншота`); return; }
    const toProcess = arr.slice(0, remaining);
    let errorShown = false;
    toProcess.forEach((file) => {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        if (!errorShown) { setAiError(`Файл «${file.name}» превышает ${MAX_IMAGE_SIZE_MB}MB`); errorShown = true; }
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          setAiImages((prev) => prev.length >= MAX_IMAGES ? prev : [...prev, base64]);
          setAiError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => setAiImages((prev) => prev.filter((_, i) => i !== idx));

  const handleParse = async () => {
    if (aiLoading) return;
    setAiError('');
    if (!hasAnyInput) { setAiError('Заполните хотя бы одно поле: ссылку, текст или скриншот'); return; }

    setAiLoading(true);
    try {
      const payload: Record<string, any> = {};
      if (aiUrl.trim()) payload.url = aiUrl.trim().slice(0, MAX_URL_LENGTH);
      if (aiText.trim()) payload.text = aiText.trim().slice(0, MAX_TEXT_LENGTH);
      if (aiImages.length > 0) payload.imagesBase64 = aiImages;

      const parsed = await api.parseToolWithGemini(payload as any);
      onApply(parsed);
      onClose();
    } catch (e: any) {
      setAiError(e.message || 'Ошибка парсера');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClose = () => {
    if (aiLoading) return;
    setAiError('');
    onClose();
  };

  // Подсчёт активных источников для индикатора
  const sourcesCount = [!!aiUrl.trim(), !!aiText.trim(), aiImages.length > 0].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-violet-200 dark:border-violet-800/40 rounded-3xl shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 overflow-hidden text-zinc-900 dark:text-zinc-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-950/80 dark:to-indigo-950/80 border-b border-violet-500/30 dark:border-violet-800/30 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Wand2 size={18} className="text-violet-200 dark:text-violet-400" />
                    🪄 AI Автозаполнение
                  </h3>
                  <p className="text-xs text-violet-100/80 dark:text-violet-300/70 mt-1">
                    Заполни что есть — ссылку, текст и/или скриншоты. Gemini объединит всё.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={aiLoading}
                  className="p-2 hover:bg-white/10 rounded-xl text-violet-200 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Индикатор источников */}
              {sourcesCount > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {aiUrl.trim() && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <Link size={10} /> Ссылка
                    </span>
                  )}
                  {aiText.trim() && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <FileText size={10} /> Текст
                    </span>
                  )}
                  {aiImages.length > 0 && (
                    <span className="flex items-center gap-1 bg-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      <Image size={10} /> {aiImages.length} скриншот{aiImages.length > 1 ? 'а' : ''}
                    </span>
                  )}
                  {sourcesCount > 1 && (
                    <span className="text-violet-200/70 text-[11px]">— Gemini объединит {sourcesCount} источника</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* URL */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-400 mb-1.5">
                  <Link size={12} className="text-violet-500" />
                  Ссылка <span className="font-normal text-zinc-400">(необязательно)</span>
                </label>
                <input
                  value={aiUrl}
                  disabled={aiLoading}
                  maxLength={MAX_URL_LENGTH}
                  onChange={(e) => setAiUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors"
                />
              </div>

              {/* Текст */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-400">
                    <FileText size={12} className="text-violet-500" />
                    Описание / текст поста <span className="font-normal text-zinc-400">(необязательно)</span>
                  </label>
                  {aiText.length > 0 && (
                    <span className={cn('text-[11px]', aiText.length > MAX_TEXT_LENGTH * 0.9 ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500')}>
                      {aiText.length} / {MAX_TEXT_LENGTH}
                    </span>
                  )}
                </div>
                <textarea
                  value={aiText}
                  disabled={aiLoading}
                  maxLength={MAX_TEXT_LENGTH}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Вставьте описание проекта, пост из Telegram, README и т.д."
                  rows={4}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors resize-none"
                />
              </div>

              {/* Скриншоты */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-400">
                    <Image size={12} className="text-violet-500" />
                    Скриншоты <span className="font-normal text-zinc-400">(необязательно, до {MAX_IMAGES} шт.)</span>
                  </label>
                  {aiImages.length > 0 && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{aiImages.length} / {MAX_IMAGES}</span>
                  )}
                </div>

                {/* Превью-сетка */}
                {aiImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {aiImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                        <img src={img} alt={`screenshot-${idx + 1}`} className="w-full h-24 object-cover" />
                        <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <button
                          disabled={aiLoading}
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500 hover:bg-rose-600 text-white rounded-lg p-1 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {aiImages.length < MAX_IMAGES && (
                      <button
                        disabled={aiLoading}
                        onClick={() => fileRef.current?.click()}
                        className="h-24 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all text-zinc-400 dark:text-zinc-600 hover:text-violet-500 cursor-pointer disabled:opacity-40"
                      >
                        <ImagePlus size={18} />
                        <span className="text-[11px] font-semibold">Добавить</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Drag&drop — только если фото ещё нет */}
                {aiImages.length === 0 && (
                  <div
                    className={cn(
                      'w-full border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/10 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-700',
                      aiLoading && 'pointer-events-none opacity-50'
                    )}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addImageFiles(e.dataTransfer.files); }}
                  >
                    <Upload size={22} className="text-zinc-400 dark:text-zinc-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">Перетащите или нажмите для выбора</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">PNG, JPG, WebP — до {MAX_IMAGES} шт. по {MAX_IMAGE_SIZE_MB}MB</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={aiLoading}
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.length) addImageFiles(e.target.files); e.target.value = ''; }}
                />
              </div>

              {/* Error */}
              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-600 dark:text-rose-300 text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleParse}
                disabled={aiLoading || !hasAnyInput}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini анализирует {sourcesCount > 1 ? `${sourcesCount} источника` : 'данные'}...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>
                      {!hasAnyInput
                        ? 'Заполните хотя бы одно поле'
                        : sourcesCount > 1
                          ? `Заполнить форму (${sourcesCount} источника)`
                          : 'Заполнить форму автоматически'}
                    </span>
                  </>
                )}
              </button>

              {/* Footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck size={12} className="text-emerald-500 dark:text-emerald-400" />
                <span>Защита от спама: 1 запрос / 3 сек. Лимит вывода 2048 токенов.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
