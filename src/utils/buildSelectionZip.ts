import JSZip from 'jszip';
import { FileNode } from '../types';

/** Рекурсивно собирает все файлы из дерева в плоский список */
function collectFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node);
    } else if (node.children) {
      result.push(...collectFiles(node.children));
    }
  }
  return result;
}

/** Собирает все файлы внутри папки (включая вложенные) */
function collectFilesInFolder(folder: FileNode): FileNode[] {
  if (folder.type === 'file') return [folder];
  return collectFiles(folder.children || []);
}

/**
 * Создаёт ZIP-архив из выбранных путей.
 * Если выбрана папка — включает все файлы внутри с сохранением структуры.
 * Если выбран файл — добавляет по его оригинальному пути.
 */
export async function buildSelectionZip(
  nodes: FileNode[],
  selectedPaths: Set<string>
): Promise<Blob> {
  const zip = new JSZip();
  const allFiles = collectFiles(nodes);

  // Находим все папки из nodes (рекурсивно)
  function findAllFolders(ns: FileNode[]): FileNode[] {
    const folders: FileNode[] = [];
    for (const n of ns) {
      if (n.type === 'directory') {
        folders.push(n);
        if (n.children) folders.push(...findAllFolders(n.children));
      }
    }
    return folders;
  }

  const allFolders = findAllFolders(nodes);
  const addedPaths = new Set<string>();

  // Обрабатываем выбранные папки — добавляем все их содержимое
  for (const folder of allFolders) {
    if (selectedPaths.has(folder.path)) {
      const filesInFolder = collectFilesInFolder(folder);
      for (const file of filesInFolder) {
        if (!addedPaths.has(file.path)) {
          zip.file(file.path, file.content || '');
          addedPaths.add(file.path);
        }
      }
    }
  }

  // Обрабатываем выбранные файлы напрямую
  for (const file of allFiles) {
    if (selectedPaths.has(file.path) && !addedPaths.has(file.path)) {
      zip.file(file.path, file.content || '');
      addedPaths.add(file.path);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/** Скачивает одну папку как ZIP, сохраняя вложенную структуру */
export async function downloadFolderAsZip(folder: FileNode): Promise<void> {
  const zip = new JSZip();
  const files = collectFilesInFolder(folder);

  for (const file of files) {
    zip.file(file.path, file.content || '');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folder.name}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Скачивает один файл как текстовый файл */
export function downloadSingleFile(file: FileNode): void {
  const blob = new Blob([file.content || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
