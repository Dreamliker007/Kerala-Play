-- Kerala Play production persistence RPC
-- Run this after production-schema.sql.
-- It atomically replaces the durable game snapshot used by the transitional
-- single-instance production server.

create or replace function public.kp_replace_snapshot(payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'payload must be a JSON object';
  end if;

  insert into public.kp_users (
    id, first_name, username, email, mobile, password_hash, password_salt,
    district, gender, bio, points, completed_tasks, walk_meters,
    visited_landmarks, game_day, game_wins, created_at
  )
  select
    (item->>'id')::uuid,
    item->>'first_name',
    item->>'username',
    nullif(item->>'email', ''),
    nullif(item->>'mobile', ''),
    item->>'password_hash',
    item->>'password_salt',
    item->>'district',
    item->>'gender',
    coalesce(item->>'bio', ''),
    coalesce((item->>'points')::integer, 0),
    coalesce((
      select array_agg(task.value)
      from jsonb_array_elements_text(coalesce(item->'completed_tasks', '[]'::jsonb)) as task(value)
    ), '{}'::text[]),
    coalesce((item->>'walk_meters')::double precision, 0),
    coalesce((
      select array_agg(landmark.value)
      from jsonb_array_elements_text(coalesce(item->'visited_landmarks', '[]'::jsonb)) as landmark(value)
    ), '{}'::text[]),
    nullif(item->>'game_day', '')::date,
    coalesce((item->>'game_wins')::integer, 0),
    coalesce(nullif(item->>'created_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(payload->'users', '[]'::jsonb)) item
  on conflict (id) do update set
    first_name = excluded.first_name,
    username = excluded.username,
    email = excluded.email,
    mobile = excluded.mobile,
    password_hash = excluded.password_hash,
    password_salt = excluded.password_salt,
    district = excluded.district,
    gender = excluded.gender,
    bio = excluded.bio,
    points = excluded.points,
    completed_tasks = excluded.completed_tasks,
    walk_meters = excluded.walk_meters,
    visited_landmarks = excluded.visited_landmarks,
    game_day = excluded.game_day,
    game_wins = excluded.game_wins;

  -- Replace dependent collections inside this transaction so readers never
  -- observe a partially-written social/message snapshot. Supabase projects can
  -- enable safe-update checks, so use explicit WHERE predicates for full-table
  -- deletes rather than a bare DELETE statement.
  delete from public.kp_messages where true;
  delete from public.kp_blocks where true;
  delete from public.kp_follows where true;

  insert into public.kp_follows (from_id, to_id, status)
  select
    (item->>'from_id')::uuid,
    (item->>'to_id')::uuid,
    item->>'status'
  from jsonb_array_elements(coalesce(payload->'follows', '[]'::jsonb)) item;

  insert into public.kp_blocks (from_id, to_id)
  select
    (item->>'from_id')::uuid,
    (item->>'to_id')::uuid
  from jsonb_array_elements(coalesce(payload->'blocks', '[]'::jsonb)) item;

  insert into public.kp_messages (
    id, from_id, to_id, body, audio_path, audio_mime, audio_duration, created_at
  )
  select
    (item->>'id')::uuid,
    (item->>'from_id')::uuid,
    (item->>'to_id')::uuid,
    item->>'body',
    item->>'audio_path',
    item->>'audio_mime',
    nullif(item->>'audio_duration', '')::real,
    coalesce(nullif(item->>'created_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(payload->'messages', '[]'::jsonb)) item;

  -- Remove accounts no longer present in the authoritative snapshot.
  delete from public.kp_users existing
  where not exists (
    select 1
    from jsonb_array_elements(coalesce(payload->'users', '[]'::jsonb)) item
    where (item->>'id')::uuid = existing.id
  );
end;
$$;

revoke all on function public.kp_replace_snapshot(jsonb) from public;
revoke all on function public.kp_replace_snapshot(jsonb) from anon, authenticated;
grant execute on function public.kp_replace_snapshot(jsonb) to service_role;

notify pgrst, 'reload schema';