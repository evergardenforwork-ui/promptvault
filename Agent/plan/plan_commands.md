# План реализации раздела «⚡ Команды & Инструкции» (AI Commands & Workflows)

> **Статус**: `[✅ ВЫПОЛНЕНО]` (2026-08-26)
> **Файлы раздела**: `src/sections/commands/` (`CommandsSection.tsx`, `CommandCard.tsx`, `CommandForm.tsx`, `CommandFillModal.tsx`)
> **БД**: таблица `commands` (`scripts/create_commands_table.sql`)
> **API**: `/api/commands` (CRUD + POST `/:id/use`)

---

## 🎯 Назначение раздела

Хранение быстрых сниппетов, системных инструкций, команд терминала и промптов для работы с кодом и ИИ (например: «Сделай полный аудит кода», «Обнови документацию», «Задеплой на Vercel»).

---

## 🛠️ Реализованный функционал

1. **База данных Supabase**:
   - Таблица `commands`: `id`, `user_id`, `title`, `command_text`, `description`, `category`, `skill_id`, `target_ai`, `tags`, `variables`, `is_public`, `author_name`, `author_email`, `usage_count`, `created_at`.
   - Индексы по `user_id`, `category`, `skill_id`, `target_ai`, `tags`, `created_at`.
   - Обновлен constraint `user_favorites` с типом `'command'`.

2. **API Эндпоинты (`server.ts` & `api/index.ts`)**:
   - `GET /api/commands` — список команд (публичные + свои)
   - `POST /api/commands` — создание команды с авто-парсингом плейсхолдеров `{{param}}`
   - `PUT /api/commands/:id` — обновление команды
   - `DELETE /api/commands/:id` — удаление команды
   - `POST /api/commands/:id/use` — инкремент счётчика `usage_count`

3. **Frontend Компоненты (`src/sections/commands/`)**:
   - `CommandsSection.tsx` — оркестратор сетки/списка, фильтры категорий, ИИ платформ, ownership, избранного, сортировки.
   - `CommandCard.tsx` — карточки с 1-клик копированием, анимацией скопировано, открытием смарт-модалки при наличии параметров `{{...}}`, бейджем скилла с переходом в Web IDE.
   - `CommandForm.tsx` — редактор команды с моноширинным полем, быстрыми кнопками вставки параметров (`+ {{file}}`, `+ {{target}}`, etc.), выбором категории и привязкой к скиллам.
   - `CommandFillModal.tsx` — всплывающее окно быстрого заполнения параметров перед копированием с живым предпросмотром.

4. **Тестирование и проверка**:
   - `tsc --noEmit` — ✅ 0 ошибок
   - `vite build` — ✅ 0 ошибок
