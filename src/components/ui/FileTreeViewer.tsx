import React, { useState } from 'react';
import { FileNode } from '../../types';
import { 
  Folder, FolderOpen, FileText, Code, Download, Copy, Check, ChevronRight, ChevronDown, Package,
  Plus, FilePlus, FolderPlus, Trash2, Edit3, Save, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { downloadFile } from '../../utils/zipParser';

interface FileTreeViewerProps {
  files?: FileNode[];
  filePackageUrl?: string;
  isEditable?: boolean;
  onFilesChange?: (newFiles: FileNode[]) => void;
}

export const FileTreeViewer: React.FC<FileTreeViewerProps> = ({
  files = [],
  filePackageUrl,
  isEditable = false,
  onFilesChange,
}) => {
  const [treeData, setTreeData] = useState<FileNode[]>(files);

  // Си�хро�изация при об�овле�ии пропса files изв�е (�апример при импорте ZIP)
  React.useEffect(() => {
    setTreeData(files);
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
    setSelectedFile(findFirst(files));
    const initial: { [path: string]: boolean } = {};
    const expandAll = (nodes: FileNode[]) => {
      nodes.forEach((n) => {
        if (n.type === 'directory') {
          initial[n.path] = true;
          if (n.children) expandAll(n.children);
        }
      });
    };
    expandAll(files);
    setExpandedFolders(initial);
  }, [files]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(() => {
    const findFirstFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file') return node;
        if (node.children) {
          const sub = findFirstFile(node.children);
          if (sub) return sub;
        }
      }
      return null;
    };
    return findFirstFile(files);
  });

  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>(() => {
    const initial: { [path: string]: boolean } = {};
    const expandAll = (nodes: FileNode[]) => {
      nodes.forEach((n) => {
        if (n.type === 'directory') {
          initial[n.path] = true;
          if (n.children) expandAll(n.children);
        }
      });
    };
    expandAll(files);
    return initial;
  });

  const [copied, setCopied] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'preview' | 'edit'>('preview');
  const [editingContent, setEditingContent] = useState<string>('');

  // Модаль�ые ок�а для добавле�ия/созда�ия
  const [targetParentPath, setTargetParentPath] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'file' | 'directory'>('file');
  const [newItemName, setNewItemName] = useState('');

  // Drag & Drop состоя�ия
  const [draggedNodePath, setDraggedNodePath] = useState<string | null>(null);
  const [dragOverFolderPath, setDragOverFolderPath] = useState<string | null>(null);

  // Си�хро�изация изме�е�ий вверх
  const updateTree = (newTree: FileNode[]) => {
    setTreeData(newTree);
    if (onFilesChange) onFilesChange(newTree);
  };

  // Перемеще�ие узла (файла или папки) в�утрь целевой папки (targetFolderPath = null для кор�я)
  const moveNodeToFolder = (sourcePath: string, targetFolderPath: string | null) => {
    if (sourcePath === targetFolderPath) return;
    if (targetFolderPath && targetFolderPath.startsWith(sourcePath + '/')) return; // �ельзя папки двигать в себя

    let movedNode: FileNode | null = null;

    // 1. Извлекаем узел
    const removeNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter((n) => {
        if (n.path === sourcePath) {
          movedNode = n;
          return false;
        }
        if (n.children) {
          n.children = removeNode(n.children);
        }
        return true;
      });
    };

    const treeWithoutSource = removeNode(treeData);
    if (!movedNode) return;

    // Рекурсив�ый пересчёт путей у перемещё��ого элеме�та
    const updatePaths = (node: FileNode, newParentPath: string | null): FileNode => {
      const newPath = newParentPath ? `${newParentPath}/${node.name}` : node.name;
      return {
        ...node,
        path: newPath,
        children: node.children ? node.children.map((child) => updatePaths(child, newPath)) : undefined,
      };
    };

    const updatedMovedNode = updatePaths(movedNode, targetFolderPath);

    // 2. Вставляем узел в целевую папку
    if (!targetFolderPath) {
      updateTree([...treeWithoutSource, updatedMovedNode]);
      if (selectedFile?.path === sourcePath) {
        setSelectedFile(updatedMovedNode);
      }
      return;
    }

    const insertNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        if (n.path === targetFolderPath && n.type === 'directory') {
          return { ...n, children: [...(n.children || []), updatedMovedNode] };
        }
        if (n.children) {
          return { ...n, children: insertNode(n.children) };
        }
        return n;
      });
    };

    const finalTree = insertNode(treeWithoutSource);
    setExpandedFolders((prev) => ({ ...prev, [targetFolderPath]: true }));
    updateTree(finalTree);
    if (selectedFile?.path === sourcePath) {
      setSelectedFile(updatedMovedNode);
    }
  };

  // Обработка Drop файлов из операцио��ой системы �а ко�крет�ую папку или область
  const handleExternalDropOnFolder = async (e: React.DragEvent, targetFolderPath: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPath(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const newNodes: FileNode[] = [];
    for (const file of droppedFiles) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        // Парсим ZIP и добавляем его содержимое
        try {
          const { parseZipFile } = await import('../../utils/zipParser');
          const { fileStructure: parsedStructure } = await parseZipFile(file);
          newNodes.push(...parsedStructure);
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const text = await file.text();
          const cleanName = file.name;
          const fullPath = targetFolderPath ? `${targetFolderPath}/${cleanName}` : cleanName;
          newNodes.push({
            name: cleanName,
            path: fullPath,
            type: 'file',
            content: text,
            size: file.size,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (newNodes.length === 0) return;

    if (!targetFolderPath) {
      updateTree([...treeData, ...newNodes]);
    } else {
      const insertNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((n) => {
          if (n.path === targetFolderPath && n.type === 'directory') {
            return { ...n, children: [...(n.children || []), ...newNodes] };
          }
          if (n.children) {
            return { ...n, children: insertNodes(n.children) };
          }
          return n;
        });
      };
      updateTree(insertNodes(treeData));
      setExpandedFolders((prev) => ({ ...prev, [targetFolderPath]: true }));
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectFileNode = (node: FileNode) => {
    setSelectedFile(node);
    setEditingContent(node.content || '');
    setActiveTabMode('preview');
  };

  const saveFileContent = () => {
    if (!selectedFile) return;

    const updateNodeContent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        if (n.path === selectedFile.path) {
          return { ...n, content: editingContent };
        }
        if (n.children) {
          return { ...n, children: updateNodeContent(n.children) };
        }
        return n;
      });
    };

    const nextTree = updateNodeContent(treeData);
    setSelectedFile({ ...selectedFile, content: editingContent });
    updateTree(nextTree);
    setActiveTabMode('preview');
  };

  const handleCreateNewItem = () => {
    if (!newItemName.trim()) return;

    const cleanName = newItemName.trim();
    const parentPath = targetParentPath;
    const fullPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;

    const newNode: FileNode = {
      name: cleanName,
      path: fullPath,
      type: newItemType,
      content: newItemType === 'file' ? '' : undefined,
      children: newItemType === 'directory' ? [] : undefined,
    };

    const insertNode = (nodes: FileNode[]): FileNode[] => {
      if (!parentPath) {
        return [...nodes, newNode];
      }
      return nodes.map((n) => {
        if (n.path === parentPath && n.type === 'directory') {
          return { ...n, children: [...(n.children || []), newNode] };
        }
        if (n.children) {
          return { ...n, children: insertNode(n.children) };
        }
        return n;
      });
    };

    const nextTree = insertNode(treeData);
    if (parentPath) {
      setExpandedFolders((prev) => ({ ...prev, [parentPath]: true }));
    }

    updateTree(nextTree);
    if (newItemType === 'file') {
      selectFileNode(newNode);
    }
    setShowAddModal(false);
    setNewItemName('');
  };

  const handleDeleteItem = (path: string) => {
    const deleteNode = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((n) => n.path !== path)
        .map((n) => (n.children ? { ...n, children: deleteNode(n.children) } : n));
    };

    const nextTree = deleteNode(treeData);
    if (selectedFile?.path === path) {
      setSelectedFile(null);
    }
    updateTree(nextTree);
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return (
      <div className="space-y-0.5">
        {nodes.map((node) => {
          const isSelected = selectedFile?.path === node.path;
          const isExpanded = expandedFolders[node.path];
          const isDragTarget = dragOverFolderPath === node.path;

          if (node.type === 'directory') {
            return (
              <div key={node.path}>
                <div
                  draggable={isEditable}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDraggedNodePath(node.path);
                  }}
                  onDragOver={(e) => {
                    if (!isEditable) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderPath(node.path);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverFolderPath === node.path) {
                      setDragOverFolderPath(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!isEditable) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderPath(null);
                    if (draggedNodePath) {
                      moveNodeToFolder(draggedNodePath, node.path);
                      setDraggedNodePath(null);
                    } else if (e.dataTransfer.files.length > 0) {
                      handleExternalDropOnFolder(e, node.path);
                    }
                  }}
                  style={{ paddingLeft: `${depth * 14 + 8}px` }}
                  className={`group w-full flex items-center justify-between py-1 px-2 rounded-md transition-colors text-xs text-gray-300 ${
                    isDragTarget
                      ? 'bg-purple-600/40 border-2 border-dashed border-purple-400 text-white shadow-lg'
                      : 'hover:bg-gray-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(node.path)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-grab active:cursor-grabbing"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
                    )}
                    <span className="truncate font-medium">{node.name}</span>
                  </button>

                  {isEditable && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Создать файл в этой папке"
                        onClick={() => {
                          setTargetParentPath(node.path);
                          setNewItemType('file');
                          setShowAddModal(true);
                        }}
                        className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-purple-300"
                      >
                        <FilePlus size={12} />
                      </button>
                      <button
                        type="button"
                        title="Удалить папку"
                        onClick={() => handleDeleteItem(node.path)}
                        className="p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {isExpanded && node.children && renderTree(node.children, depth + 1)}
              </div>
            );
          }

          const isMarkdown = node.name.toLowerCase().endsWith('.md');

          return (
            <div
              key={node.path}
              draggable={isEditable}
              onDragStart={(e) => {
                e.stopPropagation();
                setDraggedNodePath(node.path);
              }}
              style={{ paddingLeft: `${depth * 14 + 24}px` }}
              className={`group w-full flex items-center justify-between py-1 px-2 rounded-md text-xs transition-colors cursor-grab active:cursor-grabbing ${
                isSelected
                  ? 'bg-purple-600/30 text-purple-300 font-medium border border-purple-500/30'
                  : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => selectFileNode(node)}
                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
              >
                {isMarkdown ? (
                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <Code className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
              </button>

              {isEditable && (
                <button
                  type="button"
                  title="Удалить файл"
                  onClick={() => handleDeleteItem(node.path)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row h-[550px] md:h-[620px] text-zinc-900 dark:text-zinc-100">
      {/* Левая колонка — дерево файлов и кнопок управления */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-3 flex flex-col bg-zinc-50 dark:bg-zinc-950/80 shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Файловая система</span>
          </div>

          <div className="flex items-center gap-1">
            {isEditable && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTargetParentPath(null);
                    setNewItemType('file');
                    setShowAddModal(true);
                  }}
                  className="p-1 text-zinc-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                  title="Создать файл в корне"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetParentPath(null);
                    setNewItemType('directory');
                    setShowAddModal(true);
                  }}
                  className="p-1 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                  title="Создать папку в корне"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </>
            )}

            {filePackageUrl && (
              <a
                href={filePackageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="p-1 text-zinc-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded transition-colors"
                title="Скачать ZIP архив"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {treeData.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">{renderTree(treeData)}</div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-zinc-400 dark:text-zinc-500 space-y-2">
            <Package className="w-8 h-8 opacity-40" />
            <p className="text-xs">Пространство пустое</p>
            {isEditable && (
              <button
                type="button"
                onClick={() => {
                  setTargetParentPath(null);
                  setNewItemType('file');
                  setShowAddModal(true);
                }}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-600/50 cursor-pointer"
              >
                + Создать первый файл
              </button>
            )}
          </div>
        )}
      </div>

      {/* Правая колонка — просмотр / редактирование файла */}
      <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-900 overflow-hidden">
        {selectedFile ? (
          <>
            {/* Панель управления файлом */}
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-hidden">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate font-bold text-zinc-900 dark:text-zinc-200">{selectedFile.path}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isEditable && (
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('preview')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                        activeTabMode === 'preview' ? 'bg-purple-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Eye size={12} />
                      <span>Просмотр</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('edit')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                        activeTabMode === 'edit' ? 'bg-purple-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Edit3 size={12} />
                      <span>Редактировать</span>
                    </button>
                  </div>
                )}

                {activeTabMode === 'edit' && isEditable && (
                  <button
                    type="button"
                    onClick={saveFileContent}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md transition-colors shadow-sm cursor-pointer"
                  >
                    <Save size={12} />
                    <span>Сохранить</span>
                  </button>
                )}

                {selectedFile.content && (
                  <button
                    type="button"
                    onClick={() => handleCopy(activeTabMode === 'edit' ? editingContent : selectedFile.content || '')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                )}

                {selectedFile.content && (
                  <button
                    type="button"
                    onClick={() => downloadFile(selectedFile.name, selectedFile.content || '')}
                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    title="Скачать этот файл"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Содержимое или редактор */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {activeTabMode === 'edit' && isEditable ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  placeholder="Введите содержимое файла или .md инструкции..."
                  className="w-full h-full min-h-[400px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-mono text-xs p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-purple-500 resize-none leading-relaxed shadow-inner"
                />
              ) : selectedFile.content !== undefined ? (
                selectedFile.name.toLowerCase().endsWith('.md') ? (
                  <div className="w-full flex justify-center pb-8">
                    <div className="prose dark:prose-invert prose-base max-w-3xl w-full text-zinc-800 dark:text-zinc-300 font-sans antialiased
                      prose-p:leading-relaxed prose-p:mb-5
                      prose-headings:text-zinc-900 dark:prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-3xl prose-h1:border-b prose-h1:border-zinc-200 dark:prose-h1:border-zinc-800 prose-h1:pb-4 prose-h1:mb-6 prose-h1:mt-8
                      prose-h2:text-2xl prose-h2:text-violet-900 dark:prose-h2:text-violet-100 prose-h2:mb-4 prose-h2:mt-10
                      prose-h3:text-lg prose-h3:text-violet-800 dark:prose-h3:text-violet-200 prose-h3:mb-3 prose-h3:mt-8
                      prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800/80 prose-code:text-violet-700 dark:prose-code:text-violet-300 prose-code:font-mono prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:border prose-code:border-zinc-200 dark:prose-code:border-zinc-700/50
                      prose-pre:bg-zinc-100 dark:prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:text-zinc-900 dark:prose-pre:text-zinc-200 prose-pre:rounded-xl prose-pre:p-5 prose-pre:font-mono
                      prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-zinc-900 dark:prose-strong:text-white prose-strong:font-semibold
                      prose-blockquote:border-l-4 prose-blockquote:border-violet-500/60 prose-blockquote:bg-violet-50 dark:prose-blockquote:bg-violet-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:not-italic
                      prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm
                      prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:bg-zinc-100 dark:prose-th:bg-zinc-900 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                      prose-td:border prose-td:border-zinc-200 dark:prose-td:border-zinc-800/80 prose-td:p-3
                      prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800/80 prose-hr:my-10
                      prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5
                      prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5
                      prose-li:my-2 prose-li:pl-2
                    ">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]}>{selectedFile.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs italic">
                  Двоичный файл или содержимое недоступно для предварительного просмотра.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-8 space-y-3">
            <FileText className="w-10 h-10 opacity-40" />
            <p className="text-sm font-medium">Выберите или создайте файл слева</p>
          </div>
        )}
      </div>

      {/* Модальное окно создания файла/папки */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4 text-zinc-900 dark:text-white shadow-2xl">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {newItemType === 'file' ? 'Создать файл' : 'Создать папку'}
              {targetParentPath && <span className="text-xs text-purple-600 dark:text-purple-400 block font-mono">в {targetParentPath}</span>}
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Имя файла / папки (например: SKILL.md)</label>
              <input
                autoFocus
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewItem()}
                placeholder={newItemType === 'file' ? 'SKILL.md или config.json' : 'src или docs'}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                }}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                Отме�а
              </button>
              <button
                type="button"
                onClick={handleCreateNewItem}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


