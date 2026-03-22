-- ============================================================
-- Peptide Tracker — Supabase setup
-- Run this entire file in the Supabase SQL Editor (once).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  email            text,
  notification_time time,
  reminder_lead_min int default 15,
  created_at       timestamptz default now()
);

create table public.peptides (
  id                  uuid primary key default gen_random_uuid(),
  created_by_user_id  uuid references public.profiles(id) on delete set null,
  name                text not null,
  alias               text,
  description         text,
  typical_dose_mcg    numeric,
  typical_frequency   text,
  half_life_hours     numeric,
  is_default          boolean default false,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

create table public.protocols (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  notes        text,
  start_date   date,
  end_date     date,
  status       text default 'active' check (status in ('active','completed','paused')),
  is_public    boolean default false,
  shared_at    timestamptz,
  created_at   timestamptz default now()
);

create table public.protocol_peptides (
  id                 uuid primary key default gen_random_uuid(),
  protocol_id        uuid not null references public.protocols(id) on delete cascade,
  peptide_id         uuid not null references public.peptides(id),
  dose_mcg           numeric not null,
  frequency          text not null,
  notes              text,
  cycle_length_days  integer,
  scheduled_days     integer[],       -- JS getDay() values (0=Sun–6=Sat); NULL = every day
  scheduled_time     time,            -- UTC reminder time override; NULL = use profile default
  dose_phases        jsonb            -- [{start_week, end_week, dose_mcg}]; NULL = single fixed dose
);

create table public.vials (
  id                         uuid primary key default gen_random_uuid(),
  protocol_peptide_id        uuid not null references public.protocol_peptides(id) on delete cascade,
  vial_size_mg               numeric not null,
  bac_water_ml               numeric not null,
  concentration_mcg_per_unit numeric generated always as
                               ((vial_size_mg * 1000) / (bac_water_ml * 100)) stored,
  units_remaining            numeric,
  vendor_name                text,
  vendor_url                 text,
  reconstituted_at           date,
  expires_at                 date,
  is_active                  boolean default true,
  created_at                 timestamptz default now()
);

create table public.dose_logs (
  id                   uuid primary key default gen_random_uuid(),
  protocol_peptide_id  uuid not null references public.protocol_peptides(id) on delete cascade,
  vial_id              uuid references public.vials(id) on delete set null,
  administered_at      timestamptz not null default now(),
  dose_mcg             numeric not null,
  units_drawn          numeric,
  injection_site       text,
  notes                text,
  created_at           timestamptz default now()
);

create table public.body_metrics (
  id           uuid primary key default gen_random_uuid(),
  dose_log_id  uuid not null references public.dose_logs(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  weight_kg    numeric,
  body_fat_pct numeric,
  lean_mass_kg numeric,
  notes        text,
  created_at   timestamptz default now()
);

create table public.symptoms (
  id           uuid primary key default gen_random_uuid(),
  dose_log_id  uuid not null references public.dose_logs(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  symptom      text not null,
  severity     int check (severity between 1 and 10),
  notes        text,
  occurred_at  timestamptz default now()
);

create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  dose_log_id  uuid not null references public.dose_logs(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption      text,
  taken_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. TRIGGERS
-- ─────────────────────────────────────────────

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Decrement vial units on dose log insert
create or replace function public.decrement_vial_units()
returns trigger language plpgsql security definer as $$
begin
  if new.vial_id is not null and new.units_drawn is not null then
    update public.vials
    set units_remaining = units_remaining - new.units_drawn
    where id = new.vial_id;
  end if;
  return new;
end;
$$;

create trigger on_dose_log_inserted
  after insert on public.dose_logs
  for each row execute procedure public.decrement_vial_units();

-- ─────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table public.profiles enable row level security;
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table public.peptides enable row level security;
create policy "peptides: read default or own"
  on public.peptides for select
  using (is_default = true or auth.uid() = created_by_user_id);
create policy "peptides: insert own"
  on public.peptides for insert
  with check (auth.uid() = created_by_user_id);
create policy "peptides: update own"
  on public.peptides for update
  using (auth.uid() = created_by_user_id and is_default = false);
create policy "peptides: delete own non-default"
  on public.peptides for delete
  using (auth.uid() = created_by_user_id and is_default = false);

alter table public.protocols enable row level security;
create policy "protocols: own rows"
  on public.protocols for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.protocol_peptides enable row level security;
create policy "protocol_peptides: via own protocols"
  on public.protocol_peptides for all
  using (
    exists (
      select 1 from public.protocols p
      where p.id = protocol_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocols p
      where p.id = protocol_id and p.user_id = auth.uid()
    )
  );

alter table public.vials enable row level security;
create policy "vials: via own protocol_peptides"
  on public.vials for all
  using (
    exists (
      select 1 from public.protocol_peptides pp
      join public.protocols p on p.id = pp.protocol_id
      where pp.id = protocol_peptide_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocol_peptides pp
      join public.protocols p on p.id = pp.protocol_id
      where pp.id = protocol_peptide_id and p.user_id = auth.uid()
    )
  );

alter table public.dose_logs enable row level security;
create policy "dose_logs: via own protocol_peptides"
  on public.dose_logs for all
  using (
    exists (
      select 1 from public.protocol_peptides pp
      join public.protocols p on p.id = pp.protocol_id
      where pp.id = protocol_peptide_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocol_peptides pp
      join public.protocols p on p.id = pp.protocol_id
      where pp.id = protocol_peptide_id and p.user_id = auth.uid()
    )
  );

alter table public.body_metrics enable row level security;
create policy "body_metrics: own rows"
  on public.body_metrics for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.symptoms enable row level security;
create policy "symptoms: own rows"
  on public.symptoms for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.photos enable row level security;
create policy "photos: own rows"
  on public.photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. STORAGE POLICIES
-- NOTE: First create the bucket manually in the Supabase dashboard:
--   Storage → New bucket → name: "progress-photos" → Private
-- Then run these policies:
-- ─────────────────────────────────────────────

create policy "storage: users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: users can read own photos"
  on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────────
-- 5. SEED — default peptides
-- ─────────────────────────────────────────────

insert into public.peptides (name, alias, typical_dose_mcg, typical_frequency, half_life_hours, is_default) values
  ('BPC-157',     'BPC',        250,  'twice daily',     4,    true),
  ('TB-500',      'TB4',        2500, 'twice weekly',    168,  true),
  ('GHK-Cu',      'GHK',        500,  'daily',           4,    true),
  ('Ipamorelin',  'Ipa',        200,  'three times daily',2,   true),
  ('CJC-1295',    'CJC',        1000, 'twice weekly',    168,  true),
  ('Semaglutide', 'Sema',       500,  'weekly',          168,  true),
  ('Tirzepatide', 'Tirz',       5000, 'weekly',          120,  true),
  ('Sermorelin',  'Serm',       300,  'daily',           0.17, true),
  ('Tesamorelin', 'Tesa',       2000, 'daily',           0.13, true),
  ('PT-141',      'PT141',      1000, 'as needed',       2.5,  true);

-- ─────────────────────────────────────────────
-- 6. Migrations (run these if you already ran setup.sql before these columns existed)
-- ─────────────────────────────────────────────

/*
ALTER TABLE public.protocol_peptides
  ADD COLUMN IF NOT EXISTS cycle_length_days integer,
  ADD COLUMN IF NOT EXISTS scheduled_days    integer[],
  ADD COLUMN IF NOT EXISTS scheduled_time    time,
  ADD COLUMN IF NOT EXISTS dose_phases       jsonb;
*/

-- ─────────────────────────────────────────────
-- 7. pg_cron — email reminder job
-- Prerequisites:
--   1. Enable pg_cron extension in Supabase dashboard (Database → Extensions)
--   2. Enable pg_net extension (Database → Extensions)
--   3. Deploy the Edge Function: supabase functions deploy send-reminders
--   4. Set RESEND_API_KEY secret: supabase secrets set RESEND_API_KEY=<key>
--   5. Set APP_URL secret: supabase secrets set APP_URL=https://your-app.vercel.app
--   6. Replace <YOUR_PROJECT_REF> and <YOUR_SERVICE_ROLE_KEY> below, then uncomment and run.
-- ─────────────────────────────────────────────

/*
select cron.schedule(
  'dose-reminders',
  '* * * * *',  -- every minute; Edge Function filters by notification_time
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
*/
