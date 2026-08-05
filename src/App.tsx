import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Plus, Menu, X, LayoutGrid, List, ChevronRight, ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { Prompt, Category, User, MediaType } from './types';
import { cn } from './utils/cn';
import { useHotkeys } from './hooks/useHotkeys';
import { usePromptFilters } from './hooks/usePromptFilters';

// Modular Component Imports
import LoginForm from './components/auth/LoginForm';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/ui/Toast';
import CategoryForm from './components/ui/CategoryForm';
import PhotoCard from './sections/photo/PhotoCard';
import PhotoForm from './sections/photo/PhotoForm';
import PhotoView from './sections/photo/PhotoView';
import SkillCard from './sections/skills/SkillCard';
import SkillForm from './sections/skills/SkillForm';
import SkillSpaceView from './sections/skills/SkillSpaceView';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { SkillPackage } from './types';
import UsersSection from './sections/admin/UsersSection';

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
  const [viewingSkill, setViewingSkill] = useState<SkillPackage | null>(null);
  const [spacedSkill, setSpacedSkill] = useState<SkillPackage | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: React.ReactNode, type?: 'success' | 'error' }[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'usage'>('date');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'my-own' | 'my-web' | 'others'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [visibleCount, setVisibleCount] = useState(24);
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

  const handleDelete = useCallback(
    async (id: string) => {
      setConfirmDialog({ isOpen: true, promptId: id });
    },
    []
  );

  const handleConfirmDelete = useCallback(
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

  const handleDuplicate = useCallback(
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

  // --- Hotkeys ---
  useHotkeys({
    user,
    searchInputRef,
    onOpenNewForm: () => setIsFormOpen(true),
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

  // --- Filtering, Sorting & Tags ---
  const { filteredPrompts, allTags, counts, mediaCounts } = usePromptFilters({
    prompts,
    user,
    searchQuery,
    selectedCategory,
    showFavoritesOnly,
    sourceFilter,
    mediaFilter,
    sortBy,
  });

  // Сброс пагинации при смене любого фильтра
  const prevFilterKey = useRef('');
  const filterKey = `${searchQuery}|${selectedCategory}|${showFavoritesOnly}|${sourceFilter}|${mediaFilter}|${sortBy}`;
  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (visibleCount !== 24) setVisibleCount(24);
  }

  const PAGE_SIZE = 24;
  const visiblePrompts = filteredPrompts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPrompts.length;

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

          {/* Главное Меню Страниц */}
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

        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Поиск промптов... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-sky-400 transition-all text-sm text-white placeholder-zinc-500"
          />
        </div>

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

      {/* Main Content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Left group: Layout and Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2.5 rounded-xl transition-all cursor-pointer", viewMode === 'grid' ? "bg-sky-400 text-black font-bold" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300")}
                  title="Сетка"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2.5 rounded-xl transition-all cursor-pointer", viewMode === 'list' ? "bg-sky-400 text-black font-bold" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300")}
                  title="Список"
                >
                  <List size={18} />
                </button>
                <div className="h-6 w-px bg-zinc-800 mx-1" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="date" className="bg-zinc-900">Сначала новые</option>
                  <option value="name" className="bg-zinc-900">По алфавиту</option>
                  <option value="usage" className="bg-zinc-900">По популярности</option>
                </select>
              </div>

              {/* Middle group: Ownership / Source Tabs */}
              <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 shrink-0">
                {[
                  { id: 'all', name: 'Все', count: counts.all },
                  { id: 'my-own', name: 'Мои (Авторские)', count: counts.own },
                  { id: 'my-web', name: 'Мои (Из сети)', count: counts.web },
                  { id: 'others', name: 'Чужие (Публичные)', count: counts.others }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSourceFilter(tab.id as any)}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                      sourceFilter === tab.id 
                        ? "bg-sky-400 text-black font-black shadow-md shadow-sky-400/10" 
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <span>{tab.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors",
                      sourceFilter === tab.id
                        ? "bg-black/25 text-black"
                        : "bg-zinc-850 text-zinc-500"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Media Type Tabs */}
              <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 shrink-0">
                {[
                  { id: 'all', label: 'Все', count: mediaCounts.all },
                  { id: 'photo', label: '📷', count: mediaCounts.photo },
                  { id: 'video', label: '🎬', count: mediaCounts.video },
                  { id: 'text', label: '📝', count: mediaCounts.text },
                  { id: 'music', label: '🎵', count: mediaCounts.music },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMediaFilter(tab.id as any)}
                    title={tab.id === 'all' ? 'Все типы' : tab.id === 'photo' ? 'Фото' : tab.id === 'video' ? 'Видео' : tab.id === 'text' ? 'Текст' : 'Музыка'}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1",
                      mediaFilter === tab.id
                        ? "bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/20"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors",
                      mediaFilter === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-zinc-850 text-zinc-500"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right group: Categories Pills (Horizontal Scrolling container) */}
            <div className="flex-1 min-w-0 flex items-center gap-2 justify-end lg:max-w-xl">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full" id="categories-scroll-container">
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                    (selectedCategory === null && !allTags.includes(searchQuery))
                      ? "bg-sky-400 text-black border-sky-400 font-extrabold"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  Все
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setSearchQuery(''); }}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                      selectedCategory === cat.name
                        ? "bg-sky-400 text-black border-sky-400 font-extrabold shadow-md shadow-sky-400/10"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                    )}
                  >
                    <span>{cat.emoji}</span> <span className="ml-1">{cat.name}</span>
                  </button>
                ))}

                {allTags.length > 0 && <div className="h-5 w-px bg-zinc-800 mx-1 shrink-0" />}

                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearchQuery(tag); setSelectedCategory(null); }}
                    className={cn(
                      "px-3.5 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all cursor-pointer",
                      searchQuery === tag
                        ? "bg-indigo-400 text-black border-indigo-400 font-extrabold shadow-md shadow-indigo-400/10"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                    )}
                  >
                    #{tag}
                  </button>
                ))}

                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-dashed border-zinc-800 hover:border-sky-400 hover:text-sky-400 text-zinc-500 shrink-0 transition-all cursor-pointer flex items-center gap-1.5 bg-zinc-900/40"
                  title="Создать новую категорию"
                >
                  <Plus size={13} /> Категория
                </button>
              </div>
              
              <button
                onClick={() => {
                  const el = document.getElementById('categories-scroll-container');
                  if (el) {
                    const isEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
                    el.scrollTo({ left: isEnd ? 0 : el.scrollLeft + 150, behavior: 'smooth' });
                  }
                }}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                title="Прокрутить дальше"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="text-sm text-zinc-550 font-medium shrink-0 flex items-center gap-3">
              {(searchQuery || selectedCategory || showFavoritesOnly || sourceFilter !== 'all' || mediaFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setShowFavoritesOnly(false);
                    setSourceFilter('all');
                    setMediaFilter('all');
                  }}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold transition-colors cursor-pointer"
                >
                  Сбросить фильтр <X size={12} />
                </button>
              )}
              <span>Найдено: <span className="text-white font-bold">{filteredPrompts.length}</span></span>
            </div>
          </div>

          {/* Prompt / Skill / Admin Grid */}
          {activeSection === 'admin' ? (
            <UsersSection addToast={addToast} />
          ) : activeSection === 'prompts' ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              <AnimatePresence mode="popLayout">
                {visiblePrompts.map((prompt) => (
                  <PhotoCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    viewMode={viewMode}
                    searchQuery={searchQuery}
                    onView={() => setViewingPrompt(prompt)}
                    onToggleFavorite={() => handleToggleFavoritePrompt(prompt.id)}
                    effectiveUser={user}
                    onPickTag={(tag) => { setSearchQuery(tag); setSelectedCategory(null); }}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              <AnimatePresence mode="popLayout">
                {skills
                  .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      viewMode={viewMode}
                      searchQuery={searchQuery}
                      onView={() => setSpacedSkill(skill)}
                      onToggleFavorite={async () => handleToggleFavoriteSkill(skill.id)}
                      effectiveUser={user}
                    />
                  ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-8">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="group flex items-center gap-2.5 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronDownIcon size={16} className="group-hover:translate-y-0.5 transition-transform" />
                Загрузить ещё
                <span className="px-2 py-0.5 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg text-[11px] font-black text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  +{Math.min(PAGE_SIZE, filteredPrompts.length - visibleCount)}
                </span>
              </button>
              <p className="text-[11px] text-zinc-700 font-medium">
                Показано {visibleCount} из {filteredPrompts.length}
              </p>
            </div>
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

      {/* Modals */}
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
            onDelete={() => handleDelete(viewingPrompt.id)}
            onDuplicate={() => handleDuplicate(viewingPrompt)}
            onCopy={(text) => handleCopy(text, viewingPrompt.id)}
            effectiveUser={user}
            addToast={addToast}
          />
        )}
        {isSkillFormOpen && (
          <SkillForm
            skill={editingSkill}
            categories={categories}
            onClose={() => { setIsSkillFormOpen(false); setEditingSkill(null); }}
            onSave={() => { setIsSkillFormOpen(false); setEditingSkill(null); void loadData(); }}
            onAddCategory={() => setIsCategoryModalOpen(true)}
            user={user}
            addToast={addToast}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
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
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, promptId: null })}
      />
    </div>
  );
}
