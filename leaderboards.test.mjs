import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryLeaderboard, leaderboardCategories } from './leaderboards.mjs';

test('leaderboards stay category-specific and exclude wealth ranking', () => {
  const categories = leaderboardCategories();
  assert.deepEqual(categories.map(item => item.id), ['jobs', 'exploration', 'community', 'safe-driving', 'emergency-response', 'creator']);
  assert.ok(categories.every(item => !['cash', 'wallet', 'wealth', 'balance'].includes(item.metric)));
});

test('category leaderboard ranks durable stats with deterministic ties', () => {
  const board = categoryLeaderboard('jobs', [
    { id: 'p3', name: 'Chitra', stats: { jobsCompleted: 2 } },
    { id: 'p2', name: 'Binu', stats: { jobsCompleted: 5 } },
    { id: 'p1', name: 'Anu', stats: { jobsCompleted: 5 } },
    { id: 'p4', name: 'Zero', stats: { jobsCompleted: 0 } },
  ]);
  assert.deepEqual(board.entries.map(item => [item.rank, item.id, item.score]), [[1, 'p1', 5], [2, 'p2', 5], [3, 'p3', 2]]);
});

test('exploration counts unique landmarks and output omits raw stats', () => {
  const board = categoryLeaderboard('exploration', [
    { id: 'p1', username: 'walker', stats: { visitedLandmarks: ['kochi', 'munnar', 'kochi'], cash: 999999 } },
  ]);
  assert.equal(board.entries[0].score, 2);
  assert.equal(board.entries[0].name, 'walker');
  assert.ok(!('stats' in board.entries[0]));
});

test('leaderboard validates category and clamps result limit', () => {
  assert.throws(() => categoryLeaderboard('wealth', []), /Unknown leaderboard category/);
  const players = Array.from({ length: 120 }, (_, index) => ({ id: `p${index}`, name: `P${index}`, stats: { communityContributions: index + 1 } }));
  assert.equal(categoryLeaderboard('community', players, { limit: 1000 }).entries.length, 100);
});
