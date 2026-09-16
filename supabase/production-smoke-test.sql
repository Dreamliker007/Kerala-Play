-- Read-only smoke test after running the production SQL files.
-- Expected result: one row with all table counts and has_rpc = true.
select
  (select count(*) from public.kp_users) as users,
  (select count(*) from public.kp_follows) as follows,
  (select count(*) from public.kp_blocks) as blocks,
  (select count(*) from public.kp_messages) as messages,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'kp_replace_snapshot'
  ) as has_rpc;
