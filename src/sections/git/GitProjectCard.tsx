import React from 'react';
import { motion } from 'motion/react';
import {
  Github,
  ExternalLink,
  Star,
  Calendar,
  User as UserIcon,
  Globe,
} from 'lucide-react';
import { GitProject, GIT_CATEGORY_OPTIONS, GIT_PRICING_OPTIONS } from '../../types';
import { cn } from '../../utils/cn';

interface GitProjectCardProps {
  project: GitProject;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onView: () => void;
  onToggleFavorite: () => void;
  effectiveUser: any | null;
}

export default function GitProjectCard({
  project,
  viewMode,
  searchQuery,
  onView,
  onToggleFavorite,
  effectiveUser,
}: GitProjectCardProps) {
  const highlight = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="bg-emerald-500/30 text-emerald-300 rounded px-0.5">{part}</span>
          ) : (part)
        )}
      </>
    );
  };

  const categoryOpt = GIT_CATEGORY_OPTIONS.find((o) => o.value === project.category);
  const pricingOpt = GIT_PRICING_OPTIONS.find((o) => o.value === project.pricing);

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -2 }}
        onClick={onView}
        className="group relative bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_12px_40px_-12px_rgba(52,211,153,0.12)] flex items-center gap-4 text-zinc-900 dark:text-zinc-100"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800">
          {project.image ? (
            <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-2xl">
              {categoryOpt?.emoji ?? ''}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 shrink-0">
              <span>{categoryOpt?.emoji}</span>
              <span>{categoryOpt?.label ?? project.category}</span>
            </span>
            {pricingOpt && (
              <span className={cn('px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg border shrink-0', pricingOpt.color)}>
                {pricingOpt.label}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors truncate">
            {highlight(project.title)}
          </h3>
          {project.summary && <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{highlight(project.summary)}</p>}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {project.tags?.slice(0, 5).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold rounded-full border border-zinc-200 dark:border-zinc-700/40">
                #{highlight(tag)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={stopProp}>
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 transition-colors" title="GitHub">
              <Github size={15} />
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 transition-colors" title="Demo">
              <ExternalLink size={15} />
            </a>
          )}
          {effectiveUser && (
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className={cn('p-2 rounded-xl transition-colors cursor-pointer',
                project.isFavorite ? 'bg-emerald-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-emerald-500 dark:hover:text-white')}>
              <Star size={15} fill={project.isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
          <span className="flex items-center gap-1.5"><UserIcon size={11} />{project.authorName || '-'}</span>
          <span className="flex items-center gap-1.5"><Calendar size={11} />{formattedDate}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -4 }}
      onClick={onView}
      className="group relative bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 rounded-3xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_20px_50px_-12px_rgba(52,211,153,0.15)] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
    >
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {project.image ? (
          <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-zinc-100 dark:from-emerald-950/60 dark:to-zinc-900 flex items-center justify-center">
            <span className="text-5xl opacity-60">{categoryOpt?.emoji ?? ''}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-zinc-900/80 via-transparent to-transparent pointer-events-none" />
        {pricingOpt && (
          <div className="absolute top-3 left-3">
            <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-sm', pricingOpt.color)}>
              {pricingOpt.label}
            </span>
          </div>
        )}
        {effectiveUser && (
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={cn('absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 cursor-pointer',
              project.isFavorite ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-black/40 text-white hover:bg-black/60')}>
            <Star size={14} fill={project.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 w-fit">
          <span>{categoryOpt?.emoji}</span>
          <span>{categoryOpt?.label ?? project.category}</span>
        </span>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
          {highlight(project.title)}
        </h3>
        {project.summary && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{highlight(project.summary)}</p>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 5).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold rounded-full border border-zinc-200 dark:border-zinc-700/40">
                #{highlight(tag)}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        {(project.githubUrl || project.demoUrl) && (
          <div className="flex gap-2" onClick={stopProp}>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-all">
                <Github size={13} />GitHub
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40 transition-all">
                <ExternalLink size={13} />Demo
              </a>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1.5"><UserIcon size={11} /><span className="truncate max-w-[110px]">{project.authorName || '-'}</span></span>
          <span className="flex items-center gap-1.5"><Calendar size={11} />{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}