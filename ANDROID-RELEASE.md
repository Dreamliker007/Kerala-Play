# Kerala Play Android closed-testing update

This repository is prepared for the next Google Play closed-testing update.

## Release identity

- App name: `Kerala Play`
- Application ID: `com.dreamliker007.keralaplay`
- Version name: `1.0.1`
- Android version code: `2`
- Play track: `closed-testing`
- Production origin: `https://keralaplay.in`
- Android orientation: `sensorLandscape`
- Cleartext HTTP and mixed content: disabled

The release values are stored in `mobile-release.json`. The generated Android project remains ignored by Git, so `npm run mobile:sync` reapplies both the orientation lock and Play version metadata automatically.

## Prepare the Android project

```powershell
npm install
npm run mobile:release:check
npm run mobile:sync
npm run mobile:open
```

After `mobile:sync`, the generated Android app should contain:

- `versionCode 2`
- `versionName "1.0.1"`
- `android:screenOrientation="sensorLandscape"`

## Build the Play Store update

In Android Studio use **Build > Generate Signed App Bundle or APK > Android App Bundle**.

Use the same Play app and the same upload signing key used for the existing Kerala Play listing. Do not create a second application ID. Upload the resulting signed `.aab` to the existing **Closed testing** track.

The V80 landscape fix is native Android configuration, so testers need this newly built Play Store update; an already installed older build cannot receive the AndroidManifest orientation change from the hosted website alone.

## Closed-testing update checks

Before uploading the AAB, verify on a real phone:

- app starts in landscape
- both left-landscape and right-landscape work
- existing account can log in
- movement, WALK/RUN and camera controls work
- People, Chat, Phone, Jobs and Garage panels open
- weather/world rendering remains usable
- background/resume works
- microphone/voice permission behavior is acceptable for the current test build

Keep the update in the same Play Console closed-testing track and keep existing testers opted in while the test continues.

## Signing safety

Never commit the upload keystore or signing passwords to this repository. Keep at least one secure backup of the upload key and credentials.
