# DESIGN.md — Design System

> Цель этого файла — не дать ИИ скатиться в шаблонный "AI slop" дизайн. Любой
> сгенерированный UI должен соответствовать токенам и правилам ниже, а не
> дефолтным паттернам фреймворка.
> **Последнее обновление**: 2026-08-23

## Brand Identity & Art Direction

**Характер бренда**: Минималистичный, тёмный, профессиональный, технологичный, визуально богатый.

**Референсы**: Notion, Linear, Midjourney UI — тёмный фон, чёткая типографика, акценты цветом.

**Чего избегать**:
- Светлые фоны (проект тёмный по умолчанию)
- Яркие "попугайские" цвета (plain red/green/blue)
- Bootstrap-style компоненты
- Лишние бордеры везде

## Color Palette & Semantic Tokens

> Tailwind CSS v4 — токены задаются через `@theme` в `src/index.css`. Синтаксис: `--color-*`.

| Токен | Примерное значение | Использование |
|---|---|---|
| `--color-primary` | голубой/фиолетовый (sky-400, purple-500 accents) | Кнопки, акценты, активные состояния |
| `--color-bg` | тёмно-серый (~#0f0f13) | Основной фон |
| `--color-surface` | (~#1a1a24) | Карточки, сайдбар, модалки |
| `--color-text` | светло-серый (~#e2e8f0) | Основной текст |
| `--color-text-muted` | (~#94a3b8) | Вторичный текст, плейсхолдеры |
| `--color-border` | (~#2d2d3f) | Разделители, рамки |
| `--color-danger` | (~#ef4444) | Ошибки, удаление |
| `--color-success` | (~#22c55e) | Успешные операции |

### 🎨 Цветовые акценты разделов (Hub Color Coding):
| Раздел | Акцентный цвет | Tailwind класс |
|---|---|---|
| 📷 **Промпты** | Небесно-голубой | `sky-400` / `sky-500` |
| 📦 **Skills & AI** | Фиолетовый | `purple-500` / `purple-600` |
| 🐙 **Git Hub & Tools** | Изумрудный | `emerald-500` / `emerald-600` |
| ⚡ **Команды & Сниппеты** | Янтарный / Золотой | `amber-500` / `amber-400` |
| 🌐 **Закладки & Сайты** | Бирюзовый / Циан | `cyan-400` / `cyan-500` |
| 👥 **Пользователи** | Тёмно-фиолетовый | `violet-500` |

> ⚠️ Фактические значения — смотри в `src/index.css` в `@theme { }` блоке.

## Theme Variants (Light/Dark + Custom)

Проект поддерживает **полноценный двухтемный режим** с мгновенным переключением и автосохранением в `localStorage` (`pv_theme`):

1. 🌑 **Dark Theme (ThoughtLab Obsidian)** — см. [`Dark_design.md`](../../Dark_design.md):
   - Чистый монохромный чёрный холст `#000000` (`--color-canvas`).
   - Контрастный текст `#ffffff` (дисплей) и `#cccccc` (тело).
   - Графитовые границы `#27272a` (`--color-hairline`).
   - Акцентные действия: Crimson Signal `#fc1c46` + фирменные цвета 5 хабов.

2. ☀️ **Light Theme (shadcn Frosted Paper)** — см. [`light_design.md`](../../light_design.md):
   - Мягкий бумажный холст `#f5f5f5` (`--color-canvas`).
   - Белоснежные карточки `#ffffff` (`--color-paper`).
   - Глубокий чернильный текст `#0a0a0a` (`--color-ink`) и мягкий `#737373` (`--color-mid-gray`).
   - Тонкие границы `#e5e5e5` (`--color-hairline`).

Управление темами: хук [`src/hooks/useTheme.ts`](../../src/hooks/useTheme.ts) + тумблер ☀️ / 🌙 в Header.

## Typography Scale & Font Stack

- **Основной шрифт**: `Inter`, geometric sans
- **Заголовки** (`h1-h3`): `Syne`, `font-bold`, `tracking-tight`
- **Код/промпты**: `JetBrains Mono`, `font-mono`, `text-sm`
- **Тело**: `text-sm` / `text-base`, `leading-relaxed`

## Spacing, Grid & Layout System

- **Базовая единица**: 4px (Tailwind: `p-1` = 4px)
- **Сетка карточек**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Сайдбар**: фиксированная ширина ~280px (слева)
- **Контент**: `max-w-7xl`, центрированный, с отступами `px-4 md:px-8`
- **Модалки**: `max-w-2xl` или `max-w-4xl` для форм с изображениями

## Border Radius & Elevation

| Компонент | Radius |
|---|---|
| Карточки промптов | `rounded-xl` (12px) |
| Кнопки | `rounded-lg` (8px) |
| Аватары/бейджи | `rounded-full` |
| Модалки | `rounded-2xl` (16px) |
| Инпуты | `rounded-lg` (8px) |

**Z-index слои**:
- `z-10` — Dropdown меню
- `z-50` — Модалки, кроппер
- `z-[100]` — Toast уведомления

## Shadows & Animations

**Тени**:
- Карточки: `shadow-lg` + `shadow-black/20`
- Модалки: `shadow-2xl` + `shadow-black/50`
- Нет теней на текстовых элементах

**Анимации** (`motion` library):
- Появление карточек: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
- Модалки: `initial={{ scale: 0.95, opacity: 0 }}`, `animate={{ scale: 1, opacity: 1 }}`
- Duration: `0.2s` (быстрые) — `0.4s` (переходы страниц)
- Easing: `ease-out` по умолчанию

## Accessibility Guidelines

- Контраст текста на фоне ≥ 4.5:1 (WCAG AA)
- Focus state: `focus:ring-2 focus:ring-primary` — обязателен на всех интерактивных элементах
- Кнопки-иконки должны иметь `aria-label`
- Модалки должны закрываться по `Escape`

## Component Style Rules

**Кнопки**:
- Primary: `bg-primary text-white hover:bg-primary/90`
- Secondary: `bg-surface border border-border hover:bg-surface/80`
- Danger: `bg-danger/10 text-danger hover:bg-danger/20`
- Все кнопки: `transition-colors duration-200`

**Карточки промптов**:
- Фон: `bg-surface`
- Hover: лёгкое поднятие (`hover:-translate-y-1 hover:shadow-xl`)
- Изображение: фиксированная высота, `object-cover`
- Бейджи происхождения: абсолютно позиционированы поверх изображения

**Инпуты/Textarea**:
- `bg-surface border border-border focus:border-primary`
- Placeholder: `text-text-muted`

**Toast уведомления**:
- Появляются снизу-справа, `z-[100]`
- `success` (зелёный), `error` (красный), `info` (нейтральный)

**Skill Space View (Пакеты скиллов)**:
- **Layout**: Полноэкранный fixed IDE лейаут (`h-screen max-h-screen overflow-hidden flex flex-col`), исключающий скролл всей страницы окна.
- **Шапка**: Заголовок с `truncate` и бейджами, сворачиваемое описание (`line-clamp-1` с кнопкой «Подробнее / Свернуть»), экшн-кнопки в один ряд (`flex-nowrap`).
- **SpaceFileTree**: Стилизация под VS Code дерево файлов. Тонкие отступы, иконки папок/файлов, выделение активного файла, чекбоксы для выделения.
- **SpaceFilePreview**: Область просмотра Markdown/кода с breadcrumb-навигацией, подсветкой синтаксиса и встроенным inline-редактором (Ctrl+S / Escape).
- **SpaceContextMenu**: Glassmorphism меню (`bg-surface/80 backdrop-blur-md border border-border/50`) по клику правой кнопкой мыши.
- **SpaceSelectionBar**: Плавающая панель снизу для выбранных файлов с подсчётом размера и генерацией ZIP.
- **SkillHintsPanel**: Выдвижная панель подсказок-промптов к скиллу с быстрым копированием в 1 клик.

**Админ-панель (UsersSection)**:
- Табличный или списочный вид с чётким разделением ролей (admin/user).
- Кнопки управления (смена пароля, удаление) с подтверждением через ConfirmDialog (Danger action).

## Product Tour & Interaction Patterns

- **Слайдер ДО/ПОСЛЕ**: drag-interaction, вертикальная линия-разделитель
- **Кроппер**: drag to pan + slider для zoom (100-300%)
- **Табы источников (Ownership)**: «Все (+ чужие)», «Все мои», «Мои (Авторские)», «Мои (Из сети)», «Чужие (Публичные)» со счётчиками
- **Хештеги на карточках**: кликабельны → фильтрация ленты
- **Категории**: горизонтальная прокручиваемая панель вверху