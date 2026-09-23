import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createGameServer } from './server.mjs';

async function setup(t, serverOptions = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'kerala-play-test-'));
  let timestamp = Date.now();
  let server;
  let origin;
  async function boot() {
    server = await createGameServer({ ...serverOptions, dataDir, now: () => timestamp });
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

test('Village Line serves Town Centre as an authoritative stop', async tt => {
  const app = await setup(tt), client = app.client();
  await signup(client, 'BusRoutePlayer');

  const town = await client('/api/travel/bus/status?stopId=town-bus');
  assert.equal(town.status, 200);
  assert.equal(town.data.stop.id, 'town-bus');
  assert.equal(town.data.destination.id, 'town-centre-bus');
  assert.equal(town.data.destination.label, 'Town Centre Bus Stop');

  const centre = await client('/api/travel/bus/status?stopId=town-centre-bus');
  assert.equal(centre.status, 200);
  assert.equal(centre.data.stop.id, 'town-centre-bus');
  assert.equal(centre.data.destination.id, 'south-bus');

  const south = await client('/api/travel/bus/status?stopId=south-bus');
  assert.equal(south.status, 200);
  assert.equal(south.data.destination.id, 'town-bus');
  assert.equal(Number(town.data.fare), Number(centre.data.fare));
  assert.equal(Number(centre.data.fare), Number(south.data.fare));
});

test('Town Market is recognized by the server-owned world shop economy', async tt => {
  const app = await setup(tt), client = app.client();
  await signup(client, 'TownMarketPlayer');
  const response = await client('/api/world/shop/purchase', { shopId: 'town-market', itemId: 'water' });
  assert.notEqual(response.status, 404, 'Town Market should be a known server world shop');
});

test('player reports validate reasons, prevent rapid duplicates and persist', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const aliceUser = await signup(alice, 'ReportAlice'), bobUser = await signup(bob, 'ReportBob');

  assert.equal((await alice(`/api/reports/${aliceUser.id}`, { reason: 'spam' })).status, 404);
  assert.equal((await alice(`/api/reports/${bobUser.id}`, { reason: 'invalid-reason' })).status, 400);
  assert.equal((await alice(`/api/reports/${bobUser.id}`, { reason: 'spam', details: 'x'.repeat(501) })).status, 400);

  const created = await alice(`/api/reports/${bobUser.id}`, { reason: 'harassment', details: 'Repeated abusive chat.' });
  assert.equal(created.status, 201);
  assert.equal(created.data.report.targetId, bobUser.id);
  assert.equal(created.data.report.reason, 'harassment');
  assert.equal(created.data.report.status, 'open');
  assert.equal((await alice(`/api/reports/${bobUser.id}`, { reason: 'spam' })).status, 409);

  await app.restart();
  assert.equal((await alice(`/api/reports/${bobUser.id}`, { reason: 'spam' })).status, 409);
  app.advance(24 * 60 * 60 * 1000 + 1);
  assert.equal((await alice(`/api/reports/${bobUser.id}`, { reason: 'spam' })).status, 201);
});

test('social groups support creation invites membership chat ownership transfer and persistence', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client(), carol = app.client();
  const aliceUser = await signup(alice, 'GroupAlice'), bobUser = await signup(bob, 'GroupBob'), carolUser = await signup(carol, 'GroupCarol');

  assert.equal((await alice(`/api/follows/${bobUser.id}`, { action: 'request' })).status, 200);
  assert.equal((await bob(`/api/follows/${aliceUser.id}`, { action: 'accept' })).status, 200);

  const created = await alice('/api/groups', { name: 'Kerala Riders' });
  assert.equal(created.status, 201);
  const groupId = created.data.group.id;
  assert.equal(created.data.group.isOwner, true);
  assert.equal(created.data.group.memberCount, 1);

  assert.equal((await alice(`/api/groups/${groupId}/invite`, { peerId: carolUser.id })).status, 403, 'Only accepted contacts can be invited');
  assert.equal((await alice(`/api/groups/${groupId}/invite`, { peerId: bobUser.id })).status, 200);
  let bobGroups = (await bob('/api/groups')).data;
  assert.equal(bobGroups.invites.length, 1);
  assert.equal(bobGroups.invites[0].id, groupId);
  const inviteAlert = (await bob('/api/notifications')).data.items.find(item => item.target === 'groups' && item.title === 'Group invitation');
  assert.ok(inviteAlert);

  assert.equal((await bob(`/api/groups/${groupId}/respond`, { action: 'accept' })).status, 200);
  bobGroups = (await bob('/api/groups')).data;
  assert.equal(bobGroups.groups[0].memberCount, 2);
  assert.equal(bobGroups.groups[0].isMember, true);

  const posted = await bob(`/api/groups/${groupId}/messages`, { body: 'Meet at the bus stand.' });
  assert.equal(posted.status, 201);
  let chat = await alice(`/api/groups/${groupId}/messages`);
  assert.equal(chat.status, 200);
  assert.equal(chat.data.messages.at(-1).body, 'Meet at the bus stand.');
  assert.equal(chat.data.messages.at(-1).fromName, 'GroupBob');

  assert.equal((await alice(`/api/groups/${groupId}/leave`, {})).status, 200);
  bobGroups = (await bob('/api/groups')).data;
  assert.equal(bobGroups.groups[0].isOwner, true, 'Ownership should transfer when the owner leaves');

  await app.restart();
  bobGroups = (await bob('/api/groups')).data;
  assert.equal(bobGroups.groups.length, 1);
  assert.equal(bobGroups.groups[0].id, groupId);
  assert.equal(bobGroups.groups[0].isOwner, true);
  chat = await bob(`/api/groups/${groupId}/messages`);
  assert.equal(chat.status, 200);
  assert.equal(chat.data.messages.at(-1).body, 'Meet at the bus stand.');

  assert.equal((await bob(`/api/groups/${groupId}/leave`, {})).status, 200);
  assert.equal((await bob('/api/groups')).data.groups.length, 0);
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

test('account switching revokes the old browser token and older target-account session', async t => {
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
    assert.equal((await independentBob('/api/session')).data.user, null, 'The older Bob session must be revoked by single-device login');
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
  const restored = (await alice('/api/session')).data.user;
  assert.ok(restored, 'The persistent session should survive a server restart');
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
  assert.equal((await alice('/api/session')).data.user.username, 'WalletAlice');
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
  const restoredJobUser = (await alice('/api/session')).data.user;
  assert.equal(restoredJobUser.username, 'JobAlice');
  jobs = (await alice('/api/jobs')).data;
  assert.equal(jobs.active.taskId, taxiTaskId, 'Active mission should survive a server restart');
  assert.equal((await alice('/api/world/move', { x: restoredJobUser.x, z: restoredJobUser.z, rotation: restoredJobUser.rotation, moving: false })).status, 200, 'Reconnect should re-establish presence at the saved position');
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
  assert.equal((await alice('/api/session')).data.user.username, 'GarageAlice');
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


test('driving licence lifecycle and unlicensed-driving enforcement stay server controlled', async t => {
  const app = await setup(t), licensed = app.client(), driver = app.client();
  await signup(licensed, 'LicenceAlice');

  let traffic = (await licensed('/api/traffic')).data;
  assert.equal(traffic.licence.type, 'none');
  assert.equal(traffic.licence.active, false);
  assert.equal(traffic.licence.canApplyLearner, true);
  assert.equal(traffic.rules.licenceInvalidFine, 50);

  const learner = await licensed('/api/traffic/licence', { action: 'learner', cost: 999 });
  assert.equal(learner.status, 200);
  assert.equal(learner.data.cost, 0, 'Starter Learner Permit must be free');
  assert.equal(learner.data.licence.type, 'learner');
  assert.equal(learner.data.licence.active, true);
  assert.deepEqual(learner.data.licence.allowedKinds, ['bike']);
  assert.match(learner.data.licence.number, /^KPDL-[A-Z]{3}-\d{6}$/);
  const licenceNumber = learner.data.licence.number;
  assert.equal(learner.data.wallet.balance, 500);

  const full = await licensed('/api/traffic/licence', { action: 'full', cost: 1 });
  assert.equal(full.status, 200);
  assert.equal(full.data.cost, 150, 'Full Licence upgrade price must be server controlled');
  assert.equal(full.data.wallet.balance, 350);
  assert.equal(full.data.licence.type, 'full');
  assert.deepEqual(full.data.licence.allowedKinds, ['bike', 'taxi']);
  assert.equal(full.data.licence.number, licenceNumber);

  const fullUntil = full.data.licence.validUntil;
  const renewed = await licensed('/api/traffic/licence', { action: 'renew', cost: 1 });
  assert.equal(renewed.status, 200);
  assert.equal(renewed.data.cost, 100, 'Full Licence renewal price must be server controlled');
  assert.equal(renewed.data.wallet.balance, 250);
  assert.ok(renewed.data.licence.validUntil > fullUntil);
  assert.equal(renewed.data.licence.number, licenceNumber);
  assert.equal((await licensed('/api/traffic/licence', { action: 'learner' })).status, 409, 'Full Licence cannot be downgraded to Learner');

  await signup(driver, 'NoLicenceDriver');
  assert.equal((await driver('/api/jobs/starter-delivery/complete', {})).status, 200);
  const bought = await driver('/api/garage/buy', { modelId: 'kerala_bike' });
  assert.equal(bought.status, 201);
  const vehicleId = bought.data.garage.owned[0].id;
  assert.equal(bought.data.wallet.balance, 50);

  let retrieved = await driver('/api/garage/vehicle', { action: 'retrieve', vehicleId });
  let active = retrieved.data.garage.activeVehicle;
  app.advance(1_000);
  assert.equal((await driver('/api/world/move', { x: active.x, z: active.z, rotation: 0, moving: true })).status, 200);
  assert.equal((await driver('/api/garage/vehicle', { action: 'enter', vehicleId })).status, 200);

  traffic = (await driver('/api/traffic')).data;
  const checkpoint = traffic.checkpoint;
  app.advance(1_000);
  assert.equal((await driver('/api/world/move', { x: checkpoint.x, z: checkpoint.z, rotation: 0, moving: true, mode: 'bike' })).status, 200);
  app.advance(250);
  assert.equal((await driver('/api/world/move', { x: checkpoint.x, z: checkpoint.z, rotation: 0, moving: false, mode: 'bike' })).status, 200);

  const inspection = await driver('/api/traffic/checkpoint', {});
  assert.equal(inspection.status, 200);
  assert.equal(inspection.data.inspection.insuranceActive, true);
  assert.equal(inspection.data.inspection.licenceValid, false);
  assert.equal(inspection.data.inspection.challan.kind, 'licence_invalid');
  assert.equal(inspection.data.inspection.challan.amount, 50);
  assert.equal(inspection.data.traffic.unpaidCount, 1);

  const duplicate = await driver('/api/traffic/checkpoint', {});
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.inspection.challanCreated, false);
  assert.equal(duplicate.data.traffic.unpaidCount, 1);

  const paid = await driver('/api/traffic/challan/pay', { challanId: inspection.data.inspection.challan.id });
  assert.equal(paid.status, 200);
  assert.equal(paid.data.wallet.balance, 0);

  for (let step = 1; step <= 3; step++) {
    app.advance(1_000);
    const move = await driver('/api/world/move', { x: checkpoint.x, z: checkpoint.z + step * 3, rotation: 0, moving: true, mode: 'bike' });
    assert.equal(move.status, 200);
    if (step < 3) assert.equal(move.data.trafficNotice, null);
    else {
      assert.equal(move.data.trafficNotice.kind, 'licence_invalid');
      assert.equal(move.data.trafficNotice.amount, 50);
      assert.equal(move.data.trafficNotice.source, 'server-licence-check');
    }
  }

  traffic = (await driver('/api/traffic')).data;
  assert.equal(traffic.unpaidCount, 1);
  assert.equal(traffic.challans[0].kind, 'licence_invalid');
});


test('daily needs decay shop restoration rest and movement penalties persist server-side', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'NeedsAlice');

  let needs = (await alice('/api/needs')).data;
  assert.equal(needs.hunger, 100);
  assert.equal(needs.thirst, 100);
  assert.equal(needs.energy, 100);
  assert.equal(needs.canRun, true);
  assert.equal(needs.movementFactor, 1);
  assert.deepEqual({ x: needs.restPoint.x, z: needs.restPoint.z }, { x: -10, z: -10 });

  app.advance(2 * 60 * 60 * 1000);
  needs = (await alice('/api/needs')).data;
  assert.ok(needs.hunger < 67 && needs.hunger > 65);
  assert.ok(needs.thirst < 53 && needs.thirst > 51);
  assert.ok(needs.energy < 75 && needs.energy > 72);

  app.advance(2 * 60 * 60 * 1000);
  needs = (await alice('/api/needs')).data;
  assert.ok(needs.thirst <= 5);
  assert.equal(needs.canRun, false);
  assert.ok(needs.movementFactor < .7);

  app.advance(3_000);
  const blockedByLowNeeds = await alice('/api/world/move', { x: -10, z: -10, rotation: 0, moving: true, mode: 'walk' });
  assert.equal(blockedByLowNeeds.status, 409, 'Low needs must reduce the server-authoritative walking allowance');

  assert.equal((await alice('/api/needs/rest', {})).status, 409, 'Rest must require the player to be near the bench');

  const water = await alice('/api/shop/purchase', { itemId: 'water', price: 1 });
  assert.equal(water.status, 200);
  assert.equal(water.data.purchase.price, 15, 'Shop price must remain server controlled');
  assert.equal(water.data.purchase.needs.thirst, 35);
  assert.equal(water.data.wallet.balance, 485);
  assert.ok(water.data.needs.thirst > 38);
  assert.equal(water.data.needs.movementFactor, 1);

  const snack = await alice('/api/shop/purchase', { itemId: 'snack' });
  assert.equal(snack.status, 200);
  assert.equal(snack.data.wallet.balance, 450);
  assert.ok(snack.data.needs.hunger > water.data.needs.hunger);
  assert.ok(snack.data.needs.energy > water.data.needs.energy);

  app.advance(3_000);
  const moved = await alice('/api/world/move', { x: -10, z: -10, rotation: 0, moving: true, mode: 'walk' });
  assert.equal(moved.status, 200);
  assert.ok(moved.data.needs.energy < snack.data.needs.energy, 'Walking must consume a small amount of energy');
  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: -10, z: -10, rotation: 0, moving: false, mode: 'walk' })).status, 200);

  const rest = await alice('/api/needs/rest', {});
  assert.equal(rest.status, 200);
  assert.equal(rest.data.rested, true);
  assert.equal(rest.data.restored, 35);
  assert.ok(rest.data.needs.energy > moved.data.needs.energy);
  assert.equal((await alice('/api/needs/rest', {})).status, 409, 'Rest must have a server cooldown when energy was restored');

  app.advance(30_000);
  const restedAgain = await alice('/api/needs/rest', {});
  assert.equal(restedAgain.status, 200);
  assert.equal(restedAgain.data.rested, true);
  assert.equal(restedAgain.data.needs.energy, 100);

  await app.restart();
  assert.equal((await alice('/api/auth/login', { identifier: 'NeedsAlice', password: 'test-password-2026' })).status, 200);
  needs = (await alice('/api/needs')).data;
  assert.equal(needs.energy, 100);
  assert.ok(needs.hunger < 60);
  assert.ok(needs.thirst < 50);
  assert.equal(needs.restPoint.label, 'Village Rest Bench');
});


test('rental home rent utilities grace sleep and persistence stay server controlled', async t => {
  const app = await setup(t), alice = app.client();
  await signup(alice, 'HomeAlice');

  let home = (await alice('/api/home')).data;
  assert.equal(home.status, 'rented');
  assert.equal(home.home.label, 'Village Rental Home');
  assert.equal(home.home.rent, 60);
  assert.equal(home.home.utilities, 20);
  assert.equal(home.rentOverdue, false);
  assert.equal(home.utilityOverdue, false);
  assert.equal(home.accessBlocked, false);
  assert.ok(home.rentDueAt > 0);
  assert.equal(home.rentDueAt, home.utilityDueAt);

  app.advance(25 * 60 * 60 * 1000);
  home = (await alice('/api/home')).data;
  assert.equal(home.rentOverdue, true);
  assert.equal(home.utilityOverdue, true);
  assert.equal(home.accessBlocked, false, 'Overdue home charges must keep a 48-hour grace period');

  const lowNeeds = (await alice('/api/needs')).data;
  assert.ok(lowNeeds.energy < 75);

  app.advance(3_000);
  assert.equal((await alice('/api/world/move', { x: -20, z: -10, rotation: 0, moving: true, mode: 'walk' })).status, 200);
  app.advance(3_000);
  assert.equal((await alice('/api/world/move', { x: -24, z: -30.8, rotation: 0, moving: true, mode: 'walk' })).status, 200);
  app.advance(250);
  assert.equal((await alice('/api/world/move', { x: -24, z: -30.8, rotation: 0, moving: false, mode: 'walk' })).status, 200);

  const sleptInGrace = await alice('/api/home/sleep', {});
  assert.equal(sleptInGrace.status, 200);
  assert.equal(sleptInGrace.data.slept, true);
  assert.equal(sleptInGrace.data.needs.energy, 100);
  assert.ok(sleptInGrace.data.needs.hunger < lowNeeds.hunger);
  assert.ok(sleptInGrace.data.needs.thirst < lowNeeds.thirst);
  const firstSleepAt = sleptInGrace.data.home.lastSleepAt;

  app.advance(48 * 60 * 60 * 1000 + 1000);
  home = (await alice('/api/home')).data;
  assert.equal(home.accessBlocked, true);
  assert.equal((await alice('/api/home/sleep', {})).status, 409, 'Sleep must pause after the home-payment grace period');

  const rent = await alice('/api/home/pay', { kind: 'rent', amount: 1 });
  assert.equal(rent.status, 200);
  assert.equal(rent.data.payment.amount, 60, 'Rent price must be server controlled');
  assert.equal(rent.data.wallet.balance, 440);
  assert.equal(rent.data.home.rentOverdue, false);
  assert.equal(rent.data.home.accessBlocked, true, 'Utilities can independently keep sleep access blocked');

  const utilities = await alice('/api/home/pay', { kind: 'utilities', amount: 1 });
  assert.equal(utilities.status, 200);
  assert.equal(utilities.data.payment.amount, 20, 'Utility price must be server controlled');
  assert.equal(utilities.data.wallet.balance, 420);
  assert.equal(utilities.data.home.utilityOverdue, false);
  assert.equal(utilities.data.home.accessBlocked, false);
  assert.equal(utilities.data.home.rentPayments, 1);
  assert.equal(utilities.data.home.utilityPayments, 1);

  const needsAfterLongGap = (await alice('/api/needs')).data;
  assert.ok(needsAfterLongGap.energy < 75);
  const sleptAfterPayment = await alice('/api/home/sleep', {});
  assert.equal(sleptAfterPayment.status, 200);
  assert.equal(sleptAfterPayment.data.slept, true);
  assert.equal(sleptAfterPayment.data.needs.energy, 100);
  assert.ok(sleptAfterPayment.data.home.lastSleepAt > firstSleepAt);

  await app.restart();
  assert.equal((await alice('/api/auth/login', { identifier: 'HomeAlice', password: 'test-password-2026' })).status, 200);
  home = (await alice('/api/home')).data;
  assert.equal(home.rentPayments, 1);
  assert.equal(home.utilityPayments, 1);
  assert.equal(home.accessBlocked, false);
  assert.ok(home.lastSleepAt > firstSleepAt);
  assert.equal((await alice('/api/wallet')).data.balance, 420);
});


test('Kerala Bank cash movement UPI transfers and persistence stay server controlled', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  await signup(alice, 'BankAlice');
  await signup(bob, 'BankBob');

  let bank = (await alice('/api/bank')).data;
  assert.equal(bank.balance, 0);
  assert.match(bank.accountNumber, /^KPB-\d{4}-\d{4}$/);
  assert.equal(bank.upiId, 'bankalice@keralapay');
  assert.equal(bank.transferMax, 100000);
  const aliceAccount = bank.accountNumber;

  const deposit = await alice('/api/bank/cash', { action: 'deposit', amount: 300, fakeBalance: 999999 });
  assert.equal(deposit.status, 200);
  assert.equal(deposit.data.amount, 300);
  assert.equal(deposit.data.wallet.balance, 200);
  assert.equal(deposit.data.bank.balance, 300);
  assert.equal(deposit.data.bank.transactions[0].kind, 'cash_deposit');
  assert.equal(deposit.data.wallet.transactions[0].kind, 'bank_deposit');

  assert.equal((await alice('/api/bank/cash', { action: 'deposit', amount: 201 })).status, 409);
  assert.equal((await alice('/api/bank/cash', { action: 'withdraw', amount: 301 })).status, 409);
  assert.equal((await alice('/api/bank/cash', { action: 'withdraw', amount: 100001 })).status, 400);

  const upi = await alice('/api/bank/upi', { recipient: 'BankBob@keralapay', amount: 125, fee: 9999 });
  assert.equal(upi.status, 200);
  assert.equal(upi.data.amount, 125);
  assert.equal(upi.data.recipient.upiId, 'bankbob@keralapay');
  assert.equal(upi.data.bank.balance, 175);
  assert.equal(upi.data.transaction.kind, 'upi_sent');
  assert.ok(upi.data.transferId);

  const bobBank = (await bob('/api/bank')).data;
  assert.equal(bobBank.balance, 125);
  assert.equal(bobBank.upiId, 'bankbob@keralapay');
  assert.equal(bobBank.transactions[0].kind, 'upi_received');
  assert.equal(bobBank.transactions[0].counterparty, 'bankalice@keralapay');
  assert.equal(bobBank.transactions[0].transferId, upi.data.transferId);

  assert.equal((await alice('/api/bank/upi', { recipient: 'BankAlice', amount: 1 })).status, 409);
  assert.equal((await alice('/api/bank/upi', { recipient: 'MissingPlayer', amount: 1 })).status, 404);
  assert.equal((await alice('/api/bank/upi', { recipient: 'BankBob', amount: 176 })).status, 409);

  const withdraw = await bob('/api/bank/cash', { action: 'withdraw', amount: 25 });
  assert.equal(withdraw.status, 200);
  assert.equal(withdraw.data.bank.balance, 100);
  assert.equal(withdraw.data.wallet.balance, 525);
  assert.equal(withdraw.data.bank.transactions[0].kind, 'cash_withdrawal');

  await app.restart();
  assert.equal((await alice('/api/auth/login', { identifier: 'BankAlice', password: 'test-password-2026' })).status, 200);
  assert.equal((await bob('/api/auth/login', { identifier: 'BankBob', password: 'test-password-2026' })).status, 200);

  bank = (await alice('/api/bank')).data;
  assert.equal(bank.balance, 175);
  assert.equal(bank.accountNumber, aliceAccount);
  assert.equal(bank.transactions[0].kind, 'upi_sent');

  const bobAfterRestart = (await bob('/api/bank')).data;
  assert.equal(bobAfterRestart.balance, 100);
  assert.equal((await bob('/api/wallet')).data.balance, 525);
  assert.ok(bobAfterRestart.transactions.some(transaction => transaction.kind === 'upi_received'));
});


test('phone notifications persist events dedupe live reminders and support read state', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  await signup(alice, 'NotifyAlice');
  await signup(bob, 'NotifyBob');

  let alerts = (await alice('/api/notifications')).data;
  assert.equal(alerts.items.filter(item => !item.live).length, 0, 'A new account should have no stored notifications');
  if (alerts.unreadCount) alerts = (await alice('/api/notifications/read', { all: true })).data;
  assert.equal(alerts.unreadCount, 0, 'Any currently active live world/event reminder can be marked read');

  const starter = await alice('/api/jobs/starter-delivery/complete', {});
  assert.equal(starter.status, 200);
  alerts = (await alice('/api/notifications')).data;
  assert.equal(alerts.unreadCount, 1);
  const salary = alerts.items.find(item => item.sourceKey === `salary:${starter.data.transaction.id}`);
  assert.ok(salary);
  assert.equal(salary.title, 'Salary credited');
  assert.equal(salary.target, 'wallet');
  assert.equal(salary.read, false);

  const readOne = await alice('/api/notifications/read', { id: salary.id });
  assert.equal(readOne.status, 200);
  assert.equal(readOne.data.unreadCount, 0);
  assert.equal(readOne.data.items.find(item => item.id === salary.id).read, true);

  const bought = await alice('/api/garage/buy', { modelId: 'kerala_bike' });
  assert.equal(bought.status, 201);
  const vehicle = bought.data.garage.owned[0];

  assert.equal((await bob('/api/bank/cash', { action: 'deposit', amount: 100 })).status, 200);
  const upi = await bob('/api/bank/upi', { recipient: 'NotifyAlice@keralapay', amount: 50 });
  assert.equal(upi.status, 200);

  alerts = (await alice('/api/notifications')).data;
  const received = alerts.items.find(item => item.sourceKey === `upi:${upi.data.transferId}:received`);
  assert.ok(received);
  assert.equal(received.title, 'UPI received');
  assert.equal(received.target, 'wallet');
  assert.equal(received.read, false);

  app.advance(31 * 24 * 60 * 60 * 1000);
  assert.equal((await alice('/api/auth/login', { identifier: 'NotifyAlice', password: 'test-password-2026' })).status, 200);
  const reminderResponse = await alice('/api/notifications');
  assert.equal(reminderResponse.status, 200, JSON.stringify(reminderResponse.data));
  alerts = reminderResponse.data;
  const insurance = alerts.items.find(item => item.id === `reminder:insurance:${vehicle.id}:${vehicle.insuranceUntil}`);
  assert.ok(insurance);
  assert.equal(insurance.live, true);
  assert.equal(insurance.severity, 'critical');
  assert.equal(insurance.target, 'garage');
  const homeBlocked = alerts.items.find(item => item.title === 'Home access needs attention');
  assert.ok(homeBlocked);
  assert.equal(homeBlocked.severity, 'critical');
  assert.ok(alerts.unreadCount >= 3);

  const markAll = await alice('/api/notifications/read', { all: true });
  assert.equal(markAll.status, 200);
  assert.equal(markAll.data.unreadCount, 0);
  const stable = await alice('/api/notifications');
  assert.equal(stable.data.unreadCount, 0, 'Live reminders must not become unread again on refresh');
  assert.equal(stable.data.items.filter(item => item.id === insurance.id).length, 1, 'Live reminders must stay deduplicated');

  await app.restart();
  assert.equal((await alice('/api/auth/login', { identifier: 'NotifyAlice', password: 'test-password-2026' })).status, 200);
  alerts = (await alice('/api/notifications')).data;
  assert.equal(alerts.unreadCount, 0);
  assert.ok(alerts.items.some(item => item.sourceKey === `salary:${starter.data.transaction.id}`));
  assert.ok(alerts.items.some(item => item.sourceKey === `upi:${upi.data.transferId}:received`));
  assert.ok(alerts.items.some(item => item.id === insurance.id));
});


test('phone social alerts cover follow requests, accepts and private messages', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const aliceUser = await signup(alice, 'SocialAlertAlice');
  const bobUser = await signup(bob, 'SocialAlertBob');

  assert.equal((await alice(`/api/follows/${bobUser.id}`, { action: 'request' })).status, 200);
  let bobAlerts = (await bob('/api/notifications')).data;
  const requestAlert = bobAlerts.items.find(item => item.title === 'New follow request');
  assert.ok(requestAlert);
  assert.equal(requestAlert.kind, 'social');
  assert.equal(requestAlert.target, 'people');
  assert.match(requestAlert.message, /SocialAlertAlice/);

  assert.equal((await bob(`/api/follows/${aliceUser.id}`, { action: 'accept' })).status, 200);
  const aliceAlerts = (await alice('/api/notifications')).data;
  const acceptedAlert = aliceAlerts.items.find(item => item.title === 'Follow request accepted');
  assert.ok(acceptedAlert);
  assert.equal(acceptedAlert.target, 'people');
  assert.match(acceptedAlert.message, /SocialAlertBob/);

  const message = await alice(`/api/messages/${bobUser.id}`, { body: 'Phone alert test' });
  assert.equal(message.status, 201);
  bobAlerts = (await bob('/api/notifications')).data;
  const messageAlert = bobAlerts.items.find(item => item.sourceKey === `message:${message.data.message.id}`);
  assert.ok(messageAlert);
  assert.equal(messageAlert.title, 'New message');
  assert.equal(messageAlert.target, 'people');
});

test('server-owned world alerts are filtered by time and district and keep read state', async t => {
  const app = await setup(t, {
    worldAlerts: [
      {
        id: 'ernakulam-rain-test',
        kind: 'weather',
        title: 'Heavy rain alert',
        message: 'Use extra care on village roads.',
        severity: 'warning',
        districts: ['Ernakulam'],
        target: 'groups',
      },
      {
        id: 'kottayam-only-test',
        kind: 'event',
        title: 'Kottayam event',
        message: 'District-only event.',
        districts: ['Kottayam'],
      },
    ],
  });
  const alice = app.client();
  await signup(alice, 'WorldAlertAlice');

  let alerts = (await alice('/api/notifications')).data;
  const rain = alerts.items.find(item => item.id === 'world:ernakulam-rain-test');
  assert.ok(rain);
  assert.equal(rain.kind, 'weather');
  assert.equal(rain.severity, 'warning');
  assert.equal(rain.target, 'groups');
  assert.equal(rain.live, true);
  assert.equal(alerts.items.some(item => item.id === 'world:kottayam-only-test'), false);

  assert.equal((await alice('/api/notifications/read', { id: rain.id })).status, 200);
  alerts = (await alice('/api/notifications')).data;
  assert.equal(alerts.items.find(item => item.id === rain.id).read, true);

  await app.restart();
  assert.equal((await alice('/api/auth/login', { identifier: 'WorldAlertAlice', password: 'test-password-2026' })).status, 200);
  alerts = (await alice('/api/notifications')).data;
  assert.equal(alerts.items.find(item => item.id === rain.id).read, true);
});


test('progression API exposes server-owned recognition and category leaderboards without wealth ranking', async t => {
  const app = await setup(t), alice = app.client(), bob = app.client();
  const aliceUser = await signup(alice, 'ProgressAlice');
  const bobUser = await signup(bob, 'ProgressBob');

  let progression = await alice('/api/progression');
  assert.equal(progression.status, 200);
  assert.equal(progression.data.recognition.title, 'Newcomer');
  assert.ok(Array.isArray(progression.data.recognition.achievements));
  assert.deepEqual(progression.data.recognition.availableTitles, ['Newcomer']);
  assert.equal((await alice('/api/progression/title', { title: 'Explorer' })).status, 409);
  const selectedTitle = await alice('/api/progression/title', { title: 'Newcomer' });
  assert.equal(selectedTitle.status, 200);
  assert.equal(selectedTitle.data.recognition.title, 'Newcomer');

  const categories = await alice('/api/leaderboards');
  assert.equal(categories.status, 200);
  assert.deepEqual(categories.data.categories.map(item => item.id), ['jobs', 'exploration', 'community', 'safe-driving', 'emergency-response', 'creator']);
  assert.equal(categories.data.categories.some(item => /wealth|wallet|cash/i.test(item.id)), false);

  const firstSteps = progression.data.recognition.achievements.find(item => item.id === 'first-steps');
  assert.equal(firstSteps.progress, 0);
  assert.equal(firstSteps.threshold, 50);
  assert.equal(firstSteps.unlocked, false);

  const distance = await alice('/api/leaderboards/exploration');
  assert.equal(distance.status, 200);
  assert.equal(distance.data.category.id, 'exploration');

  const bobProfile = await alice('/api/profile/' + bobUser.id);
  assert.equal(bobProfile.status, 200);
  assert.equal(bobProfile.data.recognition.title, 'Newcomer');
  assert.ok(Array.isArray(bobProfile.data.recognition.achievements));

  assert.equal((await alice('/api/blocks/' + bobUser.id, { blocked: true })).status, 200);
  const afterBlock = await alice('/api/leaderboards/exploration');
  assert.equal(afterBlock.data.entries.some(entry => entry.id === bobUser.id), false);
  const blockedProfile = await alice('/api/profile/' + bobUser.id);
  assert.equal(blockedProfile.status, 200);
  assert.equal(blockedProfile.data.recognition, null);

  assert.equal((await alice('/api/profile', { recognition: { title: 'Injected' }, safeDrivingPoints: 999999 })).status, 404);
  progression = await alice('/api/progression');
  assert.notEqual(progression.data.recognition.title, 'Injected');
});


test('admin live-ops overview is protected and summarizes server-owned state', async t => {
  const app = await setup(t, { adminUsernames: ['AdminAlice'] });
  const admin = app.client(), player = app.client();
  await signup(admin, 'AdminAlice');
  await signup(player, 'RegularBob');

  assert.equal((await player('/api/admin/overview')).status, 403);
  const overview = await admin('/api/admin/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.data.players.total, 2);
  assert.equal(overview.data.players.online, 2);
  assert.equal(overview.data.moderation.reportsOpen, 0);
  assert.ok(overview.data.economy.combinedMoney >= 0);
  assert.equal(overview.data.activity.activeJobs, 0);
  assert.equal(typeof overview.data.generatedAt, 'number');
});


test('admin audit log is protected and records controlled actions', async t => {
  const app = await setup(t, { adminUsernames: ['AdminAlice'] });
  const admin = app.client(), player = app.client();
  await signup(admin, 'AdminAlice');
  await signup(player, 'RegularBob');

  assert.equal((await player('/api/admin/audit')).status, 403);
  assert.equal((await player('/api/admin/actions/note', { note: 'Should fail' })).status, 403);
  assert.equal((await admin('/api/admin/actions/note', { note: 'Reviewed live operations.' })).status, 201);

  const audit = await admin('/api/admin/audit');
  assert.equal(audit.status, 200);
  assert.equal(audit.data.entries.length, 1);
  assert.equal(audit.data.entries[0].actorUsername, 'AdminAlice');
  assert.equal(audit.data.entries[0].action, 'note');
  assert.equal(audit.data.entries[0].note, 'Reviewed live operations.');

  const overview = await admin('/api/admin/overview');
  assert.equal(overview.data.audit.entries, 1);
});


test('admin moderation report queue is protected and includes report context', async t => {
  const app = await setup(t, { adminUsernames: ['AdminAlice'] });
  const admin = app.client(), reporter = app.client(), target = app.client();
  await signup(admin, 'AdminAlice');
  await signup(reporter, 'ReporterBob');
  const targetUser = await signup(target, 'TargetCara');

  const created = await reporter(`/api/reports/${targetUser.id}`, { reason: 'harassment', details: 'Repeated unwanted messages.' });
  assert.equal(created.status, 201);
  assert.equal((await reporter('/api/admin/reports')).status, 403);

  const queue = await admin('/api/admin/reports');
  assert.equal(queue.status, 200);
  assert.equal(queue.data.reports.length, 1);
  assert.equal(queue.data.reports[0].target.username, 'TargetCara');
  assert.equal(queue.data.reports[0].reporter.username, 'ReporterBob');
  assert.equal(queue.data.reports[0].details, 'Repeated unwanted messages.');
  assert.equal(queue.data.reports[0].status, 'open');
});


test('admin can resolve or dismiss reports with audit logging', async t => {
  const app = await setup(t, { adminUsernames: ['AdminAlice'] });
  const admin = app.client(), reporter = app.client(), target = app.client();
  await signup(admin, 'AdminAlice');
  await signup(reporter, 'ReporterBob');
  const targetUser = await signup(target, 'TargetCara');

  const created = await reporter(`/api/reports/${targetUser.id}`, { reason: 'harassment', details: 'Repeated unwanted messages.' });
  assert.equal(created.status, 201);
  const queue = await admin('/api/admin/reports');
  const reportId = queue.data.reports[0].id;

  assert.equal((await reporter(`/api/admin/reports/${reportId}`, { status: 'resolved' }, 'PATCH')).status, 403);
  assert.equal((await admin(`/api/admin/reports/${reportId}`, { status: 'invalid' }, 'PATCH')).status, 400);

  const resolved = await admin(`/api/admin/reports/${reportId}`, { status: 'resolved' }, 'PATCH');
  assert.equal(resolved.status, 200);
  assert.equal(resolved.data.report.status, 'resolved');
  assert.equal((await admin(`/api/admin/reports/${reportId}`, { status: 'dismissed' }, 'PATCH')).status, 409);

  const after = await admin('/api/admin/reports');
  assert.equal(after.data.reports[0].status, 'resolved');
  const overview = await admin('/api/admin/overview');
  assert.equal(overview.data.moderation.reportsOpen, 0);
  const audit = await admin('/api/admin/audit');
  assert.equal(audit.data.entries[0].action, 'report_resolved');
  assert.equal(audit.data.entries[0].reportId, reportId);
  assert.equal(audit.data.entries[0].targetUsername, 'TargetCara');
});


test('admin warn and mute actions are protected, persisted, and audited', async t => {
  const app = await setup(t, { adminUsernames: ['AdminAlice'] });
  const admin = app.client(), player = app.client(), other = app.client();
  const adminUser = await signup(admin, 'AdminAlice');
  const playerUser = await signup(player, 'RegularBob');
  await signup(other, 'OtherCara');

  assert.equal((await player(`/api/admin/players/${playerUser.id}/warn`, { reason: 'No access' })).status, 403);
  assert.equal((await admin(`/api/admin/players/${adminUser.id}/warn`, { reason: 'Self action' })).status, 400);
  assert.equal((await admin(`/api/admin/players/${playerUser.id}/warn`, { reason: 'Please follow community rules.' })).status, 200);
  assert.equal((await admin(`/api/admin/players/${playerUser.id}/mute`, { reason: 'Repeated spam', durationMinutes: 17 })).status, 400);
  const muted = await admin(`/api/admin/players/${playerUser.id}/mute`, { reason: 'Repeated spam', durationMinutes: 15 });
  assert.equal(muted.status, 200);
  assert.ok(muted.data.mutedUntil > Date.now());

  const audit = await admin('/api/admin/audit');
  assert.equal(audit.data.entries[0].action, 'player_mute');
  assert.equal(audit.data.entries[1].action, 'player_warn');
  assert.equal(audit.data.entries[0].targetId, playerUser.id);
});
