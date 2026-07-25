---
name: using-agent-skills
description: Discovers and routes to the right project skill. Use this whenever a session starts in a project, whenever the user asks to bootstrap/initialize a project, or whenever it's unclear which skill applies. This is the meta-skill that governs how agent-architecture-bootstrap and project-docs-bootstrap (and any future skill added to this collection) are discovered and invoked.
---

# Using Agent Skills

## Overview

Эта папка — коллекция project-bootstrap скиллов. Каждый инкапсулирует один тип
структуры, которую можно создать в проекте. Этот meta-skill — единственная точка
входа: он не выполняет работу сам, а решает, какой из остальных скиллов вызвать.

## Skill Discovery

```
Задача пришла
    │
    ├── Нужны роли/координатор/AGENTS.md для мультиагентной работы?
    │       → agent-architecture-bootstrap
    │
    ├── Нужны PRD / DESIGN / ARCHITECTURE / SCHEMA / RULES документы проекта?
    │       → project-docs-bootstrap
    │
    ├── Новый проект с нуля, нужно и то и другое?
    │       → сначала project-docs-bootstrap (даёт контекст),
    │         затем agent-architecture-bootstrap (агенты читают этот контекст)
    │
    └── Ни то ни другое явно не подходит?
            → не выдумывай — спроси пользователя коротко, что именно нужно
```

## Quick Reference

<!-- AUTO-GENERATED: не редактируй руками ниже этой строки, см. "Как поддерживать" -->
| Skill | Description |
|---|---|
| `agent-architecture-bootstrap` | Создаёт мультиагентную структуру для проекта — AGENTS.md, папку {AGENT_DIR}/agent/ с ролями (координатор + специалисты), {AGENT_DIR}/skills/, install.sh и конфиг-пример. Используй этот skill ВСЕГДА, когда пользователь просит создать агентов, настроить координатора и специалистов, сделать мультиагентную архитектуру, или явно упоминает AGENTS.md, "roles", "orchestrator", "coordinator" в контексте организации работы ИИ над проектом. НЕ используй для создания PRD/DESIGN/ARCHITECTURE/SCHEMA/RULES документации проекта — это делает skill project-docs-bootstrap. |
| `project-docs-bootstrap` | Создаёт или заполняет 5 базовых документов проекта — PRD.md, DESIGN.md, ARCHITECTURE.md, SCHEMA.md, RULES.md — из шаблонов в папке templates/. Используй этот skill ВСЕГДА, когда пользователь просит создать продуктовые требования, дизайн-систему, архитектуру системы, схему базы данных/API, coding standards, или явно упоминает PRD, DESIGN, ARCHITECTURE, SCHEMA, RULES, "инициализация проекта", "project scope", "MVP", "tech stack", "design tokens", "database schema", "SOLID/DRY/KISS". Также используй, когда агент/координатор в проекте должен свериться с этими файлами перед началом работы над задачей — прочитай их, а не создавай заново, если они уже существуют. НЕ используй для создания AGENTS.md, ролей агентов или координатора — это делает skill agent-architecture-bootstrap. |
<!-- END AUTO-GENERATED -->

## Core Operating Behaviors

Эти правила действуют всегда, вне зависимости от того, какой skill вызван:

1. **Не создавай заглушки.** Если для раздела не хватает информации — спроси
   пользователя, не выдумывай и не пиши "TODO".
2. **Не перезаписывай существующее.** Если файл (AGENTS.md, PRD.md и т.д.) уже
   существует — читай и дополняй точечно, не переписывай целиком без подтверждения.
3. **Scope discipline.** Трогай только то, что относится к вызванному skill'у.
   `agent-architecture-bootstrap` не лезет в PRD/DESIGN/ARCHITECTURE/SCHEMA/RULES
   и наоборот.
4. **Один skill = одна забота.** Если задача явно требует обоих — вызови оба
   последовательно (см. дерево выше), не пытайся впихнуть всё в один.

## Как поддерживать этот файл при добавлении новых скиллов

Когда в эту папку добавляется новый skill (новая подпапка с `SKILL.md`), таблицу
Quick Reference и дерево Skill Discovery выше нужно обновить. Делать это дёшево —
**не читая тела** остальных SKILL.md, только их YAML-шапку (`name` + `description`).

Есть скрипт именно для этого: `scripts/list-skills.sh`. Он сканирует все соседние
`SKILL.md` и печатает готовые строки таблицы.

### Вариант A — попросить Claude обновить вручную (проще всего)

Просто скажи в чате, находясь в контексте проекта со скиллами:

> "Обнови using-agent-skills — я добавил новый skill в папку"

ИИ (следуя этой самой инструкции) должен:
1. Выполнить `scripts/list-skills.sh` из папки `using-agent-skills/`
2. Взять из вывода строки для новых/изменившихся скиллов
3. Точечно обновить только таблицу между `<!-- AUTO-GENERATED -->` и
   `<!-- END AUTO-GENERATED -->` — остальной файл не трогать
4. Обновить дерево Skill Discovery, если у нового skill есть особые условия
   ветвления (когда он нужен, когда нет)
5. НЕ читать `SKILL.md` других скиллов целиком — только вывод скрипта

### Вариант B — если у CLI есть возможность запускать команды по расписанию/хуку

Можно повесить `scripts/list-skills.sh` на pre-commit хук репозитория, где лежат
скиллы, и просто фейлить коммит с подсказкой "обнови таблицу в using-agent-skills",
если вывод скрипта разошёлся с тем, что закоммичено в SKILL.md. Это опционально —
для соло-использования обычно достаточно варианта A.

### Почему не просто "прочитай все SKILL.md целиком и перепиши"

Потому что тела остальных скиллов (шаги, шаблоны, чеклисты) могут быть большими —
у `agent-architecture-bootstrap` тело за сотню строк. Загружать всё это только
чтобы вытащить один abzац description — трата контекста. Скрипт читает только
frontmatter, это в буквальном смысле на порядок дешевле.
