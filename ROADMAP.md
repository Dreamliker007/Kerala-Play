# Kerala Play Public Roadmap

Kerala Play is being developed toward a persistent digital Kerala-style social world where players can live, work, travel, communicate, own items and vehicles, participate in events, and build a long-term identity.

This roadmap is directional. Features may move between phases as testing, security, performance, and infrastructure needs become clearer.

## Foundation — already in progress

Core systems already implemented or actively evolving include:

- account login and persistent player state;
- profiles, follows, blocking and private communication;
- shared multiplayer avatars and nearby voice;
- points, levels and task rewards;
- Kerala Cash wallet and server-owned economy rules;
- jobs, salaries and world mission checkpoints;
- drivable job vehicles;
- road, traffic, collision, fuel, damage and service systems;
- personal vehicle ownership;
- registration, insurance and used vehicle market;
- Android/Capacitor packaging;
- Supabase-backed production persistence;
- automated backend integration tests.

## Phase A — stronger player identity and social world

Planned focus:

- richer player profiles and status;
- friend/group systems;
- improved communication controls;
- safer moderation/reporting tools;
- notification center connected to the in-world phone;
- friend requests, job alerts, event reminders and security alerts;
- creator/community identity features.

## Phase B — life simulation and economy

Planned focus:

- expanded jobs and careers;
- businesses and player commerce;
- rent, bills, EMI-style obligations and reminders;
- inventory and ownership systems;
- banking/economy depth;
- delivery and service economy;
- business stock and supply alerts;
- stronger anti-exploit validation and economy analytics.

## Phase C — Kerala world expansion

Planned focus:

- larger connected world areas;
- more Kerala-inspired roads, towns, houses and landmarks;
- public transport;
- more personal vehicle types;
- shops, hospitals, police/fire/emergency locations;
- weather and environmental events;
- day/night activities;
- exploration rewards and local events.

## Phase D — progression, recognition and competition

Planned focus:

- achievements;
- badges;
- titles;
- category-specific leaderboards;
- progression tied to jobs, sports, exploration, creator activity, safe driving, emergency response and community contribution.

Leaderboards should not reduce the whole game to wealth ranking. Recognition systems should primarily provide status, milestones and cosmetic rewards rather than unfair gameplay power.

## Phase E — live world operations

Planned focus:

- admin dashboard;
- server health and player-count monitoring;
- economy indicators and transaction analytics;
- moderation reports and account review;
- controlled world events;
- business activity monitoring;
- crash/bug analytics;
- popular-location analytics;
- emergency/world-state controls;
- audit logs for admin actions.

## Phase F — realism and production quality

Longer-term goals:

- higher-quality rigged characters;
- improved animation;
- richer Kerala environment assets;
- upgraded vehicles and interiors;
- better soundscape;
- improved weather/lighting;
- stronger mobile optimization;
- scalable multiplayer infrastructure;
- production-grade TURN/voice reliability;
- stronger moderation and safety tooling.

## Guiding principles

Every major feature should support at least one of these goals:

1. **Persistent identity** — what a player does should matter over time.
2. **A believable living world** — systems should connect naturally rather than feel like disconnected menus.
3. **Fair economy** — rewards and ownership must be validated by the server.
4. **Social safety** — blocking, privacy, permissions and moderation are core systems.
5. **Mobile accessibility** — features should remain usable on Android and lower-power devices.
6. **Kerala character** — the world should feel locally recognizable without depending on copied or unlicensed assets.
7. **Expandable architecture** — new systems should leave room for future multiplayer scale.

## How contributors should use this roadmap

Small fixes can be submitted directly as focused pull requests.

For large roadmap features, create or claim an issue first and describe:

- the player problem being solved;
- affected client/server/database areas;
- security/economy implications;
- mobile performance impact;
- persistence or migration requirements;
- testing plan.
