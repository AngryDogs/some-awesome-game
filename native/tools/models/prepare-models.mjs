// Prepares downloaded Sketchfab models for the game: rotates each into the game's ship
// frame (+X bow, +Y up, +Z starboard), centres it, scales it to 1 unit along X, simplifies
// heavy meshes and shrinks textures. Output: assets/models/<name>.glb
//
//   cd tools/models && npm install && node prepare-models.mjs <folder with downloads>
//
// The download folder holds <name>.glb files as listed in models.json (see README there).

import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune, textureCompress, compactPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const models = JSON.parse(fs.readFileSync(path.join(here, 'models.json'), 'utf8'));
const source = process.argv[2];
const outDir = path.join(here, '..', '..', 'assets', 'models');
fs.mkdirSync(outDir, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;

const AXES = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Rotation taking the model's forward to +X and its up to +Y, as a quaternion.
function basisQuat(forward, up) {
  const f = AXES[forward], u = AXES[up], s = cross(f, u);
  // Rows of the rotation matrix are f, u, s (so R*f = X, R*u = Y, R*s = Z).
  const m = [f, u, s];
  const [m00, m01, m02] = m[0], [m10, m11, m12] = m[1], [m20, m21, m22] = m[2];
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) {
    const k = Math.sqrt(tr + 1) * 2; w = 0.25 * k; x = (m21 - m12) / k; y = (m02 - m20) / k; z = (m10 - m01) / k;
  } else if (m00 > m11 && m00 > m22) {
    const k = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / k; x = 0.25 * k; y = (m01 + m10) / k; z = (m02 + m20) / k;
  } else if (m11 > m22) {
    const k = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / k; x = (m01 + m10) / k; y = 0.25 * k; z = (m12 + m21) / k;
  } else {
    const k = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / k; x = (m02 + m20) / k; y = (m12 + m21) / k; z = 0.25 * k;
  }
  return [x, y, z, w];
}

function sloppySimplify(ratio) {
  return (doc) => {
    for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const positions = Float32Array.from(pos.getArray());
      const old = prim.getIndices();
      const indices = old ? Uint32Array.from(old.getArray()) : Uint32Array.from({ length: pos.getCount() }, (_, i) => i);
      const target = Math.max(3, Math.floor((indices.length * ratio) / 3) * 3);
      const [reduced] = MeshoptSimplifier.simplifySloppy(indices, positions, 3, null, target, 0.01);
      const accessor = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(reduced)).setBuffer(pos.getBuffer());
      prim.setIndices(accessor);
      compactPrimitive(prim);
    }
  };
}

// Smallest distance of any vertex from the model's Z axis in the XY plane: for the gate,
// the radius of the opening the event horizon fills.
function innerRadius(doc) {
  let best = Infinity;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const v = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
        const y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
        best = Math.min(best, Math.hypot(x, y));
      }
    }
  }
  return best;
}

function triangles(doc) {
  let n = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const idx = p.getIndices();
    n += (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3;
  }
  return Math.round(n);
}

const manifest = {};
for (const [name, cfg] of Object.entries(models)) {
  const file = path.join(source, `${name}.glb`);
  if (!fs.existsSync(file)) { console.log(`skip ${name}: ${file} missing`); continue; }
  const doc = await io.read(file);
  const root = doc.getRoot();
  const scene = root.getDefaultScene() || root.listScenes()[0];
  // The game doesn't play the models' animations, so drop them and their morph targets
  // (a morph-target mesh needs per-instance weights that copies of it wouldn't have).
  for (const a of root.listAnimations()) a.dispose();
  for (const mesh of root.listMeshes()) {
    mesh.setWeights([]);
    for (const prim of mesh.listPrimitives()) for (const t of prim.listTargets()) { prim.removeTarget(t); t.dispose(); }
  }

  // Wrap everything in one node carrying the orientation, centring and scale.
  const wrapper = doc.createNode(`${name}_frame`);
  for (const child of scene.listChildren()) { scene.removeChild(child); wrapper.addChild(child); }
  scene.addChild(wrapper);
  wrapper.setRotation(basisQuat(cfg.forward, cfg.up || '+y'));
  const b = getBounds(scene);
  const size = b.max.map((v, i) => v - b.min[i]);
  const center = b.max.map((v, i) => (v + b.min[i]) / 2);
  const s = 1 / size[0];
  wrapper.setScale([s, s, s]);
  wrapper.setTranslation(center.map(c => -c * s));

  const before = triangles(doc);
  const ops = [dedup(), weld()];
  if (cfg.triangles && before > cfg.triangles && cfg.sloppy) {
    // Meshes where every triangle has its own vertices (flat-shaded "triangle soup") can't
    // be simplified edge by edge; cluster vertices by position instead.
    ops.push(sloppySimplify(cfg.triangles / before));
  } else if (cfg.triangles && before > cfg.triangles) {
    ops.push(simplify({ simplifier: MeshoptSimplifier, ratio: cfg.triangles / before, error: cfg.error || 0.002 }));
  }
  // Textures: at most `texture` pixels square, stored as JPEG unless a material needs alpha.
  const texSize = cfg.texture || 512;
  const alpha = root.listMaterials().some(m => m.getAlphaMode() !== 'OPAQUE');
  ops.push(textureCompress({ encoder: sharp, resize: [texSize, texSize], targetFormat: alpha ? undefined : 'jpeg', quality: 85 }), prune());
  await doc.transform(...ops);
  const after = getBounds(doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0]);
  const out = path.join(outDir, `${name}.glb`);
  await io.write(out, doc);
  const dims = after.max.map((v, i) => v - after.min[i]);
  manifest[name] = {
    size: dims.map(v => +v.toFixed(4)),
    inner_radius: +innerRadius(doc).toFixed(4),
    title: cfg.title, author: cfg.author, license: cfg.license,
    url: `https://sketchfab.com/3d-models/${cfg.uid}`,
  };
  console.log(`${name.padEnd(9)} ${before} -> ${triangles(doc)} triangles, ${dims.map(v => v.toFixed(3)).join(' x ')}, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
}

// Sizes, the gate's opening and the credits, read by the game (src/models.rs).
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const credits = ['3D models from Sketchfab (https://sketchfab.com), used under their Creative Commons licenses.',
  'They were rotated, rescaled, simplified and had their textures resized for the game.', '',
  ...Object.entries(manifest).map(([n, m]) => `${n}: "${m.title}" by ${m.author}, ${m.license}\n    ${m.url}`)];
fs.writeFileSync(path.join(outDir, 'CREDITS.txt'), credits.join('\n') + '\n');
