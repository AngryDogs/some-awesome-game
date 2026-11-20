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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
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
// Hull definitions. All coordinates are local ship space in game pixels:
// +x is the bow (forward), +y is starboard (right side on screen when facing right).
//
// art:       line-art primitives: { pts, closed } polylines or { circle: [x, y, r] }
// slots:     module mounts the player can fill in the shipyard
// engines:   built-in main engine nozzles (flames are drawn here)
// colliders: circles approximating the hull for asteroid collisions
// rcs:       where manoeuvring jets sit (nose x, tail x, half width)
// shield:    shield bubble ellipse

const mirror = (pts) => pts.map(p => [p[0], -p[1]]);

const HULLS = {
    x302: {
        id: 'x302',
        name: 'X-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter. Few mounts, very agile.',
        cost: 0,
        color: '225,235,255',
        mass: 1,
        hull: 60,
        baseShield: 0,
        thrust: 260,
        torque: 9,
        maxTurn: 5,
        moduleScale: 0.6,
        radius: 18,
        art: [
            { closed: true, pts: [[18, 0], [8, -3], [-2, -4], [-6, -14], [-12, -15], [-11, -5], [-15, -4],
                [-15, 4], [-11, 5], [-12, 15], [-6, 14], [-2, 4], [8, 3]] },
            { closed: true, pts: [[11, 0], [6, -2], [2, -2], [2, 2], [6, 2]] },
            { pts: [[-4, -8], [-10, -9]] },
            { pts: [[-4, 8], [-10, 9]] }
        ],
        slots: [
            { id: 'c', x: -5, y: 0 },
            { id: 'wl', x: -7, y: -10 },
            { id: 'wr', x: -7, y: 10 }
        ],
        engines: [{ x: -15, y: 0, size: 0.8 }],
        colliders: [[4, 0, 8], [-8, -9, 6], [-8, 9, 6]],
        rcs: { nose: 12, tail: -12, half: 8 },
        shield: { x: -1, rx: 22, ry: 20 }
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser. Balanced, with twin engine nacelles.',
        cost: 2500,
        color: '205,225,255',
        mass: 3,
        hull: 160,
        baseShield: 0,
        thrust: 600,
        torque: 4,
        maxTurn: 2.6,
        moduleScale: 0.9,
        radius: 46,
        art: [
            { closed: true, pts: [[45, 0], [34, -7], [-28, -11], [-38, -8], [-38, 8], [-28, 11], [34, 7]] },
            { closed: true, pts: [[-6, -15], [-40, -15], [-44, -19], [-40, -23], [-10, -23]] },
            { closed: true, pts: mirror([[-6, -15], [-40, -15], [-44, -19], [-40, -23], [-10, -23]]) },
            { pts: [[-14, -10], [-14, -15]] }, { pts: [[-30, -11], [-30, -15]] },
            { pts: [[-14, 10], [-14, 15]] }, { pts: [[-30, 11], [-30, 15]] },
            { closed: true, pts: [[14, 0], [8, -4], [-4, -4], [-4, 4], [8, 4]] },
            { pts: [[32, 0], [18, 0]] },
            { pts: [[-8, 0], [-34, 0]] }
        ],
        slots: [
            { id: 'bow', x: 26, y: 0 },
            { id: 'bridge', x: 4, y: 0 },
            { id: 'ml', x: -18, y: -6 },
            { id: 'mr', x: -18, y: 6 },
            { id: 'nl', x: -26, y: -19 },
            { id: 'nr', x: -26, y: 19 }
        ],
        engines: [{ x: -44, y: -19, size: 1 }, { x: -44, y: 19, size: 1 }, { x: -38, y: 0, size: 0.8 }],
        colliders: [[34, 0, 7], [18, 0, 9], [0, 0, 10], [-20, 0, 11], [-26, -19, 6], [-26, 19, 6], [-38, -19, 5], [-38, 19, 5]],
        rcs: { nose: 40, tail: -40, half: 22 },
        shield: { x: -1, rx: 56, ry: 34 }
    },

    x304: {
        id: 'x304',
        name: 'X-304',
        className: 'Daedalus-class',
        faction: "Tau'ri",
        description: 'Deep-space carrier with twin hangar bays and Asgard shielding.',
        cost: 6000,
        color: '210,230,255',
        mass: 5,
        hull: 260,
        baseShield: 30,
        thrust: 900,
        torque: 3,
        maxTurn: 2,
        moduleScale: 1,
        radius: 62,
        art: [
            { closed: true, pts: [[44, 0], [34, -8], [-42, -9], [-58, -6], [-58, 6], [-42, 9], [34, 8]] },
            { closed: true, pts: [[62, -12], [58, -25], [-26, -25], [-34, -18], [-26, -12]] },
            { closed: true, pts: mirror([[62, -12], [58, -25], [-26, -25], [-34, -18], [-26, -12]]) },
            { pts: [[56, -18.5], [-24, -18.5]] },
            { pts: [[56, 18.5], [-24, 18.5]] },
            { pts: [[22, -8.5], [22, -12]] }, { pts: [[-20, -9], [-20, -12]] },
            { pts: [[22, 8.5], [22, 12]] }, { pts: [[-20, 9], [-20, 12]] },
            { closed: true, pts: [[2, 0], [-4, -5], [-20, -5], [-24, 0], [-20, 5], [-4, 5]] },
            { pts: [[-58, -3], [-62, -3]] }, { pts: [[-58, 3], [-62, 3]] }
        ],
        slots: [
            { id: 'bl1', x: 46, y: -18.5 },
            { id: 'br1', x: 46, y: 18.5 },
            { id: 'bl2', x: -8, y: -18.5 },
            { id: 'br2', x: -8, y: 18.5 },
            { id: 'nose', x: 32, y: 0 },
            { id: 'mid', x: 14, y: 0 },
            { id: 'bridge', x: -12, y: 0 },
            { id: 'aft', x: -46, y: 0 }
        ],
        engines: [{ x: -62, y: -3, size: 1.1 }, { x: -62, y: 3, size: 1.1 }, { x: -34, y: -18, size: 0.9 }, { x: -34, y: 18, size: 0.9 }],
        colliders: [[32, 0, 8], [8, 0, 9], [-18, 0, 9], [-44, 0, 8],
            [50, -18, 7], [25, -18, 7], [0, -18, 7], [-24, -18, 7],
            [50, 18, 7], [25, 18, 7], [0, 18, 7], [-24, 18, 7]],
        rcs: { nose: 55, tail: -55, half: 26 },
        shield: { x: 0, rx: 72, ry: 40 }
    },

    hatak: {
        id: 'hatak',
        name: "Ha'tak",
        className: 'Goa\'uld mothership',
        faction: "Goa'uld",
        description: 'Massive pyramid warship. Slow to turn, but tough and well shielded.',
        cost: 5000,
        color: '255,205,110',
        mass: 7,
        hull: 380,
        baseShield: 50,
        thrust: 900,
        torque: 2.2,
        maxTurn: 1.6,
        moduleScale: 1.1,
        radius: 56,
        art: [
            { closed: true, pts: [[48, 0], [38, -14], [24, -32], [0, -40], [-24, -34], [-40, -22], [-46, 0],
                [-40, 22], [-24, 34], [0, 40], [24, 32], [38, 14]] },
            { closed: true, pts: [[30, 0], [24, -9], [15, -20], [0, -25], [-15, -21], [-25, -14], [-29, 0],
                [-25, 14], [-15, 21], [0, 25], [15, 20], [24, 9]] },
            { closed: true, pts: [[16, 0], [0, -16], [-16, 0], [0, 16]] },
            { pts: [[16, 0], [-16, 0]] }, { pts: [[0, -16], [0, 16]] },
            { pts: [[30, 0], [48, 0]] }, { pts: [[0, -25], [0, -40]] }, { pts: [[0, 25], [0, 40]] },
            { pts: [[-29, 0], [-46, 0]] },
            { pts: [[15, -20], [24, -32]] }, { pts: [[15, 20], [24, 32]] },
            { pts: [[-15, -21], [-24, -34]] }, { pts: [[-15, 21], [-24, 34]] },
            { pts: [[38, -14], [56, -8], [46, -3]] },
            { pts: [[38, 14], [56, 8], [46, 3]] }
        ],
        slots: [
            { id: 'top', x: 0, y: 0 },
            { id: 'fl', x: 34, y: -9 },
            { id: 'fr', x: 34, y: 9 },
            { id: 'pl', x: 10, y: -32 },
            { id: 'pr', x: 10, y: 32 },
            { id: 'al', x: -20, y: -28 },
            { id: 'ar', x: -20, y: 28 },
            { id: 'sl', x: -37, y: -10 },
            { id: 'sr', x: -37, y: 10 }
        ],
        engines: [{ x: -46, y: 0, size: 1.4 }, { x: -42, y: -15, size: 1 }, { x: -42, y: 15, size: 1 }],
        colliders: [[0, 0, 28], [36, 0, 12], [24, -24, 12], [0, -33, 10], [-26, -26, 12], [-38, 0, 10],
            [-26, 26, 12], [0, 33, 10], [24, 24, 12], [50, -8, 5], [50, 8, 5]],
        rcs: { nose: 46, tail: -44, half: 40 },
        shield: { x: 2, rx: 62, ry: 52 }
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
        thrust: 1300,
        torque: 3.2,
        maxTurn: 2.4,
        moduleScale: 1,
        radius: 76,
        art: [
            { closed: true, pts: [[76, 0], [50, -26], [34, -28], [30, -10], [-30, -10], [-52, -34], [-64, -34],
                [-56, -10], [-74, -6], [-74, 6], [-56, 10], [-64, 34], [-52, 34], [-30, 10], [30, 10],
                [34, 28], [50, 26]] },
            { pts: [[64, 0], [-66, 0]] },
            { pts: [[50, -26], [42, -8]] }, { pts: [[50, 26], [42, 8]] },
            { pts: [[34, -28], [38, -10]] }, { pts: [[34, 28], [38, 10]] },
            { pts: [[-36, -10], [-56, -30]] }, { pts: [[-36, 10], [-56, 30]] },
            { circle: [0, 0, 8] },
            { circle: [0, 0, 4] }
        ],
        slots: [
            { id: 'nose', x: 58, y: 0 },
            { id: 'hl', x: 46, y: -17 },
            { id: 'hr', x: 46, y: 17 },
            { id: 'fwd', x: 20, y: 0 },
            { id: 'core', x: 0, y: 0 },
            { id: 'aft', x: -20, y: 0 },
            { id: 'fl', x: -48, y: -24 },
            { id: 'fr', x: -48, y: 24 },
            { id: 'tail', x: -60, y: 0 }
        ],
        engines: [{ x: -74, y: -3, size: 1.2 }, { x: -74, y: 3, size: 1.2 }, { x: -64, y: -32, size: 0.8 }, { x: -64, y: 32, size: 0.8 }],
        colliders: [[64, 0, 9], [48, 0, 10], [32, 0, 10], [16, 0, 10], [0, 0, 10], [-16, 0, 10], [-32, 0, 10],
            [-48, 0, 10], [-64, 0, 9], [46, -18, 10], [46, 18, 10], [-50, -24, 9], [-50, 24, 9]],
        rcs: { nose: 70, tail: -70, half: 30 },
        shield: { x: 0, rx: 86, ry: 44 }
    }
};

const HULL_ORDER = ['x302', 'x303', 'x304', 'hatak', 'asgard'];
/* harmony export (immutable) */ __webpack_exports__["a"] = HULL_ORDER;


// Draws the hull's line art in local ship coordinates (caller sets the transform).
const drawHullArt = (ctx, hull, options) => {
    const opts = options || {};
    const color = opts.color || hull.color;
    const alpha = opts.alpha === undefined ? 1 : opts.alpha;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = opts.lineWidth || 1.2;
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.fillStyle = 'rgba(5, 10, 20, ' + (0.55 * alpha) + ')';
    ctx.shadowBlur = opts.glow === undefined ? 6 : opts.glow;
    ctx.shadowColor = 'rgba(' + color + ',' + (0.8 * alpha) + ')';

    hull.art.forEach((part, index) => {
        ctx.beginPath();
        if(part.circle) {
            ctx.arc(part.circle[0], part.circle[1], part.circle[2], 0, Math.PI * 2);
        } else {
            ctx.moveTo(part.pts[0][0], part.pts[0][1]);
            for(let i = 1; i < part.pts.length; i++) ctx.lineTo(part.pts[i][0], part.pts[i][1]);
            if(part.closed) ctx.closePath();
        }
        // Darken the main silhouette so the line art reads against the background.
        if(index === 0 && part.closed) ctx.fill();
        ctx.stroke();
    });

    ctx.restore();
};
/* harmony export (immutable) */ __webpack_exports__["c"] = drawHullArt;


/* harmony default export */ __webpack_exports__["b"] = (HULLS);


/***/ }),
/* 3 */
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

const MODULE_ORDER = ['minigun', 'missile', 'engine', 'shield', 'guidance', 'armor'];
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
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules__ = __webpack_require__(3);
// Persistent player profile: credits, owned hulls and the module loadout of each hull.




const STORAGE_KEY = 'awesome-game-shipyard-v1';

const defaultProfile = () => ({
    credits: 0,
    bestScore: 0,
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
/* harmony export (immutable) */ __webpack_exports__["g"] = onProfileChange;


const getProfile = () => profile;
/* harmony export (immutable) */ __webpack_exports__["d"] = getProfile;


const loadoutFor = (hullId) => {
    if(!profile.loadouts[hullId]) profile.loadouts[hullId] = {};
    return profile.loadouts[hullId];
};
/* harmony export (immutable) */ __webpack_exports__["f"] = loadoutFor;


const addCredits = (amount) => {
    profile.credits += amount;
    save();
};
/* harmony export (immutable) */ __webpack_exports__["a"] = addCredits;


const recordScore = (score) => {
    if(score > profile.bestScore) {
        profile.bestScore = score;
        save();
    }
};
/* harmony export (immutable) */ __webpack_exports__["i"] = recordScore;


const ownsHull = (hullId) => profile.ownedHulls.indexOf(hullId) !== -1;
/* harmony export (immutable) */ __webpack_exports__["h"] = ownsHull;


const selectHull = (hullId) => {
    if(!ownsHull(hullId)) return false;
    profile.hull = hullId;
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["j"] = selectHull;


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
/* harmony export (immutable) */ __webpack_exports__["e"] = installModule;


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
/* harmony export (immutable) */ __webpack_exports__["l"] = upgradeModule;


const sellModule = (hullId, slotId) => {
    const loadout = loadoutFor(hullId);
    const module = loadout[slotId];
    if(!module) return false;
    profile.credits += Object(__WEBPACK_IMPORTED_MODULE_1__modules__["f" /* sellValue */])(module.type, module.level);
    delete loadout[slotId];
    save();
    return true;
};
/* harmony export (immutable) */ __webpack_exports__["k"] = sellModule;


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
/* harmony export (immutable) */ __webpack_exports__["c"] = computeShipStats;



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__modules__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__profile__ = __webpack_require__(4);
// Shipyard overlay: buy hulls, drag modules onto mounts, upgrade and sell them.





const SLOT_HIT_RADIUS = 16;

const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
};

const formatCredits = (value) => Math.round(value).toLocaleString('en-US') + ' cr';

const hullBounds = (hull) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const add = (x, y) => {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    };
    hull.art.forEach(part => {
        if(part.circle) {
            add(part.circle[0] - part.circle[2], part.circle[1] - part.circle[2]);
            add(part.circle[0] + part.circle[2], part.circle[1] + part.circle[2]);
        } else {
            part.pts.forEach(p => add(p[0], p[1]));
        }
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

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
    const b = hullBounds(hull);
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
        return __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])().hull];
    }

    open(options) {
        this.options = options || {};
        this.isOpen = true;
        this.selectedSlot = null;
        this.armedModule = null;
        this.closeButton.textContent = this.options.closeLabel || 'Launch';
        this.root.classList.add('open');
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

    refresh() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])();
        this.creditsLabel.textContent = formatCredits(profile.credits);
        this.renderHullList();
        this.renderTitle();
        this.renderStats();
        this.renderPalette();
        this.renderInspector();
        this.renderHint();
    }

    renderHullList() {
        const profile = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])();
        this.hullList.innerHTML = '';

        __WEBPACK_IMPORTED_MODULE_0__hulls__["a" /* HULL_ORDER */].forEach(id => {
            const hull = __WEBPACK_IMPORTED_MODULE_0__hulls__["b" /* default */][id];
            const owned = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["h" /* ownsHull */])(id);
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
            info.appendChild(el('div', 'hull-meta', hull.slots.length + ' mounts · ' + hull.hull + ' hull' +
                (hull.baseShield ? ' · ' + hull.baseShield + ' shield' : '')));

            let action;
            if(active) {
                action = el('div', 'hull-state', 'Active');
            } else if(owned) {
                action = el('button', 'sy-button small', 'Fly this');
                action.addEventListener('click', () => {
                    Object(__WEBPACK_IMPORTED_MODULE_2__profile__["j" /* selectHull */])(id);
                    this.selectedSlot = null;
                    this.refresh();
                });
            } else {
                action = el('button', 'sy-button small buy', 'Buy ' + formatCredits(hull.cost));
                action.disabled = profile.credits < hull.cost;
                action.addEventListener('click', () => {
                    if(Object(__WEBPACK_IMPORTED_MODULE_2__profile__["b" /* buyHull */])(id)) {
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
        const stats = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["c" /* computeShipStats */])(this.hull.id);
        const rows = [
            ['Hull', Math.round(stats.maxHull)],
            ['Shield', stats.maxShield ? Math.round(stats.maxShield) + ' (+' + Math.round(stats.shieldRegen) + '/s)' : 'none'],
            ['Acceleration', Math.round(stats.acceleration)],
            ['Turn rate', stats.maxTurn.toFixed(1)],
            ['Mass', stats.mass.toFixed(1)],
            ['Weapons', stats.weapons],
            ['Guidance', stats.guidance ? stats.guidance.range + 'px' : 'none'],
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
        __WEBPACK_IMPORTED_MODULE_1__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const def = __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type];
            const item = el('div', 'module-item');
            item.dataset.type = type;

            const icon = el('canvas', 'module-icon');
            const ctx = setupCanvas(icon, 40, 40);
            ctx.translate(20, 20);
            Object(__WEBPACK_IMPORTED_MODULE_1__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 2.6, lineWidth: 1.4 });
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
        const credits = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])().credits;
        __WEBPACK_IMPORTED_MODULE_1__modules__["b" /* MODULE_ORDER */].forEach(type => {
            const entry = this.paletteItems[type];
            entry.item.classList.toggle('armed', this.armedModule === type);
            entry.item.classList.toggle('unaffordable', credits < __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost);
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

        const module = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["f" /* loadoutFor */])(hull.id)[this.selectedSlot];
        if(!module) {
            box.appendChild(el('p', '', 'Empty mount'));
            box.appendChild(el('p', 'muted', this.armedModule
                ? 'Click the mount again to install the ' + __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][this.armedModule].short + '.'
                : 'Drag a module here, or pick one from the list and click the mount.'));
            return;
        }

        const def = __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][module.type];
        const stats = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["e" /* moduleStats */])(module.type, module.level);
        box.appendChild(el('div', 'inspector-name', def.name + ' Mk ' + ['I', 'II', 'III'][module.level - 1]));
        box.appendChild(el('div', 'inspector-stats', def.describe(stats)));

        const cost = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["g" /* upgradeCost */])(module.type, module.level);
        const actions = el('div', 'inspector-actions');
        if(cost !== null) {
            const next = Object(__WEBPACK_IMPORTED_MODULE_1__modules__["e" /* moduleStats */])(module.type, module.level + 1);
            box.appendChild(el('div', 'inspector-next', 'Next: ' + def.describe(next)));
            const upgrade = el('button', 'sy-button small', 'Upgrade ' + formatCredits(cost));
            upgrade.disabled = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])().credits < cost;
            upgrade.addEventListener('click', () => {
                if(Object(__WEBPACK_IMPORTED_MODULE_2__profile__["l" /* upgradeModule */])(hull.id, this.selectedSlot)) this.flash(def.short + ' upgraded!');
                this.refresh();
            });
            actions.appendChild(upgrade);
        } else {
            box.appendChild(el('div', 'inspector-next', 'Max level (Mk ' + ['I', 'II', 'III'][__WEBPACK_IMPORTED_MODULE_1__modules__["a" /* MAX_LEVEL */] - 1] + ')'));
        }

        const sell = el('button', 'sy-button small danger', 'Sell +' + formatCredits(Object(__WEBPACK_IMPORTED_MODULE_1__modules__["f" /* sellValue */])(module.type, module.level)));
        sell.addEventListener('click', () => {
            Object(__WEBPACK_IMPORTED_MODULE_2__profile__["k" /* sellModule */])(hull.id, this.selectedSlot);
            this.refresh();
        });
        actions.appendChild(sell);
        box.appendChild(actions);
    }

    renderHint() {
        this.hint.textContent = this.armedModule
            ? 'Placing ' + __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][this.armedModule].name + ': click an empty mount (Esc to cancel)'
            : 'Drag modules from the right onto the ship\'s mounts. Destroy asteroids to earn credits.';
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
            const occupied = !!Object(__WEBPACK_IMPORTED_MODULE_2__profile__["f" /* loadoutFor */])(this.hull.id)[slotId];
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
        if(Object(__WEBPACK_IMPORTED_MODULE_2__profile__["f" /* loadoutFor */])(hull.id)[slotId]) {
            this.flash('That mount is taken. Sell its module first.');
            return;
        }
        if(Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])().credits < __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost) {
            this.flash('Not enough credits for ' + __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].name + '.');
            return;
        }
        Object(__WEBPACK_IMPORTED_MODULE_2__profile__["e" /* installModule */])(hull.id, slotId, type);
        this.selectedSlot = slotId;
        this.flash(__WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].name + ' installed.');
        if(Object(__WEBPACK_IMPORTED_MODULE_2__profile__["d" /* getProfile */])().credits < __WEBPACK_IMPORTED_MODULE_1__modules__["c" /* default */][type].cost) this.armedModule = null;
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
                Object(__WEBPACK_IMPORTED_MODULE_1__modules__["d" /* drawModule */])(ctx, type, 1, { scale: 3, lineWidth: 1.5 });
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
        const loadout = Object(__WEBPACK_IMPORTED_MODULE_2__profile__["f" /* loadoutFor */])(hull.id);
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
                Object(__WEBPACK_IMPORTED_MODULE_1__modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: iconScale, lineWidth: 1.5 });
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
/* harmony export (immutable) */ __webpack_exports__["b"] = isShipyardOpen;



/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scripts_shipyard_shipyard__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__styles_main_css__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__styles_main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__styles_main_css__);





const startGame = document.getElementById('startGame');
const openShipyard = document.getElementById('openShipyard');
const menu = document.getElementById('menu');
const menuCredits = document.getElementById('menuCredits');

const renderMenuCredits = () => {
    const profile = Object(__WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__["d" /* getProfile */])();
    menuCredits.textContent = 'Credits: ' + Math.round(profile.credits).toLocaleString('en-US') +
        (profile.bestScore ? ' · Best score: ' + profile.bestScore : '');
};

renderMenuCredits();
Object(__WEBPACK_IMPORTED_MODULE_2__scripts_shipyard_profile__["g" /* onProfileChange */])(renderMenuCredits);

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
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__audio_audio__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__physics_physics__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__shipyard_profile__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__shipyard_shipyard__ = __webpack_require__(5);









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
    ship: new __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__["a" /* default */](__WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height / 2, Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["c" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["d" /* getProfile */])().hull)),
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
    __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].resize(window.innerWidth, window.innerHeight);
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
    setText('credits', 'Credits: ' + Math.round(Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["d" /* getProfile */])().credits).toLocaleString('en-US'));
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
    missiles.forEach(pull);
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

    if(byPlayer) {
        const reward = Math.round(rock.radius * CREDITS_PER_RADIUS);
        state.score += Math.round(rock.radius);
        state.creditsEarned += reward;
        Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["a" /* addCredits */])(reward);
        floatText(rock.x, rock.y, '+' + reward + ' cr');
    }
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].explosion(Math.min(1, 0.3 + rock.radius / 50));
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
            const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(rock, bullet);
            if(d.x * d.x + d.y * d.y > rock.radius * rock.radius) continue;

            bullet.dead = true;
            // Bullets carry momentum and nudge the rock.
            rock.vx += bullet.vx * bullet.mass / rock.mass;
            rock.vy += bullet.vy * bullet.mass / rock.mass;
            __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, bullet.x, bullet.y, rock.vx, rock.vy, 3, {
                minSpeed: 30, maxSpeed: 120, minLife: 0.15, maxLife: 0.4, size: 2, color: '255,240,200'
            });
            __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].rockHit();
            damageRock(rock, bullet.damage);
            return;
        }
    });
};

const explodeMissile = (missile) => {
    const { rocks, particles } = state;

    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(particles, missile.x, missile.y, missile.vx * 0.2, missile.vy * 0.2, 30, {
        minSpeed: 40, maxSpeed: missile.blast * 3, minLife: 0.2, maxLife: 0.6, size: 3, color: '255,160,80'
    });
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].explosion(0.5);

    rocks.forEach(rock => {
        if(rock.dead) return;
        const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(missile, rock);
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
                const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(rock, missile);
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

        // Broad phase against the whole hull first.
        const center = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(ship, rock);
        const reach = ship.radius + rock.radius;
        if(center.x * center.x + center.y * center.y > reach * reach) return;

        const colliders = ship.worldColliders();
        for(let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(c, rock);
            const distance = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
            const overlap = c.r + rock.radius * 0.85 - distance;
            if(overlap <= 0) continue;

            const impactSpeed = resolveImpact(ship, rock, d.x / distance, d.y / distance, overlap, SHIP_RESTITUTION);
            const damage = 4 + impactSpeed * rock.mass / 6000;

            if(ship.takeDamage(damage, particles)) {
                __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].explosion(0.6);
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
            state.rocks.push(__WEBPACK_IMPORTED_MODULE_1__components_rock_rock__["a" /* default */].spawnAtEdge(state.level));
            state.rocksToSpawn--;
            state.spawnTimer = ROCK_SPAWN_INTERVAL;
        }
        return;
    }

    if(state.rocks.length === 0 && state.ship.alive) {
        const bonus = LEVEL_BONUS * state.level;
        Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["a" /* addCredits */])(bonus);
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

    ship.update(dt, __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */], state);
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
    ctx.fillText(state.bannerText, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width / 2, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height / 3);
    ctx.restore();
};

const render = (time) => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].width, __WEBPACK_IMPORTED_MODULE_5__physics_physics__["d" /* world */].height);

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
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].enabled = !paused;
    pauseMenu.style.visibility = paused ? 'visible' : 'hidden';
    document.body.classList.toggle('playing', !paused);
    if(paused) {
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].stopAll();
    } else {
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].startEngine();
        lastFrameTime = performance.now();
        accumulator = 0;
    }
};

const endGame = () => {
    cancelAnimationFrame(frameId);
    frameId = null;
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].enabled = false;
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].stopAll();
    document.body.classList.remove('playing');
    pauseMenu.style.visibility = 'hidden';
    Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["i" /* recordScore */])(state.score);

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

        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].setThrust(state.ship.alive && state.ship.thrusting);
        __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].setFiring(state.ship.alive && state.ship.firing);
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
    Object(__WEBPACK_IMPORTED_MODULE_7__shipyard_shipyard__["a" /* getShipyard */])().open({
        closeLabel: 'Back to battle',
        onClose: () => {
            if(!state) return;
            state.ship.applyStats(Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["c" /* computeShipStats */])(Object(__WEBPACK_IMPORTED_MODULE_6__shipyard_profile__["d" /* getProfile */])().hull));
            pauseMenu.style.visibility = 'visible';
        }
    });
};

let initialized = false;

const initialize = () => {
    initialized = true;
    gameboard.appendChild(canvas);
    window.addEventListener('resize', resize);
    Object(__WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["a" /* default */])();

    Object(__WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["c" /* onKeyPress */])('Escape', () => {
        if(!state || Object(__WEBPACK_IMPORTED_MODULE_7__shipyard_shipyard__["b" /* isShipyardOpen */])() || !state.ship.alive) return false;
        setPaused(!state.paused);
        return true;
    });

    Object(__WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["c" /* onKeyPress */])('KeyG', () => {
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
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_3__components_ship_handlers__["b" /* input */].enabled = true;
    accumulator = 0;
    lastFrameTime = performance.now();
    pauseMenu.style.visibility = 'hidden';
    document.body.classList.add('playing');

    __WEBPACK_IMPORTED_MODULE_4__audio_audio__["a" /* default */].startEngine();
    frameId = requestAnimationFrame(frame);
};

/* harmony default export */ __webpack_exports__["a"] = (constructGameBoard);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__missile_missile__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shipyard_modules__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__physics_physics__ = __webpack_require__(0);







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
        Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["e" /* wrapPosition */])(this);

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
        const nearCursor = this.nearestRock(input.mouseX, input.mouseY, rocks, MISSILE_LOCK_RADIUS);
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
            let desired = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);
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
            const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(p, target) : { x: input.mouseX - p.x, y: input.mouseY - p.y };
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
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__physics_physics__ = __webpack_require__(0);


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
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(0);



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
        if(this.life <= 0 || Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["c" /* isOutsideWorld */])(this)) {
            this.dead = true;
            this.exploded = this.life <= 0;
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
/* 11 */
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
/* 12 */
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
/* 13 */
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
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(15);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(17)(content, options);
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
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(16)(undefined);
// imports


// module
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}\n.menu-action {\n    display: inline-block;\n    padding: 2px 10px;\n}\n\n.menu h2.menu-action {\n    display: block;\n    margin: 4px 0;\n}\n\n.menu-credits {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.pause-menu {\n    visibility: hidden;\n    min-height: 0;\n}\n\n.pause-menu h1 {\n    margin-top: 30px;\n}\n\n/* ---------------------------------------------------------------- HUD bars */\n\n.hud-bar-row {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    margin: 2px 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n    font-size: 13px;\n}\n\n.hud-bar-label {\n    width: 52px;\n}\n\n.hud-bar {\n    width: 140px;\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.7);\n    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);\n    background: rgba(0, 0, 0, 0.4);\n}\n\n.hud-bar-fill {\n    height: 100%;\n    width: 100%;\n    transition: width 0.15s linear;\n}\n\n.hud-bar.hull .hud-bar-fill {\n    background: #f4c46a;\n}\n\n.hud-bar.shield .hud-bar-fill {\n    background: #78d2ff;\n}\n\n.hud-bar-text {\n    font-size: 11px;\n}\n\n/* ---------------------------------------------------------------- Shipyard */\n\n.shipyard {\n    position: fixed;\n    inset: 0;\n    z-index: 20;\n    display: none;\n    flex-direction: column;\n    color: #dfe9ff;\n    background: rgba(2, 6, 16, 0.96);\n    user-select: none;\n}\n\n.shipyard.open {\n    display: flex;\n}\n\n.shipyard canvas {\n    position: static;\n}\n\n.shipyard-header {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    padding: 10px 20px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.25);\n}\n\n.shipyard-header h1 {\n    margin: 0;\n    font-size: 26px;\n    text-shadow: 0 0 8px rgba(140, 180, 255, 0.9);\n}\n\n.shipyard-credits {\n    flex: 1;\n    font-size: 18px;\n    color: #ffe08a;\n    text-shadow: 0 0 6px rgba(255, 200, 100, 0.7);\n}\n\n.shipyard-body {\n    flex: 1;\n    display: grid;\n    grid-template-columns: 260px 1fr 300px;\n    grid-template-rows: minmax(0, 1fr);\n    gap: 12px;\n    padding: 12px;\n    min-height: 0;\n}\n\n.shipyard-panel {\n    border: 1px solid rgba(140, 180, 255, 0.25);\n    background: rgba(10, 20, 40, 0.55);\n    padding: 10px;\n    overflow-y: auto;\n    min-height: 0;\n}\n\n.shipyard-panel h3 {\n    margin: 4px 0 8px;\n    font-size: 14px;\n    letter-spacing: 1px;\n    color: #9fc0ff;\n}\n\n.hull-cards {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-card {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 6px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    opacity: 0.75;\n}\n\n.hull-card.owned {\n    opacity: 1;\n}\n\n.hull-card.active {\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.35);\n    opacity: 1;\n}\n\n.hull-thumb {\n    flex: none;\n}\n\n.hull-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    min-width: 0;\n}\n\n.hull-name {\n    font-family: Bungee, sans-serif;\n    font-size: 15px;\n}\n\n.hull-class,\n.hull-meta {\n    color: #9fb2d8;\n    margin-bottom: 3px;\n}\n\n.hull-state {\n    color: #8cffa0;\n    font-family: Bungee, sans-serif;\n}\n\n.hull-view {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-title .title-name {\n    display: block;\n    font-size: 20px;\n}\n\n.hull-title .title-desc {\n    display: block;\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n}\n\n.hull-canvas-wrap {\n    flex: 1;\n    min-height: 200px;\n    position: relative;\n    border: 1px solid rgba(140, 180, 255, 0.15);\n}\n\n.hull-canvas {\n    position: absolute !important;\n    top: 0;\n    left: 0;\n}\n\n.shipyard-hint {\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n    text-align: center;\n}\n\n.ship-stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 6px;\n}\n\n.stat {\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    padding: 4px 6px;\n}\n\n.stat-label {\n    display: block;\n    font-family: sans-serif;\n    font-size: 10px;\n    color: #9fb2d8;\n    text-transform: uppercase;\n}\n\n.stat-value {\n    font-size: 14px;\n}\n\n.module-palette {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n\n.module-item {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 5px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    cursor: grab;\n    touch-action: none;\n}\n\n.module-item:hover {\n    border-color: rgba(200, 220, 255, 0.6);\n}\n\n.module-item.armed {\n    border-color: rgba(140, 255, 160, 0.9);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.4);\n}\n\n.module-item.unaffordable {\n    opacity: 0.45;\n}\n\n.module-icon {\n    flex: none;\n}\n\n.module-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #9fb2d8;\n    min-width: 0;\n}\n\n.module-name {\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #dfe9ff;\n}\n\n.module-price {\n    color: #ffe08a;\n    margin-top: 2px;\n}\n\n.inspector {\n    font-family: sans-serif;\n    font-size: 12px;\n}\n\n.inspector p {\n    margin: 4px 0;\n}\n\n.inspector .muted {\n    color: #9fb2d8;\n}\n\n.inspector-name {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n}\n\n.inspector-stats {\n    margin: 4px 0;\n}\n\n.inspector-next {\n    color: #9fb2d8;\n    margin-bottom: 8px;\n}\n\n.inspector-actions {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.sy-button {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #dfe9ff;\n    background: rgba(40, 70, 130, 0.5);\n    border: 1px solid rgba(140, 180, 255, 0.6);\n    padding: 6px 14px;\n    cursor: pointer;\n}\n\n.sy-button:hover:not(:disabled) {\n    background: rgba(60, 100, 180, 0.7);\n    box-shadow: 0 0 8px rgba(140, 180, 255, 0.5);\n}\n\n.sy-button:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n.sy-button.small {\n    font-size: 11px;\n    padding: 3px 8px;\n}\n\n.sy-button.primary {\n    border-color: rgba(140, 255, 160, 0.8);\n    background: rgba(40, 110, 60, 0.5);\n}\n\n.sy-button.buy {\n    border-color: rgba(255, 220, 130, 0.8);\n    background: rgba(110, 90, 30, 0.5);\n}\n\n.sy-button.danger {\n    border-color: rgba(255, 130, 110, 0.7);\n    background: rgba(110, 40, 30, 0.5);\n}\n\n.shipyard-message {\n    position: absolute;\n    bottom: 24px;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 8px 16px;\n    border: 1px solid rgba(140, 180, 255, 0.5);\n    background: rgba(10, 20, 40, 0.95);\n    opacity: 0;\n    transition: opacity 0.2s;\n    pointer-events: none;\n}\n\n.shipyard-message.visible {\n    opacity: 1;\n}\n\n.drag-ghost {\n    position: fixed !important;\n    z-index: 30;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .shipyard-body {\n        grid-template-columns: 1fr;\n        grid-template-rows: none;\n        overflow-y: auto;\n    }\n\n    .hull-canvas-wrap {\n        min-height: 260px;\n    }\n\n    .ship-stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n", ""]);

// exports


/***/ }),
/* 16 */
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
/* 17 */
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

var	fixUrls = __webpack_require__(18);

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
/* 18 */
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