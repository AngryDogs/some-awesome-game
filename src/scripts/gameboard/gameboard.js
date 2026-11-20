import Ship from '../components/ship/ship';
import Rock from '../components/rock/rock';
import Particle from '../components/particle/particle';
import loadInputHandlers, { input } from '../components/ship/handlers';
import sounds from '../audio/audio';
import { world, delta, gravityAt } from '../physics/physics';

const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 8;
const MAX_PARTICLES = 1500;
const ROCK_SPAWN_INTERVAL = 2;
const GAME_OVER_DELAY = 2;
const ROCK_RESTITUTION = 0.5;
const SHIP_RESTITUTION = 0.6;
const SHIP_RAM_DAMAGE = 8;

const gameboard = document.getElementById('gameboard');
const menu = document.getElementById('menu');
const menuMessage = document.getElementById('menuMessage');
const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const fpsElement = document.getElementById('fps');
const healthElement = document.getElementById('health');

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
    ship: new Ship(world.width / 2, world.height / 2),
    rocks: [],
    newRocks: [],
    bullets: [],
    particles: [],
    level: 1,
    score: 0,
    rocksToSpawn: rocksForLevel(1),
    spawnTimer: 0.5,
    bannerText: 'Level 1',
    bannerTimer: 2,
    gameOverTimer: 0
});

const resize = () => {
    pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    world.resize(window.innerWidth, window.innerHeight);
};

const setText = (element, key, text) => {
    if(hud[key] !== text) {
        hud[key] = text;
        element.innerHTML = text;
    }
};

const renderInfo = () => {
    setText(levelElement, 'level', 'Level: ' + state.level);
    setText(scoreElement, 'score', 'Score: ' + state.score);
    setText(healthElement, 'health', 'Lives: ' + Math.max(state.ship.lives, 0));
    setText(fpsElement, 'fps', 'Fps: ' + Math.round(fps));
};

// ---------------------------------------------------------------- physics

const applyGravity = (dt) => {
    const { rocks, ship, bullets, particles } = state;

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

    if(byPlayer) state.score += Math.round(rock.radius);
    sounds.explosion(Math.min(1, 0.3 + rock.radius / 50));
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
            rock.health--;
            rock.flash = 0.05;
            Particle.burst(particles, bullet.x, bullet.y, rock.vx, rock.vy, 3, {
                minSpeed: 30, maxSpeed: 120, minLife: 0.15, maxLife: 0.4, size: 2, color: '255,240,200'
            });
            sounds.rockHit();
            if(rock.health <= 0) destroyRock(rock, true);
            return;
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
        const d = delta(ship, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const overlap = ship.radius + rock.radius * 0.85 - distance;
        if(overlap <= 0) return;

        resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);

        if(ship.hit(particles)) {
            sounds.explosion();
            rock.health -= SHIP_RAM_DAMAGE;
            rock.flash = 0.1;
            if(rock.health <= 0) destroyRock(rock, false);
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
        state.level++;
        state.rocksToSpawn = rocksForLevel(state.level);
        state.spawnTimer = 1.5;
        state.bannerText = 'Level ' + state.level;
        state.bannerTimer = 2;
    }
};

const step = (dt) => {
    const { ship, bullets, particles } = state;

    ship.update(dt, input, bullets, particles);
    applyGravity(dt);

    state.rocks.forEach(rock => rock.update(dt));
    bullets.forEach(bullet => bullet.update(dt));
    particles.forEach(particle => particle.update(dt));

    bulletCollisions();
    rockCollisions();
    shipCollisions();

    // Remove dead objects only after all iteration is done (no splicing mid-loop).
    state.rocks = state.rocks.filter(rock => !rock.dead).concat(state.newRocks);
    state.newRocks = [];
    state.bullets = bullets.filter(bullet => !bullet.dead);
    state.particles = particles.filter(particle => !particle.dead);
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

const render = () => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, world.width, world.height);

    state.rocks.forEach(rock => rock.drawGravityWell(ctx));
    state.rocks.forEach(rock => rock.draw(ctx));

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

    state.ship.draw(ctx);
    drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- loop

const endGame = () => {
    cancelAnimationFrame(frameId);
    frameId = null;
    input.enabled = false;
    input.reset();
    sounds.stopAll();
    document.body.classList.remove('playing');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(menuMessage) menuMessage.innerHTML = 'Game over! Score: ' + state.score;
    menu.style.visibility = 'visible';
};

const frame = (now) => {
    const elapsed = Math.min((now - lastFrameTime) / 1000, 0.25);
    lastFrameTime = now;
    if(elapsed > 0) fps += (1 / elapsed - fps) * 0.05;

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

    render();
    renderInfo();

    if(state.gameOverTimer >= GAME_OVER_DELAY) {
        endGame();
        return;
    }

    frameId = requestAnimationFrame(frame);
};

let initialized = false;

const constructGameBoard = () => {
    if(!initialized) {
        initialized = true;
        gameboard.appendChild(canvas);
        window.addEventListener('resize', resize);
        loadInputHandlers();
    }

    if(frameId) cancelAnimationFrame(frameId);

    resize();
    state = createState();
    input.reset();
    input.enabled = true;
    accumulator = 0;
    lastFrameTime = performance.now();
    document.body.classList.add('playing');

    sounds.startEngine();
    frameId = requestAnimationFrame(frame);
};

export default constructGameBoard;
