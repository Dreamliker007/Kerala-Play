import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const resUrl = new URL('../android/app/src/main/res/', import.meta.url);
let entries;
try {
  entries = await readdir(resUrl, { withFileTypes: true });
} catch {
  console.error('Android project not found. Run npm run mobile:add first.');
  process.exit(1);
}

const drawableDir = new URL('./drawable/', resUrl);
const anydpiDir = new URL('./mipmap-anydpi/', resUrl);
const anydpiV26Dir = new URL('./mipmap-anydpi-v26/', resUrl);
const valuesDir = new URL('./values/', resUrl);
await Promise.all([
  mkdir(drawableDir, { recursive: true }),
  mkdir(anydpiDir, { recursive: true }),
  mkdir(anydpiV26Dir, { recursive: true }),
  mkdir(valuesDir, { recursive: true })
]);

// Remove Capacitor's generated bitmap launcher icons so Android consistently
// picks the Kerala Play vector/adaptive icon across densities.
for (const entry of entries) {
  if (!entry.isDirectory() || !entry.name.startsWith('mipmap-') || entry.name.startsWith('mipmap-anydpi')) continue;
  const dir = new URL(`./${entry.name}/`, resUrl);
  let files = [];
  try { files = await readdir(dir); } catch { continue; }
  for (const file of files) {
    if (/^ic_launcher(?:_round|_foreground)?\.(?:png|webp|xml)$/i.test(file)) {
      await rm(new URL(file, dir), { force: true });
    }
  }
}

const foreground = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="512" android:viewportHeight="512">
  <path android:fillColor="#E5B94C" android:pathData="M128,82 H200 V221 L322,82 H413 L279,232 L424,430 H328 L224,286 L200,313 V430 H128 Z"/>
  <path android:fillColor="#4EAD43" android:strokeColor="#D9B34D" android:strokeWidth="5"
      android:pathData="M183,315 C257,224 318,211 385,231 C326,239 279,270 237,331 C291,306 339,306 382,324 C305,326 253,357 211,416 C191,389 182,356 183,315 Z"/>
</vector>`;

const legacy = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="512" android:viewportHeight="512">
  <path android:fillColor="#061B20" android:pathData="M0,0 H512 V512 H0 Z"/>
  <path android:fillColor="#E5B94C" android:pathData="M128,82 H200 V221 L322,82 H413 L279,232 L424,430 H328 L224,286 L200,313 V430 H128 Z"/>
  <path android:fillColor="#4EAD43" android:strokeColor="#D9B34D" android:strokeWidth="5"
      android:pathData="M183,315 C257,224 318,211 385,231 C326,239 279,270 237,331 C291,306 339,306 382,324 C305,326 253,357 211,416 C191,389 182,356 183,315 Z"/>
</vector>`;

const adaptive = `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@drawable/kerala_play_launcher_foreground"/>
</adaptive-icon>
`;

await writeFile(new URL('kerala_play_launcher_foreground.xml', drawableDir), foreground);
await writeFile(new URL('ic_launcher.xml', anydpiDir), legacy);
await writeFile(new URL('ic_launcher_round.xml', anydpiDir), legacy);
await writeFile(new URL('ic_launcher.xml', anydpiV26Dir), adaptive);
await writeFile(new URL('ic_launcher_round.xml', anydpiV26Dir), adaptive);

const colorsUrl = new URL('colors.xml', valuesDir);
let colors = '';
try { colors = await readFile(colorsUrl, 'utf8'); } catch { /* Create below. */ }
if (!colors) {
  colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#061B20</color>
</resources>
`;
} else if (/name=["']ic_launcher_background["']/.test(colors)) {
  colors = colors.replace(/<color\s+name=["']ic_launcher_background["']>[^<]*<\/color>/, '<color name="ic_launcher_background">#061B20</color>');
} else {
  colors = colors.replace('</resources>', '    <color name="ic_launcher_background">#061B20</color>\n</resources>');
}
await writeFile(colorsUrl, colors);

console.log('Kerala Play Android launcher branding applied.');
