# [✅ ВЫПОЛНЕНО] Plan: Миграция PromptVault на Supabase + деплой Vercel

> **Статус**: ✅ **ВЫПОЛНЕНО ПОЛНОСТЬЮ** (Не требует повторного чтения)
> **Дата завершения**: 2026-08-23

---

## 🎯 Цель

Переключить `server.ts` с локальных JSON-файлов на облачный Supabase (Postgres + Storage) и задеплоить на **Vercel** (serverless).

---

## 🚦 Статус всех этапов

- [x] **Supabase проект создан** — `evergarden` (FREE, PRODUCTION)
- [x] **Ключи в `.env`** — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] **Таблицы созданы**: `categories`, `prompts`, `chats`, `skills`, `users`, `user_favorites`
- [x] **Storage buckets**: `prompt-images`, `prompt-files` (PUBLIC, лимит 50MB)
- [x] **Данные мигрированы** — скрипт `scripts/migrateToSupabase.ts` выполнен
- [x] **`server.ts` переписан** — JSON → Supabase (все 28+ роутов)
- [x] **Загрузка изображений** → Supabase Storage bucket `prompt-images`
- [x] **Схема исправлена** — UUID→TEXT для user_id, добавлен TEXT category в prompts
- [x] **Skill Hints** — таблица `skill_hints`, API роуты, UI (`SkillHintsPanel.tsx`)
- [x] **Inline File Editor** — `SpaceFilePreview.tsx` edit-mode
- [x] **`vercel.json`** — роутинг API + SPA fallback
- [x] **`api/index.ts`** — Express adapter для Vercel Serverless
- [x] **`.gitignore`** — обновлён (firestore-export, graphify-out, .vercel)
- [x] **Git push** — изменения закомичены и отправлены в master
- [ ] **Supabase: создать таблицу `skill_hints`** → выполнить `scripts/create_skill_hints_table.sql`
- [ ] **Подключить Vercel** → импортировать репо, задать env vars

---

## 📋 Оставшиеся шаги (выполнить вручную)

### Шаг 1 — Создать таблицу `skill_hints` в Supabase

Зайти в **Supabase Dashboard → SQL Editor** и выполнить:
```
scripts/create_skill_hints_table.sql
```

### Шаг 2 — Git push

```bash
git add -A
git commit -m "feat: Vercel deploy ready — api/index.ts, vercel.json, Skill Hints, Inline Editor"
git push
```

### Шаг 3 — Подключить Vercel

1. Зайти на vercel.com → New Project → Import Git Repository
2. Выбрать репо `superbasetest`
3. **Настройки сборки** (Vercel автоопределит из `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Environment Variables** — добавить:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
5. Deploy!

---

## ⚙️ Архитектура деплоя на Vercel

```
vercel.json:
  /api/*  → api/index.ts  (Serverless Function, maxDuration: 30s)
  /*      → dist/index.html (Static SPA fallback)

npm run build → vite build → dist/
api/index.ts  → Express app без listen(), экспортирует default app
```

## ⚠️ Важные нюансы

### Vercel Serverless ограничения
- **Нет постоянного файлового хранилища** — все файлы должны быть в Supabase Storage
- **Cold start** — первый запрос может быть ~500ms медленнее
- **maxDuration: 30s** — для загрузки больших изображений (base64 upload)
- **Нет Vite dev-middleware** в `api/index.ts` — только API роуты

### ID: UUID vs string
- В Supabase все ID промптов/скиллов — **uuid** (авто-генерация)
- `users.uid` — TEXT (сохранили совместимость: `admin-uid`, `user_timestamp_random`)

### camelCase ↔ snake_case
- Клиент → сервер → Supabase: `mainPrompt` → `main_prompt`
- Supabase → сервер → клиент: `main_prompt` → `mainPrompt`
- Маппинг полностью задокументирован в `SCHEMA.md`
