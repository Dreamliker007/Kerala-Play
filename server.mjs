import http from 'node:http';
import { randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const ROOT = dirname(fileURLToPath(import.meta.url));
const DISTRICTS = {
  Alappuzha: [-34, -13], Ernakulam: [-26, 6], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44],
};
const LANDMARKS = [['bekal', -7, 60], ['munnar', 42, 26], ['kochi', -26, 6], ['alappuzha', -34, -13], ['kuttanad', 7, -23], ['temple', 13, -57]];
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
const NEEDS_MAX = 100;
const NEEDS_DECAY_PER_MINUTE = Object.freeze({ hunger: 0.28, thirst: 0.4, energy: 0.22 });
const NEEDS_MAX_CATCHUP_MS = 2 * 60 * 60 * 1000;
const NEEDS_REST_POINT = Object.freeze({ id: 'village-bench', label: 'Village Rest Bench', x: -10, z: -10, radius: 5.2 });
const NEEDS_REST_ENERGY = 35;
const NEEDS_REST_COOLDOWN_MS = 30_000;
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
function freshJobState() { return { active: null, cooldowns: {}, completed: {}, garage: { owned: [], selectedId: null, activeVehicleId: null }, traffic: { challans: [], licence: { type: 'none', number: '', issuedAt: 0, validUntil: 0 } }, needs: { hunger: 100, thirst: 100, energy: 100, updatedAt: 0, lastRestAt: 0 }, home: { status: 'rented', rentDueAt: 0, utilityDueAt: 0, lastSleepAt: 0, rentPayments: 0, utilityPayments: 0 }, bank: { balance: 0, accountNumber: '', transactions: [] } }; }
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const AUDIO_MAX = 512 * 1024;
const BODY_MAX = 720 * 1024;
const PUBLIC_EXTENSIONS = new Set(['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.glb', '.gltf', '.bin', '.mp3', '.ogg', '.wav', '.webm', '.json']);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'audio/webm', '.woff': 'font/woff', '.woff2': 'font/woff2' };

class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
function requireValue(condition, status, message) { if (!condition) throw new ApiError(status, message); }
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
export async function createGameServer({ dataDir = resolve(ROOT, '.data'), publicDir = ROOT, now = Date.now } = {}) {
  await mkdir(dataDir, { recursive: true });
  const databasePath = resolve(dataDir, 'game.json');
  let db;
  try { db = JSON.parse(await readFile(databasePath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot read saved game data: ${error.message}`);
    db = { version: 1, users: [], follows: [], blocks: [], messages: [] };
  }
  if (db.version !== 1 || !['users', 'follows', 'blocks', 'messages'].every(key => Array.isArray(db[key])) || (db.transactions !== undefined && !Array.isArray(db.transactions))) throw new Error('Unsupported saved game data.');
  let migrated = false;
  if (!Array.isArray(db.transactions)) { db.transactions = []; migrated = true; }
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
    if (!user.jobState.needs || typeof user.jobState.needs !== 'object' || Array.isArray(user.jobState.needs)) { user.jobState.needs = { hunger: 100, thirst: 100, energy: 100, updatedAt: now(), lastRestAt: 0 }; migrated = true; }
    if (!user.jobState.home || typeof user.jobState.home !== 'object' || Array.isArray(user.jobState.home)) { user.jobState.home = { status: 'rented', rentDueAt: now() + HOME_DEFINITION.periodMs, utilityDueAt: now() + HOME_DEFINITION.periodMs, lastSleepAt: 0, rentPayments: 0, utilityPayments: 0 }; migrated = true; }
    if (!user.jobState.bank || typeof user.jobState.bank !== 'object' || Array.isArray(user.jobState.bank)) { user.jobState.bank = { balance: 0, accountNumber: '', transactions: [] }; migrated = true; }
    if (user.jobState.active && (typeof user.jobState.active !== 'object' || !JOB_DEFINITIONS[user.jobState.active.jobId] || !Array.isArray(user.jobState.active.checkpoints))) { user.jobState.active = null; migrated = true; }
    if (user.walletBalance > 0 && !db.transactions.some(transaction => transaction.userId === user.id)) {
      db.transactions.push({ id: randomUUID(), userId: user.id, type: 'credit', amount: user.walletBalance, balanceAfter: user.walletBalance, kind: 'opening', description: 'Opening Kerala Cash balance', createdAt: Number(user.createdAt) || now() });
      migrated = true;
    }
  }
  const sessions = new Map(), clients = new Map(), presence = new Map(), rounds = new Map(), rates = new Map(), resetTokens = new Map();
  let dirty = migrated, worldDirty = false, saveQueue = Promise.resolve();
  function persist() {
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
    const [landmarkX, z] = DISTRICTS[user.district];
    return { x: landmarkX + 12, z };
  }
  function savedPosition(user) {
    const spawn = spawnFor(user);
    const x = Number(user.worldX), z = Number(user.worldZ), rotation = Number(user.worldRotation);
    const valid = Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 110.01 && Math.abs(z) <= 110.01;
    return { x: valid ? x : spawn.x, z: valid ? z : spawn.z, rotation: Number.isFinite(rotation) ? rotation : 0, valid };
  }
  function publicUser(user) {
    const position = presence.get(user.id), saved = savedPosition(user);
    let level = 1, remaining = user.points, next = 100;
    while (remaining >= next) { remaining -= next; level++; next = 100 + (level - 1) * 50; }
    const displayName = user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username);
    return { id: user.id, username: displayName, name: displayName, district: user.district, gender: user.gender, bio: user.bio, points: user.points, level, followers: db.follows.filter(follow => follow.to === user.id && follow.status === 'accepted').length, following: db.follows.filter(follow => follow.from === user.id && follow.status === 'accepted').length, completedTasks: [...user.completedTasks], walkMeters: Math.floor(user.walkMeters), visitedLandmarks: [...user.visitedLandmarks], x: position?.x ?? saved.x, z: position?.z ?? saved.z, rotation: position?.rotation ?? saved.rotation };
  }
  function blockedUser(user) { const displayName = user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username); return { id: user.id, username: displayName, name: displayName, blocked: true }; }
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
  function profileChanged(user) { emit(user.id, 'profile', { user: publicUser(user) }); }
  function worldSnapshot(viewerId) {
    return { players: [...presence.entries()].filter(([id]) => online(id) && !blocked(viewerId, id)).map(([id, state]) => {
      const user = findUser(id);
      return { id, username: user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username), gender: user.gender, district: user.district, x: state.x, z: state.z, rotation: state.rotation, moving: state.moving, mode: state.mode || 'walk' };
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
    const state = { x, z, rotation, moving: false, mode: 'walk', lastSeen: now(), movedAt: now(), movementCredit: 2, lastProfile: now(), trafficSpeedStrikes: 0, trafficLastChallanAt: 0, trafficLicenceStrikes: 0, trafficLastLicenceChallanAt: 0 };
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
    if (!session || session.expires <= now()) { sessions.delete(key); return null; }
    const user = findUser(session.id);
    return user ? { user, key } : null;
  }
  function startSession(user, response, request) {
    const previous = sessionFor(request);
    if (previous) {
      sessions.delete(previous.key);
      for (const client of clients.get(previous.user.id) || []) if (client.key === previous.key) client.response.end();
    }
    const token = randomBytes(32).toString('hex');
    sessions.set(hashToken(token), { id: user.id, expires: now() + SESSION_AGE });
    const secure = request.socket.encrypted || process.env.COOKIE_SECURE === '1';
    response.setHeader('Set-Cookie', `kp_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE / 1000}${secure ? '; Secure' : ''}`);
    if (!presence.has(user.id)) place(user);
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
    const rentGraceUntil = rentDueAt + HOME_DEFINITION.graceMs;
    const utilityGraceUntil = utilityDueAt + HOME_DEFINITION.graceMs;
    const accessBlocked = timestamp > rentGraceUntil || timestamp > utilityGraceUntil;
    const reminder = accessBlocked
      ? 'Sleep access paused until overdue home charges are paid.'
      : (rentOverdue || utilityOverdue ? 'Home payment is overdue but still inside the grace period.' : 'Home payments are up to date.');
    return {
      status: home.status,
      home: HOME_DEFINITION,
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
    if (!Array.isArray(user.jobState.traffic.challans)) user.jobState.traffic.challans = [];
    const needs = user.jobState.needs;
    for (const key of ['hunger', 'thirst', 'energy']) {
      if (!Number.isFinite(Number(needs[key]))) needs[key] = 100;
      needs[key] = Math.max(0, Math.min(NEEDS_MAX, Number(needs[key])));
    }
    if (!Number.isFinite(Number(needs.updatedAt)) || Number(needs.updatedAt) <= 0) needs.updatedAt = now();
    if (!Number.isFinite(Number(needs.lastRestAt))) needs.lastRestAt = 0;
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
          active.vehicleX = missionCoordinate(position.x, 2.8);
          active.vehicleZ = missionCoordinate(position.z, 1.5);
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
  function missionCoordinate(value, delta) {
    let next = value + delta;
    if (next > 104 || next < -104) next = value - delta;
    return Math.max(-104, Math.min(104, next));
  }
  function buildJobCheckpoints(user, jobId) {
    const base = jobPosition(user);
    const point = (name, action, dx, dz) => ({ name, action, x: missionCoordinate(base.x, dx), z: missionCoordinate(base.z, dz) });
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
        const user = { id: randomUUID(), firstName, username, email, mobile, passwordHash, salt, district, gender, bio: '', points: 0, completedTasks: [], walkMeters: 0, visitedLandmarks: [], createdAt: now(), gameDay: '', gameWins: 0, walletBalance: 0, economyActions: [], jobState: freshJobState(), worldX: spawnX + 12, worldZ: spawnZ, worldRotation: 0, worldUpdatedAt: now() };
        db.users.push(user); walletTransaction(user, STARTER_BALANCE, 'starter', 'Starter Kerala Cash'); await persist(); startSession(user, response, request); socialChanged();
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
        startSession(user, response, request); socialChanged();
        send(response, 200, { user: publicUser(user) }); return;
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
        const target = findUser(entry.userId); const salt = randomBytes(16).toString('hex'); target.salt = salt; target.passwordHash = (await scrypt(body.password, salt, 64)).toString('hex'); resetTokens.delete(hashToken(code)); await persist(); send(response, 200, { ok: true }); return;
      }
      const session = sessionFor(request);
      requireValue(session, 401, 'Please sign in first.');
      const user = session.user;
      if (path === '/api/auth/logout' && request.method === 'POST') {
        sessions.delete(session.key);
        for (const client of clients.get(user.id) || []) if (client.key === session.key) client.response.end();
        if (![...sessions.values()].some(item => item.id === user.id && item.expires > now())) presence.delete(user.id);
        response.setHeader('Set-Cookie', 'kp_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
        socialChanged(); send(response, 200, { ok: true }); return;
      }
      if (path === '/api/profile' && request.method === 'PATCH') {
        const body = await jsonBody(request);
        requireValue(body.district === undefined || Object.hasOwn(DISTRICTS, body.district), 400, 'Choose a valid Kerala district.');
        requireValue(body.gender === undefined || ['male', 'female', 'other'].includes(body.gender), 400, 'Choose a valid avatar.');
        requireValue(body.bio === undefined || (typeof body.bio === 'string' && body.bio.length <= 180), 400, 'Bio must be 180 characters or fewer.');
        const relocate = body.district && body.district !== user.district;
        if (body.district !== undefined) user.district = body.district;
        if (body.gender !== undefined) user.gender = body.gender;
        if (body.bio !== undefined) user.bio = body.bio.trim();
        if (relocate) place(user, { reset: true });
        await persist(); profileChanged(user); socialChanged();
        send(response, 200, { user: publicUser(user) }); return;
      }
      if (path === '/api/wallet' && request.method === 'GET') {
        send(response, 200, walletSummary(user)); return;
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
        const isRent = body.kind === 'rent';
        const amount = isRent ? HOME_DEFINITION.rent : HOME_DEFINITION.utilities;
        const transaction = walletTransaction(
          user,
          -amount,
          isRent ? 'home_rent' : 'home_utilities',
          isRent ? 'Village Rental Home rent' : 'Village Rental Home electricity + water'
        );
        if (isRent) {
          home.rentDueAt = Math.max(now(), Number(home.rentDueAt) || 0) + HOME_DEFINITION.periodMs;
          home.rentPayments = Number(home.rentPayments || 0) + 1;
        } else {
          home.utilityDueAt = Math.max(now(), Number(home.utilityDueAt) || 0) + HOME_DEFINITION.periodMs;
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
        requireValue(Math.hypot(live.x - HOME_DEFINITION.x, live.z - HOME_DEFINITION.z) <= HOME_DEFINITION.radius, 409, 'Move closer to your Village Rental Home.');
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
      if (path === '/api/needs/rest' && request.method === 'POST') {
        limited(`needs-rest:${user.id}`, 20, 60000);
        await jsonBody(request);
        const state = jobStateFor(user);
        const personal = state.garage.activeVehicleId ? state.garage.owned.find(vehicle => vehicle.id === state.garage.activeVehicleId) : null;
        requireValue(!state.active?.vehicleEntered && !personal?.entered, 409, 'Park and exit the vehicle before resting.');
        const live = presence.get(user.id) || place(user);
        requireValue((live.mode || 'walk') === 'walk', 409, 'Exit the vehicle before resting.');
        requireValue(Math.hypot(live.x - NEEDS_REST_POINT.x, live.z - NEEDS_REST_POINT.z) <= NEEDS_REST_POINT.radius, 409, 'Move closer to the Village Rest Bench.');
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
          vehicle.parkedX = missionCoordinate(position.x, 2.8);
          vehicle.parkedZ = missionCoordinate(position.z, 1.5);
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
        const station = body.action === 'refuel' ? VEHICLE_STATIONS.fuel : VEHICLE_STATIONS.service;
        requireValue(Math.hypot(live.x - station.x, live.z - station.z) <= station.radius, 409, `Move closer to ${station.label}.`);
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
          vehicleX: job.vehicle ? missionCoordinate(position.x, 2.8) : null,
          vehicleZ: job.vehicle ? missionCoordinate(position.z, 1.5) : null,
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
        const station = body.action === 'refuel' ? VEHICLE_STATIONS.fuel : VEHICLE_STATIONS.service;
        requireValue(Math.hypot(live.x - station.x, live.z - station.z) <= station.radius, 409, `Move closer to ${station.label}.`);
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
        await persist();
        send(response, 200, { jobs: jobsSummary(user), wallet: walletSummary(user), reward: job.reward, transaction, completed: { jobId, title: job.title, count: state.completed[jobId] } }); return;
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
      if (path === '/api/people' && request.method === 'GET') {
        const people = db.users.filter(peer => peer.id !== user.id && (!blocked(user.id, peer.id) || ownBlock(user.id, peer.id))).map(peer => ({ ...(blocked(user.id, peer.id) ? blockedUser(peer) : publicUser(peer)), relationship: relation(user.id, peer.id), blocked: ownBlock(user.id, peer.id), online: !blocked(user.id, peer.id) && online(peer.id), canMessage: !blocked(user.id, peer.id) && accepted(user.id, peer.id) }));
        const self = publicUser(user);
        send(response, 200, { people, followers: self.followers, following: self.following }); return;
      }
      const profileMatch = path.match(/^\/api\/profile\/([^/]+)$/);
      if (profileMatch && request.method === 'GET') {
        const peer = findUser(profileMatch[1]); requireValue(peer, 404, 'Player not found.');
        requireValue(!blocked(user.id, peer.id) || ownBlock(user.id, peer.id), 404, 'Player not found.');
        const isBlocked = blocked(user.id, peer.id);
        send(response, 200, { user: isBlocked ? blockedUser(peer) : publicUser(peer), relationship: relation(user.id, peer.id), blocked: isBlocked, canMessage: !isBlocked && accepted(user.id, peer.id) }); return;
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
        } else if (action === 'accept') {
          requireValue(incoming?.status === 'pending', 409, 'No pending request to accept.'); incoming.status = 'accepted';
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
        requireValue(Number.isFinite(body.x) && Number.isFinite(body.z) && Math.abs(body.x) <= 110.01 && Math.abs(body.z) <= 110.01 && Number.isFinite(body.rotation) && Math.abs(body.rotation) < 100000 && typeof body.moving === 'boolean', 400, 'Invalid avatar position.');
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
        for (const [id, x, z] of LANDMARKS) if (Math.hypot(x - state.x, z - state.z) <= 8 && !user.visitedLandmarks.includes(id)) { user.visitedLandmarks.push(id); discovered = true; }
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
