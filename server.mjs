import http from 'node:http';
import { randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognitionSummary } from './recognition.mjs';
import { categoryLeaderboard, leaderboardCategories } from './leaderboards.mjs';

const scrypt = promisify(scryptCallback);
const ROOT = dirname(fileURLToPath(import.meta.url));
const WORLD_LIMIT = 210;
const DISTRICTS = {
  Alappuzha: [-34, -13], Ernakulam: [-26, 6], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44],
};
const DISTRICT_WORLD_ORDER = Object.freeze(['Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram','Palakkad','Thrissur','Ernakulam','Idukki','Alappuzha','Kottayam','Pathanamthitta','Kollam','Thiruvananthapuram']);
const AIRPORT_DISTRICTS = new Set(['Kannur','Kozhikode','Ernakulam','Thiruvananthapuram']);
const GENERIC_WORLD_BOUNDS = Object.freeze({ minX:-110, maxX:110, minZ:-110, maxZ:110 });
const DISTRICT_WORLD_CONFIG = Object.freeze(Object.fromEntries(DISTRICT_WORLD_ORDER.map((district, index) => {
  const generic = {
    district,
    order:index,
    bounds:GENERIC_WORLD_BOUNDS,
    spawn:Object.freeze({ x:12, z:0, rotation:0 }),
    train:Object.freeze({ id:`${district.toLowerCase().replace(/[^a-z]+/g,'-')}-rail`, x:-42, z:-6, radius:7.2, arrivalX:-37, arrivalZ:-6 }),
    airport:AIRPORT_DISTRICTS.has(district) ? Object.freeze({ id:`${district.toLowerCase().replace(/[^a-z]+/g,'-')}-airport`, x:42, z:-28, radius:8.2, arrivalX:36, arrivalZ:-28 }) : null,
  };
  if (district === 'Kottayam') return [district, Object.freeze({ ...generic, bounds:Object.freeze({ minX:-110,maxX:110,minZ:-110,maxZ:110 }), spawn:Object.freeze({ x:19,z:-23,rotation:0 }), train:Object.freeze({ id:'kottayam-rail', x:7,z:-23,radius:7.2,arrivalX:11,arrivalZ:-23 }) })];
  if (district === 'Ernakulam') return [district, Object.freeze({ ...generic, bounds:Object.freeze({ minX:-110,maxX:110,minZ:-110,maxZ:110 }), spawn:Object.freeze({ x:-14,z:6,rotation:0 }), train:Object.freeze({ id:'ernakulam-rail', x:-40,z:-30.5,radius:6.6,arrivalX:-34,arrivalZ:-19.5 }), airport:Object.freeze({ id:'ernakulam-airport', x:38,z:36,radius:8.2,arrivalX:32,arrivalZ:36 }) })];
  return [district, Object.freeze(generic)];
})));
function currentWorldDistrict(user) {
  const district = typeof user?.worldDistrict === 'string' && DISTRICT_WORLD_CONFIG[user.worldDistrict] ? user.worldDistrict : user?.district;
  return DISTRICT_WORLD_CONFIG[district] ? district : 'Kottayam';
}
function districtWorldConfig(userOrDistrict) {
  const district = typeof userOrDistrict === 'string' ? userOrDistrict : currentWorldDistrict(userOrDistrict);
  return DISTRICT_WORLD_CONFIG[district] || DISTRICT_WORLD_CONFIG.Kottayam;
}
function insideDistrictWorld(config, x, z, margin = 0) {
  return Number.isFinite(x) && Number.isFinite(z)
    && x >= config.bounds.minX + margin && x <= config.bounds.maxX - margin
    && z >= config.bounds.minZ + margin && z <= config.bounds.maxZ - margin;
}
function districtTravelFare(fromDistrict, toDistrict, mode = 'train') {
  const from = DISTRICT_WORLD_CONFIG[fromDistrict]?.order ?? 0;
  const to = DISTRICT_WORLD_CONFIG[toDistrict]?.order ?? 0;
  const hops = Math.max(1, Math.abs(from - to));
  return mode === 'flight' ? 140 + hops * 12 : 28 + hops * 5;
}
const DISTRICT_CITY_PROFILES = Object.freeze({
  Kasaragod: Object.freeze({ centre:'Kasaragod Town', market:'Kasaragod Market', cafe:'Bekal Cafe', secondary:'Bekal Road', landmark:'Bekal Fort' }),
  Kannur: Object.freeze({ centre:'Kannur Town', market:'Fort Road Market', cafe:'Payyambalam Cafe', secondary:'Payyambalam', landmark:'St. Angelo Fort' }),
  Wayanad: Object.freeze({ centre:'Kalpetta Town', market:'Kalpetta Market', cafe:'Hill View Cafe', secondary:'Meppadi Road', landmark:'Edakkal Caves' }),
  Kozhikode: Object.freeze({ centre:'Kozhikode City', market:'SM Street Market', cafe:'Beach Road Cafe', secondary:'Beach Road', landmark:'Kozhikode Beach' }),
  Malappuram: Object.freeze({ centre:'Malappuram Town', market:'Malappuram Market', cafe:'Malabar Cafe', secondary:'Kottakkunnu Road', landmark:'Kottakkunnu' }),
  Palakkad: Object.freeze({ centre:'Palakkad Town', market:'Fort Market', cafe:'Fort Gate Cafe', secondary:'Fort Road', landmark:'Palakkad Fort' }),
  Thrissur: Object.freeze({ centre:'Thrissur Round', market:'Sakthan Market', cafe:'Round Cafe', secondary:'Swaraj Round', landmark:'Thekkinkadu Maidan' }),
  Idukki: Object.freeze({ centre:'Painavu Town', market:'Hill Market', cafe:'Dam View Cafe', secondary:'Dam Road', landmark:'Idukki Arch Dam' }),
  Alappuzha: Object.freeze({ centre:'Alappuzha Town', market:'Canal Market', cafe:'Boat Jetty Cafe', secondary:'Canal Road', landmark:'Alappuzha Backwaters' }),
  Pathanamthitta: Object.freeze({ centre:'Pathanamthitta Town', market:'Central Market', cafe:'River View Cafe', secondary:'Konni Road', landmark:'Konni Eco Point' }),
  Kollam: Object.freeze({ centre:'Kollam City', market:'Chinnakada Market', cafe:'Lake View Cafe', secondary:'Ashtamudi Road', landmark:'Ashtamudi Lake' }),
  Thiruvananthapuram: Object.freeze({ centre:'Thiruvananthapuram City', market:'Chalai Market', cafe:'Museum Cafe', secondary:'Kanakakkunnu Road', landmark:'Kanakakkunnu Grounds' }),
});
function districtCityProfile(district) {
  return DISTRICT_CITY_PROFILES[district] || {
    centre:`${district} City Centre`,
    market:`${district} City Market`,
    cafe:`${district} Cafe`,
    secondary:`${district} Town Road`,
    landmark:`${district} Landmark`,
  };
}
function genericDistrictLandmark(userOrDistrict) {
  const district = typeof userOrDistrict === 'string' ? userOrDistrict : currentWorldDistrict(userOrDistrict);
  const profile = DISTRICT_CITY_PROFILES[district];
  return profile ? {
    id:`district-landmark:${district}`,
    label:profile.landmark,
    district,
    x:50,
    z:45,
    radius:8,
  } : null;
}
const LANDMARKS = [['bekal', -7, 60], ['munnar', 42, 26], ['kochi', -26, 6], ['kochi', -10, 23], ['alappuzha', -34, -13], ['kuttanad', 7, -23], ['temple', 13, -57]];
function landmarkDistrictForId(id) {
  if (id === 'bekal') return 'Kasaragod';
  if (id === 'munnar') return 'Idukki';
  if (id === 'kochi') return 'Ernakulam';
  if (id === 'alappuzha') return 'Alappuzha';
  if (id === 'temple') return 'Thiruvananthapuram';
  return 'Kottayam';
}
const REWARDS = { 'open-map': 10, 'walk-50': 25, 'visit-landmark': 50, 'walk-250': 75, 'discover-3': 100, 'walk-500': 150, 'discover-5': 200, social: 35 };
const STARTER_BALANCE = 500;
const STARTER_JOB_REWARD = 250;
const WALLET_LIMIT = 2_000_000_000;
const BANK_LIMIT = 2_000_000_000;
const BANK_TRANSFER_MAX = 100_000;
const SHOP_ITEMS = Object.freeze({
  water: { name: 'Water', price: 15, needs: { thirst: 35, energy: 1 } },
  tea: { name: 'Tea', price: 20, needs: { thirst: 16, energy: 10 } },
  snack: { name: 'Snack', price: 35, needs: { hunger: 22, energy: 5 } },
  meal: { name: 'Kerala Meal', price: 80, needs: { hunger: 48, thirst: 6, energy: 8 } },
});
const WORLD_SHOPS = Object.freeze({
  anugraha: Object.freeze({
    id: 'anugraha', label: 'Anugraha Stores', x: -14.4, z: 10.7, radius: 4.8,
    openHour: 6, closeHour: 21,
    items: Object.freeze(['water', 'tea', 'snack', 'meal']),
  }),
  malabar: Object.freeze({
    id: 'malabar', label: 'Malabar Bakery', x: 14.8, z: 41.2, radius: 4.8,
    openHour: 5.5, closeHour: 20.5,
    items: Object.freeze(['water', 'tea', 'snack']),
  }),
  'town-market': Object.freeze({
    id: 'town-market', label: 'Town Market', x: 31, z: 15, radius: 4.8,
    openHour: 6, closeHour: 21,
    items: Object.freeze(['water', 'tea', 'snack', 'meal']),
  }),
  'ernakulam-market': Object.freeze({
    id: 'ernakulam-market', label: 'Ernakulam City Market', x: 11, z: -7, radius: 5.5,
    openHour: 5.5, closeHour: 22,
    items: Object.freeze(['water', 'tea', 'snack', 'meal']),
  }),
  'broadway-cafe': Object.freeze({
    id: 'broadway-cafe', label: 'Broadway Cafe', x: -12.5, z: 11, radius: 5.0,
    openHour: 5, closeHour: 23,
    items: Object.freeze(['water', 'tea', 'snack', 'meal']),
  }),
});
const WORLD_DAY_LENGTH_MS = 24 * 60 * 1000;
const NPC_RELATIONSHIP_MAX = 100;
const NPC_RELATIONSHIP_COUNT = 40;
const NPC_RELATIONSHIP_COOLDOWN_MS = 20_000;
const NPC_FAVOR_COOLDOWN_MS = 2 * 60_000;
const NPC_FAVOR_EXPIRY_MS = 10 * 60_000;
const NPC_FAVOR_MIN_SCORE = 5;
const COMMUNITY_EVENT_INTERVAL_MS = 6 * 60_000;
const COMMUNITY_EVENT_ACTIVE_MS = 3 * 60_000;
const COMMUNITY_EVENT_HISTORY_LIMIT = 30;
const COMMUNITY_EVENT_CATALOG = Object.freeze([
  Object.freeze({ key:'market', icon:'🛍️', title:'Village Market Hour', description:'Help the local market stay lively and organized.', targetId:'anugraha', action:'Join market activity', cash:55, points:12 }),
  Object.freeze({ key:'football', icon:'⚽', title:'Village Football Meetup', description:'Join a short community football gathering.', targetId:'village-pond', action:'Join football meetup', cash:45, points:15 }),
  Object.freeze({ key:'cleanup', icon:'🧹', title:'Community Clean-up', description:'Pitch in with a quick clean-up around the public area.', targetId:'village-bench', action:'Help clean up', cash:60, points:18 }),
  Object.freeze({ key:'culture', icon:'🎭', title:'Kerala Cultural Evening', description:'Take part in a small local cultural gathering.', targetId:'town-bus', action:'Join cultural gathering', cash:50, points:16 }),
  Object.freeze({ key:'support', icon:'🤝', title:'Neighbourhood Help Desk', description:'Support a short community assistance activity.', targetId:'malabar', action:'Help at the desk', cash:65, points:20 }),
]);
const NPC_NAMES = Object.freeze(['Anu','Vivek','Meera','Arun','Nisha','Riyas','Asha','Manu','Liya','Nabeel','Sreeja','Jose']);
const NPC_FAVOR_TARGETS = Object.freeze([
  Object.freeze({ id:'anugraha', title:'Drop off a small parcel', action:'Deliver parcel', reward:40 }),
  Object.freeze({ id:'malabar', title:'Take a tea order to the bakery', action:'Deliver tea order', reward:45 }),
  Object.freeze({ id:'town-bus', title:'Pass a note to the bus stop', action:'Deliver note', reward:35 }),
  Object.freeze({ id:'village-pond', title:'Check the village pond notice point', action:'Check pond', reward:50 }),
  Object.freeze({ id:'village-bench', title:'Return a forgotten bag to the rest bench', action:'Return bag', reward:40 }),
]);
const NEEDS_MAX = 100;
const NEEDS_DECAY_PER_MINUTE = Object.freeze({ hunger: 0.28, thirst: 0.4, energy: 0.22 });
const NEEDS_MAX_CATCHUP_MS = 2 * 60 * 60 * 1000;
const NEEDS_REST_POINT = Object.freeze({ id: 'village-bench', label: 'Village Rest Bench', x: -10, z: -10, radius: 5.2 });
const NEEDS_REST_ENERGY = 35;
const NEEDS_REST_COOLDOWN_MS = 30_000;
const CLINIC_DEFINITIONS = Object.freeze({
  'community-clinic': Object.freeze({ id: 'community-clinic', label: 'Community Clinic', x: 28, z: 28, radius: 6.2, fee: 45, energyRestore: 30, thirstRestore: 10 }),
  'ernakulam-hospital': Object.freeze({ id: 'ernakulam-hospital', label: 'Ernakulam City Hospital', x: -12, z: -25, radius: 7.0, fee: 55, energyRestore: 36, thirstRestore: 12 }),
});
const CLINIC_DEFINITION = CLINIC_DEFINITIONS['community-clinic'];
const CLINIC_COOLDOWN_MS = 60_000;
const HOME_DEFINITION = Object.freeze({
  id: 'village-rental',
  label: 'Village Rental Home',
  x: -24,
  z: -30.8,
  radius: 5.2,
  rent: 60,
  utilities: 20,
  periodMs: 24 * 60 * 60 * 1000,
  graceMs: 48 * 60 * 60 * 1000,
});
const HOME_SLEEP_COOLDOWN_MS = 60_000;
const HOME_SLEEP_HUNGER_COST = 4;
const HOME_SLEEP_THIRST_COST = 6;
const PUBLIC_TRAVEL_ROUTES = Object.freeze({
  'village-line': Object.freeze({
    id: 'village-line',
    label: 'Village Line',
    fare: 12,
    intervalMs: 45_000,
    boardingWindowMs: 9_000,
    stops: Object.freeze({
      'town-bus': Object.freeze({
        id: 'town-bus', label: 'Town Junction Bus Stop', x: 11.7, z: 27.5, radius: 6.2,
        phaseMs: 0, destinationId: 'town-centre-bus', arrivalX: 11.7, arrivalZ: 29.4, arrivalRotation: Math.PI,
      }),
      'town-centre-bus': Object.freeze({
        id: 'town-centre-bus', label: 'Town Centre Bus Stop', x: 13.0, z: 19.2, radius: 6.2,
        phaseMs: 15_000, destinationId: 'south-bus', arrivalX: 13.0, arrivalZ: 21.1, arrivalRotation: Math.PI,
      }),
      'south-bus': Object.freeze({
        id: 'south-bus', label: 'South Bus Stop', x: -11.7, z: -50.5, radius: 6.2,
        phaseMs: 30_000, destinationId: 'town-bus', arrivalX: -11.7, arrivalZ: -52.4, arrivalRotation: 0,
      }),
    }),
  }),
  'ernakulam-city-line': Object.freeze({
    id: 'ernakulam-city-line',
    label: 'Ernakulam City Line',
    fare: 15,
    intervalMs: 45_000,
    boardingWindowMs: 9_000,
    stops: Object.freeze({
      'ernakulam-station-bus': Object.freeze({
        id: 'ernakulam-station-bus', label: 'Ernakulam Railway Bus Stop', x: -29, z: -14.5, radius: 6.2,
        phaseMs: 0, destinationId: 'ernakulam-mg-road', arrivalX: 20, arrivalZ: 8, arrivalRotation: Math.PI / 2,
      }),
      'ernakulam-mg-road': Object.freeze({
        id: 'ernakulam-mg-road', label: 'MG Road Bus Stop', x: 18, z: 8, radius: 6.2,
        phaseMs: 15_000, destinationId: 'ernakulam-marine', arrivalX: -1, arrivalZ: 26, arrivalRotation: 0,
      }),
      'ernakulam-marine': Object.freeze({
        id: 'ernakulam-marine', label: 'Marine Drive Bus Stop', x: -1, z: 28, radius: 6.2,
        phaseMs: 30_000, destinationId: 'ernakulam-station-bus', arrivalX: -27, arrivalZ: -14.5, arrivalRotation: -Math.PI / 2,
      }),
    }),
  }),
});
const DISTRICT_RAIL_ROUTE = Object.freeze({
  id: 'kottayam-ernakulam-rail',
  label: 'Kottayam ↔ Ernakulam Passenger',
  fare: 35,
  stations: Object.freeze({
    kottayam: Object.freeze({ id: 'kottayam', district: 'Kottayam', label: 'Kottayam Railway Station', x: 7, z: -23, radius: 7.2, destinationId: 'ernakulam', arrivalX: -34, arrivalZ: -19.5 }),
    ernakulam: Object.freeze({ id: 'ernakulam', district: 'Ernakulam', label: 'Ernakulam Railway Station', x: -40, z: -30.5, radius: 6.6, destinationId: 'kottayam', arrivalX: 11, arrivalZ: -23 }),
  }),
});
const PUBLIC_RIDE_DESTINATIONS = Object.freeze({
  bekal: Object.freeze({ id:'bekal', label:'Bekal Fort', x:-7, z:60, arrivalX:-7, arrivalZ:56.5 }),
  munnar: Object.freeze({ id:'munnar', label:'Munnar Tea Hills', x:42, z:26, arrivalX:38.8, arrivalZ:26 }),
  kochi: Object.freeze({ id:'kochi', label:'Mattancherry Palace', x:-10, z:23, arrivalX:-6, arrivalZ:23 }),
  alappuzha: Object.freeze({ id:'alappuzha', label:'Alappuzha Backwaters', x:-34, z:-13, arrivalX:-30.7, arrivalZ:-13 }),
  kuttanad: Object.freeze({ id:'kuttanad', label:'Kuttanad Fields', x:7, z:-23, arrivalX:10.2, arrivalZ:-23 }),
  temple: Object.freeze({ id:'temple', label:'Padmanabhaswamy Temple', x:13, z:-57, arrivalX:16.2, arrivalZ:-57 }),
  anugraha: Object.freeze({ id:'anugraha', label:'Anugraha Stores', x:-14.4, z:10.7, arrivalX:-14.4, arrivalZ:10.7 }),
  malabar: Object.freeze({ id:'malabar', label:'Malabar Bakery', x:14.8, z:41.2, arrivalX:14.8, arrivalZ:41.2 }),
  'town-bus': Object.freeze({ id:'town-bus', label:'Town Junction Bus Stop', x:11.7, z:27.5, arrivalX:8.7, arrivalZ:27.5 }),
  'town-centre-bus': Object.freeze({ id:'town-centre-bus', label:'Town Centre Bus Stop', x:13.0, z:19.2, arrivalX:10.0, arrivalZ:19.2 }),
  'south-bus': Object.freeze({ id:'south-bus', label:'South Bus Stop', x:-11.7, z:-50.5, arrivalX:-8.7, arrivalZ:-50.5 }),
  'village-rental': Object.freeze({ id:'village-rental', label:'Village Rental Home', x:-24, z:-30.8, arrivalX:-24, arrivalZ:-30.8 }),
  'village-bench': Object.freeze({ id:'village-bench', label:'Village Rest Bench', x:-10, z:-10, arrivalX:-10, arrivalZ:-10 }),
  fuel: Object.freeze({ id:'fuel', label:'Kerala Fuel Station', x:11, z:-12, arrivalX:13.8, arrivalZ:-12 }),
  service: Object.freeze({ id:'service', label:'Village Service Garage', x:-36, z:-15, arrivalX:-32.8, arrivalZ:-15 }),
  'village-pond': Object.freeze({ id:'village-pond', label:'Village Pond', x:39, z:-4, arrivalX:35.5, arrivalZ:-4 }),
  'ernakulam-centre': Object.freeze({ id:'ernakulam-centre', label:'Ernakulam City Centre', x:5, z:2, arrivalX:9, arrivalZ:2 }),
  'ernakulam-market': Object.freeze({ id:'ernakulam-market', label:'Ernakulam City Market', x:11, z:-7, arrivalX:11, arrivalZ:-3 }),
  'broadway-cafe': Object.freeze({ id:'broadway-cafe', label:'Broadway Cafe', x:-12.5, z:11, arrivalX:-12.5, arrivalZ:15 }),
  'ernakulam-hospital': Object.freeze({ id:'ernakulam-hospital', label:'Ernakulam City Hospital', x:-12, z:-25, arrivalX:-12, arrivalZ:-21 }),
});
const PUBLIC_RIDE_SERVICES = Object.freeze({
  auto: Object.freeze({ id:'auto', label:'Auto-rickshaw', baseFare:18, perMeter:.48, maxDistance:72, pickupSeconds:2, speed:10 }),
  taxi: Object.freeze({ id:'taxi', label:'Kerala Taxi', baseFare:32, perMeter:.68, maxDistance:360, pickupSeconds:3, speed:14 }),
});
const JOB_DEFINITIONS = Object.freeze({
  delivery: { title: 'Delivery Rider', reward: 180, durationMs: 0, cooldownMs: 30_000, description: 'Take the delivery bike, collect a parcel, then ride to the customer.', missionType: 'route', vehicle: 'bike', vehicleLabel: 'Delivery Bike' },
  taxi: { title: 'Taxi Driver', reward: 220, durationMs: 0, cooldownMs: 35_000, description: 'Enter the taxi, reach the passenger pickup point, then drive to the destination.', missionType: 'route', vehicle: 'taxi', vehicleLabel: 'Kerala Taxi' },
  shop: { title: 'Shop Worker', reward: 140, durationMs: 10_000, cooldownMs: 25_000, description: 'Travel to the village shop, check in and complete a short on-site shift.', missionType: 'shift', vehicle: null, vehicleLabel: null },
});
const JOB_MISSION_RADIUS = 5.5;
const JOB_VEHICLE_RADIUS = 4.5;
const VEHICLE_FUEL_MAX = 100;
const VEHICLE_CONDITION_MAX = 100;
const VEHICLE_SPECS = Object.freeze({
  bike: { fuelBurnPerMeter: 0.16, fuelPricePerPoint: 1, repairPricePerPoint: 1 },
  taxi: { fuelBurnPerMeter: 0.22, fuelPricePerPoint: 1, repairPricePerPoint: 2 },
});
const GARAGE_CATALOG = Object.freeze({
  kerala_bike: { id: 'kerala_bike', label: 'Kerala Bike', kind: 'bike', price: 700, description: 'Light personal bike for village and town travel.' },
  kerala_compact: { id: 'kerala_compact', label: 'Kerala Compact', kind: 'taxi', price: 2200, description: 'Compact personal car with better weather protection.' },
});
const PERSONAL_VEHICLE_RADIUS = 4.5;
const VEHICLE_INSURANCE_TERM = 30 * 24 * 60 * 60 * 1000;
const VEHICLE_INSURANCE_COST = Object.freeze({ bike: 90, taxi: 220 });
const DISTRICT_REGISTRATION_PREFIX = Object.freeze({
  Alappuzha: 'KL-04', Ernakulam: 'KL-07', Idukki: 'KL-06', Kannur: 'KL-13', Kasaragod: 'KL-14',
  Kollam: 'KL-02', Kottayam: 'KL-05', Kozhikode: 'KL-11', Malappuram: 'KL-10', Palakkad: 'KL-09',
  Pathanamthitta: 'KL-03', Thiruvananthapuram: 'KL-01', Thrissur: 'KL-08', Wayanad: 'KL-12',
});
const VEHICLE_STATIONS = Object.freeze({
  fuel: { id: 'fuel', label: 'Kerala Fuel Station', x: 11, z: -12, radius: 7 },
  service: { id: 'service', label: 'Village Service Garage', x: -36, z: -15, radius: 7 },
});
const VEHICLE_STATION_OPTIONS = Object.freeze({
  fuel: Object.freeze([VEHICLE_STATIONS.fuel, Object.freeze({ id: 'ernakulam-fuel', label: 'Ernakulam Fuel Station', x: 31, z: -25, radius: 7 })]),
  service: Object.freeze([VEHICLE_STATIONS.service, Object.freeze({ id: 'ernakulam-service', label: 'Ernakulam Auto Garage', x: -32, z: 30, radius: 7 })]),
});
function nearestVehicleServiceStation(user, action, x, z) {
  const district = currentWorldDistrict(user);
  let options;
  if (district === 'Ernakulam') {
    options = action === 'fuel'
      ? [{ id:'ernakulam-fuel', label:'Ernakulam Fuel Station', x:31, z:-25, radius:7 }, VEHICLE_STATIONS.fuel]
      : [{ id:'ernakulam-service', label:'Ernakulam Auto Garage', x:-32, z:30, radius:7 }, VEHICLE_STATIONS.service];
  } else if (district === 'Kottayam') {
    options = [VEHICLE_STATIONS[action]];
  } else {
    options = action === 'fuel'
      ? [{ id:'district-fuel', label:`${district} Fuel Station`, x:18, z:-48, radius:7 }]
      : [{ id:'district-service', label:`${district} Service Garage`, x:-18, z:-48, radius:7 }];
  }
  return (options || []).filter(Boolean).reduce((best, station) => {
    const distance = Math.hypot(Number(x) - station.x, Number(z) - station.z);
    return !best || distance < best.distance ? { ...station, distance } : best;
  }, null);
}
const TRAFFIC_CHECKPOINT = Object.freeze({ id: 'main-check', label: 'Kerala Play Traffic Checkpoint', x: 5.4, z: 18, radius: 7 });
const TRAFFIC_CHALLAN_AMOUNTS = Object.freeze({ insurance_expired: 40, speeding: 25, licence_invalid: 50 });
const DRIVING_LICENCE_TERMS = Object.freeze({ learner: 14 * 24 * 60 * 60 * 1000, full: 30 * 24 * 60 * 60 * 1000 });
const DRIVING_LICENCE_COSTS = Object.freeze({ learner: 0, full: 150, renew_learner: 40, renew_full: 100 });
const MOVEMENT_PROFILES = Object.freeze({
  walk: { rate: 8.5, maxCredit: 24 },
  bike: { rate: 16, maxCredit: 40 },
  taxi: { rate: 14, maxCredit: 36 },
});
const JOB_EXPIRY_GRACE = 20 * 60 * 1000;
const REPORT_REASONS = Object.freeze(['harassment', 'cheating', 'impersonation', 'inappropriate', 'spam', 'other']);
const REPORT_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const REPORT_HISTORY_LIMIT = 80;
const WORLD_SERVICE_POINTS = Object.freeze({
  police: Object.freeze({ id: 'police', service: 'police', label: 'Kerala Police Station', x: -31, z: 14, radius: 6.2 }),
  fire: Object.freeze({ id: 'fire', service: 'fire', label: 'Fire & Rescue Station', x: -48, z: 8, radius: 6.2 }),
  'ernakulam-police': Object.freeze({ id: 'ernakulam-police', service: 'police', label: 'Ernakulam City Police', x: -31, z: 11, radius: 6.8 }),
  'ernakulam-fire': Object.freeze({ id: 'ernakulam-fire', service: 'fire', label: 'Ernakulam Fire & Rescue', x: 34, z: 11, radius: 6.8 }),
});
const WORLD_SERVICE_HELP_COOLDOWN_MS = 60_000;
function genericDistrictWorld(user) {
  const district = currentWorldDistrict(user);
  return district !== 'Kottayam' && district !== 'Ernakulam' ? district : '';
}
function worldShopForUser(user, shopId) {
  if (genericDistrictWorld(user)) {
    const district = currentWorldDistrict(user);
    const profile = districtCityProfile(district);
    if (shopId === 'district-market') return { id:'district-market', label:profile.market, x:20, z:16, radius:5.5, openHour:5.5, closeHour:22, items:['water','tea','snack','meal'] };
    if (shopId === 'district-cafe') return { id:'district-cafe', label:profile.cafe, x:-44, z:22, radius:5.5, openHour:5, closeHour:23, items:['water','tea','snack','meal'] };
  }
  return WORLD_SHOPS[shopId] || null;
}
function clinicForUser(user, clinicId) {
  if (clinicId === 'district-hospital' && genericDistrictWorld(user)) {
    const district = currentWorldDistrict(user);
    return { id:'district-hospital', label:`${district} District Hospital`, x:-20, z:16, radius:7, fee:50, energyRestore:34, thirstRestore:10 };
  }
  return CLINIC_DEFINITIONS[clinicId] || CLINIC_DEFINITION;
}
function worldServicePointForUser(user, pointId) {
  if (genericDistrictWorld(user)) {
    const district = currentWorldDistrict(user);
    if (pointId === 'district-police' || pointId === 'police') return { id:'district-police', service:'police', label:`${district} District Police`, x:-20, z:-18, radius:6.8 };
    if (pointId === 'district-fire' || pointId === 'fire') return { id:'district-fire', service:'fire', label:`${district} Fire & Rescue`, x:20, z:-18, radius:6.8 };
  }
  return WORLD_SERVICE_POINTS[pointId] || null;
}
function homeDefinitionFor(user) {
  if (currentWorldDistrict(user) === 'Ernakulam') return { ...HOME_DEFINITION, id:'ernakulam-rental', label:'Ernakulam Rental Home', x:-48, z:40 };
  if (genericDistrictWorld(user)) return { ...HOME_DEFINITION, id:'district-rental', label:`${currentWorldDistrict(user)} Rental Home` };
  return HOME_DEFINITION;
}
function restPointFor(user) {
  if (currentWorldDistrict(user) === 'Ernakulam') return { ...NEEDS_REST_POINT, id:'ernakulam-rest', label:'Ernakulam Rest Bench', x:4, z:40 };
  if (genericDistrictWorld(user)) return { ...NEEDS_REST_POINT, id:'district-rest', label:`${currentWorldDistrict(user)} Rest Bench` };
  return NEEDS_REST_POINT;
}

const GROUP_MEMBER_LIMIT = 12;
const GROUP_MEMBERSHIP_LIMIT = 8;
const GROUP_MESSAGE_LIMIT = 100;
const GROUP_NAME_MAX = 40;
function freshJobState() { return { active: null, cooldowns: {}, completed: {}, garage: { owned: [], selectedId: null, activeVehicleId: null }, traffic: { challans: [], licence: { type: 'none', number: '', issuedAt: 0, validUntil: 0 } }, needs: { hunger: 100, thirst: 100, energy: 100, updatedAt: 0, lastRestAt: 0, lastClinicAt: 0 }, home: { status: 'rented', rentDueAt: 0, utilityDueAt: 0, lastSleepAt: 0, rentPayments: 0, utilityPayments: 0 }, bank: { balance: 0, accountNumber: '', transactions: [] }, notifications: { items: [], read: {} }, reports: [], npcRelations: {}, npcFavors: { active: null, cooldowns: {}, completed: 0 }, communityEvents: { completedIds: [], contributions: 0 } }; }
const SESSION_AGE = 365 * 24 * 60 * 60 * 1000;
const AUDIO_MAX = 512 * 1024;
const BODY_MAX = 720 * 1024;
const PUBLIC_EXTENSIONS = new Set(['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.glb', '.gltf', '.bin', '.mp3', '.ogg', '.wav', '.webm', '.json']);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'audio/webm', '.woff': 'font/woff', '.woff2': 'font/woff2' };

class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
function requireValue(condition, status, message) { if (!condition) throw new ApiError(status, message); }
function npcRelationshipIdentitySafe(value) {
  const match = /^npc-(\d+)$/.exec(String(value || ''));
  const index = match ? Number(match[1]) : -1;
  return !!match && Number.isInteger(index) && index >= 0 && index < NPC_RELATIONSHIP_COUNT;
}
function hashToken(value) { return createHash('sha256').update(value).digest('hex'); }
function cookieToken(request) {
  return (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('kp_session='))?.slice(11) || '';
}
async function jsonBody(request) {
  requireValue((request.headers['content-type'] || '').split(';')[0].trim() === 'application/json', 415, 'Send application/json.');
  requireValue(Number(request.headers['content-length'] || 0) <= BODY_MAX, 413, 'Request is too large.');
  const chunks = []; let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    requireValue(size <= BODY_MAX, 413, 'Request is too large.');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requireValue(body && typeof body === 'object' && !Array.isArray(body), 400, 'Send a JSON object.');
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'Invalid JSON.');
  }
}

/** A local, persistent multiplayer server. Sessions and live connections expire on restart. */
export async function createGameServer({ dataDir = resolve(ROOT, '.data'), publicDir = ROOT, now = Date.now, worldAlerts = [], adminUsernames = [] } = {}) {
  const adminAccounts = new Set((Array.isArray(adminUsernames) ? adminUsernames : []).map(value => String(value).trim().toLowerCase()).filter(Boolean));
  const configuredWorldAlerts = (Array.isArray(worldAlerts) ? worldAlerts : []).slice(0, 50).map((alert, index) => {
    if (!alert || typeof alert !== 'object' || Array.isArray(alert)) return null;
    const rawId = typeof alert.id === 'string' ? alert.id.trim() : '';
    const id = /^[A-Za-z0-9:_-]{1,80}$/.test(rawId) ? rawId : `alert-${index + 1}`;
    const title = String(alert.title || 'World alert').trim().slice(0, 80);
    const message = String(alert.message || '').trim().slice(0, 240);
    if (!message) return null;
    const kind = ['world', 'weather', 'emergency', 'event'].includes(alert.kind) ? alert.kind : 'world';
    const severity = ['info', 'warning', 'critical', 'success'].includes(alert.severity) ? alert.severity : 'info';
    const target = ['wallet', 'home', 'garage', 'jobs', 'people', 'groups', 'events'].includes(alert.target) ? alert.target : '';
    const startsAt = Number.isFinite(Number(alert.startsAt)) ? Math.max(0, Number(alert.startsAt)) : 0;
    const endsAt = Number.isFinite(Number(alert.endsAt)) ? Math.max(0, Number(alert.endsAt)) : 0;
    const districts = Array.isArray(alert.districts)
      ? alert.districts.filter(district => Object.hasOwn(DISTRICTS, district)).slice(0, 14)
      : [];
    return { id, title, message, kind, severity, target, startsAt, endsAt, districts };
  }).filter(Boolean);
  await mkdir(dataDir, { recursive: true });
  const databasePath = resolve(dataDir, 'game.json');
  let db;
  try { db = JSON.parse(await readFile(databasePath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot read saved game data: ${error.message}`);
    db = { version: 1, users: [], follows: [], blocks: [], messages: [], groups: [] };
  }
  if (db.version !== 1 || !['users', 'follows', 'blocks', 'messages'].every(key => Array.isArray(db[key])) || (db.groups !== undefined && !Array.isArray(db.groups)) || (db.transactions !== undefined && !Array.isArray(db.transactions)) || (db.sessions !== undefined && !Array.isArray(db.sessions))) throw new Error('Unsupported saved game data.');
  let migrated = false;
  if (!Array.isArray(db.transactions)) { db.transactions = []; migrated = true; }
  if (!Array.isArray(db.sessions)) { db.sessions = []; migrated = true; }
  if (!Array.isArray(db.groups)) { db.groups = []; migrated = true; }
  if (!Array.isArray(db.adminAuditLog)) { db.adminAuditLog = []; migrated = true; }
  const existingUserIds = new Set(db.users.map(user => user.id));
  const normalizedGroups = [];
  for (const raw of db.groups) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.id !== 'string' || typeof raw.ownerId !== 'string' || !existingUserIds.has(raw.ownerId)) { migrated = true; continue; }
    const name = String(raw.name || '').trim().slice(0, GROUP_NAME_MAX);
    if (name.length < 3) { migrated = true; continue; }
    const members = [...new Set([raw.ownerId, ...(Array.isArray(raw.members) ? raw.members : [])])].filter(id => existingUserIds.has(id)).slice(0, GROUP_MEMBER_LIMIT);
    const memberSet = new Set(members);
    const invites = [...new Set(Array.isArray(raw.invites) ? raw.invites : [])].filter(id => existingUserIds.has(id) && !memberSet.has(id)).slice(0, GROUP_MEMBER_LIMIT);
    const messages = (Array.isArray(raw.messages) ? raw.messages : []).filter(message => message && typeof message.id === 'string' && existingUserIds.has(message.from) && typeof message.body === 'string' && message.body.trim() && Number.isFinite(Number(message.createdAt))).slice(-GROUP_MESSAGE_LIMIT).map(message => ({ id: message.id, from: message.from, body: message.body.trim().slice(0, 240), createdAt: Number(message.createdAt) }));
    normalizedGroups.push({ id: raw.id, name, ownerId: raw.ownerId, members, invites, messages, createdAt: Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : now() });
  }
  if (JSON.stringify(normalizedGroups) !== JSON.stringify(db.groups)) { db.groups = normalizedGroups; migrated = true; }
  for (const user of db.users) {
    if (!Number.isInteger(user.walletBalance) || user.walletBalance < 0 || user.walletBalance > WALLET_LIMIT) {
      user.walletBalance = STARTER_BALANCE; migrated = true;
    }
    if (!Array.isArray(user.economyActions)) { user.economyActions = []; migrated = true; }
    if (!user.jobState || typeof user.jobState !== 'object' || Array.isArray(user.jobState)) { user.jobState = freshJobState(); migrated = true; }
    if (!user.jobState.cooldowns || typeof user.jobState.cooldowns !== 'object' || Array.isArray(user.jobState.cooldowns)) { user.jobState.cooldowns = {}; migrated = true; }
    if (!user.jobState.completed || typeof user.jobState.completed !== 'object' || Array.isArray(user.jobState.completed)) { user.jobState.completed = {}; migrated = true; }
    if (!user.jobState.garage || typeof user.jobState.garage !== 'object' || Array.isArray(user.jobState.garage)) { user.jobState.garage = { owned: [], selectedId: null, activeVehicleId: null }; migrated = true; }
    if (!Array.isArray(user.jobState.garage.owned)) { user.jobState.garage.owned = []; migrated = true; }
    if (!user.jobState.traffic || typeof user.jobState.traffic !== 'object' || Array.isArray(user.jobState.traffic)) { user.jobState.traffic = { challans: [], licence: { type: 'none', number: '', issuedAt: 0, validUntil: 0 } }; migrated = true; }
    if (!Array.isArray(user.jobState.traffic.challans)) { user.jobState.traffic.challans = []; migrated = true; }
    if (!user.jobState.traffic.licence || typeof user.jobState.traffic.licence !== 'object' || Array.isArray(user.jobState.traffic.licence)) { user.jobState.traffic.licence = { type: 'none', number: '', issuedAt: 0, validUntil: 0 }; migrated = true; }
    if (!user.jobState.needs || typeof user.jobState.needs !== 'object' || Array.isArray(user.jobState.needs)) { user.jobState.needs = { hunger: 100, thirst: 100, energy: 100, updatedAt: now(), lastRestAt: 0, lastClinicAt: 0 }; migrated = true; }
    if (!user.jobState.home || typeof user.jobState.home !== 'object' || Array.isArray(user.jobState.home)) { user.jobState.home = { status: 'rented', rentDueAt: now() + HOME_DEFINITION.periodMs, utilityDueAt: now() + HOME_DEFINITION.periodMs, lastSleepAt: 0, rentPayments: 0, utilityPayments: 0 }; migrated = true; }
    if (!user.jobState.bank || typeof user.jobState.bank !== 'object' || Array.isArray(user.jobState.bank)) { user.jobState.bank = { balance: 0, accountNumber: '', transactions: [] }; migrated = true; }
    if (!user.jobState.notifications || typeof user.jobState.notifications !== 'object' || Array.isArray(user.jobState.notifications)) { user.jobState.notifications = { items: [], read: {} }; migrated = true; }
    if (!Array.isArray(user.jobState.notifications.items)) { user.jobState.notifications.items = []; migrated = true; }
    if (!user.jobState.notifications.read || typeof user.jobState.notifications.read !== 'object' || Array.isArray(user.jobState.notifications.read)) { user.jobState.notifications.read = {}; migrated = true; }
    if (!Array.isArray(user.jobState.reports)) { user.jobState.reports = []; migrated = true; }
    if (!user.moderation || typeof user.moderation !== 'object' || Array.isArray(user.moderation)) { user.moderation = { warnings: [], mutedUntil: 0 }; migrated = true; }
    if (!Array.isArray(user.moderation.warnings)) { user.moderation.warnings = []; migrated = true; }
    if (!Number.isFinite(Number(user.moderation.mutedUntil))) { user.moderation.mutedUntil = 0; migrated = true; }
    const cleanReports = user.jobState.reports.filter(report => report && typeof report === 'object' && typeof report.id === 'string' && typeof report.targetId === 'string' && REPORT_REASONS.includes(report.reason) && Number.isFinite(Number(report.createdAt))).slice(-REPORT_HISTORY_LIMIT);
    if (cleanReports.length !== user.jobState.reports.length) { user.jobState.reports = cleanReports; migrated = true; }
    if (user.jobState.active && (typeof user.jobState.active !== 'object' || !JOB_DEFINITIONS[user.jobState.active.jobId] || !Array.isArray(user.jobState.active.checkpoints))) { user.jobState.active = null; migrated = true; }
    if (user.walletBalance > 0 && !db.transactions.some(transaction => transaction.userId === user.id)) {
      db.transactions.push({ id: randomUUID(), userId: user.id, type: 'credit', amount: user.walletBalance, balanceAfter: user.walletBalance, kind: 'opening', description: 'Opening Kerala Cash balance', createdAt: Number(user.createdAt) || now() });
      migrated = true;
    }
  }
  const latestSessionByUser = new Map();
  for (const item of db.sessions) {
    if (!item || typeof item.key !== 'string' || typeof item.id !== 'string' || Number(item.expires) <= now() || !db.users.some(user => user.id === item.id)) continue;
    const current = latestSessionByUser.get(item.id);
    if (!current || Number(item.expires) > current.expires) latestSessionByUser.set(item.id, { key: item.key, id: item.id, expires: Number(item.expires) });
  }
  const sessions = new Map([...latestSessionByUser.values()].map(item => [item.key, { id: item.id, expires: item.expires }]));
  if (sessions.size !== db.sessions.length) migrated = true;
  const clients = new Map(), presence = new Map(), rounds = new Map(), rates = new Map(), resetTokens = new Map();
  function syncSessionsToDb() {
    db.sessions = [...sessions.entries()]
      .filter(([, session]) => Number(session.expires) > now() && findUser(session.id))
      .map(([key, session]) => ({ key, id: session.id, expires: Number(session.expires) }));
  }
  let dirty = migrated, worldDirty = false, saveQueue = Promise.resolve();
  function persist() {
    syncSessionsToDb();
    const snapshot = JSON.stringify(db);
    dirty = false;
    const save = saveQueue.then(async () => {
      const temporaryPath = `${databasePath}.${randomUUID()}.tmp`;
      await writeFile(temporaryPath, snapshot, { mode: 0o600 });
      await rename(temporaryPath, databasePath);
    });
    saveQueue = save.catch(() => { dirty = true; });
    return save;
  }
  function limited(key, maximum, period) {
    const timestamp = now();
    let slot = rates.get(key);
    if (!slot || timestamp >= slot.until) { slot = { count: 0, until: timestamp + period }; rates.set(key, slot); }
    requireValue(++slot.count <= maximum, 429, 'Too many requests. Please wait and try again.');
  }
  function findUser(id) { return db.users.find(user => user.id === id); }
  function blocked(a, b) { return db.blocks.some(block => (block.from === a && block.to === b) || (block.from === b && block.to === a)); }
  function ownBlock(a, b) { return db.blocks.some(block => block.from === a && block.to === b); }
  function accepted(a, b) { return db.follows.some(follow => follow.status === 'accepted' && ((follow.from === a && follow.to === b) || (follow.from === b && follow.to === a))); }
  function relation(a, b) {
    if (blocked(a, b)) return 'none';
    const outgoing = db.follows.find(follow => follow.from === a && follow.to === b);
    const incoming = db.follows.find(follow => follow.from === b && follow.to === a);
    if (outgoing?.status === 'accepted' && incoming?.status === 'accepted') return 'mutual';
    if (outgoing?.status === 'accepted') return 'following';
    if (incoming?.status === 'accepted') return 'follower';
    if (incoming?.status === 'pending') return 'incoming';
    if (outgoing?.status === 'pending') return 'outgoing';
    return 'none';
  }
  function spawnFor(user) {
    const config = districtWorldConfig(user);
    return { x: config.spawn.x, z: config.spawn.z, rotation: config.spawn.rotation || 0 };
  }
  function savedPosition(user) {
    const spawn = spawnFor(user);
    const config = districtWorldConfig(user);
    const x = Number(user.worldX), z = Number(user.worldZ), rotation = Number(user.worldRotation);
    const valid = insideDistrictWorld(config, x, z, .01);
    return { x: valid ? x : spawn.x, z: valid ? z : spawn.z, rotation: Number.isFinite(rotation) ? rotation : spawn.rotation || 0, valid };
  }
  function publicUser(user) {
    const position = presence.get(user.id), saved = savedPosition(user);
    let level = 1, remaining = user.points, next = 100;
    while (remaining >= next) { remaining -= next; level++; next = 100 + (level - 1) * 50; }
    const displayName = user.displayName || user.firstName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username);
    return { id: user.id, username: displayName, name: displayName, displayName, accountUsername: user.username, usernameChangedAt: Number(user.usernameChangedAt || 0), usernameChangeAvailableAt: Number(user.usernameChangedAt || 0) + 10 * 24 * 60 * 60 * 1000, district: user.district, worldDistrict: currentWorldDistrict(user), gender: user.gender, bio: user.bio, points: user.points, level, followers: db.follows.filter(follow => follow.to === user.id && follow.status === 'accepted').length, following: db.follows.filter(follow => follow.from === user.id && follow.status === 'accepted').length, completedTasks: [...user.completedTasks], walkMeters: Math.floor(user.walkMeters), visitedLandmarks: [...user.visitedLandmarks], x: position?.x ?? saved.x, z: position?.z ?? saved.z, rotation: position?.rotation ?? saved.rotation };
  }
  function progressionStats(user) {
    const jobsCompleted = Object.values(user.jobState?.completed || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    return {
      walkMeters: Math.floor(Math.max(0, Number(user.walkMeters) || 0)),
      visitedLandmarks: [...new Set(user.visitedLandmarks || [])],
      communityContributions: Math.max(0, Number(user.jobState?.communityEvents?.contributions) || 0),
      jobsCompleted,
      safeDrivingPoints: Math.max(0, Number(user.safeDrivingPoints) || 0),
      emergencyResponses: Math.max(0, Number(user.emergencyResponses) || 0),
      creatorContributions: Math.max(0, Number(user.creatorContributions) || 0),
    };
  }
  function progressionProfile(user) {
    const recognition = recognitionSummary(progressionStats(user));
    const availableTitles = ['Newcomer', ...recognition.badges];
    const selectedTitle = availableTitles.includes(user.selectedTitle) ? user.selectedTitle : recognition.title;
    return { recognition: { ...recognition, title: selectedTitle, availableTitles } };
  }
  function syncRecognitionNotifications(user) {
    const recognition = recognitionSummary(progressionStats(user));
    for (const achievement of recognition.achievements.filter(item => item.unlocked)) {
      addNotification(user, {
        sourceKey: `achievement:${achievement.id}`,
        kind: 'achievement',
        title: `Achievement unlocked · ${achievement.title}`,
        message: `${achievement.badge} title is now available to use on your profile.`,
        severity: 'success',
        target: '',
      });
    }
    return progressionProfile(user);
  }
  function blockedUser(user) { const displayName = user.displayName || user.firstName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username); return { id: user.id, username: displayName, name: displayName, blocked: true }; }
  function online(id) { return !!presence.get(id) && now() - presence.get(id).lastSeen < 20000; }
  function emit(id, event, payload) {
    const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients.get(id) || []) {
      if (client.response.writableEnded || client.response.destroyed) continue;
      if (client.response.writableLength > 1024 * 1024) { client.response.destroy(); continue; }
      client.response.write(frame);
    }
  }
  function socialChanged() {
    for (const id of clients.keys()) emit(id, 'social', {});
    worldDirty = true;
  }
  function groupById(id) { return db.groups.find(group => group.id === id); }
  function userGroupCount(userId) { return db.groups.filter(group => group.members.includes(userId)).length; }
  function groupMemberView(memberId, viewerId, ownerId) {
    const member = findUser(memberId);
    if (!member) return null;
    if (memberId !== viewerId && blocked(viewerId, memberId)) return { id: memberId, username: 'Hidden member', blocked: true, owner: memberId === ownerId, online: false };
    const profile = publicUser(member);
    return { id: memberId, username: profile.username, district: profile.district, gender: profile.gender, level: profile.level, owner: memberId === ownerId, online: online(memberId), blocked: false };
  }
  function groupView(group, viewerId) {
    const isMember = group.members.includes(viewerId);
    const invited = group.invites.includes(viewerId);
    const members = isMember ? group.members.map(id => groupMemberView(id, viewerId, group.ownerId)).filter(Boolean) : [];
    return { id: group.id, name: group.name, ownerId: group.ownerId, memberCount: group.members.length, members, invited, isMember, isOwner: group.ownerId === viewerId, inviteCount: group.invites.length, createdAt: group.createdAt };
  }
  function groupsSummary(user) {
    const relevant = db.groups.filter(group => group.members.includes(user.id) || group.invites.includes(user.id));
    return { groups: relevant.filter(group => group.members.includes(user.id)).map(group => groupView(group, user.id)), invites: relevant.filter(group => group.invites.includes(user.id)).map(group => groupView(group, user.id)), limits: { membersPerGroup: GROUP_MEMBER_LIMIT, memberships: GROUP_MEMBERSHIP_LIMIT, messageLength: 240 } };
  }
  function requireGroup(user, groupId, { member = true, owner = false } = {}) {
    const group = groupById(groupId);
    requireValue(group, 404, 'Group not found.');
    if (member) requireValue(group.members.includes(user.id), 403, 'Join this group first.');
    if (owner) requireValue(group.ownerId === user.id, 403, 'Only the group owner can do that.');
    return group;
  }
  function profileChanged(user) { emit(user.id, 'profile', { user: publicUser(user) }); }
  function worldSnapshot(viewerId) {
    const viewer = findUser(viewerId);
    const viewerDistrict = viewer ? currentWorldDistrict(viewer) : 'Kottayam';
    return { district: viewerDistrict, players: [...presence.entries()].filter(([id]) => {
      if (!online(id) || blocked(viewerId, id)) return false;
      const candidate = findUser(id);
      return candidate && currentWorldDistrict(candidate) === viewerDistrict;
    }).map(([id, state]) => {
      const user = findUser(id);
      return { id, username: user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username), gender: user.gender, district: user.district, worldDistrict: currentWorldDistrict(user), x: state.x, z: state.z, rotation: state.rotation, moving: state.moving, mode: state.mode || 'walk' };
    }) };
  }
  function place(user, { reset = false } = {}) {
    const spawn = spawnFor(user);
    const saved = savedPosition(user);
    const useSaved = !reset && saved.valid;
    const x = useSaved ? saved.x : spawn.x;
    const z = useSaved ? saved.z : spawn.z;
    const rotation = useSaved ? saved.rotation : 0;
    if (!useSaved) {
      user.worldX = x; user.worldZ = z; user.worldRotation = rotation; user.worldUpdatedAt = now();
      dirty = true;
    }
    const state = { x, z, rotation, district: currentWorldDistrict(user), moving: false, mode: 'walk', lastSeen: now(), movedAt: now(), movementCredit: 2, lastProfile: now(), trafficSpeedStrikes: 0, trafficLastChallanAt: 0, trafficLicenceStrikes: 0, trafficLastLicenceChallanAt: 0 };
    presence.set(user.id, state);
    const garage = jobStateFor(user).garage;
    const personal = garage.activeVehicleId ? garage.owned.find(vehicle => vehicle.id === garage.activeVehicleId) : null;
    if (personal?.entered) {
      personal.entered = false;
      personal.parkedX = x;
      personal.parkedZ = z;
      dirty = true;
    }
    worldDirty = true;
    return state;
  }
  function sessionFor(request) {
    const token = cookieToken(request);
    const key = token ? hashToken(token) : '';
    const session = sessions.get(key);
    if (!session || session.expires <= now()) {
      if (sessions.delete(key)) dirty = true;
      return null;
    }
    const user = findUser(session.id);
    if (!user) {
      sessions.delete(key);
      dirty = true;
      return null;
    }
    return { user, key };
  }
  async function startSession(user, response, request) {
    const revokedByUser = new Map();
    const rememberRevoked = (userId, key) => {
      if (!revokedByUser.has(userId)) revokedByUser.set(userId, new Set());
      revokedByUser.get(userId).add(key);
      sessions.delete(key);
    };

    // Replacing the account in this browser must also close any live streams
    // that still carry the previous account's session token.
    const incomingToken = cookieToken(request);
    const incomingKey = incomingToken ? hashToken(incomingToken) : '';
    const incomingSession = incomingKey ? sessions.get(incomingKey) : null;
    if (incomingSession && incomingSession.id !== user.id) rememberRevoked(incomingSession.id, incomingKey);

    // Kerala Play allows one active device/session per account.
    for (const [key, session] of [...sessions]) {
      if (session.id === user.id) rememberRevoked(user.id, key);
    }

    for (const [userId, revokedKeys] of revokedByUser) {
      const connections = clients.get(userId);
      if (!connections?.size) continue;
      for (const client of [...connections]) {
        if (!revokedKeys.has(client.key)) continue;
        try {
          client.response.write(`event: session-revoked\ndata: ${JSON.stringify({ reason: 'signed-in-elsewhere' })}\n\n`);
        } catch { /* The stale client may already be gone. */ }
        client.response.end();
      }
    }

    const token = randomBytes(32).toString('hex');
    sessions.set(hashToken(token), { id: user.id, expires: now() + SESSION_AGE });
    dirty = true;
    const secure = request.socket.encrypted || process.env.COOKIE_SECURE === '1';
    response.setHeader('Set-Cookie', `kp_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE / 1000}${secure ? '; Secure' : ''}`);
    if (!presence.has(user.id)) place(user);
    await persist();
  }
  function send(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
  }
  async function sendResetEmail(user, code) {
    const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
    if (!key || !from || !user.email) return false;
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [user.email], subject: 'Kerala Play password reset code', text: `Your Kerala Play reset code is ${code}. It expires in 10 minutes.` }) });
    if (!result.ok) { console.error('Resend email failed:', await result.text()); return false; }
    return true;
  }
  function requirePeer(user, peerId, dm = false) {
    const peer = findUser(peerId);
    requireValue(peer && peer.id !== user.id, 404, 'Player not found.');
    if (dm) requireValue(!blocked(user.id, peer.id) && accepted(user.id, peer.id), 403, 'An accepted follow is required to message this player.');
    return peer;
  }
  async function reward(user, taskId, amount) {
    requireValue(!user.completedTasks.includes(taskId), 409, 'This reward was already claimed.');
    user.completedTasks.push(taskId); user.points += amount;
    await persist(); profileChanged(user);
    return { user: publicUser(user), reward: amount };
  }
  function walletSummary(user) {
    const transactions = db.transactions.filter(transaction => transaction.userId === user.id).slice(-30).reverse();
    return { balance: user.walletBalance, currency: 'KCR', currencyName: 'Kerala Cash', starterJobCompleted: user.economyActions.includes('starter-delivery'), transactions };
  }
  function walletTransaction(user, amount, kind, description) {
    requireValue(Number.isInteger(amount) && amount !== 0, 500, 'Invalid wallet transaction.');
    const balanceAfter = user.walletBalance + amount;
    requireValue(Number.isSafeInteger(balanceAfter) && balanceAfter >= 0 && balanceAfter <= WALLET_LIMIT, amount < 0 ? 409 : 500, amount < 0 ? 'Not enough Kerala Cash.' : 'Wallet limit reached.');
    user.walletBalance = balanceAfter;
    const transaction = { id: randomUUID(), userId: user.id, type: amount > 0 ? 'credit' : 'debit', amount: Math.abs(amount), balanceAfter, kind, description, createdAt: now() };
    db.transactions.push(transaction); dirty = true;
    return transaction;
  }
  function addNotification(user, { sourceKey, kind = 'system', title, message, severity = 'info', target = '' }) {
    const notifications = jobStateFor(user).notifications;
    if (sourceKey && notifications.items.some(item => item.sourceKey === sourceKey)) {
      return notifications.items.find(item => item.sourceKey === sourceKey);
    }
    const item = {
      id: randomUUID(),
      sourceKey: sourceKey || '',
      kind,
      title: String(title || 'Kerala Play'),
      message: String(message || ''),
      severity: ['info', 'warning', 'critical', 'success'].includes(severity) ? severity : 'info',
      target: ['wallet', 'home', 'garage', 'jobs', 'people', 'groups', 'events'].includes(target) ? target : '',
      createdAt: now(),
    };
    notifications.items.push(item);
    if (notifications.items.length > 80) notifications.items = notifications.items.slice(-80);
    dirty = true;
    emit(user.id, 'notification', { item });
    return item;
  }

  function liveNotificationItems(user) {
    const state = jobStateFor(user);
    const items = [];
    const timestamp = now();
    const home = homeSummary(user);
    if (home.accessBlocked) {
      items.push({
        id: `reminder:home-blocked:${home.rentDueAt}:${home.utilityDueAt}`,
        kind: 'home', title: 'Home access needs attention',
        message: 'Sleep access is paused. Pay overdue rent or utilities to restore it.',
        severity: 'critical', target: 'home', createdAt: Math.min(home.rentGraceUntil, home.utilityGraceUntil),
      });
    } else {
      const homeReminders = [
        ['rent', home.rentDueAt, home.rentOverdue, home.home.rent, 'Rent'],
        ['utilities', home.utilityDueAt, home.utilityOverdue, home.home.utilities, 'Utilities'],
      ];
      for (const [key, dueAt, overdue, amount, label] of homeReminders) {
        const remaining = Number(dueAt) - timestamp;
        if (overdue || remaining <= 2 * 60 * 60 * 1000) {
          items.push({
            id: `reminder:home-${key}:${dueAt}`,
            kind: 'home',
            title: overdue ? `${label} overdue` : `${label} due soon`,
            message: `${label} payment ₹${amount} · ${overdue ? 'pay during the grace period' : 'due within 2 hours'}.`,
            severity: overdue ? 'warning' : 'info',
            target: 'home',
            createdAt: overdue ? Number(dueAt) : timestamp,
          });
        }
      }
    }

    const needs = needsSummary(user);
    for (const [key, label] of [['hunger', 'Hunger'], ['thirst', 'Thirst'], ['energy', 'Energy']]) {
      const value = Number(needs[key]);
      if (value <= 15) {
        const level = value <= 7 ? 'critical' : 'warning';
        items.push({
          id: `reminder:needs:${key}:${level}`,
          kind: 'needs',
          title: `Low ${label.toLowerCase()}`,
          message: `${label} is ${Math.round(value)}%. ${key === 'energy' ? 'Rest or sleep, or use the Village Shop.' : 'Use the Village Shop to recover.'}`,
          severity: level,
          target: key === 'energy' ? 'home' : 'wallet',
          createdAt: Number(needs.updatedAt) || timestamp,
        });
      }
    }

    for (const vehicle of state.garage.owned) {
      const model = GARAGE_CATALOG[vehicle.modelId];
      const insurance = vehicleInsuranceSummary(vehicle);
      if (!insurance.insuranceActive || insurance.insuranceRemainingMs <= 3 * 24 * 60 * 60 * 1000) {
        items.push({
          id: `reminder:insurance:${vehicle.id}:${insurance.insuranceUntil}`,
          kind: 'vehicle',
          title: insurance.insuranceActive ? 'Vehicle insurance due soon' : 'Vehicle insurance expired',
          message: `${model.label} · ${vehicle.registration} · ${insurance.insuranceActive ? 'renew within 3 days' : 'renew insurance'}.`,
          severity: insurance.insuranceActive ? 'warning' : 'critical',
          target: 'garage',
          createdAt: insurance.insuranceActive ? timestamp : Number(insurance.insuranceUntil || timestamp),
        });
      }
    }

    const licence = drivingLicenceSummary(user);
    if (licence.type !== 'none' && (!licence.active || licence.remainingMs <= 3 * 24 * 60 * 60 * 1000)) {
      items.push({
        id: `reminder:licence:${licence.number}:${licence.validUntil}`,
        kind: 'vehicle',
        title: licence.active ? 'Driving licence due soon' : 'Driving licence expired',
        message: `${licence.label} · ${licence.active ? 'renew within 3 days' : 'renew before driving'}.`,
        severity: licence.active ? 'warning' : 'critical',
        target: 'garage',
        createdAt: licence.active ? timestamp : Number(licence.validUntil || timestamp),
      });
    }

    const jobs = jobsSummary(user);
    if (jobs.active?.ready) {
      items.push({
        id: `reminder:job-ready:${jobs.active.taskId}`,
        kind: 'job',
        title: 'Job ready to complete',
        message: `${jobs.active.title} is ready. Open Jobs to collect the salary.`,
        severity: 'success',
        target: 'jobs',
        createdAt: Number(jobs.active.readyAt || timestamp),
      });
    }
    if (!jobs.active) {
      for (const job of jobs.jobs) {
        if (job.completedCount > 0 && job.cooldownUntil > 0 && job.cooldownRemainingMs === 0) {
          items.push({
            id: `reminder:job-available:${job.id}:${job.cooldownUntil}`,
            kind: 'job',
            title: `${job.title} available again`,
            message: `Cooldown finished · ${job.title} can be started now.`,
            severity: 'info',
            target: 'jobs',
            createdAt: Number(job.cooldownUntil),
          });
        }
      }
    }

    for (const alert of configuredWorldAlerts) {
      if (alert.startsAt && alert.startsAt > timestamp) continue;
      if (alert.endsAt && alert.endsAt < timestamp) continue;
      if (alert.districts.length && !alert.districts.includes(user.district)) continue;
      items.push({
        id: `world:${alert.id}`,
        kind: alert.kind,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        target: alert.target,
        createdAt: alert.startsAt || timestamp,
      });
    }

    const eventSummary = communityEventsSummary(user, timestamp);
    const currentEvent = eventSummary.current;
    if (currentEvent?.status === 'active' && !currentEvent.completed) {
      items.push({
        id: `reminder:event:${currentEvent.id}`,
        kind: 'event',
        title: `${currentEvent.icon} ${currentEvent.title}`,
        message: `${currentEvent.target.label} · ${Math.max(1, Math.ceil(currentEvent.secondsRemaining / 60))} min left · ₹${currentEvent.cashReward} + ${currentEvent.pointsReward} points.`,
        severity: 'info',
        target: 'events',
        createdAt: Number(currentEvent.startsAt || timestamp),
      });
    }

    const eventSources = new Set(state.notifications.items.map(item => item.sourceKey));
    for (const challan of state.traffic.challans) {
      if (Number(challan.paidAt) || eventSources.has(`challan:${challan.id}`)) continue;
      items.push({
        id: `reminder:challan:${challan.id}`,
        kind: 'traffic', title: 'Unpaid traffic challan',
        message: `${challan.description} · ₹${challan.amount} unpaid.`,
        severity: 'warning', target: 'garage', createdAt: Number(challan.createdAt || timestamp),
      });
    }
    return items;
  }

  function notificationsSummary(user) {
    const state = jobStateFor(user);
    const stored = state.notifications.items.map(item => ({ ...item, live: false }));
    const live = liveNotificationItems(user).map(item => ({ ...item, live: true }));
    const deduped = new Map();
    for (const item of [...stored, ...live]) deduped.set(item.id, item);
    const items = [...deduped.values()]
      .map(item => ({ ...item, read: !!state.notifications.read[item.id] }))
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .slice(0, 60);
    return {
      unreadCount: items.filter(item => !item.read).length,
      items,
      generatedAt: now(),
    };
  }

  function bankAccountNumberFor(user) {
    const digest = createHash('sha256').update(`kerala-bank:${user.id}`).digest('hex');
    const digits = String(parseInt(digest.slice(0, 12), 16) % 100_000_000).padStart(8, '0');
    return `KPB-${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  function bankUpiId(user) {
    return `${String(user.username).toLowerCase()}@keralapay`;
  }

  function bankSummary(user) {
    const state = jobStateFor(user);
    const bank = state.bank;
    if (!bank.accountNumber) {
      bank.accountNumber = bankAccountNumberFor(user);
      dirty = true;
    }
    return {
      balance: Number(bank.balance) || 0,
      currency: 'KCR',
      currencyName: 'Kerala Cash',
      bankName: 'Kerala Bank',
      accountNumber: bank.accountNumber,
      upiId: bankUpiId(user),
      transferMax: BANK_TRANSFER_MAX,
      transactions: bank.transactions.slice(-30).reverse(),
    };
  }

  function bankTransaction(user, amount, kind, description, details = {}) {
    requireValue(Number.isInteger(amount) && amount !== 0, 500, 'Invalid bank transaction.');
    const bank = jobStateFor(user).bank;
    const balanceAfter = Number(bank.balance) + amount;
    requireValue(
      Number.isSafeInteger(balanceAfter) && balanceAfter >= 0 && balanceAfter <= BANK_LIMIT,
      amount < 0 ? 409 : 500,
      amount < 0 ? 'Not enough money in your Kerala Bank account.' : 'Bank account limit reached.'
    );
    bank.balance = balanceAfter;
    if (!bank.accountNumber) bank.accountNumber = bankAccountNumberFor(user);
    const entry = {
      id: randomUUID(),
      type: amount > 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      balanceAfter,
      kind,
      description,
      createdAt: now(),
      ...details,
    };
    bank.transactions.push(entry);
    if (bank.transactions.length > 80) bank.transactions = bank.transactions.slice(-80);
    dirty = true;
    return entry;
  }

  function registrationNumberFor(user) {
    const prefix = DISTRICT_REGISTRATION_PREFIX[user.district] || 'KL-99';
    const existing = new Set();
    for (const owner of db.users) {
      for (const vehicle of owner.jobState?.garage?.owned || []) {
        if (vehicle?.registration) existing.add(vehicle.registration);
      }
    }
    for (let attempt = 0; attempt < 80; attempt++) {
      const letters = String.fromCharCode(65 + randomInt(26)) + String.fromCharCode(65 + randomInt(26));
      const number = String(randomInt(1, 10000)).padStart(4, '0');
      const registration = `${prefix}-${letters}-${number}`;
      if (!existing.has(registration)) return registration;
    }
    return `${prefix}-KP-${String(randomInt(1, 10000)).padStart(4, '0')}`;
  }

  function vehicleResaleValue(vehicle) {
    const model = GARAGE_CATALOG[vehicle.modelId];
    if (!model) return 0;
    const condition = Math.max(15, Math.min(100, Number(vehicle.condition) || 15));
    return Math.max(100, Math.floor(model.price * (.45 + .35 * (condition / 100))));
  }

  function vehicleInsuranceSummary(vehicle) {
    const until = Math.max(0, Number(vehicle.insuranceUntil) || 0);
    const remainingMs = Math.max(0, until - now());
    return { insuranceUntil: until, insuranceActive: remainingMs > 0, insuranceRemainingMs: remainingMs };
  }

  function usedMarketSummary(viewer) {
    const listings = [];
    for (const owner of db.users) {
      const state = jobStateFor(owner);
      for (const vehicle of state.garage.owned) {
        if (!(Number(vehicle.salePrice) > 0) || !Number(vehicle.listedAt)) continue;
        const model = GARAGE_CATALOG[vehicle.modelId];
        listings.push({
          vehicleId: vehicle.id,
          modelId: vehicle.modelId,
          label: model.label,
          kind: model.kind,
          registration: vehicle.registration,
          fuel: Math.round(vehicle.fuel * 10) / 10,
          condition: Math.round(vehicle.condition),
          price: Number(vehicle.salePrice),
          listedAt: Number(vehicle.listedAt),
          sellerName: owner.displayName || (/^\d+$/.test(owner.username) ? 'Explorer' : owner.username),
          ownListing: owner.id === viewer.id,
          ...vehicleInsuranceSummary(vehicle),
        });
      }
    }
    listings.sort((a, b) => b.listedAt - a.listedAt);
    return { listings: listings.slice(0, 50) };
  }

  function trafficZoneAt(x, z) {
    if (Math.abs(x) <= 7.75) return { id: 'main', label: 'Main Road', limit: 40 };
    if (x >= -72 && x <= 16 && Math.abs(z + 22) <= 5.75) return { id: 'village', label: 'Village Road', limit: 30 };
    return { id: 'offroad', label: 'Off Road', limit: 20 };
  }

  function licenceNumberFor(user) {
    const suffix = String(randomInt(1, 1_000_000)).padStart(6, '0');
    return `KPDL-${String(user.district || 'KL').slice(0, 3).toUpperCase()}-${suffix}`;
  }

  function drivingLicenceSummary(user) {
    const state = jobStateFor(user);
    const licence = state.traffic.licence;
    const validUntil = Math.max(0, Number(licence.validUntil) || 0);
    const active = licence.type !== 'none' && validUntil > now();
    const remainingMs = Math.max(0, validUntil - now());
    return {
      type: licence.type,
      label: licence.type === 'full' ? 'Full Licence' : licence.type === 'learner' ? 'Learner Permit' : 'No Licence',
      number: licence.number || '',
      issuedAt: Math.max(0, Number(licence.issuedAt) || 0),
      validUntil,
      active,
      remainingMs,
      holderName: user.displayName || user.firstName || user.username,
      allowedKinds: active ? (licence.type === 'full' ? ['bike', 'taxi'] : ['bike']) : [],
      canApplyLearner: licence.type === 'none',
      canUpgradeFull: active && licence.type === 'learner',
      canRenew: licence.type !== 'none',
      costs: DRIVING_LICENCE_COSTS,
    };
  }

  function licenceAllowsVehicle(user, kind) {
    const licence = drivingLicenceSummary(user);
    return licence.active && licence.allowedKinds.includes(kind);
  }

  function createTrafficChallan(user, vehicle, kind, source, details = {}) {
    const amount = TRAFFIC_CHALLAN_AMOUNTS[kind];
    requireValue(Number.isInteger(amount) && amount > 0, 500, 'Traffic challan configuration is invalid.');
    const traffic = jobStateFor(user).traffic;
    if (kind === 'insurance_expired' || kind === 'licence_invalid') {
      const existing = traffic.challans.find(challan => challan.vehicleId === vehicle.id && challan.kind === kind && !Number(challan.paidAt));
      if (existing) return { challan: existing, created: false };
    }
    const description = kind === 'insurance_expired'
      ? `Expired insurance · ${vehicle.registration}`
      : kind === 'licence_invalid'
        ? `Invalid driving licence · ${vehicle.registration}`
        : `Speeding · ${vehicle.registration} · ${details.speedKmh || '?'} / ${details.limit || '?'} km/h`;
    const challan = {
      id: randomUUID(),
      vehicleId: vehicle.id,
      registration: vehicle.registration,
      kind,
      amount,
      description,
      source,
      zone: details.zone || null,
      speedKmh: Number(details.speedKmh) || 0,
      limit: Number(details.limit) || 0,
      createdAt: now(),
      paidAt: 0,
    };
    traffic.challans.push(challan);
    if (traffic.challans.length > 80) traffic.challans = traffic.challans.slice(-80);
    addNotification(user, {
      sourceKey: `challan:${challan.id}`,
      kind: 'traffic',
      title: 'Traffic challan issued',
      message: `${challan.description} · ₹${challan.amount}.`,
      severity: 'warning',
      target: 'garage',
    });
    dirty = true;
    return { challan, created: true };
  }

  function trafficSummary(user) {
    const state = jobStateFor(user);
    const challans = [...state.traffic.challans]
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      .map(challan => ({ ...challan, paid: Number(challan.paidAt) > 0 }));
    const documents = state.garage.owned.map(vehicle => {
      const model = GARAGE_CATALOG[vehicle.modelId];
      return {
        vehicleId: vehicle.id,
        label: model.label,
        kind: model.kind,
        registration: vehicle.registration,
        rcValid: true,
        ...vehicleInsuranceSummary(vehicle),
      };
    });
    const unpaid = challans.filter(challan => !challan.paid);
    return {
      checkpoint: TRAFFIC_CHECKPOINT,
      licence: drivingLicenceSummary(user),
      documents,
      challans,
      unpaidCount: unpaid.length,
      unpaidTotal: unpaid.reduce((sum, challan) => sum + Number(challan.amount || 0), 0),
      rules: {
        title: 'Kerala Play Traffic Rules',
        insuranceExpiredFine: TRAFFIC_CHALLAN_AMOUNTS.insurance_expired,
        speedingFine: TRAFFIC_CHALLAN_AMOUNTS.speeding,
        licenceInvalidFine: TRAFFIC_CHALLAN_AMOUNTS.licence_invalid,
      },
    };
  }

  function homeSummary(user) {
    const state = jobStateFor(user);
    const home = state.home;
    const timestamp = now();
    const rentDueAt = Number(home.rentDueAt);
    const utilityDueAt = Number(home.utilityDueAt);
    const rentOverdue = timestamp > rentDueAt;
    const utilityOverdue = timestamp > utilityDueAt;
    const homeDefinition = homeDefinitionFor(user);
    const rentGraceUntil = rentDueAt + homeDefinition.graceMs;
    const utilityGraceUntil = utilityDueAt + homeDefinition.graceMs;
    const accessBlocked = timestamp > rentGraceUntil || timestamp > utilityGraceUntil;
    const reminder = accessBlocked
      ? 'Sleep access paused until overdue home charges are paid.'
      : (rentOverdue || utilityOverdue ? 'Home payment is overdue but still inside the grace period.' : 'Home payments are up to date.');
    return {
      status: home.status,
      home: HOME_DEFINITION,
      localHome: homeDefinition,
      rentDueAt,
      utilityDueAt,
      rentOverdue,
      utilityOverdue,
      rentGraceUntil,
      utilityGraceUntil,
      accessBlocked,
      reminder,
      lastSleepAt: Number(home.lastSleepAt || 0),
      nextSleepAt: Number(home.lastSleepAt || 0) + HOME_SLEEP_COOLDOWN_MS,
      rentPayments: Number(home.rentPayments || 0),
      utilityPayments: Number(home.utilityPayments || 0),
    };
  }

  function needsMovementFactor(needs) {
    let factor = 1;
    if (needs.energy <= 8) factor = Math.min(factor, .62);
    else if (needs.energy <= 20) factor = Math.min(factor, .78);
    if (needs.hunger <= 8) factor = Math.min(factor, .72);
    else if (needs.hunger <= 18) factor = Math.min(factor, .86);
    if (needs.thirst <= 5) factor = Math.min(factor, .62);
    else if (needs.thirst <= 15) factor = Math.min(factor, .8);
    return Math.max(.55, factor);
  }

  function applyNeedsDecay(user) {
    const state = jobStateFor(user);
    const needs = state.needs;
    const timestamp = now();
    const elapsedMs = Math.max(0, Math.min(timestamp - Number(needs.updatedAt || timestamp), NEEDS_MAX_CATCHUP_MS));
    if (elapsedMs >= 1000) {
      const minutes = elapsedMs / 60000;
      needs.hunger = Math.max(0, Number(needs.hunger) - NEEDS_DECAY_PER_MINUTE.hunger * minutes);
      needs.thirst = Math.max(0, Number(needs.thirst) - NEEDS_DECAY_PER_MINUTE.thirst * minutes);
      needs.energy = Math.max(0, Number(needs.energy) - NEEDS_DECAY_PER_MINUTE.energy * minutes);
      needs.updatedAt = timestamp;
      dirty = true;
    } else if (!Number(needs.updatedAt)) {
      needs.updatedAt = timestamp;
      dirty = true;
    }
    return needs;
  }

  function needsSummary(user) {
    const needs = applyNeedsDecay(user);
    const factor = needsMovementFactor(needs);
    return {
      hunger: Math.round(Number(needs.hunger) * 10) / 10,
      thirst: Math.round(Number(needs.thirst) * 10) / 10,
      energy: Math.round(Number(needs.energy) * 10) / 10,
      movementFactor: factor,
      canRun: factor >= .78 && Number(needs.energy) > 12 && Number(needs.hunger) > 5 && Number(needs.thirst) > 5,
      restPoint: NEEDS_REST_POINT,
      localRestPoint: restPointFor(user),
      restEnergy: NEEDS_REST_ENERGY,
      restReadyAt: Number(needs.lastRestAt || 0) + NEEDS_REST_COOLDOWN_MS,
      updatedAt: Number(needs.updatedAt || now()),
    };
  }

  function applyNeedsEffect(user, effect = {}) {
    const needs = applyNeedsDecay(user);
    for (const key of ['hunger', 'thirst', 'energy']) {
      if (!Number.isFinite(Number(effect[key])) || Number(effect[key]) === 0) continue;
      needs[key] = Math.max(0, Math.min(NEEDS_MAX, Number(needs[key]) + Number(effect[key])));
    }
    needs.updatedAt = now();
    dirty = true;
    return needsSummary(user);
  }

  function jobStateFor(user) {
    if (!user.jobState || typeof user.jobState !== 'object' || Array.isArray(user.jobState)) user.jobState = freshJobState();
    if (!user.jobState.cooldowns || typeof user.jobState.cooldowns !== 'object' || Array.isArray(user.jobState.cooldowns)) user.jobState.cooldowns = {};
    if (!user.jobState.completed || typeof user.jobState.completed !== 'object' || Array.isArray(user.jobState.completed)) user.jobState.completed = {};
    if (!user.jobState.garage || typeof user.jobState.garage !== 'object' || Array.isArray(user.jobState.garage)) user.jobState.garage = { owned: [], selectedId: null, activeVehicleId: null };
    if (!user.jobState.traffic || typeof user.jobState.traffic !== 'object' || Array.isArray(user.jobState.traffic)) user.jobState.traffic = { challans: [], licence: { type: 'none', number: '', issuedAt: 0, validUntil: 0 } };
    if (!user.jobState.needs || typeof user.jobState.needs !== 'object' || Array.isArray(user.jobState.needs)) user.jobState.needs = { hunger: 100, thirst: 100, energy: 100, updatedAt: now(), lastRestAt: 0 };
    if (!user.jobState.home || typeof user.jobState.home !== 'object' || Array.isArray(user.jobState.home)) user.jobState.home = { status: 'rented', rentDueAt: now() + HOME_DEFINITION.periodMs, utilityDueAt: now() + HOME_DEFINITION.periodMs, lastSleepAt: 0, rentPayments: 0, utilityPayments: 0 };
    if (!user.jobState.bank || typeof user.jobState.bank !== 'object' || Array.isArray(user.jobState.bank)) user.jobState.bank = { balance: 0, accountNumber: '', transactions: [] };
    if (!user.jobState.notifications || typeof user.jobState.notifications !== 'object' || Array.isArray(user.jobState.notifications)) user.jobState.notifications = { items: [], read: {} };
    if (!Array.isArray(user.jobState.reports)) user.jobState.reports = [];
    if (!user.jobState.npcRelations || typeof user.jobState.npcRelations !== 'object' || Array.isArray(user.jobState.npcRelations)) user.jobState.npcRelations = {};
    if (!user.jobState.npcFavors || typeof user.jobState.npcFavors !== 'object' || Array.isArray(user.jobState.npcFavors)) user.jobState.npcFavors = { active: null, cooldowns: {}, completed: 0 };
    if (!user.jobState.communityEvents || typeof user.jobState.communityEvents !== 'object' || Array.isArray(user.jobState.communityEvents)) user.jobState.communityEvents = { completedIds: [], contributions: 0 };
    if (!Array.isArray(user.jobState.communityEvents.completedIds)) user.jobState.communityEvents.completedIds = [];
    user.jobState.communityEvents.completedIds = user.jobState.communityEvents.completedIds.filter(id => typeof id === 'string' && /^community:\d+:[a-z]+$/.test(id)).slice(-COMMUNITY_EVENT_HISTORY_LIMIT);
    if (!Number.isInteger(Number(user.jobState.communityEvents.contributions)) || Number(user.jobState.communityEvents.contributions) < 0) user.jobState.communityEvents.contributions = 0;
    if (!user.jobState.npcFavors.cooldowns || typeof user.jobState.npcFavors.cooldowns !== 'object' || Array.isArray(user.jobState.npcFavors.cooldowns)) user.jobState.npcFavors.cooldowns = {};
    if (!Number.isInteger(Number(user.jobState.npcFavors.completed)) || Number(user.jobState.npcFavors.completed) < 0) user.jobState.npcFavors.completed = 0;
    const normalizedFavorCooldowns = {};
    for (const [npcId, value] of Object.entries(user.jobState.npcFavors.cooldowns)) {
      if (!npcRelationshipIdentitySafe(npcId)) continue;
      const timestamp = Number(value);
      if (Number.isFinite(timestamp) && timestamp > 0) normalizedFavorCooldowns[npcId] = timestamp;
    }
    user.jobState.npcFavors.cooldowns = normalizedFavorCooldowns;
    const normalizedNpcRelations = {};
    for (const [npcId, relation] of Object.entries(user.jobState.npcRelations)) {
      const match = /^npc-(\d+)$/.exec(npcId);
      const npcIndex = match ? Number(match[1]) : -1;
      if (!match || npcIndex < 0 || npcIndex >= NPC_RELATIONSHIP_COUNT || !relation || typeof relation !== 'object' || Array.isArray(relation)) continue;
      normalizedNpcRelations[npcId] = {
        score: Math.max(0, Math.min(NPC_RELATIONSHIP_MAX, Number(relation.score) || 0)),
        conversations: Math.max(0, Math.min(100000, Math.floor(Number(relation.conversations) || 0))),
        lastInteractionAt: Math.max(0, Number(relation.lastInteractionAt) || 0),
        firstMetAt: Math.max(0, Number(relation.firstMetAt) || 0),
      };
    }
    user.jobState.npcRelations = normalizedNpcRelations;
    if (!Array.isArray(user.jobState.notifications.items)) user.jobState.notifications.items = [];
    if (!user.jobState.notifications.read || typeof user.jobState.notifications.read !== 'object' || Array.isArray(user.jobState.notifications.read)) user.jobState.notifications.read = {};
    if (!Array.isArray(user.jobState.traffic.challans)) user.jobState.traffic.challans = [];
    const needs = user.jobState.needs;
    for (const key of ['hunger', 'thirst', 'energy']) {
      if (!Number.isFinite(Number(needs[key]))) needs[key] = 100;
      needs[key] = Math.max(0, Math.min(NEEDS_MAX, Number(needs[key])));
    }
    if (!Number.isFinite(Number(needs.updatedAt)) || Number(needs.updatedAt) <= 0) needs.updatedAt = now();
    if (!Number.isFinite(Number(needs.lastRestAt))) needs.lastRestAt = 0;
    const notifications = user.jobState.notifications;
    notifications.items = notifications.items.filter(item => item && typeof item === 'object' && typeof item.id === 'string').slice(-80);
    const readEntries = Object.entries(notifications.read).filter(([, value]) => Number.isFinite(Number(value)) && Number(value) > 0).slice(-200);
    notifications.read = Object.fromEntries(readEntries);
    const bank = user.jobState.bank;
    if (!Number.isSafeInteger(Number(bank.balance)) || Number(bank.balance) < 0 || Number(bank.balance) > BANK_LIMIT) bank.balance = 0;
    if (typeof bank.accountNumber !== 'string') bank.accountNumber = '';
    if (!Array.isArray(bank.transactions)) bank.transactions = [];
    bank.transactions = bank.transactions.filter(entry => entry && typeof entry === 'object' && typeof entry.id === 'string').slice(-80);
    const home = user.jobState.home;
    if (home.status !== 'rented') home.status = 'rented';
    if (!Number.isFinite(Number(home.rentDueAt)) || Number(home.rentDueAt) <= 0) { home.rentDueAt = now() + HOME_DEFINITION.periodMs; dirty = true; }
    if (!Number.isFinite(Number(home.utilityDueAt)) || Number(home.utilityDueAt) <= 0) { home.utilityDueAt = now() + HOME_DEFINITION.periodMs; dirty = true; }
    if (!Number.isFinite(Number(home.lastSleepAt))) home.lastSleepAt = 0;
    if (!Number.isInteger(Number(home.rentPayments)) || Number(home.rentPayments) < 0) home.rentPayments = 0;
    if (!Number.isInteger(Number(home.utilityPayments)) || Number(home.utilityPayments) < 0) home.utilityPayments = 0;
    if (!user.jobState.traffic.licence || typeof user.jobState.traffic.licence !== 'object' || Array.isArray(user.jobState.traffic.licence)) user.jobState.traffic.licence = { type: 'none', number: '', issuedAt: 0, validUntil: 0 };
    const licence = user.jobState.traffic.licence;
    if (!['none', 'learner', 'full'].includes(licence.type)) licence.type = 'none';
    if (typeof licence.number !== 'string') licence.number = '';
    if (!Number.isFinite(Number(licence.issuedAt))) licence.issuedAt = 0;
    if (!Number.isFinite(Number(licence.validUntil))) licence.validUntil = 0;
    user.jobState.traffic.challans = user.jobState.traffic.challans.filter(challan => challan && typeof challan === 'object' && typeof challan.id === 'string');
    const garage = user.jobState.garage;
    if (!Array.isArray(garage.owned)) garage.owned = [];
    garage.owned = garage.owned.filter(vehicle => vehicle && typeof vehicle === 'object' && GARAGE_CATALOG[vehicle.modelId]);
    for (const vehicle of garage.owned) {
      if (!Number.isFinite(Number(vehicle.fuel))) vehicle.fuel = VEHICLE_FUEL_MAX;
      if (!Number.isFinite(Number(vehicle.condition))) vehicle.condition = VEHICLE_CONDITION_MAX;
      vehicle.fuel = Math.max(0, Math.min(VEHICLE_FUEL_MAX, Number(vehicle.fuel)));
      vehicle.condition = Math.max(15, Math.min(VEHICLE_CONDITION_MAX, Number(vehicle.condition)));
      if (typeof vehicle.entered !== 'boolean') vehicle.entered = false;
      if (!Number.isFinite(Number(vehicle.lastImpactAt))) vehicle.lastImpactAt = 0;
      if (typeof vehicle.registration !== 'string' || !vehicle.registration.trim()) { vehicle.registration = registrationNumberFor(user); dirty = true; }
      if (!Number.isFinite(Number(vehicle.insuranceUntil))) { vehicle.insuranceUntil = now() + VEHICLE_INSURANCE_TERM; dirty = true; }
      if (!Number.isFinite(Number(vehicle.listedAt))) vehicle.listedAt = 0;
      if (!Number.isFinite(Number(vehicle.salePrice))) vehicle.salePrice = 0;
      if (!Number.isInteger(Number(vehicle.ownerChanges))) vehicle.ownerChanges = 0;
    }
    if (garage.selectedId && !garage.owned.some(vehicle => vehicle.id === garage.selectedId && !(Number(vehicle.salePrice) > 0))) garage.selectedId = garage.owned.find(vehicle => !(Number(vehicle.salePrice) > 0))?.id || null;
    if (!garage.selectedId && garage.owned.length) garage.selectedId = garage.owned.find(vehicle => !(Number(vehicle.salePrice) > 0))?.id || null;
    if (garage.activeVehicleId && !garage.owned.some(vehicle => vehicle.id === garage.activeVehicleId)) garage.activeVehicleId = null;
    const activeFavor = user.jobState.npcFavors.active;
    if (activeFavor && (!npcRelationshipIdentitySafe(activeFavor.npcId) || !PUBLIC_RIDE_DESTINATIONS[activeFavor.targetId] || !Number.isFinite(Number(activeFavor.expiresAt)) || Number(activeFavor.expiresAt) <= now())) {
      user.jobState.npcFavors.active = null;
      dirty = true;
    }
    const active = user.jobState.active;
    if (active && (!Array.isArray(active.checkpoints) || Number(active.expiresAt) <= now())) {
      user.jobState.active = null;
      const live = presence.get(user.id);
      if (live) { live.mode = 'walk'; live.movementCredit = Math.min(live.movementCredit, 2); }
      dirty = true;
    } else if (active) {
      const job = JOB_DEFINITIONS[active.jobId];
      if (job?.vehicle) {
        if (typeof active.vehicleEntered !== 'boolean') { active.vehicleEntered = false; dirty = true; }
        if (!Number.isFinite(Number(active.vehicleFuel))) { active.vehicleFuel = VEHICLE_FUEL_MAX; dirty = true; }
        active.vehicleFuel = Math.max(0, Math.min(VEHICLE_FUEL_MAX, Number(active.vehicleFuel)));
        if (!Number.isFinite(Number(active.vehicleCondition))) { active.vehicleCondition = VEHICLE_CONDITION_MAX; dirty = true; }
        active.vehicleCondition = Math.max(15, Math.min(VEHICLE_CONDITION_MAX, Number(active.vehicleCondition)));
        if (!Number.isFinite(Number(active.vehicleLastImpactAt))) active.vehicleLastImpactAt = 0;
        if (!Number.isFinite(Number(active.vehicleX)) || !Number.isFinite(Number(active.vehicleZ))) {
          const position = savedPosition(user);
          active.vehicleX = missionCoordinateFor(user, position.x, 2.8, 'x');
          active.vehicleZ = missionCoordinateFor(user, position.z, 1.5, 'z');
          dirty = true;
        }
      }
    }
    return user.jobState;
  }
  function jobPosition(user) {
    const live = presence.get(user.id);
    if (live && Number.isFinite(live.x) && Number.isFinite(live.z)) return { x: live.x, z: live.z };
    const saved = savedPosition(user);
    return { x: saved.x, z: saved.z };
  }

  function districtCityBusRoute(user) {
    const district = genericDistrictWorld(user);
    if (!district) return null;
    const profile = districtCityProfile(district);
    return {
      id:'district-city-line',
      label:`${district} City Line`,
      fare:14,
      intervalMs:45_000,
      boardingWindowMs:9_000,
      stops:{
        'district-centre-bus': {
          id:'district-centre-bus', label:`${profile.centre} Bus Stop`, x:10, z:8, radius:6.2,
          phaseMs:0, destinationId:'district-market-bus', arrivalX:26, arrivalZ:18, arrivalRotation:Math.PI/2,
        },
        'district-market-bus': {
          id:'district-market-bus', label:`${profile.market} Bus Stop`, x:28, z:18, radius:6.2,
          phaseMs:15_000, destinationId:'district-rail-bus', arrivalX:-32, arrivalZ:-6, arrivalRotation:-Math.PI/2,
        },
        'district-rail-bus': {
          id:'district-rail-bus', label:`${district} Railway Bus Stop`, x:-34, z:-6, radius:6.2,
          phaseMs:30_000, destinationId:'district-centre-bus', arrivalX:8, arrivalZ:8, arrivalRotation:0,
        },
      },
    };
  }
  function publicTravelStop(stopId, user = null) {
    for (const route of Object.values(PUBLIC_TRAVEL_ROUTES)) {
      const stop = route.stops[stopId];
      if (stop) return { route, stop };
    }
    if (user) {
      const route = districtCityBusRoute(user);
      const stop = route?.stops?.[stopId];
      if (stop) return { route, stop };
    }
    return null;
  }

  function npcRelationshipIdentity(value) {
    const match = /^npc-(\d+)$/.exec(String(value || ''));
    const index = match ? Number(match[1]) : -1;
    if (!match || !Number.isInteger(index) || index < 0 || index >= NPC_RELATIONSHIP_COUNT) return null;
    return { id: `npc-${index}`, index, name: NPC_NAMES[index % NPC_NAMES.length] };
  }

  function npcRelationshipTier(score) {
    const value = Number(score) || 0;
    if (value >= 60) return 'Trusted';
    if (value >= 30) return 'Friendly';
    if (value >= 15) return 'Familiar';
    if (value >= 5) return 'Acquaintance';
    return 'Stranger';
  }

  function localReputationTier(value) {
    if (value >= 70) return 'Community Regular';
    if (value >= 45) return 'Trusted Local';
    if (value >= 20) return 'Known Local';
    if (value >= 5) return 'Recognized';
    return 'Newcomer';
  }

  function npcRelationshipSummary(user) {
    const state = jobStateFor(user);
    const relationships = [];
    let breadthScore = 0;
    for (const [npcId, relation] of Object.entries(state.npcRelations)) {
      const identity = npcRelationshipIdentity(npcId);
      if (!identity) continue;
      const score = Math.max(0, Math.min(NPC_RELATIONSHIP_MAX, Number(relation.score) || 0));
      breadthScore += Math.min(score, 20);
      relationships.push({
        npcId,
        npcIndex: identity.index,
        name: identity.name,
        score,
        tier: npcRelationshipTier(score),
        conversations: Math.max(0, Number(relation.conversations) || 0),
        firstMetAt: Number(relation.firstMetAt || 0),
        lastInteractionAt: Number(relation.lastInteractionAt || 0),
      });
    }
    relationships.sort((a, b) => b.score - a.score || a.npcIndex - b.npcIndex);
    const relationshipValue = Math.max(0, Math.min(100, Math.round((breadthScore / (NPC_RELATIONSHIP_COUNT * 20)) * 100)));
    const communityContributions = Math.max(0, Number(state.communityEvents?.contributions || 0));
    const communityBonus = Math.min(20, communityContributions * 2);
    const value = Math.max(0, Math.min(100, relationshipValue + communityBonus));
    return {
      reputation: {
        value,
        tier: localReputationTier(value),
        met: relationships.length,
        totalNpcs: NPC_RELATIONSHIP_COUNT,
        relationshipValue,
        communityContributions,
        communityBonus,
      },
      relationships,
      activeFavor: npcFavorSummary(user),
    };
  }

  function communityEventForSlot(slot) {
    const numericSlot = Math.max(0, Math.floor(Number(slot) || 0));
    const spec = COMMUNITY_EVENT_CATALOG[numericSlot % COMMUNITY_EVENT_CATALOG.length];
    const target = PUBLIC_RIDE_DESTINATIONS[spec.targetId];
    const startsAt = numericSlot * COMMUNITY_EVENT_INTERVAL_MS;
    return {
      id: `community:${numericSlot}:${spec.key}`,
      slot: numericSlot,
      key: spec.key,
      icon: spec.icon,
      title: spec.title,
      description: spec.description,
      action: spec.action,
      startsAt,
      endsAt: startsAt + COMMUNITY_EVENT_ACTIVE_MS,
      cashReward: spec.cash,
      pointsReward: spec.points,
      target: {
        id: target.id,
        label: target.label,
        x: Number(target.x),
        z: Number(target.z),
        radius: 6,
      },
    };
  }

  function communityEventsSummary(user, timestamp = now()) {
    const state = jobStateFor(user);
    const slot = Math.floor(timestamp / COMMUNITY_EVENT_INTERVAL_MS);
    const current = communityEventForSlot(slot);
    const previous = slot > 0 ? communityEventForSlot(slot - 1) : null;
    const upcoming = communityEventForSlot(slot + 1);
    const completed = new Set(state.communityEvents.completedIds);
    const activeNow = timestamp >= current.startsAt && timestamp < current.endsAt;
    const currentView = {
      ...current,
      status: activeNow ? (completed.has(current.id) ? 'completed' : 'active') : 'ended',
      completed: completed.has(current.id),
      secondsRemaining: activeNow ? Math.max(0, Math.ceil((current.endsAt - timestamp) / 1000)) : 0,
    };
    const recent = previous ? [{
      ...previous,
      status: completed.has(previous.id) ? 'completed' : 'ended',
      completed: completed.has(previous.id),
    }] : [];
    return {
      serverNow: timestamp,
      current: currentView,
      upcoming: {
        ...upcoming,
        status: 'upcoming',
        secondsUntilStart: Math.max(0, Math.ceil((upcoming.startsAt - timestamp) / 1000)),
      },
      recent,
      contributions: Number(state.communityEvents.contributions || 0),
      reputation: npcRelationshipSummary(user).reputation,
    };
  }

  function npcRecognitionMessage(tier, name) {
    if (tier === 'Trusted') return `${name} knows you well and greets you warmly.`;
    if (tier === 'Friendly') return `${name} is happy to see a familiar face.`;
    if (tier === 'Familiar') return `${name} remembers you from earlier visits.`;
    if (tier === 'Acquaintance') return `${name} recognizes you now.`;
    return `You have met ${name}.`;
  }

  function npcFavorDefinition(user, identity) {
    const state = jobStateFor(user);
    const offset = Math.max(0, Number(state.npcFavors.completed || 0));
    const spec = NPC_FAVOR_TARGETS[(identity.index + offset) % NPC_FAVOR_TARGETS.length];
    const target = PUBLIC_RIDE_DESTINATIONS[spec.id];
    return {
      id: `${identity.id}:${spec.id}`,
      npcId: identity.id,
      npcIndex: identity.index,
      npcName: identity.name,
      title: spec.title,
      action: spec.action,
      reward: spec.reward,
      target: {
        id: target.id,
        label: target.label,
        x: Number(target.x),
        z: Number(target.z),
        radius: 5.5,
      },
    };
  }

  function npcFavorOffer(user, identity, timestamp = now()) {
    const state = jobStateFor(user);
    const relation = state.npcRelations[identity.id];
    const score = Number(relation?.score || 0);
    if (score < NPC_FAVOR_MIN_SCORE || state.npcFavors.active || state.active) return null;
    const cooldownUntil = Number(state.npcFavors.cooldowns[identity.id] || 0);
    if (cooldownUntil > timestamp) return null;
    const definition = npcFavorDefinition(user, identity);
    return {
      ...definition,
      available: true,
      relationshipRequired: NPC_FAVOR_MIN_SCORE,
      expiresInMs: NPC_FAVOR_EXPIRY_MS,
    };
  }

  function npcFavorSummary(user) {
    const state = jobStateFor(user);
    const active = state.npcFavors.active;
    if (!active) return null;
    const identity = npcRelationshipIdentity(active.npcId);
    const target = PUBLIC_RIDE_DESTINATIONS[active.targetId];
    if (!identity || !target) return null;
    return {
      id: active.id,
      npcId: identity.id,
      npcIndex: identity.index,
      npcName: identity.name,
      title: active.title,
      action: active.action,
      reward: Number(active.reward || 0),
      startedAt: Number(active.startedAt || 0),
      expiresAt: Number(active.expiresAt || 0),
      target: {
        id: target.id,
        label: target.label,
        x: Number(target.x),
        z: Number(target.z),
        radius: 5.5,
      },
    };
  }

  function worldHour(timestamp = now()) {
    const phase = ((Number(timestamp) % WORLD_DAY_LENGTH_MS) + WORLD_DAY_LENGTH_MS) % WORLD_DAY_LENGTH_MS;
    return phase / 60_000;
  }

  function worldShopOpen(shop, timestamp = now()) {
    if (!shop) return false;
    const hour = worldHour(timestamp);
    const open = Number(shop.openHour ?? 0);
    const close = Number(shop.closeHour ?? 24);
    return open <= close ? hour >= open && hour < close : hour >= open || hour < close;
  }

  function worldHourLabel(value) {
    const numeric = Number(value) || 0;
    const hour = Math.floor(numeric) % 24;
    const minute = Math.round((((numeric % 1) + 1) % 1) * 60);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

function publicRideDestinationDistrict(destinationId) {
  if (destinationId === 'bekal') return 'Kasaragod';
  if (destinationId === 'munnar') return 'Idukki';
  if (destinationId === 'kochi' || destinationId.startsWith('ernakulam-') || destinationId === 'broadway-cafe') return 'Ernakulam';
  if (destinationId === 'alappuzha') return 'Alappuzha';
  if (destinationId === 'temple') return 'Thiruvananthapuram';
  return 'Kottayam';
}

  function publicRideQuote(user, destinationId) {
    const destination = PUBLIC_RIDE_DESTINATIONS[destinationId];
    requireValue(destination, 404, 'Ride destination not found.');
    requireValue(publicRideDestinationDistrict(destinationId) === currentWorldDistrict(user), 409, 'Auto and taxi rides stay inside the current district. Use train or flight for another district.');
    const state = jobStateFor(user);
    requireValue(!state.active, 409, 'Finish your active job before booking a public ride.');
    const personal = state.garage.activeVehicleId
      ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId)
      : null;
    requireValue(!personal?.entered, 409, 'Park and exit your personal vehicle before booking a ride.');
    const live = presence.get(user.id) || place(user);
    requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before booking a ride.');
    const distance = Math.hypot(Number(destination.x) - live.x, Number(destination.z) - live.z);
    requireValue(distance >= 5.5, 409, 'You are already close enough to walk to this destination.');
    const options = Object.values(PUBLIC_RIDE_SERVICES).map(service => {
      const available = distance <= Number(service.maxDistance);
      const fare = Math.max(
        Number(service.baseFare),
        Number(service.baseFare) + Math.ceil(distance * Number(service.perMeter))
      );
      return {
        id: service.id,
        label: service.label,
        available,
        fare,
        pickupSeconds: service.pickupSeconds,
        travelSeconds: Math.max(3, Math.ceil(distance / Number(service.speed))),
      };
    });
    return {
      destination: { id: destination.id, label: destination.label, x: destination.x, z: destination.z },
      distance: Math.round(distance * 10) / 10,
      walletBalance: user.walletBalance,
      options,
    };
  }

  function publicTravelStatus(stopId, timestamp = now(), user = null) {
    const found = publicTravelStop(stopId, user);
    if (!found) return null;
    const { route, stop } = found;
    const destination = route.stops[stop.destinationId];
    const interval = Number(route.intervalMs);
    const windowMs = Number(route.boardingWindowMs);
    const phase = Number(stop.phaseMs || 0);
    const latestArrival = Math.floor((timestamp - phase) / interval) * interval + phase;
    const boardingUntil = latestArrival + windowMs;
    const boarding = timestamp >= latestArrival && timestamp <= boardingUntil;
    const arrivalAt = boarding ? latestArrival : latestArrival + interval;
    const effectiveBoardingUntil = boarding ? boardingUntil : arrivalAt + windowMs;
    return {
      routeId: route.id,
      routeLabel: route.label,
      fare: route.fare,
      intervalMs: interval,
      serverNow: timestamp,
      boarding,
      arrivalAt,
      boardingUntil: effectiveBoardingUntil,
      secondsToArrival: boarding ? 0 : Math.max(0, Math.ceil((arrivalAt - timestamp) / 1000)),
      boardingSecondsRemaining: boarding ? Math.max(0, Math.ceil((effectiveBoardingUntil - timestamp) / 1000)) : 0,
      stop: { id: stop.id, label: stop.label, x: stop.x, z: stop.z, radius: stop.radius },
      destination: { id: destination.id, label: destination.label },
    };
  }
  function missionCoordinateFor(user, value, delta, axis = 'x') {
    const bounds = districtWorldConfig(user).bounds;
    const min = (axis === 'z' ? bounds.minZ : bounds.minX) + 6;
    const max = (axis === 'z' ? bounds.maxZ : bounds.maxX) - 6;
    let next = value + delta;
    if (next > max || next < min) next = value - delta;
    return Math.max(min, Math.min(max, next));
  }
  function buildJobCheckpoints(user, jobId) {
    const base = jobPosition(user);
    const point = (name, action, dx, dz) => ({ name, action, x: missionCoordinateFor(user, base.x, dx, 'x'), z: missionCoordinateFor(user, base.z, dz, 'z') });
    if (jobId === 'delivery') return [point('Village Parcel Hub', 'Collect parcel', 7, 4), point('Customer House', 'Deliver parcel', 19, -8)];
    if (jobId === 'taxi') return [point('Passenger Pickup', 'Pick up passenger', -7, 5), point('Town Junction', 'Drop off passenger', -20, -7)];
    return [point('Village Shop', 'Check in for shift', 9, -5)];
  }
  function personalVehicleSummary(user) {
    const state = jobStateFor(user);
    const garage = state.garage;
    const vehicle = garage.activeVehicleId ? garage.owned.find(item => item.id === garage.activeVehicleId) : null;
    if (!vehicle) return null;
    const model = GARAGE_CATALOG[vehicle.modelId];
    const position = jobPosition(user);
    const entered = !!vehicle.entered;
    const x = entered ? position.x : Number(vehicle.parkedX);
    const z = entered ? position.z : Number(vehicle.parkedZ);
    const distance = Number.isFinite(x) && Number.isFinite(z) ? Math.hypot(x - position.x, z - position.z) : null;
    return {
      source: 'personal',
      vehicleId: vehicle.id,
      modelId: vehicle.modelId,
      kind: model.kind,
      label: model.label,
      entered,
      x,
      z,
      radius: PERSONAL_VEHICLE_RADIUS,
      distance: distance === null ? null : Math.round(distance * 10) / 10,
      withinRange: distance !== null && distance <= PERSONAL_VEHICLE_RADIUS,
      fuel: Math.round(vehicle.fuel * 10) / 10,
      fuelMax: VEHICLE_FUEL_MAX,
      condition: Math.round(vehicle.condition),
      conditionMax: VEHICLE_CONDITION_MAX,
      stations: VEHICLE_STATIONS,
      registration: vehicle.registration,
      resaleValue: vehicleResaleValue(vehicle),
      forSale: Number(vehicle.salePrice) > 0,
      salePrice: Number(vehicle.salePrice) || 0,
      ...vehicleInsuranceSummary(vehicle),
    };
  }

  function garageSummary(user) {
    const state = jobStateFor(user);
    const garage = state.garage;
    return {
      walletBalance: user.walletBalance,
      selectedId: garage.selectedId || null,
      activeVehicleId: garage.activeVehicleId || null,
      activeVehicle: personalVehicleSummary(user),
      catalog: Object.values(GARAGE_CATALOG).map(model => ({
        ...model,
        owned: garage.owned.some(vehicle => vehicle.modelId === model.id),
      })),
      owned: garage.owned.map(vehicle => {
        const model = GARAGE_CATALOG[vehicle.modelId];
        return {
          id: vehicle.id,
          modelId: vehicle.modelId,
          label: model.label,
          kind: model.kind,
          fuel: Math.round(vehicle.fuel * 10) / 10,
          condition: Math.round(vehicle.condition),
          registration: vehicle.registration,
          resaleValue: vehicleResaleValue(vehicle),
          forSale: Number(vehicle.salePrice) > 0,
          salePrice: Number(vehicle.salePrice) || 0,
          ownerChanges: Number(vehicle.ownerChanges) || 0,
          insuranceRenewalCost: VEHICLE_INSURANCE_COST[model.kind],
          ...vehicleInsuranceSummary(vehicle),
          selected: garage.selectedId === vehicle.id,
          active: garage.activeVehicleId === vehicle.id,
          entered: !!vehicle.entered,
        };
      }),
    };
  }

  function jobsSummary(user) {
    const state = jobStateFor(user);
    const timestamp = now();
    let active = null;
    if (state.active) {
      const source = state.active;
      const job = JOB_DEFINITIONS[source.jobId];
      const current = source.phase === 'travel' ? source.checkpoints[source.stepIndex] : (source.phase === 'working' ? source.checkpoints[source.checkpoints.length - 1] : null);
      const position = jobPosition(user);
      const distance = current ? Math.hypot(current.x - position.x, current.z - position.z) : null;
      const readyAt = Number(source.readyAt || 0);
      const ready = source.phase === 'ready' || (source.phase === 'working' && timestamp >= readyAt);
      const vehicleEntered = !!job.vehicle && !!source.vehicleEntered;
      const vehicleX = vehicleEntered ? position.x : Number(source.vehicleX);
      const vehicleZ = vehicleEntered ? position.z : Number(source.vehicleZ);
      const vehicleDistance = job.vehicle && Number.isFinite(vehicleX) && Number.isFinite(vehicleZ)
        ? Math.hypot(vehicleX - position.x, vehicleZ - position.z)
        : null;
      active = {
        taskId: source.taskId,
        jobId: source.jobId,
        title: job.title,
        startedAt: Number(source.startedAt),
        readyAt,
        expiresAt: Number(source.expiresAt),
        phase: source.phase,
        stepIndex: Number(source.stepIndex || 0),
        totalSteps: source.checkpoints.length,
        ready,
        remainingMs: source.phase === 'working' ? Math.max(0, readyAt - timestamp) : 0,
        target: current ? { ...current, radius: JOB_MISSION_RADIUS, distance: Math.round(distance * 10) / 10, withinRange: distance <= JOB_MISSION_RADIUS } : null,
        vehicle: job.vehicle ? {
          kind: job.vehicle,
          label: job.vehicleLabel,
          entered: vehicleEntered,
          x: vehicleX,
          z: vehicleZ,
          radius: JOB_VEHICLE_RADIUS,
          distance: vehicleDistance === null ? null : Math.round(vehicleDistance * 10) / 10,
          withinRange: vehicleDistance !== null && vehicleDistance <= JOB_VEHICLE_RADIUS,
          fuel: Math.round(Math.max(0, Math.min(VEHICLE_FUEL_MAX, Number(source.vehicleFuel))) * 10) / 10,
          fuelMax: VEHICLE_FUEL_MAX,
          condition: Math.round(Math.max(15, Math.min(VEHICLE_CONDITION_MAX, Number(source.vehicleCondition)))),
          conditionMax: VEHICLE_CONDITION_MAX,
          stations: VEHICLE_STATIONS,
        } : null,
      };
    }
    return {
      active,
      walletBalance: user.walletBalance,
      jobs: Object.entries(JOB_DEFINITIONS).map(([id, job]) => {
        const cooldownUntil = Number(state.cooldowns[id] || 0);
        return {
          id,
          title: job.title,
          description: job.description,
          reward: job.reward,
          durationMs: job.durationMs,
          missionType: job.missionType,
          vehicle: job.vehicle,
          vehicleLabel: job.vehicleLabel,
          cooldownMs: job.cooldownMs,
          cooldownUntil,
          cooldownRemainingMs: Math.max(0, cooldownUntil - timestamp),
          completedCount: Math.max(0, Number(state.completed[id] || 0)),
          canStart: !active && cooldownUntil <= timestamp,
        };
      }),
    };
  }
  const server = http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Permissions-Policy', 'microphone=(self), camera=()');
    try {
      const url = new URL(request.url, 'http://localhost');
      const path = decodeURIComponent(url.pathname);
      if (!path.startsWith('/api/')) {
        requireValue(request.method === 'GET' || request.method === 'HEAD', 405, 'Method not allowed.');
        const relative = path === '/' ? 'index.html' : path.slice(1);
        const extension = extname(relative).toLowerCase();
        const rootAsset = /^[a-zA-Z0-9_-]+\.(js|css|png|ico|svg|webmanifest)$/.test(relative);
        const nestedAsset = /^(assets|vendor)\/[a-zA-Z0-9_./-]+$/.test(relative) && PUBLIC_EXTENSIONS.has(extension);
        requireValue(relative === 'index.html' || rootAsset || nestedAsset, 404, 'File not found.');
        requireValue(!relative.split('/').some(part => part.startsWith('.')), 404, 'File not found.');
        const rootPath = await realpath(publicDir);
        let targetPath;
        try { targetPath = await realpath(resolve(rootPath, relative)); }
        catch { throw new ApiError(404, 'File not found.'); }
        requireValue(targetPath.startsWith(rootPath + sep), 404, 'File not found.');
        const resolvedRelative = targetPath.slice(rootPath.length + 1).replaceAll('\\', '/');
        requireValue(!resolvedRelative.split('/').some(part => part.startsWith('.')) && (resolvedRelative === 'index.html' || /^[a-zA-Z0-9_-]+\.(js|css|png|ico|svg|webmanifest)$/.test(resolvedRelative) || (/^(assets|vendor)\/[a-zA-Z0-9_./-]+$/.test(resolvedRelative) && PUBLIC_EXTENSIONS.has(extname(resolvedRelative).toLowerCase()))), 404, 'File not found.');
        const data = await readFile(targetPath);
        response.writeHead(200, { 'Content-Type': MIME[extension] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-cache' });
        response.end(request.method === 'HEAD' ? undefined : data);
        return;
      }
      const ip = request.socket.remoteAddress || 'unknown';
      limited(`api:${ip}`, 6000, 60000);
      const writing = !['GET', 'HEAD'].includes(request.method);
      if (writing) {
        const origin = request.headers.origin;
        requireValue(origin && ['http', 'https'].some(protocol => origin === `${protocol}://${request.headers.host}`), 403, 'Use the same website origin for this request.');
        requireValue(request.headers['sec-fetch-site'] !== 'cross-site', 403, 'Cross-site request denied.');
      }
      if (path === '/api/session' && request.method === 'GET') {
        const session = sessionFor(request);
        send(response, 200, { user: session ? publicUser(session.user) : null }); return;
      }
      if (path === '/api/auth/provider-status' && request.method === 'GET') {
        const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!/^https:\/\//.test(supabaseUrl) || !serviceKey) {
          send(response, 200, { google: false, facebook: false, configured: false }); return;
        }
        try {
          const settingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' },
          });
          const settings = await settingsResponse.json().catch(() => ({}));
          const external = settings?.external || {};
          send(response, 200, {
            google: external.google === true,
            facebook: external.facebook === true,
            configured: settingsResponse.ok,
          });
        } catch {
          send(response, 200, { google: false, facebook: false, configured: false });
        }
        return;
      }
      if (path === '/api/auth/signup' && request.method === 'POST') {
        limited(`auth:${ip}`, 30, 15 * 60000);
        const body = await jsonBody(request);
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const password = body.password;
        requireValue(/^(?=.*[A-Za-z])[A-Za-z0-9_]{3,24}$/.test(username), 400, 'Username must be 3–24 characters and include at least one letter.');
        requireValue(typeof password === 'string' && password.length >= 8 && password.length <= 128, 400, 'Use a password with 8–128 characters.');
        const district = body.district || 'Ernakulam', gender = body.gender || 'male';
        requireValue(Object.hasOwn(DISTRICTS, district) && ['male', 'female', 'other'].includes(gender), 400, 'Choose a valid district and avatar.');
        requireValue(!db.users.some(user => user.username.toLowerCase() === username.toLowerCase()), 409, 'That username is already taken.');
        const salt = randomBytes(16).toString('hex');
        const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
        requireValue(!db.users.some(user => user.username.toLowerCase() === username.toLowerCase()), 409, 'That username is already taken.');
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const mobile = typeof body.mobile === 'string' ? body.mobile.trim() : '';
        requireValue(!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Enter a valid email address.');
        requireValue(!mobile || /^\+?[0-9 ()-]{7,20}$/.test(mobile), 400, 'Enter a valid mobile number.');
        requireValue(!db.users.some(candidate => (email && candidate.email === email) || (mobile && candidate.mobile === mobile)), 409, 'That email or mobile is already in use.');
        const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
        requireValue(/^[A-Za-z][A-Za-z '-]{1,39}$/.test(firstName), 400, 'Enter a valid first name.');
        const [spawnX, spawnZ] = DISTRICTS[district];
        const user = { id: randomUUID(), firstName, displayName: firstName, username, usernameChangedAt: 0, email, mobile, passwordHash, salt, district, gender, bio: '', points: 0, completedTasks: [], walkMeters: 0, visitedLandmarks: [], createdAt: now(), gameDay: '', gameWins: 0, walletBalance: 0, economyActions: [], jobState: freshJobState(), worldDistrict: district, worldX: districtWorldConfig(district).spawn.x, worldZ: districtWorldConfig(district).spawn.z, worldRotation: districtWorldConfig(district).spawn.rotation || 0, worldUpdatedAt: now() };
        db.users.push(user); walletTransaction(user, STARTER_BALANCE, 'starter', 'Starter Kerala Cash'); await persist(); await startSession(user, response, request); socialChanged();
        send(response, 201, { user: publicUser(user) }); return;
      }
      if (path === '/api/auth/login' && request.method === 'POST') {
        limited(`auth:${ip}`, 30, 15 * 60000);
        const body = await jsonBody(request);
        requireValue(typeof body.identifier === 'string' && typeof body.password === 'string' && body.password.length <= 128, 400, 'Enter your username, email, mobile and password.');
        const identifier = body.identifier.trim().toLowerCase();
        const user = db.users.find(candidate => candidate.username.toLowerCase() === identifier || candidate.email === identifier || candidate.mobile === body.identifier.trim());
        const comparison = await scrypt(body.password, user?.salt || 'not-an-account-salt', 64);
        const valid = timingSafeEqual(comparison, user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64));
        requireValue(user && valid, 401, 'Username or password is incorrect.');
        await startSession(user, response, request); socialChanged();
        send(response, 200, { user: publicUser(user) }); return;
      }
      if (path === '/api/auth/oauth' && request.method === 'POST') {
        limited(`auth:${ip}`, 30, 15 * 60000);
        const body = await jsonBody(request);
        requireValue(['google', 'facebook'].includes(body.provider), 400, 'Choose Google or Facebook sign in.');
        requireValue(typeof body.accessToken === 'string' && body.accessToken.length >= 20 && body.accessToken.length <= 8192, 400, 'OAuth session token is missing.');
        const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        requireValue(/^https:\/\//.test(supabaseUrl) && serviceKey, 503, 'Social sign in is not configured on the Kerala Play server.');

        const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${body.accessToken}`, Accept: 'application/json' },
        });
        const authUser = await authResponse.json().catch(() => null);
        requireValue(authResponse.ok && authUser?.id, 401, 'Social sign in could not be verified.');
        const providerCandidates = new Set([
          authUser.app_metadata?.provider,
          ...(Array.isArray(authUser.app_metadata?.providers) ? authUser.app_metadata.providers : []),
          ...(Array.isArray(authUser.identities) ? authUser.identities.map(identity => identity?.provider) : []),
        ].filter(Boolean).map(provider => String(provider).toLowerCase()));
        requireValue(!providerCandidates.size || providerCandidates.has(body.provider), 401, 'Social sign in provider does not match.');
        const email = String(authUser.email || '').trim().toLowerCase();
        requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Your social account must share an email address.');

        let user = db.users.find(candidate => candidate.email === email);
        let created = false;
        if (!user) {
          const metadata = authUser.user_metadata || {};
          const rawName = String(metadata.given_name || metadata.first_name || metadata.name || email.split('@')[0] || 'Player');
          let firstName = rawName.split(/\s+/)[0].replace(/[^A-Za-z'-]/g, '').slice(0, 40);
          if (firstName.length < 2) firstName = 'Player';

          let base = email.split('@')[0].replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+|_+$/g, '').slice(0, 18);
          if (!/[A-Za-z]/.test(base)) base = `player_${base}`;
          if (base.length < 3) base = `player_${base || 'kp'}`;
          let username = base.slice(0, 24);
          for (let suffix = 1; db.users.some(candidate => candidate.username.toLowerCase() === username.toLowerCase()); suffix += 1) {
            const tail = String(suffix);
            username = `${base.slice(0, Math.max(1, 24 - tail.length))}${tail}`;
          }

          const salt = randomBytes(16).toString('hex');
          const randomPassword = randomBytes(48).toString('hex');
          const [spawnX, spawnZ] = DISTRICTS.Ernakulam;
          user = {
            id: randomUUID(),
            firstName,
            username,
            email,
            mobile: '',
            passwordHash: (await scrypt(randomPassword, salt, 64)).toString('hex'),
            salt,
            district: 'Ernakulam',
            gender: 'other',
            bio: '',
            points: 0,
            completedTasks: [],
            walkMeters: 0,
            visitedLandmarks: [],
            createdAt: now(),
            gameDay: '',
            gameWins: 0,
            walletBalance: 0,
            economyActions: [],
            jobState: freshJobState(),
            worldDistrict: 'Ernakulam',
            worldX: districtWorldConfig('Ernakulam').spawn.x,
            worldZ: districtWorldConfig('Ernakulam').spawn.z,
            worldRotation: 0,
            worldUpdatedAt: now(),
          };
          db.users.push(user);
          walletTransaction(user, STARTER_BALANCE, 'starter', 'Starter Kerala Cash');
          await persist();
          created = true;
        }

        await startSession(user, response, request);
        socialChanged();
        send(response, created ? 201 : 200, { user: publicUser(user), created, provider: body.provider });
        return;
      }
      if (path === '/api/auth/forgot' && request.method === 'POST') {
        const body = await jsonBody(request); const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
        const user = db.users.find(candidate => candidate.username.toLowerCase() === identifier || candidate.email === identifier || candidate.mobile === body.identifier?.trim());
        if (!user) send(response, 200, { ok: true, message: 'If that account exists, a reset code was issued.' });
        else { const code = String(randomInt(100000, 1000000)); resetTokens.set(hashToken(code), { userId: user.id, expires: now() + 10 * 60000 }); const sent = await sendResetEmail(user, code); if (!sent) console.log(`[Kerala Play] reset OTP for ${user.username}: ${code}`); send(response, 200, { ok: true, message: 'If that account exists, a reset code was issued to its saved email.' }); }
        return;
      }
      if (path === '/api/auth/reset' && request.method === 'POST') {
        const body = await jsonBody(request); const code = String(body.code || ''); const entry = resetTokens.get(hashToken(code));
        requireValue(entry && entry.expires > now(), 400, 'That reset code is invalid or expired.'); requireValue(typeof body.password === 'string' && body.password.length >= 8, 400, 'Use a password with at least 8 characters.');
        const target = findUser(entry.userId);
        const salt = randomBytes(16).toString('hex');
        target.salt = salt;
        target.passwordHash = (await scrypt(body.password, salt, 64)).toString('hex');
        resetTokens.delete(hashToken(code));
        addNotification(target, {
          sourceKey: `security:password:${now()}`,
          kind: 'security',
          title: 'Password changed',
          message: 'Your Kerala Play password was changed using account recovery.',
          severity: 'warning',
        });
        await persist();
        send(response, 200, { ok: true }); return;
      }
      const session = sessionFor(request);
      requireValue(session, 401, 'Please sign in first.');
      const user = session.user;
      if (path === '/api/admin/reports' && request.method === 'GET') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        const reports = db.users.flatMap(reporter => (reporter.jobState?.reports || []).map(report => {
          const target = db.users.find(peer => peer.id === report.targetId);
          return {
            id: report.id,
            status: report.status || 'open',
            reason: report.reason,
            details: report.details || '',
            createdAt: report.createdAt,
            reporter: { id: reporter.id, username: reporter.username },
            target: { id: report.targetId, username: target?.username || 'Unknown player' },
          };
        })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 200);
        send(response, 200, { reports }); return;
      }
      const adminReportMatch = path.match(/^\/api\/admin\/reports\/([^/]+)$/);
      if (adminReportMatch && request.method === 'PATCH') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        limited(`admin-action:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        requireValue(body.status === 'resolved' || body.status === 'dismissed', 400, 'Choose resolved or dismissed.');
        const reportId = decodeURIComponent(adminReportMatch[1]);
        let report = null, reporter = null;
        for (const candidate of db.users) {
          const found = (candidate.jobState?.reports || []).find(item => item.id === reportId);
          if (found) { report = found; reporter = candidate; break; }
        }
        requireValue(report, 404, 'Report not found.');
        requireValue((report.status || 'open') === 'open', 409, 'This report is already closed.');
        const target = db.users.find(peer => peer.id === report.targetId);
        report.status = body.status;
        report.reviewedAt = now();
        report.reviewedBy = user.id;
        const entry = {
          id: randomUUID(), actorId: user.id, actorUsername: user.username,
          action: `report_${body.status}`, reportId: report.id,
          reporterId: reporter?.id || '', targetId: report.targetId,
          targetUsername: target?.username || 'Unknown player', createdAt: now()
        };
        db.adminAuditLog.push(entry);
        if (db.adminAuditLog.length > 1000) db.adminAuditLog.splice(0, db.adminAuditLog.length - 1000);
        dirty = true;
        await persist();
        send(response, 200, { report: { id: report.id, status: report.status, reviewedAt: report.reviewedAt }, audit: entry }); return;
      }
      if (path === '/api/admin/audit' && request.method === 'GET') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        send(response, 200, { entries: db.adminAuditLog.slice(-100).reverse() }); return;
      }
      if (path === '/api/admin/overview' && request.method === 'GET') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        const allReports = db.users.flatMap(peer => peer.jobState?.reports || []);
        const openReports = allReports.filter(report => report.status === 'open').length;
        const walletTotal = db.users.reduce((sum, peer) => sum + Math.max(0, Number(peer.wallet) || 0), 0);
        const bankTotal = db.users.reduce((sum, peer) => sum + Math.max(0, Number(peer.jobState?.bank?.balance) || 0), 0);
        const activeJobs = db.users.filter(peer => peer.jobState?.active).length;
        send(response, 200, {
          generatedAt: now(),
          players: { total: db.users.length, online: presence.size },
          moderation: { reportsTotal: allReports.length, reportsOpen: openReports },
          economy: { walletTotal, bankTotal, combinedMoney: walletTotal + bankTotal },
          activity: { activeJobs },
          world: { configuredAlerts: configuredWorldAlerts.length },
          audit: { entries: db.adminAuditLog.length },
        }); return;
      }
      const adminModerationMatch = path.match(/^\/api\/admin\/players\/([^/]+)\/(warn|mute)$/);
      if (adminModerationMatch && request.method === 'POST') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        limited(`admin-action:${user.id}`, 30, 60000);
        const target = findUser(decodeURIComponent(adminModerationMatch[1]));
        requireValue(target, 404, 'Player not found.');
        requireValue(target.id !== user.id, 400, 'You cannot moderate your own account.');
        const body = await jsonBody(request);
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        requireValue(reason.length >= 3 && reason.length <= 240, 400, 'Moderation reason must be 3–240 characters.');
        if (!target.moderation || typeof target.moderation !== 'object') target.moderation = { warnings: [], mutedUntil: 0 };
        if (!Array.isArray(target.moderation.warnings)) target.moderation.warnings = [];
        const action = adminModerationMatch[2];
        let mutedUntil = Number(target.moderation.mutedUntil || 0);
        if (action === 'warn') {
          target.moderation.warnings.push({ id: randomUUID(), reason, actorId: user.id, createdAt: now() });
          target.moderation.warnings = target.moderation.warnings.slice(-50);
          addNotification(target, { sourceKey: `moderation:warning:${now()}`, kind: 'security', title: 'Admin warning', message: reason, severity: 'warning' });
        } else {
          const durationMinutes = Number(body.durationMinutes);
          requireValue(Number.isInteger(durationMinutes) && [15, 60, 360, 1440].includes(durationMinutes), 400, 'Choose a supported mute duration.');
          mutedUntil = Math.max(now(), mutedUntil) + durationMinutes * 60000;
          target.moderation.mutedUntil = mutedUntil;
          addNotification(target, { sourceKey: `moderation:mute:${now()}`, kind: 'security', title: 'Communication muted', message: `${reason} · Until ${new Date(mutedUntil).toISOString()}`, severity: 'warning' });
        }
        const entry = { id: randomUUID(), actorId: user.id, actorUsername: user.username, action: `player_${action}`, targetId: target.id, targetUsername: target.username, reason, mutedUntil: action === 'mute' ? mutedUntil : 0, createdAt: now() };
        db.adminAuditLog.push(entry);
        if (db.adminAuditLog.length > 1000) db.adminAuditLog.splice(0, db.adminAuditLog.length - 1000);
        dirty = true;
        await persist();
        send(response, 200, { ok: true, action, target: { id: target.id, username: target.username }, mutedUntil: action === 'mute' ? mutedUntil : 0 }); return;
      }
      if (path === '/api/admin/actions/note' && request.method === 'POST') {
        requireValue(adminAccounts.has(String(user.username || '').toLowerCase()), 403, 'Admin access required.');
        limited(`admin-action:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const note = typeof body.note === 'string' ? body.note.trim() : '';
        requireValue(note.length >= 3 && note.length <= 240, 400, 'Admin note must be 3–240 characters.');
        const entry = { id: randomUUID(), actorId: user.id, actorUsername: user.username, action: 'note', note, createdAt: now() };
        db.adminAuditLog.push(entry);
        if (db.adminAuditLog.length > 1000) db.adminAuditLog.splice(0, db.adminAuditLog.length - 1000);
        dirty = true;
        await persist();
        send(response, 201, { entry }); return;
      }
      if (path === '/api/auth/logout' && request.method === 'POST') {
        sessions.delete(session.key);
        dirty = true;
        for (const client of clients.get(user.id) || []) if (client.key === session.key) client.response.end();
        if (![...sessions.values()].some(item => item.id === user.id && item.expires > now())) presence.delete(user.id);
        response.setHeader('Set-Cookie', 'kp_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
        await persist();
        socialChanged(); send(response, 200, { ok: true }); return;
      }
      if (path === '/api/profile' && request.method === 'PATCH') {
        const body = await jsonBody(request);
        requireValue(body.district === undefined || Object.hasOwn(DISTRICTS, body.district), 400, 'Choose a valid Kerala district.');
        requireValue(body.gender === undefined || ['male', 'female', 'other'].includes(body.gender), 400, 'Choose a valid avatar.');
        requireValue(body.bio === undefined || (typeof body.bio === 'string' && body.bio.length <= 180), 400, 'Bio must be 180 characters or fewer.');
        requireValue(body.displayName === undefined || (typeof body.displayName === 'string' && /^[A-Za-z][A-Za-z '-]{1,39}$/.test(body.displayName.trim())), 400, 'Name must be 2–40 letters.');
        requireValue(body.username === undefined || (typeof body.username === 'string' && /^(?=.*[A-Za-z])[A-Za-z0-9_]{3,24}$/.test(body.username.trim())), 400, 'Username must be 3–24 characters and include at least one letter.');
        if (body.username !== undefined && body.username.trim().toLowerCase() !== user.username.toLowerCase()) {
          requireValue(now() - Number(user.usernameChangedAt || 0) >= 10 * 24 * 60 * 60 * 1000, 409, 'Username can be changed again after 10 days.');
          requireValue(!db.users.some(candidate => candidate.id !== user.id && candidate.username.toLowerCase() === body.username.trim().toLowerCase()), 409, 'That username is already taken.');
          user.username = body.username.trim();
          user.usernameChangedAt = now();
        }
        if (body.displayName !== undefined) { user.displayName = body.displayName.trim(); user.firstName = user.displayName; }
        if (body.district !== undefined) user.district = body.district;
        if (!user.worldDistrict || !DISTRICT_WORLD_CONFIG[user.worldDistrict]) user.worldDistrict = user.district;
        if (body.gender !== undefined) user.gender = body.gender;
        if (body.bio !== undefined) user.bio = body.bio.trim();
        await persist(); profileChanged(user); socialChanged();
        send(response, 200, { user: publicUser(user) }); return;
      }
      if (path === '/api/wallet' && request.method === 'GET') {
        send(response, 200, walletSummary(user)); return;
      }
      if (path === '/api/notifications' && request.method === 'GET') {
        send(response, 200, notificationsSummary(user)); return;
      }
      if (path === '/api/notifications/read' && request.method === 'POST') {
        limited(`notifications-read:${user.id}`, 80, 60000);
        const body = await jsonBody(request);
        const summary = notificationsSummary(user);
        const currentIds = new Set(summary.items.map(item => item.id));
        const notifications = jobStateFor(user).notifications;
        const timestamp = now();
        if (body.all === true) {
          for (const id of currentIds) notifications.read[id] = timestamp;
        } else {
          requireValue(typeof body.id === 'string' && currentIds.has(body.id), 404, 'Notification not found.');
          notifications.read[body.id] = timestamp;
        }
        const entries = Object.entries(notifications.read).slice(-200);
        notifications.read = Object.fromEntries(entries);
        dirty = true;
        await persist();
        send(response, 200, notificationsSummary(user)); return;
      }
      if (path === '/api/bank' && request.method === 'GET') {
        send(response, 200, bankSummary(user)); return;
      }
      if (path === '/api/bank/cash' && request.method === 'POST') {
        limited(`bank-cash:${user.id}`, 40, 60000);
        const body = await jsonBody(request);
        requireValue(body.action === 'deposit' || body.action === 'withdraw', 400, 'Choose deposit or withdraw.');
        const amount = Number(body.amount);
        requireValue(Number.isInteger(amount) && amount >= 1 && amount <= BANK_TRANSFER_MAX, 400, `Amount must be between ₹1 and ₹${BANK_TRANSFER_MAX}.`);
        const state = jobStateFor(user);
        let walletEntry, bankEntry;
        if (body.action === 'deposit') {
          requireValue(Number(state.bank.balance) + amount <= BANK_LIMIT, 409, 'Bank account limit reached.');
          walletEntry = walletTransaction(user, -amount, 'bank_deposit', 'Deposit to Kerala Bank');
          bankEntry = bankTransaction(user, amount, 'cash_deposit', 'Wallet → Kerala Bank');
        } else {
          requireValue(Number(state.bank.balance) >= amount, 409, 'Not enough money in your Kerala Bank account.');
          requireValue(user.walletBalance + amount <= WALLET_LIMIT, 409, 'Wallet limit reached.');
          bankEntry = bankTransaction(user, -amount, 'cash_withdrawal', 'Kerala Bank → Wallet');
          walletEntry = walletTransaction(user, amount, 'bank_withdrawal', 'Withdraw from Kerala Bank');
        }
        await persist();
        send(response, 200, {
          action: body.action,
          amount,
          bank: bankSummary(user),
          wallet: walletSummary(user),
          bankTransaction: bankEntry,
          walletTransaction: walletEntry,
        }); return;
      }
      if (path === '/api/bank/upi' && request.method === 'POST') {
        limited(`bank-upi:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const amount = Number(body.amount);
        requireValue(Number.isInteger(amount) && amount >= 1 && amount <= BANK_TRANSFER_MAX, 400, `UPI amount must be between ₹1 and ₹${BANK_TRANSFER_MAX}.`);
        const rawRecipient = typeof body.recipient === 'string' ? body.recipient.trim().toLowerCase() : '';
        const handle = rawRecipient.replace(/@keralapay$/i, '');
        requireValue(/^(?=.*[a-z])[a-z0-9_]{3,24}$/.test(handle), 400, 'Enter a valid Kerala Pay username or UPI ID.');
        const recipient = db.users.find(candidate => candidate.username.toLowerCase() === handle);
        requireValue(recipient, 404, 'Kerala Pay recipient not found.');
        requireValue(recipient.id !== user.id, 409, 'You cannot send UPI to yourself.');
        requireValue(!blocked(user.id, recipient.id), 403, 'UPI transfer is unavailable between blocked players.');
        const senderBank = jobStateFor(user).bank;
        const recipientBank = jobStateFor(recipient).bank;
        requireValue(Number(senderBank.balance) >= amount, 409, 'Not enough money in your Kerala Bank account.');
        requireValue(Number(recipientBank.balance) + amount <= BANK_LIMIT, 409, 'Recipient bank account limit reached.');
        const transferId = randomUUID();
        const recipientUpi = bankUpiId(recipient);
        const senderUpi = bankUpiId(user);
        const sent = bankTransaction(user, -amount, 'upi_sent', `UPI to ${recipientUpi}`, {
          transferId, counterparty: recipientUpi,
        });
        const received = bankTransaction(recipient, amount, 'upi_received', `UPI from ${senderUpi}`, {
          transferId, counterparty: senderUpi,
        });
        addNotification(recipient, {
          sourceKey: `upi:${transferId}:received`,
          kind: 'money',
          title: 'UPI received',
          message: `₹${amount} received from ${senderUpi} in Kerala Bank.`,
          severity: 'success',
          target: 'wallet',
        });
        await persist();
        emit(recipient.id, 'bank', {});
        send(response, 200, {
          amount,
          transferId,
          recipient: { username: recipient.username, upiId: recipientUpi },
          bank: bankSummary(user),
          transaction: sent,
          receivedTransactionId: received.id,
        }); return;
      }
      if (path === '/api/community/events' && request.method === 'GET') {
        send(response, 200, communityEventsSummary(user)); return;
      }
      if (path === '/api/community/events/participate' && request.method === 'POST') {
        limited(`community-event:${user.id}`, 10, 60000);
        const body = await jsonBody(request);
        const timestamp = now();
        const summary = communityEventsSummary(user, timestamp);
        const event = summary.current;
        requireValue(event?.status === 'active', 409, 'This community event is not active right now.');
        requireValue(typeof body.eventId === 'string' && body.eventId === event.id, 409, 'This community event has changed. Refresh the notice board.');
        const state = jobStateFor(user);
        requireValue(!state.communityEvents.completedIds.includes(event.id), 409, 'You already participated in this event.');
        requireValue(!state.active, 409, 'Finish your active job before joining a community event.');
        requireValue(!state.npcFavors.active, 409, 'Finish your current village favor before joining a community event.');
        const personal = state.garage.activeVehicleId
          ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId)
          : null;
        requireValue(!personal?.entered, 409, 'Exit your personal vehicle before participating.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before participating.');
        requireValue(
          Math.hypot(Number(event.target.x) - live.x, Number(event.target.z) - live.z) <= Number(event.target.radius || 6) + .4,
          409,
          `Move closer to ${event.target.label} to join this community event.`
        );

        const cashReward = Math.max(0, Math.min(200, Math.floor(Number(event.cashReward || 0))));
        const pointsReward = Math.max(0, Math.min(50, Math.floor(Number(event.pointsReward || 0))));
        const transaction = walletTransaction(user, cashReward, 'community_event', event.title);
        user.points = Math.max(0, Number(user.points || 0) + pointsReward);
        state.communityEvents.completedIds.push(event.id);
        state.communityEvents.completedIds = state.communityEvents.completedIds.slice(-COMMUNITY_EVENT_HISTORY_LIMIT);
        state.communityEvents.contributions = Math.max(0, Number(state.communityEvents.contributions || 0)) + 1;
        dirty = true;
        addNotification(user, {
          sourceKey: `community:${event.id}`,
          kind: 'event',
          title: 'Community event completed',
          message: `${event.title} · ₹${cashReward} + ${pointsReward} points received.`,
          severity: 'success',
          target: 'events',
        });
        await persist();
        profileChanged(user);
        const updated = communityEventsSummary(user, timestamp);
        send(response, 200, {
          completed: {
            id: event.id,
            title: event.title,
            cashReward,
            pointsReward,
            target: event.target,
          },
          wallet: walletSummary(user),
          user: publicUser(user),
          reputation: updated.reputation,
          events: updated,
          transaction,
        }); return;
      }

      if (path === '/api/npc/relationships' && request.method === 'GET') {
        send(response, 200, npcRelationshipSummary(user)); return;
      }
      if (path === '/api/npc/interact' && request.method === 'POST') {
        limited(`npc-interact:${user.id}`, 35, 60000);
        const body = await jsonBody(request);
        const identity = npcRelationshipIdentity(body.npcId);
        requireValue(identity, 404, 'Village NPC not found.');
        const state = jobStateFor(user);
        const personal = state.garage.activeVehicleId
          ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId)
          : null;
        requireValue(!state.active?.vehicleEntered && !personal?.entered, 409, 'Exit the vehicle before talking to someone.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before talking to someone.');

        const timestamp = now();
        const relation = state.npcRelations[identity.id] || {
          score: 0,
          conversations: 0,
          lastInteractionAt: 0,
          firstMetAt: timestamp,
        };
        const previousTier = npcRelationshipTier(relation.score);
        const elapsed = timestamp - Number(relation.lastInteractionAt || 0);
        const progressed = elapsed >= NPC_RELATIONSHIP_COOLDOWN_MS;
        let gained = 0;
        if (progressed) {
          gained = Number(relation.conversations || 0) === 0 ? 5 : (elapsed >= 5 * 60_000 ? 2 : 1);
          relation.score = Math.min(NPC_RELATIONSHIP_MAX, Number(relation.score || 0) + gained);
          relation.lastInteractionAt = timestamp;
        }
        relation.conversations = Math.min(100000, Number(relation.conversations || 0) + 1);
        if (!Number(relation.firstMetAt)) relation.firstMetAt = timestamp;
        state.npcRelations[identity.id] = relation;
        dirty = true;
        await persist();

        const tier = npcRelationshipTier(relation.score);
        const summary = npcRelationshipSummary(user);
        send(response, 200, {
          relationship: {
            npcId: identity.id,
            npcIndex: identity.index,
            name: identity.name,
            score: relation.score,
            tier,
            conversations: relation.conversations,
            firstMetAt: relation.firstMetAt,
            lastInteractionAt: relation.lastInteractionAt,
            gained,
            progressed,
            tierChanged: tier !== previousTier,
            previousTier,
            cooldownRemainingMs: progressed ? NPC_RELATIONSHIP_COOLDOWN_MS : Math.max(0, NPC_RELATIONSHIP_COOLDOWN_MS - elapsed),
            recognition: npcRecognitionMessage(tier, identity.name),
          },
          reputation: summary.reputation,
          activeFavor: summary.activeFavor,
          favorOffer: npcFavorOffer(user, identity, timestamp),
        }); return;
      }

      if (path === '/api/npc/favor/start' && request.method === 'POST') {
        limited(`npc-favor-start:${user.id}`, 12, 60000);
        const body = await jsonBody(request);
        const identity = npcRelationshipIdentity(body.npcId);
        requireValue(identity, 404, 'Village NPC not found.');
        const state = jobStateFor(user);
        requireValue(!state.active, 409, 'Finish your active job before accepting a village favor.');
        requireValue(!state.npcFavors.active, 409, 'Finish your current village favor first.');
        const relation = state.npcRelations[identity.id];
        requireValue(Number(relation?.score || 0) >= NPC_FAVOR_MIN_SCORE, 409, 'Build a little more familiarity with this villager first.');
        const timestamp = now();
        requireValue(timestamp - Number(relation?.lastInteractionAt || 0) <= 90_000, 409, 'Talk to this villager again before accepting the favor.');
        const cooldownUntil = Number(state.npcFavors.cooldowns[identity.id] || 0);
        requireValue(cooldownUntil <= timestamp, 409, 'This villager does not need another favor yet.');
        const personal = state.garage.activeVehicleId
          ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId)
          : null;
        requireValue(!personal?.entered, 409, 'Exit your personal vehicle before accepting a favor.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before accepting a favor.');

        const definition = npcFavorDefinition(user, identity);
        const activeFavor = {
          id: randomUUID(),
          npcId: identity.id,
          targetId: definition.target.id,
          title: definition.title,
          action: definition.action,
          reward: definition.reward,
          startedAt: timestamp,
          expiresAt: timestamp + NPC_FAVOR_EXPIRY_MS,
        };
        state.npcFavors.active = activeFavor;
        dirty = true;
        await persist();
        send(response, 200, {
          activeFavor: npcFavorSummary(user),
          reputation: npcRelationshipSummary(user).reputation,
        }); return;
      }

      if (path === '/api/npc/favor/complete' && request.method === 'POST') {
        limited(`npc-favor-complete:${user.id}`, 12, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const activeFavor = state.npcFavors.active;
        requireValue(activeFavor, 409, 'No village favor is active.');
        requireValue(typeof body.favorId === 'string' && body.favorId === activeFavor.id, 409, 'This village favor is no longer active.');
        const timestamp = now();
        requireValue(timestamp <= Number(activeFavor.expiresAt || 0), 409, 'This favor expired. Talk to the villager again later.');
        const identity = npcRelationshipIdentity(activeFavor.npcId);
        const target = PUBLIC_RIDE_DESTINATIONS[activeFavor.targetId];
        requireValue(identity && target, 409, 'This favor is no longer available.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before completing the favor.');
        requireValue(
          Math.hypot(Number(target.x) - live.x, Number(target.z) - live.z) <= 5.8,
          409,
          `Move closer to ${target.label} before completing the favor.`
        );

        const reward = Math.max(0, Math.min(200, Number(activeFavor.reward || 0)));
        const transaction = walletTransaction(user, reward, 'npc_favor', `${identity.name} · ${activeFavor.title}`);
        const relation = state.npcRelations[identity.id] || {
          score: 0, conversations: 0, lastInteractionAt: timestamp, firstMetAt: timestamp,
        };
        const previousTier = npcRelationshipTier(relation.score);
        relation.score = Math.min(NPC_RELATIONSHIP_MAX, Number(relation.score || 0) + 3);
        relation.lastInteractionAt = timestamp;
        state.npcRelations[identity.id] = relation;
        state.npcFavors.active = null;
        state.npcFavors.cooldowns[identity.id] = timestamp + NPC_FAVOR_COOLDOWN_MS;
        state.npcFavors.completed = Math.max(0, Number(state.npcFavors.completed || 0)) + 1;
        dirty = true;
        const tier = npcRelationshipTier(relation.score);
        addNotification(user, {
          sourceKey: `favor:${transaction.id}`,
          kind: 'community',
          title: 'Village favor completed',
          message: `${identity.name} · ${activeFavor.title} · ₹${reward} received.`,
          severity: 'success',
          target: 'wallet',
        });
        await persist();
        const summary = npcRelationshipSummary(user);
        send(response, 200, {
          completed: {
            id: activeFavor.id,
            npcId: identity.id,
            npcName: identity.name,
            title: activeFavor.title,
            target: { id: target.id, label: target.label },
            reward,
          },
          relationship: {
            npcId: identity.id,
            npcIndex: identity.index,
            name: identity.name,
            score: relation.score,
            tier,
            conversations: Number(relation.conversations || 0),
            firstMetAt: Number(relation.firstMetAt || 0),
            lastInteractionAt: Number(relation.lastInteractionAt || 0),
            gained: 3,
            progressed: true,
            tierChanged: tier !== previousTier,
            previousTier,
            recognition: npcRecognitionMessage(tier, identity.name),
          },
          reputation: summary.reputation,
          activeFavor: null,
          wallet: walletSummary(user),
          transaction,
        }); return;
      }

      if (path === '/api/travel/ride/quote' && request.method === 'GET') {
        limited(`ride-quote:${user.id}`, 40, 60000);
        const destinationId = String(url.searchParams.get('destinationId') || '');
        send(response, 200, publicRideQuote(user, destinationId)); return;
      }
      if (path === '/api/travel/ride/book' && request.method === 'POST') {
        limited(`ride-book:${user.id}`, 10, 60000);
        const body = await jsonBody(request);
        const destinationId = typeof body.destinationId === 'string' ? body.destinationId : '';
        const serviceId = typeof body.serviceId === 'string' ? body.serviceId : '';
        const service = PUBLIC_RIDE_SERVICES[serviceId];
        requireValue(service, 400, 'Choose auto-rickshaw or taxi.');
        const quote = publicRideQuote(user, destinationId);
        const option = quote.options.find(item => item.id === serviceId);
        requireValue(option?.available, 409, serviceId === 'auto' ? 'Auto-rickshaw is for shorter local trips. Choose taxi for this destination.' : 'This ride is not available.');
        requireValue(user.walletBalance >= option.fare, 409, 'Not enough Kerala Cash for this ride.');
        const destination = PUBLIC_RIDE_DESTINATIONS[destinationId];
        const live = presence.get(user.id) || place(user);
        const transaction = walletTransaction(user, -option.fare, 'public_ride', `${service.label} · ${destination.label}`);
        const timestamp = now();
        live.x = Number(destination.arrivalX);
        live.z = Number(destination.arrivalZ);
        live.rotation = 0;
        live.moving = false;
        live.mode = 'walk';
        live.lastSeen = timestamp;
        live.movedAt = timestamp;
        live.movementCredit = 12;
        user.worldX = live.x;
        user.worldZ = live.z;
        user.worldRotation = live.rotation;
        user.worldUpdatedAt = timestamp;
        dirty = true;
        worldDirty = true;
        profileChanged(user);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user),
          user: publicUser(user),
          transaction,
          ride: {
            serviceId,
            serviceLabel: service.label,
            fare: option.fare,
            pickupSeconds: option.pickupSeconds,
            travelSeconds: option.travelSeconds,
            fromDistance: quote.distance,
            to: { id: destination.id, label: destination.label },
            x: live.x,
            z: live.z,
            rotation: live.rotation,
          },
        }); return;
      }

      if (path === '/api/travel/districts' && request.method === 'GET') {
        const currentDistrict = currentWorldDistrict(user);
        const current = districtWorldConfig(currentDistrict);
        send(response, 200, {
          currentDistrict,
          districts: DISTRICT_WORLD_ORDER.map(district => {
            const config = DISTRICT_WORLD_CONFIG[district];
            return {
              district,
              order: config.order,
              train: { available: true, id: config.train.id },
              flight: { available: !!config.airport, id: config.airport?.id || null },
              current: district === currentDistrict,
            };
          }),
          hubs: {
            train: { ...current.train, district: currentDistrict, label: `${currentDistrict} Railway Station` },
            airport: current.airport ? { ...current.airport, district: currentDistrict, label: `${currentDistrict} Airport` } : null,
          },
        }); return;
      }
      if (path === '/api/travel/district/board' && request.method === 'POST') {
        limited(`district-board:${user.id}`, 10, 60000);
        const body = await jsonBody(request);
        const mode = body.mode === 'flight' ? 'flight' : 'train';
        const fromDistrict = currentWorldDistrict(user);
        const destinationDistrict = String(body.destinationDistrict || '');
        requireValue(DISTRICT_WORLD_CONFIG[destinationDistrict], 404, 'Destination district not found.');
        requireValue(destinationDistrict !== fromDistrict, 409, 'You are already in that district.');
        const fromConfig = districtWorldConfig(fromDistrict);
        const destinationConfig = districtWorldConfig(destinationDistrict);
        const hub = mode === 'flight' ? fromConfig.airport : fromConfig.train;
        const destinationHub = mode === 'flight' ? destinationConfig.airport : destinationConfig.train;
        requireValue(hub && destinationHub, 409, mode === 'flight' ? 'Flights are only available between airport districts.' : 'Train travel is unavailable for this district.');
        const stateForTravel = jobStateFor(user);
        requireValue(!stateForTravel.active, 409, 'Finish your active job before inter-district travel.');
        const personal = stateForTravel.garage.activeVehicleId ? stateForTravel.garage.owned.find(vehicle => vehicle.id === stateForTravel.garage.activeVehicleId) : null;
        requireValue(!personal?.entered, 409, 'Park and exit your personal vehicle before travelling.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before travelling.');
        requireValue(Math.hypot(live.x - hub.x, live.z - hub.z) <= hub.radius, 409, `Move closer to the ${mode === 'flight' ? 'airport' : 'railway station'}.`);
        const fare = districtTravelFare(fromDistrict, destinationDistrict, mode);
        const transaction = walletTransaction(user, -fare, mode === 'flight' ? 'flight_fare' : 'train_fare', `${fromDistrict} → ${destinationDistrict}`);
        const timestamp = now();
        user.worldDistrict = destinationDistrict;
        live.district = destinationDistrict;
        live.x = Number(destinationHub.arrivalX);
        live.z = Number(destinationHub.arrivalZ);
        live.rotation = 0;
        live.moving = false;
        live.mode = 'walk';
        live.lastSeen = timestamp;
        live.movedAt = timestamp;
        live.movementCredit = 2;
        user.worldX = live.x;
        user.worldZ = live.z;
        user.worldRotation = 0;
        user.worldUpdatedAt = timestamp;
        dirty = true;
        worldDirty = true;
        profileChanged(user);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user),
          user: publicUser(user),
          transaction,
          travel: {
            mode,
            fare,
            from: { district: fromDistrict, hubId: hub.id },
            to: { district: destinationDistrict, hubId: destinationHub.id },
            x: live.x,
            z: live.z,
            rotation: live.rotation,
            district: destinationDistrict,
          },
        }); return;
      }
      if (path === '/api/travel/train/route' && request.method === 'GET') {
        send(response, 200, {
          id: DISTRICT_RAIL_ROUTE.id,
          label: DISTRICT_RAIL_ROUTE.label,
          fare: DISTRICT_RAIL_ROUTE.fare,
          stations: Object.values(DISTRICT_RAIL_ROUTE.stations).map(station => ({
            id: station.id, district: station.district, label: station.label, x: station.x, z: station.z,
            destinationId: station.destinationId,
          })),
        }); return;
      }
      if (path === '/api/travel/train/board' && request.method === 'POST') {
        limited(`train-board:${user.id}`, 10, 60000);
        const body = await jsonBody(request);
        const station = DISTRICT_RAIL_ROUTE.stations[String(body.stationId || '')];
        requireValue(station, 404, 'Railway station not found.');
        const destination = DISTRICT_RAIL_ROUTE.stations[station.destinationId];
        const stateForTravel = jobStateFor(user);
        requireValue(!stateForTravel.active, 409, 'Finish your active job before boarding the train.');
        const personal = stateForTravel.garage.activeVehicleId ? stateForTravel.garage.owned.find(vehicle => vehicle.id === stateForTravel.garage.activeVehicleId) : null;
        requireValue(!personal?.entered, 409, 'Park and exit your personal vehicle before boarding.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before boarding.');
        requireValue(Math.hypot(live.x - station.x, live.z - station.z) <= station.radius, 409, `Move closer to ${station.label}.`);
        const transaction = walletTransaction(user, -DISTRICT_RAIL_ROUTE.fare, 'train_fare', `${station.label} → ${destination.label}`);
        const timestamp = now();
        user.worldDistrict = destination.district;
        live.district = destination.district;
        live.x = station.arrivalX; live.z = station.arrivalZ; live.rotation = 0; live.moving = false; live.mode = 'walk';
        live.lastSeen = timestamp; live.movedAt = timestamp; live.movementCredit = 2;
        user.worldX = live.x; user.worldZ = live.z; user.worldRotation = 0; user.worldUpdatedAt = timestamp;
        dirty = true; worldDirty = true; profileChanged(user);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user), user: publicUser(user), transaction,
          travel: { routeId: DISTRICT_RAIL_ROUTE.id, routeLabel: DISTRICT_RAIL_ROUTE.label, fare: DISTRICT_RAIL_ROUTE.fare,
            from: { id: station.id, district: station.district, label: station.label },
            to: { id: destination.id, district: destination.district, label: destination.label },
            x: live.x, z: live.z, rotation: live.rotation },
        }); return;
      }
      if (path === '/api/travel/bus/status' && request.method === 'GET') {
        const stopId = String(url.searchParams.get('stopId') || '');
        const status = publicTravelStatus(stopId, now(), user);
        requireValue(status, 404, 'Bus stop not found.');
        send(response, 200, status); return;
      }
      if (path === '/api/travel/bus/board' && request.method === 'POST') {
        limited(`bus-board:${user.id}`, 12, 60000);
        const body = await jsonBody(request);
        const stopId = typeof body.stopId === 'string' ? body.stopId : '';
        const found = publicTravelStop(stopId, user);
        requireValue(found, 404, 'Bus stop not found.');
        const { route, stop } = found;
        const stateForTravel = jobStateFor(user);
        requireValue(!stateForTravel.active, 409, 'Finish your active job before boarding public transport.');
        const personal = stateForTravel.garage.activeVehicleId
          ? stateForTravel.garage.owned.find(vehicle => vehicle.id === stateForTravel.garage.activeVehicleId)
          : null;
        requireValue(!personal?.entered, 409, 'Park and exit your personal vehicle before boarding.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before boarding.');
        requireValue(
          Math.hypot(live.x - Number(stop.x), live.z - Number(stop.z)) <= Number(stop.radius || 6.2),
          409,
          `Move closer to ${stop.label}.`
        );
        const status = publicTravelStatus(stopId, now(), user);
        requireValue(status?.boarding, 409, `Bus has not arrived yet. Wait ${status?.secondsToArrival || 1}s.`);
        const destination = route.stops[stop.destinationId];
        const transaction = walletTransaction(user, -Number(route.fare), 'bus_fare', `${route.label} · ${stop.label} → ${destination.label}`);
        const timestamp = now();
        live.x = Number(destination.arrivalX);
        live.z = Number(destination.arrivalZ);
        live.rotation = Number(destination.arrivalRotation || 0);
        live.moving = false;
        live.mode = 'walk';
        live.lastSeen = timestamp;
        live.movedAt = timestamp;
        live.movementCredit = 2;
        user.worldX = live.x;
        user.worldZ = live.z;
        user.worldRotation = live.rotation;
        user.worldUpdatedAt = timestamp;
        dirty = true;
        worldDirty = true;
        profileChanged(user);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user),
          user: publicUser(user),
          transaction,
          travel: {
            routeId: route.id,
            routeLabel: route.label,
            fare: route.fare,
            from: { id: stop.id, label: stop.label },
            to: { id: destination.id, label: destination.label },
            x: live.x,
            z: live.z,
            rotation: live.rotation,
          },
          nextStopStatus: publicTravelStatus(destination.id, now(), user),
        }); return;
      }
      if (path === '/api/needs' && request.method === 'GET') {
        send(response, 200, needsSummary(user)); return;
      }
      if (path === '/api/home' && request.method === 'GET') {
        send(response, 200, homeSummary(user)); return;
      }
      if (path === '/api/home/pay' && request.method === 'POST') {
        limited(`home-payment:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        requireValue(body.kind === 'rent' || body.kind === 'utilities', 400, 'Choose rent or utilities.');
        const state = jobStateFor(user);
        const home = state.home;
        const homeDefinition = homeDefinitionFor(user);
        const isRent = body.kind === 'rent';
        const amount = isRent ? homeDefinition.rent : homeDefinition.utilities;
        const transaction = walletTransaction(
          user,
          -amount,
          isRent ? 'home_rent' : 'home_utilities',
          isRent ? `${homeDefinition.label} rent` : `${homeDefinition.label} electricity + water`
        );
        if (isRent) {
          home.rentDueAt = Math.max(now(), Number(home.rentDueAt) || 0) + homeDefinition.periodMs;
          home.rentPayments = Number(home.rentPayments || 0) + 1;
        } else {
          home.utilityDueAt = Math.max(now(), Number(home.utilityDueAt) || 0) + homeDefinition.periodMs;
          home.utilityPayments = Number(home.utilityPayments || 0) + 1;
        }
        dirty = true;
        await persist();
        send(response, 200, { home: homeSummary(user), wallet: walletSummary(user), payment: { kind: body.kind, amount }, transaction }); return;
      }
      if (path === '/api/home/sleep' && request.method === 'POST') {
        limited(`home-sleep:${user.id}`, 20, 60000);
        await jsonBody(request);
        const state = jobStateFor(user);
        requireValue(!state.active, 409, 'Finish your active job before sleeping.');
        const personal = state.garage.activeVehicleId ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId) : null;
        requireValue(!personal?.entered, 409, 'Park and exit your personal vehicle before sleeping.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before sleeping.');
        requireValue(!live.moving, 409, 'Stop moving before sleeping.');
        const homeDefinition = homeDefinitionFor(user);
        const nearLocalHome = Math.hypot(live.x - homeDefinition.x, live.z - homeDefinition.z) <= homeDefinition.radius;
        const nearLegacyHome = Math.hypot(live.x - HOME_DEFINITION.x, live.z - HOME_DEFINITION.z) <= HOME_DEFINITION.radius;
        requireValue(nearLocalHome || nearLegacyHome, 409, `Move closer to your ${homeDefinition.label}.`);
        const summary = homeSummary(user);
        requireValue(!summary.accessBlocked, 409, 'Home sleep access is paused. Pay overdue rent or utilities first.');
        const needsBefore = needsSummary(user);
        if (needsBefore.energy >= 99) {
          send(response, 200, { slept: false, message: 'Energy is already full.', home: summary, needs: needsBefore }); return;
        }
        const timestamp = now();
        requireValue(timestamp >= Number(state.home.lastSleepAt || 0) + HOME_SLEEP_COOLDOWN_MS, 409, 'Sleep is still cooling down.');
        const needs = state.needs;
        needs.energy = NEEDS_MAX;
        needs.hunger = Math.max(0, Number(needs.hunger) - HOME_SLEEP_HUNGER_COST);
        needs.thirst = Math.max(0, Number(needs.thirst) - HOME_SLEEP_THIRST_COST);
        needs.updatedAt = timestamp;
        state.home.lastSleepAt = timestamp;
        dirty = true;
        await persist();
        send(response, 200, {
          slept: true,
          restoredEnergy: 100,
          hungerCost: HOME_SLEEP_HUNGER_COST,
          thirstCost: HOME_SLEEP_THIRST_COST,
          home: homeSummary(user),
          needs: needsSummary(user),
        }); return;
      }
      if (path === '/api/world/emergency-help' && request.method === 'POST') {
        limited(`world-emergency-help:${user.id}`, 12, 60000);
        const body = await jsonBody(request);
        const requestedServiceKey = typeof body.pointId === 'string' ? body.pointId : body.service;
        const service = typeof requestedServiceKey === 'string' ? worldServicePointForUser(user, requestedServiceKey) : null;
        const serviceKey = service?.id || requestedServiceKey;
        requireValue(service, 400, 'Choose police or fire service.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before using the public help desk.');
        requireValue(Math.hypot(live.x - service.x, live.z - service.z) <= service.radius, 409, `Move closer to the ${service.label}.`);
        if (!user.worldServiceHelp || typeof user.worldServiceHelp !== 'object' || Array.isArray(user.worldServiceHelp)) user.worldServiceHelp = {};
        const timestamp = now();
        requireValue(timestamp >= Number(user.worldServiceHelp[serviceKey] || 0) + WORLD_SERVICE_HELP_COOLDOWN_MS, 409, 'This help desk request is still cooling down.');
        user.worldServiceHelp[serviceKey] = timestamp;
        user.emergencyResponses = Math.max(0, Number(user.emergencyResponses) || 0) + 1;
        dirty = true;
        addNotification(user, {
          sourceKey: `service-help:${serviceKey}:${Math.floor(timestamp / WORLD_SERVICE_HELP_COOLDOWN_MS)}`,
          kind: 'emergency',
          title: `${service.label} · help requested`,
          message: service.service === 'police' ? 'The public help desk has logged your request.' : 'The emergency response desk has logged your request.',
          severity: 'info',
          target: '',
        });
        const progression = syncRecognitionNotifications(user);
        await persist();
        send(response, 200, { accepted: true, service: service.service, pointId: serviceKey, label: service.label, emergencyResponses: user.emergencyResponses, progression }); return;
      }
      if (path === '/api/needs/clinic' && request.method === 'POST') {
        limited(`needs-clinic:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const clinic = clinicForUser(user, String(body.clinicId || 'community-clinic'));
        const state = jobStateFor(user);
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before visiting the clinic.');
        requireValue(Math.hypot(live.x - clinic.x, live.z - clinic.z) <= clinic.radius, 409, `Move closer to the ${clinic.label}.`);
        const timestamp = now();
        requireValue(timestamp >= Number(state.needs.lastClinicAt || 0) + CLINIC_COOLDOWN_MS, 409, 'Clinic care is still cooling down.');
        const transaction = walletTransaction(user, -clinic.fee, 'clinic_care', clinic.label);
        state.needs.energy = Math.min(NEEDS_MAX, Number(state.needs.energy) + clinic.energyRestore);
        state.needs.thirst = Math.min(NEEDS_MAX, Number(state.needs.thirst) + clinic.thirstRestore);
        state.needs.lastClinicAt = timestamp;
        state.needs.updatedAt = timestamp;
        dirty = true;
        await persist();
        send(response, 200, { treated: true, clinic: clinic.id, label: clinic.label, fee: clinic.fee, wallet: walletSummary(user), needs: needsSummary(user), transaction }); return;
      }
      if (path === '/api/needs/rest' && request.method === 'POST') {
        limited(`needs-rest:${user.id}`, 20, 60000);
        await jsonBody(request);
        const state = jobStateFor(user);
        const personal = state.garage.activeVehicleId ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId) : null;
        requireValue(!state.active?.vehicleEntered && !personal?.entered, 409, 'Park and exit the vehicle before resting.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before resting.');
        const restPoint = restPointFor(user);
        const nearLocalRest = Math.hypot(live.x - restPoint.x, live.z - restPoint.z) <= restPoint.radius;
        const nearLegacyRest = Math.hypot(live.x - NEEDS_REST_POINT.x, live.z - NEEDS_REST_POINT.z) <= NEEDS_REST_POINT.radius;
        requireValue(nearLocalRest || nearLegacyRest, 409, `Move closer to the ${restPoint.label}.`);
        const current = needsSummary(user);
        if (current.energy >= 99) {
          send(response, 200, { rested: false, message: 'Energy is already full.', needs: current }); return;
        }
        const needs = state.needs;
        const timestamp = now();
        requireValue(timestamp >= Number(needs.lastRestAt || 0) + NEEDS_REST_COOLDOWN_MS, 409, 'Rest is still cooling down.');
        needs.energy = Math.min(NEEDS_MAX, Number(needs.energy) + NEEDS_REST_ENERGY);
        needs.lastRestAt = timestamp;
        needs.updatedAt = timestamp;
        dirty = true;
        await persist();
        send(response, 200, { rested: true, restored: NEEDS_REST_ENERGY, needs: needsSummary(user) }); return;
      }
      if (path === '/api/jobs/starter-delivery/complete' && request.method === 'POST') {
        limited(`wallet-job:${user.id}`, 10, 60000);
        await jsonBody(request);
        requireValue(!user.economyActions.includes('starter-delivery'), 409, 'Starter Delivery salary was already claimed.');
        user.economyActions.push('starter-delivery');
        const transaction = walletTransaction(user, STARTER_JOB_REWARD, 'salary', 'Starter Delivery salary');
        addNotification(user, {
          sourceKey: `salary:${transaction.id}`,
          kind: 'money',
          title: 'Salary credited',
          message: `Starter Delivery · ₹${STARTER_JOB_REWARD} credited to Kerala Cash.`,
          severity: 'success',
          target: 'wallet',
        });
        await persist();
        send(response, 200, { wallet: walletSummary(user), reward: STARTER_JOB_REWARD, transaction }); return;
      }
      if (path === '/api/garage' && request.method === 'GET') {
        send(response, 200, garageSummary(user)); return;
      }
      if (path === '/api/traffic' && request.method === 'GET') {
        send(response, 200, trafficSummary(user)); return;
      }
      if (path === '/api/traffic/licence' && request.method === 'POST') {
        limited(`traffic-licence:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        requireValue(['learner', 'full', 'renew'].includes(body.action), 400, 'Choose learner, full or renew.');
        const state = jobStateFor(user);
        const licence = state.traffic.licence;
        let cost = 0;
        let transaction = null;
        if (body.action === 'learner') {
          requireValue(licence.type === 'none', 409, 'A driving licence already exists. Use upgrade or renew.');
          cost = DRIVING_LICENCE_COSTS.learner;
          licence.type = 'learner';
          licence.number = licence.number || licenceNumberFor(user);
          licence.issuedAt = now();
          licence.validUntil = now() + DRIVING_LICENCE_TERMS.learner;
        } else if (body.action === 'full') {
          requireValue(licence.type === 'learner' && Number(licence.validUntil) > now(), 409, 'An active Learner Permit is required before Full Licence upgrade.');
          cost = DRIVING_LICENCE_COSTS.full;
          transaction = walletTransaction(user, -cost, 'driving_licence', `Full Licence upgrade · ${licence.number}`);
          licence.type = 'full';
          licence.issuedAt = now();
          licence.validUntil = now() + DRIVING_LICENCE_TERMS.full;
        } else {
          requireValue(licence.type === 'learner' || licence.type === 'full', 409, 'Apply for a Learner Permit first.');
          cost = licence.type === 'full' ? DRIVING_LICENCE_COSTS.renew_full : DRIVING_LICENCE_COSTS.renew_learner;
          transaction = walletTransaction(user, -cost, 'driving_licence', `${licence.type === 'full' ? 'Full Licence' : 'Learner Permit'} renewal · ${licence.number}`);
          licence.validUntil = Math.max(now(), Number(licence.validUntil) || 0) + DRIVING_LICENCE_TERMS[licence.type];
          if (!Number(licence.issuedAt)) licence.issuedAt = now();
        }
        if (body.action === 'learner' && cost > 0) transaction = walletTransaction(user, -cost, 'driving_licence', `Learner Permit · ${licence.number}`);
        dirty = true;
        await persist();
        send(response, 200, {
          traffic: trafficSummary(user),
          wallet: walletSummary(user),
          licence: drivingLicenceSummary(user),
          action: body.action,
          cost,
          transaction,
        }); return;
      }
      if (path === '/api/traffic/checkpoint' && request.method === 'POST') {
        limited(`traffic-checkpoint:${user.id}`, 20, 60000);
        await jsonBody(request);
        const state = jobStateFor(user);
        const vehicle = state.garage.activeVehicleId ? state.garage.owned.find(item => item.id === state.garage.activeVehicleId) : null;
        requireValue(vehicle && vehicle.entered, 409, 'Enter your personal vehicle before document inspection.');
        const live = presence.get(user.id) || place(user);
        requireValue(!live.moving, 409, 'Stop the vehicle at the checkpoint.');
        requireValue(Math.hypot(live.x - TRAFFIC_CHECKPOINT.x, live.z - TRAFFIC_CHECKPOINT.z) <= TRAFFIC_CHECKPOINT.radius, 409, 'Move closer to the traffic checkpoint.');
        const insurance = vehicleInsuranceSummary(vehicle);
        const model = GARAGE_CATALOG[vehicle.modelId];
        const licence = drivingLicenceSummary(user);
        const licenceValid = licenceAllowsVehicle(user, model.kind);
        let result = 'clear', challan = null, created = false;
        const issued = [];
        if (!insurance.insuranceActive) {
          const createdResult = createTrafficChallan(user, vehicle, 'insurance_expired', 'checkpoint');
          challan = createdResult.challan;
          created = createdResult.created;
          issued.push(createdResult.challan);
          result = 'challan';
        } else if (!licenceValid) {
          const createdResult = createTrafficChallan(user, vehicle, 'licence_invalid', 'checkpoint', { licenceType: licence.type });
          challan = createdResult.challan;
          created = createdResult.created;
          issued.push(createdResult.challan);
          result = 'challan';
        }
        vehicle.lastDocumentCheckAt = now();
        dirty = true;
        await persist();
        send(response, 200, {
          inspection: {
            result,
            registration: vehicle.registration,
            rcValid: true,
            insuranceActive: insurance.insuranceActive,
            licenceValid,
            licence,
            challan,
            challans: issued,
            challanCreated: created,
            checkedAt: vehicle.lastDocumentCheckAt,
          },
          traffic: trafficSummary(user),
        }); return;
      }
      if (path === '/api/traffic/challan/pay' && request.method === 'POST') {
        limited(`traffic-payment:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const challan = state.traffic.challans.find(item => item.id === body.challanId);
        requireValue(challan, 404, 'Traffic challan not found.');
        requireValue(!Number(challan.paidAt), 409, 'This traffic challan is already paid.');
        const amount = Number(challan.amount);
        requireValue(Number.isInteger(amount) && amount > 0, 409, 'Traffic challan amount is invalid.');
        const transaction = walletTransaction(user, -amount, 'traffic_challan', challan.description || 'Kerala Play traffic challan');
        challan.paidAt = now();
        challan.transactionId = transaction.id;
        dirty = true;
        await persist();
        send(response, 200, { traffic: trafficSummary(user), wallet: walletSummary(user), challan: { ...challan, paid: true }, transaction }); return;
      }
      if (path === '/api/garage/market' && request.method === 'GET') {
        send(response, 200, usedMarketSummary(user)); return;
      }
      if (path === '/api/garage/insurance' && request.method === 'POST') {
        limited(`garage-insurance:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const vehicle = state.garage.owned.find(item => item.id === body.vehicleId);
        requireValue(vehicle, 404, 'Owned vehicle not found.');
        const model = GARAGE_CATALOG[vehicle.modelId];
        const cost = VEHICLE_INSURANCE_COST[model.kind];
        const transaction = walletTransaction(user, -cost, 'insurance', `${model.label} insurance · ${vehicle.registration}`);
        vehicle.insuranceUntil = Math.max(now(), Number(vehicle.insuranceUntil) || 0) + VEHICLE_INSURANCE_TERM;
        dirty = true;
        await persist();
        send(response, 200, { garage: garageSummary(user), wallet: walletSummary(user), insurance: { vehicleId: vehicle.id, registration: vehicle.registration, cost, insuranceUntil: vehicle.insuranceUntil }, transaction }); return;
      }
      if (path === '/api/garage/market/list' && request.method === 'POST') {
        limited(`garage-market-list:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const garage = state.garage;
        const vehicle = garage.owned.find(item => item.id === body.vehicleId);
        requireValue(vehicle, 404, 'Owned vehicle not found.');
        requireValue(garage.activeVehicleId !== vehicle.id && !vehicle.entered, 409, 'Store this vehicle before listing it for sale.');
        requireValue(!(Number(vehicle.salePrice) > 0), 409, 'This vehicle is already listed.');
        vehicle.salePrice = vehicleResaleValue(vehicle);
        vehicle.listedAt = now();
        if (garage.selectedId === vehicle.id) garage.selectedId = garage.owned.find(item => item.id !== vehicle.id && !(Number(item.salePrice) > 0))?.id || null;
        dirty = true;
        await persist();
        send(response, 200, { garage: garageSummary(user), market: usedMarketSummary(user), listing: { vehicleId: vehicle.id, price: vehicle.salePrice, registration: vehicle.registration } }); return;
      }
      if (path === '/api/garage/market/unlist' && request.method === 'POST') {
        limited(`garage-market-unlist:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const vehicle = state.garage.owned.find(item => item.id === body.vehicleId);
        requireValue(vehicle, 404, 'Owned vehicle not found.');
        requireValue(Number(vehicle.salePrice) > 0, 409, 'This vehicle is not listed.');
        vehicle.salePrice = 0;
        vehicle.listedAt = 0;
        if (!state.garage.selectedId) state.garage.selectedId = vehicle.id;
        dirty = true;
        await persist();
        send(response, 200, { garage: garageSummary(user), market: usedMarketSummary(user) }); return;
      }
      if (path === '/api/garage/market/buy' && request.method === 'POST') {
        limited(`garage-market-buy:${user.id}`, 15, 60000);
        const body = await jsonBody(request);
        let seller = null, vehicle = null;
        for (const owner of db.users) {
          const candidate = jobStateFor(owner).garage.owned.find(item => item.id === body.vehicleId && Number(item.salePrice) > 0);
          if (candidate) { seller = owner; vehicle = candidate; break; }
        }
        requireValue(seller && vehicle, 404, 'Used vehicle listing is no longer available.');
        requireValue(seller.id !== user.id, 409, 'You already own this vehicle.');
        const buyerState = jobStateFor(user);
        const sellerState = jobStateFor(seller);
        requireValue(!buyerState.garage.owned.some(item => item.modelId === vehicle.modelId), 409, 'You already own this vehicle model.');
        requireValue(sellerState.garage.activeVehicleId !== vehicle.id && !vehicle.entered, 409, 'Seller vehicle is not available for transfer.');
        const price = Number(vehicle.salePrice);
        requireValue(Number.isInteger(price) && price > 0, 409, 'Used vehicle price is invalid.');
        requireValue(user.walletBalance >= price, 409, 'Not enough Kerala Cash.');
        requireValue(seller.walletBalance + price <= WALLET_LIMIT, 409, 'Seller wallet cannot receive this payment right now.');
        const model = GARAGE_CATALOG[vehicle.modelId];
        const buyerTransaction = walletTransaction(user, -price, 'used_vehicle_purchase', `${model.label} used purchase · ${vehicle.registration}`);
        const sellerTransaction = walletTransaction(seller, price, 'used_vehicle_sale', `${model.label} sold · ${vehicle.registration}`);
        addNotification(seller, {
          sourceKey: `vehicle-sale:${sellerTransaction.id}`,
          kind: 'market',
          title: 'Vehicle sold',
          message: `${model.label} · ${vehicle.registration} sold for ₹${price}.`,
          severity: 'success',
          target: 'wallet',
        });
        sellerState.garage.owned = sellerState.garage.owned.filter(item => item.id !== vehicle.id);
        if (sellerState.garage.selectedId === vehicle.id) sellerState.garage.selectedId = sellerState.garage.owned.find(item => !(Number(item.salePrice) > 0))?.id || null;
        vehicle.salePrice = 0;
        vehicle.listedAt = 0;
        vehicle.entered = false;
        vehicle.ownerChanges = (Number(vehicle.ownerChanges) || 0) + 1;
        vehicle.lastTransferAt = now();
        const buyerPosition = jobPosition(user);
        vehicle.parkedX = buyerPosition.x;
        vehicle.parkedZ = buyerPosition.z;
        buyerState.garage.owned.push(vehicle);
        if (!buyerState.garage.selectedId) buyerState.garage.selectedId = vehicle.id;
        dirty = true;
        await persist();
        send(response, 200, {
          garage: garageSummary(user),
          market: usedMarketSummary(user),
          wallet: walletSummary(user),
          purchase: { vehicleId: vehicle.id, label: model.label, registration: vehicle.registration, price, previousOwner: seller.displayName || seller.username },
          transaction: buyerTransaction,
          sellerTransactionId: sellerTransaction.id,
        }); return;
      }
      if (path === '/api/garage/buy' && request.method === 'POST') {
        limited(`garage-buy:${user.id}`, 10, 60000);
        const body = await jsonBody(request);
        const model = GARAGE_CATALOG[body.modelId];
        requireValue(model, 404, 'Vehicle model not found.');
        const state = jobStateFor(user);
        requireValue(!state.garage.owned.some(vehicle => vehicle.modelId === model.id), 409, 'You already own this vehicle model.');
        const transaction = walletTransaction(user, -model.price, 'vehicle_purchase', `${model.label} purchase`);
        const position = jobPosition(user);
        const vehicle = {
          id: randomUUID(),
          modelId: model.id,
          fuel: VEHICLE_FUEL_MAX,
          condition: VEHICLE_CONDITION_MAX,
          parkedX: position.x,
          parkedZ: position.z,
          entered: false,
          lastImpactAt: 0,
          registration: registrationNumberFor(user),
          insuranceUntil: now() + VEHICLE_INSURANCE_TERM,
          listedAt: 0,
          salePrice: 0,
          ownerChanges: 0,
          purchasedAt: now(),
        };
        state.garage.owned.push(vehicle);
        if (!state.garage.selectedId) state.garage.selectedId = vehicle.id;
        dirty = true;
        await persist();
        send(response, 201, { garage: garageSummary(user), wallet: walletSummary(user), purchase: { modelId: model.id, label: model.label, price: model.price }, transaction }); return;
      }
      if (path === '/api/garage/select' && request.method === 'POST') {
        limited(`garage-select:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        requireValue(!state.garage.activeVehicleId, 409, 'Store the active personal vehicle before selecting another one.');
        const vehicle = state.garage.owned.find(item => item.id === body.vehicleId);
        requireValue(vehicle, 404, 'Owned vehicle not found.');
        requireValue(!(Number(vehicle.salePrice) > 0), 409, 'Remove this vehicle from the Used Market before selecting it.');
        state.garage.selectedId = vehicle.id;
        dirty = true;
        await persist();
        send(response, 200, { garage: garageSummary(user) }); return;
      }
      if (path === '/api/garage/vehicle' && request.method === 'POST') {
        limited(`garage-vehicle:${user.id}`, 50, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const garage = state.garage;
        requireValue(['retrieve', 'store', 'enter', 'exit'].includes(body.action), 400, 'Choose retrieve, store, enter or exit.');
        const live = presence.get(user.id) || place(user);
        const position = jobPosition(user);
        if (body.action === 'retrieve') {
          requireValue(!state.active, 409, 'Finish your active job before retrieving a personal vehicle.');
          requireValue(!garage.activeVehicleId, 409, 'A personal vehicle is already outside the garage.');
          const vehicle = garage.owned.find(item => item.id === (body.vehicleId || garage.selectedId));
          requireValue(vehicle, 404, 'Select an owned vehicle first.');
          requireValue(!(Number(vehicle.salePrice) > 0), 409, 'Remove this vehicle from the Used Market before retrieving it.');
          garage.selectedId = vehicle.id;
          garage.activeVehicleId = vehicle.id;
          vehicle.entered = false;
          vehicle.parkedX = missionCoordinateFor(user, position.x, 2.8, 'x');
          vehicle.parkedZ = missionCoordinateFor(user, position.z, 1.5, 'z');
        } else {
          const vehicle = garage.activeVehicleId ? garage.owned.find(item => item.id === garage.activeVehicleId) : null;
          requireValue(vehicle, 409, 'No personal vehicle is outside the garage.');
          const model = GARAGE_CATALOG[vehicle.modelId];
          if (body.action === 'store') {
            requireValue(!vehicle.entered, 409, 'Park and exit the vehicle before storing it.');
            garage.activeVehicleId = null;
          } else if (body.action === 'enter') {
            requireValue(!state.active, 409, 'Personal vehicles are unavailable during a job.');
            requireValue(!vehicle.entered, 409, 'You are already in this vehicle.');
            requireValue(Math.hypot(Number(vehicle.parkedX) - position.x, Number(vehicle.parkedZ) - position.z) <= PERSONAL_VEHICLE_RADIUS, 409, `Move closer to the ${model.label} before entering.`);
            vehicle.entered = true;
            live.mode = model.kind;
            live.movementCredit = Math.max(live.movementCredit, 4);
          } else {
            requireValue(vehicle.entered, 409, 'You are not in this personal vehicle.');
            vehicle.entered = false;
            vehicle.parkedX = position.x;
            vehicle.parkedZ = position.z;
            live.mode = 'walk';
            live.movementCredit = Math.min(live.movementCredit, 2);
          }
        }
        dirty = true;
        await persist();
        send(response, 200, { garage: garageSummary(user) }); return;
      }
      if (path === '/api/garage/vehicle/impact' && request.method === 'POST') {
        limited(`garage-impact:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const state = jobStateFor(user);
        const vehicle = state.garage.activeVehicleId ? state.garage.owned.find(item => item.id === state.garage.activeVehicleId) : null;
        requireValue(vehicle && vehicle.entered, 409, 'Enter your active personal vehicle first.');
        requireValue(body.vehicleId === vehicle.id, 409, 'Personal vehicle is out of sync.');
        const severity = Number(body.severity);
        requireValue(Number.isInteger(severity) && severity >= 1 && severity <= 3, 400, 'Invalid impact severity.');
        const timestamp = now();
        requireValue(timestamp - Number(vehicle.lastImpactAt || 0) >= 900, 409, 'Impact already registered.');
        vehicle.lastImpactAt = timestamp;
        const damage = [0, 2, 5, 9][severity];
        vehicle.condition = Math.max(15, Number(vehicle.condition) - damage);
        dirty = true;
        await persist();
        const summary = garageSummary(user);
        send(response, 200, { garage: summary, vehicle: summary.activeVehicle, damage }); return;
      }
      if (path === '/api/garage/vehicle/service' && request.method === 'POST') {
        limited(`garage-service:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        requireValue(body.action === 'refuel' || body.action === 'repair', 400, 'Choose refuel or repair.');
        const state = jobStateFor(user);
        const vehicle = state.garage.activeVehicleId ? state.garage.owned.find(item => item.id === state.garage.activeVehicleId) : null;
        requireValue(vehicle && vehicle.entered, 409, 'Enter your active personal vehicle first.');
        requireValue(body.vehicleId === vehicle.id, 409, 'Personal vehicle is out of sync.');
        const live = presence.get(user.id) || place(user);
        requireValue(!live.moving, 409, 'Stop the vehicle before using this service.');
        const station = nearestVehicleServiceStation(user, body.action === 'refuel' ? 'fuel' : 'service', live.x, live.z);
        requireValue(station && station.distance <= station.radius, 409, `Move closer to ${station?.label || 'the vehicle service point'}.`);
        const model = GARAGE_CATALOG[vehicle.modelId];
        const spec = VEHICLE_SPECS[model.kind];
        let amount, cost, description;
        if (body.action === 'refuel') {
          const missing = Math.max(0, VEHICLE_FUEL_MAX - Number(vehicle.fuel));
          requireValue(missing >= .5, 409, 'Fuel tank is already full.');
          amount = Math.ceil(missing * 10) / 10;
          cost = Math.max(1, Math.ceil(amount * spec.fuelPricePerPoint));
          description = `${model.label} fuel · ${amount.toFixed(1)} units`;
          vehicle.fuel = VEHICLE_FUEL_MAX;
        } else {
          const missing = Math.max(0, VEHICLE_CONDITION_MAX - Number(vehicle.condition));
          requireValue(missing >= 1, 409, 'Vehicle condition is already 100%.');
          amount = Math.ceil(missing);
          cost = Math.max(1, Math.ceil(amount * spec.repairPricePerPoint));
          description = `${model.label} repair · ${amount} condition`;
          vehicle.condition = VEHICLE_CONDITION_MAX;
        }
        const transaction = walletTransaction(user, -cost, body.action === 'refuel' ? 'fuel' : 'repair', description);
        dirty = true;
        await persist();
        const summary = garageSummary(user);
        send(response, 200, { garage: summary, wallet: walletSummary(user), vehicle: summary.activeVehicle, service: { action: body.action, amount, cost, station: station.label }, transaction }); return;
      }
      if (path === '/api/jobs' && request.method === 'GET') {
        send(response, 200, jobsSummary(user)); return;
      }
      const jobStartMatch = path.match(/^\/api\/jobs\/([^/]+)\/start$/);
      if (jobStartMatch && request.method === 'POST') {
        limited(`job-start:${user.id}`, 20, 60000);
        await jsonBody(request);
        const jobId = jobStartMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job, 404, 'Job not found.');
        const state = jobStateFor(user);
        requireValue(!state.active, 409, 'Finish your active job before starting another one.');
        requireValue(!state.garage.activeVehicleId, 409, 'Store your personal vehicle in GARAGE before starting a job.');
        const timestamp = now();
        const cooldownUntil = Number(state.cooldowns[jobId] || 0);
        requireValue(cooldownUntil <= timestamp, 409, 'This job is cooling down. Try again shortly.');
        const position = jobPosition(user);
        state.active = {
          taskId: randomUUID(),
          jobId,
          startedAt: timestamp,
          readyAt: 0,
          expiresAt: timestamp + JOB_EXPIRY_GRACE,
          phase: 'travel',
          stepIndex: 0,
          checkpoints: buildJobCheckpoints(user, jobId),
          vehicleEntered: false,
          vehicleX: job.vehicle ? missionCoordinateFor(user, position.x, 2.8, 'x') : null,
          vehicleZ: job.vehicle ? missionCoordinateFor(user, position.z, 1.5, 'z') : null,
          vehicleFuel: job.vehicle ? VEHICLE_FUEL_MAX : null,
          vehicleCondition: job.vehicle ? VEHICLE_CONDITION_MAX : null,
          vehicleLastImpactAt: 0,
        };
        await persist();
        const summary = jobsSummary(user);
        send(response, 201, { jobs: summary, active: summary.active }); return;
      }
      const jobVehicleMatch = path.match(/^\/api\/jobs\/([^/]+)\/vehicle$/);
      if (jobVehicleMatch && request.method === 'POST') {
        limited(`job-vehicle:${user.id}`, 40, 60000);
        const body = await jsonBody(request);
        const jobId = jobVehicleMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job?.vehicle, 404, 'This job does not use a vehicle.');
        const state = jobStateFor(user);
        const active = state.active;
        requireValue(active && active.jobId === jobId, 409, 'This job is not active.');
        requireValue(typeof body.taskId === 'string' && body.taskId === active.taskId, 409, 'This job task is no longer valid.');
        requireValue(body.action === 'enter' || body.action === 'exit', 400, 'Choose enter or exit.');
        const position = jobPosition(user);
        const live = presence.get(user.id) || place(user);
        if (body.action === 'enter') {
          requireValue(!active.vehicleEntered, 409, 'You are already in the job vehicle.');
          const vehicleX = Number(active.vehicleX), vehicleZ = Number(active.vehicleZ);
          requireValue(Number.isFinite(vehicleX) && Number.isFinite(vehicleZ), 409, 'Job vehicle is unavailable.');
          requireValue(Math.hypot(vehicleX - position.x, vehicleZ - position.z) <= JOB_VEHICLE_RADIUS, 409, `Move closer to the ${job.vehicleLabel} before entering.`);
          active.vehicleEntered = true;
          live.mode = job.vehicle;
          live.movementCredit = Math.max(live.movementCredit, 4);
        } else {
          requireValue(active.vehicleEntered, 409, 'You are not in the job vehicle.');
          active.vehicleEntered = false;
          active.vehicleX = position.x;
          active.vehicleZ = position.z;
          live.mode = 'walk';
          live.movementCredit = Math.min(live.movementCredit, 2);
        }
        dirty = true;
        await persist();
        const summary = jobsSummary(user);
        send(response, 200, { jobs: summary, active: summary.active }); return;
      }
      const jobVehicleImpactMatch = path.match(/^\/api\/jobs\/([^/]+)\/vehicle\/impact$/);
      if (jobVehicleImpactMatch && request.method === 'POST') {
        limited(`job-vehicle-impact:${user.id}`, 20, 60000);
        const body = await jsonBody(request);
        const jobId = jobVehicleImpactMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job?.vehicle, 404, 'This job does not use a vehicle.');
        const state = jobStateFor(user);
        const active = state.active;
        requireValue(active && active.jobId === jobId && active.vehicleEntered, 409, 'Enter the active job vehicle first.');
        requireValue(typeof body.taskId === 'string' && body.taskId === active.taskId, 409, 'This job task is no longer valid.');
        const severity = Number(body.severity);
        requireValue(Number.isInteger(severity) && severity >= 1 && severity <= 3, 400, 'Invalid impact severity.');
        const timestamp = now();
        requireValue(timestamp - Number(active.vehicleLastImpactAt || 0) >= 900, 409, 'Impact already registered.');
        active.vehicleLastImpactAt = timestamp;
        const damage = [0, 2, 5, 9][severity];
        active.vehicleCondition = Math.max(15, Number(active.vehicleCondition) - damage);
        dirty = true;
        await persist();
        const summary = jobsSummary(user);
        send(response, 200, { jobs: summary, active: summary.active, damage, vehicle: summary.active?.vehicle || null }); return;
      }

      const jobVehicleServiceMatch = path.match(/^\/api\/jobs\/([^/]+)\/vehicle\/service$/);
      if (jobVehicleServiceMatch && request.method === 'POST') {
        limited(`job-vehicle-service:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const jobId = jobVehicleServiceMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job?.vehicle, 404, 'This job does not use a vehicle.');
        const state = jobStateFor(user);
        const active = state.active;
        requireValue(active && active.jobId === jobId && active.vehicleEntered, 409, 'Enter the active job vehicle first.');
        requireValue(typeof body.taskId === 'string' && body.taskId === active.taskId, 409, 'This job task is no longer valid.');
        requireValue(body.action === 'refuel' || body.action === 'repair', 400, 'Choose refuel or repair.');
        const live = presence.get(user.id) || place(user);
        requireValue(!live.moving, 409, 'Stop the vehicle before using this service.');
        const station = nearestVehicleServiceStation(user, body.action === 'refuel' ? 'fuel' : 'service', live.x, live.z);
        requireValue(station && station.distance <= station.radius, 409, `Move closer to ${station?.label || 'the vehicle service point'}.`);
        const spec = VEHICLE_SPECS[job.vehicle];
        let amount, cost, description;
        if (body.action === 'refuel') {
          const missing = Math.max(0, VEHICLE_FUEL_MAX - Number(active.vehicleFuel));
          requireValue(missing >= .5, 409, 'Fuel tank is already full.');
          amount = Math.ceil(missing * 10) / 10;
          cost = Math.max(1, Math.ceil(amount * spec.fuelPricePerPoint));
          description = `${job.vehicleLabel} fuel · ${amount.toFixed(1)} units`;
          active.vehicleFuel = VEHICLE_FUEL_MAX;
        } else {
          const missing = Math.max(0, VEHICLE_CONDITION_MAX - Number(active.vehicleCondition));
          requireValue(missing >= 1, 409, 'Vehicle condition is already 100%.');
          amount = Math.ceil(missing);
          cost = Math.max(1, Math.ceil(amount * spec.repairPricePerPoint));
          description = `${job.vehicleLabel} repair · ${amount} condition`;
          active.vehicleCondition = VEHICLE_CONDITION_MAX;
        }
        const transaction = walletTransaction(user, -cost, body.action === 'refuel' ? 'fuel' : 'repair', description);
        dirty = true;
        await persist();
        const summary = jobsSummary(user);
        send(response, 200, { jobs: summary, wallet: walletSummary(user), active: summary.active, vehicle: summary.active?.vehicle || null, service: { action: body.action, amount, cost, station: station.label }, transaction }); return;
      }

      const jobCheckpointMatch = path.match(/^\/api\/jobs\/([^/]+)\/checkpoint$/);
      if (jobCheckpointMatch && request.method === 'POST') {
        limited(`job-checkpoint:${user.id}`, 40, 60000);
        const body = await jsonBody(request);
        const jobId = jobCheckpointMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job, 404, 'Job not found.');
        const state = jobStateFor(user);
        const active = state.active;
        requireValue(active && active.jobId === jobId, 409, 'This job is not active.');
        requireValue(typeof body.taskId === 'string' && body.taskId === active.taskId, 409, 'This job task is no longer valid.');
        requireValue(active.phase === 'travel', 409, active.phase === 'working' ? 'Your shift is already in progress.' : 'No mission checkpoint is waiting.');
        if (job.vehicle) requireValue(active.vehicleEntered, 409, `Enter the ${job.vehicleLabel} before continuing this job.`);
        const target = active.checkpoints[active.stepIndex];
        requireValue(target, 409, 'No mission checkpoint is waiting.');
        const position = jobPosition(user);
        const distance = Math.hypot(target.x - position.x, target.z - position.z);
        requireValue(distance <= JOB_MISSION_RADIUS, 409, `Move closer to ${target.name} before checking in.`);
        const timestamp = now();
        requireValue(timestamp <= Number(active.expiresAt), 409, 'This job task expired. Start a new one.');
        if (active.stepIndex < active.checkpoints.length - 1) {
          active.stepIndex += 1;
        } else if (job.missionType === 'shift') {
          active.phase = 'working';
          active.readyAt = timestamp + job.durationMs;
        } else {
          active.phase = 'ready';
          active.readyAt = timestamp;
        }
        dirty = true;
        await persist();
        const summary = jobsSummary(user);
        send(response, 200, { jobs: summary, active: summary.active, checkpoint: { name: target.name, action: target.action } }); return;
      }
      const jobCompleteMatch = path.match(/^\/api\/jobs\/([^/]+)\/complete$/);
      if (jobCompleteMatch && request.method === 'POST') {
        limited(`job-complete:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const jobId = jobCompleteMatch[1];
        const job = JOB_DEFINITIONS[jobId];
        requireValue(job, 404, 'Job not found.');
        const state = jobStateFor(user);
        const active = state.active;
        requireValue(active && active.jobId === jobId, 409, 'This job is not active.');
        requireValue(typeof body.taskId === 'string' && body.taskId === active.taskId, 409, 'This job task is no longer valid.');
        const timestamp = now();
        requireValue(timestamp <= Number(active.expiresAt), 409, 'This job task expired. Start a new one.');
        if (job.missionType === 'shift') {
          requireValue(active.phase === 'working', 409, 'Check in at the shop before starting your shift.');
          requireValue(timestamp >= Number(active.readyAt), 409, 'The job is still in progress.');
          const shop = active.checkpoints[active.checkpoints.length - 1];
          const position = jobPosition(user);
          requireValue(Math.hypot(shop.x - position.x, shop.z - position.z) <= JOB_MISSION_RADIUS, 409, 'Return to the village shop to complete your shift.');
        } else {
          requireValue(active.phase === 'ready', 409, 'Complete all mission checkpoints first.');
          if (job.vehicle) requireValue(active.vehicleEntered, 409, `Stay in the ${job.vehicleLabel} until the route is completed.`);
        }
        const live = presence.get(user.id);
        if (live) { live.mode = 'walk'; live.movementCredit = Math.min(live.movementCredit, 2); }
        state.active = null;
        state.cooldowns[jobId] = timestamp + job.cooldownMs;
        state.completed[jobId] = Math.max(0, Number(state.completed[jobId] || 0)) + 1;
        const transaction = walletTransaction(user, job.reward, 'salary', `${job.title} salary`);
        addNotification(user, {
          sourceKey: `salary:${transaction.id}`,
          kind: 'money',
          title: 'Salary credited',
          message: `${job.title} · ₹${job.reward} credited to Kerala Cash.`,
          severity: 'success',
          target: 'wallet',
        });
        await persist();
        send(response, 200, { jobs: jobsSummary(user), wallet: walletSummary(user), reward: job.reward, transaction, completed: { jobId, title: job.title, count: state.completed[jobId] } }); return;
      }
      if (path === '/api/world/shop/purchase' && request.method === 'POST') {
        limited(`world-shop:${user.id}`, 45, 60000);
        const body = await jsonBody(request);
        const shop = typeof body.shopId === 'string' ? worldShopForUser(user, body.shopId) : null;
        const item = typeof body.itemId === 'string' ? SHOP_ITEMS[body.itemId] : null;
        requireValue(shop, 404, 'World shop not found.');
        requireValue(item && shop.items.includes(body.itemId), 404, 'That item is not sold here.');
        requireValue(
          worldShopOpen(shop),
          409,
          `${shop.label} is closed. Opening hours: ${worldHourLabel(shop.openHour)}–${worldHourLabel(shop.closeHour)}.`
        );
        const state = jobStateFor(user);
        const personal = state.garage.activeVehicleId
          ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId)
          : null;
        requireValue(!state.active?.vehicleEntered && !personal?.entered, 409, 'Exit the vehicle before shopping.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before shopping.');
        requireValue(
          Math.hypot(live.x - shop.x, live.z - shop.z) <= shop.radius,
          409,
          `Move closer to ${shop.label}.`
        );
        const transaction = walletTransaction(user, -item.price, 'world_purchase', `${shop.label} · ${item.name}`);
        const needs = applyNeedsEffect(user, item.needs);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user),
          needs,
          shop: { id: shop.id, label: shop.label, openHour: shop.openHour, closeHour: shop.closeHour },
          purchase: { itemId: body.itemId, name: item.name, price: item.price, needs: item.needs },
          transaction,
        }); return;
      }
      if (path === '/api/shop/purchase' && request.method === 'POST') {
        limited(`wallet-shop:${user.id}`, 60, 60000);
        const body = await jsonBody(request);
        const item = typeof body.itemId === 'string' ? SHOP_ITEMS[body.itemId] : null;
        requireValue(item, 404, 'Shop item not found.');
        const transaction = walletTransaction(user, -item.price, 'purchase', item.name);
        const needs = applyNeedsEffect(user, item.needs);
        await persist();
        send(response, 200, {
          wallet: walletSummary(user),
          needs,
          purchase: { itemId: body.itemId, name: item.name, price: item.price, needs: item.needs },
          transaction,
        }); return;
      }
      if (path === '/api/progression' && request.method === 'GET') {
        const progression = syncRecognitionNotifications(user);
        if (dirty) await persist();
        send(response, 200, progression); return;
      }
      if (path === '/api/progression/title' && request.method === 'POST') {
        limited(`progression-title:${user.id}`, 30, 60000);
        const body = await jsonBody(request);
        const progression = progressionProfile(user);
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        requireValue(progression.recognition.availableTitles.includes(title), 409, 'Unlock this title before using it.');
        user.selectedTitle = title;
        dirty = true;
        await persist();
        profileChanged(user);
        socialChanged();
        send(response, 200, progressionProfile(user)); return;
      }
      if (path === '/api/leaderboards' && request.method === 'GET') {
        send(response, 200, { categories: leaderboardCategories() }); return;
      }
      const leaderboardMatch = path.match(/^\/api\/leaderboards\/([^/]+)$/);
      if (leaderboardMatch && request.method === 'GET') {
        const players = db.users
          .filter(peer => peer.id === user.id || !blocked(user.id, peer.id))
          .map(peer => ({ id: peer.id, name: publicUser(peer).name, username: peer.username, stats: progressionStats(peer) }));
        try { send(response, 200, categoryLeaderboard(leaderboardMatch[1], players)); }
        catch { send(response, 404, { error: 'Leaderboard category not found.' }); }
        return;
      }
      if (path === '/api/people' && request.method === 'GET') {
        const people = db.users.filter(peer => peer.id !== user.id && (!blocked(user.id, peer.id) || ownBlock(user.id, peer.id))).map(peer => ({ ...(blocked(user.id, peer.id) ? blockedUser(peer) : publicUser(peer)), relationship: relation(user.id, peer.id), blocked: ownBlock(user.id, peer.id), online: !blocked(user.id, peer.id) && online(peer.id), canMessage: !blocked(user.id, peer.id) && accepted(user.id, peer.id) }));
        const self = publicUser(user);
        send(response, 200, { people, followers: self.followers, following: self.following }); return;
      }
      if (path === '/api/groups' && request.method === 'GET') {
        send(response, 200, groupsSummary(user)); return;
      }
      if (path === '/api/groups' && request.method === 'POST') {
        limited(`group-create:${user.id}`, 10, 60 * 60 * 1000);
        const body = await jsonBody(request);
        const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
        requireValue(name.length >= 3 && name.length <= GROUP_NAME_MAX && /^[\p{L}\p{N}][\p{L}\p{N} .&'_-]*$/u.test(name), 400, 'Group name must be 3–40 letters or numbers.');
        requireValue(userGroupCount(user.id) < GROUP_MEMBERSHIP_LIMIT, 409, 'You have reached the group membership limit.');
        requireValue(!db.groups.some(group => group.name.toLowerCase() === name.toLowerCase()), 409, 'That group name is already in use.');
        const group = { id: randomUUID(), name, ownerId: user.id, members: [user.id], invites: [], messages: [], createdAt: now() };
        db.groups.push(group);
        await persist(); socialChanged();
        send(response, 201, { group: groupView(group, user.id), summary: groupsSummary(user) }); return;
      }
      const groupInviteMatch = path.match(/^\/api\/groups\/([^/]+)\/invite$/);
      if (groupInviteMatch && request.method === 'POST') {
        limited(`group-invite:${user.id}`, 30, 60 * 60 * 1000);
        const group = requireGroup(user, groupInviteMatch[1], { member: true, owner: true });
        const body = await jsonBody(request);
        const peer = requirePeer(user, body.peerId);
        requireValue(!blocked(user.id, peer.id) && accepted(user.id, peer.id), 403, 'Only accepted contacts can be invited.');
        requireValue(group.members.length + group.invites.length < GROUP_MEMBER_LIMIT, 409, 'This group is full.');
        requireValue(!group.members.includes(peer.id), 409, 'This player is already in the group.');
        requireValue(!group.invites.includes(peer.id), 409, 'This player already has a group invite.');
        requireValue(userGroupCount(peer.id) < GROUP_MEMBERSHIP_LIMIT, 409, 'This player has reached the group membership limit.');
        group.invites.push(peer.id);
        addNotification(peer, {
          sourceKey: `group-invite:${group.id}:${peer.id}:${now()}`,
          kind: 'social',
          title: 'Group invitation',
          message: `${publicUser(user).username} invited you to ${group.name}.`,
          severity: 'info',
          target: 'groups',
        });
        await persist(); socialChanged();
        send(response, 200, { group: groupView(group, user.id) }); return;
      }
      const groupRespondMatch = path.match(/^\/api\/groups\/([^/]+)\/respond$/);
      if (groupRespondMatch && request.method === 'POST') {
        limited(`group-respond:${user.id}`, 30, 60 * 60 * 1000);
        const group = requireGroup(user, groupRespondMatch[1], { member: false });
        const body = await jsonBody(request);
        requireValue(['accept', 'decline'].includes(body.action), 400, 'Choose accept or decline.');
        requireValue(group.invites.includes(user.id), 409, 'No pending invitation for this group.');
        if (body.action === 'accept') {
          requireValue(!blocked(user.id, group.ownerId), 403, 'This group invitation is no longer available.');
          requireValue(group.members.length < GROUP_MEMBER_LIMIT, 409, 'This group is full.');
          requireValue(userGroupCount(user.id) < GROUP_MEMBERSHIP_LIMIT, 409, 'You have reached the group membership limit.');
        }
        group.invites = group.invites.filter(id => id !== user.id);
        if (body.action === 'accept') {
          group.members.push(user.id);
          const owner = findUser(group.ownerId);
          if (owner) addNotification(owner, {
            sourceKey: `group-joined:${group.id}:${user.id}:${now()}`,
            kind: 'social', title: 'Group member joined',
            message: `${publicUser(user).username} joined ${group.name}.`, severity: 'success', target: 'groups',
          });
        }
        await persist(); socialChanged();
        send(response, 200, { summary: groupsSummary(user) }); return;
      }
      const groupLeaveMatch = path.match(/^\/api\/groups\/([^/]+)\/leave$/);
      if (groupLeaveMatch && request.method === 'POST') {
        limited(`group-leave:${user.id}`, 20, 60 * 60 * 1000);
        const group = requireGroup(user, groupLeaveMatch[1]);
        group.members = group.members.filter(id => id !== user.id);
        group.invites = group.invites.filter(id => id !== user.id);
        let deleted = false;
        if (!group.members.length) {
          db.groups = db.groups.filter(item => item !== group);
          deleted = true;
        } else if (group.ownerId === user.id) {
          group.ownerId = group.members[0];
          const newOwner = findUser(group.ownerId);
          if (newOwner) addNotification(newOwner, {
            sourceKey: `group-owner:${group.id}:${newOwner.id}:${now()}`,
            kind: 'social', title: 'You are now group owner',
            message: `You are now the owner of ${group.name}.`, severity: 'info', target: 'groups',
          });
        }
        await persist(); socialChanged();
        send(response, 200, { deleted, summary: groupsSummary(user) }); return;
      }
      const groupMessagesMatch = path.match(/^\/api\/groups\/([^/]+)\/messages$/);
      if (groupMessagesMatch) {
        const group = requireGroup(user, groupMessagesMatch[1]);
        if (request.method === 'GET') {
          const messages = group.messages.filter(message => message.from === user.id || !blocked(user.id, message.from)).map(message => {
            const sender = findUser(message.from);
            return { ...message, fromName: sender ? publicUser(sender).username : 'Former member', own: message.from === user.id };
          });
          send(response, 200, { group: groupView(group, user.id), messages }); return;
        }
        if (request.method === 'POST') {
          limited(`group-message:${user.id}`, 40, 60000);
          const body = await jsonBody(request);
          requireValue(typeof body.body === 'string' && body.body.trim().length > 0 && body.body.trim().length <= 240, 400, 'Group message must contain 1–240 characters.');
          const message = { id: randomUUID(), from: user.id, body: body.body.trim(), createdAt: now() };
          group.messages.push(message);
          if (group.messages.length > GROUP_MESSAGE_LIMIT) group.messages = group.messages.slice(-GROUP_MESSAGE_LIMIT);
          for (const memberId of group.members) {
            if (memberId === user.id || blocked(user.id, memberId)) continue;
            const member = findUser(memberId);
            if (!member) continue;
            addNotification(member, {
              sourceKey: `group-message:${message.id}:${memberId}`,
              kind: 'social', title: group.name,
              message: `${publicUser(user).username} sent a group message.`, severity: 'info', target: 'groups',
            });
            emit(memberId, 'group-message', { groupId: group.id, messageId: message.id });
          }
          await persist();
          emit(user.id, 'group-message', { groupId: group.id, messageId: message.id });
          send(response, 201, { message: { ...message, fromName: publicUser(user).username, own: true } }); return;
        }
      }
      const profileMatch = path.match(/^\/api\/profile\/([^/]+)$/);
      if (profileMatch && request.method === 'GET') {
        const peer = findUser(profileMatch[1]); requireValue(peer, 404, 'Player not found.');
        requireValue(!blocked(user.id, peer.id) || ownBlock(user.id, peer.id), 404, 'Player not found.');
        const isBlocked = blocked(user.id, peer.id);
        send(response, 200, { user: isBlocked ? blockedUser(peer) : publicUser(peer), recognition: isBlocked ? null : progressionProfile(peer).recognition, relationship: relation(user.id, peer.id), blocked: isBlocked, canMessage: !isBlocked && accepted(user.id, peer.id) }); return;
      }
      const reportMatch = path.match(/^\/api\/reports\/([^/]+)$/);
      if (reportMatch && request.method === 'POST') {
        limited(`report:${user.id}`, 8, 60 * 60 * 1000);
        const peer = requirePeer(user, reportMatch[1]);
        const body = await jsonBody(request);
        const reason = typeof body.reason === 'string' ? body.reason.trim().toLowerCase() : '';
        const details = typeof body.details === 'string' ? body.details.trim() : '';
        requireValue(REPORT_REASONS.includes(reason), 400, 'Choose a valid report reason.');
        requireValue(details.length <= 500, 400, 'Report details must be 500 characters or fewer.');
        const reports = jobStateFor(user).reports;
        requireValue(!reports.some(report => report.targetId === peer.id && now() - Number(report.createdAt || 0) < REPORT_DUPLICATE_WINDOW_MS), 409, 'You already reported this player recently.');
        const report = { id: randomUUID(), reporterId: user.id, targetId: peer.id, reason, details, createdAt: now(), status: 'open' };
        reports.push(report);
        if (reports.length > REPORT_HISTORY_LIMIT) reports.splice(0, reports.length - REPORT_HISTORY_LIMIT);
        await persist();
        send(response, 201, { report: { id: report.id, targetId: report.targetId, reason: report.reason, createdAt: report.createdAt, status: report.status } }); return;
      }
      const followMatch = path.match(/^\/api\/follows\/([^/]+)$/);
      if (followMatch && request.method === 'POST') {
        limited(`social:${user.id}`, 60, 60000);
        const peer = requirePeer(user, followMatch[1]);
        requireValue(!blocked(user.id, peer.id), 403, 'This player is unavailable.');
        const { action } = await jsonBody(request);
        requireValue(!blocked(user.id, peer.id), 403, 'This player is unavailable.');
        const outgoing = db.follows.find(follow => follow.from === user.id && follow.to === peer.id);
        const incoming = db.follows.find(follow => follow.from === peer.id && follow.to === user.id);
        if (action === 'request') {
          requireValue(!outgoing, 409, 'A follow or request already exists.');
          db.follows.push({ from: user.id, to: peer.id, status: 'pending' });
          addNotification(peer, {
            sourceKey: `follow-request:${user.id}:${peer.id}:${now()}`,
            kind: 'social',
            title: 'New follow request',
            message: `${publicUser(user).username} wants to follow you.`,
            severity: 'info',
            target: 'people',
          });
        } else if (action === 'accept') {
          requireValue(incoming?.status === 'pending', 409, 'No pending request to accept.');
          incoming.status = 'accepted';
          addNotification(peer, {
            sourceKey: `follow-accepted:${user.id}:${peer.id}:${now()}`,
            kind: 'social',
            title: 'Follow request accepted',
            message: `${publicUser(user).username} accepted your follow request.`,
            severity: 'success',
            target: 'people',
          });
        } else if (action === 'decline') {
          requireValue(incoming?.status === 'pending', 409, 'No pending request to decline.'); db.follows = db.follows.filter(follow => follow !== incoming);
        } else if (action === 'cancel' || action === 'unfollow') {
          requireValue(outgoing && outgoing.status === (action === 'cancel' ? 'pending' : 'accepted'), 409, 'No matching follow to remove.'); db.follows = db.follows.filter(follow => follow !== outgoing);
        } else throw new ApiError(400, 'Unknown follow action.');
        if (action === 'unfollow' && !accepted(user.id, peer.id)) {
          emit(peer.id, 'signal', { from: user.id, data: { type: 'disabled' } });
          emit(user.id, 'signal', { from: peer.id, data: { type: 'disabled' } });
        }
        await persist(); socialChanged(); profileChanged(user); profileChanged(peer);
        send(response, 200, { user: publicUser(user), relationship: relation(user.id, peer.id) }); return;
      }
      const blockMatch = path.match(/^\/api\/blocks\/([^/]+)$/);
      if (blockMatch && request.method === 'POST') {
        limited(`social:${user.id}`, 60, 60000);
        const peer = requirePeer(user, blockMatch[1]);
        const body = await jsonBody(request);
        requireValue(typeof body.blocked === 'boolean', 400, 'Specify blocked as true or false.');
        db.blocks = db.blocks.filter(block => !(block.from === user.id && block.to === peer.id));
        if (body.blocked) {
          db.blocks.push({ from: user.id, to: peer.id });
          db.follows = db.follows.filter(follow => !((follow.from === user.id && follow.to === peer.id) || (follow.from === peer.id && follow.to === user.id)));
          emit(peer.id, 'signal', { from: user.id, data: { type: 'disabled' } });
          emit(user.id, 'signal', { from: peer.id, data: { type: 'disabled' } });
          emit(peer.id, 'proximity-signal', { from: user.id, data: { type: 'disabled' } });
          emit(user.id, 'proximity-signal', { from: peer.id, data: { type: 'disabled' } });
        }
        await persist(); socialChanged(); profileChanged(user); profileChanged(peer);
        send(response, 200, { user: publicUser(user), blocked: body.blocked, relationship: relation(user.id, peer.id) }); return;
      }
      const messageMatch = path.match(/^\/api\/messages\/([^/]+)$/);
      if (messageMatch) {
        const peer = requirePeer(user, messageMatch[1], true);
        if (request.method === 'GET') {
          const messages = db.messages.filter(message => (message.from === user.id && message.to === peer.id) || (message.from === peer.id && message.to === user.id)).slice(-100);
          send(response, 200, { messages }); return;
        }
        if (request.method === 'POST') {
          limited(`message:${user.id}`, 30, 60000);
          const body = await jsonBody(request);
          // Recheck after reading the body: a block may have arrived in the meantime.
          requirePeer(user, peer.id, true);
          const message = { id: randomUUID(), from: user.id, to: peer.id, createdAt: now() };
          if (body.audio !== undefined) {
            requireValue(typeof body.audio === 'string' && body.audio.length > 0 && body.audio.length <= Math.ceil(AUDIO_MAX / 3) * 4 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.audio), 400, 'Voice message is invalid or exceeds 512 KB.');
            requireValue(Buffer.from(body.audio, 'base64').length <= AUDIO_MAX, 413, 'Voice message exceeds 512 KB.');
            requireValue(typeof body.mime === 'string' && /^audio\/(webm|ogg|mp4|mpeg)(;codecs=[a-zA-Z0-9.,_-]+)?$/.test(body.mime), 400, 'Unsupported voice format.');
            requireValue(Number.isFinite(body.duration) && body.duration > 0 && body.duration <= 30, 400, 'Record up to 30 seconds.');
            message.audio = body.audio; message.mime = body.mime; message.duration = body.duration;
          } else {
            requireValue(typeof body.body === 'string' && body.body.trim().length > 0 && body.body.length <= 1000, 400, 'Message must contain 1–1000 characters.');
            message.body = body.body.trim();
          }
          db.messages.push(message);
          addNotification(peer, {
            sourceKey: `message:${message.id}`,
            kind: 'social',
            title: message.audio ? 'New voice message' : 'New message',
            message: `${publicUser(user).username} sent you ${message.audio ? 'a voice message' : 'a private message'}.`,
            severity: 'info',
            target: 'people',
          });
          // Keep the most recent 100 messages per pair, bounded to 2,000 overall.
          const pairMessages = db.messages.filter(item => (item.from === user.id && item.to === peer.id) || (item.from === peer.id && item.to === user.id));
          const oldIds = new Set(pairMessages.slice(0, -100).map(item => item.id));
          db.messages = db.messages.filter(item => !oldIds.has(item.id)).slice(-2000);
          let retainedBytes = db.messages.reduce((sum, item) => sum + (item.audio?.length || item.body?.length || 0), 0);
          while (retainedBytes > 20 * 1024 * 1024 && db.messages.length > 1) {
            const removed = db.messages.shift(); retainedBytes -= removed.audio?.length || removed.body?.length || 0;
          }
          await persist();
          emit(user.id, 'message', { peerId: peer.id }); emit(peer.id, 'message', { peerId: user.id });
          send(response, 201, { message }); return;
        }
      }
      if (path === '/api/events' && request.method === 'GET') {
        const connections = clients.get(user.id) || new Set();
        requireValue(connections.size < 6, 429, 'Too many open game tabs.');
        response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        response.write(': connected\n\n');
        const client = { response, key: session.key };
        response.on('error', () => response.destroy());
        connections.add(client); clients.set(user.id, connections);
        const state = presence.get(user.id) || place(user); state.lastSeen = now();
        response.write(`event: world\ndata: ${JSON.stringify(worldSnapshot(user.id))}\n\n`);
        response.write(`event: profile\ndata: ${JSON.stringify({ user: publicUser(user) })}\n\n`);
        socialChanged();
        response.on('close', () => { connections.delete(client); if (!connections.size) { clients.delete(user.id); presence.delete(user.id); socialChanged(); } });
        return;
      }
      if (path === '/api/world/move' && request.method === 'POST') {
        limited(`move:${user.id}`, 20, 1000);
        const body = await jsonBody(request);
        const movementWorld = districtWorldConfig(user);
        requireValue(insideDistrictWorld(movementWorld, Number(body.x), Number(body.z), -.01) && Number.isFinite(body.rotation) && Math.abs(body.rotation) < 100000 && typeof body.moving === 'boolean', 400, `You reached the edge of ${currentWorldDistrict(user)}. Use train or flight to travel to another district.`);
        const requestedMode = body.mode === undefined ? 'walk' : body.mode;
        requireValue(Object.hasOwn(MOVEMENT_PROFILES, requestedMode), 400, 'Invalid movement mode.');
        const stateForMove = jobStateFor(user);
        const active = stateForMove.active;
        const activeJob = active ? JOB_DEFINITIONS[active.jobId] : null;
        const personal = stateForMove.garage.activeVehicleId ? stateForMove.garage.owned.find(vehicle => vehicle.id === stateForMove.garage.activeVehicleId) : null;
        const personalModel = personal ? GARAGE_CATALOG[personal.modelId] : null;
        const expectedMode = active?.vehicleEntered && activeJob?.vehicle ? activeJob.vehicle : (personal?.entered && personalModel ? personalModel.kind : 'walk');
        requireValue(requestedMode === expectedMode, 409, 'Movement mode is out of sync. Re-enter the active vehicle if needed.');
        const state = presence.get(user.id) || place(user);
        requireValue((state.district || currentWorldDistrict(user)) === currentWorldDistrict(user), 409, 'District world changed. Reload the current district.');
        const movement = MOVEMENT_PROFILES[requestedMode];
        const needsBeforeMove = needsSummary(user);
        const needsFactor = requestedMode === 'walk' ? Number(needsBeforeMove.movementFactor || 1) : 1;
        const elapsed = Math.max(0, Math.min((now() - state.movedAt) / 1000, 3));
        const credit = Math.min(movement.maxCredit * needsFactor, state.movementCredit + elapsed * movement.rate * needsFactor);
        const distance = Math.hypot(body.x - state.x, body.z - state.z);
        if (distance > credit + 0.01) throw new ApiError(409, 'Movement was too fast. Your avatar needs to resync.', { x: state.x, z: state.z });
        if (requestedMode !== 'walk' && distance > .01) {
          const fuel = active?.vehicleEntered ? Number(active.vehicleFuel) : Number(personal?.fuel);
          requireValue(fuel > .05, 409, 'Vehicle fuel is empty. Refuel at Kerala Fuel Station.');
        }
        let trafficNotice = null;
        if (personal?.entered && personalModel && elapsed >= .12 && elapsed <= 1.5 && distance > .25) {
          const insurance = vehicleInsuranceSummary(personal);
          const licenceValid = licenceAllowsVehicle(user, personalModel.kind);
          if (!licenceValid && insurance.insuranceActive) {
            state.trafficLicenceStrikes = Math.min(5, Number(state.trafficLicenceStrikes || 0) + 1);
            if (state.trafficLicenceStrikes >= 3 && now() - Number(state.trafficLastLicenceChallanAt || 0) >= 60000) {
              const createdResult = createTrafficChallan(user, personal, 'licence_invalid', 'server-licence-check', { licenceType: drivingLicenceSummary(user).type });
              if (createdResult.created) trafficNotice = createdResult.challan;
              state.trafficLastLicenceChallanAt = now();
              state.trafficLicenceStrikes = 0;
            }
          } else {
            state.trafficLicenceStrikes = Math.max(0, Number(state.trafficLicenceStrikes || 0) - 1);
          }

          if (!trafficNotice) {
            const midpointX = (state.x + body.x) / 2;
            const midpointZ = (state.z + body.z) / 2;
            const zone = trafficZoneAt(midpointX, midpointZ);
            const speedKmh = Math.round((distance / Math.max(.05, elapsed)) * 6);
            if (speedKmh > zone.limit + 4) {
              state.trafficSpeedStrikes = Math.min(4, Number(state.trafficSpeedStrikes || 0) + 1);
              if (state.trafficSpeedStrikes >= 2 && now() - Number(state.trafficLastChallanAt || 0) >= 45000) {
                const createdResult = createTrafficChallan(user, personal, 'speeding', 'server-speed-check', { speedKmh, limit: zone.limit, zone: zone.label });
                if (createdResult.created) trafficNotice = createdResult.challan;
                state.trafficLastChallanAt = now();
                state.trafficSpeedStrikes = 0;
              }
            } else {
              state.trafficSpeedStrikes = Math.max(0, Number(state.trafficSpeedStrikes || 0) - 1);
            }
          }
        } else if (requestedMode === 'walk' || distance <= .05) {
          state.trafficSpeedStrikes = 0;
          state.trafficLicenceStrikes = 0;
        }
        const previousRotation = state.rotation;
        state.movementCredit = credit - distance; state.movedAt = now(); state.lastSeen = now();
        state.x = body.x; state.z = body.z; state.rotation = body.rotation; state.moving = body.moving; state.mode = requestedMode;
        user.worldX = state.x; user.worldZ = state.z; user.worldRotation = state.rotation; user.worldUpdatedAt = now();
        if (requestedMode === 'walk') {
          user.walkMeters += distance;
          if (distance > 0) {
            const needs = stateForMove.needs;
            needs.energy = Math.max(0, Number(needs.energy) - distance * .02);
            needs.thirst = Math.max(0, Number(needs.thirst) - distance * .005);
            needs.hunger = Math.max(0, Number(needs.hunger) - distance * .002);
            needs.updatedAt = now();
            dirty = true;
          }
        } else if (active && activeJob?.vehicle && distance > 0) {
          const spec = VEHICLE_SPECS[activeJob.vehicle];
          active.vehicleFuel = Math.max(0, Number(active.vehicleFuel) - distance * spec.fuelBurnPerMeter);
          dirty = true;
        } else if (personal?.entered && personalModel && distance > 0) {
          const spec = VEHICLE_SPECS[personalModel.kind];
          personal.fuel = Math.max(0, Number(personal.fuel) - distance * spec.fuelBurnPerMeter);
          dirty = true;
        }
        let discovered = false;
        for (const [id, x, z] of LANDMARKS) if (landmarkDistrictForId(id) === currentWorldDistrict(user) && Math.hypot(x - state.x, z - state.z) <= 8 && !user.visitedLandmarks.includes(id)) { user.visitedLandmarks.push(id); discovered = true; }
        const districtLandmark = genericDistrictLandmark(user);
        if (districtLandmark && Math.hypot(districtLandmark.x - state.x, districtLandmark.z - state.z) <= districtLandmark.radius && !user.visitedLandmarks.includes(districtLandmark.id)) {
          user.visitedLandmarks.push(districtLandmark.id);
          discovered = true;
        }
        const turn = Math.abs(Math.atan2(Math.sin(state.rotation - previousRotation), Math.cos(state.rotation - previousRotation)));
        dirty = dirty || distance > 0 || discovered || turn > 0.01; worldDirty = true;
        if (discovered || now() - state.lastProfile >= 2000) { profileChanged(user); state.lastProfile = now(); }
        const activeVehicle = active && activeJob?.vehicle ? jobsSummary(user).active?.vehicle || null : (personal?.entered ? garageSummary(user).activeVehicle : null);
        send(response, 200, {
          ok: true,
          user: publicUser(user),
          walkMeters: Math.floor(user.walkMeters),
          visitedLandmarks: user.visitedLandmarks,
          vehicle: activeVehicle,
          trafficNotice,
          needs: needsSummary(user),
        }); return;
      }
      const voiceMatch = path.match(/^\/api\/voice\/signal\/([^/]+)$/);
      if (voiceMatch && request.method === 'POST') {
        limited(`voice:${user.id}`, 180, 60000);
        const peer = requirePeer(user, voiceMatch[1], true);
        const { data } = await jsonBody(request);
        requirePeer(user, peer.id, true);
        requireValue(data && typeof data === 'object' && !Array.isArray(data) && ['request', 'opt-in', 'disabled', 'offer', 'answer', 'candidate', 'end'].includes(data.type) && JSON.stringify(data).length <= 32000, 400, 'Invalid voice signal.');
        requireValue(data.callId === undefined || (typeof data.callId === 'string' && data.callId.length <= 100), 400, 'Invalid call identifier.');
        if (['offer', 'answer'].includes(data.type)) requireValue(typeof data.sdp === 'string' && data.sdp.length <= 24000, 400, 'Invalid voice description.');
        if (data.type === 'candidate') requireValue(data.candidate && typeof data.candidate === 'object' && JSON.stringify(data.candidate).length <= 3000, 400, 'Invalid voice connection candidate.');
        emit(peer.id, 'signal', { from: user.id, data });
        send(response, 200, { ok: true, online: !!clients.get(peer.id)?.size }); return;
      }
      const proximityVoiceMatch = path.match(/^\/api\/proximity\/signal\/([^/]+)$/);
      if (proximityVoiceMatch && request.method === 'POST') {
        limited(`proximity-voice:${user.id}`, 360, 60000);
        const peer = requirePeer(user, proximityVoiceMatch[1]);
        requireValue(!blocked(user.id, peer.id), 403, 'This player is unavailable.');
        const { data } = await jsonBody(request);
        requireValue(data && typeof data === 'object' && !Array.isArray(data) && ['ready', 'disabled', 'offer', 'answer', 'candidate', 'end'].includes(data.type) && JSON.stringify(data).length <= 32000, 400, 'Invalid proximity voice signal.');
        requireValue(data.callId === undefined || (typeof data.callId === 'string' && data.callId.length <= 100), 400, 'Invalid call identifier.');
        if (['offer', 'answer'].includes(data.type)) requireValue(typeof data.sdp === 'string' && data.sdp.length <= 24000, 400, 'Invalid voice description.');
        if (data.type === 'candidate') requireValue(data.candidate && typeof data.candidate === 'object' && JSON.stringify(data.candidate).length <= 3000, 400, 'Invalid voice connection candidate.');
        if (!['end', 'disabled'].includes(data.type)) {
          const selfState = presence.get(user.id), peerState = presence.get(peer.id);
          requireValue(selfState && peerState && online(user.id) && online(peer.id), 409, 'Both players must be online for nearby voice.');
          requireValue(currentWorldDistrict(user) === currentWorldDistrict(peer) && user.district === peer.district, 403, 'This player is in another district.');
          requireValue(Math.hypot(selfState.x - peerState.x, selfState.z - peerState.z) <= 28, 403, 'This player is too far away for nearby voice.');
        }
        emit(peer.id, 'proximity-signal', { from: user.id, data });
        send(response, 200, { ok: true, online: !!clients.get(peer.id)?.size }); return;
      }
      const taskMatch = path.match(/^\/api\/tasks\/([^/]+)\/claim$/);
      if (taskMatch && request.method === 'POST') {
        await jsonBody(request);
        const id = taskMatch[1] === 'follow-guide' ? 'social' : taskMatch[1];
        requireValue(Object.hasOwn(REWARDS, id), 404, 'Task not found.');
        requireValue(id !== 'walk-50' || user.walkMeters >= 50, 409, 'Walk 50 metres first.');
        requireValue(id !== 'visit-landmark' || user.visitedLandmarks.length > 0, 409, 'Visit a landmark first.');
        requireValue(id !== 'walk-250' || user.walkMeters >= 250, 409, 'Walk 250 metres first.');
        requireValue(id !== 'discover-3' || user.visitedLandmarks.length >= 3, 409, 'Discover three landmarks first.');
        requireValue(id !== 'walk-500' || user.walkMeters >= 500, 409, 'Walk 500 metres first.');
        requireValue(id !== 'discover-5' || user.visitedLandmarks.length >= 5, 409, 'Discover five landmarks first.');
        requireValue(id !== 'social' || db.follows.some(follow => follow.status === 'accepted' && (follow.from === user.id || follow.to === user.id)), 409, 'Have a follow request accepted first.');
        send(response, 200, await reward(user, id, REWARDS[id])); return;
      }
      if (path === '/api/games/coconut/start' && request.method === 'POST') {
        await jsonBody(request); limited(`game:${user.id}`, 15, 60000);
        const day = new Date(now()).toISOString().slice(0, 10);
        requireValue(user.gameDay !== day || user.gameWins < 5, 409, 'Today’s five game rewards are complete. Come back tomorrow.');
        const round = { id: randomUUID(), sequence: Array.from({ length: 5 }, () => randomInt(4)), startedAt: now() };
        rounds.set(user.id, round);
        send(response, 200, { roundId: round.id, sequence: round.sequence, expiresIn: 120 }); return;
      }
      if (path === '/api/games/coconut/finish' && request.method === 'POST') {
        const body = await jsonBody(request);
        const round = rounds.get(user.id);
        requireValue(round && round.id === body.roundId, 409, 'Start a new game round.');
        rounds.delete(user.id);
        requireValue(now() - round.startedAt >= 1500 && now() - round.startedAt <= 120000, 409, 'Round expired or finished too quickly. Start again.');
        requireValue(Array.isArray(body.sequence) && body.sequence.length === round.sequence.length && body.sequence.every((pick, index) => pick === round.sequence[index]), 400, 'That sequence was different. Try a new round.');
        const day = new Date(now()).toISOString().slice(0, 10);
        if (user.gameDay !== day) { user.gameDay = day; user.gameWins = 0; }
        requireValue(user.gameWins < 5, 409, 'Today’s five game rewards are complete.');
        user.gameWins++; user.points += 20;
        if (!user.completedTasks.includes('coconut-challenge')) user.completedTasks.push('coconut-challenge');
        await persist(); profileChanged(user);
        send(response, 200, { won: true, user: publicUser(user), reward: 20, rewardsRemaining: 5 - user.gameWins }); return;
      }
      throw new ApiError(404, 'API route not found.');
    } catch (error) {
      if (!(error instanceof ApiError)) console.error('Request failed:', error.message);
      if (!response.headersSent) send(response, error.status || 500, { error: error.status ? error.message : 'The server could not complete this request.', ...error.details });
      else response.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  const worldTimer = setInterval(() => {
    for (const [id, state] of presence) {
      if (now() - state.lastSeen >= 20000) { presence.delete(id); worldDirty = true; }
      else if (state.moving && now() - state.movedAt > 1500) { state.moving = false; worldDirty = true; }
    }
    if (worldDirty) { worldDirty = false; for (const id of clients.keys()) emit(id, 'world', worldSnapshot(id)); }
  }, 250);
  const upkeepTimer = setInterval(() => {
    for (const [key, session] of sessions) if (session.expires <= now()) sessions.delete(key);
    for (const [id, connections] of clients) for (const client of connections) {
      if (client.response.writableEnded || client.response.destroyed) continue;
      if (!sessions.has(client.key)) client.response.end();
      else { client.response.write(': heartbeat\n\n'); const state = presence.get(id); if (state) state.lastSeen = now(); }
    }
    for (const [key, slot] of rates) if (slot.until <= now()) rates.delete(key);
    for (const [id, round] of rounds) if (now() - round.startedAt > 120000) rounds.delete(id);
    if (dirty) void persist().catch(error => console.error('Save failed:', error.message));
  }, 2000);
  worldTimer.unref(); upkeepTimer.unref();
  server.shutdown = async () => {
    clearInterval(worldTimer); clearInterval(upkeepTimer);
    for (const connections of clients.values()) for (const client of connections) client.response.end();
    if (dirty) await persist(); else await saveQueue;
    if (server.listening) await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  };
  server.on('close', () => { clearInterval(worldTimer); clearInterval(upkeepTimer); });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createGameServer();
  const port = Number(process.env.PORT || 3000), host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, () => console.log(`Kerala Play running at http://${host}:${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.shutdown(); process.exit(0); });
}
