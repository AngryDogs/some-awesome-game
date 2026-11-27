// Enemy ships in 3D: the same hulls and faction fits as before, flown by an AI pilot that
// steers in all three dimensions.

import Ship3D, { BULLET_SPEED, PLASMA_SPEED } from './ship3d';
import HULLS from '../shipyard/hulls';
import { computeShipStats } from '../shipyard/profile';
import { enemyLoadout, ENEMY_DAMAGE } from '../components/ship/enemy';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const createEnemy3D = (THREE, hullId, level, position, glowTexture) => {
    const hull = HULLS[hullId];
    const ship = new Ship3D(THREE, computeShipStats(hullId, enemyLoadout(hull, level)), 'enemy', glowTexture);
    ship.position.copy(position);
    ship.damageScale = ENEMY_DAMAGE;
    ship.autoTarget = false;
    ship.stabilizer = true;
    ship.immunity = 0.6;
    ship.level = level;
    const kinds = ship.turrets.map(t => t.kind).concat(ship.launchers.map(l => l.kind));
    ship.ai = {
        controls: { thrust: 0, strafe: 0, lift: 0, pitch: 0, yaw: 0, roll: 0, fire: false, missiles: false, aimPoint: null, lockTarget: null },
        mode: 'attack', modeTimer: 0, orbit: Math.random() < 0.5 ? 1 : -1, orbitTimer: 3 + Math.random() * 3,
        missileTimer: 1.5 + Math.random() * 2, evadeTimer: 0, aimError: new THREE.Vector3(),
        range: (kinds.indexOf('beam') !== -1 ? 380 : kinds.indexOf('staff') !== -1 || kinds.indexOf('minigun') !== -1 ? 450 : 700) + hull.radius * 1.2,
        gunReach: (kinds.indexOf('beam') !== -1 ? 650 : kinds.indexOf('staff') !== -1 ? 750 : 850) + hull.radius * 0.5,
        projectileSpeed: kinds.indexOf('staff') !== -1 ? PLASMA_SPEED : BULLET_SPEED
    };
    ship.bounty = Math.round((150 + hull.cost * 0.12) * (level === 3 ? 1.5 : 1));
    return ship;
};

// Turn towards world direction `dir`: yaw / pitch controls proportional to the error in the
// ship's own frame (the flight model turns them into turn rates). Returns the angle off.
const steer = (ship, c, dir) => {
    const local = dir.clone().applyQuaternion(ship.invQuat());
    const yawError = Math.atan2(-local.y, local.x);
    const pitchError = Math.atan2(local.z, Math.sqrt(local.x * local.x + local.y * local.y));
    c.yaw = clamp(yawError * 2.2, -1, 1);
    c.pitch = clamp(pitchError * 2.2, -1, 1);
    c.roll = 0;
    return Math.acos(clamp(local.x / (local.length() || 1), -1, 1));
};

// One AI tick. `world` gives the target (player or null), rocks, the player's missiles,
// the other enemies and an optional { position, radius } to keep out of (Atlantis).
export const updateEnemyAI3D = (THREE, ship, dt, world) => {
    const ai = ship.ai;
    const c = ai.controls;
    c.thrust = c.strafe = c.lift = 0;
    c.fire = c.missiles = false;
    c.lockTarget = null;
    if(!ship.alive) return;
    const target = world.target;
    const fighter = ship.radius < 45;
    ai.modeTimer -= dt;
    ai.evadeTimer -= dt;
    ai.orbitTimer -= dt;
    if(ai.orbitTimer <= 0) {
        ai.orbit = -ai.orbit;
        ai.orbitTimer = 3 + Math.random() * 4;
        ai.aimError.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05);
    }

    if(world.avoid) {
        const away = ship.position.clone().sub(world.avoid.position);
        if(away.length() < world.avoid.radius + ship.radius) {
            steer(ship, c, away.normalize());
            c.thrust = 1;
            return;
        }
    }
    if(!target) {
        c.yaw = c.pitch = c.roll = 0;
        return;
    }

    const toTarget = new THREE.Vector3(target.x - ship.x, target.y - ship.y, target.z - ship.z);
    const distance = toTarget.length() || 1;
    const dir = toTarget.clone().divideScalar(distance);
    const range = ai.range;

    // Badly damaged: withdraw until the shields are back.
    if(ai.mode !== 'retreat' && ship.hp / ship.maxHull < 0.3 && ship.maxShield > 0 && !ai.retreated) {
        ai.mode = 'retreat';
        ai.modeTimer = 8 + Math.random() * 4;
        ai.retreated = true;
    }
    if(ai.mode === 'retreat') {
        if(ai.modeTimer <= 0 || (ship.shield > ship.maxShield * 0.8 && distance > 1600)) ai.mode = 'attack';
        else {
            steer(ship, c, dir.clone().negate());
            c.thrust = 1;
            return;
        }
    }

    // Threats: the player's missiles and drones closing in.
    let threat = null;
    let threatDistance = Infinity;
    world.incoming.forEach(m => {
        if(m.dead) return;
        const mx = ship.x - m.x, my = ship.y - m.y, mz = ship.z - m.z;
        const d = Math.sqrt(mx * mx + my * my + mz * mz);
        if(d > 450 + ship.radius) return;
        if((m.vx * mx + m.vy * my + m.vz * mz) / (d || 1) > 120 && d < threatDistance) {
            threat = m;
            threatDistance = d;
        }
    });
    if(threat && fighter && ai.evadeTimer <= 0) {
        ai.evadeTimer = 0.7;
        ai.evadeSide = Math.random() < 0.5 ? 1 : -1;
        ai.evadeLift = Math.random() < 0.5 ? 1 : -1;
    }

    // Aim: shoot close missiles down if it has guns, otherwise lead the target.
    const shootDown = threat && threat.kind === 'missile' && threatDistance < 350 && ship.turrets.some(t => t.kind === 'minigun');
    const aimAt = shootDown ? threat : target;
    const t = Math.sqrt((aimAt.x - ship.x) * (aimAt.x - ship.x) + (aimAt.y - ship.y) * (aimAt.y - ship.y) + (aimAt.z - ship.z) * (aimAt.z - ship.z)) / ai.projectileSpeed;
    const lead = new THREE.Vector3(aimAt.x + (aimAt.vx || 0) * t, aimAt.y + (aimAt.vy || 0) * t, aimAt.z + (aimAt.vz || 0) * t);
    const leadDir = lead.clone().sub(ship.position);
    const leadDistance = leadDir.length();
    leadDir.normalize().add(ai.aimError).normalize();
    c.aimPoint = ship.position.clone().addScaledVector(leadDir, leadDistance);

    if(fighter) {
        // Attack runs: charge in, break off past the target, swing back round.
        if(ai.mode === 'attack') {
            const off = steer(ship, c, lead.clone().sub(ship.position).normalize());
            c.thrust = off < 0.7 ? 1 : 0.2;
            if(distance < Math.max(180, range * 0.45)) {
                ai.mode = 'break';
                ai.modeTimer = 1.2 + Math.random() * 0.8;
                // Break away at an angle to the attack line.
                const side = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(dir).normalize();
                ai.breakDir = dir.clone().multiplyScalar(0.4).add(side).normalize();
            }
        } else {
            steer(ship, c, ai.breakDir);
            c.thrust = 1;
            if((ai.modeTimer <= 0 && distance > range * 0.9) || ai.modeTimer < -3) ai.mode = 'attack';
        }
    } else {
        // Capital ships hold their standoff distance and circle slowly.
        ai.mode = 'attack';
        const off = steer(ship, c, dir);
        if(distance > range * 1.05 && off < 1.2) c.thrust = 1;
        if(distance < range * 0.7) c.thrust = -1;
        if(distance < range * 1.2) c.strafe = ai.orbit;
    }
    if(ai.evadeTimer > 0) {
        c.strafe = ai.evadeSide;
        c.lift = ai.evadeLift;
    }

    // Spacing from the other enemies, and asteroids in the way.
    world.friends.forEach(other => {
        if(other === ship || !other.alive) return;
        const reach = other.radius + ship.radius + 70;
        if(other.position.distanceToSquared(ship.position) < reach * reach) {
            c.lift = other.z > ship.z ? -1 : 1;
        }
    });
    const ahead = ship.forward().multiplyScalar(ship.radius + 120).add(ship.position);
    for(let i = 0; i < world.rocks.length; i++) {
        const rock = world.rocks[i];
        if(rock.dead) continue;
        const reach = rock.radius + ship.radius + 60;
        const dx = rock.x - ahead.x, dy = rock.y - ahead.y, dz = rock.z - ahead.z;
        if(dx * dx + dy * dy + dz * dz > reach * reach) continue;
        const local = new THREE.Vector3(dx, dy, dz).applyQuaternion(ship.invQuat());
        c.strafe = local.y > 0 ? 1 : -1;     // rock to port: slide to starboard, and vice versa
        c.lift = local.z > 0 ? -1 : 1;
        if(fighter) c.thrust = Math.min(c.thrust, 0.3);
        break;
    }

    c.fire = !!shootDown || distance - (target.radius || 0) * 0.8 < ai.gunReach;
    ai.missileTimer -= dt;
    const playerDrones = world.incoming.some(m => m.kind === 'drone' && !m.dead);
    if(ship.launchers.length && (ai.missileTimer <= 0 || playerDrones) && distance < 1500 && distance > 150) {
        c.missiles = true;
        c.lockTarget = target;
        if(ship.launchers.every(l => l.cooldown > 0) || Math.random() < 0.02) ai.missileTimer = 2 + Math.random() * 3;
    }
};
