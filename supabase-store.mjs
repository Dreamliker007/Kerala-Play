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

function mapWorldStateToRow(user) {
  const x = Number(user.worldX), z = Number(user.worldZ), rotation = Number(user.worldRotation);
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 110.01 || Math.abs(z) > 110.01) return null;
  return {
    user_id: user.id,
    x,
    z,
    rotation: Number.isFinite(rotation) ? rotation : 0,
    updated_at: iso(user.worldUpdatedAt),
  };
}

function applyWorldState(user, row) {
  if (!row) return user;
  const x = Number(row.x), z = Number(row.z), rotation = Number(row.rotation);
  if (Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 110.01 && Math.abs(z) <= 110.01) {
    user.worldX = x;
    user.worldZ = z;
    user.worldRotation = Number.isFinite(rotation) ? rotation : 0;
    user.worldUpdatedAt = Date.parse(row.updated_at) || Date.now();
  }
  return user;
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

  let worldStateAvailable = true;
  let worldStateWarningShown = false;

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

  async function optionalWorldRequest(path, options) {
    if (!worldStateAvailable) return null;
    try { return await request(path, options); }
    catch (error) {
      const message = String(error?.message || error);
      if (/kp_world_state|kp_replace_world_state|PGRST202|PGRST205/i.test(message)) {
        worldStateAvailable = false;
        if (!worldStateWarningShown) {
          worldStateWarningShown = true;
          console.warn('[Kerala Play] world-position persistence is waiting for supabase/virtual-world-core-v1.sql.');
        }
        return null;
      }
      throw error;
    }
  }

  async function load() {
    const [users, follows, blocks, messages, worldStates] = await Promise.all([
      request('kp_users?select=*&order=created_at.asc'),
      request('kp_follows?select=*&order=created_at.asc'),
      request('kp_blocks?select=*&order=created_at.asc'),
      request('kp_messages?select=*&order=created_at.asc'),
      optionalWorldRequest('kp_world_state?select=*&order=updated_at.asc'),
    ]);
    const worldByUser = new Map((worldStates || []).map(row => [row.user_id, row]));
    return {
      version: 1,
      users: (users || []).map(row => applyWorldState(mapUserFromRow(row), worldByUser.get(row.id))),
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
    const worldPayload = (db.users || []).map(mapWorldStateToRow).filter(Boolean);
    await optionalWorldRequest('rpc/kp_replace_world_state', { method: 'POST', body: { payload: worldPayload } });
  }

  return { load, save };
}
