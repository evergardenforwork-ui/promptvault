import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Copy, CheckSquare, Folder, FileText, Trash2 } from 'lucide-react';
import { FileNode } from '../../../types';
import { cn } from '../../../utils/cn';

export interface ContextMenuTarget {
  node: FileNode;
  x: number;
  y: number;
}

interface SpaceContextMenuProps {
  target: ContextMenuTarget | null;
  onClose: () => void;
  onDownloadFile: (node: FileNode) => void;
  onDownloadFolder: (node: FileNode) => void;
  onCopyContent: (node: FileNode) => void;
  onAddToSelection: (node: FileNode) => void;
  onSelectAllInFolder: (node: FileNode) => void;
}

export default function SpaceContextMenu({
  target,
  onClose,
  onDownloadFile,
  onDownloadFolder,
  onCopyContent,
  onAddToSelection,
  onSelectAllInFolder,
}: SpaceContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [target, onClose]);

  // Корректировка позиции чтобы меню не вышло за экран
  const getPosition = () => {
    if (!target) return { top: 0, left: 0 };
    const menuWidth = 220;
    const menuHeight = 200;
    let left = target.x;
    let top = target.y;
    if (left + menuWidth > window.innerWidth - 16) left = window.innerWidth - menuWidth - 16;
    if (top + menuHeight > window.innerHeight - 16) top = window.innerHeight - menuHeight - 16;
    return { top, left };
  };

  const pos = getPosition();
  const isFolder = target?.node.type === 'directory';

  const MenuItem = ({
    icon,
    label,
    onClick,
    danger = false,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer text-left',
        danger
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-zinc-300 hover:bg-zinc-700/60 hover:text-white'
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 200 }}
          className="w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/60 p-1.5 overflow-hidden"
        >
          {/* Имя узла */}
          <div className="px-3 py-1.5 mb-1 border-b border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              {isFolder
                ? <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                : <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              }
              <span className="text-[11px] text-zinc-400 font-mono truncate">{target.node.name}</span>
            </div>
          </div>

          {isFolder ? (
            <>
              <MenuItem
                icon={<Download className="w-3.5 h-3.5" />}
                label="Скачать папку как ZIP"
                onClick={() => onDownloadFolder(target.node)}
              />
              <MenuItem
                icon={<CheckSquare className="w-3.5 h-3.5" />}
                label="Выбрать все файлы в папке"
                onClick={() => onSelectAllInFolder(target.node)}
              />
              <MenuItem
                icon={<CheckSquare className="w-3.5 h-3.5 text-violet-400" />}
                label="Добавить папку в выборку"
                onClick={() => onAddToSelection(target.node)}
              />
            </>
          ) : (
            <>
              <MenuItem
                icon={<Download className="w-3.5 h-3.5" />}
                label="Скачать файл"
                onClick={() => onDownloadFile(target.node)}
              />
              {target.node.content && (
                <MenuItem
                  icon={<Copy className="w-3.5 h-3.5" />}
                  label="Копировать содержимое"
                  onClick={() => onCopyContent(target.node)}
                />
              )}
              <MenuItem
                icon={<CheckSquare className="w-3.5 h-3.5 text-violet-400" />}
                label="Добавить в выборку"
                onClick={() => onAddToSelection(target.node)}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
