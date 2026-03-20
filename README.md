# Peptide tracker — project spec

A personal peptide tracking and dosing app built for solo use with a clear path to community scaling. Users can manage protocols (single peptides or stacks), log doses, track body metrics, and monitor vial inventory. Eventually, users will be able to share protocols and connect with others.

## Spec documents

- [`schema.md`](./schema.md) — database tables, fields, relationships, RLS policies
- [`features.md`](./features.md) — screen-by-screen feature specs and user flows
- [`stack.md`](./stack.md) — technology decisions, rationale, and Claude Code configuration instructions
- [`ux.md`](./ux.md) — visual direction, component patterns, navigation, UI instructions

## Project structure

Use a monorepo with pnpm workspaces:

```
/
├── apps/
│   ├── web/          # React + TypeScript frontend
│   └── api/          # Hono TypeScript backend
├── packages/
│   └── types/        # Shared TypeScript interfaces (imported by both apps)
├── pnpm-workspace.yaml
└── README.md
```

## Key principles

- **RLS from day one** — every user-owned table has Supabase row-level security enabled before any feature is built
- **Types flow one direction** — all shared interfaces live in `packages/types`, never duplicated
- **Mobile-first** — the web app is designed at 480px max-width; React Native (Expo) is the future mobile target
- **One language** — TypeScript everywhere (frontend, backend, shared types) for native type sharing and minimal tooling overhead
- **Privacy by default** — users own their data; community features are opt-in with explicit sharing controls

## MVP scope

Phase 1 (personal use): auth, peptide library, protocol builder, vial setup, dose logging, reconstitution calculator, history, photos, email reminders.

Phase 2 (community): friends system, protocol sharing, vendor reviews, anonymized aggregate data.
