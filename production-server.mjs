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

function worldAlertsFromEnv() {
  const raw = process.env.KP_WORLD_ALERTS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('expected a JSON array');
    return parsed;
  } catch (error) {
    console.error('[Kerala Play] KP_WORLD_ALERTS_JSON ignored:', error.message);
    return [];
  }
}

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
const recoveryProbeUser = remoteDatabase.users.find(user => String(user.username || '').toLowerCase() === 'anson');
console.log('[Kerala Play] recovery probe Anson:', recoveryProbeUser ? JSON.stringify({
  exists: true,
  username: recoveryProbeUser.username,
  firstName: recoveryProbeUser.firstName || '',
  district: recoveryProbeUser.district,
  gender: recoveryProbeUser.gender,
  points: Number(recoveryProbeUser.points || 0),
  walletBalance: Number(recoveryProbeUser.walletBalance || 0),
  completedTasks: Array.isArray(recoveryProbeUser.completedTasks) ? recoveryProbeUser.completedTasks : [],
  visitedLandmarks: Array.isArray(recoveryProbeUser.visitedLandmarks) ? recoveryProbeUser.visitedLandmarks : [],
  walkMeters: Number(recoveryProbeUser.walkMeters || 0),
  createdAt: Number(recoveryProbeUser.createdAt || 0)
}) : JSON.stringify({ exists: false }));
const initialSnapshot = JSON.stringify(remoteDatabase);
await atomicWrite(DATABASE_PATH, initialSnapshot);

// Fail before accepting traffic if the transactional RPC or credentials are
// missing. This also validates that the installed schema matches this server.
await store.save(initialSnapshot);

const server = await createGameServer({ dataDir: DATA_DIR, worldAlerts: worldAlertsFromEnv() });

// Keep the game server's strict static-file allowlist, but expose public policy
// pages at stable, human-readable URLs required by app stores.
const gameRequestListener = server.listeners('request')[0];
if (gameRequestListener) {
  server.removeListener('request', gameRequestListener);
  server.on('request', (request, response) => {
    let pathname = '';
    try { pathname = new URL(request.url, 'http://localhost').pathname; }
    catch { /* The game listener will return the normal error response. */ }

    if (pathname === '/__kp_recovery_lookup' && request.method === 'GET') {
      const url = new URL(request.url, 'http://localhost');
      const token = url.searchParams.get('token') || '';
      const recoveryToken = process.env.KP_RECOVERY_TOKEN || '';
      if (!recoveryToken || token.length !== recoveryToken.length || token !== recoveryToken) {
        response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      const username = String(url.searchParams.get('username') || '').trim().toLowerCase();
      void store.load()
        .then(database => {
          const user = database.users.find(item => String(item.username || '').toLowerCase() === username);
          const body = user ? {
            exists: true,
            user: {
              username: user.username,
              firstName: user.firstName || '',
              district: user.district,
              gender: user.gender,
              points: Number(user.points || 0),
              walletBalance: Number(user.walletBalance || 0),
              completedTasks: Array.isArray(user.completedTasks) ? user.completedTasks : [],
              visitedLandmarks: Array.isArray(user.visitedLandmarks) ? user.visitedLandmarks : [],
              walkMeters: Number(user.walkMeters || 0),
              createdAt: Number(user.createdAt || 0)
            }
          } : { exists: false };
          const data = Buffer.from(JSON.stringify(body));
          response.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': data.length,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer'
          });
          response.end(data);
        })
        .catch(error => {
          console.error('[Kerala Play] recovery lookup failed:', error.message);
          if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          response.end(JSON.stringify({ error: 'Recovery lookup failed' }));
        });
      return;
    }

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
