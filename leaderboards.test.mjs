import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryLeaderboard, leaderboardCategories } from './leaderboards.mjs';

test('leaderboards stay category-specific and exclude wealth ranking', () => {
  const categories = leaderboardCategories();
  assert.deepEqual(categories.map(item => item.id), ['exploration', 'community', 'career', 'mobility']);
  assert.equal(categories.some(item => /wallet|cash|wealth|bank/i.test(item.metric)), false);
});

test('category leaderboard ranks durable stats with deterministic ties', () => {
  const players = [
    { id: 'b', username: 'Binu', visitedLandmarks: ['kochi', 'munnar'], walletBalance: 999999 },
    { id: 'a', username: 'Anu', visitedLandmarks: ['kochi', 'munnar', 'kochi'], walletBalance: 1 },
    { id: 'c', username: 'Chinnu', visitedLandmarks: ['kochi'] },
  ];
  const board = categoryLeaderboard(players, 'exploration');
  assert.deepEqual(board.entries.map(item => [item.username, item.score, item.rank]), [
    ['Anu', 2, 1], ['Binu', 2, 2], ['Chinnu', 1, 3],
  ]);
});

test('leaderboard validates categories, caps limits and normalizes negative stats', () => {
  assert.equal(categoryLeaderboard([], 'wealth'), null);
  const players = Array.from({ length: 60 }, (_, index) => ({ id: String(index), username: `Player${index}`, jobsCompleted: index - 10 }));
  const board = categoryLeaderboard(players, 'career', { limit: 500 });
  assert.equal(board.entries.length, 50);
  assert.ok(board.entries.every(item => item.score >= 0));
  assert.equal(board.entries[0].score, 49);
});
