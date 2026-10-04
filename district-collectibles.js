import { KERALA_DISTRICT_ATLAS } from './district-atlas.js';

export const DISTRICT_COIN_COUNT = 4;
export const DISTRICT_COIN_REWARD = 10;
export const DISTRICT_COIN_PICKUP_RADIUS = 3.2;

const COIN_OFFSETS = Object.freeze([
  Object.freeze({ x: 9, z: 0 }),
  Object.freeze({ x: 0, z: 9 }),
  Object.freeze({ x: -9, z: 0 }),
  Object.freeze({ x: 0, z: -9 }),
]);

export function districtCoinPickups(district) {
  const attractions = KERALA_DISTRICT_ATLAS[district]?.attractions || [];
  return attractions.slice(0, DISTRICT_COIN_COUNT).map((attraction, index) => {
    const offset = COIN_OFFSETS[index];
    return Object.freeze({
      id: `coin:${district}:${attraction.id}`,
      district,
      attractionId: attraction.id,
      name: `${attraction.name} coin`,
      x: attraction.x + offset.x,
      z: attraction.z + offset.z,
      points: DISTRICT_COIN_REWARD,
    });
  });
}

export const ALL_DISTRICT_COIN_PICKUPS = Object.freeze(
  Object.values(KERALA_DISTRICT_ATLAS).flatMap(atlas => districtCoinPickups(atlas.district)),
);

export const DISTRICT_COIN_BY_ID = new Map(ALL_DISTRICT_COIN_PICKUPS.map(coin => [coin.id, coin]));
