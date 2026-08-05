import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Folder, FolderOpen, FileText, Code, ChevronRight, ChevronDown,
  File as FileIcon
} from 'lucide-react';
import { FileNode } from '../../../types';
import { cn } from '../../../utils/cn';

interface ContextMenuTarget {
  node: FileNode;
  x: number;
  y: number;
}

interface SpaceFileTreeProps {
  files: FileNode[];
  activeFile: FileNode | null;
  selectionMode: boolean;
  selectedPaths: Set<string>;
  onFileClick: (node: FileNode) => void;
  onSelect: (path: string, node: FileNode) => void;
  onContextMenu: (target: ContextMenuTarget) => void;
}

/** Возвращает иконку по расширению файла */
function FileIcon_({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'md') return <FileText className={cn('w-3.5 h-3.5 text-violet-400 shrink-0', className)} />;
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return <Code className={cn('w-3.5 h-3.5 text-sky-400 shrink-0', className)} />;
  if (ext === 'json') return <FileIcon className={cn('w-3.5 h-3.5 text-amber-400 shrink-0', className)} />;
  if (['py', 'sh', 'bash'].includes(ext)) return <Code className={cn('w-3.5 h-3.5 text-emerald-400 shrink-0', className)} />;
  return <FileText className={cn('w-3.5 h-3.5 text-zinc-400 shrink-0', className)} />;
}

/** Подсчёт файлов в папке (рекурсивно) */
function countFiles(node: FileNode): number {
  if (node.type === 'file') return 1;
  return (node.children || []).reduce((acc, c) => acc + countFiles(c), 0);
}

/** Все пути файлов в папке рекурсивно */
function getAllFilePaths(node: FileNode): string[] {
  if (node.type === 'file') return [node.path];
  return (node.children || []).flatMap(getAllFilePaths);
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  activeFile: FileNode | null;
  selectionMode: boolean;
  selectedPaths: Set<string>;
  expandedFolders: Set<string>;
  onFileClick: (node: FileNode) => void;
  onSelect: (path: string, node: FileNode) => void;
  onContextMenu: (target: ContextMenuTarget) => void;
  onToggleFolder: (path: string) => void;
}

function TreeNode({
  node, depth, activeFile, selectionMode, selectedPaths, expandedFolders,
  onFileClick, onSelect, onContextMenu, onToggleFolder,
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile?.path === node.path;
  const isSelected = selectedPaths.has(node.path);

  // Для папки: является ли выбранной если все дочерние файлы выбраны
  const folderFileCount = node.type === 'directory' ? countFiles(node) : 0;
  const folderSelectedCount = node.type === 'directory'
    ? getAllFilePaths(node).filter(p => selectedPaths.has(p)).length
    : 0;
  const isFolderFullySelected = node.type === 'directory' && folderFileCount > 0 && folderSelectedCount === folderFileCount;
  const isFolderPartiallySelected = node.type === 'directory' && folderSelectedCount > 0 && folderSelectedCount < folderFileCount;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({ node, x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'directory') {
      if (selectionMode) {
        onSelect(node.path, node);
      } else {
        onToggleFolder(node.path);
      }
    } else {
      if (selectionMode) {
        onSelect(node.path, node);
      } else {
        onFileClick(node);
      }
    }
  };

  if (node.type === 'directory') {
    return (
      <div key={node.path}>
        <div
          onContextMenu={handleContextMenu}
          onClick={handleClick}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={cn(
            'group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all duration-150 select-none',
            selectionMode && (isFolderFullySelected || isSelected)
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
              : isFolderPartiallySelected
              ? 'bg-violet-500/10 text-violet-300'
              : 'hover:bg-zinc-800/60 text-zinc-300'
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {selectionMode && (
              <div className={cn(
                'w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all',
                isFolderFullySelected || isSelected
                  ? 'bg-violet-500 border-violet-500'
                  : isFolderPartiallySelected
                  ? 'bg-violet-500/40 border-violet-500/60'
                  : 'border-zinc-600'
              )}>
                {(isFolderFullySelected || isSelected) && (
                  <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isFolderPartiallySelected && !isSelected && (
                  <div className="w-2 h-0.5 bg-violet-400 rounded" />
                )}
              </div>
            )}
            {!selectionMode && (
              <span className="text-zinc-500 shrink-0">
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
              </span>
            )}
            {isExpanded
              ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              : <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
            }
            <span className="truncate text-xs font-medium">{node.name}</span>
            <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-1">{folderFileCount}</span>
          </div>
        </div>
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                selectionMode={selectionMode}
                selectedPaths={selectedPaths}
                expandedFolders={expandedFolders}
                onFileClick={onFileClick}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      key={node.path}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      style={{ paddingLeft: `${depth * 14 + 24}px` }}
      className={cn(
        'group flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all duration-150 select-none text-xs',
        isActive && !selectionMode
          ? 'bg-violet-600/30 text-violet-200 border border-violet-500/30 font-medium'
          : isSelected && selectionMode
          ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
      )}
    >
      {selectionMode && (
        <div className={cn(
          'w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all',
          isSelected ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'
        )}>
          {isSelected && (
            <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}
      <FileIcon_ name={node.name} />
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export interface SpaceFileTreeRef {
  contextMenu: ContextMenuTarget | null;
}

export default function SpaceFileTree({
  files,
  activeFile,
  selectionMode,
  selectedPaths,
  onFileClick,
  onSelect,
  onContextMenu,
}: SpaceFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const expand = (nodes: FileNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'directory') {
          s.add(n.path);
          if (n.children) expand(n.children);
        }
      });
    };
    expand(files);
    return s;
  });

  // Пересинхронизация при смене пакета
  useEffect(() => {
    const s = new Set<string>();
    const expand = (nodes: FileNode[]) => {
      nodes.forEach(n => {
        if (n.type === 'directory') {
          s.add(n.path);
          if (n.children) expand(n.children);
        }
      });
    };
    expand(files);
    setExpandedFolders(s);
  }, [files]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 p-8">
        <Folder className="w-10 h-10 opacity-30" />
        <p className="text-xs font-medium text-center">Файловая структура пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {files.map(node => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          activeFile={activeFile}
          selectionMode={selectionMode}
          selectedPaths={selectedPaths}
          expandedFolders={expandedFolders}
          onFileClick={onFileClick}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          onToggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
}
