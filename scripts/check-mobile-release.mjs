import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const release = JSON.parse(await readFile(new URL('../mobile-release.json', import.meta.url), 'utf8'));
const landscapePatcher = await readFile(new URL('./lock-android-landscape.mjs', import.meta.url), 'utf8');
const versionPatcher = await readFile(new URL('./set-android-version.mjs', import.meta.url), 'utf8');

const errors = [];

if (pkg.version !== release.versionName) errors.push(`package.json version ${pkg.version} must match mobile-release.json versionName ${release.versionName}.`);
if (!Number.isInteger(Number(release.versionCode)) || Number(release.versionCode) < 2) errors.push('Closed-testing versionCode must be an integer >= 2.');
if (release.track !== 'closed-testing') errors.push(`Expected closed-testing release track, found ${release.track || '(missing)'}.`);
if (config.appId !== 'com.dreamliker007.keralaplay') errors.push(`Unexpected appId: ${config.appId}`);
if (config.appName !== 'Kerala Play') errors.push(`Unexpected appName: ${config.appName}`);
if (!release.serverUrl?.startsWith('https://')) errors.push('mobile-release.json serverUrl must use HTTPS.');
if (config.server?.url !== release.serverUrl) errors.push(`Capacitor server.url must match mobile-release.json serverUrl (${release.serverUrl || '(missing)'}).`);
if (config.server?.cleartext !== false) errors.push('server.cleartext must be false for release.');
if (config.android?.allowMixedContent !== false) errors.push('android.allowMixedContent must be false for release.');
if (manifest.orientation !== 'landscape') errors.push(`Web app manifest orientation must be landscape, found ${manifest.orientation || '(missing)'}.`);
if (!landscapePatcher.includes('android:screenOrientation="sensorLandscape"')) errors.push('Android landscape patcher is missing the sensor-landscape orientation lock.');
if (!versionPatcher.includes('versionCode') || !versionPatcher.includes('versionName')) errors.push('Android version patcher is missing versionCode/versionName handling.');

if (errors.length) {
  console.error('Kerala Play Android release check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Kerala Play Android closed-testing release configuration looks ready.');
console.log(`App: ${config.appName} (${config.appId})`);
console.log(`Version: ${release.versionName} (versionCode ${release.versionCode})`);
console.log(`Track: ${release.track}`);
console.log(`Production URL: ${config.server.url}`);

