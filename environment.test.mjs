import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import { highlandMistLevel } from './environment.js';

test('highland mist builds at dawn and clears by midmorning', () => {
  assert.equal(highlandMistLevel(THREE, 'highland', 4, 0, 0), 0);
  assert.ok(highlandMistLevel(THREE, 'highland', 6.5, 0, 0) > .5);
  assert.equal(highlandMistLevel(THREE, 'highland', 10, 0, 0), 0);
});

test('mist stays local to highlands and fades in rain', () => {
  assert.equal(highlandMistLevel(THREE, 'coastal', 6.5, 0, 0), 0);
  assert.equal(highlandMistLevel(THREE, 'highland', 6.5, 1, 0), 0);
  assert.ok(highlandMistLevel(THREE, 'highland', 6.5, .5, 0)
    < highlandMistLevel(THREE, 'highland', 6.5, 0, 0));
});
