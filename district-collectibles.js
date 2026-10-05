import { KERALA_DISTRICT_ATLAS } from './district-atlas.js';

export const DISTRICT_COIN_COUNT = 15;
export const DISTRICT_COIN_REWARD = 10;
export const DISTRICT_COIN_PICKUP_RADIUS = 3.2;
export const DISTRICT_COIN_RESPAWN_MS = 20_000;

const COIN_SLOTS = Object.freeze([
  Object.freeze({ attraction: 0, x: 9, z: 0 }),
  Object.freeze({ attraction: 0, x: 0, z: 9 }),
  Object.freeze({ attraction: 0, x: -9, z: 0 }),
  Object.freeze({ attraction: 1, x: 9, z: 0 }),
  Object.freeze({ attraction: 1, x: 0, z: 9 }),
  Object.freeze({ attraction: 1, x: -9, z: 0 }),
  Object.freeze({ attraction: 2, x: 9, z: 0 }),
  Object.freeze({ attraction: 2, x: 0, z: 9 }),
  Object.freeze({ attraction: 2, x: -9, z: 0 }),
  Object.freeze({ attraction: 3, x: 0, z: -9 }),
  Object.freeze({ attraction: 3, x: 9, z: 0 }),
  Object.freeze({ attraction: 3, x: -9, z: 0 }),
  Object.freeze({ attraction: 4, x: 9, z: 0 }),
  Object.freeze({ attraction: 4, x: -9, z: 0 }),
  Object.freeze({ attraction: 5, x: 0, z: 9 }),
]);

export function districtCoinPickups(district) {
  const attractions = KERALA_DISTRICT_ATLAS[district]?.attractions || [];
  return COIN_SLOTS.flatMap((slot, index) => {
    const attraction = attractions[slot.attraction];
    if (!attraction) return [];
    return Object.freeze({
      id: `coin:${district}:${attraction.id}:${index + 1}`,
      district,
      attractionId: attraction.id,
      name: `${attraction.name} coin ${index + 1}`,
      x: attraction.x + slot.x,
      z: attraction.z + slot.z,
      points: DISTRICT_COIN_REWARD,
    });
  });
}

export const ALL_DISTRICT_COIN_PICKUPS = Object.freeze(
  Object.values(KERALA_DISTRICT_ATLAS).flatMap(atlas => districtCoinPickups(atlas.district)),
);

export const DISTRICT_COIN_BY_ID = new Map(ALL_DISTRICT_COIN_PICKUPS.map(coin => [coin.id, coin]));
