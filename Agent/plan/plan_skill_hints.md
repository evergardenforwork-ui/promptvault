# Plan: Skill Hints (Подсказки к скиллу) + Inline File Editor

> Создано: 2026-08-04  
> Статус: 📋 Запланировано — делать ПОСЛЕ миграции на Supabase

---

## 🎯 Концепция

Два взаимосвязанных улучшения SkillSpaceView:

1. **Inline File Editor** — редактировать содержимое файла прямо в правой панели (без скачивания)
2. **Skill Hints** — система коротких подсказок-промптов, привязанных к скиллу, которые можно быстро скопировать в буфер обмена

### Зачем Skill Hints?

Это «промпты поверх промптов» — когда ты хочешь дать ИИ контекст:
> *«Запомни скилл Supabase и введи его в курс дела во всех документациях»*

Ты создаёшь подсказку один раз, потом копируешь одним кликом и вставляешь в любой чат с ИИ.

---

## 🖥️ Макет: Skill Hints Panel

### Кнопка доступа
```
SkillSpaceView — шапка:
  [← Назад] [Название скилла] [Теги]  ...  [💡 Подсказки (3)] [Редактировать] [Скачать]
```
Цифра в скобках = количество существующих подсказок для скилла.

### Панель подсказок (центральное модальное окно)
```
┌─────────────────────────────────────────────┐
│  💡 Подсказки для "Supabase"          [✕]   │
│─────────────────────────────────────────────│
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 📌 Курс дела                    [📋] │   │
│  │ Запомни этот скилл Supabase и        │   │
│  │ введи его в курс дела во все         │   │
│  │ документации проекта...              │   │
│  │                                 [🗑] │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 📌 Для новой сессии             [📋] │   │
│  │ При начале работы с Supabase         │   │
│  │ всегда читай SKILL.md ...           │   │
│  │                                 [🗑] │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [+ Создать подсказку]                      │
└─────────────────────────────────────────────┘
```

### Форма создания подсказки (expandable внутри панели)
```
┌─────────────────────────────────────────────┐
│  📝 Новая подсказка                         │
│  ┌──────────────────────────────────────┐   │
│  │ Заголовок: [ Курс дела            ]  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Текст:                               │   │
│  │ Запомни этот скилл Supabase и        │   │
│  │ введи его в курс дела...             │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│  [Отмена]                      [Сохранить]  │
└─────────────────────────────────────────────┘
```

---

## 🗃️ Структура данных

### TypeScript тип (добавить в `src/types.ts`)
```typescript
export interface SkillHint {
  id: string;          // uuid
  skillId: string;     // FK → skills.id
  userId: string;      // кто создал
  title: string;       // «Курс дела»
  text: string;        // полный текст подсказки
  createdAt: string;   // ISO datetime
}
```

### Хранение

**Сейчас (JSON вариант):**  
Новый файл `data/skill_hints.json` — структура аналогична `favorites.json`.

**После Supabase (приоритетно):**  
Новая таблица `skill_hints`:
```sql
CREATE TABLE public.skill_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON skill_hints(skill_id);
CREATE INDEX ON skill_hints(user_id);
```

---

## 🔌 API Эндпоинты (добавить в `server.ts`)

```
GET    /api/skills/:id/hints        → Список подсказок для скилла
POST   /api/skills/:id/hints        → Создать подсказку { title, text }
DELETE /api/skills/:id/hints/:hintId → Удалить подсказку
```

---

## 🧩 Компоненты

### Новые файлы:
```
src/sections/skills/space/
  └── SkillHintsPanel.tsx   ← Модальная панель со списком + формой создания
```

### Изменения в существующих:
```
src/sections/skills/SkillSpaceView.tsx
  + state: showHints: boolean
  + state: hints: SkillHint[]
  + кнопка [💡 Подсказки (N)] в шапке
  + <SkillHintsPanel> рендер при showHints=true

src/services/api.ts
  + getSkillHints(skillId)
  + createSkillHint(skillId, { title, text })
  + deleteSkillHint(skillId, hintId)

src/types.ts
  + SkillHint интерфейс
```

---

## 🖊️ Inline File Editor (отдельная фича, связанная)

### Концепция
При просмотре файла в правой панели — кнопка **[✏️ Редактировать]** переключает режим:
- Render-режим (текущий): Markdown / код с подсветкой
- Edit-режим: `<textarea>` с содержимым файла
- Кнопки: **[Сохранить]** / **[Отмена]**

### Хранение изменений
Изменения файла сохраняются в `fileStructure` объекта `SkillPackage` через:
```
PUT /api/skills/:id  → обновляет поле fileStructure целиком
```

Это уже существующий эндпоинт — ничего нового добавлять не надо.

### Компоненты
```
src/sections/skills/space/SpaceFilePreview.tsx
  + state: isEditing: boolean
  + state: editContent: string
  + кнопка [✏️ Редактировать] / [👁 Просмотр]
  + <textarea> в edit-режиме
  + [Сохранить] → onSaveFile(path, content) → вверх в SkillSpaceView

src/sections/skills/SkillSpaceView.tsx
  + handleSaveFile(path, newContent) — обновляет FileNode в fileStructure
  + вызывает PUT /api/skills/:id
```

---

## 📋 Порядок реализации

### Приоритет (делать вместе одной сессией):

```
Шаг 1 — Inline File Editor (~1.5 часа)
  - SpaceFilePreview.tsx: edit-режим с textarea
  - SkillSpaceView.tsx: handleSaveFile + PUT API вызов
  - Toast «Файл сохранён»

Шаг 2 — Skill Hints: бэкенд (~1 час)
  - Добавить SkillHint в types.ts
  - data/skill_hints.json
  - GET/POST/DELETE /api/skills/:id/hints в server.ts
  - getSkillHints/createSkillHint/deleteSkillHint в api.ts

Шаг 3 — Skill Hints: UI (~2 часа)
  - SkillHintsPanel.tsx: список + форма создания
  - Glassmorphism стиль как в SpaceContextMenu
  - Кнопка копирования → navigator.clipboard.writeText()
  - Анимация через motion
  - Кнопка [💡 Подсказки (N)] в шапке SkillSpaceView

Итого: ~4.5 часа
```

---

## ⏰ Когда делать?

> **После миграции на Supabase** — потому что:
> 1. Hint'ы логично хранить в Supabase таблице `skill_hints` с FK → skills
> 2. При JSON-хранении нужен отдельный файл, который потом снова мигрировать
> 3. Inline File Editor использует `PUT /api/skills/:id` — этот роут сейчас пишет в JSON,
>    после Supabase будет писать в БД (что правильнее)
>
> **Исключение**: если Supabase-миграция затянется на недели — можно сделать
> Inline Editor сейчас (не требует новых таблиц), а Hints — после Supabase.

---

## 🚦 Статус чеклист

- [x] **Inline File Editor** — SpaceFilePreview edit-mode (`Ctrl+S` save, `Escape` cancel)
- [x] **SkillHint** тип в types.ts  
- [x] **GET/POST/DELETE** /api/skills/:id/hints в server.ts  
- [x] **getSkillHints/createSkillHint/deleteSkillHint** в api.ts  
- [x] **SkillHintsPanel.tsx** — UI панель (glassmorphism, copy 1-click, form, animations)  
- [x] **Кнопка в шапке** SkillSpaceView (с живым счётчиком)  
- [ ] **Supabase таблица** skill_hints — SQL готов: `scripts/create_skill_hints_table.sql` → выполнить в Dashboard  

