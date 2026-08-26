# 🚀 PromptVault (Skills, Git, Commands & Bookmarks Hub)

Персональное fullstack веб-приложение для хранения, организации и управления промптами для нейросетей, пакетами скиллов, каталогом полезных репозиториев, базой быстрых команд (AI Workflows), а также каталогом веб-закладок и сервисов с папками и подкатегориями.

> **Последнее обновление**: 2026-08-26

---

## 🧑‍💻 Для пользователей (Overview)

| Характеристика | Описание |
|---|---|
| **Название** | PromptVault |
| **Описание** | Персональное веб-приложение для хранения промптов, веб-IDE скиллов, каталога Git Tools, хаба быстрых команд и браузерных закладок с поддержкой 2 тем (🌙 Dark / ☀️ Light). |
| **Стек технологий** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Express.js, Vercel Serverless, Dual-Engine (☁️ Supabase PostgreSQL / 💻 Local SQLite `better-sqlite3`), Google Gemini API (`gemini-3.1-flash-lite`) |

### ⚡ Как запустить (1-клик запуск на Windows)

- Просто дважды кликните по файлу **`start_promptvault.bat`** (или `local/start_local.bat`).
- Всё запустится локально на SQLite без необходимости регистрироваться в облаке!
- Подробный гайд для друзей: [`local/README_LOCAL.md`](local/README_LOCAL.md).

### 🛠️ Как запустить через Терминал

1. Установите зависимости:
   ```bash
   npm install
   ```
2. (Опционально) Настройте `.env` для облачного Supabase режима (см. `.env.example`). Если `.env` отсутствует, сервер автоматически стартует в автономном локальном режиме (SQLite).
3. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
4. Откройте браузер по адресу: `http://localhost:3000`
   - **Локальный логин**: `admin@promptvault.local` / пароль `admin123` (или кнопка автозаполнения).
   - **Онлайн-хостинг**: первый админ создаётся скриптом [`scripts/schema.sql`](scripts/schema.sql) или `npx tsx scripts/manageUsers.ts create email password name admin`.

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
1. **[`AGENTS.md`](AGENTS.md)** / **[`GEMINI.md`](GEMINI.md)** / **[`CLAUDE.md`](CLAUDE.md)** — Главный контекст проекта, Протокол первого действия, стек, структура, API, типы, правила декомпозиции.
2. **[`CHANGELOG.md`](CHANGELOG.md)** — 📜 Глобальный журнал изменений и Git-история (чекпоинты, теги `v1.0-checkpoint`).
3. **[`src/types.ts`](src/types.ts)** — Единый источник TypeScript типов.
4. **[`Agent/MD_files/ARCHITECTURE.md`](Agent/MD_files/ARCHITECTURE.md)** & **[`SCHEMA.md`](Agent/MD_files/SCHEMA.md)** — Архитектура всех 5 модульных хабов, типы и API.

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
