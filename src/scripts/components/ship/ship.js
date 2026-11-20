import Bullet from '../bullet/bullet';
import Missile from '../missile/missile';
import Particle from '../particle/particle';
import { drawHullArt } from '../../shipyard/hulls';
import { drawModule } from '../../shipyard/modules';
import { delta } from '../../physics/physics';

// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const SECONDARY_THRUST = 0.55;    // retro / strafe thrust relative to main engines
const MAX_SPEED = 600;            // px/s, safety cap only
const MASS_UNIT = 300;            // physics mass per hull mass point

const BULLET_SPEED = 850;
const BULLET_SPREAD = 0.035;
const RECOIL = 3.5;               // px/s per bullet for a mass-1 hull
const TURRET_TURN_RATE = 14;      // rad/s
const MISSILE_SALVO_GAP = 0.12;   // s between launchers firing
const MISSILE_LOCK_RADIUS = 150;  // px around the cursor

const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SPAWN_IMMUNITY = 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Ship {

    constructor(x, y, stats) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.angularVelocity = 0;
        this.alive = true;
        this.autoTarget = true;
        this.time = 0;
        this.exhaustTimer = 0;
        this.firing = false;
        this.hitCooldown = 0;
        this.immunity = SPAWN_IMMUNITY;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.missileCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;

        // Animated thruster output levels (0..1), eased towards their targets.
        this.thrusters = { main: 0, retro: 0, left: 0, right: 0, spinCW: 0, spinCCW: 0 };

        this.applyStats(stats);
        this.hp = this.maxHull;
        this.shield = this.maxShield;
    }

    // (Re)build the ship from shipyard stats. Keeps current damage proportionally.
    applyStats(stats) {
        const hullFraction = this.maxHull ? this.hp / this.maxHull : 1;
        const hull = stats.hull;

        this.stats = stats;
        this.hullDef = hull;
        this.mass = stats.mass * MASS_UNIT;
        this.radius = hull.radius;
        this.maxHull = stats.maxHull;
        this.hp = this.maxHull * hullFraction;
        this.maxShield = stats.maxShield;
        this.shield = Math.min(this.shield || 0, this.maxShield);
        this.guidance = stats.guidance;
        this.cargoCapacity = stats.cargo;
        this.magnetRange = stats.magnetRange;
        this.collectRadius = hull.radius * 0.55 + 8;

        const u = hull.moduleScale;
        this.turrets = stats.modules.filter(m => m.type === 'minigun').map(m => ({
            module: m,
            aim: this.angle,
            cooldown: 0,
            target: null,
            flash: 0
        }));
        this.launchers = stats.modules.filter(m => m.type === 'missile').map(m => ({ module: m, cooldown: 0 }));
        this.engines = hull.engines.concat(stats.modules
            .filter(m => m.type === 'engine')
            .map(m => ({ x: m.slot.x - 4 * u, y: m.slot.y, size: (0.45 + m.level * 0.15) * u * 1.6 })));
    }

    get thrusting() {
        const t = this.thrusters;
        return t.main > 0.2 || t.retro > 0.2 || t.left > 0.2 || t.right > 0.2 ||
            t.spinCW > 0.2 || t.spinCCW > 0.2;
    }

    localToWorld(lx, ly) {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return { x: this.x + lx * cos - ly * sin, y: this.y + lx * sin + ly * cos };
    }

    worldColliders() {
        return this.hullDef.colliders.map(c => {
            const p = this.localToWorld(c[0], c[1]);
            return { x: p.x, y: p.y, r: c[2] };
        });
    }

    update(dt, input, world) {
        if(!this.alive) return;

        this.time += dt;
        if(this.hitCooldown > 0) this.hitCooldown -= dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.shieldFlash > 0) this.shieldFlash -= dt;
        if(this.hullFlash > 0) this.hullFlash -= dt;
        if(this.missileCooldown > 0) this.missileCooldown -= dt;
        this.sinceHit += dt;

        if(this.sinceHit > SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.stats.shieldRegen * dt);
        }

        this.fly(dt, input, world.particles);
        this.updateTargeting(input, world.rocks);
        this.updateTurrets(dt, input, world);
        this.updateLaunchers(dt, input, world);
    }

    fly(dt, input, particles) {
        const stats = this.stats;
        const mainThrust = stats.acceleration;
        const secondaryThrust = mainThrust * SECONDARY_THRUST;
        const angularThrust = stats.angularAcceleration;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Desired force in the ship's local frame (+x forward, +y right) and torque.
        let localX = 0;
        let localY = 0;
        let torque = 0;

        if(input.forward) localX += mainThrust;
        if(input.backward) localX -= secondaryThrust;
        if(input.strafeLeft) localY -= secondaryThrust;
        if(input.strafeRight) localY += secondaryThrust;
        if(input.rotateRight) torque += angularThrust;
        if(input.rotateLeft) torque -= angularThrust;

        // Stabilizer: fire whatever thrusters are needed to cancel drift and spin.
        if(input.stabilize) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if(speed > 1) {
                const brake = Math.min(secondaryThrust, speed / dt);
                const worldX = -this.vx / speed * brake;
                const worldY = -this.vy / speed * brake;
                localX += worldX * cos + worldY * sin;
                localY += -worldX * sin + worldY * cos;
            }
            if(Math.abs(this.angularVelocity) > 0.01) {
                torque -= clamp(this.angularVelocity / dt, -angularThrust, angularThrust);
            }
        }

        this.vx += (localX * cos - localY * sin) * dt;
        this.vy += (localX * sin + localY * cos) * dt;
        this.angularVelocity = clamp(this.angularVelocity + torque * dt, -stats.maxTurn, stats.maxTurn);

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.angularVelocity * dt;

        this.animateThrusters(dt, localX / mainThrust, localY / secondaryThrust, torque / angularThrust);
        this.emitExhaust(dt, particles);
    }

    animateThrusters(dt, forward, side, spin) {
        const t = this.thrusters;
        const targets = {
            main: clamp(forward, 0, 1),
            retro: clamp(-forward / SECONDARY_THRUST, 0, 1),
            left: clamp(-side, 0, 1),
            right: clamp(side, 0, 1),
            spinCW: clamp(spin, 0, 1),
            spinCCW: clamp(-spin, 0, 1)
        };
        // Quick spool-up, slightly slower cut-off.
        Object.keys(targets).forEach(key => {
            const rate = targets[key] > t[key] ? 18 : 10;
            t[key] += (targets[key] - t[key]) * Math.min(1, rate * dt);
        });
    }

    // Manoeuvring jet positions, scaled to the hull.
    jets() {
        const r = this.hullDef.rcs;
        return {
            retro: [[r.nose * 0.6, -r.half * 0.45, 1, 0], [r.nose * 0.6, r.half * 0.45, 1, 0]],
            left: [[0, r.half, 0, 1]],
            right: [[0, -r.half, 0, -1]],
            spinCW: [[r.nose * 0.8, -r.half * 0.35, 0, -1], [r.tail * 0.8, r.half * 0.6, 0, 1]],
            spinCCW: [[r.nose * 0.8, r.half * 0.35, 0, 1], [r.tail * 0.8, -r.half * 0.6, 0, -1]]
        };
    }

    jetScale() {
        return Math.max(1, Math.sqrt(this.hullDef.rcs.half / 8));
    }

    // Spits hot exhaust particles out of the engines (and puffs from the jets).
    emitExhaust(dt, particles) {
        const t = this.thrusters;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        this.exhaustTimer -= dt;
        if(this.exhaustTimer > 0) return;
        this.exhaustTimer = 1 / 90;

        if(t.main > 0.15) {
            this.engines.forEach(engine => {
                const nozzle = this.localToWorld(engine.x, engine.y);
                const spread = (Math.random() - 0.5) * 0.5;
                const speed = (160 + Math.random() * 120) * Math.sqrt(engine.size);
                particles.push(new Particle({
                    x: nozzle.x,
                    y: nozzle.y,
                    vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                    vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                    life: 0.25 + Math.random() * 0.25,
                    size: (2.5 + Math.random() * 2) * Math.sqrt(engine.size),
                    color: Math.random() < 0.5 ? '255,170,60' : '255,110,40'
                }));
            });
        }

        const jets = this.jets();
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.2 || Math.random() > 0.5) return;
            jets[key].forEach(jet => {
                const p = this.localToWorld(jet[0], jet[1]);
                const dx = jet[2] * cos - jet[3] * sin;
                const dy = jet[2] * sin + jet[3] * cos;
                const speed = 60 + Math.random() * 60;
                particles.push(new Particle({
                    x: p.x, y: p.y,
                    vx: this.vx + dx * speed, vy: this.vy + dy * speed,
                    life: 0.15 + Math.random() * 0.15,
                    size: 2,
                    color: '200,225,255'
                }));
            });
        });
    }

    nearestRock(x, y, rocks, range) {
        let best = null;
        let bestDist = range * range;
        const from = { x: x, y: y };
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = delta(from, rock);
            const distSq = d.x * d.x + d.y * d.y;
            if(distSq < bestDist) {
                bestDist = distSq;
                best = rock;
            }
        });
        return best;
    }

    // Guidance: pick turret targets and the missile lock.
    updateTargeting(input, rocks) {
        if(!this.guidance) {
            this.missileLock = null;
            this.turrets.forEach(turret => { turret.target = null; });
            return;
        }

        const range = this.guidance.range;
        const nearCursor = this.nearestRock(input.aimX, input.aimY, rocks, MISSILE_LOCK_RADIUS);
        this.missileLock = nearCursor || this.nearestRock(this.x, this.y, rocks, range);

        this.turrets.forEach(turret => {
            if(!this.autoTarget) {
                turret.target = null;
                return;
            }
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            turret.target = this.nearestRock(p.x, p.y, rocks, range);
        });
    }

    updateTurrets(dt, input, world) {
        this.firing = false;

        this.turrets.forEach(turret => {
            const stats = turret.module.stats;
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            if(turret.cooldown > 0) turret.cooldown -= dt;
            if(turret.flash > 0) turret.flash -= dt;

            // Manual fire always aims at the cursor; otherwise the guidance computer
            // leads the locked target.
            let desired = Math.atan2(input.aimY - p.y, input.aimX - p.x);
            let shouldFire = input.firing;

            if(!input.firing && turret.target) {
                const target = turret.target;
                let d = delta(p, target);
                const time = Math.sqrt(d.x * d.x + d.y * d.y) / BULLET_SPEED;
                d = { x: d.x + target.vx * time, y: d.y + target.vy * time };
                desired = Math.atan2(d.y, d.x);
                shouldFire = true;
            }

            const diff = angleDifference(turret.aim, desired);
            const maxTurn = TURRET_TURN_RATE * dt;
            turret.aim += clamp(diff, -maxTurn, maxTurn);

            if(!shouldFire || Math.abs(diff) > 0.2) return;
            this.firing = true;

            if(turret.cooldown > 0) return;
            turret.cooldown += 1 / stats.fireRate;
            if(turret.cooldown < 0) turret.cooldown = 0;

            const angle = turret.aim + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            const barrel = 9 * this.hullDef.moduleScale;

            // Bullets inherit the ship's speed along the line of fire, but not its
            // sideways drift, so they travel where the turret points.
            const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
            const speed = BULLET_SPEED + inherited;
            world.bullets.push(new Bullet(
                p.x + Math.cos(turret.aim) * barrel,
                p.y + Math.sin(turret.aim) * barrel,
                dirX * speed,
                dirY * speed,
                stats.damage
            ));

            // Equal and opposite reaction.
            const recoil = RECOIL / this.stats.mass;
            this.vx -= dirX * recoil;
            this.vy -= dirY * recoil;
            turret.flash = 0.04;
        });
    }

    updateLaunchers(dt, input, world) {
        this.launchers.forEach(launcher => {
            if(launcher.cooldown > 0) launcher.cooldown -= dt;
        });

        if(!input.firingMissiles || this.missileCooldown > 0 || this.launchers.length === 0) return;

        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const launcher = this.launchers[index];
            if(launcher.cooldown > 0) continue;

            const stats = launcher.module.stats;
            const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
            const target = this.guidance ? this.missileLock : null;
            const aimAt = target ? delta(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
            const angle = Math.atan2(aimAt.y, aimAt.x);

            world.missiles.push(new Missile({
                x: p.x,
                y: p.y,
                vx: this.vx + Math.cos(angle) * 120,
                vy: this.vy + Math.sin(angle) * 120,
                angle: angle,
                damage: stats.damage,
                blast: stats.blast,
                target: target,
                homing: this.guidance ? this.guidance.homing : 0
            }));

            launcher.cooldown = stats.cooldown;
            this.missileCooldown = MISSILE_SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    // Returns true if damage was applied.
    takeDamage(amount, particles) {
        if(!this.alive || this.hitCooldown > 0 || this.immunity > 0) return false;

        this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;

        const absorbed = Math.min(this.shield, amount);
        this.shield -= absorbed;
        const remaining = amount - absorbed;
        if(absorbed > 0) this.shieldFlash = 0.25;

        if(remaining > 0) {
            this.hp -= remaining;
            this.hullFlash = 0.15;
            this.explode(particles, 10 + Math.round(remaining / 2));
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
        }
        return true;
    }

    explode(particles, count) {
        const spread = this.radius * 0.5;
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 180;
            particles.push(new Particle({
                x: this.x + (Math.random() - 0.5) * spread,
                y: this.y + (Math.random() - 0.5) * spread,
                vx: this.vx + Math.cos(angle) * speed,
                vy: this.vy + Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.8,
                size: 3 * (0.6 + Math.random() * 0.8),
                color: '255,200,120'
            }));
        }
    }

    drawFlame(ctx, x, y, dirX, dirY, length, width, outer, inner) {
        if(length < 0.5) return;
        const nx = -dirY;
        const ny = dirX;

        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(x + nx * width, y + ny * width);
        ctx.lineTo(x + dirX * length, y + dirY * length);
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
        const scale = this.jetScale();
        const jetOuter = 'rgba(170, 210, 255, 0.85)';
        const jetInner = 'rgba(255, 255, 255, 0.95)';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        this.engines.forEach(engine => {
            const size = engine.size * (1 + (scale - 1) * 0.6);

            // Idle engine glow, pulsing even when not thrusting.
            const glowRadius = (3 + pulse * 1.5 + t.main * 4) * size * 2;
            const glow = ctx.createRadialGradient(engine.x, engine.y, 0, engine.x, engine.y, glowRadius);
            glow.addColorStop(0, 'rgba(255, 200, 120, ' + (0.6 + t.main * 0.4) + ')');
            glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(engine.x, engine.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Main engine plume.
            const length = t.main * (18 + Math.random() * 12) * size;
            const plume = ctx.createLinearGradient(engine.x, engine.y, engine.x - length, engine.y);
            plume.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
            plume.addColorStop(0.5, 'rgba(255, 130, 40, 0.8)');
            plume.addColorStop(1, 'rgba(255, 60, 20, 0)');
            this.drawFlame(ctx, engine.x, engine.y, -1, 0, length, 4.5 * size * flicker(), plume, 'rgba(255, 255, 230, 0.95)');
        });

        // Manoeuvring jets: retro, strafe and attitude control.
        const jets = this.jets();
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.02) return;
            const length = t[key] * 9 * scale;
            jets[key].forEach(jet => {
                this.drawFlame(ctx, jet[0], jet[1], jet[2], jet[3], length * flicker(), 1.8 * scale, jetOuter, jetInner);
            });
        });

        ctx.restore();
    }

    drawShield(ctx) {
        if(this.maxShield <= 0 || this.shield <= 0) return;
        const s = this.hullDef.shield;
        const strength = this.shield / this.maxShield;
        const alpha = 0.1 + 0.2 * strength + Math.max(0, this.shieldFlash) * 2.5;

        ctx.save();
        ctx.strokeStyle = 'rgba(120, 210, 255, ' + Math.min(1, alpha) + ')';
        ctx.fillStyle = 'rgba(120, 210, 255, ' + Math.min(0.25, alpha * 0.25) + ')';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(120, 210, 255)';
        ctx.beginPath();
        ctx.ellipse(s.x, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx) {
        if(!this.alive) return;
        // Blink while invulnerable after launch.
        if(this.immunity > 0 && Math.floor(this.immunity * 10) % 2 === 0) return;

        const u = this.hullDef.moduleScale;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        this.drawThrusters(ctx);
        drawHullArt(ctx, this.hullDef, { color: this.hullFlash > 0 ? '255,120,120' : undefined });

        this.stats.modules.forEach(module => {
            if(module.type === 'minigun') return;
            ctx.save();
            ctx.translate(module.slot.x, module.slot.y);
            drawModule(ctx, module.type, module.level, { scale: u });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            drawModule(ctx, 'minigun', turret.module.level, { scale: u, aim: turret.aim - this.angle });
            if(turret.flash > 0) {
                const tip = 9 * u;
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
                ctx.beginPath();
                ctx.arc(Math.cos(turret.aim - this.angle) * tip, Math.sin(turret.aim - this.angle) * tip,
                    (2 + Math.random() * 3) * Math.max(1, u), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        this.drawShield(ctx);
        ctx.restore();
    }
}

export default Ship;
