// Shared client/server coordinates for the reusable district street layout.
// Keep gameplay service points aligned with visible buildings as districts grow.
const BASE_ROADS = Object.freeze([
  // Main cross roads now run nearly to the district boundary.
  Object.freeze([0, 0, 12, 200]),
  Object.freeze([0, 0, 200, 10]),
  Object.freeze([20, 22, 156, 7]),
  Object.freeze([-24, -6, 144, 7]),
  Object.freeze([-24, -36, 146, 7]),
  Object.freeze([25, 45, 144, 7]),
  Object.freeze([-35, 34, 124, 7]),
  // Connected outer loop keeps roads continuous instead of ending in grass.
  Object.freeze([0, -92, 200, 8]),
  Object.freeze([0, 92, 200, 8]),
  Object.freeze([-96, 0, 8, 184]),
  Object.freeze([96, 0, 8, 184]),
]);
const AIRPORT_LINK_ROAD = Object.freeze([22, -28, 44, 7]);
const ERNAKULAM_ROADS = Object.freeze([
  Object.freeze([0, 2, 200, 8]),
  Object.freeze([0, 21, 150, 7]),
  Object.freeze([0, -16, 150, 7]),
  Object.freeze([0, 2, 8, 200]),
  Object.freeze([-22, 2, 7, 118]),
  Object.freeze([22, 2, 7, 118]),
  Object.freeze([-38, -19.5, 64, 7]),
  Object.freeze([-29, -17.5, 7, 49]),
  Object.freeze([0, -42, 8, 116]),
  Object.freeze([0, -92, 200, 8]),
  Object.freeze([0, 92, 200, 8]),
  Object.freeze([-96, 0, 8, 184]),
  Object.freeze([96, 0, 8, 184]),
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

const DISTRICT_FACADE_PALETTES = Object.freeze({
  Kasaragod: { houseWalls: [0xead9bd, 0xd7e2d7, 0xe8cdb9], roofs: [0x914936, 0x704a3c, 0xa75b42], wood: 0x554033, band: 0xf1e6d3, glass: 0x76a8ad, shopWalls: [0xf0dfbf, 0xd7e2d7], awnings: [0xb6563c, 0x9c6d42], shutter: 0x695b4d, shopTrim: 0x4c514d },
  Kannur: { houseWalls: [0xefe2c9, 0xd6dfd5, 0xe7d0c0], roofs: [0x874332, 0x9c503a, 0x71483a], wood: 0x4f392d, band: 0xf4e9d4, glass: 0x7da9b2, shopWalls: [0xf2e1c6, 0xd8e1d7], awnings: [0x9c4b39, 0xb26543], shutter: 0x625449, shopTrim: 0x474c4b },
  Wayanad: { houseWalls: [0xe4dfc9, 0xd4ddce, 0xe8d4b8], roofs: [0x714638, 0x87513b, 0x67513b], wood: 0x493a2c, band: 0xeee8d7, glass: 0x789a91, shopWalls: [0xe9e2ce, 0xd5dfcf], awnings: [0x65794d, 0x9a583e], shutter: 0x595449, shopTrim: 0x414940 },
  Kozhikode: { houseWalls: [0xf0dfc5, 0xd9e3db, 0xe7d1be], roofs: [0x9b4734, 0x7a4a39, 0xa45a3e], wood: 0x563d2e, band: 0xf5ead8, glass: 0x74a6b0, shopWalls: [0xf2e2c9, 0xd5e1da], awnings: [0xb34538, 0x347b7c], shutter: 0x69584a, shopTrim: 0x3f4c4c },
  Malappuram: { houseWalls: [0xe9dfca, 0xd5dfd0, 0xe5d2bb], roofs: [0x87503b, 0x704d3a, 0x9b5b40], wood: 0x4c3a2c, band: 0xf0e8d8, glass: 0x7e9d92, shopWalls: [0xeee4d0, 0xd8e1d3], awnings: [0x6e784b, 0xa9503b], shutter: 0x5f574a, shopTrim: 0x465047 },
  Palakkad: { houseWalls: [0xf0e2c6, 0xe5d5b7, 0xd8dfca], roofs: [0x9a5036, 0x80503a, 0x6e513b], wood: 0x553b2a, band: 0xf7ecd6, glass: 0x78a1a2, shopWalls: [0xf3e4ca, 0xe6d8bc], awnings: [0xb25a36, 0x71804d], shutter: 0x685747, shopTrim: 0x494a40 },
  Thrissur: { houseWalls: [0xeee1cc, 0xdadfd7, 0xe8d6c4], roofs: [0x914b39, 0x7a4d3d, 0xa55b41], wood: 0x503b2e, band: 0xf4eadc, glass: 0x7ba5aa, shopWalls: [0xf1e4d2, 0xdde3dc], awnings: [0x9d4938, 0x477779], shutter: 0x5d554d, shopTrim: 0x414a4b },
  Ernakulam: { houseWalls: [0xe7ddca, 0xd7e0dd, 0xe9d3bd], roofs: [0x8e523f, 0x70483b, 0x9f5940], wood: 0x4d392d, band: 0xf2eadc, glass: 0x79aab6, shopWalls: [0xf1e7d2, 0xd9e4df], awnings: [0xb34d39, 0x317b7b], shutter: 0x65594b, shopTrim: 0x3e484a },
  Idukki: { houseWalls: [0xe2dec9, 0xd3ddca, 0xe7d4b9], roofs: [0x784b39, 0x8c5540, 0x66503c], wood: 0x48392d, band: 0xeee7d6, glass: 0x77998c, shopWalls: [0xe8e3d0, 0xd4decc], awnings: [0x5c764f, 0x94543c], shutter: 0x565348, shopTrim: 0x404940 },
  Alappuzha: { houseWalls: [0xe9dec9, 0xd4e2dc, 0xe5d1bb], roofs: [0x8c4a38, 0x704d3c, 0xa45c42], wood: 0x503a2d, band: 0xf3eadb, glass: 0x70a5ad, shopWalls: [0xf0e2cc, 0xd4e3dc], awnings: [0x337d7d, 0xb2523d], shutter: 0x62584d, shopTrim: 0x3d4b4a },
  Kottayam: { houseWalls: [0xe7ddca, 0xd7e0d3, 0xead5bd], roofs: [0x8e523f, 0x754b3b, 0xa15a40], wood: 0x513a2c, band: 0xf2eadb, glass: 0x76a2a7, shopWalls: [0xf1e7d2, 0xd8e3d6], awnings: [0xa64d3b, 0x6c794d], shutter: 0x63584a, shopTrim: 0x414a45 },
  Pathanamthitta: { houseWalls: [0xe5dfcc, 0xd4ddcf, 0xe8d6bd], roofs: [0x81503c, 0x704a3a, 0x9c5c42], wood: 0x4c3a2d, band: 0xf0e9db, glass: 0x789a91, shopWalls: [0xece5d4, 0xd6e0d2], awnings: [0x687850, 0x9c543d], shutter: 0x5c564a, shopTrim: 0x414940 },
  Kollam: { houseWalls: [0xeee0c9, 0xd4e0d9, 0xe8d1bd], roofs: [0x934b36, 0x78483a, 0xa45c41], wood: 0x543d2e, band: 0xf4ead9, glass: 0x73a6b2, shopWalls: [0xf0e2ca, 0xd6e2dc], awnings: [0xa94b3b, 0x347b80], shutter: 0x665849, shopTrim: 0x414b4b },
  Thiruvananthapuram: { houseWalls: [0xefe1cb, 0xdfe1da, 0xe7d3c1], roofs: [0x92503c, 0x744b3d, 0xa65c42], wood: 0x503b2e, band: 0xf4eadb, glass: 0x79a6b0, shopWalls: [0xf2e5d1, 0xdfe5e0], awnings: [0x9d4a3a, 0x34777e], shutter: 0x60564d, shopTrim: 0x41484a },
});

/** Return a stable Kerala facade palette for a district and a building position seed. */
export function districtFacadePalette(district, variantSeed = 0) {
  const palette = DISTRICT_FACADE_PALETTES[district] || DISTRICT_FACADE_PALETTES.Kottayam;
  const seed = Number.isFinite(variantSeed) ? Math.abs(Math.trunc(variantSeed)) : 0;
  const hash = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  const pick = (values, offset = 0) => values[(hash + offset) % values.length];
  return Object.freeze({
    houseWall: pick(palette.houseWalls),
    roof: pick(palette.roofs, 1),
    wood: palette.wood,
    band: palette.band,
    glass: palette.glass,
    shopWall: pick(palette.shopWalls, 1),
    awning: pick(palette.awnings, 2),
    shutter: palette.shutter,
    shopTrim: palette.shopTrim,
  });
}
