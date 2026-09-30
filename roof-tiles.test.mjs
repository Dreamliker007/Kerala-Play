import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import { createKeralaRoofTiles } from './roof-tiles.js';

test('Kerala roof tiles use two curved, color-varied instanced slopes', () => {
  const [front, back] = createKeralaRoofTiles(THREE, 12, -8);

  assert.equal(front.count, 8);
  assert.equal(back.count, 8);
  assert.equal(front.geometry, back.geometry);
  assert.equal(front.material, back.material);
  assert.ok(front.geometry.boundingSphere);
  assert.ok(front.geometry.attributes.position.count > 100);

  const heights = front.geometry.attributes.position.array.filter((_, index) => index % 3 === 1);
  assert.ok(Math.max(...heights) > .06);
  assert.ok(Math.min(...heights) >= 0);

  const colors = front.instanceColor.array;
  assert.ok(colors.some((value, index) => index > 0 && Math.abs(value - colors[0]) > .001));
});

test('roof tile slopes have opposite pitch and stay in the house roof footprint', () => {
  const [front, back] = createKeralaRoofTiles(THREE, 0, 0);
  const frontMatrix = new THREE.Matrix4();
  const backMatrix = new THREE.Matrix4();
  front.getMatrixAt(0, frontMatrix);
  back.getMatrixAt(0, backMatrix);
  const frontRotation = new THREE.Euler().setFromRotationMatrix(frontMatrix);
  const backRotation = new THREE.Euler().setFromRotationMatrix(backMatrix);
  const frontPosition = new THREE.Vector3().setFromMatrixPosition(frontMatrix);
  const backPosition = new THREE.Vector3().setFromMatrixPosition(backMatrix);

  assert.ok(frontRotation.x < 0);
  assert.ok(backRotation.x > 0);
  assert.ok(frontPosition.x >= -4.2 && frontPosition.x <= -4.0);
  assert.ok(Math.abs(frontPosition.y - 5.71) < .001);
  assert.ok(Math.abs(backPosition.z + 1.39) < .001);
});
