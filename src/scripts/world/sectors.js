// Endless asteroid fields. Space is divided into square sectors that are generated
// deterministically from a seed the first time the ship comes near. Sectors that
// fall out of range are put to sleep (their asteroids stored) and woken on return,
// so the map is endless while only nearby asteroids are simulated.

import Rock from '../components/rock/rock';
import { rollMaterial } from './materials';

export const SECTOR_SIZE = 1400;
const ACTIVE_RADIUS = 2;          // sectors around the ship that are simulated
const SAFE_RADIUS = 700;          // no asteroids spawn this close to the station

// Small deterministic PRNG (mulberry32).
const createRandom = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const hashSector = (seed, sx, sy) => {
    let h = seed ^ Math.imul(sx, 374761393) ^ Math.imul(sy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
};

export const sectorOf = (x, y) => ({
    sx: Math.floor(x / SECTOR_SIZE),
    sy: Math.floor(y / SECTOR_SIZE)
});

// Distance from base measured in sectors (Chebyshev-ish, rounded).
export const sectorDistance = (sx, sy) => {
    const cx = sx + 0.5;
    const cy = sy + 0.5;
    return Math.floor(Math.sqrt(cx * cx + cy * cy));
};

const generateSector = (seed, sx, sy) => {
    const random = createRandom(hashSector(seed, sx, sy));
    const distance = sectorDistance(sx, sy);
    const rocks = [];

    // Some sectors are dense fields, most are sparse, a few are empty.
    const roll = random();
    let count;
    if(roll < 0.12) count = 0;
    else if(roll < 0.8) count = 2 + Math.floor(random() * 4);
    else count = 7 + Math.floor(random() * 6 + distance * 0.5);

    // Fields cluster around a centre.
    const fieldX = (sx + 0.2 + random() * 0.6) * SECTOR_SIZE;
    const fieldY = (sy + 0.2 + random() * 0.6) * SECTOR_SIZE;

    for(let i = 0; i < count; i++) {
        const spread = SECTOR_SIZE * (count > 6 ? 0.3 : 0.5);
        const x = fieldX + (random() - 0.5) * 2 * spread;
        const y = fieldY + (random() - 0.5) * 2 * spread;
        if(Math.sqrt(x * x + y * y) < SAFE_RADIUS) continue;

        const giant = random() < 0.04 + distance * 0.004;
        const radius = giant ? 60 + random() * 35 : 14 + random() * 38;
        const main = rollMaterial(random, distance);
        const purity = main === 'rock' ? 1 : 0.45 + random() * 0.45;
        const composition = { rock: 1 - purity };
        composition[main] = (composition[main] || 0) + purity;

        // Sometimes a trace of a second metal.
        const trace = rollMaterial(random, distance);
        if(trace !== main && trace !== 'rock') {
            const share = 0.05 + random() * 0.15;
            composition[trace] = (composition[trace] || 0) + share;
            composition.rock = Math.max(0, composition.rock - share);
        }

        const angle = random() * Math.PI * 2;
        const speed = random() * 22;
        rocks.push(new Rock({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            composition: composition,
            random: random
        }));
    }
    return rocks;
};

export class SectorManager {

    constructor(seed) {
        this.seed = seed;
        this.dormant = {};    // key -> sleeping rocks
        this.active = {};     // key -> true
        this.seen = {};       // key -> true once generated
    }

    // Returns the new active rock list for the ship's position.
    update(shipX, shipY, rocks) {
        const center = sectorOf(shipX, shipY);
        const wanted = {};
        for(let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++) {
            for(let dy = -ACTIVE_RADIUS; dy <= ACTIVE_RADIUS; dy++) {
                wanted[(center.sx + dx) + ',' + (center.sy + dy)] = [center.sx + dx, center.sy + dy];
            }
        }

        // Put asteroids that drifted out of range to sleep in whatever sector they're in now.
        const keep = [];
        rocks.forEach(rock => {
            if(rock.dead) return;
            const s = sectorOf(rock.x, rock.y);
            const key = s.sx + ',' + s.sy;
            if(wanted[key]) {
                keep.push(rock);
            } else {
                if(!this.dormant[key]) this.dormant[key] = [];
                this.dormant[key].push(rock);
            }
        });

        Object.keys(this.active).forEach(key => {
            if(!wanted[key]) delete this.active[key];
        });

        Object.keys(wanted).forEach(key => {
            if(this.active[key]) return;
            this.active[key] = true;
            if(this.dormant[key]) {
                this.dormant[key].forEach(rock => keep.push(rock));
                delete this.dormant[key];
            } else if(!this.seen[key]) {
                this.seen[key] = true;
                generateSector(this.seed, wanted[key][0], wanted[key][1]).forEach(rock => keep.push(rock));
            }
        });

        return keep;
    }
}
