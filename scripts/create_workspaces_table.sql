-- ==============================================================================
-- 🚀 Миграция: Таблица рабочих пространств (Workspaces) и связка со всеми 5 хабами
-- ==============================================================================

-- 1. Создание таблицы workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'sky-400',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);

-- Включение RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated on workspaces" ON public.workspaces;
CREATE POLICY "Allow all for authenticated on workspaces" ON public.workspaces FOR ALL USING (true);

-- 2. Безопасное добавление колонки workspace_id во все 5 таблиц
DO $$
BEGIN
  -- Промпты
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='workspace_id') THEN
    ALTER TABLE public.prompts ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;

  -- Скиллы
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='workspace_id') THEN
    ALTER TABLE public.skills ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;

  -- Git Проекты
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='git_projects' AND column_name='workspace_id') THEN
    ALTER TABLE public.git_projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;

  -- Команды
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commands' AND column_name='workspace_id') THEN
    ALTER TABLE public.commands ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;

  -- Закладки
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookmarks' AND column_name='workspace_id') THEN
    ALTER TABLE public.bookmarks ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;
