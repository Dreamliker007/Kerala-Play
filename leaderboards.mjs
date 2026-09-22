const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'exploration', label: 'Exploration', metric: 'visitedLandmarks' }),
  Object.freeze({ id: 'community', label: 'Community', metric: 'communityContributions' }),
  Object.freeze({ id: 'career', label: 'Career', metric: 'jobsCompleted' }),
  Object.freeze({ id: 'mobility', label: 'Distance', metric: 'walkMeters' }),
]);

function metricValue(player, metric) {
  const value = player?.[metric];
  if (Array.isArray(value)) return new Set(value).size;
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

function safeIdentity(player) {
  return {
    id: String(player?.id || ''),
    username: String(player?.username || player?.displayName || 'Explorer').slice(0, 40),
  };
}

export function leaderboardCategories() {
  return CATEGORIES.map(category => ({ ...category }));
}

export function categoryLeaderboard(players = [], categoryId, { limit = 20 } = {}) {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category) return null;
  const cappedLimit = Math.max(1, Math.min(50, Number.isInteger(limit) ? limit : 20));
  const entries = players
    .filter(player => player && player.id)
    .map(player => ({ ...safeIdentity(player), score: metricValue(player, category.metric) }))
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username) || a.id.localeCompare(b.id))
    .slice(0, cappedLimit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  return { id: category.id, label: category.label, metric: category.metric, entries };
}
