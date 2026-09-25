-- Optional cleanup for projects that already ran the earlier account migration.
-- Run this once in Supabase SQL Editor after the public-content migration.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
drop table if exists public.project_follows;
drop table if exists public.profiles;
