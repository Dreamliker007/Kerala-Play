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
  const response = await client('/api/auth/signup', { firstName: username, username, password: 'test-password-2026', district: 'Ernakulam', gender: 'female' });
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
  assert.equal((await guest('/api/auth/login', { identifier: 'ALICE', password: 'wrong-password' })).status, 401);
  const login = await guest('/api/auth/login', { identifier: 'ALICE', password: 'test-password-2026' });
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

test('nearby voice works without follows, enforces distance and respects blocks', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const a = await signup(alice, 'Alice'), b = await signup(bob, 'Bob');
  const bobEvents = await bob.events();
  t.after(() => bobEvents.close());
  await bobEvents.next('world');
  const ready = await alice(`/api/proximity/signal/${b.id}`, { data: { type: 'ready' } });
  assert.equal(ready.status, 200);
  const signal = await bobEvents.next('proximity-signal', value => value.from === a.id && value.data?.type === 'ready');
  assert.equal(signal.from, a.id);

  assert.equal((await bob('/api/profile', { district: 'Thiruvananthapuram' }, 'PATCH')).status, 200);
  assert.equal((await alice(`/api/proximity/signal/${b.id}`, { data: { type: 'ready' } })).status, 403);

  assert.equal((await bob('/api/profile', { district: 'Ernakulam' }, 'PATCH')).status, 200);
  assert.equal((await bob(`/api/blocks/${a.id}`, { blocked: true })).status, 200);
  assert.equal((await alice(`/api/proximity/signal/${b.id}`, { data: { type: 'ready' } })).status, 403);
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
    const changed = await browser('/api/auth/login', { identifier: 'Bob', password: 'test-password-2026' });
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
  const restored = (await alice('/api/auth/login', { identifier: 'Alice', password: 'test-password-2026' })).data.user;
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

test('Kerala Cash wallet uses server prices, prevents replay/overspend, keeps history and persists', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'WalletAlice');
  let wallet = (await alice('/api/wallet')).data;
  assert.equal(wallet.balance, 500);
  assert.equal(wallet.currency, 'KCR');
  assert.equal(wallet.starterJobCompleted, false);
  assert.equal(wallet.transactions[0].amount, 500);
  assert.equal(wallet.transactions[0].type, 'credit');

  const salary = await alice('/api/jobs/starter-delivery/complete', {});
  assert.equal(salary.status, 200);
  assert.equal(salary.data.reward, 250);
  assert.equal(salary.data.wallet.balance, 750);
  assert.equal((await alice('/api/jobs/starter-delivery/complete', {})).status, 409);

  const tampered = await alice('/api/shop/purchase', { itemId: 'meal', price: 1, amount: 1 });
  assert.equal(tampered.status, 200);
  assert.equal(tampered.data.purchase.price, 80, 'Client-supplied price must be ignored');
  assert.equal(tampered.data.wallet.balance, 670);
  assert.equal(tampered.data.transaction.balanceAfter, 670);
  assert.equal((await alice('/api/shop/purchase', { itemId: 'not-real' })).status, 404);

  for (let i = 0; i < 8; i++) assert.equal((await alice('/api/shop/purchase', { itemId: 'meal' })).status, 200);
  assert.equal((await alice('/api/wallet')).data.balance, 30);
  assert.equal((await alice('/api/shop/purchase', { itemId: 'meal' })).status, 409);
  wallet = (await alice('/api/wallet')).data;
  assert.equal(wallet.balance, 30);
  assert.equal(wallet.transactions[0].type, 'debit');
  assert.equal(wallet.transactions[0].balanceAfter, 30);

  await app.restart();
  assert.equal((await alice('/api/session')).data.user, null);
  assert.equal((await alice('/api/auth/login', { identifier: 'WalletAlice', password: 'test-password-2026' })).status, 200);
  wallet = (await alice('/api/wallet')).data;
  assert.equal(wallet.balance, 30);
  assert.equal(wallet.starterJobCompleted, true);
  assert.equal((await alice('/api/jobs/starter-delivery/complete', {})).status, 409);
});


test('jobs require job vehicles, real world checkpoints, server salary, cooldowns and persistence', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'JobAlice');

  let jobs = (await alice('/api/jobs')).data;
  assert.equal(jobs.jobs.length, 3);
  assert.deepEqual(jobs.jobs.map(job => job.id).sort(), ['delivery', 'shop', 'taxi']);
  assert.equal(jobs.walletBalance, 500);
  assert.equal(jobs.jobs.find(job => job.id === 'delivery').vehicle, 'bike');
  assert.equal(jobs.jobs.find(job => job.id === 'taxi').vehicle, 'taxi');

  const started = await alice('/api/jobs/delivery/start', { reward: 999999 });
  assert.equal(started.status, 201);
  let deliveryTask = started.data.active;
  assert.equal(deliveryTask.jobId, 'delivery');
  assert.equal(deliveryTask.phase, 'travel');
  assert.equal(deliveryTask.target.action, 'Collect parcel');
  assert.equal(deliveryTask.vehicle.kind, 'bike');
  assert.equal(deliveryTask.vehicle.entered, false);
  assert.equal((await alice('/api/jobs/taxi/start', {})).status, 409, 'Only one job may be active at a time');
  assert.equal((await alice('/api/jobs/delivery/complete', { taskId: deliveryTask.taskId, reward: 999999 })).status, 409, 'Route cannot be paid before checkpoints');
  assert.equal((await alice('/api/jobs/delivery/checkpoint', { taskId: deliveryTask.taskId })).status, 409, 'Remote checkpoint claims must fail');
  assert.equal((await alice('/api/world/move', { x: deliveryTask.vehicle.x, z: deliveryTask.vehicle.z, rotation: 0, moving: true, mode: 'bike' })).status, 409, 'Vehicle movement must fail before entering');

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: deliveryTask.vehicle.x, z: deliveryTask.vehicle.z, rotation: 0, moving: true })).status, 200);
  let vehicle = await alice('/api/jobs/delivery/vehicle', { taskId: deliveryTask.taskId, action: 'enter' });
  assert.equal(vehicle.status, 200);
  deliveryTask = vehicle.data.active;
  assert.equal(deliveryTask.vehicle.entered, true);

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: deliveryTask.target.x, z: deliveryTask.target.z, rotation: 0, moving: true, mode: 'bike' })).status, 200);
  let checked = await alice('/api/jobs/delivery/checkpoint', { taskId: deliveryTask.taskId });
  assert.equal(checked.status, 200);
  deliveryTask = checked.data.active;
  assert.equal(deliveryTask.target.action, 'Deliver parcel');

  app.advance(2_000);
  assert.equal((await alice('/api/world/move', { x: deliveryTask.target.x, z: deliveryTask.target.z, rotation: 0, moving: true, mode: 'bike' })).status, 200);
  checked = await alice('/api/jobs/delivery/checkpoint', { taskId: deliveryTask.taskId });
  assert.equal(checked.status, 200);
  assert.equal(checked.data.active.phase, 'ready');

  const paid = await alice('/api/jobs/delivery/complete', { taskId: deliveryTask.taskId, reward: 999999 });
  assert.equal(paid.status, 200);
  assert.equal(paid.data.reward, 180, 'Salary must come from the server job definition');
  assert.equal(paid.data.wallet.balance, 680);
  assert.equal(paid.data.transaction.amount, 180);
  assert.ok((await alice('/api/session')).data.user.walkMeters < 8, 'Driving distance must not count as walking progress');
  assert.equal((await alice('/api/jobs/delivery/complete', { taskId: deliveryTask.taskId })).status, 409, 'Completed task token cannot be replayed');
  assert.equal((await alice('/api/jobs/delivery/start', {})).status, 409, 'Job cooldown must be enforced');

  const taxi = await alice('/api/jobs/taxi/start', {});
  assert.equal(taxi.status, 201);
  const taxiTaskId = taxi.data.active.taskId;
  const firstTaxiTarget = taxi.data.active.target;
  const firstTaxiVehicle = taxi.data.active.vehicle;
  assert.equal(firstTaxiVehicle.kind, 'taxi');

  await app.restart();
  assert.equal((await alice('/api/session')).data.user, null);
  assert.equal((await alice('/api/auth/login', { identifier: 'JobAlice', password: 'test-password-2026' })).status, 200);
  jobs = (await alice('/api/jobs')).data;
  assert.equal(jobs.active.taskId, taxiTaskId, 'Active mission should survive a server restart');
  assert.deepEqual({ x: jobs.active.target.x, z: jobs.active.target.z }, { x: firstTaxiTarget.x, z: firstTaxiTarget.z }, 'Mission checkpoint should persist');
  assert.deepEqual({ x: jobs.active.vehicle.x, z: jobs.active.vehicle.z }, { x: firstTaxiVehicle.x, z: firstTaxiVehicle.z }, 'Parked job vehicle should persist');

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: jobs.active.vehicle.x, z: jobs.active.vehicle.z, rotation: 0, moving: true })).status, 200);
  vehicle = await alice('/api/jobs/taxi/vehicle', { taskId: taxiTaskId, action: 'enter' });
  assert.equal(vehicle.status, 200);
  jobs = vehicle.data.jobs;

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: jobs.active.target.x, z: jobs.active.target.z, rotation: 0, moving: true, mode: 'taxi' })).status, 200);
  checked = await alice('/api/jobs/taxi/checkpoint', { taskId: taxiTaskId });
  assert.equal(checked.status, 200);
  const taxiDrop = checked.data.active.target;
  app.advance(2_000);
  assert.equal((await alice('/api/world/move', { x: taxiDrop.x, z: taxiDrop.z, rotation: 0, moving: true, mode: 'taxi' })).status, 200);
  checked = await alice('/api/jobs/taxi/checkpoint', { taskId: taxiTaskId });
  assert.equal(checked.data.active.phase, 'ready');
  const taxiPaid = await alice('/api/jobs/taxi/complete', { taskId: taxiTaskId, reward: 1 });
  assert.equal(taxiPaid.status, 200);
  assert.equal(taxiPaid.data.reward, 220);
  assert.equal(taxiPaid.data.wallet.balance, 900);

  const shop = await alice('/api/jobs/shop/start', {});
  assert.equal(shop.status, 201);
  const shopTask = shop.data.active;
  assert.equal(shopTask.vehicle, null);
  app.advance(2_000);
  assert.equal((await alice('/api/world/move', { x: shopTask.target.x, z: shopTask.target.z, rotation: 0, moving: true })).status, 200);
  checked = await alice('/api/jobs/shop/checkpoint', { taskId: shopTask.taskId });
  assert.equal(checked.status, 200);
  assert.equal(checked.data.active.phase, 'working');
  assert.equal((await alice('/api/jobs/shop/complete', { taskId: shopTask.taskId })).status, 409, 'Shop shift must run for its server-defined duration');
  app.advance(10_000);
  const shopPaid = await alice('/api/jobs/shop/complete', { taskId: shopTask.taskId, reward: 999999 });
  assert.equal(shopPaid.status, 200);
  assert.equal(shopPaid.data.reward, 140);
  assert.equal(shopPaid.data.wallet.balance, 1040);
});


test('job vehicle fuel damage refuel and repair stay server controlled', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'VehicleAlice');

  const started = await alice('/api/jobs/delivery/start', {});
  assert.equal(started.status, 201);
  let active = started.data.active;
  assert.equal(active.vehicle.fuel, 100);
  assert.equal(active.vehicle.condition, 100);
  assert.equal(active.vehicle.stations.fuel.label, 'Kerala Fuel Station');
  assert.equal(active.vehicle.stations.service.label, 'Village Service Garage');

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: active.vehicle.x, z: active.vehicle.z, rotation: 0, moving: true })).status, 200);
  let vehicle = await alice('/api/jobs/delivery/vehicle', { taskId: active.taskId, action: 'enter' });
  assert.equal(vehicle.status, 200);
  active = vehicle.data.active;

  assert.equal((await alice('/api/jobs/delivery/vehicle/service', { taskId: active.taskId, action: 'refuel' })).status, 409, 'Refuel must require the fuel station');

  app.advance(2_000);
  let moved = await alice('/api/world/move', { x: 11, z: -12, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(moved.status, 200);
  assert.ok(moved.data.vehicle.fuel < 100, 'Driving must burn fuel on the server');
  assert.ok(moved.data.vehicle.fuel > 90, 'Normal short driving should use only part of the tank');

  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: 11, z: -12, rotation: 0, moving: false, mode: 'bike' })).status, 200);
  const refueled = await alice('/api/jobs/delivery/vehicle/service', { taskId: active.taskId, action: 'refuel' });
  assert.equal(refueled.status, 200);
  assert.equal(refueled.data.vehicle.fuel, 100);
  assert.equal(refueled.data.transaction.kind, 'fuel');
  assert.ok(refueled.data.service.cost > 0);
  const balanceAfterFuel = refueled.data.wallet.balance;
  assert.ok(balanceAfterFuel < 500);

  const impact = await alice('/api/jobs/delivery/vehicle/impact', { taskId: active.taskId, severity: 3 });
  assert.equal(impact.status, 200);
  assert.equal(impact.data.damage, 9);
  assert.equal(impact.data.vehicle.condition, 91);
  assert.equal((await alice('/api/jobs/delivery/vehicle/impact', { taskId: active.taskId, severity: 3 })).status, 409, 'Impact damage must be throttled');

  app.advance(2_000);
  moved = await alice('/api/world/move', { x: -15, z: -17, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(moved.status, 200);
  app.advance(2_000);
  moved = await alice('/api/world/move', { x: -36, z: -15, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(moved.status, 200);
  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: -36, z: -15, rotation: 0, moving: false, mode: 'bike' })).status, 200);

  const repaired = await alice('/api/jobs/delivery/vehicle/service', { taskId: active.taskId, action: 'repair' });
  assert.equal(repaired.status, 200);
  assert.equal(repaired.data.vehicle.condition, 100);
  assert.equal(repaired.data.transaction.kind, 'repair');
  assert.equal(repaired.data.service.cost, 9);
  assert.equal(repaired.data.wallet.balance, balanceAfterFuel - 9);
});


test('personal garage purchase retrieve driving storage and persistence stay server controlled', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'GarageAlice');

  let garage = (await alice('/api/garage')).data;
  assert.equal(garage.owned.length, 0);
  assert.equal(garage.catalog.find(model => model.id === 'kerala_bike').price, 700);
  assert.equal(garage.catalog.find(model => model.id === 'kerala_compact').price, 2200);

  const starter = await alice('/api/jobs/starter-delivery/complete', {});
  assert.equal(starter.status, 200);
  assert.equal(starter.data.wallet.balance, 750);

  const bought = await alice('/api/garage/buy', { modelId: 'kerala_bike', price: 1 });
  assert.equal(bought.status, 201);
  assert.equal(bought.data.purchase.price, 700, 'Vehicle price must be server controlled');
  assert.equal(bought.data.wallet.balance, 50);
  assert.equal(bought.data.garage.owned.length, 1);
  assert.equal(bought.data.garage.owned[0].fuel, 100);
  assert.equal(bought.data.garage.owned[0].condition, 100);
  assert.equal((await alice('/api/garage/buy', { modelId: 'kerala_bike' })).status, 409, 'Duplicate model purchase must fail');
  assert.equal((await alice('/api/garage/buy', { modelId: 'kerala_compact' })).status, 409, 'Insufficient Kerala Cash must fail');

  const vehicleId = bought.data.garage.owned[0].id;
  let retrieved = await alice('/api/garage/vehicle', { action: 'retrieve', vehicleId });
  assert.equal(retrieved.status, 200);
  let active = retrieved.data.garage.activeVehicle;
  assert.equal(active.vehicleId, vehicleId);
  assert.equal(active.entered, false);
  assert.equal(active.source, 'personal');
  assert.equal((await alice('/api/jobs/delivery/start', {})).status, 409, 'A retrieved personal vehicle must be stored before starting a job');
  assert.equal((await alice('/api/world/move', { x: active.x, z: active.z, rotation: 0, moving: true, mode: 'bike' })).status, 409, 'Personal vehicle mode must fail before entering');

  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: active.x, z: active.z, rotation: 0, moving: true })).status, 200);
  let entered = await alice('/api/garage/vehicle', { action: 'enter', vehicleId });
  assert.equal(entered.status, 200);
  active = entered.data.garage.activeVehicle;
  assert.equal(active.entered, true);
  assert.equal(active.kind, 'bike');

  app.advance(1_000);
  const moved = await alice('/api/world/move', { x: active.x, z: active.z + 4, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(moved.status, 200);
  assert.equal(moved.data.vehicle.source, 'personal');
  assert.ok(moved.data.vehicle.fuel < 100, 'Personal driving must burn persistent fuel');
  const fuelAfterDrive = moved.data.vehicle.fuel;

  const impact = await alice('/api/garage/vehicle/impact', { vehicleId, severity: 1 });
  assert.equal(impact.status, 200);
  assert.equal(impact.data.vehicle.condition, 98);

  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: active.x, z: active.z + 4, rotation: 0, moving: false, mode: 'bike' })).status, 200);
  const exited = await alice('/api/garage/vehicle', { action: 'exit', vehicleId });
  assert.equal(exited.status, 200);
  assert.equal(exited.data.garage.activeVehicle.entered, false);
  const stored = await alice('/api/garage/vehicle', { action: 'store', vehicleId });
  assert.equal(stored.status, 200);
  assert.equal(stored.data.garage.activeVehicle, null);

  await app.restart();
  assert.equal((await alice('/api/session')).data.user, null);
  assert.equal((await alice('/api/auth/login', { identifier: 'GarageAlice', password: 'test-password-2026' })).status, 200);
  garage = (await alice('/api/garage')).data;
  assert.equal(garage.owned.length, 1);
  assert.equal(garage.owned[0].id, vehicleId);
  assert.ok(garage.owned[0].fuel <= fuelAfterDrive + .1);
  assert.equal(garage.owned[0].condition, 98);
  assert.equal(garage.activeVehicle, null);
  assert.equal(garage.selectedId, vehicleId);
});


test('vehicle registration insurance resale and used-market ownership transfer stay server controlled', async t => {
  const app = await setup(t), seller = app.client(), buyer = app.client();
  await signup(seller, 'MarketSeller');
  await signup(buyer, 'MarketBuyer');

  assert.equal((await seller('/api/jobs/starter-delivery/complete', {})).status, 200);
  const boughtNew = await seller('/api/garage/buy', { modelId: 'kerala_bike', price: 1 });
  assert.equal(boughtNew.status, 201);
  const vehicle = boughtNew.data.garage.owned[0];
  assert.match(vehicle.registration, /^KL-07-[A-Z]{2}-\d{4}$/);
  assert.equal(vehicle.insuranceActive, true);
  assert.equal(vehicle.insuranceRenewalCost, 90);
  assert.equal(vehicle.resaleValue, 560);

  const listed = await seller('/api/garage/market/list', { vehicleId: vehicle.id, price: 1 });
  assert.equal(listed.status, 200);
  assert.equal(listed.data.listing.price, 560, 'Resale price must be server controlled');
  assert.equal(listed.data.garage.owned[0].forSale, true);
  assert.equal((await seller('/api/garage/vehicle', { action: 'retrieve', vehicleId: vehicle.id })).status, 409, 'Listed vehicles cannot be retrieved');

  let market = (await buyer('/api/garage/market')).data;
  assert.equal(market.listings.length, 1);
  assert.equal(market.listings[0].registration, vehicle.registration);
  assert.equal(market.listings[0].price, 560);
  assert.equal(market.listings[0].ownListing, false);

  assert.equal((await buyer('/api/jobs/starter-delivery/complete', {})).status, 200);
  const transferred = await buyer('/api/garage/market/buy', { vehicleId: vehicle.id, price: 1 });
  assert.equal(transferred.status, 200);
  assert.equal(transferred.data.purchase.price, 560);
  assert.equal(transferred.data.purchase.registration, vehicle.registration);
  assert.equal(transferred.data.wallet.balance, 190);
  assert.equal(transferred.data.garage.owned[0].ownerChanges, 1);
  assert.equal(transferred.data.garage.owned[0].registration, vehicle.registration);
  assert.equal((await seller('/api/garage')).data.owned.length, 0);
  assert.equal((await seller('/api/wallet')).data.balance, 610);
  market = (await buyer('/api/garage/market')).data;
  assert.equal(market.listings.length, 0);

  const beforeInsurance = transferred.data.garage.owned[0].insuranceUntil;
  const renewed = await buyer('/api/garage/insurance', { vehicleId: vehicle.id, cost: 1 });
  assert.equal(renewed.status, 200);
  assert.equal(renewed.data.insurance.cost, 90, 'Insurance cost must be server controlled');
  assert.equal(renewed.data.wallet.balance, 100);
  assert.ok(renewed.data.insurance.insuranceUntil > beforeInsurance);
  assert.equal(renewed.data.garage.owned[0].insuranceActive, true);

  await app.restart();
  assert.equal((await buyer('/api/auth/login', { identifier: 'MarketBuyer', password: 'test-password-2026' })).status, 200);
  const afterRestart = (await buyer('/api/garage')).data;
  assert.equal(afterRestart.owned.length, 1);
  assert.equal(afterRestart.owned[0].registration, vehicle.registration);
  assert.equal(afterRestart.owned[0].ownerChanges, 1);
  assert.equal(afterRestart.owned[0].insuranceActive, true);
});


test('traffic checkpoint documents challans payments and speeding stay server controlled', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'TrafficAlice');

  assert.equal((await alice('/api/jobs/starter-delivery/complete', {})).status, 200);
  const bought = await alice('/api/garage/buy', { modelId: 'kerala_bike' });
  assert.equal(bought.status, 201);
  const vehicleId = bought.data.garage.owned[0].id;
  const registration = bought.data.garage.owned[0].registration;
  assert.equal(bought.data.wallet.balance, 50);

  let traffic = (await alice('/api/traffic')).data;
  assert.equal(traffic.documents.length, 1);
  assert.equal(traffic.documents[0].registration, registration);
  assert.equal(traffic.documents[0].rcValid, true);
  assert.equal(traffic.documents[0].insuranceActive, true);
  assert.equal(traffic.unpaidCount, 0);
  assert.equal(traffic.rules.insuranceExpiredFine, 40);
  assert.equal(traffic.rules.speedingFine, 25);

  app.advance(31 * 24 * 60 * 60 * 1000);
  assert.equal((await alice('/api/auth/login', { identifier: 'TrafficAlice', password: 'test-password-2026' })).status, 200);
  traffic = (await alice('/api/traffic')).data;
  assert.equal(traffic.documents[0].insuranceActive, false);

  let retrieved = await alice('/api/garage/vehicle', { action: 'retrieve', vehicleId });
  assert.equal(retrieved.status, 200);
  let active = retrieved.data.garage.activeVehicle;
  app.advance(1_000);
  assert.equal((await alice('/api/world/move', { x: active.x, z: active.z, rotation: 0, moving: true })).status, 200);
  assert.equal((await alice('/api/garage/vehicle', { action: 'enter', vehicleId })).status, 200);

  traffic = (await alice('/api/traffic')).data;
  const checkpoint = traffic.checkpoint;
  app.advance(2_000);
  assert.equal((await alice('/api/world/move', { x: checkpoint.x, z: checkpoint.z, rotation: 0, moving: true, mode: 'bike' })).status, 200);
  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: checkpoint.x, z: checkpoint.z, rotation: 0, moving: false, mode: 'bike' })).status, 200);

  let inspection = await alice('/api/traffic/checkpoint', {});
  assert.equal(inspection.status, 200);
  assert.equal(inspection.data.inspection.result, 'challan');
  assert.equal(inspection.data.inspection.challanCreated, true);
  assert.equal(inspection.data.inspection.challan.kind, 'insurance_expired');
  assert.equal(inspection.data.inspection.challan.amount, 40);
  assert.equal(inspection.data.traffic.unpaidCount, 1);

  const duplicate = await alice('/api/traffic/checkpoint', {});
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.inspection.challanCreated, false, 'Repeated checkpoint inspection must not duplicate an unpaid insurance challan');
  assert.equal(duplicate.data.traffic.unpaidCount, 1);

  const paid = await alice('/api/traffic/challan/pay', { challanId: inspection.data.inspection.challan.id, amount: 1 });
  assert.equal(paid.status, 200);
  assert.equal(paid.data.transaction.amount, 40, 'Challan amount must be server controlled');
  assert.equal(paid.data.wallet.balance, 10);
  assert.equal(paid.data.traffic.unpaidCount, 0);

  app.advance(1_000);
  let move = await alice('/api/world/move', { x: checkpoint.x, z: checkpoint.z + 12, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(move.status, 200);
  assert.equal(move.data.trafficNotice, null, 'One speeding sample should not issue a challan');
  app.advance(1_000);
  move = await alice('/api/world/move', { x: checkpoint.x, z: checkpoint.z + 24, rotation: 0, moving: true, mode: 'bike' });
  assert.equal(move.status, 200);
  assert.equal(move.data.trafficNotice.kind, 'speeding');
  assert.equal(move.data.trafficNotice.amount, 25);
  assert.ok(move.data.trafficNotice.speedKmh > move.data.trafficNotice.limit);

  traffic = (await alice('/api/traffic')).data;
  assert.equal(traffic.unpaidCount, 1);
  assert.equal(traffic.challans[0].kind, 'speeding');
  assert.equal((await alice('/api/traffic/challan/pay', { challanId: traffic.challans[0].id })).status, 409, 'Insufficient Kerala Cash must block challan payment');
});
