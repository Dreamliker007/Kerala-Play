import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGameServer } from './server.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const API_UPSTREAM = String(process.env.KP_API_UPSTREAM || '').replace(/\/$/, '');
const API_TIMEOUT_MS = Math.max(5000, Number(process.env.KP_API_TIMEOUT_MS || 15000));
const API_WAKE_WINDOW_MS = Math.max(API_TIMEOUT_MS, Number(process.env.KP_API_WAKE_WINDOW_MS || 70000));
const API_RETRY_DELAY_MS = Math.max(750, Number(process.env.KP_API_RETRY_DELAY_MS || 2200));

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
const server = await createGameServer({ worldAlerts: worldAlertsFromEnv() });

function transientUpstreamStatus(status) {
  return [429, 502, 503, 504].includes(Number(status));
}

async function fetchUpstream(target, options, requestMethod, pathname) {
  const safeRetry = ['GET', 'HEAD'].includes(requestMethod) || (requestMethod === 'POST' && pathname === '/api/auth/login');
  const deadline = Date.now() + (safeRetry ? API_WAKE_WINDOW_MS : API_TIMEOUT_MS);
  let lastResponse = null;
  let lastError = null;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    const remaining = Math.max(1000, deadline - Date.now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(API_TIMEOUT_MS, remaining));
    try {
      const upstream = await fetch(target, { ...options, signal: controller.signal });
      lastResponse = upstream;
      lastError = null;
      if (!safeRetry || !transientUpstreamStatus(upstream.status)) return upstream;
      await upstream.body?.cancel?.().catch?.(() => {});
    } catch (error) {
      lastError = error;
      if (!safeRetry) throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!safeRetry || Date.now() >= deadline) break;
    const backoff = Math.min(5000, API_RETRY_DELAY_MS + Math.max(0, attempt - 1) * 350);
    await new Promise(resolve => setTimeout(resolve, Math.min(backoff, Math.max(0, deadline - Date.now()))));
  }

  if (lastResponse) return lastResponse;
  if (lastError) throw lastError;
  throw new Error('Production API did not become ready in time');
}

// Preserve the existing game/API server while exposing stable public policy
// pages for the website and Google Play listing.
const gameRequestListener = server.listeners('request')[0];
if (gameRequestListener) {
  server.removeListener('request', gameRequestListener);
  server.on('request', (request, response) => {
    let pathname = '';
    try { pathname = new URL(request.url, 'http://localhost').pathname; }
    catch { /* The game listener will handle malformed requests. */ }

    if (API_UPSTREAM && pathname.startsWith('/api/')) {
      void (async () => {
        try {
          const target = new URL(request.url, API_UPSTREAM);
          const headers = new Headers();
          for (const [name, value] of Object.entries(request.headers)) {
            if (value === undefined) continue;
            if (['host', 'content-length', 'connection'].includes(name.toLowerCase())) continue;
            headers.set(name, Array.isArray(value) ? value.join(', ') : String(value));
          }
          headers.set('origin', API_UPSTREAM);
          headers.set('referer', `${API_UPSTREAM}/`);
          headers.set('sec-fetch-site', 'same-origin');

          const chunks = [];
          const requestMethod = request.method || 'GET';
          if (!['GET', 'HEAD'].includes(requestMethod)) {
            for await (const chunk of request) chunks.push(chunk);
          }
          const body = chunks.length ? Buffer.concat(chunks) : undefined;

          const upstream = await fetchUpstream(target, {
            method: requestMethod,
            headers,
            body,
            redirect: 'manual',
          }, requestMethod, pathname);

          if (!upstream) throw new Error('No response from production API');
          const responseHeaders = {};
          upstream.headers.forEach((value, name) => {
            if (['connection', 'transfer-encoding', 'content-encoding', 'content-length'].includes(name.toLowerCase())) return;
            responseHeaders[name] = value;
          });
          const setCookie = upstream.headers.getSetCookie?.();
          if (setCookie?.length) responseHeaders['set-cookie'] = setCookie;

          response.writeHead(upstream.status, responseHeaders);
          if (!upstream.body || requestMethod === 'HEAD') {
            response.end();
            return;
          }
          for await (const chunk of upstream.body) response.write(Buffer.from(chunk));
          response.end();
        } catch (error) {
          console.error('[Kerala Play] API upstream proxy failed:', error.message);
          if (!response.headersSent) {
            response.writeHead(error?.name === 'AbortError' ? 504 : 502, {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            });
          }
          response.end(JSON.stringify({ error: 'Kerala Play account service is temporarily unavailable. Please try again.' }));
        }
      })();
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

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
let upstreamKeepaliveTimer = null;

async function warmProductionApi(label = 'warm-up') {
  if (!API_UPSTREAM) return;
  const warmTarget = new URL('/api/session', API_UPSTREAM);
  try {
    const response = await fetchUpstream(warmTarget, {
      method: 'GET',
      headers: { Accept: 'application/json', origin: API_UPSTREAM, referer: `${API_UPSTREAM}/` },
      redirect: 'manual',
    }, 'GET', '/api/session');
    await response?.body?.cancel?.().catch?.(() => {});
    console.log(`[Kerala Play] production API ${label} ready`);
  } catch (error) {
    console.warn(`[Kerala Play] production API ${label} pending:`, error.message);
  }
}

server.listen(port, host, () => {
  console.log(`Kerala Play running at http://${host}:${server.address().port}`);
  if (API_UPSTREAM) {
    void warmProductionApi('warm-up');
    upstreamKeepaliveTimer = setInterval(() => void warmProductionApi('keepalive'), 8 * 60 * 1000);
    upstreamKeepaliveTimer.unref();
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    try {
      if (upstreamKeepaliveTimer) clearInterval(upstreamKeepaliveTimer);
      await server.shutdown();
      process.exit(0);
    }
    catch (error) { console.error('[Kerala Play] shutdown failed:', error); process.exit(1); }
  });
}
