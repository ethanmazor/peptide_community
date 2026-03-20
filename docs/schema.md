# Database schema

Supabase (Postgres). All tables use `uuid` primary keys. RLS is enabled on every table except `peptides` (which has a mixed public/private model described below).

---

## Tables

### `users`
Managed by Supabase Auth. The `users` table in the `auth` schema is extended by a `profiles` table in the `public` schema for app-specific data.

```sql
profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     text,
  email            text,
  notification_time time,          -- preferred time of day for dose reminders
  reminder_lead_min int DEFAULT 15, -- minutes before dose to send reminder
  created_at       timestamptz DEFAULT now()
)
```

RLS: users can only read and write their own row (`auth.uid() = id`).

---

### `peptides`
The peptide library. Contains both default peptides (seeded by the app) and user-created custom entries.

```sql
peptides (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name                text NOT NULL,
  alias               text,                  -- common shorthand e.g. "BPC"
  description         text,
  typical_dose_mcg    numeric,
  typical_frequency   text,                  -- e.g. "twice daily", "every 3 days"
  half_life_hours     numeric,
  is_default          boolean DEFAULT false, -- true = seeded by app, readable by all
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
)
```

RLS:
- All users can read rows where `is_default = true`
- Users can read, insert, update their own rows (`auth.uid() = created_by_user_id`)
- No user can delete default peptides

---

### `protocols`
A named cycle or stack that a user is running. Contains one or more peptides via `protocol_peptides`.

```sql
protocols (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  notes        text,
  start_date   date,
  end_date     date,
  status       text DEFAULT 'active', -- 'active' | 'completed' | 'paused'
  is_public    boolean DEFAULT false, -- community sharing flag (Phase 2)
  shared_at    timestamptz,           -- when it was made public (Phase 2)
  created_at   timestamptz DEFAULT now()
)
```

RLS:
- Users can CRUD their own rows (`auth.uid() = user_id`)
- Phase 2: rows where `is_public = true` are readable by all authenticated users
- `dose_logs`, `body_metrics`, `symptoms`, and `photos` are NEVER exposed through public protocol queries — they remain private always

---

### `protocol_peptides`
Join table between a protocol and a peptide. Holds the per-peptide dosing instructions for that protocol. This is the central entity — vials and dose logs hang off this, not off `peptides` or `protocols` directly.

```sql
protocol_peptides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id  uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  peptide_id   uuid NOT NULL REFERENCES peptides(id),
  dose_mcg     numeric NOT NULL,
  frequency    text NOT NULL,   -- e.g. "twice daily", "every 3 days"
  notes        text
)
```

RLS: inherited from `protocols` — users can only access rows belonging to their own protocols.

---

### `vials`
Tracks a single physical vial for a given `protocol_peptide`. One active vial at a time per peptide.

```sql
vials (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_peptide_id      uuid NOT NULL REFERENCES protocol_peptides(id) ON DELETE CASCADE,
  vial_size_mg             numeric NOT NULL,         -- e.g. 5 for a 5mg vial
  bac_water_ml             numeric NOT NULL,         -- mL of BAC water added
  concentration_mcg_per_unit numeric GENERATED ALWAYS AS
                             ((vial_size_mg * 1000) / (bac_water_ml * 100)) STORED,
  units_remaining          numeric,                  -- decrements on each dose log
  vendor_name              text,                     -- e.g. "Peptide Sciences"
  vendor_url               text,                     -- optional reference link
  reconstituted_at         date,
  expires_at               date,                     -- typically 30-90 days after recon
  is_active                boolean DEFAULT true,
  created_at               timestamptz DEFAULT now()
)
```

RLS: users can only access vials belonging to their own protocol peptides.

Note: `concentration_mcg_per_unit` is a generated column. Formula assumes a standard 100-unit insulin syringe: `(vial_size_mg × 1000 mcg) ÷ (bac_water_ml × 100 units/mL)`.

---

### `dose_logs`
A single logged administration event.

```sql
dose_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_peptide_id  uuid NOT NULL REFERENCES protocol_peptides(id) ON DELETE CASCADE,
  vial_id              uuid REFERENCES vials(id) ON DELETE SET NULL,
  administered_at      timestamptz NOT NULL DEFAULT now(),
  dose_mcg             numeric NOT NULL,
  units_drawn          numeric,
  injection_site       text,   -- e.g. "left abdomen", "right thigh"
  notes                text,
  created_at           timestamptz DEFAULT now()
)
```

RLS: users can only access their own dose logs.

On insert: trigger should decrement `vials.units_remaining` by `units_drawn`.

---

### `body_metrics`
Body composition data logged alongside a dose. One row per dose log entry.

```sql
body_metrics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_log_id  uuid NOT NULL REFERENCES dose_logs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg    numeric,
  body_fat_pct numeric,
  lean_mass_kg numeric,  -- can be computed client-side: weight × (1 - bf/100)
  notes        text,
  created_at   timestamptz DEFAULT now()
)
```

RLS: users can only access their own metrics (`auth.uid() = user_id`).

---

### `symptoms`
Side effects or observations logged alongside a dose.

```sql
symptoms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_log_id  uuid NOT NULL REFERENCES dose_logs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symptom      text NOT NULL,
  severity     int CHECK (severity BETWEEN 1 AND 10),
  notes        text,
  occurred_at  timestamptz DEFAULT now()
)
```

RLS: users can only access their own symptoms.

---

### `photos`
Progress photos attached to a dose log.

```sql
photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dose_log_id  uuid NOT NULL REFERENCES dose_logs(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,  -- Supabase Storage path, not a full URL
  caption      text,
  taken_at     timestamptz DEFAULT now()
)
```

RLS: users can only access their own photos.

Storage: photos are uploaded directly from the frontend to Supabase Storage (bucket: `progress-photos`). The backend returns a signed upload URL; the frontend uploads directly and then saves the resulting `storage_path` via the API. Never route file uploads through the Hono backend.

---

## Phase 2 tables (do not build in MVP — schema only for planning)

### `friendships`
```sql
friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at   timestamptz DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
)
```

### `vendors`
When vendor tracking matures from free-text on `vials` into a normalised table:
```sql
vendors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  url         text,
  created_by  uuid REFERENCES profiles(id),
  is_verified boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)
```

---

## RLS summary

| Table              | Read                        | Write                        |
|--------------------|-----------------------------|------------------------------|
| profiles           | Own row only                | Own row only                 |
| peptides           | Own + all `is_default` rows | Own rows only                |
| protocols          | Own rows (+ public Phase 2) | Own rows only                |
| protocol_peptides  | Own protocols only          | Own protocols only           |
| vials              | Own protocols only          | Own protocols only           |
| dose_logs          | Own rows only               | Own rows only                |
| body_metrics       | Own rows only               | Own rows only                |
| symptoms           | Own rows only               | Own rows only                |
| photos             | Own rows only               | Own rows only                |

All policies use `auth.uid()` — the Hono backend must pass the user's JWT to Supabase (not the service key) so RLS applies to all queries automatically.
