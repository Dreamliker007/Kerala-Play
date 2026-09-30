import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENERIC_DISTRICT_FRUIT_TREES,
  GENERIC_DISTRICT_OFFICE,
  genericDistrictFuelPosition,
  genericDistrictRoads,
  ernakulamDistrictRoads,
  planRoadsideDrainSegments,
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

test('road drains sit beyond sidewalks and leave junction openings', () => {
  const roads = genericDistrictRoads(true);
  const drains = planRoadsideDrainSegments(roads);
  assert.ok(drains.length > roads.length);
  for (const drain of drains) {
    assert.ok([drain.x, drain.z, drain.width, drain.depth].every(Number.isFinite));
    for (const road of roadRects(true)) {
      assert.equal(overlaps(drain, road), false, 'drain must not overlap a carriageway');
    }
  }

  const junction = planRoadsideDrainSegments([[0, 0, 150, 10], [0, 0, 12, 160]]);
  assert.ok(junction.some(segment => segment.width > segment.depth && segment.x < -5));
  assert.ok(junction.some(segment => segment.width > segment.depth && segment.x > 5));
  assert.ok(junction.some(segment => segment.depth > segment.width && segment.z < -7));
  assert.ok(junction.some(segment => segment.depth > segment.width && segment.z > 7));
});

test('road drain routes leave clearance around nearby building footprints', () => {
  const obstacle = { x: -46, z: -12, halfWidth: 3, halfDepth: 2 };
  const obstacleRect = { x: obstacle.x, z: obstacle.z, width: obstacle.halfWidth * 2, depth: obstacle.halfDepth * 2 };
  const drains = planRoadsideDrainSegments(genericDistrictRoads(), { obstacles: [obstacle] });
  assert.ok(drains.length > 0);
  assert.ok(drains.every(drain => !overlaps(drain, obstacleRect)), 'drains must route around solid building footprints');
});

test('standard and airport district drain plans keep all lengths positive and roads clear', () => {
  for (const hasAirport of [false, true]) {
    const roads = genericDistrictRoads(hasAirport);
    const roadBounds = roadRects(hasAirport);
    const drains = planRoadsideDrainSegments(roads);
    assert.ok(drains.length > 0);
    for (const drain of drains) {
      assert.ok(drain.width > 0 && drain.depth > 0);
      for (const road of roadBounds) {
        assert.equal(overlaps(drain, road), false, 'district drainage must stay outside every road');
      }
    }
  }
});

test('Ernakulam roads stay connected and their drainage stays outside traffic lanes', () => {
  const roads = ernakulamDistrictRoads();
  const bounds = roadRectsFor(roads);
  const drains = planRoadsideDrainSegments(roads);
  const reached = new Set([0]);
  const pending = [0];
  while (pending.length) {
    const current = bounds[pending.pop()];
    bounds.forEach((candidate, index) => {
      if (!reached.has(index) && overlaps(current, candidate)) {
        reached.add(index);
        pending.push(index);
      }
    });
  }
  assert.equal(reached.size, roads.length, 'Ernakulam road segments must connect');
  assert.ok(drains.length > 0);
  for (const drain of drains) {
    assert.ok(drain.width > 0 && drain.depth > 0);
    for (const road of bounds) {
      assert.equal(overlaps(drain, road), false, 'Ernakulam drains must stay outside each carriageway');
    }
  }
});

function roadRectsFor(roads) {
  return roads.map(([x, z, width, depth]) => ({ x, z, width, depth }));
}
