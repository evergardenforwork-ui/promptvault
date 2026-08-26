# План реализации раздела «🌐 Закладки & Веб-сайты» (Web Bookmarks Hub)

> **Статус**: `[✅ ВЫПОЛНЕНО]` (2026-08-26)
> **Файлы раздела**: `src/sections/bookmarks/` (`BookmarksSection.tsx`, `BookmarkCard.tsx`, `BookmarkForm.tsx`, `FolderCreateModal.tsx`)
> **БД**: таблица `bookmarks` (`scripts/create_bookmarks_table.sql`)
> **API**: `/api/bookmarks` (CRUD + POST `/:id/click`)

---

## 🎯 Назначение раздела

Хранение каталога веб-сайтов, полезных инструментов, сервисов, баз знаний и референсов с двухуровневой организацией (как вкладки/папки в браузере), авто-подтягиванием Favicon, баннерами/скриншотами и подсчётом переходов.

---

## 🛠️ Реализованный функционал

1. **База данных Supabase**:
   - Таблица `bookmarks`: `id`, `user_id`, `title`, `url`, `description`, `folder`, `category`, `image`, `favicon`, `tags`, `is_public`, `author_name`, `author_email`, `click_count`, `created_at`.
   - Индексы по `user_id`, `folder`, `category`, `tags`, `created_at`.
   - Обновлен constraint `user_favorites` с типом `'bookmark'`.

2. **API Эндпоинты (`server.ts` & `api/index.ts`)**:
   - `GET /api/bookmarks` — список закладок (публичные + свои)
   - `POST /api/bookmarks` — создание закладки
   - `PUT /api/bookmarks/:id` — обновление закладки
   - `DELETE /api/bookmarks/:id` — удаление закладки
   - `POST /api/bookmarks/:id/click` — инкремент счётчика переходов `click_count`

3. **Frontend Компоненты (`src/sections/bookmarks/`)**:
   - `BookmarksSection.tsx` — оркестратор с браузерной иерархией:
     - Хлебные крошки (Breadcrumbs): `📁 Все закладки > 🤖 AI > 📷 Фото` с прыжком на любой уровень и кнопкой `← Назад`.
     - Компактная сетка подпапок (72px) над карточками сайтов со счётчиками сайтов и кнопкой `+ Создать под-папку`.
     - Тулбар: переключатель «Включая под-папки», режимы Grid / List, сортировка по кликам / дате / алфавиту, фильтры источников и избранного.
   - `BookmarkCard.tsx` — карточка сайта со скриншотом/баннером, доменом, favicon, кликабельным бейджем папки, 1-click открытием и копированием URL.
   - `BookmarkForm.tsx` — модалка добавления с авто-парсингом Favicon и домена по URL, древовидным селектором папки (с отступами `↳`), автоподстановкой активного пути и `ConfirmDialog`.
   - `FolderCreateModal.tsx` — модалка создания папки или под-папки с выбором родительской папки, выбором эмодзи и превью пути.
   - `bookmarkTreeUtils.ts` — утилита парсинга дерева путей, отступов и динамического подсчета сайтов.

4. **Тестирование и проверка**:
   - `tsc --noEmit` — ✅ 0 ошибок
   - `vite build` — ✅ 0 ошибок
