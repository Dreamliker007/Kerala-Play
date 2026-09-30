const TILE_COLORS = Object.freeze([0xb46244, 0xa9543d, 0xc06d4d]);
const TILE_COUNT = 8;
const TILE_SPACING = 1.18;
const sharedTileResources = new WeakMap();

function getSharedResources(THREE) {
  let resources = sharedTileResources.get(THREE);
  if (resources) return resources;

  const columns = 8;
  const rows = 12;
  const width = TILE_SPACING;
  const length = 4.45;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const x = (u - .5) * width;
      const arch = .065 * (1 - Math.pow((u - .5) * 2, 2));
      positions.push(x, arch, (v - .5) * length);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const start = row * (columns + 1) + column;
      const nextRow = start + columns + 1;
      indices.push(start, nextRow, start + 1, start + 1, nextRow, nextRow + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: .94,
    metalness: .01,
    side: THREE.DoubleSide,
  });
  resources = { geometry, material };
  sharedTileResources.set(THREE, resources);
  return resources;
}

/** Build two compact instanced roof slopes with varied, curved Kerala clay tiles. */
export function createKeralaRoofTiles(THREE, x, z) {
  const { geometry, material } = getSharedResources(THREE);
  const front = new THREE.InstancedMesh(geometry, material, TILE_COUNT);
  const back = new THREE.InstancedMesh(geometry, material, TILE_COUNT);
  front.name = 'Curved terracotta roof tiles';
  back.name = 'Curved terracotta roof tiles';
  const transform = new THREE.Object3D();

  for (let index = 0; index < TILE_COUNT; index++) {
    const tileX = -4.13 + index * TILE_SPACING;
    const seed = Math.abs(Math.round(x * 11 + z * 17 + index * 7));
    const color = new THREE.Color(TILE_COLORS[seed % TILE_COLORS.length]);
    color.multiplyScalar(.93 + (seed % 5) * .025);

    transform.position.set(tileX, 5.71, 1.39);
    transform.rotation.set(-.52, 0, 0);
    transform.updateMatrix();
    front.setMatrixAt(index, transform.matrix);
    front.setColorAt(index, color);

    transform.position.set(tileX, 5.71, -1.39);
    transform.rotation.set(.52, 0, 0);
    transform.updateMatrix();
    back.setMatrixAt(index, transform.matrix);
    back.setColorAt(index, color);
  }

  for (const slope of [front, back]) {
    slope.instanceMatrix.needsUpdate = true;
    if (slope.instanceColor) slope.instanceColor.needsUpdate = true;
    slope.computeBoundingSphere();
  }
  return [front, back];
}

