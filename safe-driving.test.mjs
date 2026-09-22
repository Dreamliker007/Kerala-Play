import test from 'node:test';
import assert from 'node:assert/strict';
import { applySafeDrivingCredit, safeDrivingSegment } from './safe-driving.mjs';

test('credits only compliant insured licensed driving under the zone tolerance', () => {
  const eligible = safeDrivingSegment({ distance: 5, elapsed: .75, speedKmh: 40, speedLimit: 40, licenceValid: true, insuranceActive: true });
  assert.equal(eligible.compliant, true);
  assert.equal(eligible.creditedMeters, 5);

  for (const override of [
    { speedKmh: 46 },
    { licenceValid: false },
    { insuranceActive: false },
    { impactRecent: true },
    { trafficNotice: { type: 'speeding' } },
  ]) {
    const result = safeDrivingSegment({ distance: 5, elapsed: .75, speedKmh: 40, speedLimit: 40, licenceValid: true, insuranceActive: true, ...override });
    assert.equal(result.compliant, false);
    assert.equal(result.creditedMeters, 0);
  }
});

test('converts each ten compliant metres into one durable point and carries remainder', () => {
  assert.deepEqual(applySafeDrivingCredit({ points: 99, meters: 8 }, 7), { points: 100, meters: 5, earned: 1 });
  assert.deepEqual(applySafeDrivingCredit({ points: 100, meters: 5 }, 25), { points: 103, meters: 0, earned: 3 });
});

test('never grants credit for malformed or stationary movement', () => {
  for (const distance of [0, -1, NaN, 41]) {
    const result = safeDrivingSegment({ distance, elapsed: .5, speedKmh: 20, speedLimit: 40, licenceValid: true, insuranceActive: true });
    assert.equal(result.compliant, false);
  }
});
