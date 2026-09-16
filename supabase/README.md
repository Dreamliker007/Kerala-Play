# Kerala Play Supabase production setup

For a new production project, run these SQL files in order:

1. `production-schema.sql`
2. `production-persistence-rpc.sql`
3. `production-service-role-grants.sql`

The first file creates server-owned `kp_*` tables. The second creates the transactional snapshot RPC used by `production-server.mjs`. The third grants direct table/RPC access only to the trusted Supabase `service_role`, while browser/mobile `anon` and `authenticated` roles remain blocked from the server-owned tables.

Never expose the Supabase service-role key to the website or Android app. It belongs only in backend-host environment variables.
