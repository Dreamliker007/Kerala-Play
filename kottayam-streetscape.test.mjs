import test from 'node:test';
import assert from 'node:assert/strict';
import { KOTTAYAM_ROAD_RECTS, planKottayamRoadFinish } from './kottayam-streetscape.js';

function overlaps(placement, road, margin = 0) {
  return Math.abs(placement.x - road.x) < placement.width / 2 + road.width / 2 + margin &&
    Math.abs(placement.z - road.z) < placement.depth / 2 + road.depth / 2 + margin;
}

test('Kottayam road finish remains within the existing connected-road footprint', () => {
  const plan = planKottayamRoadFinish();
  assert.ok(plan.edgeMarkings.length > 70);
  assert.ok(plan.edgeMarkings.length < 400, 'keep the decorative geometry mobile-friendly');
  assert.ok(plan.drainBars.length > 0);
  for (const marking of plan.edgeMarkings) {
    assert.ok(KOTTAYAM_ROAD_RECTS.some(road => overlaps(marking, road)), 'marking must lie on existing tarmac');
    assert.ok(Math.abs(marking.x) <= 100.1 && Math.abs(marking.z) <= 100.1, 'marking must stay within town bounds');
    assert.ok(marking.width > 0 && marking.depth > 0);
  }
});

test('edge lines never cross another junction or road surface', () => {
  const markings = planKottayamRoadFinish().edgeMarkings;
  for (const marking of markings) {
    const matchingRoads = KOTTAYAM_ROAD_RECTS.filter(road => overlaps(marking, road, .60));
    assert.equal(matchingRoads.length, 1, `paint at ${marking.x},${marking.z} should not cross an intersection`);
  }
});

test('mobile layout draws fewer instanced street elements', () => {
  const desktop = planKottayamRoadFinish({ mobile: false });
  const mobile = planKottayamRoadFinish({ mobile: true });
  assert.ok(mobile.edgeMarkings.length < desktop.edgeMarkings.length);
  assert.ok(mobile.drainBars.length < desktop.drainBars.length);
});

test('drain grilles stay along the existing main road channels away from crossroads', () => {
  const bars = planKottayamRoadFinish().drainBars;
  for (const bar of bars) {
    assert.ok(Math.abs(Math.abs(bar.x) - 8.62) < 1e-6);
    assert.ok(bar.z >= -66 && bar.z <= 66);
    assert.ok(KOTTAYAM_ROAD_RECTS.slice(1).every(road => !overlaps(bar, road, .65)));
  }
});

test('repeated world builds return an identical deterministic plan without state leaks', () => {
  const one = planKottayamRoadFinish();
  const two = planKottayamRoadFinish();
  assert.deepEqual(two, one);
  assert.notStrictEqual(one.edgeMarkings, two.edgeMarkings);
});
