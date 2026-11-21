import Ship from '../components/ship/ship';
import { MAX_MERGE_RADIUS, VISUAL_RADIUS, resetRebuildBudget } from '../components/rock/rock';
import Particle from '../components/particle/particle';
import Ore from '../components/ore/ore';
import loadInputHandlers, { input, onKeyPress, triggerKey, setClickFilter } from '../components/ship/handlers';
import sounds from '../audio/audio';
import { world, delta, gravityAt } from '../physics/physics';
import MATERIALS, { MATERIAL_ORDER } from '../world/materials';
import { SectorManager, sectorOf } from '../world/sectors';
import { STATION, drawStation } from '../world/station';
import { computeShipStats, getProfile, storeOre, cargoUsed, loseCargo, removeCargo, onProfileChange } from '../shipyard/profile';
import { getShipyard } from '../shipyard/shipyard';
import { SYSTEMS, systemById, distanceBetween } from '../world/systems';
import Stargate, { GATE_INNER, GATE_RADIUS, DHD_RANGE } from '../world/stargate';
import { getDHD, isDHDOpen } from '../ui/dhd';
import { getStarmap, isStarmapOpen, hyperTravelTime } from '../ui/starmap';
import { planetSprite, nebulaSprite } from '../render/planets';
import { drawWormhole, drawHyperspace, drawHyperWindow } from './travel';
import { glowSprite, stamp } from '../render/sprites';
import TouchControls, { isTouchDevice } from '../ui/touch';

const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 4;   // on slow frames, slow the game slightly rather than spiral
const MAX_PARTICLES = 1400;     // pixel particles are cheap (one small fillRect each)
const MAX_DUST = 320;              // soft dust puffs are large; keep only the newest
const GAME_OVER_DELAY = 2.5;
const SHIP_RESTITUTION = 0.4;
const ROCK_BOUNCE = 0.2;
const MISSILE_PUSH = 60000;
const SECTOR_UPDATE_INTERVAL = 0.5;
const MINIMAP_SIZE = 180;

// Phones and tablets get on-screen controls and a layout that keeps the thumbs' areas clear.
const TOUCH = isTouchDevice();
let touchControls = null;
const hint = (key) => TOUCH ? '' : ' (' + key + ')';
const MINIMAP_RANGE = 3500;

const gameboard = document.getElementById('gameboard');
const menu = document.getElementById('menu');
const menuMessage = document.getElementById('menuMessage');
const pauseMenu = document.getElementById('pauseMenu');
const shieldButton = document.getElementById('shieldButton');
const cargoButton = document.getElementById('cargoButton');
const starmapButton = document.getElementById('starmapButton');
const cargoPanel = document.getElementById('cargoPanel');
const hudElements = {
    credits: document.getElementById('credits'),
    location: document.getElementById('location'),
    targeting: document.getElementById('targeting'),
    fps: document.getElementById('fps'),
    hullBar: document.getElementById('hullBar'),
    hullText: document.getElementById('hullText'),
    shieldBar: document.getElementById('shieldBar'),
    shieldText: document.getElementById('shieldText'),
    cargoBar: document.getElementById('cargoBar'),
    cargoText: document.getElementById('cargoText'),
    cargoButton: document.getElementById('cargoButton')
};

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let pixelRatio = 1;

let state = null;
let frameId = null;
let lastFrameTime = 0;
let accumulator = 0;
let fps = 60;
const hud = {};

// Each star system has its own asteroid fields: seed derived from the profile seed and
// the system id, ore mix from the system, and the station/gate kept clear of rocks.
const systemSeed = (id) => {
    let h = 2166136261;
    for(let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return (getProfile().seed ^ h) >>> 0;
};
const makeSectors = (system) => new SectorManager(systemSeed(system.id), system.materials, [{ x: 0, y: 0 }, system.gate]);
const originIndex = (system) => SYSTEMS.indexOf(system);

const createState = () => {
    const system = systemById('lantea');
    const ship = new Ship(STATION.x + STATION.dockRadius + 80, STATION.y, computeShipStats(getProfile().hull));
    ship.angle = 0;
    return {
        system: system,
        gate: new Stargate(system.gate.x, system.gate.y),
        transition: null,
        tooBigTimer: 0,
        ship: ship,
        rocks: [],
        newRocks: [],
        bullets: [],
        missiles: [],
        particles: [],
        ores: [],
        beamHits: [],
        shockwaves: [],
        flashes: [],
        scan: { timer: 1, target: null, value: 0, pings: [] },
        mergeLinks: [],
        floatingTexts: [],
        sectors: makeSectors(system),
        sectorTimer: 0,
        camera: { x: ship.x, y: ship.y },
        time: 0,
        bannerText: 'Undocked. Happy mining!',
        bannerTimer: 2.5,
        cargoFullTimer: 0,
        shieldHintTimer: 0,
        canDock: false,
        gameOverTimer: 0,
        paused: false,
        docked: false
    };
};

// Render resolution cap: starts at the screen's pixel ratio (max 2) and drops to 1
// automatically if the game can't hold a smooth frame rate on this computer.
let resolutionCap = 2;

// Camera zoom: a little closer than 1:1 so ships and asteroids read clearly.
// Mouse wheel or +/- keys change it between MIN_ZOOM (wide tactical view) and
// MAX_ZOOM (close-up); 0 resets. The view eases smoothly towards the target.
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.6;
const DEFAULT_ZOOM = 1.3;
let zoom = DEFAULT_ZOOM;
let targetZoom = DEFAULT_ZOOM;
const zoomKeys = { in: false, out: false };
const clampZoom = (value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
let slowTime = 0;

const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, resolutionCap);
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    world.resize(window.innerWidth, window.innerHeight);
};

const setText = (key, text) => {
    if(hud[key] !== text) {
        hud[key] = text;
        hudElements[key].textContent = text;
    }
};

const setBar = (key, fraction) => {
    const width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
    if(hud[key] !== width) {
        hud[key] = width;
        hudElements[key].style.width = width;
    }
};

const distanceToStation = () => {
    const dx = state.ship.x - STATION.x;
    const dy = state.ship.y - STATION.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const renderInfo = () => {
    const ship = state.ship;
    const used = cargoUsed();
    const sector = sectorOf(ship.x, ship.y);
    setText('credits', 'Credits: ' + Math.round(getProfile().credits).toLocaleString('en-US'));
    setText('location', state.system.name + ' · sector ' + sector.sx + ', ' + sector.sy +
        (state.system.station ? ' · base ' + (distanceToStation() / 1000).toFixed(1) + 'k' : ''));
    setText('fps', 'Fps: ' + Math.round(fps));
    setText('targeting', 'Stabilizer: ' + (ship.stabilizer ? 'ON' : 'OFF') + hint('X') +
        (ship.guidance ? ' · Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + hint('G') : ''));
    setBar('hullBar', ship.hp / ship.maxHull);
    setText('hullText', Math.ceil(ship.hp) + ' / ' + Math.round(ship.maxHull));
    setBar('shieldBar', ship.maxShield ? ship.shield / ship.maxShield : 0);
    setText('shieldText', ship.maxShield ? Math.ceil(ship.shield) + ' / ' + Math.round(ship.maxShield) : 'none');
    const shieldState = ship.maxShield <= 0 ? 'none' : (ship.shieldsEnabled ? (ship.shieldUp ? 'up' : 'depleted') : 'down');
    if(hud.shieldState !== shieldState) {
        hud.shieldState = shieldState;
        shieldButton.className = 'shield-button ' + shieldState;
        shieldButton.textContent = {
            none: 'No shields', up: 'Shields: UP' + hint('H'), depleted: 'Shields: DEPLETED', down: 'Shields: DOWN' + hint('H')
        }[shieldState];
    }
    setBar('cargoBar', used / ship.cargoCapacity);
    setText('cargoButton', 'Cargo ' + used + '/' + ship.cargoCapacity + hint('C'));
    setText('cargoText', used + ' / ' + ship.cargoCapacity);
};

const floatText = (x, y, text, color) => {
    state.floatingTexts.push({ x: x, y: y, text: text, color: color || '255,225,120', life: 1.2 });
};

const banner = (text, duration) => {
    state.bannerText = text;
    state.bannerTimer = duration || 2;
};

// ---------------------------------------------------------------- physics

// Gravity changes slowly, so the expensive all-pairs sum is refreshed GRAVITY_INTERVAL
// times less often than the physics step and the cached accelerations reused in between.
const GRAVITY_INTERVAL = 4;
let gravityCounter = 0;

const applyGravity = (dt) => {
    const { rocks, ship, bullets, missiles, ores } = state;
    const refresh = gravityCounter++ % GRAVITY_INTERVAL === 0;

    const pull = (body) => {
        if(refresh || !body.gravity) body.gravity = gravityAt(body, rocks);
        body.vx += body.gravity.x * dt;
        body.vy += body.gravity.y * dt;
    };

    // Rocks: compute every acceleration before changing any velocity.
    if(refresh) rocks.forEach(rock => { rock.gravityNext = gravityAt(rock, rocks); });
    rocks.forEach(rock => {
        if(refresh || !rock.gravity) rock.gravity = rock.gravityNext || gravityAt(rock, rocks);
        rock.vx += rock.gravity.x * dt;
        rock.vy += rock.gravity.y * dt;
    });

    if(ship.alive) pull(ship);
    bullets.forEach(pull);
    missiles.forEach(pull);
    ores.forEach(pull);
};

// Weapon damage chips the asteroid: area turns into ore, stress cracks chunks off.
const colorString = (c) => c.map(v => Math.round(v)).join(',');
const shadeString = (c, f) => c.map(v => Math.round(Math.max(0, Math.min(255, v * f)))).join(',');

// Dust, debris chips and unlit pixels are drawn normally; sparks and glowing pixels add light.
const isUnlit = (particle) => particle.dust || particle.solid || (particle.pixel && !particle.glow);

// Spawn particles in a cone around (dirX, dirY).
const spray = (x, y, baseVx, baseVy, dirX, dirY, cone, count, options) => {
    const angle = Math.atan2(dirY, dirX);
    for(let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * 2 * cone;
        const speed = options.minSpeed + Math.random() * (options.maxSpeed - options.minSpeed);
        state.particles.push(new Particle({
            x: x, y: y,
            vx: baseVx + Math.cos(a) * speed,
            vy: baseVy + Math.sin(a) * speed,
            life: options.minLife + Math.random() * (options.maxLife - options.minLife),
            size: options.size * (0.6 + Math.random() * 0.8),
            color: options.color,
            dust: options.dust,
            solid: options.solid,
            pixel: options.pixel,
            glow: options.glow,
            drag: options.drag,
            alpha: options.alpha
        }));
    }
};

const flash = (x, y, size, color, life) => {
    state.flashes.push({ x: x, y: y, size: size, color: color, life: life || 0.12, maxLife: life || 0.12 });
};

// Weapon damage on an asteroid. The impact looks different on the soft dusty outside
// (dust plume, grit, debris) and on the hard core (ricocheting sparks, hot fragments).
// `inX, inY` is the incoming direction of the shot, `kind` the weapon type.
const hitRock = (rock, damage, hitX, hitY, inX, inY, kind) => {
    if(rock.dead) return;
    const localAngle = Math.atan2(hitY - rock.y, hitX - rock.x) - rock.angle;
    const normal = rock.normalAt(localAngle);
    const result = rock.chip(damage, hitX, hitY);
    const dust = colorString(rock.dustColor);
    const intensity = Math.min(1.5, 0.4 + damage * 0.25);

    // Incoming direction (default: straight into the surface) and its reflection.
    let dx = inX === undefined ? -normal.x : inX;
    let dy = inY === undefined ? -normal.y : inY;
    const dl = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dl;
    dy /= dl;
    const dot = dx * normal.x + dy * normal.y;
    const rx = dx - 2 * dot * normal.x;
    const ry = dy - 2 * dot * normal.y;
    const continuous = kind === 'beam';

    const light = shadeString(rock.dustColor, 1.25);
    const darkDust = shadeString(rock.dustColor, 0.7);
    const coreColor = colorString(rock.coreColor);

    if(result.hard) {
        // Hard core: a shower of spark pixels skipping off the surface, glowing embers,
        // shards of dark core rock, a puff of pulverised stone and a bright flash.
        if(!continuous || Math.random() < 0.55) {
            spray(hitX, hitY, rock.vx, rock.vy, rx, ry, 0.55, continuous ? 3 : Math.round(8 + 6 * intensity), {
                minSpeed: 160, maxSpeed: 420, minLife: 0.12, maxLife: 0.4, size: 1.6, color: '255,235,180', pixel: true, glow: true
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1, continuous ? 1 : Math.round(2 + 2 * intensity), {
                minSpeed: 40, maxSpeed: 140, minLife: 0.35, maxLife: 0.9, size: 2.2, color: '255,140,50', pixel: true, glow: true, drag: 1.5
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.9, continuous ? 1 : Math.round(3 + 3 * intensity), {
                minSpeed: 50, maxSpeed: 170, minLife: 0.4, maxLife: 1, size: 2, color: coreColor, pixel: true, drag: 0.6
            });
            spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.6, continuous ? 0 : 1, {
                minSpeed: 10, maxSpeed: 40, minLife: 0.8, maxLife: 1.6, size: 5, color: darkDust, dust: true, alpha: 0.3, drag: 0.8
            });
            flash(hitX, hitY, continuous ? 16 : 20 + 12 * intensity, '255,220,160', 0.09);
        }
    } else if(!continuous || Math.random() < 0.7) {
        // Soft regolith: a billowing plume of dust, a spray of grit pixels in light and
        // dark shades, a few bigger clods, and a dim flash.
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.8, continuous ? 1 : Math.round(2 + intensity * 2), {
            minSpeed: 15, maxSpeed: 70, minLife: 1, maxLife: 2.2, size: 8, color: dust, dust: true, alpha: 0.32, drag: 0.7
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1.1, continuous ? 3 : Math.round(6 + 6 * intensity), {
            minSpeed: 40, maxSpeed: 200, minLife: 0.35, maxLife: 1, size: 1.4, color: light, pixel: true, drag: 0.5
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 1.1, continuous ? 2 : Math.round(4 + 4 * intensity), {
            minSpeed: 30, maxSpeed: 150, minLife: 0.4, maxLife: 1.1, size: 1.4, color: darkDust, pixel: true, drag: 0.5
        });
        spray(hitX, hitY, rock.vx, rock.vy, normal.x, normal.y, 0.7, continuous ? 0 : Math.round(1 + intensity), {
            minSpeed: 30, maxSpeed: 90, minLife: 0.6, maxLife: 1.4, size: 3, color: dust, solid: true
        });
        flash(hitX, hitY, continuous ? 9 : 12 + 6 * intensity, '255,230,200', 0.06);
    }

    // Ore pops out of the hole, flashing in its metal colour with a burst of glinting pixels.
    result.ore.forEach(material => {
        const color = MATERIALS[material].color;
        const a = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * 1.1;
        const speed = 50 + Math.random() * 70;
        const ore = new Ore(
            hitX + normal.x * 3,
            hitY + normal.y * 3,
            rock.vx + Math.cos(a) * speed,
            rock.vy + Math.sin(a) * speed,
            material
        );
        ore.trail = 0.8;
        state.ores.push(ore);
        flash(hitX, hitY, 32, color, 0.22);
        spray(hitX, hitY, rock.vx, rock.vy, Math.cos(a), Math.sin(a), 0.6, 10, {
            minSpeed: 60, maxSpeed: 200, minLife: 0.25, maxLife: 0.6, size: 1.6, color: color, pixel: true, glow: true
        });
        spray(hitX, hitY, rock.vx, rock.vy, Math.cos(a), Math.sin(a), 0.5, 2, {
            minSpeed: 10, maxSpeed: 40, minLife: 0.8, maxLife: 1.4, size: 5, color: dust, dust: true, alpha: 0.25
        });
    });

    if(result.pieces) {
        // Cut clean through: the halves replace the asteroid, with a long dust cloud and a
        // spray of rubble pixels along the cut, plus a crack of sparks from the core.
        result.pieces.forEach(piece => state.newRocks.push(piece));
        const a = result.pieces[0];
        const b = result.pieces[1];
        const cutX = -(b.y - a.y);
        const cutY = b.x - a.x;
        const cutLength = Math.sqrt(cutX * cutX + cutY * cutY) || 1;
        for(let i = 0; i < 16; i++) {
            const t = (Math.random() - 0.5) * 1.6;
            const x = rock.x + cutX / cutLength * rock.radius * t;
            const y = rock.y + cutY / cutLength * rock.radius * t;
            Particle.burst(state.particles, x, y, rock.vx, rock.vy, 1, {
                minSpeed: 5, maxSpeed: 35, minLife: 1.2, maxLife: 2.6, size: 9, color: dust, dust: true, alpha: 0.26
            });
            Particle.burst(state.particles, x, y, rock.vx, rock.vy, 3, {
                minSpeed: 20, maxSpeed: 110, minLife: 0.5, maxLife: 1.3, size: 1.8, color: i % 2 ? light : coreColor, pixel: true
            });
        }
        Particle.burst(state.particles, hitX, hitY, rock.vx, rock.vy, 16, {
            minSpeed: 60, maxSpeed: 260, minLife: 0.2, maxLife: 0.6, size: 1.6, color: '255,230,170', pixel: true, glow: true
        });
        flash(rock.x, rock.y, rock.radius * 1.6, '255,225,190', 0.25);
        sounds.rockCrack();
    }

    if(result.crumbled) {
        // Falls apart into a cloud of rubble pixels and dust.
        Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 24, {
            minSpeed: 20, maxSpeed: 140, minLife: 0.5, maxLife: 1.3, size: 1.8, color: light, pixel: true, drag: 0.4
        });
        Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 14, {
            minSpeed: 20, maxSpeed: 120, minLife: 0.5, maxLife: 1.3, size: 2, color: coreColor, pixel: true, drag: 0.4
        });
        Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 10, {
            minSpeed: 5, maxSpeed: 45, minLife: 1.2, maxLife: 2.4, size: 8, color: dust, dust: true, alpha: 0.26, drag: 0.5
        });
        flash(rock.x, rock.y, rock.radius * 2.2, '255,225,190', 0.2);
        sounds.rockCrack();
    }
};

// Bounce two bodies off each other along the contact normal and push them apart.
const resolveImpact = (a, b, normalX, normalY, overlap, restitution) => {
    const inverseA = 1 / a.mass;
    const inverseB = 1 / b.mass;
    const totalInverse = inverseA + inverseB;

    a.x -= normalX * overlap * (inverseA / totalInverse);
    a.y -= normalY * overlap * (inverseA / totalInverse);
    b.x += normalX * overlap * (inverseB / totalInverse);
    b.y += normalY * overlap * (inverseB / totalInverse);

    const relativeSpeed = (b.vx - a.vx) * normalX + (b.vy - a.vy) * normalY;
    if(relativeSpeed >= 0) return 0;

    const impulse = -(1 + restitution) * relativeSpeed / totalInverse;
    a.vx -= impulse * inverseA * normalX;
    a.vy -= impulse * inverseA * normalY;
    b.vx += impulse * inverseB * normalX;
    b.vy += impulse * inverseB * normalY;
    return -relativeSpeed;
};

const bulletCollisions = () => {
    const { bullets, rocks } = state;

    bullets.forEach(bullet => {
        if(bullet.dead) return;
        for(let i = 0; i < rocks.length; i++) {
            const rock = rocks[i];
            if(rock.dead || !rock.containsPoint(bullet.x, bullet.y)) continue;

            // Find where the round actually crossed the visible outline this step.
            const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) || 1;
            const dirX = bullet.vx / speed;
            const dirY = bullet.vy / speed;
            const travel = speed * STEP + 2;
            const startX = bullet.x - dirX * travel;
            const startY = bullet.y - dirY * travel;
            const entry = rock.raycast(startX, startY, dirX, dirY, travel);
            bullet.x = entry === null ? bullet.x : startX + dirX * entry;
            bullet.y = entry === null ? bullet.y : startY + dirY * entry;

            bullet.dead = true;
            // Projectiles carry momentum and nudge the rock (capped so small chunks don't rocket off).
            const kick = Math.min(30, speed * bullet.mass / rock.mass);
            rock.vx += dirX * kick;
            rock.vy += dirY * kick;
            hitRock(rock, bullet.damage, bullet.x, bullet.y, dirX, dirY, bullet.kind);

            if(bullet.kind === 'plasma') {
                // Staff blast: fiery splash that also scorches nearby rocks.
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 26, {
                    minSpeed: 40, maxSpeed: 220, minLife: 0.25, maxLife: 0.7, size: 3.5, color: '255,170,60'
                });
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 10, {
                    minSpeed: 10, maxSpeed: 80, minLife: 0.15, maxLife: 0.35, size: 7, color: '255,240,200'
                });
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 20, {
                    minSpeed: 60, maxSpeed: 260, minLife: 0.25, maxLife: 0.7, size: 1.8, color: '255,180,70', pixel: true, glow: true, drag: 0.8
                });
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 5, {
                    minSpeed: 5, maxSpeed: 35, minLife: 1, maxLife: 2, size: 9, color: '120,100,90', dust: true, alpha: 0.25
                });
                rocks.forEach(other => {
                    if(other === rock || other.dead) return;
                    const ox = other.x - bullet.x;
                    const oy = other.y - bullet.y;
                    const reach = bullet.splash + other.radius;
                    if(ox * ox + oy * oy < reach * reach) hitRock(other, bullet.damage * 0.5, bullet.x, bullet.y, undefined, undefined, 'plasma');
                });
                sounds.plasmaImpact();
            } else {
                sounds.rockHit(rock.isCoreExposed(Math.atan2(bullet.y - rock.y, bullet.x - rock.x) - rock.angle));
            }
            return;
        }
    });
};

const explodeMissile = (missile) => {
    const drone = missile.kind === 'drone';
    const color = drone ? '255,225,140' : '255,160,80';
    // Hot sparks, a white flash, slow dust, and a shockwave ring sized to the blast.
    Particle.burst(state.particles, missile.x, missile.y, missile.vx * 0.15, missile.vy * 0.15, drone ? 34 : 30, {
        minSpeed: 40, maxSpeed: missile.blast * 4 + 80, minLife: 0.25, maxLife: 0.8, size: drone ? 3 : 3, color: color
    });
    Particle.burst(state.particles, missile.x, missile.y, 0, 0, 8, {
        minSpeed: 5, maxSpeed: 60, minLife: 0.12, maxLife: 0.3, size: drone ? 10 : 8, color: '255,250,225'
    });
    Particle.burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, drone ? 8 : 6, {
        minSpeed: 10, maxSpeed: 50, minLife: 1, maxLife: 2, size: 11, color: '150,140,130', dust: true, alpha: 0.2
    });
    state.shockwaves.push({ x: missile.x, y: missile.y, radius: 4, maxRadius: missile.blast * 1.6, life: 1, color: drone ? '255,220,140' : '255,170,90' });
    // Pixel shrapnel and glowing embers flung out of the blast, plus a lingering smoke cloud.
    Particle.burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, drone ? 34 : 28, {
        minSpeed: 80, maxSpeed: missile.blast * 6 + 120, minLife: 0.3, maxLife: 0.9, size: 1.8, color: color, pixel: true, glow: true, drag: 0.8
    });
    Particle.burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, 14, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.6, maxLife: 1.4, size: 2.4, color: '255,120,40', pixel: true, glow: true, drag: 1.2
    });
    Particle.burst(state.particles, missile.x, missile.y, 0, 0, 6, {
        minSpeed: 5, maxSpeed: 30, minLife: 1.5, maxLife: 2.8, size: 12, color: '110,100,95', dust: true, alpha: 0.22, drag: 0.6
    });
    if(drone) sounds.droneImpact();
    else sounds.missileExplosion();

    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const d = delta(missile, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const reach = missile.blast + rock.radius;
        if(distance > reach) return;

        const falloff = 1 - distance / reach;
        const push = Math.min(70, MISSILE_PUSH * falloff / rock.mass);
        rock.vx += d.x / distance * push;
        rock.vy += d.y / distance * push;
        // Damage lands on the face of the rock nearest the blast.
        hitRock(rock, missile.damage * (0.35 + 0.65 * falloff),
            rock.x - d.x / distance * rock.radius, rock.y - d.y / distance * rock.radius);
    });
};

const missileCollisions = () => {
    const { missiles, rocks } = state;

    missiles.forEach(missile => {
        if(!missile.dead) {
            for(let i = 0; i < rocks.length; i++) {
                const rock = rocks[i];
                if(rock.dead) continue;
                if(!rock.containsPoint(missile.x, missile.y, 3)) continue;
                missile.dead = true;
                missile.exploded = true;
                break;
            }
        }
        if(missile.dead && missile.exploded && !missile.handled) {
            missile.handled = true;
            explodeMissile(missile);
        }
    });
};

// Asteroids pulled together by gravity fuse when they touch: they lock together,
// share momentum, and the smaller one gradually sinks into the bigger one.
const startMerge = (a, b) => {
    const host = a.area >= b.area ? a : b;
    const guest = host === a ? b : a;

    const total = a.mass + b.mass;
    const vx = (a.vx * a.mass + b.vx * b.mass) / total;
    const vy = (a.vy * a.mass + b.vy * b.mass) / total;
    a.vx = b.vx = vx;
    a.vy = b.vy = vy;
    guest.spin = host.spin;

    const link = {
        host: host,
        guest: guest,
        t: 0,
        duration: 1.1 + guest.radius * 0.02,
        hostArea: host.area,
        guestArea: guest.area,
        offsetX: guest.x - host.x,
        offsetY: guest.y - host.y,
        dustTimer: 0
    };
    host.merging = link;
    guest.merging = link;
    state.mergeLinks.push(link);

    const distance = Math.sqrt(link.offsetX * link.offsetX + link.offsetY * link.offsetY) || 1;
    const contactX = host.x + link.offsetX / distance * host.radius * VISUAL_RADIUS;
    const contactY = host.y + link.offsetY / distance * host.radius * VISUAL_RADIUS;
    Particle.mergeCloud(state.particles, contactX, contactY, host,
        Math.round(12 + guest.radius), guest.radius * 1.1, colorString(host.dustColor));
    flash(contactX, contactY, 30 + guest.radius, '255,220,180', 0.25);
    Particle.burst(state.particles, contactX, contactY, host.vx, host.vy, 22, {
        minSpeed: 20, maxSpeed: 110, minLife: 0.6, maxLife: 1.5, size: 1.8, color: shadeString(host.dustColor, 1.2), pixel: true, drag: 0.4
    });
    const nx = link.offsetX / distance;
    const ny = link.offsetY / distance;
    spray(contactX, contactY, host.vx, host.vy, -ny, nx, 0.6, 8, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.4, maxLife: 1, size: 2, color: colorString(host.dustColor), solid: true
    });
    spray(contactX, contactY, host.vx, host.vy, ny, -nx, 0.6, 8, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.4, maxLife: 1, size: 2, color: colorString(host.dustColor), solid: true
    });
    sounds.merge(Math.sqrt(host.area + guest.area));
};

const updateMerges = (dt) => {
    state.mergeLinks.forEach(link => {
        const host = link.host;
        const guest = link.guest;
        if(host.dead || guest.dead) {
            host.merging = null;
            guest.merging = null;
            link.done = true;
            return;
        }

        link.t += dt;
        const p = Math.min(1, link.t / link.duration);
        const k = p * p * (3 - 2 * p);   // smoothstep

        // Stay attached while the pair tumbles together.
        const turn = host.spin * dt;
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        const ox = link.offsetX * cos - link.offsetY * sin;
        const oy = link.offsetX * sin + link.offsetY * cos;
        link.offsetX = ox;
        link.offsetY = oy;

        guest.x = host.x + ox * (1 - 0.85 * k);
        guest.y = host.y + oy * (1 - 0.85 * k);
        guest.vx = host.vx;
        guest.vy = host.vy;

        // Mass flows from the guest into the host.
        const target = link.guestArea * (1 - k);
        const moved = Math.max(0, guest.area - target);
        guest.setArea(Math.min(guest.area, target));
        host.setArea(host.area + moved);

        // Dust squeezed out along the seam, drawn back onto the surface.
        link.dustTimer -= dt;
        if(link.dustTimer <= 0 && p < 0.9) {
            link.dustTimer = 0.06;
            const distance = Math.sqrt(ox * ox + oy * oy) || 1;
            const along = (Math.random() - 0.5) * 1.2;
            const angle = Math.atan2(oy, ox) + along;
            const seamX = host.x + Math.cos(angle) * host.radius * VISUAL_RADIUS;
            const seamY = host.y + Math.sin(angle) * host.radius * VISUAL_RADIUS;
            Particle.mergeCloud(state.particles, seamX, seamY, host, 2, guest.radius * 0.4 + 4, '170,160,148');
            if(distance < 1) link.dustTimer = 1;
        }

        if(p >= 1) {
            host.finishMerge(guest, link.hostArea, link.guestArea, Math.atan2(oy, ox));
            guest.dead = true;
            host.merging = null;
            link.done = true;
        }
    });
    state.mergeLinks = state.mergeLinks.filter(link => !link.done);
};

const rockCollisions = () => {
    const { rocks } = state;

    for(let i = 0; i < rocks.length; i++) {
        const a = rocks[i];
        if(a.dead) continue;

        for(let j = i + 1; j < rocks.length; j++) {
            const b = rocks[j];
            if(b.dead) continue;
            if(a.merging && a.merging === b.merging) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const reach = (a.radius + b.radius) * VISUAL_RADIUS;
            const distSq = dx * dx + dy * dy;
            if(distSq > reach * reach) continue;

            const distance = Math.sqrt(distSq) || 0.001;
            const normalX = dx / distance;
            const normalY = dy / distance;
            const combinedRadius = Math.sqrt(a.area + b.area);

            // Fresh fragments, busy pairs and oversized bodies just rest against each other.
            if(a.grace > 0 || b.grace > 0 || a.merging || b.merging || combinedRadius > MAX_MERGE_RADIUS) {
                const impact = resolveImpact(a, b, normalX, normalY, reach - distance, ROCK_BOUNCE);
                if(impact > 30) {
                    // Grinding knock: grit and dust thrown out sideways from the contact.
                    const cx = a.x + normalX * a.radius * VISUAL_RADIUS;
                    const cy = a.y + normalY * a.radius * VISUAL_RADIUS;
                    const dust = colorString(a.dustColor);
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, -normalY, normalX, 0.5, 4, {
                        minSpeed: 20, maxSpeed: 40 + impact, minLife: 0.3, maxLife: 0.8, size: 1.8, color: dust, solid: true
                    });
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, normalY, -normalX, 0.5, 4, {
                        minSpeed: 20, maxSpeed: 40 + impact, minLife: 0.3, maxLife: 0.8, size: 1.8, color: dust, solid: true
                    });
                    spray(cx, cy, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2, -normalY, normalX, Math.PI, 3, {
                        minSpeed: 5, maxSpeed: 25, minLife: 1, maxLife: 2, size: 9, color: dust, dust: true, alpha: 0.22
                    });
                    flash(cx, cy, 20 + impact * 0.3, '255,225,190', 0.12);
                }
                continue;
            }

            startMerge(a, b);
            break;
        }
    }
};

const shipCollisions = () => {
    const { ship, rocks, particles } = state;
    if(!ship.alive || state.transition) return;

    rocks.forEach(rock => {
        if(rock.dead) return;
        const rockRadius = rock.radius * VISUAL_RADIUS;

        // Broad phase against the whole ship first.
        const center = delta(ship, rock);
        const reach = ship.radius * 1.5 + rockRadius;
        if(center.x * center.x + center.y * center.y > reach * reach) return;

        // Raised shields: asteroids bounce off the bubble, never reaching the hull.
        if(ship.shieldUp) {
            const contact = ship.shieldContact(rock.x, rock.y, rockRadius);
            if(!contact) return;
            const impactSpeed = resolveImpact(ship, rock, contact.nx, contact.ny, contact.overlap, SHIP_RESTITUTION);
            if(impactSpeed > 15) {
                const damage = 2 + impactSpeed * rock.mass / 6000;
                ship.takeDamage(damage, particles, contact.x, contact.y);
                Particle.burst(particles, contact.x, contact.y, rock.vx, rock.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2,
                    color: ship.hullDef.shieldColor || '120,210,255'
                });
            }
            return;
        }

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = delta(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rockRadius - distance;
            if(overlap <= 0) continue;

            const impactSpeed = resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);
            const damage = 4 + impactSpeed * rock.mass / 6000;

            if(impactSpeed > 25 && ship.takeDamage(damage, particles)) {
                sounds.explosion(0.6);
                // Ramming chips the asteroid too.
                hitRock(rock, 1 + impactSpeed * ship.mass / 30000, c.x + d.x / distance * c.r, c.y + d.y / distance * c.r);
            }
            return;
        }
    });
};

// Atlantis city shield: asteroids bounce off it, ships, shots and ore pass through.
const cityShield = (dt) => {
    const R = STATION.shieldRadius;
    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const dx = rock.x - STATION.x;
        const dy = rock.y - STATION.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const r = rock.radius * VISUAL_RADIUS;
        if(distance > R + r || distance < R - r - 40) return;

        const nx = dx / distance;
        const ny = dy / distance;
        rock.x = STATION.x + nx * (R + r);
        rock.y = STATION.y + ny * (R + r);
        const inward = rock.vx * nx + rock.vy * ny;
        if(inward < 0) {
            rock.vx -= 1.6 * inward * nx;
            rock.vy -= 1.6 * inward * ny;
            const strength = Math.min(1.5, 0.3 + -inward / 80 + r / 60);
            STATION.impacts.push({ angle: Math.atan2(ny, nx), life: 1, strength: strength });
            if(STATION.impacts.length > 10) STATION.impacts.shift();
            Particle.burst(state.particles, STATION.x + nx * R, STATION.y + ny * R, rock.vx * 0.3, rock.vy * 0.3, 10, {
                minSpeed: 30, maxSpeed: 140, minLife: 0.2, maxLife: 0.6, size: 2.5, color: '170,220,255'
            });
            const sdx = state.ship.x - STATION.x - nx * R;
            const sdy = state.ship.y - STATION.y - ny * R;
            const near = 1 - Math.min(1, Math.sqrt(sdx * sdx + sdy * sdy) / 1400);
            if(near > 0) sounds.cityShield(0.25 * near * strength);
        }
    });
    STATION.impacts.forEach(impact => { impact.life -= dt * 0.8; });
    STATION.impacts = STATION.impacts.filter(impact => impact.life > 0);
};

const collectOre = (dt) => {
    const ship = state.ship;
    const cargoFull = cargoUsed() >= ship.cargoCapacity;
    if(state.cargoFullTimer > 0) state.cargoFullTimer -= dt;
    if(state.shieldHintTimer > 0) state.shieldHintTimer -= dt;

    const shielded = ship.shieldUp;

    state.ores.forEach(ore => {
        if(ore.dead) return;

        if(shielded) {
            // Raised shields block the tractor beam and vaporise ore that touches them.
            ore.update(dt, ship, false);
            const contact = ore.ejectTimer <= 0 && ship.shieldContact(ore.x, ore.y, ore.radius);
            if(contact) {
                ore.dead = true;
                ship.absorbOre(contact.x, contact.y);
                // Same impact as an asteroid striking the shield, just smaller.
                const shieldColor = ship.hullDef.shieldColor || '120,210,255';
                Particle.burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2, color: shieldColor
                });
                Particle.burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 4, {
                    minSpeed: 20, maxSpeed: 80, minLife: 0.2, maxLife: 0.45, size: 2, color: MATERIALS[ore.material].color
                });
                if(state.shieldHintTimer <= 0) {
                    state.shieldHintTimer = 8;
                    banner('Shields up: ore burns up! Lower shields (H) to collect.', 2.5);
                }
            }
            return;
        }

        const wasHeld = ore.tractored;
        const collected = ore.update(dt, ship, !cargoFull);
        if(ore.tractored && !wasHeld) sounds.tractorLock();
        if(!collected) return;

        if(storeOre(ore.material, ship.cargoCapacity)) {
            ore.dead = true;
            const material = MATERIALS[ore.material];
            sounds.pickup(material.price);
            floatText(ship.x, ship.y - ship.radius - 6, '+1 ' + material.name, material.color);
        } else if(state.cargoFullTimer <= 0) {
            state.cargoFullTimer = 4;
            banner('Cargo hold full! Return to the shipyard to sell.', 2.5);
        }
    });

    if(cargoFull && state.cargoFullTimer <= 0 && state.ores.some(o => !o.dead)) {
        state.cargoFullTimer = 6;
        banner('Cargo hold full! Return to the shipyard to sell.', 2.5);
    }
};

const step = (dt) => {
    const { ship, bullets, missiles, particles } = state;
    state.time += dt;

    // Mouse is in screen space; turrets need it in world space.
    input.aimX = (input.mouseX - world.width / 2) / zoom + state.camera.x;
    input.aimY = (input.mouseY - world.height / 2) / zoom + state.camera.y;

    ship.update(dt, input, state);
    state.beamHits.forEach(hit => {
        const push = Math.min(0.6, 900 * hit.damage / hit.rock.mass);
        hit.rock.vx += hit.dirX * push;
        hit.rock.vy += hit.dirY * push;
        hitRock(hit.rock, hit.damage, hit.x, hit.y, hit.dirX, hit.dirY, 'beam');
        if(Math.random() < 0.35) {
            Particle.burst(state.particles, hit.x, hit.y, hit.rock.vx - hit.dirX * 60, hit.rock.vy - hit.dirY * 60, 1, {
                minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 2, color: '190,230,255'
            });
        }
        sounds.beamImpact();
    });
    state.beamHits = [];
    applyGravity(dt);

    state.rocks.forEach(rock => rock.update(dt));
    updateMerges(dt);
    state.shockwaves.forEach(wave => {
        wave.life -= dt * 2.2;
        wave.radius += (wave.maxRadius - wave.radius) * Math.min(1, dt * 9);
    });
    state.shockwaves = state.shockwaves.filter(wave => wave.life > 0);
    state.flashes.forEach(f => { f.life -= dt; });
    state.flashes = state.flashes.filter(f => f.life > 0);
    state.ores.forEach(ore => {
        if(ore.trail > 0) {
            ore.trail -= dt;
            if(Math.random() < 0.7) {
                state.particles.push(new Particle({
                    x: ore.x, y: ore.y, vx: ore.vx * 0.2, vy: ore.vy * 0.2,
                    life: 0.25 + Math.random() * 0.2, size: 2, color: MATERIALS[ore.material].color
                }));
            }
        }
    });
    updateScanner(dt);
    if(state.system.station) cityShield(dt);
    state.gate.update(dt);
    checkGateTravel(dt);
    bullets.forEach(bullet => {
        if(bullet.kind === 'plasma' && Math.random() < 0.6) {
            state.particles.push(new Particle({
                x: bullet.x, y: bullet.y,
                vx: bullet.vx * 0.15 + (Math.random() - 0.5) * 40, vy: bullet.vy * 0.15 + (Math.random() - 0.5) * 40,
                life: 0.2 + Math.random() * 0.25, size: 3, color: Math.random() < 0.5 ? '255,140,40' : '255,210,110'
            }));
        }
    });
    bullets.forEach(bullet => bullet.update(dt));
    missiles.forEach(missile => missile.update(dt, state.rocks, particles));
    particles.forEach(particle => particle.update(dt));
    collectOre(dt);
    state.floatingTexts.forEach(text => {
        text.life -= dt;
        text.y -= 30 * dt;
    });

    bulletCollisions();
    missileCollisions();
    rockCollisions();
    shipCollisions();

    // Remove dead objects only after all iteration is done (no splicing mid-loop).
    state.rocks = state.rocks.filter(rock => !rock.dead).concat(state.newRocks);
    state.newRocks = [];
    state.bullets = bullets.filter(bullet => !bullet.dead);
    state.missiles = missiles.filter(missile => !missile.dead);
    state.particles = particles.filter(particle => !particle.dead);
    state.ores = state.ores.filter(ore => !ore.dead);
    state.floatingTexts = state.floatingTexts.filter(text => text.life > 0);
    let dustCount = 0;
    state.particles.forEach(particle => { if(particle.dust) dustCount++; });
    if(dustCount > MAX_DUST) {
        let excess = dustCount - MAX_DUST;
        state.particles = state.particles.filter(particle => !(particle.dust && excess-- > 0));
    }
    // On slower computers the cap shrinks with the frame rate, thinning effects instead of stuttering.
    const particleCap = fps < 30 ? 800 : fps < 45 ? 1100 : MAX_PARTICLES;
    if(state.particles.length > particleCap) {
        state.particles = state.particles.slice(state.particles.length - particleCap);
    }

    // Stream the endless map in and out around the ship.
    state.sectorTimer -= dt;
    if(state.sectorTimer <= 0) {
        state.sectorTimer = SECTOR_UPDATE_INTERVAL;
        state.rocks = state.sectors.update(ship.x, ship.y, state.rocks);
        state.ores = state.ores.filter(ore => Math.abs(ore.x - ship.x) < 5000 && Math.abs(ore.y - ship.y) < 5000);
    }

    // Camera leads slightly in the direction of travel.
    const followRate = Math.min(1, dt * 4);
    state.camera.x += (ship.x + ship.vx * 0.25 - state.camera.x) * followRate;
    state.camera.y += (ship.y + ship.vy * 0.25 - state.camera.y) * followRate;

    state.canDock = !!state.system.station && ship.alive && distanceToStation() < STATION.dockRadius;
    const dhd = state.gate.dhd;
    state.nearDHD = ship.alive && Math.sqrt((ship.x - dhd.x) * (ship.x - dhd.x) + (ship.y - dhd.y) * (ship.y - dhd.y)) < DHD_RANGE;
    if(state.bannerTimer > 0) state.bannerTimer -= dt;
    if(!ship.alive) state.gameOverTimer += dt;
};

// ---------------------------------------------------------------- star systems & travel

// Load a star system: new fields, gate and backdrop. `how` is 'gate' (emerge from the
// destination gate) or 'hyper' (drop out of hyperspace near the gate).
const enterSystem = (system, how) => {
    state.system = system;
    state.gate = new Stargate(system.gate.x, system.gate.y);
    state.sectors = makeSectors(system);
    ['rocks', 'newRocks', 'bullets', 'missiles', 'particles', 'ores', 'mergeLinks', 'flashes', 'shockwaves', 'beamHits', 'floatingTexts']
        .forEach(key => { state[key] = []; });
    state.scan.target = null;
    state.scan.pings = [];
    STATION.impacts = [];

    const ship = state.ship;
    const gate = state.gate;
    if(how === 'gate') {
        ship.x = gate.x;
        ship.y = gate.y;
        ship.angle = -Math.PI / 2;
        ship.vx = 0;
        ship.vy = -150;
        gate.incoming();
    } else {
        const a = Math.random() * Math.PI * 2;
        ship.x = gate.x + Math.cos(a) * 1300;
        ship.y = gate.y + Math.sin(a) * 1300;
        ship.angle = a + Math.PI;
        ship.vx = Math.cos(ship.angle) * 220;
        ship.vy = Math.sin(ship.angle) * 220;
    }
    ship.angularVelocity = 0;
    state.camera.x = ship.x;
    state.camera.y = ship.y;
    state.rocks = state.sectors.update(ship.x, ship.y, []);
    banner('Arrived at ' + system.name, 2.5);
};

// Flying into an open, outgoing wormhole starts the trip (if the ship fits).
const checkGateTravel = (dt) => {
    const ship = state.ship;
    const gate = state.gate;
    if(state.tooBigTimer > 0) state.tooBigTimer -= dt;
    if(state.transition || !ship.alive || !gate.isOpen || !gate.outgoing) return;
    const dx = ship.x - gate.x;
    const dy = ship.y - gate.y;
    if(dx * dx + dy * dy > Math.pow(GATE_INNER * 0.8, 2)) return;
    if(ship.radius > GATE_INNER * 0.95) {
        if(state.tooBigTimer <= 0) {
            state.tooBigTimer = 3;
            banner('Ship too large for the Stargate: use a hyperdrive.', 2.5);
        }
        return;
    }
    startTransition({ type: 'gate', phase: 'enter', t: 0, target: systemById(gate.target) });
    sounds.gateEnter();
};

const startTransition = (transition) => {
    state.transition = transition;
    input.reset();
    input.enabled = false;
    if(transition.type === 'hyper') sounds.hyperOpen();
};

const startHyperjump = (target) => {
    const ship = state.ship;
    const distance = distanceBetween(state.system.id, target.id);
    const duration = hyperTravelTime(distance, ship.hyperdrive.speed);
    startTransition({
        type: 'hyper', phase: 'window', t: 0, target: target, duration: duration, distance: distance,
        wx: ship.x + Math.cos(ship.angle) * (ship.radius + 260),
        wy: ship.y + Math.sin(ship.angle) * (ship.radius + 260),
        size: Math.max(90, ship.radius * 2.4)
    });
    banner('Hyperdrive engaged: ' + target.name, 2);
};

const TUNNEL_PHASES = { tunnel: true, travel: true };

// Advance a gate trip or hyperspace jump. Returns true while the world is hidden.
const updateTransition = (dt) => {
    const tr = state.transition;
    const ship = state.ship;
    tr.t += dt;

    if(tr.type === 'gate') {
        if(tr.phase === 'enter') {
            // Pulled into the horizon.
            ship.vx += (state.gate.x - ship.x) * dt * 6;
            ship.vy += (state.gate.y - ship.y) * dt * 6;
            if(tr.t > 0.25) ship.hidden = true;
            if(tr.t >= 0.5) {
                tr.phase = 'tunnel';
                tr.t = 0;
                sounds.stopAll();
                state.gate.close(true);
                sounds.wormhole();
            }
        } else if(tr.phase === 'tunnel' && tr.t >= 3.4) {
            enterSystem(tr.target, 'gate');
            ship.hidden = false;
            tr.phase = 'exit';
            tr.t = 0;
            sounds.startEngine();
            sounds.gateArrive();
            sounds.horizon(true);
        } else if(tr.phase === 'exit' && tr.t >= 0.8) {
            state.transition = null;
            input.enabled = true;
        }
    } else {
        if(tr.phase === 'window') {
            // The window opens ahead; the ship surges into it.
            tr.open = Math.min(1, tr.t / 1);
            if(tr.t > 0.7) {
                const dx = tr.wx - ship.x;
                const dy = tr.wy - ship.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 1;
                ship.vx += dx / d * 900 * dt;
                ship.vy += dy / d * 900 * dt;
                if(d < tr.size * 0.4) ship.hidden = true;
            }
            if(tr.t >= 2.2) {
                ship.hidden = true;
                tr.phase = 'travel';
                tr.t = 0;
                sounds.stopAll();
                sounds.hyperTravel(true);
            }
        } else if(tr.phase === 'travel' && tr.t >= tr.duration) {
            sounds.hyperTravel(false);
            sounds.hyperExit();
            enterSystem(tr.target, 'hyper');
            tr.phase = 'exit';
            tr.t = 0;
            tr.wx = ship.x - Math.cos(ship.angle) * 30;
            tr.wy = ship.y - Math.sin(ship.angle) * 30;
            ship.hidden = false;
            sounds.startEngine();
        } else if(tr.phase === 'exit') {
            tr.open = Math.max(0, 1 - tr.t / 1.6);
            if(tr.t >= 1.6) {
                state.transition = null;
                input.enabled = true;
            }
        }
    }
    return !!TUNNEL_PHASES[tr.phase];
};

// ---------------------------------------------------------------- render

const hash = (x, y, salt) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const STAR_LAYERS = [
    { factor: 0.1, cell: 180, size: 1, alpha: 0.45 },
    { factor: 0.3, cell: 240, size: 1.4, alpha: 0.65 },
    { factor: 0.6, cell: 320, size: 2, alpha: 0.9 }
];

// Parallax starfield generated from the camera position, so it never runs out.
const drawStarfield = () => {
    const w = world.width;
    const h = world.height;
    STAR_LAYERS.forEach((layer, index) => {
        const offsetX = state.camera.x * layer.factor;
        const offsetY = state.camera.y * layer.factor;
        const startX = Math.floor((offsetX - w / 2) / layer.cell);
        const startY = Math.floor((offsetY - h / 2) / layer.cell);
        const endX = Math.floor((offsetX + w / 2) / layer.cell);
        const endY = Math.floor((offsetY + h / 2) / layer.cell);
        ctx.fillStyle = 'rgba(220, 230, 255, ' + layer.alpha + ')';
        for(let cx = startX; cx <= endX; cx++) {
            for(let cy = startY; cy <= endY; cy++) {
                for(let s = 0; s < 2; s++) {
                    const x = (cx + hash(cx, cy, index * 7 + s)) * layer.cell - offsetX + w / 2;
                    const y = (cy + hash(cy, cx, index * 13 + s + 3)) * layer.cell - offsetY + h / 2;
                    ctx.fillRect(x, y, layer.size, layer.size);
                }
            }
        }
    });
};

const isVisible = (x, y, r) => {
    const halfW = world.width / (2 * zoom) + r;
    const halfH = world.height / (2 * zoom) + r;
    return Math.abs(x - state.camera.x) < halfW && Math.abs(y - state.camera.y) < halfH;
};

const drawCrosshair = () => {
    const x = input.mouseX;
    const y = input.mouseY;
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.moveTo(x - 13, y); ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y); ctx.lineTo(x + 13, y);
    ctx.moveTo(x, y - 13); ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 13);
    ctx.stroke();
};

// Guidance overlay: green brackets on turret targets, red diamond on the missile lock.
const drawTargeting = (time) => {
    const ship = state.ship;
    if(!ship.alive || !ship.guidance) return;

    ctx.save();
    ctx.lineWidth = 1.5;

    const targets = [];
    ship.turrets.forEach(turret => {
        if(turret.target && targets.indexOf(turret.target) === -1) targets.push(turret.target);
    });

    ctx.strokeStyle = 'rgba(140, 255, 160, 0.85)';
    targets.forEach(rock => {
        const r = rock.radius + 6;
        const c = r * 0.45;
        ctx.beginPath();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(corner => {
            const x = rock.x + corner[0] * r;
            const y = rock.y + corner[1] * r;
            ctx.moveTo(x - corner[0] * c, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y - corner[1] * c);
        });
        ctx.stroke();
    });

    const lock = ship.missileLock;
    if(lock && ship.launchers.length > 0) {
        const r = lock.radius + 12;
        ctx.strokeStyle = 'rgba(255, 110, 110, 0.9)';
        ctx.translate(lock.x, lock.y);
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.lineTo(0, -r);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
};

// Tractor beam: a soft cone from the emitter to each ore piece it holds, with energy
// rings travelling down the beam, glowing motes flowing in, a spinning containment
// ring around the ore, and a pulsing aura and scan arcs around the ship.
const TRACTOR = '120,255,230';

const drawTractor = (time) => {
    const ship = state.ship;
    const held = state.ores.filter(ore => ore.tractored && !ore.dead);
    state.tractorActive = held.length > 0;
    state.tractorCount = held.length;
    if(!held.length || !ship.alive) return;

    const emitter = ship.tractorEmitter();
    const glow = glowSprite(TRACTOR);
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Range ring with rotating scan arcs.
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', ' + (0.08 + 0.06 * pulse) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.magnetRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.35)';
    ctx.lineWidth = 2;
    for(let i = 0; i < 3; i++) {
        const a = time * 1.4 + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.magnetRange, a, a + 0.5);
        ctx.stroke();
    }

    held.forEach(ore => {
        const dx = ore.x - emitter.x;
        const dy = ore.y - emitter.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const nx = -uy;
        const ny = ux;
        const angle = Math.atan2(dy, dx);
        const wide = 9;

        // Cone.
        const cone = ctx.createLinearGradient(emitter.x, emitter.y, ore.x, ore.y);
        cone.addColorStop(0, 'rgba(' + TRACTOR + ', 0.4)');
        cone.addColorStop(1, 'rgba(' + TRACTOR + ', 0.06)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(emitter.x + nx * 2, emitter.y + ny * 2);
        ctx.lineTo(ore.x + nx * wide, ore.y + ny * wide);
        ctx.lineTo(ore.x - nx * wide, ore.y - ny * wide);
        ctx.lineTo(emitter.x - nx * 2, emitter.y - ny * 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(emitter.x + nx * 2, emitter.y + ny * 2);
        ctx.lineTo(ore.x + nx * wide, ore.y + ny * wide);
        ctx.moveTo(emitter.x - nx * 2, emitter.y - ny * 2);
        ctx.lineTo(ore.x - nx * wide, ore.y - ny * wide);
        ctx.stroke();

        // Energy rings travelling towards the ship.
        ctx.strokeStyle = 'rgba(200, 255, 245, 0.55)';
        ctx.lineWidth = 1.2;
        for(let i = 0; i < 3; i++) {
            const t = 1 - ((time * 1.6 + i / 3 + ore.angle) % 1);
            const x = emitter.x + dx * t;
            const y = emitter.y + dy * t;
            const r = 2 + (wide - 2) * t;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 1.6, r, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Motes flowing inwards with a slight weave.
        ctx.fillStyle = 'rgba(220, 255, 250, 0.9)';
        for(let i = 0; i < 5; i++) {
            const t = 1 - ((time * 2.3 + i / 5 + ore.angle * 0.5) % 1);
            const weave = Math.sin(time * 9 + i * 2) * (wide * 0.5) * t;
            ctx.fillRect(emitter.x + dx * t + nx * weave - 1, emitter.y + dy * t + ny * weave - 1, 2, 2);
        }

        // Containment field around the captured ore.
        ctx.globalAlpha = 0.5 + 0.3 * pulse;
        stamp(ctx, glow, ore.x, ore.y, 26, 26);
        ctx.globalAlpha = 1;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -time * 20;
        ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ore.x, ore.y, 7 + pulse * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // Emitter aura.
    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    stamp(ctx, glow, emitter.x, emitter.y, 30 + pulse * 10, 30 + pulse * 10);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(' + TRACTOR + ', 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(emitter.x, emitter.y, 9, time * 3, time * 3 + Math.PI * 1.2);
    ctx.stroke();
    ctx.restore();
};

// ---------------------------------------------------------------- ore scanner

// Estimated sale value of everything an asteroid would yield.
const rockValue = (rock) => {
    let perArea = 0;
    Object.keys(rock.composition).forEach(id => { perArea += rock.composition[id] * MATERIALS[id].price; });
    return Math.round(rock.area / 120 * perArea);
};

// Periodic scan: ping, then lock onto the richest asteroid in range (value vs. distance).
const updateScanner = (dt) => {
    const ship = state.ship;
    const scan = state.scan;
    scan.pings.forEach(ping => {
        ping.life -= dt / 1.4;
        ping.radius = ping.range * (1 - ping.life);
    });
    scan.pings = scan.pings.filter(ping => ping.life > 0);
    if(!ship.scanner || !ship.alive) {
        scan.target = null;
        return;
    }

    if(scan.target && scan.target.dead) scan.target = null;
    scan.timer -= dt;
    if(scan.timer > 0 && scan.target) return;
    if(scan.timer > 0) return;
    scan.timer = ship.scanner.interval;

    const range = ship.scanner.range;
    let best = null;
    let bestScore = 0;
    state.rocks.forEach(rock => {
        if(rock.dead || rock.merging) return;
        const dx = rock.x - ship.x;
        const dy = rock.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if(distance > range) return;
        const value = rockValue(rock);
        const score = value / (1 + distance / 1200);
        if(score > bestScore) {
            bestScore = score;
            best = rock;
        }
    });
    scan.target = best;
    scan.value = best ? rockValue(best) : 0;
    scan.pings.push({ x: ship.x, y: ship.y, range: range, radius: 0, life: 1 });
    sounds.scanPing();
};

// World-space: ping rings, target brackets with a label, and a dashed guide line.
const drawScanner = (time) => {
    const ship = state.ship;
    const scan = state.scan;
    ctx.save();
    scan.pings.forEach(ping => {
        ctx.strokeStyle = 'rgba(190, 255, 140, ' + (0.35 * ping.life) + ')';
        ctx.lineWidth = 2 / zoom + 3 * ping.life;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.stroke();
    });

    const target = scan.target;
    if(target && ship.alive) {
        const color = MATERIALS[target.material].color;
        const r = target.boundRadius + 10;
        // Rotating corner brackets.
        ctx.strokeStyle = 'rgba(' + color + ', 0.95)';
        ctx.lineWidth = 2;
        for(let i = 0; i < 4; i++) {
            const a = time * 0.8 + i * Math.PI / 2;
            ctx.beginPath();
            ctx.arc(target.x, target.y, r, a, a + 0.6);
            ctx.stroke();
        }
        ctx.font = '12px Bungee, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(' + color + ', 0.95)';
        ctx.fillText(MATERIALS[target.material].name.toUpperCase() + ' · ~' + scan.value.toLocaleString('en-US') + ' cr',
            target.x, target.y - r - 8);

        // Guide line from the ship.
        const dx = target.x - ship.x;
        const dy = target.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        if(distance > r + ship.radius) {
            ctx.setLineDash([8, 10]);
            ctx.lineDashOffset = -time * 40;
            ctx.strokeStyle = 'rgba(' + color + ', 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ship.x + dx / distance * (ship.radius + 10), ship.y + dy / distance * (ship.radius + 10));
            ctx.lineTo(target.x - dx / distance * r, target.y - dy / distance * r);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    ctx.restore();
};

// Screen-space arrow to the scanner target when it's off screen.
const drawScannerPointer = () => {
    const target = state.scan.target;
    if(!target || !state.ship.alive) return;
    const sx = (target.x - state.camera.x) * zoom + world.width / 2;
    const sy = (target.y - state.camera.y) * zoom + world.height / 2;
    if(sx > 0 && sx < world.width && sy > 0 && sy < world.height) return;

    const margin = 46;
    const cx = world.width / 2;
    const cy = world.height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;
    const color = MATERIALS[target.material].color;
    const distance = Math.sqrt(Math.pow(target.x - state.ship.x, 2) + Math.pow(target.y - state.ship.y, 2));

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(' + color + ', 0.95)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MATERIALS[target.material].name.toUpperCase() + ' ' + (distance / 1000).toFixed(1) + 'k',
        -Math.cos(angle) * 30, -Math.sin(angle) * 30 + 4);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

const drawFlashes = () => {
    if(!state.flashes.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.flashes.forEach(f => {
        const t = f.life / f.maxLife;
        ctx.globalAlpha = t;
        stamp(ctx, glowSprite(f.color), f.x, f.y, f.size * (0.6 + 0.4 * t), f.size * (0.6 + 0.4 * t));
    });
    ctx.restore();
};

const drawShockwaves = () => {
    if(!state.shockwaves.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.shockwaves.forEach(wave => {
        const glow = wave.maxRadius * 1.6 * wave.life;
        ctx.globalAlpha = wave.life * 0.8;
        stamp(ctx, glowSprite(wave.color), wave.x, wave.y, glow, glow);
        ctx.globalAlpha = wave.life;
        ctx.strokeStyle = 'rgb(' + wave.color + ')';
        ctx.lineWidth = 1 + 4 * wave.life;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.restore();
};

const drawFloatingTexts = () => {
    ctx.save();
    ctx.font = '12px Bungee, sans-serif';
    ctx.textAlign = 'center';
    state.floatingTexts.forEach(text => {
        ctx.fillStyle = 'rgba(' + text.color + ',' + Math.min(1, text.life).toFixed(2) + ')';
        ctx.fillText(text.text, text.x, text.y);
    });
    ctx.restore();
};

const drawBanner = () => {
    if(state.bannerTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    ctx.font = '30px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeText(state.bannerText, world.width / 2, world.height / 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(state.bannerText, world.width / 2, world.height / 4);
    ctx.restore();
};

const drawDockPrompt = () => {
    if(!state.canDock) return;
    const ship = state.ship;
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    const text = speed > STATION.maxDockSpeed ? (TOUCH ? 'Slow down to dock (turn on Stabilizer)' : 'Slow down to dock (X: stabilizer)')
        : (TOUCH ? 'Tap Dock to enter the shipyard' : 'Press B to dock at the shipyard');
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = speed > STATION.maxDockSpeed ? 'rgba(255, 200, 120, 0.95)' : 'rgba(140, 255, 160, 0.95)';
    ctx.fillText(text, world.width / 2, world.height - 60);
    ctx.restore();
};

// Edge-of-screen pointer to the shipyard when it's out of view.
const drawStationPointer = () => {
    const sx = (STATION.x - state.camera.x) * zoom + world.width / 2;
    const sy = (STATION.y - state.camera.y) * zoom + world.height / 2;
    const margin = 40;
    if(sx > -100 && sx < world.width + 100 && sy > -100 && sy < world.height + 100) return;

    const cx = world.width / 2;
    const cy = world.height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(
        Math.abs((cx - margin) / Math.cos(angle) || Infinity),
        Math.abs((cy - margin) / Math.sin(angle) || Infinity)
    );
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(140, 200, 255, 0.9)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASE ' + (distanceToStation() / 1000).toFixed(1) + 'k', -Math.cos(angle) * 26, -Math.sin(angle) * 26 + 4);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, 0); ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

// Weapon readiness: heat for miniguns, recharge for beams, reload for launchers.
// Screen rectangles of the weapon panel rows (for clicking/tapping a weapon on or off).
let weaponRows = [];

const toggleWeapon = (kind) => {
    if(!state || state.paused || !state.ship.alive) return;
    const ship = state.ship;
    const on = ship.toggleWeapon(kind);
    const row = ship.weaponStatus().filter(w => w.kind === kind)[0];
    sounds.toggle(on);
    banner((row ? row.name : kind) + (on ? ' ON' : ' OFF'), 1.1);
};

// A click/tap on the weapon panel toggles that weapon (and doesn't fire).
const weaponPanelClick = (x, y) => {
    if(!state || state.paused) return false;
    const row = weaponRows.filter(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)[0];
    if(!row) return false;
    toggleWeapon(row.kind);
    return true;
};

const drawWeaponPanel = () => {
    weaponRows = [];
    const weapons = state.ship.weaponStatus();
    if(!weapons.length) return;
    // On touch screens the bottom corners belong to the thumbs: a compact panel sits left
    // of the minimap instead.
    const rowHeight = TOUCH ? 16 : 22;
    const header = TOUCH ? 6 : 22;
    const width = TOUCH ? 196 : 230;
    const barOffset = TOUCH ? 86 : 108;
    const barW = TOUCH ? 50 : 70;
    const left = TOUCH ? world.width - Math.min(120, Math.round(world.height * 0.28)) - 20 - width : 16;
    const top = TOUCH ? 10 : world.height - 16 - weapons.length * rowHeight - 18;
    const height = weapons.length * rowHeight + header + (TOUCH ? 2 : 0);

    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.4)';
    ctx.fillRect(left, top, width, height);
    ctx.strokeRect(left, top, width, height);
    if(!TOUCH) {
        ctx.font = '10px Bungee, sans-serif';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
        ctx.fillText('WEAPONS', left + 8, top + 14);
    }

    const labels = { ready: 'READY', hot: 'HOT', overheated: 'OVERHEAT', firing: 'FIRING', charging: 'CHARGING', reloading: 'RELOAD', off: 'OFF' };
    weapons.forEach((w, i) => {
        const y = top + header + i * rowHeight - (TOUCH ? 2 : 0);
        weaponRows.push({ x: left, y: y, w: width, h: rowHeight, kind: w.kind });
        ctx.globalAlpha = w.off ? 0.4 : 1;
        ctx.fillStyle = 'rgb(' + w.color + ')';
        ctx.font = (TOUCH ? '9px' : '11px') + ' Bungee, sans-serif';
        // The number key that switches this weapon on/off.
        ctx.fillText((i < 5 && !TOUCH ? (i + 1) + ' ' : '') + w.name + (w.count > 1 ? ' x' + w.count : ''), left + (TOUCH ? 6 : 8), y + 11);

        const barX = left + barOffset;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(barX, y + 3, barW, 8);
        const warn = w.state === 'overheated' || w.state === 'hot';
        ctx.fillStyle = warn ? (w.state === 'overheated' ? 'rgb(255, 80, 60)' : 'rgb(255, 170, 70)') : 'rgb(' + w.color + ')';
        ctx.fillRect(barX + 1, y + 4, (barW - 2) * w.ready, 6);

        ctx.font = (TOUCH ? '8px' : '9px') + ' Bungee, sans-serif';
        ctx.globalAlpha = 1;
        ctx.fillStyle = w.off ? 'rgba(255, 110, 90, 0.95)' : w.state === 'ready' ? 'rgba(140, 255, 160, 0.9)' : (warn ? 'rgba(255, 140, 100, 0.95)' : 'rgba(200, 220, 255, 0.8)');
        ctx.fillText(labels[w.state], barX + barW + 5, y + 11);
    });
    ctx.restore();
};

// Distant planet and coloured nebula for the current system (slow parallax). These live
// in a layer behind the game canvas: the nebula is a CSS gradient and the planet a
// pre-rendered canvas moved with a CSS transform, so the browser composites them on the
// GPU instead of the game repainting large images every frame.
const backdrop = document.createElement('div');
backdrop.className = 'backdrop';
let backdropSystem = null;
let planetEl = null;

const setBackdrop = (system) => {
    if(backdropSystem === system.id) return;
    backdropSystem = system.id;
    backdrop.style.background = 'radial-gradient(ellipse at 30% 35%, rgba(' + system.tint + ', 0.22), transparent 60%), ' +
        'radial-gradient(ellipse at 75% 70%, rgba(' + system.tint + ', 0.16), transparent 55%)';
    if(planetEl) planetEl.remove();
    planetEl = planetSprite(system).canvas;
    planetEl.className = 'backdrop-planet';
    backdrop.appendChild(planetEl);
};

const drawBackdrop = () => {
    const system = state.system;
    setBackdrop(system);
    const w = world.width;
    const h = world.height;
    const planet = planetSprite(system);
    const parallax = 0.12;
    const px = w / 2 + (system.planet.x - state.camera.x) * parallax;
    const py = h / 2 + (system.planet.y - state.camera.y) * parallax;
    const size = system.planet.radius * 0.55 * (0.8 + 0.2 * zoom);
    const full = size * planet.width / (planet.R * 2);
    planetEl.style.width = full + 'px';
    planetEl.style.height = full + 'px';
    planetEl.style.transform = 'translate3d(' + (px - full / 2).toFixed(1) + 'px, ' + (py - full / 2).toFixed(1) + 'px, 0)';
};

// Full-screen wormhole or hyperspace tunnel while travelling.
const renderTunnel = () => {
    const tr = state.transition;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const time = state.transitionClock || 0;
    if(tr.type === 'gate') drawWormhole(ctx, world.width, world.height, time, Math.min(1, tr.t / 3.4));
    else {
        const remaining = Math.max(0, tr.duration - tr.t);
        drawHyperspace(ctx, world.width, world.height, time, Math.min(1, tr.t / tr.duration),
            'Hyperspace · ' + tr.target.name + ' · ' + Math.round(tr.distance).toLocaleString('en-US') + ' ly · ' + remaining.toFixed(1) + ' s');
    }
};

// White flash entering and leaving a wormhole.
const drawTravelOverlay = () => {
    const tr = state.transition;
    if(!tr || tr.type !== 'gate') return;
    let flash = 0;
    if(tr.phase === 'enter') flash = Math.max(0, (tr.t - 0.2) / 0.3);
    if(tr.phase === 'exit') flash = Math.max(0, 1 - tr.t / 0.8);
    if(flash <= 0) return;
    ctx.fillStyle = 'rgba(225, 238, 255, ' + Math.min(1, flash) + ')';
    ctx.fillRect(0, 0, world.width, world.height);
};

// Edge-of-screen pointer to this system's Stargate.
const drawGatePointer = () => {
    const gate = state.gate;
    const sx = (gate.x - state.camera.x) * zoom + world.width / 2;
    const sy = (gate.y - state.camera.y) * zoom + world.height / 2;
    if(sx > -60 && sx < world.width + 60 && sy > -60 && sy < world.height + 60) return;
    const margin = 40;
    const cx = world.width / 2;
    const cy = world.height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;
    const distance = Math.sqrt(Math.pow(gate.x - state.ship.x, 2) + Math.pow(gate.y - state.ship.y, 2));
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(255, 170, 110, 0.95)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GATE ' + (distance / 1000).toFixed(1) + 'k', -Math.cos(angle) * 26, -Math.sin(angle) * 26 + 18);
    ctx.strokeStyle = 'rgba(255, 170, 110, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

const drawMinimap = () => {
    const size = TOUCH ? Math.min(120, Math.round(world.height * 0.28)) : MINIMAP_SIZE;
    const left = world.width - size - (TOUCH ? 10 : 16);
    const top = TOUCH ? 10 : world.height - size - 16;
    const scale = (size / 2) / MINIMAP_RANGE;
    const cx = left + size / 2;
    const cy = top + size / 2;
    const ship = state.ship;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.94)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.fillRect(left, top, size, size);
    ctx.strokeRect(left, top, size, size);
    ctx.beginPath();
    ctx.rect(left, top, size, size);
    ctx.clip();

    // Range rings.
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.15)';
    [1000, 2000, 3000].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Without an ore scanner asteroids are just grey contacts; with one they're
    // coloured by their main metal and the scanner's pick is highlighted.
    const scanning = !!ship.scanner;
    if(scanning) {
        ctx.strokeStyle = 'rgba(190, 255, 140, 0.35)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, ship.scanner.range * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    state.rocks.forEach(rock => {
        const x = cx + (rock.x - ship.x) * scale;
        const y = cy + (rock.y - ship.y) * scale;
        ctx.fillStyle = scanning ? 'rgb(' + MATERIALS[rock.material].color + ')' : 'rgb(140, 140, 150)';
        const r = Math.max(1.2, rock.radius * scale * 1.5);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    const target = state.scan.target;
    if(target && Math.sin(state.time * 6) > -0.3) {
        ctx.strokeStyle = 'rgb(' + MATERIALS[target.material].color + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + (target.x - ship.x) * scale, cy + (target.y - ship.y) * scale, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Missiles (orange-red darts) and drones (gold diamonds), each with a short tail
    // showing which way it's heading.
    state.missiles.forEach(missile => {
        const x = cx + (missile.x - ship.x) * scale;
        const y = cy + (missile.y - ship.y) * scale;
        if(x < left || x > left + size || y < top || y > top + size) return;
        const drone = missile.kind === 'drone';
        const color = drone ? '255, 215, 110' : '255, 120, 80';
        const speed = Math.sqrt(missile.vx * missile.vx + missile.vy * missile.vy) || 1;
        ctx.strokeStyle = 'rgba(' + color + ', 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - missile.vx / speed * 6, y - missile.vy / speed * 6);
        ctx.stroke();
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(missile.angle);
        ctx.beginPath();
        if(drone) {
            ctx.moveTo(2.6, 0); ctx.lineTo(0, -1.8); ctx.lineTo(-2.6, 0); ctx.lineTo(0, 1.8);
        } else {
            ctx.moveTo(3.2, 0); ctx.lineTo(-2.2, -1.8); ctx.lineTo(-2.2, 1.8);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    // Station (Lantea only) and Stargate, clamped to the edge when far away.
    const limit = size / 2 - 6;
    const marker = (x, y) => {
        let mx = (x - ship.x) * scale;
        let my = (y - ship.y) * scale;
        const furthest = Math.max(Math.abs(mx), Math.abs(my));
        if(furthest > limit) {
            mx *= limit / furthest;
            my *= limit / furthest;
        }
        return { x: cx + mx, y: cy + my };
    };
    ctx.lineWidth = 1.5;
    if(state.system.station) {
        const st = marker(STATION.x, STATION.y);
        ctx.strokeStyle = 'rgb(140, 200, 255)';
        ctx.strokeRect(st.x - 4, st.y - 4, 8, 8);
    }
    const gm = marker(state.gate.x, state.gate.y);
    ctx.strokeStyle = 'rgb(255, 170, 110)';
    ctx.beginPath();
    ctx.arc(gm.x, gm.y, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(cx, cy);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText(ship.scanner ? 'ORE SCANNER ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k' : 'SENSORS ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k',
        left + 6, top + 14);
    ctx.restore();
};

const render = () => {
    const time = state.time;
    resetRebuildBudget();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, world.width, world.height);
    drawBackdrop();
    drawStarfield();

    ctx.save();
    ctx.translate(world.width / 2, world.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-state.camera.x, -state.camera.y);

    if(state.system.station && isVisible(STATION.x, STATION.y, 460)) drawStation(ctx, time, state.canDock);
    if(isVisible(state.gate.x, state.gate.y, 300)) {
        state.gate.draw(ctx, time);
        state.gate.drawDHD(ctx, time, state.nearDHD);
    }

    const visibleRocks = state.rocks.filter(rock => {
        if(isVisible(rock.x, rock.y, rock.radius * 1.3)) return true;
        // Free the cached image of rocks well off screen.
        if(rock.sprite && !isVisible(rock.x, rock.y, 900)) rock.releaseSprite();
        return false;
    });
    // Merging guests are drawn first so they sink beneath their host.
    visibleRocks.forEach(rock => { if(rock.merging && rock.merging.guest === rock) rock.draw(ctx, time); });
    visibleRocks.forEach(rock => { if(!(rock.merging && rock.merging.guest === rock)) rock.draw(ctx, time); });
    state.particles.forEach(particle => { if(isUnlit(particle) && isVisible(particle.x, particle.y, 20)) particle.draw(ctx); });
    drawTractor(time);
    state.ores.forEach(ore => { if(isVisible(ore.x, ore.y, 10)) ore.draw(ctx, time); });
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => { if(!isUnlit(particle) && isVisible(particle.x, particle.y, 10)) particle.draw(ctx); });
    ctx.restore();

    // Kinetic tracers: a long faint orange tail, a yellow body and a short white-hot
    // head, each batched into one path (cheap even with hundreds of rounds in flight).
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    [[0.034, 3.4, 'rgba(255, 140, 50, 0.22)'], [0.018, 2.2, 'rgba(255, 210, 120, 0.6)'], [0.007, 1.5, 'rgba(255, 255, 240, 1)']].forEach(layer => {
        ctx.beginPath();
        state.bullets.forEach(bullet => {
            if(bullet.kind !== 'bullet') return;
            const age = Math.min(1, (1.4 - bullet.life) * 12);   // tracer grows out of the muzzle
            ctx.moveTo(bullet.x - bullet.vx * layer[0] * age, bullet.y - bullet.vy * layer[0] * age);
            ctx.lineTo(bullet.x, bullet.y);
        });
        ctx.lineWidth = layer[1];
        ctx.strokeStyle = layer[2];
        ctx.stroke();
    });
    ctx.restore();
    state.bullets.forEach(bullet => { if(bullet.kind !== 'bullet') bullet.draw(ctx); });

    state.missiles.forEach(missile => missile.draw(ctx));
    drawShockwaves();
    drawFlashes();
    drawScanner(time);
    const tr = state.transition;
    if(tr && tr.type === 'hyper' && tr.open > 0) drawHyperWindow(ctx, tr.wx, tr.wy, tr.size, time, tr.open);
    state.ship.draw(ctx);
    drawFloatingTexts();
    ctx.restore();

    if(state.system.station) drawStationPointer();
    drawGatePointer();
    drawTravelOverlay();
    drawMinimap();
    drawScannerPointer();
    drawWeaponPanel();
    drawDockPrompt();
    if(!state.paused && (!TOUCH || input.mouseDown)) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- cargo hold panel

const ejectOre = (material, count) => {
    if(!state || !state.ship.alive) return;
    const ship = state.ship;
    const removed = removeCargo(material, count);
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);
    const stern = ship.localToWorld(-ship.radius * 0.7, 0);
    for(let i = 0; i < removed; i++) {
        const spread = (Math.random() - 0.5) * 1.4;
        const speed = 60 + Math.random() * 60;
        const ore = new Ore(stern.x + (Math.random() - 0.5) * 8, stern.y + (Math.random() - 0.5) * 8,
            ship.vx - Math.cos(ship.angle + spread) * speed, ship.vy - Math.sin(ship.angle + spread) * speed, material);
        ore.ejectTimer = 3;
        state.ores.push(ore);
    }
    if(removed) {
        sounds.pickup(1);
        floatText(stern.x - cos * 10, stern.y - sin * 10, '-' + removed + ' ' + MATERIALS[material].name, '255,170,140');
    }
};

const renderCargoPanel = () => {
    if(!cargoPanel || cargoPanel.style.display === 'none') return;
    const profile = getProfile();
    const capacity = state ? state.ship.cargoCapacity : 0;
    const used = cargoUsed();
    let value = 0;

    let html = '<div class="cargo-header"><span>Cargo hold</span><button data-close="1">×</button></div>' +
        '<div class="cargo-capacity"><div class="cargo-capacity-fill" style="width:' +
        Math.round(Math.min(1, used / Math.max(1, capacity)) * 100) + '%"></div></div>' +
        '<div class="cargo-sub">' + used + ' / ' + capacity + ' units</div><table>';
    MATERIAL_ORDER.forEach(id => {
        const amount = profile.cargo[id] || 0;
        if(!amount) return;
        const material = MATERIALS[id];
        value += amount * material.price;
        html += '<tr><td><span class="swatch" style="background:rgb(' + material.color + ');box-shadow:0 0 6px rgb(' + material.color + ')"></span>' +
            material.name + '</td><td>' + amount + '</td><td>' + (amount * material.price) + ' cr</td>' +
            '<td><button data-eject="' + id + '" data-count="1">Eject 1</button>' +
            '<button data-eject="' + id + '" data-count="all">All</button></td></tr>';
    });
    html += '</table>';
    html += used ? '<div class="cargo-sub">Value at Atlantis: ' + value.toLocaleString('en-US') + ' cr</div>' +
        '<button class="cargo-eject-all" data-eject="*">Eject everything</button>'
        : '<div class="cargo-sub">The hold is empty. Lower shields (H) and fly near ore to collect it.</div>';
    cargoPanel.innerHTML = html;
};

const toggleCargoPanel = (show) => {
    if(!cargoPanel) return;
    const visible = show === undefined ? cargoPanel.style.display === 'none' : show;
    cargoPanel.style.display = visible ? '' : 'none';
    renderCargoPanel();
};

// ---------------------------------------------------------------- DHD & starmap

const openDHD = () => {
    const gate = state.gate;
    state.paused = true;
    freeze(true);
    getDHD().open({
        systemId: state.system.id,
        systemName: state.system.name,
        originIndex: originIndex(state.system),
        originName: state.system.origin,
        busy: gate.busy,
        onDial: (target, symbols) => {
            gate.dial(target.id, symbols);
            banner('Dialling ' + target.name + '...', 2.5);
        },
        onCancel: () => {
            gate.close();
            banner('Stargate shut down', 1.5);
        },
        onClose: () => {
            if(!state) return;
            state.paused = false;
            freeze(false);
        }
    });
};

const openStarmap = () => {
    state.paused = true;
    freeze(true);
    let engageTarget = null;
    getStarmap().open({
        systemId: state.system.id,
        originIndex: originIndex(state.system),
        hyperdrive: state.ship.hyperdrive,
        onEngage: (target) => { engageTarget = target; },
        onClose: () => {
            if(!state) return;
            state.paused = false;
            freeze(false);
            if(engageTarget) startHyperjump(engageTarget);
        }
    });
};

// ---------------------------------------------------------------- loop & menus

const freeze = (frozen) => {
    input.reset();
    input.enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
    shieldButton.style.display = state && !frozen ? '' : 'none';
    cargoButton.style.display = state && !frozen ? '' : 'none';
    starmapButton.style.display = state && !frozen ? '' : 'none';
    backdrop.style.display = state ? '' : 'none';
    if(touchControls) touchControls.show(!!state && !frozen);
    if(frozen) toggleCargoPanel(false);
    if(frozen) {
        sounds.stopAll();
    } else {
        sounds.startEngine();
        lastFrameTime = performance.now();
        accumulator = 0;
    }
};

const setPaused = (paused) => {
    if(!state) return;
    state.paused = paused;
    pauseMenu.style.visibility = paused ? 'visible' : 'hidden';
    freeze(paused);
};

const dock = () => {
    const ship = state.ship;
    state.paused = true;
    state.docked = true;
    freeze(true);
    ship.vx = 0;
    ship.vy = 0;
    ship.angularVelocity = 0;

    sounds.dock();
    getShipyard().open({
        tab: cargoUsed() > 0 ? 'market' : 'ship',
        closeLabel: 'Undock',
        canTrade: true,
        hullStatus: () => ({ hp: state.ship.hp, max: Math.round(state.ship.maxHull) }),
        repair: (points) => { state.ship.hp = Math.min(state.ship.maxHull, state.ship.hp + points); },
        onClose: () => {
            if(!state) return;
            ship.applyStats(computeShipStats(getProfile().hull));
            ship.shield = ship.maxShield;
            ship.immunity = 1.5;
            state.paused = false;
            state.docked = false;
            freeze(false);
            banner('Undocked', 1.2);
        }
    });
};

const endGame = (message) => {
    cancelAnimationFrame(frameId);
    frameId = null;
    freeze(true);
    pauseMenu.style.visibility = 'hidden';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(menuMessage) menuMessage.textContent = message || '';
    menu.style.visibility = 'visible';
    state = null;
    backdrop.style.display = 'none';
};

const frame = (now) => {
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.25);
    lastFrameTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;
    if(zoomKeys.in) targetZoom = clampZoom(targetZoom * Math.exp(elapsed * 1.6));
    if(zoomKeys.out) targetZoom = clampZoom(targetZoom * Math.exp(-elapsed * 1.6));
    zoom += (targetZoom - zoom) * Math.min(1, elapsed * 10);
    if(fps < 45 && resolutionCap > 1 && (window.devicePixelRatio || 1) > 1) {
        slowTime += elapsed;
        if(slowTime > 2) {
            resolutionCap = 1;
            resize();
        }
    } else {
        slowTime = 0;
    }

    // Travelling between systems: the world is hidden during the tunnel phases.
    let inTunnel = false;
    if(state.transition && !state.paused) {
        state.transitionClock = (state.transitionClock || 0) + elapsed;
        inTunnel = updateTransition(elapsed);
        if(inTunnel) accumulator = 0;
    }

    if(touchControls && !state.paused) {
        touchControls.update(state.ship, {
            interactLabel: state.transition ? '' : state.canDock ? 'Dock' : state.nearDHD ? 'DHD' : ''
        });
    }

    if(!state.paused && !inTunnel) {
        accumulator += elapsed;
        let steps = 0;
        while(accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
            step(STEP);
            accumulator -= STEP;
            steps++;
        }
        if(steps === MAX_STEPS_PER_FRAME) accumulator = 0;

        sounds.setThrust(state.ship.alive && state.ship.thrusting);
        sounds.setFiring(state.ship.alive && state.ship.minigunFiring);
        sounds.setBeam(state.ship.alive && state.ship.beaming);
        sounds.setTractor(state.ship.alive && !!state.tractorActive, Math.min(1, (state.tractorCount || 0) / 6));
    }

    if(inTunnel) renderTunnel();
    else render();
    renderInfo();

    if(state.gameOverTimer >= GAME_OVER_DELAY) {
        loseCargo();
        endGame('Ship destroyed! The cargo was lost. Your credits and ship are safe at the shipyard.');
        return;
    }

    frameId = requestAnimationFrame(frame);
};

let initialized = false;

const initialize = () => {
    initialized = true;
    gameboard.appendChild(backdrop);
    gameboard.appendChild(canvas);
    window.addEventListener('resize', resize);
    loadInputHandlers();

    onKeyPress('Escape', () => {
        if(!state || state.docked || !state.ship.alive || state.transition || isDHDOpen() || isStarmapOpen()) return false;
        setPaused(!state.paused);
        return true;
    });

    onKeyPress('KeyG', () => {
        if(!state || state.paused || !state.ship.guidance) return false;
        state.ship.autoTarget = !state.ship.autoTarget;
        banner('Auto-targeting ' + (state.ship.autoTarget ? 'ON' : 'OFF'), 1.2);
        return true;
    });

    const toggleShields = () => {
        if(!state || state.paused || !state.ship.alive) return false;
        if(state.ship.maxShield <= 0) {
            banner('No shield emitter fitted', 1.2);
            return true;
        }
        state.ship.toggleShields();
        banner(state.ship.shieldsEnabled ? 'Shields raised' : 'Shields lowered: ore collection enabled', 1.4);
        return true;
    };
    onKeyPress('KeyH', toggleShields);

    // 1-5: switch the weapons in the weapon panel on/off; clicking a row does the same.
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].forEach((code, i) => {
        onKeyPress(code, () => {
            if(!state || state.paused || !state.ship.alive) return false;
            const weapons = state.ship.weaponStatus();
            if(!weapons[i]) return false;
            toggleWeapon(weapons[i].kind);
            return true;
        });
    });
    setClickFilter(weaponPanelClick);

    // X: stabilizer on/off.
    onKeyPress('KeyX', () => {
        if(!state || state.paused || !state.ship.alive) return false;
        state.ship.stabilizer = !state.ship.stabilizer;
        sounds.toggle(state.ship.stabilizer);
        banner('Stabilizer ' + (state.ship.stabilizer ? 'ON: cancelling drift and spin' : 'OFF: free drift'), 1.4);
        return true;
    });

    const zoomKey = (event, down) => {
        if(event.code === 'Equal' || event.code === 'NumpadAdd') zoomKeys.in = down;
        if(event.code === 'Minus' || event.code === 'NumpadSubtract') zoomKeys.out = down;
        if(down && (event.code === 'Digit0' || event.code === 'Numpad0') && state && !state.paused) targetZoom = DEFAULT_ZOOM;
    };
    window.addEventListener('keydown', (event) => zoomKey(event, true));
    window.addEventListener('keyup', (event) => zoomKey(event, false));

    window.addEventListener('wheel', (event) => {
        if(!state || state.paused) return;
        event.preventDefault();
        targetZoom = clampZoom(targetZoom * Math.exp(-event.deltaY * 0.0015));
    }, { passive: false });

    onKeyPress('KeyC', () => {
        if(!state || state.paused) return false;
        toggleCargoPanel();
        return true;
    });
    cargoButton.addEventListener('click', () => { if(state && !state.paused) toggleCargoPanel(); });
    cargoPanel.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        if(button.dataset.close) toggleCargoPanel(false);
        const material = button.dataset.eject;
        if(material === '*') {
            Object.keys(getProfile().cargo).forEach(id => ejectOre(id, Infinity));
        } else if(material) {
            ejectOre(material, button.dataset.count === 'all' ? Infinity : 1);
        }
    });
    onProfileChange(() => renderCargoPanel());
    shieldButton.addEventListener('click', () => toggleShields());

    // B: dock at Atlantis, or use the DHD when standing next to it.
    onKeyPress('KeyB', () => {
        if(!state || state.paused || state.transition) return false;
        if(state.canDock) {
            const ship = state.ship;
            const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
            if(speed > STATION.maxDockSpeed) banner('Too fast to dock', 1.2);
            else dock();
            return true;
        }
        if(state.nearDHD) {
            openDHD();
            return true;
        }
        return false;
    });

    // M: starmap. J: open the starmap to pick a hyperspace destination.
    const toggleStarmap = () => {
        if(!state || state.transition || state.docked || isDHDOpen()) return false;
        if(isStarmapOpen()) return false;
        if(state.paused) return false;
        openStarmap();
        return true;
    };
    onKeyPress('KeyM', toggleStarmap);
    onKeyPress('KeyJ', toggleStarmap);
    starmapButton.addEventListener('click', () => toggleStarmap());

    if(TOUCH) {
        document.body.classList.add('touch');
        starmapButton.textContent = 'Starmap';
        touchControls = new TouchControls(input, canvas, {
            interact: () => triggerKey('KeyB'),
            toggleAuto: () => triggerKey('KeyG'),
            toggleStabilizer: () => triggerKey('KeyX'),
            uiTap: weaponPanelClick,
            pause: () => triggerKey('Escape'),
            zoom: (factor) => { if(state && !state.paused) targetZoom = clampZoom(targetZoom * factor); }
        });
        // Two-finger pinch on the play area zooms the view.
        const pinch = {};
        canvas.addEventListener('touchstart', (event) => {
            if(event.touches.length === 2) {
                const a = event.touches[0], b = event.touches[1];
                pinch.distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                pinch.zoom = targetZoom;
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', (event) => {
            // Only when neither finger is steering or shooting would pinch be unambiguous;
            // with the stick + aim split, a pinch is two fingers on the same side.
            if(event.touches.length !== 2 || !pinch.distance || !state || state.paused) return;
            const a = event.touches[0], b = event.touches[1];
            const sameSide = (a.clientX < window.innerWidth * 0.45) === (b.clientX < window.innerWidth * 0.45);
            if(!sameSide) return;
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            targetZoom = clampZoom(pinch.zoom * d / pinch.distance);
        }, { passive: true });
    }

    document.getElementById('resumeGame').addEventListener('click', () => setPaused(false));
    document.getElementById('abandonGame').addEventListener('click', () => {
        if(state) endGame('Returned to base. Cargo in the hold is kept.');
    });
};

const constructGameBoard = () => {
    if(!initialized) initialize();
    if(frameId) cancelAnimationFrame(frameId);

    sounds.unlock();
    resize();
    state = createState();
    state.rocks = state.sectors.update(state.ship.x, state.ship.y, []);
    pauseMenu.style.visibility = 'hidden';
    freeze(false);
    frameId = requestAnimationFrame(frame);
};

export default constructGameBoard;
