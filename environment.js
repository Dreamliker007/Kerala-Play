// A shared visual clock and opt-in soundscape. No downloaded audio or visual assets.
const DAY_LENGTH_MS = 24 * 60 * 1000;
const PREFERENCE_KEY = 'kerala-play:environment:v1';
const QUALITY_LEVELS = ['low', 'balanced', 'high'];

function readPreferences() {
  try { return JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}') || {}; }
  catch { return {}; }
}

/** Environment controller; time is game elapsed time, while the sky uses UTC epoch time. */
export function createAtmosphere(THREE, { scene, renderer, camera, sun, hemi }) {
  const preferences = readPreferences();
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  let quality = QUALITY_LEVELS.includes(preferences.quality) ? preferences.quality : (coarsePointer ? 'low' : 'balanced');
  let disposed = false;
  let lastHudMinute = -1;
  let materialTimer = 1;
  let audioEnabled = false;
  let soundscape = null;
  const disposables = [];
  const originalRenderer = { toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, shadows: renderer.shadowMap.enabled, shadowType: renderer.shadowMap.type, pixelRatio: renderer.getPixelRatio() };
  const shadowObjects = [];
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
  const clouds = new THREE.InstancedMesh(sphereGeometry, cloudMaterial, 18);
  const cloudTransform = new THREE.Object3D();
  for (let index = 0; index < 18; index++) {
    const group = Math.floor(index / 3);
    const angle = group / 6 * Math.PI * 2;
    cloudTransform.position.set(Math.cos(angle) * (73 + group * 4) + (index % 3 - 1) * 5, 23 + group % 3 * 4, Math.sin(angle) * (73 + group * 4));
    cloudTransform.scale.set(7 + random() * 3, 1.4 + random(), 3.8 + random() * 2);
    cloudTransform.updateMatrix();
    clouds.setMatrixAt(index, cloudTransform.matrix);
  }
  clouds.frustumCulled = false;
  clouds.instanceMatrix.needsUpdate = true;
  sky.add(clouds);
  disposables.push(cloudMaterial);

  const moonLight = new THREE.DirectionalLight(0x8cacff, .35);
  scene.add(moonLight, moonLight.target);
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
  const nightSky = new THREE.Color(0x101d36);
  const duskSky = new THREE.Color(0xc68f84);
  const daylightColor = new THREE.Color(0xeaf5ff);
  const nightLightColor = new THREE.Color(0x98b4e3);
  const warmColor = new THREE.Color(0xffc797);
  const whiteColor = new THREE.Color(0xfff2d9);
  const groundDay = new THREE.Color(0x647d42);
  const groundNight = new THREE.Color(0x303d50);
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
    #world-quality { min-width:96px; }
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
  settings.innerHTML = '<div class="world-settings-head"><strong>Settings</strong><button type="button" id="world-settings-close" aria-label="Close settings">×</button></div><label class="world-setting-row"><span>World sound</span><button type="button" id="world-sound" aria-pressed="false">Off</button></label><label class="world-setting-row"><span>Graphics</span><select id="world-quality" aria-label="Graphics quality"><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select></label><output id="world-audio-status" role="status"></output>';

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
  const qualitySelect = settings.querySelector('#world-quality');
  const audioStatus = settings.querySelector('#world-audio-status');
  const settingsClose = settings.querySelector('#world-settings-close');

  function setSettingsOpen(open) {
    const next = !!open;
    settings.classList.toggle('open', next);
    settingsToggle.setAttribute('aria-expanded', String(next));
  }
  settingsToggle.addEventListener('click', () => setSettingsOpen(!settings.classList.contains('open')));
  settingsClose.addEventListener('click', () => setSettingsOpen(false));
  settings.addEventListener('pointerdown', event => event.stopPropagation());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setSettingsOpen(false); });

  if (preferences.sound) soundButton.textContent = 'Resume';
  soundButton.title = 'Enable birds, water, night insects, and gentle music';

  function savePreferences() {
    try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ quality, sound: audioEnabled })); } catch { /* Storage can be unavailable in private mode. */ }
  }
  function applyQuality() {
    const maxRatio = quality === 'low' ? .85 : quality === 'high' ? 1.6 : 1.2;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, maxRatio));
    renderer.shadowMap.enabled = quality === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    if (sun) sun.castShadow = quality === 'high';
    stars.visible = quality !== 'low';
    clouds.visible = quality !== 'low';
    qualitySelect.value = quality;
  }
  function setQuality(value) {
    if (!QUALITY_LEVELS.includes(value) || disposed) return;
    quality = value;
    applyQuality();
    savePreferences();
  }
  qualitySelect.addEventListener('change', () => setQuality(qualitySelect.value));
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
    if (disposed) return;
    const worldMinute = ((Date.now() % DAY_LENGTH_MS) + DAY_LENGTH_MS) % DAY_LENGTH_MS / 1000;
    const hour = worldMinute / 60;
    const angle = (hour - 6) / 24 * Math.PI * 2;
    const elevation = Math.sin(angle);
    const daylight = THREE.MathUtils.smoothstep(elevation, -.15, .28);
    const twilight = Math.max(0, 1 - Math.abs(elevation) / .42) * .58;
    scene.background.copy(nightSky).lerp(daySky, daylight).lerp(duskSky, twilight);
    scene.fog.color.copy(scene.background);
    scene.fog.near = 42 + daylight * 15;
    scene.fog.far = 120 + daylight * 38;
    sky.position.copy(camera.position);
    lightDirection.set(Math.cos(angle) * .84, elevation, Math.cos(angle) * .54).normalize();
    sunDisc.position.copy(lightDirection).multiplyScalar(120);
    moonDisc.position.copy(lightDirection).multiplyScalar(-120);
    sunDisc.visible = elevation > -.08;
    moonDisc.visible = elevation < .08;
    starMaterial.opacity = (1 - daylight) * .88;
    clouds.rotation.y = worldMinute / 1440 * Math.PI * 2;
    cloudMaterial.color.copy(nightLightColor).lerp(whiteColor, daylight).lerp(warmColor, twilight).multiplyScalar(.35 + daylight * .65);
    target.set(camera.position.x, 0, camera.position.z);
    if (sun) {
      sun.color.copy(whiteColor).lerp(warmColor, twilight);
      sun.intensity = Math.max(0, elevation) * 1.7 + daylight * .28;
      sun.position.copy(target).addScaledVector(lightDirection, 75);
      // Keep its shadow camera above ground while the light fades out at the horizon.
      sun.position.y = Math.max(8, sun.position.y);
      sun.target.position.copy(target);
    }
    if (hemi) {
      hemi.intensity = .65 + daylight * 1.5;
      hemi.color.copy(nightLightColor).lerp(daylightColor, daylight);
      hemi.groundColor.copy(groundNight).lerp(groundDay, daylight);
    }
    moonLight.intensity = (1 - daylight) * .38;
    moonLight.position.copy(target).addScaledVector(lightDirection, -70);
    moonLight.position.y = Math.max(15, moonLight.position.y);
    moonLight.target.position.copy(target);
    materialTimer += delta;
    if (materialTimer >= .4) {
      materialTimer = 0;
      for (const [material, color] of unlitMaterials) material.color.copy(color).multiplyScalar(.5 + daylight * .5);
      for (const [material, intensity] of emissiveMaterials) material.emissiveIntensity = intensity + (1 - daylight) * .65;
    }
    const minute = Math.floor(worldMinute);
    if (minute !== lastHudMinute) {
      lastHudMinute = minute;
      const period = hour < 5 || hour >= 19 ? 'Night' : hour < 8 ? 'Dawn' : hour < 16.5 ? 'Day' : 'Evening';
      const icon = period === 'Night' ? '☾' : period === 'Day' ? '☀' : '◐';
      clockOutput.textContent = `${icon} ${period} · ${String(Math.floor(hour)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    }
    if (audioEnabled && !document.hidden) soundscape?.update({ daylight, moving, running, nearWater, inChallenge });
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
    scene.remove(sky, moonLight, moonLight.target);
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
  return { update, dispose, setQuality, applyQuality, get quality() { return quality; } };
}

function createSoundscape() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Web Audio is unavailable');
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = .24;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -20;
  limiter.ratio.value = 4;
  master.connect(limiter).connect(context.destination);
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
  const waterFilter = context.createBiquadFilter();
  waterFilter.type = 'bandpass';
  waterFilter.frequency.value = 850;
  waterFilter.Q.value = .6;
  const water = context.createGain();
  water.gain.value = 0;
  noise.connect(waterFilter).connect(water).connect(master);
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 330;
  const wind = context.createGain();
  wind.gain.value = .06;
  noise.connect(windFilter).connect(wind).connect(master);
  noise.start();
  const active = new Set();
  let nextBird = 0;
  let nextCricket = 0;
  let nextNote = 0;
  let sequence = 0;
  let closed = false;

  function note(frequency, duration, volume, delay = 0, endFrequency = frequency, type = 'sine') {
    if (closed || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(master);
    active.add(oscillator);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }
  function update({ daylight, moving, running, nearWater, inChallenge }) {
    if (closed || context.state !== 'running') return;
    const now = context.currentTime;
    water.gain.setTargetAtTime(nearWater ? .65 : 0, now, .8);
    wind.gain.setTargetAtTime(running && moving ? .09 : .045, now, .7);
    if (daylight > .45 && now >= nextBird) {
      const pitch = 1800 + Math.random() * 1100;
      note(pitch, .18, .085 * daylight, 0, pitch * 1.35);
      note(pitch * 1.25, .22, .06 * daylight, .2, pitch * .82);
      nextBird = now + 3 + Math.random() * 5;
    }
    if (daylight < .55 && now >= nextCricket) {
      for (let count = 0; count < 3; count++) note(3800, .08, .048 * (1 - daylight), count * .15, 3650);
      nextCricket = now + 1.3 + Math.random() * 1.8;
    }
    if (now >= nextNote) {
      const notes = inChallenge ? [293.66, 392, 440, 493.88, 587.33, 440, 392, 329.63]
        : running && moving ? [196, 293.66, 329.63, 392, 293.66, 246.94]
          : [196, 246.94, 293.66, 392, 329.63, 293.66, 246.94, 0];
      const pitch = notes[sequence++ % notes.length];
      if (pitch) note(pitch * (daylight < .4 ? .75 : 1), .85, inChallenge ? .095 : .065, 0, pitch * (daylight < .4 ? .75 : 1), 'triangle');
      nextNote = now + (inChallenge ? .38 : running && moving ? .5 : moving ? .95 : 1.5);
    }
  }
  async function resume() {
    if (closed) return;
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio awaits a user gesture');
    nextBird = context.currentTime + .7;
    nextCricket = context.currentTime + .7;
    nextNote = context.currentTime + .2;
  }
  async function suspend() { if (!closed && context.state !== 'closed') await context.suspend(); }
  async function dispose() {
    if (closed) return;
    closed = true;
    for (const oscillator of active) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    noise.stop();
    noise.disconnect();
    await context.close().catch(() => {});
  }
  return { update, resume, suspend, dispose };
}
