# Kerala Play Full Script Backup — Part 4: Documentation & Legal Pages

## README.md

```markdown
# Kerala Play

A Kerala village game with accounts, accepted follows, private messages, shared avatars and server-owned rewards.

## Run

Install Node.js 20 or later, open a terminal in this folder, and run:

```powershell
npm start
```

Open **http://localhost:3000**. No npm install or cloud account is required. Three.js 0.160.1 and its license are included in `vendor/`.

Create a username (3–24 letters, numbers or underscores) and a password of at least 8 characters. Each new account starts at **0 points, level 1**. Account data is stored in `.data/`; preserve that folder when updating the game. Old browser-only demo profiles are not accounts and are not imported.

Use separate browsers or browser profiles to test two people. Tabs in the same browser share the login cookie. Both players must connect to the same running server.

## Play

- Move with WASD, arrow keys or the left joystick. Hold Shift or RUN to run. Drag the right side to look around.
- Select a username or click an avatar to open its profile. Village guides have an NPC profile; real players have follow and messaging controls.
- In People, send a follow request. The recipient must accept before either person can send private messages. Blocking removes the connection and prevents messages and voice.
- Complete exploration tasks for one-time points. Coconut Memory gives 20 points for repeating a pattern, with a maximum of five wins per day. Each round can be submitted only once.
- The sky runs through a shared 24-minute day, evening and night. Enable Sound for synthesized birds, water, night ambience and music. Quality controls adjust resolution and shadows.

## Voice and multiplayer

Private voice messages use microphone recording, with a 30-second limit. Walkie-talkie uses WebRTC with an explicit listening control and push-to-talk. The browser asks for microphone permission when you use these controls.

Microphones require localhost or HTTPS. For access from other devices, host the application behind an HTTPS reverse proxy. This repository runs a single Node process with file persistence; it does not include public hosting, HTTPS certificates, a TURN relay, email recovery or large-scale infrastructure. Some networks require a TURN server for WebRTC audio to connect.

The server authenticates requests, hashes passwords with a separate salt, validates movement and task eligibility, enforces follow/block restrictions, and limits request rates. Client-side games are still inspectable; this is not a competitive anti-cheat system. Rewards have no monetary value.

## Visual scope

The included male/female avatars, vehicles, Kerala-style houses, coconut palms and landscape are procedural 3D models. Lighting, movement animation, nameplates, batched palm leaves and graphics quality settings are implemented. Photorealistic rigged characters and scanned environment assets are not included; production-quality realism remains an asset-production step.

## Verify

```powershell
npm test
```

The API integration suite covers account/session rules, accepted follows and blocks, private message permissions, rewards, persistence and protected files. Real microphones and two-device WebRTC audio should also be checked on the intended deployment network.

```

---

## README-assets.md

```markdown
# Visuals and audio

The current village uses locally generated Three.js geometry: male/female avatars, coconut palms, buildings, roads, vehicles, birds, water, and landmarks. Avatar walking is a procedural limb animation. Ground detail is a generated canvas texture. There are no external photo assets and no glTF/GLB model loader in this version.

`environment.js` adds a shared 24-minute day, dawn, evening, and night cycle based on the device's UTC clock. Devices with correctly set clocks see the same phase. Its sky uses changing colors, distance fog, a sun and moon, and instanced clouds and stars on Balanced/High graphics. Low graphics omits clouds and stars. High adds directional shadows near the camera; daylight and moonlight keep the world readable on every setting. These are stylized procedural visuals, not photorealistic assets.

Sound is generated with Web Audio only after the player enables it: daytime bird calls, night insects, nearby water, wind, and gentle musical patterns that change during movement, running, and a challenge. It pauses while the tab is hidden. Only sound and graphics preferences are stored by this module. Recorded messages and live voice are separate features.

## Completing the realistic asset phase

The project still needs authored and licensed realistic models, textures, and animation clips. A future asset integration should include:

| Asset | Expected content |
| --- | --- |
| Male and female avatars | Rigged GLB characters with matching Idle, Walk, and Run clips; consistent scale and forward direction |
| Vehicles | Kerala-appropriate car, bus, and auto-rickshaw models with separate wheels |
| Environment | Houses, coconut palms, roadside props, and landmarks with low-detail variants |
| Materials and sky | Optimized PBR texture sets and a licensed environment map, with mobile fallbacks |

Add a local GLTFLoader compatible with the bundled Three.js version, then connect avatar clips through AnimationMixer and preserve the current world position/profile identifiers. Keep the procedural models as loading/error fallbacks. Repeated static props should share geometry/materials or use instancing; release animation mixers, geometries, textures, and materials when models are removed. Record each asset's source, author, license, attribution requirement, and redistribution permission before including it in the project.

No unprovided models are silently downloaded, and adding GLB files alone will not load them until that integration exists.

```

---

## README-LUDO.txt

```text
# Kerala Play + Ludo

This package adds a playable local 2–4 player Ludo game to the Kerala Play website.

## Files
- `index.html` — updated Games section with a Ludo card and Play Ludo button.
- `ludo.html` — playable Ludo game.
- `style.css` — existing Kerala Play styling.
- `script.js` — existing Kerala Play JavaScript.

## Upload to GitHub
1. Extract this ZIP on the computer.
2. In GitHub open `Dreamliker007/Kerala-Play`.
3. Choose **Add file → Upload files**.
4. Upload the extracted `index.html`, `ludo.html`, `style.css`, and `script.js`.
5. Select **Commit directly to the main branch**.
6. Vercel will automatically redeploy from the `main` branch.

Do not upload the ZIP itself as the website files; upload the extracted files.

```

---

## ANDROID-RELEASE.md

```markdown
# Kerala Play Android release v1

This release branch prepares the currently proven Android shell for a first signed internal-test build.

## Release identity

- App name: `Kerala Play`
- Application ID: `com.dreamliker007.keralaplay`
- App version: `1.0.0`
- Initial Android version code: `1`
- Production origin: `https://kerala-play-1.onrender.com`
- Cleartext HTTP and mixed content remain disabled.

## Why v1 uses the production origin

The current web client and backend intentionally use same-origin HttpOnly session cookies, same-origin write checks, Server-Sent Events and WebRTC signalling. The Android build that has already been tested successfully loads the production HTTPS origin directly, so login, points, social features and live state keep the same security model.

A later native-client slice can bundle the web assets in the APK, but that requires a deliberate cross-origin/native authentication and realtime transport design first. Do not weaken the backend's same-origin protections merely to make bundled assets call the API.

## Before a release build

Run:

```powershell
npm install
npm run mobile:release:check
npm run mobile:sync
npm run mobile:open
```

Then verify on a real Android phone using mobile data (not the development LAN):

- existing account can log in
- a new account can be created
- points survive app/server restart
- People, Chat and Tasks open
- movement and Run controls work
- app resumes correctly after being backgrounded
- microphone/voice permissions are tested before enabling a public voice release

## Android Studio release settings

For the first Play release use:

- `versionCode 1`
- `versionName "1.0.0"`
- release build type
- a private upload keystore that is never committed to GitHub

Create the signed bundle from Android Studio with **Build > Generate Signed App Bundle or APK > Android App Bundle**.

Store the generated `.aab` separately from the upload keystore. Back up the keystore and its passwords securely; losing the upload key complicates future releases.

## Current production limits before a public launch

The current backend is a transitional single-instance service. Durable account/social/message/progress data is stored in Supabase, while live sessions/presence/signalling are still process-local. A backend restart can therefore require users to sign in again and temporarily resets live presence.

Render's free instance can also sleep during inactivity. It is suitable for development/internal testing, not the final always-on public launch configuration.

Before a broad public release, complete the next backend slices for durable sessions, scalable realtime/voice storage, production monitoring and always-on hosting.

```

---

## MOBILE-ANDROID.md

```markdown
# Kerala Play Android app

This branch adds a Capacitor wrapper around the existing Kerala Play web client. The website source remains the source of truth.

## Prerequisites

- Node.js 20+
- Android Studio with an Android SDK installed
- Java/JDK supported by the installed Android Studio / Capacitor Android tooling

## First Android setup

```powershell
npm install
npm run mobile:add
```

This generates the local `android/` project (ignored by Git in this branch).

## Refresh Android after website changes

```powershell
npm run mobile:sync
```

## Open in Android Studio

```powershell
npm run mobile:open
```

Then choose an emulator or connected Android phone and press Run.

## Important backend note

The current Kerala Play client calls relative `/api/...` endpoints and uses the Node server for accounts, sessions, multiplayer, messages, rewards and persistence. A packaged Android WebView does not contain that Node server.

Before distributing the app, deploy the Kerala Play server behind HTTPS and configure the mobile client to call that HTTPS backend (or temporarily load the hosted Kerala Play site from the native shell). Microphone/WebRTC features should also be tested on real devices; some networks may require a TURN relay.

## Build output

For testing, Android Studio can generate an APK. For Google Play distribution, create a signed Android App Bundle (`.aab`).

```

---

## PRODUCTION-BACKEND.md

```markdown
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

```

---

## supabase/README.md

```markdown
# Kerala Play Supabase production setup

For a new production project, run these SQL files in order:

1. `production-schema.sql`
2. `production-persistence-rpc.sql`
3. `production-service-role-grants.sql`

The first file creates server-owned `kp_*` tables. The second creates the transactional snapshot RPC used by `production-server.mjs`. The third grants direct table/RPC access only to the trusted Supabase `service_role`, while browser/mobile `anon` and `authenticated` roles remain blocked from the server-owned tables.

Never expose the Supabase service-role key to the website or Android app. It belongs only in backend-host environment variables.

```

---

## privacy-policy.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b2d32">
  <meta name="description" content="Privacy Policy for Kerala Play.">
  <title>Privacy Policy | Kerala Play</title>
  <style>
    :root { color-scheme: dark; --bg:#071c20; --card:#0d3035; --line:#2c5b5d; --text:#eef8f3; --muted:#b8d2c8; --accent:#a5edbd; }
    * { box-sizing: border-box; }
    body { margin:0; background:linear-gradient(180deg,#071c20,#041316); color:var(--text); font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; }
    main { width:min(860px,calc(100% - 32px)); margin:40px auto; padding:30px; background:rgba(13,48,53,.92); border:1px solid var(--line); border-radius:20px; box-shadow:0 18px 50px rgba(0,0,0,.28); }
    h1 { margin:0 0 4px; font-size:clamp(32px,6vw,48px); line-height:1.1; }
    h2 { margin:30px 0 8px; font-size:22px; color:var(--accent); }
    p, li { color:var(--muted); }
    strong { color:var(--text); }
    a { color:var(--accent); }
    .brand { color:var(--accent); font-size:13px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
    .updated { margin-top:8px; font-size:14px; }
    .note { margin:20px 0; padding:14px 16px; border-left:4px solid var(--accent); border-radius:10px; background:rgba(165,237,189,.07); }
    footer { margin-top:34px; padding-top:20px; border-top:1px solid var(--line); font-size:14px; }
  </style>
</head>
<body>
  <main>
    <div class="brand">Kerala Play</div>
    <h1>Privacy Policy</h1>
    <p class="updated"><strong>Effective date:</strong> 17 September 2026</p>

    <p>This Privacy Policy explains how Kerala Play ("Kerala Play", "we", "our", or "us") handles information when you use the Kerala Play website, Android app, multiplayer game, and related services.</p>

    <div class="note"><strong>In short:</strong> Kerala Play uses account, gameplay, social, and limited technical information to provide the game, keep accounts secure, save progress, and enable multiplayer and communication features. We do not sell your personal information.</div>

    <h2>1. Information we collect</h2>
    <p><strong>Account and profile information.</strong> When you create an account, we may collect your first name, username, optional email address or mobile number, password credentials in protected hashed form, district, avatar category, and profile bio.</p>
    <p><strong>Gameplay and progress information.</strong> We store information needed to operate the game, such as points, levels, completed tasks, movement or walk progress, visited landmarks, game wins, and your current in-game world position while you are online.</p>
    <p><strong>Social and communication information.</strong> If you use social features, we process follow requests, follower/following relationships, blocks, text messages, and voice messages you choose to record and send. Microphone access is used only when you choose a feature that needs audio recording.</p>
    <p><strong>Technical and security information.</strong> We may temporarily process information such as session identifiers, IP address, request timing, device/browser information supplied through normal web requests, and error or security-related data to operate, protect, troubleshoot, and prevent abuse of the service.</p>

    <h2>2. How we use information</h2>
    <ul>
      <li>create and authenticate accounts;</li>
      <li>save profiles, points, levels, tasks, and game progress;</li>
      <li>provide multiplayer presence, social features, text messaging, and voice messaging;</li>
      <li>provide password reset and account recovery features when available;</li>
      <li>detect abuse, enforce blocks and access rules, protect accounts, and maintain service security;</li>
      <li>diagnose problems and improve Kerala Play.</li>
    </ul>

    <h2>3. Service providers and data sharing</h2>
    <p>We use service providers to run Kerala Play. These may include <strong>Render</strong> for application hosting, <strong>Supabase</strong> for persistent database storage, and <strong>Resend</strong> for account-recovery email delivery when that feature is enabled. These providers process information only as needed to provide their services to Kerala Play and are subject to their own privacy and security terms.</p>
    <p>We may also disclose information when required by law, to protect users or the service, or as part of a legitimate business transfer. We do not sell personal information and do not currently use Kerala Play account data for third-party advertising.</p>

    <h2>4. Data retention</h2>
    <p>Account, profile, social, and gameplay information is generally retained while your account is active or as needed to provide the service. Message history is limited and older messages may be automatically removed as newer messages are stored. Login sessions expire automatically, and password-reset codes are short-lived.</p>
    <p>We may retain limited information for longer when reasonably necessary for security, fraud prevention, dispute resolution, or legal obligations.</p>

    <h2>5. Your choices and controls</h2>
    <p>You can edit supported profile details in Kerala Play, control follow relationships, and block other players. You can choose whether to provide optional contact information and whether to record or send voice messages.</p>
    <p>You may request access to, correction of, or deletion of your account information by using the developer contact details shown on Kerala Play's Google Play listing. We may ask you to verify ownership of the account before completing a request.</p>

    <h2>6. Security</h2>
    <p>We use reasonable technical safeguards designed to protect account information, including password hashing, HTTPS in production, restricted server-side credentials, session protections, request validation, and abuse-rate controls. No online service can guarantee absolute security.</p>

    <h2>7. Children and younger users</h2>
    <p>Kerala Play is not designed as a children-specific service. Users must meet the minimum age and consent requirements that apply in their country. Where parental or guardian consent is required by law, the service should only be used with that consent.</p>

    <h2>8. International processing</h2>
    <p>Our service providers may process or store information in countries other than your own. Where applicable, we rely on the safeguards and contractual protections provided by those service providers.</p>

    <h2>9. Changes to this policy</h2>
    <p>We may update this Privacy Policy as Kerala Play develops. When we make material changes, we will update the effective date on this page and may provide additional notice where appropriate.</p>

    <h2>10. Contact</h2>
    <p>For privacy questions or account-data requests, use the developer contact information displayed on Kerala Play's Google Play listing. You can also visit <a href="https://keralaplay.in/">keralaplay.in</a>.</p>

    <footer>Kerala Play · Privacy Policy</footer>
  </main>
</body>
</html>

```

---

## delete-account.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b2d32">
  <meta name="description" content="Request deletion of a Kerala Play account and associated data.">
  <title>Delete Account | Kerala Play</title>
  <style>
    :root { color-scheme: dark; --bg:#071c20; --card:#0d3035; --line:#2c5b5d; --text:#eef8f3; --muted:#b8d2c8; --accent:#a5edbd; --warn:#f4d58d; }
    * { box-sizing: border-box; }
    body { margin:0; background:linear-gradient(180deg,#071c20,#041316); color:var(--text); font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; }
    main { width:min(860px,calc(100% - 32px)); margin:40px auto; padding:30px; background:rgba(13,48,53,.92); border:1px solid var(--line); border-radius:20px; box-shadow:0 18px 50px rgba(0,0,0,.28); }
    h1 { margin:0 0 4px; font-size:clamp(32px,6vw,48px); line-height:1.1; }
    h2 { margin:30px 0 8px; font-size:22px; color:var(--accent); }
    p, li { color:var(--muted); }
    strong { color:var(--text); }
    a { color:var(--accent); }
    code { color:var(--text); background:rgba(255,255,255,.08); padding:.15em .4em; border-radius:6px; }
    .brand { color:var(--accent); font-size:13px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
    .updated { margin-top:8px; font-size:14px; }
    .note { margin:20px 0; padding:14px 16px; border-left:4px solid var(--accent); border-radius:10px; background:rgba(165,237,189,.07); }
    .warning { border-left-color:var(--warn); background:rgba(244,213,141,.07); }
    .steps { padding-left:22px; }
    footer { margin-top:34px; padding-top:20px; border-top:1px solid var(--line); font-size:14px; }
  </style>
</head>
<body>
  <main>
    <div class="brand">Kerala Play</div>
    <h1>Delete your Kerala Play account</h1>
    <p class="updated"><strong>Last updated:</strong> 17 September 2026</p>

    <p>This page explains how a Kerala Play user can request permanent deletion of their account and the data associated with it.</p>

    <div class="note"><strong>Requesting deletion:</strong> Use the developer contact email shown in the <strong>App support</strong> section of Kerala Play's Google Play listing and send an account-deletion request from an email address you can access.</div>

    <h2>How to request account deletion</h2>
    <ol class="steps">
      <li>Open Kerala Play's Google Play listing.</li>
      <li>Open <strong>App support</strong> and use the developer contact email displayed there.</li>
      <li>Use the subject <code>Kerala Play account deletion request</code>.</li>
      <li>Include your Kerala Play <strong>username</strong>. If you added an email address or mobile number to the account, include that information only if needed to help verify account ownership.</li>
      <li>State clearly that you want the Kerala Play account and its associated data permanently deleted.</li>
    </ol>

    <div class="note warning"><strong>Verification:</strong> To protect accounts from unauthorized deletion, Kerala Play may ask you to verify that you own the account before the request is completed. Never send your password in an email.</div>

    <h2>Data deleted with the account</h2>
    <p>After a valid deletion request is verified and processed, Kerala Play will remove account data associated with that account from the active service, including where applicable:</p>
    <ul>
      <li>account and profile information such as username, optional contact information, district, avatar selection, and bio;</li>
      <li>password credentials stored in protected hashed form;</li>
      <li>points, levels, tasks, game progress, visited landmarks, and gameplay records tied to the account;</li>
      <li>follow relationships and blocks involving the account;</li>
      <li>text messages and voice messages stored by Kerala Play and associated with the account;</li>
      <li>active login sessions and other account-specific service state.</li>
    </ul>

    <h2>Retention and processing time</h2>
    <p>Verified deletion requests are normally processed within 30 days. Limited information may be retained for longer only when reasonably necessary for security, fraud prevention, dispute resolution, or legal obligations. Temporary provider backups or logs may also persist for a limited period under the service provider's normal retention practices before they are overwritten or deleted.</p>

    <h2>Deleting some data without deleting the account</h2>
    <p>Kerala Play does not currently provide a separate self-service request to delete selected stored data while keeping the account active. Supported profile fields can be edited in the app, and social controls such as unfollowing and blocking are available where provided.</p>

    <h2>Privacy information</h2>
    <p>For more information about how Kerala Play handles user data, read the <a href="/privacy-policy">Kerala Play Privacy Policy</a>.</p>

    <footer>Kerala Play · Account deletion</footer>
  </main>
</body>
</html>

```

---

