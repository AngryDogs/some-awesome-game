import MATERIALS, { dominantMaterial } from '../../world/materials';

// Asteroids are described by their area (mass) and composition. Weapon hits chip
// area away (dropping ore), build up stress until a chunk breaks off, and the last
// bits crumble. Colliding asteroids merge into one.

const CHIP_AREA_PER_DAMAGE = 22;  // area removed per point of weapon damage
const ORE_AREA = 140;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 16;      // only asteroids at least this big break apart
const SPLIT_GRACE = 1.2;          // seconds a fresh fragment won't merge
const MAX_SCARS = 10;
const SHAPE_POINTS = 30;
export const MAX_MERGE_RADIUS = 170;
export const VISUAL_RADIUS = 0.88;   // average outline radius relative to `radius`

// Light comes from the top-left of the screen for every asteroid.
const LIGHT_X = -0.55;
const LIGHT_Y = -0.65;

const BASE_ROCK = [118, 110, 102];

let nextId = 1;

// Lumpy outline from a few layered sine "octaves" (smooth, rock-like, not spiky).
const randomShape = (random) => {
    const rnd = random || Math.random;
    const octaves = [[2, 0.09], [3, 0.07], [5, 0.04], [9, 0.025]].map(o => ({ freq: o[0], amp: o[1], phase: rnd() * Math.PI * 2 }));
    const points = [];
    for(let i = 0; i < SHAPE_POINTS; i++) {
        const angle = (i / SHAPE_POINTS) * Math.PI * 2;
        let factor = 0.86;
        octaves.forEach(o => { factor += Math.sin(angle * o.freq + o.phase) * o.amp; });
        factor += (rnd() - 0.5) * 0.03;
        points.push({ angle: angle, factor: Math.min(1, Math.max(0.62, factor)) });
    }
    return points;
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
        this.angle = rnd() * Math.PI * 2;
        this.spin = (rnd() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.stress = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.renderScale = 1;
        this.merging = null;          // active merge link while two asteroids fuse
        this.renderAlpha = 1;
        this.scars = [];
        this.shape = options.shape || randomShape(rnd);
        this.createSurface(rnd);
        this.updateLook(rnd);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    // Craters and cracks, in unit coordinates (scaled by radius when drawn).
    createSurface(rnd) {
        this.craters = [];
        const craterCount = 3 + Math.floor(rnd() * 5);
        for(let i = 0; i < craterCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.62;
            this.craters.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                r: 0.07 + rnd() * rnd() * 0.22,
                squash: 0.7 + rnd() * 0.3,
                tilt: rnd() * Math.PI
            });
        }
        this.cracks = [];
        const crackCount = 1 + Math.floor(rnd() * 3);
        for(let i = 0; i < crackCount; i++) {
            const points = [];
            let angle = rnd() * Math.PI * 2;
            let x = Math.cos(angle) * 0.2 * rnd();
            let y = Math.sin(angle) * 0.2 * rnd();
            const heading = rnd() * Math.PI * 2;
            points.push([x, y]);
            for(let s = 0; s < 4; s++) {
                angle = heading + (rnd() - 0.5) * 1.2;
                x += Math.cos(angle) * 0.14;
                y += Math.sin(angle) * 0.14;
                points.push([x, y]);
            }
            this.cracks.push(points);
        }
    }

    // Base colour and glinting mineral crystals from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = dominantMaterial(this.composition);

        let base = BASE_ROCK.slice();
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const tint = parseColor(MATERIALS[id].color);
            const share = this.composition[id] * 0.22;
            base = base.map((v, i) => v * (1 - share) + tint[i] * 0.6 * share);
        });
        this.baseColor = base;

        this.crystals = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const clusters = Math.round(1 + this.composition[id] * 5);
            for(let c = 0; c < clusters; c++) {
                const angle = rnd() * Math.PI * 2;
                const distance = Math.sqrt(rnd()) * 0.7;
                const cx = Math.cos(angle) * distance;
                const cy = Math.sin(angle) * distance;
                const shards = 2 + Math.floor(rnd() * 3);
                for(let s = 0; s < shards; s++) {
                    this.crystals.push({
                        x: cx + (rnd() - 0.5) * 0.12,
                        y: cy + (rnd() - 0.5) * 0.12,
                        size: 0.035 + rnd() * 0.05,
                        angle: rnd() * Math.PI,
                        color: parseColor(MATERIALS[id].color),
                        phase: rnd() * Math.PI * 2
                    });
                }
            }
        });
    }

    // Weapon hit at a world point. Returns { ore: [...materialIds], fragment, crumbled }.
    chip(damage, hitX, hitY) {
        const result = { ore: [], fragment: null, crumbled: false };
        if(this.dead) return result;

        const removed = Math.min(this.area, damage * CHIP_AREA_PER_DAMAGE);
        this.setArea(this.area - removed);
        this.oreProgress += removed;
        this.stress += damage;
        this.flash = 0.05;

        // Dent the outline and leave a fresh, pale scar where the hit landed.
        const hitAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        this.dent(hitAngle, 1 - 0.06 * Math.min(1, damage), 0.55);
        this.addScar(hitAngle, damage);

        while(this.oreProgress >= ORE_AREA) {
            this.oreProgress -= ORE_AREA;
            result.ore.push(this.pickMaterial());
        }

        if(this.radius < MIN_RADIUS) {
            this.dead = true;
            result.crumbled = true;
            result.ore.push(this.pickMaterial());
            return result;
        }

        // Enough accumulated stress cracks a chunk off the side that was hit.
        if(this.stress >= 4 + this.radius * 0.35 && this.radius >= MIN_SPLIT_RADIUS) {
            this.stress = 0;
            result.fragment = this.breakOff(Math.atan2(hitY - this.y, hitX - this.x));
        }
        return result;
    }

    addScar(localAngle, damage) {
        const last = this.scars[this.scars.length - 1];
        if(last && Math.abs(last.angle - localAngle) < 0.25) {
            last.size = Math.min(0.3, last.size + 0.01 * damage);
            last.fresh = 1;
            return;
        }
        this.scars.push({ angle: localAngle, size: 0.08 + 0.02 * damage, fresh: 1 });
        if(this.scars.length > MAX_SCARS) this.scars.shift();
    }

    pickMaterial() {
        let roll = Math.random();
        const keys = Object.keys(this.composition);
        for(let i = 0; i < keys.length; i++) {
            roll -= this.composition[keys[i]];
            if(roll <= 0) return keys[i];
        }
        return keys[keys.length - 1];
    }

    dent(localAngle, factor, minimum) {
        const step = Math.PI * 2 / this.shape.length;
        this.shape.forEach(point => {
            let diff = Math.abs(point.angle - localAngle) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff > step * 1.5) return;
            // Neighbouring points dent less, so the crater is rounded.
            const weight = 1 - diff / (step * 1.5);
            point.factor = Math.max(minimum, point.factor * (1 - (1 - factor) * weight));
        });
    }

    // Splits off a chunk on the side facing `worldAngle`, conserving momentum.
    breakOff(worldAngle) {
        const share = 0.25 + Math.random() * 0.15;
        const fragmentArea = this.area * share;
        const dirX = Math.cos(worldAngle);
        const dirY = Math.sin(worldAngle);
        const perpendicular = (Math.random() - 0.5) * 60;
        const kick = 90 + Math.random() * 60;

        const fragment = new Rock({
            x: this.x + dirX * this.radius * 0.6,
            y: this.y + dirY * this.radius * 0.6,
            vx: this.vx + dirX * kick - dirY * perpendicular,
            vy: this.vy + dirY * kick + dirX * perpendicular,
            radius: Math.sqrt(fragmentArea),
            composition: Object.assign({}, this.composition),
            grace: SPLIT_GRACE
        });

        this.setArea(this.area - fragmentArea);
        const ratio = fragmentArea / this.area;
        this.vx -= (dirX * kick - dirY * perpendicular) * ratio;
        this.vy -= (dirY * kick + dirX * perpendicular) * ratio;
        this.x -= dirX * this.radius * 0.15;
        this.y -= dirY * this.radius * 0.15;
        this.grace = SPLIT_GRACE;

        // Flatten the broken face.
        const localAngle = worldAngle - this.angle;
        for(let i = -2; i <= 2; i++) this.dent(localAngle + i * 0.3, 0.8, 0.55);
        this.addScar(localAngle, 6);

        return fragment;
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

        // Bulge where the guest joined, with a flattened seam either side.
        const contact = contactWorldAngle - this.angle;
        const bulge = Math.min(0.35, Math.sqrt(wb) * 0.45);
        this.shape.forEach(p => {
            let diff = Math.abs(p.angle - contact) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < 0.9) {
                const w = Math.cos(diff / 0.9 * Math.PI / 2);
                p.factor = Math.min(1.08, p.factor + bulge * w * w);
            } else if(diff < 1.4) {
                p.factor = Math.max(0.6, p.factor - bulge * 0.25);
            }
        });

        // Carry over some of the guest's surface features near the seam.
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
        if(this.craters.length > 14) this.craters.splice(0, this.craters.length - 14);
        if(this.cracks.length > 6) this.cracks.shift();
        this.updateLook();
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        this.scars.forEach(scar => { if(scar.fresh > 0) scar.fresh -= dt * 0.25; });
    }

    // Very faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.9, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 170, 220, 0.05)');
        gradient.addColorStop(1, 'rgba(140, 170, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    outline(ctx, r) {
        ctx.beginPath();
        this.shape.forEach((p, i) => {
            const x = Math.cos(p.angle) * r * p.factor;
            const y = Math.sin(p.angle) * r * p.factor;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
    }

    draw(ctx, time) {
        const r = this.radius * this.renderScale;
        if(r < 0.5) return;
        const base = this.baseColor;

        // Light direction in the asteroid's rotating frame.
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);
        const lx = LIGHT_X * cos - LIGHT_Y * sin;
        const ly = LIGHT_X * sin + LIGHT_Y * cos;

        ctx.save();
        ctx.globalAlpha = this.renderAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Soft dark rim so the rock separates from the background.
        this.outline(ctx, r);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.fillStyle = rgb(shade(base, 0.35));
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body shading: lit on the light side, falling off into shadow.
        const body = ctx.createRadialGradient(lx * r * 0.45, ly * r * 0.45, r * 0.05, 0, 0, r * 1.05);
        body.addColorStop(0, rgb(shade(base, this.flash > 0 ? 2 : 1.45)));
        body.addColorStop(0.45, rgb(shade(base, 0.95)));
        body.addColorStop(1, rgb(shade(base, 0.28)));
        ctx.fillStyle = body;
        ctx.fill();

        ctx.save();
        this.outline(ctx, r);
        ctx.clip();

        // Craters: dark bowl with a lit far rim and a shadowed near rim.
        this.craters.forEach(c => {
            const cx = c.x * r;
            const cy = c.y * r;
            const cr = c.r * r;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(c.tilt);
            ctx.scale(1, c.squash);
            ctx.fillStyle = rgb(shade(base, 0.55), 0.55);
            ctx.beginPath();
            ctx.arc(0, 0, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.lineWidth = Math.max(0.8, cr * 0.18);
            ctx.strokeStyle = rgb(shade(base, 1.6), 0.45);
            ctx.beginPath();
            const rimAngle = Math.atan2(-ly, -lx);
            ctx.ellipse(cx, cy, cr, cr * c.squash, c.tilt, rimAngle - 1.1 - c.tilt, rimAngle + 1.1 - c.tilt);
            ctx.stroke();
            ctx.strokeStyle = rgb(shade(base, 0.25), 0.55);
            ctx.beginPath();
            ctx.ellipse(cx, cy, cr, cr * c.squash, c.tilt, rimAngle + Math.PI - 1.1 - c.tilt, rimAngle + Math.PI + 1.1 - c.tilt);
            ctx.stroke();
        });

        // Cracks.
        ctx.strokeStyle = rgb(shade(base, 0.3), 0.7);
        ctx.lineWidth = Math.max(0.7, r * 0.025);
        ctx.lineJoin = 'round';
        this.cracks.forEach(points => {
            ctx.beginPath();
            points.forEach((p, i) => {
                if(i === 0) ctx.moveTo(p[0] * r, p[1] * r);
                else ctx.lineTo(p[0] * r, p[1] * r);
            });
            ctx.stroke();
        });

        // Fresh impact scars: pale, freshly exposed rock that weathers over time.
        this.scars.forEach(scar => {
            const sx = Math.cos(scar.angle) * r * 0.72;
            const sy = Math.sin(scar.angle) * r * 0.72;
            const sr = scar.size * r;
            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
            g.addColorStop(0, rgb(shade(base, 1.9), 0.25 + 0.5 * Math.max(0, scar.fresh)));
            g.addColorStop(1, rgb(shade(base, 1.2), 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        });

        // Mineral crystals catch the light and glint as the asteroid turns.
        const t = time || 0;
        this.crystals.forEach(c => {
            const x = c.x * r;
            const y = c.y * r;
            const s = Math.max(1, c.size * r);
            const glint = 0.55 + 0.45 * Math.max(0, Math.sin(t * 2 + c.phase + this.angle * 3));
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(c.angle);
            ctx.fillStyle = rgb(shade(c.color, 0.55));
            ctx.beginPath();
            ctx.moveTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s, 0); ctx.lineTo(0, -s * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = rgb(c.color, glint);
            ctx.beginPath();
            ctx.moveTo(s * 0.8, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Terminator: darken the side facing away from the light.
        const terminator = ctx.createLinearGradient(lx * r, ly * r, -lx * r, -ly * r);
        terminator.addColorStop(0, 'rgba(0, 0, 0, 0)');
        terminator.addColorStop(0.55, 'rgba(0, 0, 0, 0.05)');
        terminator.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = terminator;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();

        // Rim light on the lit edge.
        this.outline(ctx, r);
        ctx.lineWidth = Math.max(1, r * 0.03);
        const rim = ctx.createLinearGradient(lx * r, ly * r, -lx * r * 0.2, -ly * r * 0.2);
        rim.addColorStop(0, rgb(shade(base, 2), 0.6));
        rim.addColorStop(1, rgb(shade(base, 2), 0));
        ctx.strokeStyle = rim;
        ctx.stroke();

        ctx.restore();
    }
}

export default Rock;
