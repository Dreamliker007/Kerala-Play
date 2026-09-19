// Landscape-first mobile shell.
async function requestKeralaLandscape() {
  const root = document.documentElement;
  if (!document.fullscreenElement && root.requestFullscreen) {
    try { await root.requestFullscreen(); } catch { /* Fullscreen is optional; manual rotation still works. */ }
  }
  if (screen.orientation?.lock) {
    try { await screen.orientation.lock('landscape'); } catch { /* Some browsers only allow manual rotation. */ }
  }
}
window.requestKeralaLandscape = requestKeralaLandscape;

const rotateLandscape = document.querySelector('#rotate-landscape');
rotateLandscape?.addEventListener('click', requestKeralaLandscape);

// Display a useful recovery screen even if a module fails before game.js runs.
import('./game.js').catch(error => {
  console.error('Kerala Play startup failed:', error);
  const fallback = document.querySelector('#fallback');
  fallback.style.display = 'grid';
  fallback.textContent = location.protocol === 'file:'
    ? 'Start Kerala Play with npm start in its project folder, then open http://localhost:3000. Accounts and multiplayer need the included server.'
    : 'Kerala Play could not load. Reload this page. If it continues, restart the server with npm start and check its terminal output.';
});
