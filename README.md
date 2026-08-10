# 🚀 PromptVault (Skills & AI Hub)

Персональное fullstack веб-приложение для хранения, организации и управления промптами для нейросетей, а также пакетами скиллов, субагентов и MCP-серверов.

> **Последнее обновление**: 2026-08-10

---

## 🧑‍💻 Для пользователей (Overview)

| Характеристика | Описание |
|---|---|
| **Название** | PromptVault |
| **Описание** | Персональное веб-приложение для хранения промптов с макетами изображений и веб-IDE пространств скиллов (Skills, MCP, Agents). |
| **Стек технологий** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Express.js (dev), Vercel Serverless (prod), Supabase (PostgreSQL + Storage) |

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
3. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
4. Откройте браузер по адресу: `http://localhost:3000`

### 🏗️ Сборка и проверка типов

```bash
# Проверка TypeScript
npm run lint

# Production сборка
npm run build
```

---

## 🤖 Для ИИ-агентов (For AI Agents)

### 🔴 Обязательно прочитай перед началом работы:
1. `GEMINI.md` — Главный контекст проекта (стек, структура, API, типы, бизнес-логика)
2. `src/types.ts` — Единый источник TypeScript типов

### 🟡 Документация проекта:
3. `Agent/MD_files/PRD.md` — Продуктовые требования
4. `Agent/MD_files/DESIGN.md` — Дизайн-система (токены, анимации, компоненты)
5. `Agent/MD_files/ARCHITECTURE.md` — Архитектура системы
6. `Agent/MD_files/DATABASE.md` — Схема Supabase PostgreSQL + Storage
7. `Agent/MD_files/SCHEMA.md` — ER-диаграммы и API-контракты
8. `Agent/MD_files/RULES.md` — Стандарты кода и правила синхронизации API

### 📅 Планы разработки:
9. `Agent/plan/plan.md` — Основной план (этапы 1-10)
10. `Agent/plan/plan_supabase.md` — Миграция на Supabase и деплой на Vercel
11. `Agent/plan/plan_skill_space.md` — Полноэкранное пространство скиллов
12. `Agent/plan/plan_skill_hints.md` — Система подсказок к скиллам и inline-редактор
