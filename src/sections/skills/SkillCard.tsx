import React from 'react';
import { motion } from 'motion/react';
import { Package, Star, Calendar, User as UserIcon } from 'lucide-react';
import { SkillPackage } from '../../types';
import { cn } from '../../utils/cn';

interface SkillCardProps {
  skill: SkillPackage;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onView: () => void;
  onToggleFavorite: () => void;
  effectiveUser: any | null;
}

export default function SkillCard({
  skill,
  viewMode,
  searchQuery,
  onView,
  onToggleFavorite,
  effectiveUser,
}: SkillCardProps) {
  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={i} className="bg-purple-500/30 text-purple-300 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const fileCount = skill.fileStructure?.length || 0;

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
        'group relative bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_20px_50px_-12px_rgba(147,51,234,0.15)] flex flex-col justify-between gap-4',
        viewMode === 'list' ? 'flex-row items-center' : 'min-h-[220px]'
      )}
    >
      <div className="space-y-3 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shrink-0">
            <Package className="w-3.5 h-3.5" />
            <span>{skill.category}</span>
          </span>
          {effectiveUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                'p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 cursor-pointer',
                skill.isFavorite ? 'bg-purple-500 text-white font-bold' : 'bg-zinc-800 text-zinc-500 hover:text-white'
              )}
            >
              <Star size={14} fill={skill.isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors truncate">
          {highlightMatch(skill.title)}
        </h3>

        {skill.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {highlightMatch(skill.description)}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {skill.tags?.slice(0, 5).map((t, i) => (
            <span key={i} className="px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[10px] font-semibold rounded-full border border-zinc-700/40">
              #{highlightMatch(t)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          <span className="font-mono text-purple-300 font-bold">{fileCount} файлов</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
          <Calendar className="w-3 h-3" />
          <span>{skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : '—'}</span>
        </div>
      </div>
    </motion.div>
  );
}
