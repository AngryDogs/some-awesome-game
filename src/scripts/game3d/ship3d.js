// A ship flying freely in 3D (six degrees of freedom): the same hulls, modules and stats as
// the shipyard, with zero-g Newtonian flight, an optional stabilizer, turrets that aim
// anywhere around the ship, missiles and drones, and shields that soak kinetic hits.
//
// Ship-local frame (matches the hull models): +X forward (bow), +Z up, -Y starboard.
// Hull line art (x, y) maps to local (x, -y).

import MODULES from '../shipyard/modules';
import { shieldFor } from '../shipyard/hulls';
import { buildHullGeometries } from '../render3d/scene3d';
import { DAMAGE_TYPE, TARGET_MODES } from '../components/ship/ship';
import sounds from '../audio/audio';

const SECONDARY = 0.6;          // retro / strafe / lift thrust relative to the main engines
const MAX_SPEED = 700;
const MASS_UNIT = 300;
export const BULLET_SPEED = 1400;
export const PLASMA_SPEED = 650;
const SPREAD = 0.012;
const HEAT_COOLING = 0.35;
const HEAT_RESUME = 0.3;
const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SHIELD_FLASH_TIME = 0.35;
const SHIELD_FACTOR = { kinetic: 0.5, energy: 1.5 };
const HULL_FACTOR = { kinetic: 1.25, energy: 0.6 };
const TURRET_TYPES = ['minigun', 'staff', 'beam'];
const LAUNCHER_TYPES = ['missile', 'drones'];
const SALVO_GAP = 0.12;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Hull models are shared by every ship of a type.
const hullGeometryCache = {};
const hullEdgeCache = {};

const shieldShader = (THREE, color) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255) }, uLevel: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'varying vec3 vPos;',
        'void main() {',
        '    vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '    vNormal = normalize(normalMatrix * normal);',
        '    vView = normalize(-mv.xyz);',
        '    vPos = position;',
        '    gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n'),
    fragmentShader: [
        'uniform vec3 uColor;',
        'uniform float uLevel;',
        'uniform float uFlash;',
        'varying vec3 vNormal;',
        'varying vec3 vView;',
        'varying vec3 vPos;',
        'void main() {',
        '    float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.2);',
        // Faint hexagonal-ish lattice from the surface position.
        '    vec3 p = vPos * 0.18;',
        '    float lattice = smoothstep(0.92, 1.0, max(abs(sin(p.x * 3.1 + p.y * 1.8)), abs(sin(p.y * 3.1 - p.z * 1.8))));',
        '    float a = (rim * 0.55 + lattice * 0.08) * uLevel + uFlash * (0.35 + rim * 0.65);',
        '    gl_FragColor = vec4(uColor * a, a);',
        '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});

export default class Ship3D {

    constructor(THREE, stats, side, glowTexture) {
        this.THREE = THREE;
        this.side = side || 'player';
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.angular = new THREE.Vector3();      // local angular velocity (roll, about Y, about Z)
        this.alive = true;
        this.hidden = false;
        this.stabilizer = side === 'player';
        this.shieldsEnabled = true;
        this.weaponsOff = {};
        this.autoTarget = true;
        this.targetMode = 'both';
        this.damageScale = 1;
        this.immunity = 1.5;
        this.hitCooldown = 0;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.salvoCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;
        this.time = 0;
        this.thrustLevel = 0;
        this.firing = false;
        this.minigunFiring = false;
        this.beaming = false;
        this.glowTexture = glowTexture;
        this.tmp = new THREE.Vector3();
        this.tmp2 = new THREE.Vector3();
        this.applyStats(stats);
        this.hp = this.maxHull;
        this.shield = this.maxShield;
    }

    get x() { return this.position.x; }
    get y() { return this.position.y; }
    get z() { return this.position.z; }
    get vx() { return this.velocity.x; }
    get vy() { return this.velocity.y; }
    get vz() { return this.velocity.z; }
    get dead() { return !this.alive; }
    get shieldUp() { return this.shieldsEnabled && this.alive && this.maxShield > 0 && this.shield > 0.5; }
    get thrusting() { return this.thrustLevel > 0.15; }

    applyStats(stats) {
        const THREE = this.THREE;
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
        this.hyperdrive = stats.hyperdrive;
        this.cargoCapacity = stats.cargo;
        this.magnetRange = stats.magnetRange + Math.max(0, hull.radius - 30) * 0.8 + 40;
        this.collectRadius = hull.radius * 0.6 + 12;
        const s = shieldFor(hull);
        this.shieldShape = { x: s.x, y: -s.y, rx: s.rx, ry: s.ry, rz: Math.max(8, Math.min(s.rx, s.ry) * 0.7) };
        this.turrets = stats.modules.filter(m => TURRET_TYPES.indexOf(m.type) !== -1).map(m => ({
            module: m, kind: m.type, local: new THREE.Vector3(m.slot.x, -m.slot.y, 2 * hull.moduleScale),
            aim: new THREE.Vector3(1, 0, 0), cooldown: 0, target: null, heat: 0, overheated: false, beamTime: 0, beam: null
        }));
        this.launchers = stats.modules.filter(m => LAUNCHER_TYPES.indexOf(m.type) !== -1)
            .map(m => ({ module: m, kind: m.type, local: new THREE.Vector3(m.slot.x, -m.slot.y, 1), cooldown: 0, salvo: null }));
        this.colliders = hull.colliders.map(c => ({ local: new THREE.Vector3(c[0], -c[1], 0), r: c[2] }));
        this.buildModel();
    }

    // ------------------------------------------------------------ model

    buildModel() {
        const THREE = this.THREE;
        const hull = this.hullDef;
        if(this.group && this.group.parent) this.group.parent.remove(this.group);
        const group = new THREE.Group();
        if(!hullGeometryCache[hull.id]) {
            hullGeometryCache[hull.id] = buildHullGeometries(THREE, hull);
            hullEdgeCache[hull.id] = hullGeometryCache[hull.id].map(g => new THREE.EdgesGeometry(g, 35));
        }
        const color = hull.color.split(',').map(v => parseFloat(v) / 255);
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.1 + color[0] * 0.32, 0.11 + color[1] * 0.32, 0.13 + color[2] * 0.34),
            metalness: 0.4, roughness: 0.42, emissive: new THREE.Color(0, 0, 0)
        });
        this.edgeMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(color[0], color[1], color[2]), transparent: true, opacity: 0.85 });
        const model = new THREE.Group();
        hullGeometryCache[hull.id].forEach(g => model.add(new THREE.Mesh(g, this.bodyMaterial)));
        hullEdgeCache[hull.id].forEach(g => model.add(new THREE.LineSegments(g, this.edgeMaterial)));
        // The hull models are built "top down"; centre them vertically around the ship.
        model.position.z = hull.radius * 0.08;
        group.add(model);

        // Modules: turrets with barrels that swing to their target, other modules as blocks.
        const u = hull.moduleScale;
        this.turretPivots = [];
        this.stats.modules.forEach(m => {
            const mc = MODULES[m.type].color.split(',').map(v => parseFloat(v) / 255);
            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(mc[0] * 0.6, mc[1] * 0.6, mc[2] * 0.6), emissive: new THREE.Color(mc[0] * 0.35, mc[1] * 0.35, mc[2] * 0.35), metalness: 0.5, roughness: 0.4 });
            const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2 * u, 3.8 * u, 2.2 * u, 10), mat);
            base.rotation.x = Math.PI / 2;
            base.position.set(m.slot.x, -m.slot.y, 1.5 * u + model.position.z);
            group.add(base);
            const turret = this.turrets.filter(t => t.module === m)[0];
            if(turret) {
                const pivot = new THREE.Object3D();
                pivot.position.copy(base.position);
                pivot.position.z += 1.6 * u;
                const barrel = new THREE.Mesh(new THREE.BoxGeometry(9 * u, (m.type === 'minigun' ? 1.6 : 2.4) * u, 1.6 * u), mat);
                barrel.position.x = 4.5 * u;
                pivot.add(barrel);
                group.add(pivot);
                turret.pivot = pivot;
                turret.local.copy(pivot.position);
            }
        });

        // Engine glows (bigger and brighter with thrust).
        this.engineGlows = [];
        const exhaust = (hull.exhaust || '255,150,60').split(',').map(v => parseFloat(v) / 255);
        hull.engines.forEach(e => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.glowTexture, color: new THREE.Color(exhaust[0], exhaust[1], exhaust[2]),
                blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
            }));
            sprite.position.set(e.x - 2 * e.size, -e.y, model.position.z);
            sprite.userData.size = e.size;
            group.add(sprite);
            this.engineGlows.push(sprite);
        });

        // Shield bubble.
        const shieldColor = (hull.shieldColor || '120,210,255').split(',').map(Number);
        this.shieldMaterial = shieldShader(THREE, shieldColor);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 20), this.shieldMaterial);
        bubble.scale.set(this.shieldShape.rx, this.shieldShape.ry, this.shieldShape.rz);
        bubble.position.set(this.shieldShape.x, this.shieldShape.y, model.position.z);
        bubble.renderOrder = 3;
        group.add(bubble);
        this.bubble = bubble;
        this.group = group;
    }

    syncModel() {
        const g = this.group;
        const blink = this.immunity > 0 && this.side === 'player' && Math.floor(this.immunity * 10) % 2 === 0;
        g.visible = this.alive && !this.hidden && !blink;
        g.position.copy(this.position);
        g.quaternion.copy(this.quaternion);
        this.shieldLevel = (this.shieldLevel || 0) + ((this.shieldUp ? 1 : 0) - (this.shieldLevel || 0)) * 0.15;
        this.shieldMaterial.uniforms.uLevel.value = this.shieldLevel * (0.4 + 0.6 * Math.max(0.2, this.shield / (this.maxShield || 1)));
        this.shieldMaterial.uniforms.uFlash.value = Math.max(0, this.shieldFlash / SHIELD_FLASH_TIME) * (this.shieldUp ? 1 : 0.3);
        this.bubble.visible = this.shieldLevel > 0.02 || this.shieldFlash > 0;
        this.bodyMaterial.emissive.setRGB(this.hullFlash > 0 ? 0.6 : 0, this.hullFlash > 0 ? 0.08 : 0, this.hullFlash > 0 ? 0.05 : 0);
        const flicker = 0.85 + Math.random() * 0.3;
        this.engineGlows.forEach(s => {
            const k = (0.25 + this.thrustLevel * 1.1) * flicker;
            const size = s.userData.size * 18 * k;
            s.scale.set(size, size, size);
            s.material.opacity = Math.min(1, 0.35 + this.thrustLevel);
        });
        this.turrets.forEach(t => {
            if(!t.pivot) return;
            // Barrel direction in ship-local space.
            this.tmp.copy(t.aim).applyQuaternion(this.invQuat());
            t.pivot.quaternion.setFromUnitVectors(this.tmp2.set(1, 0, 0), this.tmp.normalize());
        });
    }

    invQuat() {
        if(!this._inv) this._inv = new this.THREE.Quaternion();
        return this._inv.copy(this.quaternion).invert();
    }

    // ------------------------------------------------------------ frame of reference

    localToWorld(local, out) {
        return (out || new this.THREE.Vector3()).copy(local).applyQuaternion(this.quaternion).add(this.position);
    }

    axis(x, y, z, out) {
        return (out || new this.THREE.Vector3()).set(x, y, z).applyQuaternion(this.quaternion);
    }

    forward(out) { return this.axis(1, 0, 0, out); }
    up(out) { return this.axis(0, 0, 1, out); }
    right(out) { return this.axis(0, -1, 0, out); }

    worldColliders() {
        return this.colliders.map(c => ({ p: this.localToWorld(c.local), r: c.r }));
    }

    // Point (radius r) against the shield ellipsoid. Returns contact info or null.
    shieldContact(point, r) {
        const THREE = this.THREE;
        const local = this.tmp.copy(point).sub(this.position).applyQuaternion(this.invQuat());
        const s = this.shieldShape;
        const lx = (local.x - s.x) / s.rx;
        const ly = (local.y - s.y) / s.ry;
        const lz = local.z / s.rz;
        const k = Math.sqrt(lx * lx + ly * ly + lz * lz) || 0.0001;
        const scale = (s.rx + s.ry + s.rz) / 3;
        const gap = (k - 1) * scale;
        if(gap > r) return null;
        const normal = new THREE.Vector3(lx / (s.rx * k), ly / (s.ry * k), lz / (s.rz * k)).normalize().applyQuaternion(this.quaternion);
        return { normal: normal, overlap: r - gap };
    }

    // ------------------------------------------------------------ flight

    // controls: { thrust, strafe, lift, pitch, yaw, roll } each -1..1, plus weapons:
    // { fire, missiles, aimPoint (world Vector3), lockTarget }.
    update(dt, controls, world) {
        if(!this.alive) {
            this.firing = this.minigunFiring = this.beaming = false;
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
        this.fly(dt, controls);
        this.updateTargeting(controls, world);
        this.updateTurrets(dt, controls, world);
        this.updateLaunchers(dt, controls, world);
    }

    fly(dt, c) {
        const stats = this.stats;
        const THREE = this.THREE;
        const maxTurn = stats.maxTurn;
        const accel = stats.angularAcceleration * 1.2;
        // Rotation: the controls set a wanted turn rate, the thrusters chase it.
        const want = [clamp(c.roll || 0, -1, 1) * maxTurn * 1.3, -clamp(c.pitch || 0, -1, 1) * maxTurn, -clamp(c.yaw || 0, -1, 1) * maxTurn];
        const w = this.angular;
        ['x', 'y', 'z'].forEach((k, i) => {
            const diff = want[i] - w[k];
            w[k] += clamp(diff, -accel * dt, accel * dt);
        });
        const angle = w.length() * dt;
        if(angle > 1e-6) {
            const dq = this.dq || (this.dq = new THREE.Quaternion());
            dq.setFromAxisAngle(this.tmp.copy(w).normalize(), angle);
            this.quaternion.multiply(dq).normalize();
        }

        // Thrust in the ship's frame.
        const main = stats.acceleration;
        const side = main * SECONDARY;
        const thrust = clamp(c.thrust || 0, -1, 1);
        const lx = thrust > 0 ? thrust * main : thrust * side;
        const ly = -clamp(c.strafe || 0, -1, 1) * side;
        const lz = clamp(c.lift || 0, -1, 1) * side;
        const force = this.tmp.set(lx, ly, lz).applyQuaternion(this.quaternion);
        this.thrustLevel += ((thrust > 0 ? thrust : 0) - this.thrustLevel) * Math.min(1, dt * 8);

        // Stabilizer: cancel any drift the pilot isn't asking for (and brake to a stop with
        // no input), like the flight assist of a real spacecraft.
        if(this.stabilizer) {
            const drift = this.tmp2.copy(this.velocity);
            const commanded = force.length();
            if(commanded > 0) {
                const dir = force.clone().divideScalar(commanded);
                const along = Math.max(0, drift.dot(dir));
                drift.addScaledVector(dir, -along);
            }
            const d = drift.length();
            if(d > 1) force.addScaledVector(drift, -Math.min(side, d / dt) / d);
        }
        this.velocity.addScaledVector(force, dt);
        const speed = this.velocity.length();
        if(speed > MAX_SPEED) this.velocity.multiplyScalar(MAX_SPEED / speed);
        this.position.addScaledVector(this.velocity, dt);
    }

    // ------------------------------------------------------------ weapons

    nearestOf(point, list, range) {
        let best = null;
        let bestDist = Infinity;
        for(let i = 0; i < list.length; i++) {
            const item = list[i];
            if(item.dead) continue;
            const dx = item.x - point.x, dy = item.y - point.y, dz = item.z - point.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - (item.hullDef ? item.radius * 0.8 : item.radius || 0);
            if(dist < range && dist < bestDist) {
                bestDist = dist;
                best = item;
            }
        }
        return best;
    }

    // Guidance: turret targets and the missile lock. Point defence first, then ships, then
    // asteroids, following the targeting mode.
    updateTargeting(c, world) {
        if(!this.guidance) {
            this.missileLock = null;
            this.turrets.forEach(t => { t.target = null; });
            return;
        }
        const range = this.guidance.range + this.radius;
        const combat = world.combat;
        const ships = this.targetMode !== 'asteroids' ? combat.hostileShips(this.side) : [];
        const rocks = this.targetMode === 'ships' ? [] : world.rocks;
        const incoming = combat.hostileMissiles(this.side, 'missile').filter(m => {
            const dx = this.x - m.x, dy = this.y - m.y, dz = this.z - m.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return d < 450 + this.radius && (m.vx * dx + m.vy * dy + m.vz * dz) / (d || 1) > 100;
        });
        const aim = c.aimPoint || this.position;
        this.missileLock = (c.aimTarget && c.aimTarget.hullDef && ships.indexOf(c.aimTarget) !== -1 ? c.aimTarget : null)
            || this.nearestOf(aim, ships, 250)
            || (c.aimTarget && !c.aimTarget.hullDef && rocks.length ? c.aimTarget : null)
            || this.nearestOf(this.position, ships, range * 1.8)
            || this.nearestOf(this.position, rocks, range);
        this.turrets.forEach(t => {
            if(!this.autoTarget) {
                t.target = null;
                return;
            }
            const p = this.localToWorld(t.local, this.tmp);
            const reach = t.kind === 'beam' ? Math.min(range, t.module.stats.range) : range;
            const shipReach = t.kind === 'beam' ? t.module.stats.range : Math.max(range, 800);
            t.target = (t.kind === 'minigun' && this.nearestOf(p, incoming, reach))
                || this.nearestOf(p, ships, shipReach)
                || this.nearestOf(p, rocks, reach);
        });
    }

    updateTurrets(dt, c, world) {
        const THREE = this.THREE;
        this.firing = this.minigunFiring = this.beaming = false;
        this.turrets.forEach(t => {
            if(t.cooldown > 0) t.cooldown -= dt;
            t.beam = null;
            if(t.kind === 'minigun') {
                t.heat = Math.max(0, t.heat - HEAT_COOLING * dt);
                if(t.overheated && t.heat <= HEAT_RESUME) t.overheated = false;
            }
            const enabled = !this.weaponsOff[t.kind];
            const p = this.localToWorld(t.local);
            let aimPoint = c.aimPoint;
            let shouldFire = !!c.fire && enabled;
            if(!c.fire && t.target && enabled) {
                // Lead the target for the shot's travel time.
                const target = t.target;
                const speed = t.kind === 'staff' ? PLASMA_SPEED : BULLET_SPEED;
                const d = Math.sqrt((target.x - p.x) * (target.x - p.x) + (target.y - p.y) * (target.y - p.y) + (target.z - p.z) * (target.z - p.z));
                const time = t.kind === 'beam' ? 0 : d / speed;
                aimPoint = new THREE.Vector3(target.x + (target.vx || 0) * time, target.y + (target.vy || 0) * time, target.z + (target.vz || 0) * time);
                shouldFire = true;
            }
            if(aimPoint) t.aim.copy(aimPoint).sub(p).normalize();
            else t.aim.copy(this.forward(this.tmp2));
            if(t.kind === 'beam') {
                this.updateBeam(dt, t, p, shouldFire && !!aimPoint, world);
                return;
            }
            if(!shouldFire || !aimPoint || t.overheated) return;
            this.firing = true;
            if(t.kind === 'minigun') this.minigunFiring = true;
            if(t.cooldown > 0) return;
            if(t.kind === 'minigun') this.fireMinigun(t, p, world);
            else this.fireStaff(t, p, world);
        });
    }

    shotVelocity(dir, speed) {
        // Shots inherit the ship's speed along the line of fire, not its sideways drift.
        const inherited = Math.max(0, this.velocity.dot(dir));
        return dir.clone().multiplyScalar(speed + inherited);
    }

    jitter(dir, amount) {
        const THREE = this.THREE;
        const d = dir.clone();
        d.x += (Math.random() - 0.5) * 2 * amount;
        d.y += (Math.random() - 0.5) * 2 * amount;
        d.z += (Math.random() - 0.5) * 2 * amount;
        return d.normalize();
    }

    fireMinigun(t, p, world) {
        const stats = t.module.stats;
        t.cooldown = Math.max(0, t.cooldown) + 1 / stats.fireRate;
        const dir = this.jitter(t.aim, SPREAD);
        const barrel = 9 * this.hullDef.moduleScale;
        const v = this.shotVelocity(dir, BULLET_SPEED);
        world.bullets.push({ kind: 'bullet', x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: v.x, vy: v.y, vz: v.z, damage: stats.damage * this.damageScale, side: this.side, life: 1.6, age: 0, mass: 1.2 });
        this.velocity.addScaledVector(dir, -0.8 / this.stats.mass);
        world.effects.spawn({ x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: this.vx, vy: this.vy, vz: this.vz, life: 0.05, size: 7 * this.hullDef.moduleScale, color: '255,220,150' });
        if(this.side === 'player' || Math.random() < 0.3) sounds.minigunShot();
        t.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(t.heat >= 1) {
            t.heat = 1;
            t.overheated = true;
            if(this.side === 'player') sounds.overheat();
        }
    }

    fireStaff(t, p, world) {
        const stats = t.module.stats;
        t.cooldown = 1 / stats.fireRate;
        const dir = t.aim.clone();
        const barrel = 8 * this.hullDef.moduleScale;
        const v = this.shotVelocity(dir, PLASMA_SPEED);
        world.bullets.push({ kind: 'plasma', x: p.x + dir.x * barrel, y: p.y + dir.y * barrel, z: p.z + dir.z * barrel,
            vx: v.x, vy: v.y, vz: v.z, damage: stats.damage * this.damageScale, splash: stats.splash, side: this.side, life: 2.4, age: 0, mass: 30 });
        this.velocity.addScaledVector(dir, -4.8 / this.stats.mass);
        world.effects.burst(p, this.velocity, 6, { minSpeed: 40, maxSpeed: 140, minLife: 0.12, maxLife: 0.3, size: 4, color: '255,170,60', dir: dir, cone: 0.7 });
        sounds.staffShot();
    }

    updateBeam(dt, t, p, trigger, world) {
        const stats = t.module.stats;
        if(t.beamTime > 0 && !trigger) {
            t.cooldown = stats.cooldown * (1 - t.beamTime / stats.burst);
            t.beamTime = 0;
        }
        if(trigger && t.beamTime <= 0 && t.cooldown <= 0) t.beamTime = stats.burst;
        if(t.beamTime <= 0) return;
        t.beamTime -= dt;
        if(t.beamTime <= 0) {
            t.beamTime = 0;
            t.cooldown = stats.cooldown;
        }
        const hit = world.raycast(p, t.aim, stats.range, this.side);
        const end = p.clone().addScaledVector(t.aim, hit.distance);
        t.beam = { from: p.clone(), to: end, hit: !!hit.object };
        this.firing = this.beaming = true;
        if(hit.object) world.beamHits.push({ object: hit.object, damage: stats.dps * dt * this.damageScale, point: end, dir: t.aim.clone() });
    }

    updateLaunchers(dt, c, world) {
        this.launchers.forEach(l => {
            if(l.cooldown > 0) l.cooldown -= dt;
            if(l.salvo) this.continueSalvo(l, c, world, dt);
        });
        if(!c.missiles || this.salvoCooldown > 0 || !this.launchers.length) return;
        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const l = this.launchers[index];
            if(l.cooldown > 0 || this.weaponsOff[l.kind]) continue;
            if(l.kind === 'missile') this.fireMissile(l, c, world);
            else this.fireDrones(l, c, world);
            this.salvoCooldown = SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    missileTarget(c, world) {
        if(c.lockTarget) return c.lockTarget;
        if(this.guidance) return this.missileLock;
        // Without a targeting computer, missiles go for whatever is under the crosshair.
        return c.aimTarget || null;
    }

    fireMissile(l, c, world) {
        const stats = l.module.stats;
        const p = this.localToWorld(l.local);
        const target = this.missileTarget(c, world);
        const dir = target ? new this.THREE.Vector3(target.x - p.x, target.y - p.y, target.z - p.z).normalize()
            : (c.aimPoint ? c.aimPoint.clone().sub(p).normalize() : this.forward());
        const v = this.velocity.clone().addScaledVector(dir, 140);
        world.missiles.push({ kind: 'missile', x: p.x, y: p.y, z: p.z, vx: v.x, vy: v.y, vz: v.z, dir: dir,
            damage: stats.damage * this.damageScale, blast: stats.blast, target: target,
            homing: this.guidance ? this.guidance.homing : (target ? 2.6 : 0), side: this.side, life: 5, targetMode: this.targetMode });
        l.cooldown = stats.cooldown;
        sounds.missileLaunch();
    }

    fireDrones(l, c, world) {
        const stats = l.module.stats;
        const drones = world.combat.hostileMissiles(this.side, 'drone');
        const target = this.nearestOf(this.position, drones, 1000) || this.missileTarget(c, world)
            || (this.targetMode !== 'asteroids' ? this.nearestOf(this.position, world.combat.hostileShips(this.side), 1500) : null);
        l.salvo = { remaining: stats.count, timer: 0, target: target, index: 0 };
        l.cooldown = stats.cooldown;
    }

    continueSalvo(l, c, world, dt) {
        const s = l.salvo;
        s.timer -= dt;
        if(s.timer > 0) return;
        if(!this.alive || s.remaining <= 0) {
            l.salvo = null;
            return;
        }
        const stats = l.module.stats;
        const p = this.localToWorld(l.local);
        const target = s.target && !s.target.dead ? s.target : null;
        // Drones leave in a spread around the launch direction and weave in.
        const base = target ? new this.THREE.Vector3(target.x - p.x, target.y - p.y, target.z - p.z).normalize() : this.forward();
        const dir = this.jitter(base, 0.45);
        const v = this.velocity.clone().addScaledVector(dir, 240);
        world.missiles.push({ kind: 'drone', x: p.x, y: p.y, z: p.z, vx: v.x, vy: v.y, vz: v.z, dir: dir,
            damage: stats.damage * this.damageScale, blast: stats.blast, target: target, homing: 7, side: this.side, life: 7, targetMode: this.targetMode });
        sounds.droneLaunch();
        s.remaining--;
        s.index++;
        s.timer = 0.11;
        if(s.remaining <= 0) l.salvo = null;
    }

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
            const off = !!this.weaponsOff[kind];
            return { kind: kind, name: g.name, color: g.color, ready: g.ready / g.count, count: g.count, state: off ? 'off' : g.state, off: off };
        });
    }

    toggleWeapon(kind) {
        this.weaponsOff[kind] = !this.weaponsOff[kind];
        return !this.weaponsOff[kind];
    }

    cycleTargetMode() {
        this.targetMode = TARGET_MODES[(TARGET_MODES.indexOf(this.targetMode) + 1) % TARGET_MODES.length];
        return this.targetMode;
    }

    toggleShields() {
        this.shieldsEnabled = !this.shieldsEnabled;
        if(this.shieldsEnabled) sounds.shieldUp();
        else sounds.shieldDown();
    }

    // ------------------------------------------------------------ damage

    // `type` ('kinetic' / 'energy') marks a weapon hit (no knock cooldown, resistances
    // apply); `quiet` skips sounds for continuous beams. Returns { shield, hull } absorbed.
    takeDamage(amount, type, quiet) {
        if(!this.alive || this.immunity > 0) return null;
        if(!type && this.hitCooldown > 0) return null;
        if(!type) this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;
        const shieldFactor = type ? SHIELD_FACTOR[type] : 1;
        const hullFactor = type ? HULL_FACTOR[type] : 1;
        let remaining = amount;
        let onShield = 0;
        if(this.shieldUp) {
            onShield = Math.min(amount, this.shield / shieldFactor);
            this.shield = Math.max(0, this.shield - onShield * shieldFactor);
            remaining = amount - onShield;
            if(onShield > 0) {
                this.shieldFlash = SHIELD_FLASH_TIME;
                if(!quiet || Math.random() < 0.08) sounds.shieldHit(type ? 1 + onShield / 25 : 0.4 + onShield / 25);
            }
        }
        if(remaining > 0) {
            this.hp -= remaining * hullFactor;
            this.hullFlash = 0.15;
            if(!quiet || Math.random() < 0.08) sounds.hullHit();
        }
        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            sounds.shipExplosion();
        }
        return { shield: onShield, hull: remaining };
    }
}

export { DAMAGE_TYPE };
