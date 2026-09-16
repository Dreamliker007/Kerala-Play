-- Kerala Play production backend service-role grants
-- Run after production-schema.sql and production-persistence-rpc.sql.
-- The kp_* tables are intentionally inaccessible to anon/authenticated clients;
-- only the trusted backend service role receives direct table access.

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.kp_users to service_role;
grant select, insert, update, delete on table public.kp_follows to service_role;
grant select, insert, update, delete on table public.kp_blocks to service_role;
grant select, insert, update, delete on table public.kp_messages to service_role;
grant select, insert, update, delete on table public.kp_sessions to service_role;
grant select, insert, update, delete on table public.kp_password_resets to service_role;

grant execute on function public.kp_replace_snapshot(jsonb) to service_role;

notify pgrst, 'reload schema';
