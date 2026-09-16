import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));

const errors = [];

if (pkg.version !== '1.0.0') errors.push(`Expected package version 1.0.0, found ${pkg.version}.`);
if (config.appId !== 'com.dreamliker007.keralaplay') errors.push(`Unexpected appId: ${config.appId}`);
if (config.appName !== 'Kerala Play') errors.push(`Unexpected appName: ${config.appName}`);
if (!config.server?.url?.startsWith('https://')) errors.push('Android release server.url must use HTTPS.');
if (config.server?.url !== 'https://kerala-play-1.onrender.com') errors.push(`Unexpected production URL: ${config.server?.url || '(missing)'}`);
if (config.server?.cleartext !== false) errors.push('server.cleartext must be false for release.');
if (config.android?.allowMixedContent !== false) errors.push('android.allowMixedContent must be false for release.');

if (errors.length) {
  console.error('Kerala Play Android release check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Kerala Play Android release configuration looks ready.');
console.log(`App: ${config.appName} (${config.appId})`);
console.log(`Version: ${pkg.version}`);
console.log(`Production URL: ${config.server.url}`);
