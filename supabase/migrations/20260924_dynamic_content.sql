-- Dynamic content migration. Run after the existing donation migration.
-- This file intentionally leaves the existing donation schema untouched.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '同行者'
    check (char_length(display_name) between 1 and 40),
  bio text not null default ''
    check (char_length(bio) <= 240),
  public_name boolean not null default false,
  role text not null default 'member'
    check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table public.project_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '同行者'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger project_updates_updated_at before update on public.project_updates
  for each row execute procedure public.set_updated_at();
create trigger site_stats_updated_at before update on public.site_stats
  for each row execute procedure public.set_updated_at();
create trigger ledger_entries_updated_at before update on public.ledger_entries
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_follows enable row level security;
alter table public.site_stats enable row level security;
alter table public.ledger_entries enable row level security;

revoke all on public.profiles, public.projects, public.project_updates,
  public.project_follows, public.site_stats, public.ledger_entries from public;
grant select on public.projects, public.project_updates, public.site_stats, public.ledger_entries to anon;
grant select on public.profiles, public.projects, public.project_updates,
  public.project_follows, public.site_stats, public.ledger_entries to authenticated;
grant update on public.profiles to authenticated;
grant insert, delete on public.project_follows to authenticated;
grant insert, update, delete on public.projects, public.project_updates,
  public.site_stats, public.ledger_entries to authenticated;

create policy "published projects are public"
  on public.projects for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "admins manage projects"
  on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "published updates are public"
  on public.project_updates for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "admins manage updates"
  on public.project_updates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "published stats are public"
  on public.site_stats for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "admins manage stats"
  on public.site_stats for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "published ledger is public"
  on public.ledger_entries for select to anon, authenticated
  using (published = true or public.is_admin());
create policy "admins manage ledger"
  on public.ledger_entries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "users read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "members update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid() and role = 'member')
  with check (id = auth.uid() and role = 'member');

create policy "users read own follows"
  on public.project_follows for select to authenticated
  using (user_id = auth.uid());
create policy "users create own follows"
  on public.project_follows for insert to authenticated
  with check (user_id = auth.uid());
create policy "users delete own follows"
  on public.project_follows for delete to authenticated
  using (user_id = auth.uid());

grant execute on function public.is_admin() to anon, authenticated;
