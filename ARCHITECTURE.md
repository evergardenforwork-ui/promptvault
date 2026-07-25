# ARCHITECTURE.md — System Architecture

> Высокоуровневая карта системы. Перед любым структурным изменением кода
> ИИ должен свериться с этим файлом, чтобы не нарушить существующие паттерны.

## System Overview & High-Level Diagram

```
Browser (React SPA)
        │  HTTP (fetch)
        ▼
Express.js (server.ts, порт 3000)
  ├─ /api/*          ← REST API (JSON)
  ├─ /uploads/*      ← Статические файлы изображений
  └─ /* (dev: Vite middleware, prod: dist/)
        │
        ├─ data/prompts.json       ← Хранилище промптов
        ├─ data/categories.json    ← Категории
        ├─ data/chats.json         ← История чатов
        ├─ data/users.json         ← Пользователи
        └─ data/images/            ← Загруженные изображения
        │
        └─ Google Gemini API (gemini-2.5-flash-lite)
             ├─ /api/gemini/chat     ← Чат с историей
             └─ /api/gemini/analyze  ← Анализ изображения
```

## Layered Architecture & Conventions

```
┌──────────────────────────────────────┐
│  Presentation (src/sections/, ui/)   │  React компоненты, формы, карточки, FileTreeViewer
├──────────────────────────────────────┤
│  Services (src/services/)            │  api.ts, gemini.ts, supabaseClient.ts
├──────────────────────────────────────┤
│  State (src/App.tsx)                 │  Глобальный state (prompts, categories, activePrompt)
├──────────────────────────────────────┤
│  Backend / Cloud Layer               │  Supabase (PostgreSQL, Storage, Auth) + Express.js API
├──────────────────────────────────────┤
│  Data & Storage Layer                │  Supabase Postgres DB, Buckets (prompt-images, prompt-files)
└──────────────────────────────────────┘
```

## Directory & Domain Structure

```
promptvault/
├── server.ts               ← Единственный backend-файл (Express + Vite + Gemini)
├── src/
│   ├── App.tsx             ← Центральный state-контейнер + роутинг через view/mode
│   ├── types.ts            ← Все TypeScript интерфейсы (ЕДИНЫЙ источник типов)
│   ├── index.css           ← Tailwind v4 директивы + @theme токены
│   ├── components/
│   │   ├── auth/           ← LoginForm.tsx (форма входа)
│   │   ├── layout/         ← Sidebar.tsx (фильтрация и навигация)
│   │   └── ui/             ← Toast, CategoryForm, ImageCropper, ConfirmDialog
│   ├── hooks/              ← Кастомные React-хуки
│   │   ├── useHotkeys.ts          ← Ctrl+K, Ctrl+N, Escape
│   │   └── usePromptFilters.ts    ← Фильтрация, сортировка, подсчёт
│   ├── sections/
│   │   └── photo/
│   │       ├── PhotoCard.tsx      ← Карточка промпта в сетке
│   │       ├── PhotoForm.tsx      ← Оркестратор формы (создание/редактирование)
│   │       ├── PhotoView.tsx      ← Оркестратор просмотра промпта
│   │       ├── form/              ← Подкомпоненты формы
│   │       │   ├── ImageSlotsSection.tsx
│   │       │   └── SubSectionsEditor.tsx
│   │       └── view/              ← Подкомпоненты просмотра
│   │           ├── MiniLayoutPreview.tsx
│   │           ├── CollapsibleText.tsx
│   │           └── AIAssistant.tsx
│   ├── services/
│   │   ├── api.ts          ← fetch-обёртки для всех /api/* эндпоинтов
│   │   └── gemini.ts       ← Клиент для /api/gemini/* эндпоинтов
│   └── utils/              ← Вспомогательные функции
├── data/                   ← Локальная JSON БД (в git не попадают данные)
└── public/                 ← Статические ассеты
```

## Middleware & Request Pipeline

```
Запрос → app.use(express.json({ limit: "50mb" }))
       → authenticate() middleware — проверяет Bearer token (uid из users.json)
       → Route handler — читает/пишет JSON
       → saveBase64Image() — если есть base64 фото, сохраняет в data/images/
       → writeJson() → ответ клиенту
```

**Auth**: Простой Bearer-токен = `uid` пользователя из `users.json`. Нет JWT, нет сессий.

## Client-Side Architecture

- **State**: Весь глобальный state в `App.tsx` через `useState`. Нет Zustand/Redux/Context.
- **Хуки**: Переиспользуемая логика вынесена в `src/hooks/` — `useHotkeys`, `usePromptFilters`.
- **Роутинг**: Нет react-router. Роутинг через `view` state (`'list' | 'form' | 'view'`) и `selectedPrompt`.
- **Компоненты**: Props-drilling из App.tsx вниз. Компоненты тупые (presentational).
- **Анимации**: `motion` (Framer Motion v12) — для карточек, модалок, переходов.
- **Иконки**: `lucide-react` — только из этой библиотеки.

## Data Layer & Database Strategy

- **Хранилище**: Плоские JSON-файлы. Промпты хранятся как `{ [id: string]: Prompt }`.
- **Seed**: При отсутствии файлов — автосид из `firestore-export/` (только при первом запуске).
- **Изображения**: base64 из клиента → `saveBase64Image()` → файл в `data/images/` → URL `/uploads/{filename}`.
- **Нет ORM, нет миграций** — прямые `readJson`/`writeJson` хелперы.

## Authentication Flow

```
1. POST /api/auth/login { email, password }
2. server.ts: ищет user в users.json по email, сравнивает пароль с помощью bcrypt.compareSync()
3. Ответ: { token: user.uid, user: { uid, displayName, email, role } }
4. Клиент: хранит token в localStorage
5. Все следующие запросы: Authorization: Bearer <uid>
6. authenticate() middleware: ищет user с uid === token в users.json
```

🔒 Пароли хранятся в захешированном виде с использованием bcrypt (через bcryptjs для кроссплатформенности).

## Key Data Flows & Sequence Diagrams

### Создание промпта с изображением

```
User → PhotoForm → выбирает фото → ImageCropper (Canvas crop) → base64
     → api.ts: POST /api/prompts { ...data, imageBefore: "data:image/..." }
     → server.ts: saveBase64Image() → data/images/prompt_xxx_before.jpg
     → writeJson(PROMPTS_FILE, { [id]: newPrompt })
     → ответ { id, imageBefore: "/uploads/prompt_xxx_before.jpg" }
     → App.tsx: добавляет в state prompts[]
```

### Gemini чат

```
User → PhotoView → открывает чат → вводит сообщение
     → POST /api/chats { promptId, content } → сохраняет сообщение user
     → gemini.ts: POST /api/gemini/chat { prompt, history, systemInstruction }
     → server.ts: GoogleGenAI.generateContent() → Gemini API
     → ответ { text } → POST /api/chats { role: "model", content: text }
     → UI: обновляет список сообщений
```

## Domain Logic Highlights

- **Видимость промптов**: `isPublic: true` → виден всем; `isPublic: false` → только автору. Админ видит всё.
- **promptOrigin**: `'own'` | `'web'` — определяет бейдж на карточке и вкладку фильтрации.
- **imageLayoutType**: 6 вариантов — `single`, `slider`, `split-vertical`, `split-horizontal`, `split-1-2`, `merge-2-1` — влияют на рендер в PhotoCard и PhotoView.
- **SubSections**: Промпт может содержать подсекции с отдельными текстами и изображениями.
- **Категории**: Видны только создателю + категории от admin-uid (общие для всех).

## Cross-Cutting Concerns

- **Error Handling**: try/catch в server.ts роутах → `res.status(500).json({ message })`. На клиенте — Toast компонент.
- **Validation**: Минимальная — только наличие обязательных полей в роутах. Нет библиотек валидации.
- **Security**: CORS не настроен (только localhost). Нет rate limiting. Пароли захешированы с помощью bcrypt. Доступ к резервному копированию и восстановлению закрыт авторизацией для роли admin.
- **Performance**: Лимит тела запроса `50mb` для передачи base64 изображений. Vite HMR в dev.
