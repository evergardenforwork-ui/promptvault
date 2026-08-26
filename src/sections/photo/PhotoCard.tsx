import React from 'react';
import { motion } from 'motion/react';
import { Star, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Prompt } from '../../types';
import { cn } from '../../utils/cn';

interface PhotoCardProps {
  prompt: Prompt;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onView: () => void;
  onToggleFavorite: () => void;
  effectiveUser: any | null;
  onPickTag?: (tag: string) => void;
}

export default function PhotoCard({
  prompt,
  viewMode,
  searchQuery,
  onView,
  onToggleFavorite,
  effectiveUser,
  onPickTag
}: PhotoCardProps) {
  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={i} className="bg-sky-500/30 text-sky-400 rounded px-0.5">{part}</span> 
        : part
    );
  };

  const matchType = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    if (prompt.title.toLowerCase().includes(q)) return { label: 'Название', color: 'bg-yellow-500/20 text-yellow-500' };
    if (prompt.tags?.some((t) => t.toLowerCase().includes(q))) return { label: 'Хештег', color: 'bg-blue-500/20 text-blue-500' };
    if (prompt.subSections?.some((s) => s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q)))
      return { label: 'Под-раздел', color: 'bg-purple-500/20 text-purple-500' };
    if (prompt.mainPrompt.toLowerCase().includes(q)) return { label: 'Текст промпта', color: 'bg-green-500/20 text-green-500' };
    if (prompt.category.toLowerCase().includes(q)) return { label: 'Категория', color: 'bg-orange-500/20 text-orange-500' };
    return null;
  };

  const match = matchType();

  const titleBlock = (
    <div className="flex items-start justify-between gap-2">
      <h3
        className={cn(
          'font-bold truncate group-hover:text-sky-400 transition-colors duration-200',
          viewMode === 'grid' ? 'text-xl sm:text-2xl leading-tight' : 'text-lg'
        )}
      >
        {highlightMatch(prompt.title)}
      </h3>
      {match && (
        <span className={cn('shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', match.color)}>
          {match.label}
        </span>
      )}
    </div>
  );

  const tagsBlock = (
    <div className="flex flex-wrap gap-1.5">
      {prompt.tags?.slice(0, 6).map((tag, i) => (
        <span
          key={i}
          onClick={(e) => {
            if (onPickTag) {
              e.stopPropagation();
              onPickTag(tag);
            }
          }}
          className={cn(
            "px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-full border border-zinc-200 dark:border-zinc-700/50 transition-colors",
            onPickTag && "hover:bg-sky-400 hover:text-black hover:border-sky-400 cursor-pointer"
          )}
        >
          #{highlightMatch(tag)}
        </span>
      ))}
      {(prompt.tags?.length || 0) > 6 && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold">+{prompt.tags.length - 6}</span>
      )}
    </div>
  );

  const subChips =
    (prompt.subSections?.length || 0) > 0 ? (
      <div className="flex flex-wrap gap-1">
        {prompt.subSections.map((s, i) => (
          <span key={i} className="px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 text-[9px] font-medium rounded">
            + {highlightMatch(s.title)}
          </span>
        ))}
      </div>
    ) : null;

  const metaBlock = (
    <div className="space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
          {prompt.authorName?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <div className="text-[9px] text-zinc-600 dark:text-zinc-400 font-bold truncate">{prompt.authorName || 'Unknown'}</div>
          {prompt.authorEmail && (
            <div className="text-[8px] text-zinc-400 dark:text-zinc-600 truncate" title={prompt.authorEmail}>
              {prompt.authorEmail}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest">
        <span>
          {prompt.createdAt
            ? new Date(prompt.createdAt).toLocaleDateString()
            : '—'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" title={`Тип: ${prompt.mediaType || 'photo'}`}>
            {(prompt.mediaType || 'photo') === 'photo' ? '📷' :
             (prompt.mediaType) === 'video' ? '🎬' :
             (prompt.mediaType) === 'text' ? '📝' : '🎵'}
          </span>
          <div className="flex items-center gap-1">
            <Sparkles size={10} />
            <span>{prompt.usageCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const layout = prompt.imageLayoutType || (prompt.imageBefore && prompt.imageAfter ? 'slider' : 'single');

  const renderLayoutContent = () => {
    switch (layout) {
      case 'single':
        return (
          prompt.imageBefore || prompt.imageAfter ? (
            <img
              src={prompt.imageBefore || prompt.imageAfter}
              alt={prompt.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
              <ImageIcon size={40} />
            </div>
          )
        );
      case 'slider':
        return (
          prompt.imageBefore && prompt.imageAfter ? (
            <div className="flex w-full h-full">
              <div className="w-1/2 h-full border-r border-zinc-900/50">
                <img
                  src={prompt.imageBefore}
                  alt="Before"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-1/2 h-full">
                <img
                  src={prompt.imageAfter}
                  alt="After"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <img
              src={prompt.imageBefore || prompt.imageAfter}
              alt={prompt.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
          )
        );
      case 'split-vertical':
        return (
          <div className="flex flex-col gap-0.5 w-full h-full">
            <div className="flex-1 overflow-hidden bg-zinc-900">
              {prompt.imageBefore && (
                <img src={prompt.imageBefore} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="flex-1 overflow-hidden bg-zinc-900">
              {prompt.imageAfter && (
                <img src={prompt.imageAfter} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        );
      case 'split-horizontal':
        return (
          <div className="flex gap-0.5 w-full h-full">
            <div className="flex-1 overflow-hidden bg-zinc-900">
              {prompt.imageBefore && (
                <img src={prompt.imageBefore} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="flex-1 overflow-hidden bg-zinc-900">
              {prompt.imageAfter && (
                <img src={prompt.imageAfter} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        );
      case 'split-1-2':
        return (
          <div className="flex gap-0.5 w-full h-full">
            <div className="w-1/2 overflow-hidden bg-zinc-900">
              {prompt.imageBefore && (
                <img src={prompt.imageBefore} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="w-1/2 flex flex-col gap-0.5">
              <div className="flex-1 overflow-hidden bg-zinc-900">
                {prompt.imageAfter && (
                  <img src={prompt.imageAfter} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 overflow-hidden bg-zinc-900">
                {prompt.additionalImages?.[0] && (
                  <img src={prompt.additionalImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
          </div>
        );
      case 'merge-2-1':
        return (
          <div className="flex flex-col gap-0.5 w-full h-full">
            <div className="flex-1 flex gap-0.5">
              <div className="flex-1 overflow-hidden bg-zinc-900">
                {prompt.imageBefore && (
                  <img src={prompt.imageBefore} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 overflow-hidden bg-zinc-900">
                {prompt.imageAfter && (
                  <img src={prompt.imageAfter} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-zinc-900">
              {prompt.additionalImages?.[0] && (
                <img src={prompt.additionalImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getLayoutLabel = () => {
    if (layout === 'slider') return 'Слайдер';
    if (layout === 'split-vertical') return 'Сплит (В)';
    if (layout === 'split-horizontal') return 'Сплит (Г)';
    if (layout === 'split-1-2') return 'Сплит 1-2';
    if (layout === 'merge-2-1') return 'Сплит 2-1';
    return null;
  };
  const layoutLabel = getLayoutLabel();

  const imageArea = (
    <div
      className={cn(
        'relative bg-zinc-800 overflow-hidden shrink-0 transition-shadow duration-200',
        viewMode === 'list' ? 'w-48 h-full rounded-2xl' : 'aspect-[16/10] w-full'
      )}
    >
      {renderLayoutContent()}

      <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5 items-start">
        {prompt.isPublic && (
          <span className="px-2 py-0.5 bg-blue-600/90 backdrop-blur-md text-[9px] font-black uppercase tracking-wider rounded-md text-white shadow-sm">
            Общий
          </span>
        )}
        {effectiveUser && prompt.userId === effectiveUser.uid && (
          <span className={cn(
            "px-2 py-0.5 backdrop-blur-md text-[9px] font-black uppercase tracking-wider rounded-md text-white shadow-sm",
            prompt.promptOrigin === 'web' ? "bg-amber-600/95" : "bg-emerald-600/95"
          )}>
            {prompt.promptOrigin === 'web' ? "Из сети" : "Мой"}
          </span>
        )}
      </div>

      {layoutLabel && (
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-[10px] font-bold rounded-full text-white uppercase tracking-wider">
            {layoutLabel}
          </span>
        </div>
      )}

      {effectiveUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            'absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 cursor-pointer',
            prompt.isFavorite ? 'bg-sky-400 text-black font-bold' : 'bg-black/50 text-white/70 hover:text-white'
          )}
        >
          <Star size={16} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -4 }}
      onClick={onView}
      className={cn(
        'group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-sky-400/50 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)]',
        viewMode === 'list' ? 'flex gap-6 p-4 min-h-[10rem]' : 'flex flex-col'
      )}
    >
      {viewMode === 'grid' ? (
        <>
          <div className="p-5 pb-3 space-y-3 order-1">
            {titleBlock}
            {tagsBlock}
          </div>
          <div className="order-2">{imageArea}</div>
          <div className="p-5 pt-4 flex flex-col gap-3 flex-1 order-3">
            {subChips}
            <div className="mt-auto">{metaBlock}</div>
          </div>
        </>
      ) : (
        <>
          {imageArea}
          <div className="p-5 flex flex-col flex-1 min-w-0 gap-3">
            {titleBlock}
            {tagsBlock}
            {subChips}
            <div className="mt-auto">{metaBlock}</div>
          </div>
        </>
      )}
    </motion.div>
  );
}
