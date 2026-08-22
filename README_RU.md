# PromptVault (Skills & AI Hub)

**PromptVault** — персональное fullstack веб-приложение для хранения, организации и управления промптами для нейросетей, а также пакетами скиллов, субагентов и MCP-серверов.

> **Последнее обновление**: 2026-08-23

---

## 📂 Архитектура и структура проекта

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4 (@theme), Framer Motion (`motion` v12), Lucide React, React Markdown (GFM + frontmatter).
- **Backend / API**: Express.js (`server.ts`) для локальной разработки + Vercel Serverless Function (`api/index.ts`) для production.
- **База данных**: Supabase PostgreSQL (таблицы `users`, `prompts`, `skills`, `skill_hints`, `categories`, `chats`, `user_favorites`).
- **Файловое хранилище**: Supabase Storage (бакеты `prompt-images`, `prompt-files`).
- **ИИ-функции**: Google Gemini API (`@google/genai`, модель `gemini-2.5-flash-lite` — временно в разработке).

---

## 🖼️ Основные возможности

### 1. Макеты изображений и Кроппер
- **6 поддерживаемых сеток (Layouts)**:
  - 1 Фото (одиночное изображение)
  - Слайдер ДО/ПОСЛЕ (плавное сравнение двух изображений)
  - Вертикальный сплит (два изображения друг над другом)
  - Горизонтальный сплит (два изображения бок о бок)
  - Сплит 1-2 (одно крупное слева, два поменьше справа)
  - Сплит 2-1 (два сверху, одно объединенное внизу)
- **Встроенный HTML5 Canvas кроппер**:
  - Drag to pan (перетаскивание фокуса кадра)
  - Zoom от 100% до 300%
  - Автоматическая адаптация под пропорции целевой ячейки
  - Загрузка напрямую в бакет `prompt-images` Supabase Storage

### 2. Раздел «Skills & Агенты» (Skill Space View)
- **Полноэкранное пространство (Web IDE)**:
  - Дерево файлов в стиле VS Code (`SpaceFileTree`) с подсветкой и иконками по расширениям
  - Превью Markdown и исходного кода с breadcrumb навигацией
  - **Inline File Editor**: редактирование файлов прямо в браузере с быстрым сохранением (`Ctrl+S`)
  - **Skill Hints (Подсказки)**: готовые подсказки-промпты для быстрого применения скилла в ИИ в 1 клик
  - **Контекстное меню ПКМ**: скачивание, копирование, выбор файлов и папок
  - **Кастомный ZIP на лету**: плавающая панель `SpaceSelectionBar` для генерации архива выбранных элементов

### 3. Интерактивная навигация и фильтрация
- **Вкладки источников (Ownership)**:
  - **Все (+ чужие)** — абсолютно все записи базы данных
  - **Все мои** — все ваши материалы (авторские + из сети)
  - **Мои (Авторские)** — только ваши авторские промпты/скиллы
  - **Мои (Из сети)** — только сохранённые из сети
  - **Чужие (Публичные)** — публичные материалы других пользователей
- **Специальные фильтры для скиллов**:
  - По типу: Скилл, Агент, MCP, Конфиг, Правила, Шаблон, Хуки, Разное
  - По платформе ИИ: Универсальный, Claude, Gemini, ChatGPT, DeepSeek, Cursor
- **Категории и хештеги**: горизонтальная прокручиваемая панель с возможностью создания категорий прямо из ленты.

---

## 🛠️ Локальный запуск

1. **Установка зависимостей:**
   ```bash
   npm install
   ```

2. **Переменные окружения (`.env`):**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Запуск в режиме разработки:**
   ```bash
   npm run dev
   ```
   Приложение доступно по адресу `http://localhost:3000`.

---

## 🔐 Роли и безопасность

- **Администратор**: `evergardenforwork@gmail.com` (полные права, управление пользователями, сброс паролей).
- **Пароли**: защищены bcrypt-хэшированием в таблице `users`.
- **Приватность**: `is_public = false` гарантирует видимость только автору и администратору.

---

## 🤖 Руководство по документации для ИИ-агентов и разработчиков

### 📚 С чего начинать изучение проекта:
1. **[`GEMINI.md`](GEMINI.md)** — контекст, стек, карта эндпоинтов и правила разработки.
2. **[`CHANGELOG.md`](CHANGELOG.md)** — 📜 история версий, коммитов и контрольных точек (`v1.0-checkpoint`).
3. **[`src/types.ts`](src/types.ts)** — единый источник TypeScript типов.
4. **[`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md)** & **[`SCHEMA.md`](Agent/MD_files/SCHEMA.md)** — архитектура модульных разделов (`PromptsSection`, `SkillsSection`, `UsersSection`), типы и API.

### 🟡 Справочная системная документация (`Agent/MD_files/`):
- [`PRD.md`](Agent/MD_files/PRD.md) — Продуктовые требования и Roadmap
- [`DESIGN.md`](Agent/MD_files/DESIGN.md) — Дизайн-система (токены, fixed IDE viewport, Tailwind v4)
- [`DATABASE.md`](Agent/MD_files/DATABASE.md) — Схема Supabase PostgreSQL + Storage
- [`RULES.md`](Agent/MD_files/RULES.md) — Стандарты кода и правила синхронизации API
- [`USER_MANAGEMENT.md`](Agent/MD_files/USER_MANAGEMENT.md) — CLI и SQL управление пользователями
- [`project_structure.md`](Agent/MD_files/project_structure.md) — Полная структура файлов и скриптов

### 📅 Планы разработки (`Agent/plan/`):
- **[`Agent/plan/plan.md`](Agent/plan/plan.md)** — 🟡 **АКТУАЛЬНЫЙ БЭКЛОГ** (Этапы 9–10, бэклог фич)
- **[`Agent/plan/plan_git_hub.md`](Agent/plan/plan_git_hub.md)** — `[🔴 НУЖНО СДЕЛАТЬ]` Раздел Git Tools & Gemini Smart Parser
- [`Agent/plan/plan_supabase.md`](Agent/plan/plan_supabase.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
- [`Agent/plan/plan_skill_space.md`](Agent/plan/plan_skill_space.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
- [`Agent/plan/plan_skill_hints.md`](Agent/plan/plan_skill_hints.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
- [`Agent/plan/plan_file_system.md`](Agent/plan/plan_file_system.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
