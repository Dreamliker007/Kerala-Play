import test from 'node:test';
import assert from 'node:assert/strict';
import {
  footprintIntersectsCollider,
  moveWithCollisionFootprint,
  shortenCameraPathForColliders,
  clampCameraHeightToPitchRange,
  segmentIntersectsColliders,
} from './collision-geometry.js';

test('oriented vehicle footprint blocks a building before its centre reaches the wall', () => {
  const car = { type:'oriented-box', halfLength:1.9, halfWidth:.9, rotation:0 };
  const house = { type:'box', x:0, z:2.15, halfWidth:.7, halfDepth:.35 };
  assert.equal(footprintIntersectsCollider(0, 0, car, house), true);
  assert.equal(footprintIntersectsCollider(0, 0, .43, house), false);
});

test('rotated vehicle footprint follows its heading', () => {
  const car = { type:'oriented-box', halfLength:2, halfWidth:.8, rotation:Math.PI / 2 };
  assert.equal(footprintIntersectsCollider(0, 0, car, { type:'box', x:1.8, z:0, halfWidth:.3, halfDepth:.4 }), true);
  assert.equal(footprintIntersectsCollider(0, 0, car, { type:'box', x:0, z:1.8, halfWidth:.3, halfDepth:.4 }), false);
});

test('stepped movement cannot tunnel through a thin wall and can slide along it', () => {
  const wall = { type:'box', x:0, z:0, halfWidth:.08, halfDepth:2 };
  const object = { position:{ x:-2, z:0 } };
  const blocked = (x, z, footprint) => footprintIntersectsCollider(x, z, footprint, wall);
  const hitWall = moveWithCollisionFootprint(object, 4, 0, .35, blocked);
  assert.equal(hitWall, true);
  assert.ok(object.position.x < -.4);

  const slider = { position:{ x:-.4, z:-1.5 } };
  moveWithCollisionFootprint(slider, .5, 1, .3, blocked);
  assert.ok(slider.position.x < -.38);
  assert.ok(slider.position.z > -.6);
});

test('camera sweep detects a wall between safe endpoints', () => {
  const wall = { type:'box', x:0, z:0, halfWidth:.06, halfDepth:3 };
  assert.equal(segmentIntersectsColliders({ x:-2, z:0 }, { x:2, z:0 }, .3, [wall]), true);
  assert.equal(segmentIntersectsColliders({ x:-2, z:4 }, { x:2, z:4 }, .3, [wall]), false);
});

test('camera collision shortening preserves height instead of lifting every frame', () => {
  const wall = { type:'box', x:0, z:0, halfWidth:1.2, halfDepth:1.2 };
  const target = { x:0, y:3, z:0 };
  const desired = { x:0, y:3.02, z:-7 };
  const result = shortenCameraPathForColliders(
    target,
    desired,
    .34,
    [wall],
    (x, z, radius) => footprintIntersectsCollider(x, z, radius, wall),
  );
  assert.equal(result.y, 3.02);
  assert.notEqual(result.z, -7);
});

test('camera height is kept between ground-view pitch limits', () => {
  const minPitch = .48;
  const maxPitch = .78;
  const minDistance = 2.8;
  const horizontal = 6;
  const lower = 1.2 + Math.tan(minPitch) * horizontal;
  const upper = 1.2 + Math.tan(maxPitch) * horizontal + .35;
  assert.equal(clampCameraHeightToPitchRange(-100, 1.2, horizontal, minPitch, maxPitch, minDistance), lower);
  assert.equal(clampCameraHeightToPitchRange(1000, 1.2, horizontal, minPitch, maxPitch, minDistance), upper);
  assert.equal(clampCameraHeightToPitchRange(lower + .2, 1.2, horizontal, minPitch, maxPitch, minDistance), lower + .2);
});

test('circle obstacles account for the full vehicle footprint', () => {
  const car = { type:'oriented-box', halfLength:1.8, halfWidth:.8, rotation:0 };
  assert.equal(footprintIntersectsCollider(0, 0, car, { type:'circle', x:0, z:1.9, radius:.25 }), true);
  assert.equal(footprintIntersectsCollider(0, 0, car, { type:'circle', x:2, z:0, radius:.2 }), false);
});
