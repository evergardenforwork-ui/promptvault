# PromptVault — Project Context for Antigravity

> Этот файл автоматически читается AGY при каждом старте сессии.
> **Последнее обновление**: 2026-08-26 (актуально на эту дату — синхронизирован с реальными файлами проекта)

---

## 🗂️ Что это за проект?

**PromptVault** — персональное fullstack веб-приложение для хранения и управления промптами для нейросетей, а также пакетами скиллов, агентов и MCP-серверов (Skills & AI Hub), Git-инструментами, AI-командами и закладками веб-сайтов.

**Репозиторий**: `C:\Users\Alekin\Desktop\Проекты\superbasetest`

---

## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Темизация | Dual Theme Engine (ThoughtLab Dark / shadcn Light) |
| Анимации | Framer Motion (`motion` v12) |
| Backend | Express.js (`server.ts`) — API + Vite dev-сервер (Cloud & Local SQLite dual-engine) |
| Serverless | `api/index.ts` — Express adapter для Vercel Functions |
| База данных | **Dual-Engine**: ☁️ Supabase (PostgreSQL + Storage) ИЛИ 💻 Local SQLite (`better-sqlite3` + `data/uploads/`) |
| ИИ | Google Gemini API (`gemini-3.1-flash-lite` в `/api/gemini/parse-tool`) |
| Иконки | `lucide-react` |
| Markdown | `react-markdown` + `remark-gfm` + `remark-frontmatter` |
| ZIP | `jszip` (клиент) + `adm-zip` (сервер) |
| Пароли | `bcryptjs` |

**Запуск**: `npm run dev` → `http://localhost:3000` (через `tsx server.ts` — работает с Supabase или офлайн на SQLite)
**Сборка**: `npm run build`
**Очистка**: `npm run clean` (`npx rimraf dist`)
**Линтинг**: `npm run lint` (TypeScript `--noEmit`)

---

## 📁 РЕАЛЬНАЯ структура проекта (актуально)

```
superbasetest/
├── GEMINI.md               ← Ты читаешь это сейчас
├── AGENTS.md               ← 🤖 Универсальная инструкция для всех ИИ-агентов
├── CLAUDE.md               ← 🟣 Входной файл для Claude Code
├── CHANGELOG.md            ← 📜 Глобальный журнал изменений и Git-история
├── server.ts               ← Express API + Vite dev-сервер (Cloud & Local SQLite dual-engine)
├── server/                 ← ⚙️ Серверные модули хранилища и бэкапа
│   ├── localDb.ts          ← Инициализатор SQLite базы (data/promptvault.db)
│   ├── dbAdapter.ts        ← Универсальный адаптер БД (Cloud Supabase ↔ Local SQLite)
│   ├── mediaStorage.ts     ← Унифицированное сохранение и чтение медиа (Storage ↔ data/uploads/)
│   └── backupService.ts    ← Умный Full-Media экспорт/импорт (выгрузка и распаковка картинок в ZIP)
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
│   ├── schema.sql                    ← 🚀 Каноническая полная SQL схема Supabase (все 10 таблиц)
│   ├── manageUsers.ts                ← CLI утилита управления пользователями и паролями
│   └── migrateToSupabase.ts          ← Утилита миграции данных
│
├── Agent/                  ← Документация и планирование
│   ├── MD_files/
│   │   ├── PRD.md          ← ✅ Актуально (2026-08-26)
│   │   ├── DESIGN.md       ← ✅ Актуально (2026-08-26)
│   │   ├── ARCHITECTURE.md ← ✅ Актуально (2026-08-26)
│   │   ├── SCHEMA.md       ← ✅ Актуально (2026-08-26) — snake_case колонки Supabase
│   │   ├── RULES.md        ← ✅ Актуально (2026-08-26)
│   │   ├── DATABASE.md     ← ✅ Актуально (2026-08-26)
│   │   ├── USER_MANAGEMENT.md ← ✅ Актуально (2026-08-26)
│   │   └── project_structure.md ← ✅ Актуально (2026-08-26)
│   └── plan/
│       ├── plan.md                 ← 🟡 Актуальный план и бэклог (2026-08-26)
│       ├── plan_git_hub.md         ← [✅ ВЫПОЛНЕНО]
│       ├── plan_commands.md        ← [✅ ВЫПОЛНЕНО]
│       ├── plan_bookmarks.md       ← [✅ ВЫПОЛНЕНО]
│       ├── plan_supabase.md        ← [✅ ВЫПОЛНЕНО]
│       ├── plan_skill_space.md     ← [✅ ВЫПОЛНЕНО]
│       ├── plan_skill_hints.md     ← [✅ ВЫПОЛНЕНО]
│       └── plan_file_system.md     ← [✅ ВЫПОЛНЕНО]
│
└── src/
    ├── main.tsx
    ├── App.tsx             ← центральный state + селектор пространств + навигация
    ├── types.ts
    ├── index.css
    │
    ├── components/
    │   ├── auth/
    │   │   └── LoginForm.tsx
    │   ├── layout/
    │   │   └── Sidebar.tsx
    │   └── ui/
    │       ├── WorkspaceModal.tsx
    │       ├── Toast.tsx
    │       ├── CategoryForm.tsx
    │       ├── ConfirmDialog.tsx
    │       ├── ImageCropper.tsx
    │       └── FileTreeViewer.tsx
    │
    ├── hooks/
    │   ├── useTheme.ts                 ← Двухтемный режим (dark/light)
    │   ├── useHotkeys.ts
    │   ├── usePromptFilters.ts         ← Фильтрация промптов
    │   └── useSkillFilters.ts          ← Фильтрация скиллов
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
    │       ├── BookmarksSection.tsx      ← Оркестратор: браузерная иерархия, хлебные крошки, тулбар, сетка/список
    │       ├── BookmarkCard.tsx          ← Карточка сайта (grid/list) + 1-клик открытие и копирование
    │       ├── BookmarkForm.tsx          ← Форма создания/редактирования + древовидный выбор папки + Favicon/скриншот
    │       ├── FolderCreateModal.tsx     ← Модалка создания папки/подпапки с выбором родителя
    │       └── bookmarkTreeUtils.ts      ← Утилиты расчета дерева папок, путей и счетчиков сайтов
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
- **Git Проекты**: `viewingGitProject`, `editingGitProject`, `isGitFormOpen`
- **Команды**: `editingCommand`, `isCommandFormOpen`
- **Закладки**: `editingBookmark`, `isBookmarkFormOpen`
- **Разделы**: `activeSection: 'prompts' | 'skills' | 'git' | 'commands' | 'bookmarks' | 'admin'`
- Навигация реализована исключительно через state (без react-router).

---

## 🚀 ТЕКУЩИЙ СТАТУС & ПЛАНЫ

### ✅ Всё реализовано и работает:
- Модульная архитектура секций (`PromptsSection.tsx`, `SkillsSection.tsx`, `UsersSection.tsx`, `GitProjectsSection.tsx`, `CommandsSection.tsx`, `BookmarksSection.tsx`)
- **⭐ Личное Избранное**: 100% паритет фильтрации и переключения избранного во всех 5 хабах (`Prompts`, `Skills`, `Git`, `Commands`, `Bookmarks`) с каскадной автоочисткой `user_favorites` при удалении карточек
- **🚀 Dual-Engine Architecture**: Cloud Supabase (PostgreSQL + Storage) ИЛИ Zero-Config Local SQLite (`better-sqlite3` + `data/uploads/`) с автоматическим переключением через `server/dbAdapter.ts`
- **💾 Full-Media Backup & Workspaces Export**: `backupService.ts` выгружает все 5 типов сущностей и бинарные картинки в ZIP, подменяет пути, импортирует на лету и поддерживает выгрузку конкретного воркспейса
- **🐙 Раздел «Git Hub & AI Tools»**:
  - CRUD API `/api/git-projects`, Gemini 3.1 Flash-Lite Smart Parser (мультимодальный ввод: URL + текст + до 4 скриншотов одновременно), `GitProjectsSection`, `GitProjectCard`, `GitProjectForm`, `GitProjectView`.
- **⚡ Раздел «AI Commands & Workflows»**:
  - CRUD API `/api/commands`, 1-клик копирование, смарт-параметры `{{param}}` (`CommandFillModal`), привязка к скиллам, `CommandsSection`, `CommandCard`, `CommandForm`.
- **🌐 Раздел «Web Bookmarks & Sites Hub»**:
  - CRUD API `/api/bookmarks`, древовидная иерархия папок с бесконечной вложенностью (`folder: "A / B / C"`), интерактивные хлебные крошки (`📁 Все закладки > 🤖 AI > 📷 Фото`), компактная сетка подпапок со счётчиками сайтов, создание папок на лету (`FolderCreateModal`), авто-Favicon/домен, `BookmarksSection`, `BookmarkCard`, `BookmarkForm`, `bookmarkTreeUtils.ts`.

### 🗄️ SQL Схема для Supabase:
- Канонический мастер-скрипт: [`scripts/schema.sql`](scripts/schema.sql) — полная чистая схема базы данных Supabase (все 10 таблиц, внешние ключи, RLS политики, индексы).

### 🔴 Следующий этап (будущие задачи):
- Включить Gemini ИИ-ассистент в промптах (убрать заглушку в `PhotoView.tsx`)
- Профиль пользователя со статистикой и сменой пароля самим пользователем

---

## 🤖 Инструкции для AGY и ИИ-Агентов

### 🚨 КРИТИЧЕСКИЙ ПРОТОКОЛ ПЕРВОГО ДЕЙСТВИЯ (Когда пользователь говорит "посмотри проект" / "сделай задачу"):
1. **Прочитай [`AGENTS.md`](AGENTS.md) или [`GEMINI.md`](GEMINI.md)** — понять назначение, текущий статус и стек.
2. **Проверь [`src/types.ts`](src/types.ts)** — единый источник правды типизации (User, Prompt, SkillPackage, GitProject, CommandItem, BookmarkItem).
3. **Изучи архитектуру**: [`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md) и [`SCHEMA.md`](Agent/MD_files/SCHEMA.md).
4. **Проверь актуальный бэклог**: [`Agent/plan/plan.md`](Agent/plan/plan.md) — смотреть **только** `[🔴 НУЖНО СДЕЛАТЬ]`. **НЕ ЧИТАТЬ** завершённые планы `[✅ ВЫПОЛНЕНО]`.
5. **Используй локальные навыки (Skills)**: загляни в `.agents/skills/` (в частности, `.agents/skills/supabase/SKILL.md` перед работой с базой).
6. **Никогда не читать `node_modules` или случайные файлы наугад**.

### Обязательно перед любой задачей:
1. Проверь `src/types.ts` — единый источник типов.
2. API роуты добавляй ОДНОВРЕМЕННО в `server.ts` И `api/index.ts`.
3. Используй `ConfirmDialog.tsx` вместо `window.confirm()`.
4. Стили: Tailwind CSS v4 (без `tailwind.config.js`).
5. Модульность: Новые вкладки/страницы создавай как изолированные секции в `src/sections/`, не раздувая `src/App.tsx`.
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
