# Plan: Перенос PromptVault на Supabase (Phase 1)

> Этот документ описывает пошаговый план миграции локальной JSON-базы и файлов PromptVault на облачный бэкенд Supabase.
> Приоритет Phase 1: Перенос хранения промптов, категорий, изображений и авторизации. Без усложнений (видео пока не добавляем).

---

## 🎯 Что мы получим в итоге?

1. **PostgreSQL** вместо `prompts.json`, `categories.json`, `users.json`.
2. **Supabase Storage** вместо локальной папки `data/images/`.
3. **Supabase Auth** вместо локального `bcrypt` в JSON.
4. **Быстрый доступ и надежность** — данные будут храниться в облаке Supabase, больше никаких рисков потерять JSON или фото при деплое.

---

## 📋 Требования от пользователя (Что нужно подготовить)

Для старта вам потребуется **бесплатный аккаунт на Supabase**:
1. Зайти на [supabase.com](https://supabase.com) и зарегистрироваться.
2. Создать новый бесплатный проект (например, под названием `PromptVault`).
3. Скопировать из настроек проекта (`Project Settings` -> `API`):
   - **`SUPABASE_URL`** (Project URL)
   - **`SUPABASE_ANON_KEY`** (Publishable key)
   - **`SUPABASE_SERVICE_ROLE_KEY`** (Secret key для бэкенда/мигратора)

---

## 🗓️ Пошаговый план миграции (Steps)

### 🔹 Этап 1: Создание структуры БД в Supabase (Postgres Schema)

Нам понадобятся 3 основные таблицы и 1 Storage bucket:

1. **`categories`**:
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `name` (text)
   - `emoji` (text)
   - `color` (text)
   - `created_at` (timestamp)

2. **`prompts`**:
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `title` (text)
   - `category_id` (uuid, references categories)
   - `tags` (text[])
   - `main_prompt` (text)
   - `sub_sections` (jsonb) — динамические варианты и вкладки
   - `image_layout_type` (text) — single, slider, split и т.д.
   - `image_before` (text) — URL в Supabase Storage
   - `image_after` (text)
   - `original_image_before` (text)
   - `original_image_after` (text)
   - `original_image_slot2` (text)
   - `additional_images` (text[])
   - `is_public` (boolean, default false)
   - `prompt_origin` (text, 'own' | 'web')
   - `author_name` (text)
   - `author_email` (text)
   - `usage_count` (integer, default 0)
   - `usage_notes` (text)
   - `media_type` (text, default 'photo')
   - `created_at` (timestamp)

3. **Storage Bucket**:
   - Название bucket: `prompt-images` (публичный бакет для хранения фото промптов).

---

### 🔹 Этап 2: Настройка безопасности (Row Level Security - RLS)

Согласно лучшим практикам Supabase (`supabase-postgres-best-practices`):
- Включаем RLS на таблицах `prompts` и `categories`.
- **Политика чтения `prompts`**: Пользователь видит промпт, если `is_public = true` ИЛИ `user_id = auth.uid()`.
- **Политика создания/редактирования/удаления**: Только если `user_id = auth.uid()`.

---

### 🔹 Этап 3: Скрипт миграции существующих данных (Import Data)

Напишем одноразовый Node.js скрипт `scripts/migrate-to-supabase.ts`:
1. Прочитает локальные `data/prompts.json` и `data/categories.json`.
2. Загрузит все картинки из `data/images/` в бакет `prompt-images` Supabase Storage и получит публичные URL.
3. Запишет все категории и промпты в таблицы Supabase Postgres.

---

### 🔹 Этап 4: Подключение `@supabase/supabase-js` в проект

1. Установка пакета: `npm install @supabase/supabase-js`.
2. Создание клиента Supabase в `src/services/supabaseClient.ts`.
3. Перевод эндпоинтов сервера или прямого клиентского кода на использование Supabase SDK.

---

### 🔹 Этап 5: Авторизация через Supabase Auth

1. Замена локального входа по `data/users.json` на `supabase.auth.signInWithPassword`.
2. Настройка первой учетной записи администратора в панели Supabase Auth.

---

### 🔹 Этап 6: Проверка и тестирование

1. Проверка отображения списка промптов.
2. Проверка загрузки новых изображений (Canvas Crop -> Supabase Storage).
3. Проверка публичного/приватного режима.
4. Проверка создания/удаления категорий.

---

## 🔮 Мои ожидания и риски

- **Что будет легко**: Миграция изображений и текстовых полей промптов пройдет гладко, так как `subSections` мы положим в надежный `jsonb` формат без потери структуры.
- **О чем нужно помнить**: Ссылкам на картинки потребуется замена префиксов (`/uploads/` -> `https://...supabase.co/storage/v1/object/public/prompt-images/...`).
- **Сложность**: Понадобится создать учетную запись в Supabase и вставить URL и API ключи в `.env`.

---

## 🚦 Текущий статус

- [x] Анализ существующего проекта и схемы данных
- [x] Составлен план `plan_supabase.md`
- [ ] Ожидание от пользователя ключей Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Создание SQL-миграции в Supabase
- [ ] Запуск скрипта импорта данных
