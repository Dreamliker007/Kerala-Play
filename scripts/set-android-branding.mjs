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
    android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#B8F19A" android:pathData="M55,12 C50,16 47,22 46,29 C45,36 41,42 41,49 C41,57 38,64 38,72 C38,80 35,87 36,94 C37,99 40,102 44,104 C47,106 49,104 50,101 C52,96 54,91 57,87 C61,82 66,77 68,70 C71,63 75,57 75,49 C75,42 78,35 76,29 C74,22 69,17 63,13 C60,11 58,10 55,12Z"/>
  <path android:fillColor="#F3C85A" android:pathData="M47,38 L70,54 L47,70 Z"/>
  <path android:fillColor="@android:color/transparent" android:strokeColor="#79D9ED"
      android:strokeWidth="3.4" android:strokeLineCap="round"
      android:pathData="M22,85 C42,76 65,76 88,84"/>
</vector>`;

const legacy = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#075F65" android:pathData="M0,0 H108 V108 H0 Z"/>
  <path android:fillColor="#B8F19A" android:pathData="M55,12 C50,16 47,22 46,29 C45,36 41,42 41,49 C41,57 38,64 38,72 C38,80 35,87 36,94 C37,99 40,102 44,104 C47,106 49,104 50,101 C52,96 54,91 57,87 C61,82 66,77 68,70 C71,63 75,57 75,49 C75,42 78,35 76,29 C74,22 69,17 63,13 C60,11 58,10 55,12Z"/>
  <path android:fillColor="#F3C85A" android:pathData="M47,38 L70,54 L47,70 Z"/>
  <path android:fillColor="@android:color/transparent" android:strokeColor="#79D9ED"
      android:strokeWidth="3.4" android:strokeLineCap="round"
      android:pathData="M22,85 C42,76 65,76 88,84"/>
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
    <color name="ic_launcher_background">#075F65</color>
</resources>
`;
} else if (/name=["']ic_launcher_background["']/.test(colors)) {
  colors = colors.replace(/<color\s+name=["']ic_launcher_background["']>[^<]*<\/color>/, '<color name="ic_launcher_background">#075F65</color>');
} else {
  colors = colors.replace('</resources>', '    <color name="ic_launcher_background">#075F65</color>\n</resources>');
}
await writeFile(colorsUrl, colors);

console.log('Kerala Play Android launcher branding applied.');
