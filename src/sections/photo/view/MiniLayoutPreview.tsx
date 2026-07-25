import { cn } from '../../../utils/cn';

interface MiniLayoutPreviewProps {
  layout: string;
  imageBefore?: string;
  imageAfter?: string;
  additionalImages?: string[];
}

export default function MiniLayoutPreview({
  layout,
  imageBefore,
  imageAfter,
  additionalImages,
}: MiniLayoutPreviewProps) {
  const hasBefore = !!imageBefore;
  const hasAfter = !!imageAfter;
  const hasAdd = additionalImages && additionalImages.length > 0 && !!additionalImages[0];

  if (!hasBefore && !hasAfter && !hasAdd) return null;

  const img1 = imageBefore || imageAfter || additionalImages?.[0];
  const img2 = imageAfter || imageBefore;
  const img3 = additionalImages?.[0] || imageAfter;

  return (
    <div className="w-16 h-10 bg-zinc-950 rounded-lg overflow-hidden flex gap-0.5 border border-zinc-800 shrink-0">
      {layout === 'single' || (!hasAfter && !hasAdd) ? (
        <img src={img1} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
      ) : layout === 'slider' || layout === 'split-horizontal' ? (
        <>
          <img src={img1} className="w-1/2 h-full object-cover" alt="" referrerPolicy="no-referrer" />
          <img src={img2} className="w-1/2 h-full object-cover" alt="" referrerPolicy="no-referrer" />
        </>
      ) : layout === 'split-vertical' ? (
        <div className="flex flex-col gap-0.5 w-full h-full">
          <img src={img1} className="w-full h-1/2 object-cover" alt="" referrerPolicy="no-referrer" />
          <img src={img2} className="w-full h-1/2 object-cover" alt="" referrerPolicy="no-referrer" />
        </div>
      ) : layout === 'split-1-2' ? (
        <>
          <img src={img1} className="w-1/2 h-full object-cover" alt="" referrerPolicy="no-referrer" />
          <div className="w-1/2 h-full flex flex-col gap-0.5">
            <img src={img2} className="w-full h-1/2 object-cover" alt="" referrerPolicy="no-referrer" />
            <img src={img3} className="w-full h-1/2 object-cover" alt="" referrerPolicy="no-referrer" />
          </div>
        </>
      ) : layout === 'merge-2-1' ? (
        <div className="flex flex-col gap-0.5 w-full h-full">
          <div className="flex-1 flex gap-0.5">
            <img src={img1} className="w-1/2 h-full object-cover" alt="" referrerPolicy="no-referrer" />
            <img src={img2} className="w-1/2 h-full object-cover" alt="" referrerPolicy="no-referrer" />
          </div>
          <img src={img3} className="w-full h-1/2 object-cover" alt="" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <img src={img1} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
      )}
    </div>
  );
}
