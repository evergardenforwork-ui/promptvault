# PromptVault — Project Context for Antigravity

> Этот файл автоматически читается AGY при каждом старте сессии.
> **Последнее обновление**: 2026-08-05 (актуально на эту дату — синхронизирован с реальными файлами проекта)

---

## 🗂️ Что это за проект?

**PromptVault** — персональное fullstack веб-приложение для хранения и управления промптами для нейросетей.
ИИ-ассистент на базе Google Gemini API в данный момент **отключён** (в разработке).

**Репозиторий**: `C:\Users\Alekin\Desktop\Проекты\superbasetest`

> ⚠️ Папка называется `superbasetest` — это рабочая директория проекта PromptVault.

---

## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Анимации | Framer Motion (`motion` v12) |
| Backend | Express.js (`server.ts`) — API + Vite dev-сервер |
| Serverless | `api/index.ts` — Express adapter для Vercel Functions |
| База данных | Supabase (PostgreSQL) + Supabase Storage (бакеты `prompt-images`, `prompt-files`) |
| ИИ | Google Gemini API (Временно отключён) |
| Иконки | `lucide-react` |
| Markdown | `react-markdown` |
| ZIP | `jszip` (клиент) + `adm-zip` (сервер) |
| Пароли | `bcryptjs` |

**Запуск**: `npm run dev` → `http://localhost:3000` (через `tsx server.ts`)
**Сборка**: `npm run build`
**Очистка**: `npm run clean` (`npx rimraf dist`)
**Линтинг**: `npm run lint` (TypeScript `--noEmit`)

---

## ⚙️ Критическая заметка по серверу

В `server.ts` Vite интегрирован с `appType: "custom"` (НЕ `"spa"`).
Причина: `appType: "spa"` перехватывает все `/api/*` запросы и отдаёт `index.html`, ломая API.
Ручной SPA fallback добавлен после `app.use(vite.middlewares)`.

**Vercel**: `api/index.ts` — тот же Express app, но без `listen()` и без Vite middleware. Экспортирует `default app`.
**Безопасность**: API ключи удалены из клиентской сборки (vite.config.ts). Все API роуты обёрнуты в try/catch, на POST/PUT эндпоинтах есть валидация.

---

## 📁 РЕАЛЬНАЯ структура проекта (актуально)

```
superbasetest/
├── GEMINI.md               ← Ты читаешь это сейчас
├── server.ts               ← Express API + Vite dev-сервер (единый процесс, dev only)
├── api/
│   └── index.ts            ← Express adapter для Vercel Serverless (production)
├── vercel.json             ← Vercel конфиг: /api/* → api/index.ts, /* → dist/
├── vite.config.ts          ← GEMINI_API_KEY убран из сборки
├── tsconfig.json
├── package.json            ← name='promptvault', dev='tsx server.ts', build='vite build'
├── index.html              ← lang='ru', title='PromptVault'
├── .env                    ← Локальные секреты (не в git)
├── .env.example            ← Шаблон: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
├── .gitignore              ← node_modules, dist, .env, data/, firestore-export/, graphify-out/
│
├── scripts/
│   ├── migrateToSupabase.ts        ← Скрипт миграции JSON → Supabase (данные уже перенесены)
│   └── create_skill_hints_table.sql ← SQL для создания таблицы skill_hints (выполнить в Supabase!)
│
├── Agent/                  ← Документация и планирование
│   ├── MD_files/
│   │   ├── PRD.md          ← ✅ Актуально (2026-08-05)
│   │   ├── DESIGN.md
│   │   ├── ARCHITECTURE.md
│   │   ├── SCHEMA.md       ← ✅ Актуально (2026-08-05) — snake_case колонки Supabase
│   │   └── RULES.md
│   └── plan/
│       ├── plan.md         ← ✅ Актуально (2026-08-05)
│       ├── plan_supabase.md         ← ✅ Актуально — все шаги выполнены, осталось git push
│       ├── plan_skill_space.md      ← ✅ Завершено
│       └── plan_skill_hints.md      ← ✅ Завершено (кроме SQL таблицы в Supabase)
│
└── src/
    ├── main.tsx
    ├── App.tsx             ← центральный state + навигация
    ├── types.ts
    ├── index.css
    │
    ├── components/
    │   ├── auth/
    │   │   └── LoginForm.tsx
    │   ├── layout/
    │   │   └── Sidebar.tsx
    │   └── ui/
    │       ├── Toast.tsx
    │       ├── CategoryForm.tsx
    │       ├── ConfirmDialog.tsx
    │       ├── ImageCropper.tsx
    │       ├── ImageUpload.tsx
    │       └── FileTreeViewer.tsx
    │
    ├── hooks/
    │   ├── useHotkeys.ts
    │   ├── usePromptFilters.ts
    │   └── useSkillFilters.ts          ← Выделенная фильтрация для скиллов, типов ИИ и авторов
    │
    ├── sections/
    │   ├── admin/
    │   │   └── UsersSection.tsx
    │   │
    │   ├── photo/                       ← Раздел промптов
    │   │   ├── PhotoCard.tsx
    │   │   ├── PhotoForm.tsx
    │   │   ├── PhotoView.tsx            ← Включает заглушку "in development" для ИИ
    │   │   ├── form/
    │   │   │   ├── ImageSlotsSection.tsx
    │   │   │   └── SubSectionsEditor.tsx
    │   │   └── view/
    │   │       ├── AIAssistant.tsx      ← Файл существует, но НЕ импортируется (отключён)
    │   │       ├── CollapsibleText.tsx
    │   │       └── MiniLayoutPreview.tsx
    │   │
    │   └── skills/                      ← Раздел Пространств скиллов
    │       ├── SkillCard.tsx
    │       ├── SkillForm.tsx
    │       ├── SkillSpaceView.tsx
    │       └── space/
    │           ├── SpaceFileTree.tsx     ← VS Code дерево файлов + чекбоксы
    │           ├── SpaceFilePreview.tsx  ← Markdown/код превью + breadcrumb + inline editor
    │           ├── SpaceContextMenu.tsx  ← ПКМ glassmorphism меню
    │           ├── SpaceSelectionBar.tsx ← Плавающая панель выделения
    │           └── SkillHintsPanel.tsx   ← Панель подсказок-промптов к скиллу
    │
    ├── services/
    │   ├── api.ts
    │   └── gemini.ts
    │
    └── utils/
        ├── cn.ts
        ├── zipParser.ts
        └── buildSelectionZip.ts
```

---

## 🔑 TypeScript типы (`src/types.ts`)

```typescript
User           { uid, displayName, email, role: 'admin'|'user' }
Prompt         { id, userId, title, category, tags, subSections[], mainPrompt,
                 mediaType?, usageNotes?, filePackageUrl?, fileStructure?,
                 imageBefore?, imageAfter?, originalImage*, additionalImages[],
                 imageLayoutType?, isFavorite, isPublic, promptOrigin?,
                 authorName, authorEmail, usageCount, createdAt }
SkillPackage   { id, userId, title, description, category, skillTypes: string[], targetAis?: string[],
                 tags, fileStructure[], filePackageUrl?, isFavorite, isPublic,
                 authorName, authorEmail, createdAt }
SkillHint      { id, skillId, userId, title, text, createdAt }
SubSection     { title, text, imageBefore?, imageAfter?, originalImage*, additionalImages?, imageLayoutType? }
FileNode       { name, path, type:'file'|'directory', content?, size?, children? }
Category       { id, userId, name, emoji, color }
ChatMessage    { id, promptId, userId, role:'user'|'model', content, image?, createdAt }
MediaType      'photo' | 'video' | 'text' | 'music'
AssistantConfig { systemPrompt }
```

---

## 🌐 API Эндпоинты (`server.ts` и `api/index.ts`)

Оба файла содержат идентичные роуты. `server.ts` — dev-сервер, `api/index.ts` — Vercel prod.

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | Логин (bcrypt) |
| GET | `/api/prompts` | Список промптов (limit/offset поддержка) |
| POST | `/api/prompts` | Создать промпт (с валидацией) |
| PUT | `/api/prompts/:id` | Обновить промпт (с валидацией) |
| DELETE | `/api/prompts/:id` | Удалить промпт |
| GET | `/api/skills` | Список пакетов скиллов |
| POST | `/api/skills` | Создать пакет (с валидацией) |
| PUT | `/api/skills/:id` | Обновить пакет (с валидацией) |
| DELETE | `/api/skills/:id` | Удалить пакет |
| GET | `/api/skills/:id/hints` | Список подсказок скилла |
| POST | `/api/skills/:id/hints` | Создать подсказку { title, text } |
| DELETE | `/api/skills/:id/hints/:hintId` | Удалить подсказку |
| GET | `/api/categories` | Список категорий |
| POST | `/api/categories` | Создать категорию |
| DELETE | `/api/categories/:id` | Удалить категорию |
| GET | `/api/chats` | История чатов |
| POST | `/api/chats` | Добавить сообщение |
| POST | `/api/chats/clear` | Очистить чат |
| GET | `/api/export` | Скачать бэкап ZIP (admin only) |
| POST | `/api/import` | Восстановить из ZIP (admin only) |
| GET | `/api/favorites` | Личное избранное пользователя |
| POST | `/api/favorites/toggle` | Добавить/убрать из избранного |
| GET | `/api/users` | Список пользователей (admin only) |
| POST | `/api/users` | Создать пользователя (admin only) |
| DELETE | `/api/users/:uid` | Удалить пользователя (admin only) |
| PUT | `/api/users/:uid/password` | Сменить пароль (admin only) |
| POST | `/api/gemini/chat` | Чат с Gemini (временно не используется) |
| POST | `/api/gemini/analyze` | Анализ изображения Gemini (временно не используется) |

---

## 🔑 Бизнес-логика

### Пользователи и Безопасность
- **Администратор**: `evergardenforwork@gmail.com` (uid: `admin-uid`) — видит и редактирует всё.
- Пароли: bcrypt (`$2b$` hash) в Supabase `users` table
- Auth: Bearer токен = `uid`. Хранится в localStorage (`pv_token`/`pv_user`).

### Навигация в App.tsx
- **Промпты**: `viewingPrompt: Prompt | null`, `editingPrompt`, `isFormOpen: boolean`
- **Скиллы**: `spacedSkill: SkillPackage | null`
- **Разделы**: `activeSection: 'prompts' | 'skills' | 'admin'`
- Навигация реализована исключительно через state (без react-router).

---

## 🚀 ТЕКУЩИЙ СТАТУС: ГОТОВ К ДЕПЛОЮ НА VERCEL

### ✅ Всё реализовано и работает:
- Supabase PostgreSQL (6 таблиц: users, prompts, skills, skill_hints, categories, chats, user_favorites)
- Supabase Storage (2 бакета: prompt-images, prompt-files)
- `vercel.json` создан
- `api/index.ts` создан (Vercel Serverless adapter)
- Skill Hints + Inline File Editor реализованы

### ❗ Осталось 3 шага (вручную):
1. **Supabase**: выполнить `scripts/create_skill_hints_table.sql` в SQL Editor
2. **Git**: `git add -A && git commit -m "feat: Vercel ready" && git push`
3. **Vercel**: импортировать репо, добавить env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`)

### Контекст Supabase (ТЕКУЩИЙ БЭКЕНД):
- **Проект**: `evergarden` (FREE tier, PRODUCTION)
- **URL**: `https://pubsalagmikwbdztjwhq.supabase.co`
- **Таблицы**: `categories`, `prompts`, `chats`, `skills`, `users`, `user_favorites`, `skill_hints` (создать!)
- **Storage Buckets (PUBLIC)**: `prompt-images`, `prompt-files`

---

## 🤖 Инструкции для AGY

### Обязательно перед любой задачей:
1. Проверь `src/types.ts` — единый источник типов.
2. API роуты добавляй ОДНОВРЕМЕННО в `server.ts` И `api/index.ts`.
3. Используй `ConfirmDialog.tsx` вместо `window.confirm()`.
4. Стили: Tailwind CSS v4 (без `tailwind.config.js`).
5. Используй **навыки (skills)** при работе с Supabase! Читай `.agents/skills/supabase/SKILL.md`.
6. Не раскрывай `.env` в коде или логах.

### Vite + Express:
- Dev: `tsx server.ts` запускает оба (Express + Vite) в одном процессе.
- Prod (Vercel): `api/index.ts` — только API, без Vite.
- SPA fallback в `server.ts` реализован вручную после `app.use(vite.middlewares)`.
- В `vercel.json` SPA fallback — через `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`.

---

## 🤖 Почему GEMINI.md устаревает и как это решить

**Когда обновлять** (скажи AGY: "обнови GEMINI.md"):
- После добавления/удаления компонентов или файлов.
- После изменения API эндпоинтов.
- После структурных изменений проекта.
