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
