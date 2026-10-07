# Kerala Play Android production update

This repository is prepared for the current Google Play production update.

## Release identity

- App name: `Kerala Play`
- Application ID: `com.dreamliker007.keralaplay`
- Version name: `1.0.14`
- Android version code: `15`
- Play track: `production`
- Game origin: `https://keralaplay.in`
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

- `versionCode 15`
- `versionName "1.0.14"`
- `android:screenOrientation="sensorLandscape"`

## Build the Play Store update

In Android Studio use **Build > Generate Signed App Bundle or APK > Android App Bundle**.

Use the same Play app and the same upload signing key used for the existing Kerala Play listing. Do not create a second application ID. Upload the resulting signed `.aab` to the existing **Production** track.

The current production web build is deployed at `https://keralaplay.in`. Google Play users receive the Android update after its signed AAB is uploaded, reviewed, and rolled out in the Production track.

## Production update checks

Before uploading the AAB, verify on a real phone:

- app starts in landscape
- both left-landscape and right-landscape work
- existing account can log in
- movement, WALK/RUN and camera controls work
- People, Chat, Phone, Jobs and Garage panels open
- weather/world rendering remains usable
- background/resume works
- microphone/voice permission behavior is acceptable for the current test build

Upload the signed AAB to the existing Play Console Production track after real-device checks pass.

## Signing safety

Never commit the upload keystore or signing passwords to this repository. Keep at least one secure backup of the upload key and credentials.
