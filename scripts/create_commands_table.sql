-- ─── Таблица commands ────────────────────────────────────────────────────────
-- Выполнить в Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

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

-- Индексы для быстрого поиска и фильтрации
CREATE INDEX IF NOT EXISTS idx_commands_user_id   ON public.commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_category  ON public.commands(category);
CREATE INDEX IF NOT EXISTS idx_commands_skill_id  ON public.commands(skill_id);
CREATE INDEX IF NOT EXISTS idx_commands_target_ai ON public.commands(target_ai);
CREATE INDEX IF NOT EXISTS idx_commands_tags      ON public.commands USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_commands_created   ON public.commands(created_at DESC);

-- Обновление CHECK-констрейнта user_favorites для поддержки типа 'command'
DO $$ 
BEGIN
    ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_item_type_check;
    ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_item_type_check 
        CHECK (item_type IN ('prompt', 'skill', 'git_project', 'command'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT 'commands table created and favorites constraint updated successfully!' AS status;
