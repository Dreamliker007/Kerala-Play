# Kerala Play production backend

This branch migrates the local `.data/game.json` backend toward a production Supabase database without changing the public `/api` contract used by the website and Android app.

## Why this migration is needed

The local Node server stores accounts, follows, blocks, messages, points and progress in `.data/game.json`. Sessions, presence, reset codes and live connections are in memory. That is useful for local testing but not enough for a 24/7 public app.

The older `schema.sql` does not fully match the current server model, so the production migration uses separate server-owned `kp_*` tables. Browser and Android clients continue to call `/api/...`; they never receive the Supabase service-role key.

## Database setup

Run these files in the Supabase SQL Editor, in this order:

1. `supabase/production-schema.sql`
2. `supabase/production-persistence-rpc.sql`

The second file creates the server-only transactional function used to persist a complete durable snapshot.

## First production persistence slice

`production-server.mjs` is the production entry point. On startup it:

1. Loads the durable account/social/message/progress snapshot from Supabase.
2. Writes that snapshot to a private local runtime cache.
3. Starts the existing `server.mjs` API against that cache, preserving current behavior.
4. Mirrors cache changes back to Supabase through `kp_replace_snapshot`.
5. Flushes the final snapshot to Supabase during a normal shutdown.

This is intentionally a transitional **single backend instance** design. Supabase is the durable source across restarts, while the JSON file is only a runtime compatibility cache. A later slice should replace snapshot mirroring with row-level database operations before horizontal/multi-instance scaling.

## Server environment variables

Set these only on the backend host:

- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<server-only secret>`
- `COOKIE_SECURE=1`
- `PORT` is normally supplied by the hosting provider
- `RESEND_API_KEY` and `EMAIL_FROM` when password-reset email is enabled
- optional `KP_SYNC_INTERVAL_MS=1000`

Never put `SUPABASE_SERVICE_ROLE_KEY` in browser JavaScript, `supabase-config.js`, Capacitor config, GitHub, screenshots, chat messages, or the Android package.

Run production with:

```powershell
npm run start:production
```

Local development and the existing automated API tests continue to use:

```powershell
npm start
npm test
```

## Data ownership and security

The backend owns password hashes, social writes, points/rewards and message authorization. The `kp_*` tables have RLS enabled and direct `anon` / `authenticated` access revoked. Only the production server uses the service-role credential.

Sessions and live presence remain in process for this slice, so users may need to sign in again after a backend restart. Moving sessions to `kp_sessions` is a later migration step.

## Messages and voice

Text and the current small base64 voice messages are preserved by the compatibility adapter. Voice rows use an `inline-base64:` compatibility value in `audio_path` for now. Before a public-scale release, migrate voice payloads to a private Supabase Storage bucket such as `kerala-play-voice` and serve short-lived signed URLs only to authorized conversation participants.

## Deployment target

Use a Node-compatible HTTPS host that supports long-lived HTTP connections / Server-Sent Events. The backend must listen on `process.env.PORT` and sit behind HTTPS. The Android production build should use that HTTPS origin instead of a LAN IP such as `172.x.x.x:3000`.

Do not use multiple production backend replicas with this snapshot adapter. Presence, sessions and snapshot writes are single-instance until the next database migration slices are complete.
