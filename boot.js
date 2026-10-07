// Android releases are locked to landscape by the generated native manifest.
// This silent helper remains for the optional fullscreen button in browsers.
async function requestKeralaLandscape() {
  const root = document.documentElement;

  // Chromium only permits orientation locking from an installed app or a
  // fullscreen document. Request fullscreen first while this click still
  // counts as a direct user gesture.
  if (!document.fullscreenElement && root.requestFullscreen) {
    try {
      await root.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      // Fullscreen can be blocked by WebView/PWA policy; native Android builds
      // are locked separately by the generated Android manifest.
    }
  }

  if (screen.orientation?.lock) {
    for (const mode of ['landscape-primary', 'landscape']) {
      try {
        await screen.orientation.lock(mode);
        break;
      } catch {
        // Try the broader landscape mode before falling back to manual rotate.
      }
    }
  }

  return matchMedia('(orientation: landscape)').matches || innerWidth > innerHeight;
}

window.requestKeralaLandscape = requestKeralaLandscape;

const splashStatus = document.querySelector('#kp-splash-status');
const networkStatus = document.querySelector('#network-status');
const networkStatusText = document.querySelector('#network-status-text');
const networkRetry = document.querySelector('#network-retry');
let networkHideTimer = null;

function setSplashStatus(message) {
  if (splashStatus?.isConnected) splashStatus.textContent = message;
}

function showNetworkStatus(state, message, autoHideMs = 0) {
  if (!networkStatus || !networkStatusText) return;
  clearTimeout(networkHideTimer);
  networkStatus.dataset.state = state;
  networkStatusText.textContent = message;
  networkStatus.classList.add('show');
  if (autoHideMs > 0) networkHideTimer = setTimeout(() => networkStatus.classList.remove('show'), autoHideMs);
}

function handleNetworkOffline() {
  setSplashStatus('Waiting for internet connection');
  showNetworkStatus('offline', 'No internet connection. Kerala Play will reconnect automatically.');
}

function handleNetworkOnline() {
  setSplashStatus('Connecting to Kerala Play');
  showNetworkStatus('online', 'Back online · reconnecting to Kerala Play…', 2600);
  window.dispatchEvent(new CustomEvent('kerala-network-restored'));
}

networkRetry?.addEventListener('click', () => {
  if (navigator.onLine === false) {
    handleNetworkOffline();
    return;
  }
  showNetworkStatus('online', 'Retrying connection…', 2200);
  window.dispatchEvent(new CustomEvent('kerala-network-restored'));
});
window.addEventListener('offline', handleNetworkOffline);
window.addEventListener('online', handleNetworkOnline);
if (navigator.onLine === false) handleNetworkOffline();

function finishKeralaSplash() {
  document.body.classList.add('kp-ready');
  const splash = document.querySelector('#kp-splash');
  if (!splash) return;
  setTimeout(() => splash.remove(), 520);
}

// Navigation assist is deliberately isolated from the world module so a HUD
// feedback failure can never prevent the 3D world from starting.
import('./navigation-assist.js?v=115.0').catch(error => console.warn('Navigation assist unavailable:', error));
import('./ride-assist.js?v=115.0').catch(error => console.warn('Ride assist unavailable:', error));

// Display a useful recovery screen even if a module fails before game.js runs.
const slowStartTimer = setTimeout(() => {
  if (document.querySelector('#kp-splash')) setSplashStatus(navigator.onLine === false
    ? 'Waiting for internet connection'
    : 'Still connecting · preparing your world');
}, 5000);

import('./game.js?v=136.0').then(() => {
  clearTimeout(slowStartTimer);
  setSplashStatus('World ready');
  // Give the first rendered frame a moment to settle before revealing the world.
  requestAnimationFrame(() => setTimeout(finishKeralaSplash, 260));
}).catch(error => {
  clearTimeout(slowStartTimer);
  console.error('Kerala Play startup failed:', error);
  finishKeralaSplash();
  const fallback = document.querySelector('#fallback');
  fallback.style.display = 'grid';
  fallback.textContent = location.protocol === 'file:'
    ? 'Start Kerala Play with npm start in its project folder, then open http://localhost:3000. Accounts and multiplayer need the included server.'
    : 'Kerala Play could not load. Reload this page. If it continues, restart the server with npm start and check its terminal output.';
});
