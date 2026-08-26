# 🚀 PromptVault (Skills, Git, Commands & AI Hub)

Персональное fullstack веб-приложение для хранения, организации и управления промптами для нейросетей, пакетами скиллов, субагентов и MCP-серверов, каталогом полезных репозиториев и ИИ-инструментов, а также базой быстрых команд и инструкций (AI Workflows).

> **Последнее обновление**: 2026-08-26

---

## 🧑‍💻 Для пользователей (Overview)

| Характеристика | Описание |
|---|---|
| **Название** | PromptVault |
| **Описание** | Персональное веб-приложение для хранения промптов, веб-IDE скиллов, каталога Git Tools и хаба быстрых команд и сниппетов. |
| **Стек технологий** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Express.js (dev), Vercel Serverless (prod), Supabase (PostgreSQL + Storage), Google Gemini API (`gemini-3.1-flash-lite`) |

### 🛠️ Как запустить локально

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Настройте `.env` (см. `.env.example`):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Выполните SQL миграции в Supabase SQL Editor:
   - `scripts/create_commands_table.sql` (таблица команд)
   - `scripts/create_git_projects_table.sql` (таблица git-проектов)
   - `scripts/create_skill_hints_table.sql` (при необходимости)
4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
5. Откройте браузер по адресу: `http://localhost:3000`

### 🏗️ Сборка и проверка типов

```bash
# Проверка TypeScript
npm run lint

# Production сборка
npm run build
```

---

## 🤖 Для ИИ-агентов и разработчиков (Onboarding Guide)

### 📚 С чего начинать читать проект:
1. **[`GEMINI.md`](GEMINI.md)** — Главный контекст проекта (стек, структура, API, типы, правила декомпозиции).
2. **[`CHANGELOG.md`](CHANGELOG.md)** — 📜 Глобальный журнал изменений и Git-история (чекпоинты, теги `v1.0-checkpoint`).
3. **[`src/types.ts`](src/types.ts)** — Единый источник TypeScript типов.
4. **[`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md)** & **[`SCHEMA.md`](Agent/MD_files/SCHEMA.md)** — Архитектура модульных разделов (`PromptsSection`, `SkillsSection`, `GitProjectsSection`, `UsersSection`), типы и API.

### 🟡 Справочная системная документация:
5. [`Agent/MD_files/PRD.md`](Agent/MD_files/PRD.md) — Продуктовые требования и Roadmap
6. [`Agent/MD_files/DESIGN.md`](Agent/MD_files/DESIGN.md) — Дизайн-система (токены, fixed IDE viewport, Tailwind v4)
7. [`Agent/MD_files/DATABASE.md`](Agent/MD_files/DATABASE.md) — Схема Supabase PostgreSQL + Storage
8. [`Agent/MD_files/RULES.md`](Agent/MD_files/RULES.md) — Стандарты кода, правила синхронизации API и декомпозиции файлов
9. [`Agent/MD_files/USER_MANAGEMENT.md`](Agent/MD_files/USER_MANAGEMENT.md) — CLI и SQL управление пользователями
10. [`Agent/MD_files/project_structure.md`](Agent/MD_files/project_structure.md) — Полная структура файлов и скриптов

### 📅 Планы разработки:
11. **[`Agent/plan/plan.md`](Agent/plan/plan.md)** — 🟡 **АКТУАЛЬНЫЙ БЭКЛОГ** (Этапы 9–10, бэклог фич)
12. [`Agent/plan/plan_git_hub.md`](Agent/plan/plan_git_hub.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
13. [`Agent/plan/plan_supabase.md`](Agent/plan/plan_supabase.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
14. [`Agent/plan/plan_skill_space.md`](Agent/plan/plan_skill_space.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
15. [`Agent/plan/plan_skill_hints.md`](Agent/plan/plan_skill_hints.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
16. [`Agent/plan/plan_file_system.md`](Agent/plan/plan_file_system.md) — `[✅ ВЫПОЛНЕНО]` (не читать)
