-- Optional cleanup for projects that already ran the earlier account migration.
-- Run this once in Supabase SQL Editor after the public-content migration.
drop trigger if exists on_auth_user_created on auth.users;
drop policy if exists "admins manage projects" on public.projects;
drop policy if exists "admins manage updates" on public.project_updates;
drop policy if exists "admins manage stats" on public.site_stats;
drop policy if exists "admins manage ledger" on public.ledger_entries;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "members update own profile" on public.profiles;
drop policy if exists "users read own follows" on public.project_follows;
drop policy if exists "users create own follows" on public.project_follows;
drop policy if exists "users delete own follows" on public.project_follows;
revoke insert, update, delete on public.projects, public.project_updates,
  public.site_stats, public.ledger_entries from authenticated;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
drop table if exists public.project_follows;
drop table if exists public.profiles;
