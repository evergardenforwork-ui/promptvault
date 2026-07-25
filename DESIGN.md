# DESIGN.md — Design System

> Цель этого файла — не дать ИИ скатиться в шаблонный "AI slop" дизайн. Любой
> сгенерированный UI должен соответствовать токенам и правилам ниже, а не
> дефолтным паттернам фреймворка.

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
| `--color-primary` | фиолетово-синий (~#6366f1) | Кнопки, акценты, активные состояния |
| `--color-bg` | тёмно-серый (~#0f0f13) | Основной фон |
| `--color-surface` | (~#1a1a24) | Карточки, сайдбар, модалки |
| `--color-text` | светло-серый (~#e2e8f0) | Основной текст |
| `--color-text-muted` | (~#94a3b8) | Вторичный текст, плейсхолдеры |
| `--color-border` | (~#2d2d3f) | Разделители, рамки |
| `--color-danger` | (~#ef4444) | Ошибки, удаление |
| `--color-success` | (~#22c55e) | Успешные операции |

> ⚠️ Фактические значения — смотри в `src/index.css` в `@theme { }` блоке.

## Theme Variants (Light/Dark + Custom)

Проект **только тёмная тема**. Светлой темы нет, переключатель не предусмотрен.

## Typography Scale & Font Stack

- **Основной шрифт**: системный стек (Inter если подключён, иначе system-ui)
- **Заголовки** (`h1-h3`): `font-bold`, `tracking-tight`
- **Тело**: `text-sm` / `text-base`, `leading-relaxed`
- **Код/промпты**: `font-mono`, `text-sm`, фон отдельной поверхности

> Если добавляешь Google Fonts — используй Inter или Outfit.

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

## Product Tour & Interaction Patterns

- **Слайдер ДО/ПОСЛЕ**: drag-interaction, вертикальная линия-разделитель
- **Кроппер**: drag to pan + slider для zoom (100-300%)
- **Хештеги на карточках**: кликабельны → фильтрация ленты
- **Категории**: горизонтальная прокручиваемая панель вверху
