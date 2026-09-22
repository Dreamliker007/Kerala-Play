const MAX_SEGMENT_METERS = 40;
const METERS_PER_POINT = 10;

export function safeDrivingSegment({
  distance,
  elapsed,
  speedKmh,
  speedLimit,
  licenceValid,
  insuranceActive,
  impactRecent = false,
  trafficNotice = null,
} = {}) {
  const meters = Number(distance);
  const seconds = Number(elapsed);
  const speed = Number(speedKmh);
  const limit = Number(speedLimit);
  const compliant = Number.isFinite(meters) && meters > 0 && meters <= MAX_SEGMENT_METERS
    && Number.isFinite(seconds) && seconds >= .12 && seconds <= 1.5
    && Number.isFinite(speed) && Number.isFinite(limit)
    && speed <= limit + 4
    && licenceValid === true
    && insuranceActive === true
    && impactRecent !== true
    && !trafficNotice;

  return {
    compliant,
    creditedMeters: compliant ? meters : 0,
    reason: compliant ? 'compliant' : 'ineligible',
  };
}

export function applySafeDrivingCredit(progress = {}, creditedMeters = 0) {
  const currentPoints = Math.max(0, Math.floor(Number(progress.points) || 0));
  const currentMeters = Math.max(0, Number(progress.meters) || 0);
  const addedMeters = Math.max(0, Number(creditedMeters) || 0);
  const totalMeters = currentMeters + addedMeters;
  const earned = Math.floor(totalMeters / METERS_PER_POINT);
  return {
    points: currentPoints + earned,
    meters: totalMeters - earned * METERS_PER_POINT,
    earned,
  };
}

export function applySafeDrivingProgress(progress = {}, segmentInput = {}) {
  const segment = safeDrivingSegment(segmentInput);
  const next = applySafeDrivingCredit(progress, segment.creditedMeters);
  return {
    ...next,
    compliant: segment.compliant,
    creditedMeters: segment.creditedMeters,
    reason: segment.reason,
  };
}

export function safeDrivingProgressFromRecord(record = {}) {
  const points = Math.max(0, Math.floor(Number(record.safeDrivingPoints) || 0));
  const rawMeters = Math.max(0, Number(record.safeDrivingMeters) || 0);
  return {
    points,
    meters: rawMeters % METERS_PER_POINT,
  };
}

export function safeDrivingProgressPatch(progress = {}) {
  const normalized = applySafeDrivingCredit(progress, 0);
  return {
    safeDrivingPoints: normalized.points,
    safeDrivingMeters: normalized.meters,
  };
}

export const SAFE_DRIVING_METERS_PER_POINT = METERS_PER_POINT;
