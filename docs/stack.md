# Tech stack

---

## Stack overview

| Layer | Tool | Version |
|---|---|---|
| Frontend | React + TypeScript | Latest stable |
| Backend | Hono (TypeScript) | Latest stable |
| Shared types | TypeScript package | — |
| Database | Supabase (Postgres) | — |
| Auth | Supabase Auth | — |
| File storage | Supabase Storage | — |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway | — |
| Email / reminders | Resend | — |
| Scheduled jobs | Supabase pg_cron + Edge Functions | — |
| Mobile (future) | React Native + Expo | — |

---

## Rationale

### Why Hono (not FastAPI or Express)

TypeScript across the entire stack means types flow natively from backend to frontend without code generation. The `packages/types` workspace is imported directly by both `apps/web` and `apps/api` — no Pydantic-to-TypeScript conversion, no drift between layers.

Hono is lightweight, runs on edge runtimes (Cloudflare Workers, Vercel Edge), and deploys to Railway with zero configuration. It has first-class TypeScript support and an ergonomic routing API similar to Express but without the legacy baggage.

When React Native is added later, it imports the same types package — no additional tooling required.

### Why Supabase (not a separate auth service + raw Postgres)

Supabase bundles four things that would otherwise require separate services: managed Postgres, authentication (email + OAuth), file storage, and row-level security. RLS is the critical piece — Supabase Auth makes `auth.uid()` available inside Postgres policies, which means access control is enforced at the database layer, not just the API layer.

Supabase also provides a pg_cron scheduler and Edge Functions (Deno/TypeScript) for lightweight event-driven jobs — used here for dose reminder emails.

### Why Railway (not Render or Vercel for the API)

Railway has faster deployments, cleaner logs, and no cold starts on the paid tier (~$5/mo). For a solo developer, the DX improvement is worth the cost. Render is a valid alternative if cost is a concern.

### Why Vercel for the frontend

Best-in-class DX for React — preview URLs per branch, instant deploys, zero configuration for a Vite or Next.js project.

### Why Resend for email

Dead simple API, excellent deliverability, generous free tier (3,000 emails/month). No mail server to manage. Used only for dose reminder notifications.

### Mobile path

React Native with Expo is the natural evolution. Because the web app is written in React + TypeScript and business logic lives in `packages/types` and the Hono API, the mobile app shares the API client, all TypeScript types, and most non-visual logic. The transition is adaptation, not a rewrite.

---

## Monorepo structure

```
/
├── apps/
│   ├── web/                    # React + TypeScript (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── lib/            # Supabase client, API client
│   │   │   └── main.tsx
│   │   ├── .env.local
│   │   ├── .env.local.example
│   │   └── package.json
│   └── api/                    # Hono (TypeScript)
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── lib/            # Supabase admin client
│       │   └── index.ts
│       ├── .env
│       ├── .env.example
│       └── package.json
├── packages/
│   └── types/                  # Shared TypeScript interfaces
│       ├── src/
│       │   ├── index.ts
│       │   ├── protocol.ts
│       │   ├── dose.ts
│       │   ├── vial.ts
│       │   └── user.ts
│       └── package.json
├── pnpm-workspace.yaml
├── package.json                # Root: dev scripts, lint config
└── README.md
```

Use `pnpm` workspaces. The `packages/types` package should be referenced as `"@peptide/types": "workspace:*"` in both app `package.json` files.

---

## Frontend dependencies

```json
{
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "@supabase/supabase-js": "latest",
    "tailwindcss": "latest",
    "vaul": "latest",
    "recharts": "latest",
    "@peptide/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "latest",
    "vite": "latest",
    "@vitejs/plugin-react": "latest"
  }
}
```

**shadcn/ui** — install components individually as needed (Button, Input, Sheet, Select, DropdownMenu). Do not install the full library. Follow the shadcn CLI installation pattern.

---

## Backend dependencies

```json
{
  "dependencies": {
    "hono": "latest",
    "@supabase/supabase-js": "latest",
    "@peptide/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/node": "latest",
    "tsx": "latest"
  }
}
```

---

## Environment variables

### `apps/web/.env.local`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001
```

### `apps/api/.env`
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # only for admin operations (seeding default peptides)
PORT=3001
```

Never commit real values. Commit `.env.local.example` and `.env.example` with empty values.

---

## Authentication

Supabase Auth handles both email/password and Google OAuth. Configuration:

1. Enable Email provider in Supabase Auth dashboard
2. Enable Google provider — requires a Google Cloud OAuth app with the Supabase callback URL
3. The frontend uses `@supabase/supabase-js` `signInWithPassword` and `signInWithOAuth`
4. The frontend passes the Supabase JWT in the `Authorization: Bearer <token>` header on every API request
5. The Hono backend extracts and verifies the JWT using the Supabase client initialized with the anon key — this ensures RLS applies to all database queries
6. Never use the service role key in the frontend or for user-facing queries

---

## Supabase configuration

### RLS base policy pattern

Every user-owned table should have a policy like:

```sql
-- Enable RLS
ALTER TABLE dose_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rows
CREATE POLICY "users can access own dose_logs"
ON dose_logs
FOR ALL
USING (
  auth.uid() = (
    SELECT p.user_id
    FROM protocol_peptides pp
    JOIN protocols p ON p.id = pp.protocol_id
    WHERE pp.id = dose_logs.protocol_peptide_id
  )
);
```

### Photo storage

Create a Supabase Storage bucket named `progress-photos` with the following policy:

```sql
-- Users can upload to their own folder
CREATE POLICY "users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'progress-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own photos
CREATE POLICY "users can read own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'progress-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

Store photos at path: `{user_id}/{timestamp}_{filename}`.

### pg_cron reminder job

```sql
-- Run every 15 minutes to check for upcoming doses
SELECT cron.schedule(
  'dose-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := '{SUPABASE_EDGE_FUNCTION_URL}/send-reminders',
      headers := '{"Authorization": "Bearer {SERVICE_ROLE_KEY}"}'::jsonb
    )
  $$
);
```

The Edge Function queries for doses due within the user's reminder lead time and sends emails via Resend.

---

## Claude Code model guidance

- **Default model**: Sonnet 4.6 — use for all feature implementation, refactoring, and test writing
- **Switch to Opus 4.6** (`/model opus`) for: architectural decisions, RLS policy design, multi-file refactoring, debugging complex query logic, designing the community sharing system
- **Useful pattern**: `opusplan` — Opus plans the approach, Sonnet executes the code

---

## TypeScript configuration

All `tsconfig.json` files must have `"strict": true`. This is non-negotiable for a codebase maintained solo over time. Strict mode catches null/undefined bugs at compile time that would otherwise surface as runtime errors in production.

Root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```
