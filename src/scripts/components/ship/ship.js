import Bullet from '../bullet/bullet';
import Missile from '../missile/missile';
import Particle from '../particle/particle';
import { drawHullArt, shieldFor, hullBounds } from '../../shipyard/hulls';
import { createSprite, glowSprite, flameSprite, muzzleSprite, stamp } from '../../render/sprites';
import MODULES, { drawModule } from '../../shipyard/modules';
import { delta } from '../../physics/physics';
import sounds from '../../audio/audio';

// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const SECONDARY_THRUST = 0.55;    // retro / strafe thrust relative to main engines
const MAX_SPEED = 600;            // px/s, safety cap only
const MASS_UNIT = 300;            // physics mass per hull mass point

const BULLET_SPEED = 1100;
const BULLET_SPREAD = 0.022;
const PLASMA_SPEED = 520;
const RECOIL = 3.5;               // px/s per bullet for a mass-1 hull
const TURRET_TURN_RATE = 14;      // rad/s
const SALVO_GAP = 0.12;           // s between launchers firing
const MISSILE_LOCK_RADIUS = 150;  // px around the cursor
const HEAT_COOLING = 0.35;        // minigun heat lost per second
const HEAT_RESUME = 0.3;          // overheated guns resume below this heat

const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SPAWN_IMMUNITY = 2;

const TURRET_TYPES = ['minigun', 'staff', 'beam'];
const LAUNCHER_TYPES = ['missile', 'drones'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

// Distance along a ray to the first asteroid outline it hits.
const raycastRocks = (x, y, dirX, dirY, range, rocks) => {
    let best = null;
    let bestDistance = range;
    rocks.forEach(rock => {
        if(rock.dead) return;
        const hit = rock.raycast(x, y, dirX, dirY, bestDistance);
        if(hit !== null && hit < bestDistance) {
            bestDistance = hit;
            best = rock;
        }
    });
    return { rock: best, distance: bestDistance };
};

// Hull line art with its glow, rendered once per hull and colour.
const hullSprite = (hull, color) => {
    hull._sprites = hull._sprites || {};
    const key = color || 'base';
    if(!hull._sprites[key]) {
        const b = hullBounds(hull);
        const pad = 8;
        const sprite = createSprite(b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2, ctx => {
            ctx.translate(pad - b.minX, pad - b.minY);
            drawHullArt(ctx, hull, { color: color });
        });
        sprite.x = b.minX - pad;
        sprite.y = b.minY - pad;
        hull._sprites[key] = sprite;
    }
    return hull._sprites[key];
};

// Shield bubble (soft edge, hexagon lattice and glowing rim) rendered once per hull.
const shieldSprite = (hull) => {
    if(hull._shieldSprite) return hull._shieldSprite;
    const s = shieldFor(hull);
    const color = hull.shieldColor || '120,210,255';
    const pad = 6;
    hull._shieldSprite = createSprite(s.rx * 2 + pad * 2, s.ry * 2 + pad * 2, ctx => {
        ctx.translate(s.rx + pad, s.ry + pad);
        ctx.scale(1, s.ry / s.rx);
        const rx = s.rx;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        const body = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
        body.addColorStop(0, 'rgba(' + color + ', 0)');
        body.addColorStop(0.8, 'rgba(' + color + ', 0.05)');
        body.addColorStop(1, 'rgba(' + color + ', 0.22)');
        ctx.fillStyle = body;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const lattice = new Path2D();
        const size = 7;
        const w = size * Math.sqrt(3);
        for(let row = -Math.ceil(rx / (size * 1.5)); row <= Math.ceil(rx / (size * 1.5)); row++) {
            for(let col = -Math.ceil(rx / w) - 1; col <= Math.ceil(rx / w) + 1; col++) {
                const cx = col * w + (row % 2 ? w / 2 : 0);
                const cy = row * size * 1.5;
                if(cx * cx + cy * cy > (rx + size) * (rx + size)) continue;
                for(let i = 0; i < 6; i++) {
                    const a1 = Math.PI / 6 + i * Math.PI / 3;
                    lattice.moveTo(cx + Math.cos(a1) * size, cy + Math.sin(a1) * size);
                    lattice.lineTo(cx + Math.cos(a1 + Math.PI / 3) * size, cy + Math.sin(a1 + Math.PI / 3) * size);
                }
            }
        }
        // Lattice is brighter towards the rim.
        const fade = ctx.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx);
        fade.addColorStop(0, 'rgba(' + color + ', 0.03)');
        fade.addColorStop(1, 'rgba(' + color + ', 0.2)');
        ctx.strokeStyle = fade;
        ctx.lineWidth = 0.6;
        ctx.stroke(lattice);
        ctx.restore();
        ctx.strokeStyle = 'rgba(' + color + ', 0.55)';
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.stroke();
    });
    hull._shieldSprite.pad = pad;
    return hull._shieldSprite;
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
        this.minigunFiring = false;
        this.beaming = false;
        this.hitCooldown = 0;
        this.immunity = SPAWN_IMMUNITY;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.salvoCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;
        this.shieldsEnabled = true;
        this.shieldLevel = 0;         // animated 0..1 power level of the bubble
        this.shieldImpacts = [];

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
        this.scanner = stats.scanner;
        this.cargoCapacity = stats.cargo;
        this.magnetRange = stats.magnetRange;
        this.collectRadius = hull.radius * 0.55 + 8;

        const u = hull.moduleScale;
        this.turrets = stats.modules.filter(m => TURRET_TYPES.indexOf(m.type) !== -1).map(m => ({
            module: m,
            kind: m.type,
            aim: this.angle,
            cooldown: 0,
            target: null,
            flash: 0,
            heat: 0,
            overheated: false,
            beamTime: 0,
            beam: null
        }));
        this.launchers = stats.modules.filter(m => LAUNCHER_TYPES.indexOf(m.type) !== -1)
            .map(m => ({ module: m, kind: m.type, cooldown: 0 }));
        this.engines = hull.engines.concat(stats.modules
            .filter(m => m.type === 'engine')
            .map(m => ({ x: m.slot.x - 4 * u, y: m.slot.y, size: (0.45 + m.level * 0.15) * u * 1.6 })));
        this.jetList = this.buildJets();
    }

    // Manoeuvring jet positions from the hull definition: [x, y, dirX, dirY].
    buildJets() {
        const j = this.hullDef.jets;
        const both = (points, dirX) => {
            const list = [];
            points.forEach(p => {
                list.push([p[0], p[1], dirX, 0]);
                list.push([p[0], -p[1], dirX, 0]);
            });
            return list;
        };
        return {
            retro: both(j.retro, 1),
            left: j.side.map(p => [p[0], Math.abs(p[1]), 0, 1]),
            right: j.side.map(p => [p[0], -Math.abs(p[1]), 0, -1]),
            spinCW: [[j.bow[0], -j.bow[1], 0, -1], [j.stern[0], j.stern[1], 0, 1]],
            spinCCW: [[j.bow[0], j.bow[1], 0, 1], [j.stern[0], -j.stern[1], 0, -1]]
        };
    }

    get shieldUp() {
        return this.shieldsEnabled && this.alive && this.maxShield > 0 && this.shield > 0.5;
    }

    toggleShields() {
        if(this.maxShield <= 0) return false;
        this.shieldsEnabled = !this.shieldsEnabled;
        if(this.shieldsEnabled) sounds.shieldUp();
        else sounds.shieldDown();
        return true;
    }

    // Converts a world point into shield-ellipse space.
    shieldLocal(worldX, worldY) {
        const s = shieldFor(this.hullDef);
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        return { x: dx * cos - dy * sin - s.x, y: dx * sin + dy * cos - s.y, s: s };
    }

    // Circle vs shield-ellipse contact. Returns the outward normal (world space),
    // overlap depth and contact point, or null when not touching.
    shieldContact(worldX, worldY, radius) {
        const l = this.shieldLocal(worldX, worldY);
        const s = l.s;
        const k = Math.sqrt((l.x / s.rx) * (l.x / s.rx) + (l.y / s.ry) * (l.y / s.ry)) || 0.0001;
        const length = Math.sqrt(l.x * l.x + l.y * l.y) || 0.0001;
        const gap = length * (1 - 1 / k);
        const overlap = radius - gap;
        if(overlap <= 0) return null;

        const px = l.x / k;
        const py = l.y / k;
        let nx = px / (s.rx * s.rx);
        let ny = py / (s.ry * s.ry);
        const n = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= n;
        ny /= n;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const contact = this.localToWorld(px + s.x, py + s.y);
        return {
            nx: nx * cos - ny * sin,
            ny: nx * sin + ny * cos,
            overlap: overlap,
            x: contact.x,
            y: contact.y
        };
    }

    // Ripple on the shield where something struck it.
    shieldImpact(worldX, worldY, strength) {
        const l = this.shieldLocal(worldX, worldY);
        const k = Math.sqrt((l.x / l.s.rx) * (l.x / l.s.rx) + (l.y / l.s.ry) * (l.y / l.s.ry)) || 1;
        this.shieldImpacts.push({ x: l.x / k, y: l.y / k, life: 1, strength: Math.min(1.5, strength) });
        if(this.shieldImpacts.length > 12) this.shieldImpacts.shift();
        this.shieldFlash = Math.max(this.shieldFlash, 0.1 * strength);
    }

    // Ore that hits raised shields burns up and costs a sliver of shield energy.
    absorbOre(worldX, worldY) {
        this.shield = Math.max(0, this.shield - 0.25);
        this.sinceHit = 0;
        this.shieldImpact(worldX, worldY, 0.8);
        sounds.shieldHit(0.5);
    }

    // Where the tractor beam comes from: the ore tractor module if fitted, else the hull centre.
    tractorEmitter() {
        const module = this.stats.modules.filter(m => m.type === 'magnet')[0];
        return module ? this.localToWorld(module.slot.x, module.slot.y) : { x: this.x, y: this.y };
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
        if(!this.alive) {
            this.firing = false;
            this.minigunFiring = false;
            this.beaming = false;
            return;
        }

        this.time += dt;
        if(this.hitCooldown > 0) this.hitCooldown -= dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.shieldFlash > 0) this.shieldFlash -= dt;
        if(this.hullFlash > 0) this.hullFlash -= dt;
        if(this.salvoCooldown > 0) this.salvoCooldown -= dt;
        this.sinceHit += dt;

        if(this.sinceHit > SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.stats.shieldRegen * dt);
        }
        const targetLevel = this.shieldUp ? 1 : 0;
        this.shieldLevel += (targetLevel - this.shieldLevel) * Math.min(1, dt * (targetLevel ? 3 : 5));
        this.shieldImpacts.forEach(impact => { impact.life -= dt * 1.4; });
        this.shieldImpacts = this.shieldImpacts.filter(impact => impact.life > 0);

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
                const spread = (Math.random() - 0.5) * 0.3;
                const speed = (160 + Math.random() * 120) * Math.sqrt(engine.size);
                particles.push(new Particle({
                    x: nozzle.x,
                    y: nozzle.y,
                    vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                    vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                    life: 0.2 + Math.random() * 0.2,
                    size: (2 + Math.random() * 2) * Math.sqrt(engine.size),
                    color: this.hullDef.exhaust || '255,150,60'
                }));
            });
        }

        const jets = this.jetList;
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
            const reach = turret.kind === 'beam' ? Math.min(range, turret.module.stats.range) : range;
            turret.target = this.nearestRock(p.x, p.y, rocks, reach);
        });
    }

    updateTurrets(dt, input, world) {
        this.firing = false;
        this.minigunFiring = false;
        this.beaming = false;

        this.turrets.forEach(turret => {
            const stats = turret.module.stats;
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            if(turret.cooldown > 0) turret.cooldown -= dt;
            if(turret.flash > 0) turret.flash -= dt;
            turret.beam = null;

            // Minigun heat bleeds off continuously.
            if(turret.kind === 'minigun') {
                turret.heat = Math.max(0, turret.heat - HEAT_COOLING * dt);
                if(turret.overheated && turret.heat <= HEAT_RESUME) turret.overheated = false;
            }

            // Manual fire always aims at the cursor; otherwise the guidance computer
            // leads the locked target.
            let desired = Math.atan2(input.aimY - p.y, input.aimX - p.x);
            let shouldFire = input.firing;

            if(!input.firing && turret.target) {
                const target = turret.target;
                let d = delta(p, target);
                const speed = turret.kind === 'staff' ? PLASMA_SPEED : BULLET_SPEED;
                const time = turret.kind === 'beam' ? 0 : Math.sqrt(d.x * d.x + d.y * d.y) / speed;
                d = { x: d.x + target.vx * time, y: d.y + target.vy * time };
                desired = Math.atan2(d.y, d.x);
                shouldFire = true;
            }

            const diff = angleDifference(turret.aim, desired);
            const maxTurn = TURRET_TURN_RATE * dt;
            turret.aim += clamp(diff, -maxTurn, maxTurn);
            const aimed = Math.abs(diff) < 0.2;

            if(turret.kind === 'beam') {
                this.updateBeam(dt, turret, p, shouldFire && aimed, world);
                return;
            }

            if(!shouldFire || !aimed || turret.overheated) return;
            this.firing = true;
            if(turret.kind === 'minigun') this.minigunFiring = true;
            if(turret.cooldown > 0) return;

            if(turret.kind === 'minigun') this.fireMinigun(turret, p, stats, world);
            if(turret.kind === 'staff') this.fireStaff(turret, p, stats, world);
        });
    }

    fireMinigun(turret, p, stats, world) {
        turret.cooldown = Math.max(0, turret.cooldown) + 1 / stats.fireRate;

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
        sounds.minigunShot();
        if(Math.random() < 0.35) {
            world.particles.push(new Particle({
                x: p.x + Math.cos(turret.aim) * barrel, y: p.y + Math.sin(turret.aim) * barrel,
                vx: this.vx + dirX * 30 + (Math.random() - 0.5) * 20, vy: this.vy + dirY * 30 + (Math.random() - 0.5) * 20,
                life: 0.5 + Math.random() * 0.4, size: 4, color: '190,190,200', dust: true, alpha: 0.18
            }));
        }

        // Each round adds enough heat to outpace cooling, so sustained fire
        // overheats after `heatShots` rounds.
        turret.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(turret.heat >= 1) {
            turret.heat = 1;
            turret.overheated = true;
            sounds.overheat();
        }
    }

    fireStaff(turret, p, stats, world) {
        turret.cooldown = 1 / stats.fireRate;
        const dirX = Math.cos(turret.aim);
        const dirY = Math.sin(turret.aim);
        const barrel = 8 * this.hullDef.moduleScale;
        const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
        const speed = PLASMA_SPEED + inherited;

        world.bullets.push(new Bullet(
            p.x + dirX * barrel, p.y + dirY * barrel,
            dirX * speed, dirY * speed,
            stats.damage, 'plasma', stats.splash
        ));
        this.vx -= dirX * RECOIL * 6 / this.stats.mass;
        this.vy -= dirY * RECOIL * 6 / this.stats.mass;
        turret.flash = 0.14;
        // Plasma vented from the muzzle.
        for(let i = 0; i < 8; i++) {
            const a = turret.aim + (Math.random() - 0.5) * 1.2;
            const v = 60 + Math.random() * 140;
            world.particles.push(new Particle({
                x: p.x + dirX * barrel, y: p.y + dirY * barrel,
                vx: this.vx + Math.cos(a) * v, vy: this.vy + Math.sin(a) * v,
                life: 0.15 + Math.random() * 0.2, size: 3, color: i % 2 ? '255,200,90' : '255,120,40'
            }));
        }
        sounds.staffShot();
    }

    // Asgard beam: fires a burst for a few seconds, then must recharge.
    updateBeam(dt, turret, p, trigger, world) {
        const stats = turret.module.stats;

        if(turret.beamTime > 0 && !trigger) {
            // Released early: recharge for the part of the burst that was used.
            turret.cooldown = stats.cooldown * (1 - turret.beamTime / stats.burst);
            turret.beamTime = 0;
        }
        if(trigger && turret.beamTime <= 0 && turret.cooldown <= 0) turret.beamTime = stats.burst;
        if(turret.beamTime <= 0) return;

        turret.beamTime -= dt;
        if(turret.beamTime <= 0) {
            turret.beamTime = 0;
            turret.cooldown = stats.cooldown;
        }

        const dirX = Math.cos(turret.aim);
        const dirY = Math.sin(turret.aim);
        const startX = p.x + dirX * 6 * this.hullDef.moduleScale;
        const startY = p.y + dirY * 6 * this.hullDef.moduleScale;
        const hit = raycastRocks(startX, startY, dirX, dirY, stats.range, world.rocks);
        const endX = startX + dirX * hit.distance;
        const endY = startY + dirY * hit.distance;

        turret.beam = { x1: startX, y1: startY, x2: endX, y2: endY, hit: !!hit.rock };
        this.firing = true;
        this.beaming = true;

        if(hit.rock) {
            world.beamHits.push({ rock: hit.rock, damage: stats.dps * dt, x: endX, y: endY, dirX: dirX, dirY: dirY });
        }
    }

    pickLauncherTarget(input, rocks) {
        if(this.guidance) return this.missileLock;
        return null;
    }

    updateLaunchers(dt, input, world) {
        this.launchers.forEach(launcher => {
            if(launcher.cooldown > 0) launcher.cooldown -= dt;
            if(launcher.salvo) this.continueSalvo(launcher, input, world, dt);
        });

        if(!input.firingMissiles || this.salvoCooldown > 0 || this.launchers.length === 0) return;

        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const launcher = this.launchers[index];
            if(launcher.cooldown > 0) continue;

            if(launcher.kind === 'missile') this.fireMissile(launcher, input, world);
            if(launcher.kind === 'drones') this.fireDrones(launcher, input, world);

            this.salvoCooldown = SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    fireMissile(launcher, input, world) {
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
        sounds.missileLaunch();
    }

    // Ancient drones: a salvo of drones launched one after another in a stream.
    fireDrones(launcher, input, world) {
        const stats = launcher.module.stats;
        const target = this.missileLock || this.nearestRock(input.aimX, input.aimY, world.rocks, 450);
        launcher.salvo = { remaining: stats.count, timer: 0, target: target, index: 0 };
        launcher.cooldown = stats.cooldown;
    }

    continueSalvo(launcher, input, world, dt) {
        const salvo = launcher.salvo;
        salvo.timer -= dt;
        if(salvo.timer > 0) return;
        if(!this.alive || salvo.remaining <= 0) {
            launcher.salvo = null;
            return;
        }

        const stats = launcher.module.stats;
        const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
        const target = salvo.target && !salvo.target.dead ? salvo.target : null;
        const aimAt = target ? delta(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        // Each drone leaves on a slightly different heading, weaving towards the target.
        const weave = [0, -0.35, 0.35, -0.6, 0.6, 0][salvo.index % 6];
        const angle = Math.atan2(aimAt.y, aimAt.x) + weave;

        world.missiles.push(new Missile({
            kind: 'drone',
            x: p.x,
            y: p.y,
            vx: this.vx + Math.cos(angle) * 220,
            vy: this.vy + Math.sin(angle) * 220,
            angle: angle,
            damage: stats.damage,
            blast: stats.blast,
            target: target,
            homing: 7
        }));
        sounds.droneLaunch();

        salvo.remaining--;
        salvo.index++;
        salvo.timer = 0.11;
        if(salvo.remaining <= 0) launcher.salvo = null;
    }

    // Readiness of each weapon group for the HUD: 1 = ready.
    weaponStatus() {
        const groups = {};
        this.turrets.concat(this.launchers).forEach(w => {
            const def = MODULES[w.kind];
            if(!groups[w.kind]) groups[w.kind] = { name: def.short, color: def.color, ready: 0, count: 0, state: 'ready' };
            const g = groups[w.kind];
            const stats = w.module.stats;
            let ready = 1;
            let state = 'ready';

            if(w.kind === 'minigun') {
                ready = 1 - w.heat;
                state = w.overheated ? 'overheated' : (w.heat > 0.6 ? 'hot' : 'ready');
            } else if(w.kind === 'beam') {
                if(w.beamTime > 0) { ready = w.beamTime / stats.burst; state = 'firing'; }
                else if(w.cooldown > 0) { ready = 1 - w.cooldown / stats.cooldown; state = 'charging'; }
            } else if(w.cooldown > 0) {
                const total = w.kind === 'staff' ? 1 / stats.fireRate : stats.cooldown;
                ready = 1 - w.cooldown / total;
                state = 'reloading';
            }

            g.ready += clamp(ready, 0, 1);
            g.count++;
            if(state !== 'ready') g.state = state;
        });
        return Object.keys(groups).map(kind => {
            const g = groups[kind];
            return { kind: kind, name: g.name, color: g.color, ready: g.ready / g.count, count: g.count, state: g.state };
        });
    }

    // Returns true if damage was applied.
    takeDamage(amount, particles, hitX, hitY) {
        if(!this.alive || this.hitCooldown > 0 || this.immunity > 0) return false;

        this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;

        // Lowered shields don't absorb anything.
        const absorbed = this.shieldUp ? Math.min(this.shield, amount) : 0;
        this.shield -= absorbed;
        const remaining = amount - absorbed;
        if(absorbed > 0) {
            this.shieldFlash = 0.25;
            if(hitX !== undefined) this.shieldImpact(hitX, hitY, 1 + absorbed / 20);
            sounds.shieldHit();
        }

        if(remaining > 0) {
            this.hp -= remaining;
            this.hullFlash = 0.15;
            this.explode(particles, 10 + Math.round(remaining / 2));
            sounds.hullHit();
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
            sounds.explosion(1);
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

    drawThrusters(ctx) {
        const t = this.thrusters;
        const jetScale = this.hullDef.jetScale || 1;
        const exhaust = this.hullDef.exhaust || '255,150,60';
        const plume = flameSprite(exhaust, '255,235,190');
        const jetFlame = flameSprite('170,210,255', '255,255,255');
        const glow = glowSprite(exhaust);
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        this.engines.forEach(engine => {
            const size = engine.size;
            // Nozzle glow, pulsing even when idle.
            const glowSize = (2.5 + pulse + t.main * 3) * size * 3.2;
            ctx.globalAlpha = 0.55 + t.main * 0.45;
            stamp(ctx, glow, engine.x, engine.y, glowSize, glowSize);

            // Plume straight out of the nozzle, as wide as the nozzle.
            if(t.main > 0.03) {
                const length = t.main * (14 + Math.random() * 8) * size * 1.4;
                const width = 5.2 * size * (0.85 + Math.random() * 0.3);
                ctx.globalAlpha = 1;
                ctx.save();
                ctx.translate(engine.x, engine.y);
                ctx.rotate(Math.PI);
                ctx.drawImage(plume.canvas, 0, -width / 2, length, width);
                ctx.restore();
            }
        });

        // Manoeuvring jets on the hull edges: retro, strafe and attitude control.
        ctx.globalAlpha = 1;
        const jets = this.jetList;
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.02) return;
            const length = t[key] * 7 * jetScale;
            jets[key].forEach(jet => {
                ctx.save();
                ctx.translate(jet[0], jet[1]);
                ctx.rotate(Math.atan2(jet[3], jet[2]));
                ctx.drawImage(jetFlame.canvas, 0, -1.3 * jetScale, length * (0.8 + Math.random() * 0.4), 2.6 * jetScale);
                ctx.restore();
            });
        });

        ctx.restore();
    }

    drawShield(ctx) {
        const level = this.shieldLevel;
        if(this.maxShield <= 0 || level < 0.01) return;

        const s = shieldFor(this.hullDef);
        const sprite = shieldSprite(this.hullDef);
        const color = this.hullDef.shieldColor || '120,210,255';
        const strength = Math.max(0.15, this.shield / this.maxShield);
        // Bubble expands outwards when powering up and collapses when lowered.
        const grow = 0.7 + 0.3 * (1 - Math.pow(1 - level, 3));
        const flash = Math.max(0, this.shieldFlash) * 3;
        const shimmer = 0.85 + 0.15 * Math.sin(this.time * 3);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = Math.min(1, level * (0.35 + 0.65 * strength) * shimmer + flash);
        const w = sprite.width * grow;
        const h = sprite.height * grow;
        ctx.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);

        // Impact ripples: a flare at the hit point and a ring spreading over the bubble.
        if(this.shieldImpacts.length) {
            ctx.globalCompositeOperation = 'lighter';
            const glow = glowSprite(color);
            this.shieldImpacts.forEach(impact => {
                const ix = impact.x * grow;
                const iy = impact.y * grow;
                const size = (20 + 50 * impact.strength) * impact.life;
                ctx.globalAlpha = Math.min(1, impact.life * impact.strength);
                stamp(ctx, glow, ix, iy, size, size);
                ctx.globalAlpha = 0.7 * impact.life;
                ctx.strokeStyle = 'rgb(' + color + ')';
                ctx.lineWidth = 2 * impact.life + 0.5;
                ctx.beginPath();
                ctx.ellipse(ix, iy, 4 + (1 - impact.life) * s.rx * 0.6, 4 + (1 - impact.life) * s.ry * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
        ctx.restore();
    }

    // Beams are drawn in world space (after the ship transform is restored).
    drawBeams(ctx) {
        this.turrets.forEach(turret => {
            const beam = turret.beam;
            if(!beam) return;
            const flicker = 0.75 + Math.random() * 0.25;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            [[9, 'rgba(90, 170, 255, 0.18)'], [4, 'rgba(140, 210, 255, 0.55)'], [1.6, 'rgba(240, 250, 255, 0.95)']].forEach(layer => {
                ctx.lineWidth = layer[0] * flicker * this.hullDef.moduleScale;
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(beam.x1, beam.y1);
                ctx.lineTo(beam.x2, beam.y2);
                ctx.stroke();
            });
            // Energy pulses racing down the beam.
            ctx.setLineDash([6, 14]);
            ctx.lineDashOffset = -this.time * 900;
            ctx.lineWidth = 3 * this.hullDef.moduleScale;
            ctx.strokeStyle = 'rgba(220, 245, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(beam.x1, beam.y1);
            ctx.lineTo(beam.x2, beam.y2);
            ctx.stroke();
            ctx.setLineDash([]);
            stamp(ctx, glowSprite('140,210,255'), beam.x1, beam.y1, 16 * flicker, 16 * flicker);
            if(beam.hit) {
                // Molten contact point.
                stamp(ctx, glowSprite('120,190,255'), beam.x2, beam.y2, 40 * flicker, 40 * flicker);
                stamp(ctx, glowSprite('255,190,120'), beam.x2, beam.y2, 18 * flicker, 18 * flicker);
            }
            ctx.restore();
        });
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
        const hull = hullSprite(this.hullDef, this.hullFlash > 0 ? '255,120,120' : undefined);
        ctx.drawImage(hull.canvas, hull.x, hull.y, hull.width, hull.height);

        this.stats.modules.forEach(module => {
            if(TURRET_TYPES.indexOf(module.type) !== -1) return;
            ctx.save();
            ctx.translate(module.slot.x, module.slot.y);
            drawModule(ctx, module.type, module.level, { scale: u, glow: 0 });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            drawModule(ctx, turret.kind, turret.module.level, {
                scale: u,
                glow: 0,
                aim: turret.aim - this.angle,
                heat: turret.kind === 'minigun' ? turret.heat : 0
            });
            if(turret.flash > 0) {
                const tip = 9 * u;
                const color = turret.kind === 'staff' ? '255, 190, 90' : '255, 230, 150';
                if(turret.kind === 'staff') {
                    // Large plasma bloom at the cannon mouth.
                    const fx = Math.cos(turret.aim - this.angle) * tip;
                    const fy = Math.sin(turret.aim - this.angle) * tip;
                    ctx.globalCompositeOperation = 'lighter';
                    const bloom = 16 + 20 * turret.flash / 0.14;
                    stamp(ctx, glowSprite('255,150,50'), fx, fy, bloom, bloom);
                }
                // Star-shaped muzzle flash pointing down the barrel, flickering in size.
                ctx.globalCompositeOperation = 'lighter';
                ctx.rotate(turret.aim - this.angle);
                const flashSize = (turret.kind === 'staff' ? 30 : 18 + Math.random() * 10) * Math.max(0.8, u);
                ctx.drawImage(muzzleSprite(color.replace(/ /g, '')).canvas, tip - flashSize * 0.25, -flashSize * 0.25, flashSize, flashSize * 0.5);
            }
            ctx.restore();
        });

        this.drawShield(ctx);
        ctx.restore();

        this.drawBeams(ctx);
    }
}

export default Ship;
