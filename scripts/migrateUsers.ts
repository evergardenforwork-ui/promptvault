/**
 * Скрипт миграции users.json и favorites.json → Supabase
 * Запуск: npx tsx scripts/migrateUsers.ts
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

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');

// ─── Migrate users ───────────────────────────────────────────────────────────

if (fs.existsSync(USERS_FILE)) {
  const usersMap = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const users = Object.values(usersMap) as any[];

  console.log(`\n📦 Migrating ${users.length} users...`);

  for (const u of users) {
    const { error } = await supabase.from('users').upsert({
      uid: u.uid,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role || 'user',
    }, { onConflict: 'uid' });

    if (error) {
      console.error(`  ❌ ${u.email}: ${error.message}`);
    } else {
      console.log(`  ✅ ${u.email} (${u.role})`);
    }
  }
} else {
  // Создаём дефолтного admin если файл не существует
  console.log('\n⚠️  users.json not found — creating default admin from .env...');
  const adminEmail = process.env.ADMIN_EMAIL || 'alexey.unstam@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Импортируем bcrypt
  const bcrypt = await import('bcryptjs');
  const hashed = bcrypt.hashSync(adminPassword, 10);

  const { error } = await supabase.from('users').upsert({
    uid: 'admin-uid',
    name: 'Admin',
    email: adminEmail,
    password: hashed,
    role: 'admin',
  }, { onConflict: 'uid' });

  if (error) {
    console.error('  ❌ Failed to create admin:', error.message);
  } else {
    console.log(`  ✅ Admin created: ${adminEmail}`);
  }
}

// ─── Migrate favorites ───────────────────────────────────────────────────────

if (fs.existsSync(FAVORITES_FILE)) {
  const favsMap = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
  const rows: any[] = [];

  for (const [userId, favs] of Object.entries(favsMap) as any[]) {
    if (favs.prompts) {
      for (const promptId of favs.prompts) {
        rows.push({ user_id: userId, item_id: promptId, item_type: 'prompt' });
      }
    }
    if (favs.skills) {
      for (const skillId of favs.skills) {
        rows.push({ user_id: userId, item_id: skillId, item_type: 'skill' });
      }
    }
  }

  console.log(`\n📦 Migrating ${rows.length} favorites...`);

  if (rows.length > 0) {
    const { error } = await supabase
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id,item_id,item_type' });

    if (error) {
      console.error('  ❌ Favorites migration failed:', error.message);
    } else {
      console.log(`  ✅ ${rows.length} favorites migrated`);
    }
  } else {
    console.log('  ℹ️  No favorites to migrate');
  }
} else {
  console.log('\nℹ️  favorites.json not found — skipping');
}

console.log('\n🎉 Migration complete!');
