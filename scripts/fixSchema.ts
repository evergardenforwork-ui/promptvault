/**
 * Адаптирует схему Supabase под наш кастомный auth (uid = TEXT, не UUID).
 * Выполняет ALTER TABLE для смены типов user_id UUID → TEXT там где нужно.
 * 
 * ЗАПУСК: npx tsx scripts/fixSchema.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Выполняем SQL через fetch напрямую к Supabase REST/SQL endpoint
async function runSQL(sql: string, description: string) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ ${description}: ${text}`);
    return false;
  }
  console.log(`✅ ${description}`);
  return true;
}

// Стратегия: меняем user_id в categories и prompts с UUID на TEXT
// Это позволит хранить и 'admin-uid' и UUID-подобные строки

console.log('🔧 Fixing schema: converting UUID user_id columns to TEXT...\n');

const migrations = [
  // categories: user_id UUID → TEXT  
  `ALTER TABLE public.categories ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`,
  // prompts: user_id UUID → TEXT
  `ALTER TABLE public.prompts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`,
  // skills: user_id UUID → TEXT (на случай если там тоже UUID)
  `ALTER TABLE public.skills ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`,
  // chats: user_id UUID → TEXT
  `ALTER TABLE public.chats ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`,
];

for (const [i, sql] of migrations.entries()) {
  await runSQL(sql, `Migration ${i + 1}: ${sql.slice(0, 60)}...`);
}

// После миграции: проставляем admin-uid для промптов без user_id
const { error: updateErr } = await supabase
  .from('prompts')
  .update({ user_id: 'admin-uid' })
  .is('user_id', null);

if (updateErr) {
  console.error('❌ Failed to update null user_ids in prompts:', updateErr.message);
} else {
  console.log('✅ Updated null user_ids in prompts → admin-uid');
}

// То же для categories
const { error: catUpdateErr } = await supabase
  .from('categories')
  .update({ user_id: 'admin-uid' })
  .is('user_id', null);

if (catUpdateErr) {
  console.error('❌ Failed to update null user_ids in categories:', catUpdateErr.message);
} else {
  console.log('✅ Updated null user_ids in categories → admin-uid');
}

console.log('\n🎉 Schema fix complete!');
