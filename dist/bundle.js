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
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Pre-rendered images. Glows, gradients and detailed line art are expensive to draw
// on a canvas every frame, so anything that doesn't change is drawn once into an
// offscreen canvas and then stamped with drawImage (a cheap bitmap copy).

const cache = {};

// Sprites are drawn magnified by the camera zoom, so render them a bit sharper.
const spriteResolution = () => Math.min(2.5, (window.devicePixelRatio || 1) * 1.5);
/* harmony export (immutable) */ __webpack_exports__["d"] = spriteResolution;


// Draws `draw(ctx)` into a new offscreen canvas of `width` x `height` world pixels.
const createSprite = (width, height, draw, resolution) => {
    const res = resolution || spriteResolution();
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width * res));
    canvas.height = Math.max(1, Math.ceil(height * res));
    const ctx = canvas.getContext('2d');
    ctx.scale(res, res);
    draw(ctx);
    return { canvas: canvas, width: width, height: height };
};
/* harmony export (immutable) */ __webpack_exports__["a"] = createSprite;


// Soft round glow, white-hot centre fading to `color` then transparent.
const glowSprite = (color) => {
    const key = 'glow:' + color;
    if(!cache[key]) {
        cache[key] = createSprite(64, 64, ctx => {
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255, 250, 235, 1)');
            g.addColorStop(0.25, 'rgba(' + color + ', 0.8)');
            g.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["c"] = glowSprite;


// Flame/jet pointing along +x from its left-middle edge (draw it rotated and stretched).
const flameSprite = (color, core) => {
    const key = 'flame:' + color + ':' + core;
    if(!cache[key]) {
        cache[key] = createSprite(128, 32, ctx => {
            const g = ctx.createLinearGradient(0, 0, 128, 0);
            g.addColorStop(0, 'rgba(' + core + ', 0.95)');
            g.addColorStop(0.35, 'rgba(' + color + ', 0.8)');
            g.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.lineTo(128, 16);
            ctx.lineTo(0, 30);
            ctx.closePath();
            ctx.fill();
            const inner = ctx.createLinearGradient(0, 0, 70, 0);
            inner.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
            inner.addColorStop(1, 'rgba(255, 255, 240, 0)');
            ctx.fillStyle = inner;
            ctx.beginPath();
            ctx.moveTo(0, 9);
            ctx.lineTo(70, 16);
            ctx.lineTo(0, 23);
            ctx.closePath();
            ctx.fill();
        }, 1);
    }
    return cache[key];
};
/* harmony export (immutable) */ __webpack_exports__["b"] = flameSprite;


// Stamp a sprite centred at (x, y) with the given size.
const stamp = (ctx, sprite, x, y, width, height) => {
    ctx.drawImage(sprite.canvas, x - width / 2, y - height / 2, width, height);
};
/* harmony export (immutable) */ __webpack_exports__["e"] = stamp;



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// What asteroids are made of. Prices are credits per unit of ore sold at the station.
// `minSector` is how many sectors from base a material starts appearing;
// `weight` and `growth` control how common it is (growing with distance).

const MATERIALS = {
    rock: { id: 'rock', name: 'Rock', color: '150,150,160', price: 1, minSector: 0, weight: 60, growth: 0 },
    iron: { id: 'iron', name: 'Iron', color: '205,120,90', price: 6, minSector: 0, weight: 30, growth: 0 },
    copper: { id: 'copper', name: 'Copper', color: '235,150,70', price: 10, minSector: 1, weight: 14, growth: 1.5 },
    titanium: { id: 'titanium', name: 'Titanium', color: '170,205,240', price: 18, minSector: 2, weight: 8, growth: 2 },
    gold: { id: 'gold', name: 'Gold', color: '255,215,80', price: 40, minSector: 4, weight: 3, growth: 1.2 },
    naquadah: { id: 'naquadah', name: 'Naquadah', color: '110,255,170', price: 100, minSector: 7, weight: 1, growth: 0.6 }
};

const MATERIAL_ORDER = ['rock', 'iron', 'copper', 'titanium', 'gold', 'naquadah'];
/* harmony export (immutable) */ __webpack_exports__["a"] = MATERIAL_ORDER;


// Main material of an asteroid at a given distance (in sectors) from base.
const rollMaterial = (rng, sectorDistance) => {
    const options = MATERIAL_ORDER
        .map(id => MATERIALS[id])
        .filter(m => sectorDistance >= m.minSector)
        .map(m => ({ id: m.id, weight: m.weight + m.growth * (sectorDistance - m.minSector) }));

    const total = options.reduce((sum, o) => sum + o.weight, 0);
    let roll = rng() * total;
    for(let i = 0; i < options.length; i++) {
        roll -= options[i].weight;
        if(roll <= 0) return options[i].id;
    }
    return 'rock';
};
/* harmony export (immutable) */ __webpack_exports__["d"] = rollMaterial;


// Pick a material id from a composition like { rock: 0.4, gold: 0.6 }.
const pickFromComposition = (composition, random) => {
    let roll = (random || Math.random)();
    const keys = Object.keys(composition);
    for(let i = 0; i < keys.length; i++) {
        roll -= composition[keys[i]];
        if(roll <= 0) return keys[i];
    }
    return keys[keys.length - 1];
};
/* unused harmony export pickFromComposition */


const dominantMaterial = (composition) => {
    let best = 'rock';
    let bestShare = -1;
    Object.keys(composition).forEach(id => {
        // Prefer showing the metal over plain rock when it's a decent share.
        const share = composition[id] * (id === 'rock' ? 0.6 : 1);
        if(share > bestShare) {
            bestShare = share;
            best = id;
        }
    });
    return best;
};
/* harmony export (immutable) */ __webpack_exports__["c"] = dominantMaterial;


/* harmony default export */ __webpack_exports__["b"] = (MATERIALS);


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Shared physics helpers for an open, endless zero-gravity world.
// Units: pixels and seconds. World coordinates are unbounded; the camera follows the ship.

// Gravitational constant, tuned for gameplay. Mass of an asteroid is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
const G = 150;
/* harmony export (immutable) */ __webpack_exports__["a"] = G;


// Beyond this distance gravity is negligible and skipped for performance.
const GRAVITY_CUTOFF_SQ = 1300 * 1300;

// Viewport size (the camera's view of the world).
const world = {
    width: window.innerWidth,
    height: window.innerHeight,

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
};
/* harmony export (immutable) */ __webpack_exports__["d"] = world;


const delta = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });
/* harmony export (immutable) */ __webpack_exports__["b"] = delta;


// Gravitational acceleration that `attractors` exert on `body`.
// Softened by the attractor's radius so nothing gets flung to infinity.
const gravityAt = (body, attractors) => {
    let ax = 0;
    let ay = 0;

    for(let i = 0; i < attractors.length; i++) {
        const other = attractors[i];
        if(other === body || other.dead) continue;

        const dx = other.x - body.x;
        const dy = other.y - body.y;
        const distSq = dx * dx + dy * dy;
        if(distSq < 0.0001 || distSq > GRAVITY_CUTOFF_SQ) continue;

        const dist = Math.sqrt(distSq);
        const accel = G * other.mass / (distSq + other.radius * other.radius);

        ax += dx / dist * accel;
        ay += dy / dist * accel;
    }

    return { x: ax, y: ay };
};
/* harmony export (immutable) */ __webpack_exports__["c"] = gravityAt;



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Small glowing sparks, plus soft dust that can be drawn into an asteroid
// (used when asteroids merge: the dust cloud spirals in and settles on the surface).

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
        this.dust = !!options.dust;
        this.alpha = options.alpha === undefined ? 1 : options.alpha;
        this.attractor = options.attractor || null;
        this.swirl = options.swirl || 0;
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
                color: options.color,
                dust: options.dust,
                alpha: options.alpha
            }));
        }
    }

    // A ring of dust around (x, y) that swirls inwards onto `attractor`.
    static mergeCloud(target, x, y, attractor, count, spread, color) {
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = spread * (0.3 + Math.random() * 0.9);
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;
            const out = 15 + Math.random() * 35;
            target.push(new Particle({
                x: px,
                y: py,
                vx: attractor.vx + Math.cos(angle) * out,
                vy: attractor.vy + Math.sin(angle) * out,
                life: 1.6 + Math.random() * 1.4,
                size: 5 + Math.random() * 9,
                color: color,
                dust: true,
                alpha: 0.18 + Math.random() * 0.14,
                attractor: attractor,
                swirl: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6)
            }));
        }
    }

    update(dt) {
        const a = this.attractor;
        if(a && !a.dead) {
            const dx = a.x - this.x;
            const dy = a.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
            // Fall inwards with a tangential swirl, matching the asteroid's drift.
            const pull = 160 + 3000 / (distance + 20);
            this.vx += (dx / distance * pull - dy / distance * pull * this.swirl) * dt;
            this.vy += (dy / distance * pull + dx / distance * pull * this.swirl) * dt;
            this.vx += (a.vx - this.vx) * Math.min(1, dt * 1.5);
            this.vy += (a.vy - this.vy) * Math.min(1, dt * 1.5);
            if(distance < a.radius * 0.75) this.life = Math.min(this.life, 0.25);
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = Math.max(this.life / this.maxLife, 0);
        if(this.dust) {
            // Soft puff: fade in quickly, fade out slowly.
            const fade = Math.min(1, (1 - t) * 6) * Math.min(1, t * 3);
            ctx.fillStyle = 'rgba(' + this.color + ',' + (this.alpha * fade).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (0.6 + 0.4 * (1 - t)), 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        const size = this.shrink ? this.size * (0.3 + 0.7 * t) : this.size;
        ctx.fillStyle = 'rgba(' + this.color + ',' + (t * this.alpha).toFixed(3) + ')';
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Particle);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// jets:      manoeuvring jet positions on the hull edges (mirrored to both sides)
// The shield bubble is computed from the line art so it always encloses the whole ship.

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);
const rect = (x1, y1, x2, y2) => ({ rect: [x1, y1, x2, y2] });
const line = (x1, y1, x2, y2) => ({ pts: [[x1, y1], [x2, y2]] });
const mirrorRect = (x1, y1, x2, y2) => [rect(x1, y1, x2, y2), rect(x1, -y1, x2, -y2)];
const mirrorLine = (x1, y1, x2, y2) => [line(x1, y1, x2, y2), line(x1, -y1, x2, -y2)];
const row = (xs, y, r) => xs.map(x => [x, y, r]);
// Closed outline from its top half (bow to stern, negative y), mirrored onto the bottom half.
const symmetric = (half) => half.concat(half.slice().reverse().filter(p => p[1] !== 0).map(p => [p[0], -p[1]]));
const grid = (x0, y0, cols, rows, w, h, gap) => {
    const parts = [];
    for(let c = 0; c < cols; c++) {
        for(let r = 0; r < rows; r++) {
            const x = x0 + c * (w + gap);
            const y = y0 + r * (h + gap);
            parts.push(rect(x, y, x + w, y + h));
        }
    }
    return parts;
};


// Closed polygon approximating an ellipse.
const ellipse = (cx, cy, rx, ry, steps) => {
    const pts = [];
    const n = steps || 20;
    for(let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return { closed: true, pts: pts };
};
// Thick bent leg through `points` with half-width `w`, squared off at both ends.
const leg = (points, w) => {
    const left = [];
    const right = [];
    points.forEach((p, i) => {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(points.length - 1, i + 1)];
        let dx = next[0] - prev[0];
        let dy = next[1] - prev[1];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len;
        dy /= len;
        left.push([p[0] - dy * w, p[1] + dx * w]);
        right.push([p[0] + dy * w, p[1] - dx * w]);
    });
    return { closed: true, pts: left.concat(right.reverse()) };
};
const mirrorPart = (part) => ({ closed: part.closed, pts: mirror(part.pts) });

const HULLS = {
    x302: {
        id: 'x302',
        name: 'F-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter: big swept wings, twin main engines and two nacelles. Tiny cargo hold.',
        cost: 0,
        color: '225,235,255',
        exhaust: '255,160,80',
        mass: 1,
        hull: 60,
        baseShield: 0,
        cargo: 12,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 32,
        art: [
            // Wings: straight leading edge out to a squared tip, long diagonal trailing edge.
            { closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] },
            mirrorPart({ closed: true, pts: [[11, -4], [14, -31.5], [5, -31.5], [-12.5, -9.5], [-12.5, -4]] }),
            ...mirrorRect(13.4, -31.5, 6, -30.4),
            ...mirrorLine(9, -6, 12.4, -28), ...mirrorLine(3, -28, -8, -11),
            // Engine nacelles beside the body.
            ...mirrorRect(-2.5, -8.5, -15.5, -5.8), ...mirrorRect(-15.5, -8.2, -17.5, -6.1),
            // Fuselage, cockpit and the twin main engine block.
            { closed: true, pts: symmetric([[18, 0], [14, -2], [10, -2.6], [5.5, -2.6], [4, -4], [-8.5, -4], [-8.5, 0]]) },
            rect(-6.5, -3, -14.5, 3),
            rect(-14.5, -2.8, -16.5, -0.4), rect(-14.5, 0.4, -16.5, 2.8),
            { closed: true, pts: symmetric([[16, 0], [13, -1.5], [7, -1.5]]) },
            line(4, -4, 4, 4), line(-2, -4, -2, 4)
        ],
        slots: [
            { id: 'c', x: -1, y: 0 },
            { id: 'wl', x: 2, y: -18 },
            { id: 'wr', x: 2, y: 18 }
        ],
        engines: [{ x: -16.5, y: -1.6, size: 0.6 }, { x: -16.5, y: 1.6, size: 0.6 }, { x: -17.5, y: -7.2, size: 0.45 }, { x: -17.5, y: 7.2, size: 0.45 }],
        colliders: [[14, 0, 4], [5, 0, 5], [-6, 0, 6], [-14, 0, 4], [4, -14, 6], [4, 14, 6], [8, -24, 5], [8, 24, 5], [-4, -12, 5], [-4, 12, 5]],
        jets: { retro: [[14, 2.5]], side: [[9, 31.5]], bow: [16, 2], stern: [-17, 8.5] },
        jetScale: 0.9
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser: U-shaped engineering section, long neck and a squared bow.',
        cost: 2500,
        color: '205,225,255',
        exhaust: '255,160,80',
        mass: 3,
        hull: 160,
        baseShield: 0,
        cargo: 45,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 54,
        art: [
            // Arms of the U running forward either side of the hull.
            ...mirrorRect(-32.6, -22.9, -1.5, -14),
            ...mirrorRect(-12, -22.9, -1.5, -14),
            ...mirrorLine(-28, -18.5, -12, -18.5),
            // Rear block with chamfered corners and the engine row.
            { closed: true, pts: symmetric([[-32.6, -22.9], [-43.4, -22.9], [-50, -16.3], [-50, 0]]) },
            // Central hull plate between the arms.
            { closed: true, pts: symmetric([[-1.5, -8.8], [-40, -8.8], [-44.5, -4.4], [-44.5, 0]]) },
            // Raised superstructure and hangar.
            { closed: true, pts: symmetric([[10.5, -5.5], [-12, -5.5], [-20, -3], [-32.6, -3], [-32.6, 0]]) },
            rect(-14, -2, -28, 2),
            // Neck.
            rect(-1.5, -6.6, 29, 6.6),
            line(8, -6.6, 8, 6.6), line(18, -6.6, 18, 6.6),
            ...mirrorLine(0, -3.3, 28, -3.3),
            // Forward section with intakes.
            { closed: true, pts: symmetric([[50, -6.6], [46.7, -10.6], [29, -10.6], [29, 0]]) },
            ...mirrorRect(31, -9, 36, -5.5),
            line(40, -10.6, 40, 10.6),
            // Turret blisters on the arms.
            { circle: [-26, -17.6, 2] }, { circle: [-26, 17.6, 2] },
            // Engine nozzles across the stern.
            { circle: [-48, -11, 1.6] }, { circle: [-48, -14.5, 1.6] }, { circle: [-48, -18, 1.6] },
            { circle: [-48, 11, 1.6] }, { circle: [-48, 14.5, 1.6] }, { circle: [-48, 18, 1.6] }
        ],
        slots: [
            { id: 'bow', x: 40, y: 0 },
            { id: 'bridge', x: 14, y: 0 },
            { id: 'ml', x: -22, y: -5.5 },
            { id: 'mr', x: -22, y: 5.5 },
            { id: 'nl', x: -16, y: -18.5 },
            { id: 'nr', x: -16, y: 18.5 }
        ],
        engines: [-18, -14.5, -11, 11, 14.5, 18].map(y => ({ x: -50, y: y, size: 0.7 })),
        colliders: [[46, 0, 8], [37, 0, 10], [24, 0, 7], [14, 0, 7], [4, 0, 7]]
            .concat(row([-6, -18, -30, -42], 0, 9), row([-6, -18, -30, -42], -17, 7), row([-6, -18, -30, -42], 17, 7)),
        jets: { retro: [[48, 9], [-2, 18.5]], side: [[38, 10.6], [-20, 22.9]], bow: [46, 8], stern: [-48, 22] },
        jetScale: 1.3
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space battlecruiser: long forward hull, wide engineering section and twin hangar pods.',
        cost: 6000,
        color: '210,230,255',
        exhaust: '255,160,80',
        mass: 5,
        hull: 260,
        baseShield: 30,
        cargo: 90,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 70,
        art: [
            // Hangar pods either side of the engineering section.
            { closed: true, pts: [[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]] },
            { closed: true, pts: mirror([[-8, -22], [-8, -33], [-13, -38], [-62, -38], [-64, -36], [-64, -22]]) },
            ...mirrorRect(-14, -25, -58, -35),
            ...mirrorLine(-27, -25, -27, -35), ...mirrorLine(-42, -25, -42, -35),
            // Engineering section.
            { closed: true, pts: symmetric([[-8, -16], [-14, -22], [-58, -22], [-64, -16]]) },
            rect(-14, -16, -58, 16),
            line(-14, -8, -58, -8), line(-14, 8, -58, 8),
            ...mirrorRect(-20, -13, -28, -10), ...mirrorRect(-44, -13, -52, -10),
            rect(-30, -4, -42, 4),
            // Forward hull, neck and nose.
            { closed: true, pts: symmetric([[66, -6], [64, -8], [42, -8], [37, -12], [8, -12], [6, -9.5], [-9, -9.5]]) },
            { closed: true, pts: symmetric([[60, -4], [42, -5], [38, -9], [12, -9]]) },
            ...grid(14, -7, 5, 2, 3.4, 5, 1.2),
            // Bridge superstructure on the neck.
            { closed: true, pts: symmetric([[6, -5], [-6, -6]]) },
            line(3, -3.5, 3, 3.5),
            line(66, 4, 80, 4),
            // Engine nozzles: three centre, three per pod.
            rect(-64, -13, -67, -7), rect(-64, -3, -67, 3), rect(-64, 7, -67, 13),
            ...mirrorRect(-64, -27, -66.5, -23), ...mirrorRect(-64, -32, -66.5, -28), ...mirrorRect(-64, -37, -66.5, -33)
        ],
        slots: [
            { id: 'nose', x: 52, y: 0 },
            { id: 'mid', x: 25, y: 0 },
            { id: 'bridge', x: 0, y: 0 },
            { id: 'aft', x: -36, y: 0 },
            { id: 'cl', x: -50, y: -14 },
            { id: 'cr', x: -50, y: 14 },
            { id: 'bl1', x: -20, y: -30 },
            { id: 'br1', x: -20, y: 30 },
            { id: 'bl2', x: -48, y: -30 },
            { id: 'br2', x: -48, y: 30 }
        ],
        engines: [{ x: -67, y: -10, size: 0.9 }, { x: -67, y: 0, size: 0.9 }, { x: -67, y: 10, size: 0.9 },
            { x: -66.5, y: -25, size: 0.6 }, { x: -66.5, y: -30, size: 0.6 }, { x: -66.5, y: -35, size: 0.6 },
            { x: -66.5, y: 25, size: 0.6 }, { x: -66.5, y: 30, size: 0.6 }, { x: -66.5, y: 35, size: 0.6 }],
        colliders: [[58, 0, 7], [46, 0, 8], [32, 0, 11], [18, 0, 11], [4, 0, 9]]
            .concat(row([-16, -30, -44, -57], -11, 11), row([-16, -30, -44, -57], 11, 11))
            .concat(row([-14, -28, -42, -56], -30, 8), row([-14, -28, -42, -56], 30, 8)),
        jets: { retro: [[40, 11], [-8, 30]], side: [[22, 12], [-36, 38]], bow: [56, 7], stern: [-60, 38] },
        jetScale: 1.5,
    },

    hatak: {
        id: 'hatak',
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Pyramid warship with six great legs. Huge hold, tough and shielded, slow to turn.',
        cost: 5000,
        color: '255,205,110',
        mass: 7,
        hull: 380,
        baseShield: 50,
        cargo: 140,
        thrust: 900,
        torque: 2.2,
        maxTurn: 1.6,
        moduleScale: 1.1,
        radius: 72,
        art: [
            // Six legs: a forward pair, a side pair and a rear pair, each with an elbow.
            leg([[10, -17], [40, -13.5], [64, -8.5]], 4.5), mirrorPart(leg([[10, -17], [40, -13.5], [64, -8.5]], 4.5)),
            leg([[2, -22], [2, -44], [9, -63]], 7), mirrorPart(leg([[2, -22], [2, -44], [9, -63]], 7)),
            leg([[-12, -16], [-34, -30], [-58, -40]], 7), mirrorPart(leg([[-12, -16], [-34, -30], [-58, -40]], 7)),
            // Squared feet at the end of each leg.
            ...mirrorRect(62, -13.5, 68, -4), ...mirrorRect(3, -60, 16, -66),
            { closed: true, pts: [[-55, -46], [-62, -34], [-66, -36], [-59, -48]] },
            mirrorPart({ closed: true, pts: [[-55, -46], [-62, -34], [-66, -36], [-59, -48]] }),
            // Hangar rings at the elbows.
            { circle: [2, -44, 4] }, { circle: [2, 44, 4] }, { circle: [-34, -30, 4] }, { circle: [-34, 30, 4] },
            { circle: [40, -13.5, 2.5] }, { circle: [40, 13.5, 2.5] },
            // Central pyramid: nested triangles pointing forward.
            { closed: true, pts: [[26, 0], [-16, -22], [-16, 22]] },
            { closed: true, pts: [[16, 0], [-10, -14], [-10, 14]] },
            { closed: true, pts: [[7, 0], [-5, -6.5], [-5, 6.5]] },
            line(26, 0, 7, 0), line(-16, -22, -5, -6.5), line(-16, 22, -5, 6.5),
            ...mirrorRect(-16, -12, -19, -4)
        ],
        slots: [
            { id: 'top', x: 3, y: 0 },
            { id: 'fl', x: 52, y: -11 },
            { id: 'fr', x: 52, y: 11 },
            { id: 'pl', x: 2, y: -33 },
            { id: 'pr', x: 2, y: 33 },
            { id: 'al', x: -46, y: -35 },
            { id: 'ar', x: -46, y: 35 },
            { id: 'sl', x: -11, y: -10 },
            { id: 'sr', x: -11, y: 10 }
        ],
        engines: [{ x: -19, y: -8, size: 1.3 }, { x: -19, y: 8, size: 1.3 }, { x: -64, y: -41, size: 0.8 }, { x: -64, y: 41, size: 0.8 }],
        colliders: [[2, 0, 16], [16, 0, 9], [-12, -14, 7], [-12, 14, 7],
            [26, -15, 5], [26, 15, 5], [44, -13, 5], [44, 13, 5], [62, -8.5, 5], [62, 8.5, 5],
            [2, -28, 8], [2, 28, 8], [3, -44, 8], [3, 44, 8], [8, -60, 8], [8, 60, 8],
            [-22, -22, 8], [-22, 22, 8], [-36, -31, 8], [-36, 31, 8], [-52, -38, 8], [-52, 38, 8]],
        jets: { retro: [[66, 10]], side: [[9, 66]], bow: [62, 11], stern: [-60, 46] },
        jetScale: 1.8,
        exhaust: '255,190,90',
        shieldColor: '255,200,120'
    },

    asgard: {
        id: 'asgard',
        name: 'Asgard',
        className: "O'Neill-class",
        faction: 'Asgard',
        description: 'Pinnacle of Asgard engineering: pointed head, slender neck and vast crescent wings.',
        cost: 12000,
        color: '170,240,255',
        exhaust: '140,220,255',
        shieldColor: '150,230,255',
        mass: 5,
        hull: 300,
        baseShield: 100,
        cargo: 80,
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 92,
        art: [
            // Crescent wings with curved ribs, sweeping out from the rear body.
            { closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] },
            mirrorPart({ closed: true, pts: [[-20, -20], [-19.5, -32], [-20.5, -44], [-23.5, -56], [-28.5, -68], [-34, -78], [-37.5, -84],
                [-40.5, -82], [-44, -74], [-48.5, -63], [-53, -51], [-57.5, -39], [-61.5, -28], [-64, -19]] }),
            { pts: [[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]] },
            { pts: mirror([[-24, -24], [-24.5, -40], [-27, -54], [-32, -66], [-37, -76]]) },
            { pts: [[-30, -28], [-34, -46], [-39, -62], [-41, -72]] },
            { pts: mirror([[-30, -28], [-34, -46], [-39, -62], [-41, -72]]) },
            { pts: [[-38, -26], [-45, -42], [-50, -56]] },
            { pts: mirror([[-38, -26], [-45, -42], [-50, -56]]) },
            // Engine pods and forward-pointing cannons on the wings.
            { closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] },
            mirrorPart({ closed: true, pts: [[-17, -37], [-26, -35.5], [-36, -36.5], [-38, -38.5], [-27, -40.5], [-17, -39]] }),
            ...mirrorRect(-26, -56.8, -3, -55.2),
            { circle: [-2, -56, 1.4] }, { circle: [-2, 56, 1.4] },
            // Rear body: outer hull, collar, inner bay with cells.
            ellipse(-44, 0, 31, 24, 36),
            ellipse(-46, 0, 26, 20, 32),
            ellipse(-40, 0, 19, 14, 28),
            ...grid(-55, -8.5, 4, 2, 5.5, 7.5, 1.5),
            line(-60, 0, -21, 0),
            // Neck lined with window rows and ribbing.
            rect(17, -12, -15, 12),
            ...grid(-12, -11, 7, 1, 3, 3, 1.4), ...grid(-12, 8, 7, 1, 3, 3, 1.4),
            line(-14, -6, 16, -6), line(-14, 6, 16, 6),
            ...[-11, -8, -5, -2, 1, 4, 7, 10, 13].map(x => line(x, -6, x, 6)),
            // Head: hexagonal hull, inset deck, bat-wing chevrons and side vents.
            { closed: true, pts: symmetric([[78, -3], [76, -6], [45, -28], [24, -28], [17, -13], [17, 0]]) },
            { closed: true, pts: symmetric([[72, -2.5], [44, -23], [27, -23], [22, -12], [22, 0]]) },
            { pts: [[28, -19], [44, -12], [38, 0], [44, 12], [28, 19]] },
            { pts: [[64, -8], [53, 0], [64, 8]] },
            ...mirrorRect(34, -25.5, 26, -21.5),
            rect(78, -1.5, 80.5, 1.5)
        ],
        slots: [
            { id: 'nose', x: 58, y: 0 },
            { id: 'hl', x: 34, y: -18 },
            { id: 'hr', x: 34, y: 18 },
            { id: 'fwd', x: 2, y: 0 },
            { id: 'core', x: -33, y: 0 },
            { id: 'aft', x: -50, y: 0 },
            { id: 'fl', x: -36, y: -62 },
            { id: 'fr', x: -36, y: 62 },
            { id: 'tail', x: -68, y: 0 }
        ],
        engines: [{ x: -75, y: -7, size: 1.2 }, { x: -75, y: 7, size: 1.2 }, { x: -63, y: -22, size: 0.8 }, { x: -63, y: 22, size: 0.8 }],
        colliders: [[58, 0, 12], [40, -12, 11], [40, 12, 11], [26, 0, 12], [8, 0, 13], [-6, 0, 13],
            [-24, 0, 20], [-44, 0, 24], [-62, 0, 16],
            [-28, -40, 9], [-28, 40, 9], [-32, -58, 9], [-32, 58, 9], [-38, -74, 7], [-38, 74, 7],
            [-48, -52, 8], [-48, 52, 8], [-56, -34, 8], [-56, 34, 8]],
        jets: { retro: [[42, 27], [-36, 80]], side: [[30, 28], [-48, 66]], bow: [62, 12], stern: [-70, 22] },
        jetScale: 1.6
    },

    aurora: {
        id: 'aurora',
        name: 'Aurora',
        className: 'Ancient warship',
        faction: 'Ancient',
        description: 'Lantean battleship: pointed bow, blocky drone module and broad rear wings. Fastest drive, ten mounts.',
        cost: 25000,
        color: '240,220,160',
        exhaust: '130,200,255',
        shieldColor: '255,230,160',
        mass: 6,
        hull: 420,
        baseShield: 160,
        cargo: 110,
        thrust: 1900,
        torque: 3.4,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 92,
        art: [
            // Broad rear wing blocks.
            { closed: true, pts: [[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]] },
            { closed: true, pts: mirror([[-58, -9], [-60, -28], [-66, -30], [-82, -30], [-85, -26], [-85, -9]]) },
            ...mirrorRect(-64, -26, -80, -13),
            ...mirrorLine(-64, -19.5, -80, -19.5),
            ...mirrorRect(-85, -26, -87.5, -20),
            // Fins on the spine.
            { closed: true, pts: [[-37, -8], [-39, -24], [-44, -25], [-46, -8]] },
            { closed: true, pts: mirror([[-37, -8], [-39, -24], [-44, -25], [-46, -8]]) },
            ...mirrorLine(-40, -12, -42, -22),
            // Main hull: bow, forward module, mid-body, spine and stern.
            { closed: true, pts: symmetric([[88, 0], [80, -3], [56, -10], [50, -12], [48, -23], [44, -24], [22, -24], [19, -19.5], [-12, -19.5],
                [-17, -15], [-17, -8], [-58, -8], [-60, -9], [-87, -9], [-89, -5], [-89, 0]]) },
            ...mirrorRect(44, -22, 24, -17),
            line(80, 0, 50, 0), line(-17, 0, -84, 0),
            ...mirrorLine(80, -3, 50, -3),
            line(48, -12, 48, 12), line(22, -19.5, 22, 19.5),
            ...mirrorRect(42, -14, 26, -8),
            rect(14, -15, -12, 15),
            line(14, -15, -12, 15), line(-12, -15, 14, 15),
            { circle: [1, 0, 5] },
            ...mirrorLine(-40, -8, -40, -3), ...mirrorLine(-50, -8, -50, -3),
            rect(-89, -5, -92, -1), rect(-89, 1, -92, 5)
        ],
        slots: [
            { id: 'nose', x: 66, y: 0 },
            { id: 'fwd', x: 34, y: 0 },
            { id: 'pl', x: 34, y: -11 },
            { id: 'pr', x: 34, y: 11 },
            { id: 'core', x: 1, y: 0 },
            { id: 'mid', x: -26, y: 0 },
            { id: 'aft', x: -48, y: 0 },
            { id: 'fl', x: -72, y: -20 },
            { id: 'fr', x: -72, y: 20 },
            { id: 'tail', x: -78, y: 0 }
        ],
        engines: [{ x: -92, y: -3, size: 1.1 }, { x: -92, y: 3, size: 1.1 }, { x: -87.5, y: -23, size: 0.9 }, { x: -87.5, y: 23, size: 0.9 }],
        colliders: row([80, 68, 56, 44, 32, 20, 8, -4, -16, -28, -40, -52, -64, -76, -86], 0, 8)
            .concat([[34, -14, 9], [34, 14, 9], [6, -12, 8], [6, 12, 8], [-72, -20, 9], [-72, 20, 9], [-42, -16, 6], [-42, 16, 6]]),
        jets: { retro: [[48, 22], [-60, 26]], side: [[34, 24], [-74, 30]], bow: [72, 4.5], stern: [-86, 28] },
        jetScale: 1.6
    }
};

const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard', 'aurora'];
/* harmony export (immutable) */ __webpack_exports__["a"] = HULL_ORDER;


const partPoints = (part) => {
    if(part.rect) {
        const r = part.rect;
        return [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
    }
    return part.pts;
};

const hullBounds = (hull) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    hull.art.forEach(part => {
        const pts = part.circle
            ? [[part.circle[0] - part.circle[2], part.circle[1] - part.circle[2]], [part.circle[0] + part.circle[2], part.circle[1] + part.circle[2]]]
            : partPoints(part);
        pts.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};
/* harmony export (immutable) */ __webpack_exports__["d"] = hullBounds;


// Draws the hull's line art in local ship coordinates (caller sets the transform).
const drawHullArt = (ctx, hull, options) => {
    const opts = options || {};
    const color = opts.color || hull.color;
    const alpha = opts.alpha === undefined ? 1 : opts.alpha;

    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.lineWidth = opts.lineWidth || 1.1;
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.shadowBlur = opts.glow === undefined ? 5 : opts.glow;
    ctx.shadowColor = 'rgba(' + color + ',' + (0.7 * alpha) + ')';

    hull.art.forEach(part => {
        ctx.beginPath();
        if(part.circle) {
            ctx.arc(part.circle[0], part.circle[1], part.circle[2], 0, Math.PI * 2);
        } else {
            const pts = partPoints(part);
            ctx.moveTo(pts[0][0], pts[0][1]);
            for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            if(part.closed || part.rect) ctx.closePath();
        }
        // Closed sections are filled dark so the line art reads against space.
        if(part.closed || part.rect) {
            ctx.fillStyle = 'rgba(8, 13, 24, ' + (0.85 * alpha) + ')';
            ctx.fill();
        }
        ctx.stroke();
    });

    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawHullArt;


// Smallest ellipse (with the hull's aspect ratio) that encloses every point of the
// line art, plus padding, so the shield never clips through the ship.
const shieldFor = (hull) => {
    if(hull._shield) return hull._shield;
    const b = hullBounds(hull);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const hw = (b.maxX - b.minX) / 2;
    const hh = (b.maxY - b.minY) / 2;
    let scale = 0;
    hull.art.forEach(part => {
        const pts = part.circle ? [[part.circle[0] + part.circle[2], part.circle[1]], [part.circle[0], part.circle[1] + part.circle[2]]] : partPoints(part);
        pts.forEach(p => {
            const nx = (p[0] - cx) / hw;
            const ny = (p[1] - cy) / hh;
            scale = Math.max(scale, Math.sqrt(nx * nx + ny * ny));
        });
    });
    const padding = 4 + hull.radius * 0.06;
    hull._shield = { x: cx, y: cy, rx: hw * scale + padding, ry: hh * scale + padding };
    return hull._shield;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = shieldFor;


/* harmony default export */ __webpack_exports__["b"] = (HULLS);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Module definitions. Each stat array is indexed by module level - 1 (Mk I..III).

const MAX_LEVEL = 3;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_LEVEL;


const MODULES = {
    minigun: {
        id: 'minigun',
        name: 'Minigun turret',
        short: 'Minigun',
        description: 'Rapid-fire turret. Aims at the cursor, or auto-targets with a targeting computer.',
        cost: 250,
        color: '255,200,120',
        stats: { fireRate: [12, 16, 21], damage: [1, 1.3, 1.7], heatShots: [60, 85, 120] },
        describe: (s) => s.fireRate + ' rounds/s, ' + s.damage + ' dmg, overheats after ' + s.heatShots + ' rounds'
    },
    staff: {
        id: 'staff',
        name: 'Staff cannon',
        short: 'Staff',
        description: "Goa'uld plasma cannon. Slow, heavy energy bolts that splash on impact.",
        cost: 900,
        color: '255,175,70',
        stats: { fireRate: [1.5, 1.9, 2.4], damage: [8, 11, 15], splash: [28, 34, 42] },
        describe: (s) => s.damage + ' dmg bolts, ' + s.fireRate + '/s, ' + s.splash + 'px splash'
    },
    beam: {
        id: 'beam',
        name: 'Asgard ion beam',
        short: 'Ion beam',
        description: 'Instant-hit energy beam that carves through rock. Fires in bursts, then recharges.',
        cost: 2200,
        color: '140,215,255',
        stats: { dps: [28, 40, 56], range: [600, 700, 820], burst: [1.2, 1.4, 1.7], cooldown: [2.6, 2.2, 1.8] },
        describe: (s) => s.dps + ' dmg/s, ' + s.burst + 's burst, recharge ' + s.cooldown + 's'
    },
    drones: {
        id: 'drones',
        name: 'Drone launcher',
        short: 'Drones',
        description: 'Ancient drone weapons (F / right click). Fires a salvo of five self-guided drones in a row; each detonates in a big energy blast.',
        cost: 2800,
        color: '255,225,130',
        stats: { count: [5, 5, 6], damage: [24, 32, 42], blast: [36, 44, 54], cooldown: [5, 4.2, 3.4] },
        describe: (s) => s.count + '-drone salvo, ' + s.damage + ' dmg, ' + s.blast + 'px blast, reload ' + s.cooldown + 's'
    },
    scanner: {
        id: 'scanner',
        name: 'Ore scanner',
        short: 'Scanner',
        description: 'Scans asteroids for metals: colours the scanner map by ore, pings the area and guides you to the richest asteroid nearby.',
        cost: 800,
        color: '190,255,140',
        stats: { range: [2000, 2700, 3400], interval: [5, 4, 3] },
        describe: (s) => s.range + 'px scan range, ping every ' + s.interval + 's'
    },
    missile: {
        id: 'missile',
        name: 'Missile pod',
        short: 'Missiles',
        description: 'Fires explosive missiles (F / right click). Home in on targets with a targeting computer.',
        cost: 600,
        color: '255,130,110',
        stats: { cooldown: [1.6, 1.2, 0.85], damage: [14, 20, 28], blast: [45, 55, 68] },
        describe: (s) => s.damage + ' dmg, ' + s.blast + 'px blast, reload ' + s.cooldown + 's'
    },
    engine: {
        id: 'engine',
        name: 'Sublight engine',
        short: 'Engine',
        description: 'Extra thrust and manoeuvring power.',
        cost: 400,
        color: '255,215,140',
        stats: { thrust: [220, 320, 440], torque: [1.2, 1.8, 2.5] },
        describe: (s) => '+' + s.thrust + ' thrust, +' + s.torque + ' turn'
    },
    shield: {
        id: 'shield',
        name: 'Shield emitter',
        short: 'Shield',
        description: 'Energy shield absorbs impacts and recharges when not hit.',
        cost: 700,
        color: '120,210,255',
        stats: { capacity: [40, 65, 95], regen: [8, 12, 18] },
        describe: (s) => '+' + s.capacity + ' shield, ' + s.regen + '/s recharge'
    },
    guidance: {
        id: 'guidance',
        name: 'Targeting computer',
        short: 'Guidance',
        description: 'Turrets lock on and fire automatically (toggle with G). Missiles become homing.',
        cost: 900,
        color: '140,255,160',
        stats: { range: [350, 480, 620], homing: [3, 4.5, 6] },
        describe: (s) => s.range + 'px lock range, homing ' + s.homing
    },
    cargo: {
        id: 'cargo',
        name: 'Cargo pod',
        short: 'Cargo',
        description: 'Extra hold space for ore.',
        cost: 350,
        color: '200,170,255',
        stats: { capacity: [20, 35, 55] },
        describe: (s) => '+' + s.capacity + ' cargo'
    },
    magnet: {
        id: 'magnet',
        name: 'Ore tractor',
        short: 'Tractor',
        description: 'Tractor beam that pulls in floating ore from further away.',
        cost: 450,
        color: '120,255,230',
        stats: { range: [160, 230, 320] },
        describe: (s) => s.range + 'px pickup range'
    },
    armor: {
        id: 'armor',
        name: 'Trinium armor',
        short: 'Armor',
        description: 'Reinforced plating. More hull, a little more mass.',
        cost: 300,
        color: '200,200,215',
        stats: { hull: [30, 50, 75], mass: [0.3, 0.3, 0.3] },
        describe: (s) => '+' + s.hull + ' hull'
    }
};

const MODULE_ORDER = ['minigun', 'staff', 'beam', 'missile', 'drones', 'engine', 'shield', 'guidance', 'scanner', 'cargo', 'magnet', 'armor'];
/* harmony export (immutable) */ __webpack_exports__["b"] = MODULE_ORDER;


const moduleStats = (type, level) => {
    const def = MODULES[type];
    const stats = {};
    Object.keys(def.stats).forEach(key => { stats[key] = def.stats[key][level - 1]; });
    return stats;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = moduleStats;


const upgradeCost = (type, level) => {
    if(level >= MAX_LEVEL) return null;
    return Math.round(MODULES[type].cost * (level === 1 ? 1 : 1.8));
};
/* harmony export (immutable) */ __webpack_exports__["g"] = upgradeCost;


const totalSpent = (type, level) => {
    let total = MODULES[type].cost;
    for(let l = 1; l < level; l++) total += upgradeCost(type, l);
    return total;
};
/* unused harmony export totalSpent */


const sellValue = (type, level) => Math.round(totalSpent(type, level) * 0.5);
/* harmony export (immutable) */ __webpack_exports__["f"] = sellValue;


// Line-art icon for a module, centred on (0, 0) in the current transform.
// `aim` is the local angle a turret barrel points at; `u` scales the drawing.
const drawModule = (ctx, type, level, options) => {
    const opts = options || {};
    const u = opts.scale || 1;
    const color = MODULES[type].color;
    const aim = opts.aim || 0;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = opts.lineWidth || 1.2;
    ctx.strokeStyle = 'rgb(' + color + ')';
    ctx.fillStyle = 'rgba(5, 10, 20, 0.85)';
    ctx.shadowBlur = opts.glow === undefined ? 5 : opts.glow;
    ctx.shadowColor = 'rgb(' + color + ')';

    const shape = (pts) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * u, pts[0][1] * u);
        for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * u, pts[i][1] * u);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };
    const line = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1 * u, y1 * u);
        ctx.lineTo(x2 * u, y2 * u);
        ctx.stroke();
    };
    const circle = (r, fill) => {
        ctx.beginPath();
        ctx.arc(0, 0, r * u, 0, Math.PI * 2);
        if(fill) ctx.fill();
        ctx.stroke();
    };

    if(type === 'minigun') {
        // One barrel per Mk level.
        ctx.save();
        ctx.rotate(aim);
        const offsets = level === 1 ? [0] : level === 2 ? [-1.3, 1.3] : [-2, 0, 2];
        if(opts.heat > 0.5) {
            ctx.strokeStyle = 'rgb(255,' + Math.round(200 - (opts.heat - 0.5) * 300) + ',' + Math.round(120 - (opts.heat - 0.5) * 200) + ')';
        }
        offsets.forEach(o => line(0, o, 9, o));
        ctx.strokeStyle = 'rgb(' + color + ')';
        ctx.restore();
        circle(3.6, true);
        circle(1.2);
    }

    if(type === 'staff') {
        // Long ribbed plasma cannon on a disc mount.
        ctx.save();
        ctx.rotate(aim);
        shape([[0, -1.6], [10, -1], [10, 1], [0, 1.6]]);
        for(let i = 0; i < level + 1; i++) line(3 + i * 2, -1.4, 3 + i * 2, 1.4);
        ctx.restore();
        shape([[0, -4], [3.5, -2], [3.5, 2], [0, 4], [-3.5, 2], [-3.5, -2]]);
    }

    if(type === 'beam') {
        // Asgard emitter: crystal dish with a focusing prong.
        ctx.save();
        ctx.rotate(aim);
        line(0, 0, 8, 0);
        line(5, -2, 8, 0); line(5, 2, 8, 0);
        ctx.restore();
        circle(4, true);
        ctx.beginPath();
        ctx.arc(0, 0, 2.2 * u, 0, Math.PI * 2);
        ctx.stroke();
        for(let i = 1; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (4 + i * 1.4) * u, Math.PI * 0.6, Math.PI * 1.4);
            ctx.stroke();
        }
    }

    if(type === 'drones') {
        // Hexagonal drone bay with glowing drone cells.
        shape([[4.5, 0], [2.2, -4], [-2.2, -4], [-4.5, 0], [-2.2, 4], [2.2, 4]]);
        const cells = level + 2;
        for(let i = 0; i < cells; i++) {
            const a = (i / cells) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 2.2 * u, Math.sin(a) * 2.2 * u, 0.7 * u, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    if(type === 'missile') {
        shape([[-4, -4], [4, -4], [5, 0], [4, 4], [-4, 4]]);
        const tubes = level + 1;
        for(let i = 0; i < tubes; i++) {
            const y = -2.5 + (5 / (tubes - 1)) * i;
            line(-2.5, y, 3, y);
        }
    }

    if(type === 'engine') {
        shape([[3, -3], [3, 3], [-4, 4.5], [-4, -4.5]]);
        for(let i = 0; i < level; i++) line(1 - i * 2, -2.5, 1 - i * 2, 2.5);
    }

    if(type === 'shield') {
        const hex = (r) => {
            const pts = [];
            for(let i = 0; i < 6; i++) pts.push([Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r]);
            return pts;
        };
        shape(hex(4.5));
        if(level >= 2) shape(hex(3));
        if(level >= 3) shape(hex(1.5));
    }

    if(type === 'guidance') {
        circle(3.8, true);
        line(-5.5, 0, -2, 0); line(2, 0, 5.5, 0);
        line(0, -5.5, 0, -2); line(0, 2, 0, 5.5);
        for(let i = 1; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (3.8 + i * 1.6) * u, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
        }
    }

    if(type === 'cargo') {
        shape([[-4.5, -4], [4.5, -4], [4.5, 4], [-4.5, 4]]);
        line(-4.5, 0, 4.5, 0);
        for(let i = 0; i < level; i++) line(-2 + i * 2, -4, -2 + i * 2, 4);
    }

    if(type === 'magnet') {
        // Horseshoe magnet, one field arc per level.
        ctx.beginPath();
        ctx.arc(-1 * u, 0, 3.5 * u, Math.PI / 2, Math.PI * 1.5);
        ctx.lineTo(3 * u, -3.5 * u);
        ctx.moveTo(-1 * u, 3.5 * u);
        ctx.lineTo(3 * u, 3.5 * u);
        ctx.stroke();
        for(let i = 0; i < level; i++) {
            ctx.beginPath();
            ctx.arc(3 * u, 0, (2 + i * 1.6) * u, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        }
    }

    if(type === 'scanner') {
        // Radar dish with sweep arcs (one per level).
        circle(3.4, true);
        line(0, 0, 3, -3);
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.stroke();
        for(let i = 0; i < level; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (4.8 + i * 1.5) * u, -Math.PI * 0.45, Math.PI * 0.05);
            ctx.stroke();
        }
    }

    if(type === 'armor') {
        shape([[0, -4.5], [4.5, 0], [0, 4.5], [-4.5, 0]]);
        for(let i = 0; i < level; i++) {
            const o = -1.5 + i * 1.5;
            line(-2 + o, -1, 1 + o, 2);
        }
    }

    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["d"] = drawModule;


/* harmony default export */ __webpack_exports__["c"] = (MODULES);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__world_materials__ = __webpack_require__(1);
// Persistent player profile: credits, owned hulls and the module loadout of each hull.





const BASE_MAGNET_RANGE = 90;
const REPAIR_COST_PER_HP = 2;
/* harmony export (immutable) */ __webpack_exports__["a"] = REPAIR_COST_PER_HP;


const STORAGE_KEY = 'awesome-game-shipyard-v1';

const defaultProfile = () => ({
    credits: 0,
    bestScore: 0,
    seed: Math.floor(Math.random() * 4294967295),
    cargo: {},
    hull: 'x302',
    ownedHulls: ['x302'],
    loadouts: {
        x302: { c: { type: 'minigun', level: 1 } }
    }
});

const load = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if(!raw) return defaultProfile();
        const data = JSON.parse(raw);
        const profile = Object.assign(defaultProfile(), data);
        if(!__WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][profile.hull] || profile.ownedHulls.indexOf(profile.hull) === -1) profile.hull = 'x302';
        return profile;
    } catch(e) {
        return defaultProfile();
    }
};

const profile = load();
const listeners = [];

const save = () => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch(e) {
        // Storage unavailable (private mode etc.): keep playing from memory.
    }
    listeners.forEach(fn => fn(profile));
};

const onProfileChange = (fn) => listeners.push(fn);
/* harmony export (immutable) */ __webpack_exports__["j"] = onProfileChange;


const getProfile = () => profile;
/* harmony export (immutable) */ __webpack_exports__["f"] = getProfile;


const loadoutFor = (hullId) => {
    if(!profile.loadouts[hullId]) profile.loadouts[hullId] = {};
    return profile.loadouts[hullId];
};
/* harmony export (immutable) */ __webpack_exports__["h"] = loadoutFor;


const addCredits = (amount) => {
    profile.credits += amount;
    save();
};
/* unused harmony export addCredits */


const recordScore = (score) => {
    if(score > profile.bestScore) {
        profile.bestScore = score;
        save();
    }
};
/* unused harmony export recordScore */


const ownsHull = (hullId) => profile.ownedHulls.indexOf(hullId) !== -1;
/* harmony export (immutable) */ __webpack_exports__["k"] = ownsHull;


const selectHull = (hullId) => {
    if(!ownsHull(hullId)) return false;
    profile.hull = hullId;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["m"] = selectHull;


const buyHull = (hullId) => {
    const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][hullId];
    if(ownsHull(hullId) || profile.credits < hull.cost) return false;
    profile.credits -= hull.cost;
    profile.ownedHulls.push(hullId);
    profile.hull = hullId;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["b"] = buyHull;


const installModule = (hullId, slotId, type) => {
    const loadout = loadoutFor(hullId);
    if(loadout[slotId] || profile.credits < __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost) return false;
    profile.credits -= __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost;
    loadout[slotId] = { type: type, level: 1 };
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["g"] = installModule;


const upgradeModule = (hullId, slotId) => {
    const module = loadoutFor(hullId)[slotId];
    if(!module || module.level >= __WEBPACK_IMPORTED_MODULE_1__modules__["a" /* MAX_LEVEL */]) return false;
    const cost = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["g" /* upgradeCost */])(module.type, module.level);
    if(profile.credits < cost) return false;
    profile.credits -= cost;
    module.level++;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["r"] = upgradeModule;


const sellModule = (hullId, slotId) => {
    const loadout = loadoutFor(hullId);
    const module = loadout[slotId];
    if(!module) return false;
    profile.credits += Object(__WEBPACK_IMPORTED_MODULE_1__modules__["f" /* sellValue */])(module.type, module.level);
    delete loadout[slotId];
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["o"] = sellModule;


// Combine hull + modules into the numbers the ship flies with.
const computeShipStats = (hullId) => {
    const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][hullId];
    const loadout = loadoutFor(hullId);

    const stats = {
        hull: hull,
        mass: hull.mass,
        maxHull: hull.hull,
        maxShield: hull.baseShield,
        shieldRegen: hull.baseShield > 0 ? hull.baseShield * 0.15 : 0,
        thrustForce: hull.thrust,
        cargo: hull.cargo,
        magnetRange: BASE_MAGNET_RANGE,
        torqueForce: hull.torque * hull.mass,
        guidance: null,
        scanner: null,
        modules: []
    };

    hull.slots.forEach(slot => {
        const module = loadout[slot.id];
        if(!module) return;
        const s = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["e" /* moduleStats */])(module.type, module.level);
        stats.modules.push({ slot: slot, type: module.type, level: module.level, stats: s });

        if(module.type === 'engine') {
            stats.thrustForce += s.thrust;
            stats.torqueForce += s.torque;
        }
        if(module.type === 'shield') {
            stats.maxShield += s.capacity;
            stats.shieldRegen += s.regen;
        }
        if(module.type === 'armor') {
            stats.maxHull += s.hull;
            stats.mass += s.mass;
        }
        if(module.type === 'cargo') stats.cargo += s.capacity;
        if(module.type === 'scanner') {
            if(!stats.scanner || s.range > stats.scanner.range) stats.scanner = s;
        }
        if(module.type === 'magnet') stats.magnetRange = Math.max(stats.magnetRange, s.range);
        if(module.type === 'guidance') {
            if(!stats.guidance || s.range > stats.guidance.range) stats.guidance = s;
        }
    });

    stats.acceleration = stats.thrustForce / stats.mass;
    stats.angularAcceleration = stats.torqueForce / stats.mass;
    stats.maxTurn = hull.maxTurn * Math.min(1.6, Math.sqrt(stats.angularAcceleration / hull.torque));
    stats.weapons = stats.modules.filter(m => ['minigun', 'missile', 'staff', 'beam', 'drones'].indexOf(m.type) !== -1).length;

    return stats;
};
/* harmony export (immutable) */ __webpack_exports__["e"] = computeShipStats;


// ------------------------------------------------------------ cargo & market

const cargoUsed = () => Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);
/* harmony export (immutable) */ __webpack_exports__["c"] = cargoUsed;


// Adds one unit of ore if it fits. Returns true when stored.
const storeOre = (material, capacity) => {
    if(cargoUsed() >= capacity) return false;
    profile.cargo[material] = (profile.cargo[material] || 0) + 1;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["q"] = storeOre;


const cargoValue = () => Object.keys(profile.cargo)
    .reduce((sum, id) => sum + profile.cargo[id] * __WEBPACK_IMPORTED_MODULE_2__world_materials__["b" /* default */][id].price, 0);
/* harmony export (immutable) */ __webpack_exports__["d"] = cargoValue;


const sellCargo = (material) => {
    const ids = material ? [material] : Object.keys(profile.cargo);
    let earned = 0;
    ids.forEach(id => {
        earned += (profile.cargo[id] || 0) * __WEBPACK_IMPORTED_MODULE_2__world_materials__["b" /* default */][id].price;
        delete profile.cargo[id];
    });
    profile.credits += earned;
    save();
    return earned;
};
/* harmony export (immutable) */ __webpack_exports__["n"] = sellCargo;


// Jettison ore from the hold. Returns how many units were removed.
const removeCargo = (material, count) => {
    const have = profile.cargo[material] || 0;
    const removed = Math.min(have, count);
    if(removed <= 0) return 0;
    if(have - removed > 0) profile.cargo[material] = have - removed;
    else delete profile.cargo[material];
    save();
    return removed;
};
/* harmony export (immutable) */ __webpack_exports__["l"] = removeCargo;


const loseCargo = () => {
    profile.cargo = {};
    save();
};
/* harmony export (immutable) */ __webpack_exports__["i"] = loseCargo;


const spendCredits = (amount) => {
    if(profile.credits < amount) return false;
    profile.credits -= amount;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["p"] = spendCredits;



/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// All game sounds. The engine and thruster loops use the recorded samples; weapons,
// impacts and effects are synthesized with the Web Audio API.
//
// Every sound is layered (a sub-bass "body", a mid punch and a noisy transient) and
// runs through a compressor; heavy weapons also send into a generated reverb so shots
// and explosions have a big, rolling tail instead of a thin "toy" blip.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.5);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.18);
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
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    safePlay(audio);
};

// ------------------------------------------------------------ Web Audio graph

let ac = null;
let master = null;      // dry bus -> compressor -> speakers
let reverb = null;      // wet bus -> convolver -> compressor
let noiseBuffer = null;
const lastPlayed = {};

// Decaying stereo noise: a cheap but convincing "big hangar / space" reverb.
const createImpulse = (c, seconds, decay) => {
    const length = Math.floor(c.sampleRate * seconds);
    const impulse = c.createBuffer(2, length, c.sampleRate);
    for(let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for(let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
};

const context = () => {
    if(ac) return ac;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();

        const compressor = ac.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 12;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        const output = ac.createGain();
        output.gain.value = 0.9;
        compressor.connect(output);
        output.connect(ac.destination);

        master = ac.createGain();
        master.gain.value = 0.7;
        master.connect(compressor);

        const convolver = ac.createConvolver();
        convolver.buffer = createImpulse(ac, 2.4, 3);
        reverb = ac.createGain();
        reverb.gain.value = 0.55;
        reverb.connect(convolver);
        convolver.connect(compressor);

        noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    } catch(e) {
        ac = null;
    }
    return ac;
};

// Limits how often one effect can retrigger, so rapid events don't turn into noise.
const throttle = (name, seconds) => {
    const c = context();
    if(!c) return null;
    if(lastPlayed[name] && c.currentTime - lastPlayed[name] < seconds) return null;
    lastPlayed[name] = c.currentTime;
    return c;
};

// Gain envelope feeding the dry bus, plus an optional reverb send (`wet` 0..1).
const envelope = (c, peak, attack, decay, wet) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(master);
    if(wet) {
        const send = c.createGain();
        send.gain.value = wet;
        gain.connect(send);
        send.connect(reverb);
    }
    return gain;
};

const tone = (c, type, from, to, duration, output) => {
    const osc = c.createOscillator();
    const now = c.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    osc.connect(output);
    osc.start(now);
    osc.stop(now + duration + 0.05);
    return osc;
};

const noise = (c, duration, filterType, from, to, output, q) => {
    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    const now = c.currentTime;
    filter.type = filterType;
    filter.Q.value = q || 1;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
    source.connect(filter);
    filter.connect(output);
    source.start(now, Math.random() * 0.5);
    source.stop(now + duration + 0.05);
};

// Deep layered detonation used by missiles, drones and big impacts.
const boom = (c, size, wet) => {
    tone(c, 'sine', 95 + 30 / size, 26, 1.1 * size, envelope(c, 0.55, 0.004, 1.1 * size, wet));
    tone(c, 'triangle', 180, 45, 0.35, envelope(c, 0.25, 0.002, 0.35, wet * 0.5));
    noise(c, 1.3 * size, 'lowpass', 2600, 60, envelope(c, 0.5, 0.003, 1.3 * size, wet));
    noise(c, 0.5, 'bandpass', 4500, 900, envelope(c, 0.12, 0.002, 0.45, wet), 1.5);
};

// ------------------------------------------------------------ sustained voices

const createVoice = (build) => {
    let voice = null;
    return {
        start(level) {
            const c = context();
            if(!c) return;
            if(!voice) voice = build(c);
            const target = Math.max(0.0001, level === undefined ? 1 : level) * voice.peak;
            voice.gain.gain.cancelScheduledValues(c.currentTime);
            voice.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
        },
        stop() {
            if(!voice || !ac) return;
            const v = voice;
            voice = null;
            const now = ac.currentTime;
            v.gain.gain.cancelScheduledValues(now);
            v.gain.gain.setTargetAtTime(0.0001, now, 0.06);
            v.nodes.forEach(n => n.stop(now + 0.4));
        }
    };
};

// Asgard beam: detuned saws through a wobbling band-pass, a sub-bass drone and crackle.
const beamVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.3;
    gain.connect(send);
    send.connect(reverb);

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2.5;
    filter.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 11;
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = b.type = 'sawtooth';
    a.frequency.value = 196;
    b.frequency.value = 199.5;
    a.connect(filter);
    b.connect(filter);

    const sub = c.createOscillator();
    const subGain = c.createGain();
    sub.type = 'sine';
    sub.frequency.value = 55;
    subGain.gain.value = 0.9;
    sub.connect(subGain);
    subGain.connect(gain);

    const crackle = c.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;
    const crackleFilter = c.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 3500;
    const crackleGain = c.createGain();
    crackleGain.gain.value = 0.25;
    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(gain);

    const nodes = [a, b, lfo, sub, crackle];
    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.2 };
});

// Tractor beam: a soft shimmering chord over a breathy, slowly sweeping "air" layer.
const tractorVoice = createVoice(c => {
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const send = c.createGain();
    send.gain.value = 0.4;
    gain.connect(send);
    send.connect(reverb);

    const tremolo = c.createGain();
    tremolo.gain.value = 0.7;
    tremolo.connect(gain);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    const nodes = [lfo];
    [[220, 0.5], [330, 0.35], [440.8, 0.25], [659, 0.12]].forEach(pair => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = pair[0];
        g.gain.value = pair[1];
        osc.connect(g);
        g.connect(tremolo);
        nodes.push(osc);
    });

    const air = c.createBufferSource();
    air.buffer = noiseBuffer;
    air.loop = true;
    const airFilter = c.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.Q.value = 6;
    airFilter.frequency.value = 900;
    const sweep = c.createOscillator();
    const sweepGain = c.createGain();
    sweep.frequency.value = 0.7;
    sweepGain.gain.value = 500;
    sweep.connect(sweepGain);
    sweepGain.connect(airFilter.frequency);
    const airGain = c.createGain();
    airGain.gain.value = 0.35;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(gain);
    nodes.push(air, sweep);

    nodes.forEach(n => n.start());
    return { gain: gain, nodes: nodes, peak: 0.09 };
});

// ------------------------------------------------------------ public API

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring() { /* minigun rounds are synthesized per shot (minigunShot) */ },
    setBeam(on) { if(on) beamVoice.start(); else beamVoice.stop(); },
    // `level` 0..1 grows with the number of ore pieces held.
    setTractor(on, level) { if(on) tractorVoice.start(0.5 + 0.5 * (level || 0)); else tractorVoice.stop(); },

    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },

    // Heavy kinetic minigun: sharp crack, chest thump and a short metallic ring.
    minigunShot() {
        const c = throttle('minigun', 0.035);
        if(!c) return;
        noise(c, 0.06, 'bandpass', 2600, 1200, envelope(c, 0.28, 0.001, 0.06, 0.12), 0.9);
        tone(c, 'triangle', 170, 55, 0.08, envelope(c, 0.32, 0.001, 0.08));
        tone(c, 'square', 1250 + Math.random() * 200, 700, 0.03, envelope(c, 0.03, 0.001, 0.03));
    },

    // Kinetic round striking rock: gritty crack with a low knock.
    rockHit() {
        const c = throttle('rockHit', 0.03);
        if(!c) return;
        noise(c, 0.09, 'bandpass', 1800, 500, envelope(c, 0.16, 0.001, 0.09), 1.2);
        tone(c, 'sine', 140, 60, 0.07, envelope(c, 0.12, 0.001, 0.07));
    },

    // Goa'uld staff cannon: a deep concussive "thoom" with a crackling plasma tail.
    staffShot() {
        const c = throttle('staff', 0.08);
        if(!c) return;
        tone(c, 'sine', 150, 34, 0.55, envelope(c, 0.6, 0.003, 0.55, 0.35));
        tone(c, 'sawtooth', 420, 70, 0.35, envelope(c, 0.18, 0.003, 0.33, 0.35));
        noise(c, 0.55, 'lowpass', 2400, 120, envelope(c, 0.4, 0.002, 0.55, 0.4));
        noise(c, 0.4, 'bandpass', 4200, 1100, envelope(c, 0.08, 0.02, 0.38, 0.3), 3);
    },

    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.06);
        if(!c) return;
        boom(c, 0.6, 0.35);
    },

    // Missile ignition: thump, then a roaring whoosh that climbs as it leaves.
    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        tone(c, 'sine', 110, 45, 0.25, envelope(c, 0.4, 0.002, 0.25, 0.2));
        noise(c, 0.9, 'bandpass', 500, 2600, envelope(c, 0.3, 0.03, 0.85, 0.4), 1.2);
        noise(c, 0.5, 'lowpass', 900, 300, envelope(c, 0.2, 0.01, 0.5, 0.3));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        boom(c, 1, 0.55);
    },

    // Ancient drone leaving its bay: a bright, rising energy whine with a soft pulse.
    droneLaunch() {
        const c = throttle('drones', 0.07);
        if(!c) return;
        tone(c, 'sine', 520, 1900, 0.4, envelope(c, 0.14, 0.01, 0.4, 0.45));
        tone(c, 'triangle', 780, 2600, 0.35, envelope(c, 0.05, 0.01, 0.35, 0.45));
        tone(c, 'sine', 180, 90, 0.18, envelope(c, 0.22, 0.002, 0.18, 0.2));
    },

    // Drone detonation: deep energy blast with a shimmering high tail.
    droneImpact() {
        const c = throttle('droneImpact', 0.05);
        if(!c) return;
        boom(c, 0.9, 0.55);
        tone(c, 'sine', 2600, 700, 0.6, envelope(c, 0.08, 0.004, 0.6, 0.6));
    },

    beamImpact() {
        const c = throttle('beamImpact', 0.09);
        if(!c) return;
        noise(c, 0.1, 'bandpass', 3000, 1500, envelope(c, 0.08, 0.002, 0.1), 2);
    },

    overheat() {
        const c = throttle('overheat', 0.5);
        if(!c) return;
        tone(c, 'square', 880, 880, 0.08, envelope(c, 0.08, 0.002, 0.08));
        setTimeout(() => { if(ac) tone(ac, 'square', 660, 660, 0.12, envelope(ac, 0.08, 0.002, 0.12)); }, 120);
        noise(c, 0.7, 'highpass', 3000, 1200, envelope(c, 0.07, 0.05, 0.7, 0.3));
    },

    // Something striking raised shields: an electric zap with a resonant hum.
    shieldHit(strength) {
        const c = throttle('shield', 0.07);
        if(!c) return;
        const s = Math.max(0.3, Math.min(1.5, strength || 1));
        tone(c, 'sine', 1500, 260, 0.35, envelope(c, 0.2 * s, 0.002, 0.35, 0.4));
        tone(c, 'sawtooth', 120, 70, 0.3, envelope(c, 0.12 * s, 0.002, 0.3, 0.3));
        noise(c, 0.2, 'highpass', 5000, 2000, envelope(c, 0.08 * s, 0.001, 0.2, 0.3));
    },

    shieldUp() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 160, 900, 0.55, envelope(c, 0.2, 0.02, 0.55, 0.5));
        tone(c, 'triangle', 320, 1800, 0.5, envelope(c, 0.07, 0.02, 0.5, 0.5));
    },

    shieldDown() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 900, 110, 0.5, envelope(c, 0.18, 0.01, 0.5, 0.5));
        noise(c, 0.45, 'bandpass', 2000, 300, envelope(c, 0.06, 0.01, 0.45, 0.3), 2);
    },

    hullHit() {
        const c = throttle('hull', 0.1);
        if(!c) return;
        boom(c, 0.5, 0.25);
        tone(c, 'square', 90, 40, 0.25, envelope(c, 0.15, 0.002, 0.25));
    },

    rockCrack() {
        const c = throttle('crack', 0.06);
        if(!c) return;
        noise(c, 0.35, 'bandpass', 1500, 250, envelope(c, 0.4, 0.001, 0.35, 0.35), 0.8);
        tone(c, 'triangle', 200, 55, 0.3, envelope(c, 0.22, 0.001, 0.3, 0.3));
    },

    // Deep rumble as asteroids grind together and merge.
    merge(size) {
        const c = throttle('merge', 0.15);
        if(!c) return;
        const volume = Math.min(0.5, 0.15 + size / 200);
        noise(c, 1.4, 'lowpass', 400, 60, envelope(c, volume, 0.15, 1.3, 0.4));
        tone(c, 'sine', 70, 40, 1.2, envelope(c, volume * 0.6, 0.1, 1.2, 0.3));
    },

    // Asteroid glancing off the Atlantis city shield.
    cityShield(volume) {
        const c = throttle('cityShield', 0.12);
        if(!c) return;
        const v = Math.max(0.02, Math.min(0.3, volume));
        tone(c, 'sine', 700, 160, 0.7, envelope(c, v, 0.004, 0.7, 0.6));
        tone(c, 'triangle', 1400, 480, 0.45, envelope(c, v * 0.4, 0.004, 0.45, 0.6));
        noise(c, 0.3, 'highpass', 4000, 1800, envelope(c, v * 0.3, 0.002, 0.3, 0.4));
    },

    // Tractor beam latching onto a new piece of ore.
    tractorLock() {
        const c = throttle('tractorLock', 0.06);
        if(!c) return;
        tone(c, 'sine', 700, 1150, 0.14, envelope(c, 0.07, 0.005, 0.14, 0.4));
    },

    // Ore stowed in the hold: a little two-note chime, higher for valuable ore.
    pickup(value) {
        const c = throttle('pickup', 0.05);
        if(!c) return;
        const f = 620 + Math.min(600, value * 6);
        tone(c, 'triangle', f, f, 0.09, envelope(c, 0.09, 0.002, 0.09, 0.3));
        setTimeout(() => { if(ac) tone(ac, 'sine', f * 1.5, f * 1.5, 0.16, envelope(ac, 0.07, 0.002, 0.16, 0.3)); }, 60);
    },

    // Scanner sweep ping.
    scanPing() {
        const c = throttle('scan', 0.5);
        if(!c) return;
        tone(c, 'sine', 1320, 1240, 0.5, envelope(c, 0.08, 0.004, 0.5, 0.7));
        tone(c, 'sine', 660, 640, 0.6, envelope(c, 0.05, 0.004, 0.6, 0.7));
    },

    dock() {
        const c = context();
        if(!c) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25, 0.4));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        beamVoice.stop();
        tractorVoice.stop();
    }
};

/* harmony default export */ __webpack_exports__["a"] = (sounds);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render_sprites__ = __webpack_require__(0);




// Asteroids are described by their area (mass), composition and an outline of
// SHAPE_POINTS radii at evenly spaced angles. Weapon hits carve a groove into the
// outline (dropping ore); when a groove cuts deep enough the asteroid splits into two
// along that cut line. Small leftovers crumble. Colliding asteroids merge into one.

const CHIP_AREA_PER_DAMAGE = 14;  // area removed per point of weapon damage
const GROOVE_PER_DAMAGE = 1.6;    // px of groove per damage point (bigger rocks take longer to cut through)
const ORE_AREA = 120;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 14;      // smaller asteroids are ground down instead of splitting
const CUT_THROUGH = 0.22;         // groove depth (outline factor) that counts as cut through
const SPLIT_GRACE = 2.5;          // seconds new halves won't merge again
const MAX_SPLIT_SPEED = 55;       // px/s, halves drift apart gently
const MAX_SCARS = 10;
const SHAPE_POINTS = 32;
const SPRITE_REBUILD_INTERVAL = 0.12;
const LIGHT_REFRESH_ANGLE = 0.26;  // re-bake lighting after the rock turns ~15 degrees
const MAX_MERGE_RADIUS = 170;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_MERGE_RADIUS;

const VISUAL_RADIUS = 0.88;
/* harmony export (immutable) */ __webpack_exports__["b"] = VISUAL_RADIUS;
   // average outline radius relative to `radius`

// Light comes from the top-left of the screen for every asteroid.
const LIGHT_X = -0.55;
const LIGHT_Y = -0.65;
const BASE_ROCK = [118, 110, 102];
const STEP = Math.PI * 2 / SHAPE_POINTS;

let nextId = 1;

// Lumpy outline from a few layered sine "octaves" (smooth, rock-like, not spiky).
const randomShape = (random) => {
    const rnd = random || Math.random;
    const octaves = [[2, 0.09], [3, 0.07], [5, 0.04], [9, 0.025]].map(o => ({ freq: o[0], amp: o[1], phase: rnd() * Math.PI * 2 }));
    const factors = [];
    for(let i = 0; i < SHAPE_POINTS; i++) {
        const angle = i * STEP;
        let factor = 0.86;
        octaves.forEach(o => { factor += Math.sin(angle * o.freq + o.phase) * o.amp; });
        factor += (rnd() - 0.5) * 0.03;
        factors.push(Math.min(1, Math.max(0.62, factor)));
    }
    return factors;
};

const normalizeComposition = (composition) => {
    const total = Object.keys(composition).reduce((sum, id) => sum + composition[id], 0) || 1;
    const result = {};
    Object.keys(composition).forEach(id => {
        if(composition[id] / total > 0.001) result[id] = composition[id] / total;
    });
    return result;
};

const parseColor = (color) => color.split(',').map(Number);
const rgb = (c, alpha) => 'rgba(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ',' + (alpha === undefined ? 1 : alpha) + ')';
const shade = (c, f) => c.map(v => v * f);
const wrapAngle = (a) => {
    a %= Math.PI * 2;
    return a < 0 ? a + Math.PI * 2 : a;
};

// Signed area and centroid of a polygon.
const polygonInfo = (pts) => {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const cross = a[0] * b[1] - b[0] * a[1];
        area += cross;
        cx += (a[0] + b[0]) * cross;
        cy += (a[1] + b[1]) * cross;
    }
    area /= 2;
    if(Math.abs(area) < 1e-6) return { area: 0, x: 0, y: 0 };
    return { area: Math.abs(area), x: cx / (6 * area), y: cy / (6 * area) };
};

// Keep the part of a polygon on one side of the line through the origin along (ux, uy).
const clipHalf = (pts, ux, uy, sign) => {
    const side = (p) => sign * (ux * p[1] - uy * p[0]);
    const out = [];
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const sa = side(a);
        const sb = side(b);
        if(sa >= 0) out.push(a);
        if((sa >= 0) !== (sb >= 0)) {
            const t = sa / (sa - sb);
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
    }
    return out;
};

// Distance from the origin to the polygon edge along a ray (furthest crossing).
const rayToPolygon = (pts, dx, dy) => {
    let best = 0;
    for(let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const ex = b[0] - a[0];
        const ey = b[1] - a[1];
        const denom = dx * ey - dy * ex;
        if(Math.abs(denom) < 1e-9) continue;
        const t = (a[0] * ey - a[1] * ex) / denom;
        const s = (a[0] * dy - a[1] * dx) / denom;
        if(t > 0 && s >= 0 && s <= 1 && t > best) best = t;
    }
    return best;
};

class Rock {

    constructor(options) {
        const rnd = options.random || Math.random;
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.setArea(options.radius * options.radius);
        this.composition = normalizeComposition(options.composition || { rock: 1 });
        this.angle = options.angle !== undefined ? options.angle : rnd() * Math.PI * 2;
        this.spin = options.spin !== undefined ? options.spin : (rnd() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.renderScale = 1;
        this.renderAlpha = 1;
        this.merging = null;          // active merge link while two asteroids fuse
        this.scars = [];
        this.shape = options.shape || randomShape(rnd);
        this.sprite = null;
        this.spriteDirty = true;
        this.spriteAge = 0;
        this.createSurface(rnd);
        this.updateLook(rnd);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    get maxFactor() {
        let max = 0;
        for(let i = 0; i < this.shape.length; i++) max = Math.max(max, this.shape[i]);
        return max;
    }

    // Radius used for quick "could these touch?" checks.
    get boundRadius() {
        return this.radius * this.maxFactor;
    }

    // Craters and cracks, in unit coordinates (scaled by radius when drawn).
    createSurface(rnd) {
        this.craters = [];
        const craterCount = 3 + Math.floor(rnd() * 5);
        for(let i = 0; i < craterCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.6;
            this.craters.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                r: 0.07 + rnd() * rnd() * 0.22,
                squash: 0.7 + rnd() * 0.3,
                tilt: rnd() * Math.PI
            });
        }
        this.cracks = [];
        const crackCount = 1 + Math.floor(rnd() * 3);
        for(let i = 0; i < crackCount; i++) {
            const points = [];
            let x = (rnd() - 0.5) * 0.3;
            let y = (rnd() - 0.5) * 0.3;
            const heading = rnd() * Math.PI * 2;
            points.push([x, y]);
            for(let s = 0; s < 4; s++) {
                const angle = heading + (rnd() - 0.5) * 1.2;
                x += Math.cos(angle) * 0.14;
                y += Math.sin(angle) * 0.14;
                points.push([x, y]);
            }
            this.cracks.push(points);
        }
    }

    // Base colour and mineral crystals from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["c" /* dominantMaterial */])(this.composition);

        let base = BASE_ROCK.slice();
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const tint = parseColor(__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color);
            const share = this.composition[id] * 0.22;
            base = base.map((v, i) => v * (1 - share) + tint[i] * 0.6 * share);
        });
        this.baseColor = base;

        this.crystals = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const clusters = Math.round(1 + this.composition[id] * 5);
            for(let c = 0; c < clusters; c++) {
                const angle = rnd() * Math.PI * 2;
                const distance = Math.sqrt(rnd()) * 0.65;
                const cx = Math.cos(angle) * distance;
                const cy = Math.sin(angle) * distance;
                const shards = 2 + Math.floor(rnd() * 3);
                for(let s = 0; s < shards; s++) {
                    this.crystals.push({
                        x: cx + (rnd() - 0.5) * 0.12,
                        y: cy + (rnd() - 0.5) * 0.12,
                        size: 0.035 + rnd() * 0.05,
                        angle: rnd() * Math.PI,
                        color: parseColor(__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color)
                    });
                }
            }
        });
        this.spriteDirty = true;
    }

    // ------------------------------------------------------------ outline geometry

    // Outline radius (world px) in the asteroid's local direction `localAngle`.
    outlineAt(localAngle) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.floor(a) % SHAPE_POINTS;
        const j = (i + 1) % SHAPE_POINTS;
        const t = a - Math.floor(a);
        return (this.shape[i] * (1 - t) + this.shape[j] * t) * this.radius;
    }

    containsPoint(x, y, padding) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distSq = dx * dx + dy * dy;
        const bound = this.boundRadius + (padding || 0);
        if(distSq > bound * bound) return false;
        const r = this.outlineAt(Math.atan2(dy, dx) - this.angle) + (padding || 0);
        return distSq <= r * r;
    }

    // Outline as world-space points.
    worldOutline() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return this.shape.map((f, i) => {
            const lx = Math.cos(i * STEP) * f * this.radius;
            const ly = Math.sin(i * STEP) * f * this.radius;
            return [this.x + lx * cos - ly * sin, this.y + lx * sin + ly * cos];
        });
    }

    // Distance along a ray to where it first meets the visible outline, or null.
    raycast(ox, oy, dirX, dirY, maxDistance) {
        // Cheap circle test first.
        const mx = this.x - ox;
        const my = this.y - oy;
        const along = mx * dirX + my * dirY;
        const bound = this.boundRadius;
        if(along < -bound || along - bound > maxDistance) return null;
        const closestSq = mx * mx + my * my - along * along;
        if(closestSq > bound * bound) return null;

        if(this.containsPoint(ox, oy)) return 0;
        const pts = this.worldOutline();
        let best = null;
        for(let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const ex = b[0] - a[0];
            const ey = b[1] - a[1];
            const denom = dirX * ey - dirY * ex;
            if(Math.abs(denom) < 1e-9) continue;
            const ax = a[0] - ox;
            const ay = a[1] - oy;
            const t = (ax * ey - ay * ex) / denom;
            const s = (ax * dirY - ay * dirX) / denom;
            if(t >= 0 && s >= 0 && s <= 1 && t <= maxDistance && (best === null || t < best)) best = t;
        }
        return best;
    }

    // ------------------------------------------------------------ damage

    // Weapon hit at a world point. Returns { ore: [...materialIds], pieces: [a, b] | null, crumbled }.
    chip(damage, hitX, hitY) {
        const result = { ore: [], pieces: null, crumbled: false };
        if(this.dead) return result;

        const removed = Math.min(this.area, damage * CHIP_AREA_PER_DAMAGE);
        this.setArea(this.area - removed);
        this.oreProgress += removed;
        this.flash = 0.05;

        // Carve a groove where the hit landed.
        const localAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        this.carve(localAngle, damage * GROOVE_PER_DAMAGE / this.radius);
        this.addScar(localAngle, damage);

        while(this.oreProgress >= ORE_AREA) {
            this.oreProgress -= ORE_AREA;
            result.ore.push(this.pickMaterial());
        }

        if(this.radius < MIN_RADIUS) {
            this.dead = true;
            result.crumbled = true;
            result.ore.push(this.pickMaterial());
            return result;
        }

        // Cut through? Split into two along the deepest groove.
        let deepest = 0;
        for(let i = 1; i < SHAPE_POINTS; i++) if(this.shape[i] < this.shape[deepest]) deepest = i;
        if(this.shape[deepest] <= CUT_THROUGH) {
            if(this.radius >= MIN_SPLIT_RADIUS) {
                result.pieces = this.splitAlong(deepest * STEP);
            }
            if(!result.pieces) {
                // Too small to split cleanly: it falls apart.
                this.dead = true;
                result.crumbled = true;
                const left = Math.max(1, Math.round(this.area / ORE_AREA));
                for(let i = 0; i < left; i++) result.ore.push(this.pickMaterial());
            }
        }
        return result;
    }

    // Narrow groove: the hit point goes deepest, immediate neighbours a little.
    carve(localAngle, depth) {
        const a = wrapAngle(localAngle) / STEP;
        const i = Math.round(a) % SHAPE_POINTS;
        const offset = a - Math.round(a);
        [[0, 1], [-1, 0.45 - offset * 0.3], [1, 0.45 + offset * 0.3], [-2, 0.12], [2, 0.12]].forEach(pair => {
            const k = (i + pair[0] + SHAPE_POINTS) % SHAPE_POINTS;
            this.shape[k] = Math.max(0.05, this.shape[k] - depth * Math.max(0, pair[1]));
        });
        this.spriteDirty = true;
    }

    addScar(localAngle, damage) {
        const last = this.scars[this.scars.length - 1];
        if(last && Math.abs(last.angle - localAngle) < 0.25) {
            last.size = Math.min(0.3, last.size + 0.01 * damage);
            return;
        }
        this.scars.push({ angle: localAngle, size: 0.06 + 0.015 * damage });
        if(this.scars.length > MAX_SCARS) this.scars.shift();
    }

    pickMaterial() {
        let roll = Math.random();
        const keys = Object.keys(this.composition);
        for(let i = 0; i < keys.length; i++) {
            roll -= this.composition[keys[i]];
            if(roll <= 0) return keys[i];
        }
        return keys[keys.length - 1];
    }

    // Splits the outline into two halves along the line from the cut (at `localAngle`)
    // through the centre. Each half becomes its own asteroid with a correctly clipped
    // outline; they drift apart sideways (perpendicular to the cut), conserving momentum.
    splitAlong(localAngle) {
        const pts = this.shape.map((f, i) => [Math.cos(i * STEP) * f * this.radius, Math.sin(i * STEP) * f * this.radius]);
        const ux = Math.cos(localAngle);
        const uy = Math.sin(localAngle);
        const halves = [clipHalf(pts, ux, uy, 1), clipHalf(pts, ux, uy, -1)]
            .map(poly => ({ poly: poly, info: polygonInfo(poly) }))
            .filter(h => h.poly.length >= 3 && h.info.area > 4);
        if(halves.length < 2) return null;

        const total = halves[0].info.area + halves[1].info.area;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const centroidGap = Math.sqrt(Math.pow(halves[0].info.x - halves[1].info.x, 2) + Math.pow(halves[0].info.y - halves[1].info.y, 2)) || 1;
        // Just over escape velocity so mutual gravity doesn't immediately pull them back.
        const relative = Math.min(MAX_SPLIT_SPEED * 2, 1.15 * Math.sqrt(2 * __WEBPACK_IMPORTED_MODULE_1__physics_physics__["a" /* G */] * this.area / centroidGap));

        const pieces = halves.map((h, index) => {
            const share = h.info.area / total;
            const area = this.area * share;
            const radius = Math.sqrt(area);

            // Resample the clipped half as an outline around its own centroid.
            const local = h.poly.map(p => [p[0] - h.info.x, p[1] - h.info.y]);
            const shape = [];
            for(let k = 0; k < SHAPE_POINTS; k++) {
                const d = rayToPolygon(local, Math.cos(k * STEP), Math.sin(k * STEP));
                shape.push(Math.max(0.05, Math.min(1.6, d / radius)));
            }

            // Sideways separation: half on the + side moves along +normal, the other -normal.
            const sign = index === 0 ? 1 : -1;
            const nx = -uy * sign;
            const ny = ux * sign;
            const speed = relative * (1 - share);
            const worldNx = nx * cos - ny * sin;
            const worldNy = nx * sin + ny * cos;

            const piece = new Rock({
                x: this.x + h.info.x * cos - h.info.y * sin,
                y: this.y + h.info.x * sin + h.info.y * cos,
                vx: this.vx + worldNx * speed,
                vy: this.vy + worldNy * speed,
                radius: radius,
                composition: Object.assign({}, this.composition),
                shape: shape,
                angle: this.angle,
                spin: this.spin * (0.8 + Math.random() * 0.4),
                grace: SPLIT_GRACE
            });
            piece.oreProgress = this.oreProgress * share;
            return piece;
        });

        this.dead = true;
        return pieces;
    }

    // Completes a merge after `guest` has fully sunk in: blend composition by the
    // original masses and reshape the outline so the result reads as one lumpy body.
    finishMerge(guest, hostArea, guestArea, contactWorldAngle) {
        const total = hostArea + guestArea;
        const wa = hostArea / total;
        const wb = guestArea / total;

        const composition = {};
        [[this, wa], [guest, wb]].forEach(pair => {
            Object.keys(pair[0].composition).forEach(id => {
                composition[id] = (composition[id] || 0) + pair[0].composition[id] * pair[1];
            });
        });
        this.composition = normalizeComposition(composition);
        this.oreProgress += guest.oreProgress;
        this.spin = this.spin * wa + guest.spin * wb;

        // Bulge where the guest joined, with a flattened seam either side.
        const contact = contactWorldAngle - this.angle;
        const bulge = Math.min(0.35, Math.sqrt(wb) * 0.45);
        this.shape = this.shape.map((f, i) => {
            let diff = Math.abs(i * STEP - wrapAngle(contact));
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < 0.9) {
                const w = Math.cos(diff / 0.9 * Math.PI / 2);
                return Math.min(1.08, Math.max(f, 0.6) + bulge * w * w);
            }
            if(diff < 1.4) return Math.max(0.6, f - bulge * 0.25);
            return f;
        });

        guest.craters.slice(0, 3).forEach(c => {
            this.craters.push({
                x: Math.cos(contact) * 0.55 + c.x * Math.sqrt(wb) * 0.6,
                y: Math.sin(contact) * 0.55 + c.y * Math.sqrt(wb) * 0.6,
                r: c.r * Math.sqrt(wb), squash: c.squash, tilt: c.tilt
            });
        });
        this.cracks.push([[Math.cos(contact + 0.6) * 0.5, Math.sin(contact + 0.6) * 0.5],
            [Math.cos(contact) * 0.45, Math.sin(contact) * 0.45],
            [Math.cos(contact - 0.6) * 0.5, Math.sin(contact - 0.6) * 0.5]]);
        if(this.craters.length > 14) this.craters.splice(0, this.craters.length - 14);
        if(this.cracks.length > 6) this.cracks.shift();
        this.updateLook();
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
        this.spriteAge += dt;
    }

    // ------------------------------------------------------------ rendering

    outline(ctx, r) {
        ctx.beginPath();
        for(let i = 0; i < SHAPE_POINTS; i++) {
            const x = Math.cos(i * STEP) * r * this.shape[i];
            const y = Math.sin(i * STEP) * r * this.shape[i];
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    // The detailed surface (base colour, craters, cracks, scars, crystals) is rendered
    // once into a sprite and only rebuilt when the asteroid is damaged or reshaped.
    buildSprite() {
        const r = this.radius;
        const extent = r * Math.max(1, this.maxFactor) + 2;
        const base = this.baseColor;
        this.sprite = Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["a" /* createSprite */])(extent * 2, extent * 2, ctx => {
            ctx.translate(extent, extent);
            this.outline(ctx, r);
            ctx.fillStyle = rgb(base);
            ctx.fill();
            ctx.save();
            ctx.clip();

            this.craters.forEach(c => {
                const cx = c.x * r;
                const cy = c.y * r;
                const cr = c.r * r;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(c.tilt);
                ctx.scale(1, c.squash);
                ctx.fillStyle = rgb(shade(base, 0.6), 0.6);
                ctx.beginPath();
                ctx.arc(0, 0, cr, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = Math.max(0.8, cr * 0.16);
                ctx.strokeStyle = rgb(shade(base, 1.35), 0.5);
                ctx.beginPath();
                ctx.arc(0, 0, cr, Math.PI * 0.9, Math.PI * 1.9);
                ctx.stroke();
                ctx.restore();
            });

            ctx.strokeStyle = rgb(shade(base, 0.35), 0.75);
            ctx.lineWidth = Math.max(0.7, r * 0.025);
            ctx.lineJoin = 'round';
            this.cracks.forEach(points => {
                ctx.beginPath();
                points.forEach((p, i) => {
                    if(i === 0) ctx.moveTo(p[0] * r, p[1] * r);
                    else ctx.lineTo(p[0] * r, p[1] * r);
                });
                ctx.stroke();
            });

            // Freshly exposed rock where it was hit.
            ctx.fillStyle = rgb(shade(base, 1.6), 0.45);
            this.scars.forEach(scar => {
                const d = this.outlineAt(scar.angle) * 0.85;
                ctx.beginPath();
                ctx.arc(Math.cos(scar.angle) * d, Math.sin(scar.angle) * d, scar.size * r, 0, Math.PI * 2);
                ctx.fill();
            });

            this.crystals.forEach(c => {
                const s = Math.max(1, c.size * r);
                ctx.save();
                ctx.translate(c.x * r, c.y * r);
                ctx.rotate(c.angle);
                ctx.fillStyle = rgb(shade(c.color, 0.55));
                ctx.beginPath();
                ctx.moveTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s, 0); ctx.lineTo(0, -s * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = rgb(c.color, 0.95);
                ctx.beginPath();
                ctx.moveTo(s * 0.8, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // Lighting, baked for the current orientation (light is fixed on screen).
            const cos = Math.cos(-this.angle);
            const sin = Math.sin(-this.angle);
            const lx = LIGHT_X * cos - LIGHT_Y * sin;
            const ly = LIGHT_X * sin + LIGHT_Y * cos;
            const light = ctx.createLinearGradient(lx * r, ly * r, -lx * r, -ly * r);
            light.addColorStop(0, 'rgba(255, 245, 230, 0.22)');
            light.addColorStop(0.42, 'rgba(0, 0, 0, 0)');
            light.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
            ctx.fillStyle = light;
            ctx.fillRect(-extent, -extent, extent * 2, extent * 2);
            ctx.restore();

            this.outline(ctx, r);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(10, 8, 6, 0.6)';
            ctx.stroke();
        });
        this.spriteAngle = this.angle;
        this.spriteExtent = extent;
        this.spriteRadius = r;
        this.spriteDirty = false;
        this.spriteAge = 0;
    }

    releaseSprite() {
        this.sprite = null;
    }

    draw(ctx) {
        const r = this.radius * this.renderScale;
        if(r < 0.5) return;
        let turned = Math.abs(this.angle - (this.spriteAngle || 0)) % (Math.PI * 2);
        if(turned > Math.PI) turned = Math.PI * 2 - turned;
        if(!this.sprite || (this.spriteDirty && this.spriteAge > SPRITE_REBUILD_INTERVAL) ||
            turned > LIGHT_REFRESH_ANGLE || Math.abs(this.radius - this.spriteRadius) > this.spriteRadius * 0.05) {
            this.buildSprite();
        }

        // One image stamp per frame: surface, lighting and outline are all in the sprite.
        const scale = r / this.spriteRadius;
        const extent = this.spriteExtent * scale;
        ctx.save();
        ctx.globalAlpha = this.renderAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        if(this.flash > 0) {
            // Hit flash: brighten by stamping the sprite again additively.
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.35;
            ctx.drawImage(this.sprite.canvas, -extent, -extent, extent * 2, extent * 2);
        }
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["c"] = (Rock);


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__modules__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__profile__ = __webpack_require__(6);
// Shipyard overlay: buy hulls, drag modules onto mounts, upgrade and sell them.






const SLOT_HIT_RADIUS = 16;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const formatCredits = (value) => Math.round(value).toLocaleString('en-US') + ' cr';

const setupCanvas = (canvas, width, height) => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
};

const drawHullPreview = (ctx, hull, width, height, padding, maxScale) => {
    const b = Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["d" /* hullBounds */])(hull);
    const scale = Math.min((width - padding * 2) / (b.maxX - b.minX), (height - padding * 2) / (b.maxY - b.minY),
        maxScale || Infinity);
    const offsetX = width / 2 - ((b.minX + b.maxX) / 2) * scale;
    const offsetY = height / 2 - ((b.minY + b.maxY) / 2) * scale;
    return { scale: scale, offsetX: offsetX, offsetY: offsetY };
};

class Shipyard {

    constructor() {
        this.isOpen = false;
        this.selectedSlot = null;
        this.armedModule = null;
        this.hoverSlot = null;
        this.drag = null;
        this.frameId = null;
        this.messageTimer = null;
        this.build();
    }

    build() {
        const root = el('div', 'shipyard');
        root.id = 'shipyard';

        const header = el('div', 'shipyard-header');
        header.appendChild(el('h1', '', 'Shipyard'));
        const tabs = el('div', 'shipyard-tabs');
        this.tabButtons = {};
        [['ship', 'Ship'], ['market', 'Market']].forEach(tab => {
            const button = el('button', 'sy-tab', tab[1]);
            button.addEventListener('click', () => this.showTab(tab[0]));
            tabs.appendChild(button);
            this.tabButtons[tab[0]] = button;
        });
        header.appendChild(tabs);
        this.creditsLabel = el('div', 'shipyard-credits');
        header.appendChild(this.creditsLabel);
        this.closeButton = el('button', 'sy-button primary', 'Launch');
        this.closeButton.addEventListener('click', () => this.close());
        header.appendChild(this.closeButton);
        root.appendChild(header);

        const body = el('div', 'shipyard-body');

        const hullColumn = el('div', 'shipyard-panel hull-list');
        hullColumn.appendChild(el('h3', '', 'Hulls'));
        this.hullList = el('div', 'hull-cards');
        hullColumn.appendChild(this.hullList);
        body.appendChild(hullColumn);

        const center = el('div', 'shipyard-panel hull-view');
        this.hullTitle = el('div', 'hull-title');
        center.appendChild(this.hullTitle);
        this.canvasWrap = el('div', 'hull-canvas-wrap');
        this.canvas = el('canvas', 'hull-canvas');
        this.canvasWrap.appendChild(this.canvas);
        center.appendChild(this.canvasWrap);
        this.hint = el('div', 'shipyard-hint');
        center.appendChild(this.hint);
        this.statsBox = el('div', 'ship-stats');
        center.appendChild(this.statsBox);
        body.appendChild(center);

        const moduleColumn = el('div', 'shipyard-panel module-panel');
        moduleColumn.appendChild(el('h3', '', 'Modules'));
        this.palette = el('div', 'module-palette');
        moduleColumn.appendChild(this.palette);
        moduleColumn.appendChild(el('h3', '', 'Selected mount'));
        this.inspector = el('div', 'inspector');
        moduleColumn.appendChild(this.inspector);
        body.appendChild(moduleColumn);

        root.appendChild(body);
        this.shipBody = body;

        this.marketBody = el('div', 'shipyard-market');
        root.appendChild(this.marketBody);

        this.message = el('div', 'shipyard-message');
        root.appendChild(this.message);

        this.root = root;
        document.body.appendChild(root);

        this.buildPalette();
        this.bindCanvas();

        window.addEventListener('keydown', (event) => {
            if(!this.isOpen) return;
            if(event.code === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if(this.armedModule) {
                    this.armedModule = null;
                    this.refresh();
                } else {
                    this.close();
                }
            }
        }, true);

        window.addEventListener('resize', () => { if(this.isOpen) this.resizeCanvas(); });
    }

    get hull() {
        return __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])().hull];
    }

    open(options) {
        this.options = options || {};
        this.isOpen = true;
        this.selectedSlot = null;
        this.armedModule = null;
        this.closeButton.textContent = this.options.closeLabel || 'Launch';
        this.root.classList.add('open');
        this.tab = this.options.tab || 'ship';
        this.refresh();
        this.resizeCanvas();
        const loop = () => {
            this.renderCanvas();
            this.frameId = requestAnimationFrame(loop);
        };
        loop();
    }

    close() {
        if(!this.isOpen) return;
        this.isOpen = false;
        this.root.classList.remove('open');
        cancelAnimationFrame(this.frameId);
        this.endDrag();
        if(this.options.onClose) this.options.onClose();
    }

    flash(text) {
        this.message.textContent = text;
        this.message.classList.add('visible');
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => this.message.classList.remove('visible'), 2200);
    }

    // ------------------------------------------------------------ panels

    showTab(tab) {
        this.tab = tab;
        this.armedModule = null;
        this.refresh();
    }

    refresh() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])();
        this.creditsLabel.textContent = formatCredits(profile.credits);
        Object.keys(this.tabButtons).forEach(key => this.tabButtons[key].classList.toggle('active', key === this.tab));
        this.shipBody.style.display = this.tab === 'ship' ? '' : 'none';
        this.marketBody.style.display = this.tab === 'market' ? '' : 'none';
        this.renderMarket();
        this.renderHullList();
        this.renderTitle();
        this.renderStats();
        this.renderPalette();
        this.renderInspector();
        this.renderHint();
    }

    renderMarket() {
        const box = this.marketBody;
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])();
        const capacity = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["e" /* computeShipStats */])(this.hull.id).cargo;
        box.innerHTML = '';

        const panel = el('div', 'shipyard-panel market-panel');
        panel.appendChild(el('h3', '', 'Ore exchange'));
        const canTrade = !!(this.options && this.options.canTrade);
        if(!canTrade) panel.appendChild(el('p', 'market-warning', 'Fly to the shipyard station and dock (B) to sell ore.'));
        panel.appendChild(el('p', 'muted', 'Cargo hold: ' + Object(__WEBPACK_IMPORTED_MODULE_3__profile__["c" /* cargoUsed */])() + ' / ' + capacity +
            ' units. Prices are per unit; metals found further from base are worth more.'));

        const table = el('table', 'market-table');
        const head = el('tr');
        ['Material', 'Price', 'In hold', 'Value', ''].forEach(h => head.appendChild(el('th', '', h)));
        table.appendChild(head);

        __WEBPACK_IMPORTED_MODULE_1__world_materials__["a" /* MATERIAL_ORDER */].forEach(id => {
            const material = __WEBPACK_IMPORTED_MODULE_1__world_materials__["b" /* default */][id];
            const amount = profile.cargo[id] || 0;
            const tr = el('tr', amount ? '' : 'empty');
            const name = el('td', 'material-name');
            const swatch = el('span', 'swatch');
            swatch.style.background = 'rgb(' + material.color + ')';
            swatch.style.boxShadow = '0 0 6px rgb(' + material.color + ')';
            name.appendChild(swatch);
            name.appendChild(document.createTextNode(material.name));
            tr.appendChild(name);
            tr.appendChild(el('td', '', formatCredits(material.price)));
            tr.appendChild(el('td', '', String(amount)));
            tr.appendChild(el('td', '', formatCredits(amount * material.price)));
            const cell = el('td');
            const sell = el('button', 'sy-button small', 'Sell');
            sell.disabled = amount === 0 || !canTrade;
            sell.addEventListener('click', () => {
                const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* sellCargo */])(id);
                this.flash('Sold ' + material.name + ' for ' + formatCredits(earned));
                this.refresh();
            });
            cell.appendChild(sell);
            tr.appendChild(cell);
            table.appendChild(tr);
        });
        panel.appendChild(table);

        const total = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["d" /* cargoValue */])();
        const sellAll = el('button', 'sy-button buy', 'Sell all cargo  +' + formatCredits(total));
        sellAll.disabled = total === 0 || !canTrade;
        sellAll.addEventListener('click', () => {
            const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* sellCargo */])();
            this.flash('Cargo sold for ' + formatCredits(earned));
            this.refresh();
        });
        panel.appendChild(sellAll);

        // Repairs are only offered when docked with a damaged ship.
        const status = this.options && this.options.hullStatus ? this.options.hullStatus() : null;
        if(status) {
            panel.appendChild(el('h3', 'market-section', 'Repairs'));
            const missing = Math.ceil(status.max - status.hp);
            if(missing <= 0) {
                panel.appendChild(el('p', 'muted', 'Hull at full strength.'));
            } else {
                const cost = missing * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */];
                const affordable = Math.min(missing, Math.floor(profile.credits / __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */]));
                panel.appendChild(el('p', '', 'Hull ' + Math.ceil(status.hp) + ' / ' + status.max +
                    ' · ' + __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */] + ' cr per point'));
                const repair = el('button', 'sy-button', affordable < missing
                    ? 'Repair ' + affordable + ' points  ' + formatCredits(affordable * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */])
                    : 'Full repair  ' + formatCredits(cost));
                repair.disabled = affordable <= 0;
                repair.addEventListener('click', () => {
                    if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["p" /* spendCredits */])(affordable * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */])) {
                        this.options.repair(affordable);
                        this.flash('Hull repaired.');
                    }
                    this.refresh();
                });
                panel.appendChild(repair);
            }
        }

        box.appendChild(panel);
    }

    renderHullList() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])();
        this.hullList.innerHTML = '';

        __WEBPACK_IMPORTED_MODULE_0__hulls__["a" /* HULL_ORDER */].forEach(id => {
            const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][id];
            const owned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["k" /* ownsHull */])(id);
            const active = profile.hull === id;
            const card = el('div', 'hull-card' + (active ? ' active' : '') + (owned ? ' owned' : ''));

            const thumb = el('canvas', 'hull-thumb');
            const ctx = setupCanvas(thumb, 120, 64);
            const fit = drawHullPreview(ctx, hull, 120, 64, 8);
            ctx.translate(fit.offsetX, fit.offsetY);
            ctx.scale(fit.scale, fit.scale);
            Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["c" /* drawHullArt */])(ctx, hull, { lineWidth: 1.2 / fit.scale, glow: 4 });
            card.appendChild(thumb);

            const info = el('div', 'hull-info');
            info.appendChild(el('div', 'hull-name', hull.name));
            info.appendChild(el('div', 'hull-class', hull.className + ' · ' + hull.faction));
            info.appendChild(el('div', 'hull-meta', hull.slots.length + ' mounts · ' + hull.cargo + ' cargo · ' + hull.hull + ' hull' +
                (hull.baseShield ? ' · ' + hull.baseShield + ' shield' : '')));

            let action;
            if(active) {
                action = el('div', 'hull-state', 'Active');
            } else if(owned) {
                action = el('button', 'sy-button small', 'Fly this');
                action.addEventListener('click', () => {
                    Object(__WEBPACK_IMPORTED_MODULE_3__profile__["m" /* selectHull */])(id);
                    this.selectedSlot = null;
                    this.refresh();
                });
            } else {
                action = el('button', 'sy-button small buy', 'Buy ' + formatCredits(hull.cost));
                action.disabled = profile.credits < hull.cost;
                action.addEventListener('click', () => {
                    if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["b" /* buyHull */])(id)) {
                        this.selectedSlot = null;
                        this.flash(hull.name + ' purchased!');
                    }
                    this.refresh();
                });
            }
            info.appendChild(action);
            card.appendChild(info);
            card.title = hull.description;
            this.hullList.appendChild(card);
        });
    }

    renderTitle() {
        const hull = this.hull;
        this.hullTitle.innerHTML = '';
        this.hullTitle.appendChild(el('span', 'title-name', hull.name + ' ' + hull.className));
        this.hullTitle.appendChild(el('span', 'title-desc', hull.description));
    }

    renderStats() {
        const stats = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["e" /* computeShipStats */])(this.hull.id);
        const rows = [
            ['Hull', Math.round(stats.maxHull)],
            ['Shield', stats.maxShield ? Math.round(stats.maxShield) + ' (+' + Math.round(stats.shieldRegen) + '/s)' : 'none'],
            ['Acceleration', Math.round(stats.acceleration)],
            ['Turn rate', stats.maxTurn.toFixed(1)],

            ['Weapons', stats.weapons],
            ['Guidance', stats.guidance ? stats.guidance.range + 'px' : 'none'],
            ['Cargo hold', stats.cargo],
            ['Tractor', stats.magnetRange + 'px'],
            ['Scanner', stats.scanner ? stats.scanner.range + 'px' : 'none'],
            ['Mounts', stats.modules.length + ' / ' + this.hull.slots.length]
        ];
        this.statsBox.innerHTML = '';
        rows.forEach(row => {
            const item = el('div', 'stat');
            item.appendChild(el('span', 'stat-label', row[0]));
            item.appendChild(el('span', 'stat-value', String(row[1])));
            this.statsBox.appendChild(item);
        });
    }

    buildPalette() {
        this.paletteItems = {};
        __WEBPACK_IMPORTED_MODULE_2__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const def = __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type];
            const item = el('div', 'module-item');
            item.dataset.type = type;

            const icon = el('canvas', 'module-icon');
            const ctx = setupCanvas(icon, 40, 40);
            ctx.translate(20, 20);
            Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 2.6, lineWidth: 1.4 });
            item.appendChild(icon);

            const info = el('div', 'module-info');
            info.appendChild(el('div', 'module-name', def.name));
            info.appendChild(el('div', 'module-desc', def.description));
            const price = el('div', 'module-price', formatCredits(def.cost));
            info.appendChild(price);
            item.appendChild(info);

            item.addEventListener('pointerdown', (event) => this.startDrag(event, type));
            this.palette.appendChild(item);
            this.paletteItems[type] = { item: item, price: price };
        });
    }

    renderPalette() {
        const credits = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])().credits;
        __WEBPACK_IMPORTED_MODULE_2__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const entry = this.paletteItems[type];
            entry.item.classList.toggle('armed', this.armedModule === type);
            entry.item.classList.toggle('unaffordable', credits < __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost);
        });
    }

    renderInspector() {
        const hull = this.hull;
        const box = this.inspector;
        box.innerHTML = '';

        if(!this.selectedSlot) {
            box.appendChild(el('p', 'muted', 'Click a mount on the ship to inspect it.'));
            return;
        }

        const module = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["h" /* loadoutFor */])(hull.id)[this.selectedSlot];
        if(!module) {
            box.appendChild(el('p', '', 'Empty mount'));
            box.appendChild(el('p', 'muted', this.armedModule
                ? 'Click the mount again to install the ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][this.armedModule].short + '.'
                : 'Drag a module here, or pick one from the list and click the mount.'));
            return;
        }

        const def = __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][module.type];
        const stats = Object(__WEBPACK_IMPORTED_MODULE_2__modules__["e" /* moduleStats */])(module.type, module.level);
        box.appendChild(el('div', 'inspector-name', def.name + ' Mk ' + ['I', 'II', 'III'][module.level - 1]));
        box.appendChild(el('div', 'inspector-stats', def.describe(stats)));

        const cost = Object(__WEBPACK_IMPORTED_MODULE_2__modules__["g" /* upgradeCost */])(module.type, module.level);
        const actions = el('div', 'inspector-actions');
        if(cost !== null) {
            const next = Object(__WEBPACK_IMPORTED_MODULE_2__modules__["e" /* moduleStats */])(module.type, module.level + 1);
            box.appendChild(el('div', 'inspector-next', 'Next: ' + def.describe(next)));
            const upgrade = el('button', 'sy-button small', 'Upgrade ' + formatCredits(cost));
            upgrade.disabled = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])().credits < cost;
            upgrade.addEventListener('click', () => {
                if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["r" /* upgradeModule */])(hull.id, this.selectedSlot)) this.flash(def.short + ' upgraded!');
                this.refresh();
            });
            actions.appendChild(upgrade);
        } else {
            box.appendChild(el('div', 'inspector-next', 'Max level (Mk ' + ['I', 'II', 'III'][__WEBPACK_IMPORTED_MODULE_2__modules__["a" /* MAX_LEVEL */] - 1] + ')'));
        }

        const sell = el('button', 'sy-button small danger', 'Sell +' + formatCredits(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["f" /* sellValue */])(module.type, module.level)));
        sell.addEventListener('click', () => {
            Object(__WEBPACK_IMPORTED_MODULE_3__profile__["o" /* sellModule */])(hull.id, this.selectedSlot);
            this.refresh();
        });
        actions.appendChild(sell);
        box.appendChild(actions);
    }

    renderHint() {
        this.hint.textContent = this.armedModule
            ? 'Placing ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][this.armedModule].name + ': click an empty mount (Esc to cancel)'
            : 'Drag modules from the right onto the ship\'s mounts. Mine ore and sell it in the Market tab.';
    }

    // ------------------------------------------------------------ hull canvas

    resizeCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        this.canvasWidth = Math.max(200, Math.floor(rect.width));
        this.canvasHeight = Math.max(160, Math.floor(rect.height));
        this.ctx = setupCanvas(this.canvas, this.canvasWidth, this.canvasHeight);
    }

    layout() {
        const hull = this.hull;
        const fit = drawHullPreview(this.ctx, hull, this.canvasWidth, this.canvasHeight, 40, 14);
        const slots = hull.slots.map(slot => ({
            slot: slot,
            x: fit.offsetX + slot.x * fit.scale,
            y: fit.offsetY + slot.y * fit.scale
        }));
        return { fit: fit, slots: slots };
    }

    slotAt(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const layout = this.layout();
        let best = null;
        let bestDist = SLOT_HIT_RADIUS * SLOT_HIT_RADIUS * 2.5;
        layout.slots.forEach(s => {
            const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if(d < bestDist) {
                bestDist = d;
                best = s.slot.id;
            }
        });
        return best;
    }

    bindCanvas() {
        this.canvas.addEventListener('pointermove', (event) => {
            if(this.drag) return;
            this.hoverSlot = this.slotAt(event.clientX, event.clientY);
            this.canvas.style.cursor = this.hoverSlot ? 'pointer' : 'default';
        });
        this.canvas.addEventListener('pointerleave', () => { if(!this.drag) this.hoverSlot = null; });
        this.canvas.addEventListener('click', (event) => {
            const slotId = this.slotAt(event.clientX, event.clientY);
            if(!slotId) {
                this.selectedSlot = null;
                this.refresh();
                return;
            }
            const occupied = !!Object(__WEBPACK_IMPORTED_MODULE_3__profile__["h" /* loadoutFor */])(this.hull.id)[slotId];
            if(this.armedModule && !occupied) {
                this.install(slotId, this.armedModule);
            } else {
                this.selectedSlot = slotId;
                this.refresh();
            }
        });
    }

    install(slotId, type) {
        const hull = this.hull;
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["h" /* loadoutFor */])(hull.id)[slotId]) {
            this.flash('That mount is taken. Sell its module first.');
            return;
        }
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])().credits < __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost) {
            this.flash('Not enough credits for ' + __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].name + '.');
            return;
        }
        Object(__WEBPACK_IMPORTED_MODULE_3__profile__["g" /* installModule */])(hull.id, slotId, type);
        this.selectedSlot = slotId;
        this.flash(__WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].name + ' installed.');
        if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["f" /* getProfile */])().credits < __WEBPACK_IMPORTED_MODULE_2__modules__["c" /* default */][type].cost) this.armedModule = null;
        this.refresh();
    }

    // Pointer drag from palette onto a mount. A press without movement arms the module instead.
    startDrag(event, type) {
        event.preventDefault();
        this.drag = { type: type, startX: event.clientX, startY: event.clientY, moved: false, ghost: null };

        this.onDragMove = (e) => {
            const drag = this.drag;
            if(!drag) return;
            if(!drag.moved && Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 6) {
                drag.moved = true;
                drag.ghost = el('canvas', 'drag-ghost');
                const ctx = setupCanvas(drag.ghost, 48, 48);
                ctx.translate(24, 24);
                Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 3, lineWidth: 1.5 });
                document.body.appendChild(drag.ghost);
            }
            if(drag.ghost) {
                drag.ghost.style.left = (e.clientX - 24) + 'px';
                drag.ghost.style.top = (e.clientY - 24) + 'px';
                this.hoverSlot = this.slotAt(e.clientX, e.clientY);
            }
        };

        this.onDragEnd = (e) => {
            const drag = this.drag;
            this.endDrag();
            if(!drag) return;
            if(drag.moved) {
                const slotId = this.slotAt(e.clientX, e.clientY);
                if(slotId) this.install(slotId, drag.type);
            } else {
                this.armedModule = this.armedModule === drag.type ? null : drag.type;
                this.refresh();
            }
        };

        window.addEventListener('pointermove', this.onDragMove);
        window.addEventListener('pointerup', this.onDragEnd);
    }

    endDrag() {
        if(this.drag && this.drag.ghost) this.drag.ghost.remove();
        this.drag = null;
        if(this.onDragMove) window.removeEventListener('pointermove', this.onDragMove);
        if(this.onDragEnd) window.removeEventListener('pointerup', this.onDragEnd);
        this.onDragMove = null;
        this.onDragEnd = null;
    }

    renderCanvas() {
        const rect = this.canvasWrap.getBoundingClientRect();
        if(Math.abs(rect.width - this.canvasWidth) > 1 || Math.abs(rect.height - this.canvasHeight) > 1) {
            this.resizeCanvas();
        }
        const ctx = this.ctx;
        if(!ctx) return;
        const hull = this.hull;
        const layout = this.layout();
        const fit = layout.fit;
        const loadout = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["h" /* loadoutFor */])(hull.id);
        const time = performance.now() / 1000;
        const placing = !!(this.armedModule || (this.drag && this.drag.moved));

        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Blueprint grid.
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 170, 255, 0.07)';
        ctx.lineWidth = 1;
        for(let x = 0; x < this.canvasWidth; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvasHeight); ctx.stroke();
        }
        for(let y = 0; y < this.canvasHeight; y += 24) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvasWidth, y); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(fit.offsetX, fit.offsetY);
        ctx.scale(fit.scale, fit.scale);
        Object(__WEBPACK_IMPORTED_MODULE_0__hulls__["c" /* drawHullArt */])(ctx, hull, { lineWidth: 1.6 / fit.scale, glow: 8 });
        ctx.restore();

        layout.slots.forEach(s => {
            const module = loadout[s.slot.id];
            const hovered = this.hoverSlot === s.slot.id;
            const selected = this.selectedSlot === s.slot.id;
            const iconScale = Math.max(1.6, Math.min(4, hull.moduleScale * fit.scale * 0.9));
            const radius = iconScale * 5.5;

            ctx.save();
            ctx.translate(s.x, s.y);

            if(module) {
                Object(__WEBPACK_IMPORTED_MODULE_2__modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: iconScale, lineWidth: 1.5 });
            } else {
                const pulse = placing ? 0.5 + 0.5 * Math.sin(time * 6) : 0;
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = placing
                    ? 'rgba(140, 255, 160, ' + (0.5 + pulse * 0.5) + ')'
                    : 'rgba(200, 220, 255, 0.55)';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
            }

            if(hovered || selected) {
                ctx.strokeStyle = selected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = selected ? 2 : 1.2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
    }
}

let instance = null;

const getShipyard = () => {
    if(!instance) instance = new Shipyard();
    return instance;
};
/* harmony export (immutable) */ __webpack_exports__["a"] = getShipyard;


const isShipyardOpen = () => !!(instance && instance.isOpen);
/* unused harmony export isShipyardOpen */



/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scripts_shipyard_shipyard__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__styles_main_css__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__styles_main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__styles_main_css__);





const startGame = document.getElementById('startGame');
const openShipyard = document.getElementById('openShipyard');
const menu = document.getElementById('menu');
const menuCredits = document.getElementById('menuCredits');

const renderMenuCredits = () => {
    const profile = Object(__WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__["f" /* getProfile */])();
    const cargo = Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);
    menuCredits.textContent = 'Credits: ' + Math.round(profile.credits).toLocaleString('en-US') +
        (cargo ? ' · Ore in hold: ' + cargo : '');
};

renderMenuCredits();
Object(__WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__["j" /* onProfileChange */])(renderMenuCredits);

startGame.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__["a" /* default */])();
});

openShipyard.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_1__scripts_shipyard_shipyard__["a" /* getShipyard */])().open({
        closeLabel: 'Done',
        onClose: () => { menu.style.visibility = 'visible'; }
    });
});


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ore_ore__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__audio_audio__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__world_materials__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__world_sectors__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__world_station__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__shipyard_profile__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__shipyard_shipyard__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__render_sprites__ = __webpack_require__(0);














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
    const ship = new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* default */](__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x + __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].dockRadius + 80, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y, Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["e" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().hull));
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
        scan: { timer: 1, target: null, value: 0, pings: [] },
        mergeLinks: [],
        floatingTexts: [],
        sectors: new __WEBPACK_IMPORTED_MODULE_8__world_sectors__["a" /* SectorManager */](Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().seed),
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
// The mouse wheel adjusts it between MIN_ZOOM and MAX_ZOOM.
const MIN_ZOOM = 1;
const MAX_ZOOM = 1.9;
let zoom = 1.3;
let slowTime = 0;

const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, resolutionCap);
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].resize(window.innerWidth, window.innerHeight);
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
    const dx = state.ship.x - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x;
    const dy = state.ship.y - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y;
    return Math.sqrt(dx * dx + dy * dy);
};

const renderInfo = () => {
    const ship = state.ship;
    const used = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["c" /* cargoUsed */])();
    const sector = Object(__WEBPACK_IMPORTED_MODULE_8__world_sectors__["b" /* sectorOf */])(ship.x, ship.y);
    setText('credits', 'Credits: ' + Math.round(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().credits).toLocaleString('en-US'));
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
        if(refresh || !body.gravity) body.gravity = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* gravityAt */])(body, rocks);
        body.vx += body.gravity.x * dt;
        body.vy += body.gravity.y * dt;
    };

    // Rocks: compute every acceleration before changing any velocity.
    if(refresh) rocks.forEach(rock => { rock.gravityNext = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* gravityAt */])(rock, rocks); });
    rocks.forEach(rock => {
        if(refresh || !rock.gravity) rock.gravity = rock.gravityNext || Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* gravityAt */])(rock, rocks);
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

    const out = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(rock, { x: hitX, y: hitY });
    const outLength = Math.sqrt(out.x * out.x + out.y * out.y) || 1;
    const outX = out.x / outLength;
    const outY = out.y / outLength;

    result.ore.forEach(material => {
        const angle = Math.atan2(outY, outX) + (Math.random() - 0.5) * 1.6;
        const speed = 30 + Math.random() * 60;
        state.ores.push(new __WEBPACK_IMPORTED_MODULE_3__components_ore_ore__["a" /* default */](
            rock.x + outX * rock.radius * 0.9,
            rock.y + outY * rock.radius * 0.9,
            rock.vx + Math.cos(angle) * speed,
            rock.vy + Math.sin(angle) * speed,
            material
        ));
    });

    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, hitX, hitY, rock.vx + outX * 40, rock.vy + outY * 40, 2, {
        minSpeed: 20, maxSpeed: 90, minLife: 0.2, maxLife: 0.5, size: 2, color: __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][rock.material].color
    });
    if(Math.random() < Math.min(1, damage * 0.6)) {
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, hitX, hitY, rock.vx + outX * 25, rock.vy + outY * 25, 1, {
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
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, x, y, rock.vx, rock.vy, 1, {
                minSpeed: 5, maxSpeed: 30, minLife: 1, maxLife: 2.2, size: 8, color: '170,160,150', dust: true, alpha: 0.22
            });
        }
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, hitX, hitY, rock.vx, rock.vy, 12, {
            minSpeed: 20, maxSpeed: 90, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '220,220,230'
        });
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].rockCrack();
    }

    if(result.crumbled) {
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 14, {
            minSpeed: 20, maxSpeed: 100, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '200,200,210'
        });
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 6, {
            minSpeed: 5, maxSpeed: 40, minLife: 1, maxLife: 2, size: 7, color: '170,160,150', dust: true, alpha: 0.22
        });
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].rockCrack();
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
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 26, {
                    minSpeed: 40, maxSpeed: 220, minLife: 0.25, maxLife: 0.7, size: 3.5, color: '255,170,60'
                });
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 10, {
                    minSpeed: 10, maxSpeed: 80, minLife: 0.15, maxLife: 0.35, size: 7, color: '255,240,200'
                });
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 5, {
                    minSpeed: 5, maxSpeed: 35, minLife: 1, maxLife: 2, size: 9, color: '120,100,90', dust: true, alpha: 0.25
                });
                rocks.forEach(other => {
                    if(other === rock || other.dead) return;
                    const ox = other.x - bullet.x;
                    const oy = other.y - bullet.y;
                    const reach = bullet.splash + other.radius;
                    if(ox * ox + oy * oy < reach * reach) hitRock(other, bullet.damage * 0.5, bullet.x, bullet.y);
                });
                __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].plasmaImpact();
            } else {
                __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].rockHit();
            }
            return;
        }
    });
};

const explodeMissile = (missile) => {
    const drone = missile.kind === 'drone';
    const color = drone ? '255,225,140' : '255,160,80';
    // Hot sparks, a white flash, slow dust, and a shockwave ring sized to the blast.
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.15, missile.vy * 0.15, drone ? 34 : 30, {
        minSpeed: 40, maxSpeed: missile.blast * 4 + 80, minLife: 0.25, maxLife: 0.8, size: drone ? 3 : 3, color: color
    });
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, 0, 0, 8, {
        minSpeed: 5, maxSpeed: 60, minLife: 0.12, maxLife: 0.3, size: drone ? 10 : 8, color: '255,250,225'
    });
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, drone ? 8 : 6, {
        minSpeed: 10, maxSpeed: 50, minLife: 1, maxLife: 2, size: 11, color: '150,140,130', dust: true, alpha: 0.2
    });
    state.shockwaves.push({ x: missile.x, y: missile.y, radius: 4, maxRadius: missile.blast * 1.6, life: 1, color: drone ? '255,220,140' : '255,170,90' });
    if(drone) __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].droneImpact();
    else __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].missileExplosion();

    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(missile, rock);
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
    const contactX = host.x + link.offsetX / distance * host.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
    const contactY = host.y + link.offsetY / distance * host.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].mergeCloud(state.particles, contactX, contactY, host,
        Math.round(12 + guest.radius), guest.radius * 1.1, '175,165,150');
    __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].merge(Math.sqrt(host.area + guest.area));
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
            const seamX = host.x + Math.cos(angle) * host.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
            const seamY = host.y + Math.sin(angle) * host.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].mergeCloud(state.particles, seamX, seamY, host, 2, guest.radius * 0.4 + 4, '170,160,148');
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
            const reach = (a.radius + b.radius) * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
            const distSq = dx * dx + dy * dy;
            if(distSq > reach * reach) continue;

            const distance = Math.sqrt(distSq) || 0.001;
            const normalX = dx / distance;
            const normalY = dy / distance;
            const combinedRadius = Math.sqrt(a.area + b.area);

            // Fresh fragments, busy pairs and oversized bodies just rest against each other.
            if(a.grace > 0 || b.grace > 0 || a.merging || b.merging || combinedRadius > __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["a" /* MAX_MERGE_RADIUS */]) {
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
        const rockRadius = rock.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];

        // Broad phase against the whole ship first.
        const center = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(ship, rock);
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
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, contact.x, contact.y, rock.vx, rock.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2,
                    color: ship.hullDef.shieldColor || '120,210,255'
                });
            }
            return;
        }

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rockRadius - distance;
            if(overlap <= 0) continue;

            const impactSpeed = resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);
            const damage = 4 + impactSpeed * rock.mass / 6000;

            if(impactSpeed > 25 && ship.takeDamage(damage, particles)) {
                __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].explosion(0.6);
                // Ramming chips the asteroid too.
                hitRock(rock, 1 + impactSpeed * ship.mass / 30000, c.x + d.x / distance * c.r, c.y + d.y / distance * c.r);
            }
            return;
        }
    });
};

// Atlantis city shield: asteroids bounce off it, ships, shots and ore pass through.
const cityShield = (dt) => {
    const R = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].shieldRadius;
    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const dx = rock.x - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x;
        const dy = rock.y - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const r = rock.radius * __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["b" /* VISUAL_RADIUS */];
        if(distance > R + r || distance < R - r - 40) return;

        const nx = dx / distance;
        const ny = dy / distance;
        rock.x = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x + nx * (R + r);
        rock.y = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y + ny * (R + r);
        const inward = rock.vx * nx + rock.vy * ny;
        if(inward < 0) {
            rock.vx -= 1.6 * inward * nx;
            rock.vy -= 1.6 * inward * ny;
            const strength = Math.min(1.5, 0.3 + -inward / 80 + r / 60);
            __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts.push({ angle: Math.atan2(ny, nx), life: 1, strength: strength });
            if(__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts.length > 10) __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts.shift();
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x + nx * R, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y + ny * R, rock.vx * 0.3, rock.vy * 0.3, 10, {
                minSpeed: 30, maxSpeed: 140, minLife: 0.2, maxLife: 0.6, size: 2.5, color: '170,220,255'
            });
            const sdx = state.ship.x - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x - nx * R;
            const sdy = state.ship.y - __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y - ny * R;
            const near = 1 - Math.min(1, Math.sqrt(sdx * sdx + sdy * sdy) / 1400);
            if(near > 0) __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].cityShield(0.25 * near * strength);
        }
    });
    __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts.forEach(impact => { impact.life -= dt * 0.8; });
    __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].impacts.filter(impact => impact.life > 0);
};

const collectOre = (dt) => {
    const ship = state.ship;
    const cargoFull = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["c" /* cargoUsed */])() >= ship.cargoCapacity;
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
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 6, {
                    minSpeed: 30, maxSpeed: 120, minLife: 0.2, maxLife: 0.5, size: 2, color: shieldColor
                });
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 4, {
                    minSpeed: 20, maxSpeed: 80, minLife: 0.2, maxLife: 0.45, size: 2, color: __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][ore.material].color
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
        if(ore.tractored && !wasHeld) __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].tractorLock();
        if(!collected) return;

        if(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["q" /* storeOre */])(ore.material, ship.cargoCapacity)) {
            ore.dead = true;
            const material = __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][ore.material];
            __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].pickup(material.price);
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
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].aimX = (__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseX - __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2) / zoom + state.camera.x;
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].aimY = (__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseY - __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2) / zoom + state.camera.y;

    ship.update(dt, __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */], state);
    state.beamHits.forEach(hit => {
        const push = Math.min(0.6, 900 * hit.damage / hit.rock.mass);
        hit.rock.vx += hit.dirX * push;
        hit.rock.vy += hit.dirY * push;
        hitRock(hit.rock, hit.damage, hit.x, hit.y);
        if(Math.random() < 0.35) {
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, hit.x, hit.y, hit.rock.vx - hit.dirX * 60, hit.rock.vy - hit.dirY * 60, 1, {
                minSpeed: 40, maxSpeed: 160, minLife: 0.15, maxLife: 0.4, size: 2, color: '190,230,255'
            });
        }
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].beamImpact();
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
    updateScanner(dt);
    cityShield(dt);
    bullets.forEach(bullet => {
        if(bullet.kind === 'plasma' && Math.random() < 0.6) {
            state.particles.push(new __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */]({
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

    state.canDock = ship.alive && distanceToStation() < __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].dockRadius;
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
    const w = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width;
    const h = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height;
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
    const halfW = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / (2 * zoom) + r;
    const halfH = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / (2 * zoom) + r;
    return Math.abs(x - state.camera.x) < halfW && Math.abs(y - state.camera.y) < halfH;
};

const drawCrosshair = () => {
    const x = __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseX;
    const y = __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseY;
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
    const glow = Object(__WEBPACK_IMPORTED_MODULE_12__render_sprites__["c" /* glowSprite */])(TRACTOR);
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
        Object(__WEBPACK_IMPORTED_MODULE_12__render_sprites__["e" /* stamp */])(ctx, glow, ore.x, ore.y, 26, 26);
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
    Object(__WEBPACK_IMPORTED_MODULE_12__render_sprites__["e" /* stamp */])(ctx, glow, emitter.x, emitter.y, 30 + pulse * 10, 30 + pulse * 10);
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
    Object.keys(rock.composition).forEach(id => { perArea += rock.composition[id] * __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][id].price; });
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
    __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].scanPing();
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
        const color = __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][target.material].color;
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
        ctx.fillText(__WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][target.material].name.toUpperCase() + ' · ~' + scan.value.toLocaleString('en-US') + ' cr',
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
    const sx = (target.x - state.camera.x) * zoom + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2;
    const sy = (target.y - state.camera.y) * zoom + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2;
    if(sx > 0 && sx < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width && sy > 0 && sy < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height) return;

    const margin = 46;
    const cx = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const scale = Math.min(Math.abs((cx - margin) / Math.cos(angle) || Infinity), Math.abs((cy - margin) / Math.sin(angle) || Infinity));
    const px = cx + Math.cos(angle) * scale;
    const py = cy + Math.sin(angle) * scale;
    const color = __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][target.material].color;
    const distance = Math.sqrt(Math.pow(target.x - state.ship.x, 2) + Math.pow(target.y - state.ship.y, 2));

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(' + color + ', 0.95)';
    ctx.font = '11px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(__WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][target.material].name.toUpperCase() + ' ' + (distance / 1000).toFixed(1) + 'k',
        -Math.cos(angle) * 30, -Math.sin(angle) * 30 + 4);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8);
    ctx.closePath();
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
        Object(__WEBPACK_IMPORTED_MODULE_12__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_12__render_sprites__["c" /* glowSprite */])(wave.color), wave.x, wave.y, glow, glow);
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
    ctx.strokeText(state.bannerText, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(state.bannerText, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 4);
    ctx.restore();
};

const drawDockPrompt = () => {
    if(!state.canDock) return;
    const ship = state.ship;
    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    const text = speed > __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].maxDockSpeed ? 'Slow down to dock (X stabilizes)' : 'Press B to dock at the shipyard';
    ctx.save();
    ctx.font = '18px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = speed > __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].maxDockSpeed ? 'rgba(255, 200, 120, 0.95)' : 'rgba(140, 255, 160, 0.95)';
    ctx.fillText(text, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height - 60);
    ctx.restore();
};

// Edge-of-screen pointer to the shipyard when it's out of view.
const drawStationPointer = () => {
    const sx = (__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x - state.camera.x) * zoom + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2;
    const sy = (__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y - state.camera.y) * zoom + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2;
    const margin = 40;
    if(sx > -100 && sx < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width + 100 && sy > -100 && sy < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height + 100) return;

    const cx = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2;
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
    const top = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height - 16 - weapons.length * rowHeight - 18;

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
    const left = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width - size - 16;
    const top = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height - size - 16;
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
        ctx.fillStyle = scanning ? 'rgb(' + __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][rock.material].color + ')' : 'rgb(140, 140, 150)';
        const r = Math.max(1.2, rock.radius * scale * 1.5);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    const target = state.scan.target;
    if(target && Math.sin(state.time * 6) > -0.3) {
        ctx.strokeStyle = 'rgb(' + __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][target.material].color + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + (target.x - ship.x) * scale, cy + (target.y - ship.y) * scale, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Station (clamped to the edge when far away).
    let stx = (__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x - ship.x) * scale;
    let sty = (__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y - ship.y) * scale;
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
    ctx.fillText(ship.scanner ? 'ORE SCANNER ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k' : 'SENSORS ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k',
        left + 6, top + 14);
    ctx.restore();
};

const render = () => {
    const time = state.time;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height);
    drawStarfield();

    ctx.save();
    ctx.translate(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["d" /* world */].height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-state.camera.x, -state.camera.y);

    if(isVisible(__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y, 300)) Object(__WEBPACK_IMPORTED_MODULE_9__world_station__["b" /* drawStation */])(ctx, time, state.canDock);

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
    drawScanner(time);
    state.ship.draw(ctx);
    drawFloatingTexts();
    ctx.restore();

    drawStationPointer();
    drawMinimap();
    drawScannerPointer();
    drawWeaponPanel();
    drawDockPrompt();
    if(!state.paused) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- cargo hold panel

const ejectOre = (material, count) => {
    if(!state || !state.ship.alive) return;
    const ship = state.ship;
    const removed = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["l" /* removeCargo */])(material, count);
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);
    const stern = ship.localToWorld(-ship.radius * 0.7, 0);
    for(let i = 0; i < removed; i++) {
        const spread = (Math.random() - 0.5) * 1.4;
        const speed = 60 + Math.random() * 60;
        const ore = new __WEBPACK_IMPORTED_MODULE_3__components_ore_ore__["a" /* default */](stern.x + (Math.random() - 0.5) * 8, stern.y + (Math.random() - 0.5) * 8,
            ship.vx - Math.cos(ship.angle + spread) * speed, ship.vy - Math.sin(ship.angle + spread) * speed, material);
        ore.ejectTimer = 3;
        state.ores.push(ore);
    }
    if(removed) {
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].pickup(1);
        floatText(stern.x - cos * 10, stern.y - sin * 10, '-' + removed + ' ' + __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][material].name, '255,170,140');
    }
};

const renderCargoPanel = () => {
    if(!cargoPanel || cargoPanel.style.display === 'none') return;
    const profile = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])();
    const capacity = state ? state.ship.cargoCapacity : 0;
    const used = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["c" /* cargoUsed */])();
    let value = 0;

    let html = '<div class="cargo-header"><span>Cargo hold</span><button data-close="1">×</button></div>' +
        '<div class="cargo-capacity"><div class="cargo-capacity-fill" style="width:' +
        Math.round(Math.min(1, used / Math.max(1, capacity)) * 100) + '%"></div></div>' +
        '<div class="cargo-sub">' + used + ' / ' + capacity + ' units</div><table>';
    __WEBPACK_IMPORTED_MODULE_7__world_materials__["a" /* MATERIAL_ORDER */].forEach(id => {
        const amount = profile.cargo[id] || 0;
        if(!amount) return;
        const material = __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][id];
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
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
    shieldButton.style.display = state && !frozen ? '' : 'none';
    cargoButton.style.display = state && !frozen ? '' : 'none';
    if(frozen) toggleCargoPanel(false);
    if(frozen) {
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].stopAll();
    } else {
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].startEngine();
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

    __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].dock();
    Object(__WEBPACK_IMPORTED_MODULE_11__shipyard_shipyard__["a" /* getShipyard */])().open({
        tab: Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["c" /* cargoUsed */])() > 0 ? 'market' : 'ship',
        closeLabel: 'Undock',
        canTrade: true,
        hullStatus: () => ({ hp: state.ship.hp, max: Math.round(state.ship.maxHull) }),
        repair: (points) => { state.ship.hp = Math.min(state.ship.maxHull, state.ship.hp + points); },
        onClose: () => {
            if(!state) return;
            ship.applyStats(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["e" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().hull));
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

        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].setThrust(state.ship.alive && state.ship.thrusting);
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].setFiring(state.ship.alive && state.ship.minigunFiring);
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].setBeam(state.ship.alive && state.ship.beaming);
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].setTractor(state.ship.alive && !!state.tractorActive, Math.min(1, (state.tractorCount || 0) / 6));
    }

    render();
    renderInfo();

    if(state.gameOverTimer >= GAME_OVER_DELAY) {
        Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["i" /* loseCargo */])();
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
    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["a" /* default */])();

    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["c" /* onKeyPress */])('Escape', () => {
        if(!state || state.docked || !state.ship.alive) return false;
        setPaused(!state.paused);
        return true;
    });

    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["c" /* onKeyPress */])('KeyG', () => {
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
    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["c" /* onKeyPress */])('KeyH', toggleShields);

    window.addEventListener('wheel', (event) => {
        if(!state || state.paused) return;
        event.preventDefault();
        zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * Math.exp(-event.deltaY * 0.0012)));
    }, { passive: false });

    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["c" /* onKeyPress */])('KeyC', () => {
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
            Object.keys(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().cargo).forEach(id => ejectOre(id, Infinity));
        } else if(material) {
            ejectOre(material, button.dataset.count === 'all' ? Infinity : 1);
        }
    });
    Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["j" /* onProfileChange */])(() => renderCargoPanel());
    shieldButton.addEventListener('click', () => toggleShields());

    Object(__WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["c" /* onKeyPress */])('KeyB', () => {
        if(!state || state.paused || !state.canDock) return false;
        const ship = state.ship;
        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        if(speed > __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].maxDockSpeed) {
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

    __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].unlock();
    resize();
    state = createState();
    state.rocks = state.sectors.update(state.ship.x, state.ship.y, []);
    pauseMenu.style.visibility = 'hidden';
    freeze(false);
    frameId = requestAnimationFrame(frame);
};

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__missile_missile__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__render_sprites__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__shipyard_modules__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__audio_audio__ = __webpack_require__(7);









// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const SECONDARY_THRUST = 0.55;    // retro / strafe thrust relative to main engines
const MAX_SPEED = 600;            // px/s, safety cap only
const MASS_UNIT = 300;            // physics mass per hull mass point

const BULLET_SPEED = 850;
const BULLET_SPREAD = 0.035;
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
        const b = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["d" /* hullBounds */])(hull);
        const pad = 8;
        const sprite = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["a" /* createSprite */])(b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2, ctx => {
            ctx.translate(pad - b.minX, pad - b.minY);
            Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["c" /* drawHullArt */])(ctx, hull, { color: color });
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
    const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(hull);
    const color = hull.shieldColor || '120,210,255';
    const pad = 6;
    hull._shieldSprite = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["a" /* createSprite */])(s.rx * 2 + pad * 2, s.ry * 2 + pad * 2, ctx => {
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
        if(this.shieldsEnabled) __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldUp();
        else __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldDown();
        return true;
    }

    // Converts a world point into shield-ellipse space.
    shieldLocal(worldX, worldY) {
        const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(this.hullDef);
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
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldHit(0.5);
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
                particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
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
                particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
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
            const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(from, rock);
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
                let d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target);
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
        world.bullets.push(new __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__["a" /* default */](
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
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].minigunShot();

        // Each round adds enough heat to outpace cooling, so sustained fire
        // overheats after `heatShots` rounds.
        turret.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(turret.heat >= 1) {
            turret.heat = 1;
            turret.overheated = true;
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].overheat();
        }
    }

    fireStaff(turret, p, stats, world) {
        turret.cooldown = 1 / stats.fireRate;
        const dirX = Math.cos(turret.aim);
        const dirY = Math.sin(turret.aim);
        const barrel = 8 * this.hullDef.moduleScale;
        const inherited = Math.max(0, this.vx * dirX + this.vy * dirY);
        const speed = PLASMA_SPEED + inherited;

        world.bullets.push(new __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__["a" /* default */](
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
            world.particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                x: p.x + dirX * barrel, y: p.y + dirY * barrel,
                vx: this.vx + Math.cos(a) * v, vy: this.vy + Math.sin(a) * v,
                life: 0.15 + Math.random() * 0.2, size: 3, color: i % 2 ? '255,200,90' : '255,120,40'
            }));
        }
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].staffShot();
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
        const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        const angle = Math.atan2(aimAt.y, aimAt.x);

        world.missiles.push(new __WEBPACK_IMPORTED_MODULE_1__missile_missile__["a" /* default */]({
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
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].missileLaunch();
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
        const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        // Each drone leaves on a slightly different heading, weaving towards the target.
        const weave = [0, -0.35, 0.35, -0.6, 0.6, 0][salvo.index % 6];
        const angle = Math.atan2(aimAt.y, aimAt.x) + weave;

        world.missiles.push(new __WEBPACK_IMPORTED_MODULE_1__missile_missile__["a" /* default */]({
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
        __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].droneLaunch();

        salvo.remaining--;
        salvo.index++;
        salvo.timer = 0.11;
        if(salvo.remaining <= 0) launcher.salvo = null;
    }

    // Readiness of each weapon group for the HUD: 1 = ready.
    weaponStatus() {
        const groups = {};
        this.turrets.concat(this.launchers).forEach(w => {
            const def = __WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["c" /* default */][w.kind];
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
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].shieldHit();
        }

        if(remaining > 0) {
            this.hp -= remaining;
            this.hullFlash = 0.15;
            this.explode(particles, 10 + Math.round(remaining / 2));
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].hullHit();
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
            __WEBPACK_IMPORTED_MODULE_7__audio_audio__["a" /* default */].explosion(1);
        }
        return true;
    }

    explode(particles, count) {
        const spread = this.radius * 0.5;
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 180;
            particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
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
        const plume = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["b" /* flameSprite */])(exhaust, '255,235,190');
        const jetFlame = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["b" /* flameSprite */])('170,210,255', '255,255,255');
        const glow = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* glowSprite */])(exhaust);
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        this.engines.forEach(engine => {
            const size = engine.size;
            // Nozzle glow, pulsing even when idle.
            const glowSize = (2.5 + pulse + t.main * 3) * size * 3.2;
            ctx.globalAlpha = 0.55 + t.main * 0.45;
            Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["e" /* stamp */])(ctx, glow, engine.x, engine.y, glowSize, glowSize);

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

        const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(this.hullDef);
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
            const glow = Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* glowSprite */])(color);
            this.shieldImpacts.forEach(impact => {
                const ix = impact.x * grow;
                const iy = impact.y * grow;
                const size = (20 + 50 * impact.strength) * impact.life;
                ctx.globalAlpha = Math.min(1, impact.life * impact.strength);
                Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["e" /* stamp */])(ctx, glow, ix, iy, size, size);
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
            if(beam.hit) Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* glowSprite */])('120,190,255'), beam.x2, beam.y2, 34, 34);
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
            Object(__WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: u, glow: 0 });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_5__shipyard_modules__["d" /* drawModule */])(ctx, turret.kind, turret.module.level, {
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
                    Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_4__render_sprites__["c" /* glowSprite */])('255,150,50'), fx, fy, bloom, bloom);
                }
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(' + color + ', 0.9)';
                ctx.beginPath();
                ctx.arc(Math.cos(turret.aim - this.angle) * tip, Math.sin(turret.aim - this.angle) * tip,
                    (2 + Math.random() * 3) * Math.max(1, u), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        this.drawShield(ctx);
        ctx.restore();

        this.drawBeams(ctx);
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ship);


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);


const LIFETIME = { bullet: 1.4, plasma: 2.2 };

// Kinetic minigun rounds ('bullet') and Goa'uld staff plasma bolts ('plasma').
class Bullet {

    constructor(x, y, vx, vy, damage, kind, splash) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage || 1;
        this.kind = kind || 'bullet';
        this.splash = splash || 0;
        this.mass = this.kind === 'plasma' ? 60 : 4;
        this.life = LIFETIME[this.kind];
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        if(this.kind === 'plasma') {
            // Big staff-weapon bolt: a white-hot head inside an orange plasma envelope,
            // stretched along its flight path and flickering.
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const dx = this.vx / speed;
            const dy = this.vy / speed;
            const flicker = 0.85 + Math.random() * 0.3;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;
            [[16, 'rgba(255, 90, 20, 0.22)', 30], [10, 'rgba(255, 140, 40, 0.55)', 22], [5, 'rgba(255, 210, 120, 0.9)', 14],
                [2.4, 'rgba(255, 255, 235, 1)', 8]].forEach(layer => {
                ctx.lineWidth = layer[0] * flicker;
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(this.x - dx * layer[2], this.y - dy * layer[2]);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            });
            const head = 28 * flicker;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["c" /* glowSprite */])('255,140,40'), this.x, this.y, head, head);
            ctx.restore();
            return;
        }
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
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render_sprites__ = __webpack_require__(0);




// Tau'ri missiles ('missile') and Ancient drones ('drone').
const PROFILES = {
    missile: { acceleration: 520, maxSpeed: 620, lifetime: 4, retarget: 320, trail: '255,150,70', trailRate: 0.02 },
    drone: { acceleration: 900, maxSpeed: 760, lifetime: 6, retarget: 650, trail: '255,220,120', trailRate: 0.015 }
};

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Missile {

    constructor(options) {
        this.kind = options.kind || 'missile';
        this.profile = PROFILES[this.kind];
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.angle = options.angle;
        this.damage = options.damage;
        this.blast = options.blast;
        this.target = options.target || null;
        this.homing = options.homing || 0;   // 0 = dumb-fire
        this.launchDelay = options.launchDelay || 0;
        this.life = this.profile.lifetime;
        this.trailTimer = 0;
        this.time = Math.random() * 10;
        this.dead = false;
        this.exploded = false;
    }

    update(dt, rocks, particles) {
        this.life -= dt;
        this.time += dt;
        if(this.life <= 0) {
            this.dead = true;
            this.exploded = true;
            return;
        }

        const profile = this.profile;
        const armed = this.launchDelay <= 0;
        if(!armed) this.launchDelay -= dt;

        if(this.homing > 0 && armed) {
            if(!this.target || this.target.dead) this.target = this.findTarget(rocks);
            if(this.target) {
                const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["b" /* delta */])(this, this.target);
                const desired = Math.atan2(d.y, d.x);
                const turn = Math.max(-this.homing * dt, Math.min(this.homing * dt, angleDifference(this.angle, desired)));
                this.angle += turn;
            }
        }

        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        const thrust = armed ? profile.acceleration : profile.acceleration * 0.3;
        this.vx += dirX * thrust * dt;
        this.vy += dirY * thrust * dt;

        // Guided weapons use side thrust to bleed off sideways drift.
        if(this.homing > 0) {
            const forward = this.vx * dirX + this.vy * dirY;
            const damp = Math.min(1, this.homing * 0.8 * dt);
            this.vx += (dirX * forward - this.vx) * damp;
            this.vy += (dirY * forward - this.vy) * damp;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > profile.maxSpeed) {
            this.vx *= profile.maxSpeed / speed;
            this.vy *= profile.maxSpeed / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.trailTimer -= dt;
        if(this.trailTimer <= 0) {
            this.trailTimer = profile.trailRate;
            particles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */]({
                x: this.x - dirX * 4, y: this.y - dirY * 4,
                vx: this.vx * 0.2 - dirX * 50, vy: this.vy * 0.2 - dirY * 50,
                life: 0.25 + Math.random() * 0.2, size: this.kind === 'drone' ? 2 : 2.5, color: profile.trail
            }));
        }
    }

    findTarget(rocks) {
        let best = null;
        let bestDist = this.profile.retarget * this.profile.retarget;
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["b" /* delta */])(this, rock);
            const distSq = d.x * d.x + d.y * d.y;
            if(distSq < bestDist) {
                bestDist = distSq;
                best = rock;
            }
        });
        return best;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if(this.kind === 'drone') {
            // Golden squid-like drone with a pulsing glow.
            const pulse = 0.7 + 0.3 * Math.sin(this.time * 20);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = pulse;
            Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_2__render_sprites__["c" /* glowSprite */])('255,200,80'), 0, 0, 18, 18);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255, 235, 170, 0.95)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(4, 0); ctx.lineTo(-1, -2); ctx.lineTo(-4, -1.2);
            ctx.moveTo(4, 0); ctx.lineTo(-1, 2); ctx.lineTo(-4, 1.2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.strokeStyle = 'rgb(255, 160, 140)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 0);
        ctx.moveTo(-4, -2.5);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-4, 2.5);
        ctx.stroke();
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Missile);


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(1);


const ORE_LIFETIME = 90;

// A floating chunk of ore that the ship can scoop into its cargo hold.
class Ore {

    constructor(x, y, vx, vy, material) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.material = material;
        this.life = ORE_LIFETIME;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 4;
        this.radius = material === 'rock' ? 2.5 : 3.2;
        this.ejectTimer = 0;      // freshly jettisoned ore can't be re-collected for a moment
        this.tractored = false;   // currently held by the tractor beam (for the beam animation)
        this.dead = false;
    }

    // Tractor pull towards the ship when in range. Returns true when collected.
    update(dt, ship, canCollect) {
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
        if(this.ejectTimer > 0) this.ejectTimer -= dt;
        this.tractored = false;

        if(ship && ship.alive && canCollect && this.ejectTimer <= 0) {
            const dx = ship.x - this.x;
            const dy = ship.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;

            if(distance < ship.collectRadius) return true;

            if(distance < ship.magnetRange) {
                this.tractored = true;
                // Steer towards the ship, matching its velocity as it closes in.
                const pull = 900 * (1 - distance / ship.magnetRange) + 200;
                this.vx += (dx / distance * pull + (ship.vx - this.vx) * 3) * dt;
                this.vy += (dy / distance * pull + (ship.vy - this.vy) * 3) * dt;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        return false;
    }

    draw(ctx, time) {
        const color = __WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][this.material].color;
        const r = this.radius;
        const pulse = 0.7 + 0.3 * Math.sin(time * 5 + this.angle * 3);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        // Soft halo then the crystal itself (cheaper than a canvas blur).
        ctx.fillStyle = 'rgba(' + color + ',' + (0.22 * pulse).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + color + ',' + pulse.toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(0, r * 0.8);
        ctx.lineTo(-r, 0);
        ctx.lineTo(0, -r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ore);


/***/ }),
/* 16 */
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
    KeyF: 'missileKey',
    Space: 'fire'
};

// One-shot key presses (toggle auto-targeting, pause).
const pressHandlers = {};

const input = {
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    strafeLeft: false,
    strafeRight: false,
    stabilize: false,
    fire: false,
    missileKey: false,
    mouseDown: false,
    rightMouseDown: false,
    mouseX: window.innerWidth / 2,
    mouseY: 0,
    aimX: 0,             // mouse position in world space (set by the game each step)
    aimY: 0,
    enabled: false,

    get firing() {
        return this.fire || this.mouseDown;
    },

    get firingMissiles() {
        return this.missileKey || this.rightMouseDown;
    },

    reset() {
        Object.keys(KEY_MAP).forEach(code => { this[KEY_MAP[code]] = false; });
        this.mouseDown = false;
        this.rightMouseDown = false;
    }
};
/* harmony export (immutable) */ __webpack_exports__["b"] = input;


const onKeyPress = (code, handler) => {
    pressHandlers[code] = handler;
};
/* harmony export (immutable) */ __webpack_exports__["c"] = onKeyPress;


let initialized = false;

const loadInputHandlers = () => {
    if(initialized) return;
    initialized = true;

    window.addEventListener('keydown', (event) => {
        if(pressHandlers[event.code] && !event.repeat && pressHandlers[event.code](event)) {
            event.preventDefault();
            return;
        }
        const action = KEY_MAP[event.code];
        if(!action || !input.enabled) return;
        event.preventDefault();
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
        if(!input.enabled) return;
        // Clicking HUD buttons shouldn't fire the guns.
        if(event.target && event.target.closest && event.target.closest('button, .cargo-panel')) return;
        if(event.button === 0) input.mouseDown = true;
        if(event.button === 2) input.rightMouseDown = true;
    });

    window.addEventListener('mouseup', (event) => {
        if(event.button === 0) input.mouseDown = false;
        if(event.button === 2) input.rightMouseDown = false;
    });

    window.addEventListener('contextmenu', (event) => {
        if(input.enabled) event.preventDefault();
    });

    // Releasing keys while the window is unfocused would otherwise leave them stuck.
    window.addEventListener('blur', () => input.reset());
};

/* harmony default export */ __webpack_exports__["a"] = (loadInputHandlers);


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__materials__ = __webpack_require__(1);
// Endless asteroid fields. Space is divided into square sectors that are generated
// deterministically from a seed the first time the ship comes near. Sectors that
// fall out of range are put to sleep (their asteroids stored) and woken on return,
// so the map is endless while only nearby asteroids are simulated.




const SECTOR_SIZE = 1400;
/* unused harmony export SECTOR_SIZE */

const ACTIVE_RADIUS = 2;          // sectors around the ship that are simulated
const SAFE_RADIUS = 700;          // no asteroids spawn this close to the station

// Small deterministic PRNG (mulberry32).
const createRandom = (seed) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const hashSector = (seed, sx, sy) => {
    let h = seed ^ Math.imul(sx, 374761393) ^ Math.imul(sy, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
};

const sectorOf = (x, y) => ({
    sx: Math.floor(x / SECTOR_SIZE),
    sy: Math.floor(y / SECTOR_SIZE)
});
/* harmony export (immutable) */ __webpack_exports__["b"] = sectorOf;


// Distance from base measured in sectors (Chebyshev-ish, rounded).
const sectorDistance = (sx, sy) => {
    const cx = sx + 0.5;
    const cy = sy + 0.5;
    return Math.floor(Math.sqrt(cx * cx + cy * cy));
};
/* unused harmony export sectorDistance */


const generateSector = (seed, sx, sy) => {
    const random = createRandom(hashSector(seed, sx, sy));
    const distance = sectorDistance(sx, sy);
    const rocks = [];

    // Some sectors are dense fields, most are sparse, a few are empty.
    const roll = random();
    let count;
    if(roll < 0.12) count = 0;
    else if(roll < 0.8) count = 2 + Math.floor(random() * 4);
    else count = 7 + Math.floor(random() * 6 + distance * 0.5);

    // Fields cluster around a centre.
    const fieldX = (sx + 0.2 + random() * 0.6) * SECTOR_SIZE;
    const fieldY = (sy + 0.2 + random() * 0.6) * SECTOR_SIZE;

    for(let i = 0; i < count; i++) {
        const spread = SECTOR_SIZE * (count > 6 ? 0.3 : 0.5);
        const x = fieldX + (random() - 0.5) * 2 * spread;
        const y = fieldY + (random() - 0.5) * 2 * spread;
        if(Math.sqrt(x * x + y * y) < SAFE_RADIUS) continue;

        const giant = random() < 0.04 + distance * 0.004;
        const radius = giant ? 60 + random() * 35 : 14 + random() * 38;
        const main = Object(__WEBPACK_IMPORTED_MODULE_1__materials__["d" /* rollMaterial */])(random, distance);
        const purity = main === 'rock' ? 1 : 0.45 + random() * 0.45;
        const composition = { rock: 1 - purity };
        composition[main] = (composition[main] || 0) + purity;

        // Sometimes a trace of a second metal.
        const trace = Object(__WEBPACK_IMPORTED_MODULE_1__materials__["d" /* rollMaterial */])(random, distance);
        if(trace !== main && trace !== 'rock') {
            const share = 0.05 + random() * 0.15;
            composition[trace] = (composition[trace] || 0) + share;
            composition.rock = Math.max(0, composition.rock - share);
        }

        const angle = random() * Math.PI * 2;
        const speed = random() * 22;
        rocks.push(new __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__["c" /* default */]({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            composition: composition,
            random: random
        }));
    }
    return rocks;
};

class SectorManager {

    constructor(seed) {
        this.seed = seed;
        this.dormant = {};    // key -> sleeping rocks
        this.active = {};     // key -> true
        this.seen = {};       // key -> true once generated
    }

    // Returns the new active rock list for the ship's position.
    update(shipX, shipY, rocks) {
        const center = sectorOf(shipX, shipY);
        const wanted = {};
        for(let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++) {
            for(let dy = -ACTIVE_RADIUS; dy <= ACTIVE_RADIUS; dy++) {
                wanted[(center.sx + dx) + ',' + (center.sy + dy)] = [center.sx + dx, center.sy + dy];
            }
        }

        // Put asteroids that drifted out of range to sleep in whatever sector they're in now.
        const keep = [];
        rocks.forEach(rock => {
            if(rock.dead) return;
            const s = sectorOf(rock.x, rock.y);
            const key = s.sx + ',' + s.sy;
            if(wanted[key]) {
                keep.push(rock);
            } else {
                if(!this.dormant[key]) this.dormant[key] = [];
                rock.releaseSprite();
                this.dormant[key].push(rock);
            }
        });

        Object.keys(this.active).forEach(key => {
            if(!wanted[key]) delete this.active[key];
        });

        Object.keys(wanted).forEach(key => {
            if(this.active[key]) return;
            this.active[key] = true;
            if(this.dormant[key]) {
                this.dormant[key].forEach(rock => keep.push(rock));
                delete this.dormant[key];
            } else if(!this.seen[key]) {
                this.seen[key] = true;
                generateSector(this.seed, wanted[key][0], wanted[key][1]).forEach(rock => keep.push(rock));
            }
        });

        return keep;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = SectorManager;



/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__render_sprites__ = __webpack_require__(0);
// Home base at the centre of the map: an Atlantis-style six-armed city-ship.
// Fly inside the docking ring and press B to dock with the shipyard.
//
// Performance: the city's line art (hundreds of glowing strokes) and the shield dome
// gradient are rendered once into sprites; each frame just stamps them.



const STATION = {
    x: 0,
    y: 0,
    dockRadius: 420,
    maxDockSpeed: 140,
    shieldRadius: 380,     // city shield: blocks asteroids, lets ships, shots and ore through
    impacts: []            // { angle, life, strength } ripples on the city shield
};
/* harmony export (immutable) */ __webpack_exports__["a"] = STATION;


const LINE = 'rgba(200, 225, 255, 0.95)';
const FILL = 'rgba(8, 16, 30, 0.88)';

const poly = (ctx, pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if(fill !== false) ctx.fill();
    ctx.stroke();
};

const line = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

const hexagon = (r, offset) => {
    const pts = [];
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (offset || 0);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
};

// One arm along +x. Main piers are long with a broad, angled end platform;
// the others are shorter with a compact platform.
const drawArm = (ctx, main, index) => {
    const length = main ? 270 : 215;
    const half = main ? 22 : 18;

    // Pier.
    poly(ctx, [[70, -half], [length, -half], [length, half], [70, half]]);
    line(ctx, 80, 0, length - 10, 0);
    line(ctx, 80, -half * 0.5, length - 10, -half * 0.5);
    line(ctx, 80, half * 0.5, length - 10, half * 0.5);
    for(let x = 95; x < length - 10; x += 22) line(ctx, x, -half, x, half);

    // End platform.
    if(main) {
        poly(ctx, [[length, -half], [length + 18, -58], [length + 78, -58], [length + 96, -26],
            [length + 96, 26], [length + 78, 58], [length + 18, 58], [length, half]]);
        poly(ctx, [[length + 26, -40], [length + 70, -40], [length + 80, 0], [length + 70, 40], [length + 26, 40], [length + 16, 0]]);
        // Tower blocks seen from above.
        [[length + 36, -18], [length + 56, 14], [length + 44, 26], [length + 62, -26]].forEach(t => {
            ctx.strokeRect(t[0] - 6, t[1] - 6, 12, 12);
            ctx.strokeRect(t[0] - 3, t[1] - 3, 6, 6);
        });
        // Side jetty.
        poly(ctx, [[length - 70, half], [length - 40, half + 34], [length - 20, half + 34], [length - 36, half]]);
    } else {
        poly(ctx, [[length, -half], [length + 20, -38], [length + 52, -30], [length + 62, 0],
            [length + 52, 30], [length + 20, 38], [length, half]]);
        ctx.strokeRect(length + 16, -12, 24, 24);
        ctx.beginPath();
        ctx.arc(length + 28, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Window lights along the pier.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 210, 120, 0.9)';
    for(let x = 90; x < length; x += 11) {
        const on = Math.sin(x * 0.37 + index * 1.7) > -0.3;
        if(!on) continue;
        ctx.fillRect(x, -half * 0.75, 2, 2);
        ctx.fillRect(x + 4, half * 0.7, 2, 2);
    }
    ctx.restore();
};

const EXTENT = 460;
const sprites = {};

// City, shield dome and docking ring baked together: one straight image copy per frame.
// Two variants: normal, and with the docking ring lit when the player can dock.
const buildCity = (canDock) => Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["a" /* createSprite */])(EXTENT * 2, EXTENT * 2, ctx => {
    ctx.translate(EXTENT, EXTENT);

    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // City shield styled like the ship shields: soft edge, hexagon lattice, glowing rim.
    const R = STATION.shieldRadius;
    const dome = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
    dome.addColorStop(0, 'rgba(120, 190, 255, 0)');
    dome.addColorStop(0.8, 'rgba(120, 190, 255, 0.04)');
    dome.addColorStop(1, 'rgba(140, 205, 255, 0.2)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const size = 16;
    const w = size * Math.sqrt(3);
    const lattice = new Path2D();
    for(let row = -Math.ceil(R / (size * 1.5)); row <= Math.ceil(R / (size * 1.5)); row++) {
        for(let col = -Math.ceil(R / w) - 1; col <= Math.ceil(R / w) + 1; col++) {
            const cx = col * w + (row % 2 ? w / 2 : 0);
            const cy = row * size * 1.5;
            if(cx * cx + cy * cy > (R + size) * (R + size)) continue;
            for(let i = 0; i < 6; i++) {
                const a1 = Math.PI / 6 + i * Math.PI / 3;
                lattice.moveTo(cx + Math.cos(a1) * size, cy + Math.sin(a1) * size);
                lattice.lineTo(cx + Math.cos(a1 + Math.PI / 3) * size, cy + Math.sin(a1 + Math.PI / 3) * size);
            }
        }
    }
    const fade = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R);
    fade.addColorStop(0, 'rgba(140, 205, 255, 0.02)');
    fade.addColorStop(1, 'rgba(140, 205, 255, 0.22)');
    ctx.strokeStyle = fade;
    ctx.lineWidth = 0.8;
    ctx.stroke(lattice);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 215, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgb(120, 200, 255)';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = FILL;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(150, 200, 255, 0.7)';

    for(let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 3 - Math.PI / 2);
        ctx.strokeStyle = LINE;
        ctx.fillStyle = FILL;
        drawArm(ctx, i % 2 === 0, i);
        ctx.restore();
    }

    poly(ctx, hexagon(92, Math.PI / 6));
    poly(ctx, hexagon(70, 0));
    poly(ctx, hexagon(48, Math.PI / 6));
    const star = hexagon(40, 0);
    [[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1]].forEach(pair => {
        line(ctx, star[pair[0]][0], star[pair[0]][1], star[pair[1]][0], star[pair[1]][1]);
    });
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        line(ctx, Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 92, Math.sin(a) * 92);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
}, Math.min(2, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["d" /* spriteResolution */])()));

const drawStation = (ctx, time, canDock) => {
    const key = canDock ? 'dock' : 'idle';
    if(!sprites[key]) sprites[key] = buildCity(canDock);
    const R = STATION.shieldRadius;

    ctx.save();
    ctx.translate(STATION.x, STATION.y);
    ctx.drawImage(sprites[key].canvas, -EXTENT, -EXTENT, EXTENT * 2, EXTENT * 2);

    // Impact ripples and flares, like the ship shields (only while something has just hit).
    if(STATION.impacts.length) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R + 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        STATION.impacts.forEach(impact => {
            const ix = Math.cos(impact.angle) * R;
            const iy = Math.sin(impact.angle) * R;
            const age = 1 - impact.life;
            const size = (50 + 90 * impact.strength) * impact.life;
            ctx.globalAlpha = Math.min(1, impact.life * impact.strength + 0.2);
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["c" /* glowSprite */])('140,200,255'), ix, iy, size, size);
            ctx.globalAlpha = 0.7 * impact.life;
            ctx.strokeStyle = 'rgb(150, 215, 255)';
            ctx.lineWidth = 2.5 * impact.life + 0.5;
            ctx.beginPath();
            ctx.arc(ix, iy, 6 + age * R * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.9 * impact.life;
            ctx.lineWidth = 3 * impact.life;
            ctx.beginPath();
            ctx.arc(0, 0, R, impact.angle - 0.2 * impact.strength, impact.angle + 0.2 * impact.strength);
            ctx.stroke();
        });
        ctx.restore();
    }

    // Gate room glow.
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    ctx.globalAlpha = 0.8 * pulse;
    Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["c" /* glowSprite */])('80,150,255'), 0, 0, 40, 40);

    // Beacons on the main pier tips.
    const blink = Math.sin(time * 4) > 0;
    if(blink) {
        ctx.globalAlpha = 1;
        const color = canDock ? '140,255,160' : '255,120,100';
        for(let i = 0; i < 6; i += 2) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["e" /* stamp */])(ctx, Object(__WEBPACK_IMPORTED_MODULE_0__render_sprites__["c" /* glowSprite */])(color), Math.cos(angle) * 372, Math.sin(angle) * 372, 22, 22);
        }
    }
    ctx.restore();

    ctx.save();
    ctx.font = '16px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
    ctx.fillText('ATLANTIS · SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 14);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = drawStation;



/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(20);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(22)(content, options);
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
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(21)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}\n.menu-action {\n    display: inline-block;\n    padding: 2px 10px;\n}\n\n.menu h2.menu-action {\n    display: block;\n    margin: 4px 0;\n}\n\n.menu-credits {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.pause-menu {\n    visibility: hidden;\n    min-height: 0;\n}\n\n.pause-menu h1 {\n    margin-top: 30px;\n}\n\n/* ---------------------------------------------------------------- HUD bars */\n\n.hud-bar-row {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    margin: 2px 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n    font-size: 13px;\n}\n\n.hud-bar-label {\n    width: 52px;\n}\n\n.hud-bar {\n    width: 140px;\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.7);\n    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);\n    background: rgba(0, 0, 0, 0.4);\n}\n\n.hud-bar-fill {\n    height: 100%;\n    width: 100%;\n    transition: width 0.15s linear;\n}\n\n.hud-bar.hull .hud-bar-fill {\n    background: #f4c46a;\n}\n\n.hud-bar.shield .hud-bar-fill {\n    background: #78d2ff;\n}\n\n.hud-bar-text {\n    font-size: 11px;\n}\n\n/* ---------------------------------------------------------------- Shipyard */\n\n.shipyard {\n    position: fixed;\n    inset: 0;\n    z-index: 20;\n    display: none;\n    flex-direction: column;\n    color: #dfe9ff;\n    background: rgba(2, 6, 16, 0.96);\n    user-select: none;\n}\n\n.shipyard.open {\n    display: flex;\n}\n\n.shipyard canvas {\n    position: static;\n}\n\n.shipyard-header {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    padding: 10px 20px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.25);\n}\n\n.shipyard-header h1 {\n    margin: 0;\n    font-size: 26px;\n    text-shadow: 0 0 8px rgba(140, 180, 255, 0.9);\n}\n\n.shipyard-credits {\n    flex: 1;\n    font-size: 18px;\n    color: #ffe08a;\n    text-shadow: 0 0 6px rgba(255, 200, 100, 0.7);\n}\n\n.shipyard-body {\n    flex: 1;\n    display: grid;\n    grid-template-columns: 260px 1fr 300px;\n    grid-template-rows: minmax(0, 1fr);\n    gap: 12px;\n    padding: 12px;\n    min-height: 0;\n}\n\n.shipyard-panel {\n    border: 1px solid rgba(140, 180, 255, 0.25);\n    background: rgba(10, 20, 40, 0.55);\n    padding: 10px;\n    overflow-y: auto;\n    min-height: 0;\n}\n\n.shipyard-panel h3 {\n    margin: 4px 0 8px;\n    font-size: 14px;\n    letter-spacing: 1px;\n    color: #9fc0ff;\n}\n\n.hull-cards {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-card {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 6px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    opacity: 0.75;\n}\n\n.hull-card.owned {\n    opacity: 1;\n}\n\n.hull-card.active {\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.35);\n    opacity: 1;\n}\n\n.hull-thumb {\n    flex: none;\n}\n\n.hull-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    min-width: 0;\n}\n\n.hull-name {\n    font-family: Bungee, sans-serif;\n    font-size: 15px;\n}\n\n.hull-class,\n.hull-meta {\n    color: #9fb2d8;\n    margin-bottom: 3px;\n}\n\n.hull-state {\n    color: #8cffa0;\n    font-family: Bungee, sans-serif;\n}\n\n.hull-view {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-title .title-name {\n    display: block;\n    font-size: 20px;\n}\n\n.hull-title .title-desc {\n    display: block;\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n}\n\n.hull-canvas-wrap {\n    flex: 1;\n    min-height: 200px;\n    position: relative;\n    border: 1px solid rgba(140, 180, 255, 0.15);\n}\n\n.hull-canvas {\n    position: absolute !important;\n    top: 0;\n    left: 0;\n}\n\n.shipyard-hint {\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n    text-align: center;\n}\n\n.ship-stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 6px;\n}\n\n.stat {\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    padding: 4px 6px;\n}\n\n.stat-label {\n    display: block;\n    font-family: sans-serif;\n    font-size: 10px;\n    color: #9fb2d8;\n    text-transform: uppercase;\n}\n\n.stat-value {\n    font-size: 14px;\n}\n\n.module-palette {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n\n.module-item {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 5px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    cursor: grab;\n    touch-action: none;\n}\n\n.module-item:hover {\n    border-color: rgba(200, 220, 255, 0.6);\n}\n\n.module-item.armed {\n    border-color: rgba(140, 255, 160, 0.9);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.4);\n}\n\n.module-item.unaffordable {\n    opacity: 0.45;\n}\n\n.module-icon {\n    flex: none;\n}\n\n.module-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #9fb2d8;\n    min-width: 0;\n}\n\n.module-name {\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #dfe9ff;\n}\n\n.module-price {\n    color: #ffe08a;\n    margin-top: 2px;\n}\n\n.inspector {\n    font-family: sans-serif;\n    font-size: 12px;\n}\n\n.inspector p {\n    margin: 4px 0;\n}\n\n.inspector .muted {\n    color: #9fb2d8;\n}\n\n.inspector-name {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n}\n\n.inspector-stats {\n    margin: 4px 0;\n}\n\n.inspector-next {\n    color: #9fb2d8;\n    margin-bottom: 8px;\n}\n\n.inspector-actions {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.sy-button {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #dfe9ff;\n    background: rgba(40, 70, 130, 0.5);\n    border: 1px solid rgba(140, 180, 255, 0.6);\n    padding: 6px 14px;\n    cursor: pointer;\n}\n\n.sy-button:hover:not(:disabled) {\n    background: rgba(60, 100, 180, 0.7);\n    box-shadow: 0 0 8px rgba(140, 180, 255, 0.5);\n}\n\n.sy-button:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n.sy-button.small {\n    font-size: 11px;\n    padding: 3px 8px;\n}\n\n.sy-button.primary {\n    border-color: rgba(140, 255, 160, 0.8);\n    background: rgba(40, 110, 60, 0.5);\n}\n\n.sy-button.buy {\n    border-color: rgba(255, 220, 130, 0.8);\n    background: rgba(110, 90, 30, 0.5);\n}\n\n.sy-button.danger {\n    border-color: rgba(255, 130, 110, 0.7);\n    background: rgba(110, 40, 30, 0.5);\n}\n\n.shipyard-message {\n    position: absolute;\n    bottom: 24px;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 8px 16px;\n    border: 1px solid rgba(140, 180, 255, 0.5);\n    background: rgba(10, 20, 40, 0.95);\n    opacity: 0;\n    transition: opacity 0.2s;\n    pointer-events: none;\n}\n\n.shipyard-message.visible {\n    opacity: 1;\n}\n\n.drag-ghost {\n    position: fixed !important;\n    z-index: 30;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .shipyard-body {\n        grid-template-columns: 1fr;\n        grid-template-rows: none;\n        overflow-y: auto;\n    }\n\n    .hull-canvas-wrap {\n        min-height: 260px;\n    }\n\n    .ship-stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n\n.hud-bar.cargo .hud-bar-fill {\n    background: #c8aaff;\n}\n\n.menu-tip {\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n/* ---------------------------------------------------------------- Shipyard tabs & market */\n\n.shipyard-tabs {\n    display: flex;\n    gap: 4px;\n}\n\n.sy-tab {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #9fb2d8;\n    background: transparent;\n    border: 1px solid rgba(140, 180, 255, 0.3);\n    padding: 5px 14px;\n    cursor: pointer;\n}\n\n.sy-tab.active {\n    color: #dfe9ff;\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.3);\n}\n\n.shipyard-market {\n    flex: 1;\n    padding: 12px;\n    min-height: 0;\n    overflow-y: auto;\n}\n\n.market-panel {\n    max-width: 720px;\n    margin: 0 auto;\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n.market-panel .muted {\n    color: #9fb2d8;\n}\n\n.market-warning {\n    color: #ffc98a;\n}\n\n.market-section {\n    margin-top: 20px !important;\n}\n\n.market-table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 10px 0 14px;\n}\n\n.market-table th {\n    text-align: left;\n    font-family: Bungee, sans-serif;\n    font-weight: normal;\n    font-size: 11px;\n    color: #9fc0ff;\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.3);\n}\n\n.market-table td {\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.1);\n}\n\n.market-table tr.empty td {\n    color: #6c7a99;\n}\n\n.material-name {\n    font-family: Bungee, sans-serif;\n}\n\n.swatch {\n    display: inline-block;\n    width: 10px;\n    height: 10px;\n    margin-right: 8px;\n    transform: rotate(45deg);\n}\n\n/* ---------------------------------------------------------------- Shield toggle */\n\n.shield-button {\n    position: fixed;\n    top: 12px;\n    left: 50%;\n    transform: translateX(-50%);\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 16px;\n    color: #dff4ff;\n    background: rgba(10, 30, 60, 0.75);\n    border: 1px solid rgba(120, 210, 255, 0.8);\n    box-shadow: 0 0 10px rgba(120, 210, 255, 0.45);\n    cursor: pointer;\n}\n\n.shield-button.down {\n    color: #ffd9a0;\n    border-color: rgba(255, 190, 110, 0.8);\n    box-shadow: 0 0 10px rgba(255, 170, 80, 0.35);\n}\n\n.shield-button.depleted {\n    color: #ff9c8a;\n    border-color: rgba(255, 110, 90, 0.8);\n    box-shadow: none;\n}\n\n.shield-button.none {\n    opacity: 0.5;\n}\n\n/* ---------------------------------------------------------------- Cargo hold */\n\n.cargo-button {\n    position: fixed;\n    top: 12px;\n    right: 16px;\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 14px;\n    color: #eadcff;\n    background: rgba(30, 15, 60, 0.75);\n    border: 1px solid rgba(200, 170, 255, 0.8);\n    box-shadow: 0 0 10px rgba(200, 170, 255, 0.35);\n    cursor: pointer;\n}\n\n.cargo-panel {\n    position: fixed;\n    top: 52px;\n    right: 16px;\n    z-index: 7;\n    width: 320px;\n    max-width: calc(100vw - 32px);\n    padding: 10px 12px;\n    color: #dfe9ff;\n    font-family: sans-serif;\n    font-size: 12px;\n    background: rgba(5, 12, 26, 0.92);\n    border: 1px solid rgba(200, 170, 255, 0.6);\n    box-shadow: 0 0 14px rgba(200, 170, 255, 0.25);\n}\n\n.cargo-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    margin-bottom: 6px;\n}\n\n.cargo-capacity {\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.5);\n    margin-bottom: 4px;\n}\n\n.cargo-capacity-fill {\n    height: 100%;\n    background: #c8aaff;\n}\n\n.cargo-sub {\n    color: #9fb2d8;\n    margin: 4px 0;\n}\n\n.cargo-panel table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 6px 0;\n}\n\n.cargo-panel td {\n    padding: 4px 2px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.12);\n    white-space: nowrap;\n}\n\n.cargo-panel td:first-child {\n    font-family: Bungee, sans-serif;\n    font-size: 11px;\n}\n\n.cargo-panel button {\n    font-family: Bungee, sans-serif;\n    font-size: 10px;\n    margin-left: 3px;\n    padding: 2px 6px;\n    color: #ffd9cc;\n    background: rgba(110, 40, 30, 0.5);\n    border: 1px solid rgba(255, 140, 110, 0.6);\n    cursor: pointer;\n}\n\n.cargo-panel .cargo-header button {\n    font-size: 14px;\n    color: #dfe9ff;\n    background: transparent;\n    border: none;\n}\n\n.cargo-panel .cargo-eject-all {\n    width: 100%;\n    margin: 6px 0 0;\n    padding: 5px;\n}\n", ""]);

// exports


/***/ }),
/* 21 */
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
/* 22 */
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

var	fixUrls = __webpack_require__(23);

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
/* 23 */
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