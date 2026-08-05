import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, CheckSquare } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface SpaceSelectionBarProps {
  visible: boolean;
  selectedCount: number;
  onDownload: () => void;
  onCancel: () => void;
}

export default function SpaceSelectionBar({
  visible,
  selectedCount,
  onDownload,
  onCancel,
}: SpaceSelectionBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-zinc-900/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-2xl shadow-black/60"
        >
          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            title="Отмена"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-zinc-700" />

          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-zinc-300">
              Выбрано:{' '}
              <span className="text-white font-bold">{selectedCount}</span>
              {' '}
              <span className="text-zinc-500 text-xs">
                {selectedCount === 1 ? 'элемент' : selectedCount < 5 ? 'элемента' : 'элементов'}
              </span>
            </span>
          </div>

          <div className="w-px h-5 bg-zinc-700" />

          <button
            onClick={onDownload}
            disabled={selectedCount === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer',
              selectedCount > 0
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            )}
          >
            <Download className="w-4 h-4" />
            Скачать ZIP
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
