import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X, RotateCcw, Send, Paperclip, History, Check, Settings, Sparkles, CopyPlus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prompt, ChatMessage, User } from '../../../types';
import { cn } from '../../../utils/cn';
import { api } from '../../../services/api';
import { chatWithGemini, GeminiHistoryTurn } from '../../../services/gemini';

const CUSTOM_PRESETS_KEY = 'promptvault_assistant_custom_presets';
const SEND_BEFORE_KEY = 'promptvault_send_before';
const SEND_AFTER_KEY = 'promptvault_send_after';

type PresetBtn = { label: string; text: string };

const BUILTIN_PRESETS: PresetBtn[] = [
  { label: 'Убрать персонажа', text: 'Убери из промпта любые упоминания конкретного персонажа, имени или личности, сохранив остальную структуру и стиль.' },
  { label: 'Мой стиль', text: 'Адаптируй этот промпт под универсальный «мой» стиль: чуть более лаконично, сильнее акцент на свет и композицию, без лишних повторов.' },
  { label: 'Упростить', text: 'Упрости промпт, оставив смысл и ключевые детали; убери избыточные уточнения.' },
  { label: 'На английский', text: 'Переведи весь промпт на английский, сохранив термины и структуру.' },
  { label: 'Объяснить части', text: 'Объясни по частям, что делает каждый фрагмент этого промпта и зачем он нужен.' },
];

interface AIAssistantProps {
  prompt: Prompt;
  setPrompt: React.Dispatch<React.SetStateAction<Prompt>>;
  effectiveUser: User | null;
  currentPromptText: string;
  addToast: (m: React.ReactNode, t?: 'success' | 'error') => void;
  canEditPrompt: boolean;
}

export default function AIAssistant({
  prompt,
  setPrompt,
  effectiveUser,
  currentPromptText,
  addToast,
  canEditPrompt,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(currentPromptText);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sendBefore, setSendBefore] = useState(() => localStorage.getItem(SEND_BEFORE_KEY) === '1');
  const [sendAfter, setSendAfter] = useState(() => localStorage.getItem(SEND_AFTER_KEY) === '1');
  const [customPresets, setCustomPresets] = useState<PresetBtn[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as PresetBtn[];
      return Array.isArray(parsed) ? parsed.filter((p) => p?.label && p?.text) : [];
    } catch {
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendInFlightRef = useRef(false);

  useEffect(() => {
    setSystemPrompt(currentPromptText);
  }, [currentPromptText]);

  useEffect(() => {
    localStorage.setItem(SEND_BEFORE_KEY, sendBefore ? '1' : '0');
  }, [sendBefore]);

  useEffect(() => {
    localStorage.setItem(SEND_AFTER_KEY, sendAfter ? '1' : '0');
  }, [sendAfter]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load chat history from server database
  useEffect(() => {
    if (prompt.id) {
      api.getChats(prompt.id)
        .then(msgs => setMessages(msgs))
        .catch(err => console.error("Ошибка загрузки истории чата:", err));
    }
  }, [prompt.id]);

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    if (!effectiveUser) return;
    if (sendInFlightRef.current) return;
    sendInFlightRef.current = true;

    const userMsg = input.trim();
    const userImg = image;

    setInput('');
    setImage(null);

    try {
      const savedUserMsg = await api.sendChatMessage(prompt.id, userMsg, userImg || undefined);
      setMessages((prev) => [...prev, savedUserMsg]);
      setIsTyping(true);

      const history: GeminiHistoryTurn[] = messages.map((m) => ({
        role: m.role as 'user' | 'model',
        text: m.content || '',
        image: m.role === 'user' ? m.image : undefined,
      }));

      const imagesToSend: string[] = [];
      if (userImg) imagesToSend.push(userImg);
      if (sendBefore && prompt.imageBefore) imagesToSend.push(prompt.imageBefore);
      if (sendAfter && prompt.imageAfter) imagesToSend.push(prompt.imageAfter);

      const promptText = userMsg || (imagesToSend.length ? 'Проанализируй изображения в контексте промпта.' : '');

      const response = await chatWithGemini(
        promptText,
        systemPrompt,
        history,
        imagesToSend.length ? imagesToSend : undefined
      );

      const savedModelMsg = await api.sendChatMessage(prompt.id, response);
      setMessages((prev) => [...prev, savedModelMsg]);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Ошибка ИИ. Попробуйте еще раз.', 'error');
    } finally {
      setIsTyping(false);
      sendInFlightRef.current = false;
    }
  };

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addCustomPreset = () => {
    const label = window.prompt('Название кнопки');
    if (!label?.trim()) return;
    const text = window.prompt('Текст, который отправится в чат');
    if (!text?.trim()) return;
    const next = [...customPresets, { label: label.trim(), text: text.trim() }];
    setCustomPresets(next);
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
    addToast('Кнопка сохранена', 'success');
  };

  const plainFromMarkdown = (md: string) => md.replace(/\*\*|`|#/g, '').trim();

  const saveModelAsVariant = async (content: string) => {
    if (!canEditPrompt) return;
    const title = `Из чата ${new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}`;
    const nextSubs = [...(prompt.subSections || []), { title, text: plainFromMarkdown(content) }];
    try {
      const updatedPrompt = await api.updatePrompt(prompt.id, { subSections: nextSubs });
      setPrompt(updatedPrompt);
      addToast('Сохранено как новый вариант', 'success');
    } catch (err: any) {
      addToast(err.message || 'Не удалось сохранить вариант', 'error');
    }
  };

  const replaceMainFromModel = async (content: string) => {
    if (!canEditPrompt) return;
    if (!window.confirm('Заменить основной промпт текстом ответа ассистента?')) return;
    try {
      const updatedPrompt = await api.updatePrompt(prompt.id, { mainPrompt: plainFromMarkdown(content) });
      setPrompt(updatedPrompt);
      addToast('Основной промпт обновлён', 'success');
    } catch (err: any) {
      addToast(err.message || 'Не удалось обновить промпт', 'error');
    }
  };

  const clearChatHistory = async () => {
    if (!window.confirm('Очистить всю историю сообщений для этого промпта?')) return;
    try {
      await api.clearChats(prompt.id);
      setMessages([]);
      addToast('История чата очищена', 'success');
    } catch (err: any) {
      addToast(err.message || 'Не удалось очистить чат', 'error');
    }
  };

  const allPresets = [...BUILTIN_PRESETS, ...customPresets];

  return (
    <div className="space-y-6 pt-8 border-t border-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-sky-400/10 text-sky-400 rounded-lg shrink-0">
            <Sparkles size={20} />
          </div>
          <h3 className="text-xl font-black tracking-tighter truncate text-white">ИИ-ассистент</h3>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChatHistory}
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
              title="Очистить историю чата"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.22 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Системный промпт</label>
              <button
                type="button"
                onClick={() => setSystemPrompt(currentPromptText)}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw size={10} /> Сбросить к промпту
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-sky-400 transition-all resize-none text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Авто-отправка изображений</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setSendBefore(!sendBefore)}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <span className={cn(
                  'w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center',
                  sendBefore ? 'bg-sky-400 border-sky-400' : 'border-zinc-700 group-hover:border-zinc-500'
                )}>
                  {sendBefore && <Check size={12} className="text-black" />}
                </span>
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Отправлять Before</span>
              </button>
              <button
                type="button"
                onClick={() => setSendAfter(!sendAfter)}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <span className={cn(
                  'w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center',
                  sendAfter ? 'bg-sky-400 border-sky-400' : 'border-zinc-700 group-hover:border-zinc-500'
                )}>
                  {sendAfter && <Check size={12} className="text-black" />}
                </span>
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Отправлять After</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col min-h-[420px] h-[min(520px,55vh)]">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 min-h-[200px]">
              <History size={48} className="text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">Напишите запрос или выберите быстрое действие ниже.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed transition-colors duration-200',
                m.role === 'user' ? 'bg-sky-400 text-black font-semibold rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
              )}>
                {m.image && (
                  <img src={m.image} className="w-full max-w-xs rounded-lg mb-3" alt="" referrerPolicy="no-referrer" />
                )}
                <div className="markdown-body">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
              {m.role === 'model' && (
                <div className="flex flex-wrap gap-2 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(plainFromMarkdown(m.content));
                      addToast('Ответ скопирован', 'success');
                    }}
                    className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Копировать
                  </button>
                  {canEditPrompt && (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveModelAsVariant(m.content)}
                        className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Сохранить как вариант
                      </button>
                      <button
                        type="button"
                        onClick={() => void replaceMainFromModel(m.content)}
                        className="px-2 py-1 rounded-lg bg-zinc-900 border border-red-900/50 text-[10px] font-bold text-red-300 hover:bg-red-950/40 cursor-pointer"
                      >
                        Заменить основной
                      </button>
                    </>
                  )}
                </div>
              )}
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                {m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '...'}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1 p-4 bg-zinc-800 rounded-2xl rounded-tl-none w-16 items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 bg-sky-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-sky-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-sky-400 rounded-full"
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {allPresets.map((p) => (
              <button
                key={`${p.label}-${p.text.slice(0, 12)}`}
                type="button"
                onClick={() => setInput(p.text)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold rounded-full transition-all duration-200 shrink-0 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={addCustomPreset}
              className="px-3 py-1.5 bg-sky-400/15 hover:bg-sky-400/25 border border-sky-400/30 text-sky-400 text-[10px] font-bold rounded-full transition-all duration-200 shrink-0 cursor-pointer"
            >
              + Своя кнопка
            </button>
          </div>

          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative min-w-0">
              {image && (
                <div className="absolute bottom-full mb-4 left-0 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-10">
                  <img src={image} className="h-20 w-20 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Сообщение для ассистента…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-sky-400 transition-all duration-200 text-sm resize-none min-h-[3.5rem] max-h-32 text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const inp = document.createElement('input');
                  inp.type = 'file';
                  inp.accept = 'image/*';
                  inp.onchange = (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (file) handleImage(file);
                  };
                  inp.click();
                }}
                className="absolute right-4 bottom-3 text-zinc-500 hover:text-sky-400 transition-all cursor-pointer"
              >
                <Paperclip size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isTyping || (!input.trim() && !image)}
              className="p-4 bg-sky-400 hover:bg-sky-300 text-black rounded-2xl transition-all duration-200 shadow-lg shadow-sky-400/20 disabled:opacity-50 disabled:shadow-none shrink-0 cursor-pointer"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
