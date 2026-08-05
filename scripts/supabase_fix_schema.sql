-- ============================================================
-- SQL для Supabase Dashboard → SQL Editor
-- Адаптирует схему под кастомный auth (uid = TEXT)
-- ============================================================

-- 1. Сначала удаляем FK constraints (если есть) чтобы изменить типы
-- categories
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
-- prompts  
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_category_id_fkey;
-- skills
ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_user_id_fkey;
-- chats
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_prompt_id_fkey;

-- 2. Меняем UUID → TEXT для user_id везде
ALTER TABLE public.categories ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.prompts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.skills ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.chats ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Добавляем поле category (TEXT) в prompts рядом с category_id (UUID)
--    Будем использовать category (TEXT название) вместо category_id (UUID FK)
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- 4. Делаем prompt_id в chats тоже TEXT (совместимость с нашими uuid строками)
ALTER TABLE public.chats ALTER COLUMN prompt_id TYPE TEXT USING prompt_id::TEXT;

-- 5. Проставляем admin-uid для всех записей с null user_id
UPDATE public.prompts SET user_id = 'admin-uid' WHERE user_id IS NULL;
UPDATE public.categories SET user_id = 'admin-uid' WHERE user_id IS NULL;

-- 6. Таблица users: создаём если нет (она уже есть — пропустим)
-- CREATE TABLE IF NOT EXISTS ...

-- 7. Таблица user_favorites (уже есть и уже TEXT)
-- Просто проверяем
SELECT 'user_favorites.user_id type ok' WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'user_favorites' AND column_name = 'user_id' AND data_type = 'text'
);

-- 8. Отключаем RLS для всех таблиц (мы используем сервисный ключ на сервере)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- Готово! Проверка:
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'prompts'
  AND column_name IN ('user_id', 'category', 'category_id')
ORDER BY column_name;
