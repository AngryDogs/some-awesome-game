import Particle from '../particle/particle';
import { delta } from '../../physics/physics';
import { glowSprite, stamp } from '../../render/sprites';

// Tau'ri missiles ('missile') and Ancient drones ('drone').
const PROFILES = {
    missile: { acceleration: 520, maxSpeed: 620, lifetime: 4, retarget: 320, trail: '255,150,70', trailRate: 0.02 },
    drone: { acceleration: 900, maxSpeed: 760, lifetime: 6, retarget: 650, trail: '255,220,120', trailRate: 0.015 }
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Missile {

    constructor(options) {
        this.kind = options.kind || 'missile';
        this.profile = PROFILES[this.kind];
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.angle = options.angle;
        this.damage = options.damage;
        this.blast = options.blast;
        this.target = options.target || null;
        this.homing = options.homing || 0;   // 0 = dumb-fire
        this.side = options.side || 'player';  // whose weapon it is
        this.launchDelay = options.launchDelay || 0;
        this.life = this.profile.lifetime;
        this.trailTimer = 0;
        this.time = Math.random() * 10;
        this.dead = false;
        this.exploded = false;
    }

    update(dt, rocks, particles) {
        this.life -= dt;
        this.time += dt;
        if(this.life <= 0) {
            this.dead = true;
            this.exploded = true;
            return;
        }

        const profile = this.profile;
        const armed = this.launchDelay <= 0;
        if(!armed) this.launchDelay -= dt;

        if(this.homing > 0 && armed) {
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
        const thrust = armed ? profile.acceleration : profile.acceleration * 0.3;
        this.vx += dirX * thrust * dt;
        this.vy += dirY * thrust * dt;

        // Guided weapons use side thrust to bleed off sideways drift.
        if(this.homing > 0) {
            const forward = this.vx * dirX + this.vy * dirY;
            const damp = Math.min(1, this.homing * 0.8 * dt);
            this.vx += (dirX * forward - this.vx) * damp;
            this.vy += (dirY * forward - this.vy) * damp;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > profile.maxSpeed) {
            this.vx *= profile.maxSpeed / speed;
            this.vy *= profile.maxSpeed / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.trailTimer -= dt;
        if(this.trailTimer <= 0) {
            this.trailTimer = profile.trailRate;
            particles.push(new Particle({
                x: this.x - dirX * 4, y: this.y - dirY * 4,
                vx: this.vx * 0.2 - dirX * 50, vy: this.vy * 0.2 - dirY * 50,
                life: 0.25 + Math.random() * 0.2, size: this.kind === 'drone' ? 2 : 2.5, color: profile.trail
            }));
            // Glittering pixel sparks shed along the trail.
            if(Math.random() < 0.5) {
                particles.push(new Particle({
                    x: this.x - dirX * 4, y: this.y - dirY * 4,
                    vx: this.vx * 0.3 + (Math.random() - 0.5) * 80, vy: this.vy * 0.3 + (Math.random() - 0.5) * 80,
                    life: 0.3 + Math.random() * 0.3, size: 1.4, color: profile.trail, pixel: true, glow: true
                }));
            }
            // Missiles also leave a thin smoke trail.
            if(this.kind === 'missile' && Math.random() < 0.4) {
                particles.push(new Particle({
                    x: this.x - dirX * 6, y: this.y - dirY * 6, vx: this.vx * 0.05, vy: this.vy * 0.05,
                    life: 0.8 + Math.random() * 0.6, size: 4, color: '190,185,180', dust: true, alpha: 0.14
                }));
            }
        }
    }

    findTarget(rocks) {
        let best = null;
        let bestDist = this.profile.retarget * this.profile.retarget;
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

        if(this.kind === 'drone') {
            // Golden squid-like drone with a pulsing glow.
            const pulse = 0.7 + 0.3 * Math.sin(this.time * 20);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = pulse;
            stamp(ctx, glowSprite('255,200,80'), 0, 0, 18, 18);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255, 235, 170, 0.95)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(4, 0); ctx.lineTo(-1, -2); ctx.lineTo(-4, -1.2);
            ctx.moveTo(4, 0); ctx.lineTo(-1, 2); ctx.lineTo(-4, 1.2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.strokeStyle = 'rgb(255, 160, 140)';
        ctx.lineWidth = 1.5;
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
