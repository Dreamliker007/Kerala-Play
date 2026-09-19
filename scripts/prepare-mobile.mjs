import { cp, mkdir, rm } from 'node:fs/promises';

const files = [
  'index.html',
  'manifest.webmanifest',
  'boot.js',
  'game.js',
  'environment.js',
  'social.js',
  'game.css',
  'social.css',
  'style.css',
  'script.js',
  'ludo.html',
  'supabase-config.js',
  'three.module.js',
  'THREE-LICENSE.txt',
  'README-LUDO.txt'
];

await rm('www', { recursive: true, force: true });
await mkdir('www', { recursive: true });

for (const file of files) {
  await cp(file, `www/${file}`, { recursive: true });
}
await cp('vendor', 'www/vendor', { recursive: true });

console.log('Kerala Play mobile web assets prepared in www/.');
