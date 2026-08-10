# ARCHITECTURE.md — System Architecture

> Высокоуровневая карта системы. Перед любым структурным изменением кода
> ИИ должен свериться с этим файлом, чтобы не нарушить существующие паттерны.
> **Последнее обновление**: 2026-08-10

## System Overview & High-Level Diagram

```
Browser (React 19 SPA)
        │  HTTP (fetch) + Authorization: Bearer <uid>
        ▼
[ Dev: Express.js (server.ts, порт 3000) / Prod: Vercel Serverless Function (api/index.ts) ]
  ├─ /api/auth/*     ← Авторизация (bcrypt)
  ├─ /api/prompts/*  ← CRUD промптов + пагинация
  ├─ /api/skills/*   ← CRUD пакетов скиллов + /hints
  ├─ /api/categories ← Управление категориями
  ├─ /api/favorites  ← Личное избранное
  ├─ /api/users/*    ← Управление пользователями (admin only)
  ├─ /api/chats/*    ← История чатов
  ├─ /api/export     ← Резервная копия (ZIP)
  └─ /api/import     ← Восстановление из ZIP
        ├─ Supabase (PostgreSQL)   ← Таблицы users, prompts, skills, skill_hints, categories, chats, user_favorites
        ├─ Supabase Storage        ← Бакеты prompt-images, prompt-files
        │
        └─ Google Gemini API (gemini-2.5-flash-lite) (⏳ в разработке)
             ├─ /api/gemini/chat     ← Чат с историей
             └─ /api/gemini/analyze  ← Анализ изображения
```

## Layered Architecture & Conventions

```
┌──────────────────────────────────────┐
│  Presentation (src/sections/, ui/)   │  React компоненты, формы, карточки, SkillSpaceView
├──────────────────────────────────────┤
│  Hooks & Filters (src/hooks/)        │  usePromptFilters, useSkillFilters, useHotkeys
├──────────────────────────────────────┤
│  Services (src/services/)            │  api.ts, gemini.ts
├──────────────────────────────────────┤
│  State (src/App.tsx)                 │  Глобальный state (prompts, skills, categories, user)
├──────────────────────────────────────┤
│  Backend / Serverless Layer          │  Express.js (server.ts dev / api/index.ts Vercel prod)
├──────────────────────────────────────┤
│  Data & Storage Layer                │  Supabase Postgres DB, Buckets (prompt-images, prompt-files)
└──────────────────────────────────────┘
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
│   │   ├── layout/         ← Sidebar.tsx (фильтрация и навигация, onOpenAdmin)
│   │   └── ui/             ← Toast, CategoryForm, ImageCropper, ConfirmDialog, FileTreeViewer
│   ├── hooks/              ← Кастомные React-хуки
│   │   ├── useHotkeys.ts          ← Ctrl+K, Ctrl+N, Escape
│   │   ├── usePromptFilters.ts    ← Фильтрация промптов (all, my-all, my-own, my-web, others)
│   │   └── useSkillFilters.ts     ← Фильтрация скиллов (all, my-all, my-own, my-web, others, ИИ)
│   ├── sections/
│   │   ├── admin/
│   │   │   └── UsersSection.tsx  ← Панель управления пользователями
│   │   ├── photo/
│   │   │   ├── PhotoCard.tsx      ← Карточка промпта в сетке
│   │   │   ├── PhotoForm.tsx      ← Оркестратор формы (создание/редактирование)
│   │   │   ├── PhotoView.tsx      ← Оркестратор просмотра промпта
│   │   │   ├── form/              ← ImageSlotsSection, SubSectionsEditor
│   │   │   └── view/              ← MiniLayoutPreview, CollapsibleText, AIAssistant
│   │   └── skills/
│   │       ├── SkillCard.tsx      ← Карточка скилла в сетке
│   │       ├── SkillForm.tsx      ← Форма создания/редактирования пакета
│   │       ├── SkillSpaceView.tsx ← Полноэкранный IDE-лейаут (h-screen, fixed viewport)
│   │       └── space/             ← SpaceFileTree, SpaceFilePreview, SpaceContextMenu, SpaceSelectionBar, SkillHintsPanel
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
- **Хуки**: Переиспользуемая логика вынесена в `src/hooks/` — `useHotkeys`, `usePromptFilters`, `useSkillFilters`.
- **Роутинг**: Навигация через state (без react-router):
  - Промпты: `viewingPrompt`, `editingPrompt`, `isFormOpen` (boolean-флаги)
  - Скиллы: `spacedSkill: SkillPackage | null` → полноэкранная страница-пространство (`SkillSpaceView`); `isSkillFormOpen` → форма
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