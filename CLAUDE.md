# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Migrated from React + Vite + Capacitor web to **Expo (React Native)** — mobile-only. Supabase SQL is ready to run (`supabase/setup.sql`). Env vars need to be filled in before the app can run against a real database.

## Monorepo Structure

```
/
├── apps/
│   ├── mobile/       # Expo + React Native + Expo Router (iOS/Android)
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
pnpm mobile               # Start Expo (Metro) bundler
pnpm api                  # Backend at localhost:3001

# Build
pnpm --filter api build

# Typecheck
pnpm typecheck
```

## Architecture

### Data Flow
- **`packages/types`** defines all shared TypeScript interfaces. Both `apps/mobile` and `apps/api` import from `@peptide/types` — never duplicate type definitions.
- **Mobile** calls the Hono API for mutations/reminders; calls Supabase directly for reads and photo uploads.
- **Photos** upload directly to Supabase Storage from the device using `expo-image-picker` → blob → Supabase client — never proxied through the backend.
- **JWT auth**: Supabase Auth issues JWTs (persisted via `@react-native-async-storage/async-storage`); mobile sends `Authorization: Bearer <token>` on every API request; backend verifies via Supabase admin client.

### Backend (`apps/api`)
Hono app with route files per resource (`protocols`, `peptides`, `doses`, `vials`, `photos`), a JWT auth middleware, and a Supabase admin client in `lib/supabase.ts`.

### Mobile (`apps/mobile`)
Expo SDK 52 + **Expo Router 4** (file-based routing). Route groups: `(auth)` for login/callback, `(app)` for the authenticated shell, `(app)/(tabs)` for the 5-tab navigator (Home, Progress, Calculator, Peptides, Settings). Key patterns:
- `lib/supabase.ts` — Supabase client with AsyncStorage session persistence + `react-native-url-polyfill`
- `lib/api.ts` — typed fetch wrapper for the Hono API (reads `process.env.EXPO_PUBLIC_API_URL`)
- `lib/colors.ts` — design tokens (teal `#1D9E75`, bg/text/border scales)
- Protocol Builder is a **shared component with local step state** (`components/ProtocolBuilder.tsx`) mounted at `/protocols/new` and `/protocols/[id]/edit`
- Log Dose is a **@gorhom/bottom-sheet**, not a screen
- Tailwind classes via **NativeWind v4** (`tailwind.config.ts` exposes `bg-bg-*`, `text-txt-*`, `border-bdr-*`, `bg-teal`)
- Charts via **victory-native**; icons via **lucide-react-native**; photo picker via **expo-image-picker**

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
- **Mobile-only** — drop web entirely; target iOS/Android via Expo
- Calculator screen is **pure client-side**: `concentration = (vial_mg × 1000) ÷ (bac_ml × 100)`

## Environment Variables

`apps/mobile/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3001
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
| `docs/superpowers/plans/2026-04-13-expo-migration.md` | Expo migration plan |
