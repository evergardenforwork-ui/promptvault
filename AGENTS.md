# 🤖 AGENTS.md — Универсальная инструкция для ИИ-Агентов (Universal AI Context)

> **ДЛЯ ВСЕХ ИИ-АГЕНТОВ**: Этот файл является главным универсальным источником контекста, правил и структуры проекта PromptVault для любых агентов (Claude Code, Antigravity/Gemini, Cursor, Windsurf, Codex, Aider и др.).
> **Последнее обновление**: 2026-08-26

---

## 🚨 КРИТИЧЕСКИЙ ПРОТОКОЛ ПЕРВОГО ДЕЙСТВИЯ (First-Action Protocol)

Когда пользователь говорит: **«Посмотри проект»**, **«Глянь репозиторий»**, **«Сделай задачу»** или начинает новую сессию:
**ЗАПРЕЩЕНО** бессистемно открывать случайные файлы, искать в `node_modules/` или читать устаревшие планы.

### 📋 Обязательный пошаговый порядок онбординга:
1. **Прочитай этот файл (`AGENTS.md`)** или его зеркало (`GEMINI.md` / `CLAUDE.md`) — пойми стек, назначение и структуру.
2. **Проверь типы данных**: [`src/types.ts`](src/types.ts) — единый источник правды типизации (User, Workspace, Prompt, SkillPackage, GitProject, CommandItem, BookmarkItem).
3. **Изучи архитектуру**: [`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md) и схему [`Agent/MD_files/SCHEMA.md`](Agent/MD_files/SCHEMA.md).
4. **Проверь актуальный бэклог**: [`Agent/plan/plan.md`](Agent/plan/plan.md) — смотри только секции `[🔴 НУЖНО СДЕЛАТЬ]`. **НЕ ЧИТАЙ** завершённые файлы с плашкой `[✅ ВЫПОЛНЕНО]`.
5. **Проверь локальные навыки (Skills)**: загляни в `.agents/skills/` (особенно `.agents/skills/supabase/SKILL.md` перед работой с базой).

---

## 🗂️ Что это за проект?

**PromptVault** — персональное fullstack веб-приложение для хранения, организации и мгновенного использования материалов для разработки и нейросетей с изолированными **Рабочими Пространствами (Workspaces)** и поддержкой двух тем (☀️ Светлая / 🌙 Тёмная).

Содержит **5 главных хабов (вкладок)**:
1. 📷 **Промпты (`prompts`)**: шаблоны промптов с 6 layout-макетами фото (До/После, Сплит и др.), кроппером и подсекциями.
2. 📦 **Skills & AI (`skills`)**: веб-IDE (VS Code-стиль) с деревом файлов, inline-редактором (Ctrl+S), сборкой кастомных ZIP на лету и панелью подсказок `SkillHintsPanel`.
3. 🐙 **Git Hub & Tools (`git`)**: каталог репозиториев, тулзов и моделей с аккордеонами и 🪄 **Gemini 3.1 AI Smart Parser** (мультимодальный ввод: URL + текст + до 4 скриншотов одновременно → JSON).
4. ⚡ **Команды & Инструкции (`commands`)**: хаб быстрых сниппетов и команд с 1-клик копированием (`usageCount`), смарт-модалкой заполнения параметров `{{param}}` и связью со скиллами.
5. 🌐 **Закладки & Веб-сайты (`bookmarks`)**: каталог сайтов с бесконечной древовидной структурой папок (браузерный стиль), хлебными крошками, компактной сеткой подпапок, авто-Favicon/доменом и счетчиком переходов.

---

## 🛠️ Стек технологий и Команды

| Слой | Технология |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 (без `tailwind.config.js`) |
| Темизация | Dual Theme Engine (ThoughtLab Dark / shadcn Light) |
| Анимации & Иконки | Framer Motion (`motion` v12), `lucide-react` |
| Backend (Dev) | Express.js (`server.ts`) — единый процесс API + Vite dev-сервер (`http://localhost:3000`) |
| Serverless (Prod) | Vercel Serverless Function (`api/index.ts`) + `vercel.json` |
| База данных & Storage | **Dual-Engine**: ☁️ Cloud Supabase (PostgreSQL + Storage) ИЛИ 💻 Local SQLite (`better-sqlite3` + `data/uploads/`) |
| ИИ-парсер | Google Gemini API (`gemini-3.1-flash-lite`) в `/api/gemini/parse-tool` |
| Пароли & Auth | `bcryptjs` (хэши `$2b$10$...`), Bearer токен = `uid` |

### 💻 Команды терминала:
- **Запуск Dev**: `npm run dev` (запускает `tsx server.ts` на порту `3000` в Cloud или Local режиме)
- **Сборка Prod**: `npm run build` (`vite build`)
- **Проверка типов**: `npm run lint` (`tsc --noEmit`)
- **Очистка dist**: `npm run clean` (`npx rimraf dist`)

---

## 🧭 Карта каталогов и файлов проекта

```
superbasetest/
├── AGENTS.md               ← 🤖 ТЫ ЧИТАЕШЬ ЭТОТ ФАЙЛ (Универсальный вход для всех ИИ)
├── CLAUDE.md               ← 🟣 Входной файл для Claude Code
├── GEMINI.md               ← 🔵 Входной файл для Gemini / Antigravity
├── CHANGELOG.md            ← 📜 Глобальный журнал изменений и контрольные точки Git
├── README.md / README_RU.md← Описание проекта для пользователей
├── server.ts               ← Dev backend (Express + Vite middleware) с автоопределением движка (Cloud/Local)
├── server/                 ← ⚙️ СЕРВЕРНЫЕ МОДУЛИ ХРАНИЛИЩА И БЭКАПА
│   ├── localDb.ts          ← Инициализатор SQLite базы (data/promptvault.db)
│   ├── dbAdapter.ts        ← Универсальный адаптер БД (Cloud Supabase ↔ Local SQLite)
│   ├── mediaStorage.ts     ← Унифицированное сохранение и чтение медиа (Storage ↔ data/uploads/)
│   └── backupService.ts    ← Умный Full-Media экспорт/импорт (выгрузка и распаковка картинок в ZIP)
├── api/index.ts            ← Prod backend (Express adapter для Vercel)
├── vercel.json             ← Конфигурация деплоя Vercel
├── .env.example            ← Шаблон переменных окружения (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)
│
├── .agents/skills/         ← 🧠 ЛОКАЛЬНЫЕ НАВЫКИ И SKILLS ДЛЯ АГЕНТОВ
│   ├── supabase/           ← Правила и сниппеты для работы с Supabase DB и RLS
│   ├── supabase-postgres-best-practices/ ← Оптимизация и безопасность Postgres
│   ├── agent-architecture-bootstrap/     ← Архитектура мультиагентов
│   ├── project-docs-bootstrap/           ← Документация проекта
│   └── using-agent-skills/               ← Роутер навыков
│
├── Agent/MD_files/         ← 📚 СИСТЕМНАЯ ДОКУМЕНТАЦИЯ ПРОЕКТА
│   ├── PRD.md              ← Требования к продукту и скоуп
│   ├── ARCHITECTURE.md     ← Архитектура слоев, потоки данных, правила модульности
│   ├── SCHEMA.md           ← Схема БД, таблицы, API эндпоинты, camelCase ↔ snake_case
│   ├── DATABASE.md         ← DDL схемы Supabase и бакеты Storage
│   ├── DESIGN.md           ← Дизайн-система, цветовые токены и акценты хабов
│   ├── RULES.md            ← Правила кодинга, SOLID/DRY/KISS, декомпозиция
│   ├── USER_MANAGEMENT.md  ← Управление аккаунтами и паролями
│   └── project_structure.md← Подробная структура директорий
│
├── Agent/plan/             ← 🎯 ПЛАНЫ И РОАДМАПЫ
│   ├── plan.md             ← Главный план задач и актуальный бэклог
│   ├── plan_git_hub.md     ← [✅ ВЫПОЛНЕНО] План Git Tools Hub & Gemini Parser
│   ├── plan_commands.md    ← [✅ ВЫПОЛНЕНО] План AI Commands & Workflows
│   ├── plan_bookmarks.md   ← [✅ ВЫПОЛНЕНО] План Web Bookmarks Hub
│   ├── plan_skill_space.md ← [✅ ВЫПОЛНЕНО] План Web IDE
│   ├── plan_skill_hints.md ← [✅ ВЫПОЛНЕНО] План Skill Hints
│   ├── plan_supabase.md    ← [✅ ВЫПОЛНЕНО] План Supabase миграции
│   └── plan_file_system.md ← [✅ ВЫПОЛНЕНО] План файловой системы ZIP
│
├── scripts/                ← 🗄️ SQL МИГРАЦИИ И УТИЛИТЫ
│   ├── schema.sql          ← 🚀 КАНОНИЧЕСКАЯ ЕДИНАЯ СХЕМА SUPABASE (ВСЕ 10 ТАБЛИЦ)
│   ├── manageUsers.ts      ← CLI сброса паролей и управления пользователями
│   └── migrateToSupabase.ts← Утилита миграции данных
│
└── src/                    ← 💻 ИСХОДНЫЙ КОД FRONTEND
    ├── main.tsx
    ├── App.tsx             ← Центральный контейнер: глобальный state + селектор пространств + навигация
    ├── types.ts            ← Единый источник всех TypeScript интерфейсов
    ├── index.css           ← Tailwind CSS v4 (@theme токены, @custom-variant dark)
    ├── components/         ← Общие компоненты (auth/LoginForm, layout/Sidebar, ui/*, ui/WorkspaceModal)
    ├── hooks/              ← Кастомные хуки (useTheme, useHotkeys, usePromptFilters, useSkillFilters)
    ├── services/           ← api.ts (бэкенд клиент), gemini.ts
    ├── utils/              ← cn.ts, zipParser.ts, buildSelectionZip.ts
    └── sections/           ← МОДУЛЬНЫЕ ИЗОЛИРОВАННЫЕ РАЗДЕЛЫ:
        ├── prompts/        ← PromptsSection.tsx (сетка, тулбар, пагинация промптов)
        ├── photo/          ← PhotoCard, PhotoForm, PhotoView, ImageSlotsSection, SubSectionsEditor
        ├── skills/         ← SkillsSection, SkillCard, SkillForm, SkillSpaceView, space/*
        ├── git/            ← GitProjectsSection, GitProjectCard, GitProjectForm, AiSmartParserModal, GitProjectView
        ├── commands/       ← CommandsSection, CommandCard, CommandForm, CommandFillModal
        ├── bookmarks/      ← BookmarksSection, BookmarkCard, BookmarkForm, FolderCreateModal, bookmarkTreeUtils.ts
        └── admin/          ← UsersSection.tsx
```

---

## ⚠️ СТРОГИЕ ПРАВИЛА РАЗРАБОТКИ (Non-Negotiable Rules)

1. **Зеркалирование API (Двойной бэкенд)**:
   При добавлении или изменении любых эндпоинтов — вноси изменения **ОДНОВРЕМЕННО** в [`server.ts`](server.ts) (для локального dev) И в [`api/index.ts`](api/index.ts) (для Vercel prod).
2. **Декомпозиция: 1 компонент = 1 файл**:
   Запрещено создавать гигантские файлы > 250 строк. Модальные окна, тулбары и панели всегда выноси в отдельные файлы (например, `FolderCreateModal.tsx` отдельно от `BookmarksSection.tsx`).
3. **Каскадная автоочистка (Cascade Delete)**:
   При удалении любых сущностей (промпты, скиллы, git, команды, закладки, юзеры) бэкенд обязан удалять связанные записи из `user_favorites` и дочерних таблиц.
4. **Типизация**:
   Строгий TypeScript (`strict: true`). Все новые типы объявляй только в `src/types.ts`.
5. **Диалоги подтверждения**:
   Используй `ConfirmDialog.tsx` вместо браузерного `window.confirm()`.
6. **Цветовая палитра разделов**:
   - 📷 Промпты: `sky-400`
   - 📦 Skills: `purple-500`
   - 🐙 Git Hub: `emerald-500`
   - ⚡ Команды: `amber-500`
   - 🌐 Закладки: `cyan-400`
   - 👥 Пользователи: `violet-500`
