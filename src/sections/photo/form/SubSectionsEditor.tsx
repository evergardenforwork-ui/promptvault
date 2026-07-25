import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SubSection } from '../../../types';
import { cn } from '../../../utils/cn';
import { LAYOUT_OPTIONS } from './ImageSlotsSection';

interface SubSectionsEditorProps {
  subSections: SubSection[];
  addSubSection: () => void;
  removeSubSection: (i: number) => void;
  updateSubSection: (i: number, field: keyof SubSection, val: any) => void;
  renderLayoutPreview: (subIdx: number | null) => React.ReactNode;
}

export default function SubSectionsEditor({
  subSections,
  addSubSection,
  removeSubSection,
  updateSubSection,
  renderLayoutPreview,
}: SubSectionsEditorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Дополнения (варианты)</h3>
        <button type="button" onClick={addSubSection}
          className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer">
          <Plus size={14} /> Добавить вариант
        </button>
      </div>

      <div className="space-y-4">
        {subSections.map((s, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 relative group"
          >
            <button type="button" onClick={() => removeSubSection(i)}
              className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
              <Trash2 size={16} />
            </button>

            <input
              type="text"
              value={s.title}
              onChange={(e) => updateSubSection(i, 'title', e.target.value)}
              placeholder="Название дополнения (например: + Студийный свет)"
              className="w-full bg-transparent border-b border-zinc-800 pb-2 focus:outline-none focus:border-sky-400 transition-all font-bold text-sm text-white"
            />

            <textarea
              value={s.text}
              onChange={(e) => updateSubSection(i, 'text', e.target.value)}
              placeholder="Текст дополнения..."
              className="w-full h-24 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 focus:outline-none focus:border-sky-400 transition-all font-mono text-xs resize-none text-white"
            />

            {/* Subsection Layout and Images */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Макет изображений дополнения</label>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: 'none', name: 'Без фото' }, ...LAYOUT_OPTIONS].map((opt) => {
                  const isSelected = opt.id === 'none'
                    ? (!s.imageLayoutType && !s.imageBefore && !s.imageAfter)
                    : s.imageLayoutType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === 'none') {
                          updateSubSection(i, 'imageLayoutType', '');
                          updateSubSection(i, 'imageBefore', '');
                          updateSubSection(i, 'imageAfter', '');
                          updateSubSection(i, 'originalImageBefore', '');
                          updateSubSection(i, 'originalImageAfter', '');
                          updateSubSection(i, 'originalImageSlot2', '');
                          updateSubSection(i, 'additionalImages', []);
                        } else {
                          updateSubSection(i, 'imageLayoutType', opt.id);
                          if (!s.additionalImages) {
                            updateSubSection(i, 'additionalImages', []);
                          }
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer",
                        isSelected
                          ? "bg-sky-400 text-black border-sky-400 font-extrabold"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>

              {s.imageLayoutType && s.imageLayoutType !== '' && (
                <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-2xl space-y-3 mt-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Изображения дополнения (нажмите для выбора)
                  </span>
                  <div className="w-full">{renderLayoutPreview(i)}</div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
