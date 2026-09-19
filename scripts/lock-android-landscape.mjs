import { readFile, writeFile } from 'node:fs/promises';

const manifestPath = new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url);
let xml;
try {
  xml = await readFile(manifestPath, 'utf8');
} catch {
  console.error('Android project not found. Run npm run mobile:add first.');
  process.exit(1);
}

const activityPattern = /<activity\b([^>]*android:name=["']\.MainActivity["'][^>]*)>/;
const match = xml.match(activityPattern);
if (!match) {
  console.error('MainActivity was not found in AndroidManifest.xml.');
  process.exit(1);
}

let attributes = match[1];
if (/android:screenOrientation=/.test(attributes)) {
  attributes = attributes.replace(/android:screenOrientation=["'][^"']*["']/, 'android:screenOrientation="landscape"');
} else {
  attributes += '\n            android:screenOrientation="landscape"';
}

const next = xml.replace(activityPattern, `<activity${attributes}>`);
await writeFile(manifestPath, next);
console.log('Kerala Play Android MainActivity locked to sensor landscape.');
