# DATABASE.md — Схема базы данных PromptVault

> Полное описание структуры базы данных Supabase PostgreSQL и Supabase Storage.
>
> **Последнее обновление**: 2026-08-26
> **Связанные файлы**: [`SCHEMA.md`](SCHEMA.md) — API-контракты, [`ARCHITECTURE.md`](ARCHITECTURE.md) — архитектура системы

---

## 📁 Хранилище: Dual-Engine Architecture (Cloud Supabase ☁️ / Local SQLite 💻)

Проект поддерживает два равноправных режима хранения данных:
1. **☁️ Cloud Режим (Supabase PostgreSQL + Storage)**: основной режим для продакшна и Vercel, централизованное хранение в облаке.
2. **💻 Local Режим (SQLite `better-sqlite3` + `data/uploads/`)**: нулевая конфигурация (Zero-Config) для автономной работы на любом ПК, удобной передачи друзьям и полного offline-доступа.

Оба движка используют идентичную реляционную схему из 11 таблиц:

| Таблица / Бакет | Назначение |
|---|---|
| `users` | Пользователи и роли (`admin`, `user`), bcrypt-хэши паролей |
| `workspaces` | 💼 Изолированные рабочие пространства и под-профили пользователя |
| `prompts` | 📷 Промпты для нейросетей с подсекциями, макетами и связью с workspace |
| `skills` | 📦 Пакеты скиллов, субагентов и MCP с древовидной структурой файлов |
| `skill_hints` | Подсказки-промпты для быстрого применения скилла в ИИ |
| `categories` | Пользовательские и системные категории |
| `chats` | История сообщений чата с Gemini |
| `user_favorites` | Личное избранное пользователей (полиморфная связка `item_id` + `item_type`) |
| `git_projects` | 🐙 Git Hub & AI Tools: каталог репозиториев, агентов, моделей с AI-парсером |
| `commands` | ⚡ AI Commands & Workflows: каталог быстрых команд, инструкций и сниппетов |
| `bookmarks` | 🌐 Web Bookmarks: каталог сайтов с папками, подкатегориями и авто-Favicon |
| `prompt-images` (Bucket) | Хранение изображений карточек (до/после, оригиналы, слоты) |
| `prompt-files` (Bucket) | Хранение ZIP архивов пакетов скиллов |

---

## 🔗 Диаграмма связей (ER Diagram)

```mermaid
erDiagram
    USERS {
        text uid PK
        text name
        text email
        text password
        text role
        timestamptz created_at
    }

    WORKSPACES {
        uuid id PK
        text user_id FK
        text name
        text icon
        text color
        boolean is_default
        timestamptz created_at
    }

    PROMPTS {
        uuid id PK
        text user_id FK
        uuid workspace_id FK
        text title
        text category
        text[] tags
        text main_prompt
        text usage_notes
        text media_type
        text prompt_origin
        boolean is_public
        text image_layout_type
        text image_before
        text image_after
        text original_image_before
        text original_image_after
        text original_image_slot2
        text[] additional_images
        text file_package_url
        jsonb file_structure
        jsonb sub_sections
        text author_name
        text author_email
        int usage_count
        timestamptz created_at
    }

    SKILLS {
        uuid id PK
        text user_id FK
        uuid workspace_id FK
        text title
        text description
        text category
        text[] skill_types
        text[] target_ais
        text skill_origin
        text[] tags
        boolean is_public
        text file_package_url
        jsonb file_structure
        text author_name
        text author_email
        timestamptz created_at
    }

    SKILL_HINTS {
        uuid id PK
        uuid skill_id FK
        text user_id FK
        text title
        text text
        timestamptz created_at
    }

    CATEGORIES {
        uuid id PK
        text user_id FK
        text name
        text emoji
        text color
    }

    CHATS {
        uuid id PK
        uuid prompt_id FK
        text user_id FK
        text role
        text content
        text image
        timestamptz created_at
    }

    USER_FAVORITES {
        text user_id PK
        text item_id PK
        text item_type PK
        timestamptz created_at
    }

    GIT_PROJECTS {
        uuid id PK
        text user_id FK
        uuid workspace_id FK
        text title
        text category
        text summary
        text features
        text detailed_description
        text install_command
        text author_notes
        text github_url
        text demo_url
        text image
        text[] tags
        text pricing
        boolean is_public
        text author_name
        text author_email
        timestamptz created_at
    }

    COMMANDS {
        uuid id PK
        text user_id FK
        uuid workspace_id FK
        text title
        text command_text
        text description
        text category
        uuid skill_id FK
        text skill_title
        text target_ai
        text[] tags
        text[] variables
        boolean is_public
        int usage_count
        text author_name
        text author_email
        timestamptz created_at
    }

    BOOKMARKS {
        uuid id PK
        text user_id FK
        uuid workspace_id FK
        text title
        text url
        text description
        text folder
        text category
        text favicon
        text image
        text[] tags
        int click_count
        boolean is_public
        text author_name
        text author_email
        timestamptz created_at
    }

    USERS ||--o{ WORKSPACES : "владеет"
    USERS ||--o{ PROMPTS : "создаёт"
    USERS ||--o{ SKILLS : "создаёт"
    USERS ||--o{ GIT_PROJECTS : "добавляет"
    USERS ||--o{ COMMANDS : "создаёт"
    USERS ||--o{ BOOKMARKS : "сохраняет"
    USERS ||--o{ CATEGORIES : "создаёт"
    USERS ||--o{ CHATS : "пишет"
    USERS ||--o{ USER_FAVORITES : "имеет личное избранное"
    USERS ||--o{ SKILL_HINTS : "создаёт"
    WORKSPACES ||--o{ PROMPTS : "группирует"
    WORKSPACES ||--o{ SKILLS : "группирует"
    WORKSPACES ||--o{ GIT_PROJECTS : "группирует"
    WORKSPACES ||--o{ COMMANDS : "группирует"
    WORKSPACES ||--o{ BOOKMARKS : "группирует"
    PROMPTS ||--o{ CHATS : "обсуждается в"
    SKILLS ||--o{ SKILL_HINTS : "содержит"
    SKILLS ||--o{ COMMANDS : "связан с"
```

---

## 📐 Правила видимости данных

| Объект | Кто видит |
|--------|-----------|
| `Prompt` с `is_public: true` | Все авторизованные пользователи |
| `Prompt` с `is_public: false` | Только автор (`user_id`) + admin |
| `Skill` с `is_public: true` | Все авторизованные пользователи |
| `Skill` с `is_public: false` | Только автор + admin |
| `Category` с `user_id = admin-uid` или `null` | Все (общие категории) |
| `Category` с `user_id = uid` | Только этот пользователь |
| `ChatMessage` | Только автор (фильтр по `user_id`) |
| `SkillHint` | Все, у кого есть доступ к родительскому скиллу |
| `Favorites` | Только конкретный пользователь |
| Любая запись | Admin (`evergardenforwork@gmail.com`) видит всё |

---

## 🏷️ Значения enum-полей

### `mediaType` (Prompt)
- `photo` — Фото-промпт (по умолчанию)
- `video` — Видео-промпт (Sora, Kling, Runway, Luma)
- `text` — Текстовый промпт (ChatGPT, Claude, Gemini)
- `music` — Музыкальный промпт (Suno, Udio)

### `promptOrigin` / `skillOrigin`
- `own` — Авторский материал
- `web` — Материал, найденный в сети

### `imageLayoutType` (Prompt)
- `single` — Одиночное фото
- `slider` — Интерактивный ДО/ПОСЛЕ слайдер
- `split-vertical` — Вертикальный сплит (2 колонки)
- `split-horizontal` — Горизонтальный сплит (2 строки)
- `split-1-2` — Слева 1 большое фото, справа 2 маленьких
- `merge-2-1` — Слева 2 маленьких фото, справа 1 большое

### `skillTypes` (Skill)
- `skill` (Скилл), `agent` (Агент), `mcp` (MCP), `config` (Конфиг), `rules` (Правила), `template` (Шаблон), `hooks` (Хуки), `other` (Разное)

### `targetAis` (Skill)
- `universal`, `claude`, `gemini`, `chatgpt`, `deepseek`, `cursor`, `other`

---

## 🛠️ Полная DDL SQL-схема

```sql
-- 1. Пользователи
CREATE TABLE IF NOT EXISTS users (
    uid         TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,  -- bcrypt hash
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Категории
CREATE TABLE IF NOT EXISTS categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT REFERENCES users(uid) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    emoji      TEXT,
    color      TEXT,
    CONSTRAINT valid_name CHECK (length(name) > 0)
);

-- 3. Промпты
CREATE TABLE IF NOT EXISTS prompts (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title                 TEXT NOT NULL,
    category              TEXT NOT NULL,
    tags                  TEXT[] DEFAULT '{}',
    main_prompt           TEXT NOT NULL,
    usage_notes           TEXT DEFAULT '',
    media_type            TEXT DEFAULT 'photo' CHECK (media_type IN ('photo','video','text','music')),
    prompt_origin         TEXT DEFAULT 'own' CHECK (prompt_origin IN ('own','web')),
    is_public             BOOLEAN DEFAULT FALSE,
    image_layout_type     TEXT DEFAULT 'single',
    image_before          TEXT,
    image_after           TEXT,
    original_image_before TEXT,
    original_image_after  TEXT,
    original_image_slot2  TEXT,
    additional_images     TEXT[] DEFAULT '{}',
    file_package_url      TEXT,
    file_structure        JSONB DEFAULT '[]',
    sub_sections          JSONB DEFAULT '[]',
    author_name           TEXT,
    author_email          TEXT,
    usage_count           INT DEFAULT 0,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Скиллы (Skills & AI Hub)
CREATE TABLE IF NOT EXISTS skills (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT DEFAULT '',
    category         TEXT DEFAULT '',
    skill_types      TEXT[] DEFAULT '{}',
    target_ais       TEXT[] DEFAULT '{}',
    skill_origin     TEXT DEFAULT 'own',
    tags             TEXT[] DEFAULT '{}',
    is_public        BOOLEAN DEFAULT FALSE,
    file_package_url TEXT,
    file_structure   JSONB DEFAULT '[]',
    author_name      TEXT,
    author_email     TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Подсказки к скиллам (Skill Hints)
CREATE TABLE IF NOT EXISTS skill_hints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    text        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Чат-сообщения (AI Assistant)
CREATE TABLE IF NOT EXISTS chats (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id  UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content    TEXT NOT NULL,
    image      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Личное избранное
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id    TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    item_id    TEXT NOT NULL,
    item_type  TEXT NOT NULL CHECK (item_type IN ('prompt', 'skill', 'git_project', 'command', 'bookmark')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id, item_type)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_prompts_user_id       ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public     ON prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_category      ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at    ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_user_id        ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_is_public      ON skills(is_public);
CREATE INDEX IF NOT EXISTS idx_skill_hints_skill_id  ON skill_hints(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user   ON user_favorites(user_id);

-- 8. Полная схема Supabase со всеми 10 таблицами находится в scripts/schema.sql
```

> 🚀 **Полный канонический DDL-скрипт**: Для инициализации или обновления всей базы данных Supabase выполните файл [`scripts/schema.sql`](../../scripts/schema.sql) в Supabase SQL Editor.
