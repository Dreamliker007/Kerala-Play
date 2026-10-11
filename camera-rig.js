// GTA-inspired third-person camera options for Kerala Play.
// Keep these helpers free of DOM and Three.js so gameplay settings are testable.
export const CAMERA_PRESETS = Object.freeze({
  close: 0.74,
  classic: 1,
  wide: 1.27,
});
export const CAMERA_PRESET_ORDER = Object.freeze(['close', 'classic', 'wide']);
export const CAMERA_RECENTER_DELAY_MS = 2600;

export function normalizeCameraPreset(value) {
  return Object.prototype.hasOwnProperty.call(CAMERA_PRESETS, value) ? value : 'classic';
}

export function cycleCameraPreset(current, direction = 1) {
  const index = CAMERA_PRESET_ORDER.indexOf(normalizeCameraPreset(current));
  const step = direction < 0 ? -1 : 1;
  return CAMERA_PRESET_ORDER[(index + step + CAMERA_PRESET_ORDER.length) % CAMERA_PRESET_ORDER.length];
}

export function cameraDistanceForPreset(distance, preset, fixedCamera = false) {
  // Indoor and interior vehicle cameras must not zoom through walls or dashboards.
  return fixedCamera ? distance : distance * CAMERA_PRESETS[normalizeCameraPreset(preset)];
}

export function cameraCanAutoRecenter(lookPointerActive, lastLookTime, now, delayMs = CAMERA_RECENTER_DELAY_MS) {
  return !lookPointerActive && now - lastLookTime >= delayMs;
}
