import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, X, ChevronDown, Trash2 } from 'lucide-react';
import { Category, Prompt, SubSection, User, MediaType } from '../../types';
import { cn } from '../../utils/cn';
import ImageCropper from '../../components/ui/ImageCropper';
import { api } from '../../services/api';

import ImageSlotsSection, { LAYOUT_OPTIONS } from './form/ImageSlotsSection';
import SubSectionsEditor from './form/SubSectionsEditor';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface PhotoFormProps {
  prompt: Prompt | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  onAddCategory: () => void;
  user: User;
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
  onCloseRef?: React.MutableRefObject<(() => void) | null>;
}

export default function PhotoForm({
  prompt,
  categories,
  onClose,
  onSave,
  onAddCategory,
  addToast,
  onCloseRef,
}: PhotoFormProps) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [category, setCategory] = useState(prompt?.category || categories[0]?.name || '');
  const [mainPrompt, setMainPrompt] = useState(prompt?.mainPrompt || '');
  const [tags, setTags] = useState<string[]>(prompt?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [imageLayoutType, setImageLayoutType] = useState<string>(() => {
    if (prompt?.imageLayoutType) return prompt.imageLayoutType;
    if (prompt?.imageBefore && prompt?.imageAfter) return 'slider';
    return 'single';
  });

  const [imageBefore, setImageBefore] = useState(prompt?.imageBefore || '');
  const [imageAfter, setImageAfter] = useState(prompt?.imageAfter || '');
  const [imageSlot2, setImageSlot2] = useState<string>(() => {
    const layout = prompt?.imageLayoutType || (prompt?.imageBefore && prompt?.imageAfter ? 'slider' : 'single');
    const layoutHas3Slots = layout === 'split-1-2' || layout === 'merge-2-1';
    if (layoutHas3Slots && prompt?.additionalImages && prompt.additionalImages.length > 0) {
      return prompt.additionalImages[0] || '';
    }
    return '';
  });

  const [originalImageBefore, setOriginalImageBefore] = useState(prompt?.originalImageBefore || '');
  const [originalImageAfter, setOriginalImageAfter] = useState(prompt?.originalImageAfter || '');
  const [originalImageSlot2, setOriginalImageSlot2] = useState(prompt?.originalImageSlot2 || '');

  const [additionalImages, setAdditionalImages] = useState<string[]>(() => {
    const layout = prompt?.imageLayoutType || (prompt?.imageBefore && prompt?.imageAfter ? 'slider' : 'single');
    const layoutHas3Slots = layout === 'split-1-2' || layout === 'merge-2-1';
    if (layoutHas3Slots) return prompt?.additionalImages.slice(1) || [];
    return prompt?.additionalImages || [];
  });

  const [subSections, setSubSections] = useState<SubSection[]>(prompt?.subSections || []);
  const [isPublic, setIsPublic] = useState(prompt?.isPublic ?? false);
  const [promptOrigin, setPromptOrigin] = useState<'own' | 'web'>(prompt?.promptOrigin || 'own');
  const [mediaType, setMediaType] = useState<MediaType>(prompt?.mediaType || 'photo');
  const [usageNotes, setUsageNotes] = useState(prompt?.usageNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Capture initial state on mount to detect unsaved changes
  const initialValues = useRef({
    title: prompt?.title || '',
    category: prompt?.category || categories[0]?.name || '',
    mainPrompt: prompt?.mainPrompt || '',
    tags: prompt?.tags || [],
    imageLayoutType: prompt?.imageLayoutType || (prompt?.imageBefore && prompt?.imageAfter ? 'slider' : 'single'),
    imageBefore: prompt?.imageBefore || '',
    imageAfter: prompt?.imageAfter || '',
    imageSlot2: (() => {
      const layout = prompt?.imageLayoutType || (prompt?.imageBefore && prompt?.imageAfter ? 'slider' : 'single');
      const layoutHas3Slots = layout === 'split-1-2' || layout === 'merge-2-1';
      if (layoutHas3Slots && prompt?.additionalImages && prompt.additionalImages.length > 0) {
        return prompt.additionalImages[0] || '';
      }
      return '';
    })(),
    originalImageBefore: prompt?.originalImageBefore || '',
    originalImageAfter: prompt?.originalImageAfter || '',
    originalImageSlot2: prompt?.originalImageSlot2 || '',
    additionalImages: (() => {
      const layout = prompt?.imageLayoutType || (prompt?.imageBefore && prompt?.imageAfter ? 'slider' : 'single');
      const layoutHas3Slots = layout === 'split-1-2' || layout === 'merge-2-1';
      if (layoutHas3Slots) return prompt?.additionalImages.slice(1) || [];
      return prompt?.additionalImages || [];
    })(),
    subSections: prompt?.subSections || [],
    isPublic: prompt?.isPublic ?? false,
    promptOrigin: prompt?.promptOrigin || 'own',
    mediaType: prompt?.mediaType || 'photo',
    usageNotes: prompt?.usageNotes || '',
  }).current;

  const isDirty = 
    title !== initialValues.title ||
    category !== initialValues.category ||
    mainPrompt !== initialValues.mainPrompt ||
    JSON.stringify(tags) !== JSON.stringify(initialValues.tags) ||
    imageLayoutType !== initialValues.imageLayoutType ||
    imageBefore !== initialValues.imageBefore ||
    imageAfter !== initialValues.imageAfter ||
    imageSlot2 !== initialValues.imageSlot2 ||
    originalImageBefore !== initialValues.originalImageBefore ||
    originalImageAfter !== initialValues.originalImageAfter ||
    originalImageSlot2 !== initialValues.originalImageSlot2 ||
    JSON.stringify(additionalImages) !== JSON.stringify(initialValues.additionalImages) ||
    JSON.stringify(subSections) !== JSON.stringify(initialValues.subSections) ||
    isPublic !== initialValues.isPublic ||
    promptOrigin !== initialValues.promptOrigin ||
    mediaType !== initialValues.mediaType ||
    usageNotes !== initialValues.usageNotes;

  const handleRequestClose = React.useCallback(() => {
    if (showConfirmClose) {
      setShowConfirmClose(false);
      return;
    }
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, showConfirmClose, onClose]);

  useEffect(() => {
    if (onCloseRef) {
      onCloseRef.current = handleRequestClose;
      return () => {
        onCloseRef.current = null;
      };
    }
  }, [onCloseRef, handleRequestClose]);

  const extraImagesInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [cropTarget, setCropTarget] = useState<{ subIdx: number | null; slotIdx: number } | null>(null);

  const optionSurface = { backgroundColor: '#27272a', color: '#fafafa' } as const;

  // --- Slot helpers ---
  const getSlotImage = (subIdx: number | null, idx: number) => {
    if (subIdx === null) {
      if (idx === 0) return imageBefore;
      if (idx === 1) return imageAfter;
      if (idx === 2) return imageSlot2;
    } else {
      const sub = subSections[subIdx];
      if (sub) {
        if (idx === 0) return sub.imageBefore || '';
        if (idx === 1) return sub.imageAfter || '';
        if (idx === 2) return sub.additionalImages?.[0] || '';
      }
    }
    return '';
  };

  const getOriginalSlotImage = (subIdx: number | null, idx: number) => {
    if (subIdx === null) {
      if (idx === 0) return originalImageBefore || imageBefore;
      if (idx === 1) return originalImageAfter || imageAfter;
      if (idx === 2) return originalImageSlot2 || imageSlot2;
    } else {
      const sub = subSections[subIdx];
      if (sub) {
        if (idx === 0) return sub.originalImageBefore || sub.imageBefore || '';
        if (idx === 1) return sub.originalImageAfter || sub.imageAfter || '';
        if (idx === 2) return sub.originalImageSlot2 || sub.additionalImages?.[0] || '';
      }
    }
    return '';
  };

  const setSlotImage = (subIdx: number | null, idx: number, val: string) => {
    if (subIdx === null) {
      if (idx === 0) setImageBefore(val);
      else if (idx === 1) setImageAfter(val);
      else if (idx === 2) setImageSlot2(val);
    } else {
      const next = [...subSections];
      const sub = { ...next[subIdx] };
      if (idx === 0) sub.imageBefore = val;
      else if (idx === 1) sub.imageAfter = val;
      else if (idx === 2) {
        if (!sub.additionalImages) sub.additionalImages = [];
        sub.additionalImages = [val, ...(sub.additionalImages.slice(1))];
      }
      next[subIdx] = sub;
      setSubSections(next);
    }
  };

  const clearSlotImage = (subIdx: number | null, idx: number) => {
    if (subIdx === null) {
      if (idx === 0) { setImageBefore(''); setOriginalImageBefore(''); }
      else if (idx === 1) { setImageAfter(''); setOriginalImageAfter(''); }
      else if (idx === 2) { setImageSlot2(''); setOriginalImageSlot2(''); }
    } else {
      const next = [...subSections];
      const sub = { ...next[subIdx] };
      if (idx === 0) { sub.imageBefore = ''; sub.originalImageBefore = ''; }
      else if (idx === 1) { sub.imageAfter = ''; sub.originalImageAfter = ''; }
      else if (idx === 2) {
        sub.originalImageSlot2 = '';
        if (sub.additionalImages) sub.additionalImages = ['', ...(sub.additionalImages.slice(1))];
      }
      next[subIdx] = sub;
      setSubSections(next);
    }
  };

  const getAspectForSlot = (layout: string, idx: number): number => {
    if (layout === 'single') return 1.6;
    if (layout === 'slider') return 1.6;
    if (layout === 'split-vertical') return 3.2;
    if (layout === 'split-horizontal') return 0.8;
    if (layout === 'split-1-2') return idx === 0 ? 0.8 : 3.2;
    if (layout === 'merge-2-1') return idx === 2 ? 3.2 : 1.6;
    return 1.6;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) { setCropperSrc(res); setCropperOpen(true); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedSave = (croppedDataUrl: string) => {
    if (cropTarget !== null) {
      const { subIdx, slotIdx } = cropTarget;
      setSlotImage(subIdx, slotIdx, croppedDataUrl);
      if (subIdx === null) {
        if (slotIdx === 0) setOriginalImageBefore(cropperSrc);
        else if (slotIdx === 1) setOriginalImageAfter(cropperSrc);
        else if (slotIdx === 2) setOriginalImageSlot2(cropperSrc);
      } else {
        const next = [...subSections];
        const sub = { ...next[subIdx] };
        if (slotIdx === 0) sub.originalImageBefore = cropperSrc;
        else if (slotIdx === 1) sub.originalImageAfter = cropperSrc;
        else if (slotIdx === 2) sub.originalImageSlot2 = cropperSrc;
        next[subIdx] = sub;
        setSubSections(next);
      }
    }
    setCropperOpen(false);
    setCropTarget(null);
  };

  // --- Slot renderer (passed to children) ---
  const renderSlot = (subIdx: number | null, idx: number, label: string) => {
    const img = getSlotImage(subIdx, idx);
    return (
      <div className="relative group h-full w-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden min-h-[140px]">
        {img ? (
          <>
            <img src={img} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
              <span className="text-xs font-bold text-white uppercase tracking-wider mb-1">{label}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setCropTarget({ subIdx, slotIdx: idx }); fileInputRef.current?.click(); }}
                  className="px-3 py-1.5 bg-sky-400 text-black font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-sky-300 transition-colors cursor-pointer">
                  Заменить
                </button>
                <button type="button" onClick={() => { const origImg = getOriginalSlotImage(subIdx, idx); setCropperSrc(origImg); setCropTarget({ subIdx, slotIdx: idx }); setCropperOpen(true); }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer">
                  Обрезать
                </button>
                <button type="button" onClick={() => clearSlotImage(subIdx, idx)}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => { setCropTarget({ subIdx, slotIdx: idx }); fileInputRef.current?.click(); }}
            className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 cursor-pointer">
            <div className="p-3 rounded-full bg-zinc-850 text-zinc-400 group-hover:text-white transition-colors"><Plus size={18} /></div>
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
            <span className="text-[9px] text-zinc-600 font-medium">Нажмите для выбора</span>
          </button>
        )}
      </div>
    );
  };

  // --- Layout preview renderer (passed to children) ---
  const renderLayoutPreview = (subIdx: number | null) => {
    const layout = subIdx === null
      ? imageLayoutType
      : (subSections[subIdx]?.imageLayoutType || (subSections[subIdx]?.imageBefore && subSections[subIdx]?.imageAfter ? 'slider' : 'single'));

    switch (layout) {
      case 'single':
        return <div className="aspect-video w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Основное фото')}</div>;
      case 'slider':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Изображение ДО')}</div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 1, 'Изображение ПОСЛЕ')}</div>
          </div>
        );
      case 'split-vertical':
        return (
          <div className="flex flex-col gap-4 aspect-video w-full max-w-xl mx-auto">
            <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Верхнее фото')}</div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 1, 'Нижнее фото')}</div>
          </div>
        );
      case 'split-horizontal':
        return (
          <div className="flex gap-4 aspect-video w-full max-w-2xl mx-auto">
            <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Левое фото')}</div>
            <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 1, 'Правое фото')}</div>
          </div>
        );
      case 'split-1-2':
        return (
          <div className="flex gap-4 aspect-video w-full max-w-3xl mx-auto">
            <div className="w-1/2 rounded-3xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Левое (основное) фото')}</div>
            <div className="w-1/2 flex flex-col gap-4">
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 1, 'Правое верхнее фото')}</div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 2, 'Правое нижнее фото')}</div>
            </div>
          </div>
        );
      case 'merge-2-1':
        return (
          <div className="flex flex-col gap-4 aspect-video w-full max-w-3xl mx-auto">
            <div className="flex-1 flex gap-4">
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 0, 'Верхнее левое фото')}</div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 1, 'Верхнее правое фото')}</div>
            </div>
            <div className="flex justify-center text-zinc-700 -my-2 font-bold text-xs uppercase tracking-widest flex-col items-center">
              <span>↓ объединенный результат ↓</span>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl">{renderSlot(subIdx, 2, 'Нижнее фото')}</div>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (categories.length === 0) return;
    if (prompt && categories.some((c) => c.name === prompt.category)) {
      setCategory(prompt.category);
      return;
    }
    setCategory((prev) => {
      if (prev && categories.some((c) => c.name === prev)) return prev;
      return categories[0].name;
    });
  }, [categories, prompt?.id, prompt?.category]);

  // --- Tag helpers ---
  const commitTagsFromInput = () => {
    const parts = tagInput.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => { const next = [...prev]; for (const p of parts) if (!next.includes(p)) next.push(p); return next; });
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim()) commitTagsFromInput(); return; }
    if (e.key === ' ' && tagInput.trim()) { e.preventDefault(); commitTagsFromInput(); }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // --- SubSection helpers ---
  const addSubSection = () => setSubSections([...subSections, { title: '', text: '' }]);
  const updateSubSection = (i: number, field: keyof SubSection, val: any) => {
    const next = [...subSections];
    (next[i] as any)[field] = val;
    setSubSections(next);
  };
  const removeSubSection = (i: number) => setSubSections(subSections.filter((_, idx) => idx !== i));

  // --- Save ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mainPrompt) return;

    const finalBefore = imageBefore;
    const finalAfter = (imageLayoutType === 'single') ? '' : imageAfter;

    let finalAdditional = [...additionalImages];
    if (imageLayoutType === 'split-1-2' || imageLayoutType === 'merge-2-1') {
      finalAdditional = [imageSlot2, ...additionalImages];
    }

    const origBefore = originalImageBefore;
    const origAfter = (imageLayoutType === 'single') ? '' : originalImageAfter;
    const origSlot2 = (imageLayoutType === 'split-1-2' || imageLayoutType === 'merge-2-1') ? originalImageSlot2 : '';

    const data = {
      title, category, mainPrompt, tags,
      imageBefore: finalBefore, imageAfter: finalAfter,
      originalImageBefore: origBefore, originalImageAfter: origAfter, originalImageSlot2: origSlot2,
      imageLayoutType, subSections, isPublic, promptOrigin,
      mediaType,
      additionalImages: finalAdditional,
      usageNotes: usageNotes.trim(),
    };

    setIsSaving(true);
    try {
      if (prompt) {
        await api.updatePrompt(prompt.id, data);
        addToast('Промпт успешно обновлен', 'success');
      } else {
        await api.createPrompt(data);
        addToast('Промпт успешно создан', 'success');
      }
      onSave();
    } catch (err: any) {
      console.error('Ошибка сохранения:', err);
      addToast(err.message || 'Не удалось сохранить промпт', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleRequestClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-zinc-900 flex items-center justify-between shrink-0">
          <h2 className="text-3xl font-black tracking-tighter">{prompt ? 'РЕДАКТИРОВАТЬ ПРОМПТ' : 'НОВЫЙ ПРОМПТ'}</h2>
          <button type="button" onClick={handleRequestClose} className="p-2 hover:bg-zinc-900 rounded-2xl text-zinc-500 cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Basic Info: title + category | tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Название</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Epic Cinematic Landscape..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-sky-400 transition-all font-bold text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400">Категория</label>
                  <button type="button" onClick={onAddCategory} className="text-[10px] font-bold text-sky-400 hover:text-sky-300 uppercase tracking-widest cursor-pointer">
                    + Создать новую
                  </button>
                </div>
                <div className="relative">
                  <select value={categories.length === 0 ? '' : category} onChange={(e) => setCategory(e.target.value)}
                    disabled={categories.length === 0}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:border-sky-400 transition-all font-bold appearance-none text-zinc-100 disabled:opacity-60 cursor-pointer">
                    {categories.length === 0
                      ? <option value="" style={optionSurface}>Загрузка категорий…</option>
                      : categories.map((c) => <option key={c.id} value={c.name} style={optionSurface}>{c.emoji} {c.name}</option>)
                    }
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" aria-hidden />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Теги (через пробел / Enter)</label>
              <div className="min-h-[116px] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-wrap gap-2 content-start">
                {tags.map(t => (
                  <span key={t} className="px-3 py-1.5 bg-sky-400/10 text-sky-400 border border-sky-400/20 text-xs font-bold rounded-full flex items-center gap-2">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-white cursor-pointer"><X size={12} /></button>
                  </span>
                ))}
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown} onBlur={commitTagsFromInput}
                  placeholder="Например: аниме фэнтези"
                  className="bg-transparent border-none focus:outline-none text-sm font-medium flex-1 min-w-[100px] text-white" />
              </div>
            </div>
          </div>

          {/* Image Layout Section */}
          <ImageSlotsSection
            imageLayoutType={imageLayoutType}
            setImageLayoutType={setImageLayoutType}
            renderSlot={renderSlot}
            renderLayoutPreview={renderLayoutPreview}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            cropperNode={
              <ImageCropper
                isOpen={cropperOpen}
                imageSrc={cropperSrc}
                aspectRatio={
                  cropTarget !== null
                    ? cropTarget.subIdx === null
                      ? getAspectForSlot(imageLayoutType, cropTarget.slotIdx)
                      : getAspectForSlot(
                          subSections[cropTarget.subIdx]?.imageLayoutType ||
                            (subSections[cropTarget.subIdx]?.imageBefore && subSections[cropTarget.subIdx]?.imageAfter ? 'slider' : 'single'),
                          cropTarget.slotIdx
                        )
                    : 1.6
                }
                onSave={handleCroppedSave}
                onCancel={() => { setCropperOpen(false); setCropTarget(null); }}
              />
            }
            additionalImages={additionalImages}
            setAdditionalImages={setAdditionalImages}
            extraImagesInputRef={extraImagesInputRef}
          />

          {/* Visibility toggle */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Публичный доступ</h3>
              <p className="text-xs text-zinc-500">Разрешить другим пользователям видеть и использовать этот промпт.</p>
            </div>
            <button type="button" onClick={() => setIsPublic(!isPublic)}
              className={`w-14 h-8 rounded-full transition-all relative cursor-pointer ${isPublic ? "bg-sky-400" : "bg-zinc-800"}`}>
              <motion.div animate={{ x: isPublic ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" />
            </button>
          </div>

          {/* Prompt Origin */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Происхождение промпта</h3>
              <p className="text-xs text-zinc-500">Укажите, ваш это авторский промпт или скопированный из внешнего источника.</p>
            </div>
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-start sm:self-center shrink-0">
              <button type="button" onClick={() => setPromptOrigin('own')}
                className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer", promptOrigin === 'own' ? "bg-sky-400 text-black font-bold" : "text-zinc-400 hover:text-zinc-200")}>
                Моя разработка
              </button>
              <button type="button" onClick={() => setPromptOrigin('web')}
                className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer", promptOrigin === 'web' ? "bg-sky-400 text-black font-bold" : "text-zinc-400 hover:text-zinc-200")}>
                Найдено в сети
              </button>
            </div>
          </div>

          {/* Media Type */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Тип медиа</h3>
              <p className="text-xs text-zinc-500">Для какого типа генерации предназначен этот промпт.</p>
            </div>
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-start sm:self-center shrink-0">
              {([
                { id: 'photo', label: '📷 Фото' },
                { id: 'video', label: '🎬 Видео' },
                { id: 'text', label: '📝 Текст' },
                { id: 'music', label: '🎵 Музыка' },
              ] as { id: MediaType; label: string }[]).map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setMediaType(id)}
                  className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer", mediaType === id ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-zinc-200")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">Основной Промпт</label>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{mainPrompt.length} символов</span>
            </div>
            <textarea required value={mainPrompt} onChange={(e) => setMainPrompt(e.target.value)}
              placeholder="Введите тело промпта здесь..."
              className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-3xl py-6 px-8 focus:outline-none focus:border-sky-400 transition-all font-mono text-sm leading-relaxed resize-none text-white" />
          </div>

          {/* Usage Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Комментарии к промпту</label>
            <p className="text-xs text-zinc-600">Как пользоваться шаблоном, особенности генерации.</p>
            <textarea value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)}
              placeholder="Например: используйте Midjourney v6 с параметром --stylize 250…"
              className="w-full min-h-[100px] bg-zinc-900 border border-zinc-800 rounded-3xl py-4 px-6 focus:outline-none focus:border-sky-400 transition-all text-sm leading-relaxed resize-y text-white" />
          </div>

          {/* Sub-sections */}
          <SubSectionsEditor
            subSections={subSections}
            addSubSection={addSubSection}
            removeSubSection={removeSubSection}
            updateSubSection={updateSubSection}
            renderLayoutPreview={renderLayoutPreview}
          />
        </form>

        <div className="p-8 border-t border-zinc-900 bg-zinc-950 shrink-0 flex items-center justify-end gap-4">
          <button type="button" onClick={handleRequestClose} className="px-8 py-4 text-zinc-500 font-bold hover:text-white transition-all cursor-pointer">Отмена</button>
          <button onClick={handleSubmit} disabled={isSaving}
            className="px-10 py-4 bg-sky-400 text-black font-bold rounded-2xl transition-all shadow-xl shadow-sky-400/20 disabled:opacity-50 cursor-pointer">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirmClose}
        title="Несохраненные изменения"
        message="Вы внесли изменения в промпт. Вы уверены, что хотите закрыть форму? Все несохраненные изменения будут потеряны."
        confirmText="Закрыть"
        cancelText="Остаться"
        variant="warning"
        onConfirm={onClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
