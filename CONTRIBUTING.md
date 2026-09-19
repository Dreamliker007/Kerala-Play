# Contributing to Kerala Play

Thanks for helping build Kerala Play — a persistent social open-world game inspired by Kerala life.

The project currently includes account/login systems, profiles and social features, multiplayer/voice features, jobs, wallet/economy systems, vehicles, missions, Android packaging, Supabase persistence, and a growing 3D world. Contributions should improve the game without weakening security, persistence, or mobile performance.

## Ways to contribute

You can contribute as a:

- **Developer** — gameplay, backend, multiplayer, UI, mobile, testing, performance.
- **3D / UI Designer** — characters, vehicles, buildings, props, HUD/UI improvements.
- **Tester** — reproduce bugs, test on Android/desktop, verify multiplayer flows.
- **Content / World Contributor** — Kerala-inspired locations, jobs, activities, events, dialogue ideas.
- **Documentation Contributor** — setup guides, release notes, testing instructions.

## Before you start

1. Check `ROADMAP.md`.
2. Check `GOOD-FIRST-ISSUES.md` for beginner-friendly tasks.
3. For larger features, open or claim an issue before writing a large change.
4. Keep each pull request focused on one clear change.

## Local setup

Requirements:

- Node.js 20 or later
- Git
- A modern browser

Run:

```bash
npm start
```

Then open:

```
http://localhost:3000
```

Run automated tests with:

```bash
npm test
```

Android contributors can also use the Capacitor scripts in `package.json`, including `npm run mobile:prepare`, `npm run mobile:sync`, and `npm run mobile:release:check`.

## Project areas

Important files include:

- `index.html` — main app/game interface.
- `game.js` — 3D world, movement, vehicles, missions and gameplay logic.
- `social.js` — social/profile/messaging-related client logic.
- `server.mjs` — server-authoritative gameplay and API logic.
- `server.test.mjs` — integration tests.
- `schema.sql` and `supabase/` — database and production persistence.
- `environment.js` — world/environment logic.
- `game.css`, `social.css`, `style.css` — UI styling.
- `MOBILE-ANDROID.md` and `ANDROID-RELEASE.md` — Android workflow.
- `PRODUCTION-BACKEND.md` — production backend guidance.

## Development rules

### 1. Keep server-authoritative systems authoritative

Do not move trust-sensitive logic only into the browser.

The server should remain authoritative for systems such as:

- Kerala Cash balances and transactions
- rewards and salaries
- task completion
- ownership
- vehicle market transactions
- cooldowns
- movement or proximity checks used for rewards
- permissions for social or multiplayer actions

Never trust a client-supplied price, salary, reward, balance, ownership state, or privileged action without server validation.

### 2. Protect account and player data

Do not commit:

- passwords
- access tokens
- service-role keys
- private API keys
- production secrets
- real player personal data

Use environment variables and example configuration files.

### 3. Preserve persistence compatibility

Kerala Play already has persistent player state.

When changing stored data:

- prefer backward-compatible additions;
- include migrations when a database schema change is required;
- document migration steps;
- avoid silently resetting player progress.

### 4. Design for mobile first

The game targets Android as well as desktop.

New features should:

- work with touch controls;
- avoid tiny tap targets;
- keep overlays from blocking gameplay;
- avoid excessive memory/GPU cost;
- degrade gracefully on lower-end devices.

### 5. Keep the world performant

For new 3D content:

- reuse geometry/materials where practical;
- avoid unnecessary per-frame allocations;
- avoid excessive dynamic lights/shadows;
- prefer lightweight collision shapes;
- test on mobile-sized viewports.

### 6. Keep multiplayer-safe behavior

Any feature involving another player should respect:

- blocks;
- follow/relationship permissions where applicable;
- server validation;
- rate limits;
- distance/proximity rules;
- user opt-in for microphone/voice features.

### 7. Add or update tests

Backend or server-authoritative changes should add or update tests in `server.test.mjs` when practical.

Before opening a PR, run:

```bash
npm test
```

For voice, multiplayer, Android, graphics, or touch changes, also perform manual testing because automated tests cannot fully cover those systems.

## Code style

- Keep functions focused and names descriptive.
- Avoid unrelated refactors inside a feature PR.
- Prefer readable code over clever code.
- Comment non-obvious game rules, security checks, persistence behavior, and coordinate assumptions.
- Keep user-facing text clear and short.
- Do not introduce a large dependency when a small native solution is sufficient.
- Maintain existing ES module conventions.

## Branch and commit guidance

Use short descriptive branch names, for example:

```
feature/weather-alerts
fix/vehicle-collision
docs/android-release
```

Example commit messages:

```
feat: add vehicle insurance reminder
fix: stop blocked users from nearby voice
test: cover salary cooldown validation
docs: add contributor setup
```

## Pull request checklist

Before requesting review:

- [ ] The feature works locally.
- [ ] `npm test` passes.
- [ ] No secret or private data is committed.
- [ ] Server-authoritative rules remain protected.
- [ ] Existing accounts/progress are not unintentionally broken.
- [ ] Mobile/touch impact was considered.
- [ ] Relevant documentation was updated.
- [ ] The PR explains what changed and how it was tested.

## Contributor recognition

Accepted contributors may be credited in project release notes, contributor lists, or community acknowledgements.

Recognition should be based on useful contributions — code, testing, design, documentation, world-building, accessibility, security, or community support — rather than on wealth, spending, or gameplay advantage.

## Community expectations

Be respectful, constructive, and specific when reporting problems or reviewing work.

Do not submit:

- harassment or hateful content;
- malicious code;
- cheats intended to exploit rewards/economy systems;
- stolen assets;
- copyrighted assets without permission;
- code designed to collect unnecessary personal information.

## Need a starting point?

Open `GOOD-FIRST-ISSUES.md` and pick a small task. Small, tested pull requests are preferred over very large first contributions.
