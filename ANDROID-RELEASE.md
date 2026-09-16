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
