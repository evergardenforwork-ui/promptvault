# RULES.md — Coding Standards & Architecture Rules

> Обязателен к соблюдению при написании и ревью любого кода в проекте.

## Naming Conventions (Files & Code)

| Тип | Конвенция | Пример |
|---|---|---|
| React-компоненты | PascalCase | `PhotoCard.tsx`, `ImageCropper.tsx` |
| Утилиты/сервисы | camelCase | `api.ts`, `gemini.ts` |
| Переменные | camelCase | `promptsList`, `selectedCategory` |
| Константы | SCREAMING_SNAKE | `GEMINI_MODEL`, `DATA_DIR` |
| CSS-классы | Tailwind utilities (не придумывать свои) | — |
| JSON ключи данных | camelCase | `isPublic`, `promptOrigin`, `usageCount` |
| ID промптов | `prompt_<timestamp>_<random>` | `prompt_1234567890_abc123` |
| ID категорий | `cat_<timestamp>_<random>` | `cat_1234567890_abc123` |
| ID сообщений | `msg_<timestamp>_<random>` | `msg_1234567890_abc123` |

## SOLID Principles Application

- **S (Single Responsibility)**: `server.ts` — только API и раздача статики. Бизнес-логика (фильтры видимости промптов, права) в роутах, не в хелперах.
- **O (Open/Closed)**: Новые layout-типы добавляются через расширение `imageLayoutType` string и нового кейса в рендере — без изменения существующей логики.
- **I (Interface Segregation)**: Типы в `src/types.ts` разбиты на `Prompt`, `SubSection`, `Category`, `ChatMessage`, `AssistantConfig` — не один гигантский тип.
- **D (Dependency Inversion)**: Компоненты зависят от `api.ts` (абстракция), а не от `fetch` напрямую.

## DRY & KISS Guidelines

- **DRY**: Если логика `saveBase64Image` нужна в 3+ местах в `server.ts` — уже вынесена. Не дублировать.
- **DRY**: Если компонент копируется 3+ раз — выносить в `src/components/ui/`.
- **KISS**: Нет внешней state-библиотеки (Zustand, Redux). Весь domain state — `useState` в App.tsx. Повторяемая логика вынесена в `src/hooks/`. Не усложнять без явной необходимости.
- **KISS**: Нет react-router. Роутинг через `view` state — не менять на router без обсуждения.

## Code Structure & Organization Rules

- **Максимум файла**: ~300 строк. Если больше — сигнал к рефакторингу.
- **Бизнес-логика**: В `server.ts` (для backend). В `src/services/` (для frontend).
- **UI-логика**: В компонентах `src/sections/` и `src/components/`.
- **Типы**: Только в `src/types.ts` — не объявлять inline типы в компонентах для domain entities.
- **Новые API-роуты**: Только в `server.ts`, соблюдая паттерн `authenticate → readJson → writeJson`.
- **Изображения**: Всегда через `saveBase64Image()` в server.ts, никогда не хранить base64 в JSON.

## Validation Strategy

- **Backend**: Минимальная проверка наличия обязательных полей в роутах server.ts.
- **Frontend**: Проверка в форме перед отправкой (disabled кнопка если нет title/mainPrompt).
- **Типы**: TypeScript как первая линия защиты — `strict: true` в tsconfig.json.
- Нет библиотек валидации (zod, yup) — не добавлять без обсуждения.

## TypeScript Standards

- **strict mode**: включён (`tsconfig.json` → `"strict": true`).
- **`any` запрещён** в новом коде клиентской части. В `server.ts` допустим в ограниченных местах (readJson возвращает any — это ок).
- Предпочитать `interface` для объектов domain (`Prompt`, `Category`), `type` для union-типов (`'own' | 'web'`).
- Импорты: именованные импорты, не `import * as`.

## State Management Rules

- **Локальный state**: `useState` внутри компонента — для UI-состояния (открыт ли дропдаун, текущий слайдер).
- **Глобальный state**: `useState` в `App.tsx`, передаётся через props — для domain данных (prompts, categories, user).
- **Серверный state**: Нет react-query. После мутации (POST/PUT/DELETE) — refetch через `loadData()`.
- Не добавлять Context API или Zustand без явной необходимости.

## Error Handling & Security Practices

**Backend**:
- Все роуты обёрнуты в try/catch (особенно Gemini вызовы).
- Ответ об ошибке: `res.status(4xx|5xx).json({ message: "..." })`.
- Никогда не логировать `GEMINI_API_KEY` или пароли пользователей.
- Проверять права (userId vs user.uid) перед PUT/DELETE.

**Frontend**:
- Catch ошибок API → Toast уведомление пользователю.
- Никогда не показывать stack trace пользователю.
- Не хранить пароли в localStorage (хранится только uid-токен).

**Обязательно перед деплоем**:
- [ ] `GEMINI_API_KEY` задан в `.env` (не в коде)
- [ ] Нет `console.log` с чувствительными данными
- [ ] `npm run lint` проходит без ошибок
