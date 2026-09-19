import * as THREE from './vendor/three.module.js';
import { initSocial, api } from './social.js';
import { createAtmosphere } from './environment.js';

const fallback = document.querySelector('#fallback');
const joystickZone = document.querySelector('#joystick-zone');
const joystickBase = document.querySelector('#joystick-base');
const joystickKnob = document.querySelector('#joystick-knob');
const cameraZone = document.querySelector('#camera-zone');
const runButton = document.querySelector('#run');
const worldInteract = document.querySelector('#world-interact');
const vehicleAction = document.querySelector('#vehicle-action');
const driveTools = document.querySelector('#drive-tools');
const hornAction = document.querySelector('#horn-action');
const lightsAction = document.querySelector('#lights-action');
const roadStatus = document.querySelector('#road-status');
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
const minimap = document.querySelector('#minimap');
const mapOpen = document.querySelector('#map-open');
const mapClose = document.querySelector('#map-close');
const mapLabelToggle = document.querySelector('#map-label-toggle');
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
document.querySelector('#hud').append(document.querySelector('#avatar-labels'));
const villagers = [];
const traffic = [];
const staticColliders = [];
const fruitGeometry = new THREE.SphereGeometry(.14, 6, 5);
const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xe4a737, roughness: .72 });
const birdBodyGeometry = new THREE.SphereGeometry(.10, 6, 5);
const birdWingGeometry = new THREE.PlaneGeometry(.28, .055);
const birdMaterial = new THREE.MeshBasicMaterial({ color: 0x202724, side: THREE.DoubleSide });
let villageTime = 0;
let playerRef = null;
let selectedLandmark = null;
let mapLabelsVisible = false;
let activeDmContact = null;
let activeJobMission = null;
let garageSnapshot = null;
let trafficSnapshot = null;
let trafficCheckpointVisual = null;
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
let hornReadyAt = 0;
let hornPulseUntil = 0;
let driveAudioContext = null;
let lastImpactReportAt = 0;
let lastFuelWarningAt = 0;
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
let lastProgressRefresh = 0;
let lastMoveError = 0;
const labelPosition = new THREE.Vector3();
const labelWorldPosition = new THREE.Vector3();
const pointerOrigin = new Map();
let challengeRound = null;
let challengeGeneration = 0;
const districtStarts = {
  Alappuzha: [-34, -13], Ernakulam: [-26, 6], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44]
};
const landmarks = [
  { id: 'bekal', name: 'Bekal Fort', icon: 'F', x: -7, z: 60, district: 'Kasaragod' },
  { id: 'munnar', name: 'Munnar Tea Hills', icon: 'M', x: 42, z: 26, district: 'Idukki' },
  { id: 'kochi', name: 'Mattancherry Palace', icon: 'P', x: -26, z: 6, district: 'Ernakulam' },
  { id: 'alappuzha', name: 'Alappuzha Backwaters', icon: 'B', x: -34, z: -13, district: 'Alappuzha' },
  { id: 'kuttanad', name: 'Kuttanad Fields', icon: 'K', x: 7, z: -23, district: 'Kottayam' },
  { id: 'temple', name: 'Padmanabhaswamy Temple', icon: 'T', x: 13, z: -57, district: 'Thiruvananthapuram' }
];
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

function roadZoneAt(x, z) {
  if (Math.abs(x) <= 7.75) return { id: 'main', label: 'MAIN ROAD', displayLimit: 40, bikeLimit: 6.6, taxiLimit: 6.4 };
  if (x >= -72 && x <= 16 && Math.abs(z + 22) <= 5.75) return { id: 'village', label: 'VILLAGE ROAD', displayLimit: 30, bikeLimit: 4.9, taxiLimit: 4.7 };
  return { id: 'offroad', label: 'OFF ROAD', displayLimit: 20, bikeLimit: 3.25, taxiLimit: 3.0 };
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
  const enabled = vehicleMode !== 'walk' && headlightsOn;
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
}

function toggleVehicleHeadlights() {
  if (vehicleMode === 'walk') return;
  headlightsOn = !headlightsOn;
  applyVehicleHeadlights();
}

function updateDriveHud() {
  const driving = vehicleMode !== 'walk' && !!currentDriveVehicle()?.entered;
  if (driveTools) driveTools.hidden = !driving;
  if (roadStatus) roadStatus.hidden = !driving;
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
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2d6f55, roughness: .78 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x171a1c, roughness: .92 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaab2b3, roughness: .46, metalness: .55 });
  const wheelGeometry = new THREE.TorusGeometry(.34, .075, 8, 18);
  [-.68, .68].forEach(z => {
    const wheel = new THREE.Mesh(wheelGeometry, darkMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, .36, z);
    bike.add(wheel);
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.18, .24, 1.18), frameMat);
  frame.position.set(0, .62, 0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.42, .12, .42), darkMat);
  seat.position.set(0, .95, -.15);
  const front = new THREE.Mesh(new THREE.BoxGeometry(.12, .72, .12), metalMat);
  front.position.set(0, .72, .54);
  front.rotation.x = -.12;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.72, .07, .07), metalMat);
  handle.position.set(0, 1.08, .58);
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe9a2, emissive: 0xffd66b, emissiveIntensity: .28 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 7), lampMaterial);
  lamp.position.set(0, .94, .73);
  const carrier = new THREE.Mesh(new THREE.BoxGeometry(.55, .08, .46), metalMat);
  carrier.position.set(0, .82, -.68);
  bike.add(frame, seat, front, handle, lamp, carrier);
  bike.userData.headlightMaterials = [lampMaterial];
  bike.scale.setScalar(1.12);
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

function restorePlayerVehiclePose() {
  const avatar = playerRef?.userData.avatar;
  if (avatar) {
    avatar.visible = true;
    avatar.position.set(0, .04, 0);
    avatar.rotation.set(0, 0, 0);
  }
  if (runButton) runButton.textContent = 'RUN';
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

  jobVehicleVisual = createJobVehicleVisual(vehicle.kind, source);
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

function updateWorldInteract() {
  if (!worldInteract) return;
  worldInteract.hidden = true;
  worldInteract.disabled = false;
  worldInteract.dataset.mode = '';
  worldInteract.dataset.service = '';
  worldInteract.dataset.source = '';
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
    if (!selectedLandmark) {
      missionText.textContent = 'Explore Kerala landmarks';
      landmarkStatus.textContent = 'Tap TASKS for rewards';
    }
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

window.addEventListener('error', event => {
  console.error(event.error || event.message);
  showAssetNotice('A game error occurred. Reload if the controls stop responding.');
});
window.addEventListener('unhandledrejection', event => {
  console.error(event.reason);
  showAssetNotice('An action could not finish. Please try again.');
});

function newProgress() {
  return { xp: 0, level: 1, walkMeters: 0, visitedLandmarkIds: [], completedTaskIds: [], followingIds: [] };
}

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
  } else if ((user.followers || 0) + (user.following || 0) > 0) finishTask('social');
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



function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.style.display = 'none'; }, 2600);
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
  if (object.userData.npc) {
    const panel = document.querySelector('#npc-profile');
    panel.querySelector('h2').textContent = object.userData.name;
    panel.querySelector('p').textContent = 'Village guide · ' + (object.userData.gender === 'female' ? 'Female' : 'Male') + ' avatar. I live in the village and help bring Kerala to life. Find real players in People to follow and chat.';
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
      const avatar = createHuman({ gender: data.gender, shirt: data.gender === 'female' ? 0xc57e93 : 0x569bb5,
        trousers: 0x293b50, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x2c2825, accent: 0xe5bb51 });
      remote.add(avatar); remote.position.set(data.x, 0, data.z);
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
    remote.userData.target.set(data.x, 0, data.z);
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
  for (const remote of remotePlayers.values()) {
    const predictionAge = remote.userData.moving ? Math.min(.28, Math.max(0, (networkNow - remote.userData.targetAt) / 1000)) : 0;
    remote.userData.predicted.copy(remote.userData.target).addScaledVector(remote.userData.velocity, predictionAge);
    remote.userData.predicted.x = THREE.MathUtils.clamp(remote.userData.predicted.x, -110, 110);
    remote.userData.predicted.z = THREE.MathUtils.clamp(remote.userData.predicted.z, -110, 110);
    remote.position.lerp(remote.userData.predicted, 1 - Math.exp(-delta * 10));
    remote.rotation.y = rotateTowards(remote.rotation.y, remote.userData.yaw, delta * 12);
    remote.userData.phase += delta * 9;
    animatePlayer(remote, remote.userData.phase, remote.userData.moving && remote.userData.mode === 'walk' ? 1 : 0);
  }
  camera.updateMatrixWorld();
  for (const object of [playerRef, ...villagers, ...remotePlayers.values()]) {
    if (!object?.userData.label) continue;
    const label = object.userData.label;
    object.getWorldPosition(labelWorldPosition);
    const distance = camera.position.distanceTo(labelWorldPosition);
    labelPosition.copy(labelWorldPosition); labelPosition.y += 2.65;
    labelPosition.project(camera);
    const visible = !!profile && object.visible && !!label.textContent && distance < 45 && labelPosition.z > -1 && labelPosition.z < 1 && Math.abs(labelPosition.x) < .95 && Math.abs(labelPosition.y) < .93;
    label.hidden = !visible;
    if (visible) label.style.transform = 'translate(-50%, -100%) translate(' + ((labelPosition.x + 1) * innerWidth / 2).toFixed(1) + 'px,' + ((1 - labelPosition.y) * innerHeight / 2).toFixed(1) + 'px)';
  }
}

async function sendMovement(player, moving) {
  const now = performance.now();
  const stateChanged = moving !== lastMovementMoving;
  if (!profile || !connectionReady || document.hidden || movementPending || (!stateChanged && now - lastMovementSend < (moving ? 250 : 1500))) return;
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
  if (!profile || !playerRef) return;
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

function showAssetNotice(message) {
  assetNotice.textContent = message;
  assetNotice.style.display = 'block';
  clearTimeout(showAssetNotice.timer);
  showAssetNotice.timer = setTimeout(() => { assetNotice.style.display = 'none'; }, 5200);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function worldToKeralaMap(worldX, worldZ) {
  const bands = [[0,52,7],[.12,56,13],[.28,60,19],[.44,62,20],[.60,65,20],[.76,62,18],[.90,58,14],[1,54,7]];
  const t = clamp((70 - worldZ) / 140, 0, 1);
  let index = 0;
  while (index < bands.length - 2 && t > bands[index + 1][0]) index++;
  const [t0, center0, half0] = bands[index];
  const [t1, center1, half1] = bands[index + 1];
  const localT = (t - t0) / (t1 - t0);
  return { x: lerp(center0, center1, localT) + clamp(worldX / 70, -1, 1) * (lerp(half0, half1, localT) - 4), y: 16 + t * 268 };
}

function renderMapLandmarks() {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  mapLayer.replaceChildren();
  landmarks.forEach(landmark => {
    const point = worldToKeralaMap(landmark.x, landmark.z);
    const marker = document.createElementNS(svgNamespace, 'g');
    marker.setAttribute('class', 'landmark-marker');
    marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    marker.setAttribute('aria-label', landmark.name);
    const pin = document.createElementNS(svgNamespace, 'circle');
    pin.setAttribute('class', 'pin'); pin.setAttribute('r', '5.8');
    const label = document.createElementNS(svgNamespace, 'text');
    label.textContent = landmark.icon;
    const caption = document.createElementNS(svgNamespace, 'text');
    caption.textContent = landmark.name.replace('Padmanabhaswamy ', '').replace('Mattancherry ', '');
    caption.setAttribute('y', '11'); caption.setAttribute('font-size', '5.2'); caption.setAttribute('fill', '#fff'); caption.setAttribute('text-anchor', 'middle');
    caption.style.display = mapLabelsVisible ? 'block' : 'none';
    marker.append(pin, label, caption);
    marker.addEventListener('click', event => { event.stopPropagation(); setWaypoint(landmark); });
    mapLayer.append(marker);
  });
}

function setWaypoint(landmark) {
  selectedLandmark = landmark;
  missionText.textContent = `Travel to ${landmark.name}`;
  landmarkStatus.textContent = `${landmark.district} landmark selected`;
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
  if (selectedLandmark) {
    const activeLandmark = selectedLandmark;
    const target = worldToKeralaMap(activeLandmark.x, activeLandmark.z);
    mapRoute.setAttribute('x1', point.x); mapRoute.setAttribute('y1', point.y);
    mapRoute.setAttribute('x2', target.x); mapRoute.setAttribute('y2', target.y);
    mapRoute.hidden = false;
    const distance = Math.hypot(activeLandmark.x - player.position.x, activeLandmark.z - player.position.z);
    if (distance < 5.2) {
      markLandmarkVisited(activeLandmark);
      selectedLandmark = null;
      missionText.textContent = `Visited ${activeLandmark.name}`;
      landmarkStatus.textContent = 'Landmark reward collected · choose another place';
      mapRoute.hidden = true;
      mapStatus.textContent = `${activeLandmark.name} · visited`;
    } else {
      mapStatus.textContent = `${activeLandmark.name} · ${Math.ceil(distance)} m`;
    }
  } else {
    mapRoute.hidden = true;
    mapStatus.textContent = `${profile?.district || 'Kerala'} · You`;
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

function wireInterface() {
  updateProfileHud(); updateProgressHud(); renderTasks(); renderMapLandmarks(); setOpenPanel();
  mapOpen.addEventListener('click', () => setOpenPanel(minimap.classList.contains('open') ? null : 'map'));
  mapClose.addEventListener('click', () => setOpenPanel());
  mapLabelToggle.addEventListener('click', () => {
    mapLabelsVisible = !mapLabelsVisible;
    mapLabelToggle.textContent = mapLabelsVisible ? 'Labels on' : 'Labels'; renderMapLandmarks();
  });
  taskToggle.addEventListener('click', () => setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks'));
  fullscreenToggle?.addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch { showToast('Fullscreen is unavailable in this browser'); } });
  taskClose.addEventListener('click', () => setOpenPanel());
  missionCard.addEventListener('click', () => { if (activeJobMission) document.querySelector('#jobs-toggle')?.click(); else setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks'); });
  challengePlay.addEventListener('click', playCoconutChallenge);
  document.querySelector('#npc-profile .panel-close').addEventListener('click', () => { document.querySelector('#npc-profile').hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { setOpenPanel(); document.querySelector('#npc-profile').hidden = true; } });
}

social = initSocial({ onUser: acceptUser, onPlayers: players => { connectionReady = true; synchronizePlayers(players); },
  onDisconnect: () => { connectionReady = false; synchronizePlayers([]); }, onToast: showToast });

try {
  const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
  let renderScale = isMobile ? 0.72 : 1;
  function applyRenderScale() { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? renderScale : 1.25)); renderer.setSize(window.innerWidth, window.innerHeight, false); }
  applyRenderScale();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
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
  buildWorld(scene);
  buildLandmarkWorld(scene);
  buildPlayer(player);
  syncJobWorldVisual();
  player.visible = !!profile;
  if (profile && Number.isFinite(profile.x) && Number.isFinite(profile.z)) {
    player.position.set(profile.x, 0, profile.z);
    if (Number.isFinite(profile.rotation)) player.rotation.y = profile.rotation;
  } else if (profile) placePlayerAtDistrict(profile.district);
  wireInterface();
  updateMapPlayer(player);

  const sun = new THREE.HemisphereLight(0xeaf7ff, 0x486231, 2.25);
  scene.add(sun);
  const warmLight = new THREE.DirectionalLight(0xfff1d0, 1.5);
  warmLight.position.set(35, 55, 25);
  scene.add(warmLight);
  atmosphere = createAtmosphere(THREE, { scene, renderer, camera, sun: warmLight, hemi: sun });

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
  let walkPhase = 0;
  let perfFrames = 0, perfTime = performance.now(), perfCooldown = 0;
  let npcAccumulator = 0, trafficAccumulator = 0, mapAccumulator = 0;
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
    cameraYaw -= (event.clientX - lastLookX) * .009;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + (event.clientY - lastLookY) * .006, .12, .64);
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  });
  function clearLook(event) { if (!event || event.pointerId === lookPointerId) lookPointerId = null; }
  cameraZone.addEventListener('pointerup', clearLook);
  cameraZone.addEventListener('pointercancel', clearLook);
  cameraZone.addEventListener('lostpointercapture', clearLook);

  function setRun(value) {
    runHeld = value;
    runButton.classList.toggle('active', value);
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
  window.addEventListener('pointerup', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
    if (event.pointerId === lookPointerId) clearLook(event);
    if (event.pointerId === runPointerId) clearRun(event);
  }, true);
  window.addEventListener('pointercancel', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
    if (event.pointerId === lookPointerId) clearLook(event);
    if (event.pointerId === runPointerId) clearRun(event);
  }, true);

  function typingIntoField(event) {
    return event.target instanceof Element && event.target.matches('input, select, textarea, [contenteditable]');
  }
  function clearGameInput() {
    keys.clear();
    clearJoystick();
    setRun(false);
    runPointerId = null;
    lookPointerId = null;
    driveSpeed = 0;
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
    if (atmosphere) atmosphere.applyQuality(); else applyRenderScale();
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
    villageTime += delta;
    npcAccumulator += delta; trafficAccumulator += delta; mapAccumulator += delta;
    if (npcAccumulator >= (isMobile ? .10 : .05)) { updateVillagers(villageTime); npcAccumulator = 0; }
    if (trafficAccumulator >= (isMobile ? .05 : .025)) { updateTraffic(trafficAccumulator); trafficAccumulator = 0; }
    animateJobMissionVisual(villageTime);
    updateWorldInteract();
    const keyboardX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    const keyboardY = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    const controlX = Math.abs(keyboardX) > 0 ? keyboardX : inputX;
    const controlY = Math.abs(keyboardY) > 0 ? keyboardY : inputY;
    const paused = !profile || !connectionReady || !!document.querySelector('[aria-modal="true"]:not([hidden])');
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

      const rawThrottle = paused ? 0 : THREE.MathUtils.clamp(-controlY, -1, 1);
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
      const roadZone = roadZoneAt(player.position.x, player.position.z);
      const driveVehicle = currentDriveVehicle();
      const condition = Math.max(15, Math.min(100, Number(driveVehicle?.condition ?? 100)));
      const conditionFactor = .62 + .38 * (condition / 100);
      const fuel = Math.max(0, Number(driveVehicle?.fuel ?? 100));
      const maxForward = (vehicleMode === 'bike' ? roadZone.bikeLimit : roadZone.taxiLimit) * conditionFactor * (fuel <= .05 ? 0 : 1);
      const maxReverse = fuel <= .05 ? 0 : Math.min(vehicleMode === 'bike' ? 2.6 : 2.4, Math.max(.8, maxForward * .48));
      const targetSpeed = runHeld ? 0 : (throttle >= 0 ? throttle * maxForward : throttle * maxReverse);
      const response = runHeld ? 9 : (Math.abs(throttle) > .01 ? 2.25 : 3.6);
      driveSpeed += (targetSpeed - driveSpeed) * Math.min(1, delta * response);
      if (Math.abs(driveSpeed) < .03) driveSpeed = 0;
      const speedRatio = maxForward > .01 ? Math.min(1, Math.abs(driveSpeed) / maxForward) : 0;

      if (Math.abs(driveSpeed) > .035) {
        player.rotation.y -= steering * delta * (.72 + speedRatio * .9) * (driveSpeed >= 0 ? 1 : -1);
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

      if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * 2.5);
      animatePlayer(player, walkPhase, 0);
      if (mapAccumulator >= .12) { updateMapPlayer(player); mapAccumulator = 0; }
    } else {
      driveSpeed = 0;
      const walkingInput = controlLength > .08;
      if (walkingInput) {
        moveForward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        moveRight.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        desiredMove.copy(moveForward).multiplyScalar(-controlY).addScaledVector(moveRight, controlX);
        if (desiredMove.lengthSq() > .0001) desiredMove.normalize();
        const inputCurve = Math.pow(controlLength, 1.55);
        const maxWalkSpeed = runHeld ? 5.4 : 3.05;
        targetWalkVelocity.copy(desiredMove).multiplyScalar(maxWalkSpeed * inputCurve);
      } else {
        targetWalkVelocity.set(0, 0, 0);
      }

      const walkResponse = walkingInput ? (runHeld ? 5.2 : 6.8) : 11.5;
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
        addWalkProgress(movedDistance);
        if (movedDistance > .0005) {
          const actualX = player.position.x - beforeX;
          const actualZ = player.position.z - beforeZ;
          const desiredYaw = Math.atan2(actualX, actualZ);
          const turnSpeed = runHeld ? 5.6 : 6.8;
          player.rotation.y = rotateTowards(player.rotation.y, desiredYaw, delta * turnSpeed);
          if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * .82);
          const animationAmount = Math.min(1, movedDistance / Math.max(.0001, (runHeld ? 5.4 : 3.05) * delta));
          walkPhase += delta * (runHeld ? 12 : 8) * Math.max(.22, animationAmount);
          animatePlayer(player, walkPhase, animationAmount);
          movingNow = true;
          if (mapAccumulator >= .15) { updateMapPlayer(player); mapAccumulator = 0; }
        } else {
          walkVelocity.multiplyScalar(.35);
          animatePlayer(player, walkPhase, 0);
        }
      } else {
        animatePlayer(player, walkPhase, 0);
      }
    }

    cameraTarget.set(player.position.x, player.position.y + (vehicleMode === 'taxi' ? 1.35 : 1.45), player.position.z);
    const distance = vehicleMode === 'taxi' ? 8.8 : vehicleMode === 'bike' ? 7.8 : 7.1;
    const horizontal = Math.cos(cameraPitch) * distance;
    cameraPosition.set(
      player.position.x + Math.sin(cameraYaw) * horizontal,
      player.position.y + 1.45 + Math.sin(cameraPitch) * distance,
      player.position.z + Math.cos(cameraYaw) * horizontal
    );
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 9));
    camera.lookAt(cameraTarget);
    updateRemotePlayers(delta, camera);
    updateVehicleAction();
    updateDriveHud();
    sendMovement(player, movingNow);
    atmosphere.update(delta, villageTime, { moving: movingNow, running: vehicleMode === 'walk' && runHeld, nearWater: Math.hypot(player.position.x - 39, player.position.z + 4) < 15 || Math.hypot(player.position.x + 34, player.position.z + 13) < 13, inChallenge: !!challengeRound });
    renderer.render(scene, camera);
    if (isMobile && !atmosphere) {
      perfFrames++; const now = performance.now();
      if (now - perfTime >= 2000) {
        const fps = perfFrames * 1000 / (now - perfTime); perfFrames = 0; perfTime = now;
        if (perfCooldown > 0) perfCooldown--;
        else if (fps < 22 && renderScale > .48) { renderScale = Math.max(.48, renderScale - .08); applyRenderScale(); perfCooldown = 2; }
        else if (fps > 42 && renderScale < .82) { renderScale = Math.min(.82, renderScale + .04); applyRenderScale(); perfCooldown = 3; }
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
  player.add(shadow);
  player.userData.shadow = shadow;
  replacePlayerAvatar(profile?.gender || 'male');
  updateNameLabel(player, profile?.username || '', profile?.id);
}

function replacePlayerAvatar(gender) {
  if (!playerRef) return;
  const oldAvatar = playerRef.userData.avatar;
  if (oldAvatar) { playerRef.remove(oldAvatar); disposeObject(oldAvatar); }
  const avatarStyle = gender === 'female'
    ? { gender: 'female', shirt: 0x1e8173, trousers: 0x273253, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x6c3c2c, accent: 0xe5bb51 }
    : { gender: 'male', shirt: 0x2a759b, trousers: 0x26354a, skin: 0xa96d4c, hair: 0x171616, shoes: 0x27231f, accent: 0x6eaad0 };
  const avatar = createHuman(avatarStyle);
  avatar.position.y = .04;
  playerRef.add(avatar);
  playerRef.userData.avatar = avatar;
}

function createHuman({ gender = 'male', shirt, trousers, skin, hair, shoes, accent = 0xffffff }) {
  const person = new THREE.Group();
  const isFemale = gender === 'female';
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: .82 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: trousers, roughness: .9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .88 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 1 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: .95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .8 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f5ec, roughness: .5 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x251b17, roughness: .55 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7d3734, roughness: .65 });

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(isFemale ? .30 : .28, isFemale ? .33 : .31, .27, 10), trouserMat);
  hips.position.y = .94;
  person.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(isFemale ? .32 : .34, isFemale ? .58 : .62, 7, 12), shirtMat);
  torso.scale.set(isFemale ? .94 : 1, 1.08, .82);
  torso.position.y = 1.37;
  person.add(torso);
  if (isFemale) {
    const kurta = new THREE.Mesh(new THREE.BoxGeometry(.67, .75, .40), shirtMat);
    kurta.position.set(0, 1.30, .01);
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(.39, .27, .55, 12), accentMat);
    hem.position.set(0, .92, .01);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(.10, .82, .46), accentMat);
    scarf.position.set(.30, 1.37, -.03);
    person.add(kurta, hem, scarf);
  } else {
    const belt = new THREE.Mesh(new THREE.BoxGeometry(.60, .08, .38), accentMat);
    belt.position.y = 1.00;
    person.add(belt);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .13, .18, 9), skinMat);
  neck.position.y = 1.87;
  person.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.265, 14, 11), skinMat);
  head.scale.set(.88, 1.08, .92);
  head.position.y = 2.1;
  person.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.277, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55), hairMat);
  hairCap.scale.set(.9, 1.08, .95);
  hairCap.position.y = 2.19;
  person.add(hairCap);
  if (isFemale) {
    const hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .54, 5, 10), hairMat);
    hairBack.position.set(0, 1.93, -.16);
    hairBack.scale.set(1.12, 1, .45);
    const hairLeft = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .38, 5, 8), hairMat);
    const hairRight = hairLeft.clone();
    hairLeft.position.set(-.21, 1.99, -.02);
    hairRight.position.set(.21, 1.99, -.02);
    person.add(hairBack, hairLeft, hairRight);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 7), skinMat);
  nose.scale.set(.75, 1.1, 1.3);
  nose.position.set(0, 2.09, .245);
  person.add(nose);
  [-.095, .095].forEach(x => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 7), white);
    eyeWhite.scale.z = .45;
    eyeWhite.position.set(x, 2.16, .224);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.02, 7, 6), eye);
    pupil.position.set(x, 2.16, .25);
    person.add(eyeWhite, pupil);
  });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.09, .018, .012), mouthMat);
  mouth.position.set(0, 2.0, .25);
  person.add(mouth);

  const parts = {};
  [['leftArm', -.39, -.10], ['rightArm', .39, .10]].forEach(([name, x, tilt]) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(x, 1.61, 0);
    pivot.rotation.z = tilt;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.115, isFemale ? .31 : .25, 5, 9), shirtMat);
    sleeve.position.y = isFemale ? -.19 : -.16;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.088, .28, 5, 9), skinMat);
    forearm.position.y = -.47;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.1, 9, 8), skinMat);
    hand.position.y = -.67;
    pivot.add(sleeve, forearm, hand);
    person.add(pivot);
    parts[name] = pivot;
  });
  [['leftLeg', -.15], ['rightLeg', .15]].forEach(([name, x]) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(x, .9, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .58, 5, 9), trouserMat);
    leg.position.y = -.38;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.2, .14, .37), shoeMat);
    foot.position.set(0, -.72, .1);
    pivot.add(leg, foot);
    person.add(pivot);
    parts[name] = pivot;
  });
  person.userData.parts = parts;
  person.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return person;
}

function animatePlayer(player, phase, moving) {
  const bob = moving ? Math.abs(Math.sin(phase)) * .035 : 0;
  const avatar = player.userData.avatar;
  if (!avatar) return;
  avatar.position.y = .04 + bob;
  avatar.rotation.z = moving ? Math.sin(phase * .5) * .012 : 0;
  player.userData.shadow?.scale.setScalar(1 - bob * 2.3);
  animateHuman(avatar, phase, moving);
}

function animateHuman(human, phase, moving) {
  const parts = human.userData.parts;
  const swing = moving ? Math.sin(phase) * .52 : 0;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
}

function updateVillagers(time) {
  villagers.forEach(villager => {
    const pace = (Math.sin(time * villager.userData.speed + villager.userData.offset) + 1) * .5;
    villager.position.z = villager.userData.startZ + Math.sin(time * villager.userData.speed + villager.userData.offset) * villager.userData.distance;
    villager.rotation.y = Math.cos(time * villager.userData.speed + villager.userData.offset) > 0 ? 0 : Math.PI;
    if (villager.userData.photo) {
      villager.userData.photo.position.y = .025 + Math.abs(Math.sin(time * villager.userData.speed * 6)) * .018;
      animateHuman(villager.userData.human, time * villager.userData.speed * 7, .55 + pace * .45);
    } else {
      animateHuman(villager.userData.human, time * villager.userData.speed * 7, .55 + pace * .45);
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
  const bus = config?.kind === 'bus';
  const halfWidth = bus ? 1.22 : .86;
  const halfLength = bus ? 2.72 : 1.66;
  return config?.axis === 'x'
    ? { halfWidth: halfLength, halfDepth: halfWidth }
    : { halfWidth, halfDepth: halfLength };
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

function buildWorld(scene) {
  staticColliders.length = 0;
  const groundCanvas = document.createElement('canvas'); groundCanvas.width = groundCanvas.height = 128;
  const groundContext = groundCanvas.getContext('2d');
  groundContext.fillStyle = '#65854a'; groundContext.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2400; i++) { groundContext.fillStyle = i % 3 ? '#779655' : '#54713c'; groundContext.fillRect((i * 47) % 128, (i * 73 + Math.floor(i / 128) * 29) % 128, 2, 2); }
  const texture = new THREE.CanvasTexture(groundCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(32, 32);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);


  const roadMat = new THREE.MeshStandardMaterial({ color: 0x34393b, roughness: .94, metalness: .02 });
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
  for (let x = -68; x <= 12; x += 9) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .18), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, .031, -22);
    scene.add(line);
  }
  addRoadVehicle(scene, { kind: 'car', axis: 'z', fixed: -3.1, min: -76, max: 76, progress: -52, direction: 1, speed: 7.0, color: 0xd44737 });
  addRoadVehicle(scene, { kind: 'bus', axis: 'z', fixed: 3.2, min: -76, max: 76, progress: 61, direction: -1, speed: 5.0, color: 0xd9b32d });
  addRoadVehicle(scene, { kind: 'car', axis: 'x', fixed: -24.5, min: -69, max: 10, progress: -60, direction: 1, speed: 6.3, color: 0x427eb5 });

  addPhotoHouse(scene, -24, -36, 10.2, 6.8);
  addPhotoHouse(scene, 28, 24, 8.8, 5.9);
  addPhotoHouse(scene, -36, 33, 9.4, 6.25);
  addPhotoHouse(scene, 18, -32, 8.6, 5.75);
  const treePositions = [[-15,-62],[14,-55],[-20,-47],[20,-42],[-18,-20],[17,-10],[-18,5],[18,9],[-16,34],[16,43],[-14,61],[17,66],[-50,-20],[-45,14],[-42,48],[46,-42],[42,4],[47,52]];
  treePositions.forEach(([x, z], i) => addPalm(scene, x, z, .72 + (i % 3) * .09));
  [[-43,-35,1.08],[41,-29,1.15],[-48,41,.96],[45,39,1.04],[-27,-13,.88],[30,6,.8],[-28,57,.85]].forEach(([x, z, scale]) => addPalm(scene, x, z, scale));
  [[-43,-49,.88],[39,-25,.94],[-42,27,.90],[43,43,.92]].forEach(([x, z, scale]) => addTree(scene, x, z, scale, true));
  addBird(scene, -43.4, 5.15, -48.7, .6);
  addBird(scene, 39.4, 5.6, -24.8, -.8);
  addBird(scene, -42.4, 5.2, 26.5, 1.1);
  addBird(scene, 42.4, 5.4, 42.6, -.45);
  addPond(scene, 39, -4);
  addBench(scene, -10, -10);
  addFuelStation(scene, 11, -12);
  addServiceGarage(scene, -36, -15);
  addTrafficCheckpoint(scene, 5.4, 18);
  addPhotoVillager(scene, -6, -50, 11, .55, 0, .78);
  addPhotoVillager(scene, 10, -5, 8, .45, 2, .72);
  addPhotoVillager(scene, -9, 19, 8, .5, 4, .75);
  addPhotoVillager(scene, 10, 50, 7, .42, 1, .68);
}

function buildLandmarkWorld(scene) {
  addFortLandmark(scene, -7, 60);
  addTeaHills(scene, 42, 26);
  addPalaceLandmark(scene, -26, 6);
  addBackwaterHouseboat(scene, -34, -13);
  addPaddyFields(scene, 7, -23);
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
  const width = isBus ? 2.25 : 1.55;
  const length = isBus ? 5.15 : 3.05;
  const vehicle = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: .78 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x193543, roughness: .3, metalness: .1 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x16191b, roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, isBus ? 1.30 : .68, length), paint);
  body.position.y = isBus ? .90 : .55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - .16, isBus ? .62 : .54, isBus ? 3.85 : 1.62), glass);
  cabin.position.y = isBus ? 1.64 : 1.12;
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(width - .27, isBus ? .42 : .30, .055), glass);
  windscreen.position.set(0, isBus ? 1.63 : 1.12, length / 2 + .03);
  const headlightMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffd56b, emissiveIntensity: .22, roughness: .42 });
  const leftLamp = new THREE.Mesh(new THREE.SphereGeometry(isBus ? .10 : .085, 7, 6), headlightMaterial);
  const rightLamp = leftLamp.clone();
  leftLamp.position.set(-width * .29, isBus ? .82 : .62, length / 2 + .08);
  rightLamp.position.set(width * .29, isBus ? .82 : .62, length / 2 + .08);
  vehicle.add(body, cabin, windscreen, leftLamp, rightLamp);
  vehicle.userData.headlightMaterials = [headlightMaterial];
  if (isBus) {
    for (let row = -1.25; row <= 1.25; row += .82) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(.045, .34, .56), glass);
      const opposite = window.clone();
      window.position.set(width / 2 + .025, 1.66, row);
      opposite.position.set(-width / 2 - .025, 1.66, row);
      vehicle.add(window, opposite);
    }
  }
  [-length * .31, length * .31].forEach(zPos => {
    [-width / 2, width / 2].forEach(xPos => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.20, .20, .12, 10), tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(xPos, .22, zPos);
      vehicle.add(wheel);
    });
  });
  return vehicle;
}

function addRoadVehicle(scene, config) {
  const vehicle = createRoadVehicle(config.kind, config.color);
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
  traffic.forEach(vehicle => {
    const config = vehicle.userData.traffic;
    const baseSpeed = Number(config.baseSpeed || config.speed || 0);
    let targetSpeed = baseSpeed;

    if (playerRef && vehicleMode !== 'walk') {
      const playerDistance = Math.hypot(playerRef.position.x - vehicle.position.x, playerRef.position.z - vehicle.position.z);
      if (playerDistance < 3.8) targetSpeed = 0;
      else if (playerDistance < 6.2) targetSpeed = Math.min(targetSpeed, baseSpeed * .18);
      else if (playerDistance < 9.5) targetSpeed = Math.min(targetSpeed, baseSpeed * .52);
      if (performance.now() < hornPulseUntil && playerDistance < 11) targetSpeed = Math.min(targetSpeed, baseSpeed * .22);
    }

    for (const other of traffic) {
      if (other === vehicle) continue;
      const otherConfig = other.userData.traffic;
      if (otherConfig.axis !== config.axis || Math.abs(Number(otherConfig.fixed) - Number(config.fixed)) > 1.1) continue;
      const gap = (Number(otherConfig.progress) - Number(config.progress)) * Number(config.direction);
      if (gap > 0 && gap < 4.4) targetSpeed = 0;
      else if (gap >= 4.4 && gap < 8) targetSpeed = Math.min(targetSpeed, baseSpeed * .35);
    }

    if (config.axis === 'x') {
      const distanceToCrossing = (0 - Number(config.progress)) * Number(config.direction);
      const mainRoadTrafficNear = traffic.some(other => {
        const otherConfig = other.userData.traffic;
        return otherConfig.axis === 'z' && Math.abs(other.position.z + 24.5) < 7.5;
      });
      if (distanceToCrossing > 1.5 && distanceToCrossing < 11 && mainRoadTrafficNear) targetSpeed = 0;
    }

    const response = targetSpeed < Number(config.currentSpeed) ? 4.6 : 1.9;
    config.currentSpeed += (targetSpeed - Number(config.currentSpeed)) * Math.min(1, delta * response);
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
    if (wrapped) config.currentSpeed = baseSpeed;
    config.progress = nextProgress;
    if (config.axis === 'z') vehicle.position.z = config.progress;
    else vehicle.position.x = config.progress;
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
  if (typeof isMobile !== 'undefined' && isMobile) return;
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
  scene.add(bird);
}

function addPhotoHouse(scene, x, z) { addHouse(scene, x, z, 0xf0e5d1, 0x9e533a); }


function addHouse(scene, x, z, wallColor, roofColor) {
  addBoxCollider(x, z, 4.45, 3.95, 'house');
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: .98 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x573a2b, roughness: .92 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x6fa4b8, roughness: .2, metalness: .14 });
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
  for (let xTile = -4.15; xTile <= 4.15; xTile += 1.18) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.88, .07, 4.45), new THREE.MeshStandardMaterial({ color: 0xb46244, roughness: 1 }));
    tile.rotation.x = -.52;
    tile.position.set(xTile, 5.71, 1.39);
    group.add(tile);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, .12), darkWood);
  door.position.set(0, 1.6, 3.82);
  group.add(door);
  [[-2.75, 3.82], [2.75, 3.82]].forEach(([windowX, windowZ]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.42, .13), darkWood);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.17, .145), windowMat);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .16), darkWood);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.48, .08, .16), darkWood);
    frame.position.set(windowX, 2.65, windowZ);
    glass.position.set(windowX, 2.65, windowZ + .01);
    vertical.position.set(windowX, 2.65, windowZ + .02);
    horizontal.position.set(windowX, 2.65, windowZ + .02);
    group.add(frame, glass, vertical, horizontal);
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
  group.position.set(x, 0, z);
  scene.add(group);
}

function addShop(scene, x, z) {
  addBoxCollider(x, z, 4.8, 3.0, 'shop');
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.8, 5.8), new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: .92 }));
  body.position.y = 1.9;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(10.1, .35, 1.8), new THREE.MeshStandardMaterial({ color: 0xb83f36, roughness: .9 }));
  awning.position.set(0, 3.35, 3.2);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.5, .9, .1), new THREE.MeshStandardMaterial({ color: 0x276a7e, roughness: .72 }));
  sign.position.set(0, 4.25, 2.93);
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.05, .12), new THREE.MeshStandardMaterial({ color: 0x6e5845, roughness: 1 }));
  shutter.position.set(0, 1.82, 2.96);
  group.add(body, awning, sign, shutter);
  group.position.set(x, 0, z);
  scene.add(group);
}

function addTree(scene, x, z, scale, withFruit = false) {
  addCircleCollider(x, z, Math.max(.42, .58 * scale), 'tree');
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x65442e, roughness: 1 });
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x77503a, roughness: 1 });
  const foliageMats = [0x1d5e2e, 0x29773a, 0x3b843d].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25, .43, 4.2, 8), trunkMat);
  trunk.position.y = 2.1;
  group.add(trunk);
  [[-.65,4.1,.65],[.7,4.35,-.25],[0,4.85,.55]].forEach(([bx, by, bz], i) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.09, .17, 1.6, 7), branchMat);
    branch.position.set(bx * .45, by, bz * .25);
    branch.rotation.z = bx < 0 ? .76 : -.72;
    branch.rotation.x = bz * .32;
    group.add(branch);
  });
  [[0,5.2,0,2.1],[-1.15,4.9,.2,1.48],[1.2,4.9,-.15,1.55],[.35,6.1,.1,1.4],[-.45,5.65,-.85,1.25],[.75,5.55,.82,1.2]].forEach(([lx, ly, lz, radius], i) => {
    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), foliageMats[i % foliageMats.length]);
    leaves.scale.set(1.08, .84, 1);
    leaves.position.set(lx, ly, lz);
    group.add(leaves);
  });
  if (withFruit) addFruitClusters(group);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  scene.add(group);
}

function addPalm(scene, x, z, scale) {
  addCircleCollider(x + .2 * scale, z, Math.max(.34, .42 * scale), 'palm');
  const palm = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x84735a, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x357b32, roughness: .82, side: THREE.DoubleSide });
  const leaflets = new THREE.InstancedMesh(new THREE.PlaneGeometry(.13, 1), leafMaterial, 144);
  const leafletPose = new THREE.Object3D();
  let leafletIndex = 0;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .3, 7, 9, 5), trunkMaterial);
  trunk.position.set(.3, 3.5, 0); trunk.rotation.z = -.08; palm.add(trunk);
  for (let i = 0; i < 9; i++) {
    const yaw = i * Math.PI * 2 / 9;
    const points = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8; points.push(new THREE.Vector3(.58 + Math.cos(yaw) * t * 3.2, 7 + Math.sin(t * Math.PI) * .7 - t * 1.1, Math.sin(yaw) * t * 3.2)); }
    const curve = new THREE.CatmullRomCurve3(points);
    palm.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .035, 4, false), leafMaterial));
    for (let j = 1; j < 9; j++) {
      const point = curve.getPoint(j / 10);
      for (const side of [-1, 1]) {
        leafletPose.position.copy(point); leafletPose.rotation.set(-Math.PI / 2 + .3, 0, -yaw + side * .6);
        leafletPose.scale.set(1, .9 * (1 - j / 12), 1); leafletPose.updateMatrix();
        leaflets.setMatrixAt(leafletIndex++, leafletPose.matrix);
      }
    }
  }
  palm.add(leaflets);
  for (let i = 0; i < 4; i++) { const nut = new THREE.Mesh(new THREE.SphereGeometry(.19, 7, 6), trunkMaterial); nut.position.set(.58 + Math.sin(i * 2) * .25, 6.8, Math.cos(i * 2) * .25); palm.add(nut); }
  palm.position.set(x, 0, z); palm.scale.setScalar(scale); scene.add(palm);
}

function addPhotoVillager(scene, x, z, distance, speed, offset, scale) {
  const index = villagers.length;
  const names = ['Anu', 'Vivek', 'Meera', 'Arun'];
  const gender = index % 2 ? 'male' : 'female';
  const villager = new THREE.Group();
  const human = createHuman({ gender, shirt: index % 2 ? 0x6d8d5a : 0xb36c70, trousers: 0x242b35, skin: 0x9d6245, hair: 0x161310, shoes: 0x2b2723 });
  human.scale.setScalar(.9 * scale + .2); villager.add(human); villager.position.set(x, 0, z);
  villager.userData = { human, startZ: z, distance, speed, offset, npc: true, name: names[index], gender };
  updateNameLabel(villager, names[index] + ' · Guide', 'npc-' + index);
  villagers.push(villager); scene.add(villager);
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
  group.add(seat, back);
  group.position.set(x, 0, z);
  scene.add(group);
}
