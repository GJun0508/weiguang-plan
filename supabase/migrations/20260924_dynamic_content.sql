-- Public dynamic content migration. Run after the existing donation migration.
-- This migration intentionally leaves the donation schema untouched.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 80),
  subtitle text not null default '',
  location text not null default '',
  category text not null default '',
  summary text not null default '',
  description text not null default '',
  cover_image text not null default '',
  status text not null default '进行中',
  progress integer not null default 0 check (progress between 0 and 100),
  beneficiaries text not null default '',
  start_date date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  content text not null default '',
  cover_image text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_stats (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value numeric not null default 0 check (value >= 0),
  label text not null,
  as_of_date date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  entry_type text not null check (entry_type in ('income', 'expense')),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  amount numeric(12, 2) not null check (amount >= 0),
  occurred_at date not null default current_date,
  evidence_url text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger project_updates_updated_at before update on public.project_updates
  for each row execute procedure public.set_updated_at();
create trigger site_stats_updated_at before update on public.site_stats
  for each row execute procedure public.set_updated_at();
create trigger ledger_entries_updated_at before update on public.ledger_entries
  for each row execute procedure public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.site_stats enable row level security;
alter table public.ledger_entries enable row level security;

revoke all on public.projects, public.project_updates, public.site_stats, public.ledger_entries from public;
grant select on public.projects, public.project_updates, public.site_stats, public.ledger_entries to anon, authenticated;

create policy "published projects are public"
  on public.projects for select to anon, authenticated
  using (published = true);
create policy "published updates are public"
  on public.project_updates for select to anon, authenticated
  using (published = true);
create policy "published stats are public"
  on public.site_stats for select to anon, authenticated
  using (published = true);
create policy "published ledger is public"
  on public.ledger_entries for select to anon, authenticated
  using (published = true);
