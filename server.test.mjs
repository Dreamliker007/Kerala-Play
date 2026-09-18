import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createGameServer } from './server.mjs';

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
  const restored = (await alice('/api/auth/login', { username: 'Alice', password: 'test-password-2026' })).data.user;
  assert.equal(restored.points, 105);
  assert.equal(restored.x, -26);
  assert.equal(restored.z, 6);
  assert.equal(restored.rotation, 0);
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
