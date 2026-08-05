import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const tables = ['users', 'user_favorites', 'prompts', 'skills', 'categories', 'chats'];
for (const t of tables) {
  const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
  console.log(t + ':', error ? 'ERROR: ' + error.message : 'OK (' + count + ' rows)');
}
