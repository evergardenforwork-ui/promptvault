import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommandItem } from '../../types';

interface CommandFillModalProps {
  command: CommandItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (finalText: string) => void;
}

export default function CommandFillModal({
  command,
  isOpen,
  onClose,
  onCopy,
}: CommandFillModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Extract variables
  const variables = useMemo(() => {
    if (!command) return [];
    if (command.variables && command.variables.length > 0) return command.variables;
    const matches = command.commandText.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))).filter(Boolean);
  }, [command]);

  // Reset values on open
  useEffect(() => {
    if (isOpen && command) {
      const initial: Record<string, string> = {};
      variables.forEach(v => {
        initial[v] = '';
      });
      setValues(initial);
      setCopied(false);
    }
  }, [isOpen, command, variables]);

  // Compute final filled text
  const filledText = useMemo(() => {
    if (!command) return '';
    let text = command.commandText;
    variables.forEach(v => {
      const val = values[v]?.trim();
      const regex = new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'g');
      text = text.replace(regex, val || `{{${v}}}`);
    });
    return text;
  }, [command, variables, values]);

  const handleCopy = () => {
    onCopy(filledText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 800);
  };

  if (!isOpen || !command) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                  Заполнить параметры
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-sm">
                  {command.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {variables.length > 0 ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  Переменные команды ({variables.length})
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {variables.map((varName) => (
                    <div key={varName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {`{{${varName}}}`}
                        </span>
                        {values[varName] && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">заполнено</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={values[varName] || ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [varName]: e.target.value }))
                        }
                        placeholder={`Значение для ${varName}...`}
                        className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all"
                        autoFocus={variables[0] === varName}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                В этой команде нет переменных, она будет скопирована в исходном виде.
              </p>
            )}

            {/* Live Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Предпросмотр результата
              </label>
              <div className="bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap break-all max-h-48 overflow-y-auto custom-scrollbar select-all">
                {filledText}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Скопировать команду</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
