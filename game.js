import * as THREE from './vendor/three.module.js';
import { initSocial, api } from './social.js?v=114.0';
import { createAtmosphere } from './environment.js?v=114.0';
import { KERALA_DISTRICT_ATLAS } from './district-atlas.js?v=114.0';
import { GENERIC_DISTRICT_FRUIT_TREES, GENERIC_DISTRICT_OFFICE, genericDistrictFuelPosition, genericDistrictRoads } from './district-layout.js?v=114.0';

const busDestinationSignMaterials = new Map();
const busDestinationSignGeometry = new THREE.PlaneGeometry(1.30, .15);
const roadVehiclePlateMaterials = new Map();
const keralaPlateDistrictCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'];
let nextRoadVehiclePlateIndex = 0;
let vehicleTireTreadBumpMap = null;
let treeCanopyTexture = null;
let treeBarkBumpMap = null;

const fallback = document.querySelector('#fallback');
const joystickZone = document.querySelector('#joystick-zone');
const joystickBase = document.querySelector('#joystick-base');
const joystickKnob = document.querySelector('#joystick-knob');
const cameraZone = document.querySelector('#camera-zone');
const runButton = document.querySelector('#run');
const jumpButton = document.querySelector('#jump');
const cameraSwitchButton = document.querySelector('#camera-switch');
const accelerateButton = document.querySelector('#accelerate');
const worldInteract = document.querySelector('#world-interact');
const districtTravelPanel = document.querySelector('#district-travel-panel');
const districtTravelHeading = document.querySelector('#district-travel-heading');
const districtTravelTitle = document.querySelector('#district-travel-title');
const districtTravelNote = document.querySelector('#district-travel-note');
const districtTravelDestinations = document.querySelector('#district-travel-destinations');
const districtTravelConfirm = document.querySelector('#district-travel-confirm');
const districtTravelClose = document.querySelector('#district-travel-close');
const districtTravelError = document.querySelector('#district-travel-error');
const districtJourneyScreen = document.querySelector('#district-journey-screen');
const districtJourneyTitle = document.querySelector('#district-journey-title');
const districtJourneyFrom = document.querySelector('#district-journey-from');
const districtJourneyTo = document.querySelector('#district-journey-to');
const districtJourneyTicket = document.querySelector('#district-journey-ticket');
const districtJourneyStatus = document.querySelector('#district-journey-status');
const districtJourneyCountdown = document.querySelector('#district-journey-countdown');
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
const wardrobePanel = document.querySelector('#wardrobe-panel');
const wardrobeOptions = document.querySelector('#wardrobe-options');
const avatarCustomizationPanel = document.querySelector('#avatar-customization');
const wardrobeStatus = document.querySelector('#wardrobe-status');
const wardrobeError = document.querySelector('#wardrobe-error');
const wardrobeToggle = document.querySelector('#wardrobe-toggle');
const progressChip = document.querySelector('#progress-chip');
const onlineCount = document.querySelector('#online-count');
const mapLayer = document.querySelector('#landmark-layer');
const mapPlayer = document.querySelector('#map-player');
const mapRoute = document.querySelector('#map-route');
const jobMapMarker = document.querySelector('#job-map-marker');
const mapStatus = document.querySelector('#map-status');
const nearbyPlaces = document.querySelector('#nearby-places');
const districtGuide = document.querySelector('#district-guide');
const districtGuideHeading = document.querySelector('#district-guide-heading');
const districtGuideContent = document.querySelector('#district-guide-content');
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
const phonePanel = document.querySelector('#phone-panel');
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
const WORLD_LIMIT = 210;
const ERNAKULAM_CITY = Object.freeze({ x: 0, z: 0 });
const DISTRICT_INSTANCE_ORDER = Object.freeze(['Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram','Palakkad','Thrissur','Ernakulam','Idukki','Alappuzha','Kottayam','Pathanamthitta','Kollam','Thiruvananthapuram']);
const DISTRICT_AIRPORTS = new Set(['Kannur','Kozhikode','Ernakulam','Thiruvananthapuram']);
const DISTRICT_BOOT_STORAGE_KEY = 'kerala-play-world-district';
let bootWorldDistrict = (() => {
  try { return sessionStorage.getItem(DISTRICT_BOOT_STORAGE_KEY) || 'Kottayam'; }
  catch { return 'Kottayam'; }
})();
let renderedWorldDistrict = '';
const DISTRICT_INSTANCE_CONFIG = Object.freeze(Object.fromEntries(DISTRICT_INSTANCE_ORDER.map((district, index) => {
  const generic = {
    district,
    order: index,
    bounds: { minX:-110, maxX:110, minZ:-110, maxZ:110 },
    spawn: { x:12, z:0, rotation:0 },
    train: { x:-42, z:-6, radius:7.2 },
    airport: DISTRICT_AIRPORTS.has(district) ? { x:42, z:-28, radius:8.2 } : null,
    teleport: { x:78, z:72, radius:7.2 },
  };
  if (district === 'Kottayam') return [district, { ...generic, spawn:{ x:19,z:-23,rotation:0 }, train:{ x:7,z:-23,radius:7.2 } }];
  if (district === 'Ernakulam') return [district, {
    ...generic,
    bounds:{ minX:-110,maxX:110,minZ:-110,maxZ:110 },
    spawn:{ x:-14,z:6,rotation:0 },
    train:{ x:-40,z:-30.5,radius:6.6 },
    airport:{ x:38,z:36,radius:8.2 },
  }];
  return [district, generic];
})));
const DISTRICT_CITY_PROFILES = Object.freeze({
  Kasaragod: Object.freeze({ centre:'Kasaragod Town', market:'Kasaragod Market', cafe:'Bekal Cafe', secondary:'Bekal Road', neighbourhood:'Kanhangad Link', landmark:'Bekal Fort', landmarkKind:'fort', environment:'coastal' }),
  Kannur: Object.freeze({ centre:'Kannur Town', market:'Fort Road Market', cafe:'Payyambalam Cafe', secondary:'Payyambalam', neighbourhood:'Thavakkara', landmark:'St. Angelo Fort', landmarkKind:'fort', environment:'coastal' }),
  Wayanad: Object.freeze({ centre:'Kalpetta Town', market:'Kalpetta Market', cafe:'Hill View Cafe', secondary:'Meppadi Road', neighbourhood:'Meppadi', landmark:'Edakkal Caves', landmarkKind:'hills', environment:'highland' }),
  Kozhikode: Object.freeze({ centre:'Kozhikode City', market:'SM Street Market', cafe:'Beach Road Cafe', secondary:'Beach Road', neighbourhood:'Mananchira', landmark:'Kozhikode Beach', landmarkKind:'water', environment:'coastal' }),
  Malappuram: Object.freeze({ centre:'Malappuram Town', market:'Malappuram Market', cafe:'Malabar Cafe', secondary:'Kottakkunnu Road', neighbourhood:'Up Hill', landmark:'Kottakkunnu', landmarkKind:'hills', environment:'highland' }),
  Palakkad: Object.freeze({ centre:'Palakkad Town', market:'Fort Market', cafe:'Fort Gate Cafe', secondary:'Fort Road', neighbourhood:'Sultanpet', landmark:'Palakkad Fort', landmarkKind:'fort', environment:'plains' }),
  Thrissur: Object.freeze({ centre:'Thrissur Round', market:'Sakthan Market', cafe:'Round Cafe', secondary:'Swaraj Round', neighbourhood:'East Fort', landmark:'Thekkinkadu Maidan', landmarkKind:'park', environment:'urban-park' }),
  Idukki: Object.freeze({ centre:'Painavu Town', market:'Hill Market', cafe:'Dam View Cafe', secondary:'Dam Road', neighbourhood:'Cheruthoni', landmark:'Idukki Arch Dam', landmarkKind:'dam', environment:'highland' }),
  Alappuzha: Object.freeze({ centre:'Alappuzha Town', market:'Canal Market', cafe:'Boat Jetty Cafe', secondary:'Canal Road', neighbourhood:'Mullakkal', landmark:'Alappuzha Backwaters', landmarkKind:'water', environment:'backwater' }),
  Pathanamthitta: Object.freeze({ centre:'Pathanamthitta Town', market:'Central Market', cafe:'River View Cafe', secondary:'Konni Road', neighbourhood:'Central Junction', landmark:'Konni Eco Point', landmarkKind:'hills', environment:'highland' }),
  Kollam: Object.freeze({ centre:'Kollam City', market:'Chinnakada Market', cafe:'Lake View Cafe', secondary:'Ashtamudi Road', neighbourhood:'Kadappakada', landmark:'Ashtamudi Lake', landmarkKind:'water', environment:'backwater' }),
  Thiruvananthapuram: Object.freeze({ centre:'Thiruvananthapuram City', market:'Chalai Market', cafe:'Museum Cafe', secondary:'Kanakakkunnu Road', neighbourhood:'Palayam', landmark:'Kanakakkunnu Grounds', landmarkKind:'park', environment:'urban-park' }),
});
function districtCityProfile(district = currentWorldDistrictName()) {
  const base = DISTRICT_CITY_PROFILES[district] || {
    centre:district + ' City Centre',
    market:district + ' City Market',
    cafe:district + ' Cafe',
    secondary:district + ' Town Road',
    landmark:district + ' Landmark',
    landmarkKind:'park',
    environment:'urban-park',
    neighbourhood:district + ' Neighbourhood',
  };
  const atlas = KERALA_DISTRICT_ATLAS[district];
  const primary = atlas?.attractions?.[0];
  return {
    ...base,
    centre:atlas?.city || base.centre,
    market:atlas?.market || base.market,
    cafe:atlas?.cafe || base.cafe,
    secondary:atlas?.secondary || base.secondary,
    neighbourhood:atlas?.neighbourhood || base.neighbourhood,
    landmark:primary?.name || base.landmark,
    landmarkKind:primary?.kind || base.landmarkKind,
    environment:atlas?.environment || base.environment,
    landscape:atlas?.landscape || 'Kerala town and countryside',
    culture:atlas?.culture || null,
    attractions:atlas?.attractions || [],
  };
}

function districtAtlasPlaces(district = currentWorldDistrictName()) {
  const atlas = KERALA_DISTRICT_ATLAS[district];
  return (atlas?.attractions || []).map(spot => ({
    id:spot.landmarkId,
    name:spot.name,
    icon:spot.icon,
    x:spot.x,
    z:spot.z,
    kind:'landmark',
    district,
    description:spot.description,
    attractionId:spot.id,
    visitId:spot.landmarkId,
  }));
}
function currentWorldDistrictName() {
  const district = profile?.worldDistrict || bootWorldDistrict || profile?.district || 'Kottayam';
  return DISTRICT_INSTANCE_CONFIG[district] ? district : 'Kottayam';
}
function currentDistrictInstance() {
  return DISTRICT_INSTANCE_CONFIG[currentWorldDistrictName()] || DISTRICT_INSTANCE_CONFIG.Kottayam;
}
function clampDistrictX(value, margin = 0) {
  const bounds = currentDistrictInstance().bounds;
  return THREE.MathUtils.clamp(value, bounds.minX + margin, bounds.maxX - margin);
}
function clampDistrictZ(value, margin = 0) {
  const bounds = currentDistrictInstance().bounds;
  return THREE.MathUtils.clamp(value, bounds.minZ + margin, bounds.maxZ - margin);
}
const villagers = [];
const ambientAnimals = [];
const windVegetation = [];
const palmFrondGeometryCache = new Map();
let bananaLeafGeometry = null;
let rubberTreeAssets = null;
let paddyClumpGeometry = null;
let paddyMaterial = null;
let paddyWaterMaterial = null;
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
const busStopCameraOccluders = [];
const ambientVehicleLightMaterials = [];
const weatherRoadSurfaces = [];
const roadEdgePlans = [];
const weatherBuildingSurfaces = [];
const parkedVehicleVisuals = [];
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
const mangoGeometry = new THREE.SphereGeometry(.16, 8, 6);
const mangoMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .76 });
const jackfruitGeometry = new THREE.SphereGeometry(.24, 10, 8);
const jackfruitMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .91 });
const fruitStalkGeometry = new THREE.CylinderGeometry(.018, .025, .22, 5);
const fruitStalkMaterial = new THREE.MeshStandardMaterial({ color: 0x665133, roughness: 1 });
const palmCoconutGeometry = new THREE.SphereGeometry(.14, 8, 6);
const palmCoconutMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .90 });
const palmCoconutStemGeometry = new THREE.CylinderGeometry(.014, .024, .18, 6);
const palmCoconutStemMaterial = new THREE.MeshStandardMaterial({ color: 0x66523a, roughness: .92 });
const palmTrunkScarGeometry = new THREE.TorusGeometry(1, .018, 4, 14);
const palmTrunkScarMaterial = new THREE.MeshStandardMaterial({ color: 0x8d7a5d, roughness: .96 });
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
  Object.freeze({ id: 'anugraha', kind: 'shop', label: 'Anugraha Stores', x: -14.4, z: 13.7, radius: 3.8, discoverRadius: 7.0, openHour: 6, closeHour: 21, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'malabar', kind: 'shop', label: 'Malabar Bakery', x: 14.8, z: 41.2, radius: 3.8, discoverRadius: 7.0, openHour: 5.5, closeHour: 20.5, items: ['water', 'tea', 'snack'] }),
  Object.freeze({ id: 'town-bus', kind: 'bus', label: 'Town Junction Bus Stop', x: 11.7, z: 30, radius: 3.6, discoverRadius: 6.6 }),
  Object.freeze({ id: 'town-centre-bus', kind: 'bus', label: 'Town Centre Bus Stop', x: 13.0, z: 16.0, radius: 4.2, discoverRadius: 7.0 }),
  Object.freeze({ id: 'south-bus', kind: 'bus', label: 'South Bus Stop', x: -11.7, z: -50.5, radius: 3.6, discoverRadius: 6.6 }),
  Object.freeze({ id: 'ernakulam-market', kind: 'shop', label: 'Ernakulam City Market', x: -49, z: 8.5, radius: 4.8, discoverRadius: 8.4, openHour: 5.5, closeHour: 22, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'broadway-cafe', kind: 'shop', label: 'Broadway Cafe', x: -33, z: 11.5, radius: 4.6, discoverRadius: 8.2, openHour: 5, closeHour: 23, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'ernakulam-hospital', kind: 'service', service: 'clinic', clinicId: 'ernakulam-hospital', label: 'Ernakulam City Hospital', x: -11, z: -34, radius: 5.8, discoverRadius: 9.0 }),
  Object.freeze({ id: 'ernakulam-police', kind: 'service', service: 'police', servicePointId: 'ernakulam-police', label: 'Ernakulam City Police', x: -31, z: 42, radius: 5.8, discoverRadius: 9.0 }),
  Object.freeze({ id: 'ernakulam-fire', kind: 'service', service: 'fire', servicePointId: 'ernakulam-fire', label: 'Ernakulam Fire & Rescue', x: 34, z: 11, radius: 5.8, discoverRadius: 9.0 }),
  Object.freeze({ id: 'ernakulam-station-bus', kind: 'bus', routeId: 'ernakulam-city-line', label: 'Ernakulam Railway Bus Stop', x: -35, z: -12, radius: 4.2, discoverRadius: 7.5 }),
  Object.freeze({ id: 'ernakulam-mg-road', kind: 'bus', routeId: 'ernakulam-city-line', label: 'MG Road Bus Stop', x: 16, z: 13.5, radius: 4.2, discoverRadius: 7.5 }),
  Object.freeze({ id: 'ernakulam-marine', kind: 'bus', routeId: 'ernakulam-city-line', label: 'Marine Drive Bus Stop', x: -3, z: 30.5, radius: 4.2, discoverRadius: 7.5 }),
  Object.freeze({ id: 'kottayam-rail', kind: 'train', stationId: 'kottayam', label: 'Kottayam Railway Station', x: 7, z: -23, radius: 7.2, discoverRadius: 11.5, destinationLabel: 'Ernakulam', fare: 500 }),
  Object.freeze({ id: 'ernakulam-rail', kind: 'train', stationId: 'ernakulam', label: 'Ernakulam Railway Station', x: -40, z: -30.5, radius: 6.6, discoverRadius: 10.5, destinationLabel: 'Kottayam', fare: 500 }),
  Object.freeze({ id: 'town-market', kind: 'shop', label: 'Town Market', x: 31, z: 12.5, radius: 4.2, discoverRadius: 7.2, openHour: 6, closeHour: 21, items: ['water', 'tea', 'snack', 'meal'] }),
  Object.freeze({ id: 'community-clinic', kind: 'service', service: 'clinic', label: 'Community Clinic', x: 42, z: 31, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'police-station', kind: 'service', service: 'police', label: 'Kerala Police Station', x: -31, z: 14, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'fire-station', kind: 'service', service: 'fire', label: 'Fire & Rescue Station', x: -52, z: 8, radius: 4.8, discoverRadius: 8.0 }),
  Object.freeze({ id: 'village-pond', kind: 'view', label: 'Village Pond', x: 39, z: -4, radius: 4.2, discoverRadius: 7.2 }),
]);
const ERNAKULAM_ACTIVITY_IDS = new Set(['ernakulam-market','broadway-cafe','ernakulam-hospital','ernakulam-police','ernakulam-fire','ernakulam-station-bus','ernakulam-mg-road','ernakulam-marine','ernakulam-rail']);
function generatedDistrictTravelSpots() {
  const district = currentWorldDistrictName();
  const config = currentDistrictInstance();
  const generated = [];
  if (district !== 'Kottayam' && district !== 'Ernakulam') {
    const city = districtCityProfile(district);
    generated.push(
      Object.freeze({
        id:'district-rail', kind:'train', stationId:config.train?.id || 'district-rail',
        label:`${district} Railway Station`, x:config.train.x, z:config.train.z,
        radius:config.train.radius, discoverRadius:11,
      }),
      Object.freeze({
        id:'district-market', kind:'shop', label:city.market,
        x:20, z:12.5, radius:4.8, discoverRadius:8.2, openHour:5.5, closeHour:22,
        items:['water','tea','snack','meal'],
      }),
      Object.freeze({
        id:'district-cafe', kind:'shop', label:city.cafe,
        x:-44, z:22, radius:4.8, discoverRadius:8.2, openHour:5, closeHour:23,
        items:['water','tea','snack','meal'],
      }),
      Object.freeze({
        id:'district-hospital', kind:'service', service:'clinic', clinicId:'district-hospital',
        label:`${district} District Hospital`, x:-20, z:11.5, radius:5.8, discoverRadius:9,
      }),
      Object.freeze({
        id:'district-police', kind:'service', service:'police', servicePointId:'district-police',
        label:`${district} District Police`, x:-20, z:-18, radius:5.8, discoverRadius:9,
      }),
      Object.freeze({
        id:'district-fire', kind:'service', service:'fire', servicePointId:'district-fire',
        label:`${district} Fire & Rescue`, x:20, z:-18, radius:5.8, discoverRadius:9,
      }),
      Object.freeze({
        id:'district-rest', kind:'rest', label:`${district} Rest Park`,
        x:-10, z:-10, radius:4.2, discoverRadius:7.2,
      }),
      Object.freeze({
        id:'district-centre-bus', kind:'bus', routeId:'district-city-line', label:`${city.centre} Bus Stop`,
        x:10, z:8, radius:4.2, discoverRadius:7.2,
      }),
      Object.freeze({
        id:'district-market-bus', kind:'bus', routeId:'district-city-line', label:`${city.market} Bus Stop`,
        x:28, z:13.5, radius:4.2, discoverRadius:7.2,
      }),
      Object.freeze({
        id:'district-rail-bus', kind:'bus', routeId:'district-city-line', label:`${district} Railway Bus Stop`,
        x:-34, z:-14.5, radius:4.2, discoverRadius:7.2,
      }),
      Object.freeze({
        id:'district-neighbourhood-bus', kind:'bus', routeId:'district-city-line', label:`${city.neighbourhood} Bus Stop`,
        x:-55, z:-29, radius:4.2, discoverRadius:7.2,
      }),
      Object.freeze({
        id:'district-neighbourhood', kind:'view', label:city.neighbourhood,
        x:-55, z:-29, radius:5.0, discoverRadius:9,
      }),
      Object.freeze({
        id:'district-landmark', kind:'view', label:city.landmark,
        x:50, z:45, radius:5.2, discoverRadius:10,
      }),
    );
  }
  if (config.airport) {
    generated.push(Object.freeze({
      id: 'district-airport', kind: 'airport', label: `${district} Airport`,
      x:config.airport.x, z:config.airport.z, radius:config.airport.radius, discoverRadius:12,
    }));
  }
  if (config.teleport) generated.push(Object.freeze({
    id:'district-teleport-gate', kind:'teleport', label:`${district} Teleportation Gate`,
    x:config.teleport.x, z:config.teleport.z, radius:config.teleport.radius, discoverRadius:12,
  }));
  return generated;
}
function activeWorldActivitySpots() {
  const district = currentWorldDistrictName();
  const base = WORLD_ACTIVITY_SPOTS.filter(spot => district === 'Ernakulam'
    ? ERNAKULAM_ACTIVITY_IDS.has(spot.id)
    : district === 'Kottayam'
      ? !ERNAKULAM_ACTIVITY_IDS.has(spot.id)
      : false);
  return [...base, ...generatedDistrictTravelSpots()];
}
function findWorldActivity(id) {
  return activeWorldActivitySpots().find(item => item.id === id) || null;
}

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
let jumpHeight = 0;
let jumpVelocity = 0;
let vehicleCameraView = 'chase';
let driveSpeed = 0;
const vehicleSafePosition = new THREE.Vector3();
let vehicleSafeRotation = 0;
let vehicleSafeReady = false;
let vehicleCollisionFrames = 0;
let lastVehicleRecoveryNotice = 0;
let headlightsOn = false;
let autoHeadlightsOn = false;
let worldWeatherState = { daylight: 1, hour: 12, rain: 0, overcast: 0, mist: 0, weather: 'Clear', needsLights: false };
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
  Alappuzha: [-34, -13], Ernakulam: [0, 0], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44]
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
  Object.freeze({ id: 'outskirts-access-road', name: 'District Outskirts Road', axis: 'x', center: -78, min: -75, max: 75, halfWidth: 4.1, displayLimit: 30, bikeLimit: 5.1, taxiLimit: 4.9 }),
  Object.freeze({ id: 'village-link', name: 'Village Link Road', axis: 'x', center: -22, min: -72, max: 16, halfWidth: 5.75, displayLimit: 30, bikeLimit: 4.9, taxiLimit: 4.7 }),
  Object.freeze({ id: 'market-link', name: 'Market Road', axis: 'x', center: 22, min: -18, max: 48, halfWidth: 3.4, displayLimit: 30, bikeLimit: 4.9, taxiLimit: 4.7 }),
  Object.freeze({ id: 'station-link', name: 'Station Road', axis: 'z', center: -42, min: -34, max: 22, halfWidth: 3.2, displayLimit: 25, bikeLimit: 4.4, taxiLimit: 4.2 }),
  Object.freeze({ id: 'ernakulam-mg', name: 'MG Road', axis: 'x', center: 2, min: -32, max: 32, halfWidth: 4.2, displayLimit: 35, bikeLimit: 5.8, taxiLimit: 5.6 }),
  Object.freeze({ id: 'ernakulam-marine-road', name: 'Marine Drive Road', axis: 'x', center: 21, min: -28, max: 28, halfWidth: 3.8, displayLimit: 30, bikeLimit: 5.2, taxiLimit: 5.0 }),
  Object.freeze({ id: 'ernakulam-city-spine', name: 'Banerji Road', axis: 'z', center: 0, min: -26, max: 30, halfWidth: 4.2, displayLimit: 35, bikeLimit: 5.8, taxiLimit: 5.6 }),
  Object.freeze({ id: 'ernakulam-station-access', name: 'Railway Station Road', axis: 'x', center: -19.5, min: -50, max: -26, halfWidth: 3.5, displayLimit: 25, bikeLimit: 4.6, taxiLimit: 4.4 }),
  Object.freeze({ id: 'ernakulam-station-connector', name: 'Railway Connector', axis: 'z', center: -29, min: -23, max: -14, halfWidth: 3.5, displayLimit: 25, bikeLimit: 4.6, taxiLimit: 4.4 }),
]);
const townZones = Object.freeze([
  Object.freeze({ id: 'town-centre', name: 'Town Centre', x: 0, z: 22, radius: 16, district: 'Kottayam' }),
  Object.freeze({ id: 'market-quarter', name: 'Market Quarter', x: -30, z: 22, radius: 15, district: 'Kottayam' }),
  Object.freeze({ id: 'south-junction', name: 'South Junction', x: 0, z: -22, radius: 14, district: 'Kottayam' }),
  Object.freeze({ id: 'ernakulam-centre', name: 'Ernakulam City Centre', x: 0, z: 0, radius: 42, district: 'Ernakulam' }),
]);
function worldZoneAt() {
  const district = currentWorldDistrictName();
  return { id: district.toLowerCase().replace(/[^a-z]+/g, '-'), name: district, district };
}

const landmarks = [
  { id: 'bekal', name: 'Bekal Fort', icon: 'F', x: -7, z: 60, district: 'Kasaragod', kind: 'landmark' },
  { id: 'munnar', name: 'Munnar Tea Hills', icon: 'M', x: 42, z: 26, district: 'Idukki', kind: 'landmark' },
  { id: 'kochi', name: 'Mattancherry Palace', icon: 'P', x: -10, z: 23, district: 'Ernakulam', kind: 'landmark' },
  { id: 'alappuzha', name: 'Alappuzha Backwaters', icon: 'B', x: -34, z: -13, district: 'Alappuzha', kind: 'landmark' },
  { id: 'kuttanad', name: 'Kuttanad Fields', icon: 'K', x: 7, z: -23, district: 'Kottayam', kind: 'landmark' },
  { id: 'temple', name: 'Padmanabhaswamy Temple', icon: 'T', x: 13, z: -57, district: 'Thiruvananthapuram', kind: 'landmark' }
];
const navigationPlaces = Object.freeze([
  ...landmarks,
  Object.freeze({ id: 'anugraha', name: 'Anugraha Stores', icon: 'S', x: -14.4, z: 13.7, kind: 'shop', district: 'Village' }),
  Object.freeze({ id: 'malabar', name: 'Malabar Bakery', icon: 'B', x: 14.8, z: 41.2, kind: 'shop', district: 'Village' }),
  Object.freeze({ id: 'town-bus', name: 'Town Junction Bus Stop', icon: '🚌', x: 11.7, z: 30, kind: 'bus', district: 'Village' }),
  Object.freeze({ id: 'south-bus', name: 'South Bus Stop', icon: '🚌', x: -11.7, z: -50.5, kind: 'bus', district: 'Village' }),
  Object.freeze({ id: 'kottayam-rail', name: 'Kottayam Railway Station', icon: '🚆', x: 7, z: -23, kind: 'rail', district: 'Kottayam' }),
  Object.freeze({ id: 'ernakulam-rail', name: 'Ernakulam Railway Station', icon: '🚆', x: -40, z: -30.5, kind: 'rail', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-centre', name: 'Ernakulam City Centre', icon: 'E', x: 5, z: 2, kind: 'town', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-market', name: 'Ernakulam City Market', icon: 'S', x: -49, z: 8.5, kind: 'shop', district: 'Ernakulam' }),
  Object.freeze({ id: 'broadway-cafe', name: 'Broadway Cafe', icon: 'C', x: -33, z: 11.5, kind: 'shop', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-hospital', name: 'Ernakulam City Hospital', icon: '+', x: -11, z: -34, kind: 'health', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-police', name: 'Ernakulam City Police', icon: 'P', x: -31, z: 42, kind: 'police', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-fire', name: 'Ernakulam Fire & Rescue', icon: 'F', x: 34, z: 11, kind: 'emergency', district: 'Ernakulam' }),
  Object.freeze({ id: 'ernakulam-marine', name: 'Marine Drive Bus Stop', icon: '🚌', x: -3, z: 30.5, kind: 'bus', district: 'Ernakulam' }),
  Object.freeze({ id: 'village-rental', name: 'Village Rental Home', icon: 'H', x: -24, z: -29.8, kind: 'home', district: 'Village' }),
  Object.freeze({ id: 'village-bench', name: 'Village Rest Bench', icon: 'R', x: -10, z: -10, kind: 'rest', district: 'Village' }),
  Object.freeze({ id: 'fuel', name: 'Kerala Fuel Station', icon: 'F', x: 11, z: -12, kind: 'service', district: 'Village' }),
  Object.freeze({ id: 'service', name: 'Village Service Garage', icon: 'G', x: -33, z: -12, kind: 'service', district: 'Village' }),
  Object.freeze({ id: 'village-pond', name: 'Village Pond', icon: 'P', x: 39, z: -4, kind: 'view', district: 'Village' }),
  Object.freeze({ id: 'town-centre', name: 'Town Centre', icon: 'T', x: 0, z: 22, kind: 'town', district: 'Kottayam' }),
  Object.freeze({ id: 'market-quarter', name: 'Market Quarter', icon: 'M', x: -30, z: 22, kind: 'town', district: 'Kottayam' }),
  Object.freeze({ id: 'south-junction', name: 'South Junction', icon: 'J', x: 0, z: -22, kind: 'junction', district: 'Kottayam' }),
  Object.freeze({ id: 'town-clinic', name: 'Kerala Community Clinic', icon: '+', x: 42, z: 31, kind: 'health', district: 'Kottayam' }),
  Object.freeze({ id: 'town-police', name: 'Kerala Police Station', icon: 'P', x: -31, z: 14, kind: 'police', district: 'Kottayam' }),
  Object.freeze({ id: 'town-fire', name: 'Fire & Rescue Station', icon: 'F', x: -52, z: 8, kind: 'emergency', district: 'Kottayam' }),
  Object.freeze({ id: 'town-market', name: 'Town Market', icon: 'S', x: 31, z: 12.5, kind: 'shop', district: 'Kottayam' }),
  Object.freeze({ id: 'town-centre-bus', name: 'Town Centre Bus Stop', icon: '🚌', x: 13.0, z: 16.0, kind: 'bus', district: 'Kottayam' }),
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
  weatherBuildingSurfaces.push(
    makeWeatherSurfaceState(wall, { roughnessDrop: .06, minRoughness: .72, darkening: .035 }),
    makeWeatherSurfaceState(trim, { roughnessDrop: .10, minRoughness: .58, darkening: .03 }),
    makeWeatherSurfaceState(glass, { roughnessDrop: .045, minRoughness: .14, darkening: .018 }),
  );
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.2, 6.2), wall);
  body.position.y = 2.1;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(9.7, .35, 6.7), trim);
  roof.position.y = 4.38;
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.7, .14), glass);
  entrance.position.set(0, 1.55, 3.16);
  const board = createWorldSignMesh({ title, subtitle, background: '#' + color.toString(16).padStart(6, '0') }, 5.8, .82);
  board.position.set(0, 4.0, 3.24);
  group.add(body, roof, entrance, board);

  // Recessed-looking front windows and a covered public entrance give each
  // district service building a readable Kerala civic facade without changing
  // its walkable footprint or the existing collision bounds.
  const grille = new THREE.MeshStandardMaterial({ color: 0x4c5557, roughness: .66, metalness: .24 });
  for (const windowX of [-3.15, 3.15]) {
    const surround = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.28, .10), trim);
    surround.position.set(windowX, 2.48, 3.14);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.02, .045), glass);
    pane.position.set(windowX, 2.48, 3.215);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.92, .11, .24), trim);
    sill.position.set(windowX, 1.82, 3.20);
    group.add(surround, pane, sill);
    for (const mullionX of [-.40, 0, .40]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.035, .92, .055), grille);
      bar.position.set(windowX + mullionX, 2.48, 3.25);
      group.add(bar);
    }
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.42, .04, .055), grille);
    crossbar.position.set(windowX, 2.48, 3.25);
    group.add(crossbar);
  }

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.8, .18, 1.25), trim);
  canopy.position.set(0, 3.23, 3.68);
  const canopyUnderside = new THREE.Mesh(new THREE.BoxGeometry(4.45, .055, 1.08), new THREE.MeshStandardMaterial({ color: 0xd6cbb5, roughness: .88 }));
  canopyUnderside.position.set(0, 3.11, 3.68);
  const canopySupports = [-2.05, 2.05].map(supportX => {
    const support = new THREE.Mesh(new THREE.CylinderGeometry(.075, .095, 2.95, 8), trim);
    support.position.set(supportX, 1.54, 4.14);
    return support;
  });
  const frontGutter = new THREE.Mesh(new THREE.BoxGeometry(9.35, .10, .13), grille);
  frontGutter.position.set(0, 4.31, 3.13);
  const downpipes = [-4.42, 4.42].map(pipeX => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, 3.9, 7), grille);
    pipe.position.set(pipeX, 2.22, 3.19);
    return pipe;
  });
  group.add(canopy, canopyUnderside, ...canopySupports, frontGutter, ...downpipes);
  group.position.set(x, 0, z);
  group.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(group);
  registerFarVisual(board, x, z, 60);
  addBoxCollider(x, z, 4.6, 3.1, collider);
}

function nearestVehicleStation() {
  const vehicle = currentDriveVehicle();
  if (!playerRef || !vehicle?.entered) return null;
  const district = currentWorldDistrictName();
  const candidates = [];
  if (district === 'Kottayam') {
    for (const [action, station] of Object.entries(vehicle.stations || {})) {
      candidates.push({ action: action === 'fuel' ? 'refuel' : 'repair', station });
    }
  } else if (district === 'Ernakulam') {
    candidates.push(
      { action:'refuel', station:{ id:'ernakulam-fuel', label:'Ernakulam Fuel Station', x:31, z:-25, radius:7 } },
      { action:'repair', station:{ id:'ernakulam-service', label:'Ernakulam Auto Garage', x:-32, z:30, radius:7 } },
    );
  } else {
    const fuelPosition = genericDistrictFuelPosition(!!currentDistrictInstance().airport);
    candidates.push(
      { action:'refuel', station:{ id:'district-fuel', label:`${district} Fuel Station`, ...fuelPosition, radius:7 } },
      { action:'repair', station:{ id:'district-service', label:`${district} Service Garage`, x:-18, z:-48, radius:7 } },
    );
  }
  for (const candidate of candidates) {
    const distance = Math.hypot(playerRef.position.x - Number(candidate.station.x), playerRef.position.z - Number(candidate.station.z));
    if (distance <= Number(candidate.station.radius || 7)) return { ...candidate, distance };
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
  const district = currentWorldDistrictName();
  if (district !== 'Kottayam' && district !== 'Ernakulam') {
    if (Math.abs(z + 78) <= 4.5 && x >= -76 && x <= 76) {
      return { id:'district-outskirts-road', label:`${district.toUpperCase()} OUTSKIRTS ROAD`, displayLimit:30, bikeLimit:5.1, taxiLimit:4.9 };
    }
    if (Math.abs(x) <= 6 && z >= -68 && z <= 68) {
      return { id:'district-spine', label:`${district.toUpperCase()} MAIN ROAD`, displayLimit:35, bikeLimit:5.8, taxiLimit:5.6 };
    }
    if (Math.abs(z) <= 5 && x >= -68 && x <= 68) {
      return { id:'district-cross', label:`${district.toUpperCase()} CITY ROAD`, displayLimit:30, bikeLimit:5.2, taxiLimit:5.0 };
    }
    if (Math.abs(z + 6) <= 3.5 && x >= -48 && x <= 0) {
      return { id:'district-station-road', label:'RAILWAY STATION ROAD', displayLimit:25, bikeLimit:4.6, taxiLimit:4.4 };
    }
    if (Math.abs(z - 22) <= 3.5 && x >= -18 && x <= 58) {
      return { id:'district-market-road', label:`${districtCityProfile(district).market.toUpperCase()} ROAD`, displayLimit:25, bikeLimit:4.6, taxiLimit:4.4 };
    }
    if (Math.abs(z + 36) <= 3.5 && x >= -67 && x <= 19) {
      return { id:'district-residential-road', label:'RESIDENTIAL ROAD', displayLimit:25, bikeLimit:4.4, taxiLimit:4.2 };
    }
    if (Math.abs(z - 45) <= 3.5 && x >= -12 && x <= 62) {
      return { id:'district-landmark-road', label:`${districtCityProfile(district).landmark.toUpperCase()} ROAD`, displayLimit:25, bikeLimit:4.4, taxiLimit:4.2 };
    }
    if (Math.abs(z - 34) <= 3.5 && x >= -67 && x <= -3) {
      return { id:'district-secondary-road', label:districtCityProfile(district).secondary.toUpperCase(), displayLimit:25, bikeLimit:4.5, taxiLimit:4.3 };
    }
    if (currentDistrictInstance().airport && Math.abs(z + 28) <= 3.5 && x >= 0 && x <= 44) {
      return { id:'district-airport-road', label:'AIRPORT ROAD', displayLimit:30, bikeLimit:5.0, taxiLimit:4.8 };
    }
  } else {
    const roads = roadNetwork.filter(road => district === 'Ernakulam'
      ? road.id.startsWith('ernakulam-') || road.id === 'outskirts-access-road'
      : !road.id.startsWith('ernakulam-'));
    for (const road of roads) {
      const cross = road.axis === 'z' ? x : z;
      const along = road.axis === 'z' ? z : x;
      if (Math.abs(cross - road.center) <= road.halfWidth && along >= road.min && along <= road.max) {
        return { id: road.id, label: road.name.toUpperCase(), displayLimit: road.displayLimit, bikeLimit: road.bikeLimit, taxiLimit: road.taxiLimit };
      }
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

function makeWeatherSurfaceState(material, {
  roughnessDrop = .08,
  minRoughness = .30,
  darkening = .025,
  clearcoatBoost = 0,
  clearcoatRoughnessDrop = .10,
} = {}) {
  return {
    material,
    baseColor: material.color?.clone?.() || null,
    baseRoughness: Number(material.roughness ?? .8),
    baseClearcoat: Number.isFinite(material.clearcoat) ? material.clearcoat : null,
    baseClearcoatRoughness: Number.isFinite(material.clearcoatRoughness) ? material.clearcoatRoughness : null,
    roughnessDrop,
    minRoughness,
    darkening,
    clearcoatBoost,
    clearcoatRoughnessDrop,
  };
}

function applyWeatherSurfaceState(surface, wet) {
  const { material } = surface;
  material.roughness = Math.max(surface.minRoughness, surface.baseRoughness - wet * surface.roughnessDrop);
  if (surface.baseColor) material.color.copy(surface.baseColor).multiplyScalar(1 - wet * surface.darkening);
  if (surface.baseClearcoat !== null) {
    material.clearcoat = Math.min(.82, surface.baseClearcoat + wet * surface.clearcoatBoost);
    material.clearcoatRoughness = Math.max(.12, surface.baseClearcoatRoughness - wet * surface.clearcoatRoughnessDrop);
  }
}

function registerVehicleWeatherSurface(vehicle, material, options) {
  vehicle.userData.weatherSurfaces ||= [];
  vehicle.userData.weatherSurfaces.push(makeWeatherSurfaceState(material, options));
}

function updateVehicleWeatherSurfaces(vehicle, wet) {
  for (const surface of vehicle?.userData?.weatherSurfaces || []) applyWeatherSurfaceState(surface, wet);
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
    // Low, cool ambient bounce keeps asphalt readable in Kerala's dark monsoon
    // scenes without turning the road into a self-lit or mirror-like surface.
    const roadBounce = THREE.MathUtils.clamp(darkness * .36 + overcast * .10 + wet * .12, 0, .58);
    surface.material.emissive.setRGB(.035 * roadBounce, .043 * roadBounce, .052 * roadBounce);
  }
  for (const surface of weatherBuildingSurfaces) applyWeatherSurfaceState(surface, wet);
  for (const vehicle of parkedVehicleVisuals) updateVehicleWeatherSurfaces(vehicle, wet);
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
  updateVehicleWeatherSurfaces(jobVehicleVisual, Number(worldWeatherState.rain || 0));
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
  if (jumpButton) jumpButton.hidden = driving;
  if (cameraSwitchButton) cameraSwitchButton.hidden = !driving;
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
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111416,
    roughness: .96,
    bumpMap: getVehicleTireTreadBumpMap(),
    bumpScale: .012,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaeb6b7, roughness: .42, metalness: .60 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe9a2, emissive: 0xffd66b, emissiveIntensity: .30 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xb92d27, emissive: 0x72130e, emissiveIntensity: .16 });

  const wheelGeometry = new THREE.TorusGeometry(.34, .072, 8, 20);
  const wheels = [];
  const frontWheels = [];
  [-.69, .69].forEach(z => {
    const root = new THREE.Group();
    root.position.set(0, .36, z);
    const wheel = new THREE.Mesh(wheelGeometry, tireMat);
    wheel.rotation.y = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .10, 10), metalMat);
    hub.rotation.z = Math.PI / 2;
    root.add(wheel, hub);
    const spokeGeometry = new THREE.CylinderGeometry(.006, .006, .25, 5);
    for (let spokeIndex = 0; spokeIndex < 8; spokeIndex++) {
      const angle = (spokeIndex / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeometry, metalMat);
      spoke.position.set(0, Math.cos(angle) * .205, Math.sin(angle) * .205);
      spoke.rotation.x = angle;
      root.add(spoke);
    }
    if (z > 0) {
      const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(.185, .185, .016, 16), metalMat);
      brakeDisc.rotation.z = Math.PI / 2;
      brakeDisc.position.x = .058;
      root.add(brakeDisc);
    }
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

  const headlampHousing = new THREE.Mesh(new THREE.CylinderGeometry(.132, .132, .12, 12), darkMat);
  headlampHousing.rotation.x = Math.PI / 2;
  headlampHousing.position.set(0, .94, .70);
  const headlampBezel = new THREE.Mesh(new THREE.TorusGeometry(.113, .013, 7, 18), metalMat);
  headlampBezel.position.set(0, .94, .872);
  const headlampLensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff1ce,
    transparent: true,
    opacity: .42,
    roughness: .18,
    clearcoat: .9,
    clearcoatRoughness: .12,
    side: THREE.DoubleSide,
  });
  const headlampLens = new THREE.Mesh(new THREE.CircleGeometry(.101, 18), headlampLensMaterial);
  headlampLens.position.set(0, .94, .874);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(.18, .10, .055), tailMaterial);
  tail.position.set(0, .79, -.78);

  const rearCarrier = new THREE.Mesh(new THREE.BoxGeometry(.54, .07, .48), metalMat);
  rearCarrier.position.set(0, .82, -.67);

  const forkTubes = [-1, 1].map(side => {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .63, 8), metalMat);
    tube.position.set(side * .115, .70, .55);
    tube.rotation.x = -.16;
    return tube;
  });
  const mirrorStems = [-1, 1].map(side => {
    const stem = new THREE.Mesh(new THREE.BoxGeometry(.018, .24, .018), metalMat);
    stem.position.set(side * .32, 1.19, .55);
    stem.rotation.z = side * .12;
    return stem;
  });
  const mirrors = [-1, 1].map(side => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(.13, .072, .032), darkMat);
    mirror.position.set(side * .35, 1.33, .55);
    mirror.rotation.z = side * -.10;
    return mirror;
  });
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(.052, .068, .70, 9), darkMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(.22, .49, -.39);
  const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, .075, 9), metalMat);
  exhaustTip.rotation.x = Math.PI / 2;
  exhaustTip.position.set(.22, .49, -.775);

  const plateFrameGeometry = new THREE.BoxGeometry(.31, .12, .025);
  const plateFaceGeometry = new THREE.PlaneGeometry(.285, .09);
  const plateMaterial = getRoadVehiclePlateMaterial();
  const frontPlateFrame = new THREE.Mesh(plateFrameGeometry, darkMat);
  const rearPlateFrame = new THREE.Mesh(plateFrameGeometry, darkMat);
  const frontPlate = new THREE.Mesh(plateFaceGeometry, plateMaterial);
  const rearPlate = new THREE.Mesh(plateFaceGeometry, plateMaterial);
  frontPlateFrame.position.set(0, .61, 1.025);
  rearPlateFrame.position.set(0, .66, -1.025);
  frontPlate.position.set(0, .61, 1.039);
  rearPlate.position.set(0, .66, -1.039);
  rearPlate.rotation.y = Math.PI;
  frontPlate.castShadow = rearPlate.castShadow = false;
  frontPlate.receiveShadow = rearPlate.receiveShadow = false;

  const footPegs = [-1, 1].map(side => {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .18, 8), metalMat);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(side * .17, .39, -.42);
    return peg;
  });

  const mudguardFront = new THREE.Mesh(new THREE.TorusGeometry(.37, .025, 6, 16, Math.PI), frameMat);
  mudguardFront.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  mudguardFront.position.set(0, .39, .69);

  bike.add(
    engine, tank, frame, seat, fork, handle, headlampHousing, head, headlampBezel, headlampLens, tail, rearCarrier,
    ...forkTubes, ...mirrorStems, ...mirrors, exhaust, exhaustTip,
    frontPlateFrame, rearPlateFrame, frontPlate, rearPlate,
    ...footPegs, mudguardFront
  );
  addVehicleTurnIndicators(bike, {
    frontX: .19, frontY: .91, frontZ: .70,
    rearX: .15, rearY: .79, rearZ: -.78,
    size: .060,
  });
  bike.userData.headlightMaterials = [lampMaterial];
  bike.userData.tailLightMaterials = [tailMaterial];
  bike.userData.wheels = wheels;
  bike.userData.frontWheels = frontWheels;
  bike.userData.wheelRadius = .34;
  registerVehicleWeatherSurface(bike, frameMat, { roughnessDrop: .16, minRoughness: .44, darkening: .035 });
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

function addVehicleTurnIndicators(vehicle, layout) {
  if (!vehicle || !layout) return;
  const materials = {};
  const housingMaterial = new THREE.MeshStandardMaterial({
    color: 0x292723,
    roughness: .72,
    metalness: .08,
  });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffbd66,
    emissive: 0x3e1b03,
    emissiveIntensity: .05,
    transparent: true,
    opacity: .48,
    roughness: .20,
    clearcoat: .92,
    clearcoatRoughness: .14,
    depthWrite: false,
  });
  const geometry = new THREE.BoxGeometry(layout.size, layout.size * .72, layout.size * .58);
  const housingGeometry = new THREE.BoxGeometry(layout.size * 1.16, layout.size * .88, layout.size * .24);
  const lensGeometry = new THREE.BoxGeometry(layout.size * 1.02, layout.size * .68, layout.size * .08);
  const mirrorLensGeometry = layout.mirrorX
    ? new THREE.BoxGeometry(layout.size * .13, layout.size * .34, layout.size * 1.12)
    : null;
  for (const [side, direction] of [['left', -1], ['right', 1]]) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a531c,
      emissive: 0xffa52b,
      emissiveIntensity: .045,
      roughness: .38,
      metalness: .04,
    });
    const front = new THREE.Mesh(geometry, material);
    const rear = new THREE.Mesh(geometry, material);
    front.position.set(direction * layout.frontX, layout.frontY, layout.frontZ);
    rear.position.set(direction * layout.rearX, layout.rearY, layout.rearZ);
    const frontHousing = new THREE.Mesh(housingGeometry, housingMaterial);
    const rearHousing = new THREE.Mesh(housingGeometry, housingMaterial);
    frontHousing.position.set(front.position.x, front.position.y, layout.frontZ - layout.size * .24);
    rearHousing.position.set(rear.position.x, rear.position.y, layout.rearZ + layout.size * .24);
    const frontLens = new THREE.Mesh(lensGeometry, lensMaterial);
    const rearLens = new THREE.Mesh(lensGeometry, lensMaterial);
    frontLens.position.set(front.position.x, front.position.y, layout.frontZ + layout.size * .32);
    rearLens.position.set(rear.position.x, rear.position.y, layout.rearZ - layout.size * .32);
    frontLens.castShadow = rearLens.castShadow = false;
    frontLens.receiveShadow = rearLens.receiveShadow = false;
    vehicle.add(frontHousing, rearHousing, front, rear, frontLens, rearLens);
    if (mirrorLensGeometry) {
      const mirrorLens = new THREE.Mesh(mirrorLensGeometry, material);
      mirrorLens.position.set(direction * layout.mirrorX, layout.mirrorY, layout.mirrorZ);
      mirrorLens.castShadow = mirrorLens.receiveShadow = false;
      vehicle.add(mirrorLens);
    }
    materials[side] = material;
  }
  vehicle.userData.turnIndicatorMaterials = materials;
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
    // Rotate the complete wheel assembly around its axle so the rim, tyre and
    // hub stay aligned instead of wobbling on the mesh's local X axis.
    wheelRoot.rotation.x -= spin;
  }

  const steerAngle = THREE.MathUtils.clamp(steering, -1, 1) * .30;
  for (const wheelRoot of vehicle.userData.frontWheels || []) {
    wheelRoot.rotation.y += (steerAngle - wheelRoot.rotation.y) * Math.min(1, delta * 10);
  }
  const steeringWheel = vehicle.userData.interiorSteeringWheel;
  if (steeringWheel) {
    const wheelTurn = -THREE.MathUtils.clamp(steering, -1, 1) * .62;
    steeringWheel.rotation.z += (wheelTurn - steeringWheel.rotation.z) * Math.min(1, delta * 8);
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
  const indicators = vehicle.userData.turnIndicatorMaterials;
  if (indicators) {
    const playerTurning = vehicle === jobVehicleVisual && vehicleMode !== 'walk' && Math.abs(steering) > .22;
    const selectedSide = steering < 0 ? 'left' : 'right';
    const flashOn = Math.sin(performance.now() * (Math.PI * 2 / 820)) > 0;
    for (const [side, material] of Object.entries(indicators)) {
      const lit = playerTurning && side === selectedSide && flashOn;
      material.emissiveIntensity = lit ? 1.8 : .045;
      material.color.setHex(lit ? 0xffb235 : 0x8a531c);
    }
  }
}

function restorePlayerVehiclePose() {
  const avatar = playerRef?.userData.avatar;
  if (avatar) {
    avatar.visible = true;
    avatar.position.set(0, .04, 0);
    avatar.rotation.set(0, 0, 0);
    avatar.userData.bikeRiderBlend = 0;
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

function movePlayerOutsideVehicle(vehicleVisual) {
  if (!playerRef || !vehicleVisual) return 0;
  const { x, z } = vehicleVisual.position;
  const yaw = Number(vehicleVisual.rotation.y) || 0;
  const sideX = Math.cos(yaw);
  const sideZ = -Math.sin(yaw);
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const sideDistance = vehicleVisual.userData.vehicleKind === 'bike' ? 1.02 : 1.38;
  const candidates = [
    [sideX * sideDistance, sideZ * sideDistance, 1],
    [-sideX * sideDistance, -sideZ * sideDistance, -1],
    [forwardX * 1.72, forwardZ * 1.72, 0],
    [-forwardX * 1.72, -forwardZ * 1.72, 0],
  ];
  const exit = candidates.find(([dx, dz]) => !positionBlocked(playerRef.position.x + dx, playerRef.position.z + dz, .43));
  if (!exit) return 0;
  playerRef.position.set(playerRef.position.x + exit[0], 0, playerRef.position.z + exit[1]);
  playerRef.rotation.y = Math.atan2(x - playerRef.position.x, z - playerRef.position.z);
  playerRef.userData.resetWalkSafe = true;
  updateMapPlayer(playerRef);
  return exit[2];
}

function animatePlayerVehicleTransition(player, delta) {
  const transition = player?.userData?.vehicleTransition;
  if (!transition) return;
  const elapsed = Math.max(0, performance.now() - transition.startedAt);
  const duration = Math.max(1, Number(transition.durationMs) || 1);
  const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
  let blend;
  if (transition.phase === 'pre') {
    blend = THREE.MathUtils.smoothstep(progress, 0, .22)
      * (1 - THREE.MathUtils.smoothstep(progress, .68, 1));
  } else {
    blend = 1 - THREE.MathUtils.smoothstep(progress, 0, 1);
  }
  if (progress >= 1 && blend < .002) {
    player.userData.vehicleTransition = null;
    return;
  }

  const avatar = player.userData.avatar;
  const parts = avatar?.userData?.parts;
  if (!avatar?.visible || !parts || blend < .002) return;
  if (transition.action === 'enter') {
    if (parts.rightArm) parts.rightArm.rotation.x -= .28 * blend;
    if (parts.rightElbow) parts.rightElbow.rotation.x += .58 * blend;
    if (parts.leftArm) parts.leftArm.rotation.x -= .10 * blend;
    if (parts.torso) parts.torso.rotation.x -= .065 * blend;
    if (parts.head) parts.head.rotation.x += .045 * blend;
  } else {
    const stepLeg = transition.exitSide < 0 ? parts.leftLeg : parts.rightLeg;
    const stepKnee = transition.exitSide < 0 ? parts.leftKnee : parts.rightKnee;
    if (stepLeg) stepLeg.rotation.z += Math.sign(transition.exitSide || 1) * .48 * blend;
    if (stepKnee) stepKnee.rotation.x += .44 * blend;
    if (parts.rightArm) parts.rightArm.rotation.x -= .20 * blend;
    if (parts.rightElbow) parts.rightElbow.rotation.x += .34 * blend;
    if (parts.torso) parts.torso.rotation.x -= .035 * blend;
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
  const wasDriving = vehicleMode !== 'walk';
  const ownerKey = source === 'job' ? activeJobMission?.taskId : vehicle?.vehicleId;
  const signature = vehicle ? [source, ownerKey, vehicle.kind, vehicle.entered, vehicle.entered ? 'driving' : vehicle.x, vehicle.entered ? 'driving' : vehicle.z].join('|') : '';
  if (signature === jobVehicleSignature) return;
  clearJobVehicleVisual();
  jobVehicleSignature = signature;
  if (!vehicle) return;

  jobVehicleVisual = applyDynamicHighQuality(createJobVehicleVisual(vehicle.kind, source));
  jobVehicleVisual.userData.vehicleKind = vehicle.kind;
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
        avatar.position.set(0, .04, -.08);
      }
    }
    const transition = playerRef.userData.vehicleTransition;
    if (transition?.action === 'enter') {
      transition.phase = 'mount';
      transition.startedAt = performance.now();
      transition.durationMs = 230;
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
    if (wasDriving) {
      const exitSide = movePlayerOutsideVehicle(jobVehicleVisual);
      playerRef.userData.vehicleTransition = {
        action: 'exit',
        phase: 'post',
        exitSide,
        startedAt: performance.now(),
        durationMs: 420,
        lockUntil: performance.now() + 220,
      };
    }
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
  playerRef.userData.conversationTargetYaw = Math.atan2(
    villager.position.x - playerRef.position.x,
    villager.position.z - playerRef.position.z
  );
  playerRef.userData.conversationGestureUntil = data.interactionUntil;
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
  for (const spot of activeWorldActivitySpots()) {
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
  const spot = findWorldActivity(activityId);
  if (!spot || performance.now() - lastWorldActivityAt < 700) return;
  lastWorldActivityAt = performance.now();

  if (spot.kind === 'bus') {
    showToast(`${spot.label} · checking Village Line timetable…`, 2200);
    window.dispatchEvent(new CustomEvent('kerala-bus-stop-view', {
      detail: { routeId: spot.routeId || 'village-line', stopId: spot.id },
    }));
    return;
  }

  if (spot.kind === 'service') {
    if (spot.service === 'clinic') {
      api('/api/needs/clinic', { clinicId: spot.clinicId || 'community-clinic' }).then(result => {
        if (result?.needs) applyNeedsState(result.needs, { warn: false });
        showToast(`Clinic care complete · ₹${Number(result?.fee || 0)} · energy restored`, 3600);
      }).catch(error => showToast(error.message || 'Clinic care unavailable', 3600));
      return;
    }
    api('/api/world/emergency-help', { service: spot.service, pointId: spot.servicePointId || spot.service }).then(result => {
      if (result?.progression?.recognition) {
        profile = { ...profile, recognition: result.progression.recognition };
      }
      showToast(`${result?.label || spot.label} · help request logged · response #${Number(result?.emergencyResponses || 0)}`, 3600);
    }).catch(error => showToast(error.message || 'Public help desk unavailable', 3600));
    return;
  }

  if (spot.kind === 'view') {
    const rain = Number(worldWeatherState.rain || 0);
    showToast(
      rain > .18
        ? `${spot.label} · monsoon atmosphere is active here`
        : `${spot.label} · district landmark discovered nearby`,
      3600
    );
  }
}

let districtTravelMode = 'train';
let districtTravelSelected = '';
let districtTravelSnapshot = null;
let districtJourneyTimers = [];
let districtJourneyInterval = null;
let districtJourneyResumeUserId = '';

function closeDistrictTravelPanel() {
  districtTravelPanel?.classList.remove('open');
  districtTravelSelected = '';
  if (districtTravelConfirm) {
    districtTravelConfirm.disabled = true;
    districtTravelConfirm.textContent = 'SELECT A DISTRICT';
  }
  if (districtTravelError) districtTravelError.textContent = '';
}

function renderDistrictTravelDestinations() {
  if (!districtTravelDestinations || !districtTravelSnapshot) return;
  districtTravelDestinations.replaceChildren();
  const current = districtTravelSnapshot.currentDistrict;
  const options = (districtTravelSnapshot.districts || []).filter(item => {
    if (item.district === current) return false;
    if (districtTravelMode === 'flight') return !!item.flight?.available && !!districtTravelSnapshot.hubs?.airport;
    if (districtTravelMode === 'teleport') return !!item.teleport?.available && !!districtTravelSnapshot.hubs?.teleport;
    return !!item.train?.available;
  });
  const transport = districtTravelMode === 'flight' ? '✈ Flight' : districtTravelMode === 'teleport' ? '◉ Teleport' : '🚆 Train';
  const action = districtTravelMode === 'flight' ? 'BOARD FLIGHT · 30 SEC' : districtTravelMode === 'teleport' ? 'OPEN GATE · INSTANT' : 'BOARD TRAIN · 1 MIN';
  for (const item of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.district = item.district;
    button.classList.toggle('selected', districtTravelSelected === item.district);
    const fare = Number((item[districtTravelMode]?.fare) || 0);
    const fareLabel = fare === 0 ? `FREE · ${Math.max(1, districtTravelSnapshot.freeTripsRemaining || 0)} FREE LEFT` : `₹${fare}`;
    button.textContent = `${item.district}\n${transport}`;
    button.textContent += '\n' + fareLabel;
    button.addEventListener('click', () => {
      districtTravelSelected = item.district;
      renderDistrictTravelDestinations();
      if (districtTravelConfirm) {
        districtTravelConfirm.disabled = false;
        districtTravelConfirm.textContent = action + ' · ' + (fare === 0 ? 'FREE' : `₹${fare}`);
      }
      const modeName = districtTravelMode === 'flight' ? 'Flight' : districtTravelMode === 'teleport' ? 'Teleport' : 'Train';
      const checkPlace = districtTravelMode === 'flight' ? 'airport' : districtTravelMode === 'teleport' ? 'district gate' : 'railway station';
      const price = fare === 0 ? `FREE · trip ${Number(districtTravelSnapshot.tripsUsed || 0) + 1} of 3` : `₹${fare}`;
      if (districtTravelNote) districtTravelNote.textContent = `${current} → ${item.district} · ${modeName} ${price}. Verify your ${checkPlace} before the trip starts.`;
    });
    districtTravelDestinations.append(button);
  }
  if (!options.length && districtTravelError) {
    districtTravelError.textContent = districtTravelMode === 'flight'
      ? 'No direct flight is available from this district. Use the railway station or district gate.'
      : districtTravelMode === 'teleport'
        ? 'No district gate is available here.'
        : 'No train destinations are available.';
  }
}

async function openDistrictTravelPanel(mode = 'train') {
  districtTravelMode = ['train','flight','teleport'].includes(mode) ? mode : 'train';
  districtTravelSelected = '';
  if (districtTravelPanel) districtTravelPanel.classList.add('open');
  if (districtTravelHeading) districtTravelHeading.textContent = districtTravelMode === 'flight' ? 'Kerala Airport' : districtTravelMode === 'teleport' ? 'District Teleport Gate' : 'Kerala Railway';
  if (districtTravelTitle) districtTravelTitle.textContent = `${currentWorldDistrictName()} → choose district`;
  if (districtTravelNote) districtTravelNote.textContent = districtTravelMode === 'flight'
    ? 'Flights connect airport districts and take 30 seconds. The first 3 district trips are free; then each flight costs ₹1,000.'
    : districtTravelMode === 'teleport'
      ? 'Step through the gate for an instant district transfer. The teleport animation takes about 2 seconds; the first 3 district trips are free, then it costs ₹2,000.'
      : 'Trains connect all district stations and take 1 minute. The first 3 district trips are free; then each train costs ₹500.';
  if (districtTravelDestinations) districtTravelDestinations.textContent = 'Loading routes…';
  if (districtTravelError) districtTravelError.textContent = '';
  if (districtTravelConfirm) districtTravelConfirm.disabled = true;
  try {
    districtTravelSnapshot = await api('/api/travel/districts');
    renderDistrictTravelDestinations();
  } catch (error) {
    if (districtTravelDestinations) districtTravelDestinations.replaceChildren();
    if (districtTravelError) districtTravelError.textContent = error.message || 'Travel routes unavailable.';
  }
}

districtTravelClose?.addEventListener('click', closeDistrictTravelPanel);
districtTravelPanel?.addEventListener('click', event => {
  if (event.target === districtTravelPanel) closeDistrictTravelPanel();
});
districtTravelConfirm?.addEventListener('click', async () => {
  if (!districtTravelSelected || districtTravelConfirm.disabled) return;
  districtTravelConfirm.disabled = true;
  if (districtTravelError) districtTravelError.textContent = '';
  window.dispatchEvent(new CustomEvent('kerala-ride-travel-start'));
  try {
    const result = await api('/api/travel/district/board', {
      mode: districtTravelMode,
      destinationDistrict: districtTravelSelected,
    });
    const travel = result?.travel || {};
    const toDistrict = travel.to?.district || travel.district || districtTravelSelected;
    const fromDistrict = travel.from?.district || currentWorldDistrictName();
    closeDistrictTravelPanel();
    showDistrictJourney(districtTravelMode, fromDistrict, toDistrict, Number(travel.fare || 0), travel);
  } catch (error) {
    window.dispatchEvent(new CustomEvent('kerala-ride-cancel'));
    districtTravelConfirm.disabled = false;
    if (districtTravelError) districtTravelError.textContent = error.message || 'Travel failed.';
  }
});

function formatJourneyClock(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

function finishDistrictJourney(travel = {}) {
  districtJourneyTimers.forEach(timer => clearTimeout(timer));
  districtJourneyTimers = [];
  if (districtJourneyInterval) clearInterval(districtJourneyInterval);
  districtJourneyInterval = null;
  const district = travel.to?.district || travel.district || '';
  if (district && DISTRICT_INSTANCE_CONFIG[district]) {
    bootWorldDistrict = district;
    try { sessionStorage.setItem(DISTRICT_BOOT_STORAGE_KEY, district); } catch {}
  }
  location.reload();
}

function showDistrictJourney(mode, fromDistrict, toDistrict, fare, travel = {}) {
  if (!districtJourneyScreen) {
    finishDistrictJourney(travel);
    return;
  }
  const train = mode === 'train';
  const flight = mode === 'flight';
  const teleport = mode === 'teleport';
  const durationMs = Math.max(0, Number(travel.durationMs ?? (train ? 60_000 : flight ? 30_000 : 0)));
  const animationMs = teleport ? 1800 : durationMs;
  const tripNumber = Math.max(1, Number(travel.tripNumber) || 1);
  const freeTripsRemaining = Math.max(0, Number(travel.freeTripsRemaining) || 0);
  let timeOffset = Number(travel.serverNow || Date.now()) - Date.now();
  let arrivalAt = Number(travel.arrivalAt || Date.now() + durationMs);
  districtJourneyTimers.forEach(timer => clearTimeout(timer));
  districtJourneyTimers = [];
  if (districtJourneyInterval) clearInterval(districtJourneyInterval);
  districtJourneyScreen.dataset.mode = mode;
  districtJourneyScreen.style.setProperty('--journey-duration', `${animationMs}ms`);
  districtJourneyScreen.setAttribute('aria-label', teleport ? 'Teleport journey' : flight ? 'Flight journey' : 'Train journey');
  districtJourneyScreen.classList.add('open');
  districtJourneyScreen.setAttribute('aria-hidden', 'false');
  const animatedParts = districtJourneyScreen.querySelectorAll('.journey-train,.journey-hill,.journey-tree,.journey-progress i,.journey-flight-plane,.journey-flight-cloud');
  const initialElapsed = teleport ? 0 : Math.max(0, durationMs - Math.max(0, arrivalAt - (Date.now() + timeOffset)));
  animatedParts.forEach(element => {
    element.style.animationDuration = `${animationMs}ms`;
    element.style.animationDelay = `-${Math.min(animationMs, initialElapsed)}ms`;
  });
  if (districtJourneyCountdown) {
    districtJourneyCountdown.hidden = teleport;
    districtJourneyCountdown.textContent = teleport ? '' : formatJourneyClock(Math.max(0, arrivalAt - (Date.now() + timeOffset)));
  }
  const kicker = districtJourneyScreen.querySelector('.journey-kicker');
  if (kicker) kicker.textContent = flight ? 'KERALA AIRWAYS · DISTRICT FLIGHT' : teleport ? 'KERALA PLAY · DISTRICT GATE' : 'KERALA RAILWAYS · DISTRICT PASSENGER';
  if (districtJourneyTitle) districtJourneyTitle.textContent = (flight ? 'Flight to ' : teleport ? 'Gate to ' : 'Train to ') + toDistrict;
  if (districtJourneyFrom) districtJourneyFrom.textContent = travel.from?.label || (fromDistrict + (flight ? ' Airport' : teleport ? ' Gate' : ' Station'));
  if (districtJourneyTo) districtJourneyTo.textContent = travel.to?.label || (toDistrict + (flight ? ' Airport' : teleport ? ' Gate' : ' Station'));
  const fareLabel = fare === 0 ? `FREE · trip ${tripNumber} of 3` : `₹${fare} Kerala Cash`;
  if (districtJourneyTicket) districtJourneyTicket.textContent = `${fareLabel} · ${freeTripsRemaining} free trip${freeTripsRemaining === 1 ? '' : 's'} left`;

  const phases = teleport ? [
    [0, 'District gate activating…'],
    [650, 'Portal open · stepping through…'],
    [1350, 'Crossing into ' + toDistrict + '…'],
  ] : flight ? [
    [0, 'Ticket verified · proceed to Gate 01 at ' + fromDistrict + ' Airport…'],
    [3000, 'Boarding complete · cabin doors closing…'],
    [7000, 'Take-off · climbing above Kerala…'],
    [15000, 'Cruising to ' + toDistrict + ' · district boundary crossed…'],
    [25000, 'Beginning descent · approaching ' + toDistrict + ' Airport…'],
    [28500, 'Landing · taxiing to the terminal…'],
  ] : [
    [0, 'Ticket checked · doors closing at ' + fromDistrict + ' Station…'],
    [5000, 'Departed ' + fromDistrict + ' · train leaving the platform…'],
    [20000, 'On the way to ' + toDistrict + ' · district boundary crossed…'],
    [46000, 'Approaching ' + toDistrict + ' Railway Station…'],
    [57000, 'Arriving at ' + toDistrict + ' · preparing to stop…'],
  ];
  const drawJourneyFrame = (elapsed, remaining) => {
    const phase = [...phases].reverse().find(([at]) => elapsed >= at);
    if (phase && districtJourneyStatus) districtJourneyStatus.textContent = phase[1];
    if (districtJourneyCountdown && !teleport) districtJourneyCountdown.textContent = formatJourneyClock(remaining);
  };
  drawJourneyFrame(initialElapsed, Math.max(0, arrivalAt - (Date.now() + timeOffset)));
  if (teleport) {
    districtJourneyTimers.push(setTimeout(() => finishDistrictJourney(travel), animationMs));
    return;
  }
  districtJourneyInterval = setInterval(async () => {
    const remaining = Math.max(0, arrivalAt - (Date.now() + timeOffset));
    const elapsed = Math.max(0, durationMs - remaining);
    drawJourneyFrame(elapsed, remaining);
    try {
      const status = await api('/api/travel/district/status');
      if (status.status === 'arrived') { finishDistrictJourney(status.travel || travel); return; }
      if (status.status === 'pending' && status.travel) {
        const serverNow = Number(status.serverNow || Date.now());
        timeOffset = serverNow - Date.now();
        arrivalAt = Number(status.travel.arrivalAt || arrivalAt);
        const updatedRemaining = Math.max(0, Number(status.travel.arrivalAt) - serverNow);
        drawJourneyFrame(Math.max(0, durationMs - updatedRemaining), updatedRemaining);
        districtJourneyCountdown && (districtJourneyCountdown.textContent = formatJourneyClock(updatedRemaining));
      } else if (status.status === 'idle') {
        finishDistrictJourney({ ...travel, to:{ district:toDistrict } });
      }
    } catch { /* Keep the server-based countdown running and retry next second. */ }
  }, 1000);
}

window.addEventListener('kerala-district-journey', event => {
  const travel = event.detail?.travel || event.detail || {};
  const mode = travel.mode || 'train';
  window.dispatchEvent(new CustomEvent('kerala-ride-travel-start'));
  showDistrictJourney(mode, travel.from?.district || currentWorldDistrictName(), travel.to?.district || '', Number(travel.fare || 0), travel);
});

async function resumeDistrictJourney(userId) {
  if (!userId || districtJourneyResumeUserId === userId) return;
  districtJourneyResumeUserId = userId;
  try {
    const result = await api('/api/travel/district/status');
    if (result.status === 'pending' && result.travel) {
      window.dispatchEvent(new CustomEvent('kerala-ride-travel-start'));
      const travel = result.travel;
      showDistrictJourney(travel.mode, travel.from?.district || currentWorldDistrictName(), travel.to?.district || '', Number(travel.fare || 0), travel);
    } else if (result.status === 'arrived' && result.travel) {
      finishDistrictJourney(result.travel);
    }
  } catch (error) {
    districtJourneyResumeUserId = '';
    console.warn('Could not resume district journey:', error);
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
  worldInteract.dataset.station = '';
  worldInteract.dataset.transport = '';
  worldInteract.title = '';
  if (!profile || !playerRef) return;
  if (playerRef.userData.restPoseReturn) return;
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

  if (!active && vehicleMode === 'walk' && (homeSnapshot?.localHome || homeSnapshot?.home)) {
    const home = homeSnapshot.localHome || homeSnapshot.home;
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

  if (!active && vehicleMode === 'walk' && (needsSnapshot?.localRestPoint || needsSnapshot?.restPoint)) {
    const rest = needsSnapshot.localRestPoint || needsSnapshot.restPoint;
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
      } else if (spot.kind === 'train') {
        worldInteract.dataset.mode = closeEnough ? 'district-travel' : '';
        worldInteract.dataset.transport = closeEnough ? 'train' : '';
        worldInteract.disabled = !closeEnough;
        worldInteract.textContent = closeEnough ? 'OPEN TRAIN ROUTES' : `NEARBY · ${spot.label.toUpperCase()}`;
        worldInteract.title = closeEnough ? `${spot.label} · travel to another district` : worldInteract.title;
      } else if (spot.kind === 'airport') {
        worldInteract.dataset.mode = closeEnough ? 'district-travel' : '';
        worldInteract.dataset.transport = closeEnough ? 'flight' : '';
        worldInteract.disabled = !closeEnough;
        worldInteract.textContent = closeEnough ? 'OPEN FLIGHT ROUTES' : `NEARBY · ${spot.label.toUpperCase()}`;
        worldInteract.title = closeEnough ? `${spot.label} · fly to another airport district` : worldInteract.title;
      } else if (spot.kind === 'teleport') {
        worldInteract.dataset.mode = closeEnough ? 'district-travel' : '';
        worldInteract.dataset.transport = closeEnough ? 'teleport' : '';
        worldInteract.disabled = !closeEnough;
        worldInteract.textContent = closeEnough ? 'OPEN DISTRICT GATE' : `NEARBY · ${spot.label.toUpperCase()}`;
        worldInteract.title = closeEnough ? `${spot.label} · teleport instantly to another district` : worldInteract.title;
      } else if (spot.kind === 'rest') {
        worldInteract.dataset.mode = closeEnough ? 'needs-rest' : '';
        worldInteract.disabled = !closeEnough;
        worldInteract.textContent = closeEnough ? 'REST · RECOVER ENERGY' : `NEARBY · ${spot.label.toUpperCase()}`;
        worldInteract.title = closeEnough ? spot.label : worldInteract.title;
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
    const spot = activeWorldActivitySpots().find(item => item.id === worldInteract.dataset.shop && item.kind === 'shop');
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
  } else if (worldInteract.dataset.mode === 'district-travel') {
    openDistrictTravelPanel(worldInteract.dataset.transport || 'train');
  } else if (worldInteract.dataset.mode === 'train-board') {
    window.dispatchEvent(new CustomEvent('kerala-train-board', {
      detail: { stationId: worldInteract.dataset.station },
    }));
  } else if (worldInteract.dataset.mode === 'bus-check') {
    window.dispatchEvent(new CustomEvent('kerala-bus-stop-view', {
      detail: { routeId: findWorldActivity(worldInteract.dataset.activity)?.routeId || 'village-line', stopId: worldInteract.dataset.activity },
    }));
  } else if (worldInteract.dataset.mode === 'bus-board') {
    window.dispatchEvent(new CustomEvent('kerala-bus-board', {
      detail: { routeId: findWorldActivity(worldInteract.dataset.activity)?.routeId || 'village-line', stopId: worldInteract.dataset.activity },
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

window.addEventListener('kerala-player-rest-pose', event => {
  if (!playerRef || vehicleMode !== 'walk') return;
  if (playerRef.userData.restPoseReturn) return;
  const duration = THREE.MathUtils.clamp(Number(event.detail?.durationMs) || 1900, 900, 3200);
  const rest = needsSnapshot?.localRestPoint || needsSnapshot?.restPoint;
  const restX = Number(rest?.x);
  const restZ = Number(rest?.z);
  const now = performance.now();
  if (!Number.isFinite(restX) || !Number.isFinite(restZ)) {
    playerRef.userData.restPoseUntil = now + duration;
    return;
  }
  if (Math.hypot(playerRef.position.x - restX, playerRef.position.z - restZ) > Number(rest.radius || 5.2) + .35) {
    showToast('Move closer to the rest bench');
    return;
  }

  // Keep the physics root just outside the bench collider. The avatar is
  // offset over the seat after it reaches this approach point.
  const seatCandidates = [
    [restX, restZ + 1.28],
    [restX + .68, restZ + 1.28],
    [restX - .68, restZ + 1.28],
    [restX, restZ + 1.50],
  ];
  const seat = seatCandidates.find(([x, z]) => !positionBlocked(x, z, .43));
  if (!seat) {
    showToast('Rest bench seat is blocked');
    return;
  }

  const distance = Math.hypot(seat[0] - playerRef.position.x, seat[1] - playerRef.position.z);
  playerRef.userData.restPoseReturn = {
    originX: playerRef.position.x,
    originZ: playerRef.position.z,
    originYaw: playerRef.rotation.y,
    targetX: seat[0],
    targetZ: seat[1],
    targetYaw: Math.PI,
    avatarSeatZ: seat[1] - restZ + .06,
    durationMs: duration,
    approaching: distance > .08,
    atSeat: distance <= .08,
    stuckSeconds: 0,
  };
  playerRef.userData.restPoseUntil = distance <= .08 ? now + duration : 0;
  if (distance <= .08) playerRef.rotation.y = Math.PI;
  updateMapPlayer(playerRef);
});

function restorePlayerRestPosition(player) {
  const rest = player?.userData?.restPoseReturn;
  if (!rest) return false;
  player.position.set(rest.originX, 0, rest.originZ);
  player.rotation.y = rest.originYaw;
  player.userData.restPoseReturn = null;
  player.userData.restPoseUntil = 0;
  const avatar = player.userData.avatar;
  if (avatar) {
    avatar.position.set(0, .04, 0);
    avatar.rotation.set(0, 0, 0);
    avatar.userData.restPoseBlend = 0;
    const parts = avatar.userData.parts;
    if (parts?.leftKnee) parts.leftKnee.scale.y = 1;
    if (parts?.rightKnee) parts.rightKnee.scale.y = 1;
  }
  updateMapPlayer(player);
  return true;
}

vehicleAction?.addEventListener('click', () => {
  const vehicle = currentDriveVehicle();
  const source = currentVehicleSource();
  if (!vehicle || !source || vehicleAction.disabled) return;
  vehicleAction.disabled = true;
  const action = vehicle.entered ? 'exit' : 'enter';
  if (playerRef) {
    if (playerRef.userData.restPoseReturn) restorePlayerRestPosition(playerRef);
    const startedAt = performance.now();
    playerRef.userData.vehicleTransition = {
      action,
      phase: 'pre',
      exitSide: 0,
      startedAt,
      durationMs: 540,
      lockUntil: startedAt + 340,
    };
  }
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
  if (user?.worldDistrict && DISTRICT_INSTANCE_CONFIG[user.worldDistrict]) {
    bootWorldDistrict = user.worldDistrict;
    try { sessionStorage.setItem(DISTRICT_BOOT_STORAGE_KEY, user.worldDistrict); } catch {}
    if (renderedWorldDistrict && renderedWorldDistrict !== user.worldDistrict) {
      location.reload();
      return;
    }
  }
  progress = user ? { xp: user.points || 0, level: user.level || 1, walkMeters: user.walkMeters || 0,
    visitedLandmarkIds: user.visitedLandmarks || [], completedTaskIds: user.completedTasks || [], followingIds: [] } : newProgress();
  updateProfileHud(); updateProgressHud(); renderTasks();
  if (playerRef) {
    playerRef.visible = !!user;
    const previousAppearance = JSON.stringify(previous?.avatarCustomization || {});
    const nextAppearance = JSON.stringify(user?.avatarCustomization || {});
    if (user && (!previous || previous.gender !== user.gender || previous.outfit !== user.outfit || previousAppearance !== nextAppearance)) replacePlayerAvatar(user.gender);
    if (user && (!previous || previous.id !== user.id || previous.district !== user.district || previous.worldDistrict !== user.worldDistrict)) {
      if (Number.isFinite(user.x) && Number.isFinite(user.z)) playerRef.position.set(user.x, 0, user.z);
      else placePlayerAtDistrict(user.district);
      if (Number.isFinite(user.rotation)) playerRef.rotation.y = user.rotation;
    }
    updateNameLabel(playerRef, user?.username || '', user?.id);
  }
  if (wardrobePanel?.classList.contains('open')) renderWardrobePanel();
  if (!user) {
    districtJourneyResumeUserId = '';
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
    if (!previous || previous.id !== user.id) resumeDistrictJourney(user.id);
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
  if (!profile) {
    profileDistrict.textContent = 'Choose your district';
    profileDistrict.title = '';
    return;
  }
  const currentDistrict = profile.worldDistrict || profile.district || 'Kottayam';
  profileDistrict.textContent = `${currentDistrict} · ${profile.gender === 'female' ? 'Female' : 'Male'} avatar`;
  profileDistrict.title = profile.district && profile.district !== currentDistrict
    ? `Home district: ${profile.district}`
    : '';
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
    const remoteOutfit = data.outfit || 'casual';
    const remoteAppearance = data.avatarCustomization && typeof data.avatarCustomization === 'object' ? data.avatarCustomization : {};
    if (remote && (remote.userData.gender !== data.gender || remote.userData.outfit !== remoteOutfit
      || JSON.stringify(remote.userData.avatarCustomization || {}) !== JSON.stringify(remoteAppearance))) {
      sceneRef.remove(remote); remote.userData.label?.remove(); disposeObject(remote);
      remotePlayers.delete(data.id); remote = null;
    }
    if (!remote) {
      remote = new THREE.Group();
      const remoteSeed = avatarStyleSeed(data.id || data.username);
      const avatar = createHuman({ gender: data.gender, shirt: data.gender === 'female' ? 0xc57e93 : 0x569bb5,
        trousers: 0x293b50, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x2c2825, accent: 0xe5bb51,
        ...remoteAppearance, outfit: remoteOutfit, styleSeed: remoteSeed });
      remote.add(avatar);
      attachContactShadow(remote, .48, .32, .18);
      applyDynamicHighQuality(remote);
      remote.position.set(data.x, 0, data.z);
      remote.userData = {
        avatar, gender: data.gender, outfit: remoteOutfit, avatarCustomization: { ...remoteAppearance }, phase: 0,
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
    remote.userData.predicted.x = THREE.MathUtils.clamp(remote.userData.predicted.x, -WORLD_LIMIT, WORLD_LIMIT);
    remote.userData.predicted.z = THREE.MathUtils.clamp(remote.userData.predicted.z, -WORLD_LIMIT, WORLD_LIMIT);
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
      animatePlayer(remote, remote.userData.phase, remoteOnFoot ? (remoteRunning ? .78 : .36) : 0, remoteRunning ? 1 : 0);
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
  const config = DISTRICT_INSTANCE_CONFIG[district] || DISTRICT_INSTANCE_CONFIG.Kottayam;
  playerRef.position.set(config.spawn.x, 0, config.spawn.z);
  playerRef.rotation.y = config.spawn.rotation || 0;
  updateMapPlayer(playerRef);
}

function recoverBlockedPlayerSpawn(player, force = false) {
  if (!player || (!force && !positionBlockedStatic(player.position.x, player.position.z, .43))) return false;
  const originX = player.position.x;
  const originZ = player.position.z;
  // A persisted position can become enclosed after a new house or landmark is
  // added. Find the nearest free walking point before controls begin.
  for (const ring of [1.2, 2.1, 3.2, 4.8, 6.8, 9.5, 13, 18, 25]) {
    for (let index = 0; index < 24; index++) {
      const angle = index / 24 * Math.PI * 2;
      const x = clampDistrictX(originX + Math.sin(angle) * ring, 2);
      const z = clampDistrictZ(originZ + Math.cos(angle) * ring, 2);
      if (!positionBlockedStatic(x, z, .43)) { player.position.set(x, 0, z); return true; }
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

const DISTRICT_MAP_ANCHORS = Object.freeze({
  Kasaragod:{ x:25.5, y:29 }, Kannur:{ x:38.5, y:59 }, Wayanad:{ x:59, y:77 }, Kozhikode:{ x:50, y:96 },
  Malappuram:{ x:59, y:116 }, Palakkad:{ x:73, y:133 }, Thrissur:{ x:66, y:151 }, Ernakulam:{ x:69, y:180 },
  Idukki:{ x:91, y:193 }, Kottayam:{ x:78, y:207 }, Alappuzha:{ x:70, y:219 }, Pathanamthitta:{ x:86, y:230 },
  Kollam:{ x:85, y:249 }, Thiruvananthapuram:{ x:88, y:273 },
});
function worldToKeralaMap(worldX, worldZ) {
  const bands = [[.02,18.8,2.16],[.12,30.98,6.77],[.28,52.4,11.04],[.44,67.99,16.2],[.60,79.11,17.28],[.76,84.12,16.51],[.90,88.03,7.95],[.98,92.87,2.26]];
  const anchor = DISTRICT_MAP_ANCHORS[currentWorldDistrictName()] || { x:60, y:150 };
  const anchorT = clamp((anchor.y - 8) / 284, .02, .98);
  const anchorZ = WORLD_LIMIT - anchorT * WORLD_LIMIT * 2;
  const localT = clamp((WORLD_LIMIT - (anchorZ + worldZ * .11)) / (WORLD_LIMIT * 2), .02, .98);
  const interpolate = t => {
    let index = 0;
    while (index < bands.length - 2 && t > bands[index + 1][0]) index++;
    const [t0, center0, half0] = bands[index];
    const [t1, center1, half1] = bands[index + 1];
    const amount = clamp((t - t0) / (t1 - t0), 0, 1);
    return { center:lerp(center0, center1, amount), half:Math.max(1.4, lerp(half0, half1, amount) - 1.15) };
  };
  const districtCenter = interpolate(anchorT);
  const mapCenter = interpolate(localT);
  const districtOffset = anchor.x - districtCenter.center;
  return {
    x:mapCenter.center + districtOffset + clamp(worldX * .75 / WORLD_LIMIT, -1, 1) * mapCenter.half,
    y:8 + localT * 284,
  };
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
  if (currentWorldDistrictName() !== 'Kottayam' || !place || !player || place.kind === 'bus') return '';
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

function currentNavigationPlaces() {
  const district = currentWorldDistrictName();
  const existing = navigationPlaces.filter(place =>
    (place.district === district || (district === 'Kottayam' && place.district === 'Village'))
    && place.kind !== 'landmark'
  );
  const attractions = districtAtlasPlaces(district);
  if (district === 'Kottayam') return [...existing, ...attractions];
  if (district === 'Ernakulam') {
    return [
      ...existing,
      { id:'ernakulam-rental', name:'Ernakulam Rental Home', icon:'H', x:-48, z:40, kind:'home', district },
      { id:'ernakulam-rest', name:'Ernakulam Rest Bench', icon:'R', x:4, z:40, kind:'rest', district },
      ...attractions,
    ];
  }
  const config = currentDistrictInstance();
  const city = districtCityProfile(district);
  const fuelPosition = genericDistrictFuelPosition(!!config.airport);
  return [
    { id:'district-centre', name:city.centre, icon:'C', x:0, z:0, kind:'town', district },
    { id:'district-rail', name:district + ' Railway Station', icon:'🚆', x:config.train.x, z:config.train.z, kind:'rail', district },
     { id:'district-market', name:city.market, icon:'S', x:20, z:12.5, kind:'shop', district },
    { id:'district-cafe', name:city.cafe, icon:'C', x:-44, z:22, kind:'shop', district },
     { id:'district-hospital', name:district + ' District Hospital', icon:'+', x:-20, z:11.5, kind:'health', district },
    { id:'district-police', name:district + ' District Police', icon:'P', x:-20, z:-18, kind:'police', district },
    { id:'district-fire', name:district + ' Fire & Rescue', icon:'F', x:20, z:-18, kind:'emergency', district },
     { id:'district-home', name:district + ' Rental Home', icon:'H', x:-24, z:-27, kind:'home', district },
    { id:'district-rest', name:district + ' Rest Park', icon:'R', x:-10, z:-10, kind:'rest', district },
    { id:'district-fuel', name:district + ' Fuel Station', icon:'F', ...fuelPosition, kind:'service', district },
    { id:'district-service', name:district + ' Service Garage', icon:'G', x:-18, z:-48, kind:'service', district },
     { id:'district-neighbourhood', name:city.neighbourhood, icon:'N', x:-55, z:-29, kind:'town', district },
    { id:'district-centre-bus', name:city.centre + ' Bus Stop', icon:'🚌', x:10, z:8, kind:'bus', district },
     { id:'district-market-bus', name:city.market + ' Bus Stop', icon:'🚌', x:28, z:13.5, kind:'bus', district },
     { id:'district-rail-bus', name:district + ' Railway Bus Stop', icon:'🚌', x:-34, z:-14.5, kind:'bus', district },
     { id:'district-neighbourhood-bus', name:city.neighbourhood + ' Bus Stop', icon:'🚌', x:-55, z:-29, kind:'bus', district },
    ...(config.airport ? [{ id:'district-airport', name:district + ' Airport', icon:'✈', x:config.airport.x, z:config.airport.z, kind:'airport', district }] : []),
    ...attractions,
  ];
}
function renderNearbyPlaces() {
  if (!nearbyPlaces || !playerRef) return;
  nearbyPlaces.replaceChildren();
  const entries = currentNavigationPlaces()
    .map(place => ({ place, distance: placeDistance(place) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);
  for (const { place, distance } of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nearby-place${selectedDestination?.id === place.id ? ' selected' : ''}`;
    button.dataset.placeId = place.id;
    button.title = place.description || place.name;
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

function renderDistrictGuide() {
  if (!districtGuideContent) return;
  const district = currentWorldDistrictName();
  const atlas = KERALA_DISTRICT_ATLAS[district];
  if (!atlas) {
    districtGuideContent.replaceChildren();
    return;
  }
  if (districtGuideHeading) districtGuideHeading.textContent = district + ' · ' + atlas.landscape;
  districtGuideContent.replaceChildren();

  const identity = document.createElement('p');
  identity.className = 'district-guide-identity';
  identity.textContent = atlas.culture.identity;
  districtGuideContent.append(identity);

  const sections = [
    ['Language', 'language'],
    ['Arts & everyday culture', 'arts'],
    ['Local food', 'food'],
    ['Festivals', 'festivals'],
    ['Crafts & livelihoods', 'crafts'],
  ];
  for (const [label, field] of sections) {
    const section = document.createElement('section');
    section.className = 'district-guide-section';
    const heading = document.createElement('strong');
    heading.textContent = label;
    const copy = document.createElement('p');
    copy.textContent = atlas.culture[field];
    section.append(heading, copy);
    districtGuideContent.append(section);
  }

  const spots = document.createElement('div');
  spots.className = 'district-guide-spots';
  const spotsHeading = document.createElement('strong');
  spotsHeading.className = 'district-guide-spots-heading';
  spotsHeading.textContent = 'Main places · select to set a route';
  spots.append(spotsHeading);
  const routes = document.createElement('div');
  routes.className = 'district-guide-routes';
  for (const attraction of atlas.attractions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'district-guide-route';
    button.title = attraction.description;
    const name = document.createElement('b');
    name.textContent = attraction.name;
    const description = document.createElement('small');
    description.textContent = attraction.description;
    button.append(name, description);
    button.addEventListener('click', () => {
      const place = currentNavigationPlaces().find(item => item.district === district && item.attractionId === attraction.id);
      if (place) setWaypoint(place);
    });
    routes.append(button);
  }
  spots.append(routes);
  districtGuideContent.append(spots);
}

function renderMapLandmarks() {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  if (districtLabels) districtLabels.style.display = mapLabelsVisible ? 'block' : 'none';
  mapLayer.replaceChildren();
  currentNavigationPlaces().forEach(place => {
    const point = worldToKeralaMap(place.x, place.z);
    const marker = document.createElementNS(svgNamespace, 'g');
    const classes = ['landmark-marker'];
    if (place.kind !== 'landmark') classes.push('poi-marker', place.kind);
    if (selectedDestination?.id === place.id) classes.push('selected');
    marker.setAttribute('class', classes.join(' '));
    marker.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ')');
    marker.setAttribute('aria-label', place.description ? place.name + ': ' + place.description : 'Set destination: ' + place.name);
    marker.setAttribute('title', place.description || place.name);
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
  renderDistrictGuide();
}
function setWaypoint(place) {
  if (!place || !Number.isFinite(Number(place.x)) || !Number.isFinite(Number(place.z))) return;
  selectedDestination = place;
  selectedLandmark = place.kind === 'landmark' ? place : null;
  lifeLoopAction = 'map';
  missionCard.dataset.lifeAction = 'map';
  missionText.textContent = `Destination: ${place.name}`;
  mapStatus.title = place.description || place.name;
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
  const panels = { map: minimap, people: peoplePanel, chat: chatPanel, tasks: taskPanel, dm: dmPanel, wardrobe: wardrobePanel };
  Object.entries(panels).forEach(([name, panel]) => panel.classList.toggle('open', name === which));
  mapOpen.setAttribute('aria-expanded', String(which === 'map'));
  peopleToggle.setAttribute('aria-expanded', String(which === 'people'));
  chatToggle.setAttribute('aria-expanded', String(which === 'chat'));
  taskToggle.setAttribute('aria-expanded', String(which === 'tasks'));
  wardrobeToggle?.setAttribute('aria-expanded', String(which === 'wardrobe'));
  if (which === 'map') finishTask('open-map');
  if (which === 'tasks') renderTasks();
  if (which === 'wardrobe') renderWardrobePanel();
}

function avatarCustomizationControls(gender) {
  const colors = entries => entries.map(([value, label]) => ({ value, label }));
  const common = [
    { field: 'skin', label: 'Skin tone', fallback: 0xa96d4c, options: colors([[0xa96d4c, 'Warm brown'], [0x915a40, 'Deep brown'], [0xb97a57, 'Golden brown'], [0x855137, 'Rich brown'], [0x6a4335, 'Umber']]) },
    { field: 'faceShape', label: 'Face shape', fallback: 'auto', options: [['auto', 'Natural'], ['oval', 'Oval'], ['balanced', 'Balanced'], ['round', 'Round'], ['angular', 'Angular']].map(([value, label]) => ({ value, label })) },
    { field: 'hairStyle', label: 'Hairstyle', fallback: 'auto', options: (gender === 'female'
      ? [['auto', 'Natural'], ['long', 'Long'], ['shoulder', 'Shoulder length'], ['braid', 'Braid'], ['bun', 'Bun']]
      : [['auto', 'Natural'], ['crop', 'Short crop'], ['side-part', 'Side part'], ['curly', 'Curly'], ['swept', 'Swept']]).map(([value, label]) => ({ value, label })) },
    { field: 'hair', label: 'Hair colour', fallback: 0x171616, options: colors([[0x171616, 'Black'], [0x38251e, 'Espresso'], [0x5c3928, 'Chestnut'], [0x4b443e, 'Salt and pepper']]) },
    { field: 'bodyBuild', label: 'Body build', fallback: 'average', options: [['slim', 'Slim'], ['average', 'Average'], ['broad', 'Broad']].map(([value, label]) => ({ value, label })) },
    { field: 'height', label: 'Height', fallback: 1, options: [[.9, 'Short'], [1, 'Average'], [1.1, 'Tall']].map(([value, label]) => ({ value, label })) },
    { field: 'shirt', label: 'Top colour', fallback: gender === 'female' ? 0x1e8173 : 0x2a759b, options: colors([[0x2a759b, 'Monsoon blue'], [0x1e8173, 'Backwater teal'], [0x9a3046, 'Kasavu maroon'], [0x875d45, 'Laterite brown'], [0xc97987, 'Rose'], [0x557a54, 'Leaf green']]) },
    { field: 'trousers', label: 'Lower colour', fallback: gender === 'female' ? 0x273253 : 0x26354a, options: colors([[0x26354a, 'Navy'], [0x273253, 'Indigo'], [0x2e3447, 'Charcoal'], [0x303548, 'Slate'], [0x494234, 'Earth']]) },
  ];
  if (gender !== 'female') common.splice(4, 0, {
    field: 'facialHair', label: 'Facial hair', fallback: 'auto',
    options: [['auto', 'Natural'], ['none', 'Clean shaven'], ['moustache', 'Moustache'], ['goatee', 'Goatee'], ['beard', 'Beard']].map(([value, label]) => ({ value, label })),
  });
  return common;
}

function renderAvatarCustomization() {
  if (!avatarCustomizationPanel || !profile) return;
  const gender = profile.gender || 'male';
  const saved = profile.avatarCustomization || {};
  const saving = wardrobeOptions?.dataset.saving === 'true';
  const heading = document.createElement('strong');
  heading.textContent = 'Personalise your avatar';
  const controls = avatarCustomizationControls(gender).map(({ field, label, fallback, options }) => {
    const wrapper = document.createElement('label');
    wrapper.append(document.createTextNode(label));
    const select = document.createElement('select');
    select.dataset.avatarField = field;
    select.setAttribute('aria-label', label);
    select.disabled = saving;
    for (const optionData of options) {
      const option = document.createElement('option');
      option.value = String(optionData.value);
      option.textContent = optionData.label;
      select.append(option);
    }
    select.value = String(saved[field] ?? fallback);
    wrapper.append(select);
    return wrapper;
  });
  avatarCustomizationPanel.replaceChildren(heading, ...controls);
}

function renderWardrobePanel() {
  if (!wardrobeOptions || !profile) return;
  const choices = profile.gender === 'male'
    ? [['casual', 'Casual', 'T-shirt and trousers'], ['mundu', 'Kerala mundu', 'Traditional wrap with gold border']]
    : profile.gender === 'female'
      ? [['casual', 'Casual', 'Kurta and trousers'], ['saree', 'Kerala saree', 'Traditional drape and gold border']]
      : [['casual', 'Casual', 'Everyday clothes']];
  const selected = profile.outfit || 'casual';
  wardrobeOptions.replaceChildren(...choices.map(([outfit, title, description]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.outfit = outfit;
    button.setAttribute('aria-pressed', String(selected === outfit));
    button.disabled = wardrobeOptions.dataset.saving === 'true';
    const name = document.createElement('strong');
    name.textContent = title;
    const note = document.createElement('small');
    note.textContent = description;
    button.append(name, note);
    return button;
  }));
  renderAvatarCustomization();
  if (wardrobeStatus) wardrobeStatus.textContent = `Currently wearing ${choices.find(([outfit]) => outfit === selected)?.[1] || 'Casual'}. Your choice is saved to your account.`;
}

async function saveWardrobeOutfit(outfit) {
  if (!profile || !['casual', 'mundu', 'saree'].includes(outfit) || wardrobeOptions?.dataset.saving === 'true') return;
  if (wardrobeError) wardrobeError.textContent = '';
  if (wardrobeOptions) wardrobeOptions.dataset.saving = 'true';
  renderWardrobePanel();
  try {
    const result = await api('/api/profile', { outfit }, 'PATCH');
    if (!result?.user) throw new Error('Could not save this outfit. Try again.');
    acceptUser(result.user);
    if (wardrobeStatus) wardrobeStatus.textContent = 'Outfit updated and saved to your account.';
  } catch (error) {
    if (wardrobeError) wardrobeError.textContent = error?.message || 'Could not save this outfit. Try again.';
  } finally {
    if (wardrobeOptions) delete wardrobeOptions.dataset.saving;
    renderWardrobePanel();
  }
}

async function saveAvatarCustomization(field, value) {
  if (!profile || wardrobeOptions?.dataset.saving === 'true') return;
  const definitions = avatarCustomizationControls(profile.gender);
  const control = definitions.find(option => option.field === field);
  if (!control || !control.options.some(option => option.value === value)) return;
  if (wardrobeError) wardrobeError.textContent = '';
  if (wardrobeOptions) wardrobeOptions.dataset.saving = 'true';
  renderWardrobePanel();
  try {
    const result = await api('/api/profile', { avatarCustomization: { [field]: value } }, 'PATCH');
    if (!result?.user) throw new Error('Could not save this appearance. Try again.');
    acceptUser(result.user);
    if (wardrobeStatus) wardrobeStatus.textContent = 'Avatar appearance saved to your account.';
  } catch (error) {
    if (wardrobeError) wardrobeError.textContent = error?.message || 'Could not save this appearance. Try again.';
  } finally {
    if (wardrobeOptions) delete wardrobeOptions.dataset.saving;
    renderWardrobePanel();
  }
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
  wardrobeToggle?.addEventListener('click', () => {
    if (!profile) { showToast('Sign in to choose an outfit.'); return; }
    setOpenPanel(wardrobePanel.classList.contains('open') ? null : 'wardrobe');
    collapseHudMenuAfterAction();
  });
  document.querySelector('#wardrobe-close')?.addEventListener('click', () => setOpenPanel());
  wardrobeOptions?.addEventListener('click', event => {
    const button = event.target.closest('button[data-outfit]');
    if (button && !button.disabled) saveWardrobeOutfit(button.dataset.outfit);
  });
  avatarCustomizationPanel?.addEventListener('change', event => {
    const select = event.target.closest('select[data-avatar-field]');
    if (!select || select.disabled) return;
    const field = select.dataset.avatarField;
    const value = ['skin', 'hair', 'shirt', 'trousers', 'height'].includes(field) ? Number(select.value) : select.value;
    saveAvatarCustomization(field, value);
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
  scene.fog = new THREE.Fog(0x92c9ff, 58, 185);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 280);
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
  } else if (profile) placePlayerAtDistrict(profile.worldDistrict || profile.district);
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
  atmosphere = createAtmosphere(THREE, {
    scene, renderer, camera, sun: warmLight, hemi: sun,
    climate: districtCityProfile(renderedWorldDistrict).environment,
  });
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
  let playerRunBlend = 0;
  const walkSafePosition = new THREE.Vector3().copy(player.position);
  let walkSafeRotation = player.rotation.y;
  let walkSafeReady = !positionBlockedStatic(player.position.x, player.position.z, .48);
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
    updateProfileHud();
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

  function triggerJump() {
    if (vehicleMode !== 'walk' || jumpHeight > .02) return;
    if (performance.now() < Number(player.userData.vehicleTransition?.lockUntil || 0)) return;
    if (player.userData.restPoseReturn) {
      restorePlayerRestPosition(player);
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
    }
    jumpVelocity = 4.35;
    player.userData.jumpLandingBlend = 0;
    jumpButton?.classList.add('active');
    setTimeout(() => jumpButton?.classList.remove('active'), 180);
  }
  jumpButton?.addEventListener('pointerdown', event => { event.preventDefault(); triggerJump(); });
  cameraSwitchButton?.addEventListener('click', () => {
    if (vehicleMode === 'walk') return;
    vehicleCameraView = vehicleCameraView === 'chase' ? 'interior' : 'chase';
    cameraSwitchButton.textContent = vehicleCameraView === 'interior' ? 'CHASE' : 'CAM';
    showToast(vehicleCameraView === 'interior' ? 'Interior driving camera' : 'Chase driving camera');
  });

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
    if (vehicleMode === 'walk' && (event.code === 'Space' || key === 'j') && !event.repeat) { triggerJump(); event.preventDefault(); return; }
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
    const transitionLocked = performance.now() < Number(player.userData.vehicleTransition?.lockUntil || 0);
    const controlLength = paused || transitionLocked ? 0 : Math.min(1, Math.hypot(controlX, controlY));
    if (player.userData.resetWalkSafe) {
      walkSafePosition.copy(player.position);
      walkSafeRotation = player.rotation.y;
      walkSafeReady = !positionBlockedStatic(player.position.x, player.position.z, .48);
      walkSafeAccumulator = 0;
      player.userData.resetWalkSafe = false;
    }
    let movingNow = false;
    player.userData.isTurningInPlace = false;

    const restTransition = player.userData.restPoseReturn;
    if (restTransition && (controlLength > .08 || runHeld)) {
      restorePlayerRestPosition(player);
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
    }

    const restApproach = player.userData.restPoseReturn;
    if (vehicleMode === 'walk' && restApproach?.approaching) {
      playerRunningVisual = false;
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
      const dx = restApproach.targetX - player.position.x;
      const dz = restApproach.targetZ - player.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > .08) {
        const restWalkSpeed = 2.35;
        const step = Math.min(distance, restWalkSpeed * delta);
        const beforeX = player.position.x;
        const beforeZ = player.position.z;
        const travelYaw = Math.atan2(dx, dz);
        player.rotation.y = rotateTowards(player.rotation.y, travelYaw, delta * 9);
        moveWithCollision(player, dx / distance * step, dz / distance * step, .43);
        const movedDistance = Math.hypot(player.position.x - beforeX, player.position.z - beforeZ);
        if (movedDistance > .0005) {
          restApproach.stuckSeconds = 0;
          walkPhase += movedDistance * (Math.PI * 2 / 1.38);
          const animationAmount = Math.min(1, movedDistance / Math.max(.0001, restWalkSpeed * delta));
          animatePlayer(player, walkPhase, animationAmount, 0);
          movingNow = true;
          addWalkProgress(movedDistance);
          if (mapAccumulator >= .15) { updateMapPlayer(player); mapAccumulator = 0; }
        } else {
          restApproach.stuckSeconds += delta;
          animatePlayer(player, walkPhase, 0);
        }

        const remaining = Math.hypot(restApproach.targetX - player.position.x, restApproach.targetZ - player.position.z);
        if (remaining <= .08) {
          player.position.set(restApproach.targetX, 0, restApproach.targetZ);
          restApproach.approaching = false;
          restApproach.atSeat = true;
          restApproach.stuckSeconds = 0;
          walkSafePosition.copy(player.position);
          walkSafeRotation = player.rotation.y;
          walkSafeReady = true;
          updateMapPlayer(player);
        } else if (restApproach.stuckSeconds > .8) {
          restorePlayerRestPosition(player);
          showToast('Could not reach a clear path to the rest bench');
        }
      }
      if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * .82);
    } else if (vehicleMode === 'walk' && restApproach?.atSeat) {
      playerRunningVisual = false;
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
      animatePlayer(player, walkPhase, 0);
      player.rotation.y = rotateTowards(player.rotation.y, restApproach.targetYaw, delta * 5.2);
      if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, Math.PI, delta * .82);
      const yawError = Math.atan2(Math.sin(restApproach.targetYaw - player.rotation.y), Math.cos(restApproach.targetYaw - player.rotation.y));
      if (Math.abs(yawError) < .025) {
        player.rotation.y = restApproach.targetYaw;
        restApproach.atSeat = false;
        player.userData.restPoseUntil = performance.now() + restApproach.durationMs;
      }
    } else if (vehicleMode !== 'walk') {
      walkVelocity.set(0, 0, 0);
      targetWalkVelocity.set(0, 0, 0);
      const vehicleRadius = vehicleMode === 'taxi' ? .92 : .56;

      if (positionBlocked(player.position.x, player.position.z, vehicleRadius)) {
        recoverVehicleOverlap(player, vehicleRadius);
      } else {
        rememberVehicleSafePose(player, vehicleRadius);
      }

      const rawThrottle = paused || transitionLocked ? 0 : (acceleratorHeld ? 1 : THREE.MathUtils.clamp(-controlY, -1, 1));
      const rawSteering = paused || transitionLocked ? 0 : THREE.MathUtils.clamp(controlX, -1, 1);
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
      if (vehicleMode === 'bike') applyBikeRiderPose(player, delta, smoothedDriveSteering, speedRatio, runHeld);
      if (mapAccumulator >= .12) { updateMapPlayer(player); mapAccumulator = 0; }
    } else {
      driveSpeed = 0;
      driveSpeedRatio = 0;
      playerRunningVisual = false;
      smoothedDriveSteering += (0 - smoothedDriveSteering) * (1 - Math.exp(-delta * 10));
      const runningNow = runHeld && !transitionLocked;
      if (runningNow && controlLength > .08) runCruiseArmed = true;
      const autoRun = runningNow && runCruiseArmed && controlLength <= .08;
      const walkingInput = controlLength > .08 || autoRun;
      const backwardInput = !autoRun
        && controlY > .30
        && Math.abs(controlY) >= Math.abs(controlX) * .70;
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
        const maxWalkSpeed = (backwardInput ? 2.15 : runningNow ? 6.25 : 3.05) * needsFactor;
        targetWalkVelocity.copy(desiredMove).multiplyScalar(maxWalkSpeed * inputCurve);

        let walkTurn = player.userData.walkTurn;
        if (walkTurn && backwardInput) {
          player.userData.walkTurn = null;
          walkTurn = null;
        }
        if (!backwardInput && !autoRun && desiredMove.lengthSq() > .0001) {
          const requestedYaw = Math.atan2(desiredMove.x, desiredMove.z);
          const turnError = Math.atan2(
            Math.sin(requestedYaw - player.rotation.y),
            Math.cos(requestedYaw - player.rotation.y)
          );
          if (!walkTurn && Math.abs(turnError) > Math.PI * .62) {
            walkTurn = { targetYaw: requestedYaw };
            player.userData.walkTurn = walkTurn;
          }
          if (walkTurn) {
            walkTurn.targetYaw = requestedYaw;
            targetWalkVelocity.set(0, 0, 0);
          }
        } else if (walkTurn) {
          player.userData.walkTurn = null;
        }
      } else {
        targetWalkVelocity.set(0, 0, 0);
        player.userData.walkTurn = null;
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
        const overlappingWorld = positionBlockedStatic(player.position.x, player.position.z, .43);
        walkingStuckSeconds = movedDistance < .0005 ? walkingStuckSeconds + delta : 0;

        // Do not teleport someone simply because they are pressing into a wall.
        // Recovery is reserved for genuine overlap/spawn bugs; ordinary contact
        // drops the accumulated velocity so the next input can slide away cleanly.
        if (walkingStuckSeconds > .72 && overlappingWorld) {
          let recovered = false;
          if (walkSafeReady && !positionBlockedStatic(walkSafePosition.x, walkSafePosition.z, .48)) {
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
          const backwardMotion = backwardInput && Math.abs(yawDelta) > Math.PI * .50;
          // Turn the body toward actual travel quickly enough that direction
          // changes never read as moonwalking, while keeping small turns smooth.
          // An explicit backwards input instead keeps the chest facing forward.
          if (!backwardMotion && Math.abs(yawDelta) > Math.PI * .30) {
            player.rotation.y = desiredYaw;
          } else if (!backwardMotion) {
            const actualSpeed = movedDistance / Math.max(delta, .001);
            const runBlend = THREE.MathUtils.clamp((actualSpeed - 3.0) / 2.0, 0, 1);
            const turnSpeed = THREE.MathUtils.lerp(13.5, 10.8, runBlend);
            player.rotation.y = rotateTowards(player.rotation.y, desiredYaw, delta * turnSpeed);
          }
          if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * .82);

          const actualSpeed = movedDistance / Math.max(delta, .001);
          const runBlend = backwardMotion ? 0 : THREE.MathUtils.clamp((actualSpeed - 3.0) / 2.0, 0, 1);
          playerRunningVisual = !backwardMotion && runBlend > .34;
          const animationSpeed = backwardMotion ? 2.15 : runningNow ? 5.4 : 3.05;
          const animationAmount = Math.min(1, movedDistance / Math.max(.0001, animationSpeed * needsFactor * delta));
          // Advance gait from distance that the collision system actually allowed.
          // This keeps footstep beats and planted feet tied to ground travel rather
          // than letting the legs cycle while the avatar is blocked or creeping.
          const strideLength = THREE.MathUtils.lerp(1.38, 1.68, runBlend);
          walkPhase += movedDistance * (Math.PI * 2 / strideLength);
          animatePlayer(player, walkPhase, animationAmount, runBlend, backwardMotion);

          walkSafeAccumulator += delta;
          if (walkSafeAccumulator >= .22 && !positionBlockedStatic(player.position.x, player.position.z, .48)) {
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
        const walkTurn = player.userData.walkTurn;
        if (walkTurn) {
          const yawError = Math.atan2(
            Math.sin(walkTurn.targetYaw - player.rotation.y),
            Math.cos(walkTurn.targetYaw - player.rotation.y)
          );
          player.userData.isTurningInPlace = Math.abs(yawError) > .035;
          player.userData.turnDirection = Math.sign(yawError);
          player.rotation.y = rotateTowards(player.rotation.y, walkTurn.targetYaw, delta * 4.8);
          if (Math.abs(yawError) <= .035) {
            player.rotation.y = walkTurn.targetYaw;
            player.userData.walkTurn = null;
          }
          if (lookPointerId === null) cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * .82);
          animatePlayer(player, walkPhase, 0);
        } else {
          player.userData.isTurningInPlace = false;
          animatePlayer(player, walkPhase, 0);
        }
      }
    }

    animatePlayerConversation(player, delta, movingNow);
    animatePlayerPhone(player, delta, movingNow);
    animatePlayerRest(player, delta, movingNow);
    animatePlayerTurn(player, delta, !!player.userData.isTurningInPlace, Number(player.userData.turnDirection) || 0);
    animatePlayerVehicleTransition(player, delta);
    playerRunBlend = THREE.MathUtils.clamp(Number(player.userData.avatar?.userData.locomotionRunBlend) || 0, 0, 1);
    playerRunningVisual = playerRunBlend > .42;

    if (!footstepEffectsFailed) {
      try {
        const jumpBlend = THREE.MathUtils.smoothstep(Math.max(0, jumpHeight), .015, .24);
        updateFootstepEffects(delta, player, movingNow && jumpBlend < .12, playerRunningVisual, walkPhase);
      } catch (error) {
        footstepEffectsFailed = true;
        console.warn('Footstep visuals disabled after a runtime error:', error);
      }
    }

    if (vehicleMode === 'walk') {
      const wasAirborne = jumpHeight > 0;
      jumpVelocity -= 11.8 * delta;
      jumpHeight = Math.max(0, jumpHeight + jumpVelocity * delta);
      const landed = wasAirborne && jumpHeight <= 0;
      if (jumpHeight <= 0) { jumpHeight = 0; jumpVelocity = 0; }
      if (landed) player.userData.jumpLandingBlend = 1;
      else player.userData.jumpLandingBlend = (Number(player.userData.jumpLandingBlend) || 0) * Math.exp(-Math.max(0, delta) * 8.5);
      const avatar = player.userData.avatar;
      if (avatar) avatar.position.y += jumpHeight;
      applyPlayerJumpPose(player, jumpHeight, jumpVelocity, player.userData.jumpLandingBlend);
    } else {
      jumpHeight = 0;
      jumpVelocity = 0;
      player.userData.jumpLandingBlend = 0;
    }

    const drivingCamera = vehicleMode !== 'walk';
    const jumpCameraDampen = 1 - THREE.MathUtils.smoothstep(Math.max(0, jumpHeight), .015, .24);
    const walkingMotion = !drivingCamera && movingNow
      ? THREE.MathUtils.lerp(.62, 1, playerRunBlend) * jumpCameraDampen
      : 0;
    const walkBob = Math.sin(walkPhase * 2) * THREE.MathUtils.lerp(.026, .040, playerRunBlend) * walkingMotion;
    const walkSway = Math.sin(walkPhase) * THREE.MathUtils.lerp(.016, .024, playerRunBlend) * walkingMotion;

    const driveImpulseTarget = drivingCamera
      ? (acceleratorHeld ? .12 : 0) - (runHeld ? .16 : 0)
      : 0;
    cameraDriveImpulse += (driveImpulseTarget - cameraDriveImpulse) * (1 - Math.exp(-delta * 5.5));

    const lookAhead = drivingCamera
      ? .75 + driveSpeedRatio * 2.2 + cameraDriveImpulse * 1.35
      : 0;
    const baseTargetHeight = vehicleMode === 'taxi' ? 1.28 : vehicleMode === 'bike' ? 1.18 : 1.45;
    const restSeat = player.userData.restPoseReturn;
    const seatedView = !!restSeat && !restSeat.approaching && !restSeat.atSeat;
    const seatPoseBlend = seatedView
      ? THREE.MathUtils.clamp(Number(player.userData.avatar?.userData?.restPoseBlend) || 0, 0, 1)
      : 0;
    const seatOffset = seatedView ? (Number(restSeat.avatarSeatZ) || 1.34) * seatPoseBlend : 0;
    const cameraFollowX = player.position.x + Math.sin(player.rotation.y) * seatOffset;
    const cameraFollowZ = player.position.z + Math.cos(player.rotation.y) * seatOffset;
    cameraTarget.set(
      cameraFollowX + Math.sin(player.rotation.y) * lookAhead,
      player.position.y + jumpHeight + baseTargetHeight - .15 * seatPoseBlend + walkBob * .42 + cameraDriveImpulse * .10,
      cameraFollowZ + Math.cos(player.rotation.y) * lookAhead
    );

    const interiorCamera = vehicleMode === 'taxi' && vehicleCameraView === 'interior';
    const baseDistance = interiorCamera ? .28 : vehicleMode === 'taxi' ? 8.35 : vehicleMode === 'bike' ? 7.35 : 7.1;
    const distance = baseDistance
      + (drivingCamera && !interiorCamera ? driveSpeedRatio * 1.35 + cameraDriveImpulse * .72 : 0);
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
      cameraFollowX + Math.sin(cameraYaw) * horizontal + cameraRightX * lateralMotion + rainShakeX,
      player.position.y + jumpHeight + (interiorCamera ? 1.42 : drivingCamera ? 1.32 : 1.45) - .15 * seatPoseBlend + Math.sin(cameraPitch) * distance + walkBob + rainShakeY,
      cameraFollowZ + Math.cos(cameraYaw) * horizontal + cameraRightZ * lateralMotion
    );

    const targetFov = 60
      + (drivingCamera ? driveSpeedRatio * 4.8 : movingNow ? .65 * playerRunBlend : 0)
      + (drivingCamera && acceleratorHeld ? .35 : 0);
    const nextFov = camera.fov + (targetFov - camera.fov) * (1 - Math.exp(-delta * 4.6));
    if (Math.abs(nextFov - camera.fov) > .002) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    if (!interiorCamera) resolveCameraCollision(cameraTarget, cameraPosition, drivingCamera ? .42 : .34);
    const cameraResponse = drivingCamera ? 6.5 + driveSpeedRatio * 1.6 : 8.6;
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * cameraResponse));
    if (!interiorCamera && positionBlockedStatic(camera.position.x, camera.position.z, drivingCamera ? .38 : .30)) {
      camera.position.copy(cameraPosition);
    }
    camera.lookAt(cameraTarget);
    updateBusStopCameraOcclusion(camera.position, cameraTarget, delta);
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

function avatarColorOption(value, fallback) {
  if (Number.isInteger(value) && value >= 0 && value <= 0xffffff) return value;
  if (typeof value === 'string' && /^#?[\da-f]{6}$/i.test(value)) return Number.parseInt(value.replace('#', ''), 16);
  return fallback;
}

function avatarChoice(value, choices, fallback = 'auto') {
  return typeof value === 'string' && choices.includes(value) ? value : fallback;
}

function replacePlayerAvatar(gender) {
  if (!playerRef) return;
  const oldAvatar = playerRef.userData.avatar;
  if (oldAvatar) { playerRef.remove(oldAvatar); disposeObject(oldAvatar); }
  const styleSeed = avatarStyleSeed(profile?.id || profile?.username || gender);
  const defaults = gender === 'female'
    ? { gender: 'female', shirt: 0x1e8173, trousers: 0x273253, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x6c3c2c, accent: 0xe5bb51, outfit: profile?.outfit === 'saree' ? 'saree' : 'casual', styleSeed }
    : { gender: 'male', shirt: 0x2a759b, trousers: 0x26354a, skin: 0xa96d4c, hair: 0x171616, shoes: 0x27231f, accent: 0x6eaad0, outfit: profile?.outfit === 'mundu' ? 'mundu' : 'casual', styleSeed };
  const saved = profile?.avatarCustomization && typeof profile.avatarCustomization === 'object'
    ? profile.avatarCustomization
    : {};
  const styleOptions = gender === 'female'
    ? ['long', 'shoulder', 'braid', 'bun']
    : ['crop', 'side-part', 'curly', 'swept'];
  const avatarStyle = {
    ...defaults,
    shirt: avatarColorOption(saved.shirt, defaults.shirt),
    trousers: avatarColorOption(saved.trousers, defaults.trousers),
    skin: avatarColorOption(saved.skin, defaults.skin),
    hair: avatarColorOption(saved.hair, defaults.hair),
    shoes: avatarColorOption(saved.shoes, defaults.shoes),
    accent: avatarColorOption(saved.accent, defaults.accent),
    eyeColor: avatarColorOption(saved.eyeColor, null),
    outfit: avatarChoice(saved.outfit, gender === 'female' ? ['casual', 'saree'] : ['casual', 'mundu'], defaults.outfit),
    faceShape: avatarChoice(saved.faceShape, ['auto', 'oval', 'balanced', 'round', 'angular']),
    eyeShape: avatarChoice(saved.eyeShape, ['almond', 'round'], 'almond'),
    hairStyle: avatarChoice(saved.hairStyle, ['auto', ...styleOptions]),
    facialHair: gender === 'female' ? 'none' : avatarChoice(saved.facialHair, ['auto', 'none', 'moustache', 'goatee', 'beard']),
    bodyBuild: avatarChoice(saved.bodyBuild, ['slim', 'average', 'broad'], 'average'),
    height: THREE.MathUtils.clamp(Number(saved.height) || 1, .90, 1.10),
  };
  const avatar = applyDynamicHighQuality(createHuman(avatarStyle));
  avatar.position.y = .04;
  playerRef.add(avatar);
  playerRef.userData.avatar = avatar;
}

function createPleatedWrapGeometry(styleSeed = 0) {
  const geometry = new THREE.CylinderGeometry(.35, .29, .84, 24, 8, true);
  const position = geometry.getAttribute('position');
  const phase = (Number(styleSeed) || 0) * .42;
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius < .001) continue;
    const angle = Math.atan2(z, x);
    const pleat = .005 * Math.cos(angle * 8 + phase) + .002 * Math.cos(angle * 4 - phase);
    const scale = (radius + pleat) / radius;
    position.setX(index, x * scale);
    position.setZ(index, z * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createMunduGarment(styleSeed = 0) {
  const shades = [0xf0ede4, 0xe6dfcf, 0xf4f0e6, 0xe8e4d9];
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: shades[Math.floor(Math.abs(Number(styleSeed) || 0)) % shades.length],
    roughness: .94,
  });
  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xc5a866, roughness: .70, metalness: .12 });

  const garment = new THREE.Group();
  garment.name = 'kerala-mundu';
  garment.position.y = .59;
  garment.scale.z = .78;
  const cloth = new THREE.Mesh(createPleatedWrapGeometry(styleSeed), clothMaterial);
  cloth.name = 'mundu-cloth';

  const lowerGoldBorder = new THREE.Mesh(new THREE.CylinderGeometry(.298, .294, .024, 24, 1, true), borderMaterial);
  lowerGoldBorder.position.y = -.385;
  const upperGoldBorder = new THREE.Mesh(new THREE.CylinderGeometry(.301, .298, .012, 24, 1, true), borderMaterial);
  upperGoldBorder.position.y = -.36;
  garment.add(cloth, lowerGoldBorder, upperGoldBorder);
  return garment;
}

function createSareeGarment(styleSeed = 0) {
  const colors = [0x9a3046, 0x315580, 0x82465d, 0xa95f31, 0x527650];
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: colors[Math.floor(Math.abs(Number(styleSeed) || 0)) % colors.length],
    roughness: .90,
    side: THREE.DoubleSide,
  });
  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xd0ad62, roughness: .68, metalness: .12 });
  const garment = new THREE.Group();
  garment.name = 'kerala-saree';
  garment.position.y = .59;
  garment.scale.z = .78;
  garment.add(
    new THREE.Mesh(createPleatedWrapGeometry(styleSeed + 1), clothMaterial),
    new THREE.Mesh(new THREE.CylinderGeometry(.298, .294, .026, 24, 1, true), borderMaterial)
  );
  garment.children[1].position.y = -.385;

  const palluGeometry = new THREE.PlaneGeometry(.22, .82, 4, 14);
  const palluPosition = palluGeometry.getAttribute('position');
  for (let index = 0; index < palluPosition.count; index++) {
    const x = palluPosition.getX(index);
    const y = palluPosition.getY(index);
    const fold = .006 * Math.sin((y + .41) * 17 + styleSeed * .31) * Math.cos(x * 18);
    palluPosition.setZ(index, fold);
  }
  palluGeometry.computeVertexNormals();

  const drape = new THREE.Group();
  drape.position.set(-.015, .79, .331);
  drape.rotation.z = .36;
  const pallu = new THREE.Mesh(palluGeometry, clothMaterial);
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(.015, .84, .018), borderMaterial);
  const rightEdge = leftEdge.clone();
  leftEdge.position.x = -.105;
  rightEdge.position.x = .105;
  drape.add(pallu, leftEdge, rightEdge);
  garment.add(drape);
  return garment;
}

function createHumanHeadGeometry(faceShape = 'balanced') {
  const geometry = new THREE.SphereGeometry(.245, 24, 18);
  const position = geometry.getAttribute('position');
  const profiles = {
    oval: { taper: .15, cheek: .025, depth: .025 },
    balanced: { taper: .21, cheek: .035, depth: .018 },
    round: { taper: .10, cheek: .055, depth: .035 },
    angular: { taper: .28, cheek: .018, depth: .010 },
  };
  const profile = profiles[faceShape] || profiles.balanced;
  for (let index = 0; index < position.count; index++) {
    const y = position.getY(index) / .245;
    const lowerFace = THREE.MathUtils.clamp((-y + .08) / 1.08, 0, 1);
    const cheekVolume = Math.exp(-Math.pow((y + .12) / .31, 2));
    const width = 1 - profile.taper * lowerFace + profile.cheek * cheekVolume;
    position.setX(index, position.getX(index) * width);
    position.setZ(index, position.getZ(index) * (1 + profile.depth * cheekVolume));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createHumanHairCapGeometry(style = 'crop', styleSeed = 0) {
  const capDepth = style === 'swept' ? .60 : style === 'curly' ? .57 : style === 'side-part' ? .55 : .50;
  const geometry = new THREE.SphereGeometry(.255, 24, 18, 0, Math.PI * 2, 0, Math.PI * capDepth);
  const position = geometry.getAttribute('position');
  const seedPhase = (Number(styleSeed) || 0) * .73;
  const waveStrength = style === 'curly' ? .010 : style === 'swept' ? .004 : .0015;
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const wave = waveStrength * Math.cos(angle * (style === 'curly' ? 9 : 4) + seedPhase);
    const radialScale = (Math.hypot(x, z) + wave) / Math.max(.001, Math.hypot(x, z));
    position.setX(index, x * radialScale);
    position.setZ(index, z * radialScale);
    if (style === 'swept' || style === 'side-part') {
      position.setY(index, position.getY(index) + Math.max(0, z / .255) * (style === 'swept' ? .018 : .010));
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createHuman({ gender = 'male', shirt, trousers, skin, hair, shoes, accent = 0xffffff, eyeColor = null, eyeShape = 'almond', faceShape = 'auto', hairStyle = 'auto', bodyBuild = 'average', height = 1, outfit = 'casual', facialHair = 'auto', styleSeed = 0 }) {
  const person = new THREE.Group();
  const isFemale = gender === 'female';
  const seed = Math.abs(Number(styleSeed) || 0) % 7;
  const faceShapes = ['oval', 'balanced', 'round', 'angular', 'balanced', 'oval', 'round'];
  const resolvedFaceShape = faceShape === 'auto' ? faceShapes[seed] : faceShape;
  const hairStyles = isFemale
    ? ['long', 'bun', 'braid', 'long', 'shoulder', 'braid', 'bun']
    : ['crop', 'side-part', 'curly', 'crop', 'swept', 'crop', 'side-part'];
  const resolvedHairStyle = hairStyle === 'auto' ? hairStyles[seed] : hairStyle;
  const isMunduOutfit = !isFemale && (outfit === 'mundu' || (outfit === 'auto' && (seed === 0 || seed === 4)));
  const isSareeOutfit = isFemale && (outfit === 'saree' || (outfit === 'auto' && (seed === 2 || seed === 5)));
  const facialHairStyles = ['moustache', 'none', 'beard', 'none', 'goatee', 'moustache', 'none'];
  const chosenFacialHair = facialHair === 'auto'
    ? facialHairStyles[seed]
    : ['none', 'moustache', 'goatee', 'beard'].includes(facialHair) ? facialHair : 'none';

  const shirtMat = new THREE.MeshPhysicalMaterial({ color: shirt, roughness: .86, metalness: 0, sheen: .08, sheenRoughness: .92 });
  const trouserMat = new THREE.MeshPhysicalMaterial({ color: trousers, roughness: .91, metalness: 0, sheen: .045, sheenRoughness: .96 });
  const skinMat = new THREE.MeshPhysicalMaterial({ color: skin, roughness: .76, metalness: 0, clearcoat: .045, clearcoatRoughness: .82 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: .96 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: .92 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .74 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: .48 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x261a15, roughness: .48 });
  const irisPalette = [0x4b3022, 0x604331, 0x3c2b22, 0x6a4934];
  const irisMat = new THREE.MeshStandardMaterial({ color: eyeColor ?? irisPalette[seed % irisPalette.length], roughness: .40 });
  const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xfff8ec, toneMapped: false });
  const browMat = new THREE.MeshStandardMaterial({ color: hair, roughness: .92 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: isFemale ? 0x874a49 : 0x6f3d38, roughness: .62 });
  const lipMat = new THREE.MeshStandardMaterial({ color: isFemale ? 0x965b56 : 0x80504a, roughness: .66 });
  const innerEarMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .92 });
  innerEarMat.color.multiplyScalar(.76);
  const nostrilMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .95 });
  nostrilMat.color.multiplyScalar(.58);

  const parts = {};
  parts.eyelids = [];
  parts.eyeGazeTargets = [];

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
  if (isMunduOutfit) person.add(createMunduGarment(seed));
  if (isSareeOutfit) person.add(createSareeGarment(seed));

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

    person.add(kurtaHem);
    if (!isSareeOutfit) person.add(scarfFront, scarfBack);
  } else {
    if (!isMunduOutfit) {
      const belt = new THREE.Mesh(new THREE.BoxGeometry(.57, .065, .34), accentMat);
      belt.position.set(0, 1.00, .015);
      person.add(belt);
    }

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

  const head = new THREE.Mesh(createHumanHeadGeometry(resolvedFaceShape), skinMat);
  head.scale.set(.86, 1.12, .90);
  head.position.y = 2.12;
  person.add(head);
  parts.head = head;

  // Subtle jaw/chin shape reduces the spherical toy look.
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.205, 14, 10), skinMat);
  jaw.scale.set(.91, .70, .88);
  jaw.position.set(0, 2.025, .018);
  person.add(jaw);

  const hairCap = new THREE.Mesh(createHumanHairCapGeometry(resolvedHairStyle, seed), hairMat);
  hairCap.scale.set(.91, 1.07, .94);
  hairCap.position.y = 2.205;
  person.add(hairCap);

  if (!isFemale && chosenFacialHair === 'moustache') {
    const moustacheGeometry = new THREE.CapsuleGeometry(.023, .048, 3, 6);
    for (const side of [-1, 1]) {
      const lobe = new THREE.Mesh(moustacheGeometry, hairMat);
      lobe.scale.set(.92, .78, .42);
      lobe.position.set(side * .037, 2.047, .224);
      lobe.rotation.z = side * -.48;
      person.add(lobe);
    }
  } else if (!isFemale && chosenFacialHair === 'goatee') {
    const goatee = new THREE.Mesh(new THREE.CapsuleGeometry(.047, .075, 4, 7), hairMat);
    goatee.scale.set(.82, .72, .44);
    goatee.position.set(0, 1.944, .189);
    person.add(goatee);
  } else if (!isFemale && chosenFacialHair === 'beard') {
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(.245, 14, 9, 0, Math.PI * 2, Math.PI * .51, Math.PI * .49),
      hairMat
    );
    beard.scale.set(.89, 1.14, .94);
    beard.position.set(0, 2.12, .004);
    person.add(beard);
  }

  if (isFemale) {
    const hairLength = resolvedHairStyle === 'long' ? .58 : resolvedHairStyle === 'shoulder' ? .43 : .30;
    const hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(.155, hairLength, 5, 10), hairMat);
    hairBack.position.set(0, 1.95, -.15);
    hairBack.scale.set(1.08, 1, .48);
    person.add(hairBack);

    if (resolvedHairStyle === 'braid') {
      const braid = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .48, 4, 8), hairMat);
      braid.position.set(.08, 1.70, -.17);
      braid.rotation.z = -.08;
      person.add(braid);
    } else if (resolvedHairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(.115, 12, 9), hairMat);
      bun.scale.set(.86, .92, .72);
      bun.position.set(0, 2.12, -.225);
      person.add(bun);
    }
  } else {
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(.19, 12, 9), hairMat);
    backHair.scale.set(1.02, .68, .58);
    backHair.position.set(0, 2.13, -.17);
    person.add(backHair);

    if (resolvedHairStyle === 'side-part' || resolvedHairStyle === 'swept') {
      const fringe = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .22, 3, 7), hairMat);
      fringe.scale.set(1, .82, .72);
      fringe.position.set(resolvedHairStyle === 'swept' ? -.045 : .035, 2.255, .196);
      fringe.rotation.z = resolvedHairStyle === 'swept' ? -.24 : .12;
      person.add(fringe);
    }
  }

  // Ears.
  for (const x of [-.226, .226]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.042, 8, 6), skinMat);
    ear.scale.set(.62, 1, .52);
    ear.position.set(x, 2.105, .002);
    const innerEar = new THREE.Mesh(new THREE.SphereGeometry(.018, 7, 5), innerEarMat);
    innerEar.scale.set(.70, 1.18, .48);
    innerEar.position.set(x * 1.04, 2.105, .021);
    person.add(ear, innerEar);
  }

  const noseBridge = new THREE.Mesh(new THREE.SphereGeometry(.028, 12, 9), skinMat);
  noseBridge.scale.set(.57, 1.44, .62);
  noseBridge.position.set(0, 2.135, .232);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(.031, 12, 9), skinMat);
  noseTip.scale.set(1.08, .72, .86);
  noseTip.position.set(0, 2.092, .254);
  person.add(noseBridge, noseTip);

  for (const x of [-.027, .027]) {
    const nostrilWing = new THREE.Mesh(new THREE.SphereGeometry(.016, 9, 7), skinMat);
    nostrilWing.scale.set(1, .70, .62);
    nostrilWing.position.set(x, 2.087, .242);
    person.add(nostrilWing);
  }

  for (const x of [-.014, .014]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(.006, 6, 5), nostrilMat);
    nostril.position.set(x, 2.078, .273);
    person.add(nostril);
  }

  for (const x of [-.085, .085]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), eyeWhiteMat);
    eyeWhite.scale.set(eyeShape === 'round' ? .90 : 1.0, eyeShape === 'round' ? .78 : .60, .34);
    eyeWhite.position.set(x, 2.155, .232);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(.021, 10, 7), irisMat);
    iris.scale.set(.96, .96, .38);
    iris.position.set(x, 2.155, .248);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.010, 8, 6), eyeMat);
    pupil.scale.z = .42;
    pupil.position.set(x, 2.155, .256);

    const eyeHighlight = new THREE.Mesh(new THREE.SphereGeometry(.0045, 6, 5), eyeHighlightMat);
    eyeHighlight.position.set(x - .004, 2.160, .260);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(.008, .056, 2, 6), browMat);
    brow.position.set(x, 2.208, .238);
    brow.rotation.z = x < 0 ? -.10 : .10;
    const eyelid = new THREE.Mesh(new THREE.SphereGeometry(.038, 10, 7), skinMat);
    eyelid.scale.set(1, .001, .38);
    eyelid.position.set(x, 2.155, .257);
    eyelid.visible = false;
    eyelid.renderOrder = 2;
    parts.eyelids.push(eyelid);
    parts.eyeGazeTargets.push({
      iris,
      pupil,
      eyeHighlight,
      irisX: iris.position.x,
      pupilX: pupil.position.x,
      highlightX: eyeHighlight.position.x,
    });
    person.add(eyeWhite, iris, pupil, eyeHighlight, brow, eyelid);
  }

  const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(.006, .060, 2, 7), mouthMat);
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, 2.015, .245);
  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(.026, 9, 6), lipMat);
  lowerLip.scale.set(1.65, .34, .34);
  lowerLip.position.set(0, 1.998, .249);
  person.add(mouth, lowerLip);

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
    parts[name === 'leftArm' ? 'leftHand' : 'rightHand'] = hand;
  });

  // Jointed legs give a softer walk than one rigid capsule per side.
  [['leftLeg', -.14], ['rightLeg', .14]].forEach(([name, x]) => {
    const hip = new THREE.Group();
    hip.name = name;
    hip.position.set(x, .91, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.115, .34, 5, 9), trouserMat);
    thigh.position.y = -.25;

    const knee = new THREE.Group();
    knee.position.y = -.42;

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.10, .35, 5, 9), trouserMat);
    shin.position.y = -.245;

      const foot = new THREE.Mesh(new THREE.BoxGeometry(.185, .12, .34), shoeMat);
      foot.position.set(0, -.45, .095);
      foot.rotation.x = -.03;

    knee.add(shin, foot);
    hip.add(thigh, knee);
    person.add(hip);

    parts[name] = hip;
    parts[name === 'leftLeg' ? 'leftKnee' : 'rightKnee'] = knee;
    parts[name === 'leftLeg' ? 'leftFoot' : 'rightFoot'] = foot;
  });

  person.userData.parts = parts;
  person.userData.gender = gender;
  person.userData.styleSeed = seed;
  const buildScale = bodyBuild === 'slim' ? .95 : bodyBuild === 'broad' ? 1.055 : 1;
  person.scale.set(buildScale, THREE.MathUtils.clamp(Number(height) || 1, .90, 1.10), buildScale);
  person.userData.faceShape = resolvedFaceShape;
  person.userData.hairStyle = resolvedHairStyle;
  person.userData.bodyBuild = ['slim', 'average', 'broad'].includes(bodyBuild) ? bodyBuild : 'average';
  person.userData.animationOffset = seed * .47;
  parts.torsoRestScaleY = torso.scale.y;
  person.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return person;
}

function animatePlayer(player, phase, moving, runBlend = 0, backward = false) {
  const amount = THREE.MathUtils.clamp(Number(moving) || 0, 0, 1);
  const airborne = THREE.MathUtils.smoothstep(Math.max(0, jumpHeight), .015, .24);
  const groundedAmount = amount * (1 - airborne);
  const bob = groundedAmount ? Math.abs(Math.sin(phase * 2)) * .022 * groundedAmount : 0;
  const avatar = player.userData.avatar;
  if (!avatar) return;
  avatar.position.y = .04 + bob;
  avatar.rotation.z = groundedAmount ? Math.sin(phase * .5) * .008 * groundedAmount : 0;
  avatar.rotation.x = groundedAmount ? -.012 * groundedAmount : 0;
  player.userData.shadow?.scale.setScalar(1 - bob * 1.8);
  // Keep the root moving under input, while the legs transition out of the
  // ground gait during flight and blend back into it after touchdown.
  animateHuman(avatar, phase, groundedAmount, villageTime, runBlend * (1 - airborne), backward && airborne < .12);
}

function applyPlayerJumpPose(player, height, velocity, landingBlend = 0) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!parts) return;

  const airborne = THREE.MathUtils.smoothstep(Math.max(0, Number(height) || 0), .015, .24);
  const landing = THREE.MathUtils.clamp(Number(landingBlend) || 0, 0, 1);
  const rising = THREE.MathUtils.clamp((Number(velocity) || 0) / 4.35, 0, 1);
  const legTuck = airborne * (.12 + rising * .22);
  const kneeFlex = airborne * (.38 + rising * .22) + landing * .40;

  // Add a compact airborne tuck and a brief, blended knee bend on touchdown
  // over the current walk pose. The next locomotion update restores its base pose.
  if (parts.leftLeg) parts.leftLeg.rotation.x -= legTuck;
  if (parts.rightLeg) parts.rightLeg.rotation.x -= legTuck;
  if (parts.leftKnee) parts.leftKnee.rotation.x += kneeFlex;
  if (parts.rightKnee) parts.rightKnee.rotation.x += kneeFlex;
  if (parts.leftArm) parts.leftArm.rotation.x -= airborne * (.18 + rising * .14) + landing * .10;
  if (parts.rightArm) parts.rightArm.rotation.x -= airborne * (.18 + rising * .14) + landing * .10;
  if (parts.leftElbow) parts.leftElbow.rotation.x += airborne * .22 + landing * .08;
  if (parts.rightElbow) parts.rightElbow.rotation.x += airborne * .22 + landing * .08;
  if (parts.torso) parts.torso.rotation.x -= airborne * .035 + landing * .075;
}

function animatePlayerConversation(player, delta, moving) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!parts) return;

  const poseLocks = vehicleMode !== 'walk'
    || jumpHeight >= .02
    || player.userData.isTurningInPlace
    || performance.now() < Number(player.userData.vehicleTransition?.lockUntil || 0);
  const active = vehicleMode === 'walk'
    && !moving
    && jumpHeight < .02
    && !poseLocks
    && Number(avatar.userData.phoneUseBlend || 0) < .06
    && Number(avatar.userData.restPoseBlend || 0) < .06
    && performance.now() >= Number(player.userData.restPoseUntil || 0)
    && !phonePanel?.classList.contains('open')
    && performance.now() < Number(player.userData.conversationGestureUntil || 0);
  const prior = THREE.MathUtils.clamp(Number(player.userData.conversationGestureBlend) || 0, 0, 1);
  const target = active ? 1 : 0;
  const blend = prior + (target - prior) * (1 - Math.exp(-Math.max(0, delta) * (active ? 8 : 10)));
  player.userData.conversationGestureBlend = blend;
  if (blend < .001) return;

  const targetYaw = Number(player.userData.conversationTargetYaw);
  const relativeYaw = Number.isFinite(targetYaw)
    ? Math.atan2(Math.sin(targetYaw - player.rotation.y), Math.cos(targetYaw - player.rotation.y))
    : 0;
  const facing = THREE.MathUtils.clamp(relativeYaw, -.62, .62);
  const beat = (Math.sin(villageTime * 3.6 + (Number(avatar.userData.animationOffset) || 0)) + 1) * .5;

  // Keep the talk gesture subtle so it layers over breathing and idle glances.
  if (parts.rightArm) parts.rightArm.rotation.x += (-.16 - beat * .27) * blend;
  if (parts.rightElbow) parts.rightElbow.rotation.x += (.24 + beat * .30) * blend;
  if (parts.leftArm) parts.leftArm.rotation.x += (-.035 + Math.sin(villageTime * 2.2) * .035) * blend;
  if (parts.torso) parts.torso.rotation.y += facing * .22 * blend;
  if (parts.head) {
    parts.head.rotation.y += facing * .42 * blend;
    parts.head.rotation.x += Math.sin(villageTime * 2.4) * .018 * blend;
  }
}

function ensureHumanPhone(human) {
  const parts = human?.userData?.parts;
  if (!parts?.rightHand) return null;
  if (parts.phone) return parts.phone;

  const phone = new THREE.Group();
  const caseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(.084, .15, .018),
    new THREE.MeshStandardMaterial({ color: 0x1b2228, roughness: .48, metalness: .22 })
  );
  const screenMesh = new THREE.Mesh(
    new THREE.BoxGeometry(.071, .128, .002),
    new THREE.MeshStandardMaterial({
      color: 0x385866,
      emissive: 0x173441,
      emissiveIntensity: .22,
      roughness: .30,
      metalness: .04,
    })
  );
  screenMesh.position.z = .0102;
  phone.add(caseMesh, screenMesh);
  phone.position.set(0, .025, .055);
  phone.visible = false;
  parts.rightHand.add(phone);
  parts.phone = phone;
  return phone;
}

function animatePlayerPhone(player, delta, moving) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!parts) return;

  const poseLocks = vehicleMode !== 'walk'
    || jumpHeight >= .02
    || player.userData.isTurningInPlace
    || performance.now() < Number(player.userData.vehicleTransition?.lockUntil || 0);
  const active = vehicleMode === 'walk'
    && !moving
    && jumpHeight < .02
    && !poseLocks
    && Number(avatar.userData.conversationGestureBlend || 0) < .06
    && Number(avatar.userData.restPoseBlend || 0) < .06
    && performance.now() >= Number(player.userData.restPoseUntil || 0)
    && !!phonePanel?.classList.contains('open');
  const prior = THREE.MathUtils.clamp(Number(avatar.userData.phoneUseBlend) || 0, 0, 1);
  const target = active ? 1 : 0;
  const blend = prior + (target - prior) * (1 - Math.exp(-Math.max(0, delta) * (active ? 7 : 9)));
  avatar.userData.phoneUseBlend = blend;
  const phone = blend > .01 || active ? ensureHumanPhone(avatar) : parts.phone;
  if (phone) phone.visible = blend > .40;
  if (blend < .001) return;

  // Bring the phone to a comfortable, readable position and let the head follow it.
  if (parts.rightArm) parts.rightArm.rotation.x += (-.82 - parts.rightArm.rotation.x) * blend;
  if (parts.rightElbow) parts.rightElbow.rotation.x += (1.02 - parts.rightElbow.rotation.x) * blend;
  if (parts.leftArm) parts.leftArm.rotation.x += (-.06 - parts.leftArm.rotation.x) * blend;
  if (parts.head) parts.head.rotation.x += .105 * blend;
}

function animatePlayerRest(player, delta, moving) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!avatar || !parts) return;

  const now = performance.now();
  const poseLocks = vehicleMode !== 'walk'
    || jumpHeight >= .02
    || player.userData.isTurningInPlace
    || now < Number(player.userData.vehicleTransition?.lockUntil || 0);
  const active = vehicleMode === 'walk'
    && !moving
    && jumpHeight < .02
    && !poseLocks
    && Number(avatar.userData.phoneUseBlend || 0) < .06
    && Number(player.userData.conversationGestureBlend || 0) < .06
    && now < Number(player.userData.restPoseUntil || 0)
    && !phonePanel?.classList.contains('open');
  if (moving && now < Number(player.userData.restPoseUntil || 0)) player.userData.restPoseUntil = 0;
  const prior = THREE.MathUtils.clamp(Number(avatar.userData.restPoseBlend) || 0, 0, 1);
  const target = active ? 1 : 0;
  const blend = prior + (target - prior) * (1 - Math.exp(-Math.max(0, delta) * (active ? 7 : 9)));
  avatar.userData.restPoseBlend = blend;
  const restTransition = player.userData.restPoseReturn;
  const seated = !!restTransition && !restTransition.approaching && !restTransition.atSeat;
  avatar.position.z = seated ? (Number(restTransition.avatarSeatZ) || 1.34) * blend : 0;
  if (blend < .001) {
    if (restTransition && seated && !active) restorePlayerRestPosition(player);
    return;
  }

  // Lower the pelvis to seat height, fold the legs, and extend the shins so
  // shoes rest close to the ground while the physics root stays clear.
  avatar.position.y = .04 - .15 * blend;
  if (parts.leftLeg) parts.leftLeg.rotation.x += (-1.32 - parts.leftLeg.rotation.x) * blend;
  if (parts.rightLeg) parts.rightLeg.rotation.x += (-1.32 - parts.rightLeg.rotation.x) * blend;
  if (parts.leftKnee) {
    parts.leftKnee.rotation.x += (1.50 - parts.leftKnee.rotation.x) * blend;
    parts.leftKnee.scale.y = 1 + .40 * blend;
  }
  if (parts.rightKnee) {
    parts.rightKnee.rotation.x += (1.50 - parts.rightKnee.rotation.x) * blend;
    parts.rightKnee.scale.y = 1 + .40 * blend;
  }
  if (parts.leftFoot) parts.leftFoot.rotation.x = -.18 * blend - .03 * (1 - blend);
  if (parts.rightFoot) parts.rightFoot.rotation.x = -.18 * blend - .03 * (1 - blend);
  if (parts.leftArm) parts.leftArm.rotation.x += (-.12 - parts.leftArm.rotation.x) * blend;
  if (parts.rightArm) parts.rightArm.rotation.x += (-.12 - parts.rightArm.rotation.x) * blend;
  if (parts.leftElbow) parts.leftElbow.rotation.x += (.22 - parts.leftElbow.rotation.x) * blend;
  if (parts.rightElbow) parts.rightElbow.rotation.x += (.22 - parts.rightElbow.rotation.x) * blend;
  if (parts.torso) parts.torso.rotation.x -= .055 * blend;
}

function animatePlayerTurn(player, delta, active, direction = 0) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!avatar || !parts) return;

  active = !!active
    && vehicleMode === 'walk'
    && jumpHeight < .02
    && !phonePanel?.classList.contains('open')
    && Number(avatar.userData.phoneUseBlend || 0) < .06
    && Number(avatar.userData.restPoseBlend || 0) < .06
    && Number(avatar.userData.conversationGestureBlend || 0) < .06
    && performance.now() >= Number(player.userData.vehicleTransition?.lockUntil || 0);
  const prior = THREE.MathUtils.clamp(Number(avatar.userData.turnPoseBlend) || 0, 0, 1);
  const target = active ? 1 : 0;
  const blend = prior + (target - prior) * (1 - Math.exp(-Math.max(0, delta) * (active ? 8 : 10)));
  avatar.userData.turnPoseBlend = blend;
  if (blend < .001) {
    if (parts.leftLeg) parts.leftLeg.rotation.z = 0;
    if (parts.rightLeg) parts.rightLeg.rotation.z = 0;
    return;
  }

  const side = Math.sign(Number(direction) || 0) || 1;
  // A small alternating foot pivot and shoulder counter-turn makes the in-place
  // rotation read as a planted step instead of a rigid root-yaw snap.
  if (parts.leftLeg) parts.leftLeg.rotation.z = -.075 * side * blend;
  if (parts.rightLeg) parts.rightLeg.rotation.z = .075 * side * blend;
  if (parts.torso) parts.torso.rotation.y += side * .035 * blend;
  if (parts.head) parts.head.rotation.y += side * .06 * blend;
}

function applyBikeRiderPose(player, delta, steering = 0, speedRatio = 0, braking = false) {
  const avatar = player.userData.avatar;
  const parts = avatar?.userData.parts;
  if (!avatar || !parts) return;

  const currentBlend = THREE.MathUtils.clamp(Number(avatar.userData.bikeRiderBlend) || 0, 0, 1);
  const blend = currentBlend + (1 - currentBlend) * (1 - Math.exp(-Math.max(0, delta) * 9));
  avatar.userData.bikeRiderBlend = blend;
  const turn = THREE.MathUtils.clamp(Number(steering) || 0, -1, 1);
  const speed = THREE.MathUtils.clamp(Number(speedRatio) || 0, 0, 1);

  // Shoulder and elbow angles place both hands at the bike's existing bar
  // coordinates; the bent knee and level shoe line up with the added foot pegs.
  if (parts.leftArm) parts.leftArm.rotation.x -= .52 * blend;
  if (parts.rightArm) parts.rightArm.rotation.x -= .52 * blend;
  if (parts.leftElbow) parts.leftElbow.rotation.x -= .92 * blend;
  if (parts.rightElbow) parts.rightElbow.rotation.x -= .92 * blend;
  if (parts.leftLeg) parts.leftLeg.rotation.x -= .025 * blend;
  if (parts.rightLeg) parts.rightLeg.rotation.x -= .025 * blend;
  if (parts.leftKnee) parts.leftKnee.rotation.x += 1.34 * blend;
  if (parts.rightKnee) parts.rightKnee.rotation.x += 1.34 * blend;
  if (parts.leftFoot) parts.leftFoot.rotation.x -= 1.31 * blend;
  if (parts.rightFoot) parts.rightFoot.rotation.x -= 1.31 * blend;

  const bank = -turn * THREE.MathUtils.lerp(.018, .05, speed);
  const pitch = braking && speed > .08 ? .012 * speed : speed > .08 ? -.006 * speed : 0;
  avatar.rotation.z += bank * blend;
  avatar.rotation.x += pitch * blend;
}

function updateLegGaitPose(target, phase, offset, stanceRatio, runBlend) {
  const normalizedPhase = Number.isFinite(Number(phase)) ? Number(phase) : 0;
  const cycle = (((normalizedPhase / (Math.PI * 2) + offset) % 1) + 1) % 1;
  if (cycle < stanceRatio) {
    const stance = THREE.MathUtils.smoothstep(cycle / stanceRatio, 0, 1);
    target.hip = THREE.MathUtils.lerp(-.12, .18, stance);
    target.knee = .025 + stance * .035;
    return;
  }

  const swing = (cycle - stanceRatio) / (1 - stanceRatio);
  const easedSwing = THREE.MathUtils.smoothstep(swing, 0, 1);
  target.hip = THREE.MathUtils.lerp(.18, -.12, easedSwing);
  target.knee = Math.sin(swing * Math.PI) * THREE.MathUtils.lerp(.28, .46, runBlend);
}

function animateHuman(human, phase, moving, idleTime = phase, runBlend = 0, backward = false) {
  const parts = human.userData.parts;
  if (!parts) return;
  const targetAmount = THREE.MathUtils.clamp(Number(moving) || 0, 0, 1);
  const now = performance.now();
  const priorAmount = Number.isFinite(human.userData.locomotionBlend)
    ? human.userData.locomotionBlend
    : targetAmount;
  const priorTime = Number.isFinite(human.userData.locomotionBlendAt)
    ? human.userData.locomotionBlendAt
    : null;
  const blendDelta = priorTime === null ? 0 : THREE.MathUtils.clamp((now - priorTime) / 1000, 0, .12);
  const blendRate = targetAmount >= priorAmount ? 10 : 13;
  const blendWeight = priorTime === null ? 1 : 1 - Math.exp(-blendDelta * blendRate);
  const amount = priorAmount + (targetAmount - priorAmount) * blendWeight;
  human.userData.locomotionBlend = amount;
  human.userData.locomotionBlendAt = now;
  const targetRunBlend = THREE.MathUtils.clamp(Number(runBlend) || 0, 0, 1);
  const priorRunBlend = Number.isFinite(human.userData.locomotionRunBlend)
    ? human.userData.locomotionRunBlend
    : targetRunBlend;
  const runWeight = priorTime === null ? 1 : 1 - Math.exp(-blendDelta * 7.5);
  const blendedRun = priorRunBlend + (targetRunBlend - priorRunBlend) * runWeight;
  human.userData.locomotionRunBlend = blendedRun;
  const targetBackwardBlend = backward ? 1 : 0;
  const priorBackwardBlend = THREE.MathUtils.clamp(Number(human.userData.locomotionBackwardBlend) || 0, 0, 1);
  const backwardWeight = priorTime === null ? 1 : 1 - Math.exp(-blendDelta * 7.5);
  const backwardBlend = priorBackwardBlend + (targetBackwardBlend - priorBackwardBlend) * backwardWeight;
  human.userData.locomotionBackwardBlend = backwardBlend;
  const idleClock = Number.isFinite(Number(idleTime)) ? Number(idleTime) : Number(phase) || 0;
  const idleOffset = Number(human.userData.animationOffset) || 0;
  const idleAmount = 1 - amount;
  const glanceClockBase = idleClock + idleOffset * 1.8;
  const glancePeriod = 5.4 + ((Number(human.userData.styleSeed) || 0) % 4) * .65;
  const glanceClock = ((glanceClockBase % glancePeriod) + glancePeriod) % glancePeriod;
  const glanceIn = THREE.MathUtils.smoothstep(glanceClock, 0, .18);
  const glanceOut = 1 - THREE.MathUtils.smoothstep(glanceClock, .72, .96);
  const glanceDirection = Math.floor(glanceClockBase / glancePeriod) % 2 ? -1 : 1;
  const glanceBlend = glanceIn * glanceOut * idleAmount;
  const gaitPhase = phase * (1 - 2 * backwardBlend);
  const stride = Math.sin(gaitPhase);
  const armSwing = stride * THREE.MathUtils.lerp(.34, .48, blendedRun) * amount
    * THREE.MathUtils.lerp(1, -.42, backwardBlend);

  // A walk/run cycle has a supported stance and a shorter swing phase. That
  // gives each foot a clearer plant instead of continuously scissoring both legs.
  const stanceRatio = THREE.MathUtils.lerp(.62, .54, blendedRun);
  const leftLegPose = human.userData.leftLegGaitPose || (human.userData.leftLegGaitPose = { hip: 0, knee: 0 });
  const rightLegPose = human.userData.rightLegGaitPose || (human.userData.rightLegGaitPose = { hip: 0, knee: 0 });
  updateLegGaitPose(leftLegPose, gaitPhase, 0, stanceRatio, blendedRun);
  updateLegGaitPose(rightLegPose, gaitPhase, .5, stanceRatio, blendedRun);

  parts.leftArm.rotation.x = armSwing;
  parts.rightArm.rotation.x = -armSwing;
  parts.leftLeg.rotation.x = leftLegPose.hip * amount;
  parts.rightLeg.rotation.x = rightLegPose.hip * amount;

  if (parts.leftElbow) parts.leftElbow.rotation.x = .10 + Math.max(0, -stride) * THREE.MathUtils.lerp(.13, .20, blendedRun) * amount;
  if (parts.rightElbow) parts.rightElbow.rotation.x = .10 + Math.max(0, stride) * THREE.MathUtils.lerp(.13, .20, blendedRun) * amount;
  if (parts.leftKnee) {
    parts.leftKnee.rotation.x = leftLegPose.knee * amount;
    parts.leftKnee.scale.y = 1;
  }
  if (parts.rightKnee) {
    parts.rightKnee.rotation.x = rightLegPose.knee * amount;
    parts.rightKnee.scale.y = 1;
  }
  if (parts.leftFoot) parts.leftFoot.rotation.x = -.03;
  if (parts.rightFoot) parts.rightFoot.rotation.x = -.03;

  if (parts.torso) {
    parts.torso.rotation.y = Math.sin(phase * .5) * .025 * amount - glanceDirection * .018 * glanceBlend;
    parts.torso.rotation.z = -stride * .012 * amount;
    parts.torso.scale.y = parts.torsoRestScaleY + Math.sin(idleClock * 1.15 + idleOffset) * .006 * idleAmount;
  }
  if (parts.head) {
    parts.head.rotation.y = -Math.sin(phase * .5) * .018 * amount
      + Math.sin(idleClock * .42 + idleOffset) * .028 * idleAmount
      + glanceDirection * .16 * glanceBlend;
    parts.head.rotation.z = stride * .006 * amount
      + Math.sin(idleClock * .61 + idleOffset) * .008 * idleAmount
      + glanceDirection * .024 * glanceBlend;
  }
  if (parts.eyeGazeTargets?.length) {
    const gazeOffset = glanceDirection * .008 * glanceBlend;
    for (const target of parts.eyeGazeTargets) {
      target.iris.position.x = target.irisX + gazeOffset;
      target.pupil.position.x = target.pupilX + gazeOffset;
      target.eyeHighlight.position.x = target.highlightX + gazeOffset;
    }
  }
  if (parts.eyelids?.length) {
    const blinkPeriod = 4.2 + (Number(human.userData.styleSeed) % 3) * .45;
    const blinkClock = ((idleClock + idleOffset * 1.7) % blinkPeriod + blinkPeriod) % blinkPeriod;
    const blink = blinkClock < .17 ? Math.sin((blinkClock / .17) * Math.PI) : 0;
    for (const eyelid of parts.eyelids) {
      eyelid.visible = blink > .025;
      eyelid.scale.y = .62 * blink;
    }
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
    if (parts.phone) parts.phone.visible = false;
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
      const phone = ensureHumanPhone(human);
      if (phone) phone.visible = true;
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
      const idlePhoneClock = ((time + data.ambientIdlePhase) % data.ambientIdlePeriod + data.ambientIdlePeriod) % data.ambientIdlePeriod;
      const idlePhoneBlend = data.ambientIdlePhone
        ? THREE.MathUtils.smoothstep(idlePhoneClock, 1.1, 1.8)
          * (1 - THREE.MathUtils.smoothstep(idlePhoneClock, 4.0, 4.8))
        : 0;
      const idlePhone = idlePhoneBlend > .02 ? ensureHumanPhone(human) : parts.phone;
      if (idlePhone) idlePhone.visible = idlePhoneBlend > .38;
      if (idlePhoneBlend > .001) {
        if (parts.rightArm) parts.rightArm.rotation.x += (-.82 - parts.rightArm.rotation.x) * idlePhoneBlend;
        if (parts.rightElbow) parts.rightElbow.rotation.x += (1.02 - parts.rightElbow.rotation.x) * idlePhoneBlend;
        if (parts.head) {
          parts.head.rotation.x += .105 * idlePhoneBlend;
          parts.head.rotation.y += Math.sin(time * .25 + data.offset) * .035 * idlePhoneBlend;
        }
      }
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

function trafficHitsStaticWorld(config, progress, padding = .12) {
  const footprint = trafficFootprint(config);
  const x = config.axis === 'x' ? Number(progress) : Number(config.fixed);
  const z = config.axis === 'z' ? Number(progress) : Number(config.fixed);
  const halfWidth = footprint.halfWidth + padding;
  const halfDepth = footprint.halfDepth + padding;
  for (const collider of staticColliders) {
    if (collider.type === 'circle') {
      const closestX = THREE.MathUtils.clamp(collider.x, x - halfWidth, x + halfWidth);
      const closestZ = THREE.MathUtils.clamp(collider.z, z - halfDepth, z + halfDepth);
      if ((collider.x - closestX) ** 2 + (collider.z - closestZ) ** 2 < (collider.radius + padding) ** 2) return true;
      continue;
    }
    if (Math.abs(x - collider.x) < halfWidth + collider.halfWidth
      && Math.abs(z - collider.z) < halfDepth + collider.halfDepth) return true;
  }
  return false;
}

function nearestSafeTrafficProgress(config, preferred) {
  const min = Number(config.min);
  const max = Number(config.max);
  const start = THREE.MathUtils.clamp(Number(preferred), min, max);
  if (!trafficHitsStaticWorld(config, start)) return start;
  const span = Math.max(0, max - min);
  const step = .65;
  for (let distance = step; distance <= span + step; distance += step) {
    const forward = start + distance;
    if (forward <= max && !trafficHitsStaticWorld(config, forward)) return forward;
    const backward = start - distance;
    if (backward >= min && !trafficHitsStaticWorld(config, backward)) return backward;
  }
  return start;
}

function positionBlockedStatic(x, z, radius = .45) {
  for (const collider of staticColliders) {
    if (collider.type === 'circle') {
      const limit = collider.radius + radius;
      if ((x - collider.x) ** 2 + (z - collider.z) ** 2 < limit * limit) return true;
      continue;
    }
    if (circleHitsBox(x, z, radius, collider.x, collider.z, collider.halfWidth, collider.halfDepth)) return true;
  }
  return false;
}

function positionBlocked(x, z, radius = .45) {
  if (positionBlockedStatic(x, z, radius)) return true;
  for (const vehicle of traffic) {
    if (!vehicle?.visible) continue;
    const config = vehicle.userData?.traffic;
    if (!config) continue;
    const footprint = trafficFootprint(config);
    if (circleHitsBox(x, z, radius, vehicle.position.x, vehicle.position.z, footprint.halfWidth, footprint.halfDepth)) return true;
  }
  return false;
}

function resolveCameraCollision(target, desired, clearance = .34) {
  const dx = desired.x - target.x;
  const dz = desired.z - target.z;
  const horizontalDistance = Math.hypot(dx, dz);
  if (horizontalDistance < .05) return desired;
  const steps = Math.max(8, Math.ceil(horizontalDistance / .28));
  let safeT = 0;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = target.x + dx * t;
    const z = target.z + dz * t;
    if (positionBlockedStatic(x, z, clearance)) break;
    safeT = t;
  }
  if (safeT >= .999) return desired;
  const minT = Math.min(.12, .48 / Math.max(.48, horizontalDistance));
  const t = safeT > minT ? safeT - .035 : Math.max(0, safeT * .72);
  desired.x = target.x + dx * t;
  desired.z = target.z + dz * t;
  desired.y = THREE.MathUtils.lerp(target.y + .12, desired.y, t);
  return desired;
}

function updateBusStopCameraOcclusion(cameraPosition, target, delta) {
  const rayX = target.x - cameraPosition.x;
  const rayY = target.y - cameraPosition.y;
  const rayZ = target.z - cameraPosition.z;
  for (const surface of busStopCameraOccluders) {
    const material = surface.mesh.material;
    const crossesRoofHeight = Math.abs(rayY) > .001
      ? (surface.y - cameraPosition.y) / rayY
      : -1;
    let targetOpacity = 1;
    if (crossesRoofHeight > .015 && crossesRoofHeight < .985) {
      const hitX = cameraPosition.x + rayX * crossesRoofHeight - surface.x;
      const hitZ = cameraPosition.z + rayZ * crossesRoofHeight - surface.z;
      const localX = Math.cos(surface.rotation) * hitX - Math.sin(surface.rotation) * hitZ;
      const localZ = Math.sin(surface.rotation) * hitX + Math.cos(surface.rotation) * hitZ;
      if (Math.abs(localX) < 2.58 && Math.abs(localZ) < .96) targetOpacity = .22;
    }
    surface.opacity += (targetOpacity - surface.opacity) * (1 - Math.exp(-delta * 12));
    if (Math.abs(material.opacity - surface.opacity) > .006 || material.transparent !== (surface.opacity < .995)) {
      const isFaded = surface.opacity < .995;
      material.transparent = isFaded;
      material.depthWrite = !isFaded;
      material.opacity = isFaded ? surface.opacity : 1;
      material.needsUpdate = true;
    }
  }
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
    const nextX = clampDistrictX(object.position.x + stepX);
    if (!positionBlocked(nextX, object.position.z, radius)) object.position.x = nextX;
    else collided = true;

    const nextZ = clampDistrictZ(object.position.z + stepZ);
    if (!positionBlocked(object.position.x, nextZ, radius)) object.position.z = nextZ;
    else collided = true;
  }
  return collided;
}

function rememberVehicleSafePose(object, radius) {
  if (!object || positionBlockedStatic(object.position.x, object.position.z, radius + .06)) return;
  vehicleSafePosition.copy(object.position);
  vehicleSafeRotation = object.rotation.y;
  vehicleSafeReady = true;
}

function findVehicleRecoveryPoint(object, radius) {
  if (vehicleSafeReady && !positionBlockedStatic(vehicleSafePosition.x, vehicleSafePosition.z, radius + .08)) {
    return { x: vehicleSafePosition.x, z: vehicleSafePosition.z, rotation: vehicleSafeRotation };
  }

  const backwardsX = -Math.sin(object.rotation.y);
  const backwardsZ = -Math.cos(object.rotation.y);
  for (const distance of [.45, .8, 1.2, 1.7, 2.3]) {
    const x = clampDistrictX(object.position.x + backwardsX * distance);
    const z = clampDistrictZ(object.position.z + backwardsZ * distance);
    if (!positionBlockedStatic(x, z, radius + .08)) return { x, z, rotation: object.rotation.y };
  }

  for (const ring of [1, 1.6, 2.4, 3.2]) {
    for (let index = 0; index < 16; index++) {
      const angle = index / 16 * Math.PI * 2;
      const x = clampDistrictX(object.position.x + Math.sin(angle) * ring);
      const z = clampDistrictZ(object.position.z + Math.cos(angle) * ring);
      if (!positionBlockedStatic(x, z, radius + .08)) return { x, z, rotation: object.rotation.y };
    }
  }
  return null;
}

function recoverVehicleOverlap(object, radius) {
  if (!object || !positionBlockedStatic(object.position.x, object.position.z, radius)) return false;
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
  context.fillStyle = '#35393c';
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 1600; i++) {
    const value = 40 + Math.floor(random() * 30);
    context.fillStyle = `rgba(${value},${value + 2},${value + 3},${.08 + random() * .13})`;
    const width = .5 + random() * 2.2;
    context.fillRect(random() * size, random() * size, width, .5 + random() * 1.5);
  }

  context.strokeStyle = 'rgba(7,9,11,.24)';
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
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = size;
  const bumpContext = bumpCanvas.getContext('2d');
  const bumpRandom = visualRandom(1984);
  bumpContext.fillStyle = '#808080';
  bumpContext.fillRect(0, 0, size, size);
  for (let i = 0; i < 2200; i++) {
    const value = 88 + Math.floor(bumpRandom() * 80);
    bumpContext.fillStyle = `rgb(${value},${value},${value})`;
    bumpContext.fillRect(bumpRandom() * size, bumpRandom() * size, .7 + bumpRandom() * 1.8, .7 + bumpRandom() * 2.2);
  }
  bumpContext.strokeStyle = 'rgba(76,78,79,.68)';
  bumpContext.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const x = bumpRandom() * size;
    bumpContext.beginPath();
    bumpContext.moveTo(x, 0);
    bumpContext.bezierCurveTo(x + bumpRandom() * 8 - 4, 70, x + bumpRandom() * 10 - 5, 170, x + bumpRandom() * 8 - 4, size);
    bumpContext.stroke();
  }
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.copy(texture.repeat);
  texture.userData.bumpMap = bumpTexture;
  return texture;
}

function addRoadSurfaceDetails(scene) {
  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8575, roughness: 1 });
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

  }

  for (const z of [-28.55, -15.45]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(88, .95), shoulderMaterial);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(-28, .012, z);
    shoulder.receiveShadow = true;
    scene.add(shoulder);

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

function createBusDestinationSign(districtName) {
  const title = String(districtName || 'KERALA').toUpperCase();
  let material = busDestinationSignMaterials.get(title);
  if (!material) {
    const texture = createWorldSignTexture({
      title,
      subtitle: 'LOCAL BUS SERVICE',
      background: '#123a32',
      foreground: '#fff4c8',
      accent: '#d1a943',
      width: 768,
      height: 128,
    });
    material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    busDestinationSignMaterials.set(title, material);
  }

  const sign = new THREE.Mesh(busDestinationSignGeometry, material);
  sign.castShadow = false;
  sign.receiveShadow = false;
  return sign;
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

function resolveRoadsidePropPlacement(x, z, halfWidth, halfDepth, clearance = .28, maxDistance = 18) {
  const overlapsRoad = (candidateX, candidateZ) => roadEdgePlans.some(road =>
    Math.abs(candidateX - road.x) < halfWidth + road.width / 2 + clearance &&
    Math.abs(candidateZ - road.z) < halfDepth + road.depth / 2 + clearance
  );
  const overlapsSolid = (candidateX, candidateZ) => staticColliders.some(collider => {
    if (collider.type === 'circle') {
      const nearestX = THREE.MathUtils.clamp(collider.x, candidateX - halfWidth, candidateX + halfWidth);
      const nearestZ = THREE.MathUtils.clamp(collider.z, candidateZ - halfDepth, candidateZ + halfDepth);
      return (collider.x - nearestX) ** 2 + (collider.z - nearestZ) ** 2 < (collider.radius + clearance) ** 2;
    }
    return Math.abs(candidateX - collider.x) < halfWidth + collider.halfWidth + clearance &&
      Math.abs(candidateZ - collider.z) < halfDepth + collider.halfDepth + clearance;
  });
  const isClear = (candidateX, candidateZ) => !overlapsRoad(candidateX, candidateZ) && !overlapsSolid(candidateX, candidateZ);

  if (isClear(x, z)) return { x, z };

  // Search nearby roadside space in increasing rings, leaving road surfaces and
  // existing solid props clear while keeping the authored stop close to its route.
  const step = .5;
  for (let radius = step; radius <= maxDistance; radius += step) {
    const cells = Math.round(radius / step);
    for (let dx = -cells; dx <= cells; dx++) {
      for (let dz = -cells; dz <= cells; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== cells) continue;
        const candidateX = x + dx * step;
        const candidateZ = z + dz * step;
        if (isClear(candidateX, candidateZ)) return { x: candidateX, z: candidateZ };
      }
    }
  }
  return { x, z };
}

function addBusStop(scene, x, z, rotation = 0, stopName = 'KERALA PLAY') {
  const placementHalfWidth = Math.abs(Math.cos(rotation)) * 2.35 + Math.abs(Math.sin(rotation)) * .875;
  const placementHalfDepth = Math.abs(Math.sin(rotation)) * 2.35 + Math.abs(Math.cos(rotation)) * .875;
  ({ x, z } = resolveRoadsidePropPlacement(x, z, placementHalfWidth, placementHalfDepth));
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
  busStopCameraOccluders.push({ mesh: roof, x, z, y: 2.55, rotation, opacity: 1 });

  const halfWidth = Math.abs(Math.cos(rotation)) * 2.35 + Math.abs(Math.sin(rotation)) * .775;
  const halfDepth = Math.abs(Math.sin(rotation)) * 2.35 + Math.abs(Math.cos(rotation)) * .775;
  addBoxCollider(x, z, halfWidth, halfDepth, 'bus-stop');
}

function addDistrictStreetLights(scene, placements) {
  placements.forEach(([x, z, side, rotation]) => {
    const placement = resolveRoadsidePropPlacement(x, z, .14, .14, .28, 12);
    addStreetLight(scene, placement.x, placement.z, side, rotation);
    addCircleCollider(placement.x, placement.z, .16, 'street-light');
  });
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
    const placement = resolveRoadsidePropPlacement(poleX, z, .14, .14, .28, 12);
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
      wirePoints[index].push(new THREE.Vector3(placement.x + xOffset, 5.47, placement.z));
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
    pole.position.set(placement.x, 0, placement.z);
    scene.add(pole);
    addBoxCollider(placement.x, placement.z, .16, .16, 'utility-pole');
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

function addDistrictCrosswalks(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0xf0efe7, roughness: .78 });
  const markings = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, 18);
  const transform = new THREE.Object3D();
  let index = 0;
  const placeMarking = (x, z, width, depth) => {
    transform.position.set(x, .044, z);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.set(width, depth, 1);
    transform.updateMatrix();
    markings.setMatrixAt(index++, transform.matrix);
  };

  for (let stripe = 0; stripe < 7; stripe++) {
    const offset = (stripe - 3) * .92;
    // North-south crossing on the north approach; east-west crossing on the east approach.
    placeMarking(0, 9.2 + offset, 10.4, .50);
    placeMarking(9.2 + offset, 0, .50, 8.4);
  }
  for (const side of [-1, 1]) {
    placeMarking(0, side * 5.8, 10.4, .16);
    placeMarking(side * 6.8, 0, .16, 8.4);
  }
  markings.instanceMatrix.needsUpdate = true;
  markings.castShadow = false;
  markings.receiveShadow = false;
  scene.add(markings);
}

function addDistrictLaneMarkings(scene, roads) {
  const dashes = [];
  roads.forEach(([x, z, width, depth], roadIndex) => {
    const horizontal = width > depth;
    const halfLength = (horizontal ? width : depth) / 2;
    for (let offset = -halfLength + 4; offset <= halfLength - 4; offset += 8) {
      const dashX = horizontal ? x + offset : x;
      const dashZ = horizontal ? z : z + offset;
      const atJunction = roads.some(([otherX, otherZ, otherWidth, otherDepth], otherIndex) =>
        otherIndex !== roadIndex && (otherWidth > otherDepth) !== horizontal &&
        Math.abs(dashX - otherX) < otherWidth / 2 + 2 &&
        Math.abs(dashZ - otherZ) < otherDepth / 2 + 2);
      const atCrosswalk = (Math.abs(dashX) < 6 && Math.abs(dashZ - 9.2) < 4.2) ||
        (Math.abs(dashZ) < 5 && Math.abs(dashX - 9.2) < 4.2);
      if (!atJunction && !atCrosswalk) dashes.push([dashX, dashZ, horizontal]);
    }
  });
  if (!dashes.length) return;
  const markings = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0xe6ce78, roughness: .78 }), dashes.length);
  const transform = new THREE.Object3D();
  dashes.forEach(([x, z, horizontal], index) => {
    transform.position.set(x, .035, z);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.set(horizontal ? 3.5 : .16, horizontal ? .16 : 3.5, 1);
    transform.updateMatrix();
    markings.setMatrixAt(index, transform.matrix);
  });
  markings.instanceMatrix.needsUpdate = true;
  markings.castShadow = false;
  markings.receiveShadow = false;
  scene.add(markings);
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

function getBananaLeafGeometry() {
  if (bananaLeafGeometry) return bananaLeafGeometry;

  const lengthSegments = 14;
  const widthSegments = 8;
  const positions = [];
  const indices = [];
  for (let row = 0; row <= lengthSegments; row++) {
    const t = row / lengthSegments;
    const halfWidth = .012 + Math.pow(Math.sin(Math.PI * t), .72) * .39;
    const centerY = -.095 + t * 2.55;
    const centerZ = Math.sin(t * Math.PI) * .075 - t * .035;
    for (let column = 0; column <= widthSegments; column++) {
      const across = column / widthSegments * 2 - 1;
      const edge = Math.abs(across);
      positions.push(
        across * halfWidth,
        centerY - edge * edge * .035,
        centerZ - Math.pow(edge, 1.7) * .045,
      );
      if (row === lengthSegments || column === widthSegments) continue;
      const a = row * (widthSegments + 1) + column;
      const b = a + 1;
      const c = a + widthSegments + 1;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  bananaLeafGeometry = new THREE.BufferGeometry();
  bananaLeafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  bananaLeafGeometry.setIndex(indices);
  bananaLeafGeometry.computeVertexNormals();
  return bananaLeafGeometry;
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

  const leafGeometry = getBananaLeafGeometry();
  const nearGroup = new THREE.Group();
  const farGroup = new THREE.Group();
  const makeLeaves = (count, target, castShadow) => {
    const leaves = [];
    for (let index = 0; index < count; index++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMat);
      const angle = index / count * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * .08, 2.20 + (index % 2) * .08, Math.sin(angle) * .08);
      leaf.rotation.order = 'YXZ';
      leaf.rotation.y = angle;
      leaf.rotation.x = -.82 + (index % 3) * .08;
      leaf.rotation.z = (index % 2 ? 1 : -1) * .08;
      leaf.scale.set(.92 + (index % 3) * .06, .88 + (index % 2) * .08, 1);
      leaf.castShadow = castShadow;
      leaf.userData.windBaseX = leaf.rotation.x;
      leaf.userData.windBaseZ = leaf.rotation.z;
      leaves.push(leaf);
      target.add(leaf);
    }
    return leaves;
  };
  const leaves = makeLeaves(7, nearGroup, true);
  const farLeaves = makeLeaves(4, farGroup, false);
  farGroup.visible = false;
  group.add(nearGroup, farGroup);
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'banana',
    root: group,
    leaves,
    farLeaves,
    nearGroup,
    farGroup,
    usingFar: false,
    nodes: leaves,
    x,
    z,
    phase: windVegetation.length * 1.17 + x * .07 + z * .04,
  });
  scene.add(group);
}

function getTreeCanopyTexture() {
  if (treeCanopyTexture) return treeCanopyTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = visualRandom(8218);
  context.fillStyle = '#dddddd';
  context.fillRect(0, 0, size, size);

  for (let cluster = 0; cluster < 180; cluster++) {
    const shade = 170 + Math.floor(random() * 78);
    context.fillStyle = `rgba(${shade},${shade},${shade},${.08 + random() * .12})`;
    context.beginPath();
    context.ellipse(random() * size, random() * size, 5 + random() * 18, 3 + random() * 11, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  for (let leaf = 0; leaf < 1250; leaf++) {
    const x = random() * size;
    const y = random() * size;
    const length = 4 + random() * 9;
    const width = .9 + random() * 2.1;
    const shade = 105 + Math.floor(random() * 135);
    context.save();
    context.translate(x, y);
    context.rotate(random() * Math.PI);
    context.fillStyle = `rgba(${shade},${shade},${shade},${.18 + random() * .34})`;
    context.beginPath();
    context.ellipse(0, 0, width, length, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(74,74,74,.13)';
    context.lineWidth = .45;
    context.beginPath();
    context.moveTo(0, -length * .7);
    context.lineTo(0, length * .7);
    context.stroke();
    context.restore();
  }

  treeCanopyTexture = new THREE.CanvasTexture(canvas);
  treeCanopyTexture.colorSpace = THREE.SRGBColorSpace;
  treeCanopyTexture.wrapS = treeCanopyTexture.wrapT = THREE.RepeatWrapping;
  return treeCanopyTexture;
}

function getTreeBarkBumpMap() {
  if (treeBarkBumpMap) return treeBarkBumpMap;

  const width = 128;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = visualRandom(9347);
  context.fillStyle = '#808080';
  context.fillRect(0, 0, width, height);

  for (let groove = 0; groove < 42; groove++) {
    const x = random() * width;
    const shade = random() > .52 ? 96 : 158;
    context.strokeStyle = `rgba(${shade},${shade},${shade},${.24 + random() * .34})`;
    context.lineWidth = .7 + random() * 2.1;
    for (const offset of [-width, 0, width]) {
      context.beginPath();
      context.moveTo(x + offset, 0);
      context.bezierCurveTo(
        x + offset + (random() - .5) * 5, height * .31,
        x + offset + (random() - .5) * 6, height * .68,
        x + offset + (random() - .5) * 4, height
      );
      context.stroke();
    }
  }

  for (let crack = 0; crack < 150; crack++) {
    const shade = random() > .5 ? 94 : 170;
    context.strokeStyle = `rgba(${shade},${shade},${shade},${.12 + random() * .22})`;
    context.lineWidth = .5 + random() * .8;
    const y = random() * height;
    const x = random() * width;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (random() - .5) * 10, y + 1 + random() * 4);
    context.stroke();
  }

  treeBarkBumpMap = new THREE.CanvasTexture(canvas);
  treeBarkBumpMap.wrapS = treeBarkBumpMap.wrapT = THREE.RepeatWrapping;
  return treeBarkBumpMap;
}

function getRubberTreeAssets() {
  if (rubberTreeAssets) return rubberTreeAssets;
  rubberTreeAssets = {
    trunkGeometry: new THREE.CylinderGeometry(.17, .30, 6.9, 9, 4),
    branchGeometry: new THREE.CylinderGeometry(.045, .105, 1.95, 6),
    canopyGeometry: new THREE.SphereGeometry(1, 10, 7),
    trunkMaterial: new THREE.MeshStandardMaterial({ color: 0x684b38, roughness: .97, bumpMap: getTreeBarkBumpMap(), bumpScale: .022 }),
    branchMaterial: new THREE.MeshStandardMaterial({ color: 0x71513a, roughness: .98, bumpMap: getTreeBarkBumpMap(), bumpScale: .015 }),
    canopyMaterials: [0x3c7139, 0x477c3e, 0x548347].map(color =>
      new THREE.MeshStandardMaterial({ color, map: getTreeCanopyTexture(), roughness: .94 })
    ),
    tappedBarkMaterial: new THREE.MeshStandardMaterial({ color: 0xb09062, roughness: .99 }),
    latexCupMaterial: new THREE.MeshStandardMaterial({ color: 0x4c4b42, roughness: .78 }),
    latexMaterial: new THREE.MeshStandardMaterial({ color: 0xe8e1cb, roughness: .66 }),
    cupGeometry: new THREE.CylinderGeometry(.15, .10, .14, 10, 1, true),
    cupBaseGeometry: new THREE.CylinderGeometry(.10, .10, .018, 10),
    latexDropGeometry: new THREE.SphereGeometry(.025, 6, 5),
  };
  return rubberTreeAssets;
}

function addRubberTree(scene, x, z, scale = 1, yaw = 0, tapped = false) {
  addCircleCollider(x, z, Math.max(.34, .40 * scale), 'rubber-tree');
  const assets = getRubberTreeAssets();
  const group = new THREE.Group();
  const random = visualRandom(Math.abs(Math.floor(x * 151 + z * 197 + scale * 1200)) + 5317);
  const trunk = new THREE.Mesh(assets.trunkGeometry, assets.trunkMaterial);
  trunk.position.y = 3.45;
  trunk.rotation.z = (random() - .5) * .045;
  trunk.castShadow = true;
  group.add(trunk);

  [
    [-.28, 5.1, -.56, -.55], [.34, 5.3, .62, .42],
    [-.12, 5.75, .34, -.24], [.15, 5.9, -.30, .30],
  ].forEach(([bx, by, tiltX, tiltZ]) => {
    const branch = new THREE.Mesh(assets.branchGeometry, assets.branchMaterial);
    branch.position.set(bx, by, 0);
    branch.rotation.x = tiltX;
    branch.rotation.z = tiltZ;
    branch.castShadow = true;
    group.add(branch);
  });

  const nearGroup = new THREE.Group();
  const farGroup = new THREE.Group();
  const nodes = [];
  const nearCanopies = [
    [0, 6.30, 0, 1.24, .78, 1.03],
    [-.58, 6.05, .12, .88, .62, .78], [.64, 6.02, -.12, .92, .64, .80],
    [-.32, 6.78, -.20, .88, .57, .74], [.42, 6.72, .17, .91, .59, .76],
  ];
  nearCanopies.forEach(([cx, cy, cz, sx, sy, sz], index) => {
    const canopy = new THREE.Mesh(assets.canopyGeometry, assets.canopyMaterials[index % assets.canopyMaterials.length]);
    canopy.position.set(cx + (random() - .5) * .12, cy + (random() - .5) * .10, cz + (random() - .5) * .12);
    canopy.scale.set(sx, sy, sz);
    canopy.rotation.y = random() * Math.PI;
    canopy.castShadow = true;
    canopy.userData.windBaseX = canopy.rotation.x;
    canopy.userData.windBaseZ = canopy.rotation.z;
    nodes.push(canopy);
    nearGroup.add(canopy);
  });
  [
    [0, 6.28, 0, 1.52, .90, 1.23],
    [-.42, 6.38, .10, 1.02, .70, .90],
    [.48, 6.35, -.10, 1.02, .70, .90],
  ].forEach(([cx, cy, cz, sx, sy, sz], index) => {
    const canopy = new THREE.Mesh(assets.canopyGeometry, assets.canopyMaterials[(index * 2) % assets.canopyMaterials.length]);
    canopy.position.set(cx, cy, cz);
    canopy.scale.set(sx, sy, sz);
    canopy.castShadow = false;
    canopy.receiveShadow = false;
    farGroup.add(canopy);
  });
  farGroup.visible = false;
  group.add(nearGroup, farGroup);

  if (tapped) {
    const scar = new THREE.Mesh(new THREE.PlaneGeometry(.34, .24), assets.tappedBarkMaterial);
    scar.position.set(.12, 1.28, .264);
    scar.rotation.z = -.48;
    group.add(scar);
    const cup = new THREE.Mesh(assets.cupGeometry, assets.latexCupMaterial);
    cup.position.set(.25, .90, .31);
    cup.rotation.x = -.12;
    const cupBase = new THREE.Mesh(assets.cupBaseGeometry, assets.latexCupMaterial);
    cupBase.position.set(.25, .83, .31);
    const latexDrop = new THREE.Mesh(assets.latexDropGeometry, assets.latexMaterial);
    latexDrop.position.set(.12, 1.10, .32);
    group.add(cup, cupBase, latexDrop);
  }

  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'rubber',
    root: group,
    nodes,
    nearGroup,
    farGroup,
    usingFar: false,
    x,
    z,
    phase: windVegetation.length * 1.03 + x * .052 - z * .031,
  });
  scene.add(group);
}

function getPaddyAssets() {
  if (!paddyClumpGeometry) {
    const positions = [];
    const indices = [];
    const bladeSegments = 5;
    const acrossSegments = 2;
    for (let blade = 0; blade < 5; blade++) {
      const angle = blade / 5 * Math.PI * 2 + .16;
      const directionX = Math.sin(angle);
      const directionZ = Math.cos(angle);
      const sideX = directionZ;
      const sideZ = -directionX;
      const length = .64 + (blade % 3) * .09;
      const baseVertex = positions.length / 3;
      for (let row = 0; row <= bladeSegments; row++) {
        const t = row / bladeSegments;
        const halfWidth = .008 + Math.sin(t * Math.PI) * .072 * (1 - t * .18);
        const centerX = directionX * t * length;
        const centerZ = directionZ * t * length;
        const centerY = .035 + t * length + Math.sin(t * Math.PI) * .025;
        for (let column = 0; column <= acrossSegments; column++) {
          const across = column / acrossSegments * 2 - 1;
          positions.push(
            centerX + sideX * halfWidth * across,
            centerY - Math.abs(across) * .018,
            centerZ + sideZ * halfWidth * across,
          );
          if (row === bladeSegments || column === acrossSegments) continue;
          const a = baseVertex + row * (acrossSegments + 1) + column;
          const b = a + 1;
          const c = a + acrossSegments + 1;
          const d = c + 1;
          indices.push(a, b, d, a, d, c);
        }
      }
    }
    paddyClumpGeometry = new THREE.BufferGeometry();
    paddyClumpGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    paddyClumpGeometry.setIndex(indices);
    paddyClumpGeometry.computeVertexNormals();
    paddyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: .86,
      side: THREE.DoubleSide,
    });
    paddyWaterMaterial = new THREE.MeshStandardMaterial({
      color: 0x72866a,
      roughness: .34,
      metalness: .02,
    });
  }
  return { geometry: paddyClumpGeometry, material: paddyMaterial, waterMaterial: paddyWaterMaterial };
}

function addPaddyField(scene, x, z, width, depth, seed) {
  const assets = getPaddyAssets();
  const field = new THREE.Group();
  const mud = new THREE.Mesh(
    new THREE.PlaneGeometry(width + .72, depth + .72),
    new THREE.MeshStandardMaterial({ color: 0x766248, roughness: .98 })
  );
  mud.rotation.x = -Math.PI / 2;
  mud.position.y = .012;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), assets.waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = .025;
  field.add(mud, water);

  const random = visualRandom(seed);
  const columns = Math.max(6, Math.round(width * .67));
  const rows = Math.max(4, Math.round(depth * .73));
  const count = columns * rows;
  const plants = [];
  const instances = new THREE.InstancedMesh(assets.geometry, assets.material, count);
  const dummy = new THREE.Object3D();
  const colors = [0x688a44, 0x7b984e, 0x55783d, 0x8a9e56];
  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const localX = -width / 2 + column * width / (columns - 1) + (random() - .5) * .44;
      const localZ = -depth / 2 + row * depth / (rows - 1) + (random() - .5) * .36;
      const plantScale = .78 + random() * .46;
      const yaw = random() * Math.PI * 2;
      dummy.position.set(localX, .024, localZ);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(plantScale);
      dummy.updateMatrix();
      instances.setMatrixAt(index, dummy.matrix);
      instances.setColorAt(index, new THREE.Color(colors[Math.floor(random() * colors.length)]));
      plants.push({ x: localX, z: localZ, scale: plantScale, yaw });
      index++;
    }
  }
  instances.instanceMatrix.needsUpdate = true;
  if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
  instances.castShadow = true;
  instances.receiveShadow = true;
  field.add(instances);
  field.position.set(x, 0, z);
  scene.add(field);
  windVegetation.push({
    kind: 'paddy',
    root: field,
    mesh: instances,
    dummy,
    plants,
    x,
    z,
    phase: seed * .017,
  });
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
  ].forEach(([x,z,scale,fruit], index) => addTree(scene,x,z,scale,fruit ? (index % 2 ? 'jackfruit' : 'mango') : null));
  [
    [-29,18,.68,.2],[-31,21,.62,1.0],[35,24,.70,2.0],
    [38,27,.64,2.7],[-42,-42,.66,.8],[43,-48,.69,1.8],
  ].forEach(([x,z,scale,yaw]) => addBananaPlant(scene,x,z,scale,yaw));
  [
    [-62,-29,.86,.25],[62,-29,.82,1.10],[-62,48,.80,2.05],[62,48,.84,2.85],
  ].forEach(([x,z,scale,yaw]) => addArecaClump(scene,x,z,scale,yaw));
  [
    [-66,78,.78,.1,true],[-56,78,.82,1.2,false],[-66,89,.74,2.1,true],[-56,89,.80,2.9,false],
  ].forEach(([x,z,scale,yaw,tapped]) => addRubberTree(scene,x,z,scale,yaw,tapped));
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
  addShop(scene, -14.4, 10.5, 'ANUGRAHA STORES', 'ചായ · SNACKS · GROCERIES');
  addShop(scene, 14.8, 38.5, 'MALABAR BAKERY', 'BAKERY · TEA · COOL DRINKS');
  addBusStop(scene, 11.7, 30, 0, 'TOWN JUNCTION');
  addBusStop(scene, -11.7, -50.5, Math.PI, 'SOUTH STOP');
  addRoadsideIdentitySigns(scene);

  addCompoundWall(scene, 28, 34, 11.4, 9.2);
  addCompoundWall(scene, -36, 33, 11.8, 9.6);
  addCompoundWall(scene, 31, -35, 10.8, 8.8);

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

function addRailTracks(scene, x, z, length = 30) {
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x4d5355, roughness: .62, metalness: .38 });
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x6b513a, roughness: .94 });
  [-.72, .72].forEach(offset => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, .08, .09), railMaterial);
    rail.position.set(x, .06, z + offset);
    scene.add(rail);
  });
  for (let offset = -length / 2 + .7; offset <= length / 2 - .7; offset += 1.15) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(.12, .06, 2.15), sleeperMaterial);
    sleeper.position.set(x + offset, .025, z);
    scene.add(sleeper);
  }
}

function addPassengerTrain(scene, x, z, centerOffset = 0) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd9ded5, roughness: .72, metalness: .08 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x475a60, roughness: .7, metalness: .18 });
  const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x21637a, roughness: .58, metalness: .12 });
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xb83d34, roughness: .62 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x183743, roughness: .25, metalness: .08, emissive: 0x0e2831, emissiveIntensity: .16 });
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x24292a, roughness: .86, metalness: .12 });
  const train = new THREE.Group();
  const carCenters = [-5.4, 0, 5.4];

  carCenters.forEach((carX, index) => {
    const locomotive = index === carCenters.length - 1;
    const car = new THREE.Group();
    const length = locomotive ? 5.45 : 5.15;
    const width = locomotive ? 2.15 : 2.08;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(length, locomotive ? 1.78 : 1.7, width), bodyMaterial);
    shell.position.y = 1.48;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(length + .14, .2, width + .12), roofMaterial);
    roof.position.y = 2.43;
    const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(length - .18, .16, .035), blueMaterial);
    sideStripe.position.y = 1.06;
    const lowerStripe = new THREE.Mesh(new THREE.BoxGeometry(length - .2, .075, .04), redMaterial);
    lowerStripe.position.y = .91;
    car.add(shell, roof);

    for (const side of [-1, 1]) {
      const stripe = sideStripe.clone();
      stripe.position.z = side * (width / 2 + .018);
      const lower = lowerStripe.clone();
      lower.position.z = side * (width / 2 + .025);
      car.add(stripe, lower);
      for (const windowX of [-1.8, -.6, .6, 1.8]) {
        if (locomotive && windowX > 1.1) continue;
        const window = new THREE.Mesh(new THREE.BoxGeometry(.62, .48, .045), windowMaterial);
        window.position.set(windowX, 1.82, side * (width / 2 + .03));
        car.add(window);
      }
      if (!locomotive) {
        for (const doorX of [-2.28, 2.28]) {
          const door = new THREE.Mesh(new THREE.BoxGeometry(.46, 1.22, .055), blueMaterial);
          door.position.set(doorX, 1.33, side * (width / 2 + .035));
          car.add(door);
        }
      }
      for (const wheelX of [-1.8, 1.8]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .16, 12), wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wheelX, .38, side * .95);
        car.add(wheel);
      }
    }

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(length - .28, .32, 1.7), roofMaterial);
    chassis.position.y = .68;
    car.add(chassis);
    if (locomotive) {
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(.055, .56, 1.05), windowMaterial);
      frontGlass.position.set(length / 2 + .035, 1.82, 0);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(.42, .6, 1.88), blueMaterial);
      nose.position.set(length / 2 - .06, 1.18, 0);
      const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffedb3, emissive: 0xffd46b, emissiveIntensity: .75 });
      const lamps = [-.54, .54].map(lampZ => {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 8), lampMaterial);
        lamp.position.set(length / 2 + .16, 1.32, lampZ);
        return lamp;
      });
      car.add(frontGlass, nose, ...lamps);
    }
    car.position.x = carX;
    car.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    train.add(car);
  });

  train.position.set(x + centerOffset, 0, z);
  scene.add(train);
  for (const carX of carCenters) {
    addBoxCollider(x + centerOffset + carX, z, 2.78, 1.08, 'passenger-train');
  }
  return train;
}

function addKottayamRailwayFoundation(scene) {
  addRailTracks(scene, 7, -26.5, 31);
  addRailPlatform(scene, 7, -23, 27);
  addPassengerTrain(scene, 7, -26.5, -7);
  addCivicBuilding(scene, 14.5, -34.5, {
    title: 'KOTTAYAM RAILWAY',
    subtitle: 'ERNAKULAM · DISTRICT TRAINS',
    color: 0x315f78,
    collider: 'kottayam-railway',
  });
  const board = createWorldSignMesh({
    title: 'KOTTAYAM STATION',
    subtitle: 'BOARD HERE · ERNAKULAM ₹35',
    background: '#315f78',
  }, 4.2, .92);
  board.position.set(7, 2.35, -22.3);
  scene.add(board);
  registerFarVisual(board, 7, -22.3, 64);
}

function addCityTower(scene, x, z, width, depth, height, color, title = '') {
  const group = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: .02 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x6fa3b4, roughness: .22, metalness: .14, emissive: 0x254b57, emissiveIntensity: .035 });
  const frame = new THREE.MeshStandardMaterial({ color: 0xd2cdbf, roughness: .84 });
  const roofTrim = new THREE.MeshStandardMaterial({ color: 0xaaa69a, roughness: .92 });
  weatherBuildingSurfaces.push(
    makeWeatherSurfaceState(wall, { roughnessDrop: .065, minRoughness: .66, darkening: .03 }),
    makeWeatherSurfaceState(glass, { roughnessDrop: .045, minRoughness: .14, darkening: .018 }),
    makeWeatherSurfaceState(frame, { roughnessDrop: .05, minRoughness: .72, darkening: .02 }),
    makeWeatherSurfaceState(roofTrim, { roughnessDrop: .08, minRoughness: .72, darkening: .03 }),
  );
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wall);
  body.position.y = height / 2;
  group.add(body);
  const floors = Math.max(2, Math.floor(height / 2.4));
  const floorHeight = height / floors;
  const frontBayCount = Math.max(3, Math.floor(width / 1.9));
  const sideBayCount = Math.max(2, Math.floor(depth / 1.8));
  const windowCount = floors * (frontBayCount * 2 + sideBayCount * 2);
  const windowGeometry = new THREE.BoxGeometry(1, 1, 1);
  const windowFrames = new THREE.InstancedMesh(windowGeometry, frame, windowCount);
  const windowPanes = new THREE.InstancedMesh(windowGeometry, glass, windowCount);
  const transform = new THREE.Object3D();
  let windowIndex = 0;
  const placeWindow = (position, paneScale, frameScale) => {
    transform.position.copy(position.frame);
    transform.scale.copy(frameScale);
    transform.updateMatrix();
    windowFrames.setMatrixAt(windowIndex, transform.matrix);
    transform.position.copy(position.pane);
    transform.scale.copy(paneScale);
    transform.updateMatrix();
    windowPanes.setMatrixAt(windowIndex, transform.matrix);
    windowIndex++;
  };

  const frontSpan = width * .78;
  const frontStep = frontSpan / frontBayCount;
  const frontPaneWidth = frontStep * .60;
  const sideSpan = depth * .76;
  const sideStep = sideSpan / sideBayCount;
  const sidePaneWidth = sideStep * .60;
  const paneHeight = Math.min(1.22, floorHeight * .45);
  for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
    const windowY = floorIndex * floorHeight + floorHeight * .54;
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < frontBayCount; bay++) {
        const windowX = (bay - (frontBayCount - 1) / 2) * frontStep;
        placeWindow(
          {
            frame: new THREE.Vector3(windowX, windowY, side * (depth / 2 + .045)),
            pane: new THREE.Vector3(windowX, windowY, side * (depth / 2 + .105)),
          },
          new THREE.Vector3(frontPaneWidth, paneHeight, .045),
          new THREE.Vector3(frontPaneWidth + .16, paneHeight + .16, .08),
        );
      }
      for (let bay = 0; bay < sideBayCount; bay++) {
        const windowZ = (bay - (sideBayCount - 1) / 2) * sideStep;
        placeWindow(
          {
            frame: new THREE.Vector3(side * (width / 2 + .045), windowY, windowZ),
            pane: new THREE.Vector3(side * (width / 2 + .105), windowY, windowZ),
          },
          new THREE.Vector3(.045, paneHeight, sidePaneWidth),
          new THREE.Vector3(.08, paneHeight + .16, sidePaneWidth + .16),
        );
      }
    }
  }
  windowFrames.instanceMatrix.needsUpdate = true;
  windowPanes.instanceMatrix.needsUpdate = true;
  windowFrames.userData.lightweightFacade = true;
  windowPanes.userData.lightweightFacade = true;
  windowFrames.castShadow = windowPanes.castShadow = false;
  windowFrames.receiveShadow = windowPanes.receiveShadow = false;
  group.add(windowFrames, windowPanes);

  const residentialTower = /APARTMENT|RESIDENCY|LODGE/i.test(title);
  if (residentialTower) {
    const balconyFloors = [];
    for (let floor = 1; floor < floors; floor += 2) balconyFloors.push(floor);
    const balconyCount = balconyFloors.length * 2;
    const balconyWidth = width * .52;
    const balconyMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5557, roughness: .66, metalness: .24 });
    weatherBuildingSurfaces.push(makeWeatherSurfaceState(balconyMaterial, { roughnessDrop: .07, minRoughness: .48, darkening: .02 }));
    const balconySlabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), roofTrim, balconyCount);
    const balconyRails = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), balconyMaterial, balconyCount * 8);
    let slabIndex = 0;
    let railIndex = 0;
    for (const floor of balconyFloors) {
      const baseY = floor * floorHeight;
      for (const side of [-1, 1]) {
        const balconyZ = side * (depth / 2 + .28);
        transform.position.set(0, baseY + .05, balconyZ);
        transform.scale.set(balconyWidth, .10, .52);
        transform.updateMatrix();
        balconySlabs.setMatrixAt(slabIndex++, transform.matrix);

        const railZ = side * (depth / 2 + .54);
        for (const railY of [baseY + .24, baseY + .82]) {
          transform.position.set(0, railY, railZ);
          transform.scale.set(balconyWidth, .045, .045);
          transform.updateMatrix();
          balconyRails.setMatrixAt(railIndex++, transform.matrix);
        }
        for (let post = 0; post < 6; post++) {
          const postX = (post - 2.5) * balconyWidth / 5;
          transform.position.set(postX, baseY + .53, railZ);
          transform.scale.set(.035, .58, .035);
          transform.updateMatrix();
          balconyRails.setMatrixAt(railIndex++, transform.matrix);
        }
      }
    }
    balconySlabs.instanceMatrix.needsUpdate = true;
    balconyRails.instanceMatrix.needsUpdate = true;
    balconySlabs.userData.lightweightFacade = true;
    balconyRails.userData.lightweightFacade = true;
    balconySlabs.castShadow = balconyRails.castShadow = false;
    balconySlabs.receiveShadow = balconyRails.receiveShadow = false;
    group.add(balconySlabs, balconyRails);
  }

  const parapetHeight = .42;
  const frontParapet = new THREE.Mesh(new THREE.BoxGeometry(width, parapetHeight, .14), roofTrim);
  const sideParapet = new THREE.Mesh(new THREE.BoxGeometry(.14, parapetHeight, depth), roofTrim);
  frontParapet.position.set(0, height + parapetHeight / 2, depth / 2 - .04);
  sideParapet.position.y = height + parapetHeight / 2;
  const rearParapet = frontParapet.clone();
  rearParapet.position.z = -depth / 2 + .04;
  const leftParapet = sideParapet.clone();
  leftParapet.position.x = -width / 2 + .04;
  const rightParapet = sideParapet.clone();
  rightParapet.position.x = width / 2 - .04;
  group.add(frontParapet, rearParapet, leftParapet, rightParapet);

  if (residentialTower) {
    const tankMaterial = new THREE.MeshPhysicalMaterial({ color: 0x416b73, roughness: .38, metalness: .04, clearcoat: .22 });
    weatherBuildingSurfaces.push(makeWeatherSurfaceState(tankMaterial, { roughnessDrop: .08, minRoughness: .24, darkening: .035, clearcoatBoost: .12 }));
    const tankX = -width * .22;
    const tankZ = -depth * .20;
    const tankStand = new THREE.Mesh(new THREE.BoxGeometry(1.45, .35, 1.45), roofTrim);
    tankStand.position.set(tankX, height + .18, tankZ);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(.56, .62, 1.25, 14), tankMaterial);
    tank.position.set(tankX, height + .98, tankZ);
    const tankRim = new THREE.Mesh(new THREE.CylinderGeometry(.60, .60, .10, 14), tankMaterial);
    tankRim.position.set(tankX, height + 1.64, tankZ);
    group.add(tankStand, tank, tankRim);
  }
  if (title) {
    const board = createWorldSignMesh({ title, subtitle: `${currentWorldDistrictName().toUpperCase()} CITY`, background: '#315f78' }, Math.min(5.6, width * .72), .74);
    board.position.set(0, Math.min(height - .65, 4.4), depth / 2 + .08);
    group.add(board);
    registerFarVisual(board, x, z, 85);
  }
  group.position.set(x, 0, z);
  group.traverse(object => {
    if (!object.isMesh) return;
    const lightweightFacade = object.userData.lightweightFacade === true;
    object.castShadow = !lightweightFacade;
    object.receiveShadow = !lightweightFacade;
  });
  scene.add(group);
  addBoxCollider(x, z, width / 2, depth / 2, 'city-building');
}

function addRailPlatform(scene, x, z, length = 38) {
  const platformMat = new THREE.MeshStandardMaterial({ color: 0xb7b0a2, roughness: .96 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe2c85d, roughness: .78 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(length, .16, 2.25), platformMat);
  platform.position.set(x, .08, z);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(length, .035, .12), edgeMat);
  edge.position.set(x, .18, z + 1.02);
  scene.add(platform, edge);
}

function addParkingLot(scene, x, z, width, depth) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x292c2f, roughness: .98 });
  const line = new THREE.MeshStandardMaterial({ color: 0xe4e0cf, roughness: .82 });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(x, .028, z);
  scene.add(lot);
  for (let offset = -width / 2 + 2.1; offset < width / 2 - .5; offset += 3.1) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(.08, Math.max(2.5, depth - 1)), line);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x + offset, .04, z);
    scene.add(stripe);
  }
}

function addErnakulamCrosswalks(scene, centerX, centerZ) {
  const material = new THREE.MeshStandardMaterial({ color: 0xf0efe7, roughness: .78 });
  const verticalStreets = [
    { x: centerX - 22, width: 7 },
    { x: centerX, width: 8 },
    { x: centerX + 22, width: 7 },
  ];
  const horizontalStreets = [
    { z: centerZ - 16, depth: 7 },
    { z: centerZ + 2, depth: 8 },
    { z: centerZ + 21, depth: 7 },
  ];
  const stripesPerCrossing = 7;
  const markings = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    material,
    verticalStreets.length * horizontalStreets.length * 4 * stripesPerCrossing,
  );
  const transform = new THREE.Object3D();
  let index = 0;
  const placeStripe = (x, z, width, depth) => {
    transform.position.set(x, .046, z);
    transform.rotation.set(-Math.PI / 2, 0, 0);
    transform.scale.set(width, depth, 1);
    transform.updateMatrix();
    markings.setMatrixAt(index++, transform.matrix);
  };

  for (const vertical of verticalStreets) {
    for (const horizontal of horizontalStreets) {
      for (const side of [-1, 1]) {
        const acrossHorizontalX = vertical.x + side * (vertical.width / 2 + 2.35);
        const acrossVerticalZ = horizontal.z + side * (horizontal.depth / 2 + 2.35);
        for (let stripe = 0; stripe < stripesPerCrossing; stripe++) {
          const offset = (stripe - (stripesPerCrossing - 1) / 2) * .62;
          placeStripe(acrossHorizontalX + offset, horizontal.z, .40, horizontal.depth - .9);
          placeStripe(vertical.x, acrossVerticalZ + offset, vertical.width - .9, .40);
        }
      }
    }
  }

  markings.instanceMatrix.needsUpdate = true;
  markings.castShadow = false;
  markings.receiveShadow = false;
  scene.add(markings);
}

function addErnakulamDistrictFoundation(scene, roadTexture) {
  const cx = ERNAKULAM_CITY.x;
  const cz = ERNAKULAM_CITY.z;
  const roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture, bumpMap: roadTexture.userData.bumpMap, bumpScale: .024, color: 0xffffff, roughness: .98, metalness: 0 });
  weatherRoadSurfaces.push({ material: roadMaterial, baseRoughness: .98, baseMetalness: 0, baseColor: roadMaterial.color.clone() });

  const roads = [
    [cx, cz + 2, 72, 8],
    [cx, cz + 21, 62, 7],
    [cx, cz - 16, 62, 7],
    [cx, cz + 2, 8, 62],
    [cx - 22, cz + 2, 7, 58],
    [cx + 22, cz + 2, 7, 58],
    [-38, -19.5, 24, 7],
    [-29, -17.5, 7, 9],
    [0, -42, 8, 76],
    [0, -78, 150, 8],
  ];
  for (const [x, z, width, depth] of roads) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), roadMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, .025, z);
    scene.add(mesh);
    addRoadEdges(scene, x, z, width, depth);
  }
  addDistrictStreetLights(scene, [-65, -42, 10, 30].flatMap(z => [
    [-4.8, z, 1, Math.PI / 2],
    [4.8, z, 1, -Math.PI / 2],
  ]));
  const outskirtsLine = new THREE.Mesh(new THREE.PlaneGeometry(4, .16), new THREE.MeshStandardMaterial({ color:0xf1d46d, roughness:.75 }));
  outskirtsLine.rotation.x = -Math.PI / 2;
  for (let x = -70; x <= 70; x += 9) {
    const dash = outskirtsLine.clone();
    dash.position.set(x, .033, -78);
    scene.add(dash);
  }
  addErnakulamCrosswalks(scene, cx, cz);

  addRailTracks(scene, -40, -26.8, 38);
  addRailPlatform(scene, -40, -30.1, 38);
  addPassengerTrain(scene, -40, -26.8);
  addCivicBuilding(scene, -40, -35.8, {
    title: 'ERNAKULAM RAILWAY',
    subtitle: 'KERALA DISTRICT TRAINS',
    color: 0x385f7b,
    collider: 'ernakulam-railway',
  });
  const stationBoard = createWorldSignMesh({
    title: 'ERNAKULAM STATION',
    subtitle: 'KOTTAYAM · ₹35 · DISTRICT TRAINS',
    background: '#385f7b',
  }, 4.8, .92);
  stationBoard.position.set(-40, 2.35, -30.7);
  scene.add(stationBoard);
  registerFarVisual(stationBoard, -40, -30.7, 82);

  addParkingLot(scene, -60, -33.5, 20, 6.2);
  addParkedVehicle(scene, 'auto', 0x2b773f, -66, -33.5, Math.PI / 2);
  addParkedVehicle(scene, 'car', 0x687a86, -60, -33.5, Math.PI / 2);
  addParkedVehicle(scene, 'bike', 0x316d58, -54, -33.5, Math.PI / 2);
  addBusStop(scene, -35, -12, Math.PI / 2, 'RAILWAY BUS');

  addShop(scene, -49, 8.5, 'ERNAKULAM CITY MARKET', 'FOOD · GROCERIES · DAILY NEEDS');
  addShop(scene, -33, 11.5, 'BROADWAY CAFE', 'TEA · MEALS · SNACKS');
  addCivicBuilding(scene, -11, -34, { title: 'CITY HOSPITAL', subtitle: 'HEALTH · EMERGENCY', color: 0x2d7d63, collider: 'ernakulam-hospital' });
  addCivicBuilding(scene, -31, 42, { title: 'CITY POLICE', subtitle: 'PUBLIC HELP DESK', color: 0x315b84, collider: 'ernakulam-police' });
  addCivicBuilding(scene, 34, 11, { title: 'FIRE & RESCUE', subtitle: 'CITY EMERGENCY SERVICES', color: 0xa84437, collider: 'ernakulam-fire' });
  addFuelStation(scene, 31, -25);
  addServiceGarage(scene, -32, 30);

  addBusStop(scene, 16, 13.5, -Math.PI / 2, 'MG ROAD');
  // The north-south carriageway is 12 m wide; keep the stop wholly on its west footpath.
  addBusStop(scene, -10.5, 30.5, Math.PI, 'MARINE DRIVE');

  addPhotoHouse(scene, -48, 40, 9.2, 6.2);
  const ernakulamHomeMarker = new THREE.Group();
  ernakulamHomeMarker.add(missionTag('Rental Home', '#654b36'));
  ernakulamHomeMarker.position.set(-48, 0, 36.6);
  scene.add(ernakulamHomeMarker);
  addBench(scene, 4, 40);

  addCityTower(scene, 11, -38, 10, 8, 14, 0xc7b999, 'CITY RESIDENCY');
  addCityTower(scene, -12, -36, 11, 9, 18, 0xaeb6ba, 'METRO PLAZA');
  addCityTower(scene, -34, -8, 9, 8, 15, 0xc9b49a, 'APARTMENTS');
  addCityTower(scene, 34, -8, 10, 8, 16, 0xb0b9c0, 'CITY OFFICES');
  addCityTower(scene, -7, 38, 10, 8, 13, 0xbfae91, 'MARINE RESIDENCY');
  addCityTower(scene, 38, 40, 12, 8, 17, 0xaab3b8, 'COMMERCIAL CENTRE');

  for (const [x,z] of [[-54,-8],[-51,27],[44,-21],[42,30],[-10,-42],[13,-42]]) {
    addHouse(scene, x, z, 0xe7ddca, 0x8e523f);
  }

  addParkingLot(scene, -31, -5.5, 15, 5.5);
  addParkedVehicle(scene, 'car', 0x7d8b91, -35, -5.5, Math.PI / 2);
  addParkedVehicle(scene, 'car', 0x8c4e45, -30, -5.5, Math.PI / 2);
  addParkedVehicle(scene, 'bike', 0x316d58, -25, -5.5, Math.PI / 2);

  addPhotoVillager(scene, -47, 12.4, 2.1, .28, .7, .70, { role: 'Shopper', nightHide: true, shelterX: -49, shelterZ: 12.5 });
  addPhotoVillager(scene, -50, 12.8, 0, .23, 2.1, .71, { behavior: 'task', role: 'Market Vendor', facing: Math.PI / 2, shelterX: -49, shelterZ: 12.5 });
  addPhotoVillager(scene, -30.5, 15.1, 2.0, .25, 3.4, .70, { role: 'Customer', nightHide: true, shelterX: -33, shelterZ: 15.5 });
  addPhotoVillager(scene, -9, -29.5, 0, .23, 1.2, .72, { behavior: 'task', role: 'Clinic Staff', facing: Math.PI, shelterX: -11, shelterZ: -29.5 });
  addPhotoVillager(scene, -31, 47, 2.2, .24, 4.4, .71, { behavior: 'patrol', role: 'Police Patrol', shelterX: -31, shelterZ: 47 });
  addPhotoVillager(scene, 32, 14.6, 0, .22, 5.6, .70, { behavior: 'task', role: 'Fire Crew', facing: Math.PI, shelterX: 34, shelterZ: 14.4 });
  addPhotoVillager(scene, -37, -10.5, 0, .24, .2, .69, { behavior: 'idle', role: 'Commuter', facing: Math.PI / 2, shelterX: -35, shelterZ: -12 });
  addPhotoVillager(scene, -4.5, 32.1, 0, .24, 2.8, .69, { behavior: 'idle', role: 'Waiting', facing: 0, shelterX: -3, shelterZ: 30.5 });

  const marker = new THREE.Group();
  const board = createWorldSignMesh({ title: 'ERNAKULAM CITY', subtitle: 'MG ROAD · MARKET · MARINE DRIVE', background: '#315f78' }, 5.1, 1.0);
  board.position.y = 2.6;
  const post = new THREE.Mesh(new THREE.BoxGeometry(.11, 2.6, .11), new THREE.MeshStandardMaterial({ color: 0x555d5e, roughness: .8 }));
  post.position.y = 1.3;
  marker.add(post, board);
  marker.position.set(5, 0, -8.5);
  scene.add(marker);
  registerFarVisual(board, 5, -8.5, 95);

  addRoadVehicle(scene, { kind: 'car', axis: 'x', fixed: 2, min: -26, max: 30, progress: -21, direction: 1, speed: 7.0, color: 0x496f9f, flowPhase: 1.1 });
  addRoadVehicle(scene, { kind: 'auto', axis: 'x', fixed: 2, min: -26, max: 30, progress: 6, direction: -1, speed: 5.7, color: 0x2b773f, flowPhase: 2.7 });
  addRoadVehicle(scene, { kind: 'bike', axis: 'x', fixed: 21, min: -24, max: 26, progress: 20, direction: -1, speed: 7.5, color: 0x8b3e35, flowPhase: 4.2 });
  addRoadVehicle(scene, { kind: 'car', axis: 'z', fixed: 0, min: -22, max: 26, progress: -20, direction: 1, speed: 6.8, color: 0xb55b4c, flowPhase: .6 });
  addRoadVehicle(scene, { kind: 'bus', axis: 'x', fixed: 2, min: -26, max: 30, progress: -10, direction: 1, speed: 5.2, color: 0xd9b32d, flowPhase: 3.4, stops: [5, 18] });
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
      // Trees and fields behind the fog need neither draw calls nor wind work.
      // The extra range covers tall crowns and the edges of paddy fields.
      if (item.root) item.root.visible = distance <= (sceneRef?.fog?.far || 180) + 14;
      if (item.root && !item.root.visible) continue;
      if ((item.kind === 'tree' || item.kind === 'rubber' || item.kind === 'palm' || item.kind === 'areca' || item.kind === 'banana') && item.nearGroup && item.farGroup) {
        const isPalmType = item.kind === 'palm' || item.kind === 'areca';
        const isRubberType = item.kind === 'rubber';
        const farEnterDistance = item.kind === 'banana' ? 34 : (isPalmType ? 50 : 52);
        const adjustedFarDistance = isRubberType ? 42 : farEnterDistance;
        const nearReturnDistance = item.kind === 'banana' ? 28 : (isRubberType ? 34 : (isPalmType ? 42 : 44));
        const useFar = item.usingFar ? distance > nearReturnDistance : distance > adjustedFarDistance;
        if (useFar !== item.usingFar) {
          item.usingFar = useFar;
          item.nearGroup.visible = !useFar;
          item.farGroup.visible = useFar;
          item.nodes.forEach(node => { node.castShadow = !useFar; });
        }
      }
      if (distance > 62) continue;
    }
    const phase = Number(item.phase || 0);
    if (item.kind === 'palm' || item.kind === 'areca') {
      const flexibility = item.kind === 'areca' ? 1.25 : 1;
      const swayX = Math.sin(time * .86 + phase) * .011 * wind * flexibility;
      const swayZ = Math.cos(time * .63 + phase * 1.2) * .014 * wind * flexibility;
      const activeFronds = item.usingFar
        ? (item.farNodes || [item.farFronds, item.farStems])
        : (item.nodes || [item.fronds, item.stems]);
      for (const node of activeFronds) {
        if (!node) continue;
        node.rotation.x = Number(node.userData.windBaseX || 0) + swayX;
        node.rotation.z = Number(node.userData.windBaseZ || 0) + swayZ;
      }
      continue;
    }

    if (item.kind === 'banana') {
      const activeLeaves = item.usingFar ? item.farLeaves : item.leaves;
      activeLeaves.forEach((leaf, index) => {
        const flutter = Math.sin(time * (1.15 + index * .045) + phase + index * .71);
        const gustFlutter = Math.sin(time * 3.1 + phase + index * .39);
        leaf.rotation.x = Number(leaf.userData.windBaseX || 0) + flutter * .020 * wind;
        leaf.rotation.z = Number(leaf.userData.windBaseZ || 0) + (flutter * .026 + gustFlutter * .008) * wind;
      });
      continue;
    }

    if (item.kind === 'paddy') {
      item.plants.forEach((plant, index) => {
        const sway = Math.sin(time * .92 + phase + plant.x * .13 + plant.z * .19 + index * .07) * .035 * wind;
        const crossSway = Math.cos(time * .68 + phase + plant.z * .16) * .014 * wind;
        item.dummy.position.set(plant.x, .024, plant.z);
        item.dummy.rotation.set(sway, plant.yaw, crossSway);
        item.dummy.scale.setScalar(plant.scale);
        item.dummy.updateMatrix();
        item.mesh.setMatrixAt(index, item.dummy.matrix);
      });
      item.mesh.instanceMatrix.needsUpdate = true;
      continue;
    }

    if (item.kind === 'tree' || item.kind === 'rubber') {
      const flexibility = item.kind === 'rubber' ? .72 : 1;
      item.nodes.forEach((node, index) => {
        const sway = Math.sin(time * .78 + phase + index * .47);
        const flutter = Math.sin(time * 1.94 + phase + index * .83);
        node.rotation.x = Number(node.userData.windBaseX || 0) + sway * .006 * wind * flexibility;
        node.rotation.z = Number(node.userData.windBaseZ || 0) + (sway * .010 + flutter * .003) * wind * flexibility;
      });
      if (item.farGroup?.visible) {
        item.farGroup.rotation.z = Math.sin(time * .72 + phase) * .006 * wind * flexibility;
      }
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

function addDistrictAirport(scene, district, x, z) {
  const runwayMat = new THREE.MeshStandardMaterial({ color:0x454d52, roughness:.95 });
  const apronMat = new THREE.MeshStandardMaterial({ color:0x777b76, roughness:.98 });
  const lineMat = new THREE.MeshStandardMaterial({ color:0xf2eee0, roughness:.75 });
  const taxiMat = new THREE.MeshStandardMaterial({ color:0xe6c66d, roughness:.84 });
  const trimMat = new THREE.MeshStandardMaterial({ color:0x3e6583, roughness:.78 });
  const glassMat = new THREE.MeshStandardMaterial({ color:0x8bc0c6, roughness:.24, metalness:.08 });
  const concrete = new THREE.MeshStandardMaterial({ color:0xd9d6c8, roughness:.9 });
  const isErnakulam = district === 'Ernakulam';
  const runwayLength = isErnakulam ? 38 : 58;
  const runwayX = isErnakulam ? x - 11 : x - 10;
  const runwayZ = isErnakulam ? z + 4 : z - 17;
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(runwayLength, 9), runwayMat);
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(runwayX, .026, runwayZ);
  scene.add(runway);
  for (let offset = -runwayLength / 2 + 3; offset < runwayLength / 2 - 2; offset += 8) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.8, .17), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(runwayX + offset, .04, runwayZ);
    scene.add(dash);
  }
  for (const end of [-1, 1]) {
    for (const side of [-1, 1]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(.3, .17, .3), new THREE.MeshStandardMaterial({ color:0xf3e7b2, emissive:0x6c643a, emissiveIntensity:.18 }));
      light.position.set(runwayX + end * (runwayLength / 2 - 1), .16, runwayZ + side * 5.3);
      scene.add(light);
    }
  }

  const apron = new THREE.Mesh(new THREE.PlaneGeometry(23, 14), apronMat);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(x - 4, .024, z - 11);
  scene.add(apron);
  const taxiLine = new THREE.Mesh(new THREE.PlaneGeometry(15, .18), taxiMat);
  taxiLine.rotation.x = -Math.PI / 2;
  taxiLine.position.set(x - 2, .04, z - 12.5);
  scene.add(taxiLine);

  const terminalZ = z - 7;
  const terminal = new THREE.Group();
  const terminalBody = new THREE.Mesh(new THREE.BoxGeometry(15.2, 5.1, 7), concrete);
  terminalBody.position.y = 2.55;
  const terminalRoof = new THREE.Mesh(new THREE.BoxGeometry(15.8, .42, 7.5), trimMat);
  terminalRoof.position.y = 5.25;
  const facade = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.35, .13), glassMat);
  facade.position.set(0, 2.15, 3.56);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16.8, .3, 4.1), trimMat);
  canopy.position.set(0, 4.05, 5.1);
  terminal.add(terminalBody, terminalRoof, facade, canopy);
  for (const postX of [-7.6, -2.55, 2.55, 7.6]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.22, 3.8, .22), concrete);
    post.position.set(postX, 2.1, 6.6);
    terminal.add(post);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.7, .16), new THREE.MeshStandardMaterial({ color:0x355c68, roughness:.28, metalness:.08 }));
  door.position.set(0, 1.55, 3.65);
  terminal.add(door);
  const terminalSign = createWorldSignMesh({
    title: `${district.toUpperCase()} AIRPORT`,
    subtitle: 'DOMESTIC · CHECK-IN · GATE 01',
    background: '#315f78',
  }, 7.5, .95);
  terminalSign.position.set(0, 4.65, 3.78);
  terminal.add(terminalSign);
  terminal.position.set(x, 0, terminalZ);
  terminal.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(terminal);
  registerFarVisual(terminalSign, x, terminalZ + 3.78, 82);
  addBoxCollider(x, terminalZ, 7.6, 3.5, 'airport-terminal');

  const informationBoard = createWorldSignMesh({
    title: 'FLIGHT INFORMATION',
    subtitle: 'KANNUR · KOZHIKODE · ERNAKULAM · TVM',
    background: '#2b4e5e',
  }, 5.4, .8);
  informationBoard.position.set(x + 10.8, 2.3, z - 1.3);
  scene.add(informationBoard);
  registerFarVisual(informationBoard, x + 10.8, z - 1.3, 64);

  const aircraft = new THREE.Group();
  const fuselageMat = new THREE.MeshStandardMaterial({ color:0xe8e9df, roughness:.57, metalness:.08 });
  const wingMat = new THREE.MeshStandardMaterial({ color:0x32647b, roughness:.68 });
  const windowMat = new THREE.MeshStandardMaterial({ color:0x294750, roughness:.28, metalness:.08 });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.58, .72, 9, 10), fuselageMat);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.position.y = 1.2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.62, 1.6, 10), fuselageMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(5.15, 1.2, 0);
  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.2, .14, 9), wingMat);
  wings.position.set(.3, 1.0, 0);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.3, .12, 3.4), wingMat);
  tailWing.position.set(-3.7, 1.16, 0);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.35, 1.25), wingMat);
  tailFin.position.set(-3.75, 1.68, 0);
  aircraft.add(fuselage, nose, wings, tailWing, tailFin);
  for (const side of [-1, 1]) {
    for (let windowX = -2.8; windowX <= 2.6; windowX += .8) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(.38, .18, .055), windowMat);
      window.position.set(windowX, 1.52, side * .67);
      aircraft.add(window);
    }
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(.34, .42, 2.1, 10), wingMat);
    engine.rotation.z = Math.PI / 2;
    engine.position.set(.45, .62, side * 2.25);
    aircraft.add(engine);
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(.055, .07, .58, 7), new THREE.MeshStandardMaterial({ color:0x555a59, roughness:.82, metalness:.16 }));
    gear.position.set(.35, .47, side * 1.58);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .14, 9), new THREE.MeshStandardMaterial({ color:0x292d2e, roughness:.92 }));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(.35, .2, side * 1.58);
    aircraft.add(gear, wheel);
  }
  const noseGear = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .46, 7), new THREE.MeshStandardMaterial({ color:0x555a59, roughness:.82, metalness:.16 }));
  noseGear.position.set(4.05, .42, 0);
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .13, 8), new THREE.MeshStandardMaterial({ color:0x292d2e, roughness:.92 }));
  noseWheel.rotation.x = Math.PI / 2;
  noseWheel.position.set(4.05, .18, 0);
  aircraft.add(noseGear, noseWheel);
  aircraft.position.set(x - 7, .08, z - 13.2);
  aircraft.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(aircraft);

  const board = createWorldSignMesh({
    title: `${district.toUpperCase()} AIRPORT`,
    subtitle: 'TICKETS · CHECK-IN · FLIGHTS',
    background: '#315f78',
  }, 4.8, .86);
  board.position.set(x, 2.7, z + .2);
  scene.add(board);
  registerFarVisual(board, x, z + .2, 78);
}

function addDistrictTeleportGateway(scene, district, x, z) {
  const baseMat = new THREE.MeshStandardMaterial({ color:0x252e3d, roughness:.78, metalness:.18 });
  const glowMat = new THREE.MeshStandardMaterial({ color:0x66d9ff, emissive:0x20a9ff, emissiveIntensity:.72, roughness:.28, metalness:.12 });
  const portalMat = new THREE.MeshStandardMaterial({ color:0x3c74bd, emissive:0x194db0, emissiveIntensity:.62, transparent:true, opacity:.58, side:THREE.DoubleSide, roughness:.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color:0x545d68, roughness:.9 });
  const gate = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, .35, 32), baseMat);
  plinth.position.y = .18;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.35, .18, 10, 36), glowMat);
  rim.position.y = 2.65;
  const field = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), portalMat);
  field.position.set(0, 2.65, -.04);
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(.42, 4.8, .62), stoneMat);
  leftPillar.position.set(-2.42, 2.45, 0);
  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 2.42;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, .42, .7), stoneMat);
  lintel.position.set(0, 4.86, 0);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), glowMat);
  crown.position.set(0, 5.28, 0);
  gate.add(plinth, rim, field, leftPillar, rightPillar, lintel, crown);
  gate.position.set(x, 0, z);
  gate.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(gate);

  const board = createWorldSignMesh({
    title: 'DISTRICT GATE',
    subtitle: `${district.toUpperCase()} · TELEPORT TO ANOTHER DISTRICT`,
    background: '#40345f',
  }, 6.7, .92);
  board.position.set(x, 6.3, z + .2);
  scene.add(board);
  registerFarVisual(board, x, z + .2, 88);
  registerFarVisual(rim, x, z, 52);
}

function addDistrictAtlasAttractions(scene, district) {
  const atlas = KERALA_DISTRICT_ATLAS[district];
  if (!atlas) return;
  for (const spot of atlas.attractions) {
    const x = spot.x, z = spot.z;
    switch (spot.kind) {
      case 'fort': addFortLandmark(scene, x, z); break;
      case 'temple': addTempleLandmark(scene, x, z); break;
      case 'backwater':
      case 'lake': addBackwaterHouseboat(scene, x, z); break;
      case 'waterfront': addChineseFishingNetsLandmark(scene, x, z); break;
      case 'beach':
      case 'coast': addBeachLandmark(scene, x, z); break;
      case 'museum':
      case 'palace':
      case 'heritage': addPalaceLandmark(scene, x, z); break;
      case 'hill':
      case 'peak':
      case 'tea': addTeaHills(scene, x, z); break;
      case 'cave': addCaveLandmark(scene, x, z); break;
      case 'sanctuary':
      case 'forest': addSanctuaryLandmark(scene, x, z); break;
      case 'garden':
      case 'park': addGardenLandmark(scene, x, z); break;
      case 'waterfall': addWaterfallLandmark(scene, x, z); break;
      case 'dam': addDamLandmark(scene, x, z); break;
      case 'shipyard': addShipyardLandmark(scene, x, z); break;
      case 'market': addMarketLandmark(scene, x, z); break;
      case 'ricefield': addPaddyFields(scene, x, z); break;
      case 'lighthouse': addLighthouseLandmark(scene, x, z); break;
      case 'adventure': addAdventureZoneLandmark(scene, x, z); break;
      default: addGardenLandmark(scene, x, z);
    }
    const label = createWorldSignMesh({
      title: spot.name.toUpperCase(),
      subtitle: district.toUpperCase() + ' · ' + spot.kind.toUpperCase(),
      background: '#315f78',
    }, 6.3, 1.04);
    label.position.set(x, 3.35, z - 5.5);
    scene.add(label);
    registerFarVisual(label, x, z - 5.5, 92);
  }
}

function addBeachLandmark(scene, x, z) {
  addCircleCollider(x, z, 2.2, 'beach');
  const group = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshStandardMaterial({ color:0xd4c18d, roughness:1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = .02;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color:0x2d8ea4, roughness:.28, metalness:.08 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(5, .03, 0);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(.4, 7.5), new THREE.MeshStandardMaterial({ color:0xe4e0c5, roughness:.8 }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(1, .04, 0);
  group.add(sand, water, foam);
  group.position.set(x, 0, z);
  scene.add(group);
  landmarkBeacon(scene, x, z - 3.8, 0x55d1dc);
}

function addAdventureZoneLandmark(scene, x, z) {
  addCircleCollider(x,z,4.8,'adventure-zone');
  const clearing = new THREE.Mesh(new THREE.CircleGeometry(10,32),new THREE.MeshStandardMaterial({ color:0x637b45, roughness:1 }));
  clearing.rotation.x = -Math.PI/2;
  clearing.position.set(x,.022,z);
  scene.add(clearing);
  const trail = new THREE.Mesh(new THREE.RingGeometry(6.1,6.8,32),new THREE.MeshStandardMaterial({ color:0xc0a575, roughness:1 }));
  trail.rotation.x = -Math.PI/2;
  trail.position.set(x,.03,z);
  scene.add(trail);

  const timber = new THREE.MeshStandardMaterial({ color:0x765234, roughness:.95 });
  const ropeMaterial = new THREE.MeshStandardMaterial({ color:0xd0bd97, roughness:.9 });
  const ropeLine = new THREE.LineBasicMaterial({ color:0xd0bd97, transparent:true, opacity:.92 });
  const metal = new THREE.MeshStandardMaterial({ color:0x464b47, roughness:.8, metalness:.18 });
  const platform = new THREE.MeshStandardMaterial({ color:0x98704a, roughness:.94 });
  const group = new THREE.Group();

  for (const towerX of [-5.1,5.1]) {
    for (const postZ of [-.95,.95]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,5.4,8),timber);
      post.position.set(towerX,2.7,postZ);
      group.add(post);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8,.3,2.6),platform);
    deck.position.set(towerX,2.0,0);
    group.add(deck);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8,.22,2.5),timber);
    top.position.set(towerX,5.0,0);
    group.add(top);
  }
  for (let plankX=-4.1;plankX<=4.1;plankX+=1.02) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(.88,.13,1.7),platform);
    plank.position.set(plankX,2.0,0);
    group.add(plank);
  }
  for (const ropeZ of [-.95,.95]) {
    const cable = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.1,3.2,ropeZ),new THREE.Vector3(0,2.8,ropeZ),new THREE.Vector3(5.1,3.2,ropeZ)
    ]);
    group.add(new THREE.Line(cable,ropeLine));
    for (let ropeX=-4.5;ropeX<=4.5;ropeX+=1.5) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.7,6),ropeMaterial);
      strut.position.set(ropeX,2.65,ropeZ);
      group.add(strut);
    }
  }

  const startPole = new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,6.8,8),metal);
  startPole.position.set(-1.7,3.4,-7.3);
  group.add(startPole);
  const landingPole = new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,4.2,8),metal);
  landingPole.position.set(2.1,2.1,8);
  group.add(landingPole);
  const zipline = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.7,6.55,-7.3),new THREE.Vector3(-.4,5.55,-3.3),new THREE.Vector3(.9,4.55,1.2),new THREE.Vector3(2.1,4.15,8)
  ]);
  group.add(new THREE.Line(zipline,ropeLine));

  const climbingWall = new THREE.Mesh(new THREE.BoxGeometry(4.1,4.6,.6),timber);
  climbingWall.position.set(7.2,2.3,-.2);
  group.add(climbingWall);
  const holds = [
    [-1.2,.6,0xd56c50],[0,.9,0x6bb7a6],[1.15,1.2,0xe1bd62],[-.7,2.0,0x7593c0],
    [.7,2.5,0xd78355],[-1.15,3.3,0x78a65c],[.1,3.7,0xd6b65e],[1.15,4.1,0x659b92]
  ];
  for (const [holdX,holdY,color] of holds) {
    const hold = new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshStandardMaterial({ color, roughness:.8 }));
    hold.position.set(7.2+holdX,holdY,.17);
    group.add(hold);
  }

  group.position.set(x,0,z);
  scene.add(group);
  landmarkBeacon(scene,x,z-10,0xffbf58);
}

function addCaveLandmark(scene, x, z) {
  addCircleCollider(x, z, 2.3, 'cave');
  const rock = new THREE.Mesh(new THREE.SphereGeometry(4.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color:0x766f61, roughness:1 }));
  rock.position.set(x, 0, z);
  const opening = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24),
    new THREE.MeshStandardMaterial({ color:0x171a17, roughness:1, side:THREE.DoubleSide }));
  opening.position.set(x, 1.38, z + 3.55);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.7, 28),
    new THREE.MeshStandardMaterial({ color:0x80765d, roughness:1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(x, .018, z);
  scene.add(rock, opening, floor);
  landmarkBeacon(scene, x, z - 3.3, 0xe9bd56);
}

function addChineseFishingNetsLandmark(scene, x, z) {
  addBackwaterHouseboat(scene, x, z + 4);
  const wood = new THREE.MeshStandardMaterial({ color:0x674d32, roughness:.95 });
  const rope = new THREE.LineBasicMaterial({ color:0xd7c6a0, transparent:true, opacity:.85 });
  const frame = new THREE.Group();
  const posts = [[-3.4,0], [3.4,0], [-2.5,5], [2.5,5]];
  for (const [px,pz] of posts) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.075,.11,6.1,7), wood);
    post.position.set(px,3.05,pz);
    frame.add(post);
  }
  for (const side of [-1,1]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,7.1,7), wood);
    bar.rotation.z = Math.PI/2;
    bar.position.set(0,5.8,side * .7);
    frame.add(bar);
  }
  const cablePoints = [new THREE.Vector3(-3.4,5.7,0), new THREE.Vector3(0,2.9,1), new THREE.Vector3(3.4,5.7,0)];
  const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePoints), rope);
  frame.add(cable);
  frame.position.set(x,0,z - 4);
  scene.add(frame);
  landmarkBeacon(scene,x,z - 6.4,0x49bed0);
}

function addSanctuaryLandmark(scene, x, z) {
  addCircleCollider(x, z, 2.4, 'sanctuary');
  const clearing = new THREE.Mesh(new THREE.CircleGeometry(8.2, 30), new THREE.MeshStandardMaterial({ color:0x657c43, roughness:1 }));
  clearing.rotation.x = -Math.PI/2;
  clearing.position.set(x,.018,z);
  scene.add(clearing);
  [[-5,-4,.78],[5,-4,.85],[-5,4,.80],[5,4,.76],[0,7,.72]].forEach(([dx,dz,scale], index) =>
    addTree(scene,x+dx,z+dz,scale,index % 2 ? 'jackfruit' : 'mango'));
  const pond = new THREE.Mesh(new THREE.CircleGeometry(2.2,22), new THREE.MeshStandardMaterial({ color:0x3d8f8e, roughness:.3 }));
  pond.rotation.x=-Math.PI/2;
  pond.position.set(x+1,.028,z+1.4);
  scene.add(pond);
  landmarkBeacon(scene,x,z-5.6,0x73c76a);
}

function addGardenLandmark(scene, x, z) {
  addCircleCollider(x, z, 2.3, 'garden');
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(8.4,32), new THREE.MeshStandardMaterial({ color:0x638b4c, roughness:1 }));
  lawn.rotation.x=-Math.PI/2;
  lawn.position.set(x,.018,z);
  const path = new THREE.Mesh(new THREE.RingGeometry(4.4,5.0,32), new THREE.MeshStandardMaterial({ color:0xd1c5a8, roughness:1 }));
  path.rotation.x=-Math.PI/2;
  path.position.set(x,.03,z);
  scene.add(lawn,path);
  addBench(scene,x-2.8,z);
  addBench(scene,x+2.8,z);
  landmarkBeacon(scene,x,z-3.4,0x75c76b);
}

function addWaterfallLandmark(scene, x, z) {
  addBoxCollider(x,z,3.6,.75,'waterfall-rock');
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(9,5.8,1.1), new THREE.MeshStandardMaterial({ color:0x615e50, roughness:1 }));
  cliff.position.set(x,2.8,z);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(3.8,4.4), new THREE.MeshStandardMaterial({ color:0x61bfd0, roughness:.24, transparent:true, opacity:.88, side:THREE.DoubleSide }));
  fall.position.set(x,2.35,z+.6);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5.5,28), new THREE.MeshStandardMaterial({ color:0x328ba0, roughness:.32 }));
  pool.rotation.x=-Math.PI/2;
  pool.position.set(x,.03,z+3.2);
  scene.add(cliff,fall,pool);
  landmarkBeacon(scene,x,z-4.5,0x80d7e6);
}

function addDamLandmark(scene, x, z) {
  addBoxCollider(x,z,4.5,.95,'dam');
  const water = new THREE.Mesh(new THREE.PlaneGeometry(13,8), new THREE.MeshStandardMaterial({ color:0x3b879d, roughness:.32, metalness:.05 }));
  water.rotation.x=-Math.PI/2;
  water.position.set(x,.025,z-3.1);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10,4.6,1.3), new THREE.MeshStandardMaterial({ color:0xa9a79e, roughness:.94 }));
  wall.position.set(x,2.3,z);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(10.8,.22,1.8), new THREE.MeshStandardMaterial({ color:0xd1cec2, roughness:.9 }));
  crest.position.set(x,4.7,z);
  scene.add(water,wall,crest);
  landmarkBeacon(scene,x,z-2.8,0x76b6d6);
}

function addShipyardLandmark(scene, x, z) {
  addBoxCollider(x,z,3.6,1.6,'shipyard');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(13,9), new THREE.MeshStandardMaterial({ color:0x9b8664, roughness:1 }));
  ground.rotation.x=-Math.PI/2;
  ground.position.set(x,.02,z);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(7,.9,2.5), new THREE.MeshStandardMaterial({ color:0x694629, roughness:.9 }));
  hull.position.set(x,.8,z+1.6);
  const workshop = new THREE.Mesh(new THREE.BoxGeometry(5,3.2,4.4), new THREE.MeshStandardMaterial({ color:0xe0d2b2, roughness:.94 }));
  workshop.position.set(x,1.6,z-3.1);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2,1.8,4), new THREE.MeshStandardMaterial({ color:0x824b37, roughness:.94 }));
  roof.rotation.y=Math.PI/4;
  roof.position.set(x,4.1,z-3.1);
  scene.add(ground,hull,workshop,roof);
  landmarkBeacon(scene,x,z-4,0xd0a05d);
}

function addMarketLandmark(scene, x, z) {
  addCircleCollider(x,z,2.2,'market');
  const paving = new THREE.Mesh(new THREE.PlaneGeometry(13,9), new THREE.MeshStandardMaterial({ color:0xa99878, roughness:1 }));
  paving.rotation.x=-Math.PI/2;
  paving.position.set(x,.02,z);
  scene.add(paving);
  const colors=[0xb84c39,0x3d806b,0xe0b953];
  colors.forEach((color,index)=>{
    const stall=new THREE.Group();
    const table=new THREE.Mesh(new THREE.BoxGeometry(3.1,1.25,1.4),new THREE.MeshStandardMaterial({ color:0x9a6e43, roughness:.92 }));
    table.position.y=.72;
    const awning=new THREE.Mesh(new THREE.BoxGeometry(3.4,.18,2.0),new THREE.MeshStandardMaterial({ color, roughness:.9 }));
    awning.position.y=2.45;
    stall.add(table,awning);
    stall.position.set(x-4.1+index*4.1,0,z+1.8);
    scene.add(stall);
  });
  landmarkBeacon(scene,x,z-3.3,0xe9c45f);
}

function addLighthouseLandmark(scene, x, z) {
  addBoxCollider(x,z,1.2,1.2,'lighthouse');
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(.9,1.45,7.2,12), new THREE.MeshStandardMaterial({ color:0xe4d8bd, roughness:.88 }));
  tower.position.set(x,3.6,z);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.12,1.12,.95,12), new THREE.MeshStandardMaterial({ color:0xb5483a, roughness:.9 }));
  band.position.set(x,4.3,z);
  const lantern = new THREE.Mesh(new THREE.BoxGeometry(1.65,1.15,1.65), new THREE.MeshStandardMaterial({ color:0x514943, emissive:0xf0c955, emissiveIntensity:.28, roughness:.4 }));
  lantern.position.set(x,7.7,z);
  scene.add(tower,band,lantern);
  landmarkBeacon(scene,x,z-2.5,0xf3d36a);
}

function addDistrictIdentityEnvironment(scene, district, profile) {
  const waterMat = new THREE.MeshStandardMaterial({ color:0x3b8ba0, roughness:.26, metalness:.06, transparent:true, opacity:.93 });
  const sandMat = new THREE.MeshStandardMaterial({ color:0xc8b783, roughness:1 });
  const soilMat = new THREE.MeshStandardMaterial({ color:0x76623f, roughness:1 });

  if (profile.environment === 'coastal') {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(28, 150), waterMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(91,.02,18);
    scene.add(sea);
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(3.2,150), sandMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(75.5,.025,18);
    scene.add(beach);
    [[72,-55,.82],[72,-26,.76],[72,9,.80],[72,36,.78],[72,66,.84]].forEach(([x,z,s]) => addPalm(scene,x,z,s));
  } else if (profile.environment === 'backwater') {
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(13, 150), waterMat);
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(-83,.02,15);
    scene.add(canal);
    const bankA = new THREE.Mesh(new THREE.PlaneGeometry(2.4,150), soilMat);
    bankA.rotation.x = -Math.PI / 2;
    bankA.position.set(-75.2,.023,15);
    scene.add(bankA);
    [[-72,-52,.76],[-72,-20,.82],[-72,14,.78],[-72,46,.84],[-72,70,.75]].forEach(([x,z,s]) => addPalm(scene,x,z,s));
  } else if (profile.environment === 'highland') {
    if (district === 'Idukki') addIdukkiHighlandRidges(scene);
    else for (const [x,z,r] of [[80,70,6.4],[-82,70,5.6],[82,-70,5.0]]) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(r,r*.72,18), new THREE.MeshStandardMaterial({ color:0x4f7c49, roughness:1 }));
      hill.position.set(x,r*.34,z);
      scene.add(hill);
    }
    [[70,58,.72,.3],[-70,60,.76,1.4],[73,-58,.68,2.0],[-72,-55,.70,.8]].forEach(([x,z,s,y]) => addBananaPlant(scene,x,z,s,y));
    [[82,-44,.76,.2,true],[92,-44,.80,1.0,false],[82,-28,.73,1.7,true],[92,-28,.78,2.5,false],
      [82,-12,.77,3.1,true],[92,-12,.74,4.0,false],[82,4,.80,4.7,true],[92,4,.75,5.4,false]]
      .forEach(([x,z,s,y,tapped]) => addRubberTree(scene,x,z,s,y,tapped));
  } else if (profile.environment === 'plains') {
    [[76,64],[-76,64],[76,-66]].forEach(([x,z],index) =>
      addPaddyField(scene,x,z,18,11,6200+index*83)
    );
  } else {
    const park = new THREE.Mesh(new THREE.CircleGeometry(9,32), new THREE.MeshStandardMaterial({ color:0x5f8f50, roughness:1 }));
    park.rotation.x = -Math.PI/2;
    park.position.set(-77,.02,65);
    scene.add(park);
    addBench(scene,-79,65);
    addBench(scene,-75,65);
    addPalm(scene,-82,61,.72);
    addPalm(scene,-72,61,.72);
  }

  const neighbourhoodBoard = createWorldSignMesh({
    title: profile.neighbourhood.toUpperCase(),
    subtitle: `${district.toUpperCase()} · LOCAL AREA`,
    background:'#3f5d72',
  },4.8,.86);
  neighbourhoodBoard.position.set(-55,2.5,-31);
  scene.add(neighbourhoodBoard);
  registerFarVisual(neighbourhoodBoard,-55,-31,76);

  addPhotoHouse(scene,-62,-48,9.4,6.3);
  addPhotoHouse(scene,-48,-48,9.0,6.1);
  addCityTower(scene,-58,-23,8.8,7.2,11,0xb9ad94,profile.neighbourhood.toUpperCase());
  addParkingLot(scene,-55,-29,14,5.2);
  addParkedVehicle(scene,'bike',0x315f78,-59,-29,Math.PI/2);
  addParkedVehicle(scene,'auto',0x2b773f,-54,-29,Math.PI/2);
  addParkedVehicle(scene,'car',0x7b6d65,-49,-29,Math.PI/2);
}

function addIdukkiHighlandRidges(scene) {
  const geometry = new THREE.SphereGeometry(1,20,14);
  const materials = [0x526f4b,0x5d7c53,0x466847,0x6b845d].map(color => new THREE.MeshStandardMaterial({ color, roughness:1 }));
  const ridges = [
    [-128,-128,36,18],[-64,-138,46,23],[0,-147,52,27],[69,-137,43,22],[130,-124,37,18],
    [-138,-50,40,20],[139,-17,42,21],[-132,45,37,18],[133,78,36,18],
    [-87,137,38,19],[-18,147,46,23],[62,139,39,20]
  ];
  ridges.forEach(([x,z,width,height],index) => {
    const material = materials[index % materials.length];
    const main = new THREE.Mesh(geometry,material);
    main.scale.set(width,height,width*.70);
    main.position.set(x,height,z);
    scene.add(main);
    registerFarVisual(main,x,z,width*2.8);
    for (const side of [-1,1]) {
      const shoulder = new THREE.Mesh(geometry,material);
      shoulder.scale.set(width*.68,height*.76,width*.56);
      shoulder.position.set(x + side*width*.60,height*.76,z + side*width*.12);
      scene.add(shoulder);
      registerFarVisual(shoulder,x + side*width*.60,z + side*width*.12,width*2.3);
    }
  });
}

function addGenericDistrictWorld(scene, district, roadTexture) {
  const config = DISTRICT_INSTANCE_CONFIG[district] || DISTRICT_INSTANCE_CONFIG.Kottayam;
  const profile = districtCityProfile(district);
  const roadMat = new THREE.MeshStandardMaterial({ map:roadTexture, bumpMap:roadTexture.userData.bumpMap, bumpScale:.024, color:0xffffff, roughness:.98, metalness:0 });
  weatherRoadSurfaces.push({ material:roadMat, baseRoughness:.98, baseMetalness:0, baseColor:roadMat.color.clone() });
  const roads = genericDistrictRoads(!!config.airport);
  for (const [x,z,width,depth] of roads) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, .018, z);
    scene.add(road);
    addRoadEdges(scene, x, z, width, depth);
  }
  addDistrictStreetLights(scene, [-58, -18, 57].flatMap(z => [
    [-6.8, z, 1, Math.PI / 2],
    [6.8, z, 1, -Math.PI / 2],
  ]).concat([-60, 60].flatMap(x => [
    [x, -5.8, 1, 0],
    [x, 5.8, -1, 0],
  ])));
  addDistrictLaneMarkings(scene, roads);
  addDistrictCrosswalks(scene);

  addRailTracks(scene, config.train.x, -17, 30);
  addRailPlatform(scene, config.train.x, -9.6, 28);
  addPassengerTrain(scene, config.train.x, -17);
  // Keep the station facade beside the platform. The train arrival point and
  // third-person camera must not be backed into its wall or the link road.
  addCivicBuilding(scene, config.train.x - 13, -12, {
    title: `${district.toUpperCase()} RAILWAY`,
    subtitle: 'KERALA DISTRICT TRAINS',
    color: 0x385f7b,
    collider: 'district-railway',
  });
  const railBoard = createWorldSignMesh({
    title: `${district.toUpperCase()} STATION`,
    subtitle: 'DISTRICT TRAVEL',
    background: '#315f78',
  }, 4.4, .88);
  railBoard.position.set(config.train.x,2.35,-6.7);
  scene.add(railBoard);
  registerFarVisual(railBoard,config.train.x,-6.7,72);

  const districtBoard = createWorldSignMesh({
    title: profile.centre.toUpperCase(),
    subtitle: `${profile.secondary.toUpperCase()} · KERALA PLAY`,
    background: '#245979',
  }, 5.4, .98);
  districtBoard.position.set(9,2.55,8);
  scene.add(districtBoard);
  registerFarVisual(districtBoard,9,8,86);

  addShop(scene, 20, 12.5, profile.market.toUpperCase(), profile.culture?.foodShort || 'FOOD · GROCERIES · DAILY NEEDS');
  addShop(scene, -44, 22, profile.cafe.toUpperCase(), profile.culture?.foodShort || 'TEA · MEALS · SNACKS');
  addCivicBuilding(scene, -20, 11.5, { title:'DISTRICT HOSPITAL', subtitle:`${district.toUpperCase()} · HEALTH`, color:0x2d7d63, collider:'district-hospital' });
  addCivicBuilding(scene, -20, -18, { title:'KERALA POLICE', subtitle:`${district.toUpperCase()} DISTRICT`, color:0x315b84, collider:'district-police' });
  addCivicBuilding(scene, 20, -18, { title:'FIRE & RESCUE', subtitle:'EMERGENCY SERVICES', color:0xa84437, collider:'district-fire' });
  const fuelPosition = genericDistrictFuelPosition(!!config.airport);
  addFuelStation(scene, fuelPosition.x, fuelPosition.z);
  addServiceGarage(scene, -18, -48);

  addPhotoHouse(scene, -24, -27, 10.2, 6.8);
  const districtHomeMarker = new THREE.Group();
  districtHomeMarker.add(missionTag('Rental Home', '#654b36'));
  districtHomeMarker.position.set(-24, 0, -21.8);
  scene.add(districtHomeMarker);
  addBench(scene, -10, -10);

  addBusStop(scene, 10, 8, Math.PI, 'CITY CENTRE');
  addBusStop(scene, 28, 13.5, -Math.PI / 2, 'MARKET');
  addBusStop(scene, -34, -14.5, Math.PI / 2, 'RAILWAY LINK');
  addBusStop(scene, -55, -29, Math.PI, profile.neighbourhood.toUpperCase());

  addCityTower(scene, -60, 25, 10, 8, 14, 0xc7b999, 'DISTRICT RESIDENCY');
  addCityTower(scene, 36, 31, 11, 9, 17, 0xaeb6ba, 'COMMERCIAL PLAZA');
  addCityTower(scene, -36, -46, 9, 8, 13, 0xc9b49a, 'APARTMENTS');
  addCityTower(scene, GENERIC_DISTRICT_OFFICE.x, GENERIC_DISTRICT_OFFICE.z, 10, 8, 15, 0xb0b9c0, 'CITY OFFICES');
  addCityTower(scene, -58, 10.5, 9, 7, 12, 0xc4b59a, 'LOCAL LODGE');
  addCityTower(scene, 58, 10.5, 9, 7, 13, 0xb3bdc1, 'BUSINESS BLOCK');

  for (const [x,z] of [[-54,48],[-38,54],[-54,-58],[-36,-62],[54,-58],[68,-42],[64,28],[45,62]]) {
    addHouse(scene,x,z,0xe7ddca,0x8e523f);
  }
  [[-68,20,.78],[68,20,.82],[-62,-20,.76],[62,-20,.80],[25,66,.74],[-25,66,.77],[-68,52,.75],[68,52,.79]]
    .forEach(([x,z,s]) => addPalm(scene,x,z,s));
  // Fruit trees occupy compound edges in every district, clear of connected
  // carriageways and the district-specific water or highland features.
  GENERIC_DISTRICT_FRUIT_TREES
    .forEach(([x,z,s,species]) => addTree(scene,x,z,s,species));

  addParkingLot(scene, 38, 12.5, 18, 6);
  addParkedVehicle(scene,'car',0x7d8b91,34,12.5,Math.PI/2);
  addParkedVehicle(scene,'auto',0x2b773f,39,12.5,Math.PI/2);
  addParkedVehicle(scene,'bike',0x316d58,44,12.5,Math.PI/2);

  addPhotoVillager(scene, 13, 12, 5.5, .34, .7, .70, { role:'Local', nightHide:true });
  addPhotoVillager(scene, -13, 12, 5.2, .32, 2.1, .71, { role:'Commuter' });
  addPhotoVillager(scene, 9, -12, 5.0, .31, 3.4, .70, { role:'Local', nightHide:true });
  addPhotoVillager(scene, -9, -12, 4.8, .30, 5.2, .70, { role:'Worker' });
  addPhotoVillager(scene, 22, 20, 2.8, .27, 1.4, .70, { role:'Shopper', nightHide:true, shelterX:20, shelterZ:19 });
  addPhotoVillager(scene, -42, 25, 2.4, .25, 2.8, .70, { role:'Cafe Customer', shelterX:-44, shelterZ:25 });
  addPhotoVillager(scene, -18, 19, 2.0, .24, 4.6, .71, { role:'Hospital Staff', shelterX:-20, shelterZ:19 });
  addPhotoVillager(scene, -32, -4, 3.0, .25, 5.8, .69, { role:'Rail Commuter', shelterX:-34, shelterZ:-6 });

  addRoadVehicle(scene, { kind:'car', axis:'z', fixed:-2.6, min:-72, max:72, progress:-42, direction:1, speed:6.6, color:0x496f9f, flowPhase:1.1 });
  addRoadVehicle(scene, { kind:'auto', axis:'z', fixed:2.7, min:-72, max:72, progress:28, direction:-1, speed:5.4, color:0x2b773f, flowPhase:2.7 });
  addRoadVehicle(scene, { kind:'bike', axis:'x', fixed:-2.3, min:-70, max:70, progress:-30, direction:1, speed:7.2, color:0x8b3e35, flowPhase:4.2 });
  addRoadVehicle(scene, { kind:'bus', axis:'x', fixed:2.4, min:-70, max:70, progress:42, direction:-1, speed:4.8, color:0xd9b32d, flowPhase:3.4, stops:[10,28] });
  addRoadVehicle(scene, { kind:'car', axis:'x', fixed:22, min:-52, max:54, progress:-20, direction:1, speed:5.8, color:0x687a86, flowPhase:5.1 });
  addRoadVehicle(scene, { kind:'bus', axis:'x', fixed:-36, min:-64, max:12, progress:-54, direction:1, speed:4.4, color:0xc89e2f, flowPhase:6.2, stops:[-55,-24] });
  addRoadVehicle(scene, { kind:'auto', axis:'x', fixed:-36, min:-64, max:12, progress:-18, direction:-1, speed:5.0, color:0x2b773f, flowPhase:7.4 });

  addDistrictIdentityEnvironment(scene,district,profile);
  if (config.airport) addDistrictAirport(scene, district, config.airport.x, config.airport.z);
  if (config.teleport) addDistrictTeleportGateway(scene, district, config.teleport.x, config.teleport.z);
}


function buildWorld(scene) {
  roadEdgePlans.length = 0;
  staticColliders.length = 0;
  busStopCameraOccluders.length = 0;
  weatherBuildingSurfaces.length = 0;
  parkedVehicleVisuals.length = 0;
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
    new THREE.PlaneGeometry(WORLD_LIMIT * 2, WORLD_LIMIT * 2),
    new THREE.MeshStandardMaterial({ map: groundTexture, color: 0xc6d2ba, roughness: .96, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadTexture = createRoadSurfaceTexture();
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTexture, bumpMap: roadTexture.userData.bumpMap, bumpScale: .024, color: 0xffffff, roughness: .98, metalness: 0 });
  weatherRoadSurfaces.push({
    material: roadMat,
    baseRoughness: .98,
    baseMetalness: 0,
    baseColor: roadMat.color.clone(),
  });
  renderedWorldDistrict = currentWorldDistrictName();
  if (renderedWorldDistrict === 'Ernakulam') {
    addErnakulamDistrictFoundation(scene, roadTexture);
    const config = currentDistrictInstance();
    const airport = config.airport;
    if (airport) addDistrictAirport(scene, renderedWorldDistrict, airport.x, airport.z);
    if (config.teleport) addDistrictTeleportGateway(scene, renderedWorldDistrict, config.teleport.x, config.teleport.z);
    finalizeRoadEdges(scene);
    return;
  }
  if (renderedWorldDistrict !== 'Kottayam') {
    addGenericDistrictWorld(scene, renderedWorldDistrict, roadTexture);
    finalizeRoadEdges(scene);
    return;
  }
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

  const outskirtsRoad = new THREE.Mesh(new THREE.PlaneGeometry(150, 8), roadMat);
  outskirtsRoad.rotation.x = -Math.PI / 2;
  outskirtsRoad.position.set(0, .018, -78);
  scene.add(outskirtsRoad);
  addRoadEdges(scene, 0, -78, 150, 8);
  for (let x = -70; x <= 70; x += 9) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(4, .16), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, .033, -78);
    scene.add(dash);
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
  addKottayamRailwayFoundation(scene);
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
  addRoadVehicle(scene, { kind: 'bus', axis: 'x', fixed: 24.1, min: -15, max: 20, progress: -10, direction: 1, speed: 4.6, color: 0xd7aa2d, flowPhase: 1.7 });
  addRoadVehicle(scene, { kind: 'auto', axis: 'x', fixed: 19.9, min: -15, max: 20, progress: 16, direction: -1, speed: 5.1, color: 0x2d7650, flowPhase: 3.3 });
  addRoadVehicle(scene, { kind: 'bike', axis: 'z', fixed: -40.7, min: -31, max: 19, progress: 12, direction: -1, speed: 5.4, color: 0x6f4a88, flowPhase: 2.2 });

  addPhotoHouse(scene, -24, -35, 10.2, 6.8);
  const rentalHomeMarker = new THREE.Group();
  rentalHomeMarker.add(missionTag('Rental Home', '#654b36'));
  rentalHomeMarker.position.set(-24, 0, -29.8);
  scene.add(rentalHomeMarker);
  addPhotoHouse(scene, 28, 34, 8.8, 5.9);
  addPhotoHouse(scene, -36, 33, 9.4, 6.25);
  addPhotoHouse(scene, 31, -35, 8.6, 5.75);
  addWorldRealismPass(scene);
  // Keep tall palms clear of both carriageways. Their fronds no longer hang
  // over the driving lanes; the near-road detail is handled by low gardens.
  const treePositions = [[-21,-62],[22,-55],[-22,-47],[23,-42],[-23,-11],[23,-8],[-23,7],[23,12],[-23,34],[23,43],[-22,61],[23,66],[-50,-20],[-45,14],[-42,48],[46,-42],[42,8.5],[47,52]];
  treePositions.forEach(([x, z], i) => addPalm(scene, x, z, .72 + (i % 3) * .09));
  [[-43,-37,1.08],[41,-29,1.15],[-48,41,.96],[45,39,1.04],[-27,-13,.88],[30,8.5,.8],[-28,57,.85]].forEach(([x, z, scale]) => addPalm(scene, x, z, scale));
  [[-43,-49,.88],[39,-25,.94],[-42,27,.90],[43,43,.92]].forEach(([x, z, scale], index) =>
    addTree(scene, x, z, scale, index % 2 ? 'jackfruit' : 'mango'));
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
  addServiceGarage(scene, -33, -12);
  addShop(scene, 31, 12.5, 'TOWN MARKET', 'GROCERIES · TEA · DAILY NEEDS');
  addCivicBuilding(scene, 42, 31, { title: 'COMMUNITY CLINIC', subtitle: 'HEALTH CENTRE · 24/7', color: 0x2d7d63, collider: 'clinic' });
  addCivicBuilding(scene, -31, 14, { title: 'KERALA POLICE', subtitle: 'POLICE STATION', color: 0x315b84, collider: 'police-station' });
  addCivicBuilding(scene, -52, 8, { title: 'FIRE & RESCUE', subtitle: 'EMERGENCY SERVICES', color: 0xa84437, collider: 'fire-station' });
  addBusStop(scene, 13.0, 16.0, Math.PI, 'TOWN CENTRE');
  addTrafficCheckpoint(scene, 5.4, 16.5);
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
  addPhotoVillager(scene, 42.0, 35.5, 0, .24, .9, .70, {
    behavior: 'task', facing: Math.PI, role: 'Clinic Staff',
    shelterX: 42.0, shelterZ: 35.5,
    dailySchedule: [
      { start: 0, hidden: true, x: 20.0, z: 34.0, role: 'Local' },
      { start: 6.6, x: 20.0, z: 34.0, behavior: 'idle', role: 'Commuter' },
      { start: 7.2, x: 42.0, z: 35.5, behavior: 'task', role: 'Clinic Staff', facing: Math.PI, transitionHours: .55 },
      { start: 13.0, x: 38.0, z: 37.5, behavior: 'social', role: 'Lunch Break', targetX: 39.0, targetZ: 37.0, transitionHours: .25 },
      { start: 13.6, x: 42.0, z: 35.5, behavior: 'task', role: 'Clinic Staff', facing: Math.PI, transitionHours: .2 },
      { start: 19.2, x: 13.2, z: 14.8, behavior: 'idle', role: 'Waiting', facing: Math.PI, transitionHours: .7 },
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
  addPhotoVillager(scene, -52.0, 13.0, 0, .24, 4.1, .71, {
    behavior: 'task', facing: Math.PI, role: 'Fire Crew',
    shelterX: -52.0, shelterZ: 13.0,
    dailySchedule: [
      { start: 0, x: -52.0, z: 13.0, behavior: 'idle', role: 'Night Crew', facing: Math.PI },
      { start: 7.0, x: -52.0, z: 13.0, behavior: 'task', role: 'Fire Crew', facing: Math.PI },
      { start: 11.5, x: -49.0, z: 12.5, behavior: 'patrol', role: 'Equipment Check', transitionHours: .25 },
      { start: 12.4, x: -52.0, z: 13.0, behavior: 'task', role: 'Fire Crew', facing: Math.PI, transitionHours: .25 },
      { start: 19.0, x: -52.0, z: 13.0, behavior: 'idle', role: 'Night Crew', facing: Math.PI, transitionHours: .25 },
    ],
  });
  addPhotoVillager(scene, 29.0, 15.0, 0, .23, 5.2, .69, {
    behavior: 'task', facing: Math.PI, role: 'Market Vendor',
    shelterX: 29.0, shelterZ: 15.0,
    dailySchedule: [
      { start: 0, hidden: true, x: 38.0, z: 8.0, role: 'Local' },
      { start: 5.2, x: 38.0, z: 8.0, behavior: 'idle', role: 'Commuter' },
      { start: 5.8, x: 29.0, z: 15.0, behavior: 'task', role: 'Market Vendor', facing: Math.PI, transitionHours: .55 },
      { start: 11.0, x: 27.3, z: 16.5, behavior: 'social', role: 'Customer Help', targetX: 26.2, targetZ: 16.5, transitionHours: .2 },
      { start: 11.5, x: 29.0, z: 15.0, behavior: 'task', role: 'Market Vendor', facing: Math.PI, transitionHours: .2 },
      { start: 20.2, x: 38.0, z: 8.0, behavior: 'idle', role: 'Going Home', transitionHours: .65 },
      { start: 21.0, hidden: true, x: 38.0, z: 8.0, role: 'Local' },
    ],
  });

  addPhotoVillager(scene, 10.1, 32.0, 0, .28, 2.4, .70, {
    behavior: 'idle', facing: Math.PI, role: 'Waiting',
    shelterX: 10.1, shelterZ: 32.0,
    dailySchedule: [
      { start: 0, hidden: true, x: 22.0, z: 18.0, role: 'Local' },
      { start: 5.8, x: 22.0, z: 18.0, behavior: 'idle', role: 'Local' },
      { start: 6.5, x: 10.1, z: 32.0, behavior: 'idle', role: 'Commuter', facing: Math.PI, transitionHours: .65 },
      { start: 7.2, x: 10.1, z: 32.0, behavior: 'idle', role: 'Waiting', facing: Math.PI },
      { start: 8.4, x: 25.0, z: 39.0, behavior: 'task', role: 'Worker', facing: -Math.PI / 2, transitionHours: .7 },
      { start: 13.0, x: 13.8, z: 41.6, behavior: 'social', role: 'Tea Break', targetX: 12.4, targetZ: 41.4, transitionHours: .45 },
      { start: 13.6, x: 25.0, z: 39.0, behavior: 'task', role: 'Worker', facing: -Math.PI / 2, transitionHours: .4 },
      { start: 18.1, x: 10.1, z: 32.0, behavior: 'idle', role: 'Waiting', facing: Math.PI, transitionHours: .7 },
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
  const teleport = currentDistrictInstance().teleport;
  if (teleport) addDistrictTeleportGateway(scene, renderedWorldDistrict, teleport.x, teleport.z);
  finalizeRoadEdges(scene);
}

function buildLandmarkWorld(scene) {
  addDistrictAtlasAttractions(scene, currentWorldDistrictName());
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
  addPaddyField(scene,x,z,9.7,6.7,Math.abs(Math.floor(x*61+z*37))+8401);
  landmarkBeacon(scene, x, z - 3.5, 0xcbe064);
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

function createFootpathTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = visualRandom(6024);
  context.fillStyle = '#89867d';
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 900; index++) {
    const shade = 112 + Math.floor(random() * 28);
    context.fillStyle = `rgba(${shade},${shade - 1},${shade - 5},${.08 + random() * .12})`;
    context.fillRect(random() * size, random() * size, .7 + random() * 1.5, .7 + random() * 1.5);
  }
  context.strokeStyle = 'rgba(48,47,43,.36)';
  context.lineWidth = 1.3;
  for (let joint = 0; joint <= size; joint += 32) {
    context.beginPath();
    context.moveTo(joint, 0);
    context.lineTo(joint, size);
    context.moveTo(0, joint);
    context.lineTo(size, joint);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function finalizeRoadEdges(scene) {
  const curbThickness = .36;
  const sidewalkWidth = 1.7;
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0xc3b9a3, roughness: 1 });
  const edgeLineMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e8df, roughness: .76 });
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ map: createFootpathTexture(), color: 0xffffff, roughness: .95, metalness: 0 });
  weatherRoadSurfaces.push({ material: sidewalkMaterial, baseRoughness: .95, baseMetalness: 0, baseColor: sidewalkMaterial.color.clone() });
  roadEdgePlans.forEach((road, roadIndex) => {
    const horizontal = road.width >= road.depth;
    const longitudinalCenter = horizontal ? road.x : road.z;
    const longitudinalHalf = (horizontal ? road.width : road.depth) / 2;
    const crossCenter = horizontal ? road.z : road.x;
    const crossHalf = (horizontal ? road.depth : road.width) / 2;
    const roadStart = longitudinalCenter - longitudinalHalf;
    const roadEnd = longitudinalCenter + longitudinalHalf;

    for (const side of [-1, 1]) {
      // Move the curb fully outside the asphalt so it cannot narrow the lane.
      const edgeCross = crossCenter + side * (crossHalf + curbThickness / 2 + .035);
      const cutouts = [];
      roadEdgePlans.forEach((other, otherIndex) => {
        if (roadIndex === otherIndex) return;
        const otherCrossCenter = horizontal ? other.z : other.x;
        const otherCrossHalf = (horizontal ? other.depth : other.width) / 2;
        const curbMin = edgeCross - curbThickness / 2;
        const curbMax = edgeCross + curbThickness / 2;
        if (curbMax < otherCrossCenter - otherCrossHalf - .02 || curbMin > otherCrossCenter + otherCrossHalf + .02) return;

        const otherLongCenter = horizontal ? other.x : other.z;
        const otherLongHalf = (horizontal ? other.width : other.depth) / 2;
        const cutStart = Math.max(roadStart, otherLongCenter - otherLongHalf - .24);
        const cutEnd = Math.min(roadEnd, otherLongCenter + otherLongHalf + .24);
        if (cutEnd > cutStart) cutouts.push([cutStart, cutEnd]);
      });
      cutouts.sort((a, b) => a[0] - b[0]);

      const visibleSegments = [];
      let cursor = roadStart;
      for (const [cutStart, cutEnd] of cutouts) {
        if (cutStart > cursor) visibleSegments.push([cursor, cutStart]);
        cursor = Math.max(cursor, cutEnd);
        if (cursor >= roadEnd) break;
      }
      if (cursor < roadEnd) visibleSegments.push([cursor, roadEnd]);

      visibleSegments.forEach(([start, end]) => {
        const length = end - start;
        if (length < .55) return;
        const geometry = horizontal
          ? new THREE.BoxGeometry(length, .13, curbThickness)
          : new THREE.BoxGeometry(curbThickness, .13, length);
        const curb = new THREE.Mesh(geometry, curbMaterial);
        if (horizontal) curb.position.set((start + end) / 2, .05, edgeCross);
        else curb.position.set(edgeCross, .05, (start + end) / 2);
        curb.receiveShadow = true;
        scene.add(curb);

        const edgeLineCross = crossCenter + side * Math.max(.45, crossHalf - .58);
        const edgeLineGeometry = horizontal
          ? new THREE.PlaneGeometry(length, .11)
          : new THREE.PlaneGeometry(.11, length);
        const edgeLine = new THREE.Mesh(edgeLineGeometry, edgeLineMaterial);
        edgeLine.rotation.x = -Math.PI / 2;
        edgeLine.position.set(
          horizontal ? (start + end) / 2 : edgeLineCross,
          .036,
          horizontal ? edgeLineCross : (start + end) / 2,
        );
        edgeLine.castShadow = false;
        edgeLine.receiveShadow = false;
        scene.add(edgeLine);

        const sidewalkGeometry = horizontal
          ? new THREE.PlaneGeometry(length, sidewalkWidth)
          : new THREE.PlaneGeometry(sidewalkWidth, length);
        const uv = sidewalkGeometry.getAttribute('uv');
        const repeatX = (horizontal ? length : sidewalkWidth) / 2.4;
        const repeatY = (horizontal ? sidewalkWidth : length) / 2.4;
        for (let uvIndex = 0; uvIndex < uv.count; uvIndex++) {
          uv.setXY(uvIndex, uv.getX(uvIndex) * repeatX, uv.getY(uvIndex) * repeatY);
        }
        uv.needsUpdate = true;
        const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
        sidewalk.rotation.x = -Math.PI / 2;
        const sidewalkCross = crossCenter + side * (crossHalf + curbThickness + .035 + sidewalkWidth / 2);
        sidewalk.position.set(
          horizontal ? (start + end) / 2 : sidewalkCross,
          .022,
          horizontal ? sidewalkCross : (start + end) / 2,
        );
        sidewalk.receiveShadow = true;
        scene.add(sidewalk);
      });
    }
  });
  roadEdgePlans.length = 0;
}

function addRoadEdges(scene, x, z, width, depth) {
  if (![x, z, width, depth].every(Number.isFinite) || width <= 0 || depth <= 0) return;
  roadEdgePlans.push({ x, z, width, depth });
}

function getRoadVehiclePlateMaterial() {
  const plateIndex = nextRoadVehiclePlateIndex++ % 64;
  let material = roadVehiclePlateMaterials.get(plateIndex);
  if (material) return material;

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f7f4e9';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#171b1c';
  context.lineWidth = 8;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#111719';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 48px Arial, sans-serif';
  const districtCode = keralaPlateDistrictCodes[plateIndex % keralaPlateDistrictCodes.length];
  const registration = `KL ${districtCode} AB ${String(1000 + plateIndex).padStart(4, '0')}`;
  context.fillText(registration, canvas.width / 2, canvas.height / 2 + 1, canvas.width - 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  material = new THREE.MeshStandardMaterial({ map: texture, roughness: .72, metalness: .04, side: THREE.DoubleSide });
  roadVehiclePlateMaterials.set(plateIndex, material);
  return material;
}

function getVehicleTireTreadBumpMap() {
  if (vehicleTireTreadBumpMap) return vehicleTireTreadBumpMap;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#808080';
  context.fillRect(0, 0, size, size);
  context.strokeStyle = '#575757';
  context.lineWidth = 4;
  context.lineJoin = 'round';
  for (let x = -size; x <= size * 2; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    for (let y = 16; y <= size; y += 16) {
      const offset = (Math.floor(y / 16) % 2) ? 14 : 0;
      context.lineTo(x + offset, y);
    }
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.generateMipmaps = true;
  vehicleTireTreadBumpMap = texture;
  return vehicleTireTreadBumpMap;
}

function createRoadVehicle(kind, color) {
  const isBus = kind === 'bus';
  const width = isBus ? 2.28 : 1.62;
  const length = isBus ? 5.25 : 3.35;
  const vehicle = new THREE.Group();
  const wipers = [];

  const paint = new THREE.MeshPhysicalMaterial({
    color,
    roughness: .39,
    metalness: .14,
    clearcoat: .42,
    clearcoatRoughness: .30,
  });
  const trim = new THREE.MeshStandardMaterial({ color: 0x20272a, roughness: .78, metalness: .12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x173543, roughness: .18, metalness: .12, transparent: true, opacity: .92 });
  const tire = new THREE.MeshStandardMaterial({
    color: 0x111416,
    roughness: .96,
    bumpMap: getVehicleTireTreadBumpMap(),
    bumpScale: .012,
  });
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

  const upperBody = isBus ? new THREE.Group() : new THREE.Mesh(
    new THREE.BoxGeometry(width - .12, .42, 2.42),
    paint
  );
  const busInterior = isBus ? new THREE.Group() : null;
  if (isBus) {
    const addBusPanel = (geometry, x, y, z) => {
      const panel = new THREE.Mesh(geometry, paint);
      panel.position.set(x, y, z);
      upperBody.add(panel);
      return panel;
    };
    for (const side of [-1, 1]) {
      addBusPanel(new THREE.BoxGeometry(.13, .36, 4.65), side * (width / 2 - .065), 1.31, 0);
      addBusPanel(new THREE.BoxGeometry(.13, .12, 4.65), side * (width / 2 - .065), 2.025, 0);
      for (let pillarZ = -1.95; pillarZ <= 1.96; pillarZ += .78) {
        addBusPanel(new THREE.BoxGeometry(.13, .55, .12), side * (width / 2 - .065), 1.78, pillarZ);
      }
    }
    addBusPanel(new THREE.BoxGeometry(width, .36, .13), 0, 1.31, length / 2 - .03);
    addBusPanel(new THREE.BoxGeometry(width, .36, .13), 0, 1.31, -length / 2 + .03);
    addBusPanel(new THREE.BoxGeometry(.18, .55, .13), -width / 2 + .09, 1.78, length / 2 - .03);
    addBusPanel(new THREE.BoxGeometry(.18, .55, .13), width / 2 - .09, 1.78, length / 2 - .03);

    const busSeatMaterial = new THREE.MeshStandardMaterial({ color: 0x354940, roughness: .91 });
    for (const rowZ of [-1.48, -.76, -.04, .68, 1.40]) {
      for (const seatX of [-.54, .54]) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(.39, .10, .38), busSeatMaterial);
        cushion.position.set(seatX, 1.28, rowZ);
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(.39, .39, .105), busSeatMaterial);
        seatBack.position.set(seatX, 1.51, rowZ - .17);
        busInterior.add(cushion, seatBack);
      }
    }
    const driverSeatX = .49;
    const busDriverSeat = new THREE.Mesh(new THREE.BoxGeometry(.43, .11, .40), busSeatMaterial);
    busDriverSeat.position.set(driverSeatX, 1.27, 1.96);
    const busDriverSeatBack = new THREE.Mesh(new THREE.BoxGeometry(.43, .39, .11), busSeatMaterial);
    busDriverSeatBack.position.set(driverSeatX, 1.50, 1.72);
    const busDriverHeadrest = new THREE.Mesh(new THREE.BoxGeometry(.24, .10, .09), busSeatMaterial);
    busDriverHeadrest.position.set(driverSeatX, 1.76, 1.72);

    const busDashboardMaterial = new THREE.MeshStandardMaterial({ color: 0x252c2d, roughness: .78 });
    const busDashboard = new THREE.Mesh(new THREE.BoxGeometry(width * .82, .14, .28), busDashboardMaterial);
    busDashboard.position.set(0, 1.31, 2.40);
    const busSteeringWheel = new THREE.Group();
    busSteeringWheel.position.set(driverSeatX, 1.52, 2.25);
    const busSteeringRim = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 8, 18), trim);
    const busSteeringHub = new THREE.Mesh(new THREE.SphereGeometry(.026, 8, 6), chrome);
    const busSteeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(.016, .022, .18, 8), trim);
    busSteeringColumn.rotation.x = Math.PI / 2;
    busSteeringColumn.position.z = -.09;
    const busSteeringSpoke = new THREE.Mesh(new THREE.BoxGeometry(.012, .09, .012), chrome);
    busSteeringSpoke.position.y = .052;
    const busSteeringLowerSpokes = [-1, 1].map(side => {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(.012, .09, .012), chrome);
      spoke.position.set(side * .033, -.027, 0);
      spoke.rotation.z = side * -.58;
      return spoke;
    });
    busSteeringWheel.add(busSteeringRim, busSteeringHub, busSteeringColumn, busSteeringSpoke, ...busSteeringLowerSpokes);
    const busInstrumentDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(.20, .075, .018),
      new THREE.MeshStandardMaterial({ color: 0x16262a, emissive: 0x0b3038, emissiveIntensity: .16, roughness: .46 })
    );
    busInstrumentDisplay.position.set(driverSeatX + .20, 1.41, 2.255);
    busInterior.add(
      busDriverSeat, busDriverSeatBack, busDriverHeadrest,
      busDashboard, busSteeringWheel, busInstrumentDisplay
    );

    const handrailMaterial = new THREE.MeshStandardMaterial({ color: 0xb9a253, roughness: .46, metalness: .52 });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 4.42, 7), handrailMaterial);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(side * .34, 2.00, -.04);
      busInterior.add(rail);
      for (const supportZ of [-1.64, -.20, 1.24]) {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .48, 6), handrailMaterial);
        support.position.set(side * .34, 1.76, supportZ);
        busInterior.add(support);
      }
    }
    const gripGeometry = new THREE.TorusGeometry(.043, .007, 6, 8);
    for (const side of [-1, 1]) {
      for (const gripZ of [-1.20, -.40, .40, 1.20]) {
        const grip = new THREE.Mesh(gripGeometry, handrailMaterial);
        grip.rotation.x = Math.PI / 2;
        grip.position.set(side * .34, 1.92, gripZ);
        busInterior.add(grip);
      }
    }
  } else {
    upperBody.position.set(0, .82, -.08);
  }

  const cabin = isBus ? new THREE.Group() : new THREE.Mesh(
    new THREE.BoxGeometry(width - .20, .52, 1.72),
    glass
  );
  if (!isBus) cabin.position.set(0, 1.18, -.05);

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
  if (busInterior) vehicle.add(busInterior);

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

    const sideWindowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x234553,
      roughness: .20,
      metalness: .08,
      clearcoat: .58,
      clearcoatRoughness: .20,
      transparent: true,
      opacity: .84,
    });
    const doorHandleMaterial = new THREE.MeshStandardMaterial({
      color: 0x879194,
      roughness: .34,
      metalness: .58,
    });
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x343a3b, roughness: .92 });
    const seatBeltMaterial = new THREE.MeshStandardMaterial({ color: 0x252a2b, roughness: .94 });
    const buckleMaterial = new THREE.MeshStandardMaterial({ color: 0x858b88, roughness: .42, metalness: .34 });
    const buckleButtonMaterial = new THREE.MeshStandardMaterial({ color: 0xa52c24, roughness: .72 });
    const dashboardMaterial = new THREE.MeshStandardMaterial({ color: 0x202628, roughness: .78 });
    const displayMaterial = new THREE.MeshStandardMaterial({
      color: 0x16303a,
      emissive: 0x0c3b47,
      emissiveIntensity: .18,
      roughness: .48,
    });
    const sideDetails = [];
    for (const side of [-1, 1]) {
      for (const windowZ of [.34, -.39]) {
        const sideWindow = new THREE.Mesh(
          new THREE.BoxGeometry(.035, .27, .48),
          sideWindowMaterial
        );
        sideWindow.position.set(side * (width * .505), 1.20, windowZ);
        sideDetails.push(sideWindow);
      }

      const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(.018, .39, .018), trim);
      doorSeam.position.set(side * (width * .507), .70, -.12);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(.025, .045, .15), doorHandleMaterial);
      handle.position.set(side * (width * .516), .86, .16);
      const rocker = new THREE.Mesh(new THREE.BoxGeometry(.045, .10, 1.48), trim);
      rocker.position.set(side * (width * .47), .32, -.04);
      sideDetails.push(doorSeam, handle, rocker);
    }

    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(width * .88, .13, .22), dashboardMaterial);
    dashboard.position.set(0, .97, .52);
    const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(.17, .20, .39), dashboardMaterial);
    centerConsole.position.set(0, .79, .12);
    const instrumentDisplay = new THREE.Mesh(new THREE.BoxGeometry(.23, .085, .018), displayMaterial);
    instrumentDisplay.position.set(.37, 1.055, .60);
    const rearViewMirror = new THREE.Mesh(new THREE.BoxGeometry(.15, .045, .035), chrome);
    rearViewMirror.position.set(0, 1.39, .62);
    const interiorParts = [dashboard, centerConsole, instrumentDisplay, rearViewMirror];

    for (const seatX of [-.36, .36]) {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(.42, .12, .38), seatMaterial);
      cushion.position.set(seatX, .75, -.25);
      const seatBack = new THREE.Mesh(new THREE.CapsuleGeometry(.20, .20, 4, 8), seatMaterial);
      seatBack.scale.set(.96, .75, .54);
      seatBack.position.set(seatX, 1.02, -.43);
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(.23, .105, .10), seatMaterial);
      headrest.position.set(seatX, 1.34, -.43);
      const shoulderBelt = new THREE.Mesh(new THREE.BoxGeometry(.038, .45, .014), seatBeltMaterial);
      shoulderBelt.position.set(seatX, 1.005, -.292);
      shoulderBelt.rotation.z = -Math.sign(seatX) * .48;
      const lapBelt = new THREE.Mesh(new THREE.BoxGeometry(.27, .035, .018), seatBeltMaterial);
      lapBelt.position.set(seatX, .805, -.075);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(.048, .026, .038), buckleMaterial);
      buckle.position.set(seatX - Math.sign(seatX) * .115, .815, -.065);
      const buckleButton = new THREE.Mesh(new THREE.BoxGeometry(.018, .008, .01), buckleButtonMaterial);
      buckleButton.position.set(seatX - Math.sign(seatX) * .115, .831, -.041);
      interiorParts.push(cushion, seatBack, headrest, shoulderBelt, lapBelt, buckle, buckleButton);
    }

    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(.37, 1.12, .40);
    const steeringRim = new THREE.Mesh(new THREE.TorusGeometry(.105, .012, 8, 18), trim);
    const steeringHub = new THREE.Mesh(new THREE.SphereGeometry(.027, 8, 6), chrome);
    const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(.016, .024, .21, 8), trim);
    steeringColumn.rotation.x = Math.PI / 2;
    steeringColumn.position.z = -.105;
    steeringWheel.add(steeringRim, steeringHub, steeringColumn);
    interiorParts.push(steeringWheel);

    const gaugeFaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x101719,
      emissive: 0x071216,
      emissiveIntensity: .38,
      roughness: .66,
    });
    const gaugeMarkMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8c4c4,
      emissive: 0x31464a,
      emissiveIntensity: .45,
      roughness: .52,
      metalness: .16,
    });
    for (const offset of [-.054, .054]) {
      const gauge = new THREE.Group();
      gauge.position.set(.37 + offset, 1.055, .615);
      const face = new THREE.Mesh(new THREE.CircleGeometry(.027, 16), gaugeFaceMaterial);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.030, .0035, 6, 18), chrome);
      gauge.add(face, ring);
      for (let mark = 0; mark < 5; mark++) {
        const angle = -.88 + mark * .44;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(.0025, .008, .002), gaugeMarkMaterial);
        tick.position.set(Math.sin(angle) * .020, Math.cos(angle) * .020, .002);
        tick.rotation.z = -angle;
        gauge.add(tick);
      }
      const needle = new THREE.Mesh(new THREE.BoxGeometry(.0025, .021, .002), gaugeMarkMaterial);
      needle.position.set(0, .010, .003);
      needle.rotation.z = offset > 0 ? -.42 : .36;
      gauge.add(needle);
      interiorParts.push(gauge);
    }

    const ventMaterial = new THREE.MeshStandardMaterial({ color: 0x343d40, roughness: .64, metalness: .28 });
    for (const ventX of [-.105, .105]) {
      const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(.10, .045, .018), dashboardMaterial);
      ventFrame.position.set(ventX, .985, .642);
      interiorParts.push(ventFrame);
      for (let slat = 0; slat < 3; slat++) {
        const ventSlat = new THREE.Mesh(new THREE.BoxGeometry(.078, .004, .006), ventMaterial);
        ventSlat.position.set(ventX, .972 + slat * .012, .653);
        interiorParts.push(ventSlat);
      }
    }

    const consoleScreenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(.17, .115, .026),
      dashboardMaterial
    );
    consoleScreenFrame.position.set(0, .834, .311);
    const consoleScreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x17353a,
      emissive: 0x0b4850,
      emissiveIntensity: .34,
      roughness: .40,
      metalness: .04,
    });
    const consoleScreen = new THREE.Mesh(new THREE.BoxGeometry(.128, .071, .006), consoleScreenMaterial);
    consoleScreen.position.set(0, .838, .327);

    const shifterBase = new THREE.Mesh(new THREE.CylinderGeometry(.047, .055, .018, 10), trim);
    shifterBase.position.set(.105, .899, .065);
    const shifterStem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .095, 8), chrome);
    shifterStem.position.set(.105, .951, .065);
    const shifterKnob = new THREE.Mesh(new THREE.SphereGeometry(.033, 10, 8), trim);
    shifterKnob.position.set(.105, 1.008, .065);
    interiorParts.push(consoleScreenFrame, consoleScreen, shifterBase, shifterStem, shifterKnob);

    vehicle.add(hood, boot, grille, windscreen, rearGlass, mirrorLeft, mirrorRight, ...sideDetails, ...interiorParts);
    vehicle.userData.interiorSteeringWheel = steeringWheel;
  } else {
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(width - .30, .48, .055), glass);
    windscreen.position.set(0, 1.76, length / 2 + .035);
    const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(width - .38, .42, .05), glass);
    rearWindow.position.set(0, 1.77, -length / 2 - .035);
    vehicle.add(windscreen, rearWindow);

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

    const mirrorGlass = new THREE.MeshStandardMaterial({
      color: 0x9aabad,
      roughness: .25,
      metalness: .42,
    });
    for (const side of [-1, 1]) {
      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .16, 7), chrome);
      mirrorArm.rotation.z = side * -Math.PI / 2;
      mirrorArm.position.set(side * (width / 2 - .005), 1.84, length / 2 - .61);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(.06, .18, .13), trim);
      mirrorHousing.position.set(side * (width / 2 + .03), 1.90, length / 2 - .61);
      const mirrorSurface = new THREE.Mesh(new THREE.BoxGeometry(.008, .13, .095), mirrorGlass);
      mirrorSurface.position.set(side * (width / 2 + .064), 1.90, length / 2 - .61);
      vehicle.add(mirrorArm, mirrorHousing, mirrorSurface);
    }

    const destination = new THREE.Mesh(new THREE.BoxGeometry(width * .62, .19, .055), trim);
    destination.position.set(0, 2.02, length / 2 + .07);
    const destinationText = createBusDestinationSign(renderedWorldDistrict || currentWorldDistrictName());
    destinationText.position.set(0, 2.02, length / 2 + .101);
    vehicle.add(destination, destinationText);

    const entrySide = -1;
    const entryZ = length / 2 - .43;
    const doorway = new THREE.Mesh(
      new THREE.PlaneGeometry(.64, 1.42),
      new THREE.MeshStandardMaterial({ color: 0x171d1e, roughness: .92, side: THREE.DoubleSide })
    );
    doorway.rotation.y = entrySide * Math.PI / 2;
    doorway.position.set(entrySide * (width / 2 + .066), 1.10, entryZ);

    const doorwayFrameGeometry = new THREE.BoxGeometry(.045, 1.50, .045);
    const entryFrontFrame = new THREE.Mesh(doorwayFrameGeometry, trim);
    const entryRearFrame = new THREE.Mesh(doorwayFrameGeometry, trim);
    const frameX = entrySide * (width / 2 + .09);
    entryFrontFrame.position.set(frameX, 1.09, entryZ + .34);
    entryRearFrame.position.set(frameX, 1.09, entryZ - .34);

    const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x303638, roughness: .84, metalness: .12 });
    const lowerStep = new THREE.Mesh(new THREE.BoxGeometry(.52, .09, .48), stepMaterial);
    lowerStep.position.set(entrySide * (width / 2 + .22), .29, entryZ);
    const upperStep = new THREE.Mesh(new THREE.BoxGeometry(.42, .09, .44), stepMaterial);
    upperStep.position.set(entrySide * (width / 2 + .15), .49, entryZ);
    const stepEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0xd6bc71, roughness: .72, metalness: .18 });
    const lowerStepEdge = new THREE.Mesh(new THREE.BoxGeometry(.36, .012, .025), stepEdgeMaterial);
    lowerStepEdge.position.set(entrySide * (width / 2 + .22), .341, entryZ + .17);
    const upperStepEdge = new THREE.Mesh(new THREE.BoxGeometry(.29, .012, .025), stepEdgeMaterial);
    upperStepEdge.position.set(entrySide * (width / 2 + .15), .541, entryZ + .15);

    const entryRail = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.18, 7), chrome);
    entryRail.position.set(entrySide * (width / 2 - .13), 1.06, entryZ + .22);
    const entryRailUpperMount = new THREE.Mesh(new THREE.BoxGeometry(.13, .035, .035), chrome);
    entryRailUpperMount.position.set(entrySide * (width / 2 - .13), 1.61, entryZ + .22);
    const entryRailLowerMount = new THREE.Mesh(new THREE.BoxGeometry(.13, .035, .035), chrome);
    entryRailLowerMount.position.set(entrySide * (width / 2 - .13), .51, entryZ + .22);
    for (const part of [doorway, entryFrontFrame, entryRearFrame, lowerStep, upperStep, lowerStepEdge, upperStepEdge, entryRail, entryRailUpperMount, entryRailLowerMount]) {
      part.castShadow = part !== doorway;
      part.receiveShadow = false;
      vehicle.add(part);
    }
  }

  const leftLamp = new THREE.Mesh(new THREE.SphereGeometry(isBus ? .105 : .09, 8, 6), headlightMaterial);
  const rightLamp = leftLamp.clone();
  leftLamp.position.set(-width * .30, isBus ? .78 : .60, length / 2 + .11);
  rightLamp.position.set(width * .30, isBus ? .78 : .60, length / 2 + .11);

  const frontLampRadius = isBus ? .105 : .09;
  const frontLampHousingGeometry = new THREE.CylinderGeometry(frontLampRadius * 1.28, frontLampRadius * 1.28, .09, 12, 1, true);
  const frontLampBezelGeometry = new THREE.TorusGeometry(frontLampRadius * 1.02, .010, 6, 18);
  const frontLampLensGeometry = new THREE.CircleGeometry(frontLampRadius * .86, 18);
  const frontLampLensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff1ce,
    transparent: true,
    opacity: .40,
    roughness: .18,
    clearcoat: .9,
    clearcoatRoughness: .12,
    side: THREE.DoubleSide,
  });
  for (const lamp of [leftLamp, rightLamp]) {
    const { x, y, z } = lamp.position;
    const housing = new THREE.Mesh(frontLampHousingGeometry, trim);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(x, y, z - frontLampRadius * .42);
    const bezel = new THREE.Mesh(frontLampBezelGeometry, chrome);
    bezel.position.set(x, y, z + frontLampRadius * .86);
    const lens = new THREE.Mesh(frontLampLensGeometry, frontLampLensMaterial);
    lens.position.set(x, y, z + frontLampRadius + .003);
    vehicle.add(housing, lamp, bezel, lens);
  }

  const tailWidth = isBus ? .16 : .12;
  const tailHeight = .16;
  const leftTail = new THREE.Mesh(new THREE.BoxGeometry(tailWidth, tailHeight, .055), tailMaterial);
  const rightTail = leftTail.clone();
  leftTail.position.set(-width * .31, isBus ? .78 : .58, -length / 2 - .08);
  rightTail.position.set(width * .31, isBus ? .78 : .58, -length / 2 - .08);
  const tailHousingGeometry = new THREE.BoxGeometry(tailWidth + .045, tailHeight + .045, .075);
  const tailLensGeometry = new THREE.BoxGeometry(tailWidth - .014, tailHeight - .025, .008);
  const tailLensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff6259,
    emissive: 0x2d0503,
    emissiveIntensity: .12,
    transparent: true,
    opacity: .72,
    roughness: .22,
    clearcoat: .95,
    clearcoatRoughness: .12,
  });
  const tailDetails = [];
  for (const tail of [leftTail, rightTail]) {
    const { x, y, z } = tail.position;
    const housing = new THREE.Mesh(tailHousingGeometry, trim);
    housing.position.set(x, y, z + .045);
    const lens = new THREE.Mesh(tailLensGeometry, tailLensMaterial);
    lens.position.set(x, y, -length / 2 - .111);
    lens.castShadow = false;
    lens.receiveShadow = false;
    tailDetails.push(housing, lens);
  }

  const plateWidth = isBus ? .68 : .48;
  const plateHeight = .16;
  const plateY = isBus ? .55 : .42;
  const plateFrameGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, .035);
  const plateFrontFrame = new THREE.Mesh(plateFrameGeometry, trim);
  const plateRearFrame = new THREE.Mesh(plateFrameGeometry, trim);
  plateFrontFrame.position.set(0, plateY, length / 2 + .10);
  plateRearFrame.position.set(0, plateY, -length / 2 - .10);

  const plateGeometry = new THREE.PlaneGeometry(plateWidth - .045, plateHeight - .035);
  const plateMaterial = getRoadVehiclePlateMaterial();
  const plateFront = new THREE.Mesh(plateGeometry, plateMaterial);
  const plateRear = new THREE.Mesh(plateGeometry, plateMaterial);
  plateFront.position.set(0, plateY, length / 2 + .119);
  plateRear.position.set(0, plateY, -length / 2 - .119);
  plateRear.rotation.y = Math.PI;
  plateFront.castShadow = plateRear.castShadow = false;
  plateFront.receiveShadow = plateRear.receiveShadow = false;

  vehicle.add(leftTail, rightTail, ...tailDetails, plateFrontFrame, plateRearFrame, plateFront, plateRear);
  addVehicleTurnIndicators(vehicle, {
    frontX: width * .40, frontY: isBus ? .79 : .61, frontZ: length / 2 + .13,
    rearX: width * .40, rearY: isBus ? .79 : .59, rearZ: -length / 2 - .12,
    mirrorX: isBus ? 0 : width * .54 + .075, mirrorY: 1.20, mirrorZ: .53,
    size: isBus ? .11 : .075,
  });
  vehicle.userData.headlightMaterials = [headlightMaterial];
  vehicle.userData.tailLightMaterials = [tailMaterial];

  const wheelRadius = isBus ? .27 : .235;
  const wheelWidth = isBus ? .15 : .14;
  const wheelZ = isBus ? length * .34 : length * .315;
  const wheelX = width / 2 + .015;
  const wheelArchGeometry = new THREE.TorusGeometry(wheelRadius + .027, isBus ? .024 : .018, 5, 18, Math.PI);
  const spokeGeometry = new THREE.BoxGeometry(wheelWidth * .18, wheelRadius * .10, wheelRadius * .52);
  const lugGeometry = new THREE.SphereGeometry(Math.max(.008, wheelRadius * .052), 6, 5);
  const rimRingGeometry = new THREE.TorusGeometry(wheelRadius * .71, wheelRadius * .025, 5, 18);
  const wheelDetailDummy = new THREE.Object3D();
  const wheels = [];
  const frontWheels = [];

  for (const zPos of [-wheelZ, wheelZ]) {
    for (const xPos of [-wheelX, wheelX]) {
      const wheelRoot = new THREE.Group();
      wheelRoot.position.set(xPos, wheelRadius + .03, zPos);

      const wheelArch = new THREE.Mesh(wheelArchGeometry, paint);
      wheelArch.rotation.y = xPos > 0 ? Math.PI / 2 : -Math.PI / 2;
      wheelArch.position.set(xPos + Math.sign(xPos) * wheelWidth * .48, wheelRadius + .03, zPos);
      wheelArch.castShadow = true;
      wheelArch.receiveShadow = false;

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16),
        tire
      );
      wheel.rotation.z = Math.PI / 2;

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * .27, wheelRadius * .27, wheelWidth + .012, 12),
        rim
      );
      hub.rotation.z = Math.PI / 2;

      const outerSide = Math.sign(xPos);
      const rimRing = new THREE.Mesh(rimRingGeometry, rim);
      rimRing.rotation.y = Math.PI / 2;
      rimRing.position.x = outerSide * wheelWidth * .53;
      rimRing.castShadow = rimRing.receiveShadow = false;

      const wheelSpokes = new THREE.InstancedMesh(spokeGeometry, rim, 5);
      const lugNuts = new THREE.InstancedMesh(lugGeometry, chrome, 5);
      const spokeRadius = wheelRadius * .44;
      const lugRadius = wheelRadius * .36;
      for (let detailIndex = 0; detailIndex < 5; detailIndex++) {
        const angle = detailIndex * Math.PI * 2 / 5;
        wheelDetailDummy.position.set(
          outerSide * wheelWidth * .53,
          Math.sin(angle) * spokeRadius,
          Math.cos(angle) * spokeRadius
        );
        wheelDetailDummy.rotation.set(-angle, 0, 0);
        wheelDetailDummy.scale.set(1, 1, 1);
        wheelDetailDummy.updateMatrix();
        wheelSpokes.setMatrixAt(detailIndex, wheelDetailDummy.matrix);

        wheelDetailDummy.position.set(
          outerSide * wheelWidth * .54,
          Math.sin(angle) * lugRadius,
          Math.cos(angle) * lugRadius
        );
        wheelDetailDummy.rotation.set(0, 0, 0);
        wheelDetailDummy.scale.set(1, 1, 1);
        wheelDetailDummy.updateMatrix();
        lugNuts.setMatrixAt(detailIndex, wheelDetailDummy.matrix);
      }
      wheelSpokes.instanceMatrix.needsUpdate = true;
      lugNuts.instanceMatrix.needsUpdate = true;
      wheelSpokes.castShadow = wheelSpokes.receiveShadow = false;
      lugNuts.castShadow = lugNuts.receiveShadow = false;

      wheelRoot.add(wheel, hub, rimRing, wheelSpokes, lugNuts);
      vehicle.add(wheelArch, wheelRoot);
      wheels.push(wheelRoot);
      if (zPos > 0) frontWheels.push(wheelRoot);
    }
  }

  vehicle.userData.wheels = wheels;
  vehicle.userData.frontWheels = frontWheels;
  vehicle.userData.bodyParts = [lowerBody, upperBody, cabin, roof];
  vehicle.userData.wipers = wipers;
  vehicle.userData.wheelRadius = wheelRadius;
  registerVehicleWeatherSurface(vehicle, paint, {
    roughnessDrop: .14,
    minRoughness: .22,
    darkening: .045,
    clearcoatBoost: .18,
    clearcoatRoughnessDrop: .12,
  });
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
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111516,
    roughness: .96,
    bumpMap: getVehicleTireTreadBumpMap(),
    bumpScale: .012,
  });
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

  const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x9ba8a8, roughness: .26, metalness: .38 });
  for (const side of [-1, 1]) {
    const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(.18, .025, .025), trimMat);
    mirrorArm.position.set(side * .59, 1.62, .78);
    mirrorArm.rotation.z = side * -.12;
    const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(.11, .13, .075), trimMat);
    mirrorHousing.position.set(side * .68, 1.69, .80);
    const mirrorSurface = new THREE.Mesh(new THREE.BoxGeometry(.008, .095, .052), mirrorGlassMat);
    mirrorSurface.position.set(side * .739, 1.69, .80);
    auto.add(mirrorArm, mirrorHousing, mirrorSurface);
  }

  const frontLamp = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 6), lampMat);
  frontLamp.position.set(0, 1.02, 1.16);
  const frontLampHousing = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .08, 12, 1, true), trimMat);
  frontLampHousing.rotation.x = Math.PI / 2;
  frontLampHousing.position.set(0, 1.02, 1.18);
  const frontLampBezel = new THREE.Mesh(new THREE.TorusGeometry(.096, .011, 7, 18), rimMat);
  frontLampBezel.position.set(0, 1.02, 1.254);
  const frontLampLens = new THREE.Mesh(
    new THREE.CircleGeometry(.086, 18),
    new THREE.MeshPhysicalMaterial({
      color: 0xfff1ce,
      transparent: true,
      opacity: .42,
      roughness: .18,
      clearcoat: .9,
      clearcoatRoughness: .12,
      side: THREE.DoubleSide,
    })
  );
  frontLampLens.position.set(0, 1.02, 1.257);
  const leftTail = new THREE.Mesh(new THREE.BoxGeometry(.12, .14, .055), tailMat);
  const rightTail = leftTail.clone();
  leftTail.position.set(-.39, .73, -1.10);
  rightTail.position.set(.39, .73, -1.10);
  auto.add(frontLamp, frontLampHousing, frontLampBezel, frontLampLens, leftTail, rightTail);

  const plateFrameGeometry = new THREE.BoxGeometry(.42, .13, .03);
  const plateFaceGeometry = new THREE.PlaneGeometry(.39, .10);
  const plateMaterial = getRoadVehiclePlateMaterial();
  const frontPlateFrame = new THREE.Mesh(plateFrameGeometry, trimMat);
  const rearPlateFrame = new THREE.Mesh(plateFrameGeometry, trimMat);
  const frontPlate = new THREE.Mesh(plateFaceGeometry, plateMaterial);
  const rearPlate = new THREE.Mesh(plateFaceGeometry, plateMaterial);
  frontPlateFrame.position.set(0, .59, 1.245);
  rearPlateFrame.position.set(0, .55, -1.105);
  frontPlate.position.set(0, .59, 1.262);
  rearPlate.position.set(0, .55, -1.122);
  rearPlate.rotation.y = Math.PI;
  frontPlate.castShadow = rearPlate.castShadow = false;
  frontPlate.receiveShadow = rearPlate.receiveShadow = false;
  auto.add(frontPlateFrame, rearPlateFrame, frontPlate, rearPlate);

  addVehicleTurnIndicators(auto, {
    frontX: .43, frontY: .83, frontZ: 1.16,
    rearX: .39, rearY: .73, rearZ: -1.10,
    size: .072,
  });

  const wheels = [];
  const frontWheels = [];
  const wheelGeometry = new THREE.CylinderGeometry(.235, .235, .13, 16);
  const wheelSpokeGeometry = new THREE.BoxGeometry(.13 * .18, .235 * .10, .235 * .52);
  const wheelRimRingGeometry = new THREE.TorusGeometry(.235 * .71, .235 * .025, 5, 18);
  const wheelDetailDummy = new THREE.Object3D();
  const makeWheel = (x, z, front = false) => {
    const root = new THREE.Group();
    root.position.set(x, .31, z);
    const wheel = new THREE.Mesh(wheelGeometry, tireMat);
    wheel.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.235 * .24, .235 * .24, .13 + .012, 12), rimMat);
    hub.rotation.z = Math.PI / 2;

    const rimRings = new THREE.InstancedMesh(wheelRimRingGeometry, rimMat, 2);
    const spokes = new THREE.InstancedMesh(wheelSpokeGeometry, rimMat, 10);
    for (const [sideIndex, side] of [-1, 1].entries()) {
      wheelDetailDummy.position.set(side * .13 * .53, 0, 0);
      wheelDetailDummy.rotation.set(0, Math.PI / 2, 0);
      wheelDetailDummy.scale.set(1, 1, 1);
      wheelDetailDummy.updateMatrix();
      rimRings.setMatrixAt(sideIndex, wheelDetailDummy.matrix);

      for (let spokeIndex = 0; spokeIndex < 5; spokeIndex++) {
        const angle = spokeIndex * Math.PI * 2 / 5;
        wheelDetailDummy.position.set(
          side * .13 * .53,
          Math.sin(angle) * .235 * .44,
          Math.cos(angle) * .235 * .44
        );
        wheelDetailDummy.rotation.set(-angle, 0, 0);
        wheelDetailDummy.updateMatrix();
        spokes.setMatrixAt(sideIndex * 5 + spokeIndex, wheelDetailDummy.matrix);
      }
    }
    rimRings.instanceMatrix.needsUpdate = true;
    spokes.instanceMatrix.needsUpdate = true;
    rimRings.castShadow = rimRings.receiveShadow = false;
    spokes.castShadow = spokes.receiveShadow = false;
    root.add(wheel, hub, rimRings, spokes);
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
  registerVehicleWeatherSurface(auto, bodyMat, { roughnessDrop: .16, minRoughness: .46, darkening: .04 });
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
  updateVehicleWeatherSurfaces(vehicle, rain);

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
  parkedVehicleVisuals.push(vehicle);
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
  const trafficState = { ...config, baseSpeed: config.speed, currentSpeed: config.speed };
  trafficState.progress = nearestSafeTrafficProgress(trafficState, trafficState.progress);
  vehicle.userData.traffic = trafficState;
  if (trafficState.axis === 'z') {
    vehicle.position.set(trafficState.fixed, 0, trafficState.progress);
    vehicle.rotation.y = trafficState.direction > 0 ? 0 : Math.PI;
  } else {
    vehicle.position.set(trafficState.progress, 0, trafficState.fixed);
    vehicle.rotation.y = trafficState.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
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
        const stops = Array.isArray(config.stops) && config.stops.length ? config.stops : (config.axis === 'z' ? [27.5, -50.5] : [13.0]);
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

    if (trafficHitsStaticWorld(config, Number(config.progress))) {
      config.progress = nearestSafeTrafficProgress(config, Number(config.progress));
      config.currentSpeed = 0;
      if (config.axis === 'z') vehicle.position.z = config.progress;
      else vehicle.position.x = config.progress;
    }

    let nextProgress = Number(config.progress) + config.direction * config.currentSpeed * delta;
    if (config.direction > 0 && nextProgress > config.max) nextProgress = config.min;
    if (config.direction < 0 && nextProgress < config.min) nextProgress = config.max;

    if (trafficHitsStaticWorld(config, nextProgress)) {
      // Ambient traffic must never enter buildings, shelters or other static
      // world geometry. Hold at the last safe point and reverse along its lane.
      nextProgress = Number(config.progress);
      config.currentSpeed = 0;
      config.direction *= -1;
      if (config.kind === 'bus') {
        config.lastBusStop = null;
        config.stopUntil = 0;
      }
    }

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

function addFruitClusters(parent, species) {
  const isJackfruit = species === 'jackfruit';
  // Jackfruit hangs from the trunk and major branches; mangoes sit near the
  // canopy edge. Both use one draw call per tree and disappear with near LOD.
  const positions = isJackfruit
    ? [[.32,2.82,.24],[-.29,3.55,.26],[.18,4.15,-.34]]
    : [[-1.25,4.56,.72],[1.34,4.68,.35],[-.62,4.78,-1.02],[.68,4.54,1.12],[-1.52,5.12,-.2],[1.42,5.05,-.55],[.12,4.42,-1.18]];
  const fruits = new THREE.InstancedMesh(isJackfruit ? jackfruitGeometry : mangoGeometry,
    isJackfruit ? jackfruitMaterial : mangoMaterial, positions.length);
  const dummy = new THREE.Object3D();
  const colors = isJackfruit ? [0x8a9c47, 0x738e3f, 0x9ba94e] : [0x9bac48, 0xc5ad4d, 0xcf9142, 0x8f9b42];
  positions.forEach(([x, y, z], index) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, index * .47, (index % 2 ? 1 : -1) * .08);
    dummy.scale.set(isJackfruit ? .95 + (index % 2) * .12 : .80 + (index % 3) * .11,
      isJackfruit ? 1.22 + (index % 2) * .16 : 1.25 + (index % 3) * .10,
      isJackfruit ? .95 : .78 + (index % 2) * .12);
    dummy.updateMatrix();
    fruits.setMatrixAt(index, dummy.matrix);
    fruits.setColorAt(index, new THREE.Color(colors[index % colors.length]));
  });
  fruits.instanceMatrix.needsUpdate = true;
  fruits.instanceColor.needsUpdate = true;
  parent.add(fruits);
  if (isJackfruit) {
    const stalks = new THREE.InstancedMesh(fruitStalkGeometry, fruitStalkMaterial, positions.length);
    positions.forEach(([x, y, z], index) => {
      dummy.position.set(x, y + .38, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      stalks.setMatrixAt(index, dummy.matrix);
    });
    stalks.instanceMatrix.needsUpdate = true;
    parent.add(stalks);
  }
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
  weatherBuildingSurfaces.push(
    makeWeatherSurfaceState(wallMat, { roughnessDrop: .06, minRoughness: .72, darkening: .04 }),
    makeWeatherSurfaceState(roofMat, { roughnessDrop: .12, minRoughness: .68, darkening: .03 }),
  );
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
  const tileGeometry = new THREE.BoxGeometry(.88, .07, 4.45);
  let tileIndex = 0;
  for (let xTile = -4.15; xTile <= 4.15; xTile += 1.18) {
    const tileSeed = Math.abs(Math.round(x * 11 + z * 17 + tileIndex * 7));
    const material = tileMaterials[tileSeed % tileMaterials.length];
    const frontTile = new THREE.Mesh(tileGeometry, material);
    frontTile.rotation.x = -.52;
    frontTile.position.set(xTile, 5.71, 1.39);
    const backTile = new THREE.Mesh(tileGeometry, material);
    backTile.rotation.x = .52;
    backTile.position.set(xTile, 5.71, -1.39);
    group.add(frontTile, backTile);
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
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: .92 });
  const awningMaterial = new THREE.MeshStandardMaterial({ color: 0xb83f36, roughness: .9 });
  weatherBuildingSurfaces.push(
    makeWeatherSurfaceState(bodyMaterial, { roughnessDrop: .06, minRoughness: .74, darkening: .04 }),
    makeWeatherSurfaceState(awningMaterial, { roughnessDrop: .11, minRoughness: .66, darkening: .035 }),
  );
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.8, 5.8), bodyMaterial);
  body.position.y = 1.9;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(10.1, .35, 1.8), awningMaterial);
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

  // A short tiled forecourt joins the shop entrance to the roadside footpath.
  const frontageMaterial = new THREE.MeshStandardMaterial({ color: 0xa7a396, roughness: .92 });
  weatherBuildingSurfaces.push(makeWeatherSurfaceState(frontageMaterial, {
    roughnessDrop: .12,
    minRoughness: .62,
    darkening: .025,
  }));
  const frontage = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.45), frontageMaterial);
  frontage.rotation.x = -Math.PI / 2;
  frontage.position.set(0, .025, 4.13);
  frontage.receiveShadow = true;
  group.add(frontage);
  const paverJointMaterial = new THREE.MeshStandardMaterial({ color: 0x858277, roughness: .98 });
  [-2.2, 0, 2.2].forEach(jointX => {
    const joint = new THREE.Mesh(new THREE.PlaneGeometry(.035, 2.34), paverJointMaterial);
    joint.rotation.x = -Math.PI / 2;
    joint.position.set(jointX, .028, 4.13);
    group.add(joint);
  });

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

function addTree(scene, x, z, scale, fruitSpecies = null) {
  addCircleCollider(x, z, Math.max(.42, .58 * scale), 'tree');
  const group = new THREE.Group();
  const random = visualRandom(Math.abs(Math.floor(x * 137 + z * 211 + scale * 1000)) + 9041);
  const barkColors = [0x65442e, 0x72503a, 0x5c3d2b];
  const foliageColors = fruitSpecies === 'jackfruit'
    ? [0x1c582c, 0x246833, 0x2d7238, 0x397c3c]
    : [0x1d5e2e, 0x28723a, 0x347f3d, 0x468b46];

  const trunkMat = new THREE.MeshStandardMaterial({
    color: barkColors[Math.floor(random() * barkColors.length)],
    roughness: 1,
    bumpMap: getTreeBarkBumpMap(),
    bumpScale: .022,
  });
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x6d4934, roughness: 1, bumpMap: getTreeBarkBumpMap(), bumpScale: .015 });
  const canopyTexture = getTreeCanopyTexture();
  const foliageMats = foliageColors.map(color => new THREE.MeshStandardMaterial({ color, map: canopyTexture, roughness: .96 }));

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

  const canopyGeometry = new THREE.SphereGeometry(1, 12, 8);
  const foliageNodes = [];
  const nearFoliage = new THREE.Group();
  const farFoliage = new THREE.Group();
  nearFoliage.name = 'tree-foliage-near';
  farFoliage.name = 'tree-foliage-far';
  farFoliage.visible = false;
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
  const isJackfruit = fruitSpecies === 'jackfruit';
  clusters.forEach(([lx, ly, lz, sx, sy, sz], index) => {
    const leaves = new THREE.Mesh(canopyGeometry, foliageMats[index % foliageMats.length]);
    leaves.position.set(lx * (isJackfruit ? .84 : 1) + (random() - .5) * .18,
      ly + (isJackfruit ? .20 : 0) + (random() - .5) * .12,
      lz * (isJackfruit ? .84 : 1) + (random() - .5) * .18);
    leaves.scale.set(sx * (isJackfruit ? .89 : 1) * (.93 + random() * .12),
      sy * (isJackfruit ? 1.18 : 1) * (.94 + random() * .10),
      sz * (isJackfruit ? .88 : 1) * (.93 + random() * .12));
    leaves.rotation.y = random() * Math.PI;
    leaves.userData.windBaseX = leaves.rotation.x;
    leaves.userData.windBaseZ = leaves.rotation.z;
    leaves.castShadow = true;
    foliageNodes.push(leaves);
    nearFoliage.add(leaves);
  });

  [
    [0, 5.45, 0, 2.18, 1.48, 1.82],
    [-.92, 5.88, -.12, 1.38, 1.02, 1.22],
    [.92, 5.84, .16, 1.40, 1.04, 1.24],
  ].forEach(([lx, ly, lz, sx, sy, sz], index) => {
    const canopy = new THREE.Mesh(canopyGeometry, foliageMats[(index * 2) % foliageMats.length]);
    canopy.position.set(lx * (isJackfruit ? .84 : 1), ly + (isJackfruit ? .20 : 0), lz * (isJackfruit ? .84 : 1));
    canopy.scale.set(sx * (isJackfruit ? .89 : 1), sy * (isJackfruit ? 1.18 : 1), sz * (isJackfruit ? .88 : 1));
    canopy.castShadow = false;
    canopy.receiveShadow = false;
    farFoliage.add(canopy);
  });
  group.add(nearFoliage, farFoliage);

  if (fruitSpecies) addFruitClusters(nearFoliage, fruitSpecies);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'tree',
    root: group,
    nodes: foliageNodes,
    nearGroup: nearFoliage,
    farGroup: farFoliage,
    usingFar: false,
    x,
    z,
    phase: windVegetation.length * .93 + x * .045 - z * .03,
  });
  scene.add(group);
}

function createPalmFrondGeometry(frondCount = 10, segments = 9) {
  const cacheKey = `${frondCount}:${segments}`;
  const cachedGeometry = palmFrondGeometryCache.get(cacheKey);
  if (cachedGeometry) return cachedGeometry;

  const vertices = [];
  const stems = [];

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
  const geometry = { leafGeometry, stemGeometry };
  palmFrondGeometryCache.set(cacheKey, geometry);
  return geometry;
}

function addArecaClump(scene, x, z, scale = 1, yaw = 0) {
  addCircleCollider(x, z, Math.max(.34, .42 * scale), 'areca');
  const group = new THREE.Group();
  const random = visualRandom(Math.abs(Math.floor(x * 163 + z * 229 + scale * 1000)) + 1471);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: random() > .5 ? 0x73593a : 0x806345,
    roughness: .98,
  });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: random() > .5 ? 0x38763b : 0x438244,
    roughness: .86,
    side: THREE.DoubleSide,
  });
  const stemMaterial = new THREE.LineBasicMaterial({ color: 0x3b6734, transparent: true, opacity: .88 });
  const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xb96a37, roughness: .78 });
  const trunkGeometry = new THREE.CylinderGeometry(.075, .13, 5.45, 8, 7);
  const nearGeometry = createPalmFrondGeometry(7, 6);
  const farGeometry = createPalmFrondGeometry(5, 3);
  const nearGroup = new THREE.Group();
  const farGroup = new THREE.Group();
  nearGroup.name = 'areca-fronds-near';
  farGroup.name = 'areca-fronds-far';
  farGroup.visible = false;
  const nearNodes = [];
  const farNodes = [];
  const positions = [
    [-.30, .04, .06],
    [.02, -.08, -.12],
    [.31, .04, .10],
  ];

  positions.forEach(([offsetX, offsetZ], index) => {
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(offsetX, 2.725, offsetZ);
    trunk.rotation.z = (random() - .5) * .035;
    group.add(trunk);

    const rotation = random() * .18;
    const fronds = new THREE.Mesh(nearGeometry.leafGeometry, leafMaterial);
    const stems = new THREE.LineSegments(nearGeometry.stemGeometry, stemMaterial);
    const farFronds = new THREE.Mesh(farGeometry.leafGeometry, leafMaterial);
    const farStems = new THREE.LineSegments(farGeometry.stemGeometry, stemMaterial);
    for (const node of [fronds, stems, farFronds, farStems]) {
      node.position.set(offsetX, 1.84 + (index % 2) * .06, offsetZ);
      node.scale.setScalar(.52 + (index % 2) * .025);
      node.rotation.y = rotation;
      node.userData.windBaseX = node.rotation.x;
      node.userData.windBaseZ = node.rotation.z;
    }
    fronds.castShadow = true;
    stems.castShadow = true;
    farFronds.castShadow = false;
    farStems.castShadow = false;
    nearNodes.push(fronds, stems);
    farNodes.push(farFronds, farStems);
    nearGroup.add(fronds, stems);
    farGroup.add(farFronds, farStems);
  });

  const fruitGeometry = new THREE.SphereGeometry(.052, 7, 5);
  const fruits = new THREE.InstancedMesh(fruitGeometry, fruitMaterial, 12);
  const fruitTransform = new THREE.Object3D();
  let fruitIndex = 0;
  positions.forEach(([offsetX, offsetZ], index) => {
    for (let fruit = 0; fruit < 4; fruit++) {
      const angle = fruit / 4 * Math.PI * 2 + index * .38;
      fruitTransform.position.set(
        offsetX + Math.cos(angle) * .12,
        5.12 + (fruit % 2) * .07,
        offsetZ + Math.sin(angle) * .12
      );
      fruitTransform.scale.setScalar(.82 + random() * .30);
      fruitTransform.updateMatrix();
      fruits.setMatrixAt(fruitIndex++, fruitTransform.matrix);
    }
  });
  fruits.instanceMatrix.needsUpdate = true;
  nearGroup.add(fruits);
  group.add(nearGroup, farGroup);
  group.position.set(x, 0, z);
  group.rotation.y = yaw;
  group.scale.setScalar(scale);
  windVegetation.push({
    kind: 'areca',
    root: group,
    nodes: nearNodes,
    farNodes,
    nearGroup,
    farGroup,
    usingFar: false,
    x,
    z,
    phase: windVegetation.length * .67 + x * .06 + z * .03,
  });
  scene.add(group);
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

  const scarCount = 22;
  const trunkScars = new THREE.InstancedMesh(palmTrunkScarGeometry, palmTrunkScarMaterial, scarCount);
  const scarTransform = new THREE.Object3D();
  for (let scar = 0; scar < scarCount; scar++) {
    const y = .42 + scar * .29;
    const radius = .33 - .19 * (y / 7.1);
    scarTransform.position.set(.28 - Math.sin(trunk.rotation.z) * (y - 3.55), y, 0);
    scarTransform.rotation.set(Math.PI / 2, 0, trunk.rotation.z);
    scarTransform.scale.set(radius, radius, 1);
    scarTransform.updateMatrix();
    trunkScars.setMatrixAt(scar, scarTransform.matrix);
  }
  trunkScars.instanceMatrix.needsUpdate = true;
  trunkScars.castShadow = false;
  trunkScars.receiveShadow = true;
  palm.add(trunkScars);

  const crown = new THREE.Mesh(new THREE.SphereGeometry(.34, 9, 7), crownMaterial);
  crown.scale.set(1.05, .72, 1);
  crown.position.set(.31, 6.92, 0);
  palm.add(crown);

  const nearGroup = new THREE.Group();
  const farGroup = new THREE.Group();
  nearGroup.name = 'palm-fronds-near';
  farGroup.name = 'palm-fronds-far';
  farGroup.visible = false;
  const { leafGeometry, stemGeometry } = createPalmFrondGeometry(10, 9);
  const farGeometry = createPalmFrondGeometry(6, 4);
  const fronds = new THREE.Mesh(leafGeometry, leafMaterial);
  const stems = new THREE.LineSegments(stemGeometry, stemMaterial);
  const farFronds = new THREE.Mesh(farGeometry.leafGeometry, leafMaterial);
  const farStems = new THREE.LineSegments(farGeometry.stemGeometry, stemMaterial);
  fronds.rotation.y = random() * .14;
  stems.rotation.y = fronds.rotation.y;
  farFronds.rotation.y = fronds.rotation.y;
  farStems.rotation.y = fronds.rotation.y;
  fronds.userData.windBaseX = fronds.rotation.x;
  fronds.userData.windBaseZ = fronds.rotation.z;
  stems.userData.windBaseX = stems.rotation.x;
  stems.userData.windBaseZ = stems.rotation.z;
  farFronds.userData.windBaseX = farFronds.rotation.x;
  farFronds.userData.windBaseZ = farFronds.rotation.z;
  farStems.userData.windBaseX = farStems.rotation.x;
  farStems.userData.windBaseZ = farStems.rotation.z;
  fronds.castShadow = true;
  stems.castShadow = true;
  farFronds.castShadow = false;
  farStems.castShadow = false;
  nearGroup.add(fronds, stems);
  farGroup.add(farFronds, farStems);
  palm.add(nearGroup, farGroup);

  const coconuts = new THREE.InstancedMesh(palmCoconutGeometry, palmCoconutMaterial, 5);
  const coconutStems = new THREE.InstancedMesh(palmCoconutStemGeometry, palmCoconutStemMaterial, 5);
  const coconutTransform = new THREE.Object3D();
  const stemTransform = new THREE.Object3D();
  const coconutColors = [0x718b49, 0x84934b, 0x9c884b, 0x657d42];
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2 + (random() - .5) * .16;
    const radius = .20 + random() * .07;
    const nutScale = .84 + random() * .26;
    const nutX = .31 + Math.cos(angle) * radius;
    const nutY = 6.70 + (i % 2) * .075;
    const nutZ = Math.sin(angle) * radius;
    coconutTransform.position.set(nutX, nutY, nutZ);
    coconutTransform.rotation.set(Math.sin(angle) * .25, 0, -Math.cos(angle) * .25);
    coconutTransform.scale.set(.86 * nutScale, 1.18 * nutScale, .86 * nutScale);
    coconutTransform.updateMatrix();
    coconuts.setMatrixAt(i, coconutTransform.matrix);
    coconuts.setColorAt(i, new THREE.Color(coconutColors[Math.floor(random() * coconutColors.length)]));

    stemTransform.position.set(.31 + Math.cos(angle) * radius * .43, 6.84, Math.sin(angle) * radius * .43);
    stemTransform.rotation.set(Math.sin(angle) * .30, 0, -Math.cos(angle) * .30);
    stemTransform.scale.set(1, .78 + random() * .32, 1);
    stemTransform.updateMatrix();
    coconutStems.setMatrixAt(i, stemTransform.matrix);
  }
  coconuts.instanceMatrix.needsUpdate = true;
  if (coconuts.instanceColor) coconuts.instanceColor.needsUpdate = true;
  coconutStems.instanceMatrix.needsUpdate = true;
  nearGroup.add(coconuts, coconutStems);

  palm.position.set(x, 0, z);
  palm.scale.setScalar(scale);
  windVegetation.push({
    kind: 'palm',
    root: palm,
    fronds,
    stems,
    farFronds,
    farStems,
    nearGroup,
    farGroup,
    usingFar: false,
    nodes: [fronds, stems],
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
  const npcName = options.name || names[index % names.length];
  let appearanceSeed = Number.isFinite(Number(options.appearanceSeed))
    ? Number(options.appearanceSeed) >>> 0
    : 2166136261;
  if (!Number.isFinite(Number(options.appearanceSeed))) {
    for (const character of `${npcName}|${Math.round(x * 10)}|${Math.round(z * 10)}|${index}`) {
      appearanceSeed = Math.imul(appearanceSeed ^ character.charCodeAt(0), 16777619);
    }
  }
  const random = visualRandom(appearanceSeed);
  const femaleNames = ['Anu', 'Meera', 'Nisha', 'Asha', 'Liya', 'Sreeja'];
  const maleNames = ['Vivek', 'Arun', 'Riyas', 'Manu', 'Nabeel', 'Jose'];
  const namedGender = femaleNames.includes(npcName) ? 'female' : maleNames.includes(npcName) ? 'male' : null;
  const gender = ['male', 'female'].includes(options.gender)
    ? options.gender
    : namedGender || (random() < .5 ? 'female' : 'male');
  const styles = [
    { shirt: 0xa95762, trousers: 0x2e3447, shoes: 0x372b26, accent: 0xd8aa55 },
    { shirt: 0x557a54, trousers: 0x2a3440, shoes: 0x292522, accent: 0xb88d4c },
    { shirt: 0x4f728f, trousers: 0x303548, shoes: 0x3b2c24, accent: 0xc98f5a },
    { shirt: 0x875d45, trousers: 0x293139, shoes: 0x292420, accent: 0xd0b26a },
    { shirt: 0xd2b68a, trousers: 0x38413b, shoes: 0x44362c, accent: 0x8e6243 },
    { shirt: 0x704c70, trousers: 0x333748, shoes: 0x302825, accent: 0xc9a968 },
    { shirt: 0x3f7d83, trousers: 0x4a3f36, shoes: 0x342923, accent: 0xe2c17a },
    { shirt: 0xb67a43, trousers: 0x343b42, shoes: 0x2d2926, accent: 0xeee0b5 },
    { shirt: 0x737e9b, trousers: 0x4b4148, shoes: 0x3b312a, accent: 0xc6a06c },
    { shirt: 0x9d4f43, trousers: 0x3a3d35, shoes: 0x312722, accent: 0xd9bd7a },
  ];
  const skinTones = [0x75462f, 0x855138, 0x925b40, 0xa16a4b, 0xaf7654, 0xbc825f, 0xc18b69];
  const hairTones = [0x141211, 0x1b1512, 0x241a16, 0x302119];
  const style = styles[Math.floor(random() * styles.length)];
  const skin = skinTones[Math.floor(random() * skinTones.length)];
  const hair = hairTones[Math.floor(random() * hairTones.length)];
  const bodyBuilds = ['slim', 'average', 'average', 'broad'];
  const bodyBuild = bodyBuilds[Math.floor(random() * bodyBuilds.length)];
  const height = .94 + random() * .12;
  const ambientIdlePhone = random() < .24;
  const ambientIdlePhase = random() * 24;
  const ambientIdlePeriod = 33 + random() * 15;
  const npcScale = .9 * scale + .2;
  const villager = new THREE.Group();
  const human = createHuman({
    gender,
    ...style,
    skin,
    hair,
    outfit: 'auto',
    bodyBuild,
    height,
    eyeShape: random() < .18 ? 'round' : 'almond',
    styleSeed: Math.floor(random() * 10000),
  });
  human.scale.multiplyScalar(npcScale);
  const umbrella = createNpcUmbrella(index);
  umbrella.scale.setScalar(npcScale);
  villager.add(human, umbrella);
  attachContactShadow(villager, .46, .31, .17);
  applyDynamicHighQuality(villager);
  villager.position.set(x, 0, z);
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
    ambientIdlePhone,
    ambientIdlePhase,
    ambientIdlePeriod,
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
