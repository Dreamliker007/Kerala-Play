import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENERIC_DISTRICT_FRUIT_TREES,
  GENERIC_DISTRICT_OFFICE,
  genericDistrictFuelPosition,
  genericDistrictRoads,
} from './district-layout.js';

function overlaps(a, b) {
  return Math.abs(a.x - b.x) <= (a.width + b.width) / 2
    && Math.abs(a.z - b.z) <= (a.depth + b.depth) / 2;
}

function roadRects(hasAirport) {
  return genericDistrictRoads(hasAirport).map(([x, z, width, depth]) => ({ x, z, width, depth }));
}

test('all generic district roads form one connected network', () => {
  for (const hasAirport of [false, true]) {
    const roads = roadRects(hasAirport);
    const reached = new Set([0]);
    const pending = [0];
    while (pending.length) {
      const current = roads[pending.pop()];
      roads.forEach((candidate, index) => {
        if (!reached.has(index) && overlaps(current, candidate)) {
          reached.add(index);
          pending.push(index);
        }
      });
    }
    assert.equal(reached.size, roads.length, hasAirport ? 'airport roads' : 'standard roads');
  }
});

test('fruit trees and service buildings stay clear of roads and airport runway', () => {
  const runway = { x: 32, z: -45, width: 58, depth: 9 };
  for (const hasAirport of [false, true]) {
    const fuel = genericDistrictFuelPosition(hasAirport);
    const placements = [
      { label: 'fuel station', x: fuel.x, z: fuel.z, width: 6.4, depth: 4.4 },
      { label: 'office tower', ...GENERIC_DISTRICT_OFFICE, width: 10, depth: 8 },
      ...GENERIC_DISTRICT_FRUIT_TREES.map(([x, z, scale, species]) => ({
        label: species + ' tree', x, z, width: scale * 1.2, depth: scale * 1.2,
      })),
    ];
    for (const placement of placements) {
      for (const road of roadRects(hasAirport)) {
        assert.equal(overlaps(placement, road), false, placement.label + ' must clear road');
      }
      if (hasAirport) assert.equal(overlaps(placement, runway), false, placement.label + ' must clear runway');
    }
  }
});
