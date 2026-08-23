# Структура и компоненты проекта PromptVault

PromptVault — это веб-приложение для хранения, организации и тестирования промптов нейросетей, а также пакетов скиллов, субагентов и MCP (Skills & Agent Hub), работающее на базе React 19, Express.js / Vercel Serverless и облачной базы данных Supabase (PostgreSQL + Storage).

> **Последнее обновление**: 2026-08-23

---

## 📂 Архитектура и Файловая структура

```
promptvault/
├── .env.example              # Шаблон переменных окружения (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)
├── vercel.json               # Конфигурация Vercel Serverless деплоя
├── api/
│   └── index.ts              # Express Serverless Adapter для Vercel Functions
├── package.json              # Скрипты и зависимости Node.js
├── server.ts                 # Express.js dev-сервер для API + Vite middleware
├── vite.config.ts            # Конфигурация сборщика Vite
├── tsconfig.json             # TypeScript конфигурация
├── scripts/
│   ├── migrateToSupabase.ts  # Скрипт миграции локальных данных в Supabase
│   ├── create_skill_hints_table.sql # DDL создания таблицы skill_hints в Supabase
│   ├── supabase_fix_schema.sql # DDL адаптации типов и RLS
│   ├── manageUsers.ts        # CLI утилита управления пользователями и сброса паролей
│   ├── checkSchema.ts        # Проверка схемы базы данных
│   ├── checkTables.ts        # Проверка таблиц в Supabase
│   ├── fixSchema.ts          # Исправление колонок базы
│   ├── fixPromptCategories.ts # Корректировка категорий в промптах
│   └── migrateUsers.ts       # Миграция пользователей
├── Agent/                    # Системная документация и планы
│   ├── Superbase/
│   │   └── supabase_schema.sql # DDL схемы Supabase
│   ├── MD_files/             # PRD, DESIGN, ARCHITECTURE, SCHEMA, RULES, DATABASE, USER_MANAGEMENT, project_structure
│   └── plan/                 # План реализации фич (plan.md, plan_supabase.md, plan_skill_space.md, plan_skill_hints.md, plan_file_system.md)
└── src/                      # Исходный код Frontend-части
    ├── main.tsx              # Точка входа React
    ├── index.css             # Стили Tailwind CSS v4 (@theme)
    ├── App.tsx               # Основное приложение (состояние, навигация, фильтры ownership)
    ├── types.ts              # Единый источник TypeScript типов
    ├── services/
    │   ├── api.ts            # API клиент для взаимодействия с бэкендом
    │   └── gemini.ts         # Клиент Gemini AI (обёртки)
    ├── hooks/
    │   ├── useHotkeys.ts     # Глобальные горячие клавиши
    │   ├── usePromptFilters.ts # Фильтрация и подсчёт промптов (all, my-all, my-own, my-web, others)
    │   └── useSkillFilters.ts  # Фильтрация и подсчёт скиллов (all, my-all, my-own, my-web, others, targetAis)
    ├── utils/
    │   ├── cn.ts             # Утилита объединения классов Tailwind
    │   ├── zipParser.ts      # Утилита парсинга .ZIP архивов со скиллами
    │   └── buildSelectionZip.ts # Клиентская генерация кастомных ZIP архивов на лету
    ├── components/
    │   ├── auth/             # LoginForm.tsx
    │   ├── layout/           # Sidebar.tsx
    │   └── ui/               # Toast, CategoryForm, ImageCropper, ConfirmDialog, FileTreeViewer
    └── sections/
        ├── admin/            # UsersSection.tsx (управление пользователями)
        ├── prompts/          # PromptsSection.tsx (сетка, тулбар фильтров, пагинация промптов)
        ├── photo/            # PhotoCard, PhotoForm, PhotoView, ImageSlotsSection, SubSectionsEditor
        ├── skills/           # SkillsSection, SkillCard, SkillForm, SkillSpaceView, SpaceFileTree, SpaceFilePreview, SpaceContextMenu, SpaceSelectionBar, SkillHintsPanel
        └── git/              # GitProjectsSection, GitProjectCard, GitProjectForm, AiSmartParserModal, GitProjectView
```

---

## 🛠 Технологический стек

*   **Frontend**: React (v19), Vite (v6), Tailwind CSS (v4), Framer Motion (`motion` v12), Lucide React, React Markdown.
*   **Backend / DB**: Node.js + Express.js (`server.ts` dev, `api/index.ts` prod) + Supabase (PostgreSQL + Supabase Storage).
*   **ИИ**: Google Gemini SDK (`@google/genai`), модель `gemini-3.1-flash-lite` (активна для AI Smart Parser).

---

## 🗄 Структура Базы Данных (Supabase Cloud PostgreSQL)

1. **`users`** — аккаунты, роли (`admin`, `user`), bcrypt-хэши паролей.
2. **`prompts`** — шаблоны промптов, макеты изображений (6 layout-типов), подсекции, теги, счетчик использований.
3. **`skills`** — наборы скиллов, субагентов и MCP, дерево файлов (`file_structure`), поддерживаемые типы ИИ (`target_ais`).
4. **`skill_hints`** — готовые подсказки-промпты для быстрого применения конкретного скилла в ИИ.
5. **`git_projects`** — каталог полезных репозиториев, агентов и тулзов с фичами, гайдом по установке и AI-парсером.
6. **`categories`** — пользовательские и системные категории для группировки.
7. **`chats`** — история диалогов с Gemini.
8. **`user_favorites`** — полиморфная таблица личного избранного.
9. **Storage Buckets**: `prompt-images` (изображения), `prompt-files` (ZIP-архивы).

---

## 🛡 Безопасность и роли

*   **Администратор**: `evergardenforwork@gmail.com` (`admin-uid`) имеет полные права администратора (видит и редактирует всё, управляет пользователями).
*   **Промпты и Скиллы**: Публичные (`is_public == true`) доступны всем авторизованным. Приватные (`is_public == false`) доступны только автору (`user_id`) или админу.
*   **Категории**: Категории админа общие для всех, пользовательские изолированы по `user_id`.

---

## 🏃‍♂️ Скрипты запуска

*   `npm run dev` — Запуск dev-сервера через `tsx server.ts` (порт 3000, единый процесс API + Vite).
*   `npm run build` — Сборка клиентского SPA в папку `dist` с помощью Vite.
*   `npm run lint` — Проверка TypeScript типов (`tsc --noEmit`).
*   `npm run clean` — Очистка директории `dist`.
