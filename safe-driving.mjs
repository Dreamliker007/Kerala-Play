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

export const SAFE_DRIVING_METERS_PER_POINT = METERS_PER_POINT;
