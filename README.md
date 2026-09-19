# Kerala Play

A Kerala village game with accounts, accepted follows, private messages, shared avatars, nearby voice, server-owned rewards and a persistent Kerala Cash wallet.

## Run

Install Node.js 20 or later, open a terminal in this folder, and run:

```powershell
npm start
```

Open **http://localhost:3000**. No npm install or cloud account is required. Three.js 0.160.1 and its license are included in `vendor/`.

Create a username (3–24 letters, numbers or underscores) and a password of at least 8 characters. Each new account starts at **0 points, level 1 and ₹500 Kerala Cash**. Account data is stored in `.data/`; preserve that folder when updating the game. Old browser-only demo profiles are not accounts and are not imported.

Use separate browsers or browser profiles to test two people. Tabs in the same browser share the login cookie. Both players must connect to the same running server.

## Play

- Move with WASD, arrow keys or the left joystick. Hold Shift or RUN to run. Drag the right side to look around.
- Select a username or click an avatar to open its profile. Village guides have an NPC profile; real players have follow and messaging controls.
- In People, send a follow request. The recipient must accept before either person can send private messages. Blocking removes the connection and prevents messages and voice.
- Complete exploration tasks for one-time points. Coconut Memory gives 20 points for repeating a pattern, with a maximum of five wins per day. Each round can be submitted only once.
- Open **WALLET** to see Kerala Cash and transaction history. The one-time Starter Delivery credits ₹250. Village Shop prices are server-owned, so the browser cannot choose its own price or spend below zero.
- The sky runs through a shared 24-minute day, evening and night. Enable Sound for synthesized birds, water, night ambience and music. Quality controls adjust resolution and shadows.

## Voice and multiplayer

Private voice messages use microphone recording, with a 30-second limit. Walkie-talkie uses WebRTC with an explicit listening control and push-to-talk. **Nearby Voice** is a separate opt-in mode: tap the VOICE button to enable your microphone, and players within roughly 22 metres connect automatically; their volume fades with distance and the connection closes after about 27 metres. Blocks also disable nearby voice. The browser asks for microphone permission when you use these controls.

Microphones require localhost or HTTPS. For access from other devices, host the application behind an HTTPS reverse proxy. This repository runs a single Node process with file persistence; it does not include public hosting, HTTPS certificates, a TURN relay, email recovery or large-scale infrastructure. Some networks require a TURN server for WebRTC audio to connect.

The server authenticates requests, hashes passwords with a separate salt, validates movement and task eligibility, enforces follow/block restrictions, and limits request rates. Client-side games are still inspectable; this is not a competitive anti-cheat system. Rewards have no monetary value.

## Visual scope

The included male/female avatars, vehicles, Kerala-style houses, coconut palms and landscape are procedural 3D models. Lighting, movement animation, nameplates, batched palm leaves and graphics quality settings are implemented. Photorealistic rigged characters and scanned environment assets are not included; production-quality realism remains an asset-production step.

## Verify

```powershell
npm test
```

The API integration suite covers account/session rules, accepted follows and blocks, private message permissions, nearby voice, rewards, Kerala Cash wallet validation/persistence and protected files. Real microphones and two-device WebRTC audio should also be checked on the intended deployment network.


## World Job Missions V2 (V52)

The three Phase 1 jobs now use server-verified world checkpoints instead of timer-only completion. Delivery Rider requires parcel pickup and customer drop-off, Taxi Driver requires passenger pickup and destination drop-off, and Shop Worker requires travel to the shop plus a short on-site shift. The HUD and Kerala map show the current job destination, while salary, cooldowns and checkpoint validation remain server-authoritative. Existing `job_state` JSON storage is reused, so no new Supabase table migration is required beyond the V51 jobs migration.

## Jobs + Salary V1 (V51)

Phase 1 now includes a server-verified job board with three repeatable jobs:

- Delivery Rider — 180 Kerala Cash after a 12-second work window, then 30-second cooldown.
- Taxi Driver — 220 Kerala Cash after a 15-second work window, then 35-second cooldown.
- Shop Worker — 140 Kerala Cash after a 10-second work window, then 25-second cooldown.

Only one job can be active at a time. The backend creates a unique task ID, enforces minimum work time and cooldowns, rejects replayed/expired task IDs, and credits the server-defined salary directly to the Kerala Cash wallet. Client-supplied salary values are ignored. Active-job state, cooldowns and completion counts persist across backend restarts.

For an existing Supabase production project, run `supabase/jobs-v1.sql` once, then rerun `supabase/production-persistence-rpc.sql` and `supabase/production-service-role-grants.sql` before deploying V51.


## Interactive Job Objects (V53)

World jobs now have visible mission objects and on-site interaction. Delivery missions render a parcel at pickup and carry the parcel after collection, Taxi missions render a waiting passenger and keep the passenger with the player until drop-off, and Shop Worker missions render a temporary village-shop interaction point. When the player is within the server-defined checkpoint radius, an INTERACT button appears in the world HUD so pickup, drop-off, check-in and salary collection can be completed without opening the Jobs panel. Server-side position checks, cooldowns and salary validation remain authoritative. No new Supabase migration is required for V53.


## Drivable Job Vehicles + Control Stability (V54)

Delivery Rider missions now spawn a dedicated delivery bike and Taxi Driver missions spawn a Kerala taxi. Players must walk to the assigned job vehicle, enter it, and complete the route while driving. Vehicle entry/exit and movement mode are server-authoritative; bike/taxi speed limits are validated by the backend, and vehicle distance does not count toward walking-task progress. The RUN control becomes BRAKE while driving.

V54 also tightens input stability with a joystick dead zone, tracked pointer capture/release, global pointer-up cleanup, blur/visibility input reset, smoothed acceleration/braking and steering, and camera auto-follow while driving. No new Supabase migration is required because vehicle state lives inside the existing persisted job state.


## Walking Stability Hotfix (V56)

Avatar movement now uses smoothed walking velocity instead of applying joystick direction directly every frame. Small stick movement produces a slower walk, acceleration and deceleration ramp smoothly, turning follows the smoothed travel direction, and the camera no longer fights manual look input while walking. Run speed and turn response are also reduced for more controllable movement. Walking inertia is cleared whenever the player enters a vehicle or the game loses focus.


## World Collision + Safer Movement (V57)

The world now has a lightweight mobile-friendly collision layer for houses, palms, trees, the pond, benches, and major landmark structures. Walking uses axis-separated collision resolution so the avatar slides along obstacle edges instead of passing through them. Delivery bikes and taxis use larger collision radii, lose speed on impact, and stop cleanly when fully blocked. Moving traffic is also treated as a live obstacle. Collision movement only reports actual travelled distance, so walking progress and multiplayer movement sync stay accurate. No new Supabase migration is required.


## Road + Traffic System (V58)

Driving now reacts to the road type. The main road, village side road and off-road areas have separate speed limits and vehicle caps, shown in the driving HUD with the current simulated km/h. The side road now has lane markings. Traffic vehicles use smoother acceleration/deceleration, keep distance from the player and same-lane vehicles, and the side-road traffic yields at the main-road crossing.

Job vehicles now include a HORN control and toggleable headlights. Nearby AI traffic slows/yields briefly to the player's horn. Headlights use visible emissive lamps plus one lightweight forward beam on the active player vehicle. Keyboard users can use H for horn and L for lights. A stopped job vehicle can be parked by exiting it and re-entered later. No new Supabase migration is required.


## Fuel + Damage + Service System (V59)

Active Delivery Bike and Kerala Taxi missions now track server-persisted fuel and vehicle condition. Driving distance burns fuel on the backend, collision impacts apply capped condition damage, and condition can reduce maximum vehicle performance. The driving HUD and Jobs panel show Fuel and Condition percentages.

A Kerala Fuel Station and Village Service Garage are now placed in the world. Stop the active vehicle near the correct station to get a REFUEL or REPAIR interaction. Refuel and repair costs are deducted from Kerala Cash by the server and appear in wallet transaction history. Fuel, condition, service costs, station proximity and impact throttling are all validated server-side. No new Supabase migration is required because vehicle state continues to live inside the persisted job_state JSON.


## Vehicle Collision Recovery (V60)

Vehicle collision now uses the full visual footprint of moving cars and buses instead of a small circular approximation, preventing bikes and taxis from entering the visible body of traffic. Vehicle movement is collision-substepped, the player continuously records a last safe vehicle pose, and any detected overlap automatically restores a nearby safe position with speed reset. Reverse movement remains available after a normal edge collision.

AI traffic also predicts its next position and stops before its body enters the player footprint. Fuel Station and Service Garage server interaction coordinates are aligned with their visible world locations. No new Supabase migration is required.


## Personal Vehicle Ownership + Garage (V61)

Players can now own personal vehicles separately from temporary job vehicles. The GARAGE panel contains a server-priced showroom with a Kerala Bike and Kerala Compact car, an owned-vehicle list, selection controls, and Retrieve / Store actions. Only one personal vehicle can be outside the garage at a time, and personal vehicles must be stored before starting a job.

Retrieved vehicles appear in the world near the player and use the existing stable V55–V60 driving, road, traffic, collision-recovery, horn, lights, fuel, condition, refuel and repair systems. Personal fuel and condition persist across sessions and server restarts. Purchases and service costs use Kerala Cash wallet transactions. Garage ownership is stored inside the existing job_state JSONB, so V61 requires no new Supabase migration.


## Vehicle Registration + Insurance + Used Market (V62)

Personal vehicles now receive a unique Kerala registration number when first purchased or migrated into the V62 garage. New vehicles include 30 days of insurance. The Garage shows registration, insurance status, renewal cost, condition-based resale value and ownership-transfer count. Insurance renewal is server-priced and paid from Kerala Cash.

Stored personal vehicles can be listed on the Used Vehicle Market at a server-calculated resale price based on model value and current condition. Another player can buy the listing with Kerala Cash; the seller is credited, ownership transfers atomically, and the same vehicle keeps its registration, fuel, condition and remaining insurance. Listed vehicles cannot be selected or retrieved until the listing is removed. Market state is stored inside the selling owner's existing persisted job_state JSONB, so V62 requires no new Supabase migration.


## Police Traffic Enforcement + Vehicle Documents (V63)

Kerala Play now has an in-game traffic enforcement layer for personal vehicles. Garage > Documents & Traffic shows each owned vehicle's RC status, registration, insurance status, and traffic challan history. These are Kerala Play game rules only and are not real-world legal guidance.

A Kerala Play Traffic Checkpoint is placed on the main road. Stop a personal vehicle at the checkpoint and use CHECK DOCUMENTS. RC is currently always valid for owned vehicles; expired insurance creates one unpaid in-game challan until that challan is paid. Challans are paid from Kerala Cash and appear in wallet transaction history.

The server also measures personal-vehicle movement against Kerala Play road speed zones. Two consecutive samples materially above the in-game road limit can create a speeding challan, with a cooldown to prevent rapid duplicate tickets. Server-side movement validation remains authoritative. Traffic state is stored inside existing job_state JSONB, so V63 requires no new Supabase migration.


## Driving Licence + Digital Documents (V64)

Kerala Play now has an in-game driving licence system for personal vehicles. A free Starter Learner Permit unlocks the bike class for 14 days. An active Learner Permit can be upgraded to a Full Licence for Kerala Cash; Full Licence covers bike + car for 30 days. Learner and Full licences can be renewed, and the same Kerala Play licence number is preserved across upgrades and renewals.

Garage > Documents & Traffic now acts as a digital document wallet showing the player's Driving Licence plus each owned vehicle's RC and insurance. The driving HUD shows DL INVALID when the current personal vehicle is not covered by an active licence. The traffic checkpoint verifies RC, insurance and licence class. The server can also detect continued personal-vehicle driving without the required licence and issue one unpaid in-game licence challan per vehicle until paid. These are Kerala Play game rules, not real-world legal guidance.

Licence and challan state live inside the existing job_state JSONB, so V64 requires no new Supabase migration.


## Daily Needs System (V65)

Kerala Play now has persistent Hunger, Thirst and Energy for each player. Needs decay gradually over time with a capped offline catch-up so returning players are not instantly emptied after a long break. Walking consumes a small additional amount of energy and hydration. Low needs reduce server-authoritative walking speed; very low needs prevent running until the player recovers.

The HUD shows compact Hunger, Thirst and Energy values. Village Shop purchases now have real life-sim effects: Water restores thirst, Tea restores thirst + energy, Snack restores hunger + energy, and Kerala Meal restores hunger, thirst and energy. Prices and effects are server controlled.

The Village Rest Bench at the existing bench location can restore Energy when the player is on foot and nearby. Rest has a short server cooldown after a successful recovery. Needs state is stored inside the existing job_state JSONB, so V65 requires no new Supabase migration.


## Home / Rent / Sleep System (V66)

Every player now receives a persistent Village Rental Home tied to the existing village house at the rental-home marker. The first rent and utility cycle is due after 24 hours. Daily in-game charges are server controlled: ₹60 Kerala Cash for rent and ₹20 for electricity + water. Payments are recorded in the normal wallet transaction history.

Overdue charges have a 48-hour grace period. During the grace period the home still works. After the grace period, only the SLEEP interaction is temporarily paused until overdue rent or utilities are paid; the account and home are never deleted or evicted by this V66 system.

When the player is on foot at the home porch with no active job, SLEEP restores Energy to 100 and applies a small Hunger −4 / Thirst −6 cost. Sleep has a short server cooldown and is location verified. Home, bill, payment-count and sleep state are stored inside the existing job_state JSONB, so V66 requires no new Supabase migration.


## Kerala Bank + UPI (V67)

Kerala Play now has a separate persistent Kerala Bank account in addition to the cash wallet. Every account starts with ₹0 in the bank and receives a deterministic Kerala Bank account number plus a Kerala Pay UPI ID in the form username@keralapay.

The Wallet panel now includes bank balance, Wallet ↔ Bank deposit/withdraw controls, Kerala Pay UPI transfers, and bank transaction history. Deposit and withdrawal amounts are server validated. UPI transfers move bank balance directly between players by username or Kerala Pay UPI ID, reject self-transfers and blocked-player transfers, and write matching sender/receiver ledger entries with a shared transfer ID.

Bank balance and bank history are stored inside the existing job_state JSONB. Existing wallet transactions remain separate, so V67 requires no new Supabase migration.


## Kerala Phone Notifications + Reminders (V68)

Kerala Play now has a persistent Kerala Phone alerts panel with an unread badge. Event notifications are stored for salary credits, Kerala Pay UPI receipts, traffic challans and used-vehicle sales. Live reminders are generated from the player's current world state for overdue rent/utilities, home access restrictions, low Hunger/Thirst/Energy, expiring or expired vehicle insurance, driving-licence expiry, ready job completion and job cooldown completion.

Notifications use stable IDs and per-player read state so refreshing the panel does not create duplicate unread alerts. Players can mark individual alerts or all current alerts as read. Relevant alerts can jump directly to Wallet, Home, Garage or Jobs. Active sessions refresh live reminders periodically and receive server-sent notification events for immediate updates.

Notification state is stored inside the existing job_state JSONB, so V68 requires no new Supabase migration.


## Landscape-First Mobile Mode (V69)

Kerala Play is now landscape-first on phones. In portrait on a touch phone, the game shows a full-screen rotate prompt instead of squeezing the HUD into a narrow layout. The ENTER LANDSCAPE action requests fullscreen and a landscape orientation lock where the browser supports the Screen Orientation API; manual rotation remains the fallback on browsers such as iOS Safari.

Phone landscape gets its own low-height HUD layout: compact profile/mission cards, a horizontally scrollable quick-action strip, smaller joystick and RUN controls, compact driving controls, and game panels sized for the wider viewport. Desktop and normal tablet layouts keep their existing behavior.

The PWA manifest declares landscape orientation. Capacitor Android builds also run a post-add/post-sync script that patches the generated MainActivity with `android:screenOrientation="landscape"`, so generated Android builds stay landscape without committing the ignored `android/` project.


## Social + Security + World Alerts (V70)

Kerala Phone notifications now cover more of the living-world and social experience. New follow requests create a persistent alert for the recipient, accepted requests notify the original requester, and incoming private text or voice messages create social alerts. Social alerts can jump directly to the People panel.

Account recovery now records a persistent security notification after a password is changed, giving the player a visible account-security trail inside Kerala Phone.

The server also supports a controlled world-alert feed for weather notices, emergencies, scheduled events and general world announcements. Alerts can include severity, start/end times, an optional destination panel and optional Kerala-district targeting. Local and production servers can load this feed from the server-only `KP_WORLD_ALERTS_JSON` environment variable. The server validates and limits supplied alert data before it reaches players; world alerts use stable IDs so read state remains stable across refreshes and restarts.

V70 reuses the existing V68 notification/read-state storage inside `job_state`, so no new Supabase migration is required. The world-alert configuration is operational input rather than player-controlled data.


## Professional HUD + Driving Pedals (V71)

Kerala Play now uses a cleaner glass-style gameplay HUD designed to keep the 3D world visually dominant. Mobile landscape uses a compact icon dock without large text labels, lighter profile/mission cards, a subtler movement joystick, consistent rounded panels and cleaner driving controls.

World Sound, Graphics quality and Fullscreen are no longer permanent bottom-screen controls. They live inside a dedicated Settings panel opened from the HUD, freeing the lower centre of the screen for gameplay and vehicle status.

Vehicles now have a dedicated on-screen ACCEL pedal while driving. The existing RUN control becomes BRAKE in a vehicle. Holding ACCEL supplies full forward throttle and uses a faster acceleration response, while steering remains available on the left joystick. The accelerator improves pickup but does not raise the road/condition/fuel-derived maximum speed, so existing server movement validation and Kerala Play traffic rules remain authoritative.


## Minimal HUD + Hold-to-Run Forward (V72)

The always-on HUD is reduced further so the world stays visually dominant. The Current Mission card and separate Level/Points chip are hidden from gameplay; level and points remain available in the player profile. Hunger, Thirst and Energy are shown as a very small top status strip, while the brand, profile, online and world-time chips and the icon dock use smaller footprints.

On foot, holding RUN now acts as forward auto-run after movement has begun: if the player releases the left movement joystick while still holding RUN, the avatar continues straight ahead at full running speed. Releasing RUN stops the auto-run behavior. Normal joystick steering still takes priority while the movement control is being used, and the existing needs-based run restriction remains enforced.


## World Visual Upgrade — Pass 1 (V73)

V73 starts the world-quality upgrade after the HUD cleanup. This pass focuses on the highest-impact environment improvements without adding heavy downloaded assets or weakening mobile performance.

Changes include richer procedural grass/ground texture, textured asphalt, road shoulders, white edge markings, reflective road studs, lightweight roadside grass, emissive street lamps, brighter and more readable night lighting, longer night visibility, and extra Kerala-house facade details such as skirting, trim, window sills and porch lighting.

The visual pass deliberately keeps lighting and roadside detail lightweight: street lamps use emissive materials instead of many dynamic point lights, and vegetation detail uses instancing. High-quality mode can still use the existing shadow system, while lower graphics levels avoid the heaviest shadow cost.

This is the first environment pass, not the final character/vehicle realism stage. Higher-detail human avatars, vehicle models and larger world assets can be upgraded separately so each change can be tested on Android performance.


## Player + NPC Character Visual Upgrade (V74)

V74 replaces the earlier toy-like human silhouette with a more proportioned lightweight procedural character model. Heads are more oval with a separate jaw/chin shape, smaller eyes, brows, ears, a shaped nose and subtler mouth. The torso, shoulders, waist and pelvis are reshaped, while arms and legs now use jointed upper/lower segments instead of single rigid limbs.

Walking and running animation now includes elbow bend, knee lift, mild torso counter-rotation, gentler head movement and reduced vertical bobbing. Player, remote-player and NPC styling receives deterministic variation so characters are less visually identical while remaining stable between renders.

Village NPCs now use different skin tones, clothing palettes and hair/face variants. Player name labels are smaller, more transparent and less dominant over the 3D world.

The V74 pass deliberately stays procedural and lightweight rather than downloading high-poly character assets. This keeps the current web/Android bundle small and leaves a future path for optional rigged GLB characters after mobile performance and asset licensing are ready.


## Vehicle Visual + Driving Polish (V75)

V75 improves both the look and feel of Kerala Play vehicles without changing server-authoritative traffic, ownership, fuel or speed-limit rules.

Cars and buses now use more layered body geometry with separate lower/upper body sections, roof, bumpers, improved glazing, mirrors/grille details, front/rear lamps, registration-plate surfaces, larger wheel hubs and more realistic proportions. The delivery bike gains a clearer engine/tank/frame/fork/handlebar/carrier silhouette and dedicated front/rear lighting.

Vehicle wheels now rotate while moving. Front wheels visually steer, driven vehicles receive subtle body lean/pitch, and brake lights brighten while braking. Traffic vehicles reuse the same lightweight wheel animation.

Driving input now smooths steering rather than applying full joystick direction instantly. Braking response is progressive but stronger at lower speeds, while acceleration remains responsive. The chase camera gains speed-based distance and forward look-ahead so the road ahead is easier to read while moving quickly.

This visual/control pass remains procedural and mobile-oriented: no large external vehicle assets are added, and existing server movement validation, road limits, vehicle condition, fuel use and traffic enforcement stay authoritative.


## Kerala Town + Street Realism (V76)

V76 makes the existing Kerala Play village/town environment feel more lived-in without introducing a heavy external asset pack.

The main road now gains two usable roadside shop buildings, two bus-stop shelters, concrete utility poles with crossbars, insulators and lightweight sagging overhead wires, a zebra crossing and junction stop marking, roadside signboards, crates and bins. Existing homes also receive low compound-wall boundaries with open entrances so the residential areas read more clearly from the road.

The pedestrian population is expanded with additional local NPCs using the V74 character system. Their clothing/appearance continues to use lightweight procedural variation, and name labels identify them as locals rather than adding large floating world markers.

Town props are intentionally split between gameplay-solid and visual-only objects. Shops and bus shelters receive collision footprints, while utility wires, compound walls and small roadside clutter remain visual-only so they do not unexpectedly block driving routes. No dynamic lights or large texture downloads are added.

V76 does not alter the backend, economy, traffic authority, vehicle ownership or persistence schema, so no Supabase migration is required.


## Living World AI + Traffic Behavior (V77)

V77 gives Kerala Play's existing town more visible day-to-day behavior without introducing a heavy AI runtime.

Local NPCs no longer move continuously with a simple sine loop. Walking locals now pause at route ends, idle characters make subtle head/torso movements, bus-stop passengers wait in place, a shopper idles near a roadside shop, and a dedicated pedestrian periodically crosses the V76 zebra crossing.

Ambient traffic now reacts to the world. Main-road vehicles yield while the pedestrian is actively on the zebra crossing. A lightweight two-direction traffic signal cycles the main road and village side road through green, amber and all-red safety phases; AI traffic slows or stops based on its current signal state. Existing same-lane spacing and player-vehicle awareness remain in place.

The town bus now approaches both V76 bus stops more slowly, pauses briefly at the stop, then continues its route and can service the stops again on later route laps. Two static parked cars add roadside activity while also acting as physical obstacles.

All behavior is deterministic and local to the visual simulation. V77 does not add server AI, database changes, economy changes or a Supabase migration, and existing server-authoritative player movement and vehicle rules remain unchanged.
