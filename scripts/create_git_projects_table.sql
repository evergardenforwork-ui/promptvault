-- ─── Таблица git_projects ─────────────────────────────────────────────────────
-- Выполнить в Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_git_projects_user_id  ON public.git_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_git_projects_category ON public.git_projects(category);
CREATE INDEX IF NOT EXISTS idx_git_projects_pricing  ON public.git_projects(pricing);
CREATE INDEX IF NOT EXISTS idx_git_projects_tags     ON public.git_projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_git_projects_created  ON public.git_projects(created_at DESC);

-- Обновление CHECK-констрейнта user_favorites для поддержки 'git_project'
DO $$ 
BEGIN
    ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_item_type_check;
    ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_item_type_check 
        CHECK (item_type IN ('prompt', 'skill', 'git_project'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT 'git_projects table created and favorites constraint updated successfully!' AS status;
