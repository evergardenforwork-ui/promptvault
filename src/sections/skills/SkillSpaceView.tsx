import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Package, Edit, Trash2, Download, CheckSquare, X,
  Calendar, Tag, Globe, Lock, Lightbulb
} from 'lucide-react';
import { SkillPackage, FileNode, User } from '../../types';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';
import SpaceFileTree from './space/SpaceFileTree';
import SpaceFilePreview from './space/SpaceFilePreview';
import SpaceContextMenu, { ContextMenuTarget } from './space/SpaceContextMenu';
import SpaceSelectionBar from './space/SpaceSelectionBar';
import SkillHintsPanel from './space/SkillHintsPanel';
import {
  buildSelectionZip,
  downloadFolderAsZip,
  downloadSingleFile,
} from '../../utils/buildSelectionZip';

interface SkillSpaceViewProps {
  skill: SkillPackage;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSkillUpdated: (updated: SkillPackage) => void;
  effectiveUser: User | null;
  addToast: (message: React.ReactNode, type?: 'success' | 'error') => void;
}

/** Возвращает все пути файлов внутри папки (рекурсивно) */
function getAllPathsInFolder(node: FileNode): string[] {
  if (node.type === 'file') return [node.path];
  return (node.children || []).flatMap(getAllPathsInFolder);
}

/** Считает суммарное кол-во файлов в дереве */
function countAllFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.type === 'file') count++;
    else if (n.children) count += countAllFiles(n.children);
  }
  return count;
}

/** Обновляет содержимое файла по пути в дереве (иммутабельно) */
function updateFileContent(nodes: FileNode[], path: string, content: string): FileNode[] {
  return nodes.map(node => {
    if (node.type === 'file' && node.path === path) {
      return { ...node, content };
    }
    if (node.type === 'directory' && node.children) {
      return { ...node, children: updateFileContent(node.children, path, content) };
    }
    return node;
  });
}

export default function SkillSpaceView({
  skill,
  onBack,
  onEdit,
  onDelete,
  onSkillUpdated,
  effectiveUser,
  addToast,
}: SkillSpaceViewProps) {
  const [activeFile, setActiveFile] = useState<FileNode | null>(() => {
    const findFirst = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) {
        if (n.type === 'file') return n;
        if (n.children) {
          const sub = findFirst(n.children);
          if (sub) return sub;
        }
      }
      return null;
    };
    return findFirst(skill.fileStructure || []);
  });

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintsCount, setHintsCount] = useState(0);

  const canEdit = effectiveUser &&
    (effectiveUser.uid === skill.userId || effectiveUser.role === 'admin');

  const totalFiles = countAllFiles(skill.fileStructure || []);

  // Сбрасываем выделение при смене режима
  useEffect(() => {
    if (!selectionMode) setSelectedPaths(new Set());
  }, [selectionMode]);

  // Сброс при смене пакета
  useEffect(() => {
    setSelectionMode(false);
    setSelectedPaths(new Set());
    setContextMenu(null);
    setShowHints(false);
    const findFirst = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) {
        if (n.type === 'file') return n;
        if (n.children) {
          const sub = findFirst(n.children);
          if (sub) return sub;
        }
      }
      return null;
    };
    setActiveFile(findFirst(skill.fileStructure || []));
  }, [skill.id]);

  const handleFileClick = useCallback((node: FileNode) => {
    setActiveFile(node);
  }, []);

  const handleSelect = useCallback((path: string, node: FileNode) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (node.type === 'directory') {
        const paths = getAllPathsInFolder(node);
        const allSelected = paths.every(p => next.has(p));
        if (allSelected) {
          paths.forEach(p => next.delete(p));
          next.delete(path);
        } else {
          paths.forEach(p => next.add(p));
          next.add(path);
        }
      } else {
        if (next.has(path)) next.delete(path);
        else next.add(path);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((target: ContextMenuTarget) => {
    setContextMenu(target);
  }, []);

  const handleDownloadSelection = async () => {
    if (selectedPaths.size === 0) return;
    try {
      const blob = await buildSelectionZip(skill.fileStructure || [], selectedPaths);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${skill.title}_selection.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Скачано ${selectedPaths.size} файлов`);
    } catch {
      addToast('Ошибка создания ZIP', 'error');
    }
  };

  const handleDownloadAll = async () => {
    if (!skill.filePackageUrl) {
      try {
        const blob = await buildSelectionZip(
          skill.fileStructure || [],
          new Set(getAllAllPaths(skill.fileStructure || []))
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skill.title}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Архив скачан');
      } catch {
        addToast('Ошибка создания ZIP', 'error');
      }
    } else {
      window.open(skill.filePackageUrl, '_blank');
    }
  };

  function getAllAllPaths(nodes: FileNode[]): string[] {
    return nodes.flatMap(n => n.type === 'file' ? [n.path] : getAllAllPaths(n.children || []));
  }

  // ─── Inline File Editor ────────────────────────────────────────────────────

  const handleSaveFile = async (path: string, newContent: string) => {
    const updatedStructure = updateFileContent(skill.fileStructure || [], path, newContent);
    try {
      const updated = await api.updateSkill(skill.id, { fileStructure: updatedStructure });
      onSkillUpdated({ ...skill, fileStructure: updatedStructure });
      // Обновляем активный файл локально
      setActiveFile(prev => prev?.path === path ? { ...prev, content: newContent } : prev);
      addToast('Файл сохранён', 'success');
    } catch {
      addToast('Не удалось сохранить файл', 'error');
      throw new Error('Save failed');
    }
  };

  // Контекстное меню действия
  const handleCtxDownloadFile = (node: FileNode) => {
    downloadSingleFile(node);
    addToast(`Файл "${node.name}" скачан`);
  };

  const handleCtxDownloadFolder = async (node: FileNode) => {
    await downloadFolderAsZip(node);
    addToast(`Папка "${node.name}" скачана как ZIP`);
  };

  const handleCtxCopyContent = (node: FileNode) => {
    if (node.content) {
      navigator.clipboard.writeText(node.content);
      addToast('Содержимое скопировано');
    }
  };

  const handleCtxAddToSelection = (node: FileNode) => {
    setSelectionMode(true);
    handleSelect(node.path, node);
  };

  const handleCtxSelectAllInFolder = (node: FileNode) => {
    setSelectionMode(true);
    const paths = getAllPathsInFolder(node);
    setSelectedPaths(prev => {
      const next = new Set(prev);
      paths.forEach(p => next.add(p));
      next.add(node.path);
      return next;
    });
    addToast(`Выбрано ${paths.length} файлов в папке`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-[#09090b] flex flex-col"
      onClick={() => setContextMenu(null)}
    >
      {/* ШАПКА */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-violet-950/30 via-zinc-950/80 to-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Левая часть: назад + мета */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Назад</span>
            </button>

            <div className="w-px h-6 bg-zinc-800 shrink-0" />

            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl shrink-0">
                <Package className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black tracking-tight text-white truncate">{skill.title}</h1>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />{skill.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('ru') : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    {skill.isPublic
                      ? <Globe className="w-3 h-3 text-emerald-500" />
                      : <Lock className="w-3 h-3 text-zinc-600" />
                    }
                    {skill.isPublic ? 'Публичный' : 'Приватный'}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="font-mono text-violet-400 font-bold">{totalFiles} файлов</span>
                </div>
              </div>
            </div>

            {/* Теги */}
            {skill.tags?.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
                {skill.tags.slice(0, 4).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-zinc-800/80 text-zinc-500 text-[10px] font-semibold rounded-full border border-zinc-700/40">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Правая часть: кнопки действий */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 💡 Hints button */}
            <button
              onClick={() => setShowHints(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer',
                'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-400/40'
              )}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Подсказки
              {hintsCount > 0 && (
                <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {hintsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectionMode(!selectionMode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer',
                selectionMode
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {selectionMode ? 'Выход из выбора' : 'Выбрать файлы'}
            </button>

            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700 rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Скачать всё
            </button>

            {canEdit && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-red-300">Удалить?</span>
                    <button onClick={onDelete} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 cursor-pointer">Да</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-700 cursor-pointer">Нет</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Описание */}
        {skill.description && (
          <div className="max-w-[1800px] mx-auto mt-2 pl-[3.5rem]">
            <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">{skill.description}</p>
          </div>
        )}
      </header>

      {/* ТЕЛО: панели */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Левая панель — дерево файлов */}
        <div className="w-72 shrink-0 border-r border-zinc-800/60 bg-zinc-950/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-violet-500" />
              Файлы
            </span>
            {selectionMode && selectedPaths.size > 0 && (
              <button
                onClick={() => setSelectedPaths(new Set())}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Сбросить
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <SpaceFileTree
              files={skill.fileStructure || []}
              activeFile={activeFile}
              selectionMode={selectionMode}
              selectedPaths={selectedPaths}
              onFileClick={handleFileClick}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
            />
          </div>
        </div>

        {/* Правая панель — превью */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/30">
          <SpaceFilePreview
            file={activeFile}
            canEdit={!!canEdit}
            onSaveFile={handleSaveFile}
          />
        </div>
      </div>

      {/* Контекстное меню */}
      <SpaceContextMenu
        target={contextMenu}
        onClose={() => setContextMenu(null)}
        onDownloadFile={handleCtxDownloadFile}
        onDownloadFolder={handleCtxDownloadFolder}
        onCopyContent={handleCtxCopyContent}
        onAddToSelection={handleCtxAddToSelection}
        onSelectAllInFolder={handleCtxSelectAllInFolder}
      />

      {/* Плавающая панель выделения */}
      <SpaceSelectionBar
        visible={selectionMode}
        selectedCount={[...selectedPaths].filter(p => {
          const isFolder = (nodes: FileNode[], path: string): boolean => {
            for (const n of nodes) {
              if (n.path === path) return n.type === 'directory';
              if (n.children) {
                const r = isFolder(n.children, path);
                if (r) return true;
              }
            }
            return false;
          };
          return !isFolder(skill.fileStructure || [], p);
        }).length}
        onDownload={handleDownloadSelection}
        onCancel={() => setSelectionMode(false)}
      />

      {/* Панель подсказок */}
      {showHints && (
        <SkillHintsPanel
          skillId={skill.id}
          skillTitle={skill.title}
          effectiveUser={effectiveUser}
          addToast={addToast}
          onClose={() => setShowHints(false)}
          onHintsCountChange={setHintsCount}
        />
      )}
    </motion.div>
  );
}
