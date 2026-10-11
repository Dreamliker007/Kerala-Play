import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_PRESETS, CAMERA_RECENTER_DELAY_MS, normalizeCameraPreset,
  cycleCameraPreset, cameraDistanceForPreset, cameraCanAutoRecenter,
} from './camera-rig.mjs';

test('camera presets stay within three known choices and default to classic', () => {
  assert.equal(normalizeCameraPreset('close'), 'close');
  assert.equal(normalizeCameraPreset('wide'), 'wide');
  assert.equal(normalizeCameraPreset('invalid'), 'classic');
  assert.equal(normalizeCameraPreset(null), 'classic');
  assert.equal(CAMERA_PRESETS.classic, 1);
});

test('camera switching cycles forward or backward with wraparound', () => {
  assert.equal(cycleCameraPreset('classic'), 'wide');
  assert.equal(cycleCameraPreset('wide'), 'close');
  assert.equal(cycleCameraPreset('close', -1), 'wide');
  assert.equal(cycleCameraPreset('invalid', -1), 'close');
});

test('camera zoom scales only outdoor third-person distance', () => {
  assert.equal(cameraDistanceForPreset(10, 'classic'), 10);
  assert.equal(cameraDistanceForPreset(10, 'close'), 7.4);
  assert.equal(cameraDistanceForPreset(10, 'wide'), 12.7);
  assert.equal(cameraDistanceForPreset(.28, 'wide', true), .28);
  assert.equal(cameraDistanceForPreset(3.65, 'close', true), 3.65);
});

test('manual camera view waits before recentering, and never recenters on drag', () => {
  assert.equal(cameraCanAutoRecenter(true, 0, 99999), false);
  assert.equal(cameraCanAutoRecenter(false, 5000, 5000 + CAMERA_RECENTER_DELAY_MS - 1), false);
  assert.equal(cameraCanAutoRecenter(false, 5000, 5000 + CAMERA_RECENTER_DELAY_MS), true);
  assert.equal(cameraCanAutoRecenter(false, -Infinity, 100), true);
});
