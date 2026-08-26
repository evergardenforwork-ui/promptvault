import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl pointer-events-auto text-zinc-900 dark:text-white">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
              }`}>
                <span className="text-2xl">
                  {variant === 'danger' ? '🗑️' : '⚠️'}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>

              {/* Message */}
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{message}</p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-sm font-medium transition-all cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer ${
                    variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
