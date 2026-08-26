import React, { useState } from 'react';
import { 
  Copy, Check, Star, Edit3, Trash2, ExternalLink, 
  Sparkles, Terminal, ChevronDown, ChevronUp, Layers 
} from 'lucide-react';
import { CommandItem, COMMAND_CATEGORY_OPTIONS, COMMAND_AI_OPTIONS, User } from '../../types';
import { cn } from '../../utils/cn';

interface CommandCardProps {
  command: CommandItem;
  user: User;
  viewMode: 'grid' | 'list';
  onEdit: (cmd: CommandItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (cmd: CommandItem) => void;
  onFillVariables: (cmd: CommandItem) => void;
  onOpenSkill?: (skillId: string) => void;
}

export default function CommandCard({
  command,
  user,
  viewMode,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  onFillVariables,
  onOpenSkill,
}: CommandCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwnerOrAdmin = user.uid === command.userId || user.role === 'admin';
  const categoryInfo = COMMAND_CATEGORY_OPTIONS.find(c => c.value === command.category) || {
    label: command.category,
    emoji: '⚡',
  };
  const aiInfo = COMMAND_AI_OPTIONS.find(a => a.value === command.targetAi) || {
    label: 'Универсальная',
    emoji: '🌐',
  };

  const hasVariables = (command.variables && command.variables.length > 0) ||
    /\{\{([^}]+)\}\}/.test(command.commandText);

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="group flex items-center justify-between gap-4 p-3.5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/70 hover:border-amber-500/40 rounded-xl transition-all">
        {/* Left: Icon & Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <span className="text-base leading-none">{categoryInfo.emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                {command.title}
              </h4>

              {command.skillTitle && (
                <button
                  onClick={() => command.skillId && onOpenSkill?.(command.skillId)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Перейти к скиллу"
                >
                  <Layers size={11} />
                  <span className="truncate max-w-[130px]">{command.skillTitle}</span>
                </button>
              )}

              {hasVariables && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                  {'{{...}}'}
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-zinc-400 truncate mt-0.5">
              {command.commandText}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(command.id)}
            className={cn(
              "p-2 rounded-lg transition-colors cursor-pointer",
              command.isFavorite
                ? "text-amber-400 bg-amber-500/10"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
            title={command.isFavorite ? "В избранном" : "Добавить в избранное"}
          >
            <Star size={15} fill={command.isFavorite ? "currentColor" : "none"} />
          </button>

          {/* Fill Modal button (if has vars) */}
          {hasVariables && (
            <button
              onClick={() => onFillVariables(command)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              title="Заполнить переменные"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Заполнить</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopyClick}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm",
              copied
                ? "bg-emerald-500 text-black shadow-emerald-500/20"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Скопировано" : "Копировать"}</span>
          </button>

          {/* Edit & Delete for owner */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
              <button
                onClick={() => onEdit(command)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Редактировать"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(command.id)}
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Удалить"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── GRID VIEW ─────────────────────────────────────────────────────────────
  const isLongText = command.commandText.length > 180 || command.commandText.includes('\n');

  return (
    <div className="group flex flex-col justify-between bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-5 transition-all shadow-lg hover:shadow-amber-500/5 relative overflow-hidden">
      {/* Top Badges & Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700/50 text-xs font-semibold text-zinc-300">
              <span>{categoryInfo.emoji}</span>
              <span>{categoryInfo.label}</span>
            </span>

            {/* Target AI */}
            {command.targetAi && command.targetAi !== 'universal' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium">
                <span>{aiInfo.emoji}</span>
                <span>{aiInfo.label}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite */}
            <button
              onClick={() => onToggleFavorite(command.id)}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                command.isFavorite
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
              title={command.isFavorite ? "В избранном" : "Добавить в избранное"}
            >
              <Star size={15} fill={command.isFavorite ? "currentColor" : "none"} />
            </button>

            {/* Owner Actions */}
            {isOwnerOrAdmin && (
              <>
                <button
                  onClick={() => onEdit(command)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Редактировать"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDelete(command.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5">
          {command.title}
        </h3>

        {/* Optional Description */}
        {command.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {command.description}
          </p>
        )}

        {/* Linked Skill Badge */}
        {command.skillTitle && (
          <div className="mb-3">
            <button
              onClick={() => command.skillId && onOpenSkill?.(command.skillId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer group/skill"
            >
              <Layers size={13} className="text-indigo-400 group-hover/skill:rotate-12 transition-transform" />
              <span>Скилл: <strong className="font-semibold text-white">{command.skillTitle}</strong></span>
              <ExternalLink size={11} className="opacity-70" />
            </button>
          </div>
        )}

        {/* Command Code Snippet Box */}
        <div className="relative mb-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 group/code">
          <div
            className={cn(
              "font-mono text-xs text-zinc-200 whitespace-pre-wrap break-all transition-all select-all",
              !isExpanded && isLongText && "max-h-24 overflow-hidden mask-fade-bottom"
            )}
          >
            {command.commandText}
          </div>

          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 mt-2 cursor-pointer transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={13} />
                  <span>Свернуть</span>
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  <span>Развернуть весь текст</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Variables or Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {command.variables && command.variables.map((v) => (
            <span
              key={v}
              className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono"
            >
              {`{{${v}}}`}
            </span>
          ))}
          {command.tags && command.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-zinc-500 hover:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span title="Количество использований">
            🔥 {command.usageCount || 0}
          </span>
          {command.authorName && (
            <>
              <span>•</span>
              <span className="truncate max-w-[100px]">{command.authorName}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasVariables && (
            <button
              onClick={() => onFillVariables(command)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Заполнить</span>
            </button>
          )}

          <button
            onClick={handleCopyClick}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md",
              copied
                ? "bg-emerald-500 text-black shadow-emerald-500/20"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-95"
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Скопировано!" : "Копировать"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
