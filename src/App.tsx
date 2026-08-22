import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { Prompt, Category, User, MediaType, SkillPackage } from './types';
import { cn } from './utils/cn';
import { useHotkeys } from './hooks/useHotkeys';
import { useSkillFilters } from './hooks/useSkillFilters';

// Section Components
import PromptsSection from './sections/prompts/PromptsSection';
import SkillsSection from './sections/skills/SkillsSection';
import UsersSection from './sections/admin/UsersSection';

// Layout & UI Components
import LoginForm from './components/auth/LoginForm';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/ui/Toast';
import CategoryForm from './components/ui/CategoryForm';
import ConfirmDialog from './components/ui/ConfirmDialog';

// Modal Forms & Overlays
import PhotoForm from './sections/photo/PhotoForm';
import PhotoView from './sections/photo/PhotoView';
import SkillForm from './sections/skills/SkillForm';
import SkillSpaceView from './sections/skills/SkillSpaceView';

export default function App() {
  const [activeSection, setActiveSection] = useState<'prompts' | 'skills' | 'admin'>('prompts');
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [skills, setSkills] = useState<SkillPackage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSkillFormOpen, setIsSkillFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillPackage | null>(null);
  const [spacedSkill, setSpacedSkill] = useState<SkillPackage | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: React.ReactNode, type?: 'success' | 'error' }[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'usage'>('date');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'my-all' | 'my-own' | 'my-web' | 'others'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    promptId: string | null;
  }>({ isOpen: false, promptId: null });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const formCloseRef = useRef<(() => void) | null>(null);

  const addToast = useCallback((message: React.ReactNode, type: 'success' | 'error' = 'success', durationMs = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), durationMs);
  }, []);

  // Check auth state on mount
  useEffect(() => {
    const localUser = api.getCurrentUser();
    if (localUser) {
      setUser(localUser);
    }
    setLoadingUser(false);
  }, []);

  // Load data helper
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [allPrompts, allCategories, allSkills] = await Promise.all([
        api.getPrompts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSkills().catch(() => []),
      ]);
      setPrompts(allPrompts);
      setCategories(allCategories);
      setSkills(allSkills);
    } catch (err: any) {
      console.error('Data load exception:', err);
    }
  }, [user]);

  // Load prompts & categories when logged in
  useEffect(() => {
    if (user) {
      void loadData();
    } else {
      setPrompts([]);
      setCategories([]);
      setSkills([]);
    }
  }, [user, loadData]);

  const handleCopy = useCallback(
    async (text: string, promptId: string) => {
      await navigator.clipboard.writeText(text);
      addToast('Текст скопирован!');
      try {
        const p = prompts.find((x) => x.id === promptId);
        if (p) {
          const updated = await api.updatePrompt(promptId, { usageCount: (p.usageCount || 0) + 1 });
          setPrompts(prev => prev.map(x => x.id === promptId ? updated : x));
        }
      } catch (err) {
        console.error(err);
      }
    },
    [prompts, addToast]
  );

  const handleDeletePrompt = useCallback(
    async (id: string) => {
      setConfirmDialog({ isOpen: true, promptId: id });
    },
    []
  );

  const handleConfirmDeletePrompt = useCallback(
    async () => {
      const id = confirmDialog.promptId;
      if (!id) return;
      setConfirmDialog({ isOpen: false, promptId: null });
      try {
        await api.deletePrompt(id);
        addToast('Промпт удален');
        setPrompts(prev => prev.filter(x => x.id !== id));
        setViewingPrompt(null);
      } catch (err: any) {
        addToast(err.message || 'Не удалось удалить промпт', 'error');
      }
    },
    [confirmDialog.promptId, addToast]
  );

  const handleToggleFavoritePrompt = useCallback(
    async (id: string) => {
      try {
        const res = await api.toggleFavorite(id, 'prompt');
        setPrompts(prev => prev.map(x => x.id === id ? { ...x, isFavorite: res.added } : x));
        addToast(res.added ? 'Добавлено в избранное' : 'Удалено из избранного');
      } catch (err: any) {
        addToast(err.message || 'Не удалось обновить статус', 'error');
      }
    },
    [addToast]
  );

  const handleToggleFavoriteSkill = useCallback(
    async (id: string) => {
      try {
        const res = await api.toggleFavorite(id, 'skill');
        setSkills(prev => prev.map(x => x.id === id ? { ...x, isFavorite: res.added } : x));
        addToast(res.added ? 'Добавлено в избранное' : 'Удалено из избранного');
      } catch (err: any) {
        addToast(err.message || 'Ошибка обновления', 'error');
      }
    },
    [addToast]
  );

  const handleDuplicatePrompt = useCallback(
    async (p: Prompt) => {
      if (!user) return;
      const copy = {
        title: `${p.title} (копия)`,
        category: p.category,
        mainPrompt: p.mainPrompt,
        tags: [...(p.tags || [])],
        subSections: (p.subSections || []).map((s) => ({ ...s })),
        imageBefore: p.imageBefore || '',
        imageAfter: p.imageAfter || '',
        originalImageBefore: p.originalImageBefore || '',
        originalImageAfter: p.originalImageAfter || '',
        originalImageSlot2: p.originalImageSlot2 || '',
        imageLayoutType: p.imageLayoutType || 'single',
        additionalImages: [...(p.additionalImages || [])],
        usageNotes: p.usageNotes || '',
        mediaType: p.mediaType || 'photo',
        isFavorite: false,
        isPublic: false,
      };
      try {
        const created = await api.createPrompt(copy);
        setPrompts(prev => [created, ...prev]);
        addToast('Промпт продублирован');
      } catch (err: any) {
        addToast(err.message || 'Не удалось продублировать', 'error');
      }
    },
    [user, addToast]
  );

  const handleLogout = () => {
    api.logout();
    setUser(null);
    addToast('Вы вышли из системы');
  };

  const handleExportBackup = useCallback(async () => {
    try {
      const blob = await api.exportBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptvault_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('Резервная копия скачана');
    } catch (err: any) {
      addToast(err.message || 'Не удалось экспортировать данные', 'error');
    }
  }, [addToast]);

  const handleImportBackup = useCallback(async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;
        try {
          const res = await api.importBackup(base64);
          addToast(res.message || 'Данные успешно импортированы!');
          await loadData();
        } catch (err: any) {
          addToast(err.message || 'Не удалось импортировать данные', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      addToast(err.message || 'Не удалось прочитать файл', 'error');
    }
  }, [addToast, loadData]);

  // Hotkeys
  useHotkeys({
    user,
    searchInputRef,
    onOpenNewForm: () => {
      if (activeSection === 'prompts') setIsFormOpen(true);
      else if (activeSection === 'skills') setIsSkillFormOpen(true);
    },
    onCloseAll: () => {
      if (isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
        return;
      }
      if (isFormOpen) {
        if (formCloseRef.current) {
          formCloseRef.current();
        } else {
          setIsFormOpen(false);
          setEditingPrompt(null);
        }
        return;
      }
      if (isSkillFormOpen) {
        setIsSkillFormOpen(false);
        setEditingSkill(null);
        return;
      }
      if (viewingPrompt) {
        setViewingPrompt(null);
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }
    },
  });

  const skillFilters = useSkillFilters(skills, user);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={setUser} onToast={addToast} />;
  }

  // Полноэкранная страница-пространство скилла
  if (spacedSkill) {
    return (
      <SkillSpaceView
        skill={spacedSkill}
        onBack={() => setSpacedSkill(null)}
        onEdit={() => {
          setEditingSkill(spacedSkill);
          setSpacedSkill(null);
          setIsSkillFormOpen(true);
        }}
        onDelete={async () => {
          try {
            await api.deleteSkill(spacedSkill.id);
            setSkills(prev => prev.filter(x => x.id !== spacedSkill.id));
            setSpacedSkill(null);
            addToast('Пакет скиллов удалён');
          } catch (err: any) {
            addToast(err.message || 'Ошибка удаления', 'error');
          }
        }}
        onSkillUpdated={(updated) => {
          setSpacedSkill(updated);
          setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
        }}
        effectiveUser={user}
        addToast={addToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 cursor-pointer"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-black tracking-tighter hidden sm:block">
            PROMPT<span className="text-sky-400">VAULT</span>
          </h1>

          {/* Главное Меню Разделов */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSection('prompts')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'prompts' ? "bg-sky-400 text-black shadow-md shadow-sky-400/20" : "text-zinc-400 hover:text-white"
              )}
            >
              <span>📷 Промпты</span>
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'skills' ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" : "text-zinc-400 hover:text-white"
              )}
            >
              <span>📦 Skills & Файлы</span>
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveSection('admin')}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                  activeSection === 'admin' ? "bg-violet-500 text-white shadow-md shadow-violet-500/20" : "text-zinc-400 hover:text-white"
                )}
              >
                <span>👥 Пользователи</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={activeSection === 'prompts' ? "Поиск промптов... (Ctrl+K)" : "Поиск скиллов, агентов, MCP... (Ctrl+K)"}
            value={activeSection === 'prompts' ? searchQuery : skillFilters.searchQuery}
            onChange={(e) => {
              if (activeSection === 'prompts') {
                setSearchQuery(e.target.value);
              } else {
                skillFilters.setSearchQuery(e.target.value);
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-sky-400 transition-all text-sm text-white placeholder-zinc-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeSection === 'prompts') setIsFormOpen(true);
              else setIsSkillFormOpen(true);
            }}
            className={cn(
              "text-black p-3 rounded-2xl transition-all shadow-lg cursor-pointer",
              activeSection === 'prompts' ? "bg-sky-400 shadow-sky-400/20" : "bg-purple-500 text-white shadow-purple-500/20"
            )}
            title={activeSection === 'prompts' ? 'Создать промпт' : 'Загрузить пакет скиллов'}
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
            title="Выйти"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {activeSection === 'prompts' && (
            <PromptsSection
              prompts={prompts}
              categories={categories}
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              mediaFilter={mediaFilter}
              setMediaFilter={setMediaFilter}
              onViewPrompt={(p) => setViewingPrompt(p)}
              onToggleFavorite={handleToggleFavoritePrompt}
              onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            />
          )}

          {activeSection === 'skills' && (
            <SkillsSection
              skills={skills}
              user={user}
              skillFilters={skillFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onViewSkill={(s) => setSpacedSkill(s)}
              onToggleFavorite={handleToggleFavoriteSkill}
            />
          )}

          {activeSection === 'admin' && (
            <UsersSection addToast={addToast} />
          )}
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        prompts={prompts}
        user={user}
        searchQuery={searchQuery}
        onPickTag={setSearchQuery}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onOpenAdmin={user.role === 'admin' ? () => setActiveSection('admin') : undefined}
      />

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryForm 
            onClose={() => setIsCategoryModalOpen(false)}
            onSave={() => { setIsCategoryModalOpen(false); void loadData(); addToast('Категория добавлена!'); }}
          />
        )}
        {isFormOpen && (
          <PhotoForm 
            prompt={editingPrompt}
            categories={categories}
            onClose={() => { setIsFormOpen(false); setEditingPrompt(null); }}
            onSave={() => { setIsFormOpen(false); setEditingPrompt(null); void loadData(); }}
            onAddCategory={() => setIsCategoryModalOpen(true)}
            user={user}
            addToast={addToast}
            onCloseRef={formCloseRef}
          />
        )}
        {viewingPrompt && (
          <PhotoView 
            prompt={viewingPrompt}
            onClose={() => setViewingPrompt(null)}
            onEdit={() => { setEditingPrompt(viewingPrompt); setViewingPrompt(null); setIsFormOpen(true); }}
            onDelete={() => handleDeletePrompt(viewingPrompt.id)}
            onDuplicate={() => handleDuplicatePrompt(viewingPrompt)}
            onCopy={(text) => handleCopy(text, viewingPrompt.id)}
            effectiveUser={user}
            addToast={addToast}
          />
        )}
        {isSkillFormOpen && (
          <SkillForm
            skill={editingSkill}
            onClose={() => { setIsSkillFormOpen(false); setEditingSkill(null); }}
            onSave={() => { setIsSkillFormOpen(false); setEditingSkill(null); void loadData(); }}
            user={user}
            addToast={addToast}
          />
        )}
      </AnimatePresence>

      {/* Toasts Container */}
      <div className="fixed bottom-0 right-0 p-6 z-[100] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => {}} />
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Удалить промпт?"
        message="Это действие необратимо. Промпт и все связанные чаты будут удалены навсегда."
        confirmText="Удалить"
        variant="danger"
        onConfirm={handleConfirmDeletePrompt}
        onCancel={() => setConfirmDialog({ isOpen: false, promptId: null })}
      />
    </div>
  );
}
