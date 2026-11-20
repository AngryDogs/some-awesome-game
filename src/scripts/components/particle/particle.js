// Small glowing sparks, plus soft dust that can be drawn into an asteroid
// (used when asteroids merge: the dust cloud spirals in and settles on the surface).

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
        this.dust = !!options.dust;
        this.alpha = options.alpha === undefined ? 1 : options.alpha;
        this.attractor = options.attractor || null;
        this.swirl = options.swirl || 0;
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
                color: options.color,
                dust: options.dust,
                alpha: options.alpha
            }));
        }
    }

    // A ring of dust around (x, y) that swirls inwards onto `attractor`.
    static mergeCloud(target, x, y, attractor, count, spread, color) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = spread * (0.3 + Math.random() * 0.9);
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            const out = 15 + Math.random() * 35;
            target.push(new Particle({
                x: px,
                y: py,
                vx: attractor.vx + Math.cos(angle) * out,
                vy: attractor.vy + Math.sin(angle) * out,
                life: 1.6 + Math.random() * 1.4,
                size: 5 + Math.random() * 9,
                color: color,
                dust: true,
                alpha: 0.18 + Math.random() * 0.14,
                attractor: attractor,
                swirl: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6)
            }));
        }
    }

    update(dt) {
        const a = this.attractor;
        if(a && !a.dead) {
            const dx = a.x - this.x;
            const dy = a.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
            // Fall inwards with a tangential swirl, matching the asteroid's drift.
            const pull = 160 + 3000 / (distance + 20);
            this.vx += (dx / distance * pull - dy / distance * pull * this.swirl) * dt;
            this.vy += (dy / distance * pull + dx / distance * pull * this.swirl) * dt;
            this.vx += (a.vx - this.vx) * Math.min(1, dt * 1.5);
            this.vy += (a.vy - this.vy) * Math.min(1, dt * 1.5);
            if(distance < a.radius * 0.75) this.life = Math.min(this.life, 0.25);
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = Math.max(this.life / this.maxLife, 0);
        if(this.dust) {
            // Soft puff: fade in quickly, fade out slowly.
            const fade = Math.min(1, (1 - t) * 6) * Math.min(1, t * 3);
            ctx.fillStyle = 'rgba(' + this.color + ',' + (this.alpha * fade).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (0.6 + 0.4 * (1 - t)), 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        const size = this.shrink ? this.size * (0.3 + 0.7 * t) : this.size;
        ctx.fillStyle = 'rgba(' + this.color + ',' + (t * this.alpha).toFixed(3) + ')';
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

export default Particle;
