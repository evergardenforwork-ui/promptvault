-- Таблица подсказок к скиллам (Skill Hints)
-- Выполнить в Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.skill_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_skill_hints_skill_id ON skill_hints(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_hints_user_id ON skill_hints(user_id);
