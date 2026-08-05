import JSZip from 'jszip';
import { FileNode } from '../types';

/**
 * Парсит ZIP файл в браузерное дерево FileNode[]
 */
export async function parseZipFile(file: File): Promise<{ fileStructure: FileNode[]; fileCount: number }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const rootNodes: FileNode[] = [];
  const mapPathToNode: { [path: string]: FileNode } = {};
  let fileCount = 0;

  // Очищаем и сортируем пути, убирая trailing slash
  const entries = Object.keys(loadedZip.files).sort();

  for (const entryPath of entries) {
    const zipObj = loadedZip.files[entryPath];
    // Нормализуем путь (без лишних передних и задних слэшей)
    const cleanPath = entryPath.replace(/\/$/, '');
    if (!cleanPath) continue;

    const parts = cleanPath.split('/');
    const fileName = parts[parts.length - 1];
    const isDir = zipObj.dir || entryPath.endsWith('/');

    // Пропускаем служебные файлы типа __MACOSX или .DS_Store
    if (fileName.startsWith('._') || fileName === '.DS_Store' || parts.includes('__MACOSX')) {
      continue;
    }

    let nodeContent: string | undefined = undefined;
    // Если это текстовый файл (.md, .json, .txt, .ts, .js, .py, .css, .html, .yml, .yaml, .sql, .sh)
    if (!isDir) {
      fileCount++;
      const lowerName = fileName.toLowerCase();
      const isTextFile = /\.(md|json|txt|ts|js|jsx|tsx|py|css|html|yml|yaml|sql|sh|env|config)$/i.test(lowerName);
      if (isTextFile) {
        try {
          nodeContent = await zipObj.async('string');
        } catch {
          nodeContent = '[Не удалось прочесть текстовое содержимое]';
        }
      }
    }

    const node: FileNode = {
      name: fileName,
      path: cleanPath,
      type: isDir ? 'directory' : 'file',
      content: nodeContent,
      children: isDir ? [] : undefined,
    };

    mapPathToNode[cleanPath] = node;

    // Вставляем в родитеский узел или в корень
    if (parts.length === 1) {
      rootNodes.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parentNode = mapPathToNode[parentPath];
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        // Если родителя не создали явно (папка была без отдельного entry)
        rootNodes.push(node);
      }
    }
  }

  // Сортировка: сначала папки, затем файлы (по алфавиту)
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sortNodes(n.children);
    });
  };

  sortNodes(rootNodes);

  return { fileStructure: rootNodes, fileCount };
}

/**
 * Создаёт скачивание отдельного текстового файла
 */
export function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
