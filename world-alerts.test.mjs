import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorldAlerts, worldAlertsFromEnv } from './world-alerts.mjs';

test('world alert config accepts arrays and preserves group targets', () => {
  const alerts = worldAlertsFromEnv({
    KP_WORLD_ALERTS_JSON: JSON.stringify([{ id: 'group-event', target: 'groups', message: 'Group meetup' }]),
  });
  assert.deepEqual(alerts, [{ id: 'group-event', target: 'groups', message: 'Group meetup' }]);
});

test('world alert config safely rejects malformed input', () => {
  const errors = [];
  assert.deepEqual(parseWorldAlerts('{bad json', { log: (...args) => errors.push(args.join(' ')) }), []);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /KP_WORLD_ALERTS_JSON ignored/);

  assert.deepEqual(parseWorldAlerts(JSON.stringify({ message: 'not an array' }), { log: () => {} }), []);
});

test('world alert config caps server-owned alerts at fifty', () => {
  const configured = Array.from({ length: 55 }, (_, index) => ({ id: `alert-${index}` }));
  const alerts = parseWorldAlerts(JSON.stringify(configured));
  assert.equal(alerts.length, 50);
  assert.equal(alerts[49].id, 'alert-49');
});
