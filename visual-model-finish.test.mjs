import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_DETAIL_LEVELS, planCharacterSurfaceFinish, planVehicleSurfaceFinish,
} from './visual-model-finish.js';

test('character finish is deliberately small for nearby NPCs', () => {
  assert.deepEqual(CHARACTER_DETAIL_LEVELS, ['standard', 'hero']);
  const standard = planCharacterSurfaceFinish({ gender: 'male' });
  assert.equal(standard.clothing.length, 2);
  assert.equal(standard.shoes.length, 0);
  assert.equal(standard.clothing.every(item => item.material === 'collar'), true);
});

test('hero detail upgrades clothes and feet without changing rig attachment points', () => {
  const hero = planCharacterSurfaceFinish({ gender: 'female', level: 'hero' });
  assert.equal(hero.clothing.length, 4);
  assert.equal(hero.shoes.length, 4);
  assert.deepEqual(hero.shoes.map(item => item.side), [-1, -1, 1, 1]);
  for (const item of [...hero.clothing, ...hero.shoes]) {
    assert.equal(item.position.length, 3);
    assert.equal(item.size.length, 3);
    assert.ok(item.position.every(Number.isFinite));
    assert.ok(item.size.every(n => n > 0));
  }
});

test('traditional outfits are not given arbitrary shirt collars or chest stitching', () => {
  for (const outfit of ['mundu', 'saree']) {
    const standard = planCharacterSurfaceFinish({ outfit });
    const hero = planCharacterSurfaceFinish({ outfit, level: 'hero' });
    assert.equal(standard.clothing.length, 0);
    assert.equal(hero.clothing.length, 0);
    assert.equal(hero.shoes.length, 4);
  }
});

test('car detail geometry is deterministic and fits original collision footprint', () => {
  const dimensions = { kind: 'car', width: 1.62, length: 3.35 };
  const a = planVehicleSurfaceFinish(dimensions);
  const b = planVehicleSurfaceFinish(dimensions);
  assert.deepEqual(a, b);
  assert.equal(a.dark.length, 4);
  assert.equal(a.chrome.length, 8);
  assert.equal(a.reflectors.length, 4);
  for (const item of Object.values(a).flat()) {
    assert.ok(item.position.every(Number.isFinite));
    assert.ok(item.size.every(n => n > 0));
    assert.ok(Math.abs(item.position[0]) <= dimensions.width / 2 + .1);
    assert.ok(Math.abs(item.position[2]) <= dimensions.length / 2 + .15);
  }
});

test('bus finish stays light and unsupported models remain unchanged', () => {
  const bus = planVehicleSurfaceFinish({ kind: 'bus', width: 2.28, length: 5.25 });
  assert.equal(bus.dark.length, 2);
  assert.equal(bus.chrome.length, 2);
  assert.equal(bus.reflectors.length, 2);
  const bike = planVehicleSurfaceFinish({ kind: 'bike' });
  assert.equal(Object.values(bike).flat().length, 0);
});

test('all finish coordinates are finite and cannot be negative-sized', () => {
  for (const plan of [
    planVehicleSurfaceFinish({ kind: 'car' }),
    planVehicleSurfaceFinish({ kind: 'bus', width: 2.28, length: 5.25 }),
  ]) {
    for (const item of Object.values(plan).flat()) {
      assert.ok(item.position.every(Number.isFinite));
      assert.ok(item.size.every(Number.isFinite));
      assert.ok(item.size.every(value => value > 0));
    }
  }
});
