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

  async exportBackup(): Promise<Blob> {
    const token = localStorage.getItem('pv_token');
    const res = await fetch(`${API_BASE}/export`, {
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

  async importBackup(base64Zip: string): Promise<{ message: string }> {
    return request('/import', {
      method: 'POST',
      body: JSON.stringify({ file: base64Zip }),
    });
  }
};
