-- ==============================================================================
-- 🚀 PROMPTVAULT — CANONICAL SUPABASE DATABASE SCHEMA (MASTER)
-- ==============================================================================
-- Этот файл содержит полную чистую схему базы данных Supabase PostgreSQL со всеми
-- 10 таблицами, внешними ключами, проверками, RLS политиками и индексами.
-- Актуально на: 2026-08-26 (100% синхронизировано с реальной базой и кодом проекта)
--
-- Инструкция по применению:
-- Скопируйте весь файл и выполните в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- Расширения Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1️⃣ ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (USERS)
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2️⃣ ТАБЛИЦА РАБОЧИХ ПРОСТРАНСТВ (WORKSPACES)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT 'sky-400',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);

-- 3️⃣ ТАБЛИЦА КАТЕГОРИЙ (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '📁',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- 4️⃣ ТАБЛИЦА ПРОМПТОВ (PROMPTS)
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT '',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    main_prompt TEXT NOT NULL,
    usage_notes TEXT,
    media_type TEXT DEFAULT 'photo',
    prompt_origin TEXT DEFAULT 'own',
    is_public BOOLEAN DEFAULT false,
    image_layout_type TEXT DEFAULT 'single',
    image_before TEXT,
    image_after TEXT,
    original_image_before TEXT,
    original_image_after TEXT,
    original_image_slot2 TEXT,
    additional_images TEXT[] DEFAULT '{}',
    file_package_url TEXT,
    file_structure JSONB DEFAULT '{}'::jsonb,
    sub_sections JSONB DEFAULT '[]'::jsonb,
    author_name TEXT DEFAULT 'Alexey',
    author_email TEXT DEFAULT 'alexey.unstam@gmail.com',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id      ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_workspace_id ON public.prompts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category     ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_tags         ON public.prompts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at   ON public.prompts(created_at DESC);

-- 5️⃣ ТАБЛИЦА СКИЛЛОВ И WEB IDE (SKILLS)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    skill_types TEXT[] DEFAULT '{}',
    target_ais TEXT[] DEFAULT '{universal}',
    skill_origin TEXT DEFAULT 'own',
    tags TEXT[] DEFAULT '{}',
    file_structure JSONB DEFAULT '[]'::jsonb,
    file_package_url TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    author_name TEXT DEFAULT 'Alexey',
    author_email TEXT DEFAULT 'alexey.unstam@gmail.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_skills_user_id      ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_workspace_id ON public.skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skills_tags         ON public.skills USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_skills_types        ON public.skills USING GIN (skill_types);
CREATE INDEX IF NOT EXISTS idx_skills_target_ais   ON public.skills USING GIN (target_ais);
CREATE INDEX IF NOT EXISTS idx_skills_created_at   ON public.skills(created_at DESC);

-- 6️⃣ ТАБЛИЦА ПОДСКАЗОК К СКИЛЛАМ (SKILL HINTS)
CREATE TABLE IF NOT EXISTS public.skill_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_hints_skill_id ON public.skill_hints(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_hints_user_id  ON public.skill_hints(user_id);

-- 7️⃣ ТАБЛИЦА GIT ПРОЕКТОВ (GIT PROJECTS & AI TOOLS)
CREATE TABLE IF NOT EXISTS public.git_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'tools',
    summary TEXT NOT NULL,
    features TEXT,
    detailed_description TEXT,
    install_command TEXT,
    author_notes TEXT,
    github_url TEXT,
    demo_url TEXT,
    image TEXT,
    tags TEXT[] DEFAULT '{}',
    pricing TEXT NOT NULL DEFAULT 'free',
    is_public BOOLEAN DEFAULT true,
    author_name TEXT NOT NULL DEFAULT '',
    author_email TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_git_projects_user_id      ON public.git_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_git_projects_workspace_id ON public.git_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_git_projects_category     ON public.git_projects(category);
CREATE INDEX IF NOT EXISTS idx_git_projects_pricing      ON public.git_projects(pricing);
CREATE INDEX IF NOT EXISTS idx_git_projects_tags         ON public.git_projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_git_projects_created_at   ON public.git_projects(created_at DESC);

-- 8️⃣ ТАБЛИЦА КОМАНД И ВОРКФЛОУ (COMMANDS & WORKFLOWS)
CREATE TABLE IF NOT EXISTS public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    command_text TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    target_ai TEXT NOT NULL DEFAULT 'universal',
    tags TEXT[] DEFAULT '{}',
    variables TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    author_name TEXT NOT NULL DEFAULT '',
    author_email TEXT NOT NULL DEFAULT '',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commands_user_id      ON public.commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_workspace_id ON public.commands(workspace_id);
CREATE INDEX IF NOT EXISTS idx_commands_skill_id     ON public.commands(skill_id);
CREATE INDEX IF NOT EXISTS idx_commands_category     ON public.commands(category);
CREATE INDEX IF NOT EXISTS idx_commands_tags         ON public.commands USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_commands_created_at   ON public.commands(created_at DESC);

-- 9️⃣ ТАБЛИЦА ЗАКЛАДОК И САЙТОВ (BOOKMARKS HUB)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    folder TEXT NOT NULL DEFAULT 'Общее',
    category TEXT NOT NULL DEFAULT 'default',
    image TEXT,
    favicon TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    author_name TEXT NOT NULL DEFAULT '',
    author_email TEXT NOT NULL DEFAULT '',
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id      ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON public.bookmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder       ON public.bookmarks(folder);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags         ON public.bookmarks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at   ON public.bookmarks(created_at DESC);

-- 🔟 ТАБЛИЦА ЧАТОВ С ИИ (CHATS)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id TEXT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chats_prompt_id ON public.chats(prompt_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id   ON public.chats(user_id);

-- 1️⃣1️⃣ ТАБЛИЦА ИЗБРАННОГО ПОЛЬЗОВАТЕЛЕЙ (USER FAVORITES)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'skill', 'git_project', 'command', 'bookmark')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id   ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item      ON public.user_favorites(item_id, item_type);

-- 🔒 НАСТРОЙКА БЕЗОПАСНОСТИ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_hints    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.git_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Сервисные политики (Service Role имеет полный доступ, запросы идут через Express backend)
DROP POLICY IF EXISTS "Allow backend access users"          ON public.users;
DROP POLICY IF EXISTS "Allow backend access workspaces"     ON public.workspaces;
DROP POLICY IF EXISTS "Allow backend access categories"     ON public.categories;
DROP POLICY IF EXISTS "Allow backend access prompts"        ON public.prompts;
DROP POLICY IF EXISTS "Allow backend access skills"         ON public.skills;
DROP POLICY IF EXISTS "Allow backend access skill_hints"    ON public.skill_hints;
DROP POLICY IF EXISTS "Allow backend access git_projects"   ON public.git_projects;
DROP POLICY IF EXISTS "Allow backend access commands"       ON public.commands;
DROP POLICY IF EXISTS "Allow backend access bookmarks"      ON public.bookmarks;
DROP POLICY IF EXISTS "Allow backend access chats"          ON public.chats;
DROP POLICY IF EXISTS "Allow backend access user_favorites" ON public.user_favorites;

CREATE POLICY "Allow backend access users"          ON public.users          FOR ALL USING (true);
CREATE POLICY "Allow backend access workspaces"     ON public.workspaces     FOR ALL USING (true);
CREATE POLICY "Allow backend access categories"     ON public.categories     FOR ALL USING (true);
CREATE POLICY "Allow backend access prompts"        ON public.prompts        FOR ALL USING (true);
CREATE POLICY "Allow backend access skills"         ON public.skills         FOR ALL USING (true);
CREATE POLICY "Allow backend access skill_hints"    ON public.skill_hints    FOR ALL USING (true);
CREATE POLICY "Allow backend access git_projects"   ON public.git_projects   FOR ALL USING (true);
CREATE POLICY "Allow backend access commands"       ON public.commands       FOR ALL USING (true);
CREATE POLICY "Allow backend access bookmarks"      ON public.bookmarks      FOR ALL USING (true);
CREATE POLICY "Allow backend access chats"          ON public.chats          FOR ALL USING (true);
CREATE POLICY "Allow backend access user_favorites" ON public.user_favorites FOR ALL USING (true);

SELECT '🎉 PromptVault: Полная схема базы данных Supabase успешно инициализирована!' AS status;
