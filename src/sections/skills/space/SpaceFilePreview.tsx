import React, { useState } from 'react';
import { FileText, Copy, Check, Download, ChevronRight, Edit, Eye, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { FileNode } from '../../../types';
import { cn } from '../../../utils/cn';
import { downloadSingleFile } from '../../../utils/buildSelectionZip';

interface SpaceFilePreviewProps {
  file: FileNode | null;
  canEdit?: boolean;
  onSaveFile?: (path: string, newContent: string) => Promise<void>;
}

/** Хлебные крошки по пути файла */
function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/');
  return (
    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 flex-wrap min-w-0">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-zinc-700" />}
          <span className={cn(
            'truncate',
            i === parts.length - 1 ? 'text-violet-300 font-semibold' : 'text-zinc-500'
          )}>
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Иконка по расширению */
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'md') return <FileText className="w-4 h-4 text-violet-400 shrink-0" />;
  return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
}

export default function SpaceFilePreview({ file, canEdit, onSaveFile }: SpaceFilePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    if (!file?.content) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditContent(file?.content || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!file || !onSaveFile) return;
    setSaving(true);
    try {
      await onSaveFile(file.path, editContent);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Сбрасываем режим редактирования при смене файла
  React.useEffect(() => {
    setIsEditing(false);
    setEditContent('');
  }, [file?.path]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-4 p-8">
        <FileText className="w-12 h-12 opacity-20" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-zinc-500">Выберите файл</p>
          <p className="text-xs text-zinc-700">Кликните на файл в дереве слева для просмотра</p>
        </div>
      </div>
    );
  }

  const isMarkdown = file.name.toLowerCase().endsWith('.md');
  const hasContent = file.content !== undefined && file.content !== null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Заголовок превью */}
      <div className="px-5 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 bg-zinc-950/50 relative z-20">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {getFileIcon(file.name)}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{file.name}</div>
            <Breadcrumb path={file.path} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Кнопки в режиме редактирования */}
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl border border-violet-500 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Сохранить
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Отмена
              </button>
            </>
          ) : (
            <>
              {hasContent && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700/50 transition-all cursor-pointer"
                  >
                    {copied
                      ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Скопировано</span></>
                      : <><Copy className="w-3.5 h-3.5" /><span>Копировать</span></>
                    }
                  </button>
                  <button
                    onClick={() => downloadSingleFile(file)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                    title="Скачать файл"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {/* Кнопка редактирования */}
              {canEdit && hasContent && onSaveFile && (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-violet-300 rounded-xl border border-zinc-700/50 hover:border-violet-500/40 transition-all cursor-pointer"
                  title="Редактировать файл"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Изменить</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Содержимое файла */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          /* EDIT MODE */
          <div className="flex flex-col h-full p-4 gap-2">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <Edit className="w-3 h-3 text-violet-400" />
              <span>Режим редактирования · <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+S</kbd> — сохранить</span>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 w-full px-4 py-4 bg-zinc-900/80 border border-violet-500/30 rounded-xl text-sm font-mono text-zinc-200 leading-relaxed resize-none outline-none focus:border-violet-400 transition-colors"
              spellCheck={false}
              autoFocus
            />
          </div>
        ) : hasContent ? (
          /* VIEW MODE */
          isMarkdown ? (
            <div className="w-full flex justify-center pb-12">
              <div className="prose prose-invert prose-base max-w-3xl w-full p-6 text-zinc-300 font-sans antialiased
                prose-p:leading-relaxed prose-p:mb-5
                prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:border-b prose-h1:border-zinc-800 prose-h1:pb-4 prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:text-violet-100 prose-h2:mb-4 prose-h2:mt-10
                prose-h3:text-lg prose-h3:text-violet-200 prose-h3:mb-3 prose-h3:mt-8
                prose-code:bg-zinc-800/80 prose-code:text-violet-300 prose-code:font-mono prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:border prose-code:border-zinc-700/50
                prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:p-5 prose-pre:font-mono
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-blockquote:border-l-4 prose-blockquote:border-violet-500/60 prose-blockquote:bg-violet-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:not-italic
                prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm
                prose-th:border prose-th:border-zinc-700 prose-th:bg-zinc-900 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                prose-td:border prose-td:border-zinc-800/80 prose-td:p-3
                prose-hr:border-zinc-800/80 prose-hr:my-10
                prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5
                prose-li:my-2 prose-li:pl-2
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]}>{file.content!}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <pre className="text-xs font-mono text-zinc-300 bg-zinc-950/50 p-6 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {file.content}
            </pre>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 text-xs italic p-8 text-center">
            Содержимое файла недоступно для предварительного просмотра
          </div>
        )}
      </div>
    </div>
  );
}
