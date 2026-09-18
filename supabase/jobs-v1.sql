-- Kerala Play Jobs V1 migration
-- Run once on an existing production database before deploying V51.

alter table public.kp_users
  add column if not exists job_state jsonb not null
  default '{"active":null,"cooldowns":{},"completed":{}}'::jsonb;

notify pgrst, 'reload schema';
