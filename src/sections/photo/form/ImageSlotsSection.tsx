import React from 'react';
import { X, Package, Upload } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ImageSlotsSectionProps {
  imageLayoutType: string;
  setImageLayoutType: (v: string) => void;
  renderSlot: (subIdx: number | null, idx: number, label: string) => React.ReactNode;
  renderLayoutPreview: (subIdx: number | null) => React.ReactNode;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cropperNode: React.ReactNode;
  additionalImages: string[];
  setAdditionalImages: React.Dispatch<React.SetStateAction<string[]>>;
  extraImagesInputRef: React.RefObject<HTMLInputElement | null>;
  zipInputRef?: React.RefObject<HTMLInputElement | null>;
  onZipUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileCount?: number;
  onClearZip?: () => void;
}

const LAYOUT_OPTIONS = [
  { id: 'single', name: '1 Фото', slots: 1, desc: 'Одиночное изображение' },
  { id: 'slider', name: 'Слайдер ДО/ПОСЛЕ', slots: 2, desc: 'Интерактивный ползунок' },
  { id: 'split-vertical', name: 'Вертикальный сплит', slots: 2, desc: 'Два фото: сверху и снизу' },
  { id: 'split-horizontal', name: 'Горизонтальный сплит', slots: 2, desc: 'Два фото: слева и справа' },
  { id: 'split-1-2', name: 'Сплит 1-2', slots: 3, desc: 'Одно большое слева, два поменьше справа' },
  { id: 'merge-2-1', name: 'Сплит 2-1', slots: 3, desc: 'Два сверху, одно объединенное снизу' },
];

export { LAYOUT_OPTIONS };

export default function ImageSlotsSection({
  imageLayoutType,
  setImageLayoutType,
  renderLayoutPreview,
  fileInputRef,
  handleFileChange,
  cropperNode,
  additionalImages,
  setAdditionalImages,
  extraImagesInputRef,
}: ImageSlotsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sky-400 text-sm">⊞</span>
        <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Макет изображений</label>
      </div>

      {/* Layout selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {LAYOUT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setImageLayoutType(opt.id)}
            className={cn(
              "p-3 bg-zinc-900 border rounded-2xl text-left transition-all hover:border-zinc-700 flex flex-col gap-2 cursor-pointer",
              imageLayoutType === opt.id ? "border-sky-400 bg-sky-400/5 ring-1 ring-sky-400" : "border-zinc-800"
            )}
            title={opt.desc}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">{opt.name}</span>
            </div>
            {/* Mini visual diagram */}
            <div className="h-10 w-full bg-zinc-950 rounded-lg p-1 flex gap-0.5 border border-zinc-800/80">
              {opt.id === 'single' && <div className="w-full h-full bg-zinc-800 rounded border border-zinc-700/30" />}
              {opt.id === 'slider' && (
                <div className="w-full h-full relative rounded overflow-hidden border border-zinc-700/30 flex">
                  <div className="w-1/2 h-full bg-zinc-800 border-r border-zinc-900" />
                  <div className="w-1/2 h-full bg-zinc-700" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/70 -translate-x-1/2" />
                </div>
              )}
              {opt.id === 'split-vertical' && (
                <div className="w-full h-full flex flex-col gap-0.5">
                  <div className="flex-1 bg-zinc-800 rounded border border-zinc-700/30" />
                  <div className="flex-1 bg-zinc-700 rounded border border-zinc-700/30" />
                </div>
              )}
              {opt.id === 'split-horizontal' && (
                <div className="w-full h-full flex gap-0.5">
                  <div className="flex-1 bg-zinc-800 rounded border border-zinc-700/30" />
                  <div className="flex-1 bg-zinc-700 rounded border border-zinc-700/30" />
                </div>
              )}
              {opt.id === 'split-1-2' && (
                <div className="w-full h-full flex gap-0.5">
                  <div className="w-1/2 bg-zinc-800 rounded border border-zinc-700/30" />
                  <div className="w-1/2 flex flex-col gap-0.5">
                    <div className="flex-1 bg-zinc-700 rounded border border-zinc-700/30" />
                    <div className="flex-1 bg-zinc-600 rounded border border-zinc-700/30" />
                  </div>
                </div>
              )}
              {opt.id === 'merge-2-1' && (
                <div className="w-full h-full flex flex-col gap-0.5">
                  <div className="flex-1 flex gap-0.5">
                    <div className="flex-1 bg-zinc-800 rounded border border-zinc-700/30" />
                    <div className="flex-1 bg-zinc-700 rounded border border-zinc-700/30" />
                  </div>
                  <div className="flex-1 bg-zinc-600 rounded border border-zinc-700/30" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Interactive Layout Preview */}
      <div className="p-6 bg-zinc-950/40 border border-zinc-900 rounded-[2rem] space-y-4">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Макет (нажмите для загрузки / изменения)</span>
        <div className="w-full">{renderLayoutPreview(null)}</div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Cropper modal */}
      {cropperNode}

      {/* Extra images */}
      <div className="space-y-4 border-t border-zinc-900 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Ещё примеры к промпту</label>
            <p className="text-xs text-zinc-500">Дополнительные референсные изображения (без сетки макета)</p>
          </div>
          <button type="button" onClick={() => extraImagesInputRef.current?.click()}
            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 uppercase tracking-widest cursor-pointer">
            + Добавить файлы
          </button>
        </div>
        <input
          ref={extraImagesInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (!files?.length) return;
            Array.from(files).forEach((file) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const url = ev.target?.result as string;
                if (url) setAdditionalImages((prev) => [...prev, url]);
              };
              reader.readAsDataURL(file);
            });
            e.target.value = '';
          }}
        />
        {additionalImages.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {additionalImages.map((src, i) => (
              <div key={i} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-zinc-800">
                <img src={src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => setAdditionalImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 p-1 bg-black/70 rounded-lg text-white hover:bg-red-600 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

