export function parseWorldAlerts(raw, { log = console.error } = {}) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('expected a JSON array');
    return parsed.slice(0, 50);
  } catch (error) {
    log('[Kerala Play] KP_WORLD_ALERTS_JSON ignored:', error.message);
    return [];
  }
}

export function worldAlertsFromEnv(env = process.env, options) {
  return parseWorldAlerts(env.KP_WORLD_ALERTS_JSON, options);
}
