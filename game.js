import * as THREE from './vendor/three.module.js';
import { initSocial, api } from './social.js?v=118.0';
import { createAtmosphere } from './environment.js?v=115.0';
import { KERALA_DISTRICT_ATLAS } from './district-atlas.js?v=114.0';
import { GENERIC_DISTRICT_FRUIT_TREES, GENERIC_DISTRICT_OFFICE, genericDistrictFuelPosition, genericDistrictRoads, ernakulamDistrictRoads, planRoadsideDrainSegments, districtFacadePalette } from './district-layout.js?v=117.0';
import { createKeralaRoofTiles } from './roof-tiles.js?v=115.0';

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
const HOME_INTERIOR_BED = Object.freeze({ x: 3.2, z: -4.2 });
const HOME_INTERIOR_BED_EDGE = Object.freeze({ x: 3.2, z: -1.5, rotation: Math.PI });
let homeInteriorMode = false;
let homeInteriorGroup = null;
let homeExteriorVisibility = null;
let homeExteriorLook = null;
let homeInteriorCameraReset = false;
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
let cameraRef = null;
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

function createPrivateHomeInterior() {
  const room = new THREE.Group();
  room.name = 'kerala-private-home-interior';
  room.visible = false;
  const mats = {
    floor: new THREE.MeshStandardMaterial({ color: 0xb1a18a, roughness: .87 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe2d5be, roughness: .94 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x9b6844, roughness: .78 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x68452f, roughness: .74 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x906746, roughness: .79 }),
    bedding: new THREE.MeshStandardMaterial({ color: 0x9db7ab, roughness: .95 }),
    sheet: new THREE.MeshStandardMaterial({ color: 0xe8dfca, roughness: .94 }),
    pillow: new THREE.MeshStandardMaterial({ color: 0xf0eadb, roughness: .98 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x37494a, roughness: .7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8ec2c3, roughness: .3, metalness: .04, transparent: true, opacity: .56 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc18d43, roughness: .38, metalness: .42 }),
    plant: new THREE.MeshStandardMaterial({ color: 0x2e6747, roughness: .9 }),
  };
  const addBox = (width, height, depth, material, x, y, z, rotationY = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    room.add(mesh);
    return mesh;
  };
  const addSphere = (radius, material, x, y, z, scale = 1) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), material);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    room.add(mesh);
    return mesh;
  };

  addBox(18, .22, 18, mats.floor, 0, -.12, 0);
  // Cream plaster walls with a central front doorway and a simple Kerala tiled roof line.
  addBox(.22, 3.25, 18, mats.wall, -9, 1.62, 0);
  addBox(.22, 3.25, 18, mats.wall, 9, 1.62, 0);
  addBox(18, 3.25, .22, mats.wall, 0, 1.62, -9);
  addBox(6.9, 3.25, .22, mats.wall, -5.55, 1.62, 9);
  addBox(6.9, 3.25, .22, mats.wall, 5.55, 1.62, 9);
  addBox(4.2, .55, .22, mats.wall, 0, 2.98, 9);
  addBox(18.3, .17, .28, mats.trim, 0, 3.28, 0);
  addBox(.28, .17, 18.3, mats.trim, -9, 3.28, 0);
  addBox(.28, .17, 18.3, mats.trim, 9, 3.28, 0);
  addBox(18.3, .14, .28, mats.trim, 0, 3.28, -9);
  // Door surround and wooden sill mark the route back to the outdoor world.
  addBox(2.9, .14, .34, mats.wood, 0, .08, 8.82);
  addBox(.13, 2.45, .16, mats.woodLight, -1.38, 1.25, 8.78);
  addBox(.13, 2.45, .16, mats.woodLight, 1.38, 1.25, 8.78);
  addBox(2.9, .13, .16, mats.woodLight, 0, 2.47, 8.78);
  // Two barred side windows with wooden frames and a translucent blue-green pane.
  for (const x of [-9.025, 9.025]) {
    const face = x < 0 ? -.012 : .012;
    addBox(.045, 1.18, 2.2, mats.woodLight, x, 1.92, -.45);
    addBox(.055, .92, 1.88, mats.glass, x + face, 1.92, -.45);
    addBox(.07, .065, 2.04, mats.trim, x + face * 2, 1.92, -.45);
    addBox(.065, 1.0, .06, mats.trim, x + face * 2, 1.92, -.45);
    addBox(.065, .07, 2.26, mats.trim, x + face * 2, 2.52, -.45);
    addBox(.065, .07, 2.26, mats.trim, x + face * 2, 1.32, -.45);
  }
  // Low, detailed bed with raised headboard, mattress, folded sheet and pillow.
  addBox(2.35, .20, 4.55, mats.wood, HOME_INTERIOR_BED.x, .34, HOME_INTERIOR_BED.z);
  addBox(2.13, .75, .18, mats.woodLight, HOME_INTERIOR_BED.x, .83, -6.5);
  addBox(.12, .74, .14, mats.wood, HOME_INTERIOR_BED.x - 1.05, .76, -2.08);
  addBox(.12, .74, .14, mats.wood, HOME_INTERIOR_BED.x + 1.05, .76, -2.08);
  addBox(2.08, .34, 4.20, mats.bedding, HOME_INTERIOR_BED.x, .69, HOME_INTERIOR_BED.z);
  addBox(2.10, .075, 2.75, mats.sheet, HOME_INTERIOR_BED.x, .90, -3.30);
  addBox(1.45, .23, .76, mats.pillow, HOME_INTERIOR_BED.x, .96, -4.72);
  addBox(2.12, .10, 1.10, mats.sheet, HOME_INTERIOR_BED.x, .91, -5.04);
  // Compact bedside table, lamp and flower pot.
  addBox(.86, .78, .78, mats.woodLight, 1.18, .39, -7.1);
  addBox(.96, .10, .88, mats.wood, 1.18, .82, -7.1);
  addBox(.17, .36, .17, mats.brass, 1.18, 1.04, -7.1);
  addBox(.52, .12, .40, new THREE.MeshStandardMaterial({ color: 0xf1cd83, emissive: 0xb27b2f, emissiveIntensity: .18, roughness: .7 }), 1.18, 1.27, -7.1);
  const lampLight = new THREE.PointLight(0xffd69a, .52, 7, 2);
  lampLight.position.set(1.18, 1.42, -7.1);
  room.add(lampLight);
  // Cupboard and dressing shelf on the opposite side of the room.
  addBox(1.8, 2.38, .9, mats.wood, -6.35, 1.19, -5.95);
  addBox(.08, 2.22, .06, mats.woodLight, -6.35, 1.19, -5.46);
  addBox(.045, .20, .12, mats.brass, -6.18, 1.20, -5.40);
  addBox(.045, .20, .12, mats.brass, -6.52, 1.20, -5.40);
  // A small cane chair, living-room bench, rug and a potted areca plant.
  addBox(1.7, .16, 1.5, mats.woodLight, -5.75, .54, 2.25);
  addBox(1.68, .95, .16, mats.wood, -5.75, 1.02, 2.92);
  for (const x of [-6.42, -5.08]) for (const z of [1.72, 2.78]) addBox(.12, .55, .12, mats.wood, x, .28, z);
  addBox(2.8, .035, 2.2, mats.bedding, .05, .012, 3.25);
  addBox(.78, .38, .78, mats.dark, 7.35, .19, 6.15);
  for (const z of [5.85, 6.45]) for (const x of [7.05, 7.65]) addBox(.08, .38, .08, mats.wood, x, .19, z);
  for (let leaf = 0; leaf < 5; leaf++) {
    const frond = addSphere(.62, mats.plant, 7.35 + Math.cos(leaf * 1.25) * .32, .86 + leaf % 2 * .18, 6.15 + Math.sin(leaf * 1.25) * .32, .35);
    frond.scale.set(.35, 1.05, .25);
    frond.rotation.z = (leaf - 2) * .20;
  }
  const warm = new THREE.HemisphereLight(0xffedd5, 0x765b40, 1.05);
  room.add(warm);
  const ceilingLight = new THREE.PointLight(0xffe2b4, 1.1, 20, 1.5);
  ceilingLight.position.set(0, 2.9, .3);
  room.add(ceilingLight);
  return applyDynamicHighQuality(room);
}

function setHomeInteriorMode(enabled, detail = {}) {
  if (!sceneRef || !playerRef || !homeInteriorGroup || homeInteriorMode === enabled) return;
  if (enabled) {
    homeExteriorVisibility = new Map();
    for (const object of sceneRef.children) {
      homeExteriorVisibility.set(object, object.visible);
      if (object !== playerRef && object !== homeInteriorGroup && !object.isLight) object.visible = false;
    }
    homeExteriorLook = { background: sceneRef.background?.clone?.() || sceneRef.background, fog: sceneRef.fog };
    sceneRef.background = new THREE.Color(0xc4ad8b);
    sceneRef.fog = null;
    homeInteriorGroup.visible = true;
    homeInteriorMode = true;
    homeInteriorCameraReset = true;
    const position = detail.position || {};
    playerRef.position.set(Number(position.x) || 0, 0, Number(position.z) || 6.2);
    playerRef.rotation.y = Number.isFinite(Number(position.rotation)) ? Number(position.rotation) : 0;
    playerRef.userData.homeSleepUntil = 0;
    playerRef.userData.homeSleepBlend = 0;
    playerRef.userData.homeSleepRootY = 0;
    walkVelocity.set(0, 0, 0);
    targetWalkVelocity.set(0, 0, 0);
    jumpHeight = 0;
    jumpVelocity = 0;
    playerRef.userData.resetWalkSafe = true;
    window.dispatchEvent(new CustomEvent('kerala-home-interior-state', { detail: { open: true } }));
    document.body.classList.add('home-interior');
    showToast('Welcome home · walk to the bed or choose Exit Home');
  } else {
    homeInteriorGroup.visible = false;
    for (const [object, visible] of homeExteriorVisibility || []) {
      if (object.parent === sceneRef) object.visible = visible;
    }
    homeExteriorVisibility = null;
    if (homeExteriorLook) {
      sceneRef.background = homeExteriorLook.background;
      sceneRef.fog = homeExteriorLook.fog;
    }
    homeExteriorLook = null;
    homeInteriorMode = false;
    const position = detail.position || {};
    playerRef.position.set(Number(position.x) || 0, 0, Number(position.z) || 0);
    playerRef.rotation.y = Number.isFinite(Number(position.rotation)) ? Number(position.rotation) : 0;
    playerRef.userData.homeSleepUntil = 0;
    playerRef.userData.homeSleepBlend = 0;
    playerRef.userData.homeSleepRootY = 0;
    const avatar = playerRef.userData.avatar;
    if (avatar) { avatar.position.y = .04; avatar.rotation.x = 0; }
    playerRef.position.y = 0;
    homeInteriorCameraReset = true;
    document.body.classList.remove('home-interior');
    playerRef.userData.resetWalkSafe = true;
    window.dispatchEvent(new CustomEvent('kerala-home-interior-state', { detail: { open: false } }));
    updateMapPlayer(playerRef);
  }
  lastMovementSend = 0;
  lastMovementMoving = false;
  updateWorldInteract();
}

window.addEventListener('kerala-home-interior-enter', event => setHomeInteriorMode(true, event.detail || {}));
window.addEventListener('kerala-home-interior-exit', event => setHomeInteriorMode(false, event.detail || {}));
window.addEventListener('kerala-home-bed-sleep', event => {
  if (!homeInteriorMode || !playerRef) return;
  const position = event.detail?.position || HOME_INTERIOR_BED_EDGE;
  playerRef.position.set(Number(position.x) || HOME_INTERIOR_BED_EDGE.x, 0, Number(position.z) || HOME_INTERIOR_BED_EDGE.z);
  playerRef.rotation.y = Number.isFinite(Number(position.rotation)) ? Number(position.rotation) : HOME_INTERIOR_BED_EDGE.rotation;
  playerRef.userData.homeSleepReturn = { x: playerRef.position.x, z: playerRef.position.z, rotation: playerRef.rotation.y };
  playerRef.userData.homeSleepUntil = performance.now() + 4200;
  playerRef.userData.homeSleepRootY = .88;
  playerRef.userData.homeSleepBlend = Number(playerRef.userData.homeSleepBlend) || 0;
  walkVelocity.set(0, 0, 0);
  targetWalkVelocity.set(0, 0, 0);
  jumpHeight = 0;
  jumpVelocity = 0;
  showToast('Resting in bed…');
});

function keepHomeInteriorPrivate() {
  if (!homeInteriorMode || !homeExteriorVisibility || !sceneRef) return;
  for (const object of sceneRef.children) {
    if (object === playerRef || object === homeInteriorGroup) continue;
    if (!homeExteriorVisibility.has(object)) homeExteriorVisibility.set(object, object.visible);
    object.visible = false;
  }
}

function animatePlayerHomeSleep(player, delta) {
  if (!player) return;
  const avatar = player.userData.avatar;
  if (!avatar) return;
  const now = performance.now();
  const active = homeInteriorMode && now < Number(player.userData.homeSleepUntil || 0);
  const previous = THREE.MathUtils.clamp(Number(player.userData.homeSleepBlend) || 0, 0, 1);
  const target = active ? 1 : 0;
  const blend = previous + (target - previous) * (1 - Math.exp(-Math.max(0, delta) * (active ? 4.5 : 5.5)));
  player.userData.homeSleepBlend = blend;
  if (active) {
    player.position.set(HOME_INTERIOR_BED.x, Number(player.userData.homeSleepRootY) || .88, -2.12);
    player.rotation.y = 0;
  }
  avatar.rotation.x = -Math.PI * .5 * blend;
  avatar.position.y = .04 * (1 - blend);
  const parts = avatar.userData.parts;
  if (blend > .01 && parts) {
    if (parts.leftLeg) parts.leftLeg.rotation.x += .045 * blend;
    if (parts.rightLeg) parts.rightLeg.rotation.x += .045 * blend;
    if (parts.leftArm) parts.leftArm.rotation.z -= .045 * blend;
    if (parts.rightArm) parts.rightArm.rotation.z += .045 * blend;
    if (parts.head) parts.head.rotation.x -= .035 * blend;
  }
  const shadow = player.userData.contactShadow || player.userData.shadow;
  if (shadow) shadow.visible = blend < .15;
  if (!active && blend < .015 && previous >= .015) {
    const restore = player.userData.homeSleepReturn || HOME_INTERIOR_BED_EDGE;
    player.position.set(restore.x, 0, restore.z);
    player.rotation.y = Number(restore.rotation) || HOME_INTERIOR_BED_EDGE.rotation;
    player.userData.homeSleepUntil = 0;
    player.userData.homeSleepReturn = null;
    avatar.rotation.x = 0;
    avatar.position.y = .04;
    if (shadow) shadow.visible = true;
    player.userData.resetWalkSafe = true;
    lastMovementSend = 0;
  }
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
  if (homeInteriorMode) {
    const resting = Number(playerRef.userData.homeSleepUntil || 0) > performance.now()
      || Number(playerRef.userData.homeSleepBlend || 0) > .08;
    const bedDistance = Math.hypot(playerRef.position.x - HOME_INTERIOR_BED.x, playerRef.position.z - HOME_INTERIOR_BED.z);
    worldInteract.hidden = false;
    if (resting) {
      worldInteract.disabled = true;
      worldInteract.dataset.mode = 'home-resting';
      worldInteract.textContent = 'RESTING IN BED…';
    } else if (bedDistance <= 3.0) {
      worldInteract.dataset.mode = 'home-sleep';
      worldInteract.textContent = `SLEEP IN BED · ENERGY ${Math.round(Number(needsSnapshot?.energy ?? 100))}%`;
    } else {
      worldInteract.dataset.mode = 'home-exit';
      worldInteract.textContent = 'EXIT HOME';
    }
    return;
  }
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
    const sameHomeDistrict = !home.district || home.district === currentWorldDistrictName();
    if (sameHomeDistrict && distance <= Number(home.radius || 5.2) + .3) {
      worldInteract.hidden = false;
      worldInteract.dataset.mode = homeSnapshot.house?.built ? 'home-enter' : 'home-build';
      worldInteract.textContent = homeSnapshot.house?.built
        ? 'ENTER YOUR HOME'
        : 'BUILD MY HOME · FREE';
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
        worldInteract.disldSignMesh({
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
    context.strokeStyle = `rgba(${shade},${shade},$d === 'bus' ? 5.4 : kind === 'auto' ? 3.3 : kind === 'bike' ? 2.8 : 4.2;
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

function addPhotoHouse(scene, x, z, district = 'Kottayam') {
  const facade = districtFacadePalette(district, x * 31 + z * 47);
  addHouse(scene, x, z, facade.houseWall, facade.roof, facade);
}


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

function addHouse(scene, x, z, wallColor, roofColor, facade = {}) {
  addBoxCollider(x, z, 4.45, 3.95, 'house');
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: .98 });
  weatherBuildingSurfaces.push(
    makeWeatherSurfaceState(wallMat, { roughnessDrop: .06, minRoughness: .72, darkening: .04 }),
    makeWeatherSurfaceState(roofMat, { roughnessDrop: .12, minRoughness: .68, darkening: .03 }),
  );
  const darkWood = new THREE.MeshStandardMaterial({ color: facade.wood ?? 0x573a2b, roughness: .92 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: facade.glass ?? 0x6fa4b8,
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
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(9.7, .22, .32), new THREE.MeshStandardMaterial({ color: facade.roof ?? 0x713a2e, roughness: 1 }));
  ridge.position.y = 6.75;
  group.add(roofA, roofB, ridge);
  group.add(...createKeralaRoofTiles(THREE, x, z));

  const skirting = new THREE.Mesh(
    new THREE.BoxGeometry(8.75, .42, 7.6),
    new THREE.MeshStandardMaterial({ color: facade.skirting ?? 0x8c7d69, roughness: 1 })
  );
  skirting.position.y = .62;
  const facadeBand = new THREE.Mesh(
    new THREE.BoxGeometry(8.25, .16, .11),
    new THREE.MeshStandardMaterial({ color: facade.band ?? 0xd9cbb5, roughness: .92 })
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
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.82, .11, .28), new THREE.MeshStandardMaterial({ color: facade.band ?? 0xd7cbb5, roughness: .95 }));
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

function addShop(scene, x, z, shopName = 'VILLAGE STORES', subtitle = 'ചായ · SNACKS · GROCERIES', facade = {}) {
  addBoxCollider(x, z, 4.8, 3.0, 'shop');
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: facade.shopWall ?? 0xf1e7d2, roughness: .92 });
  const awningMaterial = new THREE.MeshStandardMaterial({ color: facade.awning ?? 0xb83f36, roughness: .9 });
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
  const shutterMat = new THREE.MeshStandardMaterial({ color: facade.shutter ?? 0x6e5845, roughness: .96, metalness: .08 });
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.05, .12), shutterMat);
  shutter.position.set(0, 1.82, 2.96);
  group.add(body, awning, sign, signText, shutter);

  const trimMat = new THREE.MeshStandardMaterial({ color: facade.shopTrim ?? 0x3d4547, roughness: .74, metalness: .22 });
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

