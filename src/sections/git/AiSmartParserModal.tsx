import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Link, FileText, Upload, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

type AiInputMode = 'url' | 'text' | 'image';

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

export default function AiSmartParserModal({ isOpen, onClose, onApply }: AiSmartParserModalProps) {
  const [aiMode, setAiMode] = useState<AiInputMode>('url');
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (aiLoading) return;
    // Ограничение размера файла: не более 5MB
    if (file.size > 5 * 1024 * 1024) {
      setAiError('Размер скриншота не должен превышать 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setAiImageBase64(base64);
        setAiError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    // 🛡️ Защита от спама и параллельных запросов
    if (aiLoading) return;
    setAiError('');

    const cleanUrl = aiUrl.trim();
    const cleanText = aiText.trim();

    if (aiMode === 'url' && !cleanUrl) {
      setAiError('Введите URL репозитория или страницы');
      return;
    }
    if (aiMode === 'text' && !cleanText) {
      setAiError('Введите текст с описанием проекта');
      return;
    }
    if (aiMode === 'image' && !aiImageBase64) {
      setAiError('Загрузите скриншот инструмента');
      return;
    }

    setAiLoading(true);
    try {
      const payload =
        aiMode === 'url'   ? { url: cleanUrl.slice(0, MAX_URL_LENGTH) } :
        aiMode === 'text'  ? { text: cleanText.slice(0, MAX_TEXT_LENGTH) } :
                             { imageBase64: aiImageBase64 };

      const parsed = await api.parseToolWithGemini(payload);
      onApply(parsed);
      onClose();
    } catch (e: any) {
      setAiError(e.message || 'Ошибка парсера');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClose = () => {
    if (aiLoading) return; // Не закрывать посреди активного сетевого запроса
    setAiError('');
    onClose();
  };

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
            className="w-full max-w-lg bg-zinc-950 border border-violet-800/40 rounded-3xl shadow-2xl shadow-violet-900/20 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-950/80 to-indigo-950/80 border-b border-violet-800/30 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Wand2 size={18} className="text-violet-400" />
                    🪄 AI Автозаполнение
                  </h3>
                  <p className="text-xs text-violet-300/70 mt-1">
                    Gemini 3.1 Flash-Lite автоматически извлечёт фичи, теги и команды
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={aiLoading}
                  className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Mode tabs */}
              <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                {[
                  { id: 'url'   as AiInputMode, label: '🔗 Ссылка' },
                  { id: 'text'  as AiInputMode, label: '📝 Текст' },
                  { id: 'image' as AiInputMode, label: '🖼️ Скриншот' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    disabled={aiLoading}
                    onClick={() => { setAiMode(tab.id); setAiError(''); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40',
                      aiMode === tab.id ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* URL mode */}
              {aiMode === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">URL репозитория или поста</label>
                  <input
                    value={aiUrl}
                    disabled={aiLoading}
                    maxLength={MAX_URL_LENGTH}
                    onChange={(e) => setAiUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !aiLoading) {
                        e.preventDefault();
                        handleParse();
                      }
                    }}
                  />
                </div>
              )}

              {/* Text mode */}
              {aiMode === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-400">Описание проекта / текст поста</label>
                    <span className={cn('text-[11px]', aiText.length > MAX_TEXT_LENGTH * 0.9 ? 'text-amber-400' : 'text-zinc-500')}>
                      {aiText.length} / {MAX_TEXT_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={aiText}
                    disabled={aiLoading}
                    maxLength={MAX_TEXT_LENGTH}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Вставьте описание проекта, пост из Telegram, README и т.д."
                    rows={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors resize-none"
                  />
                </div>
              )}

              {/* Image mode */}
              {aiMode === 'image' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Скриншот поста (Telegram, Twitter/X, GitHub)</label>
                  <div
                    className={cn(
                      'w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-violet-600',
                      aiImageBase64 ? 'border-violet-600/60' : 'border-zinc-700',
                      aiLoading && 'pointer-events-none opacity-50'
                    )}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                  >
                    {aiImageBase64 ? (
                      <>
                        <img src={aiImageBase64} alt="screenshot" className="max-h-40 rounded-lg object-contain" />
                        <span className="text-xs text-violet-400 font-semibold">✅ Скриншот загружен — нажмите чтобы заменить</span>
                      </>
                    ) : (
                      <>
                        <Upload size={28} className="text-zinc-600" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-zinc-400">Перетащите скриншот</p>
                          <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WebP до 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    disabled={aiLoading}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                  />
                </div>
              )}

              {/* Error */}
              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-rose-950/50 border border-rose-800/40 rounded-xl text-rose-300 text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleParse}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini 3.1 анализирует проект...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Заполнить форму автоматически</span>
                  </>
                )}
              </button>

              {/* Guard footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Защита от спама: 1 запрос / 3 сек. Лимит вывода 2048 токенов.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
