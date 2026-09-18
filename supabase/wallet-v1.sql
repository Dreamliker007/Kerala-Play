-- Kerala Play Wallet V1 migration
-- Run this once in Supabase SQL Editor on an existing production project,
-- then rerun production-persistence-rpc.sql and production-service-role-grants.sql.

alter table public.kp_users
  add column if not exists wallet_balance bigint not null default 500
  check (wallet_balance between 0 and 2000000000);

alter table public.kp_users
  add column if not exists economy_actions text[] not null default '{}';

create table if not exists public.kp_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.kp_users(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount bigint not null check (amount > 0 and amount <= 2000000000),
  balance_after bigint not null check (balance_after between 0 and 2000000000),
  kind text not null default 'other' check (char_length(kind) between 1 and 40),
  description text not null default '' check (char_length(description) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists kp_wallet_transactions_user_created_idx
  on public.kp_wallet_transactions(user_id, created_at desc);

alter table public.kp_wallet_transactions enable row level security;
revoke all on public.kp_wallet_transactions from anon, authenticated;
grant select, insert, update, delete on table public.kp_wallet_transactions to service_role;

notify pgrst, 'reload schema';
