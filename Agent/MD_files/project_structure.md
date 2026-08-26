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
├── vercel.json               # Конфигурация Vercel Serverless деплоя
├── api/
│   └── index.ts              # Express Serverless Adapter для Vercel Functions
├── package.json              # Скрипты и зависимости Node.js
├── server.ts                 # Express.js dev-сервер для API + Vite middleware
├── vite.config.ts            # Конфигурация сборщика Vite
├── tsconfig.json             # TypeScript конфигурация
├── .agents/skills/           # 🧠 Локальные навыки для ИИ-агентов (supabase, postgres, etc.)
├── scripts/
│   ├── all_new_tables_migration.sql # 🚀 Единая SQL миграция для всех 4 новых таблиц
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
    ├── App.tsx               # Основное приложение (состояние, навигация, фильтры ownership, theme switcher)
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
    │   ├── layout/           # Sidebar.tsx
    │   └── ui/               # Toast, CategoryForm, ImageCropper, ConfirmDialog, FileTreeViewer
    └── sections/
        ├── admin/            # UsersSection.tsx (управление пользователями)
        ├── prompts/          # PromptsSection.tsx (сетка, тулбар фильтров, пагинация промптов)
        ├── photo/            # PhotoCard, PhotoForm, PhotoView, ImageSlotsSection, SubSectionsEditor
        ├── skills/           # SkillsSection, SkillCard, SkillForm, SkillSpaceView, space/*
        ├── git/              # GitProjectsSection, GitProjectCard, GitProjectForm, AiSmartParserModal, GitProjectView
        ├── commands/         # CommandsSection, CommandCard, CommandForm, CommandFillModal
        └── bookmarks/        # BookmarksSection, BookmarkCard, BookmarkForm, FolderCreateModal
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
6. **`commands`** — хаб быстрых команд, инструкций и сниппетов со смарт-параметрами `{{...}}` и связью со скиллами.
7. **`bookmarks`** — каталог веб-закладок и сервисов с 2-уровневыми папками, подкатегориями, авто-Favicon и счетчиком кликов.
8. **`categories`** — пользовательские и системные категории для группировки.
9. **`chats`** — история диалогов с Gemini.
10. **`user_favorites`** — полиморфная таблица личного избранного.
11. **Storage Buckets**: `prompt-images` (изображения), `prompt-files` (ZIP-архивы).

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
