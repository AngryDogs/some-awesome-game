import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';
import Particle from '../components/particle/particle';
import loadInputHandlers, { input, onKeyPress } from '../components/ship/handlers';
import sounds from '../audio/audio';
import { world, delta, gravityAt } from '../physics/physics';
import { computeShipStats, getProfile, addCredits, recordScore } from '../shipyard/profile';
import { getShipyard, isShipyardOpen } from '../shipyard/shipyard';

const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 8;
const MAX_PARTICLES = 2000;
const ROCK_SPAWN_INTERVAL = 2;
const GAME_OVER_DELAY = 2;
const ROCK_RESTITUTION = 0.5;
const SHIP_RESTITUTION = 0.4;
const CREDITS_PER_RADIUS = 1.2;
const LEVEL_BONUS = 50;
const MISSILE_PUSH = 60000;

const gameboard = document.getElementById('gameboard');
const menu = document.getElementById('menu');
const menuMessage = document.getElementById('menuMessage');
const pauseMenu = document.getElementById('pauseMenu');
const hudElements = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    credits: document.getElementById('credits'),
    targeting: document.getElementById('targeting'),
    fps: document.getElementById('fps'),
    hullBar: document.getElementById('hullBar'),
    hullText: document.getElementById('hullText'),
    shieldBar: document.getElementById('shieldBar'),
    shieldText: document.getElementById('shieldText'),
    shieldRow: document.getElementById('shieldRow')
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

const rocksForLevel = (level) => 2 + (level - 1) * 2;

const createState = () => ({
    ship: new Ship(world.width / 2, world.height / 2, computeShipStats(getProfile().hull)),
    rocks: [],
    newRocks: [],
    bullets: [],
    missiles: [],
    particles: [],
    floatingTexts: [],
    level: 1,
    score: 0,
    creditsEarned: 0,
    rocksToSpawn: rocksForLevel(1),
    spawnTimer: 0.5,
    bannerText: 'Level 1',
    bannerTimer: 2,
    gameOverTimer: 0,
    paused: false
});

const resize = () => {
    pixelRatio = window.devicePixelRatio || 1;
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

const renderInfo = () => {
    const ship = state.ship;
    setText('score', 'Score: ' + state.score);
    setText('level', 'Level: ' + state.level);
    setText('credits', 'Credits: ' + Math.round(getProfile().credits).toLocaleString('en-US'));
    setText('fps', 'Fps: ' + Math.round(fps));
    setText('targeting', ship.guidance ? 'Auto-target: ' + (ship.autoTarget ? 'ON' : 'OFF') + ' (G)' : '');
    setBar('hullBar', ship.hp / ship.maxHull);
    setText('hullText', Math.ceil(ship.hp) + ' / ' + Math.round(ship.maxHull));
    setBar('shieldBar', ship.maxShield ? ship.shield / ship.maxShield : 0);
    setText('shieldText', ship.maxShield ? Math.ceil(ship.shield) + ' / ' + Math.round(ship.maxShield) : 'none');
};

const floatText = (x, y, text, color) => {
    state.floatingTexts.push({ x: x, y: y, text: text, color: color || '255,225,120', life: 1.2 });
};

// ---------------------------------------------------------------- physics

const applyGravity = (dt) => {
    const { rocks, ship, bullets, missiles, particles } = state;

    // Compute every rock's acceleration before changing any velocity.
    const accelerations = rocks.map(rock => gravityAt(rock, rocks));
    rocks.forEach((rock, i) => {
        rock.vx += accelerations[i].x * dt;
        rock.vy += accelerations[i].y * dt;
    });

    const pull = (body) => {
        const a = gravityAt(body, rocks);
        body.vx += a.x * dt;
        body.vy += a.y * dt;
    };

    if(ship.alive) pull(ship);
    bullets.forEach(pull);
    missiles.forEach(pull);
    particles.forEach(pull);
};

const destroyRock = (rock, byPlayer) => {
    if(rock.dead) return;
    rock.dead = true;

    const fragments = rock.split();
    fragments.forEach(fragment => state.newRocks.push(fragment));

    Particle.burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, Math.round(rock.radius * 0.8), {
        minSpeed: 20, maxSpeed: 140, minLife: 0.4, maxLife: 1.1, size: 3, color: '230,230,240'
    });

    if(byPlayer) {
        const reward = Math.round(rock.radius * CREDITS_PER_RADIUS);
        state.score += Math.round(rock.radius);
        state.creditsEarned += reward;
        addCredits(reward);
        floatText(rock.x, rock.y, '+' + reward + ' cr');
    }
    sounds.explosion(Math.min(1, 0.3 + rock.radius / 50));
};

const damageRock = (rock, amount) => {
    rock.health -= amount;
    rock.flash = 0.05;
    if(rock.health <= 0) destroyRock(rock, true);
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
    const { bullets, rocks, particles } = state;

    bullets.forEach(bullet => {
        if(bullet.dead) return;
        for(let i = 0; i < rocks.length; i++) {
            const rock = rocks[i];
            if(rock.dead) continue;
            const d = delta(rock, bullet);
            if(d.x * d.x + d.y * d.y > rock.radius * rock.radius) continue;

            bullet.dead = true;
            // Bullets carry momentum and nudge the rock.
            rock.vx += bullet.vx * bullet.mass / rock.mass;
            rock.vy += bullet.vy * bullet.mass / rock.mass;
            Particle.burst(particles, bullet.x, bullet.y, rock.vx, rock.vy, 3, {
                minSpeed: 30, maxSpeed: 120, minLife: 0.15, maxLife: 0.4, size: 2, color: '255,240,200'
            });
            sounds.rockHit();
            damageRock(rock, bullet.damage);
            return;
        }
    });
};

const explodeMissile = (missile) => {
    const { rocks, particles } = state;

    Particle.burst(particles, missile.x, missile.y, missile.vx * 0.2, missile.vy * 0.2, 30, {
        minSpeed: 40, maxSpeed: missile.blast * 3, minLife: 0.2, maxLife: 0.6, size: 3, color: '255,160,80'
    });
    sounds.explosion(0.5);

    rocks.forEach(rock => {
        if(rock.dead) return;
        const d = delta(missile, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const reach = missile.blast + rock.radius;
        if(distance > reach) return;

        const falloff = 1 - distance / reach;
        rock.vx += d.x / distance * MISSILE_PUSH * falloff / rock.mass;
        rock.vy += d.y / distance * MISSILE_PUSH * falloff / rock.mass;
        damageRock(rock, missile.damage * (0.35 + 0.65 * falloff));
    });
};

const missileCollisions = () => {
    const { missiles, rocks } = state;

    missiles.forEach(missile => {
        if(!missile.dead) {
            for(let i = 0; i < rocks.length; i++) {
                const rock = rocks[i];
                if(rock.dead) continue;
                const d = delta(rock, missile);
                const reach = rock.radius + 3;
                if(d.x * d.x + d.y * d.y > reach * reach) continue;
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

// Asteroids that touch each other shatter.
const rockCollisions = () => {
    const { rocks, particles } = state;

    for(let i = 0; i < rocks.length; i++) {
        const a = rocks[i];
        if(a.dead || a.grace > 0) continue;

        for(let j = i + 1; j < rocks.length; j++) {
            const b = rocks[j];
            if(b.dead || b.grace > 0) continue;

            const d = delta(a, b);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = a.radius + b.radius - distance;
            if(overlap <= 0) continue;

            const normalX = d.x / distance;
            const normalY = d.y / distance;
            const impactSpeed = resolveImpact(a, b, normalX, normalY, overlap, ROCK_RESTITUTION);

            const contactX = a.x + normalX * a.radius;
            const contactY = a.y + normalY * a.radius;
            Particle.burst(particles, contactX, contactY, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2,
                10 + Math.min(30, Math.round(impactSpeed / 4)), {
                    minSpeed: 30, maxSpeed: 100 + impactSpeed, minLife: 0.2, maxLife: 0.7, size: 2.5, color: '255,220,170'
                });

            destroyRock(a, false);
            destroyRock(b, false);
            break;
        }
    }
};

const shipCollisions = () => {
    const { ship, rocks, particles } = state;
    if(!ship.alive) return;

    rocks.forEach(rock => {
        if(rock.dead) return;

        // Broad phase against the whole hull first.
        const center = delta(ship, rock);
        const reach = ship.radius + rock.radius;
        if(center.x * center.x + center.y * center.y > reach * reach) return;

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = delta(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rock.radius * 0.85 - distance;
            if(overlap <= 0) continue;

            const impactSpeed = resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);
            const damage = 4 + impactSpeed * rock.mass / 6000;

            if(ship.takeDamage(damage, particles)) {
                sounds.explosion(0.6);
                damageRock(rock, 2 + impactSpeed * ship.mass / 20000);
            }
            return;
        }
    });
};

const updateLevel = (dt) => {
    if(state.bannerTimer > 0) state.bannerTimer -= dt;

    if(state.rocksToSpawn > 0) {
        state.spawnTimer -= dt;
        if(state.spawnTimer <= 0) {
            state.rocks.push(Rock.spawnAtEdge(state.level));
            state.rocksToSpawn--;
            state.spawnTimer = ROCK_SPAWN_INTERVAL;
        }
        return;
    }

    if(state.rocks.length === 0 && state.ship.alive) {
        const bonus = LEVEL_BONUS * state.level;
        addCredits(bonus);
        state.creditsEarned += bonus;
        floatText(state.ship.x, state.ship.y - 40, 'Sector clear +' + bonus + ' cr', '140,255,160');

        state.level++;
        state.rocksToSpawn = rocksForLevel(state.level);
        state.spawnTimer = 1.5;
        state.bannerText = 'Level ' + state.level;
        state.bannerTimer = 2;
    }
};

const step = (dt) => {
    const { ship, bullets, missiles, particles } = state;

    ship.update(dt, input, state);
    applyGravity(dt);

    state.rocks.forEach(rock => rock.update(dt));
    bullets.forEach(bullet => bullet.update(dt));
    missiles.forEach(missile => missile.update(dt, state.rocks, particles));
    particles.forEach(particle => particle.update(dt));
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
    state.floatingTexts = state.floatingTexts.filter(text => text.life > 0);
    if(state.particles.length > MAX_PARTICLES) {
        state.particles = state.particles.slice(state.particles.length - MAX_PARTICLES);
    }

    updateLevel(dt);

    if(!ship.alive) state.gameOverTimer += dt;
};

// ---------------------------------------------------------------- render

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

const drawFloatingTexts = () => {
    ctx.save();
    ctx.font = '13px Bungee, sans-serif';
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
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.font = '42px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, world.width / 2, world.height / 3);
    ctx.restore();
};

const render = (time) => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, world.width, world.height);

    state.rocks.forEach(rock => rock.drawGravityWell(ctx));
    state.rocks.forEach(rock => rock.draw(ctx));
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => particle.draw(ctx));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fff';
    state.bullets.forEach(bullet => bullet.draw(ctx));
    ctx.restore();

    state.missiles.forEach(missile => missile.draw(ctx));
    state.ship.draw(ctx);
    drawFloatingTexts();
    if(!state.paused) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- loop & menus

const setPaused = (paused) => {
    if(!state) return;
    state.paused = paused;
    input.reset();
    input.enabled = !paused;
    pauseMenu.style.visibility = paused ? 'visible' : 'hidden';
    document.body.classList.toggle('playing', !paused);
    if(paused) {
        sounds.stopAll();
    } else {
        sounds.startEngine();
        lastFrameTime = performance.now();
        accumulator = 0;
    }
};

const endGame = () => {
    cancelAnimationFrame(frameId);
    frameId = null;
    input.enabled = false;
    input.reset();
    sounds.stopAll();
    document.body.classList.remove('playing');
    pauseMenu.style.visibility = 'hidden';
    recordScore(state.score);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(menuMessage) {
        menuMessage.textContent = 'Game over! Score: ' + state.score + ' · earned ' +
            state.creditsEarned.toLocaleString('en-US') + ' cr';
    }
    menu.style.visibility = 'visible';
    state = null;
};

const frame = (now) => {
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.25);
    lastFrameTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;

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
        sounds.setFiring(state.ship.alive && state.ship.firing);
    }

    render(now / 1000);
    renderInfo();

    if(state.gameOverTimer >= GAME_OVER_DELAY) {
        endGame();
        return;
    }

    frameId = requestAnimationFrame(frame);
};

const openShipyardFromPause = () => {
    pauseMenu.style.visibility = 'hidden';
    getShipyard().open({
        closeLabel: 'Back to battle',
        onClose: () => {
            if(!state) return;
            state.ship.applyStats(computeShipStats(getProfile().hull));
            pauseMenu.style.visibility = 'visible';
        }
    });
};

let initialized = false;

const initialize = () => {
    initialized = true;
    gameboard.appendChild(canvas);
    window.addEventListener('resize', resize);
    loadInputHandlers();

    onKeyPress('Escape', () => {
        if(!state || isShipyardOpen() || !state.ship.alive) return false;
        setPaused(!state.paused);
        return true;
    });

    onKeyPress('KeyG', () => {
        if(!state || state.paused || !state.ship.guidance) return false;
        state.ship.autoTarget = !state.ship.autoTarget;
        state.bannerText = 'Auto-targeting ' + (state.ship.autoTarget ? 'ON' : 'OFF');
        state.bannerTimer = 1.2;
        return true;
    });

    document.getElementById('resumeGame').addEventListener('click', () => setPaused(false));
    document.getElementById('pauseShipyard').addEventListener('click', openShipyardFromPause);
    document.getElementById('abandonGame').addEventListener('click', () => {
        if(state) endGame();
    });
};

const constructGameBoard = () => {
    if(!initialized) initialize();
    if(frameId) cancelAnimationFrame(frameId);

    resize();
    state = createState();
    input.reset();
    input.enabled = true;
    accumulator = 0;
    lastFrameTime = performance.now();
    pauseMenu.style.visibility = 'hidden';
    document.body.classList.add('playing');

    sounds.startEngine();
    frameId = requestAnimationFrame(frame);
};

export default constructGameBoard;
