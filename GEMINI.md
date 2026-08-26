# PromptVault — Project Context for Antigravity

> Этот файл автоматически читается AGY при каждом старте сессии.
> **Последнее обновление**: 2026-08-23 (актуально на эту дату — синхронизирован с реальными файлами проекта)

---

## 🗂️ Что это за проект?

**PromptVault** — персональное fullstack веб-приложение для хранения и управления промптами для нейросетей, а также пакетами скиллов, агентов и MCP-серверов (Skills & AI Hub).
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
| Markdown | `react-markdown` + `remark-gfm` + `remark-frontmatter` |
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
**Защита ИИ & Токенов**: Встроен Kill Switch (`DISABLE_AI=true`), Rate Limiter (1 req/3s, max 15/min), таймаут 25s, ограничение входного текста до 12k символов и `maxOutputTokens: 2048`.

---

## 📁 РЕАЛЬНАЯ структура проекта (актуально)

```
superbasetest/
├── GEMINI.md               ← Ты читаешь это сейчас
├── CHANGELOG.md            ← 📜 Глобальный журнал изменений и Git-история (чекпоинты, теги)
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
│   ├── create_git_projects_table.sql ← SQL для создания таблицы git_projects (выполнить в Supabase!)
│   ├── create_skill_hints_table.sql ← SQL для создания таблицы skill_hints (выполнить в Supabase!)
│   ├── supabase_fix_schema.sql     ← SQL для адаптации типов и RLS
│   ├── manageUsers.ts              ← CLI утилита управления пользователями и паролями
│   ├── checkSchema.ts              ← Проверка схемы базы данных
│   ├── checkTables.ts              ← Проверка таблиц в Supabase
│   ├── fixSchema.ts                ← Исправление колонок базы
│   ├── fixPromptCategories.ts      ← Корректировка категорий в промптах
│   └── migrateUsers.ts             ← Миграция пользователей
│
├── Agent/                  ← Документация и планирование
│   ├── Superbase/
│   │   └── supabase_schema.sql     ← Базовый DDL файл схемы Supabase
│   ├── MD_files/
│   │   ├── PRD.md          ← ✅ Актуально (2026-08-23)
│   │   ├── DESIGN.md       ← ✅ Актуально (2026-08-23)
│   │   ├── ARCHITECTURE.md ← ✅ Актуально (2026-08-23)
│   │   ├── SCHEMA.md       ← ✅ Актуально (2026-08-23) — snake_case колонки Supabase
│   │   ├── RULES.md        ← ✅ Актуально (2026-08-23)
│   │   ├── DATABASE.md     ← ✅ Актуально (2026-08-23)
│   │   ├── USER_MANAGEMENT.md ← ✅ Актуально (2026-08-23)
│   │   └── project_structure.md ← ✅ Актуально (2026-08-23)
│   └── plan/
│       ├── plan.md                 ← 🟡 Актуальный план и бэклог (2026-08-23)
│       ├── plan_git_hub.md         ← [✅ ВЫПОЛНЕНО] Раздел Git Tools & Gemini Parser
│       ├── plan_supabase.md        ← [✅ ВЫПОЛНЕНО]
│       ├── plan_skill_space.md     ← [✅ ВЫПОЛНЕНО]
│       ├── plan_skill_hints.md     ← [✅ ВЫПОЛНЕНО]
│       └── plan_file_system.md     ← [✅ ВЫПОЛНЕНО]
│
└── src/
    ├── main.tsx
    ├── App.tsx             ← центральный state + навигация + табы ownership фильтров
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
    │       └── FileTreeViewer.tsx
    │
    ├── hooks/
    │   ├── useHotkeys.ts
    │   ├── usePromptFilters.ts         ← Фильтрация промптов (all, my-all, my-own, my-web, others)
    │   └── useSkillFilters.ts          ← Фильтрация скиллов (all, my-all, my-own, my-web, others, ИИ платформы)
    │
    ├── sections/
    │   ├── admin/
    │   │   └── UsersSection.tsx
    │   │
    │   ├── prompts/                     ← Раздел промптов (оркестрация и тулбар)
    │   │   └── PromptsSection.tsx       ← Сетка карточек + Toolbar фильтров + пагинация
    │   │
    │   ├── photo/                       ← Компоненты промптов (карточки, формы, просмотр)
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
    │   ├── skills/                      ← Раздел Пространств скиллов
    │   │   ├── SkillsSection.tsx        ← Сетка карточек + Toolbar фильтров типов/ИИ
    │   │   ├── SkillCard.tsx
    │   │   ├── SkillForm.tsx
    │   │   ├── SkillSpaceView.tsx       ← IDE лейаут (h-screen), без скролла окна, сворачиваемое описание
    │   │   └── space/
    │   │       ├── SpaceFileTree.tsx     ← VS Code дерево файлов + чекбоксы
    │   │       ├── SpaceFilePreview.tsx  ← Markdown/код превью + breadcrumb + inline editor (Ctrl+S)
    │   │       ├── SpaceContextMenu.tsx  ← ПКМ glassmorphism меню
    │   │       ├── SpaceSelectionBar.tsx ← Плавающая панель выделения
    │   │       └── SkillHintsPanel.tsx   ← Панель подсказок-промптов к скиллу
    │   │
    │   ├── git/                         ← 🐙 Раздел Git Hub & AI Tools
    │   │   ├── GitProjectsSection.tsx    ← Сетка карточек + Toolbar фильтров
    │   │   ├── GitProjectCard.tsx        ← Карточка проекта (grid/list)
    │   │   ├── GitProjectForm.tsx        ← Форма создания/редактирования
    │   │   ├── AiSmartParserModal.tsx    ← 🪄 AI Smart Parser модалка (Gemini 3.1)
    │   │   └── GitProjectView.tsx        ← Просмотр проекта с аккордеонами
    │   │
    │   ├── commands/                    ← ⚡ Раздел Команд & Инструкций
    │   │   ├── CommandsSection.tsx       ← Сетка карточек + Toolbar фильтров + сортировка
    │   │   ├── CommandCard.tsx           ← Карточка команды (grid/list) + 1-клик копирование
    │   │   ├── CommandForm.tsx           ← Форма создания/редактирования + вставка параметров
    │   │   └── CommandFillModal.tsx      ← Модалка заполнения плейсхолдеров {{...}}
    │   │
    │   └── bookmarks/                   ← 🌐 Раздел Закладок & Веб-сайтов
    │       ├── BookmarksSection.tsx      ← Оркестратор: папки-вкладки, подкатегории, тулбар, сетка/список
    │       ├── BookmarkCard.tsx          ← Карточка сайта (grid/list) + 1-клик открытие и копирование
    │       ├── BookmarkForm.tsx          ← Форма создания/редактирования + авто-Favicon и скриншот
    │       └── FolderCreateModal.tsx     ← Модалка создания кастомной папки/подкатегории
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
                 tags, fileStructure[], filePackageUrl?, isFavorite, isPublic, skillOrigin?: 'own' | 'web',
                 authorName, authorEmail, createdAt }
GitProject     { id, userId, title, category: GitProjectCategory, summary, features?,
                 detailedDescription?, installCommand?, authorNotes?, githubUrl?, demoUrl?,
                 image?, tags: string[], pricing: 'free'|'freemium'|'paid', isFavorite?, isPublic?, createdAt }
CommandItem    { id, userId, title, commandText, description?, category: CommandCategory,
                 skillId?, skillTitle?, targetAi?, tags: string[], variables?: string[],
                 isFavorite?, isPublic?, authorName, authorEmail, usageCount, createdAt }
SkillHint      { id, skillId, userId, title, text, createdAt }
SubSection     { title, text, imageBefore?, imageAfter?, originalImage*, additionalImages?, imageLayoutType? }
FileNode       { name, path, type:'file'|'directory', content?, size?, children? }
Category       { id, userId, name, emoji, color }
ChatMessage    { id, promptId, userId, role:'user'|'model', content, image?, createdAt }
MediaType      'photo' | 'video' | 'text' | 'music'
SkillType      'skill' | 'agent' | 'mcp' | 'config' | 'rules' | 'template' | 'hooks' | 'other'
TargetAi       'universal' | 'claude' | 'gemini' | 'chatgpt' | 'deepseek' | 'cursor' | 'other'
SourceFilter   'all' | 'my-all' | 'my-own' | 'my-web' | 'others'
AssistantConfig { systemPrompt }
```

---

## 🌐 API Эндпоинты (`server.ts` и `api/index.ts`)

Оба файла содержат идентичные роуты. `server.ts` — dev-сервер, `api/index.ts` — Vercel prod.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Диагностический health check (статус, env vars) |
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
| GET | `/api/git-projects` | Список Git проектов/тулзов |
| POST | `/api/git-projects` | Создать Git проект (с валидацией) |
| PUT | `/api/git-projects/:id` | Обновить Git проект (с валидацией) |
| DELETE | `/api/git-projects/:id` | Удалить Git проект |
| POST | `/api/gemini/parse-tool` | Gemini 3.1 Flash-Lite ИИ-парсер скриншотов/ссылок/текста |
| GET | `/api/commands` | Список сохранённых команд и инструкций |
| POST | `/api/commands` | Создать команду (с валидацией) |
| PUT | `/api/commands/:id` | Обновить команду (с валидацией) |
| DELETE | `/api/commands/:id` | Удалить команду |
| POST | `/api/commands/:id/use` | Инкремент счётчика использования команды |
| GET | `/api/bookmarks` | Список сохранённых сайтов и закладок |
| POST | `/api/bookmarks` | Создать закладку (с валидацией) |
| PUT | `/api/bookmarks/:id` | Обновить закладку (с валидацией) |
| DELETE | `/api/bookmarks/:id` | Удалить закладку |
| POST | `/api/bookmarks/:id/click` | Инкремент счётчика переходов на сайт |
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

---

## 🔑 Бизнес-логика

### Пользователи и Безопасность
- **Администратор**: `evergardenforwork@gmail.com` (uid: `admin-uid`) — видит и редактирует всё.
- Пароли: bcrypt (`$2b$` hash) в Supabase `users` table
- Auth: Bearer токен = `uid`. Хранится в localStorage (`pv_token`/`pv_user`).

### Фильтры источников (Ownership)
- **Все (+ чужие)** (`'all'`): все записи в базе данных.
- **Все мои** (`'my-all'`): все материалы текущего пользователя (Авторские + Из сети).
- **Мои (Авторские)** (`'my-own'`): материалы пользователя со статусом `promptOrigin !== 'web'` / `skillOrigin !== 'web'`.
- **Мои (Из сети)** (`'my-web'`): материалы пользователя со статусом `web`.
- **Чужие (Публичные)** (`'others'`): публичные материалы других пользователей (`userId !== currentUser.uid`).

### Навигация в App.tsx
- **Промпты**: `viewingPrompt: Prompt | null`, `editingPrompt`, `isFormOpen: boolean`
- **Скиллы**: `spacedSkill: SkillPackage | null`, `viewingSkill`, `editingSkill`
- **Git Проекты**: `viewingGitProject`, `editingGitProject` (будет в `src/sections/git/`)
- **Разделы**: `activeSection: 'prompts' | 'skills' | 'git' | 'admin'`
- Навигация реализована исключительно через state (без react-router).

---

## 🚀 ТЕКУЩИЙ СТАТУС & ПЛАНЫ

### ✅ Всё реализовано и работает:
- Модульная архитектура секций (`PromptsSection.tsx`, `SkillsSection.tsx`, `UsersSection.tsx`)
- Supabase PostgreSQL (таблицы: users, prompts, skills, skill_hints, categories, chats, user_favorites)
- Supabase Storage (бакеты: prompt-images, prompt-files)
- `vercel.json` и `api/index.ts` готовы к деплою на Vercel
- Полнофункциональный прототип `test/index.html` v2.1 протестирован и одобрен пользователем
- **🐙 Раздел «Git Hub & AI Tools»** — ПОЛНОСТЬЮ РЕАЛИЗОВАН:
  - SQL-миграция `scripts/create_git_projects_table.sql` (выполнить в Supabase!)
  - CRUD API `/api/git-projects` (GET/POST/PUT/DELETE) в `server.ts` и `api/index.ts`
  - Gemini 3.1 Flash-Lite Smart Parser `/api/gemini/parse-tool` (URL / текст / скриншот → JSON)
  - `GitProjectsSection.tsx` — сетка с фильтрами категорий, цены, источника
  - `GitProjectCard.tsx` — карточки с hero-image, бейджами, ссылками
  - `GitProjectForm.tsx` — форма + встроенный AI Smart Parser модал (🪄 Wand2)
  - `GitProjectView.tsx` — полноэкранный просмотр с аккордеонами (Фичи, Установка, Описание, Заметки)

### ✅ Раздел «Git Hub & AI Tools» — ВЫПОЛНЕНО (2026-08-23):
1. ✅ **База данных**: `scripts/create_git_projects_table.sql` — **выполнить в Supabase SQL Editor!**
2. ✅ **API**: CRUD `/api/git-projects` + `/api/gemini/parse-tool` — в `server.ts` и `api/index.ts`.
3. ✅ **Frontend**: `GitProjectsSection`, `GitProjectCard`, `GitProjectForm` (+ AI-модал), `GitProjectView`.
4. ✅ **Навигация**: вкладка `🐙 Git Hub` добавлена в Header `App.tsx`.

### 🔴 Следующий этап (будущие задачи):
- Выполнить SQL-миграцию `scripts/create_git_projects_table.sql` в Supabase
- Расширить фильтры Git Hub (поиск по тегам как облако)
- Добавить поддержку `git_projects` в backup export/import

---

## 🤖 Инструкции для AGY и ИИ-Агентов

### 📚 С чего начинать читать проект (Порядок онбординга):
1. **[`GEMINI.md`](GEMINI.md)** *(этот файл)* — текущий статус, стек, структура файлов и критические правила.
2. **[`CHANGELOG.md`](CHANGELOG.md)** — контрольные точки (Git tags `v1.0-checkpoint` и др.) и история изменений.
3. **[`Agent/plan/plan_git_hub.md`](Agent/plan/plan_git_hub.md)** — 🔴 **ПЛАН РЕАЛИЗАЦИИ РАЗДЕЛА GIT TOOLS & GEMINI PARSER**.
4. **[`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md)** & **[`SCHEMA.md`](Agent/MD_files/SCHEMA.md)** — архитектура модульных разделов, типы и Supabase DDL.
5. **[`Agent/plan/plan.md`](Agent/plan/plan.md)** — актуальный бэклог задач. **НЕ читать** завершённые планы `[✅ ВЫПОЛНЕНО]`.

### Обязательно перед любой задачей:
1. Проверь `src/types.ts` — единый источник типов.
2. API роуты добавляй ОДНОВРЕМЕННО в `server.ts` И `api/index.ts`.
3. Используй `ConfirmDialog.tsx` вместо `window.confirm()`.
4. Стили: Tailwind CSS v4 (без `tailwind.config.js`).
5. Модульность: Новые вкладки/страницы создавай как изолированные секции в `src/sections/` (например, `src/sections/git/GitProjectsSection.tsx`), не раздувая `src/App.tsx`.
6. Используй **навыки (skills)** при работе с Supabase! Читай `.agents/skills/supabase/SKILL.md`.
7. Не раскрывай `.env` в коде или логах.

### ⚠️ ПРАВИЛО ДЕКОМПОЗИЦИИ ФАЙЛОВ — ОБЯЗАТЕЛЬНО:
> **ОДИН компонент = ОДИН файл**. Запрещено складывать модалки, тулбары, панели и отдельные блоки внутрь основного компонента.

**Паттерн новой секции:**
```
src/sections/<domain>/
├── <Domain>Section.tsx   ← оркестратор (~150–250 строк)
├── <Domain>Card.tsx      ← карточка (~100–200 строк)
├── <Domain>Form.tsx      ← только форма (~200–350 строк)
├── <Domain>View.tsx      ← только просмотр (~200–350 строк)
└── XxxModal.tsx          ← отдельная модалка если есть (~100–200 строк)
```

**Исключения (можно держать большими):**
- `server.ts` и `api/index.ts` — бэкенд-монолиты (так по архитектуре)
- `App.tsx` — только state + навигация, НЕ рендер UI
- Утилиты < 150 строк (`cn.ts`, `buildSelectionZip.ts`)

**Порог:** файл > **~250 строк** или > **~15KB** — обязательно разбить.

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
