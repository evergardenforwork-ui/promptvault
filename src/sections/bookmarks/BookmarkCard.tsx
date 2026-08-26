import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  Edit3, 
  Trash2, 
  Globe, 
  Eye, 
  Flame, 
  Lock,
  Tag as TagIcon
} from 'lucide-react';
import { BookmarkItem, User } from '../../types';
import { cn } from '../../utils/cn';

interface BookmarkCardProps {
  bookmark: BookmarkItem;
  user: User;
  viewMode?: 'grid' | 'list';
  onOpenWebsite: (bookmark: BookmarkItem) => void;
  onCopyUrl: (bookmark: BookmarkItem) => void;
  onEdit: (bookmark: BookmarkItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onPickFolder?: (folder: string) => void;
  onPickCategory?: (category: string) => void;
  onPickTag?: (tag: string) => void;
}

export default function BookmarkCard({
  bookmark,
  user,
  viewMode = 'grid',
  onOpenWebsite,
  onCopyUrl,
  onEdit,
  onDelete,
  onToggleFavorite,
  onPickFolder,
  onPickCategory,
  onPickTag,
}: BookmarkCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const isOwner = bookmark.userId === user.uid || user.role === 'admin';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyUrl(bookmark);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Извлечение красивого домена для превью
  const getDomain = (urlStr: string) => {
    try {
      const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return urlStr;
    }
  };

  const domain = getDomain(bookmark.url);

  // Favicon fallback
  const faviconUrl = bookmark.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="group relative bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 shadow-lg hover:shadow-cyan-500/5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Favicon / Icon */}
          <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex-shrink-0 flex items-center justify-center p-2 overflow-hidden group-hover:border-cyan-500/30 transition-all">
            <img 
              src={faviconUrl} 
              alt={bookmark.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                onClick={() => onOpenWebsite(bookmark)}
                className="text-sm font-bold text-white hover:text-cyan-400 cursor-pointer truncate transition-colors flex items-center gap-1.5"
              >
                <span>{bookmark.title}</span>
                <ExternalLink size={13} className="text-zinc-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>

              {!bookmark.isPublic && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 flex items-center gap-1">
                  <Lock size={10} /> Приватная
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
              <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[180px]">{domain}</span>

              {bookmark.folder && (
                <button
                  type="button"
                  onClick={() => onPickFolder?.(bookmark.folder)}
                  className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  📁 {bookmark.folder}
                </button>
              )}

              {bookmark.category && bookmark.category !== 'default' && (
                <button
                  type="button"
                  onClick={() => onPickCategory?.(bookmark.category)}
                  className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  🏷️ {bookmark.category}
                </button>
              )}

              {bookmark.clickCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Flame size={12} /> {bookmark.clickCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onOpenWebsite(bookmark)}
            title="Открыть сайт"
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Открыть</span>
            <ExternalLink size={13} />
          </button>

          <button
            onClick={handleCopy}
            title="Скопировать ссылку"
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <button
            onClick={() => onToggleFavorite(bookmark.id)}
            title="В избранное"
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              bookmark.isFavorite
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400'
            }`}
          >
            <Star size={14} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => onEdit(bookmark)}
                title="Редактировать"
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(bookmark.id)}
                title="Удалить"
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── GRID VIEW ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/40 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
    >
      <div>
        {/* Hero Preview Image / Header Banner */}
        <div 
          onClick={() => onOpenWebsite(bookmark)}
          className="relative h-44 w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 overflow-hidden cursor-pointer group/img"
        >
          {bookmark.image ? (
            <img 
              src={bookmark.image} 
              alt={bookmark.title}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-cyan-950/20 via-zinc-900 to-purple-950/20">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center p-3 mb-2 shadow-xl group-hover/img:scale-110 group-hover/img:border-cyan-400 transition-all">
                <img 
                  src={faviconUrl} 
                  alt={bookmark.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs font-mono text-cyan-400/80 font-bold">{domain}</span>
            </div>
          )}

          {/* Badges Over Image */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            {bookmark.folder && (
              <span 
                onClick={(e) => { e.stopPropagation(); onPickFolder?.(bookmark.folder); }}
                className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-cyan-300 shadow-md hover:bg-black/90 transition-all cursor-pointer"
              >
                📁 {bookmark.folder}
              </span>
            )}
            {bookmark.category && bookmark.category !== 'default' && (
              <span 
                onClick={(e) => { e.stopPropagation(); onPickCategory?.(bookmark.category); }}
                className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-purple-300 shadow-md hover:bg-black/90 transition-all cursor-pointer"
              >
                🏷️ {bookmark.category}
              </span>
            )}
          </div>

          {/* Favorite Button on Image */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(bookmark.id); }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md cursor-pointer ${
              bookmark.isFavorite
                ? 'bg-amber-500/90 text-black shadow-amber-500/30'
                : 'bg-black/60 text-white/80 hover:text-amber-400 hover:bg-black/80'
            }`}
            title="В избранное"
          >
            <Star size={15} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          {/* Title & Favicon */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-zinc-950 border border-zinc-800 flex-shrink-0 flex items-center justify-center p-1 mt-0.5">
              <img 
                src={faviconUrl} 
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 
                onClick={() => onOpenWebsite(bookmark)}
                className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors cursor-pointer leading-snug line-clamp-1"
                title={bookmark.title}
              >
                {bookmark.title}
              </h3>
              <p className="text-xs font-mono text-zinc-500 truncate mt-0.5">{domain}</p>
            </div>
          </div>

          {/* Description */}
          {bookmark.description && (
            <div>
              <p 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className={`text-xs text-zinc-400 leading-relaxed cursor-pointer ${
                  isDescExpanded ? '' : 'line-clamp-2'
                }`}
                title="Нажмите чтобы развернуть"
              >
                {bookmark.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {bookmark.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onPickTag?.(tag)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {bookmark.clickCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
              <Flame size={13} /> {bookmark.clickCount}
            </span>
          )}
          {!bookmark.isPublic && (
            <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
              <Lock size={11} /> Приватный
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Скопировать ссылку"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => onEdit(bookmark)}
                title="Редактировать"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(bookmark.id)}
                title="Удалить"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button
            onClick={() => onOpenWebsite(bookmark)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <span>Открыть</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
