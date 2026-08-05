# 🚀 PromptVault

Персональное веб-приложение для хранения и управления промптами для нейросетей.

## 🧑‍💻 Для людей (For Humans)

| Характеристика | Описание |
|---|---|
| **Название** | PromptVault |
| **Описание** | Персональное веб-приложение для хранения и управления промптами для нейросетей. Встроен ИИ-ассистент. |
| **Стек технологий** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Express.js, JSON DB (миграция на Supabase в процессе) |

### 🛠️ Как запустить локально

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
3. Откройте браузер по адресу: `http://localhost:3000`

### 🏗️ Сборка (Build)

Для создания production-сборки:
```bash
npm run build
```

### 🔐 Администратор по умолчанию

Для настройки администратора по умолчанию задайте следующие переменные в файле `.env`:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

---

## 🤖 Для ИИ-агентов (For AI Agents)

### 🔴 Обязательно прочитай перед началом работы:
1. `GEMINI.md` — Главный контекст проекта (стек, структура, API, типы, бизнес-логика)
2. `src/types.ts` — Единый источник TypeScript типов

### 🟡 Читай по необходимости (Документация проекта):
3. `Agent/MD_files/PRD.md` — Продуктовые требования
4. `Agent/MD_files/DESIGN.md` — Дизайн-система (цвета, анимации, компоненты)
5. `Agent/MD_files/ARCHITECTURE.md` — Архитектура системы
6. `Agent/MD_files/DATABASE.md` — Схема БД (JSON + SQL)
7. `Agent/MD_files/SCHEMA.md` — API-контракты
8. `Agent/MD_files/RULES.md` — Стандарты кода

### 📅 Планы разработки:
9. `Agent/plan/plan.md` — Основной план (этапы 1-10)
10. `Agent/plan/plan_supabase.md` — Миграция на Supabase

### 🐘 Supabase скилы (читай при работе с Supabase):
11. `.agents/skills/supabase/SKILL.md` — Supabase best practices, RLS, безопасность
12. `.agents/skills/supabase-postgres-best-practices/SKILL.md` — Postgres оптимизация

### 🎯 Текущий приоритет:
**Миграция кода `server.ts` с JSON-файлов на Supabase + подготовка деплоя на Vercel.**
