import { world, wrapPosition } from '../../physics/physics';

const MIN_SPLIT_RADIUS = 14;      // smaller rocks crumble to dust instead of splitting
const FRAGMENT_GRACE = 0.8;       // seconds a new fragment ignores rock-rock collisions
const HEALTH_PER_RADIUS = 0.7;    // bullets needed ~ proportional to size

let nextId = 1;

class Rock {

    constructor(options) {
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.radius = options.radius;
        this.mass = this.radius * this.radius;
        this.health = Math.max(1, Math.round(this.radius * HEALTH_PER_RADIUS));
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 2.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.dead = false;
        this.shape = Rock.createShape(this.radius);
    }

    // Irregular polygon so broken pieces actually look like rubble.
    static createShape(radius) {
        const points = [];
        const count = Math.max(7, Math.round(radius / 3.5));
        for(let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = radius * (0.75 + Math.random() * 0.3);
            points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
        }
        return points;
    }

    // A fresh big asteroid drifting in from just outside the screen.
    static spawnAtEdge(level) {
        const radius = 22 + Math.random() * 28;
        const side = Math.floor(Math.random() * 4);
        const offset = world.margin / 2;
        let x;
        let y;

        if(side === 0) { x = -offset; y = Math.random() * world.height; }
        if(side === 1) { x = Math.random() * world.width; y = -offset; }
        if(side === 2) { x = world.width + offset; y = Math.random() * world.height; }
        if(side === 3) { x = Math.random() * world.width; y = world.height + offset; }

        // Aim roughly at the middle of the screen.
        const toCenter = Math.atan2(world.height / 2 - y, world.width / 2 - x);
        const angle = toCenter + (Math.random() - 0.5) * (Math.PI / 2);
        const speed = 35 + Math.random() * 45 + level * 4;

        return new Rock({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius
        });
    }

    // Break into smaller pieces. Total area never grows and the kicks are
    // symmetric, so momentum is (roughly) conserved.
    split() {
        if(this.radius < MIN_SPLIT_RADIUS) return [];

        const count = this.radius > 34 ? 3 : 2;
        const fragments = [];
        const baseAngle = Math.random() * Math.PI * 2;

        for(let i = 0; i < count; i++) {
            const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const radius = this.radius * (count === 3 ? 0.5 : 0.62) * (0.9 + Math.random() * 0.2);
            const kick = 40 + Math.random() * 50;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            fragments.push(new Rock({
                x: this.x + dirX * this.radius * 0.5,
                y: this.y + dirY * this.radius * 0.5,
                vx: this.vx + dirX * kick,
                vy: this.vy + dirY * kick,
                radius: radius,
                grace: FRAGMENT_GRACE
            }));
        }

        return fragments;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        wrapPosition(this);
    }

    // Faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 180, 255, 0.10)');
        gradient.addColorStop(1, 'rgba(140, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        const { shape } = this;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(shape[0][0], shape[0][1]);
        for(let i = 1; i < shape.length; i++) ctx.lineTo(shape[i][0], shape[i][1]);
        ctx.closePath();

        ctx.fillStyle = this.flash > 0 ? '#fff' : 'rgba(225, 225, 235, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(120, 120, 140, 0.9)';
        ctx.stroke();

        ctx.restore();
    }
}

export default Rock;
