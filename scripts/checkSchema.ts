/**
 * Удаляет дубликаты категорий из Supabase — оставляет только первую запись для каждого уникального имени.
 */
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const { data: cats } = await supabase
  .from('categories')
  .select('id, name, user_id')
  .order('name');

if (!cats) { console.log('No data'); process.exit(1); }

console.log('Total before:', cats.length);

// Группируем по name — оставляем первый, удаляем остальные
const seen = new Map<string, string>(); // name → first_id
const toDelete: string[] = [];

for (const cat of cats) {
  const key = `${cat.name}::${cat.user_id}`;
  if (seen.has(key)) {
    toDelete.push(cat.id);
  } else {
    seen.set(key, cat.id);
  }
}

console.log('Duplicates to delete:', toDelete.length);

if (toDelete.length > 0) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .in('id', toDelete);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ Deleted', toDelete.length, 'duplicates');
  }
}

// Финальная проверка
const { data: after } = await supabase.from('categories').select('name').order('name');
console.log('\nCategories after fix:');
after?.forEach((c: any) => console.log(' ', c.name));
