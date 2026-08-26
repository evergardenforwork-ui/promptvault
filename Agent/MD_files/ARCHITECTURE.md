# ARCHITECTURE.md — System Architecture

> Высокоуровневая карта системы. Перед любым структурным изменением кода
> ИИ должен свериться с этим файлом, чтобы не нарушить существующие паттерны.
> **Последнее обновление**: 2026-08-26

## System Overview & High-Level Diagram

```
Browser (React 19 SPA) — Dual Theme (Dark Obsidian / Light Paper)
        │  HTTP (fetch) + Authorization: Bearer <uid>
        ▼
[ Dev: Express.js (server.ts, порт 3000) / Prod: Vercel Serverless Function (api/index.ts) ]
  ├─ /api/health          ← Диагностический health check
  ├─ /api/auth/*          ← Авторизация (bcrypt)
  ├─ /api/workspaces/*    ← CRUD Рабочих пространств (GET/POST/PUT/DELETE)
  ├─ /api/prompts/*       ← CRUD промптов + пагинация
  ├─ /api/skills/*        ← CRUD пакетов скиллов + /hints
  ├─ /api/git-projects/*  ← CRUD Git проектов (GET/POST/PUT/DELETE)
  ├─ /api/commands/*      ← CRUD команд + инкремент /:id/use
  ├─ /api/bookmarks/*     ← CRUD закладок + инкремент /:id/click
  ├─ /api/categories      ← Управление категориями
  ├─ /api/favorites       ← Личное избранное
  ├─ /api/users/*         ← Управление пользователями (admin only)
  ├─ /api/chats/*         ← История чатов
  ├─ /api/export          ← Резервная копия (ZIP)
  ├─ /api/import          ← Восстановление из ZIP
  └─ /api/gemini/*
       ├─ /api/gemini/chat       ← Чат с историей (временно не используется)
       ├─ /api/gemini/analyze    ← Анализ изображения (временно не используется)
       └─ /api/gemini/parse-tool ← 🪄 AI Smart Parser (URL / текст / скриншот → JSON)
        ├─ Storage Engine (Dual Mode):
        │    ├─ ☁️ Cloud Mode: Supabase (PostgreSQL) + Supabase Storage (prompt-images)
        │    └─ 💻 Local Mode: SQLite (`data/promptvault.db`) + Local Uploads (`data/uploads/`)
        │
        └─ Google Gemini API (gemini-3.1-flash-lite) — активен для /api/gemini/parse-tool
```

## Layered Architecture & Conventions

```
┌──────────────────────────────────────┐
│  Presentation (src/sections/, ui/)   │  React компоненты, формы, карточки, SkillSpaceView
├──────────────────────────────────────┤
│  Hooks & Filters (src/hooks/)        │  usePromptFilters, useSkillFilters, useHotkeys, useTheme
├──────────────────────────────────────┤
│  Services (src/services/)            │  api.ts, gemini.ts
├──────────────────────────────────────┤
│  State (src/App.tsx)                 │  Глобальный state (prompts, skills, workspaces, user)
├──────────────────────────────────────┤
│  Backend / Serverless Layer          │  Express.js (server.ts dev / api/index.ts Vercel prod)
├──────────────────────────────────────┤
│  Data & Storage Layer (Dual-Engine)  │  server/dbAdapter.ts (Supabase Postgres ↔ SQLite promptvault.db)
└──────────────────────────────────────┘
```

## ⚠️ Component Decomposition Rules (Правила декомпозиции)

> **Главное правило**: ОДИН компонент = ОДИН файл. Не сваливай модалки, тулбары и сложную логику в один файл.

### Разрешено держать в одном файле:
| Файл | Почему |
|---|---|
| `server.ts` | Dev-сервер: единый процесс Express + Vite, дублировать нельзя |
| `api/index.ts` | Зеркало `server.ts` для Vercel — должны быть идентичны |
| `App.tsx` | Только глобальный state + навигация. **Рендер секций** через импорт |
| Маленькие (< 150 строк) утилиты | `cn.ts`, `buildSelectionZip.ts` — нет смысла дробить |

### Когда выносить в отдельный файл:
| Сигнал | Действие |
|---|---|
| Компонент > **~200 строк** | Разбить на подкомпоненты |
| Модалка / попап внутри формы | Вынести: `XxxModal.tsx` рядом с `XxxForm.tsx` |
| Логика фильтрации / поиска | Вынести в `src/hooks/useXxx.ts` |
| Повторяющийся UI-блок | Вынести в `src/components/ui/Xxx.tsx` |
| Секция с собственным state и view | Вынести в `src/sections/domain/XxxView.tsx` |

### Паттерн структуры новой секции:
```
src/sections/<domain>/
├── <Domain>Section.tsx      ← Оркестратор: сетка, тулбар, фильтры (~150-250 строк)
├── <Domain>Card.tsx         ← Карточка в сетке (~100-200 строк)
├── <Domain>Form.tsx         ← Форма создания/редактирования (~200-350 строк)
├── <Domain>View.tsx         ← Просмотр / детальная страница (~200-350 строк)
└── [XxxModal.tsx]           ← Отдельная модалка если есть (< 200 строк)
```

### Реальные примеры из проекта:
```
✅ skills/SkillForm.tsx + space/SkillHintsPanel.tsx  — разделены
✅ git/GitProjectForm.tsx + git/AiSmartParserModal.tsx — разделены
✅ photo/form/ImageSlotsSection.tsx + form/SubSectionsEditor.tsx — разделены
❌ (было) git/GitProjectForm.tsx = форма + модалка (30KB) — ИСПРАВЛЕНО
```

## Directory & Domain Structure

```
promptvault/
├── server.ts               ← Dev backend: Express + Vite dev server
├── api/
│   └── index.ts            ← Prod backend: Vercel Serverless Function adapter
├── vercel.json             ← Vercel конфигурация
├── src/
│   ├── App.tsx             ← Центральный state-контейнер + роутинг через view/mode
│   ├── types.ts            ← Все TypeScript интерфейсы (ЕДИНЫЙ источник типов)
│   ├── index.css           ← Tailwind v4 директивы + @theme токены
│   ├── components/
│   │   ├── auth/           ← LoginForm.tsx (форма входа)
│   │   ├── layout/         ← Sidebar.tsx (селектор пространств, навигация, статистика)
│   │   └── ui/             ← WorkspaceModal, Toast, CategoryForm, ImageCropper, ConfirmDialog, FileTreeViewer
│   ├── hooks/              ← Кастомные React-хуки
│   │   ├── useHotkeys.ts          ← Ctrl+K, Ctrl+N, Escape
│   │   ├── usePromptFilters.ts    ← Фильтрация промптов (all, my-all, my-own, my-web, others)
│   │   └── useSkillFilters.ts     ← Фильтрация скиллов (all, my-all, my-own, my-web, others, ИИ)
│   ├── sections/
│   │   ├── admin/
│   │   │   └── UsersSection.tsx  ← Панель управления пользователями
│   │   ├── prompts/
│   │   │   └── PromptsSection.tsx ← Сетка карточек + Toolbar фильтров + пагинация
│   │   ├── photo/
│   │   │   ├── PhotoCard.tsx      ← Карточка промпта в сетке
│   │   │   ├── PhotoForm.tsx      ← Оркестратор формы (создание/редактирование)
│   │   │   ├── PhotoView.tsx      ← Оркестратор просмотра промпта
│   │   │   ├── form/              ← ImageSlotsSection, SubSectionsEditor
│   │   │   └── view/              ← MiniLayoutPreview, CollapsibleText, AIAssistant
│   │   └── skills/
│   │       ├── SkillsSection.tsx  ← Сетка карточек + Toolbar фильтров типов/ИИ
│   │       ├── SkillCard.tsx      ← Карточка скилла в сетке
│   │       ├── SkillForm.tsx      ← Форма создания/редактирования пакета
│   │       ├── SkillSpaceView.tsx ← Полноэкранный IDE-лейаут (h-screen, fixed viewport)
│   │       └── space/             ← SpaceFileTree, SpaceFilePreview, SpaceContextMenu, SpaceSelectionBar, SkillHintsPanel
│   │   ├── git/                       ← 🐙 Git Hub & AI Tools раздел
│   │   │   ├── GitProjectsSection.tsx     ← Сетка + фильтры категорий/цены/источника
│   │   │   ├── GitProjectCard.tsx         ← Карточка с hero-image, бейджами, ссылками
│   │   │   ├── GitProjectForm.tsx         ← Форма (оркестратор, подключает AI-модалку)
│   │   │   ├── AiSmartParserModal.tsx     ← 🪄 AI Smart Parser модалка (изолированная)
│   │   │   └── GitProjectView.tsx         ← Полноэкранный просмотр с аккордеонами
│   │   ├── commands/                  ← ⚡ AI Commands & Workflows раздел
│   │   │   ├── CommandsSection.tsx        ← Сетка + Toolbar + Сортировка
│   │   │   ├── CommandCard.tsx            ← Карточка + 1-Click Copy + счётчик
│   │   │   ├── CommandForm.tsx            ← Форма + вставка {{param}} переменных
│   │   │   └── CommandFillModal.tsx       ← Модалка заполнения параметров
│   │   └── bookmarks/                 ← 🌐 Web Bookmarks Hub раздел
│   │       ├── BookmarksSection.tsx       ← Браузерная иерархия + Хлебные крошки + Сетка подпапок
│   │       ├── BookmarkCard.tsx           ← Карточка сайта + 1-Click Open/Copy
│   │       ├── BookmarkForm.tsx           ← Форма + Древовидный селектор папки + Favicon/скриншот
│   │       ├── FolderCreateModal.tsx      ← Модалка создания папок/подпапок с выбором родителя
│   │       └── bookmarkTreeUtils.ts       ← Расчет дерева путей, отступов и счетчиков сайтов
│   ├── hooks/
│   │   ├── useTheme.ts                    ← Двухтемный режим (dark/light) + localStorage
│   │   ├── useHotkeys.ts                  ← Глобальные горячие клавиши (Ctrl+K, Esc, etc.)
│   │   ├── usePromptFilters.ts            ← Фильтры промптов
│   │   └── useSkillFilters.ts             ← Фильтры скиллов
│   ├── services/
│   │   ├── api.ts          ← fetch-обёртки для всех /api/* эндпоинтов
│   │   └── gemini.ts       ← Клиент для /api/gemini/* эндпоинтов
│   └── utils/              ← zipParser.ts, buildSelectionZip.ts, cn.ts
├── public/                 ← Статические ассеты
```

## Middleware & Request Pipeline

```
Запрос → app.use(express.json({ limit: "50mb" }))
       → authenticate() middleware — проверяет Bearer token (uid из Supabase users table)
       → Route handler — делает Supabase запросы (select/insert/update/delete)
       → uploadImage() — если есть base64 фото, сохраняет в Supabase Storage (bucket: prompt-images)
       → ответ клиенту
```

**Auth**: Простой Bearer-токен = `uid` пользователя из таблицы `users` (Supabase). Пароли захэшированы с помощью bcrypt.

## Client-Side Architecture

- **State**: Весь глобальный state в `App.tsx` через `useState`.
- **Хуки**: Переиспользуемая логика вынесена в `src/hooks/` — `useTheme`, `useHotkeys`, `usePromptFilters`, `useSkillFilters`.
- **Темизация**: Автоматическая синхронизация через `useTheme` (`localStorage: pv_theme` + класс `.dark` / `.light` на `document.documentElement`).
- **Роутинг**: Навигация через state (без react-router):
  - Промпты: `viewingPrompt`, `editingPrompt`, `isFormOpen` (boolean-флаги)
  - Скиллы: `spacedSkill: SkillPackage | null` → полноэкранная страница-пространство (`SkillSpaceView`); `isSkillFormOpen` → форма
  - Git Проекты: `viewingGitProject`, `editingGitProject`, `isGitFormOpen`
  - Команды: `editingCommand`, `isCommandFormOpen`
  - Закладки: `editingBookmark`, `isBookmarkFormOpen`
  - При `spacedSkill !== null` рендерится `SkillSpaceView` вместо основного layout
- **Анимации**: `motion` (Framer Motion v12) — для карточек, модалок, переходов.
- **Иконки**: `lucide-react`.

## Data Layer & Database Strategy

- **Хранилище**: Supabase PostgreSQL.
- **Избранное**: Таблица `user_favorites` — полиморфный составной PK (`user_id`, `item_id`, `item_type`).
- **Изображения**: base64 из клиента → `uploadImage()` → загрузка в бакет `prompt-images` Supabase Storage.
- **Интеграция**: `server.ts` / `api/index.ts` используют `SUPABASE_SERVICE_ROLE_KEY` для серверных операций.

## Key Data Flows & Sequence Diagrams

### Создание промпта с изображением

```
User → PhotoForm → выбирает фото → ImageCropper (Canvas crop) → base64
     → api.ts: POST /api/prompts { ...data, imageBefore: "data:image/..." }
     → server: uploadImage() → Supabase Storage (prompt-images) -> publicUrl
     → Supabase insert: supabase.from('prompts').insert({ ... })
     → ответ { id, imageBefore: "https://...supabase.co/.../prompt_xxx.jpg" }
     → App.tsx: добавляет в state prompts[]
```

### Пространство скилла (SkillSpaceView)

```
User → Клик на карточку скилла → spacedSkill = skill
     → Отображение дерева файлов (SpaceFileTree) + Превью (SpaceFilePreview)
     → Редактирование файла (SpaceFilePreview Inline Editor) → Ctrl+S
     → api.ts: PUT /api/skills/:id { fileStructure } → Сохранение в Supabase
     → Выбор файлов / папок → buildSelectionZip() → Генерация ZIP на клиенте
     → Подсказки (SkillHintsPanel) → GET /api/skills/:id/hints → Быстрое копирование
```

## Cross-Cutting Concerns

- **Error Handling**: try/catch во всех API роутах → `res.status(500).json({ error })`. На клиенте — Toast-уведомления.
- **Validation**: Проверка обязательных полей на стороне сервера и клиента.
- **Security**: Токены хранятся в localStorage. Доступ к админ-панели и бэкапам строго для роли admin. Пароли захешированы bcrypt.
- **Performance**: Лимит тела запроса `50mb` для передачи base64 изображений и файлов. Fixed IDE viewport без лишних reflows.