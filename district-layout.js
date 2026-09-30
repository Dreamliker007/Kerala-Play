// Shared client/server coordinates for the reusable district street layout.
// Keep gameplay service points aligned with visible buildings as districts grow.
const BASE_ROADS = Object.freeze([
  Object.freeze([0, 0, 12, 160]),
  Object.freeze([0, 0, 150, 10]),
  Object.freeze([20, 22, 76, 7]),
  Object.freeze([-24, -6, 48, 7]),
  Object.freeze([-24, -36, 86, 7]),
  Object.freeze([25, 45, 74, 7]),
  Object.freeze([-35, 34, 64, 7]),
  Object.freeze([0, -78, 150, 8]),
]);
const AIRPORT_LINK_ROAD = Object.freeze([22, -28, 44, 7]);
const ERNAKULAM_ROADS = Object.freeze([
  Object.freeze([0, 2, 72, 8]),
  Object.freeze([0, 21, 62, 7]),
  Object.freeze([0, -16, 62, 7]),
  Object.freeze([0, 2, 8, 62]),
  Object.freeze([-22, 2, 7, 58]),
  Object.freeze([22, 2, 7, 58]),
  Object.freeze([-38, -19.5, 24, 7]),
  Object.freeze([-29, -17.5, 7, 9]),
  Object.freeze([0, -42, 8, 76]),
  Object.freeze([0, -78, 150, 8]),
]);

export const GENERIC_DISTRICT_OFFICE = Object.freeze({ x: 36, z: -68 });
export const GENERIC_DISTRICT_FRUIT_TREES = Object.freeze([
  Object.freeze([-73, 63, .82, 'mango']),
  Object.freeze([-72, -55, .78, 'jackfruit']),
  Object.freeze([70, 61, .82, 'jackfruit']),
  Object.freeze([72, -57, .79, 'mango']),
]);
const STANDARD_FUEL = Object.freeze({ x: 18, z: -48 });
const AIRPORT_FUEL = Object.freeze({ x: 66, z: -10 });

export function genericDistrictRoads(hasAirport = false) {
  return hasAirport ? [...BASE_ROADS, AIRPORT_LINK_ROAD] : [...BASE_ROADS];
}

export function ernakulamDistrictRoads(centerX = 0, centerZ = 0) {
  return ERNAKULAM_ROADS.map(([x, z, width, depth]) => [x + centerX, z + centerZ, width, depth]);
}

export function genericDistrictFuelPosition(hasAirport = false) {
  return hasAirport ? AIRPORT_FUEL : STANDARD_FUEL;
}

/** Plan covered storm drains outside district sidewalks, leaving clear gaps at road junctions. */
export function planRoadsideDrainSegments(roads, {
  curbThickness = .36,
  sidewalkWidth = 1.7,
  drainWidth = .46,
  sidewalkGap = .08,
  junctionClearance = .35,
  obstacleClearance = .2,
  minimumLength = .8,
  obstacles = [],
} = {}) {
  const validRoads = roads.filter(road => Array.isArray(road) && road.length >= 4
    && road.slice(0, 4).every(Number.isFinite) && road[2] > 0 && road[3] > 0);
  const drains = [];

  validRoads.forEach(([x, z, width, depth], roadIndex) => {
    const horizontal = width >= depth;
    const alongCenter = horizontal ? x : z;
    const alongHalf = (horizontal ? width : depth) / 2;
    const crossCenter = horizontal ? z : x;
    const crossHalf = (horizontal ? depth : width) / 2;
    const alongStart = alongCenter - alongHalf;
    const alongEnd = alongCenter + alongHalf;

    for (const side of [-1, 1]) {
      const drainCross = crossCenter + side * (crossHalf + curbThickness + .035 + sidewalkWidth + sidewalkGap + drainWidth / 2);
      const drainMinCross = drainCross - drainWidth / 2;
      const drainMaxCross = drainCross + drainWidth / 2;
      const cutouts = [];

      validRoads.forEach((other, otherIndex) => {
        if (roadIndex === otherIndex) return;
        const otherCrossCenter = horizontal ? other[1] : other[0];
        const otherCrossHalf = (horizontal ? other[3] : other[2]) / 2;
        if (drainMaxCross <= otherCrossCenter - otherCrossHalf
          || drainMinCross >= otherCrossCenter + otherCrossHalf) return;

        const otherAlongCenter = horizontal ? other[0] : other[1];
        const otherAlongHalf = (horizontal ? other[2] : other[3]) / 2;
        const cutStart = Math.max(alongStart, otherAlongCenter - otherAlongHalf - junctionClearance);
        const cutEnd = Math.min(alongEnd, otherAlongCenter + otherAlongHalf + junctionClearance);
        if (cutEnd > cutStart) cutouts.push([cutStart, cutEnd]);
      });

      obstacles.forEach(obstacle => {
        const { x: obstacleX, z: obstacleZ, halfWidth, halfDepth } = obstacle || {};
        if (![obstacleX, obstacleZ, halfWidth, halfDepth].every(Number.isFinite)
          || halfWidth < 0 || halfDepth < 0) return;
        const obstacleCrossCenter = horizontal ? obstacleZ : obstacleX;
        const obstacleCrossHalf = horizontal ? halfDepth : halfWidth;
        if (drainMaxCross <= obstacleCrossCenter - obstacleCrossHalf - obstacleClearance
          || drainMinCross >= obstacleCrossCenter + obstacleCrossHalf + obstacleClearance) return;

        const obstacleAlongCenter = horizontal ? obstacleX : obstacleZ;
        const obstacleAlongHalf = horizontal ? halfWidth : halfDepth;
        const cutStart = Math.max(alongStart, obstacleAlongCenter - obstacleAlongHalf - obstacleClearance);
        const cutEnd = Math.min(alongEnd, obstacleAlongCenter + obstacleAlongHalf + obstacleClearance);
        if (cutEnd > cutStart) cutouts.push([cutStart, cutEnd]);
      });

      cutouts.sort((a, b) => a[0] - b[0]);
      const mergedCutouts = [];
      for (const [start, end] of cutouts) {
        const previous = mergedCutouts[mergedCutouts.length - 1];
        if (!previous || start > previous[1]) mergedCutouts.push([start, end]);
        else previous[1] = Math.max(previous[1], end);
      }

      const visibleSegments = [];
      let cursor = alongStart;
      for (const [cutStart, cutEnd] of mergedCutouts) {
        if (cutStart - cursor >= minimumLength) visibleSegments.push([cursor, cutStart]);
        cursor = Math.max(cursor, cutEnd);
      }
      if (alongEnd - cursor >= minimumLength) visibleSegments.push([cursor, alongEnd]);

      for (const [start, end] of visibleSegments) {
        const length = end - start;
        drains.push({
          x: horizontal ? (start + end) / 2 : drainCross,
          z: horizontal ? drainCross : (start + end) / 2,
          width: horizontal ? length : drainWidth,
          depth: horizontal ? drainWidth : length,
          side,
          roadIndex,
        });
      }
    }
  });

  return drains;
}
