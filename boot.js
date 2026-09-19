// Landscape-first mobile shell.
const rotateLandscape = document.querySelector('#rotate-landscape');
const rotateDevice = document.querySelector('#rotate-device');
const rotateCopy = rotateDevice?.querySelector('p');

function keralaIsLandscape() {
  return matchMedia('(orientation: landscape)').matches || innerWidth > innerHeight;
}

function updateLandscapePrompt(message = '') {
  if (message && rotateCopy) rotateCopy.textContent = message;
  if (!rotateLandscape) return;
  rotateLandscape.disabled = false;
  rotateLandscape.textContent = keralaIsLandscape() ? 'LANDSCAPE READY' : 'ENTER LANDSCAPE';
}

async function requestKeralaLandscape() {
  const root = document.documentElement;
  if (rotateLandscape) {
    rotateLandscape.disabled = true;
    rotateLandscape.textContent = 'ROTATING…';
  }

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

  let locked = false;
  if (screen.orientation?.lock) {
    for (const mode of ['landscape-primary', 'landscape']) {
      try {
        await screen.orientation.lock(mode);
        locked = true;
        break;
      } catch {
        // Try the broader landscape mode before falling back to manual rotate.
      }
    }
  }

  // Give Android/Chromium a short moment to deliver its orientationchange.
  await new Promise(resolve => setTimeout(resolve, 260));

  if (keralaIsLandscape()) {
    updateLandscapePrompt();
    return true;
  }

  if (locked) {
    // A few WebViews report a successful lock just before resize arrives.
    await new Promise(resolve => setTimeout(resolve, 420));
    if (keralaIsLandscape()) {
      updateLandscapePrompt();
      return true;
    }
  }

  updateLandscapePrompt('Auto-rotate is off or this app build cannot change orientation. Turn on Auto-rotate, then rotate your phone sideways.');
  if (rotateLandscape) rotateLandscape.textContent = 'TRY LANDSCAPE AGAIN';
  return false;
}

window.requestKeralaLandscape = requestKeralaLandscape;
rotateLandscape?.addEventListener('click', requestKeralaLandscape);

const syncLandscapePrompt = () => {
  if (keralaIsLandscape()) {
    if (rotateCopy) rotateCopy.textContent = 'Kerala Play is ready in landscape mode.';
  } else if (rotateCopy && !rotateLandscape?.disabled) {
    rotateCopy.textContent = 'Kerala Play is designed for a wider game view. Rotate your phone sideways for the best controls.';
  }
  updateLandscapePrompt();
};
addEventListener('orientationchange', () => setTimeout(syncLandscapePrompt, 120));
addEventListener('resize', syncLandscapePrompt);

// Display a useful recovery screen even if a module fails before game.js runs.
import('./game.js').catch(error => {
  console.error('Kerala Play startup failed:', error);
  const fallback = document.querySelector('#fallback');
  fallback.style.display = 'grid';
  fallback.textContent = location.protocol === 'file:'
    ? 'Start Kerala Play with npm start in its project folder, then open http://localhost:3000. Accounts and multiplayer need the included server.'
    : 'Kerala Play could not load. Reload this page. If it continues, restart the server with npm start and check its terminal output.';
});
