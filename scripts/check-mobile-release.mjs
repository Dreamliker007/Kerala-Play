import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const release = JSON.parse(await readFile(new URL('../mobile-release.json', import.meta.url), 'utf8'));
const landscapePatcher = await readFile(new URL('./lock-android-landscape.mjs', import.meta.url), 'utf8');
const versionPatcher = await readFile(new URL('./set-android-version.mjs', import.meta.url), 'utf8');

const errors = [];
const requireGeneratedAndroid = process.env.REQUIRE_GENERATED_ANDROID === '1';
const nodeEngine = String(pkg.engines?.node || '');
const nodeMajor = Number(nodeEngine.match(/\d+/)?.[0] || 0);

if (pkg.version !== release.versionName) errors.push('package.json version ' + pkg.version + ' must match mobile-release.json versionName ' + release.versionName + '.');
if (nodeMajor < 22) errors.push('Capacitor 8 mobile tooling requires Node 22+, found package engine ' + (nodeEngine || '(missing)') + '.');
if (!Number.isInteger(Number(release.versionCode)) || Number(release.versionCode) < 2) errors.push('Closed-testing versionCode must be an integer >= 2.');
if (release.track !== 'closed-testing') errors.push('Expected closed-testing release track, found ' + (release.track || '(missing)') + '.');
if (config.appId !== 'com.dreamliker007.keralaplay') errors.push('Unexpected appId: ' + config.appId);
if (config.appName !== 'Kerala Play') errors.push('Unexpected appName: ' + config.appName);
if (!release.serverUrl?.startsWith('https://')) errors.push('mobile-release.json serverUrl must use HTTPS.');
if (config.server?.url !== release.serverUrl) errors.push('Capacitor server.url must match mobile-release.json serverUrl (' + (release.serverUrl || '(missing)') + ').');
if (config.server?.cleartext !== false) errors.push('server.cleartext must be false for release.');
if (config.android?.allowMixedContent !== false) errors.push('android.allowMixedContent must be false for release.');
if (manifest.orientation !== 'landscape') errors.push('Web app manifest orientation must be landscape, found ' + (manifest.orientation || '(missing)') + '.');
if (!landscapePatcher.includes('android:screenOrientation="sensorLandscape"')) errors.push('Android landscape patcher is missing the sensor-landscape orientation lock.');
if (!versionPatcher.includes('versionCode') || !versionPatcher.includes('versionName')) errors.push('Android version patcher is missing versionCode/versionName handling.');

async function readGenerated(relative, label) {
  try {
    return await readFile(new URL('../' + relative, import.meta.url), 'utf8');
  } catch {
    errors.push('Generated Android check could not read ' + label + ' (' + relative + ').');
    return '';
  }
}

if (requireGeneratedAndroid) {
  const androidManifest = await readGenerated('android/app/src/main/AndroidManifest.xml', 'AndroidManifest.xml');
  const variablesGradle = await readGenerated('android/variables.gradle', 'variables.gradle');

  let appGradle = '';
  try {
    appGradle = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
  } catch {
    try {
      appGradle = await readFile(new URL('../android/app/build.gradle.kts', import.meta.url), 'utf8');
    } catch {
      errors.push('Generated Android check could not read app build.gradle or build.gradle.kts.');
    }
  }

  const launcherForeground = await readGenerated('android/app/src/main/res/drawable/kerala_play_launcher_foreground.xml', 'Kerala Play launcher foreground');
  const launcherAdaptive = await readGenerated('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', 'adaptive launcher icon');

  const mainActivity = androidManifest.match(/<activity\b[^>]*android:name=["']\.MainActivity["'][^>]*>/)?.[0] || '';
  if (!mainActivity.includes('android:screenOrientation="sensorLandscape"')) {
    errors.push('Generated Android MainActivity is not locked to sensorLandscape.');
  }
  const configChanges = mainActivity.match(/android:configChanges=["']([^"']+)["']/)?.[1] || '';
  if (!configChanges.split('|').includes('density')) {
    errors.push('Generated Capacitor 8 MainActivity configChanges is missing density.');
  }

  for (const [key, expected] of [['minSdkVersion', 24], ['compileSdkVersion', 36], ['targetSdkVersion', 36]]) {
    const match = variablesGradle.match(new RegExp('\\b' + key + '\\s*=\\s*(\\d+)'));
    if (Number(match?.[1]) !== expected) errors.push('Generated Android ' + key + ' must be ' + expected + ', found ' + (match?.[1] || '(missing)') + '.');
  }

  const versionCodePattern = new RegExp('\\bversionCode\\s*(?:=\\s*)?' + Number(release.versionCode) + '\\b');
  const versionNameMatches = appGradle.includes('versionName "' + release.versionName + '"') || appGradle.includes('versionName = "' + release.versionName + '"');
  if (!versionCodePattern.test(appGradle)) errors.push('Generated Android versionCode does not match ' + release.versionCode + '.');
  if (!versionNameMatches) errors.push('Generated Android versionName does not match ' + release.versionName + '.');
  if (!launcherForeground.includes('#B8F19A') || !launcherAdaptive.includes('kerala_play_launcher_foreground')) {
    errors.push('Generated Android Kerala Play launcher branding is incomplete.');
  }
}

if (errors.length) {
  console.error('Kerala Play Android release check failed:');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log(requireGeneratedAndroid
  ? 'Kerala Play generated Android closed-testing project looks ready.'
  : 'Kerala Play Android closed-testing release configuration looks ready.');
console.log('App: ' + config.appName + ' (' + config.appId + ')');
console.log('Version: ' + release.versionName + ' (versionCode ' + release.versionCode + ')');
console.log('Track: ' + release.track);
console.log('Production URL: ' + config.server.url);
