import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Menu, Sun, Moon, Sparkles, X as CloseIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { api } from './services/api';
import { Prompt, Category, User, MediaType, SkillPackage, GitProject, CommandItem, BookmarkItem, Workspace, DEFAULT_BOOKMARK_FOLDERS } from './types';
import { cn } from './utils/cn';
import { useHotkeys } from './hooks/useHotkeys';
import { useSkillFilters } from './hooks/useSkillFilters';
import { useTheme } from './hooks/useTheme';

// Section Components
import PromptsSection from './sections/prompts/PromptsSection';
import SkillsSection from './sections/skills/SkillsSection';
import UsersSection from './sections/admin/UsersSection';
import GitProjectsSection from './sections/git/GitProjectsSection';
import CommandsSection from './sections/commands/CommandsSection';
import BookmarksSection from './sections/bookmarks/BookmarksSection';

// Layout & UI Components
import LoginForm from './components/auth/LoginForm';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/ui/Toast';
import CategoryForm from './components/ui/CategoryForm';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { WorkspaceModal } from './components/ui/WorkspaceModal';

// Modal Forms & Overlays
import PhotoForm from './sections/photo/PhotoForm';
import PhotoView from './sections/photo/PhotoView';
import SkillForm from './sections/skills/SkillForm';
import SkillSpaceView from './sections/skills/SkillSpaceView';
import GitProjectForm from './sections/git/GitProjectForm';
import GitProjectView from './sections/git/GitProjectView';
import CommandForm from './sections/commands/CommandForm';
import BookmarkForm from './sections/bookmarks/BookmarkForm';

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<'prompts' | 'skills' | 'git' | 'commands' | 'bookmarks' | 'admin'>('prompts');
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [skills, setSkills] = useState<SkillPackage[]>([]);
  const [gitProjects, setGitProjects] = useState<GitProject[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(() => localStorage.getItem('pv_workspace_id') || null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSkillFormOpen, setIsSkillFormOpen] = useState(false);
  const [isGitFormOpen, setIsGitFormOpen] = useState(false);
  const [isCommandFormOpen, setIsCommandFormOpen] = useState(false);
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillPackage | null>(null);
  const [spacedSkill, setSpacedSkill] = useState<SkillPackage | null>(null);
  const [editingGitProject, setEditingGitProject] = useState<GitProject | null>(null);
  const [viewingGitProject, setViewingGitProject] = useState<GitProject | null>(null);
  const [editingCommand, setEditingCommand] = useState<CommandItem | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
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

  const handleSelectWorkspace = useCallback((id: string | null) => {
    setSelectedWorkspace(id);
    if (id) {
      localStorage.setItem('pv_workspace_id', id);
    } else {
      localStorage.removeItem('pv_workspace_id');
    }
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
      const [allPrompts, allCategories, allSkills, allGitProjects, allCommands, allBookmarks, allWorkspaces] = await Promise.all([
        api.getPrompts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSkills().catch(() => []),
        api.getGitProjects().catch(() => []),
        api.getCommands().catch(() => []),
        api.getBookmarks().catch(() => []),
        api.getWorkspaces().catch(() => []),
      ]);
      setPrompts(allPrompts);
      setCategories(allCategories);
      setSkills(allSkills);
      setGitProjects(allGitProjects);
      setCommands(allCommands);
      setBookmarks(allBookmarks);
      setWorkspaces(allWorkspaces);
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
      setGitProjects([]);
      setCommands([]);
      setBookmarks([]);
      setWorkspaces([]);
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

  // Git Projects CRUD
  const handleToggleFavoriteGitProject = useCallback(async (id: string) => {
    try {
      const res = await api.toggleFavorite(id, 'git_project' as any);
      setGitProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: res.added } : p));
      addToast(res.added ? 'Добавлено в избранное ⭐' : 'Удалено из избранного');
    } catch (err: any) {
      addToast(err.message || 'Ошибка избранного', 'error');
    }
  }, [addToast]);

  const handleDeleteGitProject = useCallback(async (id: string) => {
    try {
      await api.deleteGitProject(id);
      setGitProjects(prev => prev.filter(p => p.id !== id));
      setViewingGitProject(null);
      addToast('Проект удалён');
    } catch (err: any) {
      addToast(err.message || 'Ошибка удаления', 'error');
    }
  }, [addToast]);

  // Commands CRUD & Actions
  const handleToggleFavoriteCommand = useCallback(async (id: string) => {
    try {
      const res = await api.toggleFavorite(id, 'command');
      setCommands(prev => prev.map(c => c.id === id ? { ...c, isFavorite: res.added } : c));
      addToast(res.added ? 'Добавлено в избранное ⭐' : 'Удалено из избранного');
    } catch (err: any) {
      addToast(err.message || 'Ошибка избранного', 'error');
    }
  }, [addToast]);

  const handleDeleteCommand = useCallback(async (id: string) => {
    try {
      await api.deleteCommand(id);
      setCommands(prev => prev.filter(c => c.id !== id));
      addToast('Команда удалена');
    } catch (err: any) {
      addToast(err.message || 'Ошибка удаления', 'error');
    }
  }, [addToast]);

  const handleCopyCommand = useCallback(async (cmd: CommandItem) => {
    try {
      await navigator.clipboard.writeText(cmd.commandText);
      addToast('Команда скопирована! 📋');
      api.useCommand(cmd.id).then(({ usageCount }) => {
        setCommands(prev => prev.map(c => c.id === cmd.id ? { ...c, usageCount } : c));
      }).catch(() => {});
    } catch {
      addToast('Не удалось скопировать текст', 'error');
    }
  }, [addToast]);

  // Bookmarks CRUD & Actions
  const handleToggleFavoriteBookmark = useCallback(async (id: string) => {
    try {
      const res = await api.toggleFavorite(id, 'bookmark');
      setBookmarks(prev => prev.map(b => b.id === id ? { ...b, isFavorite: res.added } : b));
      addToast(res.added ? 'Добавлено в избранное ⭐' : 'Удалено из избранного');
    } catch (err: any) {
      addToast(err.message || 'Ошибка избранного', 'error');
    }
  }, [addToast]);

  const handleDeleteBookmark = useCallback(async (id: string) => {
    try {
      await api.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      addToast('Закладка удалена');
    } catch (err: any) {
      addToast(err.message || 'Ошибка удаления', 'error');
    }
  }, [addToast]);

  const handleOpenBookmark = useCallback((bookmark: BookmarkItem) => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    api.clickBookmark(bookmark.id).then(({ clickCount }) => {
      setBookmarks(prev => prev.map(b => b.id === bookmark.id ? { ...b, clickCount } : b));
    }).catch(() => {});
  }, []);

  const handleCopyBookmarkUrl = useCallback(async (bookmark: BookmarkItem) => {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      addToast('Ссылка скопирована! 📋');
    } catch {
      addToast('Не удалось скопировать ссылку', 'error');
    }
  }, [addToast]);

  // Workspaces CRUD & Actions
  const handleSaveWorkspace = useCallback(async (data: { name: string; icon: string; color: string }) => {
    try {
      if (editingWorkspace) {
        const updated = await api.updateWorkspace(editingWorkspace.id, data);
        setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
        addToast('Пространство обновлено! ✨');
      } else {
        const created = await api.createWorkspace(data);
        setWorkspaces(prev => [...prev, created]);
        handleSelectWorkspace(created.id);
        addToast(`Пространство "${created.name}" создано! ✨`);
      }
      setEditingWorkspace(null);
      setIsWorkspaceModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Ошибка сохранения пространства', 'error');
      throw err;
    }
  }, [editingWorkspace, handleSelectWorkspace, addToast]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    try {
      await api.deleteWorkspace(id);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      if (selectedWorkspace === id) {
        handleSelectWorkspace(null);
      }
      addToast('Пространство удалено');
      setEditingWorkspace(null);
      setIsWorkspaceModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Ошибка удаления', 'error');
      throw err;
    }
  }, [selectedWorkspace, handleSelectWorkspace, addToast]);

  // Workspace-filtered datasets
  const displayedPrompts = selectedWorkspace ? prompts.filter(p => p.workspaceId === selectedWorkspace) : prompts;
  const displayedSkills = selectedWorkspace ? skills.filter(s => s.workspaceId === selectedWorkspace) : skills;
  const displayedGitProjects = selectedWorkspace ? gitProjects.filter(g => g.workspaceId === selectedWorkspace) : gitProjects;
  const displayedCommands = selectedWorkspace ? commands.filter(c => c.workspaceId === selectedWorkspace) : commands;
  const displayedBookmarks = selectedWorkspace ? bookmarks.filter(b => b.workspaceId === selectedWorkspace) : bookmarks;

  const sidebarStats = {
    promptsCount: displayedPrompts.length,
    skillsCount: displayedSkills.length,
    gitCount: displayedGitProjects.length,
    commandsCount: displayedCommands.length,
    bookmarksCount: displayedBookmarks.length,
  };

  const currentWorkspaceObj = workspaces.find(w => w.id === selectedWorkspace);

  // Hotkeys
  useHotkeys({
    user,
    searchInputRef,
    onOpenNewForm: () => {
      if (activeSection === 'prompts') setIsFormOpen(true);
      else if (activeSection === 'skills') setIsSkillFormOpen(true);
      else if (activeSection === 'git') setIsGitFormOpen(true);
      else if (activeSection === 'commands') {
        setEditingCommand(null);
        setIsCommandFormOpen(true);
      }
      else if (activeSection === 'bookmarks') {
        setEditingBookmark(null);
        setIsBookmarkFormOpen(true);
      }
    },
    onCloseAll: () => {
      if (isWorkspaceModalOpen) {
        setIsWorkspaceModalOpen(false);
        setEditingWorkspace(null);
        return;
      }
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
      if (isGitFormOpen) {
        setIsGitFormOpen(false);
        setEditingGitProject(null);
        return;
      }
      if (isCommandFormOpen) {
        setIsCommandFormOpen(false);
        setEditingCommand(null);
        return;
      }
      if (isBookmarkFormOpen) {
        setIsBookmarkFormOpen(false);
        setEditingBookmark(null);
        return;
      }
      if (viewingPrompt) {
        setViewingPrompt(null);
        return;
      }
      if (viewingGitProject) {
        setViewingGitProject(null);
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }
    },
  });

  const skillFilters = useSkillFilters(displayedSkills, user);

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
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#000000] text-[#0a0a0a] dark:text-zinc-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 px-6 py-4 flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 cursor-pointer transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tighter hidden sm:block text-zinc-900 dark:text-white">
              PROMPT<span className="text-sky-500 dark:text-sky-400">VAULT</span>
            </h1>

            {/* Активное пространство badge */}
            {currentWorkspaceObj && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs font-semibold text-sky-400">
                <span className="text-sm">{currentWorkspaceObj.icon}</span>
                <span className="max-w-[140px] truncate">{currentWorkspaceObj.name}</span>
                <button
                  type="button"
                  onClick={() => handleSelectWorkspace(null)}
                  className="p-0.5 hover:bg-sky-500/20 rounded-md text-sky-400/70 hover:text-sky-300 transition-colors ml-0.5 cursor-pointer"
                  title="Показать все материалы"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Главное Меню Разделов */}
          <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-900/90 border border-zinc-300/60 dark:border-zinc-800 p-1 rounded-2xl transition-colors">
            <button
              onClick={() => setActiveSection('prompts')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'prompts' ? "bg-sky-400 text-black shadow-md shadow-sky-400/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <span>📷 Промпты</span>
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'skills' ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <span>📦 Skills & Файлы</span>
            </button>
            <button
              onClick={() => setActiveSection('git')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'git' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <span>🐙 Git Hub</span>
            </button>
            <button
              onClick={() => setActiveSection('commands')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'commands' ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <span>⚡ Команды</span>
            </button>
            <button
              onClick={() => setActiveSection('bookmarks')}
              className={cn(
                "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeSection === 'bookmarks' ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <span>🌐 Закладки</span>
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveSection('admin')}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2",
                  activeSection === 'admin' ? "bg-violet-500 text-white shadow-md shadow-violet-500/20" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <span>👥 Пользователи</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={
              activeSection === 'prompts' ? "Поиск промптов... (Ctrl+K)" :
              activeSection === 'skills' ? "Поиск скиллов, агентов, MCP... (Ctrl+K)" :
              activeSection === 'git' ? "Поиск проектов, агентов, моделей... (Ctrl+K)" :
              activeSection === 'commands' ? "Поиск команд, инструкций, сниппетов... (Ctrl+K)" :
              activeSection === 'bookmarks' ? "Поиск сайтов, закладок, тегов... (Ctrl+K)" :
              "Поиск... (Ctrl+K)"
            }
            value={activeSection === 'prompts' ? searchQuery : activeSection === 'skills' ? skillFilters.searchQuery : searchQuery}
            onChange={(e) => {
              if (activeSection === 'prompts') {
                setSearchQuery(e.target.value);
              } else if (activeSection === 'skills') {
                skillFilters.setSearchQuery(e.target.value);
              } else {
                setSearchQuery(e.target.value);
              }
            }}
            className={cn(
              "w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none transition-all text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 shadow-sm",
              activeSection === 'git' ? "focus:border-emerald-400" :
              activeSection === 'commands' ? "focus:border-amber-400" :
              activeSection === 'bookmarks' ? "focus:border-cyan-400" :
              "focus:border-sky-400"
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {activeSection !== 'admin' && (
            <button 
              onClick={() => {
                if (activeSection === 'prompts') setIsFormOpen(true);
                else if (activeSection === 'skills') setIsSkillFormOpen(true);
                else if (activeSection === 'git') setIsGitFormOpen(true);
                else if (activeSection === 'commands') {
                  setEditingCommand(null);
                  setIsCommandFormOpen(true);
                }
                else if (activeSection === 'bookmarks') {
                  setEditingBookmark(null);
                  setIsBookmarkFormOpen(true);
                }
              }}
              className={cn(
                "p-3 rounded-2xl transition-all shadow-lg cursor-pointer",
                activeSection === 'prompts' ? "bg-sky-400 text-black shadow-sky-400/20" :
                activeSection === 'git' ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                activeSection === 'commands' ? "bg-amber-500 text-black shadow-amber-500/20" :
                activeSection === 'bookmarks' ? "bg-cyan-400 text-black shadow-cyan-400/20" :
                "bg-purple-500 text-white shadow-purple-500/20"
              )}
              title={
                activeSection === 'prompts' ? 'Создать промпт' :
                activeSection === 'git' ? 'Добавить проект' :
                activeSection === 'commands' ? 'Создать команду' :
                activeSection === 'bookmarks' ? 'Добавить сайт' :
                'Загрузить пакет скиллов'
              }
            >
              <Plus size={20} />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
            title={isDark ? "Включить светлую тему (shadcn/frosted)" : "Включить тёмную тему (ThoughtLab/obsidian)"}
          >
            {isDark ? (
              <Sun size={20} className="text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon size={20} className="text-zinc-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
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
              prompts={displayedPrompts}
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
              skills={displayedSkills}
              user={user}
              skillFilters={skillFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onViewSkill={(s) => setSpacedSkill(s)}
              onToggleFavorite={handleToggleFavoriteSkill}
            />
          )}

          {activeSection === 'git' && (
            <GitProjectsSection
              projects={displayedGitProjects}
              user={user}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onViewProject={(p) => setViewingGitProject(p)}
              onToggleFavorite={handleToggleFavoriteGitProject}
              searchQuery={searchQuery}
            />
          )}

          {activeSection === 'commands' && (
            <CommandsSection
              commands={displayedCommands}
              skills={displayedSkills}
              user={user}
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              onEditCommand={(cmd) => {
                setEditingCommand(cmd);
                setIsCommandFormOpen(true);
              }}
              onDeleteCommand={handleDeleteCommand}
              onToggleFavorite={handleToggleFavoriteCommand}
              onCopyCommand={handleCopyCommand}
              onOpenSkill={(skillId) => {
                const s = skills.find(sk => sk.id === skillId);
                if (s) {
                  setActiveSection('skills');
                  setSpacedSkill(s);
                }
              }}
              onOpenCreateModal={() => {
                setEditingCommand(null);
                setIsCommandFormOpen(true);
              }}
            />
          )}

          {activeSection === 'bookmarks' && (
            <BookmarksSection
              bookmarks={displayedBookmarks}
              user={user}
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              onEditBookmark={(b) => {
                setEditingBookmark(b);
                setIsBookmarkFormOpen(true);
              }}
              onDeleteBookmark={handleDeleteBookmark}
              onToggleFavorite={handleToggleFavoriteBookmark}
              onOpenWebsite={handleOpenBookmark}
              onCopyUrl={handleCopyBookmarkUrl}
              onOpenCreateModal={() => {
                setEditingBookmark(null);
                setIsBookmarkFormOpen(true);
              }}
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
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => { setEditingWorkspace(null); setIsWorkspaceModalOpen(true); }}
        onOpenEditWorkspace={(ws) => { setEditingWorkspace(ws); setIsWorkspaceModalOpen(true); }}
        stats={sidebarStats}
        activeSection={activeSection}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        prompts={displayedPrompts}
        user={user}
        searchQuery={searchQuery}
        onPickTag={setSearchQuery}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onOpenAdmin={user.role === 'admin' ? () => setActiveSection('admin') : undefined}
      />

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isWorkspaceModalOpen && (
          <WorkspaceModal
            isOpen={isWorkspaceModalOpen}
            workspace={editingWorkspace}
            onClose={() => {
              setIsWorkspaceModalOpen(false);
              setEditingWorkspace(null);
            }}
            onSave={handleSaveWorkspace}
            onDelete={handleDeleteWorkspace}
          />
        )}
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
            selectedWorkspace={selectedWorkspace}
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
            selectedWorkspace={selectedWorkspace}
          />
        )}
        {isGitFormOpen && (
          <GitProjectForm
            initialData={editingGitProject || undefined}
            onSave={async (projectData) => {
              try {
                if (editingGitProject) {
                  const updated = await api.updateGitProject(editingGitProject.id, projectData);
                  setGitProjects(prev => prev.map(p => p.id === editingGitProject.id ? updated : p));
                  addToast('Проект обновлён ✅');
                } else {
                  const created = await api.createGitProject({
                    ...projectData,
                    workspaceId: projectData.workspaceId !== undefined ? projectData.workspaceId : (selectedWorkspace || undefined),
                  });
                  setGitProjects(prev => [created, ...prev]);
                  addToast('Проект добавлен ✅');
                }
                setIsGitFormOpen(false);
                setEditingGitProject(null);
              } catch (err: any) {
                addToast(err.message || 'Ошибка сохранения', 'error');
                throw err;
              }
            }}
            onClose={() => { setIsGitFormOpen(false); setEditingGitProject(null); }}
          />
        )}
        {viewingGitProject && (
          <GitProjectView
            project={viewingGitProject}
            onClose={() => setViewingGitProject(null)}
            onEdit={() => {
              setEditingGitProject(viewingGitProject);
              setViewingGitProject(null);
              setIsGitFormOpen(true);
            }}
            onDelete={() => handleDeleteGitProject(viewingGitProject.id)}
            effectiveUser={user}
          />
        )}
        {isCommandFormOpen && (
          <CommandForm
            isOpen={isCommandFormOpen}
            initialData={editingCommand}
            skills={skills}
            user={user}
            onSave={async (cmdData) => {
              try {
                if (editingCommand) {
                  const updated = await api.updateCommand(editingCommand.id, cmdData);
                  setCommands(prev => prev.map(c => c.id === editingCommand.id ? updated : c));
                  addToast('Команда обновлена ✅');
                } else {
                  const created = await api.createCommand({
                    ...cmdData,
                    workspaceId: cmdData.workspaceId !== undefined ? cmdData.workspaceId : (selectedWorkspace || undefined),
                  } as any);
                  setCommands(prev => [created, ...prev]);
                  addToast('Команда добавлена ✅');
                }
                setIsCommandFormOpen(false);
                setEditingCommand(null);
              } catch (err: any) {
                addToast(err.message || 'Ошибка сохранения команды', 'error');
                throw err;
              }
            }}
            onDelete={handleDeleteCommand}
            onClose={() => {
              setIsCommandFormOpen(false);
              setEditingCommand(null);
            }}
          />
        )}
        {isBookmarkFormOpen && (
          <BookmarkForm
            isOpen={isBookmarkFormOpen}
            initialData={editingBookmark}
            folders={DEFAULT_BOOKMARK_FOLDERS}
            existingFolders={Array.from(new Set(bookmarks.map(b => b.folder).filter(Boolean)))}
            existingCategories={bookmarks.reduce((acc, b) => {
              const f = b.folder || 'Общее';
              if (!acc[f]) acc[f] = [];
              if (b.category && b.category !== 'default' && !acc[f].includes(b.category)) {
                acc[f].push(b.category);
              }
              return acc;
            }, {} as { [folder: string]: string[] })}
            user={user}
            onSave={async (bookmarkData) => {
              try {
                if (editingBookmark) {
                  const updated = await api.updateBookmark(editingBookmark.id, bookmarkData);
                  setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? updated : b));
                  addToast('Закладка обновлена ✅');
                } else {
                  const created = await api.createBookmark({
                    ...bookmarkData,
                    workspaceId: bookmarkData.workspaceId !== undefined ? bookmarkData.workspaceId : (selectedWorkspace || undefined),
                  } as any);
                  setBookmarks(prev => [created, ...prev]);
                  addToast('Сайт добавлен в закладки ✅');
                }
                setIsBookmarkFormOpen(false);
                setEditingBookmark(null);
              } catch (err: any) {
                addToast(err.message || 'Ошибка сохранения закладки', 'error');
                throw err;
              }
            }}
            onDelete={handleDeleteBookmark}
            onClose={() => {
              setIsBookmarkFormOpen(false);
              setEditingBookmark(null);
            }}
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
