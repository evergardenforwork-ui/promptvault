/**
 * Восстанавливает поле category (TEXT) в prompts из firestore-export/prompts.json
 * или из data/prompts.json (если есть).
 * Запуск: npx tsx scripts/fixPromptCategories.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Читаем исходные данные промптов (firestore-export или data/)
const exportFile = path.join(__dirname, '..', 'firestore-export', 'prompts.json');
const dataFile = path.join(__dirname, '..', 'data', 'prompts.json');

const sourceFile = fs.existsSync(dataFile) ? dataFile : exportFile;
console.log(`Using source: ${sourceFile}`);

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// Получаем все промпты из Supabase
const { data: prompts } = await supabase
  .from('prompts')
  .select('id, title, category');

console.log(`\nFound ${prompts?.length || 0} prompts in Supabase`);
console.log(`Found ${Object.keys(sourceData).length} prompts in source JSON`);

// Пытаемся сматчить по title (т.к. ID разные — Supabase UUID vs старый строковый)
let updated = 0;
let notFound = 0;

for (const prompt of (prompts || [])) {
  if (prompt.category && prompt.category !== '') {
    continue; // уже заполнено
  }

  // Ищем в source по title
  const match = Object.values(sourceData).find(
    (p: any) => p.title === prompt.title
  ) as any;

  if (match && match.category) {
    const { error } = await supabase
      .from('prompts')
      .update({ category: match.category })
      .eq('id', prompt.id);

    if (error) {
      console.error(`  ❌ "${prompt.title}": ${error.message}`);
    } else {
      console.log(`  ✅ "${prompt.title?.slice(0, 30)}" → "${match.category}"`);
      updated++;
    }
  } else {
    console.log(`  ⚠️  No match for: "${prompt.title?.slice(0, 30)}"`);
    notFound++;
  }
}

console.log(`\n✅ Updated: ${updated}, Not found: ${notFound}`);
