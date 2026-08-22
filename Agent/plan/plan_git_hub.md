# [🔴 НУЖНО СДЕЛАТЬ] Plan: Раздел «Git Проекты & AI Инструменты» + Gemini Smart Parser

> **Статус**: 🔴 **НУЖНО СДЕЛАТЬ** (Фокус следующего этапа)
> **Дата создания**: 2026-08-23  
> **Связанные документы**: [`PRD.md`](../MD_files/PRD.md), [`SCHEMA.md`](../MD_files/SCHEMA.md), [`ARCHITECTURE.md`](../MD_files/ARCHITECTURE.md)  
> **Тестовый прототип**: [`test/index.html`](../../test/index.html)

---

## 🎯 Концепция и Назначение

Раздел **«Git Hub & AI Tools»** — это персональный каталог и база знаний для сохранения полезных GitHub-репозиториев, автономных ИИ-агентов, CLI-утилит, открытых моделей (LLM, CV, Audio), медиа-комбайнов и скраперов, найденных в Telegram, Twitter/X, GitHub Trending или на просторах сети.

### 💡 Главные фичи раздела:
1. **Карточки проектов**: скриншот/баннер, название, слоган, бейджи категорий и стоимости (Бесплатно / Freemium / Платный).
2. **📁 Динамические категории с эмодзи**: возможность создавать любые собственные категории (например, «📊 Датасеты», «🔒 Безопасность», «⚡ Оптимизация», «🎮 GameDev», «📱 Mobile»), редактировать их и удалять.
3. **Раскрывающиеся аккордеоны подробностей**:
   - ⚡ **Команды и гайд по запуску**: пошаговая установка (`git clone`, `uv`, `docker run`, `pip install`) с копированием в 1 клик.
   - 📋 **Ключевые фичи**: список возможностей с буллетами.
   - 📖 **Детальное описание**: архитектура, возможности, интеграции.
   - 💬 **Личные заметки автора**: собственный отзыв, советы по настройке, ограничения и опыт тестов.
4. **Умная система тегов**: тегов может быть сотни — поиск по облаку тегов, автодополнение при вводе.
5. **🪄 Gemini AI Smart Parser (ИИ Автозаполнение в 1 клик)**:
   - Пользователь вставляет **скриншот поста** (из Telegram/Twitter), **ссылку на GitHub** или **сырой текст**.
   - Gemini API автоматически извлекает все поля (название, категорию, фичи, команды запуска, теги, описание) и заполняет форму за 2 секунды.

---

## 📐 TypeScript Интерфейсы (`src/types.ts`)

```typescript
export type GitProjectCategory = 'agents' | 'tools' | 'models' | 'media' | 'scrapers' | 'other';
export type GitProjectPricing = 'free' | 'freemium' | 'paid';

export interface GitProject {
  id: string;
  userId: string;
  title: string;
  category: GitProjectCategory;
  summary: string;
  features?: string;
  detailedDescription?: string;
  installCommand?: string;
  authorNotes?: string;
  githubUrl?: string;
  demoUrl?: string;
  image?: string;
  tags: string[];
  pricing: GitProjectPricing;
  isFavorite?: boolean;
  isPublic?: boolean;
  createdAt: string;
}

export interface ParseToolRequest {
  url?: string;
  text?: string;
  imageBase64?: string;
}
```

---

## 🗄️ База данных Supabase (`git_projects` таблица)

```sql
-- DDL создания таблицы git_projects
CREATE TABLE IF NOT EXISTS public.git_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'tools',
    summary TEXT NOT NULL,
    features TEXT,
    detailed_description TEXT,
    install_command TEXT,
    author_notes TEXT,
    github_url TEXT,
    demo_url TEXT,
    image TEXT,
    tags TEXT[] DEFAULT '{}',
    pricing TEXT NOT NULL DEFAULT 'free',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_git_projects_user_id ON public.git_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_git_projects_category ON public.git_projects(category);
CREATE INDEX IF NOT EXISTS idx_git_projects_tags ON public.git_projects USING GIN (tags);
```

---

## 🌐 API Эндпоинты (`server.ts` и `api/index.ts`)

| Метод | Путь | Auth | Описание |
|---|---|:---:|---|
| GET | `/api/git-projects` | ✅ | Получить список проектов (с фильтрами и поиском) |
| POST | `/api/git-projects` | ✅ | Создать новый проект (с сохранением картинки в Supabase Storage) |
| PUT | `/api/git-projects/:id` | ✅ | Обновить проект (только автор или admin) |
| DELETE | `/api/git-projects/:id` | ✅ | Удалить проект |
| POST | `/api/gemini/parse-tool` | ✅ | 🪄 Gemini ИИ-парсер (извлечение полей из картинки/текста/ссылки) |

---

## 🤖 Архитектура Gemini Smart Parser (`/api/gemini/parse-tool`)

Используется **Google Gemini API (`gemini-2.5-flash-lite`)** со схемой **Structured Outputs (JSON Schema)**:

### System Prompt для Gemini:
> «Ты — экспертный технический аналитик программных инструментов и ИИ-проектов. Тебе предоставлен скриншот поста, ссылка или текст с описанием репозитория. Твоя задача — извлечь данные и вернуть строгий JSON по схеме:
> - `title`: точное название проекта
> - `category`: одна из ['agents', 'tools', 'models', 'media', 'scrapers', 'other']
> - `summary`: краткая ёмкая суть (слоган) на русском языке (1-2 предложения)
> - `features`: список ключевых фич через буллеты "• "
> - `detailedDescription`: подробное описание архитектуры и возможностей
> - `installCommand`: точные консольные команды установки / запуска (uv, git clone, docker, pip)
> - `githubUrl`: ссылка на репозиторий (если есть)
> - `demoUrl`: ссылка на сайт (если есть)
> - `tags`: массив 4-7 точных английских тегов в нижнем регистре
> - `pricing`: 'free' | 'freemium' | 'paid'»

---

## 🧩 Структура React компонентов (`src/sections/git/`)

```
src/sections/git/
├── GitProjectsSection.tsx   ← Оркестратор раздела (Header, Toolbar, Табы категорий, Поиск тегов, Сетка)
├── GitProjectCard.tsx       ← Карточка проекта со скриншотом, бейджами, быстрой командой и тегами
├── GitProjectView.tsx       ← Полноэкранный просмотр с раскрывающимися аккордеонами (Гайд, Фичи, Описание, Заметки)
├── GitProjectForm.tsx       ← Форма создания / редактирования со слотами и аккордеонами
└── AiSmartParserModal.tsx   ← Модалка «🪄 Заполнить через Gemini ИИ» (загрузка скриншота / ссылки / текста)
```

---

## 📋 План внедрения по шагам

1. **Шаг 1: Типы и База данных**
   - Добавить типы `GitProject`, `GitProjectCategory`, `GitProjectPricing` в `src/types.ts`.
   - Создать SQL-скрипт миграции `scripts/create_git_projects_table.sql` и выполнить в Supabase.

2. **Шаг 2: Бэкенд и Gemini Парсер**
   - Добавить CRUD роуты `/api/git-projects` в `server.ts` и `api/index.ts`.
   - Реализовать эндпоинт `/api/gemini/parse-tool` с поддержкой мультимодального анализа картинок (base64) и текста.

3. **Шаг 3: Фронтенд компоненты (`src/sections/git/`)**
   - Создать `GitProjectsSection.tsx`, `GitProjectCard.tsx`, `GitProjectView.tsx`, `GitProjectForm.tsx`, `AiSmartParserModal.tsx`.
   - Стилизовать в соответствии с дизайн-системой PromptVault (Tailwind v4, Framer Motion, Glassmorphism).

4. **Шаг 4: Навигация в Header и Sidebar**
   - Добавить вкладку **«🐙 Git Hub & Tools»** в главное меню `App.tsx` (`activeSection === 'git'`).
   - Добавить фильтрацию избранного и экспорт/импорт для Git проектов.

5. **Шаг 5: Тестирование и деплой**
   - Проверить `npm run lint` и `npm run build`.
   - Задеплоить на Vercel.
