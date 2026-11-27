// Exports the game's shared data (hulls, modules, materials, star systems, gate addresses,
// enemy fits) from the web game's source into native/assets/data/game_data.json, so the
// native Rust game uses exactly the same ships and balance.
//
//   node tools/export-game-data.mjs

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'game-data-'));
const copy = (rel, name) => {
    let src = fs.readFileSync(path.join(root, rel), 'utf8');
    src = src.replace(/from '\.\/(\w+)'/g, "from './$1.mjs'");
    fs.writeFileSync(path.join(tmp, name), src);
    return pathToFileURL(path.join(tmp, name)).href;
};
const hulls = await import(copy('src/scripts/shipyard/hulls.js', 'hulls.mjs'));
const modules = await import(copy('src/scripts/shipyard/modules.js', 'modules.mjs'));
copy('src/scripts/world/materials.js', 'materials.mjs');
const materials = await import(pathToFileURL(path.join(tmp, 'materials.mjs')).href);
const systems = await import(copy('src/scripts/world/systems.js', 'systems.mjs'));

const MODULES = modules.default;
const out = {
    hulls: hulls.HULL_ORDER.map(id => {
        const h = hulls.default[id];
        const s = hulls.shieldFor(h);
        return {
            id: h.id, name: h.name, class_name: h.className, faction: h.faction, description: h.description,
            cost: h.cost, color: h.color, exhaust: h.exhaust || '255,150,60', shield_color: h.shieldColor || '120,210,255',
            mass: h.mass, hull: h.hull, base_shield: h.baseShield, cargo: h.cargo, thrust: h.thrust, torque: h.torque,
            max_turn: h.maxTurn, module_scale: h.moduleScale, radius: h.radius, hyperdrive: h.hyperdrive || 0,
            art: h.art.map(p => p.rect ? { kind: 'rect', v: p.rect } : p.circle ? { kind: 'circle', v: p.circle }
                : { kind: p.closed ? 'poly' : 'line', pts: p.pts }),
            slots: h.slots.map(s => ({ id: s.id, x: s.x, y: s.y })),
            engines: h.engines,
            colliders: h.colliders,
            shield: { x: s.x, y: s.y, rx: s.rx, ry: s.ry }
        };
    }),
    modules: modules.MODULE_ORDER.map(id => {
        const m = MODULES[id];
        return { id: m.id, name: m.name, short: m.short, description: m.description, cost: m.cost, color: m.color,
            min_hull_mass: m.minHullMass || 0, stats: m.stats };
    }),
    max_level: modules.MAX_LEVEL,
    materials: materials.MATERIAL_ORDER.map(id => materials.default[id]).map(m => ({
        id: m.id, name: m.name, color: m.color, price: m.price, min_sector: m.minSector, weight: m.weight, growth: m.growth })),
    constellations: systems.CONSTELLATIONS,
    systems: systems.SYSTEMS.map(s => ({
        id: s.id, name: s.name, galaxy: s.galaxy, origin: s.origin, description: s.description, map: s.map,
        station: !!s.station, gate: s.gate, planet: s.planet, tint: s.tint, materials: s.materials,
        address: systems.addressOf(s.id)
    })),
    enemies: {
        faction_fit: {
            "Goa'uld": ['staff', 'staff', 'missile', 'shield', 'staff', 'engine', 'armor', 'staff', 'shield'],
            "Tau'ri": ['minigun', 'missile', 'shield', 'guidance', 'minigun', 'missile', 'engine', 'armor', 'shield', 'minigun'],
            Asgard: ['beam', 'shield', 'beam', 'missile', 'engine', 'shield', 'beam', 'armor', 'shield'],
            Ancient: ['drones', 'shield', 'minigun', 'drones', 'engine', 'shield', 'beam', 'armor', 'drones']
        },
        fighter_fit: { glider: ['staff', 'staff', 'engine'], x302: ['minigun', 'missile', 'missile'], jumper: ['drones', 'shield', 'engine', 'minigun'] },
        systems: {
            lantea: { max: 2, hulls: { glider: 4, jumper: 2, alkesh: 1 } },
            earth: { max: 2, hulls: { glider: 3, alkesh: 2, x303: 1, jumper: 1 } },
            abydos: { max: 3, hulls: { glider: 5, alkesh: 2, hatak: 1 } },
            chulak: { max: 3, hulls: { glider: 5, alkesh: 3, hatak: 1 } },
            dakara: { max: 3, hulls: { glider: 4, alkesh: 3, hatak: 1, x302: 1 } },
            langara: { max: 2, hulls: { x302: 3, x303: 2, alkesh: 1 } },
            othala: { max: 3, hulls: { alkesh: 2, x304: 1, hatak: 1, aurora: 1, asgard: 1 } }
        }
    }
};
const file = path.join(root, 'native/assets/data/game_data.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('Wrote ' + path.relative(root, file) + ' (' + Math.round(fs.statSync(file).size / 1024) + ' KB): '
    + out.hulls.length + ' hulls, ' + out.modules.length + ' modules, ' + out.systems.length + ' systems');
