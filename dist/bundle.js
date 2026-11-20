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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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
// Shared physics helpers for an open, endless zero-gravity world.
// Units: pixels and seconds. World coordinates are unbounded; the camera follows the ship.

// Gravitational constant, tuned for gameplay. Mass of an asteroid is its area (r^2),
// so a large asteroid pulls noticeably harder than a small one.
const G = 150;
/* unused harmony export G */


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
/* harmony export (immutable) */ __webpack_exports__["c"] = world;


const delta = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });
/* harmony export (immutable) */ __webpack_exports__["a"] = delta;


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
/* harmony export (immutable) */ __webpack_exports__["b"] = gravityAt;



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines, { rect: [x1, y1, x2, y2] } or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// rcs:       where manoeuvring jets sit (nose x, tail x, half width)
// shield:    shield bubble ellipse

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);
const rect = (x1, y1, x2, y2) => ({ rect: [x1, y1, x2, y2] });
const line = (x1, y1, x2, y2) => ({ pts: [[x1, y1], [x2, y2]] });
const mirrorRect = (x1, y1, x2, y2) => [rect(x1, y1, x2, y2), rect(x1, -y1, x2, -y2)];
const mirrorLine = (x1, y1, x2, y2) => [line(x1, y1, x2, y2), line(x1, -y1, x2, -y2)];
const row = (xs, y, r) => xs.map(x => [x, y, r]);

const HULLS = {
    x302: {
        id: 'x302',
        name: 'X-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter. Few mounts, tiny cargo hold, very agile.',
        cost: 0,
        color: '225,235,255',
        mass: 1,
        hull: 60,
        baseShield: 0,
        cargo: 12,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 20,
        art: [
            { closed: true, pts: [[20, 0], [15, -3], [-14, -3], [-16, -2], [-16, 2], [-14, 3], [15, 3]] },
            { closed: true, pts: [[6, -3], [-5, -14], [-12, -14], [-10, -3]] },
            { closed: true, pts: mirror([[6, -3], [-5, -14], [-12, -14], [-10, -3]]) },
            rect(12, -1.5, 6, 1.5),
            line(-2, -3, -2, 3),
            ...mirrorRect(2, -3, -9, -5),
            ...mirrorLine(-6, -9, -11, -9)
        ],
        slots: [
            { id: 'c', x: -8, y: 0 },
            { id: 'wl', x: -7, y: -10 },
            { id: 'wr', x: -7, y: 10 }
        ],
        engines: [{ x: -16, y: -1.5, size: 0.6 }, { x: -16, y: 1.5, size: 0.6 }],
        colliders: [[10, 0, 6], [-4, 0, 7], [-8, -9, 6], [-8, 9, 6]],
        rcs: { nose: 14, tail: -13, half: 9 },
        shield: { x: -1, rx: 24, ry: 20 }
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser. Boxy hull, raised bridge and twin engine pods.',
        cost: 2500,
        color: '205,225,255',
        mass: 3,
        hull: 160,
        baseShield: 0,
        cargo: 45,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 50,
        art: [
            { closed: true, pts: [[46, -3], [40, -10], [-36, -10], [-36, 10], [40, 10], [46, 3]] },
            ...mirrorRect(-12, -14, -46, -21),
            ...mirrorRect(-18, -10, -24, -14),
            ...mirrorRect(-34, -10, -40, -14),
            ...mirrorRect(-46, -15.5, -49, -19.5),
            rect(-36, -5, -41, 5),
            rect(12, -5, -6, 5),
            rect(8, -2.5, -2, 2.5),
            line(34, -10, 34, 10), line(20, -10, 20, 10), line(-20, -10, -20, 10),
            ...mirrorLine(40, -6, 22, -6),
            ...mirrorLine(-14, -17.5, -44, -17.5)
        ],
        slots: [
            { id: 'bow', x: 28, y: 0 },
            { id: 'bridge', x: 3, y: 0 },
            { id: 'ml', x: -14, y: -5 },
            { id: 'mr', x: -14, y: 5 },
            { id: 'nl', x: -29, y: -17.5 },
            { id: 'nr', x: -29, y: 17.5 }
        ],
        engines: [{ x: -49, y: -17.5, size: 1 }, { x: -49, y: 17.5, size: 1 }, { x: -41, y: 0, size: 0.8 }],
        colliders: row([40, 26, 12, -2, -16, -30], 0, 10)
            .concat(row([-18, -30, -42], -17.5, 5), row([-18, -30, -42], 17.5, 5)),
        rcs: { nose: 42, tail: -42, half: 22 },
        shield: { x: -1, rx: 58, ry: 34 }
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space carrier: twin hangar bays (big cargo hold) and Asgard shielding.',
        cost: 6000,
        color: '210,230,255',
        mass: 5,
        hull: 260,
        baseShield: 30,
        cargo: 90,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 64,
        art: [
            { closed: true, pts: [[50, -3], [46, -9], [-50, -9], [-50, 9], [46, 9], [50, 3]] },
            { closed: true, pts: [[60, -13], [64, -17], [64, -21], [60, -25], [-32, -25], [-32, -13]] },
            { closed: true, pts: mirror([[60, -13], [64, -17], [64, -21], [60, -25], [-32, -25], [-32, -13]]) },
            { pts: [[58, -15], [44, -15], [44, -23], [58, -23]] },
            { pts: mirror([[58, -15], [44, -15], [44, -23], [58, -23]]) },
            ...mirrorLine(24, -13, 24, -25), ...mirrorLine(4, -13, 4, -25), ...mirrorLine(-16, -13, -16, -25),
            ...mirrorRect(28, -9, 20, -13),
            ...mirrorRect(-10, -9, -18, -13),
            rect(-18, -5, -34, 5),
            line(-21, -3, -21, 3),
            line(38, -9, 38, 9), line(14, -9, 14, 9), line(-6, -9, -6, 9),
            rect(-50, -6, -55, -1), rect(-50, 1, -55, 6),
            ...mirrorRect(-32, -16, -36, -22)
        ],
        slots: [
            { id: 'bl1', x: 34, y: -19 },
            { id: 'br1', x: 34, y: 19 },
            { id: 'bl2', x: -6, y: -19 },
            { id: 'br2', x: -6, y: 19 },
            { id: 'nose', x: 28, y: 0 },
            { id: 'mid', x: 4, y: 0 },
            { id: 'bridge', x: -26, y: 0 },
            { id: 'aft', x: -43, y: 0 }
        ],
        engines: [{ x: -55, y: -3.5, size: 1.1 }, { x: -55, y: 3.5, size: 1.1 }, { x: -36, y: -19, size: 0.9 }, { x: -36, y: 19, size: 0.9 }],
        colliders: row([42, 28, 14, 0, -14, -28, -42], 0, 9)
            .concat(row([56, 40, 24, 8, -8, -24], -19, 7), row([56, 40, 24, 8, -8, -24], 19, 7)),
        rcs: { nose: 56, tail: -52, half: 26 },
        shield: { x: 2, rx: 72, ry: 40 }
    },

    hatak: {
        id: 'hatak',
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Massive pyramid warship. Huge hold, tough and shielded, slow to turn.',
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
        radius: 60,
        art: [
            { closed: true, pts: [[46, -18], [18, -46], [-18, -46], [-46, -18], [-46, 18], [-18, 46], [18, 46], [46, 18]] },
            { closed: true, pts: [[46, -10], [58, -6], [58, 6], [46, 10]] },
            rect(28, -28, -28, 28),
            rect(16, -16, -16, 16),
            line(16, -16, -16, 16), line(-16, -16, 16, 16),
            line(28, 0, 46, 0), line(0, -28, 0, -46), line(-28, 0, -46, 0), line(0, 28, 0, 46),
            line(28, -28, 32, -32), line(-28, -28, -32, -32), line(-28, 28, -32, 32), line(28, 28, 32, 32),
            ...mirrorRect(-46, -12, -51, -4),
            ...mirrorRect(36, -40, 26, -32)
        ],
        slots: [
            { id: 'top', x: 0, y: 0 },
            { id: 'fl', x: 37, y: -11 },
            { id: 'fr', x: 37, y: 11 },
            { id: 'pl', x: 12, y: -37 },
            { id: 'pr', x: 12, y: 37 },
            { id: 'al', x: -22, y: -36 },
            { id: 'ar', x: -22, y: 36 },
            { id: 'sl', x: -37, y: -11 },
            { id: 'sr', x: -37, y: 11 }
        ],
        engines: [{ x: -51, y: -8, size: 1.3 }, { x: -51, y: 8, size: 1.3 }],
        colliders: [[0, 0, 30], [36, 0, 13], [26, -26, 13], [0, -36, 13], [-26, -26, 13], [-36, 0, 13],
            [-26, 26, 13], [0, 36, 13], [26, 26, 13], [54, 0, 6]],
        rcs: { nose: 50, tail: -48, half: 44 },
        shield: { x: 2, rx: 64, ry: 58 }
    },

    asgard: {
        id: 'asgard',
        name: 'Asgard',
        className: "O'Neill-class",
        faction: 'Asgard',
        description: 'Pinnacle of Asgard engineering. Fast, strong shields, many mounts.',
        cost: 12000,
        color: '170,240,255',
        mass: 5,
        hull: 300,
        baseShield: 100,
        cargo: 80,
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 80,
        art: [
            { closed: true, pts: [[80, 0], [66, -10], [60, -30], [40, -30], [34, -8], [-24, -8], [-44, -36], [-66, -36],
                [-60, -8], [-74, -8], [-74, 8], [-60, 8], [-66, 36], [-44, 36], [-24, 8], [34, 8],
                [40, 30], [60, 30], [66, 10]] },
            rect(66, -4, 46, 4),
            ...mirrorLine(40, -30, 44, -8),
            ...mirrorLine(60, -30, 56, -10),
            line(20, -8, 20, 8), line(-12, -8, -12, 8),
            rect(10, -5, -8, 5),
            { circle: [1, 0, 2.5] },
            ...mirrorLine(-30, -8, -48, -32),
            ...mirrorLine(-60, -8, -62, -30),
            ...mirrorRect(-74, -6, -78, -1)
        ],
        slots: [
            { id: 'nose', x: 56, y: 0 },
            { id: 'hl', x: 50, y: -20 },
            { id: 'hr', x: 50, y: 20 },
            { id: 'fwd', x: 27, y: 0 },
            { id: 'core', x: 1, y: 0 },
            { id: 'aft', x: -24, y: 0 },
            { id: 'fl', x: -52, y: -24 },
            { id: 'fr', x: -52, y: 24 },
            { id: 'tail', x: -66, y: 0 }
        ],
        engines: [{ x: -78, y: -3.5, size: 1.2 }, { x: -78, y: 3.5, size: 1.2 }, { x: -64, y: -33, size: 0.8 }, { x: -64, y: 33, size: 0.8 }],
        colliders: row([70, 56, 42, 28, 14, 0, -14, -28, -42, -56, -70], 0, 9)
            .concat([[50, -20, 10], [50, 20, 10], [-52, -24, 10], [-52, 24, 10]]),
        rcs: { nose: 72, tail: -72, half: 32 },
        shield: { x: 2, rx: 90, ry: 46 }
    }
};

const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard'];
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


/* harmony default export */ __webpack_exports__["b"] = (HULLS);


/***/ }),
/* 4 */
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
        stats: { fireRate: [12, 16, 21], damage: [1, 1.3, 1.7] },
        describe: (s) => s.fireRate + ' rounds/s, ' + s.damage + ' dmg'
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

const MODULE_ORDER = ['minigun', 'missile', 'engine', 'shield', 'guidance', 'cargo', 'magnet', 'armor'];
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
        offsets.forEach(o => line(0, o, 9, o));
        ctx.restore();
        circle(3.6, true);
        circle(1.2);
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
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__world_materials__ = __webpack_require__(0);
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
/* harmony export (immutable) */ __webpack_exports__["l"] = selectHull;


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
/* harmony export (immutable) */ __webpack_exports__["q"] = upgradeModule;


const sellModule = (hullId, slotId) => {
    const loadout = loadoutFor(hullId);
    const module = loadout[slotId];
    if(!module) return false;
    profile.credits += Object(__WEBPACK_IMPORTED_MODULE_1__modules__["f" /* sellValue */])(module.type, module.level);
    delete loadout[slotId];
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["n"] = sellModule;


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
        if(module.type === 'magnet') stats.magnetRange = Math.max(stats.magnetRange, s.range);
        if(module.type === 'guidance') {
            if(!stats.guidance || s.range > stats.guidance.range) stats.guidance = s;
        }
    });

    stats.acceleration = stats.thrustForce / stats.mass;
    stats.angularAcceleration = stats.torqueForce / stats.mass;
    stats.maxTurn = hull.maxTurn * Math.min(1.6, Math.sqrt(stats.angularAcceleration / hull.torque));
    stats.weapons = stats.modules.filter(m => m.type === 'minigun' || m.type === 'missile').length;

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
/* harmony export (immutable) */ __webpack_exports__["p"] = storeOre;


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
/* harmony export (immutable) */ __webpack_exports__["m"] = sellCargo;


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
/* harmony export (immutable) */ __webpack_exports__["o"] = spendCredits;



/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(0);


// Asteroids are described by their area (mass) and composition. Weapon hits chip
// area away (dropping ore), build up stress until a chunk breaks off, and the last
// bits crumble. Colliding asteroids merge into one.

const CHIP_AREA_PER_DAMAGE = 22;  // area removed per point of weapon damage
const ORE_AREA = 140;             // area of rock that yields one ore piece
const MIN_RADIUS = 8;             // smaller than this and the asteroid crumbles
const MIN_SPLIT_RADIUS = 16;      // only asteroids at least this big break apart
const SPLIT_GRACE = 1.2;          // seconds a fresh fragment won't merge
const MAX_MERGE_RADIUS = 110;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_MERGE_RADIUS;


let nextId = 1;

const randomShape = (random) => {
    const rnd = random || Math.random;
    const count = 12;
    const points = [];
    for(let i = 0; i < count; i++) {
        points.push({ angle: (i / count) * Math.PI * 2, factor: 0.78 + rnd() * 0.22 });
    }
    return points;
};

const normalizeComposition = (composition) => {
    const total = Object.keys(composition).reduce((sum, id) => sum + composition[id], 0) || 1;
    const result = {};
    Object.keys(composition).forEach(id => {
        if(composition[id] / total > 0.001) result[id] = composition[id] / total;
    });
    return result;
};

class Rock {

    constructor(options) {
        this.id = nextId++;
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.setArea(options.radius * options.radius);
        this.composition = normalizeComposition(options.composition || { rock: 1 });
        this.angle = (options.random || Math.random)() * Math.PI * 2;
        this.spin = ((options.random || Math.random)() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.stress = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.shape = options.shape || randomShape(options.random);
        this.updateLook(options.random);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    // Colour veins and stroke tint from the composition.
    updateLook(random) {
        const rnd = random || Math.random;
        this.material = Object(__WEBPACK_IMPORTED_MODULE_0__world_materials__["c" /* dominantMaterial */])(this.composition);
        this.veins = [];
        Object.keys(this.composition).forEach(id => {
            if(id === 'rock') return;
            const count = Math.round(2 + this.composition[id] * 10);
            for(let i = 0; i < count; i++) {
                const angle = rnd() * Math.PI * 2;
                const distance = Math.sqrt(rnd()) * 0.65;
                this.veins.push({
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    length: 0.08 + rnd() * 0.18,
                    angle: rnd() * Math.PI,
                    color: __WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color
                });
            }
        });
    }

    // Weapon hit at a world point. Returns { ore: [...materialIds], fragment, crumbled }.
    chip(damage, hitX, hitY) {
        const result = { ore: [], fragment: null, crumbled: false };
        if(this.dead) return result;

        const removed = Math.min(this.area, damage * CHIP_AREA_PER_DAMAGE);
        this.setArea(this.area - removed);
        this.oreProgress += removed;
        this.stress += damage;
        this.flash = 0.05;

        // Dent the outline where the hit landed.
        const hitAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        this.dent(hitAngle, 0.94, 0.6);

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

        // Enough accumulated stress cracks a chunk off the side that was hit.
        if(this.stress >= 4 + this.radius * 0.35 && this.radius >= MIN_SPLIT_RADIUS) {
            this.stress = 0;
            result.fragment = this.breakOff(Math.atan2(hitY - this.y, hitX - this.x));
        }
        return result;
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

    dent(localAngle, factor, minimum) {
        let nearest = 0;
        let nearestDiff = Infinity;
        this.shape.forEach((point, i) => {
            let diff = Math.abs(point.angle - localAngle) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < nearestDiff) {
                nearestDiff = diff;
                nearest = i;
            }
        });
        const p = this.shape[nearest];
        p.factor = Math.max(minimum, p.factor * factor);
    }

    // Splits off a chunk on the side facing `worldAngle`, conserving momentum.
    breakOff(worldAngle) {
        const share = 0.25 + Math.random() * 0.15;
        const fragmentArea = this.area * share;
        const dirX = Math.cos(worldAngle);
        const dirY = Math.sin(worldAngle);
        const perpendicular = (Math.random() - 0.5) * 60;
        const kick = 90 + Math.random() * 60;

        const fragment = new Rock({
            x: this.x + dirX * this.radius * 0.6,
            y: this.y + dirY * this.radius * 0.6,
            vx: this.vx + dirX * kick - dirY * perpendicular,
            vy: this.vy + dirY * kick + dirX * perpendicular,
            radius: Math.sqrt(fragmentArea),
            composition: Object.assign({}, this.composition),
            grace: SPLIT_GRACE
        });

        this.setArea(this.area - fragmentArea);
        const ratio = fragmentArea / this.area;
        this.vx -= (dirX * kick - dirY * perpendicular) * ratio;
        this.vy -= (dirY * kick + dirX * perpendicular) * ratio;
        this.x -= dirX * this.radius * 0.15;
        this.y -= dirY * this.radius * 0.15;
        this.grace = SPLIT_GRACE;

        // Flatten the broken face.
        const localAngle = worldAngle - this.angle;
        for(let i = -2; i <= 2; i++) this.dent(localAngle + i * 0.4, 0.75, 0.55);

        return fragment;
    }

    // Absorb another asteroid: area, momentum, spin and composition combine.
    merge(other) {
        const total = this.area + other.area;
        const wa = this.area / total;
        const wb = other.area / total;

        this.x = this.x * wa + other.x * wb;
        this.y = this.y * wa + other.y * wb;
        this.vx = this.vx * wa + other.vx * wb;
        this.vy = this.vy * wa + other.vy * wb;
        this.spin = this.spin * wa + other.spin * wb;

        const composition = {};
        [[this, wa], [other, wb]].forEach(pair => {
            Object.keys(pair[0].composition).forEach(id => {
                composition[id] = (composition[id] || 0) + pair[0].composition[id] * pair[1];
            });
        });
        this.composition = normalizeComposition(composition);
        this.setArea(total);
        this.oreProgress += other.oreProgress;
        this.flash = 0.1;

        // Soften dents a little: the impact rounds things out.
        this.shape.forEach(p => { p.factor = Math.min(1, p.factor + 0.08); });
        this.updateLook();
        other.dead = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.spin * dt;
        if(this.grace > 0) this.grace -= dt;
        if(this.flash > 0) this.flash -= dt;
    }

    // Faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3.5;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 180, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(140, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        const { shape, radius } = this;
        const tint = __WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][this.material].color;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        shape.forEach((p, i) => {
            const x = Math.cos(p.angle) * radius * p.factor;
            const y = Math.sin(p.angle) * radius * p.factor;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();

        ctx.fillStyle = this.flash > 0 ? 'rgba(200, 200, 210, 0.95)' : 'rgba(62, 62, 72, 0.95)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(' + tint + ', 0.9)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(' + tint + ', 0.8)';
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, radius * 0.06);
        ctx.lineCap = 'round';
        this.veins.forEach(vein => {
            const cx = vein.x * radius;
            const cy = vein.y * radius;
            const hx = Math.cos(vein.angle) * vein.length * radius;
            const hy = Math.sin(vein.angle) * vein.length * radius;
            ctx.strokeStyle = 'rgba(' + vein.color + ', 0.9)';
            ctx.shadowColor = 'rgba(' + vein.color + ', 0.9)';
            ctx.beginPath();
            ctx.moveTo(cx - hx, cy - hy);
            ctx.lineTo(cx + hx, cy + hy);
            ctx.stroke();
        });

        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["b"] = (Rock);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__world_materials__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__modules__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__profile__ = __webpack_require__(5);
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
                const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["m" /* sellCargo */])(id);
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
            const earned = Object(__WEBPACK_IMPORTED_MODULE_3__profile__["m" /* sellCargo */])();
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
                    if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["o" /* spendCredits */])(affordable * __WEBPACK_IMPORTED_MODULE_3__profile__["a" /* REPAIR_COST_PER_HP */])) {
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
                    Object(__WEBPACK_IMPORTED_MODULE_3__profile__["l" /* selectHull */])(id);
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
                if(Object(__WEBPACK_IMPORTED_MODULE_3__profile__["q" /* upgradeModule */])(hull.id, this.selectedSlot)) this.flash(def.short + ' upgraded!');
                this.refresh();
            });
            actions.appendChild(upgrade);
        } else {
            box.appendChild(el('div', 'inspector-next', 'Max level (Mk ' + ['I', 'II', 'III'][__WEBPACK_IMPORTED_MODULE_2__modules__["a" /* MAX_LEVEL */] - 1] + ')'));
        }

        const sell = el('button', 'sy-button small danger', 'Sell +' + formatCredits(Object(__WEBPACK_IMPORTED_MODULE_2__modules__["f" /* sellValue */])(module.type, module.level)));
        sell.addEventListener('click', () => {
            Object(__WEBPACK_IMPORTED_MODULE_3__profile__["n" /* sellModule */])(hull.id, this.selectedSlot);
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
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scripts_shipyard_shipyard__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__styles_main_css__ = __webpack_require__(18);
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
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ore_ore__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__audio_audio__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__world_materials__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__world_sectors__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__world_station__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__shipyard_profile__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__shipyard_shipyard__ = __webpack_require__(7);













const STEP = 1 / 120;             // fixed physics timestep (frame-rate independent)
const MAX_STEPS_PER_FRAME = 8;
const MAX_PARTICLES = 2000;
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
    cargoText: document.getElementById('cargoText')
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
    const ship = new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* default */](__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x + __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].dockRadius + 60, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y, Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["e" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().hull));
    ship.angle = 0;
    return {
        ship: ship,
        rocks: [],
        newRocks: [],
        bullets: [],
        missiles: [],
        particles: [],
        ores: [],
        floatingTexts: [],
        sectors: new __WEBPACK_IMPORTED_MODULE_8__world_sectors__["a" /* SectorManager */](Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["f" /* getProfile */])().seed),
        sectorTimer: 0,
        camera: { x: ship.x, y: ship.y },
        time: 0,
        bannerText: 'Undocked. Happy mining!',
        bannerTimer: 2.5,
        cargoFullTimer: 0,
        canDock: false,
        gameOverTimer: 0,
        paused: false,
        docked: false
    };
};

const resize = () => {
    pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].resize(window.innerWidth, window.innerHeight);
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
    setBar('cargoBar', used / ship.cargoCapacity);
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

const applyGravity = (dt) => {
    const { rocks, ship, bullets, missiles, ores } = state;

    // Compute every rock's acceleration before changing any velocity.
    const accelerations = rocks.map(rock => Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* gravityAt */])(rock, rocks));
    rocks.forEach((rock, i) => {
        rock.vx += accelerations[i].x * dt;
        rock.vy += accelerations[i].y * dt;
    });

    const pull = (body) => {
        const a = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["b" /* gravityAt */])(body, rocks);
        body.vx += a.x * dt;
        body.vy += a.y * dt;
    };

    if(ship.alive) pull(ship);
    bullets.forEach(pull);
    missiles.forEach(pull);
    ores.forEach(pull);
};

// Weapon damage chips the asteroid: area turns into ore, stress cracks chunks off.
const hitRock = (rock, damage, hitX, hitY) => {
    if(rock.dead) return;
    const result = rock.chip(damage, hitX, hitY);

    const out = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(rock, { x: hitX, y: hitY });
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

    if(result.fragment) {
        state.newRocks.push(result.fragment);
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, (rock.x + result.fragment.x) / 2, (rock.y + result.fragment.y) / 2,
            rock.vx, rock.vy, 16, { minSpeed: 30, maxSpeed: 130, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '220,220,230' });
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].explosion(0.35);
    }

    if(result.crumbled) {
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, rock.x, rock.y, rock.vx, rock.vy, 14, {
            minSpeed: 20, maxSpeed: 100, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '200,200,210'
        });
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].explosion(0.3);
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
            if(rock.dead) continue;
            const dx = bullet.x - rock.x;
            const dy = bullet.y - rock.y;
            if(dx * dx + dy * dy > rock.radius * rock.radius) continue;

            bullet.dead = true;
            // Bullets carry momentum and nudge the rock.
            rock.vx += bullet.vx * bullet.mass / rock.mass;
            rock.vy += bullet.vy * bullet.mass / rock.mass;
            __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].rockHit();
            hitRock(rock, bullet.damage, bullet.x, bullet.y);
            return;
        }
    });
};

const explodeMissile = (missile) => {
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.2, missile.vy * 0.2, 30, {
        minSpeed: 40, maxSpeed: missile.blast * 3, minLife: 0.2, maxLife: 0.6, size: 3, color: '255,160,80'
    });
    __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].explosion(0.5);

    state.rocks.forEach(rock => {
        if(rock.dead) return;
        const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(missile, rock);
        const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
        const reach = missile.blast + rock.radius;
        if(distance > reach) return;

        const falloff = 1 - distance / reach;
        rock.vx += d.x / distance * MISSILE_PUSH * falloff / rock.mass;
        rock.vy += d.y / distance * MISSILE_PUSH * falloff / rock.mass;
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
                const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(rock, missile);
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

// Asteroids pulled together by gravity merge into one when they touch.
const rockCollisions = () => {
    const { rocks, particles } = state;

    for(let i = 0; i < rocks.length; i++) {
        const a = rocks[i];
        if(a.dead) continue;

        for(let j = i + 1; j < rocks.length; j++) {
            const b = rocks[j];
            if(b.dead) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const reach = (a.radius + b.radius) * 0.9;
            const distSq = dx * dx + dy * dy;
            if(distSq > reach * reach) continue;

            const distance = Math.sqrt(distSq) || 0.001;
            const normalX = dx / distance;
            const normalY = dy / distance;
            const combinedRadius = Math.sqrt(a.area + b.area);

            // Fresh fragments and asteroids that would get too big just bump.
            if(a.grace > 0 || b.grace > 0 || combinedRadius > __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["a" /* MAX_MERGE_RADIUS */]) {
                resolveImpact(a, b, normalX, normalY, reach - distance, ROCK_BOUNCE);
                continue;
            }

            const contactX = a.x + normalX * a.radius;
            const contactY = a.y + normalY * a.radius;
            const bigger = a.area >= b.area ? a : b;
            const smaller = bigger === a ? b : a;
            bigger.merge(smaller);

            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, contactX, contactY, bigger.vx, bigger.vy, 18, {
                minSpeed: 20, maxSpeed: 110, minLife: 0.3, maxLife: 0.9, size: 2.5, color: '210,200,190'
            });
            __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].explosion(0.25);
            if(a.dead) break;
        }
    }
};

const shipCollisions = () => {
    const { ship, rocks, particles } = state;
    if(!ship.alive) return;

    rocks.forEach(rock => {
        if(rock.dead) return;

        // Broad phase against the whole hull first.
        const center = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(ship, rock);
        const reach = ship.radius + rock.radius;
        if(center.x * center.x + center.y * center.y > reach * reach) return;

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rock.radius * 0.85 - distance;
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

const collectOre = (dt) => {
    const ship = state.ship;
    const cargoFull = Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["c" /* cargoUsed */])() >= ship.cargoCapacity;
    if(state.cargoFullTimer > 0) state.cargoFullTimer -= dt;

    state.ores.forEach(ore => {
        if(ore.dead) return;
        if(!ore.update(dt, ship, !cargoFull)) return;

        if(Object(__WEBPACK_IMPORTED_MODULE_10__shipyard_profile__["p" /* storeOre */])(ore.material, ship.cargoCapacity)) {
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
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].aimX = __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseX - __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2 + state.camera.x;
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].aimY = __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].mouseY - __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 2 + state.camera.y;

    ship.update(dt, __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */], state);
    applyGravity(dt);

    state.rocks.forEach(rock => rock.update(dt));
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
    const w = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width;
    const h = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height;
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
    const halfW = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2 + r;
    const halfH = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 2 + r;
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
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.font = '30px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 4);
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
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText(text, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height - 60);
    ctx.restore();
};

// Edge-of-screen pointer to the shipyard when it's out of view.
const drawStationPointer = () => {
    const sx = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x - state.camera.x + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2;
    const sy = __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y - state.camera.y + __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 2;
    const margin = 40;
    if(sx > -100 && sx < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width + 100 && sy > -100 && sy < __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height + 100) return;

    const cx = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2;
    const cy = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 2;
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

const drawMinimap = () => {
    const size = MINIMAP_SIZE;
    const left = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width - size - 16;
    const top = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height - size - 16;
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
        ctx.fillStyle = 'rgb(' + __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][rock.material].color + ')';
        const r = Math.max(1.2, rock.radius * scale * 1.5);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });

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
    ctx.fillText('SCANNER ' + (MINIMAP_RANGE / 1000).toFixed(1) + 'k', left + 6, top + 14);
    ctx.restore();
};

const render = () => {
    const time = state.time;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height);
    drawStarfield();

    ctx.save();
    ctx.translate(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].width / 2 - state.camera.x, __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height / 2 - state.camera.y);

    if(isVisible(__WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].x, __WEBPACK_IMPORTED_MODULE_9__world_station__["a" /* STATION */].y, 300)) Object(__WEBPACK_IMPORTED_MODULE_9__world_station__["b" /* drawStation */])(ctx, time, state.canDock);

    const visibleRocks = state.rocks.filter(rock => isVisible(rock.x, rock.y, rock.radius * 3.5));
    visibleRocks.forEach(rock => rock.drawGravityWell(ctx));
    visibleRocks.forEach(rock => rock.draw(ctx));
    state.ores.forEach(ore => { if(isVisible(ore.x, ore.y, 10)) ore.draw(ctx, time); });
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => { if(isVisible(particle.x, particle.y, 10)) particle.draw(ctx); });
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
    ctx.restore();

    drawStationPointer();
    drawMinimap();
    drawDockPrompt();
    if(!state.paused) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- loop & menus

const freeze = (frozen) => {
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
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
        __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].setFiring(state.ship.alive && state.ship.firing);
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

    resize();
    state = createState();
    state.rocks = state.sectors.update(state.ship.x, state.ship.y, []);
    pauseMenu.style.visibility = 'hidden';
    freeze(false);
    frameId = requestAnimationFrame(frame);
};

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__missile_missile__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shipyard_modules__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__physics_physics__ = __webpack_require__(2);







// Zero-g flight model: thrusters change velocity, nothing slows you down
// except firing thrusters the other way (or the X stabilizer).
const SECONDARY_THRUST = 0.55;    // retro / strafe thrust relative to main engines
const MAX_SPEED = 600;            // px/s, safety cap only
const MASS_UNIT = 300;            // physics mass per hull mass point

const BULLET_SPEED = 850;
const BULLET_SPREAD = 0.035;
const RECOIL = 3.5;               // px/s per bullet for a mass-1 hull
const TURRET_TURN_RATE = 14;      // rad/s
const MISSILE_SALVO_GAP = 0.12;   // s between launchers firing
const MISSILE_LOCK_RADIUS = 150;  // px around the cursor

const HIT_COOLDOWN = 0.25;
const SHIELD_REGEN_DELAY = 2;
const SPAWN_IMMUNITY = 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
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
        this.hitCooldown = 0;
        this.immunity = SPAWN_IMMUNITY;
        this.sinceHit = SHIELD_REGEN_DELAY;
        this.shieldFlash = 0;
        this.hullFlash = 0;
        this.missileCooldown = 0;
        this.nextLauncher = 0;
        this.missileLock = null;

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
        this.cargoCapacity = stats.cargo;
        this.magnetRange = stats.magnetRange;
        this.collectRadius = hull.radius * 0.55 + 8;

        const u = hull.moduleScale;
        this.turrets = stats.modules.filter(m => m.type === 'minigun').map(m => ({
            module: m,
            aim: this.angle,
            cooldown: 0,
            target: null,
            flash: 0
        }));
        this.launchers = stats.modules.filter(m => m.type === 'missile').map(m => ({ module: m, cooldown: 0 }));
        this.engines = hull.engines.concat(stats.modules
            .filter(m => m.type === 'engine')
            .map(m => ({ x: m.slot.x - 4 * u, y: m.slot.y, size: (0.45 + m.level * 0.15) * u * 1.6 })));
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
        if(!this.alive) return;

        this.time += dt;
        if(this.hitCooldown > 0) this.hitCooldown -= dt;
        if(this.immunity > 0) this.immunity -= dt;
        if(this.shieldFlash > 0) this.shieldFlash -= dt;
        if(this.hullFlash > 0) this.hullFlash -= dt;
        if(this.missileCooldown > 0) this.missileCooldown -= dt;
        this.sinceHit += dt;

        if(this.sinceHit > SHIELD_REGEN_DELAY && this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.stats.shieldRegen * dt);
        }

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

    // Manoeuvring jet positions, scaled to the hull.
    jets() {
        const r = this.hullDef.rcs;
        return {
            retro: [[r.nose * 0.6, -r.half * 0.45, 1, 0], [r.nose * 0.6, r.half * 0.45, 1, 0]],
            left: [[0, r.half, 0, 1]],
            right: [[0, -r.half, 0, -1]],
            spinCW: [[r.nose * 0.8, -r.half * 0.35, 0, -1], [r.tail * 0.8, r.half * 0.6, 0, 1]],
            spinCCW: [[r.nose * 0.8, r.half * 0.35, 0, 1], [r.tail * 0.8, -r.half * 0.6, 0, -1]]
        };
    }

    jetScale() {
        return Math.max(1, Math.sqrt(this.hullDef.rcs.half / 8));
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
                const spread = (Math.random() - 0.5) * 0.5;
                const speed = (160 + Math.random() * 120) * Math.sqrt(engine.size);
                particles.push(new __WEBPACK_IMPORTED_MODULE_2__particle_particle__["a" /* default */]({
                    x: nozzle.x,
                    y: nozzle.y,
                    vx: this.vx - Math.cos(this.angle + spread) * speed * t.main,
                    vy: this.vy - Math.sin(this.angle + spread) * speed * t.main,
                    life: 0.25 + Math.random() * 0.25,
                    size: (2.5 + Math.random() * 2) * Math.sqrt(engine.size),
                    color: Math.random() < 0.5 ? '255,170,60' : '255,110,40'
                }));
            });
        }

        const jets = this.jets();
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
            const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(from, rock);
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
            turret.target = this.nearestRock(p.x, p.y, rocks, range);
        });
    }

    updateTurrets(dt, input, world) {
        this.firing = false;

        this.turrets.forEach(turret => {
            const stats = turret.module.stats;
            const p = this.localToWorld(turret.module.slot.x, turret.module.slot.y);
            if(turret.cooldown > 0) turret.cooldown -= dt;
            if(turret.flash > 0) turret.flash -= dt;

            // Manual fire always aims at the cursor; otherwise the guidance computer
            // leads the locked target.
            let desired = Math.atan2(input.aimY - p.y, input.aimX - p.x);
            let shouldFire = input.firing;

            if(!input.firing && turret.target) {
                const target = turret.target;
                let d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(p, target);
                const time = Math.sqrt(d.x * d.x + d.y * d.y) / BULLET_SPEED;
                d = { x: d.x + target.vx * time, y: d.y + target.vy * time };
                desired = Math.atan2(d.y, d.x);
                shouldFire = true;
            }

            const diff = angleDifference(turret.aim, desired);
            const maxTurn = TURRET_TURN_RATE * dt;
            turret.aim += clamp(diff, -maxTurn, maxTurn);

            if(!shouldFire || Math.abs(diff) > 0.2) return;
            this.firing = true;

            if(turret.cooldown > 0) return;
            turret.cooldown += 1 / stats.fireRate;
            if(turret.cooldown < 0) turret.cooldown = 0;

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
        });
    }

    updateLaunchers(dt, input, world) {
        this.launchers.forEach(launcher => {
            if(launcher.cooldown > 0) launcher.cooldown -= dt;
        });

        if(!input.firingMissiles || this.missileCooldown > 0 || this.launchers.length === 0) return;

        for(let i = 0; i < this.launchers.length; i++) {
            const index = (this.nextLauncher + i) % this.launchers.length;
            const launcher = this.launchers[index];
            if(launcher.cooldown > 0) continue;

            const stats = launcher.module.stats;
            const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
            const target = this.guidance ? this.missileLock : null;
            const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
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
            this.missileCooldown = MISSILE_SALVO_GAP;
            this.nextLauncher = index + 1;
            return;
        }
    }

    // Returns true if damage was applied.
    takeDamage(amount, particles) {
        if(!this.alive || this.hitCooldown > 0 || this.immunity > 0) return false;

        this.hitCooldown = HIT_COOLDOWN;
        this.sinceHit = 0;

        const absorbed = Math.min(this.shield, amount);
        this.shield -= absorbed;
        const remaining = amount - absorbed;
        if(absorbed > 0) this.shieldFlash = 0.25;

        if(remaining > 0) {
            this.hp -= remaining;
            this.hullFlash = 0.15;
            this.explode(particles, 10 + Math.round(remaining / 2));
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
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

    drawFlame(ctx, x, y, dirX, dirY, length, width, outer, inner) {
        if(length < 0.5) return;
        const nx = -dirY;
        const ny = dirX;

        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.moveTo(x + nx * width, y + ny * width);
        ctx.lineTo(x + dirX * length, y + dirY * length);
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
        const scale = this.jetScale();
        const jetOuter = 'rgba(170, 210, 255, 0.85)';
        const jetInner = 'rgba(255, 255, 255, 0.95)';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        this.engines.forEach(engine => {
            const size = engine.size * (1 + (scale - 1) * 0.6);

            // Idle engine glow, pulsing even when not thrusting.
            const glowRadius = (3 + pulse * 1.5 + t.main * 4) * size * 2;
            const glow = ctx.createRadialGradient(engine.x, engine.y, 0, engine.x, engine.y, glowRadius);
            glow.addColorStop(0, 'rgba(255, 200, 120, ' + (0.6 + t.main * 0.4) + ')');
            glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(engine.x, engine.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Main engine plume.
            const length = t.main * (18 + Math.random() * 12) * size;
            const plume = ctx.createLinearGradient(engine.x, engine.y, engine.x - length, engine.y);
            plume.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
            plume.addColorStop(0.5, 'rgba(255, 130, 40, 0.8)');
            plume.addColorStop(1, 'rgba(255, 60, 20, 0)');
            this.drawFlame(ctx, engine.x, engine.y, -1, 0, length, 4.5 * size * flicker(), plume, 'rgba(255, 255, 230, 0.95)');
        });

        // Manoeuvring jets: retro, strafe and attitude control.
        const jets = this.jets();
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.02) return;
            const length = t[key] * 9 * scale;
            jets[key].forEach(jet => {
                this.drawFlame(ctx, jet[0], jet[1], jet[2], jet[3], length * flicker(), 1.8 * scale, jetOuter, jetInner);
            });
        });

        ctx.restore();
    }

    drawShield(ctx) {
        if(this.maxShield <= 0 || this.shield <= 0) return;
        const s = this.hullDef.shield;
        const strength = this.shield / this.maxShield;
        const alpha = 0.1 + 0.2 * strength + Math.max(0, this.shieldFlash) * 2.5;

        ctx.save();
        ctx.strokeStyle = 'rgba(120, 210, 255, ' + Math.min(1, alpha) + ')';
        ctx.fillStyle = 'rgba(120, 210, 255, ' + Math.min(0.25, alpha * 0.25) + ')';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(120, 210, 255)';
        ctx.beginPath();
        ctx.ellipse(s.x, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
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
        Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["c" /* drawHullArt */])(ctx, this.hullDef, { color: this.hullFlash > 0 ? '255,120,120' : undefined });

        this.stats.modules.forEach(module => {
            if(module.type === 'minigun') return;
            ctx.save();
            ctx.translate(module.slot.x, module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_4__shipyard_modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: u });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_4__shipyard_modules__["d" /* drawModule */])(ctx, 'minigun', turret.module.level, { scale: u, aim: turret.aim - this.angle });
            if(turret.flash > 0) {
                const tip = 9 * u;
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
                ctx.beginPath();
                ctx.arc(Math.cos(turret.aim - this.angle) * tip, Math.sin(turret.aim - this.angle) * tip,
                    (2 + Math.random() * 3) * Math.max(1, u), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        this.drawShield(ctx);
        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["a"] = (Ship);


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const BULLET_LIFE = 1.4;

class Bullet {

    constructor(x, y, vx, vy, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage || 1;
        this.mass = 4;
        this.life = BULLET_LIFE;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if(this.life <= 0) this.dead = true;
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
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(2);



const ACCELERATION = 520;
const MAX_SPEED = 620;
const LIFETIME = 4;
const RETARGET_RANGE = 320;

const angleDifference = (a, b) => {
    let d = b - a;
    while(d > Math.PI) d -= Math.PI * 2;
    while(d < -Math.PI) d += Math.PI * 2;
    return d;
};

class Missile {

    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.angle = options.angle;
        this.damage = options.damage;
        this.blast = options.blast;
        this.target = options.target || null;
        this.homing = options.homing || 0;   // 0 = dumb-fire
        this.life = LIFETIME;
        this.trailTimer = 0;
        this.dead = false;
        this.exploded = false;
    }

    update(dt, rocks, particles) {
        this.life -= dt;
        if(this.life <= 0) {
            this.dead = true;
            this.exploded = true;
            return;
        }

        if(this.homing > 0) {
            if(!this.target || this.target.dead) this.target = this.findTarget(rocks);
            if(this.target) {
                const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["a" /* delta */])(this, this.target);
                const desired = Math.atan2(d.y, d.x);
                const turn = Math.max(-this.homing * dt, Math.min(this.homing * dt, angleDifference(this.angle, desired)));
                this.angle += turn;
            }
        }

        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        this.vx += dirX * ACCELERATION * dt;
        this.vy += dirY * ACCELERATION * dt;

        // Guided missiles use their side thrusters to bleed off sideways drift.
        if(this.homing > 0) {
            const forward = this.vx * dirX + this.vy * dirY;
            const damp = Math.min(1, this.homing * 0.8 * dt);
            this.vx += (dirX * forward - this.vx) * damp;
            this.vy += (dirY * forward - this.vy) * damp;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if(speed > MAX_SPEED) {
            this.vx *= MAX_SPEED / speed;
            this.vy *= MAX_SPEED / speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.trailTimer -= dt;
        if(this.trailTimer <= 0) {
            this.trailTimer = 0.02;
            particles.push(new __WEBPACK_IMPORTED_MODULE_0__particle_particle__["a" /* default */]({
                x: this.x - dirX * 5, y: this.y - dirY * 5,
                vx: this.vx * 0.2 - dirX * 60, vy: this.vy * 0.2 - dirY * 60,
                life: 0.3 + Math.random() * 0.2, size: 2.5, color: '255,150,70'
            }));
        }
    }

    findTarget(rocks) {
        let best = null;
        let bestDist = RETARGET_RANGE * RETARGET_RANGE;
        rocks.forEach(rock => {
            if(rock.dead) return;
            const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["a" /* delta */])(this, rock);
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
        ctx.strokeStyle = 'rgb(255, 160, 140)';
        ctx.lineWidth = 1.3;
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgb(255, 120, 90)';
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
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__world_materials__ = __webpack_require__(0);


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
        this.dead = false;
    }

    // Tractor pull towards the ship when in range. Returns true when collected.
    update(dt, ship, canCollect) {
        this.life -= dt;
        if(this.life <= 0) this.dead = true;

        if(ship && ship.alive && canCollect) {
            const dx = ship.x - this.x;
            const dy = ship.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;

            if(distance < ship.collectRadius) return true;

            if(distance < ship.magnetRange) {
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
        ctx.fillStyle = 'rgba(' + color + ',' + pulse.toFixed(2) + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgb(' + color + ')';
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
/* 14 */
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
/* 15 */
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

// Short synthesized blip for ore pickups (no extra asset needed).
let audioContext = null;
let lastBlip = 0;
const blip = (frequency) => {
    try {
        if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        if(now - lastBlip < 0.04) return;
        lastBlip = now;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, now);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.6, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    } catch(e) {
        // Web Audio unavailable: stay silent.
    }
};

const sounds = {
    pickup(value) { blip(500 + Math.min(700, value * 8)); },
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
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__materials__ = __webpack_require__(0);
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
        rocks.push(new __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__["b" /* default */]({
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
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// The home shipyard station at the centre of the map. Fly close and press B to dock.

const STATION = {
    x: 0,
    y: 0,
    dockRadius: 260,
    maxDockSpeed: 140,
    spin: 0.03
};
/* harmony export (immutable) */ __webpack_exports__["a"] = STATION;


const rect = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    ctx.fill();
    ctx.stroke();
};

const line = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

const drawStation = (ctx, time, canDock) => {
    ctx.save();
    ctx.translate(STATION.x, STATION.y);

    // Docking zone.
    ctx.setLineDash([10, 12]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.rotate(time * STATION.spin);
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.95)';
    ctx.fillStyle = 'rgba(8, 14, 28, 0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(160, 200, 255, 0.8)';

    // Four construction arms with gantry frames and dock blocks.
    for(let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2);
        rect(ctx, 40, -12, 150, 12);
        for(let x = 55; x < 150; x += 20) line(ctx, x, -12, x + 10, 12);
        rect(ctx, 150, -30, 190, 30);
        rect(ctx, 158, -22, 182, 22);
        // Slipway: open frame where ships are built.
        ctx.beginPath();
        ctx.moveTo(60, -12); ctx.lineTo(60, -60); ctx.lineTo(140, -60); ctx.lineTo(140, -12);
        ctx.stroke();
        line(ctx, 60, -36, 140, -36);
        ctx.restore();
    }

    // Central hub.
    rect(ctx, -44, -44, 44, 44);
    rect(ctx, -30, -30, 30, 30);
    line(ctx, -30, -30, 30, 30);
    line(ctx, -30, 30, 30, -30);
    rect(ctx, -10, -10, 10, 10);

    // Blinking beacons on the arm tips.
    const blink = Math.sin(time * 4) > 0;
    ctx.shadowBlur = 12;
    for(let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        const color = blink ? (canDock ? '140,255,160' : '255,120,100') : '80,90,110';
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 196, Math.sin(angle) * 196, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Label (not rotated).
    ctx.save();
    ctx.font = '14px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.fillText('SHIPYARD', STATION.x, STATION.y - STATION.dockRadius - 12);
    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["b"] = drawStation;



/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(19);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(21)(content, options);
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
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(20)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}\n.menu-action {\n    display: inline-block;\n    padding: 2px 10px;\n}\n\n.menu h2.menu-action {\n    display: block;\n    margin: 4px 0;\n}\n\n.menu-credits {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.pause-menu {\n    visibility: hidden;\n    min-height: 0;\n}\n\n.pause-menu h1 {\n    margin-top: 30px;\n}\n\n/* ---------------------------------------------------------------- HUD bars */\n\n.hud-bar-row {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    margin: 2px 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n    font-size: 13px;\n}\n\n.hud-bar-label {\n    width: 52px;\n}\n\n.hud-bar {\n    width: 140px;\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.7);\n    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);\n    background: rgba(0, 0, 0, 0.4);\n}\n\n.hud-bar-fill {\n    height: 100%;\n    width: 100%;\n    transition: width 0.15s linear;\n}\n\n.hud-bar.hull .hud-bar-fill {\n    background: #f4c46a;\n}\n\n.hud-bar.shield .hud-bar-fill {\n    background: #78d2ff;\n}\n\n.hud-bar-text {\n    font-size: 11px;\n}\n\n/* ---------------------------------------------------------------- Shipyard */\n\n.shipyard {\n    position: fixed;\n    inset: 0;\n    z-index: 20;\n    display: none;\n    flex-direction: column;\n    color: #dfe9ff;\n    background: rgba(2, 6, 16, 0.96);\n    user-select: none;\n}\n\n.shipyard.open {\n    display: flex;\n}\n\n.shipyard canvas {\n    position: static;\n}\n\n.shipyard-header {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    padding: 10px 20px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.25);\n}\n\n.shipyard-header h1 {\n    margin: 0;\n    font-size: 26px;\n    text-shadow: 0 0 8px rgba(140, 180, 255, 0.9);\n}\n\n.shipyard-credits {\n    flex: 1;\n    font-size: 18px;\n    color: #ffe08a;\n    text-shadow: 0 0 6px rgba(255, 200, 100, 0.7);\n}\n\n.shipyard-body {\n    flex: 1;\n    display: grid;\n    grid-template-columns: 260px 1fr 300px;\n    grid-template-rows: minmax(0, 1fr);\n    gap: 12px;\n    padding: 12px;\n    min-height: 0;\n}\n\n.shipyard-panel {\n    border: 1px solid rgba(140, 180, 255, 0.25);\n    background: rgba(10, 20, 40, 0.55);\n    padding: 10px;\n    overflow-y: auto;\n    min-height: 0;\n}\n\n.shipyard-panel h3 {\n    margin: 4px 0 8px;\n    font-size: 14px;\n    letter-spacing: 1px;\n    color: #9fc0ff;\n}\n\n.hull-cards {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-card {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 6px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    opacity: 0.75;\n}\n\n.hull-card.owned {\n    opacity: 1;\n}\n\n.hull-card.active {\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.35);\n    opacity: 1;\n}\n\n.hull-thumb {\n    flex: none;\n}\n\n.hull-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    min-width: 0;\n}\n\n.hull-name {\n    font-family: Bungee, sans-serif;\n    font-size: 15px;\n}\n\n.hull-class,\n.hull-meta {\n    color: #9fb2d8;\n    margin-bottom: 3px;\n}\n\n.hull-state {\n    color: #8cffa0;\n    font-family: Bungee, sans-serif;\n}\n\n.hull-view {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-title .title-name {\n    display: block;\n    font-size: 20px;\n}\n\n.hull-title .title-desc {\n    display: block;\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n}\n\n.hull-canvas-wrap {\n    flex: 1;\n    min-height: 200px;\n    position: relative;\n    border: 1px solid rgba(140, 180, 255, 0.15);\n}\n\n.hull-canvas {\n    position: absolute !important;\n    top: 0;\n    left: 0;\n}\n\n.shipyard-hint {\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n    text-align: center;\n}\n\n.ship-stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 6px;\n}\n\n.stat {\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    padding: 4px 6px;\n}\n\n.stat-label {\n    display: block;\n    font-family: sans-serif;\n    font-size: 10px;\n    color: #9fb2d8;\n    text-transform: uppercase;\n}\n\n.stat-value {\n    font-size: 14px;\n}\n\n.module-palette {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n\n.module-item {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 5px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    cursor: grab;\n    touch-action: none;\n}\n\n.module-item:hover {\n    border-color: rgba(200, 220, 255, 0.6);\n}\n\n.module-item.armed {\n    border-color: rgba(140, 255, 160, 0.9);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.4);\n}\n\n.module-item.unaffordable {\n    opacity: 0.45;\n}\n\n.module-icon {\n    flex: none;\n}\n\n.module-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #9fb2d8;\n    min-width: 0;\n}\n\n.module-name {\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #dfe9ff;\n}\n\n.module-price {\n    color: #ffe08a;\n    margin-top: 2px;\n}\n\n.inspector {\n    font-family: sans-serif;\n    font-size: 12px;\n}\n\n.inspector p {\n    margin: 4px 0;\n}\n\n.inspector .muted {\n    color: #9fb2d8;\n}\n\n.inspector-name {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n}\n\n.inspector-stats {\n    margin: 4px 0;\n}\n\n.inspector-next {\n    color: #9fb2d8;\n    margin-bottom: 8px;\n}\n\n.inspector-actions {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.sy-button {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #dfe9ff;\n    background: rgba(40, 70, 130, 0.5);\n    border: 1px solid rgba(140, 180, 255, 0.6);\n    padding: 6px 14px;\n    cursor: pointer;\n}\n\n.sy-button:hover:not(:disabled) {\n    background: rgba(60, 100, 180, 0.7);\n    box-shadow: 0 0 8px rgba(140, 180, 255, 0.5);\n}\n\n.sy-button:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n.sy-button.small {\n    font-size: 11px;\n    padding: 3px 8px;\n}\n\n.sy-button.primary {\n    border-color: rgba(140, 255, 160, 0.8);\n    background: rgba(40, 110, 60, 0.5);\n}\n\n.sy-button.buy {\n    border-color: rgba(255, 220, 130, 0.8);\n    background: rgba(110, 90, 30, 0.5);\n}\n\n.sy-button.danger {\n    border-color: rgba(255, 130, 110, 0.7);\n    background: rgba(110, 40, 30, 0.5);\n}\n\n.shipyard-message {\n    position: absolute;\n    bottom: 24px;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 8px 16px;\n    border: 1px solid rgba(140, 180, 255, 0.5);\n    background: rgba(10, 20, 40, 0.95);\n    opacity: 0;\n    transition: opacity 0.2s;\n    pointer-events: none;\n}\n\n.shipyard-message.visible {\n    opacity: 1;\n}\n\n.drag-ghost {\n    position: fixed !important;\n    z-index: 30;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .shipyard-body {\n        grid-template-columns: 1fr;\n        grid-template-rows: none;\n        overflow-y: auto;\n    }\n\n    .hull-canvas-wrap {\n        min-height: 260px;\n    }\n\n    .ship-stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n\n.hud-bar.cargo .hud-bar-fill {\n    background: #c8aaff;\n}\n\n.menu-tip {\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n/* ---------------------------------------------------------------- Shipyard tabs & market */\n\n.shipyard-tabs {\n    display: flex;\n    gap: 4px;\n}\n\n.sy-tab {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #9fb2d8;\n    background: transparent;\n    border: 1px solid rgba(140, 180, 255, 0.3);\n    padding: 5px 14px;\n    cursor: pointer;\n}\n\n.sy-tab.active {\n    color: #dfe9ff;\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.3);\n}\n\n.shipyard-market {\n    flex: 1;\n    padding: 12px;\n    min-height: 0;\n    overflow-y: auto;\n}\n\n.market-panel {\n    max-width: 720px;\n    margin: 0 auto;\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n.market-panel .muted {\n    color: #9fb2d8;\n}\n\n.market-warning {\n    color: #ffc98a;\n}\n\n.market-section {\n    margin-top: 20px !important;\n}\n\n.market-table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 10px 0 14px;\n}\n\n.market-table th {\n    text-align: left;\n    font-family: Bungee, sans-serif;\n    font-weight: normal;\n    font-size: 11px;\n    color: #9fc0ff;\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.3);\n}\n\n.market-table td {\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.1);\n}\n\n.market-table tr.empty td {\n    color: #6c7a99;\n}\n\n.material-name {\n    font-family: Bungee, sans-serif;\n}\n\n.swatch {\n    display: inline-block;\n    width: 10px;\n    height: 10px;\n    margin-right: 8px;\n    transform: rotate(45deg);\n}\n", ""]);

// exports


/***/ }),
/* 20 */
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
/* 21 */
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

var	fixUrls = __webpack_require__(22);

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
/* 22 */
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