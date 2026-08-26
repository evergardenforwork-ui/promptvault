import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const PACKAGES_DIR = path.join(UPLOADS_DIR, 'packages');
const DB_PATH = path.join(DATA_DIR, 'promptvault.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(PACKAGES_DIR)) fs.mkdirSync(PACKAGES_DIR, { recursive: true });

export const localDb = new Database(DB_PATH);
localDb.pragma('journal_mode = WAL');
localDb.pragma('foreign_keys = ON');

export function initLocalDatabase() {
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT 'sky-400',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT DEFAULT '',
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      main_prompt TEXT DEFAULT '',
      usage_notes TEXT DEFAULT '',
      media_type TEXT DEFAULT 'photo',
      prompt_origin TEXT DEFAULT 'own',
      is_public INTEGER DEFAULT 0,
      image_layout_type TEXT DEFAULT 'single',
      image_before TEXT,
      image_after TEXT,
      original_image_before TEXT,
      original_image_after TEXT,
      original_image_slot2 TEXT,
      additional_images TEXT DEFAULT '[]',
      file_package_url TEXT,
      file_structure TEXT DEFAULT '[]',
      sub_sections TEXT DEFAULT '[]',
      workspace_id TEXT,
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      skill_types TEXT DEFAULT '[]',
      target_ais TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      file_structure TEXT DEFAULT '[]',
      file_package_url TEXT,
      is_public INTEGER DEFAULT 0,
      skill_origin TEXT DEFAULT 'own',
      workspace_id TEXT,
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_hints (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS git_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'tools',
      summary TEXT DEFAULT '',
      features TEXT,
      detailed_description TEXT,
      install_command TEXT,
      author_notes TEXT,
      github_url TEXT,
      demo_url TEXT,
      image TEXT,
      tags TEXT DEFAULT '[]',
      pricing TEXT DEFAULT 'free',
      is_public INTEGER DEFAULT 1,
      workspace_id TEXT,
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS commands (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      command_text TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      skill_id TEXT,
      skill_title TEXT,
      target_ai TEXT,
      tags TEXT DEFAULT '[]',
      variables TEXT DEFAULT '[]',
      is_public INTEGER DEFAULT 1,
      workspace_id TEXT,
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      folder TEXT DEFAULT 'Общее',
      category TEXT DEFAULT 'default',
      image TEXT,
      favicon TEXT,
      tags TEXT DEFAULT '[]',
      is_public INTEGER DEFAULT 1,
      workspace_id TEXT,
      author_name TEXT DEFAULT '',
      author_email TEXT DEFAULT '',
      click_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '📁',
      color TEXT DEFAULT 'sky-400',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, item_id, item_type)
    );
  `);

  // Safe schema migrations for existing SQLite databases
  try {
    const colInfo: any[] = localDb.prepare('PRAGMA table_info(bookmarks)').all();
    const colNames = colInfo.map(c => c.name);
    if (!colNames.includes('folder')) {
      localDb.exec("ALTER TABLE bookmarks ADD COLUMN folder TEXT DEFAULT 'Общее'");
    }
    if (!colNames.includes('favicon')) {
      localDb.exec("ALTER TABLE bookmarks ADD COLUMN favicon TEXT");
    }
  } catch {}

  // Seed default admin and default workspace if table is empty
  const userCount = (localDb.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  if (userCount === 0) {
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    localDb.prepare(`
      INSERT INTO users (uid, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-uid', 'admin@promptvault.local', adminPassHash, 'Admin', 'admin');

    // Also insert evergarden admin profile if user prefers using that email
    const evergardenHash = bcrypt.hashSync('admin123', 10);
    localDb.prepare(`
      INSERT INTO users (uid, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-evergarden', 'evergardenforwork@gmail.com', evergardenHash, 'Evergarden', 'admin');

    console.log('✅ Local Database: Seeded default admin users');
  }

  const wsCount = (localDb.prepare('SELECT COUNT(*) as cnt FROM workspaces').get() as any).cnt;
  if (wsCount === 0) {
    localDb.prepare(`
      INSERT INTO workspaces (id, user_id, name, icon, color, is_default)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run('ws-default', 'admin-uid', 'Основное', '💼', 'sky-400');

    console.log('✅ Local Database: Seeded default workspace');
  }
}
