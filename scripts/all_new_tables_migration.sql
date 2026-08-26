-- ==============================================================================
-- 🚀 ВСЕ МИГРАЦИИ PROMPTVAULT (Git Projects, Commands, Bookmarks, Skill Hints)
-- ==============================================================================
-- Вставьте и выполните этот код в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1️⃣ Таблица Git проектов (Git Hub & AI Tools)
CREATE TABLE IF NOT EXISTS public.git_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_git_projects_user_id  ON public.git_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_git_projects_category ON public.git_projects(category);
CREATE INDEX IF NOT EXISTS idx_git_projects_pricing  ON public.git_projects(pricing);
CREATE INDEX IF NOT EXISTS idx_git_projects_tags     ON public.git_projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_git_projects_created  ON public.git_projects(created_at DESC);


-- 2️⃣ Таблица команд и воркфлоу (AI Commands & Workflows)
CREATE TABLE IF NOT EXISTS public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    command_text TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    target_ai TEXT NOT NULL DEFAULT 'universal',
    tags TEXT[] DEFAULT '{}',
    variables TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    author_name TEXT NOT NULL DEFAULT '',
    author_email TEXT NOT NULL DEFAULT '',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commands_user_id   ON public.commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_category  ON public.commands(category);
CREATE INDEX IF NOT EXISTS idx_commands_skill_id  ON public.commands(skill_id);
CREATE INDEX IF NOT EXISTS idx_commands_target_ai ON public.commands(target_ai);
CREATE INDEX IF NOT EXISTS idx_commands_tags      ON public.commands USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_commands_created   ON public.commands(created_at DESC);


-- 3️⃣ Таблица сайтов и закладок (Web Bookmarks Hub)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id   ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder    ON public.bookmarks(folder);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category  ON public.bookmarks(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags      ON public.bookmarks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created   ON public.bookmarks(created_at DESC);


-- 4️⃣ Таблица подсказок к скиллам (Skill Hints) и расширение skills
CREATE TABLE IF NOT EXISTS public.skill_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_hints_skill_id ON public.skill_hints(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_hints_user_id  ON public.skill_hints(user_id);

ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS skill_types TEXT[] DEFAULT '{}';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS target_ais TEXT[] DEFAULT '{universal}';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS skill_origin TEXT DEFAULT 'own';


-- 5️⃣ Обновление таблицы избранного (user_favorites) для всех разделов
DO $$ 
BEGIN
    ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_item_type_check;
    ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_item_type_check 
        CHECK (item_type IN ('prompt', 'skill', 'git_project', 'command', 'bookmark'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT '✅ Все таблицы (git_projects, commands, bookmarks, skill_hints) и избранное успешно созданы!' AS result;
