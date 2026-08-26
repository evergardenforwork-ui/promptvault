import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: React.ReactNode;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-start gap-3 border pointer-events-auto ${
        type === 'error'
          ? "bg-red-950 border-red-500/30 text-red-400"
          : type === 'info'
          ? "bg-zinc-900 border-sky-500/30 text-sky-300"
          : "bg-zinc-900 border-sky-400/30 text-sky-400"
      }`}
    >
      <span className="shrink-0 mt-0.5">
        {type === 'error' ? <X size={18} /> : <Check size={18} />}
      </span>
      <div className="font-medium min-w-0">{message}</div>
    </motion.div>
  );
}
