import { glowSprite, stamp } from '../../render/sprites';

const LIFETIME = { bullet: 1.4, plasma: 2.2 };

// Kinetic minigun rounds ('bullet') and Goa'uld staff plasma bolts ('plasma').
class Bullet {

    constructor(x, y, vx, vy, damage, kind, splash) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage || 1;
        this.kind = kind || 'bullet';
        this.splash = splash || 0;
        this.mass = this.kind === 'plasma' ? 30 : 1.2;
        this.life = LIFETIME[this.kind];
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        if(this.kind === 'plasma') {
            // Big staff-weapon bolt: a white-hot head inside an orange plasma envelope,
            // stretched along its flight path and flickering.
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const dx = this.vx / speed;
            const dy = this.vy / speed;
            const flicker = 0.85 + Math.random() * 0.3;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;
            [[16, 'rgba(255, 90, 20, 0.22)', 30], [10, 'rgba(255, 140, 40, 0.55)', 22], [5, 'rgba(255, 210, 120, 0.9)', 14],
                [2.4, 'rgba(255, 255, 235, 1)', 8]].forEach(layer => {
                ctx.lineWidth = layer[0] * flicker;
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(this.x - dx * layer[2], this.y - dy * layer[2]);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            });
            const head = 28 * flicker;
            stamp(ctx, glowSprite('255,140,40'), this.x, this.y, head, head);
            ctx.restore();
            return;
        }
        // Short tracer streak behind the bullet, along its actual velocity
        // (so you can see it bend in an asteroid's gravity well).
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 0.012, this.y - this.vy * 0.012);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

export default Bullet;
