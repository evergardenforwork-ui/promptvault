import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface CollapsibleTextProps {
  text: string;
  onCopy: (text: string) => void;
  hideFloatingCopy?: boolean;
}

export default function CollapsibleText({ text, onCopy, hideFloatingCopy }: CollapsibleTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineCount = text.split('\n').length;
  const isLong = lineCount > 6 || text.length > 500;

  return (
    <div className="relative group">
      {!hideFloatingCopy && (
        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            type="button"
            title="Копировать текущий текст"
            onClick={() => onCopy(text)}
            className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
          >
            <Copy size={18} />
          </button>
        </div>
      )}

      <div
        className={cn(
          "bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 sm:p-10 font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap transition-all duration-500 overflow-hidden relative",
          !isExpanded && isLong ? "max-h-[300px]" : "max-h-[5000px]"
        )}
      >
        {text}

        {!isExpanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
        )}
      </div>

      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all flex items-center gap-2 shadow-xl z-20 cursor-pointer"
        >
          {isExpanded ? (
            <>Свернуть <ChevronUp size={12} /></>
          ) : (
            <>Развернуть <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
}
