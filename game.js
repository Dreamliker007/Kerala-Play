import * as THREE from './vendor/three.module.js';
import { initSocial, api } from './social.js';
import { createAtmosphere } from './environment.js';

const fallback = document.querySelector('#fallback');
const joystickZone = document.querySelector('#joystick-zone');
const joystickBase = document.querySelector('#joystick-base');
const joystickKnob = document.querySelector('#joystick-knob');
const cameraZone = document.querySelector('#camera-zone');
const runButton = document.querySelector('#run');
const accelerateButton = document.querySelector('#accelerate');
const worldInteract = document.querySelector('#world-interact');
const vehicleAction = document.querySelector('#vehicle-action');
const driveTools = document.querySelector('#drive-tools');
const hornAction = document.querySelector('#horn-action');
const lightsAction = document.querySelector('#lights-action');
const roadStatus = document.querySelector('#road-status');
const needsHud = document.querySelector('#needs-hud');
const needHunger = document.querySelector('#need-hunger');
const needThirst = document.querySelector('#need-thirst');
const needEnergy = document.querySelector('#need-energy');
const profileName = document.querySelector('#profile-name');
const profileDistrict = document.querySelector('#profile-district');
const profileChip = document.querySelector('#profile-chip');
const progressChip = document.querySelector('#progress-chip');
const onlineCount = document.querySelector('#online-count');
const mapLayer = document.querySelector('#landmark-layer');
const mapPlayer = document.querySelector('#map-player');
const mapRoute = document.querySelector('#map-route');
const jobMapMarker = document.querySelector('#job-map-marker');
const mapStatus = document.querySelector('#map-status');
const nearbyPlaces = document.querySelector('#nearby-places');
const minimap = document.querySelector('#minimap');
const mapOpen = document.querySelector('#map-open');
const mapClose = document.querySelector('#map-close');
const mapLabelToggle = document.querySelector('#map-label-toggle');
const keralaMap = document.querySelector('#kerala-map');
const districtLabels = document.querySelector('#district-labels');
const mapZoomIn = document.querySelector('#map-zoom-in');
const mapZoomOut = document.querySelector('#map-zoom-out');
const mapZoomReset = document.querySelector('#map-zoom-reset');
const missionText = document.querySelector('#mission-text');
const landmarkStatus = document.querySelector('#landmark-status');
const missionCard = document.querySelector('#mission-card');
const chatToggle = document.querySelector('#chat-toggle');
const chatPanel = document.querySelector('#chat-panel');
const chatClose = document.querySelector('#chat-close');
const chatChannel = document.querySelector('#chat-channel');
const chatLog = document.querySelector('#chat-log');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const peopleToggle = document.querySelector('#people-toggle');
const peoplePanel = document.querySelector('#people-panel');
const peopleClose = document.querySelector('#people-close');
const peopleList = document.querySelector('#people-list');
const peopleOnlineLabel = document.querySelector('#people-online-label');
const taskToggle = document.querySelector('#task-toggle');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');
const taskPanel = document.querySelector('#task-panel');
const taskClose = document.querySelector('#task-close');
const taskList = document.querySelector('#task-list');
const challengePlay = document.querySelector('#challenge-play');
const challengeResult = document.querySelector('#challenge-result');
const dmPanel = document.querySelector('#dm-panel');
const dmClose = document.querySelector('#dm-close');
const dmTitle = document.querySelector('#dm-title');
const dmLog = document.querySelector('#dm-log');
const dmForm = document.querySelector('#dm-form');
const dmInput = document.querySelector('#dm-input');
const assetNotice = document.querySelector('#asset-notice');
const toast = document.querySelector('#toast');
const onboarding = document.querySelector('#onboarding');
const onboardingTitle = document.querySelector('#onboarding-title');
const onboardingCopy = document.querySelector('#onboarding-copy');
const onboardingProgress = document.querySelector('#onboarding-progress');
const onboardingNext = document.querySelector('#onboarding-next');
const onboardingSkip = document.querySelector('#onboarding-skip');
const onboardingPointer = document.querySelector('#onboarding-pointer');
const hudMenuToggle = document.querySelector('#hud-menu-toggle');
document.querySelector('#hud').append(document.querySelector('#avatar-labels'));
const runtimeIsMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
const villagers = [];
const ambientAnimals = [];
const windVegetation = [];
const windWires = [];
let roadsideGrassWind = null;
let windUpdateTimer = 0;
const traffic = [];
const staticColliders = [];
const streetLampMaterials = [];
const streetLightSources = [];
const buildingLightMaterials = [];
const buildingLightSources = [];
const wetReflectionMaterials = [];
const ambientVehicleLightMaterials = [];
const weatherRoadSurfaces = [];
const puddleMaterials = [];
const puddleRipples = [];
const drainWaterSurfaces = [];
const roofRunoffJets = [];
const farVisualDetails = [];
let monsoonWaterTimer = 0;
let farVisualTimer = 0;
let lastContactShadowUpdateAt = 0;
let footstepEffects = null;
let footstepEffectsFailed = false;
let lastFootstepBeat = -1;
let footstepSide = -1;
const fruitGeometry = new THREE.SphereGeometry(.14, 6, 5);
const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xe4a737, roughness: .72 });
const birdBodyGeometry = new THREE.SphereGeometry(.10, 6, 5);
const birdWingGeometry = new THREE.PlaneGeometry(.28, .055);
const birdMaterial = new THREE.MeshBasicMaterial({ color: 0x202724, side: THREE.DoubleSide });
let villageTime = 0;
let playerRef = null;
let selectedLandmark = null;
let selectedDestination = null;
let lastNearbyPlacesRenderAt = 0;
let mapLabelsVisible = false;
let mapZoom = 1;
let activeDmContact = null;
let activeJobMission = null;
let garageSnapshot = null;
let trafficSnapshot = null;
let needsSnapshot = null;
let homeSnapshot = null;
let npcRelationshipSnapshot = null;
let activeNpcFavor = null;
let npcFavorCompletionPending = false;
let communityEventsSnapshot = null;
let communityEventPending = false;
let trafficCheckpointVisual = null;
let junctionSignalVisual = null;
const pedestrianCrossingZ = -14.3;
const WORLD_SHOP_ITEMS = Object.freeze({
  water: Object.freeze({ name: 'Water', price: 15 }),
  tea: Object.freeze({ name: 'Tea', price: 20 }),
  snack: Object.freeze({ name: 'Snack', price: 35 }),
  meal: Object.freeze({ name: 'Kerala Meal', price: 80 }),
});
const WORLD_ACTIVITY_SPOTS = Object.freeze([
  Object.freeze({ id: 'anugraha', kind: 'shop', label: 'Anugraha Stores', x: -14.4, z: 10.7, radius: 3.8, discoverRadius: 7.0, openHour: 6, closeHour: 21, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'malabar', kind: 'shop', label: 'Malabar Bakery', x: 14.8, z: 41.2, radius: 3.8, discoverRadius: 7.0, openHour: 5.5, closeHour: 20.5, items: ['water', 'tea', 'snack'] }),
  Object.freeze({ id: 'town-bus', kind: 'bus', label: 'Town Junction Bus Stop', x: 11.7, z: 27.5, radius: 3.6, discoverRadius: 6.6 }),
  Object.freeze({ id: 'town-centre-bus', kind: 'bus', label: 'Town Centre Bus Stop', x: 13.0, z: 19.2, radius: 3.6, discoverRadius: 6.6 }),
  Object.freeze({ id: 'south-bus', kind: 'bus', label: 'South Bus Stop', x: -11.7, z: -50.5, radius: 3.6, discoverRadius: 6.6 }),
  Object.freeze({ id: 'town-market', kind: 'shop', label: 'Town Market', x: 31, z: 15, radius: 4.2, discoverRadius: 7.2, openHour: 6, closeHour: 21, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'community-clinic', kind: 'service', service: 'clinic', label: 'Community Clinic', x: 28, z: 28, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'police-station', kind: 'service', service: 'police', label: 'Kerala Police Station', x: -31, z: 14, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'fire-station', kind: 'service', service: 'fire', label: 'Fire & Rescue Station', x: -48, z: 8, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'village-pond', kind: 'view', label: 'Village Pond', x: 39, z: -4, radius: 4.2, discoverRadius: 7.2 }),
]);
let lastWorldActivityAt = 0;
let lifeLoopAction = 'jobs';
let busTravelStatus = null;
let publicRideInProgress = false;
let ridePickupVisual = null;
let jobWorldVisual = null;
let jobCarryVisual = null;
let jobVisualSignature = '';
let jobVehicleVisual = null;
let jobVehicleSignature = '';
let vehicleMode = 'walk';
let driveSpeed = 0;
const vehicleSafePosition = new THREE.Vector3();
let vehicleSafeRotation = 0;
let vehicleSafeReady = false;
let vehicleCollisionFrames = 0;
let lastVehicleRecoveryNotice = 0;
let headlightsOn = false;
let autoHeadlightsOn = false;
let worldWeatherState = { daylight: 1, hour: 12, rain: 0, overcast: 0, weather: 'Clear', needsLights: false };
let hornReadyAt = 0;
let hornPulseUntil = 0;
let driveAudioContext = null;
let lastImpactReportAt = 0;
let lastFuelWarningAt = 0;
let lastNeedsWarningAt = 0;
let profile = null;
let progress = newProgress();
let social = null;
let sceneRef = null;
let atmosphere = null;
let connectionReady = false;
const remotePlayers = new Map();
const claimPending = new Set();
let lastMovementSend = 0;
let lastMovementMoving = false;
let movementPending = false;
let remoteLabelAccumulator = 0;
let lastProgressRefresh = 0;
let lastMoveError = 0;
const labelPosition = new THREE.Vector3();
const labelWorldPosition = new THREE.Vector3();
const pointerOrigin = new Map();
let challengeRound = null;
let challengeGeneration = 0;
const ONBOARDING_STORAGE_KEY = 'kerala-play-onboarding-v1';
const onboardingSteps = [
  { title: 'Hi, I’m Maya!', copy: 'Welcome to Kerala Play. I’ll stay with you for the first minute and point to each control while you try it.', button: 'Let’s go' },
  { title: 'Let’s walk', copy: 'Put your thumb here and move the joystick. Just take a few steps — I’ll continue when you move.', target: 'move', pointer: 'Move here' },
  { title: 'Now look around', copy: 'Swipe on the open right side of the world to turn the camera and look around you.', target: 'camera', pointer: 'Swipe here' },
  { title: 'Try running', copy: 'Hold RUN while moving whenever you want to travel faster.', target: 'run', pointer: 'Hold RUN' },
  { title: 'This is your menu', copy: 'Tap this menu button. Your map, people, chat, phone, wallet and other controls live here.', target: 'menu', pointer: 'Open menu' },
  { title: 'Open the Kerala map', copy: 'Tap MAP. You can use it to understand your location and discover landmarks around Kerala.', target: 'map', pointer: 'Tap MAP' },
  { title: 'Check your goals', copy: 'Tap TASKS. Completing goals gives you points and helps you level up naturally as you play.', target: 'tasks', pointer: 'Tap TASKS' },
  { title: 'You’re ready!', copy: 'That’s the basics. Explore, meet people, take jobs and build your life in Kerala Play. I’ll see you around!', button: 'Start exploring' }
];
let onboardingStep = -1;
let onboardingQueued = false;
let onboardingForceRequested = false;
let onboardingTypeTimer = 0;
let onboardingTypeToken = 0;
const districtStarts = {
  Alappuzha: [-34, -13], Ernakulam: [-26, 6], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44]
};
const worldZones = Object.freeze([
  Object.freeze({ id: 'north-coast', name: 'North Kerala', districts: ['Kasaragod', 'Kannur', 'Wayanad'], minZ: 38, maxZ: 72 }),
  Object.freeze({ id: 'malabar', name: 'Malabar', districts: ['Kozhikode', 'Malappuram'], minZ: 18, maxZ: 38 }),
  Object.freeze({ id: 'central', name: 'Central Kerala', districts: ['Palakkad', 'Thrissur', 'Ernakulam', 'Idukki'], minZ: -4, maxZ: 32 }),
  Object.freeze({ id: 'midlands', name: 'Kerala Midlands', districts: ['Kottayam', 'Alappuzha', 'Pathanamthitta'], minZ: -40, maxZ: 2 }),
  Object.freeze({ id: 'south', name: 'South Kerala', districts: ['Kollam', 'Thiruvananthapuram'], minZ: -72, maxZ: -38 }),
]);
const roadNetwork = Object.freeze([
  Object.freeze({ id: 'state-spine', name: 'Kerala State Road', axis: 'z', center: 0, min: -72, max: 72, halfWidth: 7.75, displayLimit: 40, bikeLimit: 6.6, taxiLimit: 6.4 }),
  Object.freeze({ id: 'village-link', name: 'Village Link Road', axis: 'x', center: -22, min: -72, max: 16, halfWidth: 5.75, displayLimit: 30, bikeLimit: 4.9, taxiLimit: 4.7 }),
  Object.freeze({ id: 'market-link', name: 'Market Road', axis: 'x', center: 22, min: -18, max: 48, halfWidth: 3.4, displayLimit: 30, bikeLimit: 4.9, taxiLimit: 4.7 }),
  Object.freeze({ id: 'station-link', name: 'Station Road', axis: 'z', center: -42, min: -34, max: 22, halfWidth: 3.2, displayLimit: 25, bikeLimit: 4.4, taxiLimit: 4.2 }),
]);
const townZones = Object.freeze([
  Object.freeze({ id: 'town-centre', name: 'Town Centre', x: 0, z: 22, radius: 16, district: 'Kottayam' }),
  Object.freeze({ id: 'market-quarter', name: 'Market Quarter', x: -30, z: 22, radius: 15, district: 'Kottayam' }),
  Object.freeze({ id: 'south-junction', name: 'South Junction', x: 0, z: -22, radius: 14, district: 'Kottayam' }),
]);
function worldZoneAt(x, z) {
  const district = Object.entries(districtStarts).reduce((best, [name, point]) => {
    const distance = Math.hypot(x - point[0], z - point[1]);
    return !best || distance < best.distance ? { name, distance } : best;
  }, null)?.name || 'Kottayam';
  const zone = worldZones.find(item => item.districts.includes(district)) || worldZones[2];
  return { ...zone, district };
}

const landmarks = [
  { id: 'bekal', name: 'Bekal Fort', icon: 'F', x: -7, z: 60, district: 'Kasaragod', kind: 'landmark' },
  { id: 'munnar', name: 'Munnar Tea Hills', icon: 'M', x: 42, z: 26, district: 'Idukki', kind: 'landmark' },
  { id: 'kochi', name: 'Mattancherry Palace', icon: 'P', x: -26, z: 6, district: 'Ernakulam', kind: 'landmark' },
  { id: 'alappuzha', name: 'Alappuzha Backwaters', icon: 'B', x: -34, z: -13, district: 'Alappuzha', kind: 'landmark' },
  { id: 'kuttanad', name: 'Kuttanad Fields', icon: 'K', x: 7, z: -23, district: 'Kottayam', kind: 'landmark' },
  { id: 'temple', name: 'Padmanabhaswamy Temple', icon: 'T', x: 13, z: -57, district: 'Thiruvananthapuram', kind: 'landmark' }
];
const navigationPlaces = Object.freeze([
  ...landmarks,
  Object.freeze({ id: 'anugraha', name: 'Anugraha Stores', icon: 'S', x: -14.4, z: 10.7, kind: 'shop', district: 'Village' }),
  Object.freeze({ id: 'malabar', name: 'Malabar Bakery', icon: 'B', x: 14.8, z: 41.2, kind: 'shop', district: 'Village' }),
  Object.freeze({ id: 'town-bus', name: 'Town Junction Bus Stop', icon: '🚌', x: 11.7, z: 27.5, kind: 'bus', district: 'Village' }),
  Object.freeze({ id: 'south-bus', name: 'South Bus Stop', icon: '🚌', x: -11.7, z: -50.5, kind: 'bus', district: 'Village' }),
  Object.freeze({ id: 'village-rental', name: 'Village Rental Home', icon: 'H', x: -24, z: -30.8, kind: 'home', district: 'Village' }),
  Object.freeze({ id: 'village-bench', name: 'Village Rest Bench', icon: 'R', x: -10, z: -10, kind: 'rest', district: 'Village' }),
  Object.freeze({ id: 'fuel', name: 'Kerala Fuel Station', icon: 'F', x: 11, z: -12, kind: 'service', district: 'Village' }),
  Object.freeze({ id: 'service', name: 'Village Service Garage', icon: 'G', x: -36, z: -15, kind: 'service', district: 'Village' }),
  Object.freeze({ id: 'village-pond', name: 'Village Pond', icon: 'P', x: 39, z: -4, kind: 'view', district: 'Village' }),
  Object.freeze({ id: 'town-centre', name: 'Town Centre', icon: 'T', x: 0, z: 22, kind: 'town', district: 'Kottayam' }),
  Object.freeze({ id: 'market-quarter', name: 'Market Quarter', icon: 'M', x: -30, z: 22, kind: 'town', district: 'Kottayam' }),
  Object.freeze({ id: 'south-junction', name: 'South Junction', icon: 'J', x: 0, z: -22, kind: 'junction', district: 'Kottayam' }),
  Object.freeze({ id: 'town-clinic', name: 'Kerala Community Clinic', icon: '+', x: 28, z: 28, kind: 'health', district: 'Kottayam' }),
  Object.freeze({ id: 'town-police', name: 'Kerala Police Station', icon: 'P', x: -31, z: 14, kind: 'police', district: 'Kottayam' }),
  Object.freeze({ id: 'town-fire', name: 'Fire & Rescue Station', icon: 'F', x: -48, z: 8, kind: 'emergency', district: 'Kottayam' }),
  Object.freeze({ id: 'town-market', name: 'Town Market', icon: 'S', x: 31, z: 15, kind: 'shop', district: 'Kottayam' }),
  Object.freeze({ id: 'town-centre-bus', name: 'Town Centre Bus Stop', icon: '🚌', x: 13.0, z: 19.2, kind: 'bus', district: 'Kottayam' }),
]);
const taskCatalog = [
  { id: 'open-map', title: 'Open the Kerala map', target: 1, reward: 10 },
  { id: 'walk-50', title: 'Walk 50 metres', target: 50, reward: 25 },
  { id: 'visit-landmark', title: 'Visit one landmark', target: 1, reward: 50 },
  { id: 'walk-250', title: 'Take a village stroll', target: 250, reward: 75 },
  { id: 'discover-3', title: 'Discover three landmarks', target: 3, reward: 100 },
  { id: 'walk-500', title: 'Complete a Kerala road trip', target: 500, reward: 150 },
  { id: 'discover-5', title: 'Become a landmark explorer', target: 5, reward: 200 },
  { id: 'social', title: 'Make an accepted connection', target: 1, reward: 35 }
];


function updateNeedsHud() {
  if (!needsHud) return;
  const visible = !!profile && !!needsSnapshot;
  needsHud.hidden = !visible;
  if (!visible) return;

  const entries = [
    [needHunger, Number(needsSnapshot.hunger ?? 100)],
    [needThirst, Number(needsSnapshot.thirst ?? 100)],
    [needEnergy, Number(needsSnapshot.energy ?? 100)],
  ];
  for (const [element, value] of entries) {
    if (!element) continue;
    const rounded = Math.max(0, Math.min(100, Math.round(value)));
    const target = element.querySelector('b');
    if (target) target.textContent = String(rounded);
    element.classList.toggle('warning', rounded <= 25 && rounded > 10);
    element.classList.toggle('critical', rounded <= 10);
  }
  if (runButton) {
    const lowNeeds = vehicleMode === 'walk' && needsSnapshot.canRun === false;
    runButton.setAttribute('aria-disabled', 'false');
    runButton.title = lowNeeds ? 'Low needs reduce running speed, but RUN remains available' : '';
  }
}

function applyNeedsState(summary, { warn = true } = {}) {
  needsSnapshot = summary || null;
  updateNeedsHud();
  updateWorldInteract();
  if (!warn || !needsSnapshot || performance.now() - lastNeedsWarningAt < 12000) return;
  const low = [
    ['Thirst', Number(needsSnapshot.thirst)],
    ['Energy', Number(needsSnapshot.energy)],
    ['Hunger', Number(needsSnapshot.hunger)],
  ].sort((a, b) => a[1] - b[1])[0];
  if (low && low[1] <= 15) {
    lastNeedsWarningAt = performance.now();
    showToast(`Low ${low[0].toLowerCase()} · use the Village Shop${low[0] === 'Energy' ? ' or Rest Bench' : ''}`);
  }
}

function disposeMissionObject(object) {
  if (!object) return;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  object.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      if (!material) continue;
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
  });
  textures.forEach(texture => texture.dispose());
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

function clearJobMissionVisual() {
  if (jobWorldVisual) {
    sceneRef?.remove(jobWorldVisual);
    disposeMissionObject(jobWorldVisual);
    jobWorldVisual = null;
  }
  if (jobCarryVisual) {
    playerRef?.remove(jobCarryVisual);
    disposeMissionObject(jobCarryVisual);
    jobCarryVisual = null;
  }
  jobVisualSignature = '';
}

function missionTag(text, background = '#155b3d') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(2, 8, 252, 48);
  context.strokeStyle = 'rgba(255,255,255,.9)';
  context.lineWidth = 3;
  context.strokeRect(3.5, 9.5, 249, 45);
  context.fillStyle = '#fff';
  context.font = '800 22px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(text).slice(0, 22).toUpperCase(), 128, 33);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(4.2, 1.05, 1);
  sprite.position.y = 3.15;
  return sprite;
}

function missionMarker(color = 0x65e69b) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.35, 28), material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .035;
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.24, .62, 10), material.clone());
  arrow.rotation.z = Math.PI;
  arrow.position.y = 2.45;
  group.add(ring, arrow);
  group.userData.ring = ring;
  group.userData.arrow = arrow;
  return group;
}

function parcelVisual() {
  const group = new THREE.Group();
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xb77b3d, roughness: .88 });
  const tapeMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d19a, roughness: .72 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(.78, .52, .58), boxMaterial);
  box.position.y = .36;
  const tape = new THREE.Mesh(new THREE.BoxGeometry(.13, .535, .595), tapeMaterial);
  tape.position.y = .36;
  group.add(box, tape);
  return group;
}

function passengerVisual() {
  const group = new THREE.Group();
  const human = createHuman({ gender: 'female', shirt: 0xc97987, trousers: 0x27354a, skin: 0xa96d4c, hair: 0x171311, shoes: 0x2c2825, accent: 0xf0d06f });
  human.scale.setScalar(.82);
  group.add(human);
  group.userData.passengerHuman = human;
  return group;
}

function shopVisual() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a4c2d, roughness: .92 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xe0c796, roughness: .88 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2f7e58, roughness: .82 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.7, .9, .72), counterMat);
  counter.position.set(0, .48, 0);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, .16, 1.5), canopyMat);
  canopy.position.set(0, 2.45, 0);
  [-1.35, 1.35].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.4, .12), wood);
    post.position.set(x, 1.2, 0);
    group.add(post);
  });
  group.add(counter, canopy, missionTag('Village Shop', '#235641'));
  return group;
}


function addFuelStation(scene, x, z) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf1eee3, roughness: .82 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc83d32, roughness: .8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x303638, roughness: .9 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.4, .28, 4.4), red);
  canopy.position.y = 3.7;
  const post = new THREE.Mesh(new THREE.BoxGeometry(.35, 3.5, .35), white);
  post.position.set(-2.6, 1.8, 0);
  const post2 = post.clone(); post2.position.x = 2.6;
  const pump = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.55, .75), white);
  pump.position.set(0, .78, 0);
  const display = new THREE.Mesh(new THREE.BoxGeometry(.58, .32, .06), dark);
  display.position.set(0, 1.05, .405);
  group.add(canopy, post, post2, pump, display, missionTag('Fuel Station', '#9c2b25'));
  group.position.set(x, 0, z);
  scene.add(group);
  addBoxCollider(x, z, 3.2, 2.2, 'fuel-station');
}

function addTrafficCheckpoint(scene, x, z) {
  const group = new THREE.Group();
  const boothBlue = new THREE.MeshStandardMaterial({ color: 0x315b84, roughness: .82 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf0f2ef, roughness: .84 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x252b30, roughness: .92 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xffbd4f, emissive: 0x8a4a00, emissiveIntensity: .45, roughness: .6 });

  const booth = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 1.5), boothBlue);
  booth.position.set(.3, 1.2, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.05, .18, 1.85), white);
  roof.position.set(.3, 2.48, 0);
  const window = new THREE.Mesh(new THREE.BoxGeometry(.9, .62, .06), dark);
  window.position.set(.3, 1.55, .78);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), amber);
  beacon.position.set(.3, 2.72, 0);

  const post = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.6, .12), white);
  post.position.set(-1.15, .8, 0);
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.5, .12, .12), new THREE.MeshStandardMaterial({ color: 0xe7e2d7, roughness: .8 }));
  barrier.position.set(-2.25, 1.25, 0);
  barrier.rotation.z = -.18;

  group.add(booth, roof, window, beacon, post, barrier, missionTag('Traffic Check', '#23496f'));
  group.position.set(x, 0, z);
  scene.add(group);
  addBoxCollider(x + .3, z, 1.0, .9, 'traffic-booth');
  trafficCheckpointVisual = group;
  return group;
}

function addServiceGarage(scene, x, z) {
  const group = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: 0xa8a39a, roughness: .95 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x314f64, roughness: .88 });
  const shutter = new THREE.MeshStandardMaterial({ color: 0x4a5053, roughness: .95 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.4, 3.4, 5.2), wall);
  body.position.y = 1.7;
  const top = new THREE.Mesh(new THREE.BoxGeometry(7.8, .35, 5.6), roof);
  top.position.y = 3.55;
  const door = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.45, .12), shutter);
  door.position.set(0, 1.35, 2.64);
  group.add(body, top, door, missionTag('Service Garage', '#29475c'));
  group.position.set(x, 0, z);
  scene.add(group);
  addBoxCollider(x, z, 3.7, 2.6, 'service-garage');
}

function addCivicBuilding(scene, x, z, { title, subtitle, color = 0x3b6780, accent = 0xf1eee3, collider = 'civic-building' } = {}) {
  const group = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: accent, roughness: .90 });
  const trim = new THREE.MeshStandardMaterial({ color, roughness: .78 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x75a9b7, roughness: .22, metalness: .08 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.2, 6.2), wall);
  body.position.y = 2.1;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(9.7, .35, 6.7), trim);
  roof.position.y = 4.38;
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.7, .14), glass);
  entrance.position.set(0, 1.55, 3.16);
  const board = createWorldSignMesh({ title, subtitle, background: '#' + color.toString(16).padStart(6, '0') }, 5.8, .82);
  board.position.set(0, 4.0, 3.24);
  group.add(body, roof, entrance, board);
  group.position.set(x, 0, z);
  group.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(group);
  registerFarVisual(board, x, z, 60);
  addBoxCollider(x, z, 4.6, 3.1, collider);
}

function nearestVehicleStation() {
  const vehicle = currentDriveVehicle();
  if (!playerRef || !vehicle?.entered || !vehicle.stations) return null;
  for (const [action, station] of Object.entries(vehicle.stations)) {
    const distance = Math.hypot(playerRef.position.x - Number(station.x), playerRef.position.z - Number(station.z));
    if (distance <= Number(station.radius || 7)) return { action: action === 'fuel' ? 'refuel' : 'repair', station, distance };
  }
  return null;
}

async function reportVehicleImpact(speed) {
  const vehicle = currentDriveVehicle();
  const source = currentVehicleSource();
  if (!vehicle?.entered || !source || performance.now() - lastImpactReportAt < 1200 || speed < 1.4) return;
  lastImpactReportAt = performance.now();
  const severity = speed >= 5.4 ? 3 : speed >= 3.2 ? 2 : 1;
  try {
    let result;
    if (source === 'personal') {
      result = await api('/api/garage/vehicle/impact', { vehicleId: vehicle.vehicleId, severity });
      if (result?.garage) {
        garageSnapshot = result.garage;
        window.dispatchEvent(new CustomEvent('kerala-garage-state-local', { detail: garageSnapshot }));
      }
    } else {
      const active = activeJobMission;
      result = await api(`/api/jobs/${encodeURIComponent(active.jobId)}/vehicle/impact`, { taskId: active.taskId, severity });
      if (result?.vehicle && activeJobMission?.taskId === active.taskId) activeJobMission.vehicle = { ...activeJobMission.vehicle, ...result.vehicle };
    }
    updateDriveHud();
  } catch (error) {
    if (error.status !== 409) console.warn('Vehicle impact report failed', error);
  }
}

function createFootstepParticlePool(scene, count, color, size) {
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: .48,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  const particles = Array.from({ length: count }, () => ({
    life: 0,
    maxLife: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  }));
  for (let index = 0; index < count; index++) positions[index * 3 + 1] = -100;
  scene.add(points);
  return { points, geometry, attribute, material, positions, particles, cursor: 0 };
}

function ensureFootstepEffects(scene) {
  if (footstepEffects || !scene) return footstepEffects;
  footstepEffects = {
    dust: createFootstepParticlePool(scene, 24, 0x9b8260, .070),
    road: createFootstepParticlePool(scene, 18, 0xb0b3ad, .048),
    splash: createFootstepParticlePool(scene, 30, 0xd2e7ef, .062),
  };
  return footstepEffects;
}

function emitFootstepParticles(pool, x, z, yaw, running, count, wet = false) {
  if (!pool) return;
  for (let emitted = 0; emitted < count; emitted++) {
    const index = pool.cursor++ % pool.particles.length;
    const particle = pool.particles[index];
    const side = (Math.random() - .5) * (running ? .28 : .20);
    const backward = (Math.random() - .5) * .16;
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const offset = index * 3;
    pool.positions[offset] = x + rightX * side - forwardX * backward;
    pool.positions[offset + 1] = wet ? .055 : .040;
    pool.positions[offset + 2] = z + rightZ * side - forwardZ * backward;
    particle.life = particle.maxLife = wet
      ? .25 + Math.random() * .18
      : .34 + Math.random() * .24;
    const spread = wet ? .55 : .34;
    particle.vx = rightX * (Math.random() - .5) * spread + forwardX * (Math.random() - .30) * .18;
    particle.vz = rightZ * (Math.random() - .5) * spread + forwardZ * (Math.random() - .30) * .18;
    particle.vy = wet
      ? .50 + Math.random() * .48 + (running ? .20 : 0)
      : .12 + Math.random() * .18;
  }
  pool.points.visible = true;
  pool.attribute.needsUpdate = true;
}

function updateFootstepParticlePool(pool, delta, gravity, drag) {
  if (!pool) return;
  let active = 0;
  for (let index = 0; index < pool.particles.length; index++) {
    const particle = pool.particles[index];
    const offset = index * 3;
    if (particle.life <= 0) {
      pool.positions[offset + 1] = -100;
      continue;
    }
    active++;
    particle.life -= delta;
    if (particle.life <= 0) {
      pool.positions[offset + 1] = -100;
      continue;
    }
    particle.vx *= Math.max(0, 1 - drag * delta);
    particle.vz *= Math.max(0, 1 - drag * delta);
    particle.vy -= gravity * delta;
    pool.positions[offset] += particle.vx * delta;
    pool.positions[offset + 1] += particle.vy * delta;
    pool.positions[offset + 2] += particle.vz * delta;
    if (pool.positions[offset + 1] < .025) pool.positions[offset + 1] = .025;
  }
  pool.points.visible = active > 0;
  if (active > 0) pool.attribute.needsUpdate = true;
}

function updateFootstepEffects(delta, player, moving, running, phase = 0) {
  const effects = ensureFootstepEffects(sceneRef);
  if (!effects || !player) return;

  updateFootstepParticlePool(effects.dust, delta, .42, 2.1);
  updateFootstepParticlePool(effects.road, delta, .34, 2.5);
  updateFootstepParticlePool(effects.splash, delta, 3.4, 1.3);

  const shadow = player.userData?.shadow;
  if (shadow) {
    const pulse = vehicleMode === 'walk' && moving
      ? Math.abs(Math.sin(phase)) * (running ? .045 : .025)
      : 0;
    const targetX = 1 + pulse;
    const targetY = 1 - pulse * .42;
    shadow.scale.x += (targetX - shadow.scale.x) * Math.min(1, delta * 10);
    shadow.scale.y += (targetY - shadow.scale.y) * Math.min(1, delta * 10);
  }

  if (vehicleMode !== 'walk' || !moving) {
    lastFootstepBeat = -1;
    return;
  }

  const beat = Math.floor(phase / Math.PI);
  if (beat === lastFootstepBeat) return;
  lastFootstepBeat = beat;
  footstepSide *= -1;

  const rightX = Math.cos(player.rotation.y);
  const rightZ = -Math.sin(player.rotation.y);
  const heelX = player.position.x + rightX * footstepSide * .16;
  const heelZ = player.position.z + rightZ * footstepSide * .16;
  const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
  const zone = roadZoneAt(player.position.x, player.position.z);

  if (rain > .12) {
    const amount = running ? 6 : 4;
    emitFootstepParticles(effects.splash, heelX, heelZ, player.rotation.y, running, amount, true);
  } else if (zone.id === 'offroad') {
    emitFootstepParticles(effects.dust, heelX, heelZ, player.rotation.y, running, running ? 5 : 3, false);
  } else {
    emitFootstepParticles(effects.road, heelX, heelZ, player.rotation.y, running, running ? 2 : 1, false);
  }
}

function roadZoneAt(x, z) {
  for (const road of roadNetwork) {
    const cross = road.axis === 'z' ? x : z;
    const along = road.axis === 'z' ? z : x;
    if (Math.abs(cross - road.center) <= road.halfWidth && along >= road.min && along <= road.max) {
      return { id: road.id, label: road.name.toUpperCase(), displayLimit: road.displayLimit, bikeLimit: road.bikeLimit, taxiLimit: road.taxiLimit };
    }
  }
  const zone = worldZoneAt(x, z);
  return { id: 'offroad', label: `${zone.district.toUpperCase()} · OFF ROAD`, displayLimit: 20, bikeLimit: 3.25, taxiLimit: 3.0 };
}

function ensureDriveAudio() {
  if (!driveAudioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) driveAudioContext = new Context();
  }
  if (driveAudioContext?.state === 'suspended') driveAudioContext.resume().catch(() => {});
  return driveAudioContext;
}

function playVehicleHorn() {
  if (vehicleMode === 'walk' || performance.now() < hornReadyAt) return;
  hornReadyAt = performance.now() + 420;
  hornPulseUntil = performance.now() + 1100;
  const context = ensureDriveAudio();
  if (!context) return;
  const start = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(.16, start + .018);
  gain.gain.setValueAtTime(.16, start + .12);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .24);
  gain.connect(context.destination);
  [310, 390].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.setValueAtTime(index ? -7 : 5, start);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + .25);
  });
}

function applyVehicleHeadlights() {
  if (!jobVehicleVisual) return;
  const enabled = vehicleMode !== 'walk' && (headlightsOn || autoHeadlightsOn);
  for (const material of jobVehicleVisual.userData.headlightMaterials || []) {
    material.emissiveIntensity = enabled ? 2.8 : .28;
  }
  const oldBeam = jobVehicleVisual.userData.headlightBeam;
  if (oldBeam) {
    jobVehicleVisual.remove(oldBeam.light, oldBeam.target);
    oldBeam.light.dispose?.();
    jobVehicleVisual.userData.headlightBeam = null;
  }
  if (enabled) {
    const light = new THREE.SpotLight(0xfff1c5, 3.1, 20, Math.PI / 7, .52, 1.35);
    light.position.set(0, vehicleMode === 'bike' ? 1.03 : .92, .72);
    const target = new THREE.Object3D();
    target.position.set(0, .28, 9);
    jobVehicleVisual.add(light, target);
    light.target = target;
    jobVehicleVisual.userData.headlightBeam = { light, target };
  }
  lightsAction?.classList.toggle('active', enabled);
  lightsAction?.setAttribute('aria-pressed', String(enabled));
  if (lightsAction) {
    lightsAction.title = autoHeadlightsOn && !headlightsOn ? 'Lights automatically on for darkness or rain' : 'Toggle vehicle lights';
  }
}

function toggleVehicleHeadlights() {
  if (vehicleMode === 'walk') return;
  headlightsOn = !headlightsOn;
  applyVehicleHeadlights();
}

function applyDynamicHighQuality(root) {
  if (!root) return root;
  root.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const contactShadow = object.userData?.contactShadow === true;
    if (!contactShadow) {
      const opaque = materials.every(material => material && !material.transparent && !material.wireframe);
      object.castShadow = opaque && (object.geometry?.type !== 'PlaneGeometry' || object.isInstancedMesh);
      object.receiveShadow = opaque;
    } else {
      object.castShadow = false;
      object.receiveShadow = false;
    }
    for (const material of materials) {
      if (!material) continue;
      material.dithering = true;
    }
  });
  return root;
}

function attachContactShadow(root, radiusX = .48, radiusZ = .32, opacity = .18) {
  if (!root || root.userData.contactShadow) return root?.userData.contactShadow || null;
  const material = new THREE.MeshBasicMaterial({
    color: 0x101712,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .018;
  shadow.scale.set(radiusX, radiusZ, 1);
  shadow.renderOrder = 1;
  shadow.userData.contactShadow = true;
  shadow.userData.baseOpacity = opacity;
  shadow.castShadow = false;
  shadow.receiveShadow = false;
  root.add(shadow);
  root.userData.contactShadow = shadow;
  return shadow;
}

function updateDynamicContactShadows(state) {
  const now = performance.now();
  if (now - lastContactShadowUpdateAt < 180) return;
  lastContactShadowUpdateAt = now;
  const daylight = THREE.MathUtils.clamp(Number(state?.daylight ?? 1), 0, 1);
  const overcast = THREE.MathUtils.clamp(Number(state?.overcast || 0), 0, 1);
  const rain = THREE.MathUtils.clamp(Number(state?.rain || 0), 0, 1);
  const lightFactor = THREE.MathUtils.clamp(.54 + daylight * .46 - overcast * .12 - rain * .08, .38, 1);
  const roots = [playerRef, ...villagers, ...ambientAnimals, ...remotePlayers.values()];
  for (const root of roots) {
    const shadow = root?.userData?.contactShadow || root?.userData?.shadow;
    if (!shadow?.material) continue;
    const baseOpacity = Number(shadow.userData?.baseOpacity ?? shadow.material.opacity ?? .18);
    shadow.material.opacity = baseOpacity * lightFactor;
    shadow.visible = root.visible !== false;
  }
}

function updateWorldWeatherVisuals(state) {
  if (!state) return;
  worldWeatherState = state;
  updateDynamicContactShadows(state);
  const wet = THREE.MathUtils.clamp(Number(state.rain || 0), 0, 1);
  const daylight = THREE.MathUtils.clamp(Number(state.daylight ?? 1), 0, 1);
  const overcast = THREE.MathUtils.clamp(Number(state.overcast || 0), 0, 1);
  const darkness = THREE.MathUtils.clamp(1 - daylight, 0, 1);
  const lightStrength = THREE.MathUtils.clamp(Math.max(darkness, overcast * .72), 0, 1);
  const lightsNeeded = !!state.needsLights;

  for (const surface of weatherRoadSurfaces) {
    surface.material.roughness = Math.max(.26, surface.baseRoughness - wet * .58);
    surface.material.metalness = surface.baseMetalness + wet * .20;
    surface.material.color.copy(surface.baseColor).multiplyScalar(1 - wet * .13 - darkness * .035);
  }
  for (const material of puddleMaterials) {
    material.opacity = wet * (.44 + lightStrength * .22);
    material.roughness = Math.max(.055, .20 - wet * .12);
    material.metalness = .10 + wet * .22;
  }
  for (const material of streetLampMaterials) {
    material.emissiveIntensity = lightsNeeded ? 1.1 + lightStrength * 1.55 : .08;
  }
  for (const light of streetLightSources) {
    light.intensity = lightsNeeded ? .55 + lightStrength * 2.65 + wet * .35 : 0;
  }
  for (const material of buildingLightMaterials) {
    material.emissiveIntensity = lightsNeeded ? .45 + lightStrength * 1.35 : .04;
  }
  for (const light of buildingLightSources) {
    light.intensity = lightsNeeded ? .30 + lightStrength * 1.45 : 0;
  }
  for (const reflection of wetReflectionMaterials) {
    const base = Number(reflection.userData?.dryGlow || 0);
    const wetBoost = Number(reflection.userData?.wetGlow || .40);
    reflection.opacity = lightsNeeded ? base * lightStrength + wet * wetBoost * (.45 + lightStrength * .55) : wet * wetBoost * .08;
  }
  for (const material of ambientVehicleLightMaterials) {
    material.emissiveIntensity = lightsNeeded ? 1.05 + lightStrength * .65 : .20;
  }

  if (autoHeadlightsOn !== lightsNeeded) {
    autoHeadlightsOn = lightsNeeded;
    applyVehicleHeadlights();
  }
}

function updateVehicleRainSpray(delta) {
  if (!jobVehicleVisual) return;
  let spray = jobVehicleVisual.userData.rainSpray;
  if (!spray) {
    const count = 28;
    const positions = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    const attribute = new THREE.BufferAttribute(positions, 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', attribute);
    const material = new THREE.PointsMaterial({
      color: 0xd4e5ec,
      size: .095,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const particles = [];
    for (let index = 0; index < count; index++) {
      particles.push({
        x: (index % 2 ? .38 : -.38) + (Math.random() - .5) * .18,
        y: .12 + Math.random() * .22,
        z: -.55 - Math.random() * .95,
        life: Math.random(),
      });
    }
    jobVehicleVisual.add(points);
    spray = jobVehicleVisual.userData.rainSpray = { points, geometry, attribute, material, positions, particles };
  }

  const speedRatio = Math.min(1, Math.abs(driveSpeed) / 7);
  const strength = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0) * speedRatio, 0, 1);
  spray.points.visible = vehicleMode !== 'walk' && strength > .06;
  spray.material.opacity = strength * (.58 + speedRatio * .24);
  if (!spray.points.visible) return;

  spray.particles.forEach((particle, index) => {
    particle.life -= delta * (1.7 + speedRatio * 2.2);
    if (particle.life <= 0) {
      particle.life = .65 + Math.random() * .55;
      particle.x = (index % 2 ? .38 : -.38) + (Math.random() - .5) * .22;
      particle.y = .10 + Math.random() * .18;
      particle.z = -.50 - Math.random() * .30;
    }
    particle.y += delta * (.38 + speedRatio * .72 + strength * .22);
    particle.z -= delta * (1.25 + speedRatio * 3.35 + strength * .55);
    particle.x += (Math.random() - .5) * delta * .35;
    const offset = index * 3;
    spray.positions[offset] = particle.x;
    spray.positions[offset + 1] = particle.y;
    spray.positions[offset + 2] = particle.z;
  });
  spray.attribute.needsUpdate = true;
}

function updateDriveHud() {
  const driving = vehicleMode !== 'walk' && !!currentDriveVehicle()?.entered;
  if (driveTools) driveTools.hidden = !driving;
  if (roadStatus) roadStatus.hidden = !driving;
  if (accelerateButton) accelerateButton.hidden = !driving;
  if (runButton) runButton.classList.toggle('driving', driving);
  if (!driving || !playerRef) return;
  const zone = roadZoneAt(playerRef.position.x, playerRef.position.z);
  const speedKmh = Math.round(Math.abs(driveSpeed) * 6);
  const driveVehicle = currentDriveVehicle();
  const fuel = Math.round(Number(driveVehicle?.fuel ?? 100));
  const condition = Math.round(Number(driveVehicle?.condition ?? 100));
  const personalDriving = currentVehicleSource() === 'personal';
  const insuranceExpired = personalDriving && driveVehicle?.insuranceActive === false;
  const licence = trafficSnapshot?.licence;
  const licenceAllowsCurrent = !personalDriving || (
    licence?.active && Array.isArray(licence.allowedKinds) && licence.allowedKinds.includes(driveVehicle?.kind)
  );
  const parkHint = Math.abs(driveSpeed) < .18 ? (zone.id === 'main' ? ' · STOPPED' : ' · PARK OK') : '';
  const insuranceHint = insuranceExpired ? ' · INS EXPIRED' : '';
  const licenceHint = personalDriving && !licenceAllowsCurrent ? ' · DL INVALID' : '';
  roadStatus.textContent = `${zone.label} · ${speedKmh}/${zone.displayLimit} km/h · FUEL ${fuel}% · COND ${condition}%${insuranceHint}${licenceHint}${parkHint}`;
  roadStatus.classList.toggle('warning', fuel <= 15 || condition <= 35 || insuranceExpired || (personalDriving && !licenceAllowsCurrent));
}

hornAction?.addEventListener('pointerdown', event => {
  event.preventDefault();
  playVehicleHorn();
});
lightsAction?.addEventListener('click', toggleVehicleHeadlights);

function createDeliveryBike() {
  const bike = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2d6f55, roughness: .68, metalness: .04 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14181a, roughness: .90 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaeb6b7, roughness: .42, metalness: .60 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe9a2, emissive: 0xffd66b, emissiveIntensity: .30 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xb92d27, emissive: 0x72130e, emissiveIntensity: .16 });

  const wheelGeometry = new THREE.TorusGeometry(.34, .072, 8, 20);
  const wheels = [];
  const frontWheels = [];
  [-.69, .69].forEach(z => {
    const root = new THREE.Group();
    root.position.set(0, .36, z);
    const wheel = new THREE.Mesh(wheelGeometry, darkMat);
    wheel.rotation.y = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .10, 10), metalMat);
    hub.rotation.z = Math.PI / 2;
    root.add(wheel, hub);
    bike.add(root);
    wheels.push(root);
    if (z > 0) frontWheels.push(root);
  });

  const engine = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .46), darkMat);
  engine.position.set(0, .53, -.02);

  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .42, 5, 10), frameMat);
  tank.rotation.x = Math.PI / 2;
  tank.position.set(0, .79, .16);
  tank.scale.set(1, .72, .86);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, 1.12), metalMat);
  frame.position.set(0, .59, 0);
  frame.rotation.x = -.05;

  const seat = new THREE.Mesh(new THREE.BoxGeometry(.40, .11, .48), darkMat);
  seat.position.set(0, .93, -.18);

  const fork = new THREE.Mesh(new THREE.BoxGeometry(.10, .68, .10), metalMat);
  fork.position.set(0, .70, .54);
  fork.rotation.x = -.16;

  const handle = new THREE.Mesh(new THREE.BoxGeometry(.70, .065, .065), metalMat);
  handle.position.set(0, 1.08, .60);

  const head = new THREE.Mesh(new THREE.SphereGeometry(.115, 8, 7), lampMaterial);
  head.position.set(0, .94, .75);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(.18, .10, .055), tailMaterial);
  tail.position.set(0, .79, -.78);

  const rearCarrier = new THREE.Mesh(new THREE.BoxGeometry(.54, .07, .48), metalMat);
  rearCarrier.position.set(0, .82, -.67);

  const mudguardFront = new THREE.Mesh(new THREE.TorusGeometry(.37, .025, 6, 16, Math.PI), frameMat);
  mudguardFront.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  mudguardFront.position.set(0, .39, .69);

  bike.add(engine, tank, frame, seat, fork, handle, head, tail, rearCarrier, mudguardFront);
  bike.userData.headlightMaterials = [lampMaterial];
  bike.userData.tailLightMaterials = [tailMaterial];
  bike.userData.wheels = wheels;
  bike.userData.frontWheels = frontWheels;
  bike.userData.wheelRadius = .34;
  bike.scale.setScalar(1.10);
  return bike;
}

function createTaxiVehicle() {
  const taxi = createRoadVehicle('car', 0xe4b52f);
  const signMat = new THREE.MeshStandardMaterial({ color: 0xfff0a0, roughness: .72 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(.72, .22, .34), signMat);
  sign.position.set(0, 1.55, -.05);
  taxi.add(sign);
  taxi.scale.setScalar(.94);
  return taxi;
}

function createPersonalCarVehicle() {
  const car = createRoadVehicle('car', 0x4d7da8);
  car.scale.setScalar(.94);
  return car;
}

function currentDriveVehicle() {
  return activeJobMission?.vehicle || garageSnapshot?.activeVehicle || null;
}

function currentVehicleSource() {
  if (activeJobMission?.vehicle) return 'job';
  if (garageSnapshot?.activeVehicle) return 'personal';
  return null;
}

function createJobVehicleVisual(kind, source = 'job') {
  if (kind === 'bike') return createDeliveryBike();
  return source === 'personal' ? createPersonalCarVehicle() : createTaxiVehicle();
}

function animateVehicleVisual(vehicle, delta, speed, steering = 0, speedRatio = 0, braking = false) {
  if (!vehicle) return;
  const wheelRadius = Math.max(.12, Number(vehicle.userData.wheelRadius || .24));
  const spin = speed / wheelRadius * delta;
  for (const wheelRoot of vehicle.userData.wheels || []) {
    const wheel = wheelRoot.children?.[0];
    const hub = wheelRoot.children?.[1];
    if (wheel) wheel.rotation.x -= spin;
    if (hub) hub.rotation.x -= spin;
  }

  const steerAngle = THREE.MathUtils.clamp(steering, -1, 1) * .30;
  for (const wheelRoot of vehicle.userData.frontWheels || []) {
    wheelRoot.rotation.y += (steerAngle - wheelRoot.rotation.y) * Math.min(1, delta * 10);
  }

  const leanTarget = -THREE.MathUtils.clamp(steering, -1, 1) * Math.min(.06, .018 + speedRatio * .045);
  const pitchTarget = braking && Math.abs(speed) > .3
    ? .018 * Math.min(1, speedRatio + .25)
    : Math.abs(speed) > .15
      ? (speed >= 0 ? -.008 : .008) * Math.min(1, speedRatio + .2)
      : 0;
  vehicle.rotation.z += (leanTarget - vehicle.rotation.z) * Math.min(1, delta * 7);
  vehicle.rotation.x += (pitchTarget - vehicle.rotation.x) * Math.min(1, delta * 6);

  for (const material of vehicle.userData.tailLightMaterials || []) {
    material.emissiveIntensity = braking ? .75 : .14;
  }
}

function restorePlayerVehiclePose() {
  const avatar = playerRef?.userData.avatar;
  if (avatar) {
    avatar.visible = true;
    avatar.position.set(0, .04, 0);
    avatar.rotation.set(0, 0, 0);
  }
  if (runButton) {
    runButton.textContent = 'RUN';
    runButton.classList.remove('driving');
    runButton.setAttribute('aria-label', 'Hold to run');
  }
  if (accelerateButton) {
    accelerateButton.hidden = true;
    accelerateButton.classList.remove('active');
  }
}

function clearJobVehicleVisual() {
  if (jobVehicleVisual) {
    const beam = jobVehicleVisual.userData.headlightBeam;
    if (beam) {
      jobVehicleVisual.remove(beam.light, beam.target);
      beam.light.dispose?.();
      jobVehicleVisual.userData.headlightBeam = null;
    }
    jobVehicleVisual.parent?.remove(jobVehicleVisual);
    disposeMissionObject(jobVehicleVisual);
    jobVehicleVisual = null;
  }
  restorePlayerVehiclePose();
  jobVehicleSignature = '';
  vehicleMode = 'walk';
  driveSpeed = 0;
  vehicleSafeReady = false;
  vehicleCollisionFrames = 0;
  headlightsOn = false;
  if (driveTools) driveTools.hidden = true;
  if (roadStatus) roadStatus.hidden = true;
  lightsAction?.classList.remove('active');
  lightsAction?.setAttribute('aria-pressed', 'false');
}

function syncJobVehicleVisual() {
  if (!sceneRef || !playerRef) return;
  const vehicle = currentDriveVehicle();
  const source = currentVehicleSource();
  const ownerKey = source === 'job' ? activeJobMission?.taskId : vehicle?.vehicleId;
  const signature = vehicle ? [source, ownerKey, vehicle.kind, vehicle.entered, vehicle.entered ? 'driving' : vehicle.x, vehicle.entered ? 'driving' : vehicle.z].join('|') : '';
  if (signature === jobVehicleSignature) return;
  clearJobVehicleVisual();
  jobVehicleSignature = signature;
  if (!vehicle) return;

  jobVehicleVisual = applyDynamicHighQuality(createJobVehicleVisual(vehicle.kind, source));
  if (vehicle.entered) {
    vehicleMode = vehicle.kind;
    driveSpeed = 0;
    vehicleCollisionFrames = 0;
    const vehicleRadius = vehicle.kind === 'taxi' ? .92 : .56;
    vehicleSafeReady = !positionBlocked(playerRef.position.x, playerRef.position.z, vehicleRadius + .06);
    if (vehicleSafeReady) {
      vehicleSafePosition.copy(playerRef.position);
      vehicleSafeRotation = playerRef.rotation.y;
    }
    jobVehicleVisual.position.set(0, 0, 0);
    playerRef.add(jobVehicleVisual);
    const avatar = playerRef.userData.avatar;
    if (avatar) {
      if (vehicle.kind === 'taxi') avatar.visible = false;
      else {
        avatar.visible = true;
        avatar.position.set(0, .56, -.08);
      }
    }
    runButton.textContent = 'BRAKE';
    runButton.classList.add('driving');
    runButton.setAttribute('aria-label', 'Hold to brake');
    applyVehicleHeadlights();
    updateDriveHud();
  } else {
    vehicleMode = 'walk';
    jobVehicleVisual.position.set(Number(vehicle.x) || 0, 0, Number(vehicle.z) || 0);
    const parkedLabel = currentVehicleSource() === 'personal' && vehicle.registration ? vehicle.registration : (vehicle.label || 'Job Vehicle');
    jobVehicleVisual.add(missionTag(parkedLabel, '#6e5412'));
    sceneRef.add(jobVehicleVisual);
    restorePlayerVehiclePose();
  }
}

function updateVehicleAction() {
  if (!vehicleAction) return;
  vehicleAction.hidden = true;
  vehicleAction.disabled = false;
  vehicleAction.classList.remove('exit');
  const vehicle = currentDriveVehicle();
  if (!profile || !playerRef || !vehicle) return;

  if (vehicle.entered) {
    vehicleAction.hidden = false;
    vehicleAction.classList.add('exit');
    const moving = Math.abs(driveSpeed) > .8;
    vehicleAction.disabled = moving;
    const vehicleLabel = vehicle.kind === 'bike' ? 'BIKE' : (currentVehicleSource() === 'personal' ? 'CAR' : 'TAXI');
    vehicleAction.textContent = moving ? 'STOP TO PARK' : `PARK ${vehicleLabel}`;
    return;
  }
  const distance = Math.hypot(Number(vehicle.x) - playerRef.position.x, Number(vehicle.z) - playerRef.position.z);
  if (distance <= Number(vehicle.radius || 4.5) + .35) {
    vehicleAction.hidden = false;
    const vehicleLabel = vehicle.kind === 'bike' ? 'BIKE' : (currentVehicleSource() === 'personal' ? 'CAR' : 'TAXI');
    vehicleAction.textContent = `ENTER ${vehicleLabel}`;
  }
}

function addCarryVisual(kind) {
  if (!playerRef) return;
  if (kind === 'parcel') {
    jobCarryVisual = parcelVisual();
    const onBike = activeJobMission?.vehicle?.entered && activeJobMission.vehicle.kind === 'bike';
    jobCarryVisual.scale.setScalar(onBike ? .48 : .65);
    jobCarryVisual.position.set(0, onBike ? .78 : 1.28, onBike ? -.72 : -.42);
  } else if (kind === 'passenger') {
    jobCarryVisual = passengerVisual();
    const inTaxi = activeJobMission?.vehicle?.entered && activeJobMission.vehicle.kind === 'taxi';
    jobCarryVisual.scale.setScalar(inTaxi ? .52 : .72);
    jobCarryVisual.position.set(inTaxi ? .45 : .88, inTaxi ? .34 : 0, inTaxi ? -.18 : .18);
  }
  if (jobCarryVisual) playerRef.add(jobCarryVisual);
}

function syncJobWorldVisual() {
  if (!sceneRef || !playerRef) return;
  const active = activeJobMission;
  const target = active?.target;
  const signature = active ? [active.taskId, active.jobId, active.phase, active.stepIndex, target?.x, target?.z].join('|') : '';
  if (signature === jobVisualSignature) return;
  clearJobMissionVisual();
  jobVisualSignature = signature;
  if (!active) return;

  if (active.phase === 'travel' && target) {
    const root = new THREE.Group();
    root.position.set(Number(target.x) || 0, 0, Number(target.z) || 0);
    const marker = missionMarker(active.jobId === 'taxi' ? 0x6fc8ff : active.jobId === 'delivery' ? 0xf4c95d : 0x65e69b);
    root.add(marker);
    root.userData.marker = marker;

    if (active.jobId === 'delivery') {
      if (Number(active.stepIndex || 0) === 0) {
        const parcel = parcelVisual();
        parcel.position.y = .04;
        root.add(parcel, missionTag('Parcel Pickup', '#805321'));
      } else {
        root.add(missionTag('Customer Drop-off', '#805321'));
        addCarryVisual('parcel');
      }
    } else if (active.jobId === 'taxi') {
      if (Number(active.stepIndex || 0) === 0) {
        const passenger = passengerVisual();
        passenger.position.set(0, .03, 0);
        root.add(passenger, missionTag('Passenger', '#245b75'));
      } else {
        root.add(missionTag('Taxi Drop-off', '#245b75'));
        addCarryVisual('passenger');
      }
    } else if (active.jobId === 'shop') {
      root.add(shopVisual());
    }
    sceneRef.add(root);
    jobWorldVisual = root;
  } else if (active.phase === 'working' && target && active.jobId === 'shop') {
    const root = new THREE.Group();
    root.position.set(Number(target.x) || 0, 0, Number(target.z) || 0);
    const marker = missionMarker(0x65e69b);
    root.add(marker, shopVisual());
    root.userData.marker = marker;
    sceneRef.add(root);
    jobWorldVisual = root;
  }
}

function nearestTalkableVillager(maxDistance = 4.8) {
  if (!playerRef || vehicleMode !== 'walk') return null;
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const villager of villagers) {
    if (!villager?.visible || !villager.userData?.npc) continue;
    const data = villager.userData;
    if (data.behavior === 'crossing') continue;
    const distance = Math.hypot(
      villager.position.x - playerRef.position.x,
      villager.position.z - playerRef.position.z,
    );
    if (distance < nearestDistance) {
      nearest = villager;
      nearestDistance = distance;
    }
  }
  return nearest ? { villager: nearest, distance: nearestDistance } : null;
}

function npcRelationshipForId(npcId) {
  return npcRelationshipSnapshot?.relationships?.find?.(relation => relation.npcId === npcId) || null;
}

function updateNpcLabel(villager) {
  const data = villager?.userData;
  if (!data) return;
  const relationship = data.relationship || npcRelationshipForId(data.relationshipId);
  if (relationship) data.relationship = relationship;
  const tier = relationship?.tier && relationship.tier !== 'Stranger' ? ` · ${relationship.tier}` : '';
  const favor = data.favorOffer && !activeNpcFavor ? ' · FAVOR' : '';
  updateNameLabel(villager, `${data.name} · ${data.role || 'Local'}${tier}${favor}`, data.relationshipId || `npc-${data.npcIndex}`);
}

function npcConversationReply(villager) {
  const data = villager?.userData || {};
  const role = String(data.role || 'Local');
  const hour = Number(worldWeatherState.hour ?? 12);
  const rain = Number(worldWeatherState.rain || 0);
  const weather = String(worldWeatherState.weather || 'Clear');
  const morning = hour >= 5 && hour < 11.5;
  const evening = hour >= 16.5 && hour < 20;
  const night = hour >= 20 || hour < 5;
  const timeGreeting = morning ? 'Good morning' : evening ? 'Good evening' : night ? 'Good night' : 'Hello';

  const roleReplies = {
    Shopkeeper: [
      'Welcome! The shop is open. Take a look around.',
      'Busy little day here. Good to see you.',
      'Need anything? The village shop is right here.',
    ],
    Customer: [
      'Just stopped by the shop for a few things.',
      'This road gets lively around shopping time.',
      'I am finishing a quick village errand.',
    ],
    Waiting: [
      'I am waiting for the next bus.',
      'The bus should come along this road.',
      'Just waiting here for a ride.',
    ],
    Shopper: [
      'I am picking up a few things from the shop.',
      'Nice to see the village busy today.',
      'Quick shopping trip, then I am heading back.',
    ],
    Phone: [
      'One minute—I was just checking my phone.',
      'Finished my call. How are you?',
      'Signal is good around this side of the road.',
    ],
    Talking: [
      'We were just chatting about the day.',
      'Come say hello. It is a quiet moment.',
      'Nothing urgent—just a village conversation.',
    ],
    Worker: [
      'I am on my way to work now.',
      'Another workday in the village.',
      'I will be heading home after the shift.',
    ],
    Commuter: [
      'I am heading toward the bus stop.',
      'I usually take the Village Line from here.',
      'Just finishing my trip through town.',
    ],
    'Tea Break': [
      'Tea break time. The bakery is busy now.',
      'A quick tea, then back to work.',
      'Nothing like a short tea break in the village.',
    ],
    'Going Home': [
      'Work is done. I am heading home.',
      'Evening time—I am going back home now.',
      'See you tomorrow. I am on my way home.',
    ],
    'Event Guest': [
      'The community event is active—come join us.',
      'A few of us came over for the village event.',
      'It is nice seeing the village gather together.',
    ],
    Local: [
      'Nice to meet you. Enjoy the village.',
      'Have a good walk around Kerala Play.',
      'The roads are peaceful today. Take care.',
    ],
  };
  const pool = roleReplies[role] || roleReplies.Local;
  const index = Math.abs(Number(data.npcIndex || 0) + Number(data.talkCount || 0)) % pool.length;
  const hunger = Number(needsSnapshot?.hunger ?? 100);
  const thirst = Number(needsSnapshot?.thirst ?? 100);
  const energy = Number(needsSnapshot?.energy ?? 100);

  if (activeJobMission) return `${timeGreeting}! Looks like you are on the ${activeJobMission.title} shift—good luck with the next stop.`;
  if (thirst <= 22) return `${timeGreeting}! You look thirsty. Get some water from a nearby village shop.`;
  if (hunger <= 22) return `${timeGreeting}! You should eat soon. The village shops have snacks and meals.`;
  if (energy <= 22) return `${timeGreeting}! You look tired. Try the rest bench or head home for sleep.`;
  if (homeSnapshot?.rentOverdue || homeSnapshot?.utilityOverdue) return `${timeGreeting}! Remember to check your HOME panel—one of your bills is due.`;

  const relationTier = String(data.relationship?.tier || '');
  const recognition = relationTier === 'Trusted'
    ? 'Good to see you again—you are part of the regular crowd here.'
    : relationTier === 'Friendly'
      ? 'Nice to see you again. I remember you well.'
      : relationTier === 'Familiar'
        ? 'I remember you from your earlier visits.'
        : relationTier === 'Acquaintance'
          ? 'I recognize you now.'
          : '';

  if (rain > .58) return `${timeGreeting}! ${recognition ? recognition + ' ' : ''}Heavy rain today—stay under cover when you can.`;
  if (rain > .12) return `${timeGreeting}! ${recognition ? recognition + ' ' : ''}It is raining, so watch the wet road.`;
  if (weather === 'Cloudy') return `${timeGreeting}! ${recognition ? recognition + ' ' : ''}Cloudy weather today, but the village is active.`;
  if (night) return `${timeGreeting}! ${recognition ? recognition + ' ' : ''}The streets are quieter now—travel safely.`;
  return `${timeGreeting}! ${recognition ? recognition + ' ' : ''}${pool[index]}`;
}

function interactWithNpc(index) {
  const villager = villagers[Number(index)];
  if (!villager?.visible || !playerRef || vehicleMode !== 'walk') return;
  const distance = Math.hypot(
    villager.position.x - playerRef.position.x,
    villager.position.z - playerRef.position.z,
  );
  if (distance > 3.65) {
    showToast(`Move closer to ${villager.userData?.name || 'talk'}`);
    return;
  }
  const data = villager.userData;
  data.talkCount = Number(data.talkCount || 0) + 1;
  data.interactionUntil = performance.now() + 3200;
  data.interactionPlayerX = playerRef.position.x;
  data.interactionPlayerZ = playerRef.position.z;
  const reply = npcConversationReply(villager);
  showToast(`${data.name}: ${reply}`, 3400);
  window.dispatchEvent(new CustomEvent('kerala-npc-interact', {
    detail: {
      npcId: data.relationshipId || `npc-${data.npcIndex}`,
      npcIndex: data.npcIndex,
      name: data.name,
      role: data.role,
    },
  }));
}

function applyNpcFavorState(favor) {
  activeNpcFavor = favor || null;
  npcFavorCompletionPending = false;
  if (activeNpcFavor) {
    for (const villager of villagers) {
      if (villager?.userData?.npc) {
        villager.userData.favorOffer = null;
        updateNpcLabel(villager);
      }
    }
    missionText.textContent = `Favor for ${activeNpcFavor.npcName}: ${activeNpcFavor.action || activeNpcFavor.title}`;
    landmarkStatus.textContent = `${activeNpcFavor.target?.label || 'Destination'} · community favor`;
  } else {
    updateLifeLoopMission();
  }
  updateWorldInteract();
  renderMapLandmarks();
  if (playerRef) updateMapPlayer(playerRef);
}

window.addEventListener('kerala-npc-relationships-sync', event => {
  npcRelationshipSnapshot = event.detail || null;
  applyNpcFavorState(npcRelationshipSnapshot?.activeFavor || null);
  for (const villager of villagers) {
    const data = villager?.userData;
    if (!data?.npc) continue;
    data.relationship = npcRelationshipForId(data.relationshipId);
    updateNpcLabel(villager);
  }
});

window.addEventListener('kerala-npc-favor-offer', event => {
  const offer = event.detail?.offer || null;
  const npcId = String(event.detail?.npcId || offer?.npcId || '');
  const villager = villagers.find(item => item?.userData?.relationshipId === npcId);
  if (!villager) return;
  villager.userData.favorOffer = offer;
  updateNpcLabel(villager);
  updateWorldInteract();
  if (offer) showToast(`${villager.userData.name} has a small favor · tap HELP when ready`, 3600);
});

window.addEventListener('kerala-npc-favor-state', event => {
  applyNpcFavorState(event.detail || null);
});

window.addEventListener('kerala-npc-favor-completion-reset', () => {
  npcFavorCompletionPending = false;
  updateWorldInteract();
});

function activeCommunityEvent() {
  const event = communityEventsSnapshot?.current || null;
  return event?.status === 'active' && !event.completed ? event : null;
}

window.addEventListener('kerala-community-events-sync', event => {
  communityEventsSnapshot = event.detail || null;
  communityEventPending = false;
  updateWorldInteract();
});

window.addEventListener('kerala-community-event-navigate', event => {
  const communityEvent = event.detail || null;
  const target = communityEvent?.target;
  if (!target || !Number.isFinite(Number(target.x)) || !Number.isFinite(Number(target.z))) return;
  setWaypoint({
    id: String(target.id || communityEvent.id),
    name: `${communityEvent.icon || '📌'} ${communityEvent.title} · ${target.label || 'Village'}`,
    icon: communityEvent.icon || '📌',
    x: Number(target.x),
    z: Number(target.z),
    kind: 'event',
    district: 'Village',
  });
});

window.addEventListener('kerala-community-event-pending-reset', () => {
  communityEventPending = false;
  updateWorldInteract();
});

window.addEventListener('kerala-community-event-completed', event => {
  const result = event.detail || null;
  communityEventsSnapshot = result.events || communityEventsSnapshot;
  communityEventPending = false;
  const targetId = result.completed?.target?.id;
  if (targetId && selectedDestination?.id === targetId) {
    selectedDestination = null;
    selectedLandmark = null;
    window.dispatchEvent(new CustomEvent('kerala-destination-cleared', { detail: { id: targetId, reason: 'community-event-complete' } }));
    renderMapLandmarks();
  }
  updateWorldInteract();
  updateLifeLoopMission();
});

window.addEventListener('kerala-npc-relationship-result', event => {
  const result = event.detail || null;
  if (!result?.relationship?.npcId) return;
  const relationship = result.relationship;
  const existing = Array.isArray(npcRelationshipSnapshot?.relationships)
    ? npcRelationshipSnapshot.relationships.filter(item => item.npcId !== relationship.npcId)
    : [];
  npcRelationshipSnapshot = {
    ...(npcRelationshipSnapshot || {}),
    reputation: result.reputation || npcRelationshipSnapshot?.reputation || null,
    relationships: [...existing, relationship],
  };
  const villager = villagers.find(item => item?.userData?.relationshipId === relationship.npcId);
  if (villager) {
    villager.userData.relationship = relationship;
    updateNpcLabel(villager);
  }
  if (relationship.tierChanged && relationship.tier !== 'Stranger') {
    const reputation = result.reputation;
    showToast(
      `${relationship.name} · ${relationship.tier} relationship${reputation ? ` · Local rep ${reputation.value}/100` : ''}`,
      3800
    );
  }
});

function worldShopIsOpen(spot, hour = Number(worldWeatherState.hour ?? 12)) {
  if (!spot || spot.kind !== 'shop') return true;
  const open = Number(spot.openHour ?? 0);
  const close = Number(spot.closeHour ?? 24);
  return open <= close ? hour >= open && hour < close : hour >= open || hour < close;
}

function worldHourLabel(value) {
  const hour = Math.floor(Number(value) || 0) % 24;
  const minute = Math.round((((Number(value) || 0) % 1) + 1) % 1 * 60);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function recommendedWorldShopItem(spot) {
  const available = Array.isArray(spot?.items) ? spot.items : [];
  const hunger = Number(needsSnapshot?.hunger ?? 100);
  const thirst = Number(needsSnapshot?.thirst ?? 100);
  const energy = Number(needsSnapshot?.energy ?? 100);
  if (hunger < 48 && available.includes('meal')) return 'meal';
  if (thirst < 58 && available.includes('water')) return 'water';
  if (hunger < 78 && available.includes('snack')) return 'snack';
  if (energy < 78 && available.includes('tea')) return 'tea';
  return available.includes('tea') ? 'tea' : available[0] || 'water';
}

function nearestWorldActivity(maxDistance = 7.2) {
  if (!playerRef || vehicleMode !== 'walk') return null;
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const spot of WORLD_ACTIVITY_SPOTS) {
    const distance = Math.hypot(playerRef.position.x - spot.x, playerRef.position.z - spot.z);
    const discoverRadius = Number(spot.discoverRadius || maxDistance);
    if (distance <= discoverRadius && distance < nearestDistance) {
      nearest = spot;
      nearestDistance = distance;
    }
  }
  return nearest ? { spot: nearest, distance: nearestDistance } : null;
}

function performWorldActivity(activityId) {
  const spot = WORLD_ACTIVITY_SPOTS.find(item => item.id === activityId);
  if (!spot || performance.now() - lastWorldActivityAt < 700) return;
  lastWorldActivityAt = performance.now();

  if (spot.kind === 'bus') {
    showToast(`${spot.label} · checking Village Line timetable…`, 2200);
    window.dispatchEvent(new CustomEvent('kerala-bus-stop-view', {
      detail: { routeId: 'village-line', stopId: spot.id },
    }));
    return;
  }

  if (spot.kind === 'service') {
    if (spot.service === 'clinic') {
      api('/api/needs/clinic', { method: 'POST', body: '{}' }).then(result => {
        if (result?.needs) applyNeedsState(result.needs, { warn: false });
        showToast(`Clinic care complete · ₹${Number(result?.fee || 0)} · energy restored`, 3600);
      }).catch(error => showToast(error.message || 'Clinic care unavailable', 3600));
      return;
    }
    const message = spot.service === 'police'
      ? 'Kerala Police Station · public help desk is available'
      : 'Fire & Rescue Station · emergency response crew is on duty';
    showToast(message, 3600);
    return;
  }

  if (spot.kind === 'view') {
    const rain = Number(worldWeatherState.rain || 0);
    showToast(
      rain > .18
        ? 'Village Pond · monsoon water is rising softly around the banks'
        : 'Village Pond · a quiet place to stop and look around',
      3600
    );
  }
}

function updateLifeLoopMission() {
  if (!missionText || !landmarkStatus || activeJobMission || activeNpcFavor || selectedDestination) return;
  const hunger = Number(needsSnapshot?.hunger ?? 100);
  const thirst = Number(needsSnapshot?.thirst ?? 100);
  const energy = Number(needsSnapshot?.energy ?? 100);

  if (thirst <= 25) {
    lifeLoopAction = 'map';
    missionText.textContent = 'Daily need: get water';
    landmarkStatus.textContent = 'Visit a nearby village shop';
  } else if (hunger <= 25) {
    lifeLoopAction = 'map';
    missionText.textContent = 'Daily need: get food';
    landmarkStatus.textContent = 'Visit a nearby village shop';
  } else if (energy <= 25) {
    lifeLoopAction = 'map';
    missionText.textContent = 'Daily need: recover energy';
    landmarkStatus.textContent = 'Rest bench or Village Rental Home';
  } else if (homeSnapshot?.accessBlocked || homeSnapshot?.rentOverdue || homeSnapshot?.utilityOverdue) {
    lifeLoopAction = 'home';
    missionText.textContent = 'Home payment needs attention';
    landmarkStatus.textContent = 'Open HOME to review rent and utilities';
  } else {
    lifeLoopAction = 'jobs';
    missionText.textContent = 'Daily life: choose a job';
    landmarkStatus.textContent = 'Work → salary → home, food and vehicles';
  }
  missionCard.dataset.lifeAction = lifeLoopAction;
}

function updateWorldInteract() {
  if (!worldInteract) return;
  worldInteract.hidden = true;
  worldInteract.disabled = false;
  worldInteract.dataset.mode = '';
  worldInteract.dataset.service = '';
  worldInteract.dataset.source = '';
  worldInteract.dataset.npc = '';
  worldInteract.dataset.shop = '';
  worldInteract.dataset.itemId = '';
  worldInteract.dataset.activity = '';
  worldInteract.title = '';
  if (!profile || !playerRef) return;
  const active = activeJobMission;
  const checkpoint = trafficSnapshot?.checkpoint;
  const driveVehicle = currentDriveVehicle();
  if (currentVehicleSource() === 'personal' && driveVehicle?.entered && checkpoint && Math.abs(driveSpeed) < .18) {
    const checkpointDistance = Math.hypot(playerRef.position.x - Number(checkpoint.x), playerRef.position.z - Number(checkpoint.z));
    if (checkpointDistance <= Number(checkpoint.radius || 7) + .35) {
      worldInteract.hidden = false;
      worldInteract.dataset.mode = 'traffic-checkpoint';
      worldInteract.textContent = 'CHECK DOCUMENTS';
      return;
    }
  }
  const station = nearestVehicleStation();
  if (station && Math.abs(driveSpeed) < .18) {
    const vehicle = currentDriveVehicle();
    const needed = station.action === 'refuel' ? Number(vehicle.fuel) < Number(vehicle.fuelMax || 100) - .5 : Number(vehicle.condition) < Number(vehicle.conditionMax || 100) - 1;
    if (needed) {
      worldInteract.hidden = false;
      worldInteract.dataset.mode = 'vehicle-service';
      worldInteract.dataset.service = station.action;
      worldInteract.dataset.source = currentVehicleSource() || 'job';
      worldInteract.textContent = station.action === 'refuel' ? `REFUEL · FUEL ${Math.round(Number(vehicle.fuel))}%` : `REPAIR · COND ${Math.round(Number(vehicle.condition))}%`;
      return;
    }
  }

  if (!active && !activeNpcFavor && vehicleMode === 'walk') {
    const communityEvent = activeCommunityEvent();
    const target = communityEvent?.target;
    if (target) {
      const distance = Math.hypot(playerRef.position.x - Number(target.x), playerRef.position.z - Number(target.z));
      if (distance <= Number(target.radius || 6) + .45) {
        worldInteract.hidden = false;
        worldInteract.disabled = communityEventPending;
        worldInteract.dataset.mode = 'community-event';
        worldInteract.dataset.activity = communityEvent.id;
        worldInteract.textContent = communityEventPending
          ? 'JOINING EVENT…'
          : `JOIN EVENT · ₹${Number(communityEvent.cashReward || 0)} + ${Number(communityEvent.pointsReward || 0)}P`;
        worldInteract.title = `${communityEvent.title} · ${target.label}`;
        return;
      }
    }
  }

  if (!active && vehicleMode === 'walk' && homeSnapshot?.home) {
    const home = homeSnapshot.home;
    const distance = Math.hypot(playerRef.position.x - Number(home.x), playerRef.position.z - Number(home.z));
    if (distance <= Number(home.radius || 5.2) + .3) {
      worldInteract.hidden = false;
      worldInteract.dataset.mode = homeSnapshot.accessBlocked ? 'home-open' : 'home-sleep';
      worldInteract.textContent = homeSnapshot.accessBlocked
        ? 'OPEN HOME · PAYMENT DUE'
        : `SLEEP · ENERGY ${Math.round(Number(needsSnapshot?.energy ?? 100))}%`;
      worldInteract.disabled = false;
      return;
    }
  }

  if (!active && vehicleMode === 'walk' && needsSnapshot?.restPoint) {
    const rest = needsSnapshot.restPoint;
    const distance = Math.hypot(playerRef.position.x - Number(rest.x), playerRef.position.z - Number(rest.z));
    if (distance <= Number(rest.radius || 5.2) + .3) {
      const waitMs = Math.max(0, Number(needsSnapshot.restReadyAt || 0) - Date.now());
      const full = Number(needsSnapshot.energy ?? 100) >= 99;
      worldInteract.hidden = false;
      worldInteract.dataset.mode = 'needs-rest';
      worldInteract.disabled = full || waitMs > 0;
      worldInteract.title = full
        ? 'Energy is already full'
        : waitMs > 0
          ? 'Bench rest is cooling down'
          : 'Sit and recover energy';
      worldInteract.textContent = full
        ? 'REST · ENERGY FULL'
        : waitMs > 0
          ? `REST READY · ${Math.ceil(waitMs / 1000)}s`
          : `REST · ENERGY ${Math.round(Number(needsSnapshot.energy ?? 100))}%`;
      return;
    }
  }

  if (!active && activeNpcFavor?.target && vehicleMode === 'walk') {
    const target = activeNpcFavor.target;
    const distance = Math.hypot(playerRef.position.x - Number(target.x), playerRef.position.z - Number(target.z));
    const radius = Number(target.radius || 5.5);
    if (distance <= radius + .35) {
      worldInteract.hidden = false;
      worldInteract.disabled = npcFavorCompletionPending;
      worldInteract.dataset.mode = 'npc-favor-complete';
      worldInteract.textContent = npcFavorCompletionPending ? 'COMPLETING FAVOR…' : `COMPLETE FAVOR · ₹${Number(activeNpcFavor.reward || 0)}`;
      worldInteract.title = `${activeNpcFavor.npcName} · ${activeNpcFavor.title}`;
      return;
    }
  }

  if (!active && vehicleMode === 'walk') {
    const nearbyFavorNpc = nearestTalkableVillager();
    if (nearbyFavorNpc?.distance <= 3.65) {
      const favorData = nearbyFavorNpc.villager.userData;
      const favorTalking = Number(favorData.interactionUntil || 0) > performance.now();
      if (favorData.favorOffer && !activeNpcFavor && !favorTalking) {
        worldInteract.hidden = false;
        worldInteract.disabled = false;
        worldInteract.dataset.mode = 'npc-favor-start';
        worldInteract.dataset.npc = String(favorData.npcIndex);
        worldInteract.textContent = `HELP · ${String(favorData.name).toUpperCase()}`;
        worldInteract.title = `${favorData.favorOffer.title} · reward ₹${Number(favorData.favorOffer.reward || 0)}`;
        return;
      }
    }

    const nearbyActivity = nearestWorldActivity();
    if (nearbyActivity) {
      const { spot, distance } = nearbyActivity;
      const closeEnough = distance <= Number(spot.radius || 3.8);
      worldInteract.hidden = false;
      worldInteract.disabled = !closeEnough;
      worldInteract.title = closeEnough
        ? spot.label
        : `${spot.label} · ${distance.toFixed(1)} m away`;

      if (spot.kind === 'shop') {
        const itemId = recommendedWorldShopItem(spot);
        const item = WORLD_SHOP_ITEMS[itemId] || WORLD_SHOP_ITEMS.tea;
        const shopOpen = worldShopIsOpen(spot);
        worldInteract.dataset.mode = closeEnough && shopOpen ? 'world-shop-open' : '';
        worldInteract.dataset.shop = closeEnough && shopOpen ? spot.id : '';
        worldInteract.dataset.itemId = closeEnough && shopOpen ? itemId : '';
        worldInteract.disabled = !closeEnough || !shopOpen;
        worldInteract.textContent = !shopOpen
          ? `CLOSED · OPENS ${worldHourLabel(spot.openHour)}`
          : closeEnough
            ? `OPEN SHOP · ${spot.label.toUpperCase()}`
            : `COME CLOSER · ${spot.label.toUpperCase()}`;
        worldInteract.title = !shopOpen
          ? `${spot.label} · closed · ${worldHourLabel(spot.openHour)}–${worldHourLabel(spot.closeHour)}`
          : closeEnough
            ? `${spot.label} · suggested: ${item.name}`
            : worldInteract.title;
      } else if (spot.kind === 'service') {
        worldInteract.dataset.mode = closeEnough ? 'world-service' : '';
        worldInteract.dataset.activity = closeEnough ? spot.id : '';
        worldInteract.disabled = !closeEnough;
        const action = spot.service === 'clinic' ? 'VISIT CLINIC' : spot.service === 'police' ? 'ASK POLICE HELP' : 'CONTACT FIRE & RESCUE';
        worldInteract.textContent = closeEnough ? action : `COME CLOSER · ${spot.label.toUpperCase()}`;
        worldInteract.title = closeEnough ? `${spot.label} · essential public service` : worldInteract.title;
      } else if (spot.kind === 'bus') {
        const status = busTravelStatus?.stop?.id === spot.id ? busTravelStatus : null;
        const serverOffset = Number(status?.serverNow || 0) - Number(status?.receivedAt || 0);
        const travelNow = Date.now() + (Number.isFinite(serverOffset) ? serverOffset : 0);
        const arrivalAt = Number(status?.arrivalAt || 0);
        const boardingUntil = Number(status?.boardingUntil || 0);
        const boarding = !!status && travelNow >= arrivalAt && travelNow <= boardingUntil;
        const waiting = !!status && travelNow < arrivalAt;
        if (status && travelNow > boardingUntil) busTravelStatus = null;

        worldInteract.dataset.activity = closeEnough ? spot.id : '';
        if (!closeEnough) {
          worldInteract.dataset.mode = '';
          worldInteract.textContent = `NEARBY · ${spot.label.toUpperCase()}`;
        } else if (boarding) {
          worldInteract.dataset.mode = 'bus-board';
          worldInteract.dataset.activity = spot.id;
          worldInteract.textContent = `BOARD BUS · ₹${Number(status.fare || 0)}`;
          worldInteract.title = `${status.routeLabel || 'Village Line'} → ${status.destination?.label || 'next stop'} · boarding now`;
        } else if (waiting) {
          const seconds = Math.max(1, Math.ceil((arrivalAt - travelNow) / 1000));
          worldInteract.dataset.mode = 'bus-check';
          worldInteract.dataset.activity = spot.id;
          worldInteract.textContent = `WAIT BUS · ${seconds}s`;
          worldInteract.title = `${status.routeLabel || 'Village Line'} → ${status.destination?.label || 'next stop'} · fare ₹${Number(status.fare || 0)}`;
        } else {
          worldInteract.dataset.mode = 'world-activity';
          worldInteract.dataset.activity = spot.id;
          worldInteract.textContent = 'CHECK BUS TIMES';
        }
      } else {
        worldInteract.dataset.mode = closeEnough ? 'world-activity' : '';
        worldInteract.dataset.activity = closeEnough ? spot.id : '';
        worldInteract.textContent = closeEnough
          ? 'ENJOY POND VIEW'
          : `NEARBY · ${spot.label.toUpperCase()}`;
      }
      return;
    }

    const nearbyNpc = nearestTalkableVillager();
    if (nearbyNpc) {
      const data = nearbyNpc.villager.userData;
      const talking = Number(data.interactionUntil || 0) > performance.now();
      const closeEnough = nearbyNpc.distance <= 3.65;
      const favorReady = !!data.favorOffer && !activeNpcFavor && !talking;
      worldInteract.hidden = false;
      worldInteract.dataset.mode = closeEnough ? (favorReady ? 'npc-favor-start' : 'npc-talk') : '';
      worldInteract.dataset.npc = closeEnough ? String(data.npcIndex) : '';
      worldInteract.disabled = talking || !closeEnough;
      worldInteract.title = talking
        ? `Conversation with ${data.name}`
        : closeEnough
          ? (favorReady ? `${data.favorOffer.title} · reward ₹${Number(data.favorOffer.reward || 0)}` : `Talk to ${data.name}`)
          : `${data.name} · ${nearbyNpc.distance.toFixed(1)} m away`;
      worldInteract.textContent = talking
        ? `💬 ${String(data.name).toUpperCase()}`
        : closeEnough
          ? favorReady
            ? `HELP · ${String(data.name).toUpperCase()}`
            : `TALK · ${String(data.name).toUpperCase()}`
          : `COME CLOSER · ${String(data.name).toUpperCase()}`;
      return;
    }
  }

  if (!active) return;

  if (active.phase === 'travel' && active.target) {
    if (active.vehicle && !active.vehicle.entered) return;
    const distance = Math.hypot(Number(active.target.x) - playerRef.position.x, Number(active.target.z) - playerRef.position.z);
    const radius = Number(active.target.radius || 5.5);
    if (distance <= radius + .35) {
      worldInteract.textContent = active.target.action || 'INTERACT';
      worldInteract.dataset.mode = 'job';
      worldInteract.hidden = false;
    }
    return;
  }
  if (active.phase === 'working') {
    if (active.target) {
      const distance = Math.hypot(Number(active.target.x) - playerRef.position.x, Number(active.target.z) - playerRef.position.z);
      if (distance > Number(active.target.radius || 5.5) + .35) return;
    }
    const seconds = Math.max(0, Math.ceil((Number(active.readyAt || 0) - Date.now()) / 1000));
    worldInteract.hidden = false;
    worldInteract.dataset.mode = 'job';
    worldInteract.disabled = seconds > 0;
    worldInteract.textContent = seconds > 0 ? `WORKING · ${seconds}s` : 'FINISH SHIFT';
    return;
  }
  if (active.phase === 'ready') {
    worldInteract.hidden = false;
    worldInteract.dataset.mode = 'job';
    worldInteract.textContent = 'COLLECT SALARY';
  }
}

function animateJobMissionVisual(time) {
  const marker = jobWorldVisual?.userData.marker;
  if (marker) {
    marker.userData.ring.rotation.z = time * .55;
    marker.userData.arrow.position.y = 2.45 + Math.sin(time * 3.2) * .18;
  }
  const passenger = jobCarryVisual?.userData.passengerHuman;
  if (passenger) animateHuman(passenger, time * 2, 0);
}

worldInteract?.addEventListener('click', () => {
  if (worldInteract.disabled) return;
  worldInteract.disabled = true;
  if (worldInteract.dataset.mode === 'vehicle-service') {
    window.dispatchEvent(new CustomEvent('kerala-vehicle-service', { detail: { action: worldInteract.dataset.service, source: worldInteract.dataset.source || 'job' } }));
  } else if (worldInteract.dataset.mode === 'traffic-checkpoint') {
    window.dispatchEvent(new CustomEvent('kerala-traffic-checkpoint'));
  } else if (worldInteract.dataset.mode === 'needs-rest') {
    window.dispatchEvent(new CustomEvent('kerala-needs-rest'));
  } else if (worldInteract.dataset.mode === 'home-sleep') {
    window.dispatchEvent(new CustomEvent('kerala-home-sleep'));
  } else if (worldInteract.dataset.mode === 'home-open') {
    window.dispatchEvent(new CustomEvent('kerala-open-home'));
  } else if (worldInteract.dataset.mode === 'world-service') {
    performWorldActivity(worldInteract.dataset.activity);
  } else if (worldInteract.dataset.mode === 'world-shop-open') {
    const spot = WORLD_ACTIVITY_SPOTS.find(item => item.id === worldInteract.dataset.shop && item.kind === 'shop');
    if (spot) {
      window.dispatchEvent(new CustomEvent('kerala-world-shop-open', {
        detail: {
          shopId: spot.id,
          label: spot.label,
          items: [...spot.items],
          suggestedItemId: recommendedWorldShopItem(spot),
        },
      }));
    }
  } else if (worldInteract.dataset.mode === 'bus-check') {
    window.dispatchEvent(new CustomEvent('kerala-bus-stop-view', {
      detail: { routeId: 'village-line', stopId: worldInteract.dataset.activity },
    }));
  } else if (worldInteract.dataset.mode === 'bus-board') {
    window.dispatchEvent(new CustomEvent('kerala-bus-board', {
      detail: { routeId: 'village-line', stopId: worldInteract.dataset.activity },
    }));
  } else if (worldInteract.dataset.mode === 'world-activity') {
    performWorldActivity(worldInteract.dataset.activity);
  } else if (worldInteract.dataset.mode === 'npc-talk') {
    interactWithNpc(worldInteract.dataset.npc);
  } else if (worldInteract.dataset.mode === 'community-event') {
    const communityEvent = activeCommunityEvent();
    if (communityEvent && !communityEventPending) {
      communityEventPending = true;
      window.dispatchEvent(new CustomEvent('kerala-community-event-participate', {
        detail: { eventId: communityEvent.id },
      }));
    }
  } else if (worldInteract.dataset.mode === 'npc-favor-start') {
    const villager = villagers[Number(worldInteract.dataset.npc)];
    if (villager?.userData?.favorOffer) {
      window.dispatchEvent(new CustomEvent('kerala-npc-favor-start', {
        detail: { npcId: villager.userData.relationshipId, offer: villager.userData.favorOffer },
      }));
    }
  } else if (worldInteract.dataset.mode === 'npc-favor-complete') {
    if (activeNpcFavor && !npcFavorCompletionPending) {
      npcFavorCompletionPending = true;
      window.dispatchEvent(new CustomEvent('kerala-npc-favor-complete', { detail: { favorId: activeNpcFavor.id } }));
    }
  } else {
    window.dispatchEvent(new CustomEvent('kerala-job-interact'));
  }
  setTimeout(() => { if (worldInteract && !worldInteract.hidden) worldInteract.disabled = false; }, 900);
});

vehicleAction?.addEventListener('click', () => {
  const vehicle = currentDriveVehicle();
  const source = currentVehicleSource();
  if (!vehicle || !source || vehicleAction.disabled) return;
  vehicleAction.disabled = true;
  const action = vehicle.entered ? 'exit' : 'enter';
  window.dispatchEvent(new CustomEvent(source === 'personal' ? 'kerala-personal-vehicle' : 'kerala-job-vehicle', { detail: { action } }));
  setTimeout(() => { if (vehicleAction && !vehicleAction.hidden) vehicleAction.disabled = false; }, 900);
});



function applyJobMission(active) {
  activeJobMission = active || null;
  syncJobVehicleVisual();
  syncJobWorldVisual();
  updateWorldInteract();
  updateVehicleAction();
  if (playerRef) updateMapPlayer(playerRef);
  if (!activeJobMission) {
    updateLifeLoopMission();
    return;
  }
  if (activeJobMission.phase === 'travel' && activeJobMission.target) {
    missionText.textContent = `${activeJobMission.title}: ${activeJobMission.target.action}`;
    const distance = playerRef ? Math.ceil(Math.hypot(activeJobMission.target.x - playerRef.position.x, activeJobMission.target.z - playerRef.position.z)) : Math.ceil(Number(activeJobMission.target.distance || 0));
    landmarkStatus.textContent = `${activeJobMission.target.name} · ${Math.max(0, distance)} m`;
  } else if (activeJobMission.phase === 'working') {
    const seconds = Math.max(0, Math.ceil((Number(activeJobMission.readyAt || 0) - Date.now()) / 1000));
    missionText.textContent = `${activeJobMission.title}: on-site shift`;
    landmarkStatus.textContent = seconds > 0 ? `Working · ${seconds}s remaining` : 'Shift complete · open JOBS';
  } else {
    missionText.textContent = `${activeJobMission.title}: route complete`;
    landmarkStatus.textContent = 'Open JOBS to collect salary';
  }
}
window.addEventListener('kerala-job-mission', event => applyJobMission(event.detail));
window.addEventListener('kerala-garage-state', event => {
  garageSnapshot = event.detail || null;
  syncJobVehicleVisual();
  updateVehicleAction();
  updateWorldInteract();
  updateDriveHud();
});
window.addEventListener('kerala-traffic-state', event => {
  trafficSnapshot = event.detail || null;
  const checkpoint = trafficSnapshot?.checkpoint;
  if (trafficCheckpointVisual && checkpoint) trafficCheckpointVisual.position.set(Number(checkpoint.x) || 0, 0, Number(checkpoint.z) || 0);
  updateWorldInteract();
  updateDriveHud();
});
window.addEventListener('kerala-needs-state', event => {
  applyNeedsState(event.detail, { warn: false });
  updateLifeLoopMission();
});
window.addEventListener('kerala-home-state', event => {
  homeSnapshot = event.detail || null;
  updateWorldInteract();
  updateLifeLoopMission();
});
window.addEventListener('kerala-bus-status', event => {
  const detail = event.detail || null;
  busTravelStatus = detail ? { ...detail, receivedAt: Date.now() } : null;
  updateWorldInteract();
});

window.addEventListener('error', event => {
  console.error(event.error || event.message);
  // Keep runtime diagnostics in the console without covering gameplay with a
  // large error banner. Isolated optional effects already fail safely.
});
window.addEventListener('unhandledrejection', event => {
  console.error(event.reason);
});

function newProgress() {
  return { xp: 0, level: 1, walkMeters: 0, visitedLandmarkIds: [], completedTaskIds: [], followingIds: [] };
}

function onboardingStorageKey() {
  // The guide belongs to the signed-in account, not the whole phone/browser.
  // A second account on the same device must receive its own first-time guide.
  return `${ONBOARDING_STORAGE_KEY}:${profile?.id || profile?.username || 'guest'}`;
}

function onboardingCompleteStored() {
  try { return localStorage.getItem(onboardingStorageKey()) === 'complete'; }
  catch { return false; }
}

function onboardingTarget(step) {
  const targets = {
    move: '#joystick-base', camera: '#camera-zone', run: '#run', menu: '#hud-menu-toggle',
    map: '#map-open', tasks: '#task-toggle'
  };
  return step?.target ? document.querySelector(targets[step.target]) : null;
}

function placeOnboardingPointer(step) {
  const target = onboardingTarget(step);
  if (!target) { onboardingPointer.hidden = true; return; }
  const rect = target.getBoundingClientRect();
  onboardingPointer.style.left = `${rect.left + rect.width / 2}px`;
  onboardingPointer.style.top = `${rect.top + rect.height / 2}px`;
  onboardingPointer.dataset.label = step.pointer || 'Tap here';
  onboardingPointer.classList.toggle('swipe-target', step.target === 'camera');
  onboardingPointer.hidden = false;
}

function speakOnboardingCopy(copy) {
  onboardingTypeToken += 1;
  const token = onboardingTypeToken;
  clearTimeout(onboardingTypeTimer);
  onboardingCopy.textContent = '';
  onboardingCopy.classList.add('speaking');
  const text = String(copy || '');
  let index = 0;
  const typeNext = () => {
    if (token !== onboardingTypeToken || onboardingStep < 0) return;
    const remaining = text.length - index;
    const chunk = remaining > 90 ? 3 : remaining > 45 ? 2 : 1;
    index = Math.min(text.length, index + chunk);
    onboardingCopy.textContent = text.slice(0, index);
    if (index < text.length) {
      onboardingTypeTimer = setTimeout(typeNext, 18);
    } else {
      onboardingCopy.classList.remove('speaking');
    }
  };
  typeNext();
}

function renderOnboarding() {
  const step = onboardingSteps[onboardingStep];
  if (!step) return;
  onboardingTitle.textContent = step.title;
  speakOnboardingCopy(step.copy);
  onboardingProgress.replaceChildren(...onboardingSteps.map((_, index) => {
    const dot = document.createElement('i');
    if (index <= onboardingStep) dot.className = 'active';
    return dot;
  }));
  onboardingNext.hidden = !step.button;
  onboardingNext.textContent = step.button || '';
  onboarding.hidden = false;
  document.body.classList.add('onboarding-actions');
  requestAnimationFrame(() => placeOnboardingPointer(step));
}

function finishOnboarding(skipped = false) {
  if (onboardingStep < 0) return;
  onboardingStep = -1;
  onboardingQueued = false;
  onboarding.hidden = true;
  onboardingPointer.hidden = true;
  onboardingTypeToken += 1;
  clearTimeout(onboardingTypeTimer);
  onboardingCopy.classList.remove('speaking');
  document.body.classList.remove('onboarding-actions');
  try { localStorage.setItem(onboardingStorageKey(), 'complete'); } catch { /* Private browsing can still use the guide once. */ }
  if (!skipped) showToast('Starter guide complete · Kerala is yours to explore!');
}

function advanceOnboarding() {
  if (onboardingStep < 0) return;
  if (onboardingStep >= onboardingSteps.length - 1) { finishOnboarding(); return; }
  onboardingStep += 1;
  renderOnboarding();
}

function recordOnboardingAction(action) {
  if (onboardingStep < 0 || onboardingSteps[onboardingStep]?.target !== action) return;
  advanceOnboarding();
}

addEventListener('resize', () => {
  if (onboardingStep >= 0) placeOnboardingPointer(onboardingSteps[onboardingStep]);
});

function maybeStartOnboarding(force = onboardingForceRequested) {
  onboardingQueued = false;
  if (!profile || !playerRef || onboardingStep >= 0 || (!force && onboardingCompleteStored())) return;
  if (document.querySelector('[aria-modal="true"]:not([hidden])')) {
    onboardingQueued = true;
    setTimeout(maybeStartOnboarding, 700);
    return;
  }
  onboardingForceRequested = false;
  onboardingStep = 0;
  renderOnboarding();
}

window.addEventListener('kerala-onboarding-start', () => {
  // A new signup should get the guide even when an older browser state exists.
  onboardingForceRequested = true;
  try { localStorage.removeItem(onboardingStorageKey()); } catch { /* Continue without persistent storage. */ }
  if (!onboardingQueued && onboardingStep < 0) {
    onboardingQueued = true;
    setTimeout(() => maybeStartOnboarding(true), 500);
  }
});

onboardingNext.addEventListener('click', advanceOnboarding);
onboardingSkip.addEventListener('click', () => finishOnboarding(true));

function acceptUser(user) {
  const previous = profile;
  profile = user;
  progress = user ? { xp: user.points || 0, level: user.level || 1, walkMeters: user.walkMeters || 0,
    visitedLandmarkIds: user.visitedLandmarks || [], completedTaskIds: user.completedTasks || [], followingIds: [] } : newProgress();
  updateProfileHud(); updateProgressHud(); renderTasks();
  if (playerRef) {
    playerRef.visible = !!user;
    if (user && (!previous || previous.gender !== user.gender)) replacePlayerAvatar(user.gender);
    if (user && (!previous || previous.id !== user.id || previous.district !== user.district)) {
      if (Number.isFinite(user.x) && Number.isFinite(user.z)) playerRef.position.set(user.x, 0, user.z);
      else placePlayerAtDistrict(user.district);
      if (Number.isFinite(user.rotation)) playerRef.rotation.y = user.rotation;
    }
    updateNameLabel(playerRef, user?.username || '', user?.id);
  }
  if (!user) {
    applyJobMission(null);
    connectionReady = false;
    lastMovementMoving = false;
    synchronizePlayers([]);
    challengeGeneration++;
    challengeRound = null;
    challengePlay.disabled = false;
    document.querySelector('#coconut-keys')?.replaceChildren();
    challengeResult.textContent = '';
  } else {
    if ((user.followers || 0) + (user.following || 0) > 0) finishTask('social');
    if (!onboardingQueued) {
      onboardingQueued = true;
      setTimeout(maybeStartOnboarding, 450);
    }
  }
}


function xpState(totalXp = progress.xp) {
  let level = 1;
  let used = 0;
  let next = 100;
  const total = Math.max(0, Math.floor(totalXp));
  while (total - used >= next) {
    used += next;
    level += 1;
    next = 100 + (level - 1) * 50;
  }
  return { level, current: total - used, next };
}

function updateProgressHud() {
  const state = xpState();
  progress.level = state.level;
  progressChip.textContent = `Lv. ${state.level} · ${progress.xp} points`;
  progressChip.title = `${state.current} / ${state.next} points toward level ${state.level + 1}`;
}



function showToast(message, duration = 2600) {
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function taskProgress(task) {
  if (progress.completedTaskIds.includes(task.id)) return task.target;
  if (task.id === 'walk-50' || task.id === 'walk-250' || task.id === 'walk-500') return Math.min(task.target, Math.floor(progress.walkMeters));
  if (task.id === 'visit-landmark' || task.id === 'discover-3' || task.id === 'discover-5') return Math.min(task.target, progress.visitedLandmarkIds.length);
  if (task.id === 'social') return Math.min(task.target, (profile?.followers || 0) + (profile?.following || 0));
  return 0;
}

function renderTasks() {
  taskList.replaceChildren();
  taskCatalog.forEach(task => {
    const done = progress.completedTaskIds.includes(task.id);
    const card = document.createElement('div');
    card.className = `task-card${done ? ' done' : ''}`;
    const title = document.createElement('strong');
    title.textContent = `${done ? '✓ ' : ''}${task.title}`;
    const details = document.createElement('small');
    details.textContent = done ? `Completed · +${task.reward} points` : `${taskProgress(task)} / ${task.target} · reward ${task.reward} points`;
    const meter = document.createElement('progress');
    meter.max = task.target;
    meter.value = taskProgress(task);
    card.append(title, details, meter);
    taskList.append(card);
  });
}

async function finishTask(taskId) {
  if (!profile || claimPending.has(taskId) || progress.completedTaskIds.includes(taskId)) return false;
  const task = taskCatalog.find(item => item.id === taskId);
  if (!task) return false;
  claimPending.add(taskId);
  const before = progress.level;
  const userId = profile.id;
  try {
    await api('/api/tasks/' + taskId + '/claim', {});
    if (profile?.id !== userId) return false;
    await social.refreshUser();
    showToast(progress.level > before ? 'Level ' + progress.level + '! +' + task.reward + ' points' : '+' + task.reward + ' points · ' + task.title);
    return true;
  } catch (error) {
    if (profile?.id !== userId) return false;
    // Position-based tasks may become eligible on the next server movement acknowledgement.
    if (taskId === 'open-map') showToast(error.message);
    return false;
  } finally { claimPending.delete(taskId); }
}

function addWalkProgress() { /* Distance and task eligibility are measured by the server. */ }

function markLandmarkVisited() {
  if (!progress.completedTaskIds.includes('visit-landmark')) finishTask('visit-landmark');
}


function updateProfileHud() {
  profileName.textContent = profile?.username || 'Sign in';
  profileDistrict.textContent = profile?.district ? `${profile.district} · ${profile.gender === 'female' ? 'Female' : 'Male'} avatar` : 'Choose your district';
}

function disposeObject(object) {
  const geometries = new Set(), materials = new Set();
  object.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) if (material) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

function updateNameLabel(object, name, id) {
  if (!object.userData.label) {
    const label = document.createElement('button');
    label.className = 'avatar-name'; label.type = 'button'; label.hidden = true;
    label.addEventListener('click', event => { event.stopPropagation(); inspectAvatar(object); });
    document.querySelector('#avatar-labels').append(label);
    object.userData.label = label;
  }
  object.userData.playerId = id;
  const label = object.userData.label;
  label.textContent = name;
  label.setAttribute('aria-label', 'View ' + name + ' profile');
}

function inspectAvatar(object) {
  recordOnboardingAction('npc');
  if (object.userData.npc) {
    const panel = document.querySelector('#npc-profile');
    panel.querySelector('h2').textContent = object.userData.name;
    const activity = object.userData.role || 'Local';
    const relationship = object.userData.relationship || npcRelationshipForId(object.userData.relationshipId);
    const relationshipText = relationship
      ? `${relationship.tier} · ${relationship.score}/100 familiarity · ${relationship.conversations} conversation${relationship.conversations === 1 ? '' : 's'}`
      : 'Stranger · talk to build familiarity';
    const reputation = npcRelationshipSnapshot?.reputation;
    const reputationText = reputation ? ` Local reputation: ${reputation.value}/100 · ${reputation.tier}.` : '';
    const favorText = activeNpcFavor?.npcId === object.userData.relationshipId
      ? ` Active favor: ${activeNpcFavor.title} → ${activeNpcFavor.target?.label || 'destination'}.`
      : object.userData.favorOffer
        ? ` Favor available: ${object.userData.favorOffer.title} → ${object.userData.favorOffer.target?.label || 'destination'}.`
        : '';
    panel.querySelector('p').textContent = activity + ' · ' + (object.userData.gender === 'female' ? 'Female' : 'Male') + ` local. Relationship: ${relationshipText}.${reputationText}${favorText} NPCs remember repeat conversations across sessions.`;
    panel.hidden = false;
    panel.querySelector('button').focus();
  } else if (object.userData.playerId) social.openProfile(object.userData.playerId);
}

function synchronizePlayers(players) {
  if (!sceneRef) return;
  const keep = new Set();
  for (const data of players) {
    if (!data.id || data.id === profile?.id || !Number.isFinite(data.x) || !Number.isFinite(data.z)) continue;
    keep.add(data.id);
    let remote = remotePlayers.get(data.id);
    if (remote && remote.userData.gender !== data.gender) {
      sceneRef.remove(remote); remote.userData.label?.remove(); disposeObject(remote);
      remotePlayers.delete(data.id); remote = null;
    }
    if (!remote) {
      remote = new THREE.Group();
      const remoteSeed = avatarStyleSeed(data.id || data.username);
      const avatar = createHuman({ gender: data.gender, shirt: data.gender === 'female' ? 0xc57e93 : 0x569bb5,
        trousers: 0x293b50, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x2c2825, accent: 0xe5bb51, styleSeed: remoteSeed });
      remote.add(avatar);
      attachContactShadow(remote, .48, .32, .18);
      applyDynamicHighQuality(remote);
      remote.position.set(data.x, 0, data.z);
      remote.userData = {
        avatar, gender: data.gender, phase: 0,
        target: new THREE.Vector3(data.x, 0, data.z),
        predicted: new THREE.Vector3(data.x, 0, data.z),
        velocity: new THREE.Vector3(),
        targetAt: performance.now()
      };
      sceneRef.add(remote); remotePlayers.set(data.id, remote);
    }
    const receivedAt = performance.now();
    const networkDelta = Math.max(.05, Math.min(1, (receivedAt - remote.userData.targetAt) / 1000));
    remote.userData.velocity.set(
      (data.x - remote.userData.target.x) / networkDelta,
      0,
      (data.z - remote.userData.target.z) / networkDelta
    );
    if (!data.moving) remote.userData.velocity.set(0, 0, 0);
    else if (remote.userData.velocity.lengthSq() > 81) remote.userData.velocity.setLength(9);
    const networkTarget = new THREE.Vector3(data.x, 0, data.z);
    // Reconcile a stale/interrupted stream immediately so another player never
    // appears frozen several metres behind their server position.
    if (remote.position.distanceTo(networkTarget) > 4.5) {
      remote.position.copy(networkTarget);
      remote.userData.predicted.copy(networkTarget);
    }
    remote.userData.target.copy(networkTarget);
    remote.userData.targetAt = receivedAt;
    remote.userData.yaw = Number(data.rotation) || 0;
    remote.userData.moving = !!data.moving;
    remote.userData.mode = data.mode || 'walk';
    updateNameLabel(remote, data.username, data.id);
  }
  for (const [id, remote] of remotePlayers) if (!keep.has(id)) {
    sceneRef.remove(remote); remote.userData.label?.remove(); disposeObject(remote); remotePlayers.delete(id);
  }
}

function updateRemotePlayers(delta, camera) {
  const networkNow = performance.now();
  remoteLabelAccumulator += delta;
  const refreshLabels = remoteLabelAccumulator >= (runtimeIsMobile ? .10 : .05);

  for (const remote of remotePlayers.values()) {
    const predictionAge = remote.userData.moving ? Math.min(.28, Math.max(0, (networkNow - remote.userData.targetAt) / 1000)) : 0;
    remote.userData.predicted.copy(remote.userData.target).addScaledVector(remote.userData.velocity, predictionAge);
    remote.userData.predicted.x = THREE.MathUtils.clamp(remote.userData.predicted.x, -110, 110);
    remote.userData.predicted.z = THREE.MathUtils.clamp(remote.userData.predicted.z, -110, 110);
    remote.position.lerp(remote.userData.predicted, 1 - Math.exp(-delta * 10));
    remote.rotation.y = rotateTowards(remote.rotation.y, remote.userData.yaw, delta * 12);

    const playerDistance = playerRef
      ? Math.hypot(remote.position.x - playerRef.position.x, remote.position.z - playerRef.position.z)
      : 0;
    const animateRemote = !runtimeIsMobile || playerDistance < 58;
    if (animateRemote) {
      const remoteWalkSpeed = remote.userData.velocity.length();
      const remoteOnFoot = remote.userData.moving && remote.userData.mode === 'walk';
      const remoteRunning = remoteOnFoot && remoteWalkSpeed > 3.9;
      remote.userData.phase += delta * (remoteRunning ? 10.5 : 5.2);
      animatePlayer(remote, remote.userData.phase, remoteOnFoot ? (remoteRunning ? .78 : .36) : 0);
    }
  }

  if (!refreshLabels) return;
  remoteLabelAccumulator = 0;
  camera.updateMatrixWorld();
  const occupiedLabels = [];
  const labelObjects = [playerRef, ...remotePlayers.values(), ...villagers];
  const overlapX = runtimeIsMobile ? 96 : 78;
  const overlapY = runtimeIsMobile ? 30 : 24;
  for (const object of labelObjects) {
    if (!object?.userData.label) continue;
    const label = object.userData.label;
    object.getWorldPosition(labelWorldPosition);
    const distance = camera.position.distanceTo(labelWorldPosition);
    labelPosition.copy(labelWorldPosition); labelPosition.y += 2.65;
    labelPosition.project(camera);
    const labelDistance = object.userData.npc ? (runtimeIsMobile ? 22 : 30) : 45;
    const npcTalking = !!object.userData.npc && Number(object.userData.interactionUntil || 0) > performance.now();
    let visible = !!profile && object.visible && !!label.textContent && !npcTalking && distance < labelDistance && labelPosition.z > -1 && labelPosition.z < 1 && Math.abs(labelPosition.x) < .95 && Math.abs(labelPosition.y) < .93;
    const screenX = (labelPosition.x + 1) * innerWidth / 2;
    const screenY = (1 - labelPosition.y) * innerHeight / 2;
    if (visible && object !== playerRef) {
      visible = !occupiedLabels.some(point => Math.abs(point.x - screenX) < overlapX && Math.abs(point.y - screenY) < overlapY);
    }
    label.hidden = !visible;
    if (visible) {
      label.style.transform = 'translate(-50%, -100%) translate(' + screenX.toFixed(1) + 'px,' + screenY.toFixed(1) + 'px)';
      occupiedLabels.push({ x: screenX, y: screenY });
    }
  }
}

async function sendMovement(player, moving) {
  const now = performance.now();
  const stateChanged = moving !== lastMovementMoving;
  if (!profile || !connectionReady || document.hidden || publicRideInProgress || movementPending || (!stateChanged && now - lastMovementSend < (moving ? 250 : 1500))) return;
  movementPending = true; lastMovementSend = now;
  const userId = profile.id;
  try {
    const result = await api('/api/world/move', { x: player.position.x, z: player.position.z, rotation: player.rotation.y, moving, mode: vehicleMode });
    if (profile?.id !== userId) return;
    lastMovementMoving = moving;
    if (result.user) acceptUser(result.user);
    if (result.vehicle) {
      if (result.vehicle.source === 'personal' && garageSnapshot?.activeVehicle) garageSnapshot.activeVehicle = { ...garageSnapshot.activeVehicle, ...result.vehicle };
      else if (activeJobMission?.vehicle) activeJobMission.vehicle = { ...activeJobMission.vehicle, ...result.vehicle };
      updateDriveHud();
      if (Number(result.vehicle.fuel) <= 15 && performance.now() - lastFuelWarningAt > 12000) {
        lastFuelWarningAt = performance.now();
        showToast(Number(result.vehicle.fuel) <= .1 ? 'Fuel empty · go to Kerala Fuel Station' : 'Low fuel · visit Kerala Fuel Station');
      }
    }
    if (result.needs) applyNeedsState(result.needs);
    if (result.trafficNotice) {
      showToast(`Traffic challan issued · ₹${Number(result.trafficNotice.amount || 0)} · ${result.trafficNotice.registration || ''}`);
      window.dispatchEvent(new CustomEvent('kerala-traffic-refresh'));
    }
    if (now - lastProgressRefresh > 3000) {
      lastProgressRefresh = now;
      await social.refreshUser();
      if (progress.walkMeters >= 50) finishTask('walk-50');
      if (progress.walkMeters >= 250) finishTask('walk-250');
      if (progress.walkMeters >= 500) finishTask('walk-500');
      if (selectedLandmark && Math.hypot(player.position.x - selectedLandmark.x, player.position.z - selectedLandmark.z) < 5.2) finishTask('visit-landmark');
      if (progress.visitedLandmarkIds.length >= 3) finishTask('discover-3');
      if (progress.visitedLandmarkIds.length >= 5) finishTask('discover-5');
    }
  } catch (error) {
    if (profile?.id !== userId) return;
    if (error.status === 400 || error.status === 409) {
      await social.refreshUser().catch(() => {});
      if (Number.isFinite(profile?.x) && Number.isFinite(profile?.z)) player.position.set(profile.x, 0, profile.z);
    }
    if (now - lastMoveError > 10000) { showToast('World sync: ' + error.message); lastMoveError = now; }
  } finally { movementPending = false; }
}

function flushMovement() {
  if (!profile || !playerRef || publicRideInProgress) return;
  fetch('/api/world/move', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x: playerRef.position.x, z: playerRef.position.z, rotation: playerRef.rotation.y, moving: false, mode: vehicleMode }),
    keepalive: true
  }).catch(() => {});
}
window.addEventListener('pagehide', flushMovement);



function placePlayerAtDistrict(district) {
  const start = districtStarts[district] || [0, 0];
  playerRef.position.set(start[0] + 12, 0, start[1]);
  updateMapPlayer(playerRef);
}

function recoverBlockedPlayerSpawn(player, force = false) {
  if (!player || (!force && !positionBlocked(player.position.x, player.position.z, .43))) return false;
  const originX = player.position.x;
  const originZ = player.position.z;
  // A persisted position can become enclosed after a new house or landmark is
  // added. Find the nearest free walking point before controls begin.
  for (const ring of [1.2, 2.1, 3.2, 4.8, 6.8, 9.5, 13, 18, 25]) {
    for (let index = 0; index < 24; index++) {
      const angle = index / 24 * Math.PI * 2;
      const x = THREE.MathUtils.clamp(originX + Math.sin(angle) * ring, -108, 108);
      const z = THREE.MathUtils.clamp(originZ + Math.cos(angle) * ring, -108, 108);
      if (!positionBlocked(x, z, .43)) { player.position.set(x, 0, z); return true; }
    }
  }
  player.position.set(0, 0, -8);
  return true;
}

function showAssetNotice(message) {
  assetNotice.textContent = message;
  assetNotice.style.display = 'block';
  clearTimeout(showAssetNotice.timer);
  showAssetNotice.timer = setTimeout(() => { assetNotice.style.display = 'none'; }, 5200);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function worldToKeralaMap(worldX, worldZ) {
  // Follow the real Kerala silhouette from north-west Kasaragod to the
  // south-east Thiruvananthapuram while keeping the game world's local X/Z
  // coordinates readable inside the district-accurate map.
  const bands = [[.02,18.8,2.16],[.12,30.98,6.77],[.28,52.4,11.04],[.44,67.99,16.2],[.60,79.11,17.28],[.76,84.12,16.51],[.90,88.03,7.95],[.98,92.87,2.26]];
  const t = clamp((70 - worldZ) / 140, .02, .98);
  let index = 0;
  while (index < bands.length - 2 && t > bands[index + 1][0]) index++;
  const [t0, center0, half0] = bands[index];
  const [t1, center1, half1] = bands[index + 1];
  const localT = clamp((t - t0) / (t1 - t0), 0, 1);
  const center = lerp(center0, center1, localT);
  const usableHalf = Math.max(1.4, lerp(half0, half1, localT) - 1.15);
  return { x: center + clamp(worldX / 70, -1, 1) * usableHalf, y: 8 + t * 284 };
}

function applyMapZoom(nextZoom = mapZoom) {
  mapZoom = clamp(nextZoom, 1, 1.8);
  const width = 120 / mapZoom;
  const height = 300 / mapZoom;
  const center = playerRef ? worldToKeralaMap(playerRef.position.x, playerRef.position.z) : { x: 60, y: 150 };
  const x = clamp(center.x - width / 2, 0, 120 - width);
  const y = clamp(center.y - height / 2, 0, 300 - height);
  keralaMap?.setAttribute('viewBox', `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`);
  if (mapZoomReset) mapZoomReset.textContent = mapZoom === 1 ? '1×' : `${mapZoom.toFixed(1)}×`;
}

function placeDistance(place, player = playerRef) {
  if (!place || !player) return Infinity;
  return Math.hypot(Number(place.x) - player.position.x, Number(place.z) - player.position.z);
}

function destinationDirection(place, player = playerRef) {
  if (!place || !player) return '';
  const dx = Number(place.x) - player.position.x;
  const dz = Number(place.z) - player.position.z;
  const degrees = (Math.atan2(dx, dz) * 180 / Math.PI + 360) % 360;
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(degrees / 45) % 8];
}

function destinationBusSuggestion(place, player = playerRef) {
  if (!place || !player || place.kind === 'bus') return '';
  const town = navigationPlaces.find(item => item.id === 'town-bus');
  const south = navigationPlaces.find(item => item.id === 'south-bus');
  const playerTown = placeDistance(town, player);
  const playerSouth = placeDistance(south, player);
  const destinationTown = Math.hypot(place.x - town.x, place.z - town.z);
  const destinationSouth = Math.hypot(place.x - south.x, place.z - south.z);
  if (playerTown <= 20 && destinationSouth + 18 < destinationTown) return ' · Village Line can help';
  if (playerSouth <= 20 && destinationTown + 18 < destinationSouth) return ' · Village Line can help';
  return '';
}

function renderNearbyPlaces() {
  if (!nearbyPlaces || !playerRef) return;
  nearbyPlaces.replaceChildren();
  const entries = navigationPlaces
    .map(place => ({ place, distance: placeDistance(place) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);
  for (const { place, distance } of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nearby-place${selectedDestination?.id === place.id ? ' selected' : ''}`;
    button.dataset.placeId = place.id;
    const left = document.createElement('span');
    const title = document.createElement('b');
    title.textContent = place.name;
    const detail = document.createElement('small');
    detail.textContent = `${place.kind === 'landmark' ? place.district : place.kind.toUpperCase()} · ${destinationDirection(place)}`;
    left.append(title, detail);
    const distanceLabel = document.createElement('span');
    distanceLabel.textContent = selectedDestination?.id === place.id ? `${Math.ceil(distance)} m · SET` : `${Math.ceil(distance)} m`;
    button.append(left, distanceLabel);
    button.addEventListener('click', () => setWaypoint(place));
    nearbyPlaces.append(button);
  }
}

function renderMapLandmarks() {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  if (districtLabels) districtLabels.style.display = mapLabelsVisible ? 'block' : 'none';
  mapLayer.replaceChildren();
  navigationPlaces.forEach(place => {
    const point = worldToKeralaMap(place.x, place.z);
    const marker = document.createElementNS(svgNamespace, 'g');
    const classes = ['landmark-marker'];
    if (place.kind !== 'landmark') classes.push('poi-marker', place.kind);
    if (selectedDestination?.id === place.id) classes.push('selected');
    marker.setAttribute('class', classes.join(' '));
    marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    marker.setAttribute('aria-label', `Set destination: ${place.name}`);
    const pin = document.createElementNS(svgNamespace, 'circle');
    pin.setAttribute('class', 'pin'); pin.setAttribute('r', place.kind === 'landmark' ? '5.8' : '4.6');
    const label = document.createElementNS(svgNamespace, 'text');
    label.textContent = place.icon;
    const caption = document.createElementNS(svgNamespace, 'text');
    caption.textContent = place.name.replace('Padmanabhaswamy ', '').replace('Mattancherry ', '').replace('Village ', '');
    caption.setAttribute('y', place.kind === 'landmark' ? '11' : '9.5');
    caption.setAttribute('font-size', place.kind === 'landmark' ? '5.2' : '4.2');
    caption.setAttribute('fill', '#fff');
    caption.setAttribute('text-anchor', 'middle');
    caption.style.display = mapLabelsVisible || selectedDestination?.id === place.id ? 'block' : 'none';
    marker.append(pin, label, caption);
    marker.addEventListener('click', event => { event.stopPropagation(); setWaypoint(place); });
    mapLayer.append(marker);
  });
  renderNearbyPlaces();
}

function setWaypoint(place) {
  if (!place || !Number.isFinite(Number(place.x)) || !Number.isFinite(Number(place.z))) return;
  selectedDestination = place;
  selectedLandmark = place.kind === 'landmark' ? place : null;
  lifeLoopAction = 'map';
  missionCard.dataset.lifeAction = 'map';
  missionText.textContent = `Destination: ${place.name}`;
  const distance = placeDistance(place);
  landmarkStatus.textContent = `${destinationDirection(place)} · ${Math.ceil(distance)} m${destinationBusSuggestion(place)}`;
  window.dispatchEvent(new CustomEvent('kerala-destination-selected', {
    detail: { id: place.id, name: place.name, kind: place.kind, x: Number(place.x), z: Number(place.z), distance },
  }));
  renderMapLandmarks();
  if (playerRef) updateMapPlayer(playerRef);
}

function updateMapPlayer(player) {
  const point = worldToKeralaMap(player.position.x, player.position.z);
  const angle = player.rotation.y * 180 / Math.PI;
  mapPlayer.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  if (activeJobMission?.phase === 'travel' && activeJobMission.target) {
    const target = worldToKeralaMap(activeJobMission.target.x, activeJobMission.target.z);
    mapRoute.setAttribute('x1', point.x); mapRoute.setAttribute('y1', point.y);
    mapRoute.setAttribute('x2', target.x); mapRoute.setAttribute('y2', target.y);
    mapRoute.hidden = false;
    if (jobMapMarker) {
      jobMapMarker.hidden = false;
      jobMapMarker.setAttribute('transform', `translate(${target.x} ${target.y})`);
    }
    const distance = Math.hypot(activeJobMission.target.x - player.position.x, activeJobMission.target.z - player.position.z);
    missionText.textContent = `${activeJobMission.title}: ${activeJobMission.target.action}`;
    landmarkStatus.textContent = `${activeJobMission.target.name} · ${Math.ceil(distance)} m`;
    mapStatus.textContent = `${activeJobMission.target.name} · ${Math.ceil(distance)} m`;
    return;
  }
  if (jobMapMarker) jobMapMarker.hidden = true;
  if (activeJobMission) {
    mapRoute.hidden = true;
    if (activeJobMission.phase === 'working') {
      const seconds = Math.max(0, Math.ceil((Number(activeJobMission.readyAt || 0) - Date.now()) / 1000));
      missionText.textContent = `${activeJobMission.title}: on-site shift`;
      landmarkStatus.textContent = seconds > 0 ? `Working · ${seconds}s remaining` : 'Shift complete · open JOBS';
      mapStatus.textContent = `${activeJobMission.title} · in progress`;
    } else {
      missionText.textContent = `${activeJobMission.title}: route complete`;
      landmarkStatus.textContent = 'Open JOBS to collect salary';
      mapStatus.textContent = `${activeJobMission.title} · salary ready`;
    }
    return;
  }
  if (activeNpcFavor?.target) {
    const targetData = activeNpcFavor.target;
    const target = worldToKeralaMap(Number(targetData.x), Number(targetData.z));
    mapRoute.setAttribute('x1', point.x); mapRoute.setAttribute('y1', point.y);
    mapRoute.setAttribute('x2', target.x); mapRoute.setAttribute('y2', target.y);
    mapRoute.hidden = false;
    if (jobMapMarker) {
      jobMapMarker.hidden = false;
      jobMapMarker.setAttribute('transform', `translate(${target.x} ${target.y})`);
    }
    const distance = Math.hypot(Number(targetData.x) - player.position.x, Number(targetData.z) - player.position.z);
    const remaining = Math.max(0, Math.ceil((Number(activeNpcFavor.expiresAt || 0) - Date.now()) / 1000));
    missionText.textContent = `Favor for ${activeNpcFavor.npcName}: ${activeNpcFavor.action || activeNpcFavor.title}`;
    landmarkStatus.textContent = `${targetData.label} · ${Math.ceil(distance)} m · ${Math.ceil(remaining / 60)} min left`;
    mapStatus.textContent = `${activeNpcFavor.title} · ${targetData.label} · ${Math.ceil(distance)} m`;
    return;
  }
  if (selectedDestination) {
    const destination = selectedDestination;
    const target = worldToKeralaMap(destination.x, destination.z);
    mapRoute.setAttribute('x1', point.x); mapRoute.setAttribute('y1', point.y);
    mapRoute.setAttribute('x2', target.x); mapRoute.setAttribute('y2', target.y);
    mapRoute.hidden = false;
    const distance = placeDistance(destination, player);
    const direction = destinationDirection(destination, player);
    const arrivalRadius = destination.kind === 'landmark' ? 5.2 : 4.6;
    if (distance < arrivalRadius) {
      if (destination.kind === 'landmark') markLandmarkVisited(destination);
      selectedDestination = null;
      selectedLandmark = null;
      window.dispatchEvent(new CustomEvent('kerala-destination-cleared', { detail: { id: destination.id, reason: 'arrived' } }));
      missionText.textContent = `Arrived: ${destination.name}`;
      landmarkStatus.textContent = destination.kind === 'landmark'
        ? 'Landmark reached · reward progress updated'
        : 'Destination reached · nearby interaction ready';
      mapRoute.hidden = true;
      mapStatus.textContent = `${destination.name} · arrived`;
      renderMapLandmarks();
      showToast(`Arrived at ${destination.name}`);
    } else {
      missionText.textContent = `Destination: ${destination.name}`;
      landmarkStatus.textContent = `${direction} · ${Math.ceil(distance)} m${destinationBusSuggestion(destination, player)}`;
      mapStatus.textContent = `${destination.name} · ${direction} · ${Math.ceil(distance)} m`;
      if (minimap?.classList.contains('open') && performance.now() - lastNearbyPlacesRenderAt > 500) {
        lastNearbyPlacesRenderAt = performance.now();
        renderNearbyPlaces();
      }
    }
  } else {
    mapRoute.hidden = true;
    mapStatus.textContent = `${profile?.district || 'Kerala'} · You`;
    if (minimap?.classList.contains('open') && performance.now() - lastNearbyPlacesRenderAt > 500) {
      lastNearbyPlacesRenderAt = performance.now();
      renderNearbyPlaces();
    }
  }
}



function setOpenPanel(which = null) {
  social?.closePanels();
  if (which !== 'tasks' && challengeRound) {
    challengeGeneration++; challengeRound = null; challengePlay.disabled = false;
    document.querySelector('#coconut-keys').replaceChildren(); challengeResult.textContent = '';
  }
  const panels = { map: minimap, people: peoplePanel, chat: chatPanel, tasks: taskPanel, dm: dmPanel };
  Object.entries(panels).forEach(([name, panel]) => panel.classList.toggle('open', name === which));
  mapOpen.setAttribute('aria-expanded', String(which === 'map'));
  peopleToggle.setAttribute('aria-expanded', String(which === 'people'));
  chatToggle.setAttribute('aria-expanded', String(which === 'chat'));
  taskToggle.setAttribute('aria-expanded', String(which === 'tasks'));
  if (which === 'map') finishTask('open-map');
  if (which === 'tasks') renderTasks();
}

async function playCoconutChallenge() {
  if (!profile || challengeRound) return;
  const generation = ++challengeGeneration;
  challengePlay.disabled = true;
  const keys = document.querySelector('#coconut-keys');
  keys.replaceChildren();
  challengeResult.textContent = 'Getting a fresh pattern…';
  try {
    const round = await api('/api/games/coconut/start', {});
    if (generation !== challengeGeneration) return;
    challengeRound = { ...round, answers: [], accepting: false };
    const labels = ['🥥', '🌴', '🌺', '🥭'];
    for (let i = 0; i < 4; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = labels[i]; button.disabled = true;
      button.setAttribute('aria-label', ['Coconut', 'Palm', 'Flower', 'Mango'][i]);
      button.addEventListener('click', () => answerCoconut(i, generation));
      keys.append(button);
    }
    challengeResult.textContent = 'Watch the pattern, then repeat it.';
    for (const value of round.sequence) {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (generation !== challengeGeneration) return;
      keys.children[value].classList.add('lit');
      await new Promise(resolve => setTimeout(resolve, 650));
      if (generation !== challengeGeneration) return;
      keys.children[value].classList.remove('lit');
    }
    challengeRound.accepting = true;
    for (const button of keys.children) button.disabled = false;
    challengeResult.textContent = 'Your turn · 0 / ' + round.sequence.length;
  } catch (error) {
    if (generation !== challengeGeneration) return;
    challengeResult.textContent = error.message;
    challengeRound = null; challengePlay.disabled = false;
  }
}

async function answerCoconut(value, generation) {
  if (!challengeRound?.accepting || generation !== challengeGeneration) return;
  challengeRound.answers.push(value);
  challengeResult.textContent = 'Your turn · ' + challengeRound.answers.length + ' / ' + challengeRound.sequence.length;
  if (challengeRound.answers.length !== challengeRound.sequence.length) return;
  challengeRound.accepting = false;
  for (const button of document.querySelector('#coconut-keys').children) button.disabled = true;
  const submitted = challengeRound;
  try {
    const result = await api('/api/games/coconut/finish', { roundId: submitted.roundId, sequence: submitted.answers });
    if (generation !== challengeGeneration) return;
    challengeResult.textContent = result.won === false ? 'Pattern missed. Try a new round!' : 'Pattern complete! +20 points.';
    await social.refreshUser();
  } catch (error) { if (generation === challengeGeneration) challengeResult.textContent = error.message; }
  finally { if (generation === challengeGeneration) { challengeRound = null; challengePlay.disabled = false; } }
}

let hudMenuCollapseTimer = null;

function setHudMenuExpanded(expanded) {
  document.body.classList.toggle('hud-menu-collapsed', !expanded);
  if (!hudMenuToggle) return;
  hudMenuToggle.setAttribute('aria-expanded', String(expanded));
  hudMenuToggle.setAttribute('aria-label', expanded ? 'Hide game controls' : 'Show game controls');
  hudMenuToggle.textContent = expanded ? '×' : '☰';
}

function scheduleHudMenuCollapse(delay = 5200) {
  clearTimeout(hudMenuCollapseTimer);
  if (onboardingStep >= 0 || document.body.classList.contains('hud-menu-collapsed')) return;
  hudMenuCollapseTimer = setTimeout(() => setHudMenuExpanded(false), delay);
}

function collapseHudMenuAfterAction() {
  if (onboardingStep >= 0) return;
  clearTimeout(hudMenuCollapseTimer);
  requestAnimationFrame(() => setHudMenuExpanded(false));
}

function wireInterface() {
  updateProfileHud(); updateProgressHud(); renderTasks(); renderMapLandmarks(); setOpenPanel();
  setHudMenuExpanded(false);
  hudMenuToggle?.addEventListener('click', () => {
    const expanded = document.body.classList.contains('hud-menu-collapsed');
    setHudMenuExpanded(expanded);
    if (expanded) scheduleHudMenuCollapse();
    else clearTimeout(hudMenuCollapseTimer);
    recordOnboardingAction('menu');
  });
  mapOpen.addEventListener('click', () => {
    const opening = !minimap.classList.contains('open');
    setOpenPanel(opening ? 'map' : null);
    if (opening) requestAnimationFrame(() => { renderMapLandmarks(); applyMapZoom(mapZoom); });
    recordOnboardingAction('map');
    collapseHudMenuAfterAction();
  });
  mapClose.addEventListener('click', () => setOpenPanel());
  mapLabelToggle.addEventListener('click', () => {
    mapLabelsVisible = !mapLabelsVisible;
    mapLabelToggle.textContent = mapLabelsVisible ? 'Labels on' : 'Labels';
    renderMapLandmarks();
  });
  mapZoomIn?.addEventListener('click', () => applyMapZoom(mapZoom + .25));
  mapZoomOut?.addEventListener('click', () => applyMapZoom(mapZoom - .25));
  mapZoomReset?.addEventListener('click', () => applyMapZoom(1));
  taskToggle.addEventListener('click', () => { setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks'); recordOnboardingAction('tasks'); collapseHudMenuAfterAction(); });
  document.querySelector('#quick-actions')?.addEventListener('click', event => {
    if (event.target.closest('.hud-icon')) collapseHudMenuAfterAction();
  });
  fullscreenToggle?.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        if (window.requestKeralaLandscape) await window.requestKeralaLandscape();
        else await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { showToast('Fullscreen is unavailable in this browser'); }
  });
  taskClose.addEventListener('click', () => setOpenPanel());
  missionCard.addEventListener('click', () => {
    if (activeJobMission) {
      document.querySelector('#jobs-toggle')?.click();
      return;
    }
    const action = missionCard.dataset.lifeAction || lifeLoopAction;
    if (action === 'jobs') document.querySelector('#jobs-toggle')?.click();
    else if (action === 'home') document.querySelector('#home-toggle')?.click();
    else if (action === 'wallet') document.querySelector('#wallet-toggle')?.click();
    else if (action === 'map') document.querySelector('#map-open')?.click();
    else setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks');
  });
  challengePlay.addEventListener('click', playCoconutChallenge);
  document.querySelector('#npc-profile .panel-close').addEventListener('click', () => { document.querySelector('#npc-profile').hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { setOpenPanel(); document.querySelector('#npc-profile').hidden = true; } });
}

social = initSocial({ onUser: acceptUser, onPlayers: players => { connectionReady = true; synchronizePlayers(players); },
  onDisconnect: () => { connectionReady = false; synchronizePlayers([]); }, onToast: showToast });

try {
  const isMobile = runtimeIsMobile;
  // Keep MSAA available on mobile so the High preset can actually remove the
  // jagged road/wire/vehicle edges seen in landscape playtests. Low/Balanced
  // still control cost mainly through pixel ratio and disabled shadows.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    precision: 'highp',
  });
  let renderScale = isMobile ? .90 : 1;
  function applyRenderScale() {
    if (atmosphere?.setPerformanceScale) {
      atmosphere.setPerformanceScale(renderScale);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? Math.max(1.12, 1.78 * renderScale) : 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  applyRenderScale();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Mobile keeps the lightweight contact-shadow system. Desktop can afford a
  // restrained soft sun shadow pass for trees, buildings, people and vehicles.
  renderer.shadowMap.enabled = !isMobile;
  if (!isMobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  sceneRef = scene;
  scene.background = new THREE.Color(0x92c9ff);
  scene.fog = new THREE.Fog(0x92c9ff, 50, 150);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 200);
  const raycaster = new THREE.Raycaster();
  document.addEventListener('pointerdown', event => {
    if (event.target === renderer.domElement || event.target === cameraZone) pointerOrigin.set(event.pointerId, [event.clientX, event.clientY]);
  });
  document.addEventListener('pointerup', event => {
    const start = pointerOrigin.get(event.pointerId); pointerOrigin.delete(event.pointerId);
    if (!start || !profile || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 7) return;
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), camera);
    const avatars = [playerRef, ...villagers, ...remotePlayers.values()];
    const hit = raycaster.intersectObjects(avatars, true)[0];
    if (hit && hit.distance < 45) {
      let object = hit.object;
      while (object && !avatars.includes(object)) object = object.parent;
      if (object) inspectAvatar(object);
    }
  });
  document.addEventListener('pointercancel', event => pointerOrigin.delete(event.pointerId));
  const clock = new THREE.Clock();
  const player = new THREE.Group();
  const cameraTarget = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const desiredMove = new THREE.Vector3();
  const walkVelocity = new THREE.Vector3();
  const targetWalkVelocity = new THREE.Vector3();

  scene.add(player);
  playerRef = player;
  if (profile && !onboardingQueued) {
    onboardingQueued = true;
    setTimeout(maybeStartOnboarding, 450);
  }
  buildWorld(scene);
  buildLandmarkWorld(scene);
  buildPlayer(player);
  syncJobWorldVisual();
  player.visible = !!profile;
  if (profile && Number.isFinite(profile.x) && Number.isFinite(profile.z)) {
    player.position.set(profile.x, 0, profile.z);
    if (Number.isFinite(profile.rotation)) player.rotation.y = profile.rotation;
  } else if (profile) placePlayerAtDistrict(profile.district);
  const spawnRecovered = profile && recoverBlockedPlayerSpawn(player);
  wireInterface();
  if (spawnRecovered) showToast('Moved you outside the building.');
  updateMapPlayer(player);

  const sun = new THREE.HemisphereLight(0xeaf7ff, 0x486231, 2.25);
  scene.add(sun);
  const warmLight = new THREE.DirectionalLight(0xfff1d0, 1.5);
  warmLight.position.set(35, 55, 25);
  warmLight.castShadow = !isMobile;
  if (!isMobile) {
    warmLight.shadow.mapSize.set(1024, 1024);
    warmLight.shadow.camera.left = -58;
    warmLight.shadow.camera.right = 58;
    warmLight.shadow.camera.top = 58;
    warmLight.shadow.camera.bottom = -58;
    warmLight.shadow.camera.near = 8;
    warmLight.shadow.camera.far = 135;
    warmLight.shadow.bias = -.00035;
    warmLight.shadow.normalBias = .025;
  }
  scene.add(warmLight);
  atmosphere = createAtmosphere(THREE, { scene, renderer, camera, sun: warmLight, hemi: sun });
  atmosphere.setPerformanceScale?.(renderScale);

  let joystickPointerId = null;
  let lookPointerId = null;
  let lastLookX = 0;
  let lastLookY = 0;
  let inputX = 0;
  let inputY = 0;
  let cameraYaw = player.rotation.y + Math.PI;
  let cameraPitch = .31;
  let runHeld = false;
  let runPointerId = null;
  let runCruiseArmed = false;
  let acceleratorHeld = false;
  let acceleratorPointerId = null;
  let smoothedDriveSteering = 0;
  let driveSpeedRatio = 0;
  let walkPhase = 0;
  let playerRunningVisual = false;
  const walkSafePosition = new THREE.Vector3().copy(player.position);
  let walkSafeRotation = player.rotation.y;
  let walkSafeReady = !positionBlocked(player.position.x, player.position.z, .48);
  let walkSafeAccumulator = 0;

  function clearRidePickupVisual() {
    if (!ridePickupVisual) return;
    scene.remove(ridePickupVisual);
    disposeMissionObject(ridePickupVisual);
    ridePickupVisual = null;
  }

  function showRidePickupVisual(serviceId = 'auto') {
    clearRidePickupVisual();
    const kind = serviceId === 'taxi' ? 'car' : 'auto';
    const visual = createTrafficVehicleVisual(kind, serviceId === 'taxi' ? 0xd7d7d7 : 0x2b773f);
    const driver = createHuman({
      gender: 'male',
      shirt: serviceId === 'taxi' ? 0xe8e8e3 : 0xc9d8b0,
      trousers: 0x26303a,
      skin: 0xa96d4c,
      hair: 0x171311,
      shoes: 0x20201f,
      accent: 0xffffff,
      styleSeed: 21,
    });
    driver.scale.setScalar(serviceId === 'taxi' ? .52 : .48);
    driver.position.set(0, serviceId === 'taxi' ? .52 : .50, serviceId === 'taxi' ? .12 : .20);
    driver.rotation.y = Math.PI;
    visual.add(driver);
    const rightX = Math.cos(player.rotation.y) * 3.0;
    const rightZ = -Math.sin(player.rotation.y) * 3.0;
    let px = player.position.x + rightX;
    let pz = player.position.z + rightZ;
    if (positionBlocked(px, pz, serviceId === 'taxi' ? .9 : .75)) {
      px = player.position.x - rightX;
      pz = player.position.z - rightZ;
    }
    visual.position.set(px, 0, pz);
    visual.rotation.y = player.rotation.y;
    visual.userData.ridePickup = true;
    applyDynamicHighQuality(visual);
    scene.add(visual);
    ridePickupVisual = visual;
  }

  window.addEventListener('kerala-ride-booking-start', event => {
    publicRideInProgress = true;
    clearGameInput();
    showRidePickupVisual(String(event.detail?.serviceId || 'auto'));
    showToast(`${event.detail?.serviceLabel || 'Driver'} is arriving…`, 2200);
  });

  window.addEventListener('kerala-ride-travel-start', () => {
    publicRideInProgress = true;
    clearGameInput();
    player.visible = false;
    clearRidePickupVisual();
  });

  window.addEventListener('kerala-ride-cancel', () => {
    publicRideInProgress = false;
    player.visible = !!profile;
    clearRidePickupVisual();
  });

  window.addEventListener('kerala-public-travel-arrival', event => {
    const detail = event.detail || {};
    if (!Number.isFinite(Number(detail.x)) || !Number.isFinite(Number(detail.z))) return;
    publicRideInProgress = false;
    clearRidePickupVisual();
    vehicleMode = 'walk';
    driveSpeed = 0;
    player.visible = !!profile;
    player.position.set(Number(detail.x), 0, Number(detail.z));
    player.rotation.y = Number.isFinite(Number(detail.rotation)) ? Number(detail.rotation) : player.rotation.y;
    if (positionBlocked(player.position.x, player.position.z, .43)) recoverBlockedPlayerSpawn(player, true);
    walkVelocity.set(0, 0, 0);
    targetWalkVelocity.set(0, 0, 0);
    walkSafePosition.copy(player.position);
    walkSafeRotation = player.rotation.y;
    walkSafeReady = true;
    walkingStuckSeconds = 0;
    busTravelStatus = null;
    selectedLandmark = null;
    selectedDestination = null;
    window.dispatchEvent(new CustomEvent('kerala-destination-cleared', { detail: { reason: 'travel-arrival' } }));
    renderMapLandmarks();
    updateMapPlayer(player);
    updateWorldInteract();
    updateLifeLoopMission();
  });
  let cameraDriveImpulse = 0;
  let perfFrames = 0, perfTime = performance.now(), perfCooldown = 0;
  let npcAccumulator = 0, trafficAccumulator = 0, mapAccumulator = 0, interactionAccumulator = 0, walkingStuckSeconds = 0;
  const moveForward = new THREE.Vector3();
  const moveRight = new THREE.Vector3();
  const keys = new Set();

  function clearJoystick() {
    joystickPointerId = null;
    inputX = 0;
    inputY = 0;
    joystickKnob.style.transform = 'translate(0px, 0px)';
  }

  function updateJoystick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maximum = 38;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > maximum) {
      dx *= maximum / distance;
      dy *= maximum / distance;
    }
    const normalized = Math.min(1, Math.hypot(dx, dy) / maximum);
    const deadzone = .12;
    if (normalized <= deadzone || !distance) {
      inputX = 0; inputY = 0;
    } else {
      const scaled = (normalized - deadzone) / (1 - deadzone);
      const length = Math.hypot(dx, dy) || 1;
      inputX = dx / length * scaled;
      inputY = dy / length * scaled;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  joystickZone.addEventListener('pointerdown', event => {
    if (joystickPointerId !== null) return;
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touchDistance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    if (touchDistance > rect.width * .72) return;
    joystickPointerId = event.pointerId;
    joystickZone.setPointerCapture(event.pointerId);
    updateJoystick(event);
    event.preventDefault();
  });
  joystickZone.addEventListener('pointermove', event => {
    if (event.pointerId === joystickPointerId) updateJoystick(event);
  });
  joystickZone.addEventListener('pointerup', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
  });
  joystickZone.addEventListener('pointercancel', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
  });
  joystickZone.addEventListener('lostpointercapture', clearJoystick);

  cameraZone.addEventListener('pointerdown', event => {
    if (lookPointerId !== null || event.target === runButton) return;
    lookPointerId = event.pointerId;
    lastLookX = event.clientX;
    lastLookY = event.clientY;
    cameraZone.setPointerCapture(event.pointerId);
  });
  cameraZone.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointerId) return;
    const lookDeltaX = event.clientX - lastLookX;
    const lookDeltaY = event.clientY - lastLookY;
    cameraYaw -= lookDeltaX * .009;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + lookDeltaY * .006, .12, .64);
    if (Math.hypot(lookDeltaX, lookDeltaY) > 4) recordOnboardingAction('camera');
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  });
  function clearLook(event) { if (!event || event.pointerId === lookPointerId) lookPointerId = null; }
  cameraZone.addEventListener('pointerup', clearLook);
  cameraZone.addEventListener('pointercancel', clearLook);
  cameraZone.addEventListener('lostpointercapture', clearLook);

  function setRun(value) {
    runHeld = !!value;
    if (value && vehicleMode === 'walk') runCruiseArmed = true;
    if (!value) runCruiseArmed = false;
    runButton.classList.toggle('active', value);
    if (value && vehicleMode === 'walk') recordOnboardingAction('run');
  }
  function clearRun(event) {
    if (!event || runPointerId === null || event.pointerId === runPointerId) {
      runPointerId = null;
      setRun(false);
    }
  }
  runButton.addEventListener('pointerdown', event => {
    if (runPointerId !== null) return;
    runPointerId = event.pointerId;
    runButton.setPointerCapture(event.pointerId);
    setRun(true);
    event.preventDefault();
  });
  runButton.addEventListener('pointerup', clearRun);
  runButton.addEventListener('pointercancel', clearRun);
  runButton.addEventListener('lostpointercapture', clearRun);

  function setAccelerator(value) {
    acceleratorHeld = !!value && vehicleMode !== 'walk';
    accelerateButton?.classList.toggle('active', acceleratorHeld);
  }
  function clearAccelerator(event) {
    if (!event || acceleratorPointerId === null || event.pointerId === acceleratorPointerId) {
      acceleratorPointerId = null;
      setAccelerator(false);
    }
  }
  accelerateButton?.addEventListener('pointerdown', event => {
    if (acceleratorPointerId !== null || vehicleMode === 'walk') return;
    acceleratorPointerId = event.pointerId;
    accelerateButton.setPointerCapture(event.pointerId);
    setAccelerator(true);
    event.preventDefault();
  });
  accelerateButton?.addEventListener('pointerup', clearAccelerator);
  accelerateButton?.addEventListener('pointercancel', clearAccelerator);
  accelerateButton?.addEventListener('lostpointercapture', clearAccelerator);

  window.addEventListener('pointerup', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
    if (event.pointerId === lookPointerId) clearLook(event);
    if (event.pointerId === runPointerId) clearRun(event);
    if (event.pointerId === acceleratorPointerId) clearAccelerator(event);
  }, true);
  window.addEventListener('pointercancel', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
    if (event.pointerId === lookPointerId) clearLook(event);
    if (event.pointerId === runPointerId) clearRun(event);
    if (event.pointerId === acceleratorPointerId) clearAccelerator(event);
  }, true);

  function typingIntoField(event) {
    return event.target instanceof Element && event.target.matches('input, select, textarea, [contenteditable]');
  }
  function clearGameInput() {
    keys.clear();
    clearJoystick();
    setRun(false);
    runPointerId = null;
    setAccelerator(false);
    acceleratorPointerId = null;
    lookPointerId = null;
    driveSpeed = 0;
    smoothedDriveSteering = 0;
    driveSpeedRatio = 0;
    walkVelocity.set(0, 0, 0);
    targetWalkVelocity.set(0, 0, 0);
  }
  window.addEventListener('keydown', event => {
    if (typingIntoField(event) || !profile || document.querySelector('[aria-modal="true"]:not([hidden])')) return;
    const key = event.key.toLowerCase();
    if (vehicleMode !== 'walk' && key === 'h' && !event.repeat) {
      playVehicleHorn();
      event.preventDefault();
      return;
    }
    if (vehicleMode !== 'walk' && key === 'l' && !event.repeat) {
      toggleVehicleHeadlights();
      event.preventDefault();
      return;
    }
    keys.add(key);
    if (event.key === 'Shift') setRun(true);
  });
  window.addEventListener('keyup', event => {
    if (typingIntoField(event)) { keys.clear(); return; }
    keys.delete(event.key.toLowerCase());
    if (event.key === 'Shift') setRun(false);
  });
  document.addEventListener('focusin', event => { if (typingIntoField(event)) clearGameInput(); });
  window.addEventListener('blur', clearGameInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearGameInput(); });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    applyRenderScale();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fallback.style.display = 'grid';
    fallback.textContent = 'The game paused because WebGL was interrupted. Reload this page to continue.';
  });

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    const delta = Math.min(clock.getDelta(), .05);
    if (document.hidden) return;
    villageTime += delta;
    updateFarVisualDetails(delta);
    npcAccumulator += delta; trafficAccumulator += delta; mapAccumulator += delta; interactionAccumulator += delta;
    if (npcAccumulator >= (isMobile ? .12 : .05)) {
      updateVillagers(villageTime);
      updateAmbientAnimals(villageTime, npcAccumulator);
      npcAccumulator = 0;
    }
    if (trafficAccumulator >= (isMobile ? .066 : .025)) { updateTraffic(trafficAccumulator); trafficAccumulator = 0; }
    animateJobMissionVisual(villageTime);
    if (interactionAccumulator >= (isMobile ? .10 : .08)) {
      updateWorldInteract();
      interactionAccumulator = 0;
    }
    const keyboardX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    const keyboardY = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    const controlX = Math.abs(keyboardX) > 0 ? keyboardX : inputX;
    const controlY = Math.abs(keyboardY) > 0 ? keyboardY : inputY;
    const paused = !profile || !connectionReady || publicRideInProgress || !!document.querySelector('[aria-modal="true"]:not([hidden])');
    if (paused) clearGameInput();
    const controlLength = paused ? 0 : Math.min(1, Math.hypot(controlX, controlY));
    let movingNow = false;

    if (vehicleMode !== 'walk') {
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
      const vehicleRadius = vehicleMode === 'taxi' ? .92 : .56;

      if (positionBlocked(player.position.x, player.position.z, vehicleRadius)) {
        recoverVehicleOverlap(player, vehicleRadius);
      } else {
        rememberVehicleSafePose(player, vehicleRadius);
      }

      const rawThrottle = paused ? 0 : (acceleratorHeld ? 1 : THREE.MathUtils.clamp(-controlY, -1, 1));
      const rawSteering = paused ? 0 : THREE.MathUtils.clamp(controlX, -1, 1);
      const throttleDeadzone = .18;
      const steeringDeadzone = .12;
      const throttleMagnitude = Math.abs(rawThrottle) <= throttleDeadzone
        ? 0
        : (Math.abs(rawThrottle) - throttleDeadzone) / (1 - throttleDeadzone);
      const steeringMagnitude = Math.abs(rawSteering) <= steeringDeadzone
        ? 0
        : (Math.abs(rawSteering) - steeringDeadzone) / (1 - steeringDeadzone);
      const throttle = Math.sign(rawThrottle) * Math.pow(throttleMagnitude, 1.8);
      const steering = Math.sign(rawSteering) * Math.pow(steeringMagnitude, 1.35);
      const steerResponse = Math.abs(driveSpeed) < .8 ? 9.5 : 7.2;
      smoothedDriveSteering += (steering - smoothedDriveSteering) * (1 - Math.exp(-delta * steerResponse));
      const roadZone = roadZoneAt(player.position.x, player.position.z);
      const driveVehicle = currentDriveVehicle();
      const condition = Math.max(15, Math.min(100, Number(driveVehicle?.condition ?? 100)));
      const conditionFactor = .62 + .38 * (condition / 100);
      const fuel = Math.max(0, Number(driveVehicle?.fuel ?? 100));
      const maxForward = (vehicleMode === 'bike' ? roadZone.bikeLimit : roadZone.taxiLimit) * conditionFactor * (fuel <= .05 ? 0 : 1);
      const maxReverse = fuel <= .05 ? 0 : Math.min(vehicleMode === 'bike' ? 2.6 : 2.4, Math.max(.8, maxForward * .48));
      const targetSpeed = runHeld ? 0 : (throttle >= 0 ? throttle * maxForward : throttle * maxReverse);
      const brakingResponse = Math.abs(driveSpeed) > Math.max(2.2, maxForward * .35) ? 7.2 : 10.2;
      const response = runHeld ? brakingResponse : (acceleratorHeld ? 4.9 : (Math.abs(throttle) > .01 ? 2.7 : 3.8));
      driveSpeed += (targetSpeed - driveSpeed) * Math.min(1, delta * response);
      if (Math.abs(driveSpeed) < .03) driveSpeed = 0;
      const speedRatio = maxForward > .01 ? Math.min(1, Math.abs(driveSpeed) / maxForward) : 0;
      driveSpeedRatio = speedRatio;

      if (Math.abs(driveSpeed) > .035) {
        const lowSpeedAssist = 1.08 - speedRatio * .20;
        player.rotation.y -= smoothedDriveSteering * delta * (.68 + speedRatio * .72) * lowSpeedAssist * (driveSpeed >= 0 ? 1 : -1);
        const dx = Math.sin(player.rotation.y) * driveSpeed * delta;
        const dz = Math.cos(player.rotation.y) * driveSpeed * delta;
        const beforeX = player.position.x;
        const beforeZ = player.position.z;
        const impactSpeed = Math.abs(driveSpeed);
        const collided = moveWithCollision(player, dx, dz, vehicleRadius);
        const movedDistance = Math.hypot(player.position.x - beforeX, player.position.z - beforeZ);

        if (collided) {
          reportVehicleImpact(impactSpeed);
          vehicleCollisionFrames = movedDistance < .002 ? vehicleCollisionFrames + 1 : 0;
          driveSpeed *= movedDistance > .001 ? .42 : .12;
        } else {
          vehicleCollisionFrames = 0;
        }

        if (positionBlocked(player.position.x, player.position.z, vehicleRadius)) {
          recoverVehicleOverlap(player, vehicleRadius);
          movingNow = false;
        } else {
          rememberVehicleSafePose(player, vehicleRadius);
          movingNow = movedDistance > .0005;
        }
      }

      if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * (2.0 + speedRatio * 1.15));
      animateVehicleVisual(jobVehicleVisual, delta, driveSpeed, smoothedDriveSteering, speedRatio, runHeld);
      animatePlayer(player, walkPhase, 0);
      if (mapAccumulator >= .12) { updateMapPlayer(player); mapAccumulator = 0; }
    } else {
      driveSpeed = 0;
      driveSpeedRatio = 0;
      playerRunningVisual = false;
      smoothedDriveSteering += (0 - smoothedDriveSteering) * (1 - Math.exp(-delta * 10));
      const runningNow = runHeld;
      if (runningNow && controlLength > .08) runCruiseArmed = true;
      const autoRun = runningNow && runCruiseArmed && controlLength <= .08;
      const walkingInput = controlLength > .08 || autoRun;
      const needsFactor = Math.max(.55, Math.min(1, Number(needsSnapshot?.movementFactor || 1)));
      if (walkingInput) {
        if (autoRun) {
          // Holding RUN keeps the avatar moving straight ahead even after the
          // movement joystick is released. Releasing RUN stops auto-run.
          desiredMove.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
        } else {
          moveForward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
          moveRight.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
          desiredMove.copy(moveForward).multiplyScalar(-controlY).addScaledVector(moveRight, controlX);
          if (desiredMove.lengthSq() > .0001) desiredMove.normalize();
        }
        const inputCurve = autoRun ? 1 : Math.pow(controlLength, 1.55);
        const maxWalkSpeed = (runningNow ? 5.4 : 3.05) * needsFactor;
        targetWalkVelocity.copy(desiredMove).multiplyScalar(maxWalkSpeed * inputCurve);
      } else {
        targetWalkVelocity.set(0, 0, 0);
      }

      const walkResponse = walkingInput ? (runningNow ? 5.2 : 6.8) : 11.5;
      walkVelocity.lerp(targetWalkVelocity, 1 - Math.exp(-delta * walkResponse));
      if (!walkingInput && walkVelocity.lengthSq() < .0016) walkVelocity.set(0, 0, 0);

      const walkSpeed = walkVelocity.length();
      if (walkSpeed > .035) {
        const dx = walkVelocity.x * delta;
        const dz = walkVelocity.z * delta;
        const beforeX = player.position.x;
        const beforeZ = player.position.z;
        moveWithCollision(player, dx, dz, .43);
        const movedDistance = Math.hypot(player.position.x - beforeX, player.position.z - beforeZ);
        const overlappingWorld = positionBlocked(player.position.x, player.position.z, .43);
        walkingStuckSeconds = movedDistance < .0005 ? walkingStuckSeconds + delta : 0;

        // Do not teleport someone simply because they are pressing into a wall.
        // Recovery is reserved for genuine overlap/spawn bugs; ordinary contact
        // drops the accumulated velocity so the next input can slide away cleanly.
        if (walkingStuckSeconds > .72 && overlappingWorld) {
          let recovered = false;
          if (walkSafeReady && !positionBlocked(walkSafePosition.x, walkSafePosition.z, .48)) {
            player.position.set(walkSafePosition.x, 0, walkSafePosition.z);
            player.rotation.y = walkSafeRotation;
            recovered = true;
          } else {
            recovered = recoverBlockedPlayerSpawn(player, true);
          }
          walkingStuckSeconds = 0;
          walkVelocity.set(0, 0, 0);
          targetWalkVelocity.set(0, 0, 0);
          if (recovered) showToast('Avatar unstuck · clear path restored');
        } else if (walkingStuckSeconds > .42 && !overlappingWorld) {
          walkingStuckSeconds = 0;
          walkVelocity.multiplyScalar(.12);
        }

        addWalkProgress(movedDistance);
        if (movedDistance > .0005) {
          if (movedDistance > .015) recordOnboardingAction('move');
          const actualX = player.position.x - beforeX;
          const actualZ = player.position.z - beforeZ;
          const desiredYaw = Math.atan2(actualX, actualZ);
          const yawDelta = Math.atan2(
            Math.sin(desiredYaw - player.rotation.y),
            Math.cos(desiredYaw - player.rotation.y)
          );
          // Turn the body toward actual travel quickly enough that direction
          // changes never read as moonwalking, while keeping small turns smooth.
          if (Math.abs(yawDelta) > Math.PI * .30) {
            player.rotation.y = desiredYaw;
          } else {
            const actualSpeed = movedDistance / Math.max(delta, .001);
            const runBlend = THREE.MathUtils.clamp((actualSpeed - 3.0) / 2.0, 0, 1);
            const turnSpeed = THREE.MathUtils.lerp(13.5, 10.8, runBlend);
            player.rotation.y = rotateTowards(player.rotation.y, desiredYaw, delta * turnSpeed);
          }
          if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * .82);

          const actualSpeed = movedDistance / Math.max(delta, .001);
          const runBlend = THREE.MathUtils.clamp((actualSpeed - 3.0) / 2.0, 0, 1);
          playerRunningVisual = runBlend > .34;
          const animationAmount = Math.min(1, movedDistance / Math.max(.0001, ((runningNow ? 5.4 : 3.05) * needsFactor) * delta));
          const gaitRate = THREE.MathUtils.lerp(7.1, 11.7, runBlend);
          walkPhase += delta * gaitRate * Math.max(.28, animationAmount);
          animatePlayer(player, walkPhase, animationAmount);

          walkSafeAccumulator += delta;
          if (walkSafeAccumulator >= .22 && !positionBlocked(player.position.x, player.position.z, .48)) {
            walkSafePosition.copy(player.position);
            walkSafeRotation = player.rotation.y;
            walkSafeReady = true;
            walkSafeAccumulator = 0;
          }
          movingNow = true;
          if (mapAccumulator >= .15) { updateMapPlayer(player); mapAccumulator = 0; }
        } else {
          walkVelocity.multiplyScalar(.35);
          animatePlayer(player, walkPhase, 0);
        }
      } else {
        walkingStuckSeconds = 0;
        animatePlayer(player, walkPhase, 0);
      }
    }

    if (!footstepEffectsFailed) {
      try {
        updateFootstepEffects(delta, player, movingNow, playerRunningVisual, walkPhase);
      } catch (error) {
        footstepEffectsFailed = true;
        console.warn('Footstep visuals disabled after a runtime error:', error);
      }
    }

    const drivingCamera = vehicleMode !== 'walk';
    const walkingMotion = !drivingCamera && movingNow ? (playerRunningVisual ? 1 : .62) : 0;
    const walkBob = Math.sin(walkPhase * 2) * (playerRunningVisual ? .040 : .026) * walkingMotion;
    const walkSway = Math.sin(walkPhase) * (playerRunningVisual ? .024 : .016) * walkingMotion;

    const driveImpulseTarget = drivingCamera
      ? (acceleratorHeld ? .12 : 0) - (runHeld ? .16 : 0)
      : 0;
    cameraDriveImpulse += (driveImpulseTarget - cameraDriveImpulse) * (1 - Math.exp(-delta * 5.5));

    const lookAhead = drivingCamera
      ? .75 + driveSpeedRatio * 2.2 + cameraDriveImpulse * 1.35
      : 0;
    const baseTargetHeight = vehicleMode === 'taxi' ? 1.28 : vehicleMode === 'bike' ? 1.18 : 1.45;
    cameraTarget.set(
      player.position.x + Math.sin(player.rotation.y) * lookAhead,
      player.position.y + baseTargetHeight + walkBob * .42 + cameraDriveImpulse * .10,
      player.position.z + Math.cos(player.rotation.y) * lookAhead
    );

    const baseDistance = vehicleMode === 'taxi' ? 8.35 : vehicleMode === 'bike' ? 7.35 : 7.1;
    const distance = baseDistance
      + (drivingCamera ? driveSpeedRatio * 1.35 + cameraDriveImpulse * .72 : 0);
    const horizontal = Math.cos(cameraPitch) * distance;
    const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
    const stormShake = THREE.MathUtils.smoothstep(rain, .48, 1)
      * (drivingCamera ? .010 + driveSpeedRatio * .010 : .005);
    const rainShakeX = Math.sin(villageTime * 17.3) * stormShake;
    const rainShakeY = Math.sin(villageTime * 21.7 + .8) * stormShake * .72;
    const cameraRightX = Math.cos(cameraYaw);
    const cameraRightZ = -Math.sin(cameraYaw);
    const drivingSway = drivingCamera ? -smoothedDriveSteering * driveSpeedRatio * .075 : 0;
    const lateralMotion = walkSway + drivingSway;

    cameraPosition.set(
      player.position.x + Math.sin(cameraYaw) * horizontal + cameraRightX * lateralMotion + rainShakeX,
      player.position.y + (drivingCamera ? 1.32 : 1.45) + Math.sin(cameraPitch) * distance + walkBob + rainShakeY,
      player.position.z + Math.cos(cameraYaw) * horizontal + cameraRightZ * lateralMotion
    );

    const targetFov = 60
      + (drivingCamera ? driveSpeedRatio * 4.8 : playerRunningVisual && movingNow ? .65 : 0)
      + (drivingCamera && acceleratorHeld ? .35 : 0);
    const nextFov = camera.fov + (targetFov - camera.fov) * (1 - Math.exp(-delta * 4.6));
    if (Math.abs(nextFov - camera.fov) > .002) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    const cameraResponse = drivingCamera ? 6.5 + driveSpeedRatio * 1.6 : 8.6;
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * cameraResponse));
    camera.lookAt(cameraTarget);
    updateRemotePlayers(delta, camera);
    updateVehicleAction();
    updateDriveHud();
    sendMovement(player, movingNow);
    const weatherState = atmosphere.update(delta, villageTime, {
      moving: movingNow,
      running: vehicleMode === 'walk' && playerRunningVisual,
      nearWater: Math.hypot(player.position.x - 39, player.position.z + 4) < 15 || Math.hypot(player.position.x + 34, player.position.z + 13) < 13,
      inChallenge: !!challengeRound,
    });
    updateWorldWeatherVisuals(weatherState);
    updateWindWorld(villageTime, delta);
    updateMonsoonWaterVisuals(villageTime, delta);
    updateVehicleRainSpray(delta);
    renderer.render(scene, camera);
    if (isMobile) {
      perfFrames++;
      const now = performance.now();
      if (now - perfTime >= 2200) {
        const fps = perfFrames * 1000 / (now - perfTime);
        perfFrames = 0;
        perfTime = now;
        if (perfCooldown > 0) {
          perfCooldown--;
        } else if (fps < 24 && renderScale > .66) {
          renderScale = Math.max(.66, renderScale - .07);
          applyRenderScale();
          perfCooldown = 2;
        } else if (fps > 47 && renderScale < 1) {
          renderScale = Math.min(1, renderScale + .035);
          applyRenderScale();
          perfCooldown = 3;
        }
      }
    }
  }
  gameLoop();
} catch (error) {
  console.error(error);
  fallback.style.display = 'grid';
}

function rotateTowards(current, target, amount) {
  const turn = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + THREE.MathUtils.clamp(turn, -amount, amount);
}



function buildPlayer(player) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.48, 20),
    new THREE.MeshBasicMaterial({ color: 0x16201a, transparent: true, opacity: .25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  shadow.userData.contactShadow = true;
  shadow.userData.baseOpacity = .25;
  player.add(shadow);
  player.userData.shadow = shadow;
  replacePlayerAvatar(profile?.gender || 'male');
  updateNameLabel(player, profile?.username || '', profile?.id);
}

function avatarStyleSeed(value) {
  let hash = 2166136261;
  for (const char of String(value || 'kerala')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function replacePlayerAvatar(gender) {
  if (!playerRef) return;
  const oldAvatar = playerRef.userData.avatar;
  if (oldAvatar) { playerRef.remove(oldAvatar); disposeObject(oldAvatar); }
  const styleSeed = avatarStyleSeed(profile?.id || profile?.username || gender);
  const avatarStyle = gender === 'female'
    ? { gender: 'female', shirt: 0x1e8173, trousers: 0x273253, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x6c3c2c, accent: 0xe5bb51, styleSeed }
    : { gender: 'male', shirt: 0x2a759b, trousers: 0x26354a, skin: 0xa96d4c, hair: 0x171616, shoes: 0x27231f, accent: 0x6eaad0, styleSeed };
  const avatar = applyDynamicHighQuality(createHuman(avatarStyle));
  avatar.position.y = .04;
  playerRef.add(avatar);
  playerRef.userData.avatar = avatar;
}

function createHuman({ gender = 'male', shirt, trousers, skin, hair, shoes, accent = 0xffffff, styleSeed = 0 }) {
  const person = new THREE.Group();
  const isFemale = gender === 'female';
  const seed = Math.abs(Number(styleSeed) || 0) % 7;

  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: .78 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: trousers, roughness: .88 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .84 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: .96 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: .92 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .74 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: .48 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x261a15, roughness: .48 });
  const browMat = new THREE.MeshStandardMaterial({ color: hair, roughness: .92 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: isFemale ? 0x874a49 : 0x6f3d38, roughness: .62 });

  const parts = {};

  // More natural pelvis / torso silhouette while staying lightweight.
  const hips = new THREE.Mesh(
    new THREE.CylinderGeometry(isFemale ? .29 : .30, isFemale ? .32 : .33, .25, 12),
    trouserMat
  );
  hips.position.y = .91;
  hips.scale.z = .78;

  const waist = new THREE.Mesh(
    new THREE.CylinderGeometry(isFemale ? .255 : .28, isFemale ? .29 : .31, .28, 12),
    shirtMat
  );
  waist.position.y = 1.11;
  waist.scale.z = .77;

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(isFemale ? .29 : .31, isFemale ? .52 : .55, 7, 12),
    shirtMat
  );
  torso.scale.set(isFemale ? .94 : 1.04, 1.05, .74);
  torso.position.y = 1.43;

  const shoulderShape = new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 9), shirtMat);
  shoulderShape.scale.set(isFemale ? 1.05 : 1.18, .48, .70);
  shoulderShape.position.y = 1.66;

  person.add(hips, waist, torso, shoulderShape);
  parts.torso = torso;

  if (isFemale) {
    const kurtaHem = new THREE.Mesh(new THREE.CylinderGeometry(.355, .285, .52, 12), shirtMat);
    kurtaHem.position.set(0, 1.02, .005);
    kurtaHem.scale.z = .74;

    const scarfFront = new THREE.Mesh(new THREE.BoxGeometry(.085, .72, .035), accentMat);
    scarfFront.position.set(seed % 2 ? -.22 : .22, 1.42, .255);
    scarfFront.rotation.z = seed % 2 ? -.08 : .08;

    const scarfBack = new THREE.Mesh(new THREE.BoxGeometry(.09, .68, .035), accentMat);
    scarfBack.position.set(seed % 2 ? .21 : -.21, 1.42, -.245);
    scarfBack.rotation.z = seed % 2 ? .08 : -.08;

    person.add(kurtaHem, scarfFront, scarfBack);
  } else {
    const belt = new THREE.Mesh(new THREE.BoxGeometry(.57, .065, .34), accentMat);
    belt.position.set(0, 1.00, .015);
    person.add(belt);

    if (seed % 2 === 0) {
      for (let y = 1.22; y <= 1.58; y += .12) {
        const button = new THREE.Mesh(new THREE.SphereGeometry(.014, 6, 5), accentMat);
        button.position.set(0, y, .245);
        person.add(button);
      }
    }
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.105, .12, .18, 10), skinMat);
  neck.position.y = 1.89;
  person.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(.245, 16, 12), skinMat);
  head.scale.set(.86, 1.12, .90);
  head.position.y = 2.12;
  person.add(head);
  parts.head = head;

  // Subtle jaw/chin shape reduces the spherical toy look.
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.205, 14, 10), skinMat);
  jaw.scale.set(.91, .70, .88);
  jaw.position.set(0, 2.025, .018);
  person.add(jaw);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(.255, 16, 11, 0, Math.PI * 2, 0, Math.PI * (seed % 3 === 0 ? .58 : .52)),
    hairMat
  );
  hairCap.scale.set(.91, 1.07, .94);
  hairCap.position.y = 2.205;
  person.add(hairCap);

  if (isFemale) {
    const hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(.155, seed % 3 === 0 ? .58 : .48, 5, 10), hairMat);
    hairBack.position.set(0, 1.95, -.15);
    hairBack.scale.set(1.08, 1, .48);
    person.add(hairBack);

    if (seed % 2 === 0) {
      const braid = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .48, 4, 8), hairMat);
      braid.position.set(.08, 1.70, -.17);
      braid.rotation.z = -.08;
      person.add(braid);
    }
  } else {
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(.19, 12, 9), hairMat);
    backHair.scale.set(1.02, .68, .58);
    backHair.position.set(0, 2.13, -.17);
    person.add(backHair);

    if (seed % 3 === 1) {
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(.27, .07, .07), hairMat);
      fringe.position.set(-.03, 2.26, .205);
      fringe.rotation.z = -.10;
      person.add(fringe);
    }
  }

  // Ears.
  for (const x of [-.226, .226]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.042, 8, 6), skinMat);
    ear.scale.set(.62, 1, .52);
    ear.position.set(x, 2.105, .002);
    person.add(ear);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(.031, .082, 7), skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 2.105, .252);
  person.add(nose);

  for (const x of [-.085, .085]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), eyeWhiteMat);
    eyeWhite.scale.set(1.0, .64, .34);
    eyeWhite.position.set(x, 2.155, .232);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.014, 7, 5), eyeMat);
    pupil.scale.z = .55;
    pupil.position.set(x, 2.155, .257);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(.075, .014, .014), browMat);
    brow.position.set(x, 2.208, .238);
    brow.rotation.z = x < 0 ? -.05 : .05;
    person.add(eyeWhite, pupil, brow);
  }

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.082, .014, .012), mouthMat);
  mouth.position.set(0, 2.015, .245);
  mouth.rotation.z = seed % 2 ? .015 : -.015;
  person.add(mouth);

  // Jointed arms with upper/lower segments for smoother motion.
  [['leftArm', -.365, -.055], ['rightArm', .365, .055]].forEach(([name, x, restingTilt]) => {
    const shoulder = new THREE.Group();
    shoulder.name = name;
    shoulder.position.set(x, 1.62, 0);
    shoulder.rotation.z = restingTilt;

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isFemale ? .092 : .102, .255, 5, 9),
      shirtMat
    );
    upperArm.position.y = -.205;

    const elbow = new THREE.Group();
    elbow.position.y = -.42;

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.077, .245, 5, 9), skinMat);
    forearm.position.y = -.18;

    const hand = new THREE.Mesh(new THREE.SphereGeometry(.083, 9, 7), skinMat);
    hand.scale.set(.88, 1.12, .72);
    hand.position.y = -.38;

    elbow.add(forearm, hand);
    shoulder.add(upperArm, elbow);
    person.add(shoulder);

    parts[name] = shoulder;
    parts[name === 'leftArm' ? 'leftElbow' : 'rightElbow'] = elbow;
  });

  // Jointed legs give a softer walk than one rigid capsule per side.
  [['leftLeg', -.14], ['rightLeg', .14]].forEach(([name, x]) => {
    const hip = new THREE.Group();
    hip.name = name;
    hip.position.set(x, .91, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.115, .34, 5, 9), trouserMat);
    thigh.position.y = -.25;

    const knee = new THREE.Group();
    knee.position.y = -.48;

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.10, .35, 5, 9), trouserMat);
    shin.position.y = -.245;

    const foot = new THREE.Mesh(new THREE.BoxGeometry(.185, .12, .34), shoeMat);
    foot.position.set(0, -.49, .095);
    foot.rotation.x = -.03;

    knee.add(shin, foot);
    hip.add(thigh, knee);
    person.add(hip);

    parts[name] = hip;
    parts[name === 'leftLeg' ? 'leftKnee' : 'rightKnee'] = knee;
  });

  person.userData.parts = parts;
  person.userData.gender = gender;
  person.userData.styleSeed = seed;
  person.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return person;
}

function animatePlayer(player, phase, moving) {
  const amount = THREE.MathUtils.clamp(Number(moving) || 0, 0, 1);
  const bob = amount ? Math.abs(Math.sin(phase * 2)) * .022 * amount : 0;
  const avatar = player.userData.avatar;
  if (!avatar) return;
  avatar.position.y = .04 + bob;
  avatar.rotation.z = amount ? Math.sin(phase * .5) * .008 * amount : 0;
  avatar.rotation.x = amount ? -.012 * amount : 0;
  player.userData.shadow?.scale.setScalar(1 - bob * 1.8);
  animateHuman(avatar, phase, amount);
}

function animateHuman(human, phase, moving) {
  const parts = human.userData.parts;
  if (!parts) return;
  const amount = THREE.MathUtils.clamp(Number(moving) || 0, 0, 1);
  const stride = Math.sin(phase);
  const opposite = Math.sin(phase + Math.PI);
  const armSwing = stride * .48 * amount;
  const legSwing = stride * .54 * amount;
  const kneeLiftLeft = Math.max(0, opposite) * .28 * amount;
  const kneeLiftRight = Math.max(0, stride) * .28 * amount;

  parts.leftArm.rotation.x = armSwing;
  parts.rightArm.rotation.x = -armSwing;
  parts.leftLeg.rotation.x = -legSwing;
  parts.rightLeg.rotation.x = legSwing;

  if (parts.leftElbow) parts.leftElbow.rotation.x = .10 + Math.max(0, -stride) * .18 * amount;
  if (parts.rightElbow) parts.rightElbow.rotation.x = .10 + Math.max(0, stride) * .18 * amount;
  if (parts.leftKnee) parts.leftKnee.rotation.x = kneeLiftLeft;
  if (parts.rightKnee) parts.rightKnee.rotation.x = kneeLiftRight;

  if (parts.torso) {
    parts.torso.rotation.y = Math.sin(phase * .5) * .025 * amount;
    parts.torso.rotation.z = -stride * .012 * amount;
  }
  if (parts.head) {
    parts.head.rotation.y = -Math.sin(phase * .5) * .018 * amount;
    parts.head.rotation.z = stride * .006 * amount;
  }
}

function npcDailyRoutine(data, hour) {
  const schedule = Array.isArray(data?.dailySchedule) ? data.dailySchedule : null;
  if (!schedule?.length) return null;
  const normalizedHour = ((Number(hour) % 24) + 24) % 24;
  const sorted = schedule;
  let stageIndex = sorted.length - 1;
  for (let index = 0; index < sorted.length; index++) {
    if (normalizedHour >= Number(sorted[index].start || 0)) stageIndex = index;
    else break;
  }
  const stage = sorted[stageIndex];
  const previous = sorted[(stageIndex - 1 + sorted.length) % sorted.length];
  const elapsed = ((normalizedHour - Number(stage.start || 0)) + 24) % 24;
  const transitionHours = Math.max(.12, Number(stage.transitionHours ?? .55));
  const transitioning = elapsed < transitionHours && !stage.hidden && !previous?.hidden;
  const progress = transitioning ? THREE.MathUtils.smoothstep(elapsed / transitionHours, 0, 1) : 1;
  const fromX = Number(previous?.x ?? data.startX);
  const fromZ = Number(previous?.z ?? data.startZ);
  const toX = Number(stage.x ?? data.startX);
  const toZ = Number(stage.z ?? data.startZ);
  return {
    stageIndex,
    stage,
    behavior: stage.behavior || data.behavior,
    role: stage.role || data.baseRole || data.role || 'Local',
    hidden: !!stage.hidden,
    transitioning,
    progress,
    x: THREE.MathUtils.lerp(fromX, toX, progress),
    z: THREE.MathUtils.lerp(fromZ, toZ, progress),
    fromX,
    fromZ,
    toX,
    toZ,
    targetX: Number(stage.targetX ?? data.targetX ?? toX),
    targetZ: Number(stage.targetZ ?? data.targetZ ?? toZ),
    facing: Number(stage.facing ?? data.facing ?? 0),
  };
}

function applyNpcRoutineRole(villager, role, stageIndex) {
  const data = villager?.userData;
  if (!data) return;
  if (data.role === role && data.lastRoutineStage === stageIndex) return;
  data.role = role;
  data.lastRoutineStage = stageIndex;
  updateNpcLabel(villager);
}

function npcPingPongState(time, speed, offset) {
  // V79: route timing is deliberately close to human walking pace instead of
  // moving the NPC across a long route in only a couple of seconds.
  const cycle = ((time * Math.max(.18, speed) * .22 + offset) % 8 + 8) % 8;
  if (cycle < 1.35) return { progress: 0, direction: 1, moving: 0 };
  if (cycle < 3.25) return { progress: (cycle - 1.35) / 1.90, direction: 1, moving: 1 };
  if (cycle < 4.75) return { progress: 1, direction: -1, moving: 0 };
  if (cycle < 6.65) return { progress: 1 - (cycle - 4.75) / 1.90, direction: -1, moving: 1 };
  return { progress: 0, direction: 1, moving: 0 };
}

function updateVillagers(time) {
  villagers.forEach(villager => {
    const data = villager.userData;
    const human = data.human;
    if (!human) return;
    const parts = human.userData.parts || {};
    const rainReaction = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
    const hour = Number(worldWeatherState.hour ?? 12);
    const night = hour >= 20 || hour < 5.25;
    const lateEvening = hour >= 18.5 || hour < 6.0;
    let dailyRoutine = npcDailyRoutine(data, hour);
    let behavior = dailyRoutine?.behavior || data.behavior;
    const communityEvent = activeCommunityEvent();
    if (communityEvent?.target && dailyRoutine && !dailyRoutine.hidden) {
      const baseX = Number(dailyRoutine.toX ?? data.startX);
      const baseZ = Number(dailyRoutine.toZ ?? data.startZ);
      const eventDistance = Math.hypot(baseX - Number(communityEvent.target.x), baseZ - Number(communityEvent.target.z));
      const joinsEvent = eventDistance <= 18 && ((Number(data.npcIndex || 0) + Number(communityEvent.slot || 0)) % 3 === 0);
      if (joinsEvent) {
        const elapsed = Math.max(0, Date.now() - Number(communityEvent.startsAt || Date.now()));
        const blend = THREE.MathUtils.smoothstep(Math.min(1, elapsed / 30000), 0, 1);
        const offset = ((Number(data.npcIndex || 0) % 3) - 1) * 1.15;
        dailyRoutine = {
          ...dailyRoutine,
          transitioning: false,
          toX: THREE.MathUtils.lerp(baseX, Number(communityEvent.target.x) + offset, blend),
          toZ: THREE.MathUtils.lerp(baseZ, Number(communityEvent.target.z) + 2.2, blend),
          targetX: Number(communityEvent.target.x),
          targetZ: Number(communityEvent.target.z),
          behavior: 'social',
          role: 'Event Guest',
          stageIndex: `event-${communityEvent.id}`,
        };
        behavior = 'social';
      }
    }
    if (dailyRoutine) applyNpcRoutineRole(villager, dailyRoutine.role, dailyRoutine.stageIndex);
    const hiddenByRoutine = dailyRoutine?.hidden || (data.nightHide && night && !data.nightActive);
    villager.visible = !hiddenByRoutine;
    if (!villager.visible) {
      data.crossingActive = false;
      return;
    }

    const playerDistance = playerRef
      ? Math.hypot(villager.position.x - playerRef.position.x, villager.position.z - playerRef.position.z)
      : 0;
    if (runtimeIsMobile && playerDistance > 64 && data.behavior !== 'crossing') {
      data.crossingActive = false;
      return;
    }

    const nearRainShelter = data.hasRainShelter
      && Math.hypot(villager.position.x - data.rainShelterX, villager.position.z - data.rainShelterZ) <= 5.5;
    const usingUmbrella = rainReaction > .18 && !nearRainShelter;
    if (data.umbrella) {
      data.umbrella.visible = usingUmbrella;
      data.umbrella.rotation.y = Math.sin(time * .22 + data.routinePhase) * .035;
    }

    const applyRainShelter = () => {
      if (!data.hasRainShelter || !nearRainShelter || rainReaction < .42) return false;
      const shelterBlend = THREE.MathUtils.smoothstep(rainReaction, .42, .84);
      villager.position.x = THREE.MathUtils.lerp(villager.position.x, data.rainShelterX, shelterBlend);
      villager.position.z = THREE.MathUtils.lerp(villager.position.z, data.rainShelterZ, shelterBlend);
      return shelterBlend > .45;
    };

    // Restore the relaxed arm posture before applying activity/weather poses.
    if (parts.leftArm) parts.leftArm.rotation.z = -.055;
    if (parts.rightArm) parts.rightArm.rotation.z = .055;
    if (parts.torso) parts.torso.rotation.x = 0;
    if (parts.head) parts.head.rotation.x = 0;

    const applyRainPosture = () => {
      if (rainReaction <= .08) return;
      if (parts.head) parts.head.rotation.x = rainReaction * .09;
      if (parts.torso) parts.torso.rotation.x = rainReaction * .03;
      if (usingUmbrella) {
        if (parts.rightArm) {
          parts.rightArm.rotation.x = -.82;
          parts.rightArm.rotation.z = -.08;
        }
        if (parts.rightElbow) parts.rightElbow.rotation.x = .92;
        if (parts.leftArm) parts.leftArm.rotation.z += rainReaction * .025;
      } else {
        if (parts.leftArm) parts.leftArm.rotation.z += rainReaction * .035;
        if (parts.rightArm) parts.rightArm.rotation.z -= rainReaction * .035;
      }
    };

    data.crossingActive = false;

    if (dailyRoutine?.transitioning) {
      villager.position.set(dailyRoutine.x, 0, dailyRoutine.z);
      const dx = dailyRoutine.toX - dailyRoutine.fromX;
      const dz = dailyRoutine.toZ - dailyRoutine.fromZ;
      if (Math.hypot(dx, dz) > .05) villager.rotation.y = Math.atan2(dx, dz);
      animateHuman(human, time * Math.max(.8, data.speed * 5.2) + data.offset, .34 * (1 - rainReaction * .12));
      applyRainPosture();
      return;
    }

    if (Number(data.interactionUntil || 0) > performance.now()) {
      const playerX = Number(playerRef?.position.x ?? data.interactionPlayerX);
      const playerZ = Number(playerRef?.position.z ?? data.interactionPlayerZ);
      let dx = playerX - villager.position.x;
      let dz = playerZ - villager.position.z;
      const talkDistance = Math.hypot(dx, dz);
      if (talkDistance > .05) villager.rotation.y = Math.atan2(dx, dz);
      if (talkDistance > .05 && talkDistance < 1.35) {
        const separation = Math.min(.12, 1.35 - talkDistance);
        villager.position.x -= (dx / talkDistance) * separation;
        villager.position.z -= (dz / talkDistance) * separation;
        dx = playerX - villager.position.x;
        dz = playerZ - villager.position.z;
      }
      animateHuman(human, time * .62 + data.offset, 0);
      const greetBeat = (Math.sin(time * 4.1 + data.offset) + 1) * .5;
      if (parts.rightArm) parts.rightArm.rotation.x = -.28 - greetBeat * .38;
      if (parts.rightElbow) parts.rightElbow.rotation.x = .30 + greetBeat * .46;
      if (parts.head) {
        parts.head.rotation.y = Math.sin(time * 1.3 + data.offset) * .06;
        parts.head.rotation.z = Math.sin(time * .8 + data.offset) * .018;
      }
      applyRainPosture();
      return;
    }

    if (behavior === 'social') {
      villager.position.set(dailyRoutine?.toX ?? data.startX, 0, dailyRoutine?.toZ ?? data.startZ);
      const sheltered = applyRainShelter();
      const dx = Number(dailyRoutine?.targetX ?? data.targetX) - villager.position.x;
      const dz = Number(dailyRoutine?.targetZ ?? data.targetZ) - villager.position.z;
      villager.rotation.y = Math.atan2(dx, dz);
      animateHuman(human, time * .55 + data.offset, 0);

      const talkBeat = Math.sin(time * (lateEvening ? .46 : .72) + data.offset) * (sheltered ? .55 : 1);
      if (parts.head) {
        parts.head.rotation.y = talkBeat * .10;
        parts.head.rotation.z = Math.sin(time * .38 + data.offset) * .025;
      }
      if (parts.rightArm) parts.rightArm.rotation.x = -.20 - Math.max(0, talkBeat) * .34;
      if (parts.rightElbow) parts.rightElbow.rotation.x = .34 + Math.max(0, talkBeat) * .38;
      if (parts.leftArm && talkBeat < -.35) parts.leftArm.rotation.x = -.14;
      applyRainPosture();
      return;
    }

    if (behavior === 'task') {
      villager.position.set(dailyRoutine?.toX ?? data.startX, 0, dailyRoutine?.toZ ?? data.startZ);
      const sheltered = applyRainShelter();
      villager.rotation.y = Number(dailyRoutine?.facing ?? data.facing ?? 0);
      animateHuman(human, time * .55 + data.offset, 0);
      const workBeat = (Math.sin(time * (lateEvening ? .58 : .95) + data.offset) + 1) * .5 * (sheltered ? .68 : 1);
      if (parts.rightArm) parts.rightArm.rotation.x = -.22 - workBeat * .46;
      if (parts.rightElbow) parts.rightElbow.rotation.x = .38 + workBeat * .48;
      if (parts.head) parts.head.rotation.y = Math.sin(time * .34 + data.offset) * .12;
      applyRainPosture();
      return;
    }

    if (behavior === 'phone') {
      villager.position.set(dailyRoutine?.toX ?? data.startX, 0, dailyRoutine?.toZ ?? data.startZ);
      applyRainShelter();
      villager.rotation.y = Number(dailyRoutine?.facing ?? data.facing ?? 0);
      animateHuman(human, time * .45 + data.offset, 0);
      if (parts.rightArm) parts.rightArm.rotation.x = -1.0;
      if (parts.rightElbow) parts.rightElbow.rotation.x = 1.18;
      if (parts.head) {
        parts.head.rotation.x = .10;
        parts.head.rotation.y = Math.sin(time * .25 + data.offset) * .08;
      }
      applyRainPosture();
      return;
    }

    if (behavior === 'idle') {
      villager.position.set(dailyRoutine?.toX ?? data.startX, 0, dailyRoutine?.toZ ?? data.startZ);
      applyRainShelter();
      villager.rotation.y = Number(dailyRoutine?.facing ?? data.facing ?? 0);
      animateHuman(human, time * .55 + data.offset, 0);
      if (parts.head) parts.head.rotation.y = Math.sin(time * .42 + data.offset) * .11;
      if (parts.torso) parts.torso.rotation.y = Math.sin(time * .28 + data.offset) * .018;
      applyRainPosture();
      return;
    }

    const routineSpeed = night ? .56 : lateEvening ? .78 : 1;
    const weatherSpeed = data.speed * routineSpeed * (1 - rainReaction * .22);
    const motion = npcPingPongState(time, weatherSpeed, data.offset);

    if (behavior === 'crossing') {
      const fromX = Number(data.crossFromX);
      const toX = Number(data.crossToX);
      villager.position.x = THREE.MathUtils.lerp(fromX, toX, motion.progress);
      villager.position.z = data.startZ;
      villager.rotation.y = motion.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      data.crossingActive = motion.moving > 0 && Math.abs(villager.position.x) < 10.15;
      animateHuman(human, time * weatherSpeed * 4.8, motion.moving ? .38 * (1 - rainReaction * .12) : 0);
      if (!motion.moving) {
        // Kerb-side pedestrians visibly check both directions instead of
        // freezing like props while they wait for their next crossing window.
        if (parts.head) parts.head.rotation.y = Math.sin(time * .95 + data.offset) * .42;
        if (parts.torso) parts.torso.rotation.y = Math.sin(time * .48 + data.offset) * .025;
      }
      applyRainPosture();
      return;
    }

    const routeOffset = (motion.progress * 2 - 1) * data.distance;
    villager.position.x = dailyRoutine?.toX ?? data.startX;
    villager.position.z = (dailyRoutine?.toZ ?? data.startZ) + routeOffset;
    villager.rotation.y = motion.direction > 0 ? 0 : Math.PI;
    animateHuman(human, time * weatherSpeed * 4.5, motion.moving ? .34 * (1 - rainReaction * .10) : 0);
    applyRainPosture();

    if (!motion.moving && parts.head) {
      parts.head.rotation.y = Math.sin(time * .38 + data.offset) * .08;
    }
  });
}

function addBoxCollider(x, z, halfWidth, halfDepth, kind = 'structure') {
  staticColliders.push({ type: 'box', x, z, halfWidth, halfDepth, kind });
}

function addCircleCollider(x, z, radius, kind = 'obstacle') {
  staticColliders.push({ type: 'circle', x, z, radius, kind });
}

function circleHitsBox(x, z, radius, boxX, boxZ, halfWidth, halfDepth) {
  const closestX = THREE.MathUtils.clamp(x, boxX - halfWidth, boxX + halfWidth);
  const closestZ = THREE.MathUtils.clamp(z, boxZ - halfDepth, boxZ + halfDepth);
  return (x - closestX) ** 2 + (z - closestZ) ** 2 < radius * radius;
}

function trafficFootprint(config) {
  const kind = config?.kind;
  const dimensions = kind === 'bus'
    ? { halfWidth: 1.22, halfLength: 2.72 }
    : kind === 'auto'
      ? { halfWidth: .72, halfLength: 1.22 }
      : kind === 'bike'
        ? { halfWidth: .42, halfLength: .92 }
        : { halfWidth: .86, halfLength: 1.66 };
  return config?.axis === 'x'
    ? { halfWidth: dimensions.halfLength, halfDepth: dimensions.halfWidth }
    : { halfWidth: dimensions.halfWidth, halfDepth: dimensions.halfLength };
}

function positionBlocked(x, z, radius = .45) {
  for (const collider of staticColliders) {
    if (collider.type === 'circle') {
      const limit = collider.radius + radius;
      if ((x - collider.x) ** 2 + (z - collider.z) ** 2 < limit * limit) return true;
      continue;
    }
    if (circleHitsBox(x, z, radius, collider.x, collider.z, collider.halfWidth, collider.halfDepth)) return true;
  }

  for (const vehicle of traffic) {
    if (!vehicle?.visible) continue;
    const config = vehicle.userData?.traffic;
    if (!config) continue;
    const footprint = trafficFootprint(config);
    if (circleHitsBox(x, z, radius, vehicle.position.x, vehicle.position.z, footprint.halfWidth, footprint.halfDepth)) return true;
  }
  return false;
}

function moveWithCollision(object, dx, dz, radius) {
  if (!object || (!dx && !dz)) return false;
  let collided = false;
  const distance = Math.hypot(dx, dz);
  const maxStep = Math.max(.10, Math.min(.28, radius * .38));
  const steps = Math.max(1, Math.ceil(distance / maxStep));
  const stepX = dx / steps;
  const stepZ = dz / steps;

  for (let step = 0; step < steps; step++) {
    const nextX = THREE.MathUtils.clamp(object.position.x + stepX, -110, 110);
    if (!positionBlocked(nextX, object.position.z, radius)) object.position.x = nextX;
    else collided = true;

    const nextZ = THREE.MathUtils.clamp(object.position.z + stepZ, -110, 110);
    if (!positionBlocked(object.position.x, nextZ, radius)) object.position.z = nextZ;
    else collided = true;
  }
  return collided;
}

function rememberVehicleSafePose(object, radius) {
  if (!object || positionBlocked(object.position.x, object.position.z, radius + .06)) return;
  vehicleSafePosition.copy(object.position);
  vehicleSafeRotation = object.rotation.y;
  vehicleSafeReady = true;
}

function findVehicleRecoveryPoint(object, radius) {
  if (vehicleSafeReady && !positionBlocked(vehicleSafePosition.x, vehicleSafePosition.z, radius + .08)) {
    return { x: vehicleSafePosition.x, z: vehicleSafePosition.z, rotation: vehicleSafeRotation };
  }

  const backwardsX = -Math.sin(object.rotation.y);
  const backwardsZ = -Math.cos(object.rotation.y);
  for (const distance of [.45, .8, 1.2, 1.7, 2.3]) {
    const x = THREE.MathUtils.clamp(object.position.x + backwardsX * distance, -110, 110);
    const z = THREE.MathUtils.clamp(object.position.z + backwardsZ * distance, -110, 110);
    if (!positionBlocked(x, z, radius + .08)) return { x, z, rotation: object.rotation.y };
  }

  for (const ring of [1, 1.6, 2.4, 3.2]) {
    for (let index = 0; index < 16; index++) {
      const angle = index / 16 * Math.PI * 2;
      const x = THREE.MathUtils.clamp(object.position.x + Math.sin(angle) * ring, -110, 110);
      const z = THREE.MathUtils.clamp(object.position.z + Math.cos(angle) * ring, -110, 110);
      if (!positionBlocked(x, z, radius + .08)) return { x, z, rotation: object.rotation.y };
    }
  }
  return null;
}

function recoverVehicleOverlap(object, radius) {
  if (!object || !positionBlocked(object.position.x, object.position.z, radius)) return false;
  const recovery = findVehicleRecoveryPoint(object, radius);
  if (!recovery) return false;
  object.position.set(recovery.x, 0, recovery.z);
  object.rotation.y = recovery.rotation;
  vehicleSafePosition.copy(object.position);
  vehicleSafeRotation = object.rotation.y;
  vehicleSafeReady = true;
  vehicleCollisionFrames = 0;
  driveSpeed = 0;
  if (performance.now() - lastVehicleRecoveryNotice > 3500) {
    lastVehicleRecoveryNotice = performance.now();
    showToast('Vehicle unstuck · safe position restored');
  }
  return true;
}

function visualRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createGroundSurfaceTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = visualRandom(7301);
  context.fillStyle = '#5f7f48';
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++) {
    const x = random() * size;
    const y = random() * size;
    const radius = 2 + random() * 10;
    const green = 74 + Math.floor(random() * 42);
    const red = 70 + Math.floor(random() * 35);
    const blue = 42 + Math.floor(random() * 24);
    context.fillStyle = `rgba(${red},${green + 40},${blue},${.035 + random() * .09})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  for (let i = 0; i < 900; i++) {
    const shade = 70 + Math.floor(random() * 55);
    context.fillStyle = `rgba(${shade - 18},${shade + 22},${Math.max(36, shade - 30)},${.08 + random() * .12})`;
    context.fillRect(random() * size, random() * size, .8 + random() * 1.7, 1 + random() * 2.6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(13, 13);
  return texture;
}

function createRoadSurfaceTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = visualRandom(1976);
  context.fillStyle = '#303438';
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 1600; i++) {
    const value = 38 + Math.floor(random() * 38);
    context.fillStyle = `rgba(${value},${value + 2},${value + 3},${.08 + random() * .13})`;
    const width = .5 + random() * 2.2;
    context.fillRect(random() * size, random() * size, width, .5 + random() * 1.5);
  }

  context.strokeStyle = 'rgba(15,18,20,.10)';
  context.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const x = random() * size;
    context.beginPath();
    context.moveTo(x, 0);
    context.bezierCurveTo(x + random() * 8 - 4, 70, x + random() * 10 - 5, 170, x + random() * 8 - 4, size);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 28);
  return texture;
}

function addRoadSurfaceDetails(scene) {
  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8575, roughness: 1 });
  const whiteLineMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e8df, roughness: .76 });
  const reflectorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe8a8,
    emissive: 0xffc85f,
    emissiveIntensity: .18,
    roughness: .58,
  });

  for (const x of [-8.55, 8.55]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 160), shoulderMaterial);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(x, .011, 0);
    shoulder.receiveShadow = true;
    scene.add(shoulder);

    const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(.11, 158), whiteLineMaterial);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(Math.sign(x) * 7.42, .035, 0);
    scene.add(edgeLine);
  }

  for (const z of [-28.55, -15.45]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(88, .95), shoulderMaterial);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(-28, .012, z);
    shoulder.receiveShadow = true;
    scene.add(shoulder);

    const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(86.5, .11), whiteLineMaterial);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(-28, .036, z < -22 ? -27.42 : -16.58);
    scene.add(edgeLine);
  }

  for (let z = -68; z <= 68; z += 8) {
    for (const x of [-7.1, 7.1]) {
      const reflector = new THREE.Mesh(new THREE.BoxGeometry(.12, .035, .26), reflectorMaterial);
      reflector.position.set(x, .055, z);
      scene.add(reflector);
    }
  }
}

function addWeatherRoadDetails(scene) {
  const puddleGeometry = new THREE.CircleGeometry(1, 18);
  const puddles = [
    [-5.9, -38, 1.7, .55, .18],
    [5.8, -5, 1.35, .46, -.12],
    [-5.7, 21, 1.55, .50, .08],
    [5.9, 47, 1.8, .58, -.2],
    [-40, -26.8, 1.45, .48, .12],
    [-22, -17.1, 1.25, .43, -.08],
  ];
  puddles.forEach(([x, z, scaleX, scaleZ, rotation]) => {
    const material = new THREE.MeshStandardMaterial({
      color: 0x31454d,
      roughness: .20,
      metalness: .10,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const puddle = new THREE.Mesh(puddleGeometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = rotation;
    puddle.scale.set(scaleX, scaleZ, 1);
    puddle.position.set(x, .047, z);
    puddle.renderOrder = 1;
    puddleMaterials.push(material);
    scene.add(puddle);

    for (let ringIndex = 0; ringIndex < 2; ringIndex++) {
      const rippleMaterial = new THREE.MeshBasicMaterial({
        color: 0xbad7e3,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const ripple = new THREE.Mesh(new THREE.RingGeometry(.22, .27, 22), rippleMaterial);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(
        x + (ringIndex ? .24 : -.18) * scaleX,
        .054,
        z + (ringIndex ? -.10 : .16) * scaleZ
      );
      ripple.renderOrder = 2;
      puddleRipples.push({
        mesh: ripple,
        material: rippleMaterial,
        baseScaleX: scaleX,
        baseScaleZ: scaleZ,
        phase: ringIndex * .53 + puddleRipples.length * .31,
      });
      scene.add(ripple);
    }
  });
}

function addStreetLight(scene, x, z, side = 1, rotation = 0) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x444b4e, roughness: .7, metalness: .32 });
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff0c7,
    emissive: 0xffc86f,
    emissiveIntensity: .08,
    roughness: .34,
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.055, .075, 4.8, 8), metal);
  pole.position.y = 2.4;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, 1.05), metal);
  arm.position.set(0, 4.65, side * .48);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.32, .10, .48), lampMaterial);
  lamp.position.set(0, 4.58, side * .98);

  const pool = new THREE.PointLight(0xffc878, 0, 11.5, 1.65);
  pool.position.set(0, 4.15, side * .98);
  pool.castShadow = false;

  const reflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc36b,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  reflectionMaterial.userData.dryGlow = .055;
  reflectionMaterial.userData.wetGlow = .30;
  const reflection = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 4.8), reflectionMaterial);
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, .052, side * 2.55);
  reflection.renderOrder = 2;

  streetLampMaterials.push(lampMaterial);
  streetLightSources.push(pool);
  wetReflectionMaterials.push(reflectionMaterial);
  group.add(pole, arm, lamp, pool, reflection);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

function addRoadsideLife(scene) {
  const grassGeometry = new THREE.ConeGeometry(.085, .48, 3);
  grassGeometry.translate(0, .24, 0);
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x4f7439, roughness: 1 });
  const positions = [];
  const random = visualRandom(8819);

  for (let i = 0; i < 92; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (10 + random() * 11);
    const z = -75 + random() * 150;
    if (Math.abs(z + 22) < 9 && side < 0) continue;
    positions.push([x, z, .65 + random() * .85, random() * Math.PI]);
  }
  for (let i = 0; i < 48; i++) {
    const x = -67 + random() * 78;
    const side = i % 2 ? 1 : -1;
    const z = -22 + side * (8.5 + random() * 6.5);
    if (Math.abs(x) < 11) continue;
    positions.push([x, z, .65 + random() * .8, random() * Math.PI]);
  }

  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, positions.length);
  grass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  positions.forEach(([x, z, scale, yaw], index) => {
    dummy.position.set(x, .015, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    grass.setMatrixAt(index, dummy.matrix);
  });
  grass.instanceMatrix.needsUpdate = true;
  grass.receiveShadow = true;
  roadsideGrassWind = { mesh: grass, positions, dummy };
  scene.add(grass);

  [-57, -31, -5, 25, 51].forEach((z, index) => {
    addStreetLight(scene, index % 2 ? -9.4 : 9.4, z, index % 2 ? 1 : -1);
  });
  [-58, -38, -6].forEach((x, index) => {
    addStreetLight(scene, x, index % 2 ? -29.2 : -14.8, index % 2 ? 1 : -1, Math.PI / 2);
  });
}


function registerFarVisual(object, x, z, maxDistance = 52) {
  if (!object) return object;
  farVisualDetails.push({ object, x: Number(x), z: Number(z), maxDistance: Number(maxDistance) });
  return object;
}

function updateFarVisualDetails(delta) {
  farVisualTimer += delta;
  if (farVisualTimer < .32 || !playerRef) return;
  farVisualTimer = 0;
  for (const detail of farVisualDetails) {
    const distance = Math.hypot(
      playerRef.position.x - detail.x,
      playerRef.position.z - detail.z,
    );
    detail.object.visible = distance <= detail.maxDistance;
  }
}

function createWorldSignTexture({
  title,
  subtitle = '',
  background = '#1f5f48',
  foreground = '#fff8e7',
  accent = '#e2ba58',
  width = 512,
  height = 160,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = accent;
  context.fillRect(0, 0, width, Math.max(8, Math.round(height * .065)));
  context.fillRect(0, height - Math.max(8, Math.round(height * .065)), width, Math.max(8, Math.round(height * .065)));

  context.strokeStyle = 'rgba(255,255,255,.7)';
  context.lineWidth = 6;
  context.strokeRect(8, 8, width - 16, height - 16);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = foreground;
  context.font = '900 48px "Noto Sans Malayalam", "Noto Sans", sans-serif';
  context.fillText(String(title || '').toUpperCase(), width / 2, subtitle ? height * .43 : height * .52, width - 44);

  if (subtitle) {
    context.fillStyle = '#f3dfad';
    context.font = '700 25px "Noto Sans Malayalam", "Noto Sans", sans-serif';
    context.fillText(String(subtitle), width / 2, height * .72, width - 42);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createWorldSignMesh(options, width = 4.8, height = 1.05) {
  const texture = createWorldSignTexture(options);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.userData.worldSignTexture = texture;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function addRoadsideIdentitySigns(scene) {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x555d5e, roughness: .76, metalness: .24 });

  const addBoard = ({ x, z, rotation = 0, title, subtitle, background, width = 3.3, height = .92 }) => {
    const root = new THREE.Group();
    const board = createWorldSignMesh({ title, subtitle, background }, width, height);
    board.position.y = 2.15;
    board.position.z = .035;
    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(width + .14, height + .14, .08),
      new THREE.MeshStandardMaterial({ color: 0x343b3d, roughness: .72, metalness: .15 })
    );
    backing.position.y = 2.15;
    [-width * .32, width * .32].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.07, 2.15, .07), postMaterial);
      post.position.set(px, 1.08, 0);
      root.add(post);
    });
    root.add(backing, board);
    root.position.set(x, 0, z);
    root.rotation.y = rotation;
    applyDynamicHighQuality(root);
    registerFarVisual(root, x, z, 60);
    scene.add(root);
  };

  addBoard({
    x: -10.9, z: -35.5, rotation: 0,
    title: 'MARKET ROAD',
    subtitle: 'Town Centre →',
    background: '#246b4b',
  });
  addBoard({
    x: 10.9, z: 5.0, rotation: Math.PI,
    title: 'BUS STAND',
    subtitle: '← Main Road',
    background: '#245979',
  });
  addBoard({
    x: -46.0, z: -29.4, rotation: Math.PI / 2,
    title: 'VILLAGE ROAD',
    subtitle: 'Drive Slow · 30',
    background: '#74572d',
    width: 3.6,
  });

  // Kerala-style milestone / distance marker.
  const milestone = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf0e7c9, roughness: .96 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xe0b93e, roughness: .86 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(.78, 1.24, .38), baseMat);
  base.position.y = .62;
  const top = new THREE.Mesh(new THREE.BoxGeometry(.80, .40, .40), topMat);
  top.position.y = 1.42;
  const label = createWorldSignMesh({
    title: 'TOWN 2 km',
    subtitle: 'KERALA PLAY',
    background: '#f0e7c9',
    foreground: '#222b28',
    accent: '#d5a934',
    width: 320,
    height: 180,
  }, .70, .72);
  label.position.set(0, .82, .205);
  milestone.add(base, top, label);
  milestone.position.set(10.1, 58.5, 0);
  milestone.rotation.y = Math.PI;
  applyDynamicHighQuality(milestone);
  registerFarVisual(milestone, 10.1, 58.5, 58);
  scene.add(milestone);
}

function addBusStop(scene, x, z, rotation = 0, stopName = 'KERALA PLAY') {
  const group = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0xbeb9aa, roughness: .96 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x465156, roughness: .72, metalness: .28 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f6573, roughness: .78 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x765138, roughness: .9 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0x2c6f4f, roughness: .74 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d7, roughness: .86 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.7, .12, 1.55), concrete);
  floor.position.y = .06;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.95, .16, 1.75), roofMat);
  roof.position.set(0, 2.55, 0);
  [-2.05, 2.05].forEach(px => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.11, 2.45, .11), metal);
    post.position.set(px, 1.25, -.55);
    group.add(post);
  });

  const back = new THREE.Mesh(new THREE.BoxGeometry(4.45, 1.55, .09), boardMat);
  back.position.set(0, 1.48, -.66);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.7, .13, .48), seatMat);
  bench.position.set(0, .66, -.18);
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.7, .58, .10), seatMat);
  benchBack.position.set(0, .98, -.40);

  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 2.6, 7), metal);
  signPost.position.set(2.65, 1.30, .12);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(.52, .68, .07), signMat);
  sign.position.set(2.65, 2.36, .12);

  const stopBoard = createWorldSignMesh({
    title: stopName,
    subtitle: 'ബസ് സ്റ്റോപ്പ് · BUS STOP',
    background: '#2c6f4f',
  }, 3.72, .78);
  stopBoard.position.set(0, 2.02, -.605);

  const poleBoard = createWorldSignMesh({
    title: 'BUS',
    subtitle: 'STOP',
    background: '#245979',
    width: 256,
    height: 220,
  }, .44, .55);
  poleBoard.position.set(2.65, 2.36, .165);
  registerFarVisual(stopBoard, x, z, 52);
  registerFarVisual(poleBoard, x, z, 48);

  group.add(floor, roof, back, bench, benchBack, signPost, sign, stopBoard, poleBoard);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(group);

  const horizontal = Math.abs(Math.sin(rotation)) > .7;
  addBoxCollider(x, z, horizontal ? .92 : 2.45, horizontal ? 2.45 : .92, 'bus-stop');
}

function addCompoundWall(scene, x, z, width, depth, opening = 'front') {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xc8bfae, roughness: 1 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8e8475, roughness: 1 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x536a45, roughness: 1 });
  const wallRandom = visualRandom(Math.abs(Math.round(x * 79 + z * 127)) + 4021);
  const wallHeight = .72;
  const thickness = .16;
  const group = new THREE.Group();

  const addSegment = (widthValue, depthValue, px, pz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(widthValue, wallHeight, depthValue), wallMat);
    wall.position.set(px, wallHeight / 2, pz);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(widthValue + .025, .07, depthValue + .025), capMat);
    cap.position.set(px, wallHeight + .035, pz);
    group.add(wall, cap);
    if (wallRandom() > .28) {
      const moss = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(.08, widthValue * (.45 + wallRandom() * .42)),
          .022,
          Math.max(.08, depthValue * (.45 + wallRandom() * .42))
        ),
        mossMat
      );
      moss.position.set(
        px + (wallRandom() - .5) * Math.max(0, widthValue - .2) * .22,
        wallHeight + .082,
        pz + (wallRandom() - .5) * Math.max(0, depthValue - .2) * .22
      );
      group.add(moss);
    }
  };

  addSegment(thickness, depth, -width / 2, 0);
  addSegment(thickness, depth, width / 2, 0);
  addSegment(width, thickness, 0, -depth / 2);

  const openingWidth = Math.min(3.2, width * .34);
  if (opening === 'front') {
    const side = (width - openingWidth) / 2;
    addSegment(side, thickness, -(openingWidth + side) / 2, depth / 2);
    addSegment(side, thickness, (openingWidth + side) / 2, depth / 2);
  } else {
    addSegment(width, thickness, 0, depth / 2);
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

function addUtilityPoles(scene) {
  const concrete = new THREE.MeshStandardMaterial({ color: 0x8b8c87, roughness: .94 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4c5153, roughness: .78, metalness: .18 });
  const insulator = new THREE.MeshStandardMaterial({ color: 0x6e5542, roughness: .84 });
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0x25292a, transparent: true, opacity: .72 });
  const zPositions = [-64, -46, -28, -10, 26, 44, 62];
  const poleX = -13.0;
  const wirePoints = [[], [], []];

  zPositions.forEach(z => {
    const pole = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.075, .105, 5.6, 8), concrete);
    shaft.position.y = 2.8;
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.25, .09, .09), metal);
    crossbar.position.y = 5.30;
    pole.add(shaft, crossbar);
    [-.46, 0, .46].forEach((xOffset, index) => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .16, 7), insulator);
      cap.position.set(xOffset, 5.43, 0);
      pole.add(cap);
      wirePoints[index].push(new THREE.Vector3(poleX + xOffset, 5.47, z));
    });
    if (Math.abs(z) !== 64 && Math.abs(z) !== 62 && Math.abs(z) !== 44) {
      const posterColors = [0xe8d7a0, 0xdca7a1, 0xa9c8d8];
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(.34, .46),
        new THREE.MeshStandardMaterial({
          color: posterColors[Math.abs(Math.round(z)) % posterColors.length],
          roughness: .92,
          side: THREE.DoubleSide,
        })
      );
      poster.position.set(.105, 1.55 + (Math.abs(z) % 3) * .18, .01);
      poster.rotation.y = Math.PI / 2;
      poster.rotation.z = ((Math.abs(z) % 5) - 2) * .015;
      pole.add(poster);
    }
    pole.position.set(poleX, 0, z);
    scene.add(pole);
  });

  wirePoints.forEach(points => {
    const sagged = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      for (let step = 0; step < 5; step++) {
        const t = step / 5;
        const point = a.clone().lerp(b, t);
        point.y -= Math.sin(t * Math.PI) * .22;
        sagged.push(point);
      }
    }
    sagged.push(points[points.length - 1].clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(sagged);
    const line = new THREE.Line(geometry, wireMaterial);
    const attribute = geometry.getAttribute('position');
    attribute.setUsage(THREE.DynamicDrawUsage);
    windWires.push({
      attribute,
      base: Float32Array.from(attribute.array),
      phase: windWires.length * 1.37,
    });
    scene.add(line);
  });
}

function addJunctionMarkings(scene) {
  const white = new THREE.MeshStandardMaterial({ color: 0xf0efe7, roughness: .78 });
  for (let i = -3; i <= 3; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(.72, 4.7), white);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(i * 1.05, .044, -14.3);
    scene.add(stripe);
  }

  const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(7.0, .24), white);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(-8.9, .044, -22);
  stopLine.rotation.z = Math.PI / 2;
  scene.add(stopLine);
}

function addRoadsideClutter(scene) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x765033, roughness: .94 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xaa7b42, roughness: .95 });
  const plasticBlue = new THREE.MeshStandardMaterial({ color: 0x356f8b, roughness: .8 });
  const plasticGreen = new THREE.MeshStandardMaterial({ color: 0x3c7557, roughness: .82 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0xe7d59b, roughness: .82 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x555b5c, roughness: .74, metalness: .22 });

  [[-12.2,-4],[12.8,5],[-13.5,36],[13.0,-46]].forEach(([x,z], index) => {
    const root = new THREE.Group();
    const crate = new THREE.Mesh(new THREE.BoxGeometry(.62, .48, .52), crateMat);
    crate.position.y = .24;
    const crate2 = crate.clone();
    crate2.position.set(.47, .19, -.12);
    crate2.scale.set(.78, .78, .78);
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(.23, .20, .56, 8), index % 2 ? plasticGreen : plasticBlue);
    bin.position.set(-.50, .28, .06);
    root.add(crate, crate2, bin);
    root.position.set(x, 0, z);
    root.rotation.y = index * .6;
    registerFarVisual(root, x, z, 44);
    scene.add(root);
  });

  [[-10.8,12],[11.0,55],[-22.0,-30]].forEach(([x,z], index) => {
    const root = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.55, .08), metal);
    post.position.y = .78;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.05, .62, .08), signMat);
    board.position.y = 1.48;
    board.rotation.z = index % 2 ? -.025 : .025;
    const brace = new THREE.Mesh(new THREE.BoxGeometry(.82, .07, .07), wood);
    brace.position.y = .38;
    root.add(post, board, brace);
    root.position.set(x, 0, z);
    registerFarVisual(root, x, z, 48);
    scene.add(root);
  });
}

function addBananaPlant(scene, x, z, scale = 1, yaw = 0) {
  const group = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6f963f, roughness: .94 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3f8d42,
    roughness: .82,
    side: THREE.DoubleSide,
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.09, .15, 2.45, 9), stemMat);
  stem.position.y = 1.22;
  group.add(stem);

  const leafGeometry = new THREE.PlaneGeometry(.78, 2.55, 1, 3);
  leafGeometry.translate(0, 1.18, 0);
  const leaves = [];
  for (let index = 0; index < 7; index++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMat);
    const angle = index / 7 * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * .08, 2.20 + (index % 2) * .08, Math.sin(angle) * .08);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = angle;
    leaf.rotation.x = -.82 + (index % 3) * .08;
    leaf.rotation.z = (index % 2 ? 1 : -1) * .08;
    leaf.scale.set(.92 + (index % 3) * .06, .88 + (index % 2) * .08, 1);
    leaf.castShadow = true;
    leaf.userData.windBaseX = leaf.rotation.x;
    leaf.userData.windBaseZ = leaf.rotation.z;
    leaves.push(leaf);
    group.add(leaf);
  }
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'banana',
    leaves,
    x,
    z,
    phase: windVegetation.length * 1.17 + x * .07 + z * .04,
  });
  scene.add(group);
}

function addKeralaStreetRealism(scene) {
  const concrete = new THREE.MeshStandardMaterial({ color: 0xa8a69c, roughness: .96 });
  const drainMat = new THREE.MeshStandardMaterial({ color: 0x48534a, roughness: .72, metalness: .02 });
  const patchMat = new THREE.MeshStandardMaterial({ color: 0x34393a, roughness: .80 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x6b5437, roughness: 1 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x35733d, roughness: .95 });

  // Kerala-style roadside drainage channels beside the main road.
  [-1, 1].forEach(side => {
    [-64, -48, -32, -16, 0, 16, 32, 48, 64].forEach((z, index) => {
      if (Math.abs(z + 22) < 8 && side < 0) return;
      const rim = new THREE.Mesh(new THREE.BoxGeometry(.54, .14, 13.4), concrete);
      rim.position.set(side * 8.62, .055, z);
      const channel = new THREE.Mesh(new THREE.BoxGeometry(.28, .055, 13.1), drainMat);
      channel.position.set(side * 8.62, .075, z);
      rim.receiveShadow = true;
      channel.receiveShadow = true;

      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x5b7f8b,
        roughness: .18,
        metalness: .08,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const drainWater = new THREE.Mesh(new THREE.BoxGeometry(.20, .022, 12.75), waterMaterial);
      drainWater.position.set(side * 8.62, .108, z);
      drainWater.renderOrder = 1;
      drainWaterSurfaces.push({
        mesh: drainWater,
        material: waterMaterial,
        phase: drainWaterSurfaces.length * .47,
        axis: 'z',
      });
      scene.add(rim, channel, drainWater);

      if (index % 3 === 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(.72, .12, 1.25), concrete);
        slab.position.set(side * 8.62, .13, z + 1.8);
        slab.receiveShadow = true;
        scene.add(slab);
      }
    });
  });

  // Side-road drain.
  [-60, -44, -28, -12, 4].forEach(x => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(13.0, .14, .48), concrete);
    rim.position.set(x, .055, -28.18);
    const channel = new THREE.Mesh(new THREE.BoxGeometry(12.7, .055, .25), drainMat);
    channel.position.set(x, .075, -28.18);

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x5b7f8b,
      roughness: .18,
      metalness: .08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const drainWater = new THREE.Mesh(new THREE.BoxGeometry(12.35, .022, .17), waterMaterial);
    drainWater.position.set(x, .108, -28.18);
    drainWater.renderOrder = 1;
    drainWaterSurfaces.push({
      mesh: drainWater,
      material: waterMaterial,
      phase: drainWaterSurfaces.length * .47,
      axis: 'x',
    });
    scene.add(rim, channel, drainWater);
  });

  // Repaired asphalt and damp shoulder patches stop the roads looking perfectly flat/new.
  const patchGeometry = new THREE.CircleGeometry(1, 20);
  [
    [-3.5,-58,1.45,.58,.18],[3.0,-37,1.10,.48,-.2],[-3.2,-3,1.55,.54,.08],
    [3.6,19,1.25,.46,-.12],[-2.8,54,1.35,.52,.22],[-52,-21.2,1.55,.44,.05],
    [-31,-22.4,1.30,.42,-.08],[-9,-21.5,1.12,.38,.14],
  ].forEach(([x,z,sx,sz,rotation]) => {
    const patch = new THREE.Mesh(patchGeometry, patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = rotation;
    patch.scale.set(sx, sz, 1);
    patch.position.set(x, .041, z);
    patch.receiveShadow = true;
    scene.add(patch);
  });

  [
    [-9.7,-57,1.5,.55], [9.8,-42,1.15,.45], [-10.2,-5,1.4,.52],
    [9.7,13,1.3,.48], [-9.8,46,1.2,.45], [10.0,61,1.45,.52],
    [-54,-29.0,1.6,.50], [-35,-15.0,1.35,.46],
  ].forEach(([x,z,sx,sz]) => {
    const soil = new THREE.Mesh(patchGeometry, soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.scale.set(sx, sz, 1);
    soil.position.set(x, .026, z);
    soil.receiveShadow = true;
    scene.add(soil);
  });

  // Compact hedges around homes; instanced to keep the high-quality pass efficient.
  const hedgeGeometry = new THREE.IcosahedronGeometry(.42, 1);
  const hedgePositions = [];
  [
    [28, 28.2, 10.0], [-36, 37.4, 10.4], [18, -28.0, 9.5],
  ].forEach(([cx, cz, width]) => {
    for (let offset = -width / 2; offset <= width / 2; offset += .72) {
      if (Math.abs(offset) < 1.7) continue;
      hedgePositions.push([cx + offset, cz, .80 + (Math.abs(Math.round(offset * 10)) % 3) * .08]);
    }
  });
  const hedge = new THREE.InstancedMesh(hedgeGeometry, hedgeMat, hedgePositions.length);
  const dummy = new THREE.Object3D();
  hedgePositions.forEach(([x,z,scale], index) => {
    dummy.position.set(x, .40, z);
    dummy.scale.set(scale * 1.08, scale, scale * .92);
    dummy.rotation.y = (index % 4) * .18;
    dummy.updateMatrix();
    hedge.setMatrixAt(index, dummy.matrix);
  });
  hedge.instanceMatrix.needsUpdate = true;
  hedge.castShadow = true;
  hedge.receiveShadow = true;
  scene.add(hedge);

  [
    [23.8,20.6,.72,.2],[31.6,20.8,.82,1.2],
    [-40.6,29.6,.76,.7],[-31.7,29.4,.70,2.0],
    [14.0,-35.6,.74,.4],[22.4,-35.4,.80,1.7],
    [-18.5,3.2,.66,1.1],[19.5,3.8,.68,2.2],
  ].forEach(([x,z,scale,yaw]) => addBananaPlant(scene, x, z, scale, yaw));
}


function addWorldRealismPass(scene) {
  // V101.0: a mobile-first realism layer. Most repeated detail is instanced or
  // culled at distance so the village feels denser without turning every plant
  // and yard prop into a separate heavy object.
  const random = visualRandom(10100);

  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a5b39,
    roughness: 1,
    transparent: true,
    opacity: .52,
    depthWrite: false,
  });
  const mossMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f713d,
    roughness: 1,
    transparent: true,
    opacity: .34,
    depthWrite: false,
  });
  const patchGeometry = new THREE.CircleGeometry(1, 14);
  const groundPatches = [
    [-14.0,-64,1.9,.62,.10], [14.4,-54,1.6,.54,-.08],
    [-14.2,-40,1.5,.50,.16], [14.0,-7,1.7,.58,-.14],
    [-14.3,25,1.8,.60,.06], [14.2,52,1.6,.53,-.12],
    [-55,-31.0,1.9,.58,.08], [-38,-12.8,1.5,.52,-.06],
    [-18,-31.6,1.4,.48,.12], [34,-29.8,1.6,.55,-.10],
  ];
  groundPatches.forEach(([x,z,sx,sz,rotation], index) => {
    const patch = new THREE.Mesh(patchGeometry, index % 3 === 0 ? mossMaterial : soilMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = rotation;
    patch.scale.set(sx, sz, 1);
    patch.position.set(x, .022, z);
    patch.receiveShadow = true;
    scene.add(patch);
  });

  // Dense low undergrowth uses one draw call instead of dozens of separate meshes.
  const undergrowthGeometry = new THREE.ConeGeometry(.16, .52, 5);
  undergrowthGeometry.translate(0, .26, 0);
  const undergrowthMaterial = new THREE.MeshStandardMaterial({ color: 0x3f7338, roughness: 1 });
  const clusters = [
    [-53,-55],[-49,-38],[-51,-4],[-48,22],[-52,55],
    [49,-56],[52,-35],[49,-2],[51,25],[50,58],
    [-31,17],[33,55],
  ];
  const perCluster = runtimeIsMobile ? 4 : 6;
  const undergrowth = new THREE.InstancedMesh(undergrowthGeometry, undergrowthMaterial, clusters.length * perCluster);
  const dummy = new THREE.Object3D();
  let undergrowthIndex = 0;
  clusters.forEach(([cx,cz], clusterIndex) => {
    for (let i = 0; i < perCluster; i++) {
      const angle = random() * Math.PI * 2;
      const radius = .25 + random() * 2.4;
      dummy.position.set(cx + Math.cos(angle) * radius, .01, cz + Math.sin(angle) * radius);
      dummy.rotation.set((random() - .5) * .06, random() * Math.PI, (random() - .5) * .08);
      const scale = .58 + random() * .72;
      dummy.scale.set(scale * (.82 + random() * .38), scale, scale * (.82 + random() * .30));
      dummy.updateMatrix();
      undergrowth.setMatrixAt(undergrowthIndex++, dummy.matrix);
    }
  });
  undergrowth.instanceMatrix.needsUpdate = true;
  undergrowth.castShadow = false;
  undergrowth.receiveShadow = true;
  scene.add(undergrowth);

  // Irregular stepping paths make house fronts feel inhabited rather than dropped
  // onto a flat field. These are visual only and intentionally do not add colliders.
  const slabMaterial = new THREE.MeshStandardMaterial({ color: 0x9c917e, roughness: 1 });
  const yardPaths = [
    [28,29.0,0],[-36,38.0,0],[18,-27.0,0],[-24,-31.0,0],
  ];
  yardPaths.forEach(([x,z,rotation], pathIndex) => {
    const root = new THREE.Group();
    for (let step = 0; step < 5; step++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0 + (step % 2) * .18, .07, .62), slabMaterial);
      slab.position.set((step % 2 ? .12 : -.10), .035, step * .76);
      slab.rotation.y = (step % 2 ? 1 : -1) * .035;
      slab.receiveShadow = true;
      root.add(slab);
    }
    root.position.set(x, 0, z);
    root.rotation.y = rotation;
    registerFarVisual(root, x, z, 42);
    scene.add(root);
  });

  // A few clothes lines add everyday Kerala life with only simple planes/lines.
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x68645b, roughness: .88, metalness: .08 });
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4e4d48, transparent: true, opacity: .72 });
  const clothColors = [0xd66e62,0x5d87b4,0xe4bf54,0x7b9e68,0xc27c9b];
  const laundrySpots = [
    [32.0,20.0,.08],[-40.5,29.0,-.10],[22.5,-36.4,.04],
  ];
  laundrySpots.forEach(([x,z,rotation], spotIndex) => {
    const root = new THREE.Group();
    const left = new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,2.0,6), poleMaterial);
    const right = left.clone();
    left.position.set(-1.55,1.0,0);
    right.position.set(1.55,1.0,0);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.55,1.76,0),
      new THREE.Vector3(1.55,1.72,0),
    ]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    root.add(left,right,line);
    for (let item=0; item<4; item++) {
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(.50 + (item % 2) * .12,.62),
        new THREE.MeshStandardMaterial({
          color: clothColors[(spotIndex + item) % clothColors.length],
          roughness:.92,
          side:THREE.DoubleSide,
        })
      );
      cloth.position.set(-1.05 + item * .70,1.42 - (item % 2) * .04,.02);
      cloth.rotation.z = (item % 2 ? 1 : -1) * .035;
      root.add(cloth);
    }
    root.position.set(x,0,z);
    root.rotation.y = rotation;
    registerFarVisual(root,x,z,38);
    scene.add(root);
  });

  // Broader species mix around compounds; tall vegetation stays well away from
  // the carriageway to preserve visibility and touch-device performance.
  [
    [-54,-47,.78,true],[52,-45,.82,false],[-52,12,.74,true],
    [51,16,.80,false],[-46,58,.76,false],[47,62,.82,true],
  ].forEach(([x,z,scale,fruit]) => addTree(scene,x,z,scale,fruit));
  [
    [-29,18,.68,.2],[-31,21,.62,1.0],[35,24,.70,2.0],
    [38,27,.64,2.7],[-42,-42,.66,.8],[43,-48,.69,1.8],
  ].forEach(([x,z,scale,yaw]) => addBananaPlant(scene,x,z,scale,yaw));
}

function addStreetLifeProps(scene) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x77533a, roughness: .94 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x666f70, roughness: .70, metalness: .28 });
  const basketMat = new THREE.MeshStandardMaterial({ color: 0xa57542, roughness: .98 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0xc2aa7b, roughness: 1 });
  const produceMats = [
    new THREE.MeshStandardMaterial({ color: 0x4f843c, roughness: .92 }),
    new THREE.MeshStandardMaterial({ color: 0xc76a32, roughness: .92 }),
    new THREE.MeshStandardMaterial({ color: 0xe0b43a, roughness: .90 }),
  ];

  // Small stools and a tea-shop style standing table.
  [
    [-11.6, 10.55, 0], [-12.6, 10.45, .2],
    [11.8, 41.35, -.1], [12.9, 41.25, .15],
  ].forEach(([x,z,rotation], index) => {
    const stool = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(.28, .30, .09, 10), wood);
    seat.position.y = .52;
    for (let leg = 0; leg < 3; leg++) {
      const angle = leg / 3 * Math.PI * 2;
      const support = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .50, 6), steel);
      support.position.set(Math.cos(angle) * .18, .27, Math.sin(angle) * .18);
      support.rotation.z = Math.cos(angle) * .06;
      stool.add(support);
    }
    stool.add(seat);
    stool.position.set(x, 0, z);
    stool.rotation.y = rotation + index * .07;
    scene.add(stool);
  });

  const standingTable = new THREE.Group();
  const tabletop = new THREE.Mesh(new THREE.CylinderGeometry(.43, .46, .08, 12), steel);
  tabletop.position.y = .88;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.065, .085, .84, 8), steel);
  stand.position.y = .43;
  standingTable.add(tabletop, stand);
  standingTable.position.set(-13.6, 10.55, 0);
  scene.add(standingTable);

  // Produce baskets/sacks make the shops feel used instead of decorative.
  [
    [-10.9, 9.85], [-11.6, 9.78], [11.3, 40.75], [12.0, 40.68],
  ].forEach(([x,z], index) => {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(.31, .37, .25, 10), basketMat);
    basket.position.set(x, .13, z);
    scene.add(basket);
    for (let item = 0; item < 5; item++) {
      const produce = new THREE.Mesh(new THREE.SphereGeometry(.09, 7, 6), produceMats[(index + item) % produceMats.length]);
      const angle = item / 5 * Math.PI * 2;
      produce.position.set(x + Math.cos(angle) * .18, .29 + (item % 2) * .04, z + Math.sin(angle) * .18);
      scene.add(produce);
    }
  });

  [
    [-15.9, 10.2, -.08], [-16.45, 10.0, .08], [15.7, 41.0, .06],
  ].forEach(([x,z,rotation]) => {
    const sack = new THREE.Mesh(new THREE.CapsuleGeometry(.25, .48, 5, 8), sackMat);
    sack.position.set(x, .38, z);
    sack.rotation.z = rotation;
    scene.add(sack);
  });
}

function addTownStreetDetails(scene) {
  addShop(scene, -14.4, 7.5, 'ANUGRAHA STORES', 'ചായ · SNACKS · GROCERIES');
  addShop(scene, 14.8, 38.5, 'MALABAR BAKERY', 'BAKERY · TEA · COOL DRINKS');
  addBusStop(scene, 11.7, 27.5, 0, 'TOWN JUNCTION');
  addBusStop(scene, -11.7, -50.5, Math.PI, 'SOUTH STOP');
  addRoadsideIdentitySigns(scene);

  addCompoundWall(scene, 28, 24, 11.4, 9.2);
  addCompoundWall(scene, -36, 33, 11.8, 9.6);
  addCompoundWall(scene, 18, -32, 10.8, 8.8);

  addUtilityPoles(scene);
  addJunctionMarkings(scene);
  addRoadsideClutter(scene);
  addStreetLifeProps(scene);
  addJunctionSignal(scene);
  addParkedVehicle(scene, 'car', 0x7d8b91, 10.8, 56.5, Math.PI);
  addParkedVehicle(scene, 'car', 0x8c4e45, -47.5, -29.7, Math.PI / 2);
  addParkedVehicle(scene, 'bike', 0x316d58, -10.7, 9.2, Math.PI);
  addParkedVehicle(scene, 'bike', 0x8b3e35, 11.2, 41.1, 0);
  addParkedVehicle(scene, 'auto', 0x2b773f, -57.0, -29.7, Math.PI / 2);
}

function updateWindWorld(time, delta) {
  windUpdateTimer += delta;
  const windInterval = runtimeIsMobile ? .12 : .08;
  if (windUpdateTimer < windInterval) return;
  windUpdateTimer = 0;
  const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
  const overcast = THREE.MathUtils.clamp(Number(worldWeatherState.overcast || 0), 0, 1);
  const windStrength = .18 + overcast * .34 + rain * .62;
  const gust = .62 + Math.sin(time * .74) * .22 + Math.sin(time * 1.63 + .8) * .16;
  const wind = windStrength * Math.max(.24, gust);

  for (const item of windVegetation) {
    if (playerRef && Number.isFinite(item.x) && Number.isFinite(item.z)) {
      const distance = Math.hypot(playerRef.position.x - item.x, playerRef.position.z - item.z);
      if (distance > 62) continue;
    }
    const phase = Number(item.phase || 0);
    if (item.kind === 'palm') {
      const swayX = Math.sin(time * .86 + phase) * .011 * wind;
      const swayZ = Math.cos(time * .63 + phase * 1.2) * .014 * wind;
      for (const node of [item.fronds, item.stems]) {
        if (!node) continue;
        node.rotation.x = Number(node.userData.windBaseX || 0) + swayX;
        node.rotation.z = Number(node.userData.windBaseZ || 0) + swayZ;
      }
      continue;
    }

    if (item.kind === 'banana') {
      item.leaves.forEach((leaf, index) => {
        const flutter = Math.sin(time * (1.15 + index * .045) + phase + index * .71);
        const gustFlutter = Math.sin(time * 3.1 + phase + index * .39);
        leaf.rotation.x = Number(leaf.userData.windBaseX || 0) + flutter * .020 * wind;
        leaf.rotation.z = Number(leaf.userData.windBaseZ || 0) + (flutter * .026 + gustFlutter * .008) * wind;
      });
      continue;
    }

    if (item.kind === 'tree') {
      item.nodes.forEach((node, index) => {
        const sway = Math.sin(time * .78 + phase + index * .47);
        const flutter = Math.sin(time * 1.94 + phase + index * .83);
        node.rotation.x = Number(node.userData.windBaseX || 0) + sway * .006 * wind;
        node.rotation.z = Number(node.userData.windBaseZ || 0) + (sway * .010 + flutter * .003) * wind;
      });
    }
  }

  if (roadsideGrassWind) {
    const { mesh, positions, dummy } = roadsideGrassWind;
    positions.forEach(([x, z, scale, yaw], index) => {
      const sway = Math.sin(time * 1.8 + index * .31) * .045 * wind;
      const sideSway = Math.cos(time * 1.37 + index * .19) * .028 * wind;
      dummy.position.set(x, .015, z);
      dummy.rotation.set(sway, yaw, sideSway);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  for (const wire of windWires) {
    const array = wire.attribute.array;
    const base = wire.base;
    const phase = Number(wire.phase || 0);
    for (let index = 0; index < wire.attribute.count; index++) {
      const offset = index * 3;
      const localStep = index % 5;
      const anchorFactor = Math.sin(localStep / 5 * Math.PI);
      const sway = Math.sin(time * 1.05 + phase + index * .09) * .035 * wind * anchorFactor;
      array[offset] = base[offset] + sway;
      array[offset + 1] = base[offset + 1] + Math.abs(sway) * .12;
      array[offset + 2] = base[offset + 2];
    }
    wire.attribute.needsUpdate = true;
  }
}

function updateMonsoonWaterVisuals(time, delta) {
  monsoonWaterTimer += delta;
  const waterInterval = runtimeIsMobile ? .09 : .055;
  if (monsoonWaterTimer < waterInterval) return;
  monsoonWaterTimer = 0;

  const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
  const activeRain = THREE.MathUtils.smoothstep(rain, .08, .72);

  for (const ripple of puddleRipples) {
    const rippleDistance = playerRef
      ? Math.hypot(playerRef.position.x - ripple.mesh.position.x, playerRef.position.z - ripple.mesh.position.z)
      : 0;
    if (rippleDistance > 44) {
      ripple.mesh.visible = false;
      continue;
    }
    const cycle = (time * (.48 + rain * .52) + ripple.phase) % 1;
    const scale = .42 + cycle * 2.15;
    ripple.mesh.scale.set(
      scale * ripple.baseScaleX * .48,
      scale * ripple.baseScaleZ * .72,
      1
    );
    ripple.material.opacity = activeRain * (1 - cycle) * .34;
    ripple.mesh.visible = activeRain > .025;
  }

  for (const flow of drainWaterSurfaces) {
    const flowDistance = playerRef
      ? Math.hypot(playerRef.position.x - flow.mesh.position.x, playerRef.position.z - flow.mesh.position.z)
      : 0;
    if (flowDistance > 58) {
      flow.mesh.visible = false;
      continue;
    }
    const pulse = .86 + Math.sin(time * 2.1 + flow.phase) * .10;
    flow.material.opacity = activeRain * (.26 + rain * .42) * pulse;
    flow.material.roughness = Math.max(.055, .20 - rain * .11);
    flow.material.metalness = .08 + rain * .16;
    const travel = ((time * (.20 + rain * .55) + flow.phase) % 1) - .5;
    if (flow.axis === 'z') flow.mesh.rotation.y = travel * .0008;
    else flow.mesh.rotation.z = travel * .0008;
    flow.mesh.visible = activeRain > .02;
  }

  for (const jet of roofRunoffJets) {
    const flutter = .78 + Math.sin(time * 7.5 + jet.phase) * .18;
    jet.material.opacity = activeRain * (.34 + rain * .54) * flutter;
    jet.mesh.scale.y = .78 + rain * .48 + Math.sin(time * 5.4 + jet.phase) * .06 * activeRain;
    jet.mesh.visible = activeRain > .04;
  }
}

function buildWorld(scene) {
  staticColliders.length = 0;
  windVegetation.length = 0;
  windWires.length = 0;
  roadsideGrassWind = null;
  windUpdateTimer = 0;
  puddleRipples.length = 0;
  drainWaterSurfaces.length = 0;
  roofRunoffJets.length = 0;
  farVisualDetails.length = 0;
  monsoonWaterTimer = 0;
  farVisualTimer = 0;
  lastFootstepBeat = -1;
  footstepSide = -1;
  footstepEffectsFailed = false;
  const groundTexture = createGroundSurfaceTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ map: groundTexture, color: 0xc6d2ba, roughness: .96, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadTexture = createRoadSurfaceTexture();
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTexture, color: 0xb9bec0, roughness: .91, metalness: .015 });
  weatherRoadSurfaces.push({
    material: roadMat,
    baseRoughness: .91,
    baseMetalness: .015,
    baseColor: roadMat.color.clone(),
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 160), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = .016;
  scene.add(road);
  addRoadEdges(scene, 0, 0, 16, 160);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf1d46d, roughness: .75 });
  for (let z = -72; z <= 72; z += 9) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.18, 4), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, .03, z);
    scene.add(line);
  }
  const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(88, 12), roadMat);
  sideRoad.rotation.x = -Math.PI / 2;
  sideRoad.position.set(-28, .017, -22);
  scene.add(sideRoad);
  addRoadEdges(scene, -28, -22, 88, 12);

  const marketRoad = new THREE.Mesh(new THREE.PlaneGeometry(66, 7), roadMat);
  marketRoad.rotation.x = -Math.PI / 2;
  marketRoad.position.set(15, .018, 22);
  scene.add(marketRoad);
  addRoadEdges(scene, 15, 22, 66, 7);
  for (let x = -15; x <= 45; x += 8) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .15), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, .032, 22);
    scene.add(line);
  }

  const stationRoad = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 56), roadMat);
  stationRoad.rotation.x = -Math.PI / 2;
  stationRoad.position.set(-42, .019, -6);
  scene.add(stationRoad);
  addRoadEdges(scene, -42, -6, 6.5, 56);
  for (let z = -30; z <= 18; z += 8) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.15, 3.4), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(-42, .033, z);
    scene.add(line);
  }

  for (let x = -68; x <= 12; x += 9) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .18), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, .031, -22);
    scene.add(line);
  }
  addRoadSurfaceDetails(scene);
  [
    { x: 8.8, z: 22, rotation: Math.PI, title: 'TOWN CENTRE', subtitle: 'Market · Bus · Services', background: '#245979' },
    { x: -34.5, z: 18.2, rotation: Math.PI / 2, title: 'MARKET QUARTER', subtitle: 'Local Shops →', background: '#246b4b' },
    { x: 8.8, z: -22, rotation: 0, title: 'SOUTH JUNCTION', subtitle: 'Village Link Road', background: '#74572d' },
  ].forEach(({ x, z, rotation, title, subtitle, background }) => {
    const marker = new THREE.Group();
    const board = createWorldSignMesh({ title, subtitle, background }, 3.2, .82);
    board.position.y = 2.1;
    const post = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.1, .08), new THREE.MeshStandardMaterial({ color: 0x555d5e, roughness: .76, metalness: .24 }));
    post.position.y = 1.05;
    marker.add(post, board);
    marker.position.set(x, 0, z);
    marker.rotation.y = rotation;
    scene.add(marker);
  });
  addWeatherRoadDetails(scene);
  addRoadsideLife(scene);
  addTownStreetDetails(scene);
  addKeralaStreetRealism(scene);
  addRoadVehicle(scene, { kind: 'car', axis: 'z', fixed: -3.1, min: -76, max: 76, progress: -52, direction: 1, speed: 7.0, color: 0xd44737, flowPhase: .4 });
  addRoadVehicle(scene, { kind: 'bike', axis: 'z', fixed: -3.0, min: -76, max: 76, progress: -18, direction: 1, speed: 7.8, color: 0x356f8b, flowPhase: 2.1 });
  addRoadVehicle(scene, { kind: 'bus', axis: 'z', fixed: 3.2, min: -76, max: 76, progress: 61, direction: -1, speed: 5.0, color: 0xd9b32d, flowPhase: 1.2 });
  addRoadVehicle(scene, { kind: 'auto', axis: 'z', fixed: 3.15, min: -76, max: 76, progress: 20, direction: -1, speed: 5.8, color: 0x2b773f, flowPhase: 3.8 });
  addRoadVehicle(scene, { kind: 'car', axis: 'x', fixed: -24.5, min: -69, max: 10, progress: -60, direction: 1, speed: 6.3, color: 0x427eb5, flowPhase: .8 });
  addRoadVehicle(scene, { kind: 'bike', axis: 'x', fixed: -24.4, min: -69, max: 10, progress: -31, direction: 1, speed: 7.2, color: 0x8b3e35, flowPhase: 4.4 });
  // Opposing side-road traffic keeps the junction from feeling one-directional.
  addRoadVehicle(scene, { kind: 'auto', axis: 'x', fixed: -19.5, min: -69, max: 10, progress: -4, direction: -1, speed: 5.5, color: 0x31734a, flowPhase: 2.9 });
  // Town-route traffic makes the new Market Road feel connected without changing
  // the established state-road traffic controller.
  addRoadVehicle(scene, { kind: 'bus', axis: 'x', fixed: 24.1, min: -15, max: 45, progress: -10, direction: 1, speed: 4.6, color: 0xd7aa2d, flowPhase: 1.7 });
  addRoadVehicle(scene, { kind: 'auto', axis: 'x', fixed: 19.9, min: -15, max: 45, progress: 34, direction: -1, speed: 5.1, color: 0x2d7650, flowPhase: 3.3 });
  addRoadVehicle(scene, { kind: 'bike', axis: 'z', fixed: -40.7, min: -31, max: 19, progress: 12, direction: -1, speed: 5.4, color: 0x6f4a88, flowPhase: 2.2 });

  addPhotoHouse(scene, -24, -36, 10.2, 6.8);
  const rentalHomeMarker = new THREE.Group();
  rentalHomeMarker.add(missionTag('Rental Home', '#654b36'));
  rentalHomeMarker.position.set(-24, 0, -30.8);
  scene.add(rentalHomeMarker);
  addPhotoHouse(scene, 28, 24, 8.8, 5.9);
  addPhotoHouse(scene, -36, 33, 9.4, 6.25);
  addPhotoHouse(scene, 18, -32, 8.6, 5.75);
  addWorldRealismPass(scene);
  // Keep tall palms clear of both carriageways. Their fronds no longer hang
  // over the driving lanes; the near-road detail is handled by low gardens.
  const treePositions = [[-21,-62],[22,-55],[-22,-47],[23,-42],[-23,-11],[23,-8],[-23,7],[23,12],[-23,34],[23,43],[-22,61],[23,66],[-50,-20],[-45,14],[-42,48],[46,-42],[42,4],[47,52]];
  treePositions.forEach(([x, z], i) => addPalm(scene, x, z, .72 + (i % 3) * .09));
  [[-43,-35,1.08],[41,-29,1.15],[-48,41,.96],[45,39,1.04],[-27,-13,.88],[30,6,.8],[-28,57,.85]].forEach(([x, z, scale]) => addPalm(scene, x, z, scale));
  [[-43,-49,.88],[39,-25,.94],[-42,27,.90],[43,43,.92]].forEach(([x, z, scale]) => addTree(scene, x, z, scale, true));
  addRoadsideGardens(scene);
  addBird(scene, -43.4, 5.15, -48.7, .6);
  addBird(scene, 39.4, 5.6, -24.8, -.8);
  addBird(scene, -42.4, 5.2, 26.5, 1.1);
  addBird(scene, 42.4, 5.4, 42.6, -.45);
  addBird(scene, -24.2, 5.3, 7.2, .3);
  addBird(scene, 24.1, 5.7, 42.5, -.9);

  // Lightweight village animals stay off the carriageway and react locally to
  // nearby players/vehicles without becoming gameplay colliders.
  addAmbientAnimal(scene, 'dog', 12.8, 8.2, { radius: 2.2, phase: .5, scale: .92 });
  addAmbientAnimal(scene, 'dog', -21.5, 34.8, { radius: 1.8, phase: 2.4, scale: .88 });
  addAmbientAnimal(scene, 'chicken', -18.2, 11.7, { radius: 1.4, phase: 1.3, scale: .82 });
  addAmbientAnimal(scene, 'chicken', -19.0, 12.6, { radius: 1.2, phase: 3.1, scale: .76 });
  addAmbientAnimal(scene, 'chicken', 24.8, 31.2, { radius: 1.5, phase: 4.7, scale: .80 });
  addAmbientAnimal(scene, 'goat', 32.5, 14.5, { radius: 2.0, phase: 2.0, scale: .88 });
  addAmbientAnimal(scene, 'goat', -31.5, 44.0, { radius: 1.8, phase: 4.1, scale: .84 });
  addAmbientAnimal(scene, 'cow', 45.0, -12.5, { radius: 1.7, phase: .9, scale: .90 });
  addPond(scene, 39, -4);
  addBench(scene, -10, -10);
  addFuelStation(scene, 11, -12);
  addServiceGarage(scene, -36, -15);
  addShop(scene, 31, 15, 'TOWN MARKET', 'GROCERIES · TEA · DAILY NEEDS');
  addCivicBuilding(scene, 28, 28, { title: 'COMMUNITY CLINIC', subtitle: 'HEALTH CENTRE · 24/7', color: 0x2d7d63, collider: 'clinic' });
  addCivicBuilding(scene, -31, 14, { title: 'KERALA POLICE', subtitle: 'POLICE STATION', color: 0x315b84, collider: 'police-station' });
  addCivicBuilding(scene, -48, 8, { title: 'FIRE & RESCUE', subtitle: 'EMERGENCY SERVICES', color: 0xa84437, collider: 'fire-station' });
  addBusStop(scene, 13.0, 19.2, Math.PI, 'TOWN CENTRE');
  addTrafficCheckpoint(scene, 5.4, 18);
  addPhotoVillager(scene, -6, -50, 11, .55, 0, .78, { nightHide: true });
  addPhotoVillager(scene, 10, -5, 8, .45, 2, .72);
  addPhotoVillager(scene, -9, 19, 8, .50, 4, .75, { nightHide: true });
  addPhotoVillager(scene, 10, 50, 7, .42, 1, .68);
  addPhotoVillager(scene, -8.9, 8, 4.8, .38, 3, .72, { nightHide: true });
  addPhotoVillager(scene, 8.9, 31, 5.4, .35, 1.3, .70);
  addPhotoVillager(scene, -9.2, -43, 3.8, .40, 5.4, .69, { nightHide: true });

  // Several independently-timed pedestrians use the zebra crossing instead of
  // one person shuttling back and forth continuously.
  addPhotoVillager(scene, -10.4, pedestrianCrossingZ - .48, 0, .54, .25, .72, {
    behavior: 'crossing', fromX: -10.4, toX: 10.4, role: 'Pedestrian', nightHide: true,
  });
  addPhotoVillager(scene, 10.4, pedestrianCrossingZ, 0, .48, 3.05, .70, {
    behavior: 'crossing', fromX: 10.4, toX: -10.4, role: 'Pedestrian',
  });
  addPhotoVillager(scene, -10.4, pedestrianCrossingZ + .48, 0, .44, 5.85, .69, {
    behavior: 'crossing', fromX: -10.4, toX: 10.4, role: 'Pedestrian', nightHide: true,
  });

  // Town service workers and commuters follow lightweight daily routines so
  // the new service district changes character across the day.
  addPhotoVillager(scene, 26.0, 27.0, 0, .24, .9, .70, {
    behavior: 'task', facing: Math.PI, role: 'Clinic Staff',
    shelterX: 26.0, shelterZ: 27.0,
    dailySchedule: [
      { start: 0, hidden: true, x: 20.0, z: 34.0, role: 'Local' },
      { start: 6.6, x: 20.0, z: 34.0, behavior: 'idle', role: 'Commuter' },
      { start: 7.2, x: 26.0, z: 27.0, behavior: 'task', role: 'Clinic Staff', facing: Math.PI, transitionHours: .55 },
      { start: 13.0, x: 23.8, z: 24.8, behavior: 'social', role: 'Lunch Break', targetX: 25.0, targetZ: 24.6, transitionHours: .25 },
      { start: 13.6, x: 26.0, z: 27.0, behavior: 'task', role: 'Clinic Staff', facing: Math.PI, transitionHours: .2 },
      { start: 19.2, x: 13.2, z: 19.6, behavior: 'idle', role: 'Waiting', facing: Math.PI, transitionHours: .7 },
      { start: 20.1, hidden: true, x: 20.0, z: 34.0, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, -29.0, 13.0, 0, .25, 2.2, .72, {
    behavior: 'patrol', role: 'Police Patrol',
    shelterX: -29.0, shelterZ: 13.0,
    dailySchedule: [
      { start: 0, x: -29.0, z: 13.0, behavior: 'idle', role: 'Night Duty', facing: Math.PI },
      { start: 6.0, x: -29.0, z: 13.0, behavior: 'patrol', role: 'Police Patrol' },
      { start: 12.5, x: -25.5, z: 17.0, behavior: 'social', role: 'Public Help', targetX: -24.4, targetZ: 17.2, transitionHours: .3 },
      { start: 14.0, x: -29.0, z: 13.0, behavior: 'patrol', role: 'Police Patrol', transitionHours: .3 },
      { start: 20.0, x: -29.0, z: 13.0, behavior: 'idle', role: 'Night Duty', facing: Math.PI, transitionHours: .35 },
    ],
  });
  addPhotoVillager(scene, -46.0, 7.0, 0, .24, 4.1, .71, {
    behavior: 'task', facing: Math.PI, role: 'Fire Crew',
    shelterX: -46.0, shelterZ: 7.0,
    dailySchedule: [
      { start: 0, x: -46.0, z: 7.0, behavior: 'idle', role: 'Night Crew', facing: Math.PI },
      { start: 7.0, x: -46.0, z: 7.0, behavior: 'task', role: 'Fire Crew', facing: Math.PI },
      { start: 11.5, x: -42.0, z: 10.0, behavior: 'patrol', role: 'Equipment Check', transitionHours: .25 },
      { start: 12.4, x: -46.0, z: 7.0, behavior: 'task', role: 'Fire Crew', facing: Math.PI, transitionHours: .25 },
      { start: 19.0, x: -46.0, z: 7.0, behavior: 'idle', role: 'Night Crew', facing: Math.PI, transitionHours: .25 },
    ],
  });
  addPhotoVillager(scene, 29.0, 15.0, 0, .23, 5.2, .69, {
    behavior: 'task', facing: Math.PI, role: 'Market Vendor',
    shelterX: 29.0, shelterZ: 15.0,
    dailySchedule: [
      { start: 0, hidden: true, x: 38.0, z: 8.0, role: 'Local' },
      { start: 5.2, x: 38.0, z: 8.0, behavior: 'idle', role: 'Commuter' },
      { start: 5.8, x: 29.0, z: 15.0, behavior: 'task', role: 'Market Vendor', facing: Math.PI, transitionHours: .55 },
      { start: 11.0, x: 27.3, z: 17.0, behavior: 'social', role: 'Customer Help', targetX: 26.2, targetZ: 17.0, transitionHours: .2 },
      { start: 11.5, x: 29.0, z: 15.0, behavior: 'task', role: 'Market Vendor', facing: Math.PI, transitionHours: .2 },
      { start: 20.2, x: 38.0, z: 8.0, behavior: 'idle', role: 'Going Home', transitionHours: .65 },
      { start: 21.0, hidden: true, x: 38.0, z: 8.0, role: 'Local' },
    ],
  });

  addPhotoVillager(scene, 10.1, 27.2, 0, .28, 2.4, .70, {
    behavior: 'idle', facing: Math.PI, role: 'Waiting',
    shelterX: 10.1, shelterZ: 26.95,
    dailySchedule: [
      { start: 0, hidden: true, x: 22.0, z: 18.0, role: 'Local' },
      { start: 5.8, x: 22.0, z: 18.0, behavior: 'idle', role: 'Local' },
      { start: 6.5, x: 10.1, z: 27.2, behavior: 'idle', role: 'Commuter', facing: Math.PI, transitionHours: .65 },
      { start: 7.2, x: 10.1, z: 27.2, behavior: 'idle', role: 'Waiting', facing: Math.PI },
      { start: 8.4, x: 25.0, z: 39.0, behavior: 'task', role: 'Worker', facing: -Math.PI / 2, transitionHours: .7 },
      { start: 13.0, x: 13.8, z: 41.6, behavior: 'social', role: 'Tea Break', targetX: 12.4, targetZ: 41.4, transitionHours: .45 },
      { start: 13.6, x: 25.0, z: 39.0, behavior: 'task', role: 'Worker', facing: -Math.PI / 2, transitionHours: .4 },
      { start: 18.1, x: 10.1, z: 27.2, behavior: 'idle', role: 'Waiting', facing: Math.PI, transitionHours: .7 },
      { start: 19.0, x: 22.0, z: 18.0, behavior: 'idle', role: 'Going Home', transitionHours: .65 },
      { start: 20.2, hidden: true, x: 22.0, z: 18.0, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, -10.0, -50.2, 0, .28, 4.8, .69, {
    behavior: 'idle', facing: 0, role: 'Waiting',
    shelterX: -10.1, shelterZ: -50.45,
    dailySchedule: [
      { start: 0, hidden: true, x: -23.0, z: -39.0, role: 'Local' },
      { start: 6.2, x: -23.0, z: -39.0, behavior: 'idle', role: 'Local' },
      { start: 7.0, x: -10.0, z: -50.2, behavior: 'idle', role: 'Commuter', facing: 0, transitionHours: .65 },
      { start: 7.7, x: -10.0, z: -50.2, behavior: 'idle', role: 'Waiting', facing: 0 },
      { start: 9.0, x: -34.2, z: -11.7, behavior: 'task', role: 'Worker', facing: Math.PI, transitionHours: .9 },
      { start: 17.6, x: -10.0, z: -50.2, behavior: 'idle', role: 'Waiting', facing: 0, transitionHours: .9 },
      { start: 18.8, x: -23.0, z: -39.0, behavior: 'idle', role: 'Going Home', transitionHours: .7 },
      { start: 20.4, hidden: true, x: -23.0, z: -39.0, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, -10.2, 7.5, 0, .25, 1.6, .68, {
    behavior: 'task', facing: Math.PI / 2, role: 'Shopper', nightHide: true,
    shelterX: -11.4, shelterZ: 10.15,
  });

  // Small social groups make the street feel inhabited rather than scripted.
  addPhotoVillager(scene, -11.0, 14.1, 0, .25, .3, .70, {
    behavior: 'social', targetX: -12.35, targetZ: 14.35, role: 'Talking', nightHide: true,
  });
  addPhotoVillager(scene, -12.35, 14.35, 0, .25, 2.1, .72, {
    behavior: 'social', targetX: -11.0, targetZ: 14.1, role: 'Talking', nightHide: true,
  });
  addPhotoVillager(scene, 10.4, 44.5, 0, .25, 4.2, .69, {
    behavior: 'phone', facing: Math.PI, role: 'Phone',
    shelterX: 11.8, shelterZ: 41.25,
  });

  // Shop-front locals give the two stores visible daily activity.
  addPhotoVillager(scene, -12.9, 10.9, 0, .22, 1.1, .70, {
    behavior: 'task', facing: Math.PI, role: 'Shopkeeper',
    shelterX: -12.9, shelterZ: 10.45,
    dailySchedule: [
      { start: 0, hidden: true, x: -25.0, z: 10.9, role: 'Local' },
      { start: 5.35, x: -25.0, z: 10.9, behavior: 'idle', role: 'Local', facing: Math.PI / 2 },
      { start: 5.8, x: -12.9, z: 10.9, behavior: 'task', role: 'Worker', facing: Math.PI, transitionHours: .48 },
      { start: 6.25, x: -12.9, z: 10.9, behavior: 'task', role: 'Shopkeeper', facing: Math.PI },
      { start: 10.4, x: -11.3, z: 10.9, behavior: 'social', role: 'Tea Break', targetX: -10.2, targetZ: 7.5, transitionHours: .25 },
      { start: 10.9, x: -12.9, z: 10.9, behavior: 'task', role: 'Shopkeeper', facing: Math.PI, transitionHours: .2 },
      { start: 20.5, x: -25.0, z: 10.9, behavior: 'idle', role: 'Going Home', facing: -Math.PI / 2, transitionHours: .6 },
      { start: 21.2, hidden: true, x: -25.0, z: 10.9, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, -11.5, 10.7, 0, .22, 3.3, .69, {
    behavior: 'social', targetX: -12.9, targetZ: 10.9, role: 'Customer', nightHide: true,
    shelterX: -11.9, shelterZ: 10.35,
    dailySchedule: [
      { start: 0, hidden: true, x: -28.0, z: 4.0, role: 'Local' },
      { start: 7.4, x: -28.0, z: 4.0, behavior: 'idle', role: 'Local' },
      { start: 8.1, x: -11.5, z: 10.7, behavior: 'social', role: 'Customer', targetX: -12.9, targetZ: 10.9, transitionHours: .65 },
      { start: 9.0, x: -9.0, z: 19.0, behavior: 'patrol', role: 'Local', transitionHours: .45 },
      { start: 16.6, x: -11.5, z: 10.7, behavior: 'social', role: 'Customer', targetX: -12.9, targetZ: 10.9, transitionHours: .5 },
      { start: 17.4, x: -28.0, z: 4.0, behavior: 'idle', role: 'Going Home', transitionHours: .7 },
      { start: 19.2, hidden: true, x: -28.0, z: 4.0, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, 13.8, 41.6, 0, .22, 2.6, .71, {
    behavior: 'task', facing: Math.PI, role: 'Shopkeeper',
    shelterX: 13.8, shelterZ: 41.1,
    dailySchedule: [
      { start: 0, hidden: true, x: 26.0, z: 47.0, role: 'Local' },
      { start: 4.9, x: 26.0, z: 47.0, behavior: 'idle', role: 'Local' },
      { start: 5.35, x: 13.8, z: 41.6, behavior: 'task', role: 'Worker', facing: Math.PI, transitionHours: .45 },
      { start: 5.7, x: 13.8, z: 41.6, behavior: 'task', role: 'Shopkeeper', facing: Math.PI },
      { start: 12.2, x: 12.8, z: 41.3, behavior: 'social', role: 'Tea Break', targetX: 12.4, targetZ: 41.4, transitionHours: .25 },
      { start: 12.7, x: 13.8, z: 41.6, behavior: 'task', role: 'Shopkeeper', facing: Math.PI, transitionHours: .2 },
      { start: 20.05, x: 26.0, z: 47.0, behavior: 'idle', role: 'Going Home', transitionHours: .6 },
      { start: 20.7, hidden: true, x: 26.0, z: 47.0, role: 'Local' },
    ],
  });
  addPhotoVillager(scene, 12.4, 41.4, 0, .22, 5.1, .68, {
    behavior: 'social', targetX: 13.8, targetZ: 41.6, role: 'Customer', nightHide: true,
    shelterX: 12.7, shelterZ: 41.05,
    dailySchedule: [
      { start: 0, hidden: true, x: 27.0, z: 34.0, role: 'Local' },
      { start: 6.8, x: 27.0, z: 34.0, behavior: 'idle', role: 'Local' },
      { start: 7.6, x: 12.4, z: 41.4, behavior: 'social', role: 'Customer', targetX: 13.8, targetZ: 41.6, transitionHours: .6 },
      { start: 8.5, x: 10.1, z: 27.2, behavior: 'idle', role: 'Commuter', facing: Math.PI, transitionHours: .6 },
      { start: 9.2, x: 10.1, z: 27.2, behavior: 'idle', role: 'Waiting', facing: Math.PI },
      { start: 17.0, x: 12.4, z: 41.4, behavior: 'social', role: 'Customer', targetX: 13.8, targetZ: 41.6, transitionHours: .65 },
      { start: 18.0, x: 27.0, z: 34.0, behavior: 'idle', role: 'Going Home', transitionHours: .7 },
      { start: 20.0, hidden: true, x: 27.0, z: 34.0, role: 'Local' },
    ],
  });

  // V101.0: a few additional everyday routines spread activity beyond the
  // junction so the village feels occupied without crowding the mobile scene.
  addPhotoVillager(scene, 27.2, 19.4, 0, .22, .8, .69, {
    behavior: 'idle', facing: -Math.PI / 2, role: 'Local', nightHide: true,
    shelterX: 27.8, shelterZ: 20.0,
  });
  addPhotoVillager(scene, -34.2, -11.7, 0, .24, 2.7, .71, {
    behavior: 'task', facing: Math.PI, role: 'Local', nightHide: true,
    shelterX: -35.0, shelterZ: -12.4,
  });
  addPhotoVillager(scene, -18.5, 52.0, 7.5, .34, 4.0, .70, {
    role: 'Local', nightHide: true,
  });
  addPhotoVillager(scene, 18.0, -50.0, 6.2, .31, 1.5, .68, {
    role: 'Local', nightHide: true,
  });
}

function buildLandmarkWorld(scene) {
  addFortLandmark(scene, -7, 60);
  addTeaHills(scene, 42, 26);
  addPalaceLandmark(scene, -26, 6);
  addBackwaterHouseboat(scene, -34, -13);
  // Keep the junction open and readable; the paddy-row landmark here looked
  // like a green road barrier from the driving view.
  addTempleLandmark(scene, 13, -57);
}

function landmarkBeacon(scene, x, z, color) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 2.7, 8), new THREE.MeshStandardMaterial({ color: 0x38443f, roughness: .9 }));
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .22, roughness: .6 }));
  pole.position.set(x, 1.35, z); marker.position.set(x, 2.78, z);
  scene.add(pole, marker);
}

function addFortLandmark(scene, x, z) {
  addBoxCollider(x, z, 4.5, .82, 'fort');
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x777167, roughness: 1 });
  const grassStone = new THREE.MeshStandardMaterial({ color: 0x5d6651, roughness: 1 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.2, 1.15), stone); wall.position.set(0, 1.1, 0);
  group.add(wall);
  [-3.5, 0, 3.5].forEach(px => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(.75, .9, 2.85, 8), grassStone); tower.position.set(px, 1.42, .25); group.add(tower);
  });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 1.2, 0xf1c658);
}

function addTeaHills(scene, x, z) {
  addCircleCollider(x, z, 2.7, 'hill');
  const group = new THREE.Group();
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x497a45, roughness: 1 });
  [[0,0,4.5],[-3,1,2.8],[3,-1,3.2]].forEach(([px,pz,radius]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * .72, 18), hillMat); hill.position.set(px, radius * .34, pz); group.add(hill);
  });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3, 0x74ca68);
}

function addPalaceLandmark(scene, x, z) {
  addBoxCollider(x, z, 3.65, 2.45, 'palace');
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb99667, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7d3f2e, roughness: .95 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.5, 4.8), wallMat); body.position.y = 1.75;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.65, 2.3, 4), roofMat); roof.rotation.y = Math.PI / 4; roof.position.y = 4.45;
  group.add(body, roof); group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3, 0xf5b25e);
}

function addBackwaterHouseboat(scene, x, z) {
  addBoxCollider(x, z, 3.05, 1.2, 'houseboat');
  const group = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({ color: 0x287d94, roughness: .28, metalness: .1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .03;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.9, .72, 2.2), new THREE.MeshStandardMaterial({ color: 0x624528, roughness: .9 })); hull.position.y = .6;
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(.85, 3.0, 6, 12), new THREE.MeshStandardMaterial({ color: 0xb69258, roughness: .95 })); cabin.rotation.z = Math.PI / 2; cabin.position.y = 1.45;
  group.add(water, hull, cabin); group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 2.6, 0x48bad2);
}

function addPaddyFields(scene, x, z) {
  const group = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshStandardMaterial({ color: 0x807142, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = .018;
  group.add(soil);
  for (let row = -2.4; row <= 2.4; row += .8) {
    const rice = new THREE.Mesh(new THREE.BoxGeometry(9.2, .34, .22), new THREE.MeshStandardMaterial({ color: 0x9bbd41, roughness: 1 })); rice.position.set(0, .17, row); group.add(rice);
  }
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3.5, 0xcbe064);
}

function addTempleLandmark(scene, x, z) {
  addBoxCollider(x, z, 3.5, 2.9, 'temple');
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xc8b58b, roughness: .9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x693d24, roughness: .92 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, .55, 5.8), stone); base.position.y = .28;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 4.1), stone); hall.position.y = 1.68;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.4, 4), wood); roof.rotation.y = Math.PI / 4; roof.position.y = 4.25;
  group.add(base, hall, roof);
  [-2.2, 2.2].forEach(px => { const column = new THREE.Mesh(new THREE.CylinderGeometry(.18, .23, 3.2, 10), stone); column.position.set(px, 1.8, 2.1); group.add(column); });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3.1, 0xe8bf55);
}

function addRoadEdges(scene, x, z, width, depth) {
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc3b9a3, roughness: 1 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(.36, .13, depth), curbMat);
  const right = left.clone();
  left.position.set(x - width / 2, .05, z);
  right.position.set(x + width / 2, .05, z);
  scene.add(left, right);
}

function createRoadVehicle(kind, color) {
  const isBus = kind === 'bus';
  const width = isBus ? 2.28 : 1.62;
  const length = isBus ? 5.25 : 3.35;
  const vehicle = new THREE.Group();
  const wipers = [];

  const paint = new THREE.MeshStandardMaterial({ color, roughness: .63, metalness: .035 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x20272a, roughness: .78, metalness: .12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x173543, roughness: .18, metalness: .12, transparent: true, opacity: .92 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x111416, roughness: .96 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xb8bec0, roughness: .46, metalness: .58 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xcbd0d1, roughness: .38, metalness: .62 });
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff0bf, emissive: 0xffd36b, emissiveIntensity: .24, roughness: .34,
  });
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0xb92f29, emissive: 0x7c120d, emissiveIntensity: .14, roughness: .52,
  });

  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(width, isBus ? .90 : .48, length),
    paint
  );
  lowerBody.position.y = isBus ? .68 : .48;

  const upperBody = new THREE.Mesh(
    new THREE.BoxGeometry(width - (isBus ? .08 : .12), isBus ? .72 : .42, isBus ? 4.72 : 2.42),
    paint
  );
  upperBody.position.set(0, isBus ? 1.32 : .82, isBus ? -.04 : -.08);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(width - (isBus ? .13 : .20), isBus ? .62 : .52, isBus ? 4.10 : 1.72),
    glass
  );
  cabin.position.set(0, isBus ? 1.78 : 1.18, isBus ? -.08 : -.05);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width - .10, isBus ? .10 : .08, isBus ? 4.88 : 1.94),
    paint
  );
  roof.position.set(0, isBus ? 2.13 : 1.50, isBus ? -.06 : -.10);

  const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(width * .86, .13, .16), trim);
  bumperFront.position.set(0, isBus ? .55 : .40, length / 2 + .04);
  const bumperRear = bumperFront.clone();
  bumperRear.position.z = -length / 2 - .04;

  vehicle.add(lowerBody, upperBody, cabin, roof, bumperFront, bumperRear);

  if (!isBus) {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(width * .88, .16, .72), paint);
    hood.position.set(0, .89, length * .35);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(width * .84, .14, .55), paint);
    boot.position.set(0, .86, -length * .39);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(width * .48, .22, .035), trim);
    grille.position.set(0, .57, length / 2 + .09);

    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(width * .72, .36, .045), glass);
    windscreen.position.set(0, 1.23, .79);
    windscreen.rotation.x = -.18;

    const rearGlass = windscreen.clone();
    rearGlass.position.z = -.87;
    rearGlass.rotation.x = .16;

    [-.33, .33].forEach((wiperX, index) => {
      const pivot = new THREE.Group();
      pivot.position.set(wiperX, 1.08, .825);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(.42, .025, .025), trim);
      blade.position.x = index ? -.18 : .18;
      pivot.rotation.z = index ? -.18 : Math.PI + .18;
      pivot.userData.wiperBaseZ = pivot.rotation.z;
      pivot.add(blade);
      vehicle.add(pivot);
      wipers.push(pivot);
    });

    const mirrorLeft = new THREE.Mesh(new THREE.BoxGeometry(.14, .10, .18), trim);
    const mirrorRight = mirrorLeft.clone();
    mirrorLeft.position.set(-width * .54, 1.20, .53);
    mirrorRight.position.set(width * .54, 1.20, .53);

    vehicle.add(hood, boot, grille, windscreen, rearGlass, mirrorLeft, mirrorRight);
  } else {
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(width - .30, .48, .055), glass);
    windscreen.position.set(0, 1.76, length / 2 + .035);
    vehicle.add(windscreen);

    [-.46, .46].forEach((wiperX, index) => {
      const pivot = new THREE.Group();
      pivot.position.set(wiperX, 1.60, length / 2 + .073);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(.58, .026, .024), trim);
      blade.position.x = index ? -.25 : .25;
      pivot.rotation.z = index ? -.15 : Math.PI + .15;
      pivot.userData.wiperBaseZ = pivot.rotation.z;
      pivot.add(blade);
      vehicle.add(pivot);
      wipers.push(pivot);
    });

    for (let row = -1.55; row <= 1.55; row += .78) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(.05, .38, .58), glass);
      const opposite = window.clone();
      window.position.set(width / 2 + .026, 1.78, row);
      opposite.position.set(-width / 2 - .026, 1.78, row);
      vehicle.add(window, opposite);
    }

    const destination = new THREE.Mesh(new THREE.BoxGeometry(width * .62, .19, .055), trim);
    destination.position.set(0, 2.02, length / 2 + .07);
    vehicle.add(destination);
  }

  const leftLamp = new THREE.Mesh(new THREE.SphereGeometry(isBus ? .105 : .09, 8, 6), headlightMaterial);
  const rightLamp = leftLamp.clone();
  leftLamp.position.set(-width * .30, isBus ? .78 : .60, length / 2 + .11);
  rightLamp.position.set(width * .30, isBus ? .78 : .60, length / 2 + .11);

  const leftTail = new THREE.Mesh(new THREE.BoxGeometry(isBus ? .16 : .12, .16, .055), tailMaterial);
  const rightTail = leftTail.clone();
  leftTail.position.set(-width * .31, isBus ? .78 : .58, -length / 2 - .08);
  rightTail.position.set(width * .31, isBus ? .78 : .58, -length / 2 - .08);

  const plate = new THREE.Mesh(new THREE.BoxGeometry(isBus ? .68 : .48, .16, .035), chrome);
  plate.position.set(0, isBus ? .55 : .42, -length / 2 - .10);

  vehicle.add(leftLamp, rightLamp, leftTail, rightTail, plate);
  vehicle.userData.headlightMaterials = [headlightMaterial];
  vehicle.userData.tailLightMaterials = [tailMaterial];

  const wheelRadius = isBus ? .27 : .235;
  const wheelWidth = isBus ? .15 : .14;
  const wheelZ = isBus ? length * .34 : length * .315;
  const wheelX = width / 2 + .015;
  const wheels = [];
  const frontWheels = [];

  for (const zPos of [-wheelZ, wheelZ]) {
    for (const xPos of [-wheelX, wheelX]) {
      const wheelRoot = new THREE.Group();
      wheelRoot.position.set(xPos, wheelRadius + .03, zPos);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 12),
        tire
      );
      wheel.rotation.z = Math.PI / 2;

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * .48, wheelRadius * .48, wheelWidth + .012, 10),
        rim
      );
      hub.rotation.z = Math.PI / 2;

      wheelRoot.add(wheel, hub);
      vehicle.add(wheelRoot);
      wheels.push(wheelRoot);
      if (zPos > 0) frontWheels.push(wheelRoot);
    }
  }

  vehicle.userData.wheels = wheels;
  vehicle.userData.frontWheels = frontWheels;
  vehicle.userData.bodyParts = [lowerBody, upperBody, cabin, roof];
  vehicle.userData.wipers = wipers;
  vehicle.userData.wheelRadius = wheelRadius;
  return vehicle;
}

function junctionTrafficState(time) {
  const cycle = ((time % 14) + 14) % 14;
  if (cycle < 5) return { main: 'green', side: 'red' };
  if (cycle < 6) return { main: 'amber', side: 'red' };
  if (cycle < 7) return { main: 'red', side: 'red' };
  if (cycle < 12) return { main: 'red', side: 'green' };
  if (cycle < 13) return { main: 'red', side: 'amber' };
  return { main: 'red', side: 'red' };
}

function addJunctionSignal(scene) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a5052, roughness: .72, metalness: .28 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x1b2022, roughness: .86 });
  const makeLens = color => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: .06,
    roughness: .44,
  });

  const makeSignal = (x, z, rotation) => {
    const root = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.055, .075, 3.25, 8), poleMat);
    pole.position.y = 1.62;
    const head = new THREE.Mesh(new THREE.BoxGeometry(.42, 1.06, .32), housingMat);
    head.position.set(0, 3.08, 0);

    const red = makeLens(0x5a1613);
    const amber = makeLens(0x5b4210);
    const green = makeLens(0x174d2d);
    [
      [red, 3.38],
      [amber, 3.08],
      [green, 2.78],
    ].forEach(([material, y]) => {
      const lens = new THREE.Mesh(new THREE.SphereGeometry(.105, 8, 6), material);
      lens.position.set(0, y, .18);
      root.add(lens);
    });

    root.add(pole, head);
    root.position.set(x, 0, z);
    root.rotation.y = rotation;
    scene.add(root);
    return { red, amber, green };
  };

  junctionSignalVisual = {
    main: makeSignal(8.85, -28.8, Math.PI),
    side: makeSignal(-8.85, -15.15, -Math.PI / 2),
    last: '',
  };
}

function updateJunctionSignal(state) {
  if (!junctionSignalVisual) return;
  const signature = state.main + '|' + state.side;
  if (junctionSignalVisual.last === signature) return;
  junctionSignalVisual.last = signature;

  const apply = (set, active) => {
    for (const [name, material] of Object.entries(set)) {
      const on = name === active;
      material.emissiveIntensity = on ? 1.0 : .05;
      const color = name === 'red' ? 0xff3d32 : name === 'amber' ? 0xffbd36 : 0x38d878;
      material.color.setHex(on ? color : name === 'red' ? 0x5a1613 : name === 'amber' ? 0x5b4210 : 0x174d2d);
      material.emissive.setHex(color);
    }
  };

  apply(junctionSignalVisual.main, state.main);
  apply(junctionSignalVisual.side, state.side);
}

function createAutoRickshaw(color = 0x26763f) {
  const auto = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: .68, metalness: .025 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x171c1b, roughness: .92 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x303735, roughness: .78, metalness: .10 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x24454e, roughness: .22, transparent: true, opacity: .90 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111516, roughness: .96 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xaeb5b4, roughness: .48, metalness: .55 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe8a6, emissive: 0xffd46b, emissiveIntensity: .25, roughness: .38 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xb83028, emissive: 0x74150f, emissiveIntensity: .14, roughness: .52 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.32, .24, 2.26), trimMat);
  floor.position.y = .34;
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.28, .62, 2.08), bodyMat);
  lower.position.set(0, .72, -.03);
  const rearCabin = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.16, 1.18), bodyMat);
  rearCabin.position.set(0, 1.34, -.38);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.34, .18, 1.62), canopyMat);
  canopy.position.set(0, 1.98, -.16);
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.02, .68, .055), glassMat);
  windscreen.position.set(0, 1.48, .72);
  windscreen.rotation.x = -.08;
  const wiperPivot = new THREE.Group();
  wiperPivot.position.set(-.30, 1.31, .755);
  const wiperBlade = new THREE.Mesh(new THREE.BoxGeometry(.52, .025, .024), trimMat);
  wiperBlade.position.x = .22;
  wiperPivot.rotation.z = Math.PI + .18;
  wiperPivot.userData.wiperBaseZ = wiperPivot.rotation.z;
  wiperPivot.add(wiperBlade);
  auto.add(wiperPivot);
  const frontApron = new THREE.Mesh(new THREE.BoxGeometry(1.02, .58, .62), bodyMat);
  frontApron.position.set(0, .82, .82);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(.92, .11, .10), trimMat);
  bumper.position.set(0, .45, 1.17);
  auto.add(floor, lower, rearCabin, canopy, windscreen, frontApron, bumper);

  const sideOpeningMat = new THREE.MeshStandardMaterial({ color: 0x1e2825, roughness: .84 });
  for (const side of [-1, 1]) {
    const opening = new THREE.Mesh(new THREE.BoxGeometry(.045, .72, .80), sideOpeningMat);
    opening.position.set(side * .645, 1.48, -.18);
    auto.add(opening);
  }

  const frontLamp = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 6), lampMat);
  frontLamp.position.set(0, 1.02, 1.16);
  const leftTail = new THREE.Mesh(new THREE.BoxGeometry(.12, .14, .055), tailMat);
  const rightTail = leftTail.clone();
  leftTail.position.set(-.39, .73, -1.10);
  rightTail.position.set(.39, .73, -1.10);
  auto.add(frontLamp, leftTail, rightTail);

  const wheels = [];
  const frontWheels = [];
  const wheelGeometry = new THREE.CylinderGeometry(.235, .235, .13, 12);
  const makeWheel = (x, z, front = false) => {
    const root = new THREE.Group();
    root.position.set(x, .31, z);
    const wheel = new THREE.Mesh(wheelGeometry, tireMat);
    wheel.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .145, 10), rimMat);
    hub.rotation.z = Math.PI / 2;
    root.add(wheel, hub);
    auto.add(root);
    wheels.push(root);
    if (front) frontWheels.push(root);
  };
  makeWheel(0, .86, true);
  makeWheel(-.58, -.72);
  makeWheel(.58, -.72);

  auto.userData.headlightMaterials = [lampMat];
  auto.userData.tailLightMaterials = [tailMat];
  auto.userData.wipers = [wiperPivot];
  auto.userData.wheels = wheels;
  auto.userData.frontWheels = frontWheels;
  auto.userData.bodyParts = [lower, rearCabin, canopy, frontApron];
  auto.userData.wheelRadius = .235;
  return auto;
}

function createTrafficBike(color = 0x2d6f55) {
  const bike = createDeliveryBike();
  const rider = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color, roughness: .88 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x26303a, roughness: .92 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xa96d4c, roughness: .88 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0x24282b, roughness: .68, metalness: .06 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(.40, .62, .28), shirt);
  torso.position.set(0, 1.39, -.06);
  torso.rotation.x = -.14;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), skin);
  head.position.set(0, 1.82, .08);
  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(.195, 10, 7, 0, Math.PI * 2, 0, Math.PI * .58), helmet);
  helmetShell.position.set(0, 1.88, .08);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(.12, .52, .12), trousers);
  const rightLeg = leftLeg.clone();
  leftLeg.position.set(-.14, 1.05, -.18);
  rightLeg.position.set(.14, 1.05, -.18);
  leftLeg.rotation.x = .58;
  rightLeg.rotation.x = .58;
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(.10, .50, .10), skin);
  const rightArm = leftArm.clone();
  leftArm.position.set(-.24, 1.47, .26);
  rightArm.position.set(.24, 1.47, .26);
  leftArm.rotation.x = -.82;
  rightArm.rotation.x = -.82;
  rider.add(torso, head, helmetShell, leftLeg, rightLeg, leftArm, rightArm);
  bike.add(rider);
  bike.scale.setScalar(.96);
  return bike;
}

function createTrafficVehicleVisual(kind, color) {
  if (kind === 'auto') return createAutoRickshaw(color);
  if (kind === 'bike') return createTrafficBike(color);
  return createRoadVehicle(kind, color);
}

function attachTrafficWetEffects(vehicle, kind) {
  const count = kind === 'bus' ? 18 : kind === 'car' ? 14 : kind === 'auto' ? 12 : 8;
  const width = kind === 'bus' ? .88 : kind === 'bike' ? .28 : kind === 'auto' ? .48 : .62;
  const rearZ = kind === 'bus' ? -2.15 : kind === 'auto' ? -.86 : kind === 'bike' ? -.60 : -1.28;
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const sprayMaterial = new THREE.PointsMaterial({
    color: 0xd7e9ef,
    size: kind === 'bike' ? .065 : .080,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const spray = new THREE.Points(geometry, sprayMaterial);
  spray.frustumCulled = false;
  spray.visible = false;
  const particles = [];
  for (let index = 0; index < count; index++) {
    const side = count <= 8 ? 0 : (index % 2 ? 1 : -1);
    particles.push({
      x: side * width + (Math.random() - .5) * .16,
      y: .10 + Math.random() * .16,
      z: rearZ - Math.random() * .42,
      life: Math.random(),
    });
  }
  vehicle.add(spray);

  const glowWidth = kind === 'bus' ? 1.55 : kind === 'auto' ? .72 : kind === 'bike' ? .40 : 1.02;
  const glowLength = kind === 'bus' ? 5.4 : kind === 'auto' ? 3.3 : kind === 'bike' ? 2.8 : 4.2;
  const frontZ = kind === 'bus' ? 2.65 : kind === 'auto' ? 1.18 : kind === 'bike' ? .78 : 1.70;
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe6a8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(glowWidth, glowLength), glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, .045, frontZ + glowLength * .42);
  glow.renderOrder = 2;
  vehicle.add(glow);

  vehicle.userData.trafficWet = {
    spray,
    sprayMaterial,
    attribute,
    positions,
    particles,
    rearZ,
    width,
    glow,
    glowMaterial,
  };
}

function updateTrafficWetEffects(vehicle, delta, rain, speedRatio, braking) {
  const wet = vehicle.userData.trafficWet;
  if (!wet) return;

  const rainStrength = THREE.MathUtils.clamp(rain * speedRatio, 0, 1);
  wet.spray.visible = rainStrength > .045;
  wet.sprayMaterial.opacity = rainStrength * (.46 + speedRatio * .28);
  wet.glowMaterial.opacity = worldWeatherState.needsLights
    ? .055 + Number(worldWeatherState.overcast || 0) * .035 + rain * .065
    : rain > .55 ? .018 : 0;

  const wetDistance = playerRef
    ? Math.hypot(vehicle.position.x - playerRef.position.x, vehicle.position.z - playerRef.position.z)
    : 0;
  if (wetDistance > 46) {
    wet.spray.visible = false;
    for (const material of vehicle.userData.tailLightMaterials || []) {
      material.emissiveIntensity = braking ? .86 : (worldWeatherState.needsLights ? .23 : .14);
    }
    return;
  }

  if (wet.spray.visible) {
    wet.particles.forEach((particle, index) => {
      particle.life -= delta * (1.45 + speedRatio * 2.1 + rain * .6);
      if (particle.life <= 0) {
        particle.life = .60 + Math.random() * .55;
        const side = wet.particles.length <= 8 ? 0 : (index % 2 ? 1 : -1);
        particle.x = side * wet.width + (Math.random() - .5) * .18;
        particle.y = .08 + Math.random() * .14;
        particle.z = wet.rearZ - Math.random() * .22;
      }
      particle.x += (Math.random() - .5) * delta * (.20 + rain * .18);
      particle.y += delta * (.28 + speedRatio * .48 + rain * .20);
      particle.z -= delta * (.70 + speedRatio * 2.25 + rain * .55);
      const offset = index * 3;
      wet.positions[offset] = particle.x;
      wet.positions[offset + 1] = particle.y;
      wet.positions[offset + 2] = particle.z;
    });
    wet.attribute.needsUpdate = true;
  }

  const wiperLevel = THREE.MathUtils.smoothstep(rain, .10, .75);
  for (const [index, wiper] of (vehicle.userData.wipers || []).entries()) {
    const base = Number(wiper.userData.wiperBaseZ || 0);
    if (wiperLevel <= .01) {
      wiper.rotation.z += (base - wiper.rotation.z) * Math.min(1, delta * 7);
      continue;
    }
    const direction = index % 2 ? -1 : 1;
    const sweep = (Math.sin(villageTime * (4.8 + rain * 3.8) + index * .65) * .42 + .42) * direction;
    wiper.rotation.z = base + sweep * wiperLevel;
  }

  for (const material of vehicle.userData.tailLightMaterials || []) {
    material.emissiveIntensity = braking ? .86 : (worldWeatherState.needsLights ? .23 : .14);
  }
}

function addParkedVehicle(scene, kind, color, x, z, rotation = 0) {
  const vehicle = createTrafficVehicleVisual(kind, color);
  ambientVehicleLightMaterials.push(...(vehicle.userData.headlightMaterials || []));
  vehicle.position.set(x, 0, z);
  vehicle.rotation.y = rotation;
  const parkedScale = kind === 'bus' ? .96 : kind === 'bike' ? .86 : kind === 'auto' ? .92 : .92;
  vehicle.scale.multiplyScalar(parkedScale);
  vehicle.userData.parked = true;
  applyDynamicHighQuality(vehicle);
  scene.add(vehicle);
  const parkedRadius = kind === 'bus' ? 1.45 : kind === 'auto' ? .76 : kind === 'bike' ? .48 : .90;
  addCircleCollider(x, z, parkedRadius, 'parked-vehicle');
  return vehicle;
}

function addRoadVehicle(scene, config) {
  const vehicle = createTrafficVehicleVisual(config.kind, config.color);
  ambientVehicleLightMaterials.push(...(vehicle.userData.headlightMaterials || []));
  attachTrafficWetEffects(vehicle, config.kind);
  applyDynamicHighQuality(vehicle);
  vehicle.userData.traffic = { ...config, baseSpeed: config.speed, currentSpeed: config.speed };
  if (config.axis === 'z') {
    vehicle.position.set(config.fixed, 0, config.progress);
    vehicle.rotation.y = config.direction > 0 ? 0 : Math.PI;
  } else {
    vehicle.position.set(config.progress, 0, config.fixed);
    vehicle.rotation.y = config.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  traffic.push(vehicle);
  scene.add(vehicle);
}

function updateTraffic(delta) {
  const now = performance.now();
  const signalState = junctionTrafficState(villageTime);
  updateJunctionSignal(signalState);
  const pedestrianOnCrossing = villagers.some(villager =>
    villager.userData?.crossingActive
    && Math.abs(villager.position.z - pedestrianCrossingZ) < 1.2
    && Math.abs(villager.position.x) < 10.2
  );

  traffic.forEach(vehicle => {
    const config = vehicle.userData.traffic;
    const baseSpeed = Number(config.baseSpeed || config.speed || 0);
    const flowPhase = Number(config.flowPhase || 0);
    const flowAmount = Number(config.flowAmount ?? (config.kind === 'bike' ? .10 : config.kind === 'auto' ? .07 : .04));
    const naturalCruise = 1 - flowAmount * .5 + Math.sin(villageTime * .42 + flowPhase) * flowAmount * .5;
    const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
    const rainPenalty = config.kind === 'bike' ? .30 : config.kind === 'auto' ? .23 : config.kind === 'bus' ? .16 : .20;
    const weatherCruise = 1 - rain * rainPenalty;
    let targetSpeed = baseSpeed * naturalCruise * weatherCruise;

    if (playerRef && vehicleMode !== 'walk') {
      const playerDistance = Math.hypot(playerRef.position.x - vehicle.position.x, playerRef.position.z - vehicle.position.z);
      if (playerDistance < 3.8) targetSpeed = 0;
      else if (playerDistance < 6.2) targetSpeed = Math.min(targetSpeed, baseSpeed * .18);
      else if (playerDistance < 9.5) targetSpeed = Math.min(targetSpeed, baseSpeed * .52);
      if (now < hornPulseUntil && playerDistance < 11) targetSpeed = Math.min(targetSpeed, baseSpeed * .22);
    }

    for (const other of traffic) {
      if (other === vehicle) continue;
      const otherConfig = other.userData.traffic;
      if (otherConfig.axis !== config.axis || Math.abs(Number(otherConfig.fixed) - Number(config.fixed)) > 1.1) continue;
      const gap = (Number(otherConfig.progress) - Number(config.progress)) * Number(config.direction);
      const selfLength = trafficFootprint(config);
      const otherLength = trafficFootprint(otherConfig);
      const stopGap = Math.max(3.0, (config.axis === 'x' ? selfLength.halfWidth + otherLength.halfWidth : selfLength.halfDepth + otherLength.halfDepth) + 1.3);
      const slowGap = stopGap + 4.0;
      if (gap > 0 && gap < stopGap) targetSpeed = 0;
      else if (gap >= stopGap && gap < slowGap) targetSpeed = Math.min(targetSpeed, baseSpeed * .35);
    }

    const junctionProgress = config.axis === 'x' ? 0 : -24.5;
    const distanceToJunction = (junctionProgress - Number(config.progress)) * Number(config.direction);
    const permission = config.axis === 'x' ? signalState.side : signalState.main;
    if (distanceToJunction > .8 && distanceToJunction < 11) {
      if (permission === 'red') targetSpeed = 0;
      else if (permission === 'amber' && distanceToJunction > 3.0) targetSpeed = 0;
    } else if (distanceToJunction >= 11 && distanceToJunction < 16 && permission !== 'green') {
      targetSpeed = Math.min(targetSpeed, baseSpeed * .42);
    }

    if (config.axis === 'z' && pedestrianOnCrossing) {
      const distanceToCrossing = (pedestrianCrossingZ - Number(config.progress)) * Number(config.direction);
      if (distanceToCrossing > .75 && distanceToCrossing < 10.5) targetSpeed = 0;
      else if (distanceToCrossing >= 10.5 && distanceToCrossing < 15) targetSpeed = Math.min(targetSpeed, baseSpeed * .38);
    }

    if (config.kind === 'bus') {
      if (Number(config.stopUntil || 0) > now) {
        targetSpeed = 0;
      } else {
        const stops = config.axis === 'z' ? [27.5, -50.5] : [13.0];
        for (const stopZ of stops) {
          if (Number(config.lastBusStop) === stopZ) continue;
          const stopDistance = (stopZ - Number(config.progress)) * Number(config.direction);
          if (stopDistance > 0 && stopDistance < 7.5) {
            targetSpeed = Math.min(targetSpeed, baseSpeed * Math.max(.08, Math.min(.65, stopDistance / 7.5)));
            if (stopDistance < .48) {
              config.progress = stopZ;
              config.currentSpeed = 0;
              config.stopUntil = now + 2200;
              config.lastBusStop = stopZ;
              targetSpeed = 0;
            }
            break;
          }
        }
    }
    }

    const previousSpeed = Number(config.currentSpeed);
    const response = targetSpeed < previousSpeed ? 4.9 : 1.85;
    config.currentSpeed += (targetSpeed - previousSpeed) * Math.min(1, delta * response);
    if (Math.abs(config.currentSpeed) < .03) config.currentSpeed = 0;

    let nextProgress = Number(config.progress) + config.direction * config.currentSpeed * delta;
    if (config.direction > 0 && nextProgress > config.max) nextProgress = config.min;
    if (config.direction < 0 && nextProgress < config.min) nextProgress = config.max;

    if (playerRef?.visible) {
      const footprint = trafficFootprint(config);
      const playerRadius = vehicleMode === 'taxi' ? .92 : vehicleMode === 'bike' ? .56 : .43;
      const nextX = config.axis === 'x' ? nextProgress : Number(config.fixed);
      const nextZ = config.axis === 'z' ? nextProgress : Number(config.fixed);
      if (circleHitsBox(playerRef.position.x, playerRef.position.z, playerRadius + .18, nextX, nextZ, footprint.halfWidth, footprint.halfDepth)) {
        nextProgress = Number(config.progress);
        config.currentSpeed = 0;
      }
    }

    const wrapped = (config.direction > 0 && nextProgress === config.min && Number(config.progress) > config.max - 1)
      || (config.direction < 0 && nextProgress === config.max && Number(config.progress) < config.min + 1);
    if (wrapped) {
      config.currentSpeed = baseSpeed;
      if (config.kind === 'bus') {
        config.lastBusStop = null;
        config.stopUntil = 0;
      }
    } else if (config.kind === 'bus' && config.lastBusStop !== null && config.lastBusStop !== undefined) {
      if (Math.abs(Number(config.progress) - Number(config.lastBusStop)) > 13) config.lastBusStop = null;
    }
    config.progress = nextProgress;
    if (config.axis === 'z') vehicle.position.z = config.progress;
    else vehicle.position.x = config.progress;

    const trafficRatio = baseSpeed > .01 ? Math.min(1, Math.abs(Number(config.currentSpeed)) / baseSpeed) : 0;
    const braking = targetSpeed < previousSpeed - .18 || targetSpeed < baseSpeed * .18;
    animateVehicleVisual(vehicle, delta, Number(config.currentSpeed) * Number(config.direction), 0, trafficRatio, braking);
    updateTrafficWetEffects(vehicle, delta, rain, trafficRatio, braking);
  });
}

function addFruitClusters(parent) {
  const positions = [[-.8,5,.3],[.45,5.45,.55],[1.05,4.82,-.2],[-.3,6,0],[.7,5.52,-.7],[-1.1,4.75,-.2],[.15,4.75,1.05]];
  const fruits = new THREE.InstancedMesh(fruitGeometry, fruitMaterial, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach(([x, y, z], index) => {
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(.8 + (index % 3) * .12);
    dummy.updateMatrix();
    fruits.setMatrixAt(index, dummy.matrix);
  });
  fruits.instanceMatrix.needsUpdate = true;
  parent.add(fruits);
}

function addBird(scene, x, y, z, yaw = 0) {
  const bird = new THREE.Group();
  const body = new THREE.Mesh(birdBodyGeometry, birdMaterial);
  body.scale.set(.8, .75, 1.55);
  body.rotation.x = .1;
  const leftWing = new THREE.Mesh(birdWingGeometry, birdMaterial);
  leftWing.position.set(-.13, .01, 0);
  leftWing.rotation.z = .42;
  const rightWing = new THREE.Mesh(birdWingGeometry, birdMaterial);
  rightWing.position.set(.13, .01, 0);
  rightWing.rotation.z = -.42;
  bird.add(body, leftWing, rightWing);
  bird.position.set(x, y, z);
  bird.rotation.y = yaw;
  bird.userData.ambientAnimal = {
    kind: 'bird',
    startX: x,
    startY: y,
    startZ: z,
    phase: ambientAnimals.length * 1.73 + yaw,
    speed: .42 + (ambientAnimals.length % 3) * .06,
    radius: 2.1 + (ambientAnimals.length % 2) * .8,
    leftWing,
    rightWing,
  };
  ambientAnimals.push(bird);
  scene.add(bird);
  return bird;
}

function addButterfly(scene, x, z, color = 0xf6b64c, phase = 0) {
  const butterfly = new THREE.Group();
  const wingMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: .92 });
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x253229 });
  const wingGeometry = new THREE.CircleGeometry(.16, 7);
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
  leftWing.scale.set(.82, 1.14, 1);
  rightWing.scale.set(.82, 1.14, 1);
  leftWing.position.x = -.115;
  rightWing.position.x = .115;
  leftWing.rotation.y = .32;
  rightWing.rotation.y = -.32;
  const body = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 5), bodyMaterial);
  body.scale.set(.7, .7, 1.8);
  butterfly.add(leftWing, rightWing, body);
  butterfly.position.set(x, .72, z);
  butterfly.userData.ambientAnimal = {
    kind: 'butterfly', startX: x, startY: .72, startZ: z,
    phase: phase || ambientAnimals.length * 1.19,
    speed: .72 + (ambientAnimals.length % 3) * .08,
    radius: .7 + (ambientAnimals.length % 2) * .32,
    leftWing, rightWing,
  };
  ambientAnimals.push(butterfly);
  scene.add(butterfly);
  return butterfly;
}

function addRoadsideGardens(scene) {
  const shrubMaterials = [0x275f33, 0x347641, 0x4b8d46, 0x5b9b4f].map(color => new THREE.MeshStandardMaterial({ color, roughness: .92 }));
  const flowerMaterials = [0xff6d7a, 0xffc957, 0xcf80ff, 0xfff0a8].map(color => new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x356c36, roughness: .94 });
  const shrubGeometry = new THREE.DodecahedronGeometry(.48, 1);
  const flowerHeadGeometry = new THREE.SphereGeometry(.075, 7, 6);
  const stemGeometry = new THREE.CylinderGeometry(.012, .018, .28, 5);
  const gardenSpots = [
    [-12.2, -62], [12.2, -55], [-12.6, -47], [12.5, -42],
    [-12.4, -8], [12.7, -3], [-12.6, 8], [12.4, 15],
    [-12.2, 34], [12.7, 43], [-12.4, 61], [12.5, 66],
    [-31, -10], [31, 9], [-33, 47], [34, 52]
  ];
  gardenSpots.forEach(([x, z], index) => {
    const random = visualRandom(Math.abs(Math.floor(x * 73 + z * 131)) + 11031);
    for (let shrubIndex = 0; shrubIndex < 3; shrubIndex++) {
      const shrub = new THREE.Mesh(shrubGeometry, shrubMaterials[(index + shrubIndex) % shrubMaterials.length]);
      shrub.position.set(x + (random() - .5) * 1.35, .32 + random() * .13, z + (random() - .5) * 1.15);
      const size = .58 + random() * .42;
      shrub.scale.set(size * (1.06 + random() * .26), size * (.76 + random() * .28), size);
      shrub.rotation.set(random() * .3, random() * Math.PI, random() * .22);
      shrub.castShadow = true;
      shrub.receiveShadow = true;
      scene.add(shrub);
    }
    for (let flowerIndex = 0; flowerIndex < 7; flowerIndex++) {
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = .14;
      const head = new THREE.Mesh(flowerHeadGeometry, flowerMaterials[(index + flowerIndex) % flowerMaterials.length]);
      head.position.y = .31;
      head.scale.set(1, .55, 1);
      flower.add(stem, head);
      flower.position.set(x + (random() - .5) * 1.9, .015, z + (random() - .5) * 1.65);
      flower.rotation.y = random() * Math.PI;
      scene.add(flower);
    }
  });

  [[-13.4, -47], [13.4, -3], [-13.5, 34], [13.3, 43], [-31, 47], [31, 9]].forEach(([x, z], index) => {
    addButterfly(scene, x, z, [0xffd157, 0xf37a91, 0x9b7aff, 0x7ee5d2][index % 4], index * .92);
  });
}

function createVillageAnimal(kind, color) {
  const root = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color, roughness: .94 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2926, roughness: .96 });
  const light = new THREE.MeshStandardMaterial({ color: 0xd8c7a6, roughness: .96 });
  const parts = {};

  if (kind === 'dog') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .72, 5, 8), coat);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, .60, 0);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(.29, 10, 8), coat);
    chest.position.set(0, .68, .38);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), coat);
    head.position.set(0, .88, .67);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(.22, .16, .24), light);
    muzzle.position.set(0, .80, .90);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 6), dark);
    nose.position.set(0, .84, 1.035);
    root.add(body, chest, head, muzzle, nose);
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.095, .23, 6), dark);
      ear.position.set(side * .15, 1.08, .66);
      ear.rotation.z = side * .18;
      root.add(ear);
    });
    const legGeometry = new THREE.CylinderGeometry(.055, .065, .47, 7);
    [[-.19,.28], [.19,.28], [-.19,-.28], [.19,-.28]].forEach(([x,z], index) => {
      const leg = new THREE.Mesh(legGeometry, coat);
      leg.position.set(x, .28, z);
      root.add(leg);
      parts['leg' + index] = leg;
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(.035, .055, .48, 7), coat);
    tail.position.set(0, .78, -.62);
    tail.rotation.x = -.88;
    root.add(tail);
    parts.head = head;
    parts.tail = tail;
  } else if (kind === 'chicken') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), coat);
    body.scale.set(.90, 1, 1.25);
    body.position.set(0, .43, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 9, 7), coat);
    head.position.set(0, .72, .26);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(.06, .18, 6), new THREE.MeshStandardMaterial({ color: 0xd79a28, roughness: .86 }));
    beak.position.set(0, .70, .43);
    beak.rotation.x = Math.PI / 2;
    const comb = new THREE.Mesh(new THREE.SphereGeometry(.07, 7, 5), new THREE.MeshStandardMaterial({ color: 0xbc382e, roughness: .9 }));
    comb.scale.set(.7, 1.25, .65);
    comb.position.set(0, .87, .24);
    root.add(body, head, beak, comb);
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), coat);
      wing.scale.set(.35, .68, 1);
      wing.position.set(side * .22, .48, -.01);
      root.add(wing);
      parts[side < 0 ? 'leftWing' : 'rightWing'] = wing;
    });
    const legGeometry = new THREE.CylinderGeometry(.025, .03, .28, 6);
    [-.09, .09].forEach((x, index) => {
      const leg = new THREE.Mesh(legGeometry, new THREE.MeshStandardMaterial({ color: 0xc78d2f, roughness: .9 }));
      leg.position.set(x, .15, .02);
      root.add(leg);
      parts['leg' + index] = leg;
    });
    parts.head = head;
  } else {
    const cow = kind === 'cow';
    const scale = cow ? 1.16 : .82;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.34 * scale, .92 * scale, 5, 8), coat);
    body.rotation.z = Math.PI / 2;
    body.position.set(0, .72 * scale, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .20 * scale, .44 * scale, 8), coat);
    neck.position.set(0, .92 * scale, .48 * scale);
    neck.rotation.x = -.28;
    const head = new THREE.Mesh(new THREE.BoxGeometry(.42 * scale, .40 * scale, .52 * scale), coat);
    head.position.set(0, 1.12 * scale, .70 * scale);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(.34 * scale, .18 * scale, .18 * scale), light);
    muzzle.position.set(0, 1.02 * scale, .98 * scale);
    root.add(body, neck, head, muzzle);
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0xc8b990, roughness: .88 });
    [-1, 1].forEach(side => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(.045 * scale, .22 * scale, 6), hornMaterial);
      horn.position.set(side * .18 * scale, 1.36 * scale, .65 * scale);
      horn.rotation.z = side * .55;
      root.add(horn);
    });
    const legGeometry = new THREE.CylinderGeometry(.06 * scale, .075 * scale, .60 * scale, 7);
    [[-.22,.30], [.22,.30], [-.22,-.30], [.22,-.30]].forEach(([x,z], index) => {
      const leg = new THREE.Mesh(legGeometry, dark);
      leg.position.set(x * scale, .32 * scale, z * scale);
      root.add(leg);
      parts['leg' + index] = leg;
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(.025 * scale, .035 * scale, .52 * scale, 6), coat);
    tail.position.set(0, .90 * scale, -.62 * scale);
    tail.rotation.x = -.55;
    root.add(tail);
    parts.head = head;
    parts.tail = tail;
  }

  root.userData.animalParts = parts;
  root.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return root;
}

function addAmbientAnimal(scene, kind, x, z, options = {}) {
  const colors = {
    dog: [0x8d684a, 0x5b4637, 0xb08a67],
    chicken: [0xd6c5a2, 0x9d6847, 0xe7dfc5],
    goat: [0xc6b99d, 0x8e816b, 0xe0d7c4],
    cow: [0x765a46, 0xb9aa8e, 0x5f554c],
  };
  const palette = colors[kind] || colors.dog;
  const index = ambientAnimals.length;
  const animal = createVillageAnimal(kind, options.color || palette[index % palette.length]);
  const scale = Number(options.scale || 1);
  animal.scale.setScalar(scale);
  const animalShadowSize = kind === 'cow'
    ? [.78, .42, .20]
    : kind === 'goat'
      ? [.58, .34, .18]
      : kind === 'dog'
        ? [.48, .30, .17]
        : [.28, .20, .14];
  attachContactShadow(animal, ...animalShadowSize);
  applyDynamicHighQuality(animal);
  animal.position.set(x, 0, z);
  animal.rotation.y = Number(options.yaw || 0);
  animal.userData.ambientAnimal = {
    kind,
    startX: x,
    startZ: z,
    phase: Number(options.phase ?? index * 1.41),
    radius: Number(options.radius ?? (kind === 'chicken' ? 1.6 : kind === 'dog' ? 2.4 : 2.0)),
    speed: Number(options.speed ?? (kind === 'chicken' ? .78 : kind === 'dog' ? .55 : .38)),
    parts: animal.userData.animalParts || {},
  };
  ambientAnimals.push(animal);
  scene.add(animal);
  return animal;
}

function updateAmbientAnimals(time, delta) {
  const rain = THREE.MathUtils.clamp(Number(worldWeatherState.rain || 0), 0, 1);
  const hour = Number(worldWeatherState.hour ?? 12);
  const night = hour >= 20 || hour < 5.25;

  for (const animal of ambientAnimals) {
    const data = animal.userData.ambientAnimal;
    if (!data) continue;
    const playerDistance = playerRef
      ? Math.hypot(animal.position.x - playerRef.position.x, animal.position.z - playerRef.position.z)
      : 0;

    if (data.kind === 'bird' || data.kind === 'butterfly') {
      const butterfly = data.kind === 'butterfly';
      animal.visible = !night
        && rain < (butterfly ? .42 : .62)
        && (!runtimeIsMobile || playerDistance < 52);
      if (!animal.visible) continue;
      const angle = time * data.speed + data.phase;
      const radius = data.radius;
      animal.position.set(
        data.startX + Math.cos(angle) * radius,
        data.startY + (butterfly ? .12 : .45) + Math.sin(time * (butterfly ? 1.9 : .72) + data.phase) * (butterfly ? .16 : .42),
        data.startZ + Math.sin(angle) * radius,
      );
      animal.rotation.y = -angle + Math.PI / 2;
      const flap = Math.sin(time * (butterfly ? 14 : 9.5) + data.phase) * (butterfly ? .72 : .62);
      if (butterfly) {
        data.leftWing.rotation.y = .32 + flap;
        data.rightWing.rotation.y = -.32 - flap;
      } else {
        data.leftWing.rotation.z = .28 + flap;
        data.rightWing.rotation.z = -.28 - flap;
      }
      continue;
    }

    const hideAtNight = data.kind === 'chicken' || data.kind === 'goat' || data.kind === 'cow';
    animal.visible = !(hideAtNight && night);
    if (!animal.visible) continue;
    if (playerDistance > 55) continue;

    const parts = data.parts || {};
    const phase = time * data.speed + data.phase;
    const weatherSlow = 1 - rain * .42;
    let targetX = data.startX + Math.sin(phase) * data.radius * weatherSlow;
    let targetZ = data.startZ + Math.sin(phase * .71 + data.phase * .63) * data.radius * .68 * weatherSlow;
    let alert = 0;

    if (playerRef?.visible) {
      const dx = animal.position.x - playerRef.position.x;
      const dz = animal.position.z - playerRef.position.z;
      const distance = Math.max(.001, Math.hypot(dx, dz));
      const reactionRadius = vehicleMode === 'walk'
        ? (data.kind === 'chicken' ? 3.4 : data.kind === 'dog' ? 3.0 : 3.3)
        : 5.5;
      if (distance < reactionRadius) {
        alert = 1 - distance / reactionRadius;
        const escape = (data.kind === 'chicken' ? 3.0 : data.kind === 'dog' ? 1.8 : 2.1) * alert;
        targetX = animal.position.x + dx / distance * escape;
        targetZ = animal.position.z + dz / distance * escape;
        const maxRange = data.radius + 3.0;
        targetX = THREE.MathUtils.clamp(targetX, data.startX - maxRange, data.startX + maxRange);
        targetZ = THREE.MathUtils.clamp(targetZ, data.startZ - maxRange, data.startZ + maxRange);
      }
    }

    const beforeX = animal.position.x;
    const beforeZ = animal.position.z;
    const response = (data.kind === 'chicken' ? 2.5 : data.kind === 'dog' ? 1.9 : 1.35) * (1 + alert * 2.5);
    animal.position.x += (targetX - animal.position.x) * Math.min(1, delta * response);
    animal.position.z += (targetZ - animal.position.z) * Math.min(1, delta * response);
    const moveX = animal.position.x - beforeX;
    const moveZ = animal.position.z - beforeZ;
    const moving = Math.hypot(moveX, moveZ) > .0015;
    if (moving) animal.rotation.y = Math.atan2(moveX, moveZ);

    const gait = Math.sin(time * (data.kind === 'chicken' ? 11 : alert > .15 ? 9 : 5.5) + data.phase);
    Object.entries(parts).forEach(([name, part]) => {
      if (!name.startsWith('leg') || !part) return;
      const index = Number(name.slice(3)) || 0;
      part.rotation.x = gait * (index % 2 ? -1 : 1) * (moving ? .32 : .04);
    });
    if (parts.tail) {
      parts.tail.rotation.z = Math.sin(time * 3.4 + data.phase) * (data.kind === 'dog' ? .28 : .10);
    }
    if (parts.head) {
      const peck = data.kind === 'chicken' && alert < .2
        ? Math.max(0, Math.sin(time * 3.2 + data.phase)) * .32
        : 0;
      parts.head.rotation.y = Math.sin(time * .9 + data.phase) * .08;
      parts.head.rotation.x = alert * .10 + peck;
    }
    if (parts.leftWing && parts.rightWing) {
      const wingBeat = Math.sin(time * 4.5 + data.phase) * (alert > .15 ? .45 : .10);
      parts.leftWing.rotation.z = wingBeat;
      parts.rightWing.rotation.z = -wingBeat;
    }
  }
}

function addPhotoHouse(scene, x, z) { addHouse(scene, x, z, 0xf0e5d1, 0x9e533a); }


function addBuildingWeathering(group, kind, seedValue = 1) {
  const random = visualRandom(Math.abs(Math.round(seedValue)) + 9901);
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x526b45,
    roughness: 1,
    transparent: true,
    opacity: .46,
    depthWrite: false,
  });
  const dampMat = new THREE.MeshStandardMaterial({
    color: 0x5a6654,
    roughness: 1,
    transparent: true,
    opacity: .28,
    depthWrite: false,
  });
  const stainMat = new THREE.MeshStandardMaterial({
    color: 0x6c5c49,
    roughness: 1,
    transparent: true,
    opacity: .22,
    depthWrite: false,
  });

  if (kind === 'house') {
    for (let index = 0; index < 4; index++) {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(.55 + random() * .38, 12), index % 2 ? dampMat : stainMat);
      stain.scale.set(.65 + random() * .9, .32 + random() * .36, 1);
      stain.position.set(-3.4 + random() * 6.8, .72 + random() * .82, 3.826);
      stain.rotation.z = (random() - .5) * .22;
      stain.renderOrder = 1;
      group.add(stain);
    }
    const mossBand = new THREE.Mesh(new THREE.PlaneGeometry(7.8, .18), mossMat);
    mossBand.position.set(0, .72, 3.831);
    mossBand.rotation.z = (random() - .5) * .025;
    mossBand.renderOrder = 1;
    group.add(mossBand);
  }

  if (kind === 'shop') {
    const lowerDamp = new THREE.Mesh(new THREE.PlaneGeometry(8.7, .38), dampMat);
    lowerDamp.position.set(0, .54, 2.966);
    lowerDamp.renderOrder = 1;
    group.add(lowerDamp);

    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x80563b,
      roughness: .96,
      transparent: true,
      opacity: .44,
      depthWrite: false,
    });
    for (let index = 0; index < 5; index++) {
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(.045 + random() * .055, .55 + random() * .72),
        rustMat
      );
      streak.position.set(-1.8 + random() * 3.6, 1.18 + random() * 1.04, 3.027);
      streak.rotation.z = (random() - .5) * .035;
      streak.renderOrder = 2;
      group.add(streak);
    }

    for (let index = 0; index < 2; index++) {
      const wallPatch = new THREE.Mesh(new THREE.CircleGeometry(.50 + random() * .35, 12), dampMat);
      wallPatch.scale.set(.85 + random() * .65, .38 + random() * .34, 1);
      wallPatch.position.set((index ? 1 : -1) * (3.0 + random() * .7), 1.0 + random() * .6, 2.928);
      wallPatch.renderOrder = 1;
      group.add(wallPatch);
    }
  }
}

function addHouse(scene, x, z, wallColor, roofColor) {
  addBoxCollider(x, z, 4.45, 3.95, 'house');
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: .98 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x573a2b, roughness: .92 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x6fa4b8,
    roughness: .18,
    metalness: .12,
    emissive: 0xffc978,
    emissiveIntensity: .04,
  });
  buildingLightMaterials.push(windowMat);
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(9.25, .32, 8.25), new THREE.MeshStandardMaterial({ color: 0x898072, roughness: 1 }));
  foundation.position.y = .16;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(8.65, 4.4, 7.5), wallMat);
  walls.position.y = 2.45;
  const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(5.1, .22, 1.85), new THREE.MeshStandardMaterial({ color: 0xa79983, roughness: 1 }));
  porchFloor.position.set(0, .36, 4.18);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, .23, .75), new THREE.MeshStandardMaterial({ color: 0x8d8372, roughness: 1 }));
  step.position.set(0, .15, 5.1);
  group.add(foundation, walls, porchFloor, step);

  const roofA = new THREE.Mesh(new THREE.BoxGeometry(9.7, .18, 4.55), roofMat);
  const roofB = roofA.clone();
  roofA.rotation.x = .52;
  roofB.rotation.x = -.52;
  roofA.position.set(0, 5.65, -1.32);
  roofB.position.set(0, 5.65, 1.32);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(9.7, .22, .32), new THREE.MeshStandardMaterial({ color: 0x713a2e, roughness: 1 }));
  ridge.position.y = 6.75;
  group.add(roofA, roofB, ridge);
  const tileMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xb46244, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xa9543d, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xc06d4d, roughness: 1 }),
  ];
  let tileIndex = 0;
  for (let xTile = -4.15; xTile <= 4.15; xTile += 1.18) {
    const tileSeed = Math.abs(Math.round(x * 11 + z * 17 + tileIndex * 7));
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.88, .07, 4.45), tileMaterials[tileSeed % tileMaterials.length]);
    tile.rotation.x = -.52;
    tile.position.set(xTile, 5.71, 1.39);
    group.add(tile);
    tileIndex++;
  }

  const skirting = new THREE.Mesh(
    new THREE.BoxGeometry(8.75, .42, 7.6),
    new THREE.MeshStandardMaterial({ color: 0x8c7d69, roughness: 1 })
  );
  skirting.position.y = .62;
  const facadeBand = new THREE.Mesh(
    new THREE.BoxGeometry(8.25, .16, .11),
    new THREE.MeshStandardMaterial({ color: 0xd9cbb5, roughness: .92 })
  );
  facadeBand.position.set(0, 4.22, 3.82);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, .12), darkWood);
  door.position.set(0, 1.6, 3.82);
  const houseNames = ['ANUGRAHA', 'SANTHI BHAVAN', 'GREEN VILLA', 'SREE NILAYAM'];
  const houseName = houseNames[Math.abs(Math.round(x * 3 + z * 5)) % houseNames.length];
  const namePlate = createWorldSignMesh({
    title: houseName,
    subtitle: 'HOUSE',
    background: '#5b4734',
    accent: '#caa66b',
    width: 360,
    height: 150,
  }, 1.38, .48);
  namePlate.position.set(-1.15, 3.24, 3.895);
  registerFarVisual(namePlate, x, z, 46);
  const porchLampMaterial = new THREE.MeshStandardMaterial({
    color: 0xffedc2,
    emissive: 0xffc66c,
    emissiveIntensity: .16,
    roughness: .45,
  });
  const porchLamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), porchLampMaterial);
  porchLamp.position.set(.95, 3.22, 3.98);
  buildingLightMaterials.push(porchLampMaterial);

  const porchLight = new THREE.PointLight(0xffbd6a, 0, 8.5, 1.8);
  porchLight.position.set(.95, 3.05, 4.05);
  porchLight.castShadow = false;
  buildingLightSources.push(porchLight);

  const porchReflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb75e,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  porchReflectionMaterial.userData.dryGlow = .035;
  porchReflectionMaterial.userData.wetGlow = .22;
  const porchReflection = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.8), porchReflectionMaterial);
  porchReflection.rotation.x = -Math.PI / 2;
  porchReflection.position.set(.60, .055, 4.75);
  porchReflection.renderOrder = 2;
  wetReflectionMaterials.push(porchReflectionMaterial);
  group.add(skirting, facadeBand, door, namePlate, porchLamp, porchLight, porchReflection);
  [[-2.75, 3.82], [2.75, 3.82]].forEach(([windowX, windowZ]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.42, .13), darkWood);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.17, .145), windowMat);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .16), darkWood);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.48, .08, .16), darkWood);
    frame.position.set(windowX, 2.65, windowZ);
    glass.position.set(windowX, 2.65, windowZ + .01);
    vertical.position.set(windowX, 2.65, windowZ + .02);
    horizontal.position.set(windowX, 2.65, windowZ + .02);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.82, .11, .28), new THREE.MeshStandardMaterial({ color: 0xd7cbb5, roughness: .95 }));
    sill.position.set(windowX, 1.91, windowZ + .10);
    group.add(frame, glass, vertical, horizontal, sill);
  });
  [-1.95, 1.95].forEach(columnX => {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.15, .18, 3.45, 10), new THREE.MeshStandardMaterial({ color: 0xf7f0df, roughness: .86 }));
    column.position.set(columnX, 2.05, 4.15);
    group.add(column);
  });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.4, .16, 2.15), roofMat);
  canopy.position.set(0, 3.85, 4.18);
  canopy.rotation.x = -.08;
  group.add(canopy);

  const gutterMat = new THREE.MeshStandardMaterial({ color: 0x5f6462, roughness: .62, metalness: .28 });
  const gutterFront = new THREE.Mesh(new THREE.BoxGeometry(9.55, .10, .12), gutterMat);
  gutterFront.position.set(0, 5.06, 3.72);
  const gutterBack = gutterFront.clone();
  gutterBack.position.z = -3.72;
  group.add(gutterFront, gutterBack);
  [-4.15, 4.15].forEach(pipeX => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, 4.25, 8), gutterMat);
    pipe.position.set(pipeX, 2.52, 3.70);
    group.add(pipe);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(.18, .12, .42), gutterMat);
    shoe.position.set(pipeX, .42, 3.88);
    group.add(shoe);

    const runoffMaterial = new THREE.MeshBasicMaterial({
      color: 0xaed9e8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const runoff = new THREE.Mesh(new THREE.CylinderGeometry(.022, .035, .58, 7), runoffMaterial);
    runoff.position.set(pipeX, .18, 4.10);
    runoff.rotation.x = -.12;
    roofRunoffJets.push({
      mesh: runoff,
      material: runoffMaterial,
      phase: roofRunoffJets.length * .61,
    });
    group.add(runoff);
  });

  const roofShadow = new THREE.Mesh(
    new THREE.BoxGeometry(9.15, .08, .18),
    new THREE.MeshStandardMaterial({ color: 0x5e4637, roughness: .96 })
  );
  roofShadow.position.set(0, 4.92, 3.66);
  group.add(roofShadow);
  addBuildingWeathering(group, 'house', x * 31 + z * 47);
  group.position.set(x, 0, z);
  scene.add(group);
}

function addShop(scene, x, z, shopName = 'VILLAGE STORES', subtitle = 'ചായ · SNACKS · GROCERIES') {
  addBoxCollider(x, z, 4.8, 3.0, 'shop');
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.8, 5.8), new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: .92 }));
  body.position.y = 1.9;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(10.1, .35, 1.8), new THREE.MeshStandardMaterial({ color: 0xb83f36, roughness: .9 }));
  awning.position.set(0, 3.35, 3.2);
  const signMaterial = new THREE.MeshStandardMaterial({
    color: 0x276a7e,
    emissive: 0x4eb6c7,
    emissiveIntensity: .04,
    roughness: .62,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.5, .9, .1), signMaterial);
  sign.position.set(0, 4.25, 2.93);
  buildingLightMaterials.push(signMaterial);

  const signText = createWorldSignMesh({
    title: shopName,
    subtitle,
    background: '#276a7e',
    accent: '#f0c45c',
  }, 5.28, .78);
  signText.position.set(0, 4.25, 2.985);
  registerFarVisual(signText, x, z, 54);
  const shutterMat = new THREE.MeshStandardMaterial({ color: 0x6e5845, roughness: .96, metalness: .08 });
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.05, .12), shutterMat);
  shutter.position.set(0, 1.82, 2.96);
  group.add(body, awning, sign, signText, shutter);

  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3d4547, roughness: .74, metalness: .22 });
  for (let y = .94; y <= 2.70; y += .22) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(4.28, .035, .055), trimMat);
    slat.position.set(0, y, 3.035);
    group.add(slat);
  }
  [-4.55, 4.55].forEach(px => {
    const support = new THREE.Mesh(new THREE.BoxGeometry(.12, 3.18, .12), trimMat);
    support.position.set(px, 1.63, 3.18);
    group.add(support);
  });
  const signBorder = new THREE.Mesh(new THREE.BoxGeometry(5.82, 1.12, .07), trimMat);
  signBorder.position.set(0, 4.25, 2.86);
  signBorder.scale.z = .60;
  group.add(signBorder);
  sign.position.z = 2.91;
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, .82, .70),
    new THREE.MeshStandardMaterial({ color: 0x8c6a45, roughness: .88 })
  );
  counter.position.set(-3.0, .62, 3.22);
  group.add(counter);

  const shopLampMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe5ac,
    emissive: 0xffbd5b,
    emissiveIntensity: .04,
    roughness: .38,
  });
  const shopLamp = new THREE.Mesh(new THREE.BoxGeometry(2.9, .10, .16), shopLampMaterial);
  shopLamp.position.set(0, 3.03, 3.30);
  buildingLightMaterials.push(shopLampMaterial);

  const shopLight = new THREE.PointLight(0xffb95d, 0, 9.5, 1.7);
  shopLight.position.set(0, 2.82, 3.35);
  shopLight.castShadow = false;
  buildingLightSources.push(shopLight);

  const shopReflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb85f,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  shopReflectionMaterial.userData.dryGlow = .045;
  shopReflectionMaterial.userData.wetGlow = .28;
  const shopReflection = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 3.2), shopReflectionMaterial);
  shopReflection.rotation.x = -Math.PI / 2;
  shopReflection.position.set(0, .054, 4.1);
  shopReflection.renderOrder = 2;
  wetReflectionMaterials.push(shopReflectionMaterial);
  group.add(shopLamp, shopLight, shopReflection);
  addBuildingWeathering(group, 'shop', x * 43 + z * 29);
  group.position.set(x, 0, z);
  scene.add(group);
}

function addTree(scene, x, z, scale, withFruit = false) {
  addCircleCollider(x, z, Math.max(.42, .58 * scale), 'tree');
  const group = new THREE.Group();
  const random = visualRandom(Math.abs(Math.floor(x * 137 + z * 211 + scale * 1000)) + 9041);
  const barkColors = [0x65442e, 0x72503a, 0x5c3d2b];
  const foliageColors = [0x1d5e2e, 0x28723a, 0x347f3d, 0x468b46];

  const trunkMat = new THREE.MeshStandardMaterial({
    color: barkColors[Math.floor(random() * barkColors.length)],
    roughness: 1,
  });
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x6d4934, roughness: 1 });
  const foliageMats = foliageColors.map(color => new THREE.MeshStandardMaterial({ color, roughness: .96 }));

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.23, .46, 4.55, 10, 4), trunkMat);
  trunk.position.y = 2.27;
  trunk.rotation.z = (random() - .5) * .075;
  group.add(trunk);

  const branchConfigs = [
    [-.68, 4.05, .42, -.82, .25],
    [.74, 4.20, -.22, .78, -.18],
    [-.18, 4.62, -.62, -.42, -.34],
    [.28, 4.82, .58, .38, .30],
    [0, 4.48, .18, .08, .12],
  ];
  branchConfigs.forEach(([bx, by, bz, rz, rx], index) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(.065, .16 - index * .012, 1.72 - index * .08, 7),
      branchMat
    );
    branch.position.set(bx * .52, by, bz * .36);
    branch.rotation.z = rz;
    branch.rotation.x = rx;
    group.add(branch);
  });

  const canopyGeometry = new THREE.IcosahedronGeometry(1, 1);
  const foliageNodes = [];
  const clusters = [
    [0, 5.35, 0, 1.95, 1.22, 1.55],
    [-1.18, 5.12, .22, 1.42, 1.02, 1.22],
    [1.20, 5.10, -.18, 1.48, 1.04, 1.30],
    [-.52, 6.12, -.45, 1.30, 1.02, 1.16],
    [.62, 6.18, .42, 1.34, 1.06, 1.18],
    [-1.05, 5.78, -.72, 1.10, .88, .96],
    [1.08, 5.72, .76, 1.08, .90, .98],
    [0, 6.62, .02, 1.12, .92, 1.02],
  ];
  clusters.forEach(([lx, ly, lz, sx, sy, sz], index) => {
    const leaves = new THREE.Mesh(canopyGeometry, foliageMats[index % foliageMats.length]);
    leaves.position.set(lx + (random() - .5) * .18, ly + (random() - .5) * .12, lz + (random() - .5) * .18);
    leaves.scale.set(sx * (.93 + random() * .12), sy * (.94 + random() * .10), sz * (.93 + random() * .12));
    leaves.rotation.y = random() * Math.PI;
    leaves.userData.windBaseX = leaves.rotation.x;
    leaves.userData.windBaseZ = leaves.rotation.z;
    leaves.castShadow = true;
    foliageNodes.push(leaves);
    group.add(leaves);
  });

  if (withFruit) addFruitClusters(group);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'tree',
    nodes: foliageNodes,
    x,
    z,
    phase: windVegetation.length * .93 + x * .045 - z * .03,
  });
  scene.add(group);
}

function createPalmFrondGeometry() {
  const vertices = [];
  const stems = [];
  const frondCount = 10;
  const segments = 9;

  for (let frond = 0; frond < frondCount; frond++) {
    const yaw = frond / frondCount * Math.PI * 2 + (frond % 2) * .08;
    const radialX = Math.cos(yaw);
    const radialZ = Math.sin(yaw);
    const sideX = -radialZ;
    const sideZ = radialX;
    let previous = null;

    for (let segment = 0; segment <= segments; segment++) {
      const t = segment / segments;
      const distance = .34 + t * 3.55;
      const center = {
        x: .32 + radialX * distance,
        y: 7.05 + Math.sin(t * Math.PI) * .78 - t * 1.28,
        z: radialZ * distance,
      };

      if (previous) {
        stems.push(previous.x, previous.y, previous.z, center.x, center.y, center.z);
      }
      previous = center;

      if (segment === 0 || segment === segments) continue;
      const leafletLength = (.64 + Math.sin(t * Math.PI) * .34) * (1 - t * .22);
      const baseSpread = .105 * (1 - t * .45);

      for (const side of [-1, 1]) {
        const alongX = radialX * baseSpread;
        const alongZ = radialZ * baseSpread;
        const tipX = center.x + sideX * leafletLength * side;
        const tipZ = center.z + sideZ * leafletLength * side;
        const tipY = center.y - (.10 + t * .28);

        vertices.push(
          center.x - alongX, center.y + .015, center.z - alongZ,
          center.x + alongX, center.y - .015, center.z + alongZ,
          tipX, tipY, tipZ,
        );
      }
    }
  }

  const leafGeometry = new THREE.BufferGeometry();
  leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  leafGeometry.computeVertexNormals();

  const stemGeometry = new THREE.BufferGeometry();
  stemGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stems, 3));
  return { leafGeometry, stemGeometry };
}

function addPalm(scene, x, z, scale) {
  addCircleCollider(x + .18 * scale, z, Math.max(.34, .42 * scale), 'palm');
  const palm = new THREE.Group();
  const random = visualRandom(Math.abs(Math.floor(x * 191 + z * 109 + scale * 1000)) + 6151);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: random() > .5 ? 0x7c694f : 0x89755a,
    roughness: 1,
  });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x5b4d39, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: random() > .5 ? 0x2f7434 : 0x347d38,
    roughness: .84,
    side: THREE.DoubleSide,
  });
  const stemMaterial = new THREE.LineBasicMaterial({ color: 0x315f2d, transparent: true, opacity: .90 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14, .33, 7.1, 10, 5), trunkMaterial);
  trunk.position.set(.28, 3.55, 0);
  trunk.rotation.z = -.065 + (random() - .5) * .035;
  palm.add(trunk);

  const crown = new THREE.Mesh(new THREE.SphereGeometry(.34, 9, 7), crownMaterial);
  crown.scale.set(1.05, .72, 1);
  crown.position.set(.31, 6.92, 0);
  palm.add(crown);

  const { leafGeometry, stemGeometry } = createPalmFrondGeometry();
  const fronds = new THREE.Mesh(leafGeometry, leafMaterial);
  const stems = new THREE.LineSegments(stemGeometry, stemMaterial);
  fronds.rotation.y = random() * .14;
  stems.rotation.y = fronds.rotation.y;
  fronds.userData.windBaseX = fronds.rotation.x;
  fronds.userData.windBaseZ = fronds.rotation.z;
  stems.userData.windBaseX = stems.rotation.x;
  stems.userData.windBaseZ = stems.rotation.z;
  palm.add(fronds, stems);

  for (let i = 0; i < 5; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(.16 + (i % 2) * .02, 8, 6), crownMaterial);
    const angle = i / 5 * Math.PI * 2;
    nut.position.set(.31 + Math.cos(angle) * .24, 6.72 - (i % 2) * .08, Math.sin(angle) * .24);
    palm.add(nut);
  }

  palm.position.set(x, 0, z);
  palm.scale.setScalar(scale);
  windVegetation.push({
    kind: 'palm',
    fronds,
    stems,
    x,
    z,
    phase: windVegetation.length * .81 + x * .035 + z * .025,
  });
  scene.add(palm);
}

function createNpcUmbrella(index) {
  const colors = [0x2d5f86, 0x8a3f46, 0x3f754d, 0x6e557f, 0xb47b32];
  const root = new THREE.Group();
  const canopyMat = new THREE.MeshStandardMaterial({
    color: colors[index % colors.length],
    roughness: .68,
    metalness: .02,
    side: THREE.DoubleSide,
  });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x3b4142, roughness: .58, metalness: .38 });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(.68, .28, 14, 1, true), canopyMat);
  canopy.position.y = 2.22;
  canopy.rotation.x = Math.PI;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), shaftMat);
  cap.position.y = 2.39;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, 1.25, 6), shaftMat);
  shaft.position.set(.18, 1.68, .02);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.07, .018, 5, 10, Math.PI * 1.2), shaftMat);
  handle.position.set(.18, 1.07, .02);
  handle.rotation.z = Math.PI * .25;
  root.add(canopy, cap, shaft, handle);
  root.visible = false;
  return root;
}

function addPhotoVillager(scene, x, z, distance, speed, offset, scale, options = {}) {
  const index = villagers.length;
  const names = ['Anu', 'Vivek', 'Meera', 'Arun', 'Nisha', 'Riyas', 'Asha', 'Manu', 'Liya', 'Nabeel', 'Sreeja', 'Jose'];
  const gender = index % 2 ? 'male' : 'female';
  const styles = [
    { shirt: 0xa95762, trousers: 0x2e3447, skin: 0xa96d4c, hair: 0x171311, shoes: 0x372b26, accent: 0xd8aa55 },
    { shirt: 0x557a54, trousers: 0x2a3440, skin: 0x915a40, hair: 0x171514, shoes: 0x292522, accent: 0xb88d4c },
    { shirt: 0x4f728f, trousers: 0x303548, skin: 0xb97a57, hair: 0x221713, shoes: 0x3b2c24, accent: 0xc98f5a },
    { shirt: 0x875d45, trousers: 0x293139, skin: 0x855137, hair: 0x141312, shoes: 0x292420, accent: 0xd0b26a },
  ];
  const style = styles[index % styles.length];
  const villager = new THREE.Group();
  const human = createHuman({ gender, ...style, styleSeed: index + 1 });
  human.scale.setScalar(.9 * scale + .2);
  const umbrella = createNpcUmbrella(index);
  umbrella.scale.setScalar(.9 * scale + .2);
  villager.add(human, umbrella);
  attachContactShadow(villager, .46, .31, .17);
  applyDynamicHighQuality(villager);
  villager.position.set(x, 0, z);
  const npcName = options.name || names[index % names.length];
  const behavior = options.behavior || 'patrol';
  villager.userData = {
    human,
    startX: x,
    startZ: z,
    distance,
    speed,
    offset,
    behavior,
    facing: Number(options.facing || 0),
    targetX: Number(options.targetX ?? x),
    targetZ: Number(options.targetZ ?? z),
    crossFromX: Number(options.fromX ?? x),
    crossToX: Number(options.toX ?? x),
    crossingActive: false,
    npc: true,
    name: npcName,
    role: options.role || 'Local',
    baseRole: options.role || 'Local',
    dailySchedule: Array.isArray(options.dailySchedule)
      ? [...options.dailySchedule].sort((a, b) => Number(a.start || 0) - Number(b.start || 0))
      : null,
    lastRoutineStage: -1,
    gender,
    umbrella,
    rainShelterX: Number(options.shelterX ?? x),
    rainShelterZ: Number(options.shelterZ ?? z),
    hasRainShelter: Number.isFinite(Number(options.shelterX)) && Number.isFinite(Number(options.shelterZ)),
    nightHide: !!options.nightHide,
    nightActive: !!options.nightActive,
    routinePhase: Number(options.routinePhase ?? offset),
    npcIndex: index,
    interactionUntil: 0,
    interactionPlayerX: x,
    interactionPlayerZ: z,
    talkCount: 0,
    relationshipId: `npc-${index}`,
    relationship: npcRelationshipForId(`npc-${index}`),
  };
  updateNpcLabel(villager);
  villagers.push(villager);
  scene.add(villager);
}


function addPond(scene, x, z) {
  addCircleCollider(x, z, 8.65, 'water');
  const bank = new THREE.Mesh(new THREE.CircleGeometry(9.8, 40), new THREE.MeshStandardMaterial({ color: 0x907e55, roughness: 1 }));
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(x, .012, z);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(8.8, 40), new THREE.MeshStandardMaterial({ color: 0x2f91ae, roughness: .28, metalness: .09 }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(x, .025, z);
  scene.add(bank, pond);
}

function addBench(scene, x, z) {
  addBoxCollider(x, z, 1.45, .48, 'bench');
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x74462e, roughness: .9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x32383a, roughness: .75, metalness: .35 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.7, .16, .55), wood);
  seat.position.y = .72;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.7, .68, .14), wood);
  back.position.set(0, 1.16, .24);
  [-.98, .98].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.1, .65, .1), metal);
    leg.position.set(xPos, .34, 0);
    group.add(leg);
  });
  group.add(seat, back, missionTag('Rest Bench', '#3b6652'));
  group.position.set(x, 0, z);
  scene.add(group);
}
