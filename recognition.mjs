const DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'first-steps', title: 'First Steps', badge: 'Explorer', metric: 'walkMeters', threshold: 50 }),
  Object.freeze({ id: 'road-regular', title: 'Road Regular', badge: 'Traveller', metric: 'walkMeters', threshold: 500 }),
  Object.freeze({ id: 'kerala-explorer', title: 'Kerala Explorer', badge: 'Discoverer', metric: 'visitedLandmarks', threshold: 5 }),
  Object.freeze({ id: 'community-helper', title: 'Community Helper', badge: 'Neighbour', metric: 'communityContributions', threshold: 3 }),
  Object.freeze({ id: 'career-starter', title: 'Career Starter', badge: 'Worker', metric: 'jobsCompleted', threshold: 3 }),
]);

function metricValue(stats, metric) {
  const value = stats?.[metric];
  if (Array.isArray(value)) return new Set(value).size;
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

export function recognitionSummary(stats = {}) {
  const achievements = DEFINITIONS.map(definition => {
    const progress = metricValue(stats, definition.metric);
    return {
      id: definition.id,
      title: definition.title,
      badge: definition.badge,
      progress: Math.min(progress, definition.threshold),
      threshold: definition.threshold,
      unlocked: progress >= definition.threshold,
    };
  });
  const unlocked = achievements.filter(item => item.unlocked);
  return {
    achievements,
    unlockedCount: unlocked.length,
    totalCount: achievements.length,
    badges: unlocked.map(item => item.badge),
    title: unlocked.at(-1)?.badge || 'Newcomer',
  };
}

export function recognitionDefinitions() {
  return DEFINITIONS.map(item => ({ ...item }));
}
