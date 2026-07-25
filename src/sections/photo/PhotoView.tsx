import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Edit, CopyPlus, Trash2, Share2,
  Copy, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Prompt, User } from '../../types';
import { cn } from '../../utils/cn';

import MiniLayoutPreview from './view/MiniLayoutPreview';
import CollapsibleText from './view/CollapsibleText';
import AIAssistant from './view/AIAssistant';

interface PhotoViewProps {
  prompt: Prompt;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: (text: string) => void;
  effectiveUser: User | null;
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
}

export default function PhotoView({
  prompt: initialPrompt,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
  effectiveUser,
  addToast,
}: PhotoViewProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activeTab, setActiveTab] = useState<'main' | number>('main');
  const [sliderPos, setSliderPos] = useState(50);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPrompt(initialPrompt); }, [initialPrompt]);

  const setSliderFromClientX = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  useEffect(() => {
    if (!sliderDragging) return;
    const onMove = (e: MouseEvent) => setSliderFromClientX(e.clientX);
    const onUp = () => setSliderDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [sliderDragging]);

  const currentText = activeTab === 'main'
    ? prompt.mainPrompt
    : prompt.subSections[activeTab as number]?.text ?? '';

  const canEdit = effectiveUser && (effectiveUser.uid === prompt.userId || effectiveUser.role === 'admin');

  const activeSub = activeTab === 'main' ? null : prompt.subSections[activeTab as number];
  const hasSubImages = !!(activeSub && (activeSub.imageBefore || activeSub.imageAfter || (activeSub.additionalImages && activeSub.additionalImages.length > 0)));
  const activeLayoutSource = (activeSub && hasSubImages) ? activeSub : prompt;

  const layout = activeLayoutSource.imageLayoutType
    || (activeLayoutSource.imageBefore && activeLayoutSource.imageAfter ? 'slider' : 'single');
  const imageBefore = activeLayoutSource.imageBefore;
  const imageAfter = activeLayoutSource.imageAfter;
  const additionalImages = activeLayoutSource.additionalImages || [];
  const layoutHas3Slots = layout === 'split-1-2' || layout === 'merge-2-1';
  const extras = layoutHas3Slots ? additionalImages.slice(1) : additionalImages;

  const getLightboxSrc = () => {
    if (lightbox === null) return null;
    if (lightbox === -1) return imageBefore || imageAfter || null;
    if (lightbox === -2) return imageAfter || null;
    if (lightbox === -3) return additionalImages[0] || null;
    return extras[lightbox] || null;
  };
  const lightboxSrc = getLightboxSrc();

  const renderLayout = () => {
    switch (layout) {
      case 'single':
        return (imageBefore || imageAfter) ? (
          <div onClick={() => setLightbox(-1)} className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-zinc-900 shadow-xl cursor-pointer">
            <img src={imageBefore || imageAfter} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="Превью" referrerPolicy="no-referrer" />
          </div>
        ) : null;

      case 'slider':
        return (imageBefore && imageAfter) ? (
          <div
            ref={sliderRef}
            role="presentation"
            onMouseDown={(e) => { e.preventDefault(); setSliderDragging(true); setSliderFromClientX(e.clientX); }}
            className="relative aspect-[16/10] rounded-[2rem] overflow-hidden cursor-ew-resize select-none border border-zinc-900 touch-none shadow-xl"
          >
            <img src={imageAfter} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="После" referrerPolicy="no-referrer" />
            <img src={imageBefore} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }} alt="До" referrerPolicy="no-referrer" />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 pointer-events-none -translate-x-1/2" style={{ left: `${sliderPos}%` }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center text-black">
                <ChevronLeft size={14} className="-mr-1" /><ChevronRight size={14} className="-ml-1" />
              </div>
            </div>
            <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white uppercase pointer-events-none">До</div>
            <div className="absolute bottom-6 right-6 px-4 py-2 bg-sky-400/60 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white uppercase pointer-events-none">После</div>
          </div>
        ) : (imageBefore || imageAfter) ? (
          <div onClick={() => setLightbox(-1)} className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-zinc-900 shadow-xl cursor-pointer">
            <img src={imageAfter || imageBefore} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="Превью" referrerPolicy="no-referrer" />
          </div>
        ) : null;

      case 'split-vertical':
        return (
          <div className="flex flex-col gap-3 aspect-[16/10] w-full">
            <div onClick={() => setLightbox(-1)} className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {imageBefore && <img src={imageBefore} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
            <div onClick={() => setLightbox(-2)} className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {imageAfter && <img src={imageAfter} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
          </div>
        );

      case 'split-horizontal':
        return (
          <div className="flex gap-3 aspect-[16/10] w-full">
            <div onClick={() => setLightbox(-1)} className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {imageBefore && <img src={imageBefore} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
            <div onClick={() => setLightbox(-2)} className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {imageAfter && <img src={imageAfter} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
          </div>
        );

      case 'split-1-2':
        return (
          <div className="flex gap-3 aspect-[16/10] w-full">
            <div onClick={() => setLightbox(-1)} className="w-1/2 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {imageBefore && <img src={imageBefore} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
            <div className="w-1/2 flex flex-col gap-3">
              <div onClick={() => setLightbox(-2)} className="flex-1 rounded-[1.2rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
                {imageAfter && <img src={imageAfter} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
              </div>
              <div onClick={() => setLightbox(-3)} className="flex-1 rounded-[1.2rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
                {additionalImages[0] && <img src={additionalImages[0]} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
              </div>
            </div>
          </div>
        );

      case 'merge-2-1':
        return (
          <div className="flex flex-col gap-3 aspect-[16/10] w-full">
            <div className="flex-1 flex gap-3">
              <div onClick={() => setLightbox(-1)} className="flex-1 rounded-[1.2rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
                {imageBefore && <img src={imageBefore} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
              </div>
              <div onClick={() => setLightbox(-2)} className="flex-1 rounded-[1.2rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
                {imageAfter && <img src={imageAfter} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
              </div>
            </div>
            <div onClick={() => setLightbox(-3)} className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-900 shadow-lg cursor-pointer bg-zinc-900">
              {additionalImages[0] && <img src={additionalImages[0]} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" referrerPolicy="no-referrer" />}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const shareJson = async () => {
    const payload = {
      title: prompt.title, category: prompt.category, tags: prompt.tags,
      mainPrompt: prompt.mainPrompt, usageNotes: prompt.usageNotes,
      subSections: prompt.subSections, isPublic: prompt.isPublic,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      addToast('JSON скопирован в буфер', 'success');
    } catch {
      addToast('Не удалось скопировать JSON', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div
        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        className="relative w-full max-w-7xl max-h-[95vh] bg-zinc-950 border border-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col min-h-0"
      >
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-sky-400/10 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full">{prompt.category}</span>
              {prompt.promptOrigin && (
                <span className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
                  prompt.promptOrigin === 'web' ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"
                )}>
                  {prompt.promptOrigin === 'web' ? "Из сети" : "Авторский"}
                </span>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {prompt.tags?.map(t => <span key={t} className="text-[10px] font-bold text-zinc-600">#{t}</span>)}
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white break-words">{prompt.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/30 px-4 py-1.5 rounded-2xl animate-pulse">
                <span className="text-xs font-bold text-red-300">Точно удалить?</span>
                <button type="button" onClick={onDelete} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 cursor-pointer">Да</button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 cursor-pointer">Нет</button>
              </div>
            ) : showDuplicateConfirm ? (
              <div className="flex items-center gap-2 bg-sky-950/80 border border-sky-500/30 px-4 py-1.5 rounded-2xl">
                <span className="text-xs font-bold text-sky-300">Создать копию?</span>
                <button type="button" onClick={() => { onDuplicate(); setShowDuplicateConfirm(false); }} className="px-3 py-1 bg-sky-400 text-black rounded-lg text-xs font-bold hover:bg-sky-300 cursor-pointer">Да</button>
                <button type="button" onClick={() => setShowDuplicateConfirm(false)} className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 cursor-pointer">Нет</button>
              </div>
            ) : (
              <>
                {canEdit && (
                  <>
                    <button type="button" title="Редактировать" onClick={onEdit} className="p-3 hover:bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-all cursor-pointer"><Edit size={20} /></button>
                    <button type="button" title="Дублировать" onClick={() => setShowDuplicateConfirm(true)} className="p-3 hover:bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-all cursor-pointer"><CopyPlus size={20} /></button>
                    <button type="button" title="Удалить" onClick={() => setShowDeleteConfirm(true)} className="p-3 hover:bg-zinc-900 rounded-2xl text-zinc-400 hover:text-red-400 transition-all cursor-pointer"><Trash2 size={20} /></button>
                  </>
                )}
                <button type="button" title="Поделиться (JSON)" onClick={() => void shareJson()} className="p-3 hover:bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-all cursor-pointer"><Share2 size={20} /></button>
              </>
            )}
            <button type="button" onClick={onClose} className="p-3 hover:bg-zinc-900 rounded-2xl text-zinc-400 transition-all cursor-pointer"><X size={24} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Media */}
          <div className="w-full lg:w-1/2 min-h-0 p-8 sm:p-10 overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-900 shrink-0 lg:shrink">
            <div className="space-y-8">
              {renderLayout()}

              {extras.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Ещё фото</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {extras.map((src, i) => (
                      <button key={i} type="button" onClick={() => setLightbox(i)} className="shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-zinc-800 hover:border-sky-400/50 transition-colors cursor-pointer">
                        <img src={src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {prompt.usageNotes?.trim() && (
                <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 space-y-3">
                  <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest">Комментарии к промпту</h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{prompt.usageNotes.trim()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Prompt text + chat */}
          <div className="w-full lg:w-1/2 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-10 space-y-10">
              <div className="space-y-5">
                <div id="promptvault-active-copy" className="fixed w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden>{currentText}</div>

                <CollapsibleText
                  key={activeTab === 'main' ? 'tab-main' : `tab-sub-${activeTab as number}`}
                  text={currentText}
                  onCopy={onCopy}
                  hideFloatingCopy={activeTab !== 'main'}
                />

                {activeTab !== 'main' && (prompt.subSections[activeTab as number]?.text ?? '').trim() !== '' && (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" title="Копировать лишь Дополнение" onClick={() => onCopy((prompt.subSections[activeTab as number]?.text ?? '').trim())}
                      className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer">
                      <Copy size={18} />
                    </button>
                    <button type="button" title="Копировать дополнение + основное"
                      onClick={() => onCopy(`${prompt.mainPrompt.trim()}\n\n${(prompt.subSections[activeTab as number]?.text ?? '').trim()}`)}
                      className="p-3 rounded-xl bg-zinc-800 border border-sky-400/40 text-sky-400 hover:bg-sky-400/15 transition-colors cursor-pointer">
                      <CopyPlus size={18} />
                    </button>
                  </div>
                )}

                {/* Tabs */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Варианты промпта</p>
                  <div className="flex flex-col gap-3 w-full">
                    <button type="button" onClick={() => setActiveTab('main')}
                      className={`p-4 rounded-[1.8rem] font-bold text-sm text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 border w-full ${activeTab === 'main' ? 'bg-sky-400 text-black border-sky-400 shadow-lg shadow-sky-400/20' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850 hover:text-white'}`}>
                      <span className="break-words flex-1 leading-snug">Основной промпт</span>
                      <MiniLayoutPreview layout={prompt.imageLayoutType || (prompt.imageBefore && prompt.imageAfter ? 'slider' : 'single')} imageBefore={prompt.imageBefore} imageAfter={prompt.imageAfter} additionalImages={prompt.additionalImages} />
                    </button>
                    {prompt.subSections?.map((s, i) => {
                      const subLayout = s.imageLayoutType || (s.imageBefore && s.imageAfter ? 'slider' : 'single');
                      return (
                        <button key={i} type="button" onClick={() => setActiveTab(i)}
                          className={`p-4 rounded-[1.8rem] font-bold text-sm text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 border w-full ${activeTab === i ? 'bg-sky-400 text-black border-sky-400 shadow-lg shadow-sky-400/20' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850 hover:text-white'}`}>
                          <span className="break-words flex-1 leading-snug">{s.title?.trim() || `Вариант ${i + 1}`}</span>
                          <MiniLayoutPreview layout={subLayout} imageBefore={s.imageBefore} imageAfter={s.imageAfter} additionalImages={s.additionalImages} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="border-t border-zinc-900 pt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {prompt.authorName?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest truncate">{prompt.authorName || 'Автор'}</p>
                    <p className="text-[10px] text-zinc-600 font-medium truncate">{prompt.authorEmail}</p>
                  </div>
                  {prompt.authorEmail === 'alexey.unstam@gmail.com' && (
                    <span className="ml-auto px-2 py-0.5 bg-sky-400/20 text-sky-400 text-[9px] font-black uppercase tracking-widest rounded shrink-0">Admin</span>
                  )}
                </div>
              </div>

              <AIAssistant
                prompt={prompt}
                setPrompt={setPrompt}
                effectiveUser={effectiveUser}
                currentPromptText={currentText}
                addToast={addToast}
                canEditPrompt={!!canEdit}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-6" onClick={() => setLightbox(null)}>
            <button type="button" className="absolute top-6 right-6 p-3 rounded-full bg-zinc-800 text-white z-10 cursor-pointer" onClick={() => setLightbox(null)}><X size={22} /></button>
            <img src={lightboxSrc} alt="" className="max-w-full max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} referrerPolicy="no-referrer" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
