-- Alpine E-Bike Fleet Tracker — Supabase schema.
--
-- Run this in the Supabase project's SQL editor (Database -> SQL Editor)
-- after creating a new project. This is the prototype/bench-testing shape:
-- one bike unit's worth of columns, one geofence per site. It is NOT the
-- event-sourced backend described in docs/project-brief.md — that's a
-- later, deliberate step once the data model needs to handle concurrent
-- out-of-order device reports at fleet scale.

create table if not exists devices (
  id text primary key,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id bigint generated always as identity primary key,
  device_id text not null references devices(id) on delete cascade,
  reported_at timestamptz not null,
  lat double precision not null,
  lon double precision not null,
  inside_geofence boolean not null,
  locked boolean not null,
  satellites integer,
  battery integer,
  created_at timestamptz not null default now()
);

create index if not exists reports_device_id_reported_at_idx
  on reports (device_id, reported_at desc);

create table if not exists geofences (
  id text primary key,
  name text not null,
  -- Array of [lat, lon] pairs, same shape the firmware and dashboard use —
  -- see firmware/bike-unit/src/geofence.cpp and web/dashboard/src/lib/geofence.ts.
  polygon jsonb not null,
  updated_at timestamptz not null default now()
);

alter table devices enable row level security;
alter table reports enable row level security;
alter table geofences enable row level security;

-- PROTOTYPE-ONLY policies: the anon key can read/write everything. Fine for
-- a private bench project nobody else has the URL to; replace with real
-- auth-scoped policies (e.g. device API keys for inserts, operator auth for
-- the dashboard) before any GDPR-relevant pilot with real riders' location
-- data — see the Compliance section of docs/project-brief.md.
-- (drop-then-create makes this whole script safe to re-run as it evolves)
drop policy if exists "anon full access" on devices;
create policy "anon full access" on devices for all using (true) with check (true);
drop policy if exists "anon full access" on reports;
create policy "anon full access" on reports for all using (true) with check (true);
drop policy if exists "anon full access" on geofences;
create policy "anon full access" on geofences for all using (true) with check (true);

-- Lets the dashboard subscribe to new reports and geofence edits in real time.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table reports;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'geofences'
  ) then
    alter publication supabase_realtime add table geofences;
  end if;
end $$;

-- `default now()` on updated_at only fires on INSERT, not UPDATE — the
-- geofence editor's upsert was silently leaving it stuck at creation time.
-- A trigger is the fix that holds regardless of which client writes the row
-- (dashboard upsert, SQL editor, anything added later).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists geofences_set_updated_at on geofences;
create trigger geofences_set_updated_at
  before update on geofences
  for each row
  execute function set_updated_at();

-- Seed the bench device. The firmware's device_id (DEVICE_ID in
-- firmware/bike-unit/include/secrets.h) must have a matching row here —
-- reports.device_id is a foreign key, so an unregistered device's inserts
-- fail outright. Add one row per real bike unit as you bring them online.
insert into devices (id, name) values ('bike-001', 'Bike 001 (bench prototype)')
  on conflict (id) do nothing;

-- Seed the placeholder Sestriere / Via Lattea polygon so the dashboard has
-- something to show immediately. Replace with real surveyed coordinates
-- via the geofence editor before relying on this for anything but a demo.
insert into geofences (id, name, polygon) values (
  'sestriere-via-lattea',
  'Sestriere / Via Lattea',
  '[[44.965,6.865],[44.968,6.885],[44.960,6.900],[44.945,6.895],[44.940,6.870],[44.950,6.860]]'
) on conflict (id) do nothing;
