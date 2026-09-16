# Kerala Play Supabase production setup

For a new production project, run these SQL files in order:

1. `production-schema.sql`
2. `production-persistence-rpc.sql`

The first file creates server-owned `kp_*` tables. The second creates the transactional snapshot RPC used by `production-server.mjs`.

Never expose the Supabase service-role key to the website or Android app. It belongs only in backend-host environment variables.
