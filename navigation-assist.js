const VERSION = 'V102.5';
window.KERALA_PLAY_VERSION = VERSION;

const style = document.createElement('style');
style.textContent = `
  #navigation-assist { position:absolute; z-index:5; left:50%; top:calc(env(safe-area-inset-top) + 14px); transform:translateX(-50%); display:none; align-items:center; gap:8px; max-width:min(360px,46vw); padding:7px 10px; border:1px solid rgba(188,255,217,.42); border-radius:12px; color:#f3fff8; background:rgba(7,38,42,.78); box-shadow:0 4px 16px rgba(0,0,0,.22); font:800 10px/1.2 system-ui,sans-serif; pointer-events:auto; touch-action:manipulation; cursor:pointer; backdrop-filter:blur(5px); }
  #navigation-assist.active { display:flex; }
  #navigation-assist.arrived { display:flex; border-color:rgba(255,224,115,.7); background:rgba(73,63,18,.88); }
  #navigation-assist .nav-arrow { display:grid; place-items:center; width:24px; height:24px; flex:0 0 auto; border-radius:50%; background:rgba(74,199,125,.22); font-size:15px; }
  #navigation-assist .nav-copy { min-width:0; }
  #navigation-assist strong, #navigation-assist small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #navigation-assist small { margin-top:2px; color:#c4e4d6; font-size:8px; font-weight:700; }
  @media (orientation:landscape) and (max-height:560px) and (hover:none) and (pointer:coarse) { #navigation-assist { top:calc(env(safe-area-inset-top) + 12px); max-width:36vw; padding:5px 8px; } #navigation-assist .nav-arrow { width:20px; height:20px; font-size:12px; } }
`;
document.head.append(style);

const chip = document.createElement('button');
chip.id = 'navigation-assist';
chip.type = 'button';
chip.setAttribute('aria-label', 'Open current destination on Kerala map');
chip.innerHTML = '<span class="nav-arrow" aria-hidden="true">🧭</span><span class="nav-copy"><strong>Navigation</strong><small>Open map</small></span>';
(document.querySelector('#hud') || document.body).append(chip);

const title = chip.querySelector('strong');
const detail = chip.querySelector('small');
const missionText = document.querySelector('#mission-text');
const landmarkStatus = document.querySelector('#landmark-status');
const mapOpen = document.querySelector('#map-open');

let activeName = '';
let lastDistanceBand = Infinity;
let arrivalTimer = 0;

function vibrate(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* optional device feedback */ }
}

function distanceFromStatus(text) {
  const match = String(text || '').match(/(\d+)\s*m\b/i);
  return match ? Number(match[1]) : Infinity;
}

function activeRouteFromMission(mission, status) {
  const destination = mission.match(/^Destination:\s*(.+)$/i);
  if (destination) return { name: destination[1].trim(), kind: 'destination' };

  // Job travel and NPC favors already drive the same map route in game.js, but
  // their mission text is not prefixed with "Destination". Keep the compact
  // navigation chip available whenever those missions expose a live distance.
  if (!Number.isFinite(distanceFromStatus(status))) return null;
  const favor = mission.match(/^Favor for\s+(.+?):\s*(.+)$/i);
  if (favor) return { name: `${favor[1].trim()} favor`, kind: 'favor' };
  const job = mission.match(/^(.+?):\s*(.+)$/i);
  if (job && !/^Arrived$/i.test(job[1].trim())) return { name: job[1].trim(), kind: 'job' };
  return null;
}

function refreshNavigationAssist() {
  const mission = missionText?.textContent?.trim() || '';
  const status = landmarkStatus?.textContent?.trim() || '';
  const route = activeRouteFromMission(mission, status);
  const arrived = mission.match(/^Arrived:\s*(.+)$/i);

  if (route) {
    clearTimeout(arrivalTimer);
    const name = route.name;
    const isNew = name !== activeName;
    activeName = name;
    chip.classList.remove('arrived');
    chip.classList.add('active');
    chip.dataset.routeKind = route.kind;
    title.textContent = name;
    detail.textContent = status || 'Route active · tap to open map';
    const distance = distanceFromStatus(status);
    if (isNew) {
      lastDistanceBand = Infinity;
      vibrate(25);
    }
    const band = distance <= 20 ? 20 : distance <= 50 ? 50 : distance <= 100 ? 100 : Infinity;
    if (band < lastDistanceBand) {
      lastDistanceBand = band;
      if (Number.isFinite(band)) vibrate(band <= 20 ? [35, 45, 35] : 20);
    }
    return;
  }

  if (arrived) {
    const name = arrived[1].trim();
    if (activeName || !chip.classList.contains('arrived')) vibrate([45, 55, 80]);
    activeName = '';
    lastDistanceBand = Infinity;
    delete chip.dataset.routeKind;
    chip.classList.remove('active');
    chip.classList.add('arrived');
    title.textContent = `Arrived · ${name}`;
    detail.textContent = status || 'Destination reached';
    clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => chip.classList.remove('arrived'), 3200);
    return;
  }

  activeName = '';
  lastDistanceBand = Infinity;
  delete chip.dataset.routeKind;
  chip.classList.remove('active');
}

chip.addEventListener('click', () => mapOpen?.click());

const observer = new MutationObserver(refreshNavigationAssist);
if (missionText) observer.observe(missionText, { childList: true, characterData: true, subtree: true });
if (landmarkStatus) observer.observe(landmarkStatus, { childList: true, characterData: true, subtree: true });
refreshNavigationAssist();
