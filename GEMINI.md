# PromptVault — Project Context for Antigravity

> Этот файл автоматически читается Antigravity (AGY) при каждом старте сессии.
> Он заменяет необходимость каждый раз объяснять структуру проекта.

---

## 🗂️ Что это за проект?

**PromptVault** — персональное fullstack веб-приложение для хранения и управления промптами для нейросетей.
Встроен ИИ-ассистент на базе Google Gemini API.

**Репозиторий**: `C:\Users\Alekin\Desktop\promptvault`

---

## 🛠️ Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Анимации | Framer Motion / `motion` |
| Backend | Express.js (`server.ts`) — API + раздача статики |
| База данных | Supabase (PostgreSQL) + Supabase Storage (ранее JSON-файлы в `/data/`) |
| ИИ | Google Gemini API (`gemini-2.5-flash-lite`) |
| Иконки | `lucide-react` |

**Запуск dev-сервера**: `npm run dev` → `http://localhost:3000`
**Сборка**: `npm run build`
**Линтинг**: `npm run lint` (TypeScript `--noEmit`)

---

## 📁 Структура проекта

```
promptvault/
├── GEMINI.md               ← Ты читаешь это сейчас (контекст для агента)
├── server.ts               ← Express API + статика (единый backend)
├── supabase_schema.sql     ← SQL-миграция и схема Postgres/Storage в Supabase
├── plan_supabase.md        # План миграции на Supabase
├── vite.config.ts          ← Конфиг Vite (алиасы, Tailwind plugin)
├── tsconfig.json
├── package.json
├── .env                    ← Локальные секреты (не в git)
├── .env.example            ← Шаблон переменных окружения
├── .agents/skills/         ← Установленные агентские скиллы (supabase, postgres-best-practices)
├── scripts/
│   └── migrateToSupabase.ts  ← Скрипт пересылки данных из JSON в Supabase
│
├── Agent/
│   ├── plan.md             ← Текущий план задач и технический долг
│   └── project_structure.md ← Описание структуры проекта
│
├── data/                   ← Локальная JSON БД (архив после миграции)
│   ├── prompts.json        ← Хранилище промптов
│   ├── categories.json     ← Категории
│   ├── chats.json          ← История диалогов с Gemini
│   ├── users.json          ← Пользователи
│   └── images/             ← Загруженные изображения (base64 → файлы)
│
├── firestore-export/       ← Дамп данных для первоначального импорта (не трогать)
│
├── src/
│   ├── main.tsx            ← Точка входа React
│   ├── App.tsx             ← Главный компонент (роутинг состояний)
│   ├── types.ts            ← TypeScript интерфейсы (Prompt, Category, ChatMessage, User)
│   ├── index.css           ← Глобальные стили + Tailwind директивы
│   │
│   ├── components/
│   │   ├── auth/           ← LoginForm.tsx
│   │   ├── layout/         ← Sidebar.tsx (фильтры и навигация)
│   │   └── ui/
│   │       ├── Toast.tsx
│   │       ├── CategoryForm.tsx
│   │       ├── ImageCropper.tsx
│   │       └── ConfirmDialog.tsx  ← Модальный диалог подтверждения (вместо window.confirm)
│   │
│   ├── sections/
│   │   └── photo/          ← Основной раздел промптов
│   │       ├── PhotoCard.tsx       ← Карточка промпта в сетке
│   │       ├── PhotoForm.tsx       ← Форма создания/редактирования (оркестратор)
│   │       ├── PhotoView.tsx       ← Детальный просмотр промпта (оркестратор)
│   │       ├── form/               ← Подкомпоненты формы
│   │       │   ├── ImageSlotsSection.tsx  ← Выбор layout + слоты изображений
│   │       │   └── SubSectionsEditor.tsx  ← Редактирование подсекций
│   │       └── view/               ← Подкомпоненты просмотра
│   │           ├── MiniLayoutPreview.tsx  ← Иконка-превью макета в табах
│   │           ├── CollapsibleText.tsx    ← Сворачиваемый текст промпта с кнопкой копирования
│   │           └── AIAssistant.tsx        ← Gemini чат внутри просмотра промпта
│   │
│   ├── hooks/              ← Кастомные React-хуки
│   │   ├── useHotkeys.ts          ← Ctrl+K, Ctrl+N, Escape
│   │   └── usePromptFilters.ts    ← Фильтрация, сортировка и теги промптов
│   │
│   ├── services/
│   │   ├── api.ts          ← HTTP-клиент для Express API
│   │   └── gemini.ts       ← Клиент для Gemini API
│   │
│   └── utils/              ← Вспомогательные утилиты (cn и др.)
│
└── public/                 ← Статические ассеты
```

---

## ⚙️ Переменные окружения (`.env`)

```env
# Gemini AI
GEMINI_API_KEY=             # ← Ключ Google AI Studio

# Supabase
SUPABASE_URL=               # ← URL проекта в Supabase
SUPABASE_ANON_KEY=          # ← Публичный ключ Supabase
SUPABASE_SERVICE_ROLE_KEY=  # ← Секретный ключ для скрипта миграции
```

> ⚠️ `.env` не коммитится в git. При первом запуске скопировать `.env.example` → `.env`.

---

## 🔑 Бизнес-логика и важные детали

### Пользователи и роли
- **Администратор**: `alexey.unstam@gmail.com` — может редактировать/удалять любые промпты.
- Все остальные пользователи — обычные (видят только свои приватные + все публичные промпты).
- Пароли хранятся в `data/users.json` в захешированном с помощью bcrypt виде.

### Промпты — поле `promptOrigin`
- `'own'` — авторский промпт (моя разработка)
- `'web'` — найден в сети / скопирован

### Промпты — поле `isPublic`
- `true` — виден всем пользователям
- `false` — только автору

### Layout-макеты изображений (`imageLayoutType`)
- `single` — 1 фото
- `slider` — слайдер ДО/ПОСЛЕ (imageBefore + imageAfter)
- `split-vertical` — 2 фото вертикально (сверху/снизу)
- `split-horizontal` — 2 фото горизонтально (слева/справа)
- `split-1-2` — 1 крупное слева + 2 маленьких справа (3 слота)
- `merge-2-1` — 2 маленьких сверху + 1 крупное снизу (3 слота)

### Подсекции (SubSection)
Каждый промпт может иметь `subSections[]` — варианты промпта, каждый со своим текстом, заголовком и изображениями. Они отображаются как вкладки в PhotoView.

### Изображения
- Загружаются через кроппер (HTML5 Canvas → base64 → server → `/data/images/`).
- API-эндпоинт: `POST /api/upload-image`.
- Поля: `imageBefore`, `imageAfter`, `additionalImages[]`
- Оригиналы (до обрезки): `originalImageBefore`, `originalImageAfter`, `originalImageSlot2`

### Gemini ИИ-ассистент
- Модель: `gemini-2.5-flash-lite`
- История чатов изолирована по пользователям, хранится в `data/chats.json`.
- Компонент: `src/sections/photo/view/AIAssistant.tsx`

---

## 🚀 Как агент должен работать с этим проектом

1. **Запуск**: `npm run dev` — это и frontend (Vite), и backend (Express) одновременно через `tsx server.ts`.
2. **Типы**: Все TypeScript-интерфейсы в `src/types.ts` — всегда смотри туда перед изменением данных.
3. **API**: Все эндпоинты определены в `server.ts` — backend и frontend в одном процессе.
4. **Стили**: Tailwind CSS v4 (новый синтаксис без `tailwind.config.js`, конфиг внутри CSS через `@theme`).
5. **Данные**: JSON-файлы в `/data/` — не трогай `firestore-export/`, это только для первоначального импорта.
6. **Категории**: Глобальные категории имеют `userId === 'admin-uid'` или `userId` отсутствует. Хардкод Firebase uid удалён.

---

## 🧠 Инструкции для Antigravity

- Всегда проверяй `src/types.ts` перед изменением структуры данных.
- При добавлении новых API-роутов — добавляй их в `server.ts`.
- При изменении UI — учитывай что используется Tailwind CSS v4 (синтаксис может отличаться от v3).
- Не раскрывай содержимое `.env` в коде или логах.
- При работе с изображениями помни про HTML5 Canvas кроппер в `src/components/ui/ImageCropper`.
- `PhotoForm.tsx` и `PhotoView.tsx` — оркестраторы, логика вынесена в `form/` и `view/` подпапки.
- Перед удалением — используй `ConfirmDialog.tsx`, не `window.confirm()`.
- Перед задачей — проверь `Agent/plan.md` на актуальный статус задач.

---

## 📚 Project Docs

Перед началом любой задачи в этом проекте свериться с:

- [`PRD.md`](PRD.md) — цели, MVP, scope, метрики успеха, tech stack, roadmap
- [`DESIGN.md`](DESIGN.md) — дизайн-система, брендинг, цвета, анимации, компоненты
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — архитектура системы, потоки данных, auth, паттерны
- [`SCHEMA.md`](SCHEMA.md) — схема JSON-«БД» и все API-роуты с описанием
- [`RULES.md`](RULES.md) — стандарты кода (naming, TypeScript, SOLID/DRY/KISS)
- [`Agent/plan.md`](Agent/plan.md) — текущий план задач и технический долг
