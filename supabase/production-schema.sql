-- Kerala Play production backend schema
-- Server-only tables for the existing /api contract.
-- Run in the Supabase SQL editor for the production project.

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.kp_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 2 and 40),
  username citext not null unique check (username::text ~ '^(?=.*[A-Za-z])[A-Za-z0-9_]{3,24}$'),
  email citext unique,
  mobile text unique,
  password_hash text not null,
  password_salt text not null,
  district text not null check (district in (
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
    'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
    'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  )),
  gender text not null default 'male' check (gender in ('male', 'female', 'other')),
  bio text not null default '' check (char_length(bio) <= 180),
  points integer not null default 0 check (points >= 0),
  completed_tasks text[] not null default '{}',
  walk_meters double precision not null default 0 check (walk_meters >= 0),
  visited_landmarks text[] not null default '{}',
  game_day date,
  game_wins integer not null default 0 check (game_wins between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is null or email::text ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  check (mobile is null or mobile ~ '^\+?[0-9 ()-]{7,20}$')
);

create table if not exists public.kp_follows (
  from_id uuid not null references public.kp_users(id) on delete cascade,
  to_id uuid not null references public.kp_users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create index if not exists kp_follows_to_idx on public.kp_follows(to_id);
create index if not exists kp_follows_status_idx on public.kp_follows(status);

create table if not exists public.kp_blocks (
  from_id uuid not null references public.kp_users(id) on delete cascade,
  to_id uuid not null references public.kp_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create index if not exists kp_blocks_to_idx on public.kp_blocks(to_id);

create table if not exists public.kp_messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.kp_users(id) on delete cascade,
  to_id uuid not null references public.kp_users(id) on delete cascade,
  body text,
  audio_path text,
  audio_mime text,
  audio_duration real,
  created_at timestamptz not null default now(),
  check (from_id <> to_id),
  check ((body is not null) <> (audio_path is not null)),
  check (body is null or char_length(body) between 1 and 1000),
  check (audio_duration is null or (audio_duration > 0 and audio_duration <= 30))
);

create index if not exists kp_messages_pair_created_idx
  on public.kp_messages(from_id, to_id, created_at desc);
create index if not exists kp_messages_reverse_pair_created_idx
  on public.kp_messages(to_id, from_id, created_at desc);

create table if not exists public.kp_sessions (
  token_hash text primary key,
  user_id uuid not null references public.kp_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists kp_sessions_user_idx on public.kp_sessions(user_id);
create index if not exists kp_sessions_expiry_idx on public.kp_sessions(expires_at);

create table if not exists public.kp_password_resets (
  code_hash text primary key,
  user_id uuid not null references public.kp_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists kp_password_resets_expiry_idx on public.kp_password_resets(expires_at);

create or replace function public.kp_touch_updated_at()
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

drop trigger if exists kp_users_touch_updated_at on public.kp_users;
create trigger kp_users_touch_updated_at
before update on public.kp_users
for each row execute function public.kp_touch_updated_at();

drop trigger if exists kp_follows_touch_updated_at on public.kp_follows;
create trigger kp_follows_touch_updated_at
before update on public.kp_follows
for each row execute function public.kp_touch_updated_at();

create or replace function public.kp_cleanup_follows_after_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.kp_follows
  where (from_id = new.from_id and to_id = new.to_id)
     or (from_id = new.to_id and to_id = new.from_id);
  return new;
end;
$$;

drop trigger if exists kp_blocks_cleanup_follows on public.kp_blocks;
create trigger kp_blocks_cleanup_follows
after insert on public.kp_blocks
for each row execute function public.kp_cleanup_follows_after_block();

-- These tables are server-owned. Browser/mobile clients continue to use /api.
alter table public.kp_users enable row level security;
alter table public.kp_follows enable row level security;
alter table public.kp_blocks enable row level security;
alter table public.kp_messages enable row level security;
alter table public.kp_sessions enable row level security;
alter table public.kp_password_resets enable row level security;

revoke all on public.kp_users from anon, authenticated;
revoke all on public.kp_follows from anon, authenticated;
revoke all on public.kp_blocks from anon, authenticated;
revoke all on public.kp_messages from anon, authenticated;
revoke all on public.kp_sessions from anon, authenticated;
revoke all on public.kp_password_resets from anon, authenticated;

-- Voice-message files will live in a private Storage bucket created separately.
-- Recommended bucket name: kerala-play-voice

notify pgrst, 'reload schema';
