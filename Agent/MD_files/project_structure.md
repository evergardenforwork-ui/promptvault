# Структура и компоненты проекта PromptVault

PromptVault — это веб-приложение для хранения, организации и мгновенного использования материалов для разработки и нейросетей, работающее на базе React 19, Express.js / Vercel Serverless и облачной базы данных Supabase (PostgreSQL + Storage).

> **Последнее обновление**: 2026-08-26

---

## 📂 Архитектура и Файловая структура

```
promptvault/
├── AGENTS.md                 # 🤖 Универсальная инструкция для всех ИИ-агентов (Onboarding Protocol)
├── CLAUDE.md                 # 🟣 Входной файл для Claude Code CLI
├── GEMINI.md                 # 🔵 Входной файл для Gemini / Antigravity
├── .cursorrules              # 🎯 Правила для Cursor IDE
├── CHANGELOG.md              # 📜 Глобальный журнал изменений и Git-история
├── Dark_design.md            # 🌑 Спецификация тёмной темы (ThoughtLab Obsidian)
├── light_design.md           # ☀️ Спецификация светлой темы (shadcn Frosted Paper)
├── .env.example              # Шаблон переменных окружения (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)
├── start_promptvault.bat     # ⚡ Запуск локального сервера в 1 клик для Windows 11/10
├── vercel.json               # Конфигурация Vercel Serverless деплоя
├── api/
│   └── index.ts              # Express Serverless Adapter для Vercel Functions
├── server/                   # ⚙️ Модули хранилища и Full-Media бэкапа
│   ├── localDb.ts            # Инициализатор SQLite базы (data/promptvault.db)
│   ├── dbAdapter.ts          # Универсальный адаптер БД (Cloud Supabase ↔ Local SQLite)
│   ├── mediaStorage.ts       # Унифицированное сохранение и чтение медиа (Storage ↔ data/uploads/)
│   └── backupService.ts      # Умный Full-Media экспорт/импорт (упаковка/распаковка картинок в ZIP)
├── local/                    # 🚀 Пакет для локального деплоя и автономного запуска
│   ├── README_LOCAL.md       # Пошаговый гайд по локальному запуску и передаче друзьям
│   ├── start_local.bat       # Батник запуска для Windows
│   ├── start_local.sh        # Скрипт запуска для macOS/Linux
│   ├── backups/              # Папка для складирования .zip архивов
│   └── exports/              # Папка для экспорта архивов
├── package.json              # Скрипты и зависимости Node.js
├── server.ts                 # Express.js dev-сервер (Cloud & Local SQLite dual-engine) + Vite middleware
├── vite.config.ts            # Конфигурация сборщика Vite
├── tsconfig.json             # TypeScript конфигурация
├── .agents/skills/           # 🧠 Локальные навыки для ИИ-агентов (supabase, postgres, etc.)
├── scripts/
│   ├── all_new_tables_migration.sql # 🚀 Единая SQL миграция для всех 4 новых таблиц
│   ├── create_workspaces_table.sql  # 💼 DDL создания таблицы workspaces и workspace_id
│   ├── create_git_projects_table.sql # DDL создания таблицы git_projects
│   ├── create_commands_table.sql # DDL создания таблицы commands
│   ├── create_bookmarks_table.sql # DDL создания таблицы bookmarks
│   ├── create_skill_hints_table.sql # DDL создания таблицы skill_hints
│   └── manageUsers.ts        # CLI утилита управления пользователями и сброса паролей
├── Agent/                    # Системная документация и планы
│   ├── MD_files/             # PRD, DESIGN, ARCHITECTURE, SCHEMA, RULES, DATABASE, USER_MANAGEMENT, project_structure
│   └── plan/                 # План реализации фич (plan.md, plan_git_hub.md, plan_commands.md, plan_bookmarks.md, etc.)
└── src/                      # Исходный код Frontend-части
    ├── main.tsx              # Точка входа React
    ├── index.css             # Стили Tailwind CSS v4 (@theme, dual theme tokens)
    ├── App.tsx               # Основное приложение (состояние, навигация, селектор пространств, фильтры, theme switcher)
    ├── types.ts              # Единый источник TypeScript типов
    ├── services/
    │   ├── api.ts            # API клиент для взаимодействия с бэкендом
    │   └── gemini.ts         # Клиент Gemini AI (обёртки)
    ├── hooks/
    │   ├── useTheme.ts       # Двухтемный режим (dark/light) + авто-персист
    │   ├── useHotkeys.ts     # Глобальные горячие клавиши
    │   ├── usePromptFilters.ts # Фильтрация и подсчёт промптов (all, my-all, my-own, my-web, others)
    │   └── useSkillFilters.ts  # Фильтрация и подсчёт скиллов (all, my-all, my-own, my-web, others, targetAis)
    ├── utils/
    │   ├── cn.ts             # Утилита объединения классов Tailwind
    │   ├── zipParser.ts      # Утилита парсинга .ZIP архивов со скиллами
    │   └── buildSelectionZip.ts # Клиентская генерация кастомных ZIP архивов на лету
    ├── components/
    │   ├── auth/             # LoginForm.tsx
    │   ├── layout/           # Sidebar.tsx (селектор пространств, навигация)
    │   └── ui/               # WorkspaceModal, Toast, CategoryForm, ImageCropper, ConfirmDialog, FileTreeViewer
    └── sections/
        ├── admin/            # UsersSection.tsx (управление пользователями)
        ├── prompts/          # PromptsSection.tsx (сетка, тулбар фильтров, пагинация промптов)
        ├── photo/            # PhotoCard, PhotoForm, PhotoView, ImageSlotsSection, SubSectionsEditor
        ├── skills/           # SkillsSection, SkillCard, SkillForm, SkillSpaceView, space/*
        ├── git/              # GitProjectsSection, GitProjectCard, GitProjectForm, AiSmartParserModal, GitProjectView
        ├── commands/         # CommandsSection, CommandCard, CommandForm, CommandFillModal
        └── bookmarks/        # BookmarksSection, BookmarkCard, BookmarkForm, FolderCreateModal, bookmarkTreeUtils.ts
```

---

## 🛠 Технологический стек

*   **Frontend**: React (v19), Vite (v6), Tailwind CSS (v4), Framer Motion (`motion` v12), Lucide React, React Markdown.
*   **Backend / DB**: Node.js + Express.js (`server.ts` dev, `api/index.ts` prod) + Dual-Engine (Cloud Supabase / Zero-Config Local SQLite `better-sqlite3`).
*   **ИИ**: Google Gemini SDK (`@google/genai`), модель `gemini-3.1-flash-lite` (активна для AI Smart Parser).

---

## 🗄 Структура Базы Данных (Supabase Cloud PostgreSQL / Local SQLite)

1. **`users`** — аккаунты, роли (`admin`, `user`), bcrypt-хэши паролей.
2. **`workspaces`** — изолированные рабочие пространства и под-профили пользователя (1С, Дизайн, Личное и др.).
3. **`prompts`** — шаблоны промптов, макеты изображений (6 layout-типов), подсекции, теги, счетчик использований.
4. **`skills`** — наборы скиллов, субагентов и MCP, дерево файлов (`file_structure`), поддерживаемые типы ИИ (`target_ais`).
5. **`skill_hints`** — готовые подсказки-промпты для быстрого применения конкретного скилла в ИИ.
6. **`git_projects`** — каталог полезных репозиториев, агентов и тулзов с фичами, гайдом по установке и AI-парсером.
7. **`commands`** — хаб быстрых команд, инструкций и сниппетов со смарт-параметрами `{{...}}` и связью со скиллами.
8. **`bookmarks`** — каталог веб-закладок и сервисов с бесконечной древовидной структурой папок (`folder: "A / B / C"`), хлебными крошками, авто-Favicon и счетчиком кликов.
9. **`categories`** — пользовательские и системные категории для группировки.
10. **`chats`** — история диалогов с Gemini.
11. **`user_favorites`** — полиморфная таблица личного избранного.
12. **Storage Buckets**: `prompt-images` (изображения), `prompt-files` (ZIP-архивы).

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
