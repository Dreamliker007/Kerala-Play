import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const gamePath = resolve(process.cwd(), 'game.js');
const source = await readFile(gamePath, 'utf8');
const modalGuard = '!!document.querySelector(\'[aria-modal="true"]:not([hidden])\')';
const variants = [
  {
    legacy: 'const paused = !profile || !connectionReady || publicRideInProgress || sleepingAtHome || ' + modalGuard + ';',
    resilient: 'const paused = !profile || publicRideInProgress || sleepingAtHome || ' + modalGuard + ';',
  },
  {
    legacy: 'const paused = !profile || !connectionReady || publicRideInProgress || ' + modalGuard + ';',
    resilient: 'const paused = !profile || publicRideInProgress || ' + modalGuard + ';',
  },
];

if (variants.some(({ resilient }) => source.includes(resilient))) {
  console.log('[Kerala Play] offline-tolerant movement patch already applied.');
  process.exit(0);
}

const variant = variants.find(({ legacy }) => source.includes(legacy));
if (!variant) {
  throw new Error('Kerala Play movement pause guard changed; review scripts/patch-runtime.mjs before building.');
}

const updated = source.replace(variant.legacy, variant.resilient);
await writeFile(gamePath, updated, 'utf8');
console.log('[Kerala Play] movement stays local while world sync reconnects.');
