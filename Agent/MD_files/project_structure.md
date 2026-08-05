# Структура и компоненты проекта PromptVault

PromptVault — это веб-приложение для хранения, организации и тестирования промптов нейросетей, оснащенное встроенным ИИ-ассистентом на базе Google Gemini API и локальной базой данных на JSON-файлах.

---

## 📂 Архитектура и Файловая структура

```
promptvault/
├── .env.example              # Пример файла переменных окружения
├── DEPLOY_RENDER_RU.md       # Инструкция по деплою на Render.com
├── README_RU.md              # Документация проекта на русском языке
├── package.json              # Скрипты и зависимости Node.js
├── server.ts                 # Express.js сервер для API, Gemini API проксирования и раздачи статики
├── vite.config.ts            # Конфигурация сборщика Vite с поддержкой Tailwind v4
├── supabase_schema.sql       # SQL-миграция и схема баз данных Postgres для Supabase (RLS, Buckets)
├── plan_supabase.md          # План переноса БД и Storage на Supabase
├── scripts/
│   └── migrateToSupabase.ts  # Скрипт миграции локальных данных в Supabase
├── .agents/skills/           # Интегрированные агентские скиллы (supabase, postgres-best-practices)
├── data/                     # Локальная база данных (JSON/Images, в git ignored)
└── src/                      # Исходный код Frontend-части
    ├── main.tsx              # Точка входа React
    ├── index.css             # Глобальные стили Tailwind CSS
    ├── App.tsx               # Основное приложение (содержит интерфейс и роутинг)
    ├── types.ts              # Описание типов TypeScript (Prompt, Category, ChatMessage и др.)
    ├── services/
    │   ├── api.ts            # API клиент для работы с сервером
    │   └── gemini.ts         # Перенаправление запросов к Gemini на Express прокси
    ├── utils/
    │   ├── cn.ts             # Утилита объединения классов Tailwind
    │   └── zipParser.ts      # Утилита парсинга .ZIP архивов со скиллами через JSZip
    ├── components/           # Модульные компоненты (Auth, Sidebar, Toast, FileTreeViewer и др.)
    │   └── ui/
    │       └── FileTreeViewer.tsx # Дерево файлов и просмотрщик .md инструкций/скиллов
    └── sections/             # Разделы (PhotoCard, PhotoForm, PhotoView и др.)
```

---

## 🛠 Технологический стек

*   **Frontend**: React (v19), Vite (v6), Tailwind CSS (v4), Framer Motion, Lucide React, React Markdown.
*   **Backend / DB**: Node.js + Express.js + Локальная JSON БД.
*   **ИИ**: Google Gemini SDK (на сервере через `@google/genai`), модель `gemini-2.5-flash-lite` для чата и анализа изображений.

---

## 🗄 Структура Базы Данных (Локальные JSON)

В базе данных используются следующие структуры:

### 1. `prompts` (Промпты)
Содержит шаблоны промптов, созданные пользователями.
*   `id`: string (идентификатор документа)
*   `userId`: string (ID создателя)
*   `title`: string (название промпта)
*   `category`: string (ID категории)
*   `tags`: string[] (теги промпта)
*   `subSections`: array of `{ title: string, text: string }` (подразделы/переменные промпта)
*   `mainPrompt`: string (основное тело промпта)
*   `usageNotes`: string? (инструкции/подсказки по использованию шаблона)
*   `filePackageUrl`: string? (ссылка на оригинальный прикрепленный ZIP архив)
*   `fileStructure`: FileNode[]? (дерево папок и содержимого текстовых скиллов `.md` / `.json` из ZIP)
*   `imageBefore`: string? (Data URL изображения "до")
*   `imageAfter`: string? (Data URL изображения "после")
*   `additionalImages`: string[] (дополнительные изображения)
*   `isFavorite`: boolean (добавлен ли в избранное текущим пользователем)
*   `isPublic`: boolean (доступен ли всем пользователям или приватный)
*   `authorName`: string (имя автора)
*   `authorEmail`: string (email автора)
*   `usageCount`: number (счетчик использований)
*   `createdAt`: Timestamp (время создания)

### 2. `categories` (Категории)
Пользовательские категории для группировки промптов.
*   `id`: string
*   `userId`: string
*   `name`: string (название)
*   `emoji`: string (иконка-эмодзи)
*   `color`: string (цвет категории в HEX или Tailwind-классе)

### 3. `chats` (ИИ-ассистент / Сообщения)
Логи общения с Gemini в контексте конкретного промпта.
*   `id`: string
*   `promptId`: string (связанный промпт)
*   `userId`: string (владелец чата)
*   `role`: `'user' | 'model'`
*   `content`: string (текст сообщения)
*   `image`: string? (Data URL прикрепленного изображения)
*   `createdAt`: Timestamp

---

## 🛡 Безопасность и роли
*   **Администратор**: Пользователь с email `alexey.unstam@gmail.com` имеет полные права администратора (может видеть и изменять все промпты, включая приватные).
*   **Промпты**: Публичные промпты (`isPublic == true`) доступны для чтения всем. Приватные промпты доступны только создателю (`userId`) или админу.
*   **Категории & Чаты**: Изолированы по `userId`. Пользователи видят и изменяют только свои собственные данные.

---

## 🏃‍♂️ Скрипты запуска

*   `npm run dev` — Запуск локального сервера разработки через `tsx server.ts` (порт 3000).
*   `npm run build` — Сборка React-приложения в папку `dist` с помощью Vite.
*   `npm run start` — Запуск Express сервера для раздачи собранного приложения в production.

