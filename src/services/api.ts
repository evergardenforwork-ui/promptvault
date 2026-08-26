import { Prompt, Category, ChatMessage } from '../types';

const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('pv_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('pv_token', data.token);
    localStorage.setItem('pv_user', JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('pv_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Prompts
  async getPrompts(): Promise<Prompt[]> {
    return request('/prompts');
  },

  async getPromptsPaged(offset: number, limit: number): Promise<{ items: Prompt[]; total: number; hasMore: boolean }> {
    return request(`/prompts?limit=${limit}&offset=${offset}`);
  },

  async createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt' | 'userId' | 'authorName' | 'authorEmail' | 'usageCount' | 'isFavorite'> & { isFavorite?: boolean }): Promise<Prompt> {
    return request('/prompts', {
      method: 'POST',
      body: JSON.stringify(prompt),
    });
  },

  async updatePrompt(id: string, prompt: Partial<Prompt>): Promise<Prompt> {
    return request(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prompt),
    });
  },

  async deletePrompt(id: string): Promise<void> {
    return request(`/prompts/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request('/categories');
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Chats (AI Messages)
  async getChats(promptId: string): Promise<ChatMessage[]> {
    return request(`/chats?promptId=${promptId}`);
  },

  async sendChatMessage(promptId: string, content: string, image?: string): Promise<ChatMessage> {
    return request('/chats', {
      method: 'POST',
      body: JSON.stringify({ promptId, content, image }),
    });
  },

  async clearChats(promptId: string): Promise<void> {
    return request(`/chats/clear?promptId=${promptId}`, {
      method: 'POST',
    });
  },

  // Gemini Proxy
  async chatWithGemini(
    prompt: string,
    systemInstruction: string,
    history: any[] = [],
    images?: string[]
  ): Promise<string> {
    const data = await request('/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, systemInstruction, history, images }),
    });
    return data.text;
  },

  async analyzeImageWithGemini(image: string, prompt: string): Promise<string> {
    const data = await request('/gemini/analyze', {
      method: 'POST',
      body: JSON.stringify({ image, prompt }),
    });
    return data.text;
  },

  async exportBackup(workspaceId?: string): Promise<Blob> {
    const token = localStorage.getItem('pv_token');
    const url = workspaceId ? `${API_BASE}/export?workspaceId=${encodeURIComponent(workspaceId)}` : `${API_BASE}/export`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Не удалось скачать резервную копию');
    }
    return res.blob();
  },

  // Skills (Skill Packages)
  async getSkills(): Promise<any[]> {
    return request('/skills');
  },

  async createSkill(skill: any): Promise<any> {
    return request('/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  },

  async updateSkill(id: string, skill: any): Promise<any> {
    return request(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skill),
    });
  },

  async deleteSkill(id: string): Promise<void> {
    return request(`/skills/${id}`, {
      method: 'DELETE',
    });
  },

  async importBackup(base64Zip: string, claimOwnership = true): Promise<{ message: string; importedCount?: number }> {
    return request('/import', {
      method: 'POST',
      body: JSON.stringify({ file: base64Zip, claimOwnership }),
    });
  },

  // 👑 Ownership Claiming
  async claimAllData(): Promise<{ message: string; count?: number }> {
    return request('/admin/claim-all', {
      method: 'POST',
    });
  },

  // Favorites (personal, per-user)
  async getFavorites(): Promise<{ prompts: string[]; skills: string[]; gitProjects?: string[] }> {
    return request('/favorites');
  },

  async toggleFavorite(itemId: string, itemType: 'prompt' | 'skill' | 'git_project' | 'command' | 'bookmark'): Promise<{ added: boolean; favorites: { prompts: string[]; skills: string[]; gitProjects?: string[]; commands?: string[]; bookmarks?: string[] } }> {
    return request('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType }),
    });
  },

  // User Management (admin only)
  async getUsers(): Promise<{ uid: string; name: string; email: string; role: string }[]> {
    return request('/users');
  },

  async createUser(data: { name: string; email: string; password: string; role?: string }): Promise<{ uid: string; name: string; email: string; role: string }> {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(uid: string): Promise<void> {
    return request(`/users/${uid}`, { method: 'DELETE' });
  },

  async changeUserPassword(uid: string, password: string): Promise<{ message: string }> {
    return request(`/users/${uid}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  },

  // Skill Hints
  async getSkillHints(skillId: string): Promise<import('../types').SkillHint[]> {
    return request(`/skills/${skillId}/hints`);
  },

  async createSkillHint(skillId: string, data: { title: string; text: string }): Promise<import('../types').SkillHint> {
    return request(`/skills/${skillId}/hints`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteSkillHint(skillId: string, hintId: string): Promise<void> {
    return request(`/skills/${skillId}/hints/${hintId}`, { method: 'DELETE' });
  },

  // Git Projects (AI Tools Hub)
  async getGitProjects(): Promise<import('../types').GitProject[]> {
    return request('/git-projects');
  },

  async createGitProject(project: Omit<import('../types').GitProject, 'id' | 'createdAt' | 'userId' | 'authorName' | 'authorEmail'>): Promise<import('../types').GitProject> {
    return request('/git-projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async updateGitProject(id: string, project: Partial<import('../types').GitProject>): Promise<import('../types').GitProject> {
    return request(`/git-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  async deleteGitProject(id: string): Promise<void> {
    return request(`/git-projects/${id}`, { method: 'DELETE' });
  },

  // Gemini AI Smart Parser
  async parseToolWithGemini(data: import('../types').ParseToolRequest): Promise<Partial<import('../types').GitProject>> {
    return request('/gemini/parse-tool', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Commands & Workflows
  async getCommands(): Promise<import('../types').CommandItem[]> {
    return request('/commands');
  },

  async createCommand(cmd: Omit<import('../types').CommandItem, 'id' | 'createdAt' | 'userId' | 'authorName' | 'authorEmail' | 'usageCount'>): Promise<import('../types').CommandItem> {
    return request('/commands', {
      method: 'POST',
      body: JSON.stringify(cmd),
    });
  },

  async updateCommand(id: string, cmd: Partial<import('../types').CommandItem>): Promise<import('../types').CommandItem> {
    return request(`/commands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cmd),
    });
  },

  async deleteCommand(id: string): Promise<void> {
    return request(`/commands/${id}`, { method: 'DELETE' });
  },

  async useCommand(id: string): Promise<{ usageCount: number }> {
    return request(`/commands/${id}/use`, { method: 'POST' });
  },

  // Web Bookmarks & Sites
  async getBookmarks(): Promise<import('../types').BookmarkItem[]> {
    return request('/bookmarks');
  },

  async createBookmark(bookmark: Omit<import('../types').BookmarkItem, 'id' | 'createdAt' | 'userId' | 'authorName' | 'authorEmail' | 'clickCount'>): Promise<import('../types').BookmarkItem> {
    return request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(bookmark),
    });
  },

  async updateBookmark(id: string, bookmark: Partial<import('../types').BookmarkItem>): Promise<import('../types').BookmarkItem> {
    return request(`/bookmarks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookmark),
    });
  },

  async deleteBookmark(id: string): Promise<void> {
    return request(`/bookmarks/${id}`, { method: 'DELETE' });
  },

  async clickBookmark(id: string): Promise<{ clickCount: number }> {
    return request(`/bookmarks/${id}/click`, { method: 'POST' });
  },

  // Workspaces (Рабочие пространства)
  async getWorkspaces(): Promise<import('../types').Workspace[]> {
    return request('/workspaces');
  },

  async createWorkspace(ws: { name: string; icon?: string; color?: string }): Promise<import('../types').Workspace> {
    return request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(ws),
    });
  },

  async updateWorkspace(id: string, ws: { name?: string; icon?: string; color?: string }): Promise<import('../types').Workspace> {
    return request(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ws),
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    return request(`/workspaces/${id}`, { method: 'DELETE' });
  },
};

