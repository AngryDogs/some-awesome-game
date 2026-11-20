/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Shared physics helpers for a zero-gravity, screen-wrapping world.
// Units: pixels and seconds.

// Gravitational constant, tuned for gameplay. Mass of a rock is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
const G = 150;
/* unused harmony export G */


// Objects wrap around the screen. The world is a bit larger than the visible
// screen so things slide in and out smoothly instead of popping at the edge.
const world = {
    margin: 80,
    width: window.innerWidth,
    height: window.innerHeight,
    minX: -80,
    minY: -80,
    sizeX: window.innerWidth + 160,
    sizeY: window.innerHeight + 160,

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.minX = -this.margin;
        this.minY = -this.margin;
        this.sizeX = width + this.margin * 2;
        this.sizeY = height + this.margin * 2;
    }
};
/* harmony export (immutable) */ __webpack_exports__["d"] = world;


const wrapPosition = (body) => {
    if(body.x < world.minX) body.x += world.sizeX;
    if(body.x >= world.minX + world.sizeX) body.x -= world.sizeX;
    if(body.y < world.minY) body.y += world.sizeY;
    if(body.y >= world.minY + world.sizeY) body.y -= world.sizeY;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = wrapPosition;


const isOutsideWorld = (body) => {
    return body.x < world.minX || body.y < world.minY ||
        body.x >= world.minX + world.sizeX || body.y >= world.minY + world.sizeY;
};
/* harmony export (immutable) */ __webpack_exports__["c"] = isOutsideWorld;


// Shortest signed distance on a wrapping axis.
const wrapAxis = (d, size) => {
    if(d > size / 2) return d - size;
    if(d < -size / 2) return d + size;
    return d;
};

const delta = (from, to) => {
    return {
        x: wrapAxis(to.x - from.x, world.sizeX),
        y: wrapAxis(to.y - from.y, world.sizeY)
    };
};
/* harmony export (immutable) */ __webpack_exports__["a"] = delta;


// Gravitational acceleration that `attractors` exert on `body`.
// Softened by the attractor's radius so nothing gets flung to infinity.
const gravityAt = (body, attractors) => {
    let ax = 0;
    let ay = 0;

    for(let i = 0; i < attractors.length; i++) {
        const other = attractors[i];
        if(other === body || other.dead) continue;

        const d = delta(body, other);
        const distSq = d.x * d.x + d.y * d.y;
        if(distSq < 0.0001) continue;

        const dist = Math.sqrt(distSq);
        const soft = other.radius * other.radius;
        const accel = G * other.mass / (distSq + soft);

        ax += d.x / dist * accel;
        ay += d.y / dist * accel;
    }

    return { x: ax, y: ay };
};
/* harmony export (immutable) */ __webpack_exports__["b"] = gravityAt;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__physics_physics__ = __webpack_require__(0);


class Particle {

    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.life = options.life;
        this.maxLife = options.life;
        this.size = options.size || 2;
        this.color = options.color || '255,255,255';
        this.shrink = options.shrink !== false;
        this.dead = false;
    }

    static burst(target, x, y, baseVx, baseVy, count, options) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = options.minSpeed + Math.random() * (options.maxSpeed - options.minSpeed);
            target.push(new Particle({
                x: x,
                y: y,
                vx: baseVx + Math.cos(angle) * speed,
                vy: baseVy + Math.sin(angle) * speed,
                life: options.minLife + Math.random() * (options.maxLife - options.minLife),
                size: options.size * (0.6 + Math.random() * 0.8),
                color: options.color
            }));
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
        Object(__WEBPACK_IMPORTED_MODULE_0__physics_physics__["e" /* wrapPosition */])(this);
    }

    draw(ctx) {
        const t = Math.max(this.life / this.maxLife, 0);
        const size = this.shrink ? this.size * (0.3 + 0.7 * t) : this.size;
        ctx.fillStyle = 'rgba(' + this.color + ',' + t.toFixed(3) + ')';
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Particle);


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__styles_main_css__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__styles_main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__styles_main_css__);



const startGame = document.getElementById('startGame');
const menu = document.getElementById('menu');

startGame.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__["a" /* default */])();
});


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__audio_audio__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__physics_physics__ = __webpack_require__(0);







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
    ship: new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* default */](__WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height / 2),
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
    __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].resize(window.innerWidth, window.innerHeight);
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
    const accelerations = rocks.map(rock => Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["b" /* gravityAt */])(rock, rocks));
    rocks.forEach((rock, i) => {
        rock.vx += accelerations[i].x * dt;
        rock.vy += accelerations[i].y * dt;
    });

    const pull = (body) => {
        const a = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["b" /* gravityAt */])(body, rocks);
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

    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, Math.round(rock.radius * 0.8), {
        minSpeed: 20, maxSpeed: 140, minLife: 0.4, maxLife: 1.1, size: 3, color: '230,230,240'
    });

    if(byPlayer) state.score += Math.round(rock.radius);
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].explosion(Math.min(1, 0.3 + rock.radius / 50));
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
            const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(rock, bullet);
            if(d.x * d.x + d.y * d.y > rock.radius * rock.radius) continue;

            bullet.dead = true;
            // Bullets carry momentum and nudge the rock.
            rock.vx += bullet.vx * bullet.mass / rock.mass;
            rock.vy += bullet.vy * bullet.mass / rock.mass;
            rock.health--;
            rock.flash = 0.05;
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, bullet.x, bullet.y, rock.vx, rock.vy, 3, {
                minSpeed: 30, maxSpeed: 120, minLife: 0.15, maxLife: 0.4, size: 2, color: '255,240,200'
            });
            __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].rockHit();
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

            const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(a, b);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = a.radius + b.radius - distance;
            if(overlap <= 0) continue;

            const normalX = d.x / distance;
            const normalY = d.y / distance;
            const impactSpeed = resolveImpact(a, b, normalX, normalY, overlap, ROCK_RESTITUTION);

            const contactX = a.x + normalX * a.radius;
            const contactY = a.y + normalY * a.radius;
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, contactX, contactY, (a.vx + b.vx) / 2, (a.vy + b.vy) / 2,
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
        const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(ship, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const overlap = ship.radius + rock.radius * 0.85 - distance;
        if(overlap <= 0) return;

        resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);

        if(ship.hit(particles)) {
            __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].explosion();
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
            state.rocks.push(__WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["a" /* default */].spawnAtEdge(state.level));
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

    ship.update(dt, __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */], bullets, particles);
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
    const x = __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].mouseX;
    const y = __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].mouseY;
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
    ctx.fillText(state.bannerText, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height / 3);
    ctx.restore();
};

const render = () => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height);

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
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].enabled = false;
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].stopAll();
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

    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].setThrust(state.ship.alive && state.ship.thrusting);
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].setFiring(state.ship.alive && state.ship.firing);

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
        Object(__WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["a" /* default */])();
    }

    if(frameId) cancelAnimationFrame(frameId);

    resize();
    state = createState();
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].enabled = true;
    accumulator = 0;
    lastFrameTime = performance.now();
    document.body.classList.add('playing');

    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].startEngine();
    frameId = requestAnimationFrame(frame);
};

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__physics_physics__ = __webpack_require__(0);




// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const MAIN_THRUST = 260;          // px/s^2
const RETRO_THRUST = 150;
const STRAFE_THRUST = 150;
const ANGULAR_THRUST = 9;         // rad/s^2
const MAX_ANGULAR_SPEED = 5;      // rad/s
const MAX_SPEED = 600;            // px/s, safety cap only

const FIRE_RATE = 18;             // bullets per second
const BULLET_SPEED = 850;
const BULLET_SPREAD = 0.035;      // radians
const RECOIL = 3.5;               // px/s per bullet, pushes the ship back
const BARREL_LENGTH = 13;

const HIT_IMMUNITY = 2.5;
const START_LIVES = 3;

// Hull outline, nose pointing along +x.
const HULL = [[14, 0], [-10, -9], [-6, 0], [-10, 9]];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class Ship {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.angularVelocity = 0;
        this.radius = 11;
        this.mass = 150;
        this.lives = START_LIVES;
        this.alive = true;
        this.immunity = HIT_IMMUNITY;
        this.aimAngle = this.angle;
        this.fireCooldown = 0;
        this.muzzleFlash = 0;
        this.exhaustTimer = 0;
        this.firing = false;
        this.time = 0;

        // Animated thruster output levels (0..1), eased towards their targets.
        this.thrusters = {
            main: 0, retro: 0,
            left: 0, right: 0,       // side jets that push the ship left / right
            spinCW: 0, spinCCW: 0    // attitude jets
        };
    }

    get thrusting() {
        const t = this.thrusters;
        return t.main > 0.2 || t.retro > 0.2 || t.left > 0.2 || t.right > 0.2 ||
            t.spinCW > 0.2 || t.spinCCW > 0.2;
    }

    update(dt, input, bullets, particles) {
        if(!this.alive) return;

        this.time += dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.muzzleFlash > 0) this.muzzleFlash -= dt;
        if(this.fireCooldown > 0) this.fireCooldown -= dt;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Desired force in the ship's local frame (+x forward, +y right) and torque.
        let localX = 0;
        let localY = 0;
        let torque = 0;

        if(input.forward) localX += MAIN_THRUST;
        if(input.backward) localX -= RETRO_THRUST;
        if(input.strafeLeft) localY -= STRAFE_THRUST;
        if(input.strafeRight) localY += STRAFE_THRUST;
        if(input.rotateRight) torque += ANGULAR_THRUST;
        if(input.rotateLeft) torque -= ANGULAR_THRUST;

        // Stabilizer: fire whatever thrusters are needed to cancel drift and spin.
        if(input.stabilize) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if(speed > 1) {
                const brake = Math.min(STRAFE_THRUST, speed / dt);
                const worldX = -this.vx / speed * brake;
                const worldY = -this.vy / speed * brake;
                localX += worldX * cos + worldY * sin;
                localY += -worldX * sin + worldY * cos;
            }
            if(Math.abs(this.angularVelocity) > 0.01) {
                torque -= clamp(this.angularVelocity / dt, -ANGULAR_THRUST, ANGULAR_THRUST);
            }
        }

        // Apply forces (local -> world).
        this.vx += (localX * cos - localY * sin) * dt;
        this.vy += (localX * sin + localY * cos) * dt;
        this.angularVelocity = clamp(this.angularVelocity + torque * dt, -MAX_ANGULAR_SPEED, MAX_ANGULAR_SPEED);

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.angularVelocity * dt;
        Object(__WEBPACK_IMPORTED_MODULE_2__physics_physics__["e" /* wrapPosition */])(this);

        this.animateThrusters(dt, localX, localY, torque);
        this.emitExhaust(dt, particles);

        // Minigun turret follows the mouse independently of the hull.
        this.aimAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
        this.firing = input.firing;
        if(this.firing) this.shoot(bullets);
    }

    animateThrusters(dt, localX, localY, torque) {
        const t = this.thrusters;
        const targets = {
            main: localX > 0 ? Math.min(1, localX / MAIN_THRUST) : 0,
            retro: localX < 0 ? Math.min(1, -localX / RETRO_THRUST) : 0,
            left: localY < 0 ? Math.min(1, -localY / STRAFE_THRUST) : 0,
            right: localY > 0 ? Math.min(1, localY / STRAFE_THRUST) : 0,
            spinCW: torque > 0 ? Math.min(1, torque / ANGULAR_THRUST) : 0,
            spinCCW: torque < 0 ? Math.min(1, -torque / ANGULAR_THRUST) : 0
        };
        // Quick spool-up, slightly slower cut-off.
        Object.keys(targets).forEach(key => {
            const rate = targets[key] > t[key] ? 18 : 10;
            t[key] += (targets[key] - t[key]) * Math.min(1, rate * dt);
        });
    }

    // Spits hot exhaust particles out of the main engine (and puffs from the jets).
    emitExhaust(dt, particles) {
        const t = this.thrusters;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        this.exhaustTimer -= dt;
        if(this.exhaustTimer > 0) return;
        this.exhaustTimer = 1 / 90;

        if(t.main > 0.15) {
            const nozzleX = this.x - cos * 8;
            const nozzleY = this.y - sin * 8;
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = 160 + Math.random() * 120;
            particles.push(new __WEBPACK_IMPORTED_MODULE_1__particle_particle__["a" /* default */]({
                x: nozzleX,
                y: nozzleY,
                vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                life: 0.25 + Math.random() * 0.25,
                size: 2.5 + Math.random() * 2,
                color: Math.random() < 0.5 ? '255,170,60' : '255,110,40'
            }));
        }

        const puff = (level, localX, localY, dirX, dirY) => {
            if(level < 0.2 || Math.random() > 0.5) return;
            const wx = this.x + localX * cos - localY * sin;
            const wy = this.y + localX * sin + localY * cos;
            const dx = dirX * cos - dirY * sin;
            const dy = dirX * sin + dirY * cos;
            const speed = 60 + Math.random() * 60;
            particles.push(new __WEBPACK_IMPORTED_MODULE_1__particle_particle__["a" /* default */]({
                x: wx, y: wy,
                vx: this.vx + dx * speed, vy: this.vy + dy * speed,
                life: 0.15 + Math.random() * 0.15,
                size: 2,
                color: '200,225,255'
            }));
        };

        puff(t.retro, 5, -5, 1, 0);
        puff(t.retro, 5, 5, 1, 0);
        puff(t.left, -2, 7, 0, 1);
        puff(t.right, -2, -7, 0, -1);
        puff(t.spinCW, 9, -3, 0, -1);
        puff(t.spinCW, -9, 7, 0, 1);
        puff(t.spinCCW, 9, 3, 0, 1);
        puff(t.spinCCW, -9, -7, 0, -1);
    }

    shoot(bullets) {
        while(this.fireCooldown <= 0) {
            this.fireCooldown += 1 / FIRE_RATE;

            const angle = this.aimAngle + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            // Bullets inherit the ship's speed along the line of fire, but not its
            // sideways drift, so they always travel towards the crosshair.
            const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
            const bulletSpeed = BULLET_SPEED + inherited;
            bullets.push(new __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__["a" /* default */](
                this.x + Math.cos(this.aimAngle) * BARREL_LENGTH,
                this.y + Math.sin(this.aimAngle) * BARREL_LENGTH,
                dirX * bulletSpeed,
                dirY * bulletSpeed
            ));

            // Equal and opposite reaction.
            this.vx -= dirX * RECOIL;
            this.vy -= dirY * RECOIL;
            this.muzzleFlash = 0.04;
        }
    }

    hit(particles) {
        if(this.immunity > 0 || !this.alive) return false;

        this.lives--;
        this.immunity = HIT_IMMUNITY;
        this.explode(particles, 25);

        if(this.lives <= 0) {
            this.alive = false;
            this.explode(particles, 60);
        }
        return true;
    }

    explode(particles, count) {
        __WEBPACK_IMPORTED_MODULE_1__particle_particle__["a" /* default */].burst(particles, this.x, this.y, this.vx, this.vy, count, {
            minSpeed: 40, maxSpeed: 220, minLife: 0.4, maxLife: 1.2, size: 3, color: '255,200,120'
        });
    }

    drawFlame(ctx, x, y, dirX, dirY, length, width, outer, inner) {
        if(length < 0.5) return;
        const nx = -dirY;
        const ny = dirX;
        const tipX = x + dirX * length;
        const tipY = y + dirY * length;

        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(x + nx * width, y + ny * width);
        ctx.lineTo(tipX, tipY);
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
        const jetOuter = 'rgba(170, 210, 255, 0.85)';
        const jetInner = 'rgba(255, 255, 255, 0.95)';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Idle engine glow, pulsing even when not thrusting.
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);
        const glowRadius = 3 + pulse * 1.5 + t.main * 4;
        const glow = ctx.createRadialGradient(-7, 0, 0, -7, 0, glowRadius * 2);
        glow.addColorStop(0, 'rgba(255, 200, 120, ' + (0.6 + t.main * 0.4) + ')');
        glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(-7, 0, glowRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main engine plume.
        const mainLength = t.main * (18 + Math.random() * 12);
        const plume = ctx.createLinearGradient(-7, 0, -7 - mainLength, 0);
        plume.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
        plume.addColorStop(0.5, 'rgba(255, 130, 40, 0.8)');
        plume.addColorStop(1, 'rgba(255, 60, 20, 0)');
        this.drawFlame(ctx, -7, 0, -1, 0, mainLength, 4.5 * flicker(), plume, 'rgba(255, 255, 230, 0.95)');

        // Retro thrusters near the nose fire forwards.
        const retro = t.retro * 9 * flicker();
        this.drawFlame(ctx, 5, -5, 1, 0, retro, 1.8, jetOuter, jetInner);
        this.drawFlame(ctx, 5, 5, 1, 0, retro, 1.8, jetOuter, jetInner);

        // Side (strafe) jets.
        this.drawFlame(ctx, -2, 7, 0, 1, t.left * 9 * flicker(), 2, jetOuter, jetInner);
        this.drawFlame(ctx, -2, -7, 0, -1, t.right * 9 * flicker(), 2, jetOuter, jetInner);

        // Attitude jets at nose and tail create torque.
        this.drawFlame(ctx, 9, -3, 0, -1, t.spinCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, -9, 7, 0, 1, t.spinCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, 9, 3, 0, 1, t.spinCCW * 7 * flicker(), 1.5, jetOuter, jetInner);
        this.drawFlame(ctx, -9, -7, 0, -1, t.spinCCW * 7 * flicker(), 1.5, jetOuter, jetInner);

        ctx.restore();
    }

    draw(ctx) {
        if(!this.alive) return;
        // Blink while invulnerable.
        if(this.immunity > 0 && Math.floor(this.immunity * 10) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        this.drawThrusters(ctx);

        ctx.beginPath();
        ctx.moveTo(HULL[0][0], HULL[0][1]);
        for(let i = 1; i < HULL.length; i++) ctx.lineTo(HULL[i][0], HULL[i][1]);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.restore();

        // Minigun turret, drawn in world space pointing at the mouse.
        const tipX = this.x + Math.cos(this.aimAngle) * BARREL_LENGTH;
        const tipY = this.y + Math.sin(this.aimAngle) * BARREL_LENGTH;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#7fb4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.fillStyle = '#4a6fa8';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        if(this.muzzleFlash > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ship);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__physics_physics__ = __webpack_require__(0);


const BULLET_LIFE = 1.4;

class Bullet {

    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = 4;
        this.life = BULLET_LIFE;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0 || Object(__WEBPACK_IMPORTED_MODULE_0__physics_physics__["c" /* isOutsideWorld */])(this)) this.dead = true;
    }

    draw(ctx) {
        // Short tracer streak behind the bullet, along its actual velocity
        // (so you can see it bend in an asteroid's gravity well).
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 0.012, this.y - this.vy * 0.012);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Bullet);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__physics_physics__ = __webpack_require__(0);


const MIN_SPLIT_RADIUS = 14;      // smaller rocks crumble to dust instead of splitting
const FRAGMENT_GRACE = 0.8;       // seconds a new fragment ignores rock-rock collisions
const HEALTH_PER_RADIUS = 0.7;    // bullets needed ~ proportional to size

let nextId = 1;

class Rock {

    constructor(options) {
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.radius = options.radius;
        this.mass = this.radius * this.radius;
        this.health = Math.max(1, Math.round(this.radius * HEALTH_PER_RADIUS));
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 2.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.dead = false;
        this.shape = Rock.createShape(this.radius);
    }

    // Irregular polygon so broken pieces actually look like rubble.
    static createShape(radius) {
        const points = [];
        const count = Math.max(7, Math.round(radius / 3.5));
        for(let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = radius * (0.75 + Math.random() * 0.3);
            points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
        }
        return points;
    }

    // A fresh big asteroid drifting in from just outside the screen.
    static spawnAtEdge(level) {
        const radius = 22 + Math.random() * 28;
        const side = Math.floor(Math.random() * 4);
        const offset = __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].margin / 2;
        let x;
        let y;

        if(side === 0) { x = -offset; y = Math.random() * __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].height; }
        if(side === 1) { x = Math.random() * __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].width; y = -offset; }
        if(side === 2) { x = __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].width + offset; y = Math.random() * __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].height; }
        if(side === 3) { x = Math.random() * __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].width; y = __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].height + offset; }

        // Aim roughly at the middle of the screen.
        const toCenter = Math.atan2(__WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].height / 2 - y, __WEBPACK_IMPORTED_MODULE_0__physics_physics__["d" /* world */].width / 2 - x);
        const angle = toCenter + (Math.random() - 0.5) * (Math.PI / 2);
        const speed = 35 + Math.random() * 45 + level * 4;

        return new Rock({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius
        });
    }

    // Break into smaller pieces. Total area never grows and the kicks are
    // symmetric, so momentum is (roughly) conserved.
    split() {
        if(this.radius < MIN_SPLIT_RADIUS) return [];

        const count = this.radius > 34 ? 3 : 2;
        const fragments = [];
        const baseAngle = Math.random() * Math.PI * 2;

        for(let i = 0; i < count; i++) {
            const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const radius = this.radius * (count === 3 ? 0.5 : 0.62) * (0.9 + Math.random() * 0.2);
            const kick = 40 + Math.random() * 50;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            fragments.push(new Rock({
                x: this.x + dirX * this.radius * 0.5,
                y: this.y + dirY * this.radius * 0.5,
                vx: this.vx + dirX * kick,
                vy: this.vy + dirY * kick,
                radius: radius,
                grace: FRAGMENT_GRACE
            }));
        }

        return fragments;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        Object(__WEBPACK_IMPORTED_MODULE_0__physics_physics__["e" /* wrapPosition */])(this);
    }

    // Faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 180, 255, 0.10)');
        gradient.addColorStop(1, 'rgba(140, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        const { shape } = this;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(shape[0][0], shape[0][1]);
        for(let i = 1; i < shape.length; i++) ctx.lineTo(shape[i][0], shape[i][1]);
        ctx.closePath();

        ctx.fillStyle = this.flash > 0 ? '#fff' : 'rgba(225, 225, 235, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(120, 120, 140, 0.9)';
        ctx.stroke();

        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Rock);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Keyboard + mouse input. Listeners are attached once; the game reads `input`
// every physics step instead of mutating ship state from a separate interval.

const KEY_MAP = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'rotateLeft',
    KeyD: 'rotateRight',
    KeyQ: 'strafeLeft',
    KeyE: 'strafeRight',
    KeyX: 'stabilize',
    Space: 'fire'
};

const input = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    strafeLeft: false,
    strafeRight: false,
    stabilize: false,
    fire: false,
    mouseDown: false,
    mouseX: window.innerWidth / 2,
    mouseY: 0,
    enabled: false,

    get firing() {
        return this.fire || this.mouseDown;
    },

    reset() {
        Object.keys(KEY_MAP).forEach(code => { this[KEY_MAP[code]] = false; });
        this.mouseDown = false;
    }
};
/* harmony export (immutable) */ __webpack_exports__["b"] = input;


let initialized = false;

const loadInputHandlers = () => {
    if(initialized) return;
    initialized = true;

    window.addEventListener('keydown', (event) => {
        const action = KEY_MAP[event.code];
        if(!action) return;
        if(input.enabled) event.preventDefault();
        input[action] = true;
    });

    window.addEventListener('keyup', (event) => {
        const action = KEY_MAP[event.code];
        if(action) input[action] = false;
    });

    window.addEventListener('mousemove', (event) => {
        input.mouseX = event.clientX;
        input.mouseY = event.clientY;
    });

    window.addEventListener('mousedown', (event) => {
        if(event.button === 0 && input.enabled) input.mouseDown = true;
    });

    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) input.mouseDown = false;
    });

    window.addEventListener('contextmenu', (event) => {
        if(input.enabled) event.preventDefault();
    });

    // Releasing keys while the window is unfocused would otherwise leave them stuck.
    window.addEventListener('blur', () => input.reset());
};

/* harmony default export */ __webpack_exports__["a"] = (loadInputHandlers);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// All game sounds live here so they are created and wired up exactly once.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.6);
const minigunSound = createLoop('./assets/sounds/minigun.mp3', 0.5);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.2);

const rockHitSound = new Audio('./assets/sounds/explosion1.mp3');
const explosionSound = new Audio('./assets/sounds/explosion2.mp3');

// play() returns a promise that rejects when autoplay is blocked; ignore it.
const safePlay = (audio) => {
    const result = audio.play();
    if(result && result.catch) result.catch(() => {});
};

const setLooping = (audio, on) => {
    if(on && audio.paused) safePlay(audio);
    if(!on && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
    }
};

const playOneShot = (audio, volume) => {
    audio.volume = volume;
    audio.currentTime = 0;
    safePlay(audio);
};

const sounds = {
    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring(on) { setLooping(minigunSound, on); },
    rockHit() { playOneShot(rockHitSound, 0.5); },
    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },
    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        setLooping(minigunSound, false);
    }
};

/* harmony default export */ __webpack_exports__["a"] = (sounds);


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(10);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(12)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./main.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./main.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(11)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}", ""]);

// exports


/***/ }),
/* 11 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(13);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 13 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);