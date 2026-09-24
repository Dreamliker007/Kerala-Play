function isCircle(footprint) {
  return typeof footprint === 'number' || footprint?.type === 'circle';
}

function circleRadius(footprint) {
  return Math.max(0, Number(typeof footprint === 'number' ? footprint : footprint?.radius) || 0);
}

function boxAxes(footprint) {
  if (footprint?.type !== 'oriented-box') return { rightX:1, rightZ:0, forwardX:0, forwardZ:1 };
  const rotation = Number(footprint.rotation) || 0;
  return {
    rightX:Math.cos(rotation),
    rightZ:-Math.sin(rotation),
    forwardX:Math.sin(rotation),
    forwardZ:Math.cos(rotation),
  };
}

function projectBox(footprint, axisX, axisZ) {
  if (footprint?.type !== 'oriented-box') {
    return Math.abs(axisX) * Math.max(0, Number(footprint?.halfWidth) || 0)
      + Math.abs(axisZ) * Math.max(0, Number(footprint?.halfDepth) || 0);
  }
  const axes = boxAxes(footprint);
  return Math.abs(axisX * axes.rightX + axisZ * axes.rightZ) * Math.max(0, Number(footprint.halfWidth) || 0)
    + Math.abs(axisX * axes.forwardX + axisZ * axes.forwardZ) * Math.max(0, Number(footprint.halfLength) || 0);
}

function circleIntersectsBox(x, z, radius, boxX, boxZ, halfWidth, halfDepth) {
  const closestX = Math.max(boxX - halfWidth, Math.min(boxX + halfWidth, x));
  const closestZ = Math.max(boxZ - halfDepth, Math.min(boxZ + halfDepth, z));
  return (x - closestX) ** 2 + (z - closestZ) ** 2 < radius ** 2;
}

function circleIntersectsOrientedBox(x, z, radius, boxX, boxZ, box) {
  const axes = boxAxes(box);
  const dx = x - boxX;
  const dz = z - boxZ;
  const localX = dx * axes.rightX + dz * axes.rightZ;
  const localZ = dx * axes.forwardX + dz * axes.forwardZ;
  const closestX = Math.max(-box.halfWidth, Math.min(box.halfWidth, localX));
  const closestZ = Math.max(-box.halfLength, Math.min(box.halfLength, localZ));
  return (localX - closestX) ** 2 + (localZ - closestZ) ** 2 < radius ** 2;
}

function boxesIntersect(x, z, footprint, boxX, boxZ, collider) {
  const halfWidth = Math.max(0, Number(collider.halfWidth) || 0);
  const halfDepth = Math.max(0, Number(collider.halfDepth) || 0);
  const dx = boxX - x;
  const dz = boxZ - z;
  const playerAxes = boxAxes(footprint);
  const colliderAxes = boxAxes(collider);
  const axes = [
    [playerAxes.rightX, playerAxes.rightZ],
    [playerAxes.forwardX, playerAxes.forwardZ],
    [colliderAxes.rightX, colliderAxes.rightZ],
    [colliderAxes.forwardX, colliderAxes.forwardZ],
  ];
  return axes.every(([axisX, axisZ]) => {
    const distance = Math.abs(dx * axisX + dz * axisZ);
    const combinedRadius = projectBox(footprint, axisX, axisZ) + projectBox(collider, axisX, axisZ);
    return distance < combinedRadius;
  });
}

export function footprintIntersectsCollider(x, z, footprint, collider) {
  if (!collider || !Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (collider.type === 'circle') {
    if (isCircle(footprint)) {
      const limit = circleRadius(footprint) + Math.max(0, Number(collider.radius) || 0);
      return (x - collider.x) ** 2 + (z - collider.z) ** 2 < limit ** 2;
    }
    return circleIntersectsOrientedBox(collider.x, collider.z, collider.radius, x, z, footprint);
  }
  if (collider.type !== 'box' && collider.type !== 'aabb') return false;
  if (isCircle(footprint)) {
    const radius = circleRadius(footprint);
    if (collider.type === 'oriented-box') {
      return circleIntersectsOrientedBox(x, z, radius, collider.x, collider.z, collider);
    }
    return circleIntersectsBox(x, z, radius, collider.x, collider.z, collider.halfWidth, collider.halfDepth);
  }
  return boxesIntersect(x, z, footprint, collider.x, collider.z, collider);
}

export function expandedFootprint(footprint, padding) {
  const amount = Math.max(0, Number(padding) || 0);
  if (isCircle(footprint)) return circleRadius(footprint) + amount;
  return { ...footprint, halfWidth:Math.max(0, Number(footprint.halfWidth) || 0) + amount, halfLength:Math.max(0, Number(footprint.halfLength) || 0) + amount };
}

export function moveWithCollisionFootprint(object, dx, dz, footprint, isBlocked, clampX = value => value, clampZ = value => value) {
  if (!object || (!dx && !dz)) return false;
  let collided = false;
  const distance = Math.hypot(dx, dz);
  const minRadius = isCircle(footprint)
    ? circleRadius(footprint)
    : Math.min(Number(footprint?.halfWidth) || 0, Number(footprint?.halfLength) || 0);
  const maxStep = Math.max(.10, Math.min(.28, minRadius * .38 || .10));
  const steps = Math.max(1, Math.ceil(distance / maxStep));
  const stepX = dx / steps;
  const stepZ = dz / steps;

  for (let step = 0; step < steps; step++) {
    const nextX = clampX(object.position.x + stepX);
    if (!isBlocked(nextX, object.position.z, footprint)) object.position.x = nextX;
    else collided = true;

    const nextZ = clampZ(object.position.z + stepZ);
    if (!isBlocked(object.position.x, nextZ, footprint)) object.position.z = nextZ;
    else collided = true;
  }
  return collided;
}

export function segmentIntersectsColliders(start, end, radius, colliders, maxStep = .22) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const distance = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(distance / Math.max(.05, maxStep)));
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = start.x + dx * t;
    const z = start.z + dz * t;
    if (colliders.some(collider => footprintIntersectsCollider(x, z, radius, collider))) return true;
  }
  return false;
}


export function shortenCameraPathForColliders(target, desired, clearance, colliders, isBlocked, maxStep = .28) {
  const dx = desired.x - target.x;
  const dz = desired.z - target.z;
  const horizontalDistance = Math.hypot(dx, dz);
  if (horizontalDistance < .05) return desired;
  if (!segmentIntersectsColliders(target, desired, clearance, colliders, maxStep)) return desired;

  const steps = Math.max(8, Math.ceil(horizontalDistance / Math.max(.05, maxStep)));
  let safeT = 0;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = target.x + dx * t;
    const z = target.z + dz * t;
    if (isBlocked(x, z, clearance)) break;
    safeT = t;
  }
  if (safeT >= .999) return desired;

  const minT = Math.min(.12, .48 / Math.max(.48, horizontalDistance));
  const t = safeT > minT ? safeT - .035 : Math.max(0, safeT * .72);
  desired.x = target.x + dx * t;
  desired.z = target.z + dz * t;
  // This sweep only checks horizontal blockers. Preserve Y: callers may sweep
  // camera-to-camera each frame, so adding height here would accumulate forever.
  return desired;
}

export function clampCameraHeightToPitchRange(cameraY, targetY, horizontalDistance, minPitch, maxPitch, minDistance = 2.8, padding = .35) {
  const safeTargetY = Number.isFinite(targetY) ? targetY : 0;
  const safeMinPitch = Number.isFinite(minPitch) ? minPitch : 0;
  const safeMaxPitch = Math.max(safeMinPitch, Number.isFinite(maxPitch) ? maxPitch : safeMinPitch);
  const aimDistance = Math.max(
    Math.max(0, Number.isFinite(minDistance) ? minDistance : 0),
    Math.max(0, Number.isFinite(horizontalDistance) ? horizontalDistance : 0),
  );
  const lower = safeTargetY + Math.tan(safeMinPitch) * aimDistance;
  const upper = safeTargetY + Math.tan(safeMaxPitch) * aimDistance + Math.max(0, Number(padding) || 0);
  const safeCameraY = Number.isFinite(cameraY) ? cameraY : lower;
  return Math.max(lower, Math.min(upper, safeCameraY));
}
