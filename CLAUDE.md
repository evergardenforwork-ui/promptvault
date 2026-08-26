# 🟣 CLAUDE.md — Instructions for Claude Code & Anthropic Agents

> This file is automatically read by Claude Code CLI upon session startup.
> **Last updated**: 2026-08-26
> **Main universal guide**: See [`AGENTS.md`](AGENTS.md) for full architecture and guidelines.

---

## ⚡ Quick Start & Commands

- **Start Dev Server**: `npm run dev` (Runs `tsx server.ts` at `http://localhost:3000`)
- **Typecheck**: `npm run lint` (`tsc --noEmit`)
- **Build Production**: `npm run build` (`vite build`)
- **Clean Dist**: `npm run clean` (`npx rimraf dist`)

---

## 🎯 First-Action Protocol for Claude

When asked to explore, inspect, or build features in this repo:
1. Read [`AGENTS.md`](AGENTS.md) — Universal system overview.
2. Read [`src/types.ts`](src/types.ts) — Single source of truth for all domain types.
3. Check [`Agent/plan/plan.md`](Agent/plan/plan.md) — Only read `[🔴 НУЖНО СДЕЛАТЬ]` tasks. DO NOT waste tokens on completed plans marked `[✅ ВЫПОЛНЕНО]`.
4. Domain documentation is in [`Agent/MD_files/`](Agent/MD_files/) (`ARCHITECTURE.md`, `SCHEMA.md`, `RULES.md`, `PRD.md`, `DESIGN.md`, `DATABASE.md`).
5. Local Agent Skills are in [`.agents/skills/`](.agents/skills/) (Check `.agents/skills/supabase/SKILL.md` before DB tasks).

---

## 🏛️ Architecture & Strict Rules

1. **Dual Backend**: `server.ts` (dev) and `api/index.ts` (Vercel serverless) MUST remain synchronized on all API endpoint changes.
2. **File Decomposition**: 1 component = 1 file. Keep components modular in `src/sections/<domain>/`. Keep files < 250 lines. Modals must be separated into `XxxModal.tsx`.
3. **Database**: Supabase PostgreSQL + Supabase Storage. All new table migrations are unified in `scripts/all_new_tables_migration.sql`.
4. **5 Modular Hubs**:
   - 📷 `src/sections/prompts/` & `src/sections/photo/` (Prompts)
   - 📦 `src/sections/skills/` (Skills Web IDE)
   - 🐙 `src/sections/git/` (Git Tools & AI Parser)
   - ⚡ `src/sections/commands/` (AI Commands & Workflows)
   - 🌐 `src/sections/bookmarks/` (Web Bookmarks Hub)
5. **No `any` in client code**: Keep strict TypeScript standards.
