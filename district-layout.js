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

export function genericDistrictFuelPosition(hasAirport = false) {
  return hasAirport ? AIRPORT_FUEL : STANDARD_FUEL;
}
