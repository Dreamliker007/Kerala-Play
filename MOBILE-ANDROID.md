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

## Backend and game origin

The Kerala Play client calls relative `/api/...` endpoints and uses the Node server for accounts, sessions, multiplayer, messages, rewards and persistence. A packaged Android WebView does not contain that Node server.

The V114 production server is hosted at `https://keralaplay.in`. The mobile release configuration loads that HTTPS origin. Microphone/WebRTC features should also be tested on real devices; some networks may require a TURN relay.

## Build output

For testing, Android Studio can generate an APK. For Google Play distribution, create a signed Android App Bundle (`.aab`).

## Landscape mode

Kerala Play is landscape-first on phones. The hosted web client shows a rotate prompt in portrait and requests landscape when supported. The PWA manifest also declares landscape orientation.

The Android project is generated locally and is ignored by Git, so the npm scripts patch the generated MainActivity automatically:

- `npm run mobile:add` creates Android and then sets `android:screenOrientation="sensorLandscape"`.
- `npm run mobile:sync` refreshes assets and reapplies the same landscape lock.
- `npm run mobile:landscape` can reapply the lock manually.
- After changing the orientation lock, rebuild and reinstall the APK/AAB; an already-installed old APK cannot pick up AndroidManifest changes from the hosted website alone.

The web/PWA button requests fullscreen first and then asks the Screen Orientation API for landscape. If Android/browser policy rejects that request, the prompt tells the player to enable Auto-rotate and rotate manually. Native Capacitor releases should not depend on that web fallback because the Activity itself is locked to sensor landscape.

## Closed testing release metadata

The V114 Play closed-testing update is defined in `mobile-release.json` as version `1.0.13` with `versionCode 14` and uses the live game origin `https://keralaplay.in`.

`npm run mobile:add` and `npm run mobile:sync` now run `mobile:configure`, which reapplies:

- `sensorLandscape` to MainActivity
- the Play `versionCode`
- the Play `versionName`

This prevents Capacitor regeneration/sync from silently resetting the release metadata before an AAB is generated.
