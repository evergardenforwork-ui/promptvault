import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: React.ReactNode;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-start gap-3 border pointer-events-auto ${
        type === 'success' ? "bg-zinc-900 border-sky-400/30 text-sky-400" : "bg-red-950 border-red-500/30 text-red-400"
      }`}
    >
      <span className="shrink-0 mt-0.5">
        {type === 'success' ? <Check size={18} /> : <X size={18} />}
      </span>
      <div className="font-medium min-w-0">{message}</div>
    </motion.div>
  );
}
