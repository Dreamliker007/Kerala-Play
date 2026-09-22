const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'jobs', label: 'Jobs', metric: 'jobsCompleted' }),
  Object.freeze({ id: 'exploration', label: 'Exploration', metric: 'visitedLandmarks' }),
  Object.freeze({ id: 'community', label: 'Community', metric: 'communityContributions' }),
  Object.freeze({ id: 'safe-driving', label: 'Safe Driving', metric: 'safeDrivingPoints' }),
  Object.freeze({ id: 'emergency-response', label: 'Emergency Response', metric: 'emergencyResponses' }),
  Object.freeze({ id: 'creator', label: 'Creator', metric: 'creatorContributions' }),
]);

function metricValue(stats, metric) {
  const value = stats?.[metric];
  if (Array.isArray(value)) return new Set(value).size;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function safePlayer(player = {}) {
  return {
    id: String(player.id || ''),
    name: String(player.name || player.username || 'Player').slice(0, 80),
    username: player.username ? String(player.username).slice(0, 40) : null,
  };
}

export function leaderboardCategories() {
  return CATEGORIES.map(category => ({ ...category }));
}

export function categoryLeaderboard(categoryId, players = [], { limit = 25 } = {}) {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category) throw new Error('Unknown leaderboard category');
  const safeLimit = Math.max(1, Math.min(100, Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : 25));

  const ranked = players
    .map(player => ({ ...safePlayer(player), score: metricValue(player.stats, category.metric) }))
    .filter(player => player.id && player.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .slice(0, safeLimit)
    .map((player, index) => ({ rank: index + 1, ...player }));

  return {
    category: { id: category.id, label: category.label },
    entries: ranked,
    totalRanked: ranked.length,
  };
}
