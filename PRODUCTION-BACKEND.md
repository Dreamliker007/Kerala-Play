# Kerala Play production backend

This branch starts the migration from the local `.data/game.json` backend to a production database without changing the public `/api` contract used by the website and Android app.

## Why this migration is needed

The current Node server stores accounts, follows, blocks, messages, points and progress in `.data/game.json`. Sessions, presence, reset codes and live connections are in memory. That is useful for local testing but is not suitable for a 24/7 public app because restarts can invalidate sessions/live state and a single JSON file is not appropriate for concurrent production traffic.

The existing `schema.sql` contains an earlier Supabase-oriented profile/follow/Ludo schema. It does not fully match the current server model: the current API has pending/accepted follow requests, first name, email/mobile login, password hashes, bio, points, completed tasks, walking progress, landmark progress, daily game wins, server sessions and direct messages including voice. The production migration therefore uses separate `kp_*` server-owned tables so the current prototype schema is not destructively changed.

## First production slice

1. Run `supabase/production-schema.sql` in the production Supabase project.
2. Create a private Supabase Storage bucket named `kerala-play-voice` for voice-message files.
3. Add server-side environment variables only on the backend host:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `COOKIE_SECURE=1`
   - `PUBLIC_ORIGIN=https://<production-host>`
   - `RESEND_API_KEY` and `EMAIL_FROM` when password-reset email is enabled
4. Do **not** put the service-role key in browser JavaScript, Capacitor config, GitHub, or the Android package.
5. The next code slice will add a database adapter to `server.mjs`: Supabase/Postgres in production and the existing JSON store as a local-test fallback. This preserves the client API while accounts/social data become durable.

## Data ownership

The mobile/web client should continue to call `/api/...`. The backend owns user credentials, sessions, social writes, points/rewards and message authorization. Browser/mobile clients must never have direct write access to the `kp_*` tables.

## Realtime/live state

Durable account/social/message data moves to PostgreSQL. High-frequency avatar presence and WebRTC signalling can remain ephemeral in the Node process for the first production release. For multi-instance scaling later, move presence/signalling to Redis or a dedicated realtime service and add a TURN service for reliable walkie-talkie connections.

## Voice messages

The production schema stores `audio_path`, MIME type and duration. The backend should upload voice blobs to the private `kerala-play-voice` bucket and return short-lived signed URLs to authorized conversation participants instead of storing base64 audio inside database rows.

## Deployment target

Use a Node-compatible HTTPS host that supports long-lived HTTP connections / Server-Sent Events. The backend must listen on `process.env.PORT` and sit behind HTTPS. The Android production build should use that HTTPS origin rather than a LAN IP.
