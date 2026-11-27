// Downloads the Sketchfab models listed in models.json (GLB format) into a folder, named
// <name>.glb, ready for prepare-models.mjs. Needs your own Sketchfab API token (Sketchfab:
// Settings > Password & API):
//
//   SKETCHFAB_TOKEN=... node download-models.mjs ./downloads
//   node prepare-models.mjs ./downloads

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const models = JSON.parse(fs.readFileSync(path.join(here, 'models.json'), 'utf8'));
const token = process.env.SKETCHFAB_TOKEN;
const out = process.argv[2] || path.join(here, 'downloads');
if (!token) {
  console.error('Set SKETCHFAB_TOKEN to your Sketchfab API token.');
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });

for (const [name, cfg] of Object.entries(models)) {
  const info = await fetch(`https://api.sketchfab.com/v3/models/${cfg.uid}/download`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!info.ok) throw new Error(`${name}: download link request failed (${info.status})`);
  const { glb } = await info.json();
  if (!glb) throw new Error(`${name}: no GLB download offered`);
  const file = await fetch(glb.url);
  if (!file.ok) throw new Error(`${name}: download failed (${file.status})`);
  fs.writeFileSync(path.join(out, `${name}.glb`), Buffer.from(await file.arrayBuffer()));
  console.log(`${name}: ${(glb.size / 1e6).toFixed(1)} MB`);
}
