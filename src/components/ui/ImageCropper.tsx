import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Check, Move } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio: number; // width / height
  onSave: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  isOpen,
  imageSrc,
  aspectRatio,
  onSave,
  onCancel,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Store image dimensions
  const [dimensions, setDimensions] = useState({
    boxWidth: 0,
    boxHeight: 0,
    baseWidth: 0,
    baseHeight: 0,
  });

  // Reset state when new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setImgOffset({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Handle image load and calculate layout
  const handleImageLoad = () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;

    const boxWidth = container.clientWidth;
    const boxHeight = container.clientHeight;

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    // Calculate base size to cover the box (CSS background-size: cover equivalent)
    const scaleToCover = Math.max(boxWidth / imgNaturalWidth, boxHeight / imgNaturalHeight);
    const baseWidth = imgNaturalWidth * scaleToCover;
    const baseHeight = imgNaturalHeight * scaleToCover;

    setDimensions({
      boxWidth,
      boxHeight,
      baseWidth,
      baseHeight,
    });

    // Center image initially
    setImgOffset({
      x: (boxWidth - baseWidth) / 2,
      y: (boxHeight - baseHeight) / 2,
    });

    setImgLoaded(true);
  };

  // Run calculation when zoom changes to enforce boundaries
  useEffect(() => {
    if (!imgLoaded) return;

    const zoomedWidth = dimensions.baseWidth * zoom;
    const zoomedHeight = dimensions.baseHeight * zoom;

    setImgOffset((prev) => {
      // Keep inside boundaries
      const minX = dimensions.boxWidth - zoomedWidth;
      const minY = dimensions.boxHeight - zoomedHeight;
      const maxX = 0;
      const maxY = 0;

      return {
        x: Math.max(minX, Math.min(maxX, prev.x)),
        y: Math.max(minY, Math.min(maxY, prev.y)),
      };
    });
  }, [zoom, imgLoaded, dimensions]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imgOffset.x,
      y: e.clientY - imgOffset.y,
    });
    if (imgRef.current) {
      imgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !imgLoaded) return;
    e.preventDefault();

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const zoomedWidth = dimensions.baseWidth * zoom;
    const zoomedHeight = dimensions.baseHeight * zoom;

    // Constraints (boundaries)
    const minX = dimensions.boxWidth - zoomedWidth;
    const minY = dimensions.boxHeight - zoomedHeight;
    const maxX = 0;
    const maxY = 0;

    setImgOffset({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (imgRef.current) {
      imgRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Save/Crop Image on Canvas
  const handleSave = () => {
    if (!imgRef.current || !imgLoaded) return;

    const img = imgRef.current;
    
    // Canvas resolution - fixed high quality (e.g. 1200 width)
    const canvasWidth = 1200;
    const canvasHeight = Math.round(1200 / aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Map crop box dimensions to canvas dimensions
    const ratio = canvasWidth / dimensions.boxWidth;

    const zoomedWidth = dimensions.baseWidth * zoom;
    const zoomedHeight = dimensions.baseHeight * zoom;

    const destX = imgOffset.x * ratio;
    const destY = imgOffset.y * ratio;
    const destWidth = zoomedWidth * ratio;
    const destHeight = zoomedHeight * ratio;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw the image
    ctx.drawImage(img, destX, destY, destWidth, destHeight);

    // Convert to data url
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  if (!isOpen) return null;

  // Compute container dimensions matching aspect ratio
  // Max size is 90% width, 55vh height
  let boxWidth = 600;
  let boxHeight = 600 / aspectRatio;

  if (aspectRatio > 1.2) {
    boxWidth = Math.min(700, window.innerWidth * 0.85);
    boxHeight = boxWidth / aspectRatio;
  } else {
    boxHeight = Math.min(400, window.innerHeight * 0.45);
    boxWidth = boxHeight * aspectRatio;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl overflow-hidden z-10 text-zinc-900 dark:text-zinc-100"
        >
          <div className="flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Редактирование фото</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Настройте обрезку и положение фокуса</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Interactive Crop Box */}
          <div className="flex justify-center items-center bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-900">
            <div
              ref={containerRef}
              style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
              className="relative overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-[#09090b] shadow-inner select-none touch-none"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="To Crop"
                onLoad={handleImageLoad}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: 'absolute',
                  left: `${imgOffset.x}px`,
                  top: `${imgOffset.y}px`,
                  width: imgLoaded ? `${dimensions.baseWidth * zoom}px` : 'auto',
                  height: imgLoaded ? `${dimensions.baseHeight * zoom}px` : 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                }}
                className="pointer-events-auto"
                referrerPolicy="no-referrer"
              />
              {/* Central crosshair overlay for centering */}
              <div className="absolute inset-0 border-2 border-sky-400/20 pointer-events-none rounded-xl" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-sky-400/25 pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sky-400/25 pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-zinc-300 flex items-center gap-1.5 pointer-events-none">
                <Move size={10} />
                <span>Перетащите для смещения центра</span>
              </div>
            </div>
          </div>

          {/* Zoom Control */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><ZoomOut size={12} /> Масштаб</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                disabled={zoom <= 1}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-sky-400 bg-zinc-200 dark:bg-zinc-900 h-1.5 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                disabled={zoom >= 3}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-bold rounded-2xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-sky-400 text-black font-bold rounded-2xl transition-all shadow-xl shadow-sky-400/25 flex items-center gap-2 hover:opacity-90 cursor-pointer"
            >
              <Check size={18} /> Применить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
