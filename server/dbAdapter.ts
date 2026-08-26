import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { localDb, initLocalDatabase } from './localDb.ts';
import { isLocalEngine } from './mediaStorage.ts';
import bcrypt from 'bcryptjs';

export interface DbAdapter {
  isLocal: boolean;
  supabase?: any;

  // Workspaces
  getWorkspaces(): Promise<any[]>;
  createWorkspace(data: any): Promise<any>;
  updateWorkspace(id: string, data: any): Promise<any>;
  deleteWorkspace(id: string): Promise<void>;

  // Users & Auth
  findUserByEmail(email: string): Promise<any>;
  findUserByUid(uid: string): Promise<any>;
  getUsers(): Promise<any[]>;
  createUser(data: any): Promise<any>;
  deleteUser(uid: string): Promise<void>;
  updateUserPassword(uid: string, hash: string): Promise<void>;

  // Prompts
  getPrompts(filter?: { limit?: number; offset?: number; workspaceId?: string | null }): Promise<{ items: any[]; total: number; hasMore: boolean }>;
  createPrompt(data: any): Promise<any>;
  updatePrompt(id: string, data: any): Promise<any>;
  deletePrompt(id: string): Promise<void>;

  // Skills
  getSkills(): Promise<any[]>;
  createSkill(data: any): Promise<any>;
  updateSkill(id: string, data: any): Promise<any>;
  deleteSkill(id: string): Promise<void>;

  // Skill Hints
  getSkillHints(skillId: string): Promise<any[]>;
  createSkillHint(skillId: string, data: any): Promise<any>;
  deleteSkillHint(id: string): Promise<void>;

  // Git Projects
  getGitProjects(): Promise<any[]>;
  createGitProject(data: any): Promise<any>;
  updateGitProject(id: string, data: any): Promise<any>;
  deleteGitProject(id: string): Promise<void>;

  // Commands
  getCommands(): Promise<any[]>;
  createCommand(data: any): Promise<any>;
  updateCommand(id: string, data: any): Promise<any>;
  deleteCommand(id: string): Promise<void>;
  useCommand(id: string): Promise<{ usage_count: number }>;

  // Bookmarks
  getBookmarks(): Promise<any[]>;
  createBookmark(data: any): Promise<any>;
  updateBookmark(id: string, data: any): Promise<any>;
  deleteBookmark(id: string): Promise<void>;
  clickBookmark(id: string): Promise<{ click_count: number }>;

  // Categories
  getCategories(): Promise<any[]>;
  createCategory(data: any): Promise<any>;
  deleteCategory(id: string): Promise<void>;

  // Favorites
  getFavorites(userId: string): Promise<{ prompts: string[]; skills: string[]; gitProjects: string[]; commands: string[]; bookmarks: string[] }>;
  toggleFavorite(userId: string, itemId: string, itemType: string): Promise<{ added: boolean }>;

  // Chats
  getChats(promptId: string): Promise<any[]>;
  createChatMessage(data: any): Promise<any>;
  clearChats(promptId: string): Promise<void>;

  // Backup
  getAllDataForExport(workspaceId?: string | null): Promise<Record<string, any[]>>;
  importAllData(tables: Record<string, any[]>): Promise<void>;
}

// ─── SQLITE ADAPTER IMPLEMENTATION ──────────────────────────────────────────

class SqliteAdapter implements DbAdapter {
  isLocal = true;

  constructor() {
    initLocalDatabase();
  }

  // Helper to parse JSON fields from DB
  private parseRow(row: any, jsonFields: string[]) {
    if (!row) return row;
    const res = { ...row };
    for (const f of jsonFields) {
      if (res[f] && typeof res[f] === 'string') {
        try {
          res[f] = JSON.parse(res[f]);
        } catch {
          // keep as is
        }
      }
    }
    return res;
  }

  // Workspaces
  async getWorkspaces(): Promise<any[]> {
    return localDb.prepare('SELECT * FROM workspaces ORDER BY created_at ASC').all();
  }

  async createWorkspace(data: any): Promise<any> {
    const id = data.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO workspaces (id, user_id, name, icon, color, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.user_id, data.name, data.icon || '📁', data.color || 'sky-400', data.is_default ? 1 : 0);

    return localDb.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
  }

  async updateWorkspace(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
    if (!existing) throw new Error('Пространство не найдено');

    const name = data.name !== undefined ? data.name : existing.name;
    const icon = data.icon !== undefined ? data.icon : existing.icon;
    const color = data.color !== undefined ? data.color : existing.color;

    localDb.prepare(`
      UPDATE workspaces SET name = ?, icon = ?, color = ? WHERE id = ?
    `).run(name, icon, color, id);

    return localDb.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
  }

  async deleteWorkspace(id: string): Promise<void> {
    localDb.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  }

  // Users & Auth
  async findUserByEmail(email: string): Promise<any> {
    return localDb.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  }

  async findUserByUid(uid: string): Promise<any> {
    return localDb.prepare('SELECT uid, email, name, role, created_at FROM users WHERE uid = ?').get(uid);
  }

  async getUsers(): Promise<any[]> {
    return localDb.prepare('SELECT uid, email, name, role, created_at FROM users ORDER BY created_at ASC').all();
  }

  async createUser(data: any): Promise<any> {
    const uid = data.uid || `u-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const hash = bcrypt.hashSync(data.password, 10);
    localDb.prepare(`
      INSERT INTO users (uid, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(uid, data.email, hash, data.name, data.role || 'user');

    return { uid, email: data.email, name: data.name, role: data.role || 'user' };
  }

  async deleteUser(uid: string): Promise<void> {
    localDb.prepare('DELETE FROM users WHERE uid = ?').run(uid);
  }

  async updateUserPassword(uid: string, hash: string): Promise<void> {
    localDb.prepare('UPDATE users SET password = ? WHERE uid = ?').run(hash, uid);
  }

  // Prompts
  async getPrompts(filter?: { limit?: number; offset?: number; workspaceId?: string | null }): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    let query = 'SELECT * FROM prompts';
    const params: any[] = [];

    if (filter?.workspaceId) {
      query += ' WHERE workspace_id = ?';
      params.push(filter.workspaceId);
    }

    query += ' ORDER BY created_at DESC';

    const countStmt = filter?.workspaceId
      ? localDb.prepare('SELECT COUNT(*) as cnt FROM prompts WHERE workspace_id = ?').get(filter.workspaceId)
      : localDb.prepare('SELECT COUNT(*) as cnt FROM prompts').get();
    const total = (countStmt as any)?.cnt || 0;

    if (filter?.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filter.limit, filter.offset || 0);
    }

    const rows = localDb.prepare(query).all(...params);
    const jsonFields = ['tags', 'additional_images', 'file_structure', 'sub_sections'];
    const items = rows.map(r => this.parseRow(r, jsonFields));

    return {
      items,
      total,
      hasMore: filter?.limit ? (filter.offset || 0) + items.length < total : false,
    };
  }

  async createPrompt(data: any): Promise<any> {
    const id = data.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO prompts (
        id, user_id, title, category, tags, main_prompt, usage_notes, media_type,
        prompt_origin, is_public, image_layout_type, image_before, image_after,
        original_image_before, original_image_after, original_image_slot2,
        additional_images, file_package_url, file_structure, sub_sections,
        workspace_id, author_name, author_email, usage_count
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      id,
      data.user_id,
      data.title,
      data.category || '',
      JSON.stringify(data.tags || []),
      data.main_prompt || '',
      data.usage_notes || '',
      data.media_type || 'photo',
      data.prompt_origin || 'own',
      data.is_public ? 1 : 0,
      data.image_layout_type || 'single',
      data.image_before || null,
      data.image_after || null,
      data.original_image_before || null,
      data.original_image_after || null,
      data.original_image_slot2 || null,
      JSON.stringify(data.additional_images || []),
      data.file_package_url || null,
      JSON.stringify(data.file_structure || []),
      JSON.stringify(data.sub_sections || []),
      data.workspace_id || null,
      data.author_name || '',
      data.author_email || '',
      data.usage_count || 0
    );

    const row = localDb.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
    return this.parseRow(row, ['tags', 'additional_images', 'file_structure', 'sub_sections']);
  }

  async updatePrompt(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
    if (!existing) throw new Error('Промпт не найден');

    const updateFields = {
      title: data.title ?? existing.title,
      category: data.category ?? existing.category,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      main_prompt: data.main_prompt ?? existing.main_prompt,
      usage_notes: data.usage_notes ?? existing.usage_notes,
      media_type: data.media_type ?? existing.media_type,
      prompt_origin: data.prompt_origin ?? existing.prompt_origin,
      is_public: data.is_public !== undefined ? (data.is_public ? 1 : 0) : existing.is_public,
      image_layout_type: data.image_layout_type ?? existing.image_layout_type,
      image_before: data.image_before !== undefined ? data.image_before : existing.image_before,
      image_after: data.image_after !== undefined ? data.image_after : existing.image_after,
      original_image_before: data.original_image_before !== undefined ? data.original_image_before : existing.original_image_before,
      original_image_after: data.original_image_after !== undefined ? data.original_image_after : existing.original_image_after,
      original_image_slot2: data.original_image_slot2 !== undefined ? data.original_image_slot2 : existing.original_image_slot2,
      additional_images: data.additional_images !== undefined ? JSON.stringify(data.additional_images) : existing.additional_images,
      file_package_url: data.file_package_url !== undefined ? data.file_package_url : existing.file_package_url,
      file_structure: data.file_structure !== undefined ? JSON.stringify(data.file_structure) : existing.file_structure,
      sub_sections: data.sub_sections !== undefined ? JSON.stringify(data.sub_sections) : existing.sub_sections,
      workspace_id: data.workspace_id !== undefined ? data.workspace_id : existing.workspace_id,
      author_name: data.author_name ?? existing.author_name,
      author_email: data.author_email ?? existing.author_email,
      usage_count: data.usage_count ?? existing.usage_count,
    };

    localDb.prepare(`
      UPDATE prompts SET
        title = ?, category = ?, tags = ?, main_prompt = ?, usage_notes = ?,
        media_type = ?, prompt_origin = ?, is_public = ?, image_layout_type = ?,
        image_before = ?, image_after = ?, original_image_before = ?,
        original_image_after = ?, original_image_slot2 = ?, additional_images = ?,
        file_package_url = ?, file_structure = ?, sub_sections = ?,
        workspace_id = ?, author_name = ?, author_email = ?, usage_count = ?
      WHERE id = ?
    `).run(
      updateFields.title,
      updateFields.category,
      updateFields.tags,
      updateFields.main_prompt,
      updateFields.usage_notes,
      updateFields.media_type,
      updateFields.prompt_origin,
      updateFields.is_public,
      updateFields.image_layout_type,
      updateFields.image_before,
      updateFields.image_after,
      updateFields.original_image_before,
      updateFields.original_image_after,
      updateFields.original_image_slot2,
      updateFields.additional_images,
      updateFields.file_package_url,
      updateFields.file_structure,
      updateFields.sub_sections,
      updateFields.workspace_id,
      updateFields.author_name,
      updateFields.author_email,
      updateFields.usage_count,
      id
    );

    const row = localDb.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
    return this.parseRow(row, ['tags', 'additional_images', 'file_structure', 'sub_sections']);
  }

  async deletePrompt(id: string): Promise<void> {
    localDb.prepare('DELETE FROM prompts WHERE id = ?').run(id);
    localDb.prepare("DELETE FROM user_favorites WHERE item_id = ? AND item_type = 'prompt'").run(id);
    localDb.prepare('DELETE FROM chats WHERE prompt_id = ?').run(id);
  }

  // Skills
  async getSkills(): Promise<any[]> {
    const rows = localDb.prepare('SELECT * FROM skills ORDER BY created_at DESC').all();
    const jsonFields = ['skill_types', 'target_ais', 'tags', 'file_structure'];
    return rows.map(r => this.parseRow(r, jsonFields));
  }

  async createSkill(data: any): Promise<any> {
    const id = data.id || `s-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO skills (
        id, user_id, title, description, category, skill_types, target_ais,
        tags, file_structure, file_package_url, is_public, skill_origin,
        workspace_id, author_name, author_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id,
      data.title,
      data.description || '',
      data.category || '',
      JSON.stringify(data.skill_types || []),
      JSON.stringify(data.target_ais || []),
      JSON.stringify(data.tags || []),
      JSON.stringify(data.file_structure || []),
      data.file_package_url || null,
      data.is_public ? 1 : 0,
      data.skill_origin || 'own',
      data.workspace_id || null,
      data.author_name || '',
      data.author_email || ''
    );

    const row = localDb.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    return this.parseRow(row, ['skill_types', 'target_ais', 'tags', 'file_structure']);
  }

  async updateSkill(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    if (!existing) throw new Error('Скилл не найден');

    localDb.prepare(`
      UPDATE skills SET
        title = ?, description = ?, category = ?, skill_types = ?,
        target_ais = ?, tags = ?, file_structure = ?, file_package_url = ?,
        is_public = ?, skill_origin = ?, workspace_id = ?,
        author_name = ?, author_email = ?
      WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.description ?? existing.description,
      data.category ?? existing.category,
      data.skill_types !== undefined ? JSON.stringify(data.skill_types) : existing.skill_types,
      data.target_ais !== undefined ? JSON.stringify(data.target_ais) : existing.target_ais,
      data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      data.file_structure !== undefined ? JSON.stringify(data.file_structure) : existing.file_structure,
      data.file_package_url !== undefined ? data.file_package_url : existing.file_package_url,
      data.is_public !== undefined ? (data.is_public ? 1 : 0) : existing.is_public,
      data.skill_origin ?? existing.skill_origin,
      data.workspace_id !== undefined ? data.workspace_id : existing.workspace_id,
      data.author_name ?? existing.author_name,
      data.author_email ?? existing.author_email,
      id
    );

    const row = localDb.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    return this.parseRow(row, ['skill_types', 'target_ais', 'tags', 'file_structure']);
  }

  async deleteSkill(id: string): Promise<void> {
    localDb.prepare('DELETE FROM skills WHERE id = ?').run(id);
    localDb.prepare('DELETE FROM skill_hints WHERE skill_id = ?').run(id);
    localDb.prepare("DELETE FROM user_favorites WHERE item_id = ? AND item_type = 'skill'").run(id);
  }

  // Skill Hints
  async getSkillHints(skillId: string): Promise<any[]> {
    return localDb.prepare('SELECT * FROM skill_hints WHERE skill_id = ? ORDER BY created_at ASC').all(skillId);
  }

  async createSkillHint(skillId: string, data: any): Promise<any> {
    const id = data.id || `sh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO skill_hints (id, skill_id, user_id, title, text)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, skillId, data.user_id, data.title, data.text);

    return localDb.prepare('SELECT * FROM skill_hints WHERE id = ?').get(id);
  }

  async deleteSkillHint(id: string): Promise<void> {
    localDb.prepare('DELETE FROM skill_hints WHERE id = ?').run(id);
  }

  // Git Projects
  async getGitProjects(): Promise<any[]> {
    const rows = localDb.prepare('SELECT * FROM git_projects ORDER BY created_at DESC').all();
    return rows.map(r => this.parseRow(r, ['tags']));
  }

  async createGitProject(data: any): Promise<any> {
    const id = data.id || `g-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO git_projects (
        id, user_id, title, category, summary, features, detailed_description,
        install_command, author_notes, github_url, demo_url, image, tags,
        pricing, is_public, workspace_id, author_name, author_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id,
      data.title,
      data.category || 'tools',
      data.summary || '',
      data.features || null,
      data.detailed_description || null,
      data.install_command || null,
      data.author_notes || null,
      data.github_url || null,
      data.demo_url || null,
      data.image || null,
      JSON.stringify(data.tags || []),
      data.pricing || 'free',
      data.is_public ? 1 : 0,
      data.workspace_id || null,
      data.author_name || '',
      data.author_email || ''
    );

    const row = localDb.prepare('SELECT * FROM git_projects WHERE id = ?').get(id);
    return this.parseRow(row, ['tags']);
  }

  async updateGitProject(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM git_projects WHERE id = ?').get(id);
    if (!existing) throw new Error('Проект не найден');

    localDb.prepare(`
      UPDATE git_projects SET
        title = ?, category = ?, summary = ?, features = ?,
        detailed_description = ?, install_command = ?, author_notes = ?,
        github_url = ?, demo_url = ?, image = ?, tags = ?, pricing = ?,
        is_public = ?, workspace_id = ?, author_name = ?, author_email = ?
      WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.category ?? existing.category,
      data.summary ?? existing.summary,
      data.features !== undefined ? data.features : existing.features,
      data.detailed_description !== undefined ? data.detailed_description : existing.detailed_description,
      data.install_command !== undefined ? data.install_command : existing.install_command,
      data.author_notes !== undefined ? data.author_notes : existing.author_notes,
      data.github_url !== undefined ? data.github_url : existing.github_url,
      data.demo_url !== undefined ? data.demo_url : existing.demo_url,
      data.image !== undefined ? data.image : existing.image,
      data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      data.pricing ?? existing.pricing,
      data.is_public !== undefined ? (data.is_public ? 1 : 0) : existing.is_public,
      data.workspace_id !== undefined ? data.workspace_id : existing.workspace_id,
      data.author_name ?? existing.author_name,
      data.author_email ?? existing.author_email,
      id
    );

    const row = localDb.prepare('SELECT * FROM git_projects WHERE id = ?').get(id);
    return this.parseRow(row, ['tags']);
  }

  async deleteGitProject(id: string): Promise<void> {
    localDb.prepare('DELETE FROM git_projects WHERE id = ?').run(id);
    localDb.prepare("DELETE FROM user_favorites WHERE item_id = ? AND item_type = 'git_project'").run(id);
  }

  // Commands
  async getCommands(): Promise<any[]> {
    const rows = localDb.prepare('SELECT * FROM commands ORDER BY created_at DESC').all();
    return rows.map(r => this.parseRow(r, ['tags', 'variables']));
  }

  async createCommand(data: any): Promise<any> {
    const id = data.id || `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO commands (
        id, user_id, title, command_text, description, category, skill_id,
        skill_title, target_ai, tags, variables, is_public, workspace_id,
        author_name, author_email, usage_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id,
      data.title,
      data.command_text,
      data.description || null,
      data.category || 'general',
      data.skill_id || null,
      data.skill_title || null,
      data.target_ai || null,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.variables || []),
      data.is_public ? 1 : 0,
      data.workspace_id || null,
      data.author_name || '',
      data.author_email || '',
      0
    );

    const row = localDb.prepare('SELECT * FROM commands WHERE id = ?').get(id);
    return this.parseRow(row, ['tags', 'variables']);
  }

  async updateCommand(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM commands WHERE id = ?').get(id);
    if (!existing) throw new Error('Команда не найдена');

    localDb.prepare(`
      UPDATE commands SET
        title = ?, command_text = ?, description = ?, category = ?,
        skill_id = ?, skill_title = ?, target_ai = ?, tags = ?,
        variables = ?, is_public = ?, workspace_id = ?,
        author_name = ?, author_email = ?
      WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.command_text ?? existing.command_text,
      data.description !== undefined ? data.description : existing.description,
      data.category ?? existing.category,
      data.skill_id !== undefined ? data.skill_id : existing.skill_id,
      data.skill_title !== undefined ? data.skill_title : existing.skill_title,
      data.target_ai !== undefined ? data.target_ai : existing.target_ai,
      data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      data.variables !== undefined ? JSON.stringify(data.variables) : existing.variables,
      data.is_public !== undefined ? (data.is_public ? 1 : 0) : existing.is_public,
      data.workspace_id !== undefined ? data.workspace_id : existing.workspace_id,
      data.author_name ?? existing.author_name,
      data.author_email ?? existing.author_email,
      id
    );

    const row = localDb.prepare('SELECT * FROM commands WHERE id = ?').get(id);
    return this.parseRow(row, ['tags', 'variables']);
  }

  async deleteCommand(id: string): Promise<void> {
    localDb.prepare('DELETE FROM commands WHERE id = ?').run(id);
    localDb.prepare("DELETE FROM user_favorites WHERE item_id = ? AND item_type = 'command'").run(id);
  }

  async useCommand(id: string): Promise<{ usage_count: number }> {
    localDb.prepare('UPDATE commands SET usage_count = usage_count + 1 WHERE id = ?').run(id);
    const row: any = localDb.prepare('SELECT usage_count FROM commands WHERE id = ?').get(id);
    return { usage_count: row?.usage_count || 0 };
  }

  // Bookmarks
  async getBookmarks(): Promise<any[]> {
    const rows = localDb.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all();
    return rows.map(r => this.parseRow(r, ['tags']));
  }

  async createBookmark(data: any): Promise<any> {
    const id = data.id || `b-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO bookmarks (
        id, user_id, title, url, favicon_url, image, description,
        category, folder_id, subcategory, tags, is_public, workspace_id,
        author_name, author_email, click_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id,
      data.title,
      data.url,
      data.favicon_url || null,
      data.image || null,
      data.description || null,
      data.category || 'general',
      data.folder_id || 'tools',
      data.subcategory || '',
      JSON.stringify(data.tags || []),
      data.is_public ? 1 : 0,
      data.workspace_id || null,
      data.author_name || '',
      data.author_email || '',
      0
    );

    const row = localDb.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    return this.parseRow(row, ['tags']);
  }

  async updateBookmark(id: string, data: any): Promise<any> {
    const existing: any = localDb.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    if (!existing) throw new Error('Закладка не найдена');

    localDb.prepare(`
      UPDATE bookmarks SET
        title = ?, url = ?, favicon_url = ?, image = ?, description = ?,
        category = ?, folder_id = ?, subcategory = ?, tags = ?,
        is_public = ?, workspace_id = ?, author_name = ?, author_email = ?
      WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.url ?? existing.url,
      data.favicon_url !== undefined ? data.favicon_url : existing.favicon_url,
      data.image !== undefined ? data.image : existing.image,
      data.description !== undefined ? data.description : existing.description,
      data.category ?? existing.category,
      data.folder_id ?? existing.folder_id,
      data.subcategory !== undefined ? data.subcategory : existing.subcategory,
      data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags,
      data.is_public !== undefined ? (data.is_public ? 1 : 0) : existing.is_public,
      data.workspace_id !== undefined ? data.workspace_id : existing.workspace_id,
      data.author_name ?? existing.author_name,
      data.author_email ?? existing.author_email,
      id
    );

    const row = localDb.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    return this.parseRow(row, ['tags']);
  }

  async deleteBookmark(id: string): Promise<void> {
    localDb.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    localDb.prepare("DELETE FROM user_favorites WHERE item_id = ? AND item_type = 'bookmark'").run(id);
  }

  async clickBookmark(id: string): Promise<{ click_count: number }> {
    localDb.prepare('UPDATE bookmarks SET click_count = click_count + 1 WHERE id = ?').run(id);
    const row: any = localDb.prepare('SELECT click_count FROM bookmarks WHERE id = ?').get(id);
    return { click_count: row?.click_count || 0 };
  }

  // Categories
  async getCategories(): Promise<any[]> {
    return localDb.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  }

  async createCategory(data: any): Promise<any> {
    const id = data.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO categories (id, user_id, name, emoji, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.user_id, data.name, data.emoji || '📁', data.color || 'sky-400');

    return localDb.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  async deleteCategory(id: string): Promise<void> {
    localDb.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // Favorites
  async getFavorites(userId: string): Promise<{ prompts: string[]; skills: string[]; gitProjects: string[]; commands: string[]; bookmarks: string[] }> {
    const rows = localDb.prepare('SELECT item_id, item_type FROM user_favorites WHERE user_id = ?').all(userId) as any[];
    return {
      prompts: rows.filter(r => r.item_type === 'prompt').map(r => r.item_id),
      skills: rows.filter(r => r.item_type === 'skill').map(r => r.item_id),
      gitProjects: rows.filter(r => r.item_type === 'git_project').map(r => r.item_id),
      commands: rows.filter(r => r.item_type === 'command').map(r => r.item_id),
      bookmarks: rows.filter(r => r.item_type === 'bookmark').map(r => r.item_id),
    };
  }

  async toggleFavorite(userId: string, itemId: string, itemType: string): Promise<{ added: boolean }> {
    const existing = localDb.prepare('SELECT 1 FROM user_favorites WHERE user_id = ? AND item_id = ? AND item_type = ?').get(userId, itemId, itemType);
    if (existing) {
      localDb.prepare('DELETE FROM user_favorites WHERE user_id = ? AND item_id = ? AND item_type = ?').run(userId, itemId, itemType);
      return { added: false };
    } else {
      localDb.prepare('INSERT INTO user_favorites (user_id, item_id, item_type) VALUES (?, ?, ?)').run(userId, itemId, itemType);
      return { added: true };
    }
  }

  // Chats
  async getChats(promptId: string): Promise<any[]> {
    return localDb.prepare('SELECT * FROM chats WHERE prompt_id = ? ORDER BY created_at ASC').all(promptId);
  }

  async createChatMessage(data: any): Promise<any> {
    const id = data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    localDb.prepare(`
      INSERT INTO chats (id, prompt_id, user_id, role, content, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.prompt_id, data.user_id, data.role, data.content, data.image || null);

    return localDb.prepare('SELECT * FROM chats WHERE id = ?').get(id);
  }

  async clearChats(promptId: string): Promise<void> {
    localDb.prepare('DELETE FROM chats WHERE prompt_id = ?').run(promptId);
  }

  // Export / Import
  async getAllDataForExport(workspaceId?: string | null): Promise<Record<string, any[]>> {
    const wsFilter = workspaceId ? 'WHERE workspace_id = ?' : '';
    const wsParam = workspaceId ? [workspaceId] : [];

    const prompts = localDb.prepare(`SELECT * FROM prompts ${wsFilter}`).all(...wsParam);
    const skills = localDb.prepare(`SELECT * FROM skills ${wsFilter}`).all(...wsParam);
    const gitProjects = localDb.prepare(`SELECT * FROM git_projects ${wsFilter}`).all(...wsParam);
    const commands = localDb.prepare(`SELECT * FROM commands ${wsFilter}`).all(...wsParam);
    const bookmarks = localDb.prepare(`SELECT * FROM bookmarks ${wsFilter}`).all(...wsParam);
    const workspaces = workspaceId
      ? localDb.prepare('SELECT * FROM workspaces WHERE id = ?').all(workspaceId)
      : localDb.prepare('SELECT * FROM workspaces').all();
    const categories = localDb.prepare('SELECT * FROM categories').all();
    const users = localDb.prepare('SELECT uid, name, email, role FROM users').all();
    const chats = localDb.prepare('SELECT * FROM chats').all();
    const favorites = localDb.prepare('SELECT * FROM user_favorites').all();
    const skillHints = localDb.prepare('SELECT * FROM skill_hints').all();

    return {
      workspaces,
      prompts,
      skills,
      skill_hints: skillHints,
      git_projects: gitProjects,
      commands,
      bookmarks,
      categories,
      users,
      chats,
      favorites,
    };
  }

  async importAllData(tables: Record<string, any[]>): Promise<void> {
    const defaultPassHash = bcrypt.hashSync('admin123', 10);

    const runUpsert = (tableName: string, rows: any[]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      for (const rawRow of rows) {
        const row = { ...rawRow };

        // Handle users table safely
        if (tableName === 'users') {
          const existingUser: any = localDb.prepare('SELECT * FROM users WHERE uid = ? OR email = ?').get(row.uid, row.email);
          if (existingUser) {
            localDb.prepare('UPDATE users SET name = ?, role = ? WHERE uid = ?').run(row.name || existingUser.name, row.role || existingUser.role, existingUser.uid);
            continue;
          } else {
            row.password = row.password || defaultPassHash;
          }
        }

        // Handle user_favorites table
        if (tableName === 'user_favorites' || tableName === 'favorites') {
          localDb.prepare(`
            INSERT INTO user_favorites (user_id, item_id, item_type)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, item_id, item_type) DO NOTHING
          `).run(row.user_id, row.item_id, row.item_type);
          continue;
        }

        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const updates = keys.filter(k => k !== 'id' && k !== 'uid').map(k => `${k} = excluded.${k}`).join(', ');
        const values = keys.map(k => {
          const v = row[k];
          return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
        });

        const primaryKey = keys.includes('uid') ? 'uid' : 'id';

        localDb.prepare(`
          INSERT INTO ${tableName} (${keys.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT(${primaryKey}) DO UPDATE SET ${updates || 'id=id'}
        `).run(...values);
      }
    };

    localDb.transaction(() => {
      if (tables.workspaces) runUpsert('workspaces', tables.workspaces);
      if (tables.users) runUpsert('users', tables.users);
      if (tables.categories) runUpsert('categories', tables.categories);
      if (tables.prompts) runUpsert('prompts', tables.prompts);
      if (tables.skills) runUpsert('skills', tables.skills);
      if (tables.skill_hints) runUpsert('skill_hints', tables.skill_hints);
      if (tables.git_projects) runUpsert('git_projects', tables.git_projects);
      if (tables.commands) runUpsert('commands', tables.commands);
      if (tables.bookmarks) runUpsert('bookmarks', tables.bookmarks);
      if (tables.chats) runUpsert('chats', tables.chats);
      if (tables.user_favorites || tables.favorites) runUpsert('user_favorites', tables.user_favorites || tables.favorites);
    })();
  }
}

// ─── SUPABASE ADAPTER IMPLEMENTATION ────────────────────────────────────────

class SupabaseAdapter implements DbAdapter {
  isLocal = false;
  supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async getWorkspaces(): Promise<any[]> {
    const { data, error } = await this.supabase.from('workspaces').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createWorkspace(data: any): Promise<any> {
    const { data: ws, error } = await this.supabase.from('workspaces').insert(data).select().single();
    if (error) throw error;
    return ws;
  }

  async updateWorkspace(id: string, data: any): Promise<any> {
    const { data: ws, error } = await this.supabase.from('workspaces').update(data).eq('id', id).select().single();
    if (error) throw error;
    return ws;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await this.supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  }

  async findUserByEmail(email: string): Promise<any> {
    const { data } = await this.supabase.from('users').select('*').ilike('email', email).single();
    return data;
  }

  async findUserByUid(uid: string): Promise<any> {
    const { data } = await this.supabase.from('users').select('uid, email, name, role, created_at').eq('uid', uid).single();
    return data;
  }

  async getUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.from('users').select('uid, email, name, role, created_at').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createUser(data: any): Promise<any> {
    const hash = bcrypt.hashSync(data.password, 10);
    const { data: user, error } = await this.supabase.from('users').insert({
      email: data.email,
      name: data.name,
      password: hash,
      role: data.role || 'user',
    }).select('uid, email, name, role').single();
    if (error) throw error;
    return user;
  }

  async deleteUser(uid: string): Promise<void> {
    const { error } = await this.supabase.from('users').delete().eq('uid', uid);
    if (error) throw error;
  }

  async updateUserPassword(uid: string, hash: string): Promise<void> {
    const { error } = await this.supabase.from('users').update({ password: hash }).eq('uid', uid);
    if (error) throw error;
  }

  async getPrompts(filter?: { limit?: number; offset?: number; workspaceId?: string | null }): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    let q = this.supabase.from('prompts').select('*', { count: 'exact' });
    if (filter?.workspaceId) q = q.eq('workspace_id', filter.workspaceId);
    q = q.order('created_at', { ascending: false });

    if (filter?.limit) {
      const offset = filter.offset || 0;
      q = q.range(offset, offset + filter.limit - 1);
    }

    const { data, count, error } = await q;
    if (error) throw error;
    const total = count || 0;
    return {
      items: data || [],
      total,
      hasMore: filter?.limit ? (filter.offset || 0) + (data?.length || 0) < total : false,
    };
  }

  async createPrompt(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('prompts').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async updatePrompt(id: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('prompts').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  }

  async deletePrompt(id: string): Promise<void> {
    const { error } = await this.supabase.from('prompts').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('user_favorites').delete().eq('item_id', id).eq('item_type', 'prompt');
    await this.supabase.from('chats').delete().eq('prompt_id', id);
  }

  async getSkills(): Promise<any[]> {
    const { data, error } = await this.supabase.from('skills').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createSkill(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('skills').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async updateSkill(id: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('skills').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  }

  async deleteSkill(id: string): Promise<void> {
    const { error } = await this.supabase.from('skills').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('skill_hints').delete().eq('skill_id', id);
    await this.supabase.from('user_favorites').delete().eq('item_id', id).eq('item_type', 'skill');
  }

  async getSkillHints(skillId: string): Promise<any[]> {
    const { data, error } = await this.supabase.from('skill_hints').select('*').eq('skill_id', skillId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createSkillHint(skillId: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('skill_hints').insert({ ...data, skill_id: skillId }).select().single();
    if (error) throw error;
    return row;
  }

  async deleteSkillHint(id: string): Promise<void> {
    const { error } = await this.supabase.from('skill_hints').delete().eq('id', id);
    if (error) throw error;
  }

  async getGitProjects(): Promise<any[]> {
    const { data, error } = await this.supabase.from('git_projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createGitProject(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('git_projects').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async updateGitProject(id: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('git_projects').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  }

  async deleteGitProject(id: string): Promise<void> {
    const { error } = await this.supabase.from('git_projects').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('user_favorites').delete().eq('item_id', id).eq('item_type', 'git_project');
  }

  async getCommands(): Promise<any[]> {
    const { data, error } = await this.supabase.from('commands').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createCommand(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('commands').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async updateCommand(id: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('commands').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  }

  async deleteCommand(id: string): Promise<void> {
    const { error } = await this.supabase.from('commands').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('user_favorites').delete().eq('item_id', id).eq('item_type', 'command');
  }

  async useCommand(id: string): Promise<{ usage_count: number }> {
    const { data: cur } = await this.supabase.from('commands').select('usage_count').eq('id', id).single();
    const count = (cur?.usage_count || 0) + 1;
    await this.supabase.from('commands').update({ usage_count: count }).eq('id', id);
    return { usage_count: count };
  }

  async getBookmarks(): Promise<any[]> {
    const { data, error } = await this.supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createBookmark(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('bookmarks').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async updateBookmark(id: string, data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('bookmarks').update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  }

  async deleteBookmark(id: string): Promise<void> {
    const { error } = await this.supabase.from('bookmarks').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('user_favorites').delete().eq('item_id', id).eq('item_type', 'bookmark');
  }

  async clickBookmark(id: string): Promise<{ click_count: number }> {
    const { data: cur } = await this.supabase.from('bookmarks').select('click_count').eq('id', id).single();
    const count = (cur?.click_count || 0) + 1;
    await this.supabase.from('bookmarks').update({ click_count: count }).eq('id', id);
    return { click_count: count };
  }

  async getCategories(): Promise<any[]> {
    const { data, error } = await this.supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createCategory(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('categories').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async getFavorites(userId: string): Promise<{ prompts: string[]; skills: string[]; gitProjects: string[]; commands: string[]; bookmarks: string[] }> {
    const { data } = await this.supabase.from('user_favorites').select('item_id, item_type').eq('user_id', userId);
    const rows = data || [];
    return {
      prompts: rows.filter(r => r.item_type === 'prompt').map(r => r.item_id),
      skills: rows.filter(r => r.item_type === 'skill').map(r => r.item_id),
      gitProjects: rows.filter(r => r.item_type === 'git_project').map(r => r.item_id),
      commands: rows.filter(r => r.item_type === 'command').map(r => r.item_id),
      bookmarks: rows.filter(r => r.item_type === 'bookmark').map(r => r.item_id),
    };
  }

  async toggleFavorite(userId: string, itemId: string, itemType: string): Promise<{ added: boolean }> {
    const { data } = await this.supabase.from('user_favorites').select('item_id').eq('user_id', userId).eq('item_id', itemId).eq('item_type', itemType).maybeSingle();
    if (data) {
      await this.supabase.from('user_favorites').delete().eq('user_id', userId).eq('item_id', itemId).eq('item_type', itemType);
      return { added: false };
    } else {
      await this.supabase.from('user_favorites').insert({ user_id: userId, item_id: itemId, item_type: itemType });
      return { added: true };
    }
  }

  async getChats(promptId: string): Promise<any[]> {
    const { data, error } = await this.supabase.from('chats').select('*').eq('prompt_id', promptId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createChatMessage(data: any): Promise<any> {
    const { data: row, error } = await this.supabase.from('chats').insert(data).select().single();
    if (error) throw error;
    return row;
  }

  async clearChats(promptId: string): Promise<void> {
    const { error } = await this.supabase.from('chats').delete().eq('prompt_id', promptId);
    if (error) throw error;
  }

  async getAllDataForExport(workspaceId?: string | null): Promise<Record<string, any[]>> {
    let pQ = this.supabase.from('prompts').select('*');
    let sQ = this.supabase.from('skills').select('*');
    let gQ = this.supabase.from('git_projects').select('*');
    let cQ = this.supabase.from('commands').select('*');
    let bQ = this.supabase.from('bookmarks').select('*');
    let wQ = this.supabase.from('workspaces').select('*');

    if (workspaceId) {
      pQ = pQ.eq('workspace_id', workspaceId);
      sQ = sQ.eq('workspace_id', workspaceId);
      gQ = gQ.eq('workspace_id', workspaceId);
      cQ = cQ.eq('workspace_id', workspaceId);
      bQ = bQ.eq('workspace_id', workspaceId);
      wQ = wQ.eq('id', workspaceId);
    }

    const [prompts, skills, skillHints, gitProjects, commands, bookmarks, workspaces, categories, users, chats, favorites] =
      await Promise.all([
        pQ,
        sQ,
        this.supabase.from('skill_hints').select('*'),
        gQ,
        cQ,
        bQ,
        wQ,
        this.supabase.from('categories').select('*'),
        this.supabase.from('users').select('uid, name, email, role'),
        this.supabase.from('chats').select('*'),
        this.supabase.from('user_favorites').select('*'),
      ]);

    return {
      workspaces: workspaces.data || [],
      prompts: prompts.data || [],
      skills: skills.data || [],
      skill_hints: skillHints.data || [],
      git_projects: gitProjects.data || [],
      commands: commands.data || [],
      bookmarks: bookmarks.data || [],
      categories: categories.data || [],
      users: users.data || [],
      chats: chats.data || [],
      favorites: favorites.data || [],
    };
  }

  async importAllData(tables: Record<string, any[]>): Promise<void> {
    for (const [tableName, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const targetTable = tableName === 'favorites' ? 'user_favorites' : tableName;
      await this.supabase.from(targetTable).upsert(rows, { onConflict: tableName === 'users' ? 'uid' : 'id' });
    }
  }
}

// ─── FACTORY ────────────────────────────────────────────────────────────────

export function createDbAdapter(supabaseClient?: any): DbAdapter {
  if (isLocalEngine() || !supabaseClient) {
    console.log('💻 [Storage Engine] Running in LOCAL SQLite Mode (data/promptvault.db)');
    return new SqliteAdapter();
  } else {
    console.log('☁️ [Storage Engine] Running in CLOUD Supabase Mode');
    return new SupabaseAdapter(supabaseClient);
  }
}
