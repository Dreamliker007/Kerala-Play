// A shared visual clock and opt-in soundscape. No downloaded audio or visual assets.
const DAY_LENGTH_MS = 24 * 60 * 1000;
const PREFERENCE_KEY = 'kerala-play:environment:v1';

function readPreferences() {
  try { return JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}') || {}; }
  catch { return {}; }
}

/** Environment controller; time is game elapsed time, while the sky uses UTC epoch time. */
export function createAtmosphere(THREE, { scene, renderer, camera, sun, hemi }) {
  const preferences = readPreferences();
  const quality = 'high';
  const mobileLike = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
  let performanceScale = mobileLike ? .90 : 1;
  let disposed = false;
  let lastHudMinute = -1;
  let lastHudWeather = '';
  let materialTimer = 1;
  let currentWeather = { daylight: 1, hour: 12, rain: 0, overcast: 0, weather: 'Clear', needsLights: false };
  let audioEnabled = false;
  let soundscape = null;
  const disposables = [];
  const originalRenderer = { toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, shadows: renderer.shadowMap.enabled, shadowType: renderer.shadowMap.type, pixelRatio: renderer.getPixelRatio() };
  const shadowObjects = [];
  const texturedMaterials = new Set();
  const unlitMaterials = new Map();
  const emissiveMaterials = new Map();
  const seenMaterials = new Set();
  scene.traverse(object => {
    if (!object.isMesh && !object.isSprite) return;
    if (object.isMesh) {
      shadowObjects.push({ object, cast: object.castShadow, receive: object.receiveShadow });
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const opaque = materials.every(material => !material.transparent && !material.wireframe);
      object.castShadow = opaque && (object.geometry?.type !== 'PlaneGeometry' || object.isInstancedMesh);
      object.receiveShadow = opaque;
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material || seenMaterials.has(material)) continue;
      seenMaterials.add(material);
      // Tint unlit photo assets gently at night; labels created later remain legible.
      if (material.map) texturedMaterials.add(material);
      if (material.color && material.map && (material.isMeshBasicMaterial || material.isSpriteMaterial)) {
        unlitMaterials.set(material, material.color.clone());
      }
      if (material.emissive && material.emissive.getHex() !== 0) {
        emissiveMaterials.set(material, material.emissiveIntensity);
      }
    }
  });
  const sky = new THREE.Group();
  sky.name = 'Shared world atmosphere';
  scene.add(sky);
  const sphereGeometry = new THREE.SphereGeometry(1, 14, 10);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffefd0, fog: false, toneMapped: false, depthWrite: false });
  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xc8d9f2, fog: false, depthWrite: false });
  const sunDisc = new THREE.Mesh(sphereGeometry, sunMaterial);
  const moonDisc = new THREE.Mesh(sphereGeometry, moonMaterial);
  sunDisc.scale.setScalar(3.2);
  moonDisc.scale.setScalar(1.7);
  sky.add(sunDisc, moonDisc);
  disposables.push(sphereGeometry, sunMaterial, moonMaterial);

  // One draw call for the star field; positions never allocate in the render loop.
  let seed = 72019;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const starPositions = new Float32Array(220 * 3);
  for (let index = 0; index < starPositions.length; index += 3) {
    const azimuth = random() * Math.PI * 2;
    const elevation = .08 + random() * .92;
    const horizontal = Math.sqrt(1 - elevation * elevation);
    starPositions[index] = Math.cos(azimuth) * horizontal * 135;
    starPositions[index + 1] = elevation * 135;
    starPositions[index + 2] = Math.sin(azimuth) * horizontal * 135;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xe4efff, size: .3, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  sky.add(stars);
  disposables.push(starGeometry, starMaterial);

  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xf1f0ec, transparent: true, opacity: .58, depthWrite: false, fog: false });
  const maxClouds = 30;
  const clouds = new THREE.InstancedMesh(sphereGeometry, cloudMaterial, maxClouds);
  const cloudTransform = new THREE.Object3D();
  for (let index = 0; index < maxClouds; index++) {
    const group = Math.floor(index / 3);
    const angle = group / 10 * Math.PI * 2;
    cloudTransform.position.set(Math.cos(angle) * (70 + group * 2.8) + (index % 3 - 1) * 5, 22 + group % 3 * 4, Math.sin(angle) * (70 + group * 2.8));
    cloudTransform.scale.set(7 + random() * 3, 1.4 + random(), 3.8 + random() * 2);
    cloudTransform.updateMatrix();
    clouds.setMatrixAt(index, cloudTransform.matrix);
  }
  clouds.frustumCulled = false;
  clouds.instanceMatrix.needsUpdate = true;
  sky.add(clouds);
  disposables.push(cloudMaterial);

  // Lightweight local rain field. A single LineSegments draw call follows the camera.
  const maxRainDrops = 620;
  const rainPositions = new Float32Array(maxRainDrops * 6);
  const rainDrops = [];
  for (let index = 0; index < maxRainDrops; index++) {
    rainDrops.push({
      x: (random() - .5) * 42,
      y: 2 + random() * 25,
      z: (random() - .5) * 42,
      speed: 14 + random() * 11,
    });
  }
  const rainGeometry = new THREE.BufferGeometry();
  const rainAttribute = new THREE.BufferAttribute(rainPositions, 3);
  rainAttribute.setUsage(THREE.DynamicDrawUsage);
  rainGeometry.setAttribute('position', rainAttribute);
  const rainMaterial = new THREE.LineBasicMaterial({
    color: 0xc9def0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: true,
  });
  const rainField = new THREE.LineSegments(rainGeometry, rainMaterial);
  rainField.name = 'Local rain field';
  rainField.frustumCulled = false;
  rainField.visible = false;
  scene.add(rainField);
  disposables.push(rainGeometry, rainMaterial);

  const moonLight = new THREE.DirectionalLight(0x8cacff, .35);
  const lightningLight = new THREE.DirectionalLight(0xe6f3ff, 0);
  lightningLight.castShadow = false;
  scene.add(moonLight, moonLight.target, lightningLight, lightningLight.target);
  const originalSun = sun ? {
    intensity: sun.intensity, color: sun.color.clone(), position: sun.position.clone(), castShadow: sun.castShadow,
    targetPosition: sun.target.position.clone(), targetParent: sun.target.parent,
    shadow: sun.shadow ? { camera: sun.shadow.camera.clone(), size: sun.shadow.mapSize.clone(), bias: sun.shadow.bias, normalBias: sun.shadow.normalBias } : null
  } : null;
  const originalHemi = hemi ? { intensity: hemi.intensity, color: hemi.color.clone(), groundColor: hemi.groundColor.clone() } : null;
  const originalBackground = scene.background?.clone ? scene.background.clone() : scene.background;
  const originalFog = scene.fog?.clone ? scene.fog.clone() : scene.fog;
  if (!scene.background?.isColor) scene.background = new THREE.Color();
  if (!scene.fog?.isFog) scene.fog = new THREE.Fog(0x92c9ff, 50, 150);
  if (sun?.shadow) {
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.camera.near = .1;
    sun.shadow.camera.far = 130;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -.00035;
    sun.shadow.normalBias = .08;
    sun.shadow.mapSize.set(1024, 1024);
    if (!sun.target.parent) scene.add(sun.target);
  }
  const daySky = new THREE.Color(0x97ccee);
  const nightSky = new THREE.Color(0x172943);
  const duskSky = new THREE.Color(0xb98278);
  const daylightColor = new THREE.Color(0xeaf5ff);
  const nightLightColor = new THREE.Color(0xa9c6ef);
  const warmColor = new THREE.Color(0xffc797);
  const whiteColor = new THREE.Color(0xfff2d9);
  const groundDay = new THREE.Color(0x647d42);
  const groundNight = new THREE.Color(0x3b4b55);
  const rainSky = new THREE.Color(0x647682);
  const stormCloud = new THREE.Color(0x77828a);
  const lightningColor = new THREE.Color(0xe6f3ff);
  const lightDirection = new THREE.Vector3();
  const target = new THREE.Vector3();

  const style = document.createElement('style');
  style.textContent = `
    #world-time {
      position:fixed; z-index:5;
      top:calc(env(safe-area-inset-top) + 8px); left:50%; transform:translateX(-50%);
      border:1px solid rgba(255,255,255,.10); border-radius:999px;
      padding:4px 7px; background:rgba(7,18,28,.48); color:#eef8ff;
      box-shadow:0 4px 12px rgba(0,0,0,.08);
      backdrop-filter:blur(9px) saturate(1.06); -webkit-backdrop-filter:blur(9px) saturate(1.06);
      font:700 8px/1.25 system-ui,sans-serif; pointer-events:none; white-space:nowrap;
    }
    #world-settings {
      display:none; position:fixed; z-index:12;
      top:calc(env(safe-area-inset-top) + 64px); right:18px;
      width:min(268px,calc(100vw - 36px)); padding:12px;
      border:1px solid rgba(255,255,255,.14); border-radius:18px;
      background:rgba(7,18,28,.96); color:#fff;
      box-shadow:0 22px 58px rgba(0,0,0,.38);
      backdrop-filter:blur(20px) saturate(1.15); -webkit-backdrop-filter:blur(20px) saturate(1.15);
      font:12px/1.35 system-ui,sans-serif; pointer-events:auto; touch-action:manipulation;
    }
    #world-settings.open { display:grid; gap:9px; }
    .world-settings-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:1px 1px 4px; }
    .world-settings-head strong { font-size:14px; letter-spacing:.15px; }
    #world-settings-close {
      width:30px; height:30px; border:0; border-radius:10px;
      background:rgba(255,255,255,.08); color:#fff; font:800 17px/1 system-ui,sans-serif; cursor:pointer;
    }
    .world-setting-row {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      min-height:44px; padding:8px 10px;
      border:1px solid rgba(255,255,255,.09); border-radius:13px; background:rgba(255,255,255,.045);
    }
    .world-setting-row > span { color:rgba(235,247,250,.76); font-weight:700; }
    #world-settings button,#world-settings select {
      min-height:32px; border:1px solid rgba(255,255,255,.14); border-radius:9px;
      padding:6px 9px; background:rgba(26,55,65,.92); color:#fff; font:inherit;
      touch-action:manipulation; cursor:pointer;
    }
    #world-settings button[aria-pressed="true"] { background:#247a54; }
    #world-settings :focus-visible { outline:2px solid #9be7c1; outline-offset:2px; }
    #world-quality-fixed { min-width:96px; text-align:right; color:#bff7d7; font-weight:900; letter-spacing:.25px; }
    .settings-fullscreen { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:800!important; }
    #world-audio-status { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
    @media(max-width:979px) {
      #world-time { top:calc(env(safe-area-inset-top) + 34px); left:auto; right:10px; transform:none; }
      #world-settings { top:calc(env(safe-area-inset-top) + 56px); right:10px; }
    }
    @media (orientation:landscape) and (max-height:560px) and (hover:none) and (pointer:coarse) {
      #world-time { top:calc(env(safe-area-inset-top) + 31px); right:calc(env(safe-area-inset-right) + 8px); padding:3px 5px; font-size:7px; }
      #world-settings { top:calc(env(safe-area-inset-top) + 53px); right:calc(env(safe-area-inset-right) + 10px); width:236px; max-height:calc(100dvh - 64px); overflow:auto; padding:10px; }
      .world-setting-row { min-height:39px; padding:6px 8px; }
    }
  `;
  document.head.append(style);
  const clockOutput = document.createElement('output');
  clockOutput.id = 'world-time';
  clockOutput.title = 'Shared world time · one full day every 24 real minutes · based on device UTC clock';
  clockOutput.setAttribute('aria-label', 'World time');

  const settings = document.createElement('div');
  settings.id = 'world-settings';
  settings.setAttribute('aria-label', 'Game settings');
  settings.innerHTML = '<div class="world-settings-head"><strong>Settings</strong><button type="button" id="world-settings-close" aria-label="Close settings">×</button></div><label class="world-setting-row"><span>World sound</span><button type="button" id="world-sound" aria-pressed="false">Off</button></label><div class="world-setting-row"><span>Graphics</span><strong id="world-quality-fixed">HIGH QUALITY</strong></div><div class="world-setting-row"><span>Version</span><strong>1.0.18 · V119.0</strong></div><button type="button" id="blocked-accounts" class="settings-fullscreen">Blocked accounts</button><output id="world-audio-status" role="status"></output>';

  const quickActions = document.querySelector('#quick-actions');
  const settingsToggle = document.createElement('button');
  settingsToggle.id = 'settings-toggle';
  settingsToggle.className = 'hud-icon';
  settingsToggle.type = 'button';
  settingsToggle.setAttribute('aria-label', 'Open settings');
  settingsToggle.setAttribute('aria-controls', 'world-settings');
  settingsToggle.setAttribute('aria-expanded', 'false');
  settingsToggle.innerHTML = '⚙<span>SETTINGS</span>';
  quickActions?.append(settingsToggle);

  const fullscreenButton = document.querySelector('#fullscreen-toggle');
  if (fullscreenButton) {
    fullscreenButton.classList.remove('hud-icon');
    fullscreenButton.classList.add('settings-fullscreen');
    fullscreenButton.innerHTML = '⛶ <span>Fullscreen</span>';
    settings.append(fullscreenButton);
  }

  (document.querySelector('#hud') || document.body).append(clockOutput, settings);
  const soundButton = settings.querySelector('#world-sound');
  const audioStatus = settings.querySelector('#world-audio-status');
  const settingsClose = settings.querySelector('#world-settings-close');
  const blockedAccounts = settings.querySelector('#blocked-accounts');

  function setSettingsOpen(open) {
    const next = !!open;
    settings.classList.toggle('open', next);
    settingsToggle.setAttribute('aria-expanded', String(next));
  }
  settingsToggle.addEventListener('click', () => setSettingsOpen(!settings.classList.contains('open')));
  settingsClose.addEventListener('click', () => setSettingsOpen(false));
  blockedAccounts.addEventListener('click', () => {
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent('kerala-open-blocked'));
  });
  settings.addEventListener('pointerdown', event => event.stopPropagation());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setSettingsOpen(false); });

  if (preferences.sound) soundButton.textContent = 'Resume';
  soundButton.title = 'Enable birds, water, night insects, and gentle music';

  function savePreferences() {
    try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ quality: 'high', sound: audioEnabled })); } catch { /* Storage can be unavailable in private mode. */ }
  }
  function applyPerformanceScale() {
    const deviceRatio = devicePixelRatio || 1;
    const mobileCap = Math.max(1.12, 1.78 * performanceScale);
    renderer.setPixelRatio(Math.min(deviceRatio, mobileLike ? mobileCap : 2));
    renderer.setSize(innerWidth, innerHeight, false);
  }

  function setPerformanceScale(nextScale = 1) {
    if (disposed) return;
    performanceScale = THREE.MathUtils.clamp(Number(nextScale) || 1, mobileLike ? .64 : .85, 1);
    applyPerformanceScale();
  }

  function applyQuality() {
    applyPerformanceScale();
    // "High quality" remains the only user-facing preset. On mobile we keep all
    // lighting/weather/material detail but use contact shadows instead of a full
    // scene shadow map, which removes one of the largest GPU stalls.
    renderer.shadowMap.enabled = !mobileLike;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = !mobileLike;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.20;

    const anisotropyCap = mobileLike ? 4 : 8;
    const anisotropy = Math.max(1, Math.min(renderer.capabilities.getMaxAnisotropy?.() || 1, anisotropyCap));
    scene.traverse(object => {
      if (!object.isMesh && !object.isSprite) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (object.isMesh) {
        const opaque = materials.every(material => material && !material.transparent && !material.wireframe);
        object.castShadow = opaque && (object.geometry?.type !== 'PlaneGeometry' || object.isInstancedMesh);
        object.receiveShadow = opaque;
      }
      for (const material of materials) {
        if (!material) continue;
        material.dithering = true;
        if (material.map) {
          texturedMaterials.add(material);
          material.map.anisotropy = anisotropy;
          material.map.needsUpdate = true;
        }
      }
    });

    if (sun) {
      sun.castShadow = !mobileLike;
      if (!mobileLike && sun.shadow && (sun.shadow.mapSize.x !== 2048 || sun.shadow.mapSize.y !== 2048)) {
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.map?.dispose?.();
        sun.shadow.map = null;
      }
    }
    stars.visible = true;
    clouds.count = mobileLike ? 24 : 30;
    clouds.visible = true;
    rainGeometry.setDrawRange(0, (mobileLike ? 520 : 620) * 2);
    rainMaterial.opacity = Math.min(rainMaterial.opacity, .72);
  }
  function setQuality() {
    if (disposed) return;
    applyQuality();
  }
  async function toggleSound() {
    if (disposed) return;
    soundButton.disabled = true;
    try {
      if (audioEnabled) {
        audioEnabled = false;
        await soundscape?.suspend();
      } else {
        soundscape ||= createSoundscape();
        await soundscape.resume();
        if (disposed) { await soundscape.dispose(); return; }
        audioEnabled = true;
        if (document.hidden) await soundscape.suspend();
      }
      audioStatus.textContent = audioEnabled ? 'World sound enabled.' : 'World sound muted.';
    } catch {
      audioEnabled = false;
      audioStatus.textContent = 'Sound could not start. Tap Sound off to try again.';
    } finally {
      soundButton.textContent = audioEnabled ? 'On' : 'Off';
      soundButton.setAttribute('aria-pressed', String(audioEnabled));
      soundButton.disabled = false;
      savePreferences();
    }
  }
  soundButton.addEventListener('click', toggleSound);
  async function visibilityChanged() {
    if (!soundscape || !audioEnabled) return;
    try {
      if (document.hidden) await soundscape.suspend();
      else {
        await soundscape.resume();
        if (document.hidden) await soundscape.suspend();
      }
    } catch {
      audioEnabled = false;
      soundButton.textContent = 'Resume';
      soundButton.setAttribute('aria-pressed', 'false');
    }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  applyQuality();

  function update(delta, time, { moving = false, running = false, nearWater = false, inChallenge = false } = {}) {
    if (disposed) return currentWeather;
    const worldMinute = ((Date.now() % DAY_LENGTH_MS) + DAY_LENGTH_MS) % DAY_LENGTH_MS / 1000;
    const hour = worldMinute / 60;
    const angle = (hour - 6) / 24 * Math.PI * 2;
    const elevation = Math.sin(angle);
    const daylight = THREE.MathUtils.smoothstep(elevation, -.15, .28);
    const twilight = Math.max(0, 1 - Math.abs(elevation) / .42) * .58;

    // Deterministic shared monsoon cycle: roughly one rain band every five real minutes.
    const weatherPhase = ((worldMinute + 41) % 300) / 300;
    const cloudBuild = THREE.MathUtils.smoothstep(weatherPhase, .10, .27)
      * (1 - THREE.MathUtils.smoothstep(weatherPhase, .76, .92));
    const rainRise = THREE.MathUtils.smoothstep(weatherPhase, .26, .36);
    const rainFall = 1 - THREE.MathUtils.smoothstep(weatherPhase, .60, .74);
    const rain = THREE.MathUtils.clamp(rainRise * rainFall, 0, 1);
    const overcast = THREE.MathUtils.clamp(Math.max(rain * .95, cloudBuild * .62), 0, 1);
    const weather = rain > .68 ? 'Heavy rain' : rain > .12 ? 'Rain' : overcast > .30 ? 'Cloudy' : 'Clear';
    const needsLights = daylight < .38 || overcast > .58;

    // Two deterministic strike windows per real minute while the shared
    // weather cycle is in heavy-rain territory. Each strike uses a quick
    // double flash instead of a constant strobe.
    const stormTime = worldMinute + 13;
    const stormBlock = Math.floor(stormTime / 60);
    const stormClock = ((stormTime % 60) + 60) % 60;
    const strikeTimes = [7.4, 34.8];
    let lightning = 0;
    let lightningStrikeId = null;
    if (rain > .68 && overcast > .70) {
      for (let strikeIndex = 0; strikeIndex < strikeTimes.length; strikeIndex++) {
        const elapsed = stormClock - strikeTimes[strikeIndex];
        if (elapsed < 0 || elapsed > .38) continue;
        const firstFlash = elapsed < .11 ? 1 - elapsed / .11 : 0;
        const secondElapsed = elapsed - .18;
        const secondFlash = secondElapsed >= 0 && secondElapsed < .14
          ? .62 * (1 - secondElapsed / .14)
          : 0;
        lightning = Math.max(lightning, firstFlash, secondFlash);
        lightningStrikeId = stormBlock * strikeTimes.length + strikeIndex;
      }
    }

    currentWeather = { daylight, hour, rain, overcast, weather, needsLights, lightning };

    // High-quality exposure follows the world state instead of using one fixed
    // value. Nights stay readable while monsoon scenes retain contrast.
    const nightLift = (1 - daylight) * .10;
    const stormPull = overcast * .055;
    renderer.toneMappingExposure = THREE.MathUtils.clamp(1.18 + nightLift - stormPull + lightning * .10, 1.10, 1.36);

    scene.background.copy(nightSky).lerp(daySky, daylight).lerp(duskSky, twilight).lerp(rainSky, overcast * .58);
    if (lightning > 0) scene.background.lerp(lightningColor, lightning * .34);
    scene.fog.color.copy(scene.background);
    scene.fog.near = 48 + daylight * 14 - overcast * 10;
    scene.fog.far = 138 + daylight * 34 - overcast * 48;
    sky.position.copy(camera.position);
    lightDirection.set(Math.cos(angle) * .84, elevation, Math.cos(angle) * .54).normalize();
    sunDisc.position.copy(lightDirection).multiplyScalar(120);
    moonDisc.position.copy(lightDirection).multiplyScalar(-120);
    sunDisc.visible = elevation > -.08;
    moonDisc.visible = elevation < .08;
    starMaterial.opacity = (1 - daylight) * .88 * (1 - overcast);
    clouds.visible = true;
    clouds.rotation.y = worldMinute / 1440 * Math.PI * 2 + time * .002 * (1 + overcast * 1.8);
    cloudMaterial.opacity = .45 + overcast * .43;
    cloudMaterial.color.copy(nightLightColor).lerp(whiteColor, daylight).lerp(warmColor, twilight).lerp(stormCloud, overcast * .76).multiplyScalar(.35 + daylight * .65);
    if (lightning > 0) cloudMaterial.color.lerp(lightningColor, lightning * .72);

    const rainLimit = 620;
    rainField.visible = rain > .035;
    rainMaterial.opacity = rain * .72;
    rainField.position.set(camera.position.x, 0, camera.position.z);
    if (rainField.visible) {
      const wind = .75 + overcast * 1.3;
      for (let index = 0; index < rainLimit; index++) {
        const drop = rainDrops[index];
        drop.y -= drop.speed * delta * (.65 + rain * .72);
        drop.x -= wind * delta;
        if (drop.y < .2) {
          drop.y = 19 + random() * 10;
          drop.x = (random() - .5) * 42;
          drop.z = (random() - .5) * 42;
        }
        const offset = index * 6;
        rainPositions[offset] = drop.x;
        rainPositions[offset + 1] = drop.y;
        rainPositions[offset + 2] = drop.z;
        rainPositions[offset + 3] = drop.x - .10 - wind * .025;
        rainPositions[offset + 4] = drop.y - (.55 + rain * .38);
        rainPositions[offset + 5] = drop.z + .03;
      }
      rainAttribute.needsUpdate = true;
    }

    target.set(camera.position.x, 0, camera.position.z);
    lightningLight.intensity = lightning * (2.4 + overcast * 2.0);
    lightningLight.position.set(target.x + 34, 48, target.z - 26);
    lightningLight.target.position.copy(target);
    if (sun) {
      sun.color.copy(whiteColor).lerp(warmColor, twilight);
      sun.intensity = (Math.max(0, elevation) * 1.7 + daylight * .28) * (1 - overcast * .62);
      sun.position.copy(target).addScaledVector(lightDirection, 75);
      // Keep its shadow camera above ground while the light fades out at the horizon.
      sun.position.y = Math.max(8, sun.position.y);
      sun.target.position.copy(target);
    }
    if (hemi) {
      hemi.intensity = (.78 + daylight * 1.38) * (1 - overcast * .26) + lightning * .78;
      hemi.color.copy(nightLightColor).lerp(daylightColor, daylight).lerp(rainSky, overcast * .40);
      if (lightning > 0) hemi.color.lerp(lightningColor, lightning * .62);
      hemi.groundColor.copy(groundNight).lerp(groundDay, daylight);
    }
    moonLight.intensity = (1 - daylight) * .66 * (1 - overcast * .38) + overcast * (1 - daylight) * .08;
    moonLight.position.copy(target).addScaledVector(lightDirection, -70);
    moonLight.position.y = Math.max(15, moonLight.position.y);
    moonLight.target.position.copy(target);
    materialTimer += delta;
    if (materialTimer >= .4) {
      materialTimer = 0;
      for (const [material, color] of unlitMaterials) material.color.copy(color).multiplyScalar(.5 + daylight * .5 - overcast * .08);
      for (const [material, intensity] of emissiveMaterials) material.emissiveIntensity = intensity + Math.max(1 - daylight, overcast * .72) * .65;
    }
    const minute = Math.floor(worldMinute);
    if (minute !== lastHudMinute || weather !== lastHudWeather) {
      lastHudMinute = minute;
      lastHudWeather = weather;
      const period = hour < 5 || hour >= 19 ? 'Night' : hour < 8 ? 'Dawn' : hour < 16.5 ? 'Day' : 'Evening';
      const icon = rain > .12 ? '☂' : overcast > .30 ? '☁' : period === 'Night' ? '☾' : period === 'Day' ? '☀' : '◐';
      const weatherText = weather === 'Clear' ? '' : ` · ${weather}`;
      clockOutput.textContent = `${icon} ${period}${weatherText} · ${String(Math.floor(hour)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    }
    if (audioEnabled && !document.hidden) {
      // Match the expanded physical road network so traffic ambience follows
      // State Road, Village Link, Market Road and Station Road.
      const roadProximity = Math.max(
        Math.max(0, 1 - Math.abs(camera.position.x) / 34),
        Math.max(0, 1 - Math.abs(camera.position.z + 22) / 30),
        camera.position.x >= -18 && camera.position.x <= 48 ? Math.max(0, 1 - Math.abs(camera.position.z - 22) / 22) : 0,
        camera.position.z >= -34 && camera.position.z <= 22 ? Math.max(0, 1 - Math.abs(camera.position.x + 42) / 22) : 0,
      );
      const firstShopDistance = Math.hypot(camera.position.x + 14.4, camera.position.z - 7.5);
      const secondShopDistance = Math.hypot(camera.position.x - 14.8, camera.position.z - 38.5);
      const townProximity = Math.max(0, 1 - Math.min(firstShopDistance, secondShopDistance) / 28);
      soundscape?.update({
        daylight,
        hour,
        rain,
        overcast,
        moving,
        running,
        nearWater,
        inChallenge,
        roadProximity,
        townProximity,
        lightning,
        lightningStrikeId,
      });
    }
    return currentWeather;
  }
  update(0, 0);

  function dispose() {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('visibilitychange', visibilityChanged);
    soundscape?.dispose();
    if (fullscreenButton && quickActions) {
      fullscreenButton.classList.remove('settings-fullscreen');
      fullscreenButton.classList.add('hud-icon');
      fullscreenButton.innerHTML = '⛶<span>FULL</span>';
      quickActions.append(fullscreenButton);
    }
    settingsToggle.remove(); settings.remove(); clockOutput.remove(); style.remove();
    scene.remove(sky, rainField, moonLight, moonLight.target, lightningLight, lightningLight.target);
    for (const item of disposables) item.dispose();
    for (const { object, cast, receive } of shadowObjects) { object.castShadow = cast; object.receiveShadow = receive; }
    for (const [material, color] of unlitMaterials) material.color.copy(color);
    for (const [material, intensity] of emissiveMaterials) material.emissiveIntensity = intensity;
    renderer.toneMapping = originalRenderer.toneMapping;
    renderer.toneMappingExposure = originalRenderer.exposure;
    renderer.shadowMap.enabled = originalRenderer.shadows;
    renderer.shadowMap.type = originalRenderer.shadowType;
    renderer.setPixelRatio(originalRenderer.pixelRatio);
    scene.background = originalBackground;
    scene.fog = originalFog;
    if (sun && originalSun) {
      sun.intensity = originalSun.intensity;
      sun.color.copy(originalSun.color);
      sun.position.copy(originalSun.position);
      sun.castShadow = originalSun.castShadow;
      sun.target.position.copy(originalSun.targetPosition);
      if (!originalSun.targetParent) scene.remove(sun.target);
      if (sun.shadow && originalSun.shadow) {
        sun.shadow.camera.copy(originalSun.shadow.camera);
        sun.shadow.mapSize.copy(originalSun.shadow.size);
        sun.shadow.bias = originalSun.shadow.bias;
        sun.shadow.normalBias = originalSun.shadow.normalBias;
      }
    }
    if (hemi && originalHemi) { hemi.intensity = originalHemi.intensity; hemi.color.copy(originalHemi.color); hemi.groundColor.copy(originalHemi.groundColor); }
  }
  return {
    update,
    dispose,
    setQuality,
    applyQuality,
    setPerformanceScale,
    getState: () => ({ ...currentWeather }),
    get quality() { return quality; },
  };
}

function createSoundscape() {
  // Keep the opt-in ambience deliberately small. The previous procedural
  // soundscape built a large buffer plus eight live filters in the tap event;
  // that can stall some Android WebViews while the game is rendering.
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Web Audio is unavailable');
  const context = new AudioContext({ latencyHint: 'interactive' });
  const master = context.createGain();
  master.gain.value = .12;
  master.connect(context.destination);
  let closed = false;
  let nextCue = 0;

  function chirp(frequency, duration, volume, type = 'sine') {
    if (closed || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * .78), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  function update({ daylight = 1, rain = 0, nearWater = false, moving = false, lightning = 0 }) {
    if (closed || context.state !== 'running' || context.currentTime < nextCue) return;
    if (lightning > .7) {
      chirp(76, .42, .025, 'triangle');
      nextCue = context.currentTime + 5;
    } else if (rain > .35) {
      // A soft rain cue, not a continuously running noisy audio graph.
      chirp(340 + rain * 100, .12, .012, 'sine');
      nextCue = context.currentTime + 4.5;
    } else if (daylight > .35) {
      chirp(1450 + Math.random() * 420, .11, .018, 'sine');
      nextCue = context.currentTime + 5 + Math.random() * 3;
    } else if (nearWater || moving) {
      chirp(240, .16, .009, 'triangle');
      nextCue = context.currentTime + 5;
    } else {
      nextCue = context.currentTime + 3;
    }
  }

  async function resume() {
    if (closed) return;
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio awaits a user gesture');
    nextCue = context.currentTime + .7;
  }
  async function suspend() { if (!closed && context.state !== 'closed') await context.suspend(); }
  async function dispose() { if (!closed) { closed = true; master.disconnect(); await context.close().catch(() => {}); } }
  return { update, resume, suspend, dispose };
}

/* Legacy full procedural soundscape retained below only for reference. */
function createSoundscapeLegacy() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Web Audio is unavailable');
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = .23;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -20;
  limiter.ratio.value = 4;
  master.connect(limiter).connect(context.destination);

  // One looping procedural noise source feeds several filtered ambience buses.
  // This avoids downloaded audio assets and keeps mobile memory/network cost low.
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let smoothed = 0;
  for (let index = 0; index < noiseData.length; index++) {
    smoothed = (smoothed + Math.random() * .08 - .04) / 1.02;
    noiseData[index] = smoothed * 4;
  }
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  function filteredNoise(type, frequency, q = .7) {
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = context.createGain();
    gain.gain.value = 0;
    noise.connect(filter).connect(gain).connect(master);
    return { filter, gain };
  }

  const water = filteredNoise('bandpass', 850, .6);
  const wind = filteredNoise('lowpass', 330, .5);
  const rainBody = filteredNoise('bandpass', 1050, .52);
  const rainHiss = filteredNoise('highpass', 2300, .45);
  const trafficHum = filteredNoise('lowpass', 145, .7);
  const streetMurmur = filteredNoise('bandpass', 520, .85);
  const nightBed = filteredNoise('bandpass', 3300, 1.4);
  const thunder = filteredNoise('lowpass', 190, .55);
  noise.start();

  const active = new Set();
  let nextBird = 0;
  let nextCricket = 0;
  let nextStreetBeat = 0;
  let nextTrafficCue = 0;
  let nextChallengeNote = 0;
  let lastThunderStrikeId = null;
  let sequence = 0;
  let closed = false;

  function note(frequency, duration, volume, delay = 0, endFrequency = frequency, type = 'sine') {
    if (closed || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(master);
    active.add(oscillator);
    oscillator.onended = () => {
      active.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function birdCall(daylight, rain) {
    const pitch = 1750 + Math.random() * 1250;
    const volume = .055 * daylight * (1 - rain);
    note(pitch, .12, volume, 0, pitch * 1.28);
    note(pitch * 1.16, .13, volume * .76, .14, pitch * .88);
    if (Math.random() > .56) note(pitch * .92, .11, volume * .62, .30, pitch * 1.18);
  }

  function cricketChirp(level) {
    for (let count = 0; count < 3; count++) {
      note(3700 + count * 75, .065, .032 * level, count * .115, 3520 + count * 70);
    }
  }

  function streetPulse(level) {
    const base = 160 + Math.random() * 90;
    note(base, .22, .013 * level, 0, base * .94, 'triangle');
    note(base * 1.65, .16, .008 * level, .08, base * 1.52, 'sine');
  }

  function trafficCue(level) {
    const pitch = 90 + Math.random() * 42;
    note(pitch, .48, .026 * level, 0, pitch * .72, 'sawtooth');
    if (Math.random() > .78) {
      // Rare, quiet distant horn rather than a frequent arcade-style sound.
      note(410 + Math.random() * 70, .12, .022 * level, .12, 390, 'square');
    }
  }

  function thunderClap(strikeId, strength) {
    if (closed || context.state !== 'running') return;
    const distanceSeed = Math.abs(Math.sin((Number(strikeId) + 1) * 12.9898) * 43758.5453) % 1;
    const delay = .85 + distanceSeed * 1.65;
    const start = context.currentTime + delay;
    const peak = .085 + strength * .075;

    thunder.filter.frequency.setValueAtTime(210, start);
    thunder.filter.frequency.exponentialRampToValueAtTime(95, start + 2.7);
    thunder.gain.gain.cancelScheduledValues(start);
    thunder.gain.gain.setValueAtTime(.0001, start);
    thunder.gain.gain.exponentialRampToValueAtTime(Math.max(.001, peak), start + .08);
    thunder.gain.gain.exponentialRampToValueAtTime(Math.max(.001, peak * .34), start + .72);
    thunder.gain.gain.exponentialRampToValueAtTime(.0001, start + 2.8);

    note(58, 1.8, .026 + strength * .022, delay + .02, 34, 'sine');
    note(82, .48, .016 + strength * .012, delay, 48, 'triangle');
  }

  function update({
    daylight,
    hour = 12,
    rain = 0,
    overcast = 0,
    moving,
    running,
    nearWater,
    inChallenge,
    roadProximity = 0,
    townProximity = 0,
    lightning = 0,
    lightningStrikeId = null,
  }) {
    if (closed || context.state !== 'running') return;
    const now = context.currentTime;
    const night = hour >= 19.5 || hour < 5.5;
    const daytimeActivity = Math.max(.12, daylight * (night ? .18 : 1));
    const dryFactor = 1 - Math.min(1, rain * 1.1);

    water.gain.setTargetAtTime(nearWater ? .47 : 0, now, .9);
    wind.gain.setTargetAtTime((running && moving ? .075 : .032) + rain * .035 + overcast * .012, now, .8);

    // Two rain bands create a fuller monsoon texture without samples.
    rainBody.gain.setTargetAtTime(rain * (.10 + rain * .08), now, .45);
    rainHiss.gain.setTargetAtTime(rain * (.075 + rain * .105), now, .38);
    rainBody.filter.frequency.setTargetAtTime(850 + rain * 520, now, .7);
    rainHiss.filter.frequency.setTargetAtTime(2100 + rain * 900, now, .7);

    const trafficLevel = roadProximity * daytimeActivity * (1 - rain * .28);
    trafficHum.gain.setTargetAtTime(.055 * trafficLevel, now, 1.2);
    trafficHum.filter.frequency.setTargetAtTime(115 + trafficLevel * 75, now, 1);

    const streetLevel = townProximity * daytimeActivity * dryFactor;
    streetMurmur.gain.setTargetAtTime(.030 * streetLevel, now, 1.15);
    streetMurmur.filter.frequency.setTargetAtTime(430 + streetLevel * 250, now, 1.1);

    const cricketLevel = Math.max(0, 1 - daylight) * dryFactor;
    nightBed.gain.setTargetAtTime(.015 * cricketLevel, now, 1.4);

    if (lightningStrikeId !== null && lightning > .30 && lightningStrikeId !== lastThunderStrikeId) {
      lastThunderStrikeId = lightningStrikeId;
      thunderClap(lightningStrikeId, Math.max(0, Math.min(1, .55 + rain * .45)));
    }

    if (daylight > .42 && rain < .42 && now >= nextBird) {
      birdCall(daylight, rain);
      nextBird = now + 2.7 + Math.random() * 4.8;
    }
    if (cricketLevel > .25 && rain < .62 && now >= nextCricket) {
      cricketChirp(cricketLevel);
      nextCricket = now + .9 + Math.random() * 1.6;
    }
    if (streetLevel > .18 && now >= nextStreetBeat) {
      streetPulse(streetLevel);
      nextStreetBeat = now + 2.4 + Math.random() * 3.7;
    }
    if (trafficLevel > .18 && now >= nextTrafficCue) {
      trafficCue(trafficLevel);
      nextTrafficCue = now + 3.8 + Math.random() * 6.2;
    }

    // Keep music for the explicit challenge only; normal exploration is now
    // environmental rather than a repeating synthesized melody.
    if (inChallenge && now >= nextChallengeNote) {
      const notes = [293.66, 392, 440, 493.88, 587.33, 440, 392, 329.63];
      const pitch = notes[sequence++ % notes.length];
      note(pitch, .52, .072, 0, pitch, 'triangle');
      nextChallengeNote = now + .38;
    }
  }

  async function resume() {
    if (closed) return;
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio awaits a user gesture');
    const now = context.currentTime;
    nextBird = now + .7;
    nextCricket = now + .8;
    nextStreetBeat = now + 1.2;
    nextTrafficCue = now + 1.6;
    nextChallengeNote = now + .2;
  }

  async function suspend() {
    if (!closed && context.state !== 'closed') await context.suspend();
  }

  async function dispose() {
    if (closed) return;
    closed = true;
    for (const oscillator of active) {
      try { oscillator.stop(); } catch { /* Already ended. */ }
    }
    noise.stop();
    noise.disconnect();
    await context.close().catch(() => {});
  }

  return { update, resume, suspend, dispose };
}
