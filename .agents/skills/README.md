# Skills: using-agent-skills (мета) + agent-architecture-bootstrap + project-docs-bootstrap

Три skill'а для Claude Code (и совместимых CLI):

- **using-agent-skills** — мета-skill, точка входа. Сам ничего не создаёт, только
  решает, какой из остальных двух вызвать. Сюда же добавляй описание любых будущих
  скиллов — см. "Как поддерживать этот файл" внутри его SKILL.md.
- **agent-architecture-bootstrap** — создаёт AGENTS.md + роли агентов.
- **project-docs-bootstrap** — создаёт PRD/DESIGN/ARCHITECTURE/SCHEMA/RULES.

Все три не конфликтуют друг с другом — каждый явно знает, когда уступить дорогу
другому (см. секцию "Когда НЕ использовать" / "Skill Discovery" в каждом SKILL.md).

## Установка (Claude Code)

Положи все три папки в **user-level** директорию — тогда они будут видны автоматически
во ВСЕХ твоих проектах без единой правки в CLAUDE.md/AGENTS.md:

```bash
mkdir -p ~/.claude/skills
cp -r using-agent-skills ~/.claude/skills/
cp -r agent-architecture-bootstrap ~/.claude/skills/
cp -r project-docs-bootstrap ~/.claude/skills/
```

## Используешь не только Claude Code (Gemini CLI / Codex CLI / ChatGPT)?

Формат `SKILL.md` один и тот же везде — переносится 1:1, копированием папки.
Меняется только имя скрытой папки, которую сканирует конкретный инструмент:

| Инструмент | Глобально (все проекты) | Локально (только этот проект) |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `<project>/.claude/skills/` |
| Gemini CLI | `~/.gemini/skills/` | `<project>/.gemini/skills/` (или алиас `.agents/skills/`) |
| Codex CLI / ChatGPT | `~/.codex/skills/` | `<project>/.codex/skills/` |

Скрипт `list-skills.sh` определяет путь до `skills/` **относительно себя самого**
(не хардкодит `~/.claude/...`), поэтому та же самая папка `skills/`, скопированная
в `.gemini/skills/` или `.codex/skills/`, работает без единой правки.

## Локальный skill только в одном проекте (не глобальный)

Если не хочешь класть скиллы глобально — положи ту же структуру в
`<project>/.claude/skills/` (или `.gemini/`, `.codex/` — см. таблицу выше) вместо
`~/.claude/skills/`. Скрипт и обнаружение работают идентично: инструмент сканирует
локальную папку проекта так же, как глобальную, просто с более высоким приоритетом
(проектные скиллы перекрывают глобальные при совпадении имён).

## Добавляешь новый skill в коллекцию?

1. Создай папку `<новый-skill>/SKILL.md` рядом с остальными.
2. Попроси в чате: "обнови using-agent-skills — я добавил новый skill".
   Он сам прогонит `using-agent-skills/scripts/list-skills.sh` и точечно обновит
   свою таблицу — не читая тела остальных скиллов целиком.

Claude Code сканирует description обоих skill'ов при старте в любом проекте и
подгружает нужный (или оба сразу) по совпадению с текстом задачи — вручную
указывать "используй этот skill" не обязательно, но можно, если хочешь быть явным.

Если предпочитаешь ставить только для одного проекта — положи в
`<проект>/.claude/skills/` вместо `~/.claude/skills/`.

## Установка (другие CLI — opencode / Gemini CLI / Grok CLI и т.п.)

Автодискавери может отличаться. Если твой CLI не подхватывает skills из
user-level папки сам:

1. Положи папки туда же, куда CLI ищет скиллы (`.opencode/skills/`, `.gemini/skills/`
   и т.п. — см. документацию инструмента).
2. Добавь (не переписывай!) в AGENTS.md/CLAUDE.md проекта короткую секцию:

```markdown
## Available Skills
- agent-architecture-bootstrap — создание мультиагентной структуры (AGENTS.md + агенты)
- project-docs-bootstrap — создание PRD/DESIGN/ARCHITECTURE/SCHEMA/RULES документов
```

Оба skill'а сами умеют дописывать эту секцию при запуске — можно просто попросить
"инициализируй проект" и они это сделают за тебя.

## Как они делят ответственность

| | agent-architecture-bootstrap | project-docs-bootstrap |
|---|---|---|
| Создаёт | AGENTS.md, роли агентов, координатор | PRD/DESIGN/ARCHITECTURE/SCHEMA/RULES |
| Триггеры | "создай агентов", "координатор", "мультиагентная структура" | "PRD", "дизайн-система", "схема БД", "coding standards" |
| Не трогает | документацию проекта | роли и иерархию агентов |

Для нового проекта с нуля — сначала документы (дают контекст), потом агенты
(читают документы как источник истины).
