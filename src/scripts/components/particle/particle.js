import { wrapPosition } from '../../physics/physics';

class Particle {

    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.life = options.life;
        this.maxLife = options.life;
        this.size = options.size || 2;
        this.color = options.color || '255,255,255';
        this.shrink = options.shrink !== false;
        this.dead = false;
    }

    static burst(target, x, y, baseVx, baseVy, count, options) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = options.minSpeed + Math.random() * (options.maxSpeed - options.minSpeed);
            target.push(new Particle({
                x: x,
                y: y,
                vx: baseVx + Math.cos(angle) * speed,
                vy: baseVy + Math.sin(angle) * speed,
                life: options.minLife + Math.random() * (options.maxLife - options.minLife),
                size: options.size * (0.6 + Math.random() * 0.8),
                color: options.color
            }));
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
        wrapPosition(this);
    }

    draw(ctx) {
        const t = Math.max(this.life / this.maxLife, 0);
        const size = this.shrink ? this.size * (0.3 + 0.7 * t) : this.size;
        ctx.fillStyle = 'rgba(' + this.color + ',' + t.toFixed(3) + ')';
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

export default Particle;
