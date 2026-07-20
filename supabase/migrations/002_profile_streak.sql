-- Profile streak columns for cloud sync (optional but used by utils/streak.ts)
alter table public.profiles add column if not exists streak_current integer default 0;
alter table public.profiles add column if not exists streak_longest integer default 0;
alter table public.profiles add column if not exists streak_last_scan timestamptz;
alter table public.profiles add column if not exists streak_total_scans integer default 0;
