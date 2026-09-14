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
  if (db.version !== 1 || !['users', 'follows', 'blocks', 'messages'].every(key => Array.isArray(db[key]))) throw new Error('Unsupported saved game data.');
  const sessions = new Map(), clients = new Map(), presence = new Map(), rounds = new Map(), rates = new Map(), resetTokens = new Map();
  let dirty = false, worldDirty = false, saveQueue = Promise.resolve();
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
  function publicUser(user) {
    const position = presence.get(user.id), [spawnX, spawnZ] = DISTRICTS[user.district];
    let level = 1, remaining = user.points, next = 100;
    while (remaining >= next) { remaining -= next; level++; next = 100 + (level - 1) * 50; }
    const displayName = user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username);
    return { id: user.id, username: displayName, name: displayName, district: user.district, gender: user.gender, bio: user.bio, points: user.points, level, followers: db.follows.filter(follow => follow.to === user.id && follow.status === 'accepted').length, following: db.follows.filter(follow => follow.from === user.id && follow.status === 'accepted').length, completedTasks: [...user.completedTasks], walkMeters: Math.floor(user.walkMeters), visitedLandmarks: [...user.visitedLandmarks], x: position?.x ?? spawnX + 12, z: position?.z ?? spawnZ };
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
      return { id, username: user.displayName || (/^\d+$/.test(user.username) ? 'Explorer' : user.username), gender: user.gender, district: user.district, x: state.x, z: state.z, rotation: state.rotation, moving: state.moving };
    }) };
  }
  function place(user) {
    const [landmarkX, z] = DISTRICTS[user.district];
    const x = landmarkX + 12; // Spawn beside landmarks, outside their buildings.
    const state = { x, z, rotation: 0, moving: false, lastSeen: now(), movedAt: now(), movementCredit: 2, lastProfile: now() };
    presence.set(user.id, state); worldDirty = true;
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
        const user = { id: randomUUID(), firstName, username, email, mobile, passwordHash, salt, district, gender, bio: '', points: 0, completedTasks: [], walkMeters: 0, visitedLandmarks: [], createdAt: now(), gameDay: '', gameWins: 0 };
        db.users.push(user); await persist(); startSession(user, response, request); socialChanged();
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
        else { const code = String(randomInt(100000, 1000000)); resetTokens.set(hashToken(code), { userId: user.id, expires: now() + 10 * 60000 }); console.log(`[Kerala Play] reset OTP for ${user.username}: ${code}`); send(response, 200, { ok: true, message: 'Reset code issued. In local mode, check the server console.' }); }
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
        if (relocate) place(user);
        await persist(); profileChanged(user); socialChanged();
        send(response, 200, { user: publicUser(user) }); return;
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
        const state = presence.get(user.id) || place(user);
        const elapsed = Math.max(0, Math.min((now() - state.movedAt) / 1000, 3));
        const credit = Math.min(24, state.movementCredit + elapsed * 8.5);
        const distance = Math.hypot(body.x - state.x, body.z - state.z);
        if (distance > credit + 0.01) throw new ApiError(409, 'Movement was too fast. Your avatar needs to resync.', { x: state.x, z: state.z });
        state.movementCredit = credit - distance; state.movedAt = now(); state.lastSeen = now();
        state.x = body.x; state.z = body.z; state.rotation = body.rotation; state.moving = body.moving;
        user.walkMeters += distance;
        let discovered = false;
        for (const [id, x, z] of LANDMARKS) if (Math.hypot(x - state.x, z - state.z) <= 8 && !user.visitedLandmarks.includes(id)) { user.visitedLandmarks.push(id); discovered = true; }
        dirty = dirty || distance > 0 || discovered; worldDirty = true;
        if (discovered || now() - state.lastProfile >= 2000) { profileChanged(user); state.lastProfile = now(); }
        send(response, 200, { ok: true, user: publicUser(user), walkMeters: Math.floor(user.walkMeters), visitedLandmarks: user.visitedLandmarks }); return;
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
  const port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.log(`Kerala Play running at http://${host}:${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.shutdown(); process.exit(0); });
}
