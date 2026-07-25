import React, { useState, useRef } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  id: string;
}

export default function ImageUpload({ label, value, onChange, id }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <div 
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        className={`relative h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden ${
          dragging ? "border-sky-400 bg-sky-400/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
        } ${value ? "border-none" : ""}`}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="text-white" size={24} />
            </div>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-zinc-800 text-zinc-400">
              <Plus size={20} />
            </div>
            <span className="text-xs text-zinc-500">Перетащите сюда или нажмите</span>
          </>
        )}
        <input 
          ref={inputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
