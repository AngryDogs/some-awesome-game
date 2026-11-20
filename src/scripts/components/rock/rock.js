import MATERIALS, { dominantMaterial } from '../../world/materials';
import { G } from '../../physics/physics';
import { createSprite, spriteResolution } from '../../render/sprites';

// Asteroids have two layers:
//  - a soft, dusty outer layer (regolith): easy to carve, kicks up dust, mostly plain rock
//  - a hard inner core: slow to cut, throws sparks, and holds most of the metal
//
// Both layers are outlines of SHAPE_POINTS radii at evenly spaced angles (`shape` for the
// surface, `core` for the core boundary). Weapon hits carve a groove into the surface;
// once the groove cuts through, the asteroid splits in two along that cut line.

const CHIP_AREA_PER_DAMAGE = 14;  // area removed per point of weapon damage (core rate)
const SOFT_AREA_FACTOR = 1.8;     // the dusty outside comes away faster...
const HARD_AREA_FACTOR = 0.5;     // ...the core much slower
const GROOVE_PER_DAMAGE = 1.6;    // px of groove per damage point (scaled by hardness and size)
const SOFT_GROOVE_FACTOR = 1.7;
const HARD_GROOVE_FACTOR = 0.35;
const ORE_AREA = 120;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 14;      // smaller asteroids are ground down instead of splitting
const CUT_THROUGH = 0.18;         // groove depth (outline factor) that counts as cut through
const SPLIT_GRACE = 2.5;          // seconds new halves won't merge again
const MAX_SPLIT_SPEED = 55;       // px/s, halves drift apart gently
const MAX_SCARS = 12;
const SHAPE_POINTS = 32;
const SPRITE_REBUILD_INTERVAL = 0.12;
const LIGHT_REFRESH_ANGLE = 0.26;  // re-bake lighting after the rock turns ~15 degrees
export const MAX_MERGE_RADIUS = 170;
export const VISUAL_RADIUS = 0.88;   // average outline radius relative to `radius`

// Light comes from the top-left of the screen for every asteroid.
const LIGHT_X = -0.55;
const LIGHT_Y = -0.65;
const BASE_ROCK = [128, 118, 106];
const STEP = Math.PI * 2 / SHAPE_POINTS;

let nextId = 1;

// Lumpy outline from a few layered sine "octaves" (smooth, rock-like, not spiky).
const lumpyShape = (rnd, base, spread, min, max) => {
    const octaves = [[2, 0.09], [3, 0.07], [5, 0.04], [9, 0.025]].map(o => ({ freq: o[0], amp: o[1] * spread, phase: rnd() * Math.PI * 2 }));
    const factors = [];
    for(let i = 0; i < SHAPE_POINTS; i++) {
        const angle = i * STEP;
        let factor = base;
        octaves.forEach(o => { factor += Math.sin(angle * o.freq + o.phase) * o.amp; });
        factor += (rnd() - 0.5) * 0.03;
        factors.push(Math.min(max, Math.max(min, factor)));
    }
    return factors;
};

const normalizeComposition = (composition) => {
    const total = Object.keys(composition).reduce((sum, id) => sum + composition[id], 0) || 1;
    const result = {};
    Object.keys(composition).forEach(id => {
        if(composition[id] / total > 0.001) result[id] = composition[id] / total;
    });
    return result;
};

const parseColor = (color) => color.split(',').map(Number);
const rgb = (c, alpha) => 'rgba(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ',' + (alpha === undefined ? 1 : alpha) + ')';
const shade = (c, f) => c.map(v => v * f);
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
const wrapAngle = (a) => {
    a %= Math.PI * 2;
    return a < 0 ? a + Math.PI * 2 : a;
};

// Signed area and centroid of a polygon.
const polygonInfo = (pts) => {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const cross = a[0] * b[1] - b[0] * a[1];
        area += cross;
        cx += (a[0] + b[0]) * cross;
        cy += (a[1] + b[1]) * cross;
    }
    area /= 2;
    if(Math.abs(area) < 1e-6) return { area: 0, x: 0, y: 0 };
    return { area: Math.abs(area), x: cx / (6 * area), y: cy / (6 * area) };
};

// Keep the part of a polygon on one side of the line through the origin along (ux, uy).
const clipHalf = (pts, ux, uy, sign) => {
    const side = (p) => sign * (ux * p[1] - uy * p[0]);
    const out = [];
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const sa = side(a);
        const sb = side(b);
        if(sa >= 0) out.push(a);
        if((sa >= 0) !== (sb >= 0)) {
            const t = sa / (sa - sb);
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
    }
    return out;
};

// Distance from the origin to the polygon edge along a ray (furthest crossing).
const rayToPolygon = (pts, dx, dy) => {
    let best = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const ex = b[0] - a[0];
        const ey = b[1] - a[1];
        const denom = dx * ey - dy * ex;
        if(Math.abs(denom) < 1e-9) continue;
        const t = (a[0] * ey - a[1] * ex) / denom;
        const s = (a[0] * dy - a[1] * dx) / denom;
        if(t > 0 && s >= 0 && s <= 1 && t > best) best = t;
    }
    return best;
};

// Resample a polygon (already centred on its centroid) as SHAPE_POINTS radius factors.
const resample = (local, radius, min, max) => {
    const factors = [];
    for(let k = 0; k < SHAPE_POINTS; k++) {
        const d = rayToPolygon(local, Math.cos(k * STEP), Math.sin(k * STEP));
        factors.push(Math.max(min, Math.min(max, d / radius)));
    }
    return factors;
};

class Rock {

    constructor(options) {
        const rnd = options.random || Math.random;
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.setArea(options.radius * options.radius);
        this.composition = normalizeComposition(options.composition || { rock: 1 });
        this.angle = options.angle !== undefined ? options.angle : rnd() * Math.PI * 2;
        this.spin = options.spin !== undefined ? options.spin : (rnd() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.renderScale = 1;
        this.renderAlpha = 1;
        this.merging = null;          // active merge link while two asteroids fuse
        this.scars = [];
        this.shape = options.shape || lumpyShape(rnd, 0.86, 1, 0.62, 1);
        // The core sits well inside the surface, with its own lumpy outline.
        this.core = options.core || lumpyShape(rnd, 0.52, 0.8, 0.36, 0.66).map((f, i) => Math.min(f, this.shape[i] - 0.12));
        this.sprite = null;
        this.spriteDirty = true;
        this.spriteAge = 0;
        this.createSurface(rnd);
        this.updateLook(rnd);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    get maxFactor() {
        let max = 0;
        for(let i = 0; i < this.shape.length; i++) max = Math.max(max, this.shape[i]);
        return max;
    }

    // Radius used for quick "could these touch?" checks.
    get boundRadius() {
        return this.radius * this.maxFactor;
    }

    // Surface details in unit coordinates (scaled by radius when drawn).
    createSurface(rnd) {
        this.craters = [];
        const craterCount = 4 + Math.floor(rnd() * 6);
        for(let i = 0; i < craterCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.62;
            this.craters.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                r: 0.05 + rnd() * rnd() * 0.22,
                squash: 0.7 + rnd() * 0.3,
                tilt: rnd() * Math.PI
            });
        }
        // Fine dust grain: hundreds of light and dark specks.
        this.speckles = [];
        for(let i = 0; i < 260; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.98;
            this.speckles.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, s: 0.4 + rnd() * 1.2, light: rnd() < 0.5, a: 0.12 + rnd() * 0.25 });
        }
        // Boulders resting in the dust.
        this.boulders = [];
        const boulderCount = 3 + Math.floor(rnd() * 6);
        for(let i = 0; i < boulderCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = 0.2 + rnd() * 0.65;
            this.boulders.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, r: 0.02 + rnd() * 0.035 });
        }
        // Strata lines across the core.
        this.strata = [];
        const strataAngle = rnd() * Math.PI;
        for(let i = 0; i < 4; i++) {
            this.strata.push({ offset: -0.4 + i * 0.27 + (rnd() - 0.5) * 0.08, bend: (rnd() - 0.5) * 0.2, angle: strataAngle });
        }
        this.cracks = [];
        const crackCount = 1 + Math.floor(rnd() * 3);
        for(let i = 0; i < crackCount; i++) {
            const points = [];
            let x = (rnd() - 0.5) * 0.3;
            let y = (rnd() - 0.5) * 0.3;
            const heading = rnd() * Math.PI * 2;
            points.push([x, y]);
            for(let s = 0; s < 4; s++) {
                const angle = heading + (rnd() - 0.5) * 1.2;
                x += Math.cos(angle) * 0.13;
                y += Math.sin(angle) * 0.13;
                points.push([x, y]);
            }
            this.cracks.push(points);
        }
        // Loose dust drifting just off the surface.
        this.motes = [];
        for(let i = 0; i < 14; i++) {
            this.motes.push({ angle: rnd() * Math.PI * 2, out: 1.02 + rnd() * 0.1, s: 0.6 + rnd() * 1.2 });
        }
    }

    // Colours and metal crystals from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = dominantMaterial(this.composition);

        let tinted = BASE_ROCK.slice();
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const tint = parseColor(MATERIALS[id].color);
            const share = this.composition[id] * 0.25;
            tinted = tinted.map((v, i) => v * (1 - share) + tint[i] * 0.6 * share);
        });
        // Dusty regolith is paler and warmer; the core is darker and denser.
        this.dustColor = mix(tinted, [175, 160, 140], 0.25);
        this.coreColor = mix(shade(tinted, 0.6), [70, 75, 85], 0.3);
        this.baseColor = tinted;

        this.crystals = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const clusters = Math.round(2 + this.composition[id] * 7);
            for(let c = 0; c < clusters; c++) {
                // Metal concentrates in the core.
                const angle = rnd() * Math.PI * 2;
                const inCore = rnd() < 0.75;
                const distance = inCore ? Math.sqrt(rnd()) * 0.42 : 0.45 + rnd() * 0.4;
                const cx = Math.cos(angle) * distance;
                const cy = Math.sin(angle) * distance;
                const shards = 2 + Math.floor(rnd() * 4);
                for(let s = 0; s < shards; s++) {
                    this.crystals.push({
                        x: cx + (rnd() - 0.5) * 0.12,
                        y: cy + (rnd() - 0.5) * 0.12,
                        size: 0.03 + rnd() * 0.05,
                        angle: rnd() * Math.PI,
                        color: parseColor(MATERIALS[id].color)
                    });
                }
            }
        });
        this.spriteDirty = true;
    }

    // ------------------------------------------------------------ outline geometry

    factorAt(factors, localAngle) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.floor(a) % SHAPE_POINTS;
        const j = (i + 1) % SHAPE_POINTS;
        const t = a - Math.floor(a);
        return factors[i] * (1 - t) + factors[j] * t;
    }

    // Outline radius (world px) in the asteroid's local direction `localAngle`.
    outlineAt(localAngle) {
        return this.factorAt(this.shape, localAngle) * this.radius;
    }

    // Is the surface in this direction already cut down to the hard core?
    isCoreExposed(localAngle) {
        return this.factorAt(this.shape, localAngle) <= this.factorAt(this.core, localAngle) + 0.02;
    }

    containsPoint(x, y, padding) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distSq = dx * dx + dy * dy;
        const bound = this.boundRadius + (padding || 0);
        if(distSq > bound * bound) return false;
        const r = this.outlineAt(Math.atan2(dy, dx) - this.angle) + (padding || 0);
        return distSq <= r * r;
    }

    // Outline as world-space points.
    worldOutline() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return this.shape.map((f, i) => {
            const lx = Math.cos(i * STEP) * f * this.radius;
            const ly = Math.sin(i * STEP) * f * this.radius;
            return [this.x + lx * cos - ly * sin, this.y + lx * sin + ly * cos];
        });
    }

    // Distance along a ray to where it first meets the visible outline, or null.
    raycast(ox, oy, dirX, dirY, maxDistance) {
        const mx = this.x - ox;
        const my = this.y - oy;
        const along = mx * dirX + my * dirY;
        const bound = this.boundRadius;
        if(along < -bound || along - bound > maxDistance) return null;
        const closestSq = mx * mx + my * my - along * along;
        if(closestSq > bound * bound) return null;

        if(this.containsPoint(ox, oy)) return 0;
        const pts = this.worldOutline();
        let best = null;
        for(let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const ex = b[0] - a[0];
            const ey = b[1] - a[1];
            const denom = dirX * ey - dirY * ex;
            if(Math.abs(denom) < 1e-9) continue;
            const ax = a[0] - ox;
            const ay = a[1] - oy;
            const t = (ax * ey - ay * ex) / denom;
            const s = (ax * dirY - ay * dirX) / denom;
            if(t >= 0 && s >= 0 && s <= 1 && t <= maxDistance && (best === null || t < best)) best = t;
        }
        return best;
    }

    // Outward surface normal (world space) at the outline in direction `localAngle`.
    normalAt(localAngle) {
        const d = 0.05;
        const r1 = this.outlineAt(localAngle - d);
        const r2 = this.outlineAt(localAngle + d);
        const p1x = Math.cos(localAngle - d) * r1;
        const p1y = Math.sin(localAngle - d) * r1;
        const p2x = Math.cos(localAngle + d) * r2;
        const p2y = Math.sin(localAngle + d) * r2;
        let nx = p2y - p1y;
        let ny = -(p2x - p1x);
        const length = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= length;
        ny /= length;
        // Make sure it points outwards.
        if(nx * Math.cos(localAngle) + ny * Math.sin(localAngle) < 0) {
            nx = -nx;
            ny = -ny;
        }
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return { x: nx * cos - ny * sin, y: nx * sin + ny * cos };
    }

    // ------------------------------------------------------------ damage

    // Weapon hit at a world point. Returns
    // { ore: [...materialIds], pieces: [a, b] | null, crumbled, hard }.
    chip(damage, hitX, hitY) {
        const result = { ore: [], pieces: null, crumbled: false, hard: false };
        if(this.dead) return result;

        const localAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        const hard = this.isCoreExposed(localAngle);
        result.hard = hard;

        // The dusty outside comes off easily (mostly plain rock); the core resists but
        // is where the metal is.
        const removed = Math.min(this.area, damage * CHIP_AREA_PER_DAMAGE * (hard ? HARD_AREA_FACTOR : SOFT_AREA_FACTOR));
        this.setArea(this.area - removed);
        this.oreProgress += removed;
        this.flash = 0.05;

        const groove = damage * GROOVE_PER_DAMAGE / this.radius;
        this.carve(localAngle, groove * SOFT_GROOVE_FACTOR, groove * HARD_GROOVE_FACTOR);
        this.addScar(localAngle, damage, hard);

        while(this.oreProgress >= ORE_AREA) {
            this.oreProgress -= ORE_AREA;
            result.ore.push(this.pickMaterial(hard ? 1.8 : 0.35));
        }

        if(this.radius < MIN_RADIUS) {
            this.dead = true;
            result.crumbled = true;
            result.ore.push(this.pickMaterial(1.5));
            return result;
        }

        // Cut through? Split into two along the deepest groove.
        let deepest = 0;
        for(let i = 1; i < SHAPE_POINTS; i++) if(this.shape[i] < this.shape[deepest]) deepest = i;
        if(this.shape[deepest] <= CUT_THROUGH) {
            if(this.radius >= MIN_SPLIT_RADIUS) result.pieces = this.splitAlong(deepest * STEP);
            if(!result.pieces) {
                // Too small to split cleanly: it falls apart.
                this.dead = true;
                result.crumbled = true;
                const left = Math.max(1, Math.round(this.area / ORE_AREA));
                for(let i = 0; i < left; i++) result.ore.push(this.pickMaterial(1.5));
            }
        }
        return result;
    }

    // Narrow groove: the hit point goes deepest, immediate neighbours a little.
    // Soft regolith carves at `softDepth`; once the core is reached it slows to `hardDepth`.
    carve(localAngle, softDepth, hardDepth) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.round(a) % SHAPE_POINTS;
        const offset = a - Math.round(a);
        [[0, 1], [-1, 0.45 - offset * 0.3], [1, 0.45 + offset * 0.3], [-2, 0.12], [2, 0.12]].forEach(pair => {
            const k = (i + pair[0] + SHAPE_POINTS) % SHAPE_POINTS;
            const weight = Math.max(0, pair[1]);
            let soft = softDepth * weight;
            const regolith = Math.max(0, this.shape[k] - this.core[k]);
            const taken = Math.min(regolith, soft);
            soft -= taken;
            const hardCut = soft * (hardDepth / softDepth);
            this.shape[k] = Math.max(0.05, this.shape[k] - taken - hardCut);
            if(this.core[k] > this.shape[k]) this.core[k] = this.shape[k];
        });
        this.spriteDirty = true;
    }

    addScar(localAngle, damage, hard) {
        const last = this.scars[this.scars.length - 1];
        if(last && Math.abs(last.angle - localAngle) < 0.25 && last.hard === hard) {
            last.size = Math.min(0.3, last.size + 0.01 * damage);
            return;
        }
        this.scars.push({ angle: localAngle, size: 0.06 + 0.015 * damage, hard: hard });
        if(this.scars.length > MAX_SCARS) this.scars.shift();
    }

    // Random material weighted by composition; `metalBias` > 1 favours metals (core).
    pickMaterial(metalBias) {
        const bias = metalBias || 1;
        const keys = Object.keys(this.composition);
        const weights = keys.map(id => this.composition[id] * (id === 'rock' ? 1 : bias));
        const total = weights.reduce((a, b) => a + b, 0) || 1;
        let roll = Math.random() * total;
        for(let i = 0; i < keys.length; i++) {
            roll -= weights[i];
            if(roll <= 0) return keys[i];
        }
        return keys[keys.length - 1];
    }

    // Splits the surface (and core) into two halves along the line from the cut (at
    // `localAngle`) through the centre. Each half becomes its own asteroid with a correctly
    // clipped outline; they drift apart sideways (perpendicular to the cut).
    splitAlong(localAngle) {
        const toPoints = (factors) => factors.map((f, i) => [Math.cos(i * STEP) * f * this.radius, Math.sin(i * STEP) * f * this.radius]);
        const pts = toPoints(this.shape);
        const corePts = toPoints(this.core);
        const ux = Math.cos(localAngle);
        const uy = Math.sin(localAngle);
        const halves = [1, -1]
            .map(sign => {
                const poly = clipHalf(pts, ux, uy, sign);
                return { poly: poly, core: clipHalf(corePts, ux, uy, sign), info: polygonInfo(poly), sign: sign };
            })
            .filter(h => h.poly.length >= 3 && h.info.area > 4);
        if(halves.length < 2) return null;

        const total = halves[0].info.area + halves[1].info.area;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const centroidGap = Math.sqrt(Math.pow(halves[0].info.x - halves[1].info.x, 2) + Math.pow(halves[0].info.y - halves[1].info.y, 2)) || 1;
        // Just over escape velocity so mutual gravity doesn't immediately pull them back.
        const relative = Math.min(MAX_SPLIT_SPEED * 2, 1.15 * Math.sqrt(2 * G * this.area / centroidGap));

        const pieces = halves.map(h => {
            const share = h.info.area / total;
            const radius = Math.sqrt(this.area * share);

            // Resample the clipped half (and its share of the core) around its own centroid.
            const shape = resample(h.poly.map(p => [p[0] - h.info.x, p[1] - h.info.y]), radius, 0.05, 1.6);
            const coreLocal = h.core.length >= 3 ? h.core.map(p => [p[0] - h.info.x, p[1] - h.info.y]) : null;
            const core = (coreLocal ? resample(coreLocal, radius, 0, 1.6) : shape.map(() => 0))
                .map((f, i) => Math.min(f || shape[i] * 0.4, shape[i]));

            // Sideways separation: each half moves away from the cut line.
            const nx = -uy * h.sign;
            const ny = ux * h.sign;
            const speed = relative * (1 - share);
            const worldNx = nx * cos - ny * sin;
            const worldNy = nx * sin + ny * cos;

            const piece = new Rock({
                x: this.x + h.info.x * cos - h.info.y * sin,
                y: this.y + h.info.x * sin + h.info.y * cos,
                vx: this.vx + worldNx * speed,
                vy: this.vy + worldNy * speed,
                radius: radius,
                composition: Object.assign({}, this.composition),
                shape: shape,
                core: core,
                angle: this.angle,
                spin: this.spin * (0.8 + Math.random() * 0.4),
                grace: SPLIT_GRACE
            });
            piece.oreProgress = this.oreProgress * share;
            return piece;
        });

        this.dead = true;
        return pieces;
    }

    // Completes a merge after `guest` has fully sunk in: blend composition by the
    // original masses and reshape the outline so the result reads as one lumpy body.
    finishMerge(guest, hostArea, guestArea, contactWorldAngle) {
        const total = hostArea + guestArea;
        const wa = hostArea / total;
        const wb = guestArea / total;

        const composition = {};
        [[this, wa], [guest, wb]].forEach(pair => {
            Object.keys(pair[0].composition).forEach(id => {
                composition[id] = (composition[id] || 0) + pair[0].composition[id] * pair[1];
            });
        });
        this.composition = normalizeComposition(composition);
        this.oreProgress += guest.oreProgress;
        this.spin = this.spin * wa + guest.spin * wb;

        // Bulge where the guest joined, with a flattened seam either side; the core grows too.
        const contact = contactWorldAngle - this.angle;
        const bulge = Math.min(0.35, Math.sqrt(wb) * 0.45);
        this.shape = this.shape.map((f, i) => {
            let diff = Math.abs(i * STEP - wrapAngle(contact));
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < 0.9) {
                const w = Math.cos(diff / 0.9 * Math.PI / 2);
                return Math.min(1.08, Math.max(f, 0.6) + bulge * w * w);
            }
            if(diff < 1.4) return Math.max(0.6, f - bulge * 0.25);
            return f;
        });
        this.core = this.core.map((f, i) => Math.min(this.shape[i] - 0.1, Math.max(f, 0.45) + bulge * 0.3));

        guest.craters.slice(0, 3).forEach(c => {
            this.craters.push({
                x: Math.cos(contact) * 0.55 + c.x * Math.sqrt(wb) * 0.6,
                y: Math.sin(contact) * 0.55 + c.y * Math.sqrt(wb) * 0.6,
                r: c.r * Math.sqrt(wb), squash: c.squash, tilt: c.tilt
            });
        });
        this.cracks.push([[Math.cos(contact + 0.6) * 0.5, Math.sin(contact + 0.6) * 0.5],
            [Math.cos(contact) * 0.45, Math.sin(contact) * 0.45],
            [Math.cos(contact - 0.6) * 0.5, Math.sin(contact - 0.6) * 0.5]]);
        if(this.craters.length > 16) this.craters.splice(0, this.craters.length - 16);
        if(this.cracks.length > 6) this.cracks.shift();
        this.updateLook();
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        this.spriteAge += dt;
    }

    // ------------------------------------------------------------ rendering

    path(ctx, factors, r) {
        ctx.beginPath();
        for(let i = 0; i < SHAPE_POINTS; i++) {
            const x = Math.cos(i * STEP) * r * factors[i];
            const y = Math.sin(i * STEP) * r * factors[i];
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    outline(ctx, r) {
        this.path(ctx, this.shape, r);
    }

    // Everything is rendered once into a sprite (rebuilt only when damaged, reshaped or
    // after turning ~15 degrees so the baked lighting stays correct).
    buildSprite() {
        const r = this.radius;
        const extent = r * Math.max(1, this.maxFactor) * 1.16 + 3;
        const dust = this.dustColor;
        const core = this.coreColor;

        // Light direction in the rock's local frame.
        const cosA = Math.cos(-this.angle);
        const sinA = Math.sin(-this.angle);
        const lx = LIGHT_X * cosA - LIGHT_Y * sinA;
        const ly = LIGHT_X * sinA + LIGHT_Y * cosA;

        this.sprite = createSprite(extent * 2, extent * 2, ctx => {
            ctx.translate(extent, extent);

            // Loose dust hanging just off the surface.
            ctx.fillStyle = rgb(dust, 0.18);
            this.motes.forEach(m => {
                const d = this.outlineAt(m.angle) * m.out;
                ctx.beginPath();
                ctx.arc(Math.cos(m.angle) * d, Math.sin(m.angle) * d, m.s, 0, Math.PI * 2);
                ctx.fill();
            });
            this.path(ctx, this.shape.map(f => f * 1.035), r);
            ctx.fillStyle = rgb(dust, 0.12);
            ctx.fill();

            // Dusty regolith body.
            this.outline(ctx, r);
            ctx.fillStyle = rgb(dust);
            ctx.fill();
            ctx.save();
            ctx.clip();

            // Dense core showing through the thinner dust towards the centre.
            this.path(ctx, this.core, r);
            ctx.fillStyle = rgb(core, 0.75);
            ctx.fill();
            ctx.lineWidth = Math.max(1, r * 0.08);
            ctx.strokeStyle = rgb(mix(core, dust, 0.5), 0.55);
            ctx.stroke();
            ctx.save();
            this.path(ctx, this.core, r);
            ctx.clip();
            ctx.strokeStyle = rgb(shade(core, 0.7), 0.6);
            ctx.lineWidth = Math.max(0.6, r * 0.015);
            this.strata.forEach(s => {
                ctx.save();
                ctx.rotate(s.angle);
                ctx.beginPath();
                ctx.moveTo(-r, s.offset * r);
                ctx.quadraticCurveTo(0, (s.offset + s.bend) * r, r, s.offset * r);
                ctx.stroke();
                ctx.restore();
            });
            ctx.restore();

            // Dust grain.
            this.speckles.forEach(p => {
                ctx.fillStyle = p.light ? 'rgba(255, 245, 225, ' + p.a + ')' : 'rgba(30, 25, 20, ' + p.a + ')';
                ctx.fillRect(p.x * r, p.y * r, p.s, p.s);
            });

            // Craters: shadowed bowl on the lit side, bright rim opposite, ejecta ring.
            this.craters.forEach(c => {
                const cx = c.x * r;
                const cy = c.y * r;
                const cr = Math.max(1, c.r * r);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(c.tilt);
                ctx.scale(1, c.squash);
                ctx.fillStyle = rgb(shade(dust, 0.78), 0.8);
                ctx.beginPath();
                ctx.arc(0, 0, cr, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Shadow crescent towards the light, highlight away from it.
                ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
                ctx.beginPath();
                ctx.arc(cx + lx * cr * 0.25, cy + ly * cr * 0.25, cr * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = rgb(shade(dust, 1.35), 0.6);
                ctx.lineWidth = Math.max(0.7, cr * 0.18);
                const rimAngle = Math.atan2(-ly, -lx);
                ctx.beginPath();
                ctx.arc(cx, cy, cr, rimAngle - 1.2, rimAngle + 1.2);
                ctx.stroke();
                ctx.fillStyle = rgb(shade(dust, 1.25), 0.25);
                for(let i = 0; i < 6; i++) {
                    const a = i * 1.05 + c.tilt;
                    ctx.fillRect(cx + Math.cos(a) * cr * 1.5, cy + Math.sin(a) * cr * 1.5, 1.2, 1.2);
                }
            });

            // Boulders with a lit side and a cast shadow.
            this.boulders.forEach(b => {
                const bx = b.x * r;
                const by = b.y * r;
                const br = Math.max(0.8, b.r * r);
                ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
                ctx.beginPath();
                ctx.arc(bx - lx * br * 0.8, by - ly * br * 0.8, br, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = rgb(shade(dust, 1.15));
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();
            });

            // Cracks.
            ctx.strokeStyle = rgb(shade(core, 0.5), 0.7);
            ctx.lineWidth = Math.max(0.7, r * 0.022);
            ctx.lineJoin = 'round';
            this.cracks.forEach(points => {
                ctx.beginPath();
                points.forEach((p, i) => {
                    if(i === 0) ctx.moveTo(p[0] * r, p[1] * r);
                    else ctx.lineTo(p[0] * r, p[1] * r);
                });
                ctx.stroke();
            });

            // Metal crystals.
            this.crystals.forEach(c => {
                const s = Math.max(1, c.size * r);
                ctx.save();
                ctx.translate(c.x * r, c.y * r);
                ctx.rotate(c.angle);
                ctx.fillStyle = rgb(shade(c.color, 0.5));
                ctx.beginPath();
                ctx.moveTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s, 0); ctx.lineTo(0, -s * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = rgb(c.color, 0.95);
                ctx.beginPath();
                ctx.moveTo(s * 0.8, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // Freshly exposed material where it was hit: pale dust, or dark core.
            this.scars.forEach(scar => {
                const d = this.outlineAt(scar.angle) * 0.88;
                ctx.fillStyle = scar.hard ? rgb(shade(core, 1.3), 0.6) : rgb(shade(dust, 1.35), 0.45);
                ctx.beginPath();
                ctx.arc(Math.cos(scar.angle) * d, Math.sin(scar.angle) * d, scar.size * r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Lighting, baked for the current orientation (light is fixed on screen).
            const light = ctx.createLinearGradient(lx * r, ly * r, -lx * r, -ly * r);
            light.addColorStop(0, 'rgba(255, 245, 230, 0.26)');
            light.addColorStop(0.42, 'rgba(0, 0, 0, 0)');
            light.addColorStop(1, 'rgba(0, 0, 0, 0.66)');
            ctx.fillStyle = light;
            ctx.fillRect(-extent, -extent, extent * 2, extent * 2);
            ctx.restore();

            // Where grooves have cut down to the core, the rim shows dark, hard rock.
            ctx.lineWidth = Math.max(1.5, r * 0.05);
            ctx.strokeStyle = rgb(shade(core, 0.9));
            ctx.beginPath();
            for(let i = 0; i < SHAPE_POINTS; i++) {
                const j = (i + 1) % SHAPE_POINTS;
                if(this.shape[i] > this.core[i] + 0.02 || this.shape[j] > this.core[j] + 0.02) continue;
                ctx.moveTo(Math.cos(i * STEP) * r * this.shape[i], Math.sin(i * STEP) * r * this.shape[i]);
                ctx.lineTo(Math.cos(j * STEP) * r * this.shape[j], Math.sin(j * STEP) * r * this.shape[j]);
            }
            ctx.stroke();

            // Rim light on the lit edge, soft dark edge elsewhere.
            this.outline(ctx, r);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(10, 8, 6, 0.5)';
            ctx.stroke();
            const rim = ctx.createLinearGradient(lx * r, ly * r, 0, 0);
            rim.addColorStop(0, 'rgba(255, 240, 215, 0.55)');
            rim.addColorStop(1, 'rgba(255, 240, 215, 0)');
            ctx.strokeStyle = rim;
            ctx.lineWidth = Math.max(1, r * 0.03);
            ctx.stroke();
        }, Math.min(2, spriteResolution()));
        this.spriteAngle = this.angle;
        this.spriteExtent = extent;
        this.spriteRadius = r;
        this.spriteDirty = false;
        this.spriteAge = 0;
    }

    releaseSprite() {
        this.sprite = null;
    }

    draw(ctx) {
        const r = this.radius * this.renderScale;
        if(r < 0.5) return;
        let turned = Math.abs(this.angle - (this.spriteAngle || 0)) % (Math.PI * 2);
        if(turned > Math.PI) turned = Math.PI * 2 - turned;
        if(!this.sprite || (this.spriteDirty && this.spriteAge > SPRITE_REBUILD_INTERVAL) ||
            turned > LIGHT_REFRESH_ANGLE || Math.abs(this.radius - this.spriteRadius) > this.spriteRadius * 0.05) {
            this.buildSprite();
        }

        // One image stamp per frame: surface, lighting and outline are all in the sprite.
        const scale = r / this.spriteRadius;
        const extent = this.spriteExtent * scale;
        ctx.save();
        ctx.globalAlpha = this.renderAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        if(this.flash > 0) {
            // Hit flash: brighten by stamping the sprite again additively.
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3;
            ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        }
        ctx.restore();
    }
}

export default Rock;
