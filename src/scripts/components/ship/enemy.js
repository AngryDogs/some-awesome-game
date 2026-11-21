// Enemy ships: the same hulls the player can fly, fitted out at mid level (Mk II) or fully
// upgraded (Mk III), flown by a simple AI pilot that feeds the ship the same kind of input
// the player's keyboard and mouse do.

import Ship from './ship';
import HULLS from '../../shipyard/hulls';
import { computeShipStats } from '../../shipyard/profile';

// Weapons and systems each faction fits, in order; slots are filled cycling through it.
const FACTION_FIT = {
    "Goa'uld": ['staff', 'staff', 'missile', 'shield', 'staff', 'engine', 'armor', 'staff', 'shield'],
    "Tau'ri": ['minigun', 'missile', 'shield', 'guidance', 'minigun', 'missile', 'engine', 'armor', 'shield', 'minigun'],
    Asgard: ['beam', 'shield', 'beam', 'missile', 'engine', 'shield', 'beam', 'armor', 'shield'],
    Ancient: ['drones', 'shield', 'minigun', 'drones', 'engine', 'shield', 'beam', 'armor', 'drones']
};
// Small craft keep a mount free for an engine instead of a second heavy system.
const FIGHTER_FIT = {
    glider: ['staff', 'staff', 'engine'],
    x302: ['minigun', 'missile', 'missile'],
    jumper: ['drones', 'shield', 'engine', 'minigun']
};

// Enemy weapons hit a little softer than the player's, so a fair fight is winnable.
const ENEMY_DAMAGE = 0.75;

const loadoutFor = (hull, level) => {
    const fit = FIGHTER_FIT[hull.id] || FACTION_FIT[hull.faction] || FACTION_FIT["Tau'ri"];
    const loadout = {};
    hull.slots.forEach((slot, i) => {
        loadout[slot.id] = { type: fit[i % fit.length], level: level };
    });
    return loadout;
};

export const createEnemy = (hullId, level, x, y) => {
    const hull = HULLS[hullId];
    const ship = new Ship(x, y, computeShipStats(hullId, loadoutFor(hull, level)));
    ship.side = 'enemy';
    ship.damageScale = ENEMY_DAMAGE;
    ship.autoTarget = false;
    ship.stabilizer = true;
    ship.immunity = 0.6;
    ship.level = level;
    ship.angle = Math.random() * Math.PI * 2;
    ship.ai = {
        input: {
            forward: false, backward: false, rotateLeft: false, rotateRight: false,
            strafeLeft: false, strafeRight: false, firing: false, firingMissiles: false,
            aimX: x, aimY: y, lockTarget: null
        },
        orbit: Math.random() < 0.5 ? 1 : -1,
        orbitTimer: 2 + Math.random() * 3,
        missileTimer: 1.5 + Math.random() * 2,
        aimError: 0
    };
    // Preferred fighting distance from its weapons.
    const kinds = ship.turrets.map(t => t.kind).concat(ship.launchers.map(l => l.kind));
    ship.ai.range = kinds.indexOf('beam') !== -1 ? 380 : kinds.indexOf('staff') !== -1 || kinds.indexOf('minigun') !== -1 ? 430 : 650;
    ship.ai.range += hull.radius * 1.5;
    // Bounty paid when destroyed.
    ship.bounty = Math.round((150 + hull.cost * 0.12) * (level === 3 ? 1.5 : 1));
    return ship;
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

// Turn towards `desired` without overshooting (zero-g: counter the spin in time).
const steer = (ship, input, desired) => {
    const error = angleDifference(ship.angle, desired);
    const wanted = Math.max(-ship.stats.maxTurn, Math.min(ship.stats.maxTurn, error * 2.5));
    input.rotateRight = ship.angularVelocity < wanted - 0.05;
    input.rotateLeft = ship.angularVelocity > wanted + 0.05;
    return error;
};

// One AI tick: decide how to fly and when to shoot. `target` is the player ship (or null),
// `avoid` an optional point to keep away from (the Atlantis city shield).
export const updateEnemyAI = (ship, dt, target, rocks, incoming, avoid) => {
    const ai = ship.ai;
    const input = ai.input;
    input.forward = input.backward = input.strafeLeft = input.strafeRight = false;
    input.firing = input.firingMissiles = false;
    input.lockTarget = null;
    if(!ship.alive) return;

    ai.orbitTimer -= dt;
    if(ai.orbitTimer <= 0) {
        ai.orbit = -ai.orbit;
        ai.orbitTimer = 2.5 + Math.random() * 3;
        ai.aimError = (Math.random() - 0.5) * 0.06;
    }

    // Keep clear of the city shield.
    if(avoid) {
        const ax = ship.x - avoid.x;
        const ay = ship.y - avoid.y;
        const ad = Math.sqrt(ax * ax + ay * ay) || 1;
        if(ad < avoid.radius) {
            steer(ship, input, Math.atan2(ay, ax));
            input.forward = true;
            return;
        }
    }

    if(!target) {
        // Patrol: drift slowly on the current heading.
        input.forward = Math.random() < 0.02;
        return;
    }

    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    // Point defence: gun ships shoot at incoming missiles that get close.
    const threat = incoming.filter(m => !m.dead && (m.x - ship.x) * (m.x - ship.x) + (m.y - ship.y) * (m.y - ship.y) < 320 * 320)[0];

    // Aim with lead for the travel time of its shots, plus a little error.
    const projectileSpeed = ship.turrets.some(t => t.kind === 'staff') ? 520 : 1100;
    const aimAt = threat || target;
    const ex = aimAt.x - ship.x;
    const ey = aimAt.y - ship.y;
    const t = Math.sqrt(ex * ex + ey * ey) / projectileSpeed;
    // Shots don't inherit the shooter's sideways drift, so lead by the target's own motion.
    const lx = aimAt.x + aimAt.vx * t;
    const ly = aimAt.y + aimAt.vy * t;
    const aimAngle = Math.atan2(ly - ship.y, lx - ship.x) + ai.aimError;
    const aimDist = Math.sqrt((lx - ship.x) * (lx - ship.x) + (ly - ship.y) * (ly - ship.y));
    input.aimX = ship.x + Math.cos(aimAngle) * aimDist;
    input.aimY = ship.y + Math.sin(aimAngle) * aimDist;

    // Face the target and hold the preferred range, circling it.
    const facing = steer(ship, input, Math.atan2(dy, dx));
    const range = ai.range;
    if(distance > range * 1.15 && Math.abs(facing) < 0.7) input.forward = true;
    if(distance < range * 0.6) input.backward = true;
    if(distance < range * 1.6) {
        if(ai.orbit > 0) input.strafeRight = true;
        else input.strafeLeft = true;
    }

    // Dodge asteroids in the way.
    for(let i = 0; i < rocks.length; i++) {
        const rock = rocks[i];
        if(rock.dead) continue;
        const rx = rock.x - ship.x;
        const ry = rock.y - ship.y;
        const reach = rock.radius + ship.radius + 60;
        if(rx * rx + ry * ry > reach * reach) continue;
        const side = Math.cos(ship.angle) * ry - Math.sin(ship.angle) * rx;
        input.strafeLeft = side > 0;
        input.strafeRight = side <= 0;
        input.forward = false;
        break;
    }

    // Shoot when in range (turrets swing to the aim point by themselves).
    input.firing = !!threat || distance < range * 1.7;

    // Missiles and drones in volleys, locked onto the target.
    ai.missileTimer -= dt;
    if(ship.launchers.length && ai.missileTimer <= 0 && distance < 1300 && distance > 160) {
        input.firingMissiles = true;
        input.lockTarget = target;
        if(ship.launchers.every(l => l.cooldown > 0) || Math.random() < 0.02) {
            ai.missileTimer = 2.5 + Math.random() * 3;
        }
    }
};

// Which hulls turn up in each star system (weights), and how many at most at once.
const SYSTEM_ENEMIES = {
    lantea: { max: 2, hulls: { glider: 4, jumper: 2, alkesh: 1 } },
    earth: { max: 2, hulls: { glider: 3, alkesh: 2, x303: 1, jumper: 1 } },
    abydos: { max: 3, hulls: { glider: 5, alkesh: 2, hatak: 1 } },
    chulak: { max: 3, hulls: { glider: 5, alkesh: 3, hatak: 1 } },
    dakara: { max: 3, hulls: { glider: 4, alkesh: 3, hatak: 1, x302: 1 } },
    langara: { max: 2, hulls: { x302: 3, x303: 2, alkesh: 1 } },
    othala: { max: 3, hulls: { alkesh: 2, x304: 1, hatak: 1, aurora: 1, asgard: 1 } }
};

export const enemyConfig = (systemId) => SYSTEM_ENEMIES[systemId] || SYSTEM_ENEMIES.lantea;

export const pickEnemyHull = (systemId) => {
    const hulls = enemyConfig(systemId).hulls;
    const total = Object.keys(hulls).reduce((sum, id) => sum + hulls[id], 0);
    let roll = Math.random() * total;
    const ids = Object.keys(hulls);
    for(let i = 0; i < ids.length; i++) {
        roll -= hulls[ids[i]];
        if(roll <= 0) return ids[i];
    }
    return ids[0];
};
