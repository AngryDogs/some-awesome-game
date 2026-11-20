import Bullet from '../bullet/bullet';
import Particle from '../particle/particle';
import { wrapPosition } from '../../physics/physics';

// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const MAIN_THRUST = 260;          // px/s^2
const RETRO_THRUST = 150;
const STRAFE_THRUST = 150;
const ANGULAR_THRUST = 9;         // rad/s^2
const MAX_ANGULAR_SPEED = 5;      // rad/s
const MAX_SPEED = 600;            // px/s, safety cap only

const FIRE_RATE = 18;             // bullets per second
const BULLET_SPEED = 850;
const BULLET_SPREAD = 0.035;      // radians
const RECOIL = 3.5;               // px/s per bullet, pushes the ship back
const BARREL_LENGTH = 13;

const HIT_IMMUNITY = 2.5;
const START_LIVES = 3;

// Hull outline, nose pointing along +x.
const HULL = [[14, 0], [-10, -9], [-6, 0], [-10, 9]];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class Ship {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.angularVelocity = 0;
        this.radius = 11;
        this.mass = 150;
        this.lives = START_LIVES;
        this.alive = true;
        this.immunity = HIT_IMMUNITY;
        this.aimAngle = this.angle;
        this.fireCooldown = 0;
        this.muzzleFlash = 0;
        this.exhaustTimer = 0;
        this.firing = false;
        this.time = 0;

        // Animated thruster output levels (0..1), eased towards their targets.
        this.thrusters = {
            main: 0, retro: 0,
            left: 0, right: 0,       // side jets that push the ship left / right
            spinCW: 0, spinCCW: 0    // attitude jets
        };
    }

    get thrusting() {
        const t = this.thrusters;
        return t.main > 0.2 || t.retro > 0.2 || t.left > 0.2 || t.right > 0.2 ||
            t.spinCW > 0.2 || t.spinCCW > 0.2;
    }

    update(dt, input, bullets, particles) {
        if(!this.alive) return;

        this.time += dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.muzzleFlash > 0) this.muzzleFlash -= dt;
        if(this.fireCooldown > 0) this.fireCooldown -= dt;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Desired force in the ship's local frame (+x forward, +y right) and torque.
        let localX = 0;
        let localY = 0;
        let torque = 0;

        if(input.forward) localX += MAIN_THRUST;
        if(input.backward) localX -= RETRO_THRUST;
        if(input.strafeLeft) localY -= STRAFE_THRUST;
        if(input.strafeRight) localY += STRAFE_THRUST;
        if(input.rotateRight) torque += ANGULAR_THRUST;
        if(input.rotateLeft) torque -= ANGULAR_THRUST;

        // Stabilizer: fire whatever thrusters are needed to cancel drift and spin.
        if(input.stabilize) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if(speed > 1) {
                const brake = Math.min(STRAFE_THRUST, speed / dt);
                const worldX = -this.vx / speed * brake;
                const worldY = -this.vy / speed * brake;
                localX += worldX * cos + worldY * sin;
                localY += -worldX * sin + worldY * cos;
            }
            if(Math.abs(this.angularVelocity) > 0.01) {
                torque -= clamp(this.angularVelocity / dt, -ANGULAR_THRUST, ANGULAR_THRUST);
            }
        }

        // Apply forces (local -> world).
        this.vx += (localX * cos - localY * sin) * dt;
        this.vy += (localX * sin + localY * cos) * dt;
        this.angularVelocity = clamp(this.angularVelocity + torque * dt, -MAX_ANGULAR_SPEED, MAX_ANGULAR_SPEED);

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.angularVelocity * dt;
        wrapPosition(this);

        this.animateThrusters(dt, localX, localY, torque);
        this.emitExhaust(dt, particles);

        // Minigun turret follows the mouse independently of the hull.
        this.aimAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
        this.firing = input.firing;
        if(this.firing) this.shoot(bullets);
    }

    animateThrusters(dt, localX, localY, torque) {
        const t = this.thrusters;
        const targets = {
            main: localX > 0 ? Math.min(1, localX / MAIN_THRUST) : 0,
            retro: localX < 0 ? Math.min(1, -localX / RETRO_THRUST) : 0,
            left: localY < 0 ? Math.min(1, -localY / STRAFE_THRUST) : 0,
            right: localY > 0 ? Math.min(1, localY / STRAFE_THRUST) : 0,
            spinCW: torque > 0 ? Math.min(1, torque / ANGULAR_THRUST) : 0,
            spinCCW: torque < 0 ? Math.min(1, -torque / ANGULAR_THRUST) : 0
        };
        // Quick spool-up, slightly slower cut-off.
        Object.keys(targets).forEach(key => {
            const rate = targets[key] > t[key] ? 18 : 10;
            t[key] += (targets[key] - t[key]) * Math.min(1, rate * dt);
        });
    }

    // Spits hot exhaust particles out of the main engine (and puffs from the jets).
    emitExhaust(dt, particles) {
        const t = this.thrusters;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        this.exhaustTimer -= dt;
        if(this.exhaustTimer > 0) return;
        this.exhaustTimer = 1 / 90;

        if(t.main > 0.15) {
            const nozzleX = this.x - cos * 8;
            const nozzleY = this.y - sin * 8;
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = 160 + Math.random() * 120;
            particles.push(new Particle({
                x: nozzleX,
                y: nozzleY,
                vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                life: 0.25 + Math.random() * 0.25,
                size: 2.5 + Math.random() * 2,
                color: Math.random() < 0.5 ? '255,170,60' : '255,110,40'
            }));
        }

        const puff = (level, localX, localY, dirX, dirY) => {
            if(level < 0.2 || Math.random() > 0.5) return;
            const wx = this.x + localX * cos - localY * sin;
            const wy = this.y + localX * sin + localY * cos;
            const dx = dirX * cos - dirY * sin;
            const dy = dirX * sin + dirY * cos;
            const speed = 60 + Math.random() * 60;
            particles.push(new Particle({
                x: wx, y: wy,
                vx: this.vx + dx * speed, vy: this.vy + dy * speed,
                life: 0.15 + Math.random() * 0.15,
                size: 2,
                color: '200,225,255'
            }));
        };

        puff(t.retro, 5, -5, 1, 0);
        puff(t.retro, 5, 5, 1, 0);
        puff(t.left, -2, 7, 0, 1);
        puff(t.right, -2, -7, 0, -1);
        puff(t.spinCW, 9, -3, 0, -1);
        puff(t.spinCW, -9, 7, 0, 1);
        puff(t.spinCCW, 9, 3, 0, 1);
        puff(t.spinCCW, -9, -7, 0, -1);
    }

    shoot(bullets) {
        while(this.fireCooldown <= 0) {
            this.fireCooldown += 1 / FIRE_RATE;

            const angle = this.aimAngle + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            // Bullets inherit the ship's speed along the line of fire, but not its
            // sideways drift, so they always travel towards the crosshair.
            const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
            const bulletSpeed = BULLET_SPEED + inherited;
            bullets.push(new Bullet(
                this.x + Math.cos(this.aimAngle) * BARREL_LENGTH,
                this.y + Math.sin(this.aimAngle) * BARREL_LENGTH,
                dirX * bulletSpeed,
                dirY * bulletSpeed
            ));

            // Equal and opposite reaction.
            this.vx -= dirX * RECOIL;
            this.vy -= dirY * RECOIL;
            this.muzzleFlash = 0.04;
        }
    }

    hit(particles) {
        if(this.immunity > 0 || !this.alive) return false;

        this.lives--;
        this.immunity = HIT_IMMUNITY;
        this.explode(particles, 25);

        if(this.lives <= 0) {
            this.alive = false;
            this.explode(particles, 60);
        }
        return true;
    }

    explode(particles, count) {
        Particle.burst(particles, this.x, this.y, this.vx, this.vy, count, {
            minSpeed: 40, maxSpeed: 220, minLife: 0.4, maxLife: 1.2, size: 3, color: '255,200,120'
        });
    }

    drawFlame(ctx, x, y, dirX, dirY, length, width, outer, inner) {
        if(length < 0.5) return;
        const nx = -dirY;
        const ny = dirX;
        const tipX = x + dirX * length;
        const tipY = y + dirY * length;

        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(x + nx * width, y + ny * width);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(x - nx * width, y - ny * width);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.moveTo(x + nx * width * 0.45, y + ny * width * 0.45);
        ctx.lineTo(x + dirX * length * 0.55, y + dirY * length * 0.55);
        ctx.lineTo(x - nx * width * 0.45, y - ny * width * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    drawThrusters(ctx) {
        const t = this.thrusters;
        const flicker = () => 0.75 + Math.random() * 0.5;
        const jetOuter = 'rgba(170, 210, 255, 0.85)';
        const jetInner = 'rgba(255, 255, 255, 0.95)';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Idle engine glow, pulsing even when not thrusting.
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);
        const glowRadius = 3 + pulse * 1.5 + t.main * 4;
        const glow = ctx.createRadialGradient(-7, 0, 0, -7, 0, glowRadius * 2);
        glow.addColorStop(0, 'rgba(255, 200, 120, ' + (0.6 + t.main * 0.4) + ')');
        glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(-7, 0, glowRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main engine plume.
        const mainLength = t.main * (18 + Math.random() * 12);
        const plume = ctx.createLinearGradient(-7, 0, -7 - mainLength, 0);
        plume.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
        plume.addColorStop(0.5, 'rgba(255, 130, 40, 0.8)');
        plume.addColorStop(1, 'rgba(255, 60, 20, 0)');
        this.drawFlame(ctx, -7, 0, -1, 0, mainLength, 4.5 * flicker(), plume, 'rgba(255, 255, 230, 0.95)');

        // Retro thrusters near the nose fire forwards.
        const retro = t.retro * 9 * flicker();
        this.drawFlame(ctx, 5, -5, 1, 0, retro, 1.8, jetOuter, jetInner);
        this.drawFlame(ctx, 5, 5, 1, 0, retro, 1.8, jetOuter, jetInner);

        // Side (strafe) jets.
        this.drawFlame(ctx, -2, 7, 0, 1, t.left * 9 * flicker(), 2, jetOuter, jetInner);
        this.drawFlame(ctx, -2, -7, 0, -1, t.right * 9 * flicker(), 2, jetOuter, jetInner);

        // Attitude jets at nose and tail create torque.
        this.drawFlame(ctx, 9, -3, 0, -1, t.spinCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, -9, 7, 0, 1, t.spinCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, 9, 3, 0, 1, t.spinCCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, -9, -7, 0, -1, t.spinCCW * 7 * flicker(), 1.5, jetOuter, jetInner);

        ctx.restore();
    }

    draw(ctx) {
        if(!this.alive) return;
        // Blink while invulnerable.
        if(this.immunity > 0 && Math.floor(this.immunity * 10) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        this.drawThrusters(ctx);

        ctx.beginPath();
        ctx.moveTo(HULL[0][0], HULL[0][1]);
        for(let i = 1; i < HULL.length; i++) ctx.lineTo(HULL[i][0], HULL[i][1]);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.restore();

        // Minigun turret, drawn in world space pointing at the mouse.
        const tipX = this.x + Math.cos(this.aimAngle) * BARREL_LENGTH;
        const tipY = this.y + Math.sin(this.aimAngle) * BARREL_LENGTH;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#7fb4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.fillStyle = '#4a6fa8';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        if(this.muzzleFlash > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

export default Ship;
