import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const gamePath = resolve(process.cwd(), 'game.js');
const source = await readFile(gamePath, 'utf8');
const legacyPause = 'const paused = !profile || !connectionReady || publicRideInProgress || !!document.querySelector(\'[aria-modal="true"]:not([hidden])\');';
const resilientPause = 'const paused = !profile || publicRideInProgress || !!document.querySelector(\'[aria-modal="true"]:not([hidden])\');';

if (source.includes(resilientPause)) {
  console.log('[Kerala Play] offline-tolerant movement patch already applied.');
  process.exit(0);
}

if (!source.includes(legacyPause)) {
  throw new Error('Kerala Play movement pause guard changed; review scripts/patch-runtime.mjs before building.');
}

const updated = source.replace(legacyPause, resilientPause);
await writeFile(gamePath, updated, 'utf8');
console.log('[Kerala Play] movement stays local while world sync reconnects.');
