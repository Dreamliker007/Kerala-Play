// Original procedural detail for Kerala Play's existing character and car models.
// Decorative meshes only: no movement, camera, collision or networking changes.
export const CHARACTER_DETAIL_LEVELS = Object.freeze(['standard', 'hero']);
const part = (position, size) => ({ position, size });

export function planCharacterSurfaceFinish({ gender = 'male', outfit = 'casual', level = 'standard' } = {}) {
  const female = gender === 'female';
  const formal = outfit !== 'mundu' && outfit !== 'saree';
  const hero = level === 'hero';
  const clothing = [];
  const shoes = [];
  if (formal) {
    for (const side of [-1, 1]) {
      clothing.push({ ...part([side * .085, 1.805, .242], [.115, .048, .085]), material:'collar' });
    }
  }
  if (hero) {
    if (formal) {
      clothing.push({ ...part([female ? .19 : -.17, 1.46, .242], [.14, .015, .018]), material:'stitch' });
      clothing.push({ ...part([female ? .19 : -.17, 1.495, .241], [.015, .07, .018]), material:'stitch' });
    }
    for (const side of [-1, 1]) {
      shoes.push({ side, ...part([0, -.059, .016], [.187, .025, .341]), material:'sole' });
      shoes.push({ side, ...part([0, -.001, .119], [.16, .008, .068]), material:'toe' });
    }
  }
  return { clothing, shoes };
}

export function applyCharacterSurfaceFinish(THREE, person, parts, options = {}) {
  const { clothing, shoes } = planCharacterSurfaceFinish(options);
  const shirt = new THREE.MeshStandardMaterial({ color: options.shirt ?? 0x777b7f, roughness: .94 });
  const stitches = new THREE.MeshStandardMaterial({ color: options.accent ?? 0xbcb6aa, roughness: .96 });
  const sole = new THREE.MeshStandardMaterial({ color: 0x171a1d, roughness: .97 });
  const toe = new THREE.MeshStandardMaterial({ color: options.shoes ?? 0x302a28, roughness: .86 });
  const materials = { collar:shirt, stitch:stitches, sole, toe };
  function attach(target, item) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...item.size), materials[item.material]);
    mesh.position.set(...item.position);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    target.add(mesh);
  }
  for (const item of clothing) attach(person, item);
  for (const item of shoes) {
    const foot = parts[item.side === -1 ? 'leftFoot' : 'rightFoot'];
    if (foot) attach(foot, item);
  }
  return clothing.length + shoes.length;
}

export function planVehicleSurfaceFinish({ kind = 'car', width = 1.62, length = 3.35 } = {}) {
  const finish = { dark:[], chrome:[], reflectors:[] };
  if (kind === 'car') {
    const sideX = width / 2 + .023;
    for (const side of [-1, 1]) {
      // Short body seams above wheels, not across door openings or glass.
      for (const z of [-.51, .51]) {
        finish.dark.push(part([side * sideX, .69, z], [.012, .25, .013]));
        finish.chrome.push(part([side * (sideX + .017), .92, z + .12], [.038, .027, .155]));
      }
      finish.reflectors.push(part([side * width * .405, .455, length / 2 + .092], [.12, .038, .018]));
      finish.reflectors.push(part([side * width * .405, .455, -length / 2 - .092], [.12, .038, .018]));
    }
    // Four front grille slats behind the existing front registration plate.
    for (const y of [.54, .575, .61, .645]) {
      finish.chrome.push(part([0, y, length / 2 + .113], [width * .38, .009, .012]));
    }
  } else if (kind === 'bus') {
    for (const side of [-1, 1]) {
      finish.chrome.push(part([side * (width / 2 + .012), 1.12, 0], [.013, .038, length * .85]));
      finish.reflectors.push(part([side * width * .39, .41, -length / 2 - .09], [.17, .068, .02]));
    }
    for (const z of [-1.0, .65]) {
      finish.dark.push(part([0, 2.205, z], [width * .35, .045, .38]));
    }
  }
  return finish;
}

export function applyVehicleSurfaceFinish(THREE, vehicle, options = {}) {
  const design = planVehicleSurfaceFinish(options);
  const materials = {
    dark: new THREE.MeshStandardMaterial({ color:0x293237, metalness:.19, roughness:.72 }),
    chrome: new THREE.MeshStandardMaterial({ color:0xb7bec0, metalness:.45, roughness:.50 }),
    reflectors: new THREE.MeshStandardMaterial({ color:0xa84430, emissive:0x481910, emissiveIntensity:.07, roughness:.46 }),
  };
  const transform = new THREE.Object3D();
  for (const [kind, items] of Object.entries(design)) {
    if (!items.length) continue;
    // One draw call per material instead of one mesh per door handle or grille bar.
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials[kind], items.length);
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      transform.position.set(...item.position);
      transform.rotation.set(0, 0, 0);
      transform.scale.set(...item.size);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.computeBoundingSphere();
    vehicle.add(mesh);
  }
  return Object.values(design).reduce((total, items) => total + items.length, 0);
}
