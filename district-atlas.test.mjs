import test from 'node:test';
import assert from 'node:assert/strict';
import { KERALA_DISTRICT_ATLAS, districtAttractionVisitId } from './district-atlas.js';
import { ALL_DISTRICT_COIN_PICKUPS, DISTRICT_COIN_PICKUP_RADIUS, DISTRICT_COIN_REWARD, DISTRICT_COIN_RESPAWN_MS, districtCoinPickups } from './district-collectibles.js';

const EXPECTED_DISTRICTS = [
  'Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram','Palakkad','Thrissur',
  'Ernakulam','Idukki','Alappuzha','Kottayam','Pathanamthitta','Kollam','Thiruvananthapuram'
];

test('district atlas covers all 14 districts with six mapped attractions and cultural detail', () => {
  assert.deepEqual(Object.keys(KERALA_DISTRICT_ATLAS), EXPECTED_DISTRICTS);
  for (const district of EXPECTED_DISTRICTS) {
    const entry = KERALA_DISTRICT_ATLAS[district];
    assert.ok(entry.landscape.length > 5);
    for (const field of ['identity','arts','food','festivals','crafts','language']) assert.ok(entry.culture[field].length > 10);
    assert.equal(entry.attractions.length, 6);
    for (const spot of entry.attractions) {
      assert.ok(spot.name.length > 3);
      assert.ok(spot.description.length > 20);
      assert.ok(spot.x >= -110 && spot.x <= 110);
      assert.ok(spot.z >= -110 && spot.z <= 110);
      assert.ok(spot.landmarkId.startsWith('district-landmark:') || spot.landmarkId.startsWith('district-attraction:'));
    }
  }
});

test('visit IDs are unique and preserve the existing city-landmark IDs', () => {
  const ids = EXPECTED_DISTRICTS.flatMap(district => KERALA_DISTRICT_ATLAS[district].attractions.map(spot => spot.landmarkId));
  assert.equal(new Set(ids).size, 84);
  const bekal = KERALA_DISTRICT_ATLAS.Kasaragod.attractions[0];
  const kumarakom = KERALA_DISTRICT_ATLAS.Kottayam.attractions[0];
  assert.equal(districtAttractionVisitId('Kasaragod', bekal, 0), 'district-landmark:Kasaragod');
  assert.equal(districtAttractionVisitId('Kottayam', kumarakom, 0), 'district-attraction:Kottayam:kumarakom-bird-sanctuary');
  assert.equal(KERALA_DISTRICT_ATLAS.Idukki.attractions.find(spot => spot.kind === 'adventure')?.name, 'Kuttikkanam Adventure Zone');
});

test('district coin pickups cover fifteen walkable, spread-out spots per district', () => {
  assert.equal(ALL_DISTRICT_COIN_PICKUPS.length, EXPECTED_DISTRICTS.length * 15);
  assert.equal(new Set(ALL_DISTRICT_COIN_PICKUPS.map(coin => coin.id)).size, ALL_DISTRICT_COIN_PICKUPS.length);
  assert.equal(DISTRICT_COIN_REWARD, 10);
  assert.equal(DISTRICT_COIN_RESPAWN_MS, 20_000);
  for (const district of EXPECTED_DISTRICTS) {
    const coins = districtCoinPickups(district);
    assert.equal(coins.length, 15);
    assert.equal(new Set(coins.map(coin => coin.attractionId)).size, 6, `${district} coins should span its landmarks`);
    for (const coin of coins) {
      const attraction = KERALA_DISTRICT_ATLAS[district].attractions.find(item => item.id === coin.attractionId);
      assert.ok(attraction);
      assert.equal(coin.district, district);
      assert.equal(Math.hypot(coin.x - attraction.x, coin.z - attraction.z), 9);
      assert.ok(DISTRICT_COIN_PICKUP_RADIUS > 0 && DISTRICT_COIN_PICKUP_RADIUS < 9);
      assert.ok(Math.abs(coin.x) < 110 && Math.abs(coin.z) < 110);
    }
  }
});
