# Kerala Play

Kerala Play is a static Three.js game client backed by Supabase.

## Current structure

- `index.html` — main 3D world, game UI, email/password authentication, account profile, local tasks, XP, follows, and chat demos
- `ludo.html` — realtime Ludo prototype
- `schema.sql` — Supabase tables and row-level security policies
- `supabase-config.js` — browser-safe Supabase project URL and publishable key
- `style.css` / `script.js` — earlier landing-page assets retained for reference

## Account setup

1. Run `schema.sql` in the Supabase SQL Editor.
2. Ensure the Email provider is enabled under Supabase Authentication.
3. Open `index.html`, create an account, and save a Kerala profile.

Authentication credentials stay in Supabase Auth. The `profiles` table stores only the authenticated user's display name, district, and avatar selection. Row-level security lets users change only their own profile.
