import test from 'node:test';
import assert from 'node:assert/strict';
import { recognitionDefinitions, recognitionSummary } from './recognition.mjs';

test('recognition starts without gameplay power rewards', () => {
  const summary = recognitionSummary();
  assert.equal(summary.title, 'Newcomer');
  assert.equal(summary.unlockedCount, 0);
  assert.deepEqual(summary.badges, []);
  assert.ok(summary.achievements.every(item => !('reward' in item) && !('cash' in item)));
});

test('recognition unlocks category milestones from durable player stats', () => {
  const summary = recognitionSummary({
    walkMeters: 650,
    visitedLandmarks: ['kochi', 'munnar', 'bekal', 'alappuzha', 'temple', 'kochi'],
    communityContributions: 3,
    jobsCompleted: 2,
  });
  assert.equal(summary.unlockedCount, 4);
  assert.deepEqual(summary.badges, ['Explorer', 'Traveller', 'Discoverer', 'Neighbour']);
  assert.equal(summary.title, 'Neighbour');
  assert.equal(summary.achievements.find(item => item.id === 'career-starter').unlocked, false);
});

test('safe driving recognition unlocks category-specific titles without power rewards', () => {
  const first = recognitionSummary({ safeDrivingPoints: 100 });
  assert.equal(first.achievements.find(item => item.id === 'safe-driver').unlocked, true);
  assert.equal(first.achievements.find(item => item.id === 'road-guardian').unlocked, false);
  assert.equal(first.title, 'Safe Driver');

  const guardian = recognitionSummary({ safeDrivingPoints: 750 });
  assert.equal(guardian.achievements.find(item => item.id === 'road-guardian').progress, 500);
  assert.equal(guardian.achievements.find(item => item.id === 'road-guardian').unlocked, true);
  assert.equal(guardian.title, 'Road Guardian');
  assert.ok(guardian.achievements.every(item => !('reward' in item) && !('cash' in item)));
});

test('recognition progress is capped and definitions are returned as copies', () => {
  const summary = recognitionSummary({ walkMeters: 9999 });
  assert.equal(summary.achievements.find(item => item.id === 'road-regular').progress, 500);
  const definitions = recognitionDefinitions();
  definitions[0].title = 'Changed';
  assert.notEqual(recognitionDefinitions()[0].title, 'Changed');
});
