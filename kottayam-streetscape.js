// Decorative-only Kottayam street finish. Coordinates match the playable
// road surfaces in game.js. No colliders, road topology, or traffic rules change.
export const KOTTAYAM_ROAD_RECTS = Object.freeze([
  Object.freeze({ x: 0, z: 0, width: 16, depth: 200 }),
  Object.freeze({ x: 0, z: -22, width: 196, depth: 12 }),
  Object.freeze({ x: 0, z: 22, width: 196, depth: 7 }),
  Object.freeze({ x: -60, z: -34, width: 7, depth: 24 }),
  Object.freeze({ x: 0, z: -92, width: 200, depth: 8 }),
  Object.freeze({ x: 0, z: 92, width: 200, depth: 8 }),
  Object.freeze({ x: -96, z: 0, width: 8, depth: 184 }),
  Object.freeze({ x: 96, z: 0, width: 8, depth: 184 }),
]);

function insideRect(x, z, halfWidth, halfDepth, road, margin = 0) {
  return Math.abs(x - road.x) < halfWidth + road.width / 2 + margin
    && Math.abs(z - road.z) < halfDepth + road.depth / 2 + margin;
}

export function planKottayamRoadFinish({
  roads = KOTTAYAM_ROAD_RECTS,
  mobile = false,
} = {}) {
  const edgeMarkings = [];
  const drainBars = [];
  const spacing = mobile ? 12 : 7.5;
  const stripeLength = mobile ? 6.0 : 5.6;

  roads.forEach((road, roadIndex) => {
    // This map is axis-aligned: road markings run with the long road axis.
    const northSouth = road.depth >= road.width;
    const halfLength = (northSouth ? road.depth : road.width) / 2;
    const center = northSouth ? road.z : road.x;
    const crossCenter = northSouth ? road.x : road.z;
    const halfWidth = (northSouth ? road.width : road.depth) / 2;
    const stripeWidth = .14;

    for (let along = -halfLength + 4; along <= halfLength - 4; along += spacing) {
      const longitudinal = center + along;
      for (const side of [-1, 1]) {
        const cross = crossCenter + side * (halfWidth - .52);
        const x = northSouth ? cross : longitudinal;
        const z = northSouth ? longitudinal : cross;
        const width = northSouth ? stripeWidth : stripeLength;
        const depth = northSouth ? stripeLength : stripeWidth;

        // Do not draw white stripes across any junction / connecting road.
        const junction = roads.some((other, otherIndex) =>
          otherIndex !== roadIndex && insideRect(x, z, width / 2, depth / 2, other, .60));
        if (junction) continue;
        edgeMarkings.push({ x, z, width, depth });
      }
    }
  });

  // Narrow metal grilles overlay the *existing* main-road rain channels.
  // Short bars are batched into a single InstancedMesh; pedestrians/vehicles
  // still interact with the same collision geometry as before.
  const gratingSpacing = mobile ? 22 : 14;
  for (const side of [-1, 1]) {
    for (let z = -65; z <= 65; z += gratingSpacing) {
      if (roads.some((road, index) => index !== 0 &&
        insideRect(side * 8.62, z, .35, .7, road, .65))) continue;
      for (let bar = 0; bar < 5; bar++) {
        drainBars.push({ x: side * 8.62, z: z + (bar - 2) * .18, width: .37, depth: .046 });
      }
    }
  }

  return { edgeMarkings, drainBars };
}

export function addKottayamStreetFinish(THREE, scene, { mobile = false } = {}) {
  const plan = planKottayamRoadFinish({ mobile });
  const drawInstances = (parts, geometry, material, groundY, flat = false) => {
    if (!parts.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, parts.length);
    const dummy = new THREE.Object3D();
    parts.forEach((part, index) => {
      dummy.position.set(part.x, groundY, part.z);
      dummy.rotation.set(flat ? -Math.PI / 2 : 0, 0, 0);
      dummy.scale.set(part.width, 1, part.depth);
      if (flat) dummy.scale.set(part.width, part.depth, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    return mesh;
  };
  drawInstances(
    plan.edgeMarkings,
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0xe7e6df, roughness: .87, metalness: 0 }),
    .052,
    true,
  );
  drawInstances(
    plan.drainBars,
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x30383b, roughness: .62, metalness: .28 }),
    .144,
  );
  return { edgeMarkingCount: plan.edgeMarkings.length, drainBarCount: plan.drainBars.length };
}
