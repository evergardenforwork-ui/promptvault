#!/bin/bash
# Печатает name + description (только frontmatter, не тело!) каждого SKILL.md,
# лежащего рядом с using-agent-skills, кроме него самого.
# Дёшево по токенам: не читает тела других скиллов, только YAML-шапку.
#
# Путь считается ОТНОСИТЕЛЬНО самого скрипта — не хардкодится ~/.claude/...
# Поэтому работает одинаково, где бы ни лежала папка skills/:
#   ~/.claude/skills/            (Claude Code, глобально)
#   <project>/.claude/skills/    (Claude Code, только этот проект)
#   ~/.gemini/skills/  или  <project>/.gemini/skills/   (Gemini CLI)
#   ~/.codex/skills/   или  <project>/.codex/skills/    (Codex CLI / ChatGPT)
# Формат SKILL.md один и тот же везде — меняется только имя папки инструмента.
#
# Использование (из любой такой папки):
#   ./using-agent-skills/scripts/list-skills.sh
set -e

SKILLS_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

for skill_md in "$SKILLS_DIR"/*/SKILL.md; do
  [ -f "$skill_md" ] || continue
  dir_name=$(basename "$(dirname "$skill_md")")
  [ "$dir_name" = "using-agent-skills" ] && continue

  # Берём только содержимое между первыми двумя строками "---" (frontmatter),
  # чтобы случайно не зацепить слово "description" где-то в теле файла.
  frontmatter=$(awk '/^---$/{c++; next} c==1' "$skill_md")

  name=$(printf '%s\n' "$frontmatter" | sed -n 's/^name: *//p' | head -1)
  desc=$(printf '%s\n' "$frontmatter" | sed -n 's/^description: *//p' | head -1)

  echo "| \`$name\` | $desc |"
done
