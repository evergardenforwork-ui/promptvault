# RULES.md — Coding Standards & Architecture Rules

> Обязателен к соблюдению при написании и ревью любого кода в проекте.
> **Последнее обновление**: 2026-08-23

## Naming Conventions (Files & Code)

| Тип | Конвенция | Пример |
|---|---|---|
| React-компоненты | PascalCase | `PhotoCard.tsx`, `SkillSpaceView.tsx`, `ConfirmDialog.tsx` |
| Утилиты/сервисы | camelCase | `api.ts`, `gemini.ts`, `buildSelectionZip.ts` |
| Переменные | camelCase | `promptsList`, `selectedCategory`, `sourceFilter` |
| Константы | SCREAMING_SNAKE | `GEMINI_MODEL`, `SKILL_TYPE_OPTIONS`, `TARGET_AI_OPTIONS` |
| CSS-классы | Tailwind utilities (не придумывать свои) | — |
| JSON ключи данных | camelCase | `isPublic`, `promptOrigin`, `usageCount`, `skillTypes` |
| ID в Supabase | UUID / TEXT | UUID v4 (Postgres `gen_random_uuid()`) |

## SOLID Principles Application

- **S (Single Responsibility)**: `server.ts` (dev) и `api/index.ts` (prod) — API-интерфейсы и адаптеры. Бизнес-логика разделена по сервисам и хукам.
- **O (Open/Closed)**: Новые layout-типы добавляются через расширение `imageLayoutType` string и нового кейса в рендере.
- **I (Interface Segregation)**: Типы в `src/types.ts` строго разделены на `User`, `Prompt`, `SkillPackage`, `SkillHint`, `GitProject`, `Category`, `ChatMessage`, `SourceFilter`, `GitProjectCategory`, `GitProjectPricing`.
- **D (Dependency Inversion)**: Компоненты зависят от `src/services/api.ts` (абстракция), а не от прямого `fetch`.

## DRY & KISS Guidelines

- **DRY**: API роуты добавляются ОДНОВРЕМЕННО в `server.ts` И `api/index.ts`.
- **DRY**: Если диалог или модалка повторяется — использовать `src/components/ui/` (например, `ConfirmDialog.tsx` вместо `window.confirm()`).
- **KISS**: Нет внешней state-библиотеки (Zustand, Redux). Весь domain state — `useState` в App.tsx. Фильтры вынесены в `src/hooks/`.
- **KISS**: Нет react-router. Роутинг через state `viewingPrompt`, `spacedSkill`, `activeSection`.

## Code Structure & Organization Rules

- **Бизнес-логика**: В `server.ts` и `api/index.ts` (backend). В `src/services/` (frontend).
- **UI-логика**: В компонентах `src/sections/` и `src/components/`.
- **Типы**: Только в `src/types.ts` — единый источник правды для типизации.
- **Изображения**: Загружать в Supabase Storage бакет `prompt-images`. Никаких локальных файлов.

---

## ⚠️ File Decomposition Rules — ОБЯЗАТЕЛЬНО

> **Главное правило**: **ОДИН компонент = ОДИН файл**. Не складывай модалки, тулбары, панели и независимые блоки в один файл вместе с основным компонентом.

### ❌ ЗАПРЕЩЕНО:
```
GitProjectForm.tsx   ← форма + AI-модалка + загрузка файла = 30KB  ← НАРУШЕНИЕ
PhotoView.tsx        ← просмотр + чат + анализ + ИИ = 50KB         ← НАРУШЕНИЕ
```

### ✅ ПРАВИЛЬНО:
```
GitProjectForm.tsx          ← только форма (~16KB)
AiSmartParserModal.tsx      ← только AI-модалка (~8KB)

PhotoView.tsx               ← только оркестрация
view/AIAssistant.tsx        ← изолированный ИИ-блок
view/CollapsibleText.tsx    ← изолированный текстовый блок
```

### Пороги: когда выносить?
| Признак | Действие |
|---|---|
| Файл > **~250 строк** или > **~15KB** | Обязательно разбить |
| Внутри компонента есть `<AnimatePresence>` с отдельным state | Вынести в `XxxModal.tsx` |
| Логика фильтрации / поиска > 30 строк | Вынести в `src/hooks/useXxx.ts` |
| UI-блок встречается в 2+ местах | Вынести в `src/components/ui/Xxx.tsx` |

### Файлы-исключения (разрешено держать "большими"):
| Файл | Причина исключения |
|---|---|
| `server.ts` | Backend API + Vite интеграция — единый dev-процесс |
| `api/index.ts` | Зеркало `server.ts` для Vercel — должны быть идентичны |
| `App.tsx` | Центральный state-контейнер. Только state + prop drilling + навигация — НЕ рендер UI |

> 💡 Паттерн новой секции: `Section.tsx` → `Card.tsx` → `Form.tsx` + `[XxxModal.tsx]` → `View.tsx`

## Validation Strategy

- **Backend**: Проверка наличия обязательных полей в роутах `server.ts` и `api/index.ts`.
- **Frontend**: Проверка в форме перед отправкой (disabled кнопка если нет title/mainPrompt).
- **Типы**: TypeScript `strict: true` в tsconfig.json.

## TypeScript Standards

- **strict mode**: включён (`tsconfig.json` → `"strict": true`).
- **`any` запрещён** в новом коде клиентской части.
- Предпочитать `interface` для domain-сущностей, `type` для union-типов (`SourceFilter`, `MediaType`).
- Импорты: именованные импорты, не `import * as`.

## State Management Rules

- **Локальный state**: `useState` внутри компонента — для UI-состояния.
- **Глобальный state**: `useState` в `App.tsx`, передаётся через props.
- Серверный state: После мутации (POST/PUT/DELETE) — refetch через `loadData()`.

## AI Assistant & Gemini Status
> **Gemini parse-tool** (`/api/gemini/parse-tool`) — ✅ **АКТИВЕН**. Модель `gemini-3.1-flash-lite`. Используется для AI Smart Parser в разделе Git Hub.
> **Gemini chat/analyze** (`/api/gemini/chat`, `/api/gemini/analyze`) — ⏸️ **Временно отключены**. Файл `AIAssistant.tsx` существует, но НЕ импортируется в PhotoView.tsx. Не модифицировать без явного запроса.

## Error Handling & Security Practices

**Backend**:
- Все роуты обёрнуты в try/catch.
- Ответ об ошибке: `res.status(4xx|5xx).json({ message: "..." })`.
- Никогда не логировать и не отдавать клиенту `SUPABASE_SERVICE_ROLE_KEY` или `GEMINI_API_KEY`.
- Проверять права (`userId` vs `user.uid`) перед PUT/DELETE.

**Frontend**:
- Catch ошибок API → Toast-уведомление пользователю.
- Не хранить пароли в localStorage (хранится только `pv_token` и `pv_user`).

**Обязательно перед деплоем / коммитом**:
- [ ] `npm run lint` проходит с 0 ошибок.
- [ ] Переменные окружения согласованы в `.env` и `.env.example`.