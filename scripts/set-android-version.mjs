import { readFile, writeFile } from 'node:fs/promises';

const releasePath = new URL('../mobile-release.json', import.meta.url);
const release = JSON.parse(await readFile(releasePath, 'utf8'));

const versionCode = Number(release.versionCode);
const versionName = String(release.versionName || '').trim();

if (!Number.isInteger(versionCode) || versionCode < 1) {
  console.error('mobile-release.json versionCode must be a positive integer.');
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(versionName)) {
  console.error('mobile-release.json versionName must look like 1.0.1.');
  process.exit(1);
}

const candidates = [
  new URL('../android/app/build.gradle', import.meta.url),
  new URL('../android/app/build.gradle.kts', import.meta.url),
];

let gradleUrl = null;
let gradle = '';
for (const candidate of candidates) {
  try {
    gradle = await readFile(candidate, 'utf8');
    gradleUrl = candidate;
    break;
  } catch {
    // Try the other Gradle format.
  }
}

if (!gradleUrl) {
  console.error('Android app Gradle file not found. Run npm run mobile:add first.');
  process.exit(1);
}

let next = gradle;
let codeChanged = false;
let nameChanged = false;

next = next.replace(/\bversionCode\s*(?:=\s*)?\d+/g, match => {
  codeChanged = true;
  const usesEquals = match.includes('=');
  return usesEquals ? `versionCode = ${versionCode}` : `versionCode ${versionCode}`;
});

next = next.replace(/\bversionName\s*(?:=\s*)?["'][^"']*["']/g, match => {
  nameChanged = true;
  const usesEquals = match.includes('=');
  return usesEquals ? `versionName = "${versionName}"` : `versionName "${versionName}"`;
});

if (!codeChanged || !nameChanged) {
  console.error('Could not find versionCode/versionName in the generated Android app Gradle file.');
  process.exit(1);
}

await writeFile(gradleUrl, next);
console.log(`Kerala Play Android version set to ${versionName} (versionCode ${versionCode}).`);
