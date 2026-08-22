# 📜 CHANGELOG.md — Глобальный журнал изменений и Git-история PromptVault

> Единый реестр всех ключевых изменений, версий, контрольных точек (Git checkpoints & tags) и архитектурных улучшений проекта.
> **Последнее обновление**: 2026-08-23

---

## 🏷️ Теги и Контрольные точки (Git Checkpoints)

| Тег / Хеш | Дата | Название / Назначение | Описание |
|---|:---:|---|---|
| `v1.0-checkpoint`<br>`cb3b633` | 2026-08-23 | **ОТПРАВНАЯ ТОЧКА ДО ГЛОБАЛЬНЫХ ИЗМЕНЕНИЙ** | Полностью рабочий проект на Supabase до рефакторинга на модульные разделы. Точка безопасного отката (`git checkout v1.0-checkpoint`). |
| `373f395` | 2026-08-23 | **Section-Based Modular Architecture** | Выделены модульные компоненты `PromptsSection.tsx` и `SkillsSection.tsx`. `App.tsx` сокращён в 2 раза. |
| `0267788` | 2026-08-23 | **Docs & Roadmap Sync** | Синхронизация PRD.md (Phase 7 & 8) и PLAN.md с новой архитектурой. |
| `699b78a` | 2026-08-10 | **Vercel + IDE + Hints Milestone** | Завершение интеграции Vercel Serverless, Fixed IDE Layout, Inline Editor и Skill Hints. |

---

## 🗓️ Хронологический журнал изменений

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
