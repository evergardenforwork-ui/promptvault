import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X, Edit2, Trash2, Github, Globe, ExternalLink,
  ChevronDown, ChevronUp, Copy, Check, Calendar, User as UserIcon,
} from 'lucide-react';
import { GitProject, GIT_CATEGORY_OPTIONS, GIT_PRICING_OPTIONS, User } from '../../types';
import { cn } from '../../utils/cn';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface GitProjectViewProps {
  project: GitProject;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  effectiveUser: User | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Скопировать"
      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

interface AccordionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Accordion({ label, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-800/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
      >
        <span className="text-sm font-bold text-zinc-200">{label}</span>
        {open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export default function GitProjectView({
  project,
  onClose,
  onEdit,
  onDelete,
  effectiveUser,
}: GitProjectViewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const categoryOpt = GIT_CATEGORY_OPTIONS.find(o => o.value === project.category);
  const pricingOpt = GIT_PRICING_OPTIONS.find(o => o.value === project.pricing);

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '-';

  const canEdit =
    effectiveUser &&
    (effectiveUser.role === 'admin' || effectiveUser.uid === project.userId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center p-4 pt-12 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden mb-10"
        >
          {/* Hero Image */}
          {project.image ? (
            <div className="relative w-full aspect-video overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              {pricingOpt && (
                <div className="absolute top-4 left-4">
                  <span className={cn('px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-xl border backdrop-blur-sm', pricingOpt.color)}>
                    {pricingOpt.label}
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {canEdit && (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-2 rounded-xl bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
                      title="Редактировать"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="p-2 rounded-xl bg-black/50 hover:bg-rose-900/80 text-zinc-300 hover:text-rose-300 transition-all backdrop-blur-sm cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* No image — compact header */
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 flex items-center justify-center text-2xl border border-emerald-800/30">
                  {categoryOpt?.emoji}
                </div>
                {pricingOpt && (
                  <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl border', pricingOpt.color)}>
                    {pricingOpt.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <button onClick={onEdit} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer" title="Редактировать">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmOpen(true)} className="p-2 hover:bg-rose-900/40 rounded-xl text-zinc-400 hover:text-rose-400 transition-all cursor-pointer" title="Удалить">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-8 pt-4 space-y-6">
            {/* Title + Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5">
                  <span>{categoryOpt?.emoji}</span>
                  <span>{categoryOpt?.label ?? project.category}</span>
                </span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight">{project.title}</h1>
              {project.summary && (
                <p className="text-zinc-400 text-base leading-relaxed">{project.summary}</p>
              )}
            </div>

            {/* Links */}
            {(project.githubUrl || project.demoUrl) && (
              <div className="flex flex-wrap gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-sm font-semibold border border-zinc-700/50 transition-all"
                  >
                    <Github size={15} />
                    GitHub Репозиторий
                    <ExternalLink size={12} className="text-zinc-500" />
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-200 text-sm font-semibold border border-emerald-800/40 transition-all"
                  >
                    <Globe size={15} />
                    Demo / Сайт
                    <ExternalLink size={12} className="text-emerald-500" />
                  </a>
                )}
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-zinc-800/80 text-zinc-400 text-xs font-semibold rounded-full border border-zinc-700/40">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Accordions */}
            <div className="space-y-3">
              {/* Features */}
              {project.features && (
                <Accordion label="⚡ Ключевые фичи" defaultOpen={true}>
                  <div className="px-5 py-4">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {project.features}
                    </pre>
                  </div>
                </Accordion>
              )}

              {/* Install Command */}
              {project.installCommand && (
                <Accordion label="🚀 Установка и запуск" defaultOpen={false}>
                  <div className="px-5 py-4">
                    <div className="relative">
                      <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-emerald-300 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                        {project.installCommand}
                      </pre>
                      <div className="absolute top-3 right-3">
                        <CopyButton text={project.installCommand} />
                      </div>
                    </div>
                  </div>
                </Accordion>
              )}

              {/* Detailed Description */}
              {project.detailedDescription && (
                <Accordion label="📖 Детальное описание" defaultOpen={false}>
                  <div className="px-5 py-4">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {project.detailedDescription}
                    </p>
                  </div>
                </Accordion>
              )}

              {/* Author Notes */}
              {project.authorNotes && (
                <Accordion label="💬 Личные заметки" defaultOpen={false}>
                  <div className="px-5 py-4">
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap italic">
                      {project.authorNotes}
                    </p>
                  </div>
                </Accordion>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-5 pt-2 border-t border-zinc-800/60 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <UserIcon size={12} />
                {project.authorName || '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formattedDate}
              </span>
              {project.isPublic && (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <Globe size={12} />
                  Публичный
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Удалить проект?"
        message={`Проект «${project.title}» будет удалён навсегда. Это действие необратимо.`}
        confirmText="Удалить"
        variant="danger"
        onConfirm={() => { setConfirmOpen(false); onDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
