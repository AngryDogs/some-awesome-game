import Particle from '../particle/particle';
import { delta, isOutsideWorld } from '../../physics/physics';

const ACCELERATION = 520;
const MAX_SPEED = 620;
const LIFETIME = 4;
const RETARGET_RANGE = 320;

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Missile {

    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.angle = options.angle;
        this.damage = options.damage;
        this.blast = options.blast;
        this.target = options.target || null;
        this.homing = options.homing || 0;   // 0 = dumb-fire
        this.life = LIFETIME;
        this.trailTimer = 0;
        this.dead = false;
        this.exploded = false;
    }

    update(dt, rocks, particles) {
        this.life -= dt;
        if(this.life <= 0 || isOutsideWorld(this)) {
            this.dead = true;
            this.exploded = this.life <= 0;
            return;
        }

        if(this.homing > 0) {
            if(!this.target || this.target.dead) this.target = this.findTarget(rocks);
            if(this.target) {
                const d = delta(this, this.target);
                const desired = Math.atan2(d.y, d.x);
                const turn = Math.max(-this.homing * dt, Math.min(this.homing * dt, angleDifference(this.angle, desired)));
                this.angle += turn;
            }
        }

        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        this.vx += dirX * ACCELERATION * dt;
        this.vy += dirY * ACCELERATION * dt;

        // Guided missiles use their side thrusters to bleed off sideways drift.
        if(this.homing > 0) {
            const forward = this.vx * dirX + this.vy * dirY;
            const damp = Math.min(1, this.homing * 0.8 * dt);
            this.vx += (dirX * forward - this.vx) * damp;
            this.vy += (dirY * forward - this.vy) * damp;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.trailTimer -= dt;
        if(this.trailTimer <= 0) {
            this.trailTimer = 0.02;
            particles.push(new Particle({
                x: this.x - dirX * 5, y: this.y - dirY * 5,
                vx: this.vx * 0.2 - dirX * 60, vy: this.vy * 0.2 - dirY * 60,
                life: 0.3 + Math.random() * 0.2, size: 2.5, color: '255,150,70'
            }));
        }
    }

    findTarget(rocks) {
        let best = null;
        let bestDist = RETARGET_RANGE * RETARGET_RANGE;
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = delta(this, rock);
            const distSq = d.x * d.x + d.y * d.y;
            if(distSq < bestDist) {
                bestDist = distSq;
                best = rock;
            }
        });
        return best;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = 'rgb(255, 160, 140)';
        ctx.lineWidth = 1.3;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgb(255, 120, 90)';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 0);
        ctx.moveTo(-4, -2.5);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-4, 2.5);
        ctx.stroke();
        ctx.restore();
    }
}

export default Missile;
