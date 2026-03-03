-- Add new columns to PROFILES table
alter table public.profiles add column if not exists age_range text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists skin_goals text[];
alter table public.profiles add column if not exists skin_type text;
