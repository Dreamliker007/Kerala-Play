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
