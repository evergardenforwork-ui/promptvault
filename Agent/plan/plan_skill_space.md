# Plan: Страница-Пространство Скилла (Skill Space View)

> Создано: 2026-07-26
> Статус: ✅ Завершено — 2026-07-27

---

## 🎯 Концепция

Сейчас: клик по карточке скилла → открывает модальное окно `SkillView.tsx` (старый просмотр).

**Цель**: клик по карточке скилла → переход на **полноэкранную страницу-пространство** (`spacedSkill` state), где:
- Левая панель: дерево файлов (как VS Code / GitHub)
- Правая панель: предпросмотр выбранного файла (Markdown / код)
- Шапка: название пространства, мета-инфо, кнопки действий
- **Режим выделения**: можно выбирать несколько файлов/папок и скачивать их одним ZIP-архивом

---

## 📸 До реализации (было)

- Карточка скилла в сетке (SkillCard.tsx) — клик открывал старый SkillView (модалка)
- Файловое дерево было в модальном окне
- Не было режима выделения файлов
- Не было ПКМ-меню на папках/файлах
- Скачивание — только всего архива целиком

---

## 🏗️ Архитектура страницы

### Роутинг
```
App.tsx state:
  spacedSkill: SkillPackage | null

Клик по SkillCard → setSpacedSkill(skill)
Кнопка "Назад" → setSpacedSkill(null)

SkillSpaceView рендерится вместо основного layout (не модалка!)
```

---

## 🖥️ Макет страницы `SkillSpaceView` (3 зоны)

```
+--------------------------------------------------------------+
|  ШАПКА: [<- Назад]  [Pkg Название пространства]  [Теги] [Дата] |
|         [Edit Редактировать] [Удалить] [Скачать всё ZIP]    |
+------------------+-------------------------------------------+
|  ПАНЕЛЬ ФАЙЛОВ   |  ПАНЕЛЬ ПРОСМОТРА                         |
|  (левая ~280px)  |  (правая flex-1)                          |
|                  |                                           |
|  [Выбрать файлы] |  breadcrumb / имя файла                  |
|  ─────────────── |  [Копировать] [Скачать]                  |
|  skills/         |  ─────────────────────────────────────── |
|    bootstrap/    |                                           |
|      PRD.md [v]  |   # PRD.md                               |
|      SKILL.md    |   Держит проект в рамках...              |
|    supabase/     |                                           |
|      SKILL.md    |                                           |
+------------------+-------------------------------------------+
        [x Отмена] [Выбрано: 3] [Скачать ZIP]   ← FloatingBar
```

---

## 🧩 Реализованные компоненты

### 1. `SkillSpaceView.tsx` ✅
```
src/sections/skills/SkillSpaceView.tsx
```
Главный оркестратор. State:
- `selectionMode: boolean`
- `selectedPaths: Set<string>`
- `activeFile: FileNode | null`
- `contextMenu: ContextMenuTarget | null`
- `showDeleteConfirm: boolean`

### 2. `SpaceFileTree.tsx` ✅
```
src/sections/skills/space/SpaceFileTree.tsx
```
- Дерево с раскрытием/схлопыванием папок
- Иконки по расширению: `.md` фиолетовый, `.ts/.tsx` синий, `.json` жёлтый, `.py` зелёный
- Счётчик файлов в папке (серый badge)
- `selectionMode` → показывает анимированные чекбоксы
- `selectedPaths` → фиолетовая подсветка выбранных
- Частичное выделение папки (dash в чекбоксе)
- ПКМ передаёт координаты + узел вверх

### 3. `SpaceContextMenu.tsx` ✅
```
src/sections/skills/space/SpaceContextMenu.tsx
```
- Glassmorphism стиль, backdrop-blur
- Позиционирование по `clientX/Y` с коррекцией от края экрана
- Закрытие по клику вне / Escape
- Для файлов: Скачать / Копировать / Добавить в выборку
- Для папок: Скачать как ZIP / Выбрать всё / Добавить в выборку

### 4. `SpaceFilePreview.tsx` ✅
```
src/sections/skills/space/SpaceFilePreview.tsx
```
- Markdown render через `react-markdown` с prose стилями
- `<pre>` блок для не-Markdown файлов
- Breadcrumb: chevron-разделённый путь, последняя часть фиолетовая
- Кнопки: Копировать / Скачать файл

### 5. `SpaceSelectionBar.tsx` ✅
```
src/sections/skills/space/SpaceSelectionBar.tsx
```
- Плавающая панель снизу по центру
- Spring-анимация (y: 100 → 0) через `motion`
- Счётчик с правильными окончаниями (элемент/элемента/элементов)
- Кнопки: Отмена, Скачать ZIP

---

## 🔧 Утилиты

### `buildSelectionZip.ts` ✅
```
src/utils/buildSelectionZip.ts
```
- `buildSelectionZip(nodes, selectedPaths)` → `Promise<Blob>`
- `downloadFolderAsZip(folder)` → скачивает одну папку
- `downloadSingleFile(file)` → скачивает один файл

---

## 📋 Все этапы завершены ✅

### Этап 1 — Роутинг ✅
- [x] `spacedSkill: SkillPackage | null` state в `App.tsx`
- [x] `SkillCard` → `setSpacedSkill(skill)`
- [x] `SkillSpaceView` рендерится вместо layout при `spacedSkill !== null`

### Этап 2 — Дерево файлов ✅
- [x] `SpaceFileTree.tsx` создан
- [x] Раскрытие/схлопывание папок
- [x] Клик по файлу → `onFileClick`
- [x] `selectionMode` + чекбоксы (полные + частичные)
- [x] `selectedPaths` highlight
- [x] ПКМ с координатами

### Этап 3 — Предпросмотр ✅
- [x] `SpaceFilePreview.tsx` создан
- [x] Markdown render
- [x] Код-блок для не-Markdown
- [x] Копировать / Скачать
- [x] Breadcrumb путь

### Этап 4 — Контекстное меню ✅
- [x] `SpaceContextMenu.tsx` создан
- [x] Позиционирование + коррекция края экрана
- [x] Закрытие по Escape / клику вне
- [x] Все действия для файлов и папок

### Этап 5 — Режим выделения + ZIP ✅
- [x] `buildSelectionZip.ts` утилита
- [x] `downloadFolderAsZip` + `downloadSingleFile`
- [x] `SpaceSelectionBar.tsx` — плавающая панель
- [x] Toggle выбора файла/папки
- [x] Выбрать всё в папке
- [x] Скачать выбранное → ZIP

### Этап 6 — Полировка ✅
- [x] `motion` анимации: вход страницы, плавающая панель
- [x] Breadcrumb в превью
- [x] Счётчик файлов в папке
- [x] Иконки по расширению файла

---

## 🔮 Будущие улучшения (после MVP)

- Поиск по файлам внутри пространства (Ctrl+F)
- Inline редактирование файла прямо на странице
- AI-чат по контексту всех .md файлов пространства (Gemini)
- Шаринг пространства по ссылке (isPublic)
- История изменений пространства

---

> **Итог**: Пространство ощущается как мини-IDE / файловый менеджер прямо в браузере.
> Вдохновение: GitHub repository viewer + VS Code Explorer + Notion.
