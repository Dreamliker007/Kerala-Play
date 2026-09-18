# Kerala Play Full Script Backup — Part 2: Backend & Configuration

## server.mjs

```javascript
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
  const port = Number(process.env.PORT || 3000), host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, () => console.log(`Kerala Play running at http://${host}:${server.address().port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await server.shutdown(); process.exit(0); });
}

```

---

## production-server.mjs

```javascript
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createGameServer } from './server.mjs';
import { createSupabaseStore } from './supabase-store.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(ROOT, '.data-production-cache');
const DATABASE_PATH = resolve(DATA_DIR, 'game.json');
const SYNC_INTERVAL = Math.max(250, Number(process.env.KP_SYNC_INTERVAL_MS || 1000));

async function atomicWrite(path, content) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, content, { mode: 0o600 });
  await rename(temporary, path);
}

const store = createSupabaseStore();
await mkdir(DATA_DIR, { recursive: true });

// Supabase is authoritative at process start. The JSON file is only a runtime
// cache for the existing API server while the migration remains incremental.
const remoteDatabase = await store.load();
const initialSnapshot = JSON.stringify(remoteDatabase);
await atomicWrite(DATABASE_PATH, initialSnapshot);

// Fail before accepting traffic if the transactional RPC or credentials are
// missing. This also validates that the installed schema matches this server.
await store.save(initialSnapshot);

const server = await createGameServer({ dataDir: DATA_DIR });

// Keep the game server's strict static-file allowlist, but expose public policy
// pages at stable, human-readable URLs required by app stores.
const gameRequestListener = server.listeners('request')[0];
if (gameRequestListener) {
  server.removeListener('request', gameRequestListener);
  server.on('request', (request, response) => {
    let pathname = '';
    try { pathname = new URL(request.url, 'http://localhost').pathname; }
    catch { /* The game listener will return the normal error response. */ }

    const publicPages = new Map([
      ['/privacy-policy', 'privacy-policy.html'],
      ['/privacy-policy/', 'privacy-policy.html'],
      ['/privacy-policy.html', 'privacy-policy.html'],
      ['/delete-account', 'delete-account.html'],
      ['/delete-account/', 'delete-account.html'],
      ['/delete-account.html', 'delete-account.html'],
    ]);
    const publicPage = publicPages.get(pathname);
    if (publicPage && (request.method === 'GET' || request.method === 'HEAD')) {
      void readFile(resolve(ROOT, publicPage))
        .then(data => {
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': data.length,
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'same-origin',
            'X-Frame-Options': 'DENY',
          });
          response.end(request.method === 'HEAD' ? undefined : data);
        })
        .catch(error => {
          console.error(`[Kerala Play] public page read failed (${publicPage}):`, error.message);
          if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('This Kerala Play information page is temporarily unavailable.');
        });
      return;
    }

    gameRequestListener(request, response);
  });
}

let lastSyncedSnapshot = initialSnapshot;
let stopped = false;
let syncQueue = Promise.resolve();

async function syncSnapshot(force = false) {
  const snapshot = await readFile(DATABASE_PATH, 'utf8');
  if (!force && snapshot === lastSyncedSnapshot) return;
  await store.save(snapshot);
  lastSyncedSnapshot = snapshot;
}

function queueSync(force = false) {
  syncQueue = syncQueue
    .then(() => syncSnapshot(force))
    .catch(error => {
      console.error('[Kerala Play] Supabase sync failed:', error.message);
      if (force) throw error;
    });
  return syncQueue;
}

const syncTimer = setInterval(() => {
  if (!stopped) void queueSync();
}, SYNC_INTERVAL);
syncTimer.unref();

const baseShutdown = server.shutdown.bind(server);
server.shutdown = async () => {
  if (stopped) return;
  stopped = true;
  clearInterval(syncTimer);
  // Let the game server flush any dirty in-memory state to its runtime cache,
  // then push that exact final snapshot to Supabase before the process exits.
  await baseShutdown();
  await syncQueue;
  await queueSync(true);
};
server.on('close', () => clearInterval(syncTimer));

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => {
  console.log(`Kerala Play production backend running at http://${host}:${server.address().port}`);
  console.log('[Kerala Play] durable storage: Supabase');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    try { await server.shutdown(); process.exit(0); }
    catch (error) { console.error('[Kerala Play] shutdown failed:', error); process.exit(1); }
  });
}

```

---

## public-server.mjs

```javascript
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGameServer } from './server.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const server = await createGameServer();

// Preserve the existing game/API server while exposing stable public policy
// pages for the website and Google Play listing.
const gameRequestListener = server.listeners('request')[0];
if (gameRequestListener) {
  server.removeListener('request', gameRequestListener);
  server.on('request', (request, response) => {
    let pathname = '';
    try { pathname = new URL(request.url, 'http://localhost').pathname; }
    catch { /* The game listener will handle malformed requests. */ }

    const publicPages = new Map([
      ['/privacy-policy', 'privacy-policy.html'],
      ['/privacy-policy/', 'privacy-policy.html'],
      ['/privacy-policy.html', 'privacy-policy.html'],
      ['/delete-account', 'delete-account.html'],
      ['/delete-account/', 'delete-account.html'],
      ['/delete-account.html', 'delete-account.html'],
    ]);
    const publicPage = publicPages.get(pathname);
    if (publicPage && (request.method === 'GET' || request.method === 'HEAD')) {
      void readFile(resolve(ROOT, publicPage))
        .then(data => {
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': data.length,
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'same-origin',
            'X-Frame-Options': 'DENY',
          });
          response.end(request.method === 'HEAD' ? undefined : data);
        })
        .catch(error => {
          console.error(`[Kerala Play] public page read failed (${publicPage}):`, error.message);
          if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('This Kerala Play information page is temporarily unavailable.');
        });
      return;
    }

    gameRequestListener(request, response);
  });
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => console.log(`Kerala Play running at http://${host}:${server.address().port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    try { await server.shutdown(); process.exit(0); }
    catch (error) { console.error('[Kerala Play] shutdown failed:', error); process.exit(1); }
  });
}

```

---

## supabase-store.mjs

```javascript
const INLINE_AUDIO_PREFIX = 'inline-base64:';

function required(value, name) {
  if (!value) throw new Error(`${name} is required for the production backend.`);
  return value;
}

function iso(value) {
  const date = new Date(Number(value) || value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function dateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function mapUserToRow(user) {
  const firstName = String(user.firstName || user.username || 'Player').trim().slice(0, 40);
  return {
    id: user.id,
    first_name: firstName.length >= 2 ? firstName : 'Player',
    username: user.username,
    email: user.email || null,
    mobile: user.mobile || null,
    password_hash: user.passwordHash,
    password_salt: user.salt,
    district: user.district,
    gender: user.gender,
    bio: user.bio || '',
    points: Number(user.points || 0),
    completed_tasks: Array.isArray(user.completedTasks) ? user.completedTasks : [],
    walk_meters: Number(user.walkMeters || 0),
    visited_landmarks: Array.isArray(user.visitedLandmarks) ? user.visitedLandmarks : [],
    game_day: dateOnly(user.gameDay),
    game_wins: Number(user.gameWins || 0),
    created_at: iso(user.createdAt),
  };
}

function mapUserFromRow(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    username: row.username,
    email: row.email || '',
    mobile: row.mobile || '',
    passwordHash: row.password_hash,
    salt: row.password_salt,
    district: row.district,
    gender: row.gender,
    bio: row.bio || '',
    points: Number(row.points || 0),
    completedTasks: row.completed_tasks || [],
    walkMeters: Number(row.walk_meters || 0),
    visitedLandmarks: row.visited_landmarks || [],
    createdAt: Date.parse(row.created_at) || Date.now(),
    gameDay: row.game_day || '',
    gameWins: Number(row.game_wins || 0),
  };
}

function mapMessageToRow(message) {
  const inlineVoice = typeof message.audio === 'string' && message.audio.length > 0;
  const storedVoice = !inlineVoice && typeof message.audioPath === 'string' && message.audioPath.length > 0;
  const voice = inlineVoice || storedVoice;
  return {
    id: message.id,
    from_id: message.from,
    to_id: message.to,
    body: voice ? null : message.body,
    audio_path: inlineVoice ? `${INLINE_AUDIO_PREFIX}${message.audio}` : (storedVoice ? message.audioPath : null),
    audio_mime: voice ? message.mime : null,
    audio_duration: voice ? Number(message.duration || 0) : null,
    created_at: iso(message.createdAt),
  };
}

function mapMessageFromRow(row) {
  const message = {
    id: row.id,
    from: row.from_id,
    to: row.to_id,
    createdAt: Date.parse(row.created_at) || Date.now(),
  };
  if (row.body !== null && row.body !== undefined) message.body = row.body;
  else if (typeof row.audio_path === 'string' && row.audio_path.startsWith(INLINE_AUDIO_PREFIX)) {
    message.audio = row.audio_path.slice(INLINE_AUDIO_PREFIX.length);
    message.mime = row.audio_mime;
    message.duration = Number(row.audio_duration || 0);
  } else if (row.audio_path) {
    // Reserved for the next storage slice where audio_path points at a private bucket object.
    message.audioPath = row.audio_path;
    message.mime = row.audio_mime;
    message.duration = Number(row.audio_duration || 0);
  }
  return message;
}

export function createSupabaseStore({
  url = process.env.SUPABASE_URL,
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = globalThis.fetch,
} = {}) {
  const baseUrl = required(url, 'SUPABASE_URL').replace(/\/$/, '');
  const key = required(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required. Use Node.js 20 or later.');

  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetchImpl(`${baseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      let details = text;
      try { details = JSON.parse(text)?.message || text; } catch { /* keep response text */ }
      throw new Error(`Supabase request failed (${response.status}): ${details || response.statusText}`);
    }
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  }

  async function load() {
    const [users, follows, blocks, messages] = await Promise.all([
      request('kp_users?select=*&order=created_at.asc'),
      request('kp_follows?select=*&order=created_at.asc'),
      request('kp_blocks?select=*&order=created_at.asc'),
      request('kp_messages?select=*&order=created_at.asc'),
    ]);
    return {
      version: 1,
      users: (users || []).map(mapUserFromRow),
      follows: (follows || []).map(row => ({ from: row.from_id, to: row.to_id, status: row.status })),
      blocks: (blocks || []).map(row => ({ from: row.from_id, to: row.to_id })),
      messages: (messages || []).map(mapMessageFromRow),
    };
  }

  async function save(snapshot) {
    const db = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
    if (!db || db.version !== 1) throw new Error('Unsupported Kerala Play snapshot.');
    const payload = {
      users: (db.users || []).map(mapUserToRow),
      follows: (db.follows || []).map(follow => ({ from_id: follow.from, to_id: follow.to, status: follow.status })),
      blocks: (db.blocks || []).map(block => ({ from_id: block.from, to_id: block.to })),
      messages: (db.messages || []).map(mapMessageToRow),
    };
    await request('rpc/kp_replace_snapshot', { method: 'POST', body: { payload } });
  }

  return { load, save };
}

```

---

## server.test.mjs

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createGameServer } from '../server.mjs';

async function setup(t) {
  const dataDir = await mkdtemp(join(tmpdir(), 'kerala-play-test-'));
  let timestamp = Date.now();
  let server;
  let origin;
  async function boot() {
    server = await createGameServer({ dataDir, now: () => timestamp });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  await boot();
  t.after(async () => {
    await server.shutdown();
    assert.ok(resolve(dataDir).startsWith(resolve(tmpdir()) + sep + 'kerala-play-test-'));
    await rm(dataDir, { recursive: true, force: true });
  });
  function client(initialCookie = '') {
    let cookie = initialCookie;
    const request = async (path, body, method = body === undefined ? 'GET' : 'POST', extraHeaders = {}) => {
      const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const text = await response.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      return { status: response.status, data, headers: response.headers };
    };
    request.forkSession = () => client(cookie);
    request.events = async () => {
      const controller = new AbortController();
      const response = await fetch(origin + '/api/events', { headers: { Cookie: cookie }, signal: controller.signal });
      assert.equal(response.status, 200);
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = '';
      return {
        async next(name, matches = () => true) {
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            while (true) {
              let boundary;
              while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
                const event = frame.match(/^event: (.*)$/m)?.[1], encoded = frame.match(/^data: (.*)$/m)?.[1];
                if (event === name && encoded) { const payload = JSON.parse(encoded); if (matches(payload)) return payload; }
              }
              const result = await reader.read();
              assert.equal(result.done, false, 'Event stream closed before expected event');
              buffer += decoder.decode(result.value, { stream: true });
            }
          } finally { clearTimeout(timeout); }
        },
        async closed() {
          const timeout = setTimeout(() => controller.abort(), 5000);
          try { while (!(await reader.read()).done) { /* Drain events queued before revocation. */ } }
          finally { clearTimeout(timeout); }
        },
        async close() { await reader.cancel(); controller.abort(); },
      };
    };
    return request;
  }
  return { client, advance(ms) { timestamp += ms; }, dataDir, async restart() { await server.shutdown(); await boot(); } };
}
async function signup(client, username) {
  const response = await client('/api/auth/signup', { username, password: 'test-password-2026', district: 'Ernakulam', gender: 'female' });
  assert.equal(response.status, 201, JSON.stringify(response.data));
  return response.data.user;
}

test('signup starts at zero, hashes passwords, enforces credentials and session cookies', async t => {
  const app = await setup(t), alice = app.client(), guest = app.client();
  assert.equal((await guest('/api/session')).data.user, null);
  assert.equal((await guest('/api/people')).status, 401);
  const user = await signup(alice, 'Alice');
  assert.equal(user.points, 0); assert.equal(user.level, 1); assert.deepEqual(user.completedTasks, []);
  assert.equal(user.passwordHash, undefined); assert.equal(user.salt, undefined);
  const duplicate = await guest('/api/auth/signup', { username: 'alice', password: 'test-password-2026' });
  assert.equal(duplicate.status, 409);
  assert.equal((await guest('/api/auth/login', { username: 'ALICE', password: 'wrong-password' })).status, 401);
  const login = await guest('/api/auth/login', { username: 'ALICE', password: 'test-password-2026' });
  assert.equal(login.status, 200); assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await guest('/api/session')).data.user.id, user.id);
  await guest('/api/auth/logout', {});
  assert.equal((await guest('/api/session')).data.user, null);
  const saved = await readFile(join(app.dataDir, 'game.json'), 'utf8');
  assert.ok(!saved.includes('test-password-2026')); assert.match(saved, /passwordHash/);
});

test('a receiver must accept a follow before text, voice messages or live voice; blocks revoke both directions', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const a = await signup(alice, 'Alice'), b = await signup(bob, 'Bob');
  const text = { body: 'Hello Kerala' }, voice = { audio: Buffer.from('voice bytes').toString('base64'), mime: 'audio/webm;codecs=opus', duration: 1.5 };
  assert.equal((await alice(`/api/messages/${b.id}`, text)).status, 403);
  assert.equal((await alice(`/api/voice/signal/${b.id}`, { data: { type: 'request' } })).status, 403);
  assert.equal((await alice(`/api/follows/${b.id}`, { action: 'request' })).status, 200);
  assert.equal((await alice(`/api/follows/${b.id}`, { action: 'accept' })).status, 409);
  assert.equal((await alice(`/api/messages/${b.id}`, voice)).status, 403);
  assert.equal((await bob('/api/people')).data.people[0].relationship, 'incoming');
  assert.equal((await bob(`/api/follows/${a.id}`, { action: 'accept' })).status, 200);
  assert.equal((await alice('/api/people')).data.people[0].relationship, 'following');
  assert.equal((await bob('/api/people')).data.people[0].relationship, 'follower');
  assert.equal((await alice(`/api/messages/${b.id}`, text)).status, 201);
  assert.equal((await bob(`/api/messages/${a.id}`, voice)).status, 201);
  assert.equal((await alice(`/api/messages/${b.id}`)).data.messages.length, 2);
  assert.equal((await alice(`/api/voice/signal/${b.id}`, { data: { type: 'offer', callId: 'call-one', sdp: 'v=0\r\n' } })).status, 200);
  assert.equal((await alice('/api/tasks/social/claim', {})).data.reward, 35);
  assert.equal((await bob(`/api/blocks/${a.id}`, { blocked: true })).status, 200);
  for (const [client, peer] of [[alice, b], [bob, a]]) {
    assert.equal((await client(`/api/messages/${peer.id}`)).status, 403);
    assert.equal((await client(`/api/messages/${peer.id}`, text)).status, 403);
    assert.equal((await client(`/api/messages/${peer.id}`, voice)).status, 403);
    assert.equal((await client(`/api/voice/signal/${peer.id}`, { data: { type: 'request' } })).status, 403);
    assert.equal((await client(`/api/follows/${peer.id}`, { action: 'request' })).status, 403);
  }
  await bob(`/api/blocks/${a.id}`, { blocked: false });
  assert.equal((await alice(`/api/messages/${b.id}`, text)).status, 403);
  assert.equal((await alice('/api/session')).data.user.following, 0);
});

test('a reciprocal block cannot reveal the blocking player profile or live location', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const a = await signup(alice, 'Alice'), b = await signup(bob, 'Bob');
  await bob('/api/profile', { bio: 'Private profile details' }, 'PATCH');
  await bob('/api/tasks/open-map/claim', {});
  assert.equal((await bob(`/api/blocks/${a.id}`, { blocked: true })).status, 200);
  assert.equal((await alice(`/api/profile/${b.id}`)).status, 404);
  assert.ok(!(await alice('/api/people')).data.people.some(person => person.id === b.id));
  // Knowing the player id must not allow recovering profile details by blocking back.
  assert.equal((await alice(`/api/blocks/${b.id}`, { blocked: true })).status, 200);
  for (const [viewer, peer] of [[alice, b], [bob, a]]) {
    const profile = await viewer(`/api/profile/${peer.id}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.data.blocked, true);
    assert.equal(profile.data.canMessage, false);
    assert.equal(profile.data.user.id, peer.id);
    assert.equal(profile.data.user.username, peer.username);
    const listed = (await viewer('/api/people')).data.people.find(person => person.id === peer.id);
    assert.ok(listed, 'Own blocked contacts remain available to unblock');
    assert.equal(listed.blocked, true);
    for (const record of [profile.data.user, listed]) {
      for (const field of ['x', 'z', 'bio', 'points', 'walkMeters', 'visitedLandmarks', 'completedTasks']) {
        assert.ok(!Object.hasOwn(record, field), `Blocked contacts must not expose ${field}`);
      }
    }
    assert.equal((await viewer(`/api/voice/signal/${peer.id}`, { data: { type: 'request' } })).status, 403);
    assert.equal((await viewer(`/api/messages/${peer.id}`)).status, 403);
  }
});

test('switching the shared browser session revokes its old token and event streams across tabs', async t => {
  const app = await setup(t), browser = app.client(), independentBob = app.client();
  const a = await signup(browser, 'Alice'), b = await signup(independentBob, 'Bob');
  const siblingTab = browser.forkSession();
  const primaryEvents = await browser.events(), siblingEvents = await siblingTab.events();
  let newEvents;
  try {
    assert.equal((await primaryEvents.next('profile')).user.id, a.id);
    assert.equal((await siblingEvents.next('profile')).user.id, a.id);
    const changed = await browser('/api/auth/login', { username: 'Bob', password: 'test-password-2026' });
    assert.equal(changed.status, 200);
    assert.equal(changed.data.user.id, b.id);
    await Promise.all([primaryEvents.closed(), siblingEvents.closed()]);
    assert.equal((await siblingTab('/api/session')).data.user, null);
    assert.equal((await siblingTab('/api/people')).status, 401);
    assert.equal((await browser('/api/session')).data.user.id, b.id);
    newEvents = await browser.events();
    assert.equal((await newEvents.next('profile')).user.id, b.id);
    const newSiblingTab = browser.forkSession();
    assert.equal((await browser('/api/auth/logout', {})).status, 200);
    await newEvents.closed();
    assert.equal((await newSiblingTab('/api/session')).data.user, null);
    assert.equal((await independentBob('/api/session')).data.user.id, b.id, 'A different browser session should remain valid');
  } finally {
    await primaryEvents.close(); await siblingEvents.close();
    if (newEvents) await newEvents.close();
  }
});

test('private files and cross-origin writes are rejected', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'Alice');
  for (const path of ['/.data/game.json', '/server.mjs', '/package.json', '/tests/server.test.mjs', '/assets/../.data/game.json', '/.git/config']) assert.equal((await alice(path)).status, 404, path);
  assert.equal((await alice('/')).status, 200);
  assert.equal((await alice('/api/profile', { bio: 'CSRF' }, 'PATCH', { Origin: 'https://other.example' })).status, 403);
  assert.equal((await alice('/api/profile', { bio: 'valid bio', points: 9000 }, 'PATCH')).status, 200);
  assert.equal((await alice('/api/session')).data.user.points, 0);
});

test('task rewards validate movement and acceptance; rewards and game rounds cannot replay; progress persists', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'Alice');
  assert.equal((await alice('/api/tasks/walk-50/claim', {})).status, 409);
  assert.equal((await alice('/api/tasks/visit-landmark/claim', {})).status, 409);
  assert.equal((await alice('/api/tasks/social/claim', {})).status, 409);
  assert.equal((await alice('/api/tasks/open-map/claim', {})).data.reward, 10);
  assert.equal((await alice('/api/tasks/open-map/claim', {})).status, 409);
  assert.equal((await alice('/api/world/move', { x: 60, z: 60, rotation: 0, moving: true })).status, 409);
  app.advance(2000);
  assert.equal((await alice('/api/world/move', { x: -26, z: 6, rotation: 0, moving: true })).status, 200);
  assert.equal((await alice('/api/tasks/visit-landmark/claim', {})).data.reward, 50);
  for (let i = 0; i < 10; i++) {
    app.advance(1000);
    assert.equal((await alice('/api/world/move', { x: i % 2 ? -26 : -20, z: 6, rotation: 0, moving: true })).status, 200);
  }
  assert.equal((await alice('/api/tasks/walk-50/claim', {})).data.reward, 25);
  const round = (await alice('/api/games/coconut/start', {})).data;
  app.advance(5000);
  const win = await alice('/api/games/coconut/finish', round);
  assert.equal(win.status, 200); assert.equal(win.data.user.points, 105); assert.equal(win.data.user.level, 2);
  assert.equal((await alice('/api/games/coconut/finish', round)).status, 409);
  const badRound = (await alice('/api/games/coconut/start', {})).data;
  app.advance(5000);
  const wrong = [...badRound.sequence]; wrong[0] = (wrong[0] + 1) % 4;
  assert.equal((await alice('/api/games/coconut/finish', { roundId: badRound.roundId, sequence: wrong })).status, 400);
  assert.equal((await alice('/api/games/coconut/finish', badRound)).status, 409);
  await app.restart();
  assert.equal((await alice('/api/session')).data.user, null);
  assert.equal((await alice('/api/auth/login', { username: 'Alice', password: 'test-password-2026' })).data.user.points, 105);
  assert.equal((await alice('/api/tasks/open-map/claim', {})).status, 409);
});

test('live event streams share positions and direct messages, relay accepted voice, and hide blocked avatars', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const a = await signup(alice, 'Alice'), b = await signup(bob, 'Bob');
  const aliceEvents = await alice.events(), bobEvents = await bob.events();
  try {
    const initial = await bobEvents.next('world');
    assert.ok(initial.players.some(player => player.id === a.id && player.username === 'Alice'));
    await alice(`/api/follows/${b.id}`, { action: 'request' });
    await bob(`/api/follows/${a.id}`, { action: 'accept' });
    await alice(`/api/messages/${b.id}`, { body: 'Live message' });
    assert.equal((await bobEvents.next('message')).peerId, a.id);
    await alice(`/api/voice/signal/${b.id}`, { data: { type: 'request' } });
    const signal = await bobEvents.next('signal');
    assert.equal(signal.from, a.id); assert.equal(signal.data.type, 'request');
    await alice('/api/world/move', { x: -13, z: 6, rotation: 0.5, moving: true });
    const moved = await bobEvents.next('world', snapshot => snapshot.players.some(player => player.id === a.id && player.x === -13));
    assert.equal(moved.players.find(player => player.id === a.id).rotation, 0.5);
    await bob(`/api/blocks/${a.id}`, { blocked: true });
    const filtered = await bobEvents.next('world', snapshot => !snapshot.players.some(player => player.id === a.id));
    assert.ok(filtered.players.some(player => player.id === b.id));
    assert.equal((await aliceEvents.next('signal', event => event.data.type === 'disabled')).from, b.id);
  } finally { await aliceEvents.close(); await bobEvents.close(); }
});

test('game rewards cap at five per day, expired rounds fail, and levels use increasing thresholds', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'Alice');
  for (let day = 0; day < 3; day++) {
    for (let win = 0; win < 5; win++) {
      const round = (await alice('/api/games/coconut/start', {})).data;
      app.advance(5000);
      assert.equal((await alice('/api/games/coconut/finish', round)).status, 200);
    }
    assert.equal((await alice('/api/games/coconut/start', {})).status, 409);
    const user = (await alice('/api/session')).data.user;
    assert.equal(user.points, (day + 1) * 100);
    assert.equal(user.level, day === 2 ? 3 : 2);
    app.advance(24 * 60 * 60 * 1000);
  }
  const expired = (await alice('/api/games/coconut/start', {})).data;
  app.advance(121000);
  assert.equal((await alice('/api/games/coconut/finish', expired)).status, 409);
  assert.equal((await alice('/api/session')).data.user.points, 300);
});

```

---

## package.json

```json
{
  "name": "kerala-play",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Kerala Play persistent social world",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node public-server.mjs",
    "start:production": "node production-server.mjs",
    "production:check": "node scripts/check-production-env.mjs",
    "production:import-local": "node scripts/import-local-game.mjs",
    "test": "node --test tests/server.test.mjs",
    "mobile:prepare": "node scripts/prepare-mobile.mjs",
    "mobile:add": "npm run mobile:prepare && npx cap add android",
    "mobile:sync": "npm run mobile:prepare && npx cap sync android",
    "mobile:open": "npm run mobile:sync && npx cap open android",
    "mobile:release:check": "node scripts/check-mobile-release.mjs"
  },
  "dependencies": {
    "@capacitor/android": "^8.0.0",
    "@capacitor/core": "^8.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^8.0.0"
  }
}

```

---

## .env.production.example

```text
# Server-only production environment. Do not commit real secrets.
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
COOKIE_SECURE=1
KP_SYNC_INTERVAL_MS=1000

# Optional password-reset email delivery
RESEND_API_KEY=
EMAIL_FROM=

```

---

## .gitignore

```text
.data/
.data-production-cache/
.test-data*/
node_modules/
*.log
www/
android/

```

---

## capacitor.config.json

```json
{
  "appId": "com.dreamliker007.keralaplay",
  "appName": "Kerala Play",
  "webDir": "www",
  "server": {
    "url": "https://keralaplay.in",
    "cleartext": false
  },
  "android": {
    "allowMixedContent": false
  }
}

```

---

