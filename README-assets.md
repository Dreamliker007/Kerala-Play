# Visuals and audio

The current village uses locally generated Three.js geometry: male/female avatars, coconut palms, buildings, roads, vehicles, birds, water, and landmarks. Avatar walking is a procedural limb animation. Ground detail is a generated canvas texture. There are no external photo assets and no glTF/GLB model loader in this version.

`environment.js` adds a shared 24-minute day, dawn, evening, and night cycle based on the device's UTC clock. Devices with correctly set clocks see the same phase. Its sky uses changing colors, distance fog, a sun and moon, and instanced clouds and stars on Balanced/High graphics. Low graphics omits clouds and stars. High adds directional shadows near the camera; daylight and moonlight keep the world readable on every setting. These are stylized procedural visuals, not photorealistic assets.

Sound is generated with Web Audio only after the player enables it: daytime bird calls, night insects, nearby water, wind, and gentle musical patterns that change during movement, running, and a challenge. It pauses while the tab is hidden. Only sound and graphics preferences are stored by this module. Recorded messages and live voice are separate features.

## Completing the realistic asset phase

The project still needs authored and licensed realistic models, textures, and animation clips. A future asset integration should include:

| Asset | Expected content |
| --- | --- |
| Male and female avatars | Rigged GLB characters with matching Idle, Walk, and Run clips; consistent scale and forward direction |
| Vehicles | Kerala-appropriate car, bus, and auto-rickshaw models with separate wheels |
| Environment | Houses, coconut palms, roadside props, and landmarks with low-detail variants |
| Materials and sky | Optimized PBR texture sets and a licensed environment map, with mobile fallbacks |

Add a local GLTFLoader compatible with the bundled Three.js version, then connect avatar clips through AnimationMixer and preserve the current world position/profile identifiers. Keep the procedural models as loading/error fallbacks. Repeated static props should share geometry/materials or use instancing; release animation mixers, geometries, textures, and materials when models are removed. Record each asset's source, author, license, attribution requirement, and redistribution permission before including it in the project.

No unprovided models are silently downloaded, and adding GLB files alone will not load them until that integration exists.
