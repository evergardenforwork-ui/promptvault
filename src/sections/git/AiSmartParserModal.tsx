import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Link, FileText, Upload, Loader2 } from 'lucide-react';
import { GitProject, GitProjectCategory, GitProjectPricing } from '../../types';
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

export default function AiSmartParserModal({ isOpen, onClose, onApply }: AiSmartParserModalProps) {
  const [aiMode, setAiMode] = useState<AiInputMode>('url');
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) setAiImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setAiError('');
    if (aiMode === 'url' && !aiUrl.trim()) { setAiError('Введите URL'); return; }
    if (aiMode === 'text' && !aiText.trim()) { setAiError('Введите текст'); return; }
    if (aiMode === 'image' && !aiImageBase64) { setAiError('Загрузите скриншот'); return; }

    setAiLoading(true);
    try {
      const payload =
        aiMode === 'url'   ? { url: aiUrl.trim() } :
        aiMode === 'text'  ? { text: aiText.trim() } :
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
                    Gemini автоматически заполнит форму по скриншоту, ссылке или тексту
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
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
                    onClick={() => { setAiMode(tab.id); setAiError(''); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer',
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
                    onChange={(e) => setAiUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                  />
                </div>
              )}

              {/* Text mode */}
              {aiMode === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Описание проекта / текст поста</label>
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Вставьте описание проекта, пост из Telegram, README и т.д."
                    rows={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
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
                      aiImageBase64 ? 'border-violet-600/60' : 'border-zinc-700'
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
                          <p className="text-xs text-zinc-600 mt-1">или нажмите для выбора файла</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                  />
                </div>
              )}

              {/* Error */}
              {aiError && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/40 rounded-xl text-rose-300 text-xs">
                  <X size={12} className="shrink-0" />
                  {aiError}
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
                    Gemini анализирует...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Заполнить форму автоматически
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
