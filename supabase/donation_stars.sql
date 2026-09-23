create table public.donation_stars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  amount integer not null check (amount between 1 and 999999),
  project text not null check (project in (
    '读到世界 · 乡村阅读',
    '水往低处流 · 清洁饮水',
    '手上有光 · 女性生计'
  )),
  anonymous_label text not null default '匿名微光'
    check (char_length(anonymous_label) between 1 and 24),
  x numeric not null check (x between 0.18 and 0.86),
  y numeric not null check (y between 0.10 and 0.52),
  created_at timestamptz not null default now()
);

alter table public.donation_stars enable row level security;

revoke all on public.donation_stars from public;
grant select, insert on public.donation_stars to anon;

create policy "public can read shared donation stars"
on public.donation_stars for select to anon using (true);

create policy "public can insert valid simulated donation stars"
on public.donation_stars for insert to anon with check (true);

alter publication supabase_realtime add table public.donation_stars;
