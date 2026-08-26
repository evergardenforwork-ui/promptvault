import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const PACKAGES_DIR = path.join(UPLOADS_DIR, 'packages');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(PACKAGES_DIR)) fs.mkdirSync(PACKAGES_DIR, { recursive: true });

export function isLocalEngine(): boolean {
  const mode = process.env.DB_MODE?.toLowerCase();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (mode === 'local' || mode === 'sqlite') return true;
  if (!url || !key || url.includes('placeholder')) return true;
  return false;
}

export async function saveMediaImage(
  dataUrlOrUrl: string | null | undefined,
  prefix: string,
  supabase?: any
): Promise<string | null> {
  if (!dataUrlOrUrl) return null;
  if (!dataUrlOrUrl.startsWith('data:image/')) return dataUrlOrUrl;

  const matches = dataUrlOrUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) return dataUrlOrUrl;

  const rawExt = matches[1].toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.includes('svg') ? 'svg' : rawExt;
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${prefix}_${Date.now()}.${ext}`;

  if (isLocalEngine() || !supabase) {
    const filePath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/images/${filename}`;
  } else {
    try {
      const { error } = await supabase.storage
        .from('prompt-images')
        .upload(filename, buffer, {
          contentType: `image/${matches[1]}`,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return dataUrlOrUrl; // fallback
      }

      const { data } = supabase.storage.from('prompt-images').getPublicUrl(filename);
      return data.publicUrl;
    } catch (err) {
      console.error('Storage upload exception:', err);
      return dataUrlOrUrl;
    }
  }
}

export async function getImageBuffer(imgRef: string): Promise<{ buffer: Buffer; ext: string } | null> {
  if (!imgRef || typeof imgRef !== 'string') return null;

  try {
    if (imgRef.startsWith('data:image/')) {
      const matches = imgRef.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        return { buffer: Buffer.from(matches[2], 'base64'), ext };
      }
    } else if (imgRef.startsWith('/uploads/')) {
      const cleanPath = imgRef.replace(/^\/uploads\//, '');
      const localPath = path.join(UPLOADS_DIR, cleanPath);
      if (fs.existsSync(localPath)) {
        const ext = path.extname(localPath).replace('.', '') || 'jpg';
        return { buffer: fs.readFileSync(localPath), ext };
      }
    } else if (imgRef.startsWith('http://') || imgRef.startsWith('https://')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(imgRef, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const contentType = res.headers.get('content-type') || '';
          let ext = 'jpg';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('gif')) ext = 'gif';
          else if (contentType.includes('svg')) ext = 'svg';
          return { buffer: Buffer.from(arrayBuffer), ext };
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
      }
    }
  } catch (e) {
    console.warn(`Could not extract image buffer for ${imgRef}:`, e);
  }
  return null;
}
