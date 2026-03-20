# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Scaffold, auth, and Home screen are implemented. Supabase SQL is ready to run (`supabase/setup.sql`). Env vars need to be filled in before the app can run against a real database.

## Monorepo Structure

```
/
├── apps/
│   ├── web/          # React + TypeScript + Vite frontend (Vercel)
│   └── api/          # Hono TypeScript backend (Railway)
├── packages/
│   └── types/        # Shared TypeScript interfaces (imported by both apps)
├── docs/             # Spec documents (features, schema, stack, ux)
├── supabase/
│   └── setup.sql     # Run once in Supabase SQL editor
├── pnpm-workspace.yaml
└── README.md
```

Package manager: **pnpm** with workspaces.

## Commands

```bash
pnpm install              # Install all workspace deps

# Development
pnpm --filter web dev     # Frontend at localhost:5173
pnpm --filter api dev     # Backend at localhost:3001

# Build
pnpm --filter web build
pnpm --filter api build

# Typecheck
pnpm typecheck
```

## Architecture

### Data Flow
- **`packages/types`** defines all shared TypeScript interfaces. Both `apps/web` and `apps/api` import from `@peptide/types` — never duplicate type definitions.
- **Frontend** calls the Hono API for mutations/reminders; calls Supabase directly for reads and photo uploads.
- **Photos** upload directly to Supabase Storage from the browser — never proxied through the backend.
- **JWT auth**: Supabase Auth issues JWTs; frontend sends `Authorization: Bearer <token>` on every API request; backend verifies via Supabase admin client.

### Backend (`apps/api`)
Hono app with route files per resource (`protocols`, `peptides`, `doses`, `vials`, `photos`), a JWT auth middleware, and a Supabase admin client in `lib/supabase.ts`.

### Frontend (`apps/web`)
React + Vite SPA. Five bottom-tab screens: Home, History, Calculator, Photos, Settings. Key patterns:
- `lib/supabase.ts` — Supabase client (anon key)
- `lib/api.ts` — typed fetch wrapper for the Hono API
- Protocol Builder is a **single component with local step state** (no separate routes per step)
- Log Dose is a **vaul bottom sheet**, not a page

### Database (Supabase Postgres)
See `docs/schema.md` for full table definitions and RLS policies. Key rules:
- **RLS on every user-owned table** using `auth.uid()` — enforced at DB layer, not just API layer
- `peptides` table has mixed access: all users read `is_default=true` rows; users CRUD their own custom peptides
- Dose logs, body metrics, symptoms, and photos are **always private**, even for public protocols
- `vials.concentration_mcg_per_unit` is a **generated column** — never written directly
- Email reminders use **pg_cron + Supabase Edge Functions + Resend**

## Key Design Decisions

- **TypeScript everywhere** with `"strict": true` in all `tsconfig.json` files — non-negotiable
- **Teal accent** `#1D9E75` — used only for interactive/active states (not decorative)
- **Mobile-first** at 375px, max content width 480px; respect `env(safe-area-inset-*)` for iOS
- **shadcn/ui** components installed individually as needed (not bulk-imported)
- **Recharts** for the 7-day trend bar chart; **vaul** for bottom sheets; **Lucide React** for icons (20px stroke)
- Calculator screen is **pure client-side**: `concentration = (vial_mg × 1000) ÷ (bac_ml × 100)`

## Environment Variables

`apps/web/.env.local`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001
```

`apps/api/.env`:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
```

## Model Usage

- Use **Sonnet 4.6** for implementation tasks
- Switch to **Opus 4.6** (`claude-opus-4-6`) for: architectural decisions, RLS policy design, multi-file refactoring, community system design

## Spec Documents

| File | Purpose |
|------|---------|
| `docs/features.md` | Screen-by-screen feature specs and user flows |
| `docs/schema.md` | Full DB schema with RLS policies |
| `docs/stack.md` | Technology choices and rationale |
| `docs/ux.md` | Visual design system, component patterns, Tailwind config |
