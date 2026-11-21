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
    ship.stabilizer = true;   // keeps the AI's flying under control in zero-g
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
    ship.ai.range += hull.radius * 1.2;
    // How far its guns are worth firing (bolts and rounds lose accuracy beyond this).
    ship.ai.gunReach = kinds.indexOf('beam') !== -1 ? 650 : kinds.indexOf('staff') !== -1 ? 700 : 750;
    ship.ai.gunReach += hull.radius * 0.5;
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

// One AI tick: decide how to fly and when to shoot.
//   target:   the player ship (or null)
//   rocks:    asteroids to steer around
//   incoming: the player's missiles and drones (to dodge or shoot down)
//   friends:  the other enemy ships (to keep formation spacing)
//   avoid:    optional { x, y, radius } to stay out of (the Atlantis city shield)
//
// Fighters make attack runs: charge in firing, break away past the target, swing round and
// come again, jinking away from missiles. Capital ships hold a standoff distance, circle
// slowly and let their turrets work. Anyone badly hurt withdraws to recharge shields and
// comes back.
export const updateEnemyAI = (ship, dt, target, rocks, incoming, friends, avoid) => {
    const ai = ship.ai;
    const input = ai.input;
    input.forward = input.backward = input.strafeLeft = input.strafeRight = false;
    input.firing = input.firingMissiles = false;
    input.lockTarget = null;
    if(!ship.alive) return;

    const fighter = ship.radius < 45;
    ai.mode = ai.mode || 'attack';
    ai.modeTimer = (ai.modeTimer || 0) - dt;
    ai.evadeTimer = (ai.evadeTimer || 0) - dt;
    ai.orbitTimer -= dt;
    if(ai.orbitTimer <= 0) {
        ai.orbit = -ai.orbit;
        ai.orbitTimer = 3 + Math.random() * 4;
        ai.aimError = (Math.random() - 0.5) * 0.06;
    }

    // Keep clear of the city shield.
    if(avoid) {
        const ax = ship.x - avoid.x;
        const ay = ship.y - avoid.y;
        const ad = Math.sqrt(ax * ax + ay * ay) || 1;
        if(ad < avoid.radius + ship.radius) {
            steer(ship, input, Math.atan2(ay, ax));
            input.forward = true;
            return;
        }
    }

    if(!target) {
        ai.mode = 'attack';
        input.forward = Math.random() < 0.02;
        return;
    }

    const dx = target.x - ship.x;
    const dy = target.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const toTarget = Math.atan2(dy, dx);
    const range = ai.range;

    // Badly damaged: withdraw until the shields are back up (or a while has passed).
    const health = ship.hp / ship.maxHull;
    if(ai.mode !== 'retreat' && health < 0.3 && ship.maxShield > 0 && !ai.retreated) {
        ai.mode = 'retreat';
        ai.modeTimer = 8 + Math.random() * 4;
        ai.retreated = true;
    }
    if(ai.mode === 'retreat') {
        if(ai.modeTimer <= 0 || (ship.shield > ship.maxShield * 0.8 && distance > 1600)) {
            ai.mode = 'attack';
        } else {
            steer(ship, input, toTarget + Math.PI + ai.orbit * 0.4);
            input.forward = true;
            input.firing = distance < range * 1.5;
            aimAt(ship, ai, input, target);
            return;
        }
    }

    // Dodge: a hostile missile or drone closing in fast makes fighters jink sideways.
    let threat = null;
    let threatDistance = Infinity;
    for(let i = 0; i < incoming.length; i++) {
        const m = incoming[i];
        if(m.dead) continue;
        const mx = ship.x - m.x;
        const my = ship.y - m.y;
        const d = Math.sqrt(mx * mx + my * my);
        if(d > 420 + ship.radius) continue;
        const closing = (m.vx * mx + m.vy * my) / (d || 1);
        if(closing > 120 && d < threatDistance) {
            threat = m;
            threatDistance = d;
        }
    }
    if(threat && fighter && ai.evadeTimer <= 0) {
        ai.evadeTimer = 0.7;
        ai.evadeSide = (threat.vx * (ship.y - threat.y) - threat.vy * (ship.x - threat.x)) > 0 ? 1 : -1;
    }

    // Aim: gun ships shoot close missiles down, otherwise lead the target.
    const shootDown = threat && threat.kind === 'missile' && threatDistance < 320 && ship.turrets.some(t => t.kind === 'minigun');
    aimAt(ship, ai, input, shootDown ? threat : target);

    if(fighter) {
        // Attack run: charge, break off past the target, swing back round.
        if(ai.mode === 'attack') {
            const facing = steer(ship, input, toTarget);
            input.forward = Math.abs(facing) < 0.8;
            if(distance < Math.max(160, range * 0.45)) {
                ai.mode = 'break';
                ai.modeTimer = 1.1 + Math.random() * 0.8;
                ai.breakAngle = toTarget + ai.orbit * (0.9 + Math.random() * 0.5);
            }
        } else if(ai.mode === 'break') {
            steer(ship, input, ai.breakAngle);
            input.forward = true;
            if(ai.modeTimer <= 0 && distance > range * 0.9) ai.mode = 'attack';
            if(ai.modeTimer < -3) ai.mode = 'attack';
        }
    } else {
        // Capital ship: hold the standoff distance and circle slowly.
        ai.mode = 'attack';
        const far = distance > range * 1.25;
        const facing = steer(ship, input, toTarget + (far ? 0 : ai.orbit * 0.35));
        if(distance > range * 1.05 && Math.abs(facing) < 1.2) input.forward = true;
        if(distance < range * 0.7) input.backward = true;
        if(distance < range * 1.2) {
            if(ai.orbit > 0) input.strafeRight = true;
            else input.strafeLeft = true;
        }
    }

    if(ai.evadeTimer > 0) {
        input.strafeLeft = ai.evadeSide < 0;
        input.strafeRight = ai.evadeSide > 0;
    }

    // Spacing: don't pile into other enemy ships.
    for(let i = 0; i < friends.length; i++) {
        const other = friends[i];
        if(other === ship || !other.alive) continue;
        const ox = other.x - ship.x;
        const oy = other.y - ship.y;
        const reach = other.radius + ship.radius + 70;
        if(ox * ox + oy * oy > reach * reach) continue;
        const side = Math.cos(ship.angle) * oy - Math.sin(ship.angle) * ox;
        input.strafeLeft = side > 0;
        input.strafeRight = side <= 0;
        break;
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
        if(fighter) input.forward = false;
        break;
    }

    // Guns only within their real reach (turrets swing to the aim point by themselves).
    input.firing = !!shootDown || distance - target.radius * 0.8 < ai.gunReach;

    // Missiles and drones in volleys, locked onto the target. Drones are held back for
    // the player's drones when those are in the air.
    ai.missileTimer -= dt;
    const playerDrones = incoming.some(m => m.kind === 'drone' && !m.dead);
    if(ship.launchers.length && (ai.missileTimer <= 0 || playerDrones) && distance < 1400 && distance > 140) {
        input.firingMissiles = true;
        input.lockTarget = target;
        if(ship.launchers.every(l => l.cooldown > 0) || Math.random() < 0.02) {
            ai.missileTimer = 2 + Math.random() * 3;
        }
    }
};

// Aim with lead for the travel time of its shots, plus a little error.
const aimAt = (ship, ai, input, target) => {
    const projectileSpeed = ship.turrets.some(t => t.kind === 'staff') ? 520 : 1100;
    const ex = target.x - ship.x;
    const ey = target.y - ship.y;
    const t = Math.sqrt(ex * ex + ey * ey) / projectileSpeed;
    // Shots don't inherit the shooter's sideways drift, so lead by the target's own motion.
    const lx = target.x + (target.vx || 0) * t;
    const ly = target.y + (target.vy || 0) * t;
    const aimAngle = Math.atan2(ly - ship.y, lx - ship.x) + ai.aimError;
    const aimDist = Math.sqrt((lx - ship.x) * (lx - ship.x) + (ly - ship.y) * (ly - ship.y));
    input.aimX = ship.x + Math.cos(aimAngle) * aimDist;
    input.aimY = ship.y + Math.sin(aimAngle) * aimDist;
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
