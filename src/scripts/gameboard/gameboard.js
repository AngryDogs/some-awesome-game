import Ship from '../components/ship/ship';
import { MAX_MERGE_RADIUS, VISUAL_RADIUS } from '../components/rock/rock';
import Particle from '../components/particle/particle';
import Ore from '../components/ore/ore';
import loadInputHandlers, { input, onKeyPress } from '../components/ship/handlers';
import sounds from '../audio/audio';
import { world, delta, gravityAt } from '../physics/physics';
import MATERIALS, { MATERIAL_ORDER } from '../world/materials';
import { SectorManager, sectorOf } from '../world/sectors';
import { STATION, drawStation } from '../world/station';
import { computeShipStats, getProfile, storeOre, cargoUsed, loseCargo, removeCargo, onProfileChange } from '../shipyard/profile';
import { getShipyard } from '../shipyard/shipyard';
import { glowSprite, stamp } from '../render/sprites';

const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 4;   // on slow frames, slow the game slightly rather than spiral
const MAX_PARTICLES = 1200;
const GAME_OVER_DELAY = 2.5;
const SHIP_RESTITUTION = 0.4;
const ROCK_BOUNCE = 0.2;
const MISSILE_PUSH = 60000;
const SECTOR_UPDATE_INTERVAL = 0.5;
const MINIMAP_SIZE = 180;
const MINIMAP_RANGE = 3500;

const gameboard = document.getElementById('gameboard');
const menu = document.getElementById('menu');
const menuMessage = document.getElementById('menuMessage');
const pauseMenu = document.getElementById('pauseMenu');
const shieldButton = document.getElementById('shieldButton');
const cargoButton = document.getElementById('cargoButton');
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

const createState = () => {
    const ship = new Ship(STATION.x + STATION.dockRadius + 80, STATION.y, computeShipStats(getProfile().hull));
    ship.angle = 0;
    return {
        ship: ship,
        rocks: [],
        newRocks: [],
        bullets: [],
        missiles: [],
        particles: [],
        ores: [],
        beamHits: [],
        shockwaves: [],
        mergeLinks: [],
        floatingTexts: [],
        sectors: new SectorManager(getProfile().seed),
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
    setText('location', 'Sector ' + sector.sx + ', ' + sector.sy + ' · base ' + (distanceToStation() / 1000).toFixed(1) + 'k');
    setText('fps', 'Fps: ' + Math.round(fps));
    setText('targeting', ship.guidance ? 'Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + ' (G)' : '');
    setBar('hullBar', ship.hp / ship.maxHull);
    setText('hullText', Math.ceil(ship.hp) + ' / ' + Math.round(ship.maxHull));
    setBar('shieldBar', ship.maxShield ? ship.shield / ship.maxShield : 0);
    setText('shieldText', ship.maxShield ? Math.ceil(ship.shield) + ' / ' + Math.round(ship.maxShield) : 'none');
    const shieldState = ship.maxShield <= 0 ? 'none' : (ship.shieldsEnabled ? (ship.shieldUp ? 'up' : 'depleted') : 'down');
    if(hud.shieldState !== shieldState) {
        hud.shieldState = shieldState;
        shieldButton.className = 'shield-button ' + shieldState;
        shieldButton.textContent = {
            none: 'No shields', up: 'Shields: UP (H)', depleted: 'Shields: DEPLETED', down: 'Shields: DOWN (H)'
        }[shieldState];
    }
    setBar('cargoBar', used / ship.cargoCapacity);
    setText('cargoButton', 'Cargo ' + used + '/' + ship.cargoCapacity + ' (C)');
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
const hitRock = (rock, damage, hitX, hitY) => {
    if(rock.dead) return;
    const result = rock.chip(damage, hitX, hitY);

    const out = delta(rock, { x: hitX, y: hitY });
    const outLength = Math.sqrt(out.x * out.x + out.y * out.y) || 1;
    const outX = out.x / outLength;
    const outY = out.y / outLength;

    result.ore.forEach(material => {
        const angle = Math.atan2(outY, outX) + (Math.random() - 0.5) * 1.6;
        const speed = 30 + Math.random() * 60;
        state.ores.push(new Ore(
            rock.x + outX * rock.radius * 0.9,
            rock.y + outY * rock.radius * 0.9,
            rock.vx + Math.cos(angle) * speed,
            rock.vy + Math.sin(angle) * speed,
            material
        ));
    });

    Particle.burst(state.particles, hitX, hitY, rock.vx + outX * 40, rock.vy + outY * 40, 2, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.2, maxLife: 0.5, size: 2, color: MATERIALS[rock.material].color
    });
    if(Math.random() < Math.min(1, damage * 0.6)) {
        Particle.burst(state.particles, hitX, hitY, rock.vx + outX * 25, rock.vy + outY * 25, 1, {
            minSpeed: 5, maxSpeed: 30, minLife: 0.8, maxLife: 1.6, size: 6, color: '170,160,150', dust: true, alpha: 0.25
        });
    }

    if(result.pieces) {
        // Cut clean through: the two halves replace the asteroid, with dust along the cut.
        result.pieces.forEach(piece => state.newRocks.push(piece));
        const a = result.pieces[0];
        const b = result.pieces[1];
        for(let i = 0; i < 10; i++) {
            const t = Math.random();
            const x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * rock.radius * 0.6;
            const y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * rock.radius * 0.6;
            Particle.burst(state.particles, x, y, rock.vx, rock.vy, 1, {
                minSpeed: 5, maxSpeed: 30, minLife: 1, maxLife: 2.2, size: 8, color: '170,160,150', dust: true, alpha: 0.22
            });
        }
        Particle.burst(state.particles, hitX, hitY, rock.vx, rock.vy, 12, {
            minSpeed: 20, maxSpeed: 90, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '220,220,230'
        });
        sounds.rockCrack();
    }

    if(result.crumbled) {
        Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 14, {
            minSpeed: 20, maxSpeed: 100, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '200,200,210'
        });
        Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 6, {
            minSpeed: 5, maxSpeed: 40, minLife: 1, maxLife: 2, size: 7, color: '170,160,150', dust: true, alpha: 0.22
        });
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
            hitRock(rock, bullet.damage, bullet.x, bullet.y);

            if(bullet.kind === 'plasma') {
                // Staff blast: fiery splash that also scorches nearby rocks.
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 26, {
                    minSpeed: 40, maxSpeed: 220, minLife: 0.25, maxLife: 0.7, size: 3.5, color: '255,170,60'
                });
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 10, {
                    minSpeed: 10, maxSpeed: 80, minLife: 0.15, maxLife: 0.35, size: 7, color: '255,240,200'
                });
                Particle.burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 5, {
                    minSpeed: 5, maxSpeed: 35, minLife: 1, maxLife: 2, size: 9, color: '120,100,90', dust: true, alpha: 0.25
                });
                rocks.forEach(other => {
                    if(other === rock || other.dead) return;
                    const ox = other.x - bullet.x;
                    const oy = other.y - bullet.y;
                    const reach = bullet.splash + other.radius;
                    if(ox * ox + oy * oy < reach * reach) hitRock(other, bullet.damage * 0.5, bullet.x, bullet.y);
                });
                sounds.plasmaImpact();
            } else {
                sounds.rockHit();
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
        Math.round(12 + guest.radius), guest.radius * 1.1, '175,165,150');
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
                resolveImpact(a, b, normalX, normalY, reach - distance, ROCK_BOUNCE);
                continue;
            }

            startMerge(a, b);
            break;
        }
    }
};

const shipCollisions = () => {
    const { ship, rocks, particles } = state;
    if(!ship.alive) return;

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
                Particle.burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 5, {
                    minSpeed: 20, maxSpeed: 90, minLife: 0.15, maxLife: 0.35, size: 2, color: MATERIALS[ore.material].color
                });
                sounds.oreZap();
                if(state.shieldHintTimer <= 0) {
                    state.shieldHintTimer = 8;
                    banner('Shields up: ore burns up! Lower shields (H) to collect.', 2.5);
                }
            }
            return;
        }

        if(!ore.update(dt, ship, !cargoFull)) return;

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
    input.aimX = input.mouseX - world.width / 2 + state.camera.x;
    input.aimY = input.mouseY - world.height / 2 + state.camera.y;

    ship.update(dt, input, state);
    state.beamHits.forEach(hit => {
        const push = Math.min(0.6, 900 * hit.damage / hit.rock.mass);
        hit.rock.vx += hit.dirX * push;
        hit.rock.vy += hit.dirY * push;
        hitRock(hit.rock, hit.damage, hit.x, hit.y);
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
    cityShield(dt);
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
    if(state.particles.length > MAX_PARTICLES) {
        state.particles = state.particles.slice(state.particles.length - MAX_PARTICLES);
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

    state.canDock = ship.alive && distanceToStation() < STATION.dockRadius;
    if(state.bannerTimer > 0) state.bannerTimer -= dt;
    if(!ship.alive) state.gameOverTimer += dt;
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
    const halfW = world.width / 2 + r;
    const halfH = world.height / 2 + r;
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

// Tractor beam: tapered energy beams from the emitter to every ore piece it holds,
// with pulses flowing towards the ship and a pulsing range ring.
const drawTractor = (time) => {
    const ship = state.ship;
    const held = state.ores.filter(ore => ore.tractored && !ore.dead);
    state.tractorActive = held.length > 0;
    if(!held.length || !ship.alive) return;

    const emitter = ship.tractorEmitter();
    const color = '120,255,230';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Range ring.
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -time * 30;
    ctx.strokeStyle = 'rgba(' + color + ', ' + (0.12 + 0.1 * pulse) + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.magnetRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    held.forEach(ore => {
        const dx = ore.x - emitter.x;
        const dy = ore.y - emitter.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const wide = 7;   // beam spreads out towards the ore

        const cone = ctx.createLinearGradient(emitter.x, emitter.y, ore.x, ore.y);
        cone.addColorStop(0, 'rgba(' + color + ', 0.45)');
        cone.addColorStop(1, 'rgba(' + color + ', 0.08)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(emitter.x + nx * 1.5, emitter.y + ny * 1.5);
        ctx.lineTo(ore.x + nx * wide, ore.y + ny * wide);
        ctx.lineTo(ore.x - nx * wide, ore.y - ny * wide);
        ctx.lineTo(emitter.x - nx * 1.5, emitter.y - ny * 1.5);
        ctx.closePath();
        ctx.fill();

        // Energy pulses travelling inwards.
        ctx.setLineDash([3, 9]);
        ctx.lineDashOffset = time * 70;
        ctx.strokeStyle = 'rgba(210, 255, 245, 0.8)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ore.x, ore.y);
        ctx.lineTo(emitter.x, emitter.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Containment glow around the captured ore.
        const glow = ctx.createRadialGradient(ore.x, ore.y, 0, ore.x, ore.y, 11);
        glow.addColorStop(0, 'rgba(' + color + ', ' + (0.35 + 0.25 * pulse) + ')');
        glow.addColorStop(1, 'rgba(' + color + ', 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ore.x, ore.y, 11, 0, Math.PI * 2);
        ctx.fill();
    });

    // Emitter flare.
    const flare = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, 9);
    flare.addColorStop(0, 'rgba(230, 255, 250, 0.9)');
    flare.addColorStop(1, 'rgba(' + color + ', 0)');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(emitter.x, emitter.y, 9, 0, Math.PI * 2);
    ctx.fill();
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
    const text = speed > STATION.maxDockSpeed ? 'Slow down to dock (X stabilizes)' : 'Press B to dock at the shipyard';
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = speed > STATION.maxDockSpeed ? 'rgba(255, 200, 120, 0.95)' : 'rgba(140, 255, 160, 0.95)';
    ctx.fillText(text, world.width / 2, world.height - 60);
    ctx.restore();
};

// Edge-of-screen pointer to the shipyard when it's out of view.
const drawStationPointer = () => {
    const sx = STATION.x - state.camera.x + world.width / 2;
    const sy = STATION.y - state.camera.y + world.height / 2;
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
const drawWeaponPanel = () => {
    const weapons = state.ship.weaponStatus();
    if(!weapons.length) return;
    const left = 16;
    const rowHeight = 22;
    const top = world.height - 16 - weapons.length * rowHeight - 18;

    ctx.save();
    ctx.fillStyle = 'rgba(5, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.4)';
    ctx.fillRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.strokeRect(left, top, 230, weapons.length * rowHeight + 22);
    ctx.font = '10px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('WEAPONS', left + 8, top + 14);

    const labels = { ready: 'READY', hot: 'HOT', overheated: 'OVERHEAT', firing: 'FIRING', charging: 'CHARGING', reloading: 'RELOAD' };
    weapons.forEach((w, i) => {
        const y = top + 22 + i * rowHeight;
        ctx.fillStyle = 'rgb(' + w.color + ')';
        ctx.font = '11px Bungee, sans-serif';
        ctx.fillText(w.name + (w.count > 1 ? ' x' + w.count : ''), left + 8, y + 11);

        const barX = left + 108;
        const barW = 70;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(barX, y + 3, barW, 8);
        const warn = w.state === 'overheated' || w.state === 'hot';
        ctx.fillStyle = warn ? (w.state === 'overheated' ? 'rgb(255, 80, 60)' : 'rgb(255, 170, 70)') : 'rgb(' + w.color + ')';
        ctx.fillRect(barX + 1, y + 4, (barW - 2) * w.ready, 6);

        ctx.font = '9px Bungee, sans-serif';
        ctx.fillStyle = w.state === 'ready' ? 'rgba(140, 255, 160, 0.9)' : (warn ? 'rgba(255, 140, 100, 0.95)' : 'rgba(200, 220, 255, 0.8)');
        ctx.fillText(labels[w.state], barX + barW + 6, y + 11);
    });
    ctx.restore();
};

const drawMinimap = () => {
    const size = MINIMAP_SIZE;
    const left = world.width - size - 16;
    const top = world.height - size - 16;
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

    state.rocks.forEach(rock => {
        const x = cx + (rock.x - ship.x) * scale;
        const y = cy + (rock.y - ship.y) * scale;
        ctx.fillStyle = 'rgb(' + MATERIALS[rock.material].color + ')';
        const r = Math.max(1.2, rock.radius * scale * 1.5);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });

    // Station (clamped to the edge when far away).
    let stx = (STATION.x - ship.x) * scale;
    let sty = (STATION.y - ship.y) * scale;
    const limit = size / 2 - 6;
    const furthest = Math.max(Math.abs(stx), Math.abs(sty));
    if(furthest > limit) {
        stx *= limit / furthest;
        sty *= limit / furthest;
    }
    ctx.strokeStyle = 'rgb(140, 200, 255)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + stx - 4, cy + sty - 4, 8, 8);

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
    ctx.fillText('SCANNER ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k', left + 6, top + 14);
    ctx.restore();
};

const render = () => {
    const time = state.time;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, world.width, world.height);
    drawStarfield();

    ctx.save();
    ctx.translate(world.width / 2 - state.camera.x, world.height / 2 - state.camera.y);

    if(isVisible(STATION.x, STATION.y, 300)) drawStation(ctx, time, state.canDock);

    const visibleRocks = state.rocks.filter(rock => isVisible(rock.x, rock.y, rock.radius * 3.5));
    // Merging guests are drawn first so they sink beneath their host.
    visibleRocks.forEach(rock => { if(rock.merging && rock.merging.guest === rock) rock.draw(ctx, time); });
    visibleRocks.forEach(rock => { if(!(rock.merging && rock.merging.guest === rock)) rock.draw(ctx, time); });
    state.particles.forEach(particle => { if(particle.dust && isVisible(particle.x, particle.y, 20)) particle.draw(ctx); });
    drawTractor(time);
    state.ores.forEach(ore => { if(isVisible(ore.x, ore.y, 10)) ore.draw(ctx, time); });
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => { if(!particle.dust && isVisible(particle.x, particle.y, 10)) particle.draw(ctx); });
    ctx.restore();

    // Kinetic rounds are batched into one path and stroked twice (soft halo + bright core)
    // instead of using an expensive blur per bullet.
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    state.bullets.forEach(bullet => {
        if(bullet.kind !== 'bullet') return;
        ctx.moveTo(bullet.x - bullet.vx * 0.012, bullet.y - bullet.vy * 0.012);
        ctx.lineTo(bullet.x, bullet.y);
    });
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    state.bullets.forEach(bullet => { if(bullet.kind !== 'bullet') bullet.draw(ctx); });

    state.missiles.forEach(missile => missile.draw(ctx));
    drawShockwaves();
    state.ship.draw(ctx);
    drawFloatingTexts();
    ctx.restore();

    drawStationPointer();
    drawMinimap();
    drawWeaponPanel();
    drawDockPrompt();
    if(!state.paused) drawCrosshair();
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

// ---------------------------------------------------------------- loop & menus

const freeze = (frozen) => {
    input.reset();
    input.enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
    shieldButton.style.display = state && !frozen ? '' : 'none';
    cargoButton.style.display = state && !frozen ? '' : 'none';
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
};

const frame = (now) => {
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.25);
    lastFrameTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;
    if(fps < 45 && resolutionCap > 1 && (window.devicePixelRatio || 1) > 1) {
        slowTime += elapsed;
        if(slowTime > 2) {
            resolutionCap = 1;
            resize();
        }
    } else {
        slowTime = 0;
    }

    if(!state.paused) {
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
        sounds.setTractor(state.ship.alive && !!state.tractorActive);
    }

    render();
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
    gameboard.appendChild(canvas);
    window.addEventListener('resize', resize);
    loadInputHandlers();

    onKeyPress('Escape', () => {
        if(!state || state.docked || !state.ship.alive) return false;
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

    onKeyPress('KeyB', () => {
        if(!state || state.paused || !state.canDock) return false;
        const ship = state.ship;
        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        if(speed > STATION.maxDockSpeed) {
            banner('Too fast to dock', 1.2);
        } else {
            dock();
        }
        return true;
    });

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
