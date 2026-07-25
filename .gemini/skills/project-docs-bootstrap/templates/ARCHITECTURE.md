# ARCHITECTURE.md — System Architecture

> Высокоуровневая карта системы. Перед любым структурным изменением кода
> ИИ должен свериться с этим файлом, чтобы не нарушить существующие паттерны.

## System Overview & High-Level Diagram
[Текстовое или mermaid-описание системы целиком: клиент → API → БД → внешние сервисы]

## Layered Architecture & Conventions
[Слои приложения: presentation/domain/infrastructure и т.п. — что где живёт]

## Directory & Domain Structure
```
[дерево ключевых папок с кратким пояснением каждой]
```

## Middleware & Request Pipeline
[Что происходит с запросом от входа до ответа: auth, validation, logging и т.д.]

## Client-Side Architecture
[State management, роутинг, паттерны компонентов — если есть фронтенд]

## Data Layer & Database Strategy
[ORM/query builder, миграции, кэширование, где источник истины]

## Authentication Flow
[Как работает auth: сессии/JWT/OAuth, где хранятся токены, refresh-логика]

## Key Data Flows & Sequence Diagrams
[2-3 главных сценария использования как последовательность шагов]

## Domain Logic Highlights
[Нетривиальная бизнес-логика, которую легко сломать не зная контекста]

## Cross-Cutting Concerns
- **Error Handling**: [единый паттерн обработки ошибок]
- **Validation**: [где и чем валидируются данные]
- **Security**: [что обязательно проверять — CORS, rate limiting, sanitization]
- **Performance**: [известные узкие места, бюджеты производительности]
