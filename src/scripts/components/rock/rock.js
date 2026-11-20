import MATERIALS, { dominantMaterial } from '../../world/materials';

// Asteroids are described by their area (mass) and composition. Weapon hits chip
// area away (dropping ore), build up stress until a chunk breaks off, and the last
// bits crumble. Colliding asteroids merge into one.

const CHIP_AREA_PER_DAMAGE = 22;  // area removed per point of weapon damage
const ORE_AREA = 140;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 16;      // only asteroids at least this big break apart
const SPLIT_GRACE = 1.2;          // seconds a fresh fragment won't merge
export const MAX_MERGE_RADIUS = 110;

let nextId = 1;

const randomShape = (random) => {
    const rnd = random || Math.random;
    const count = 12;
    const points = [];
    for(let i = 0; i < count; i++) {
        points.push({ angle: (i / count) * Math.PI * 2, factor: 0.78 + rnd() * 0.22 });
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

class Rock {

    constructor(options) {
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.setArea(options.radius * options.radius);
        this.composition = normalizeComposition(options.composition || { rock: 1 });
        this.angle = (options.random || Math.random)() * Math.PI * 2;
        this.spin = ((options.random || Math.random)() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.stress = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.shape = options.shape || randomShape(options.random);
        this.updateLook(options.random);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    // Colour veins and stroke tint from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = dominantMaterial(this.composition);
        this.veins = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const count = Math.round(2 + this.composition[id] * 10);
            for(let i = 0; i < count; i++) {
                const angle = rnd() * Math.PI * 2;
                const distance = Math.sqrt(rnd()) * 0.65;
                this.veins.push({
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    length: 0.08 + rnd() * 0.18,
                    angle: rnd() * Math.PI,
                    color: MATERIALS[id].color
                });
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

        // Dent the outline where the hit landed.
        const hitAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        this.dent(hitAngle, 0.94, 0.6);

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
        let nearest = 0;
        let nearestDiff = Infinity;
        this.shape.forEach((point, i) => {
            let diff = Math.abs(point.angle - localAngle) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < nearestDiff) {
                nearestDiff = diff;
                nearest = i;
            }
        });
        const p = this.shape[nearest];
        p.factor = Math.max(minimum, p.factor * factor);
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
        for(let i = -2; i <= 2; i++) this.dent(localAngle + i * 0.4, 0.75, 0.55);

        return fragment;
    }

    // Absorb another asteroid: area, momentum, spin and composition combine.
    merge(other) {
        const total = this.area + other.area;
        const wa = this.area / total;
        const wb = other.area / total;

        this.x = this.x * wa + other.x * wb;
        this.y = this.y * wa + other.y * wb;
        this.vx = this.vx * wa + other.vx * wb;
        this.vy = this.vy * wa + other.vy * wb;
        this.spin = this.spin * wa + other.spin * wb;

        const composition = {};
        [[this, wa], [other, wb]].forEach(pair => {
            Object.keys(pair[0].composition).forEach(id => {
                composition[id] = (composition[id] || 0) + pair[0].composition[id] * pair[1];
            });
        });
        this.composition = normalizeComposition(composition);
        this.setArea(total);
        this.oreProgress += other.oreProgress;
        this.flash = 0.1;

        // Soften dents a little: the impact rounds things out.
        this.shape.forEach(p => { p.factor = Math.min(1, p.factor + 0.08); });
        this.updateLook();
        other.dead = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
    }

    // Faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 180, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(140, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        const { shape, radius } = this;
        const tint = MATERIALS[this.material].color;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        shape.forEach((p, i) => {
            const x = Math.cos(p.angle) * radius * p.factor;
            const y = Math.sin(p.angle) * radius * p.factor;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();

        ctx.fillStyle = this.flash > 0 ? 'rgba(200, 200, 210, 0.95)' : 'rgba(62, 62, 72, 0.95)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(' + tint + ', 0.9)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(' + tint + ', 0.8)';
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, radius * 0.06);
        ctx.lineCap = 'round';
        this.veins.forEach(vein => {
            const cx = vein.x * radius;
            const cy = vein.y * radius;
            const hx = Math.cos(vein.angle) * vein.length * radius;
            const hy = Math.sin(vein.angle) * vein.length * radius;
            ctx.strokeStyle = 'rgba(' + vein.color + ', 0.9)';
            ctx.shadowColor = 'rgba(' + vein.color + ', 0.9)';
            ctx.beginPath();
            ctx.moveTo(cx - hx, cy - hy);
            ctx.lineTo(cx + hx, cy + hy);
            ctx.stroke();
        });

        ctx.restore();
    }
}

export default Rock;
