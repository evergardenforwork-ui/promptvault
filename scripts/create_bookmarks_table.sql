-- ─── Таблица bookmarks ───────────────────────────────────────────────────────
-- Выполнить в Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

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

-- Индексы для быстрого поиска и фильтрации
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id   ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder    ON public.bookmarks(folder);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category  ON public.bookmarks(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags      ON public.bookmarks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created   ON public.bookmarks(created_at DESC);

-- Обновление CHECK-констрейнта user_favorites для поддержки типа 'bookmark'
DO $$ 
BEGIN
    ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_item_type_check;
    ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_item_type_check 
        CHECK (item_type IN ('prompt', 'skill', 'git_project', 'command', 'bookmark'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT 'bookmarks table created and favorites constraint updated successfully!' AS status;
