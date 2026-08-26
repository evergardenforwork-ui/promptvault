import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { DbAdapter } from './dbAdapter.ts';
import { getImageBuffer } from './mediaStorage.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

export async function createFullBackupZip(db: DbAdapter, workspaceId?: string | null): Promise<{ buffer: Buffer; filename: string }> {
  const data = await db.getAllDataForExport(workspaceId);
  const zip = new AdmZip();

  let imgCounter = 0;
  const urlToZipPathMap = new Map<string, string>();

  async function processImageReference(imgRef: string | null | undefined): Promise<string | null | undefined> {
    if (!imgRef || typeof imgRef !== 'string') return imgRef;
    if (imgRef.startsWith('data:image/svg+xml')) return imgRef; // keep inline SVGs

    if (urlToZipPathMap.has(imgRef)) {
      return urlToZipPathMap.get(imgRef)!;
    }

    const imgData = await getImageBuffer(imgRef);
    if (!imgData) return imgRef; // keep original if download failed

    imgCounter++;
    const zipImgName = `img_${Date.now()}_${imgCounter}.${imgData.ext}`;
    const zipImgPath = `images/${zipImgName}`;

    zip.addFile(zipImgPath, imgData.buffer);
    urlToZipPathMap.set(imgRef, zipImgPath);

    return zipImgPath;
  }

  // Process prompts images
  if (Array.isArray(data.prompts)) {
    for (const p of data.prompts) {
      if (p.image_before) p.image_before = await processImageReference(p.image_before);
      if (p.image_after) p.image_after = await processImageReference(p.image_after);
      if (p.original_image_before) p.original_image_before = await processImageReference(p.original_image_before);
      if (p.original_image_after) p.original_image_after = await processImageReference(p.original_image_after);
      if (p.original_image_slot2) p.original_image_slot2 = await processImageReference(p.original_image_slot2);

      let addImgs = p.additional_images;
      if (typeof addImgs === 'string') {
        try { addImgs = JSON.parse(addImgs); } catch {}
      }
      if (Array.isArray(addImgs)) {
        const newAddImgs = [];
        for (const img of addImgs) {
          newAddImgs.push(await processImageReference(img));
        }
        p.additional_images = newAddImgs;
      }
    }
  }

  // Process Git projects images
  if (Array.isArray(data.git_projects)) {
    for (const g of data.git_projects) {
      if (g.image) g.image = await processImageReference(g.image);
    }
  }

  // Process Bookmarks images
  if (Array.isArray(data.bookmarks)) {
    for (const b of data.bookmarks) {
      if (b.image) b.image = await processImageReference(b.image);
      if (b.favicon) b.favicon = await processImageReference(b.favicon);
      if (b.favicon_url) b.favicon_url = await processImageReference(b.favicon_url);
    }
  }

  // Add JSON files to ZIP
  for (const [tableName, rows] of Object.entries(data)) {
    zip.addFile(`${tableName}.json`, Buffer.from(JSON.stringify(rows || [], null, 2), 'utf8'));
  }

  const wsName = workspaceId && data.workspaces?.[0]?.name ? `_${data.workspaces[0].name.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_')}` : '';
  const filename = `promptvault_backup${wsName}_${Date.now()}.zip`;

  return {
    buffer: zip.toBuffer(),
    filename,
  };
}

export async function processImportZip(
  db: DbAdapter,
  zipBuffer: Buffer,
  options?: { targetUserId?: string; claimOwnership?: boolean }
): Promise<{ message: string; importedCount: number }> {
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const zipPathToTargetUrlMap = new Map<string, string>();

  // Extract all images first
  for (const entry of zipEntries) {
    if (entry.entryName.startsWith('images/') && !entry.isDirectory) {
      const fileName = path.basename(entry.entryName);
      const imgBuffer = entry.getData();

      if (db.isLocal) {
        const targetPath = path.join(IMAGES_DIR, fileName);
        fs.writeFileSync(targetPath, imgBuffer);
        const targetUrl = `/uploads/images/${fileName}`;
        zipPathToTargetUrlMap.set(entry.entryName, targetUrl);
        zipPathToTargetUrlMap.set(fileName, targetUrl);
      } else if (db.supabase) {
        try {
          const ext = path.extname(fileName).replace('.', '') || 'jpg';
          const { error } = await db.supabase.storage
            .from('prompt-images')
            .upload(fileName, imgBuffer, {
              contentType: `image/${ext}`,
              upsert: true,
            });

          if (!error) {
            const { data } = db.supabase.storage.from('prompt-images').getPublicUrl(fileName);
            zipPathToTargetUrlMap.set(entry.entryName, data.publicUrl);
            zipPathToTargetUrlMap.set(fileName, data.publicUrl);
          }
        } catch (uploadErr) {
          console.error('Failed to upload imported image to Supabase:', uploadErr);
        }
      }
    }
  }

  function resolveImgUrl(url: any): any {
    if (!url || typeof url !== 'string') return url;
    if (zipPathToTargetUrlMap.has(url)) return zipPathToTargetUrlMap.get(url)!;
    const baseName = path.basename(url);
    if (zipPathToTargetUrlMap.has(baseName)) return zipPathToTargetUrlMap.get(baseName)!;
    return url;
  }

  const tablesToImport: Record<string, any[]> = {};
  let totalItemsCount = 0;
  const shouldClaim = options?.claimOwnership !== false && Boolean(options?.targetUserId);

  for (const entry of zipEntries) {
    if (entry.entryName.endsWith('.json')) {
      const tableName = entry.entryName.replace('.json', '');
      const content = entry.getData().toString('utf8');
      try {
        const rows = JSON.parse(content);
        if (Array.isArray(rows)) {
          // Replace image references in rows
          for (const row of rows) {
            if (row.image_before) row.image_before = resolveImgUrl(row.image_before);
            if (row.image_after) row.image_after = resolveImgUrl(row.image_after);
            if (row.original_image_before) row.original_image_before = resolveImgUrl(row.original_image_before);
            if (row.original_image_after) row.original_image_after = resolveImgUrl(row.original_image_after);
            if (row.original_image_slot2) row.original_image_slot2 = resolveImgUrl(row.original_image_slot2);
            if (row.image) row.image = resolveImgUrl(row.image);
            if (row.favicon) row.favicon = resolveImgUrl(row.favicon);
            if (row.favicon_url) row.favicon_url = resolveImgUrl(row.favicon_url);

            let addImgs = row.additional_images;
            if (typeof addImgs === 'string') {
              try { addImgs = JSON.parse(addImgs); } catch {}
            }
            if (Array.isArray(addImgs)) {
              row.additional_images = addImgs.map(resolveImgUrl);
            }

            // 👑 Auto-Claim Ownership for imported items
            if (shouldClaim && options?.targetUserId) {
              if (tableName !== 'users') {
                row.user_id = options.targetUserId;
              }
            }
          }

          tablesToImport[tableName] = rows;
          if (tableName !== 'users') totalItemsCount += rows.length;
        }
      } catch (err) {
        console.warn(`Could not parse JSON table ${entry.entryName}:`, err);
      }
    }
  }

  await db.importAllData(tablesToImport);

  const claimMsg = shouldClaim ? ' и привязаны к вашему профилю' : '';
  return { 
    message: `Импорт бэкапа успешно завершен (${totalItemsCount} объектов загружено${claimMsg})`,
    importedCount: totalItemsCount
  };
}
