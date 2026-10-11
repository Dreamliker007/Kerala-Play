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
      dummy.scale.set(part.width, .032, part.depth);
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

// Subtle built-in facade geometry: no third-party GTA assets or extra textures.
// These details are local to the existing house/shop meshes and do not add
// gameplay colliders, lights, physics, or additional network traffic.
export function addKottayamFacadeFinish(THREE, group, kind = 'house') {
  const trim = new THREE.MeshStandardMaterial({ color: 0xe2d9c8, roughness: .91 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5b4335, roughness: .80 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x4c8294, roughness: .20, metalness: .12,
    emissive: 0x254a53, emissiveIntensity: .065,
  });
  const makeBox = (width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  if (kind === 'house') {
    // Small shaded side windows make homes visibly three-dimensional when
    // approached from the connected roads, without new walls or collision.
    for (const side of [-1, 1]) {
      for (const z of [-1.5, 1.6]) {
        makeBox(.075, 1.55, 1.48, wood, side * 4.362, 2.72, z);
        makeBox(.081, 1.32, 1.23, glass, side * 4.414, 2.72, z);
        makeBox(.12, .12, 1.72, trim, side * 4.43, 1.91, z);
        makeBox(.30, .11, 1.68, trim, side * 4.48, 3.57, z);
        makeBox(.087, 1.35, .06, wood, side * 4.471, 2.72, z);
      }
    }
    return;
  }

  if (kind === 'shop') {
    // Alternating cloth awning valance. One instanced draw call per shop.
    const awningCloth = new THREE.MeshStandardMaterial({
      color: 0xe8dcc0, roughness: .98, side: THREE.DoubleSide,
    });
    const panel = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), awningCloth, 9);
    const dummy = new THREE.Object3D();
    for (let index = 0; index < 9; index++) {
      dummy.position.set(-4.46 + index * 1.11, 3.12, 4.11);
      dummy.scale.set(.58, .27, .06);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      panel.setMatrixAt(index, dummy.matrix);
    }
    panel.instanceMatrix.needsUpdate = true;
    panel.castShadow = false;
    panel.receiveShadow = false;
    panel.computeBoundingSphere();
    group.add(panel);
    // The narrow shop windows flank the existing roll-down shutter.
    for (const x of [-3.33, 3.33]) {
      makeBox(1.14, 1.75, .08, wood, x, 1.93, 2.95);
      makeBox(.96, 1.53, .09, glass, x, 1.93, 3.005);
      makeBox(.05, 1.52, .1, trim, x, 1.93, 3.06);
      makeBox(1.26, .11, .24, trim, x, 1.02, 3.09);
    }
  }
}
