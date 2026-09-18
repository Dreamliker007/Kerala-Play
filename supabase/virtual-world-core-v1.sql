-- Kerala Play Virtual World Core V1 migration
-- Run this once in the Supabase SQL Editor on an existing production database.
-- It is backward compatible with the current production backend.

create table if not exists public.kp_world_state (
  user_id uuid primary key references public.kp_users(id) on delete cascade,
  x double precision not null check (x between -110.01 and 110.01),
  z double precision not null check (z between -110.01 and 110.01),
  rotation double precision not null default 0 check (rotation between -100000 and 100000),
  updated_at timestamptz not null default now()
);


alter table public.kp_world_state enable row level security;
revoke all on table public.kp_world_state from anon, authenticated;
grant select, insert, update, delete on table public.kp_world_state to service_role;


create or replace function public.kp_replace_world_state(payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(payload) is distinct from 'array' then
    raise exception 'payload must be a JSON array';
  end if;

  insert into public.kp_world_state (user_id, x, z, rotation, updated_at)
  select
    (item->>'user_id')::uuid,
    (item->>'x')::double precision,
    (item->>'z')::double precision,
    coalesce((item->>'rotation')::double precision, 0),
    coalesce(nullif(item->>'updated_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(payload, '[]'::jsonb)) item
  on conflict (user_id) do update set
    x = excluded.x,
    z = excluded.z,
    rotation = excluded.rotation,
    updated_at = excluded.updated_at;

  delete from public.kp_world_state existing
  where not exists (
    select 1
    from jsonb_array_elements(coalesce(payload, '[]'::jsonb)) item
    where (item->>'user_id')::uuid = existing.user_id
  );
end;
$$;

revoke all on function public.kp_replace_world_state(jsonb) from public;
revoke all on function public.kp_replace_world_state(jsonb) from anon, authenticated;
grant execute on function public.kp_replace_world_state(jsonb) to service_role;

notify pgrst, 'reload schema';
