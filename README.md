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


## Weather + Day/Night Living World (V78)

V78 extends the existing 24-minute shared day/night clock with a deterministic Kerala-monsoon-style visual weather cycle. Weather moves through clear, cloudy, rain and heavier-rain phases without relying on an external weather API, so all clients can render the same lightweight cycle from the shared clock.

Rain uses one camera-following LineSegments field with graphics-quality-dependent drop counts. Overcast weather darkens the sky and clouds, reduces sun/moon intensity, increases fog density and hides stars naturally. The compact world-time HUD now includes Cloudy/Rain/Heavy rain status. Optional world sound also gains filtered rain noise while birds and crickets reduce during stronger rain.

Road asphalt becomes darker, smoother and more reflective as rain builds. Lightweight puddle meshes fade in along the roads, and a driven vehicle gets a tiny local wheel-spray particle effect based on rain strength and speed.

Street lamps and ambient vehicle lamps switch on automatically when the world becomes dark or sufficiently overcast. A player's current vehicle also gets automatic headlights in darkness/heavy overcast while preserving the existing manual light toggle.

NPC movement slows slightly in rain and characters adopt a subtle rain posture rather than continuing exactly as in clear weather.

The weather system is visual/local simulation only. It does not change server-authoritative movement, traffic rules, fuel, economy, jobs, ownership or persistence, and V78 requires no database or Supabase migration.


## Natural NPC Life + Run Fix + Tree Realism (V79)

V79 responds to the first in-world V78 playtest and focuses on movement feel, pedestrian variety and vegetation.

RUN no longer becomes completely unusable when hunger, thirst or energy are low. Needs still reduce movement speed through the existing server-authoritative movement factor, but the RUN control remains usable so low needs create a performance penalty instead of a dead button.

Ambient NPC movement is slowed to a more believable walking pace and uses smaller, slower walk animation strides. Remote real-player avatars also use walk animation by default and only switch to a stronger run-looking stride when their measured network movement speed is high enough.

The zebra crossing now has several independently-timed pedestrians rather than one NPC continuously shuttling across the road. The street population also gains varied activities: bus-stop waiting, shopping/task gestures, phone use, walking and paired conversation. Social NPC pairs face each other and use subtle head/arm gestures, giving visible NPC-to-NPC interaction without adding a heavy AI/pathfinding system.

NPC floating labels use a shorter visibility distance to reduce screen clutter, while the NPC profile panel reports each local's current activity.

Broadleaf trees now use tapered trunks, more branch variation and layered irregular foliage clusters. Coconut palms use a fuller procedural crown with a tapered trunk, coconut cluster, shared-style midribs and many feather-like leaflet triangles, producing a denser Kerala roadside silhouette while remaining texture-free and mobile-oriented.

V79 changes client/world visuals and behavior only. No database or Supabase migration is required, and existing server movement validation remains authoritative.


## Real High Graphics Mode (V82)

V82 makes the existing High graphics preset materially different from Low/Balanced, based on mobile landscape playtest feedback.

High now keeps hardware anti-aliasing available on mobile, raises the render pixel-ratio cap to 2x where the device allows it, enables PCF soft shadows with a 2048x2048 sun shadow map, and increases texture anisotropy up to 8x. Procedural road/ground textures and other mapped materials therefore remain clearer at oblique camera angles instead of becoming visibly soft.

High also enables material dithering, keeps ACES filmic tone mapping, increases local rain density to 620 line drops, and renders the full 30-instance cloud field. Balanced uses a lower pixel ratio, up to 4x anisotropy, 300 rain drops and fewer clouds. Low keeps shadows disabled, uses the smallest pixel-ratio cap, 1x anisotropy and the lightest weather density.

The preset switch still works at runtime. No backend, database, gameplay, economy or Supabase migration is required.


## High-Quality-Only Graphics (V83)

V83 removes the Low and Balanced graphics choices from Kerala Play. The game now always starts and stays on the V82 High-quality renderer profile for every player, including mobile.

Saved older Low/Balanced preferences are ignored and replaced with High. The Settings panel now reports **HIGH QUALITY** instead of exposing a graphics selector. Runtime rendering therefore always keeps mobile anti-aliasing, up to 2x device pixel ratio, PCF soft shadows, 2048 sun shadow maps, up to 8x texture anisotropy, material dithering, ACES tone mapping, the full cloud field and the high-density rain field.

Future performance work should optimize world geometry, draw calls, instancing, culling and update frequency rather than visibly lowering the graphics preset.

No backend, database, economy, gameplay or Supabase migration is required.


## Kerala Environment Realism (V84)

V84 uses the High-quality-only renderer as the baseline and improves the physical look of the village rather than adding another graphics preset.

Kerala houses gain visible rain gutters, downpipes, roof-edge depth and drainage shoes. Roadside shops gain shutter slats, awning supports, framed signage and a small front counter so facades read as layered structures instead of flat boxes.

The road network now includes concrete roadside drainage channels, occasional cover slabs, repaired asphalt patches and damp soil shoulder patches. Compound homes gain efficient instanced hedges, while lightweight procedural banana plants add more recognizable Kerala vegetation around homes and roadside spaces.

All new street detail is visual-only. Existing road collision, traffic authority, jobs, economy, ownership and server movement rules are unchanged.

V84 also adds browser-module syntax checks for game.js, environment.js, social.js and boot.js to the core GitHub workflow so future visual changes are less likely to merge with a client-side syntax error.


## Kerala Traffic + Street Life Realism (V85)

V85 makes the V84 high-quality village feel more like a lived-in Kerala street.

Ambient traffic now includes a procedural three-wheeler auto-rickshaw and rider-equipped two-wheelers in addition to cars and the bus. Main-road and side-road traffic uses a mixed vehicle flow, while parked bikes and an auto-rickshaw add roadside vehicle variety near shops and side streets.

Traffic vehicles no longer cruise at perfectly identical constant speeds: each vehicle gets a small deterministic speed variation while still obeying the existing traffic signal, zebra-crossing yield, bus-stop service, player-vehicle proximity and same-lane spacing rules. Collision footprints now account for bus, car, auto-rickshaw and bike sizes.

Shop fronts gain lightweight stools, a standing table, produce baskets, sacks and customers/shopkeepers with task or conversation poses. These use the existing lightweight NPC behavior system rather than pathfinding or server AI.

No backend, database, economy, ownership or Supabase migration is required. Traffic remains local ambient simulation and existing server-authoritative player movement/driving rules are unchanged.


## Night Lighting + Monsoon Reflections (V86)

V86 upgrades the High-quality-only world after dark and during rain without changing gameplay rules.

Street lamps now use lightweight real point-light pools in addition to emissive lamp meshes. Each lamp also has a subtle ground glow that strengthens on wet roads. Houses gain warm emissive windows and porch light pools, while roadside shops gain lit signage, warm front lighting and wet-ground glow.

Rain now lowers road roughness further and slightly increases metallic/specular response so the existing high-quality lighting can read on wet asphalt. Puddles become smoother and more reflective as rain builds, while their visibility also reacts to darkness/overcast conditions.

The atmosphere now adjusts ACES exposure gently by daylight and overcast state so night remains readable without flattening monsoon contrast. Moon/hemisphere lighting is also rebalanced for clearer silhouettes at night.

All added local lights keep shadows disabled to preserve mobile performance; the main sun remains the shadow-casting light. No backend, database, economy, traffic-authority or Supabase migration changes are required.


## Living Kerala NPC Routines (V87)

V87 makes ambient villagers react to time of day and monsoon weather instead of repeating the same activity around the clock.

NPCs can now carry lightweight procedural umbrellas when rain begins. Bus-stop waiters, shoppers, phone users, shopkeepers and selected customers can use configured shelter points when rain becomes heavy, while their posture and activity animation become calmer in wet weather.

The village population also changes with time. Selected walkers, social groups, customers and two of the three zebra-crossing pedestrians leave the street late at night, while a smaller number of locals, bus-stop waiters and essential shop activity remain. Walking pace and social/task animation also slow in the evening/night.

Existing zebra-crossing traffic yielding remains tied only to currently visible, actively crossing pedestrians. No pathfinding, server-side NPC AI, backend/database migration, economy change or player movement rule is introduced.


## NPC Interaction + Local Conversations (V88)

V88 makes village NPCs directly interactive while preserving the lightweight local-simulation model.

When the player is on foot and within roughly 3.2 metres of a visible non-crossing villager, the existing world interaction button becomes a **TALK · NAME** action. Home, rest, vehicle service, traffic checkpoint and active-job interactions keep higher priority, so conversations do not block gameplay actions.

Talking makes the NPC pause, face the player and use a short natural greeting/hand gesture. Replies vary by NPC role, including shopkeepers, customers, bus-stop waiters, shoppers, phone users, social locals and general villagers. Dialogue also reacts to time of day and current weather, with rain, heavy-rain, cloudy and night-specific responses.

The interaction is local and cosmetic: it does not add server AI, pathfinding, economy rewards, database writes or Supabase changes. NPC day/night and umbrella/shelter routines from V87 continue immediately after the short conversation ends.


## Kerala Animal + Ambient Life (V89)

V89 adds lightweight animal life to the High-quality Kerala village so the world feels inhabited beyond people and traffic.

The village now includes roadside dogs, chickens, goats and a cow placed away from the main carriageway. Ground animals use small deterministic roaming areas and react when a walking player or moving vehicle approaches by turning and stepping away. Dogs keep a subtle tail motion, chickens peck/flap, and four-legged animals use simple gait animation while moving.

The existing tree birds now remain available on mobile and use low-cost circling/flapping animation in daylight. Birds hide during heavy rain and at night, while chickens, goats and cattle settle out of view late at night. This keeps the world visually active during the day without adding persistent server AI.

Animals are cosmetic ambient actors only: they do not become colliders, do not affect traffic authority, jobs, economy or player movement, and require no backend/database/Supabase migration.


## Kerala Ambient Soundscape (V90)

V90 replaces the normal exploration melody with a more environmental Kerala sound bed while keeping the existing opt-in World Sound setting.

The procedural Web Audio mix now includes two-layer monsoon rain, wind, water ambience, distant road traffic, occasional low-volume vehicle/horn cues, shop/street murmur, daytime bird calls and night crickets. Traffic ambience strengthens near the main/side roads, while shop activity becomes more audible near the two village shop areas.

The mix reacts continuously to daylight, hour, rain and overcast conditions. Rain masks street activity naturally, night reduces traffic/shop ambience and increases crickets, and heavy rain uses a fuller body+hiss texture. Challenge mode retains its short synthesized music sequence, but ordinary exploration is now environment-first.

No downloaded audio assets are required. The whole soundscape is generated locally with a shared noise source, filters and short oscillators, and remains disabled until the player explicitly turns World Sound on.


## Dynamic Wind + Vegetation Motion (V91)

V91 makes the High-quality Kerala world react visibly to wind and monsoon weather instead of leaving vegetation and overhead wires static.

Coconut-palm fronds now sway gently in clear weather and move more strongly as overcast/rain builds. Broadleaf tree canopies use subtle independent motion, banana leaves gain layered sway/flutter, and the instanced roadside grass field bends in gusts while remaining a single efficient draw-call structure.

Utility wires now use small dynamic vertex offsets between pole anchors, so they move slightly in gusts without detaching from the poles. The wind model is driven by the existing shared rain/overcast state and combines slow sway with short gust variation.

The vegetation/wire animation pass is throttled to roughly 12.5 updates per second rather than running full geometry/matrix updates every render frame, keeping the effect practical on mobile while preserving the always-High graphics policy.

No backend, database, traffic, economy, ownership, collision or Supabase changes are required.


## Monsoon Water Physics Visuals (V92)

V92 deepens the monsoon presentation with lightweight water movement tied to the existing shared rain state.

Road puddles now generate animated expanding ripple rings while rain is active. The roadside drainage channels gain visible water surfaces that fade in and become smoother/more reflective as rainfall increases. Kerala house downpipes also gain small runoff jets at their outlet shoes so the V84 gutter detail visibly carries rainwater.

Vehicle tyre spray is denser and travels farther at higher speed and heavier rain, giving wet-road driving a more convincing wake without changing traction, braking or server-authoritative vehicle behavior.

All water motion is cosmetic and locally rendered. The puddle/drain/runoff update pass is throttled to reduce mobile cost, and no fluid simulation, gameplay collision, backend, database, economy or Supabase changes are introduced.
