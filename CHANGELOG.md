# 📜 CHANGELOG.md — Глобальный журнал изменений и Git-история PromptVault

> Единый реестр всех ключевых изменений, версий, контрольных точек (Git checkpoints & tags) и архитектурных улучшений проекта.
> **Последнее обновление**: 2026-08-26

---

## 🏷️ Теги и Контрольные точки (Git Checkpoints)

| Тег / Хеш | Дата | Название / Назначение | Описание |
| :--- | :--- | :--- | :--- |
| `9d3c52a` | 2026-08-26 | **🧹 Clean Workspaces Sidebar UI** | Очищено боковое меню «Библиотека»: убраны устаревшие рудиментарные блоки первой вкладки (фильтры избранного, категории промптов и облако тегов), которые уже присутствуют на главной рабочей панели каждого хаба. Сайдбар полностью сфокусирован на управлении рабочими пространствами, статистике и администрировании. |
| `00a98ef` | 2026-08-26 | **✨ Comprehensive Dual-Theme (Light/Dark) Engine & UI Audit** | Полная адаптация всех компонентов, модалок, IDE-панелей и форм под спецификации `Dark_design.md` и `light_design.md`. Устранены хардкодные тёмные стили в `SkillSpaceView`, `SkillHintsPanel`, `SpaceFilePreview`, `SpaceFileTree`, `SkillForm`, `FileTreeViewer`, `CommandsSection`, `CommandForm`, `CommandFillModal`, `BookmarksSection`, `BookmarkForm`, `FolderCreateModal`, `GitProjectsSection`, `GitProjectForm`, `GitProjectView`, `AiSmartParserModal`, `UsersSection`, `PhotoForm`, `PhotoView`, `PhotoCard`, `CategoryForm`, `ImageCropper`. Zero warnings/errors в `npm run lint` и `npm run build`. |
| `f2488aa` | 2026-08-26 | **🎨 Full Dual-Theme Engine & Favorites Audit** | Исправлен `@custom-variant dark` в Tailwind v4, все 5 карточек (`PhotoCard`, `SkillCard`, `GitProjectCard`, `CommandCard`, `BookmarkCard`) и тулбары секций переведены на двухтемные стили (`bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`), унифицированы хэндлеры избранного в `App.tsx` и проведена глобальная синхронизация документации. |
| `a4f891b` | 2026-08-26 | **💼 Isolated Workspaces Engine (Рабочие пространства & Под-профили)** | Реализована изолированная система рабочих пространств: DDL таблица `workspaces`, связь `workspace_id` со всеми 5 хабами (промпты, скиллы, git, команды, закладки), CRUD API в `server.ts` и `api/index.ts`, компонент `WorkspaceModal` (эмодзи, цвета, название), обновлённый `Sidebar` с переключением пространств и сводкой статистики, бейдж в Header и фильтрация в `App.tsx`. |
| `a8afbf2` | 2026-08-26 | **🎨 Dual Theme Engine (ThoughtLab Dark & shadcn Light)** | Внедрена полноценная система переключения тем (Тёмная 🌙 / Светлая ☀️) на базе CSS-токенов Tailwind v4, кастомного хука `useTheme`, автосохранения в `localStorage` и стильного тумблера в Header. Адаптированы Header, Sidebar, LoginForm и поверхности. |
| `7cd9892` | 2026-08-26 | **🤖 Universal AI Agent Ecosystem & Onboarding** | Созданы универсальные инструкции `AGENTS.md`, `CLAUDE.md`, `.cursorrules` и строгий «Протокол первого действия» (First-Action Protocol) для исключения хаотичного чтения файлов любыми ИИ-агентами. |
| `b34673a` | 2026-08-26 | **🧹 Cascade Deletion of Favorites & Relations** | Реализована автоматическая очистка связанных записей в `user_favorites`, `chats` и `skill_hints` при удалении любых сущностей (промпты, скиллы, git, команды, закладки, юзеры) на обоих бэкендах (`server.ts` и `api/index.ts`). |
| `db80872` | 2026-08-26 | **🌐 Web Bookmarks & Browser Tabs Hub** | Создан 5-й раздел «Закладки & Веб-сайты»: SQL таблица `bookmarks`, CRUD API (5 эндпоинтов), 2-уровневая структура (Папки-вкладки + Подкатегории внутри папок), создание кастомных папок на лету (`FolderCreateModal`), авто-Favicon/домен, `BookmarksSection`, `BookmarkCard`, `BookmarkForm`. TypeScript `--noEmit` & `vite build` — ✅ 0 ошибок. |
| `36056d1` | 2026-08-26 | **⚡ AI Commands & Workflows Hub** | Создан 4-й раздел «Команды & Инструкции»: SQL таблица `commands`, CRUD API (5 роутов), инкремент использования, привязка к скиллам, авто-детект и подстановка переменных `{{param}}` (`CommandFillModal`), `CommandsSection`, `CommandCard`, `CommandForm`. |
| `fbf6879` | 2026-08-23 | **🛡️ AI Token Protection & Security Guards** | Внедрена многоуровневая защита Gemini: Global Kill Switch (`DISABLE_AI=true`), Rate Limiter (1 req/3s, max 15/min), Timeout Guard (25s), Payload Caps (max 12k симв), `maxOutputTokens: 2048`, UI-блокировка дабл-клика и счетчик символов. |
| `70ecb18` | 2026-08-23 | **🐙 Git Hub & AI Tools Hub — ЗАВЕРШЕНО** | Реализован полный раздел Git Projects: SQL-миграция, CRUD API (5 эндпоинтов), Gemini 3.1 Flash-Lite Smart Parser, `GitProjectsSection`, `GitProjectCard`, `GitProjectForm` (с AI-модалкой), `GitProjectView` (аккордеоны). TypeScript `--noEmit` и `vite build` — ✅ OK. |
| `e1f83e2` | 2026-08-23 | **Git Tools Hub Prototype v2.1** | Автономный прототип `test/index.html` с аккордеонами гайда по запуску, детальным описанием, личными заметками, кастомными категориями и Gemini ИИ-парсером. |
| `2632604` | 2026-08-23 | **Plan: Git Projects & Gemini Parser** | Создан мастер-план `plan_git_hub.md` с DDL таблицы `git_projects`, JSON-схемой Gemini Structured Outputs и структурой React-компонентов. |
| `v1.0-checkpoint`<br>`cb3b633` | 2026-08-23 | **ОТПРАВНАЯ ТОЧКА ДО ГЛОБАЛЬНЫХ ИЗМЕНЕНИЙ** | Полностью рабочий проект на Supabase до рефакторинга на модульные разделы. Точка безопасного отката (`git checkout v1.0-checkpoint`). |
| `373f395` | 2026-08-23 | **Section-Based Modular Architecture** | Выделены модульные компоненты `PromptsSection.tsx` и `SkillsSection.tsx`. `App.tsx` сокращён в 2 раза. |
| `0267788` | 2026-08-23 | **Docs & Roadmap Sync** | Синхронизация PRD.md (Phase 7 & 8) и PLAN.md с новой архитектурой. |
| `699b78a` | 2026-08-10 | **Vercel + IDE + Hints Milestone** | Завершение интеграции Vercel Serverless, Fixed IDE Layout, Inline Editor и Skill Hints. |

---

## 🗓️ Хронологический журнал изменений

### 💼 2026-08-26 — Изолированные рабочие пространства (Workspaces / Под-профили)
- **База данных Supabase (`scripts/create_workspaces_table.sql`)**:
  - Создана таблица `workspaces` (`id` UUID PK, `user_id` TEXT, `name` TEXT, `icon` TEXT, `color` TEXT, `is_default` BOOL, `created_at` TIMESTAMPTZ).
  - Во все 5 таблиц сущностей (`prompts`, `skills`, `git_projects`, `commands`, `bookmarks`) добавлена колонка `workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL` с индексами.
- **Двойной бэкенд (`server.ts` & `api/index.ts`)**:
  - 4 CRUD эндпоинта для пространств: `GET /api/workspaces`, `POST /api/workspaces`, `PUT /api/workspaces/:id`, `DELETE /api/workspaces/:id`.
  - Интеграция `workspace_id` в маппинг в БД и из БД для промптов, скиллов, проектов, команд и закладок.
- **Интерфейс и Компоненты**:
  - `src/components/ui/WorkspaceModal.tsx` — модальное окно создания и редактирования пространств с выбором иконки (эмодзи), названия и цветового акцента (`WORKSPACE_COLOR_OPTIONS`).
  - `src/components/layout/Sidebar.tsx` — обновлённая панель «Библиотека»: быстрый выбор активного пространства, переключение в режим «🌐 Все материалы», сводка статистики по 5 хабам, кнопка создания и редактирования.
  - `src/App.tsx` — хранение `selectedWorkspace` в `localStorage` (`pv_workspace_id`), бейдж активного пространства в шапке сайта с быстрым сбросом, фильтрация данных во всех разделах.
  - Автоматическая привязка `workspaceId` при создании новых карточек в активном пространстве.

---

### 🎨 2026-08-26 — Двухтемная дизайн-система (Dual Theme: ThoughtLab Dark & shadcn Light)
- **Хук управления темами (`src/hooks/useTheme.ts`)**:
  - Чтение и сохранение выбранной темы в `localStorage` (`pv_theme`).
  - Управление классами `.dark` / `.light` и атрибутом `data-theme` на элементе `document.documentElement`.
  - Поддержка системного `prefers-color-scheme`.
- **Токены дизайна в `src/index.css`**:
  - 🌑 **Dark Theme (ThoughtLab Obsidian)**: монохромный чёрный фон `#000000`, контрастный текст `#ffffff` / `#cccccc`, графитовые бордеры `#27272a`.
  - ☀️ **Light Theme (shadcn Frosted Paper)**: мягкий фон `#f5f5f5`, белоснежные карточки `#ffffff`, глубокий текст `#0a0a0a`, тонкие линии `#e5e5e5`.
  - Плавные CSS-переходы без оптического мерцания.
- **Интерактивный тумблер в Header**:
  - Кнопка с анимированными иконками ☀️ (Солнце) и 🌙 (Луна) в правом верхнем углу шапки.
- **Адаптация компонентов под 2 темы**:
  - `src/App.tsx` (шапка, поисковая строка, навигация по 5 хабам).
  - `src/components/layout/Sidebar.tsx` (боковое меню библиотек, тегов и категорий).
  - `src/components/auth/LoginForm.tsx` (экран входа).

---

### 🤖 2026-08-26 — Универсальная экосистема агентов (Universal AI Context & Protocol)
- **Созданы универсальные стандарты входа**:
  - `AGENTS.md` — главный универсальный вход для всех ИИ-агентов.
  - `CLAUDE.md` — входной файл для Claude Code CLI.
  - `.cursorrules` — правила для Cursor IDE.
  - Синхронизирован `GEMINI.md` для Antigravity/Gemini.
- **Внедрён «Протокол Первого Действия» (First-Action Protocol)**:
  - Запрет на бессистемное чтение файлов при командах «посмотри проект».
  - Пошаговый порядок: Инструкция агента → `src/types.ts` → `Agent/MD_files/ARCHITECTURE.md` → `Agent/plan/plan.md` (только активные) → `.agents/skills/`.

---

### 🧹 2026-08-26 — Каскадная автоочистка базы данных (Cascade Deletion)
- Устранение технического долга по «висячим» записям в полиморфной таблице `user_favorites`.
- При `DELETE` карточек промптов, скиллов, git-проектов, команд, закладок или пользователей бэкенд (`server.ts` и `api/index.ts`) автоматически вычищает связанные избранные записи, чаты и подсказки.

---

### 🌐 2026-08-26 — Раздел «Web Bookmarks & Sites Hub» (Закладки и Сайты)
- **Новый 5-й раздел `🌐 Закладки` в PromptVault**:
  - Каталог избранных сайтов, сервисов, дизайн-вдохновений и баз знаний с превью-скриншотами.
  - **Двухуровневая организация (как в браузере)**:
    - **Уровень 1 (Папки/Вкладки)**: `🎨 Design & UI`, `🕵️ OSINT & Поиск`, `💼 1С Предприятие`, `🤖 AI & Нейросети`, `🛠️ Dev & Тулзы`, `📚 Документация`, `📁 Общее` + кнопка **`+ Создать папку`** (`FolderCreateModal.tsx`).
    - **Уровень 2 (Подкатегории внутри папки)**: динамические фильтры внутри выбранной папки (например, внутри «1С»: `1С База`, `Отчёты`, `Конфигурации` + `+ Подкатегория`).
  - **1-Click Open & Copy**: открытие сайта в новой вкладке с подсчётом переходов (`🔥 clickCount`) и быстрое копирование ссылки.
  - **Автоматический парсинг домена и Favicon**: при вводе URL автоматически подставляется favicon и аккуратное имя сайта.
  - **Загрузка скриншотов**: загрузка баннеров/скриншотов сайта с хранением в Supabase Storage.
  - **База данных & API**:
    - Миграция `scripts/create_bookmarks_table.sql`.
    - 5 CRUD-эндпоинтов `/api/bookmarks` в `server.ts` и `api/index.ts`.

---

### ⚡ 2026-08-26 — Раздел «AI Commands & Workflows Hub» (Команды и Инструкции)
- **Новый 4-й раздел `⚡ Команды` в PromptVault**:
  - Каталог быстрых сниппетов, системных инструкций и промпт-команд для разработчиков и ИИ-ассистентов.
  - **1-Click Copy**: мгновенное копирование в буфер обмена с визуальной анимацией и тостом.
  - **Инкремент использования**: автоматический счётчик `🔥 usageCount` на бэкенде при каждом копировании.
  - **🪄 Умные параметры `{{...}}` (`CommandFillModal.tsx`)**: модальное окно быстрой подстановки переменных (например, `{{file}}`, `{{target}}`, `{{branch}}`) с живым предпросмотром перед копированием.
  - **🔗 Интеграция со Skills**: привязка команды к конкретному скиллу из вкладки Skills; клик по бейджу скилла мгновенно открывает этот скилл в Web IDE `SkillSpaceView`.
  - **Удобная форма создания/редактирования (`CommandForm.tsx`)**:
    - Моноширинный редактор кода с быстрыми кнопками вставки параметров (`+ {{file}}`, `+ {{branch}}`, etc.).
    - Категории с emoji (Документация, Рефакторинг, Аудит & Защита, Тестирование, Git & Деплой, Агенты, База данных, Разное).
    - Выбор целевой платформы ИИ (Универсальная, Claude, Gemini, ChatGPT, Cursor, DeepSeek).
    - Защита от случайного закрытия формы (`isDirty` + `ConfirmDialog`).
  - **База данных & API**:
    - Создана миграция `scripts/create_commands_table.sql` с индексами и обновлением `user_favorites`.
    - Добавлены 5 CRUD-эндпоинтов `/api/commands` в `server.ts` и `api/index.ts`.
- **Автономный интерактивный прототип (`test/index.html` v2.1)**:
  - Создана и протестирована полнофункциональная веб-страница для каталога полезных репозиториев, ИИ-агентов и тулзов.
  - Реализованы **раскрывающиеся аккордеоны**: пошаговый гайд по установке и командам запуска (с 1-клик копированием), ключевые фичи, детальное описание архитектуры и личные заметки автора.
  - Добавлено создание и управление **пользовательскими категориями** с эмодзи-иконками (`+ Категория`).
  - Разработана демонстрация **🪄 Gemini AI Smart Parser**: извлечение всех полей формы по скриншоту поста, ссылке или тексту с автоматическим заполнением карточки за 2 секунды.
  - Все данные автономно сохраняются в `LocalStorage`.
- **Мастер-план реализации ([`Agent/plan/plan_git_hub.md`](file:///C:/Users/Alekin/Desktop/Проекты/superbasetest/Agent/plan/plan_git_hub.md))**:
  - Спроектирована таблица `git_projects` в Supabase с индексами по тегам и категориям.
  - Спроектирован бэкенд-эндпоинт `/api/gemini/parse-tool` с поддержкой Structured Outputs.
  - Спроектирована модульная структура React-компонентов в `src/sections/git/`.

---

### 🚀 2026-08-23 — Архитектурный рефакторинг и модульные разделы (Modular Sections)
- **Модульная архитектура (Section-Based Pattern)**:
  - Создан компонент [`src/sections/prompts/PromptsSection.tsx`](file:///C:/Users/Alekin/Desktop/Проекты/superbasetest/src/sections/prompts/PromptsSection.tsx) — инкапсулирует тулбар фильтрации промптов (сетка/список, сортировка, табы источников, табы медиа, полоса категорий и тегов), сетку карточек и пагинацию.
  - Создан компонент [`src/sections/skills/SkillsSection.tsx`](file:///C:/Users/Alekin/Desktop/Проекты/superbasetest/src/sections/skills/SkillsSection.tsx) — инкапсулирует тулбар типов скиллов (`SKILL_TYPE_OPTIONS`), платформ ИИ (`TARGET_AI_OPTIONS`), табы источников и сетку карточек.
  - Очищен [`src/App.tsx`](file:///C:/Users/Alekin/Desktop/Проекты/superbasetest/src/App.tsx) — размер сократился с 943 до ~400 строк. Теперь `App.tsx` отвечает исключительно за оркестрацию активного раздела (`prompts`, `skills`, `admin`), аутентификацию и глобальные модалки.
- **Подготовка к расширению**:
  - Создана основа для быстрого добавления новых разделов (например, **«Git проекты»**, **«Датасеты»**, **«Модели»**) без риска сломать существующий код.
- **Синхронизация документации**:
  - Все 17 документов `.md` обновлены до актуальной даты (2026-08-23).
  - Создан данный файл истории [`CHANGELOG.md`](file:///C:/Users/Alekin/Desktop/Проекты/superbasetest/CHANGELOG.md).

---

### 📦 2026-08-10 — Расширенные фильтры, GFM Markdown, Фиксированный IDE-лейаут
- **Ownership фильтры (Табы принадлежности)**:
  - Добавлены табы: `Все (+ чужие)`, `Все мои`, `Мои (Авторские)`, `Мои (Из сети)`, `Чужие (Публичные)` для промптов и скиллов.
  - Разделена логика подсчёта количества в `usePromptFilters.ts` и `useSkillFilters.ts`.
- **IDE Пространство Скилла (SkillSpaceView)**:
  - Высота зафиксирована на `100vh` (`h-screen overflow-hidden`) без скролла окна браузера.
  - Сворачиваемое описание пакета скиллов с плавной анимацией.
  - Кнопка **«💡 Подсказки (N)»** перенесена в шапку для быстрого доступа к панели промптов.
- **Markdown и Файловое дерево**:
  - Подключены плагины `remark-gfm` и `remark-frontmatter` для рендеринга таблиц, чекбоксов и заголовков frontmatter.
  - Стилизована типографика `.md` файлов, ограничена максимальная ширина чтения.
  - Добавлена функция скачивания промптов в формате `.md` / `.txt`.
  - Исправлен рекурсивный подсчёт файлов и папок в `SkillCard`.

---

### ☁️ 2026-08-05 … 2026-08-06 — Миграция на Supabase и адаптер Vercel Serverless
- **Supabase Cloud Backend**:
  - Локальное JSON-хранилище полностью заменено на Supabase PostgreSQL (`prompts`, `skills`, `categories`, `chats`, `users`, `user_favorites`, `skill_hints`).
  - Все изображения и ZIP-архивы переведены на Supabase Storage бакеты `prompt-images` и `prompt-files`.
  - Добавлен серверный хелпер `src/services/supabaseServer.ts`.
- **Vercel Serverless Functions**:
  - Создан адаптер `api/index.ts` (Express без вызова `.listen()` для Vercel Functions).
  - Настроен `vercel.json` с маршрутизацией `/api/*` → `api/index.ts` и SPA fallback `/*` → `dist/index.html`.
  - Добавлен диагностический эндпоинт `GET /api/health`.
- **Безопасность и пользователи**:
  - Внедрена система ролей `admin` / `user` и bcrypt-хэширование паролей.
  - Создана CLI утилита `scripts/manageUsers.ts` для быстрого сброса паролей и управления пользователями.

---

### 🛠️ 2026-07-25 … 2026-07-26 — Файловая система, ZIP-пакеты, Skill Space View
- **Встроенная файловая система (Skills & Agent Hub)**:
  - Добавлена поддержка загрузки и клиентской распаковки `.zip` архивов (`jszip`).
  - Разработано дерево файлов в стиле VS Code (`FileTreeViewer.tsx`, `SpaceFileTree.tsx`).
  - Реализован **Inline File Editor** (`SpaceFilePreview.tsx`) с сохранением через `Ctrl+S` и отменой через `Escape`.
  - Добавлен инструмент сборки кастомных ZIP архивов из выбранных файлов (`buildSelectionZip.ts`).
  - Реализована панель подсказок к скиллам (`SkillHintsPanel.tsx`).

---

## 🧭 Как ориентироваться в истории изменений

- Если вам нужно посмотреть точный дифф любого коммита:
  ```bash
  git show <commit_hash>
  ```
- Если нужно временно вернуться к состоянию до рефакторинга:
  ```bash
  git checkout v1.0-checkpoint
  ```
- Чтобы вернуться обратно на самый свежий master:
  ```bash
  git checkout master
  ```
