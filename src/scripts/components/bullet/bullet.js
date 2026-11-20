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
        this.mass = this.kind === 'plasma' ? 30 : 4;
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
            // Elongated glowing bolt with a hot core.
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const dx = this.vx / speed;
            const dy = this.vy / speed;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;
            [[9, 'rgba(255, 120, 30, 0.25)', 16], [5, 'rgba(255, 170, 60, 0.7)', 12], [2.2, 'rgba(255, 245, 210, 0.95)', 8]].forEach(layer => {
                ctx.lineWidth = layer[0];
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(this.x - dx * layer[2], this.y - dy * layer[2]);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            });
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
