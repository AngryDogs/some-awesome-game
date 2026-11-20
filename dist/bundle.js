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
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
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

const HULLS = {
    x302: {
        id: 'x302',
        name: 'F-302',
        className: 'Interceptor',
        faction: "Tau'ri",
        description: 'Nimble starter fighter with swept wings and twin nacelles. Few mounts, tiny cargo hold.',
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
        radius: 28,
        art: [
            // Big swept wings.
            { closed: true, pts: [[13, -3.4], [-18, -26], [-21.5, -26], [-21.5, -24.5], [-4, -9], [-6, -3.6]] },
            { closed: true, pts: mirror([[13, -3.4], [-18, -26], [-21.5, -26], [-21.5, -24.5], [-4, -9], [-6, -3.6]]) },
            ...mirrorLine(8, -5.5, -17, -23),
            ...mirrorRect(-18.5, -24.5, -20.5, -22.5),
            // Outer pods and inner engine nacelles.
            ...mirrorRect(-6, -11.5, -20, -8.5), ...mirrorRect(-20, -11, -21.5, -9),
            ...mirrorRect(3, -7.5, -22, -4), ...mirrorRect(-22, -7, -24, -4.5),
            // Fuselage and canopy.
            { closed: true, pts: symmetric([[21, 0], [17, -2], [12, -3.4], [-14, -3.6], [-20, -3]]) },
            { closed: true, pts: symmetric([[15, 0], [11, -1.6], [6, -1.6]]) },
            line(1, -3.4, 1, 3.4), line(-10, -3.6, -10, 3.6)
        ],
        slots: [
            { id: 'c', x: -6, y: 0 },
            { id: 'wl', x: -10, y: -15 },
            { id: 'wr', x: -10, y: 15 }
        ],
        engines: [{ x: -24, y: -5.75, size: 0.6 }, { x: -24, y: 5.75, size: 0.6 }, { x: -21.5, y: -10, size: 0.4 }, { x: -21.5, y: 10, size: 0.4 }],
        colliders: [[12, 0, 5], [0, 0, 6], [-12, 0, 6], [-12, -12, 6], [-12, 12, 6], [-18, -21, 4], [-18, 21, 4]],
        jets: { retro: [[14, 3]], side: [[-20, 26]], bow: [16, 2], stern: [-22, 8] },
        jetScale: 0.9
    },

    x303: {
        id: 'x303',
        name: 'X-303',
        className: 'Prometheus-class',
        faction: "Tau'ri",
        description: 'First Earth battlecruiser: narrow forward hull, wide rear section and two big engine nacelles.',
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
        radius: 50,
        art: [
            // Engine nacelles with chevron intakes.
            { closed: true, pts: [[-1, -15.5], [-6, -19.5], [-43, -19.5], [-46, -17], [-46, -14], [-43, -11.5], [-6, -11.5]] },
            { closed: true, pts: mirror([[-1, -15.5], [-6, -19.5], [-43, -19.5], [-46, -17], [-46, -14], [-43, -11.5], [-6, -11.5]]) },
            ...mirrorLine(-10, -15.5, -40, -15.5),
            ...mirrorLine(-36, -19.5, -36, -11.5), ...mirrorLine(-40, -19.5, -40, -11.5),
            ...mirrorRect(-46, -18, -48.5, -13),
            // Rear section.
            { closed: true, pts: symmetric([[-4, -13], [-40, -13], [-46, -8], [-46, 0]]) },
            rect(-46, -4, -48.5, 4),
            // Forward hull.
            { closed: true, pts: symmetric([[46, 0], [40, -4], [36, -10], [-4, -10]]) },
            line(32, -10, 32, 10), line(20, -10, 20, 10), line(8, -10, 8, 10),
            ...mirrorLine(36, -5, 8, -5),
            // Arrow-shaped central superstructure with hangar.
            { closed: true, pts: symmetric([[4, 0], [-6, -8], [-38, -8]]) },
            ...mirrorLine(-10, -4.5, -34, -4.5),
            rect(-14, -2, -28, 2)
        ],
        slots: [
            { id: 'bow', x: 34, y: 0 },
            { id: 'bridge', x: 14, y: 0 },
            { id: 'ml', x: -20, y: -6 },
            { id: 'mr', x: -20, y: 6 },
            { id: 'nl', x: -24, y: -15.5 },
            { id: 'nr', x: -24, y: 15.5 }
        ],
        engines: [{ x: -48.5, y: -15.5, size: 1 }, { x: -48.5, y: 15.5, size: 1 }, { x: -48.5, y: 0, size: 0.7 }],
        colliders: row([40, 30, 18, 6], 0, 9)
            .concat(row([-8, -20, -32, -42], 0, 12), row([-6, -18, -30, -42], -15.5, 4.5), row([-6, -18, -30, -42], 15.5, 4.5)),
        jets: { retro: [[36, 10], [-2, 15.5]], side: [[20, 10], [-30, 19.5]], bow: [42, 4], stern: [-44, 19.5] },
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
        jets: { retro: [[46, 12]], side: [[-2, 46]], bow: [34, 30], stern: [-34, 30] },
        jetScale: 1.8,
        exhaust: '255,190,90',
        shieldColor: '255,200,120',
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
        jets: { retro: [[60, 28]], side: [[30, 8], [-56, 34]], bow: [64, 18], stern: [-66, 34] },
        jetScale: 1.5,
        exhaust: '140,220,255',
        shieldColor: '150,230,255',
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
            { closed: true, pts: [[-29, -8], [-31, -20], [-35, -21], [-37, -8]] },
            { closed: true, pts: mirror([[-29, -8], [-31, -20], [-35, -21], [-37, -8]]) },
            // Main hull: bow, forward module, mid-body, spine and stern.
            { closed: true, pts: symmetric([[88, 0], [74, -4], [50, -14], [47, -17], [22, -17], [19, -19.5], [-12, -19.5],
                [-17, -15], [-17, -8], [-58, -8], [-60, -9], [-87, -9], [-89, -5], [-89, 0]]) },
            line(80, 0, 50, 0), line(-17, 0, -84, 0),
            ...mirrorLine(74, -4, 50, -4),
            line(47, -17, 47, 17), line(22, -17, 22, 17),
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
            .concat([[34, -12, 7], [34, 12, 7], [6, -12, 8], [6, 12, 8], [-72, -20, 9], [-72, 20, 9], [-33, -15, 5], [-33, 15, 5]]),
        jets: { retro: [[48, 16], [-60, 26]], side: [[2, 19.5], [-74, 30]], bow: [72, 4.5], stern: [-86, 28] },
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
        stats: { fireRate: [2.2, 2.8, 3.5], damage: [5, 7, 9.5], splash: [18, 24, 30] },
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
        description: 'Ancient drone weapons (F / right click). Self-guided swarms that hunt targets.',
        cost: 2800,
        color: '255,225,130',
        stats: { count: [3, 4, 5], damage: [14, 18, 24], cooldown: [4, 3.3, 2.6] },
        describe: (s) => s.count + ' drones x ' + s.damage + ' dmg, reload ' + s.cooldown + 's'
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

const MODULE_ORDER = ['minigun', 'staff', 'beam', 'missile', 'drones', 'engine', 'shield', 'guidance', 'cargo', 'magnet', 'armor'];
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
// All game sounds. The engine, thruster and minigun loops use the recorded samples;
// everything else is synthesized with the Web Audio API so each weapon has its own voice.

const createLoop = (src, volume) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    return audio;
};

const thrusterSound = createLoop('./assets/sounds/thrust.mp3', 0.5);
const minigunSound = createLoop('./assets/sounds/minigun.mp3', 0.45);
const engineSound = createLoop('./assets/sounds/engine.mp3', 0.18);

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
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    safePlay(audio);
};

// ------------------------------------------------------------ Web Audio synth

let ac = null;
let master = null;
let noiseBuffer = null;
const lastPlayed = {};

const context = () => {
    if(ac) return ac;
    try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = 0.55;
        master.connect(ac.destination);

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

const envelope = (c, peak, attack, decay) => {
    const gain = c.createGain();
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    gain.connect(master);
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

// Continuous Asgard beam hum (two detuned saws through a sweeping band-pass).
let beamVoice = null;
const startBeam = () => {
    const c = context();
    if(!c || beamVoice) return;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, c.currentTime + 0.08);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 3;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 9;
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = 'sawtooth';
    b.type = 'sawtooth';
    a.frequency.value = 220;
    b.frequency.value = 223.5;
    a.connect(filter);
    b.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    [a, b, lfo].forEach(o => o.start());
    beamVoice = { gain: gain, oscillators: [a, b, lfo] };
};

const stopBeam = () => {
    if(!beamVoice || !ac) return;
    const voice = beamVoice;
    beamVoice = null;
    const now = ac.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    voice.oscillators.forEach(o => o.stop(now + 0.2));
};

const sounds = {
    // Must be called from a user gesture (e.g. the launch click) so audio can start.
    unlock() {
        const c = context();
        if(c && c.state === 'suspended') c.resume();
    },

    startEngine() { setLooping(engineSound, true); },
    setThrust(on) { setLooping(thrusterSound, on); },
    setFiring(on) { setLooping(minigunSound, on); },
    setBeam(on) { if(on) startBeam(); else stopBeam(); },

    rockHit() { playOneShot(rockHitSound, 0.35); },
    explosion(volume) { playOneShot(explosionSound, volume === undefined ? 1 : volume); },

    staffShot() {
        const c = throttle('staff', 0.05);
        if(!c) return;
        tone(c, 'sawtooth', 900, 140, 0.25, envelope(c, 0.22, 0.005, 0.25));
        tone(c, 'square', 1400, 300, 0.12, envelope(c, 0.06, 0.002, 0.12));
        noise(c, 0.2, 'bandpass', 3000, 600, envelope(c, 0.12, 0.002, 0.18), 2);
    },

    plasmaImpact() {
        const c = throttle('plasmaImpact', 0.05);
        if(!c) return;
        noise(c, 0.35, 'lowpass', 2500, 200, envelope(c, 0.3, 0.005, 0.35));
        tone(c, 'sine', 300, 60, 0.3, envelope(c, 0.2, 0.005, 0.3));
    },

    missileLaunch() {
        const c = throttle('missile', 0.05);
        if(!c) return;
        noise(c, 0.6, 'bandpass', 600, 2500, envelope(c, 0.25, 0.02, 0.6), 1.5);
        tone(c, 'triangle', 120, 60, 0.4, envelope(c, 0.15, 0.005, 0.35));
    },

    droneLaunch() {
        const c = throttle('drones', 0.1);
        if(!c) return;
        // Rising, shimmering Ancient whine.
        tone(c, 'sine', 320, 1500, 0.7, envelope(c, 0.16, 0.05, 0.7));
        tone(c, 'sine', 480, 2200, 0.7, envelope(c, 0.08, 0.05, 0.7));
        tone(c, 'triangle', 640, 900, 0.5, envelope(c, 0.05, 0.1, 0.5));
    },

    droneImpact() {
        const c = throttle('droneImpact', 0.04);
        if(!c) return;
        tone(c, 'sine', 1800, 200, 0.2, envelope(c, 0.12, 0.002, 0.2));
        noise(c, 0.25, 'highpass', 2000, 500, envelope(c, 0.12, 0.002, 0.22));
    },

    missileExplosion() {
        const c = throttle('boom', 0.05);
        if(!c) return;
        noise(c, 0.9, 'lowpass', 1800, 80, envelope(c, 0.45, 0.005, 0.9));
        tone(c, 'sine', 120, 35, 0.7, envelope(c, 0.35, 0.005, 0.7));
    },

    beamImpact() {
        const c = throttle('beamImpact', 0.09);
        if(!c) return;
        noise(c, 0.08, 'highpass', 4000, 2500, envelope(c, 0.06, 0.002, 0.08));
    },

    overheat() {
        const c = throttle('overheat', 0.5);
        if(!c) return;
        tone(c, 'square', 880, 880, 0.08, envelope(c, 0.08, 0.002, 0.08));
        setTimeout(() => { if(ac) tone(ac, 'square', 660, 660, 0.12, envelope(ac, 0.08, 0.002, 0.12)); }, 120);
        noise(c, 0.6, 'highpass', 3000, 1500, envelope(c, 0.05, 0.05, 0.6));
    },

    shieldHit() {
        const c = throttle('shield', 0.08);
        if(!c) return;
        tone(c, 'sine', 1600, 300, 0.3, envelope(c, 0.2, 0.002, 0.3));
        tone(c, 'triangle', 2400, 600, 0.2, envelope(c, 0.08, 0.002, 0.2));
    },

    shieldUp() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 180, 900, 0.5, envelope(c, 0.16, 0.02, 0.5));
        tone(c, 'triangle', 360, 1800, 0.45, envelope(c, 0.06, 0.02, 0.45));
    },

    shieldDown() {
        const c = throttle('shieldToggle', 0.2);
        if(!c) return;
        tone(c, 'sine', 900, 120, 0.45, envelope(c, 0.14, 0.01, 0.45));
        noise(c, 0.4, 'bandpass', 2000, 300, envelope(c, 0.05, 0.01, 0.4), 2);
    },

    // Ore burning up against raised shields.
    oreZap() {
        const c = throttle('oreZap', 0.05);
        if(!c) return;
        tone(c, 'square', 2400, 900, 0.07, envelope(c, 0.035, 0.001, 0.07));
        noise(c, 0.08, 'highpass', 5000, 3000, envelope(c, 0.04, 0.001, 0.08));
    },

    hullHit() {
        const c = throttle('hull', 0.1);
        if(!c) return;
        noise(c, 0.4, 'lowpass', 900, 100, envelope(c, 0.4, 0.002, 0.4));
        tone(c, 'square', 90, 40, 0.25, envelope(c, 0.15, 0.002, 0.25));
    },

    rockCrack() {
        const c = throttle('crack', 0.06);
        if(!c) return;
        noise(c, 0.25, 'bandpass', 1500, 300, envelope(c, 0.35, 0.001, 0.25), 0.8);
        tone(c, 'triangle', 200, 70, 0.2, envelope(c, 0.15, 0.001, 0.2));
    },

    // Deep rumble as asteroids grind together and merge.
    merge(size) {
        const c = throttle('merge', 0.15);
        if(!c) return;
        const volume = Math.min(0.5, 0.15 + size / 200);
        noise(c, 1.4, 'lowpass', 400, 60, envelope(c, volume, 0.15, 1.3));
        tone(c, 'sine', 70, 40, 1.2, envelope(c, volume * 0.6, 0.1, 1.2));
    },

    pickup(value) {
        const c = throttle('pickup', 0.04);
        if(!c) return;
        const f = 500 + Math.min(700, value * 8);
        tone(c, 'triangle', f, f * 1.6, 0.1, envelope(c, 0.08, 0.002, 0.12));
    },

    dock() {
        const c = context();
        if(!c) return;
        tone(c, 'sine', 660, 660, 0.25, envelope(c, 0.15, 0.01, 0.25));
        setTimeout(() => { if(ac) tone(ac, 'sine', 990, 990, 0.4, envelope(ac, 0.15, 0.01, 0.4)); }, 160);
    },

    stopAll() {
        setLooping(engineSound, false);
        setLooping(thrusterSound, false);
        setLooping(minigunSound, false);
        stopBeam();
    }
};

/* harmony default export */ __webpack_exports__["a"] = (sounds);


/***/ }),
/* 7 */
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
const MAX_SCARS = 10;
const SHAPE_POINTS = 30;
const MAX_MERGE_RADIUS = 170;
/* harmony export (immutable) */ __webpack_exports__["a"] = MAX_MERGE_RADIUS;

const VISUAL_RADIUS = 0.88;
/* harmony export (immutable) */ __webpack_exports__["b"] = VISUAL_RADIUS;
   // average outline radius relative to `radius`

// Light comes from the top-left of the screen for every asteroid.
const LIGHT_X = -0.55;
const LIGHT_Y = -0.65;

const BASE_ROCK = [118, 110, 102];

let nextId = 1;

// Lumpy outline from a few layered sine "octaves" (smooth, rock-like, not spiky).
const randomShape = (random) => {
    const rnd = random || Math.random;
    const octaves = [[2, 0.09], [3, 0.07], [5, 0.04], [9, 0.025]].map(o => ({ freq: o[0], amp: o[1], phase: rnd() * Math.PI * 2 }));
    const points = [];
    for(let i = 0; i < SHAPE_POINTS; i++) {
        const angle = (i / SHAPE_POINTS) * Math.PI * 2;
        let factor = 0.86;
        octaves.forEach(o => { factor += Math.sin(angle * o.freq + o.phase) * o.amp; });
        factor += (rnd() - 0.5) * 0.03;
        points.push({ angle: angle, factor: Math.min(1, Math.max(0.62, factor)) });
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

const parseColor = (color) => color.split(',').map(Number);
const rgb = (c, alpha) => 'rgba(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ',' + (alpha === undefined ? 1 : alpha) + ')';
const shade = (c, f) => c.map(v => v * f);

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
        this.angle = rnd() * Math.PI * 2;
        this.spin = (rnd() - 0.5) * 1.5 * (20 / this.radius);
        this.grace = options.grace || 0;
        this.flash = 0;
        this.stress = 0;
        this.oreProgress = 0;
        this.dead = false;
        this.renderScale = 1;
        this.merging = null;          // active merge link while two asteroids fuse
        this.renderAlpha = 1;
        this.scars = [];
        this.shape = options.shape || randomShape(rnd);
        this.createSurface(rnd);
        this.updateLook(rnd);
    }

    setArea(area) {
        this.area = Math.max(0, area);
        this.mass = this.area;
        this.radius = Math.sqrt(this.area);
    }

    // Craters and cracks, in unit coordinates (scaled by radius when drawn).
    createSurface(rnd) {
        this.craters = [];
        const craterCount = 3 + Math.floor(rnd() * 5);
        for(let i = 0; i < craterCount; i++) {
            const angle = rnd() * Math.PI * 2;
            const distance = Math.sqrt(rnd()) * 0.62;
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
            let angle = rnd() * Math.PI * 2;
            let x = Math.cos(angle) * 0.2 * rnd();
            let y = Math.sin(angle) * 0.2 * rnd();
            const heading = rnd() * Math.PI * 2;
            points.push([x, y]);
            for(let s = 0; s < 4; s++) {
                angle = heading + (rnd() - 0.5) * 1.2;
                x += Math.cos(angle) * 0.14;
                y += Math.sin(angle) * 0.14;
                points.push([x, y]);
            }
            this.cracks.push(points);
        }
    }

    // Base colour and glinting mineral crystals from the composition.
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
                const distance = Math.sqrt(rnd()) * 0.7;
                const cx = Math.cos(angle) * distance;
                const cy = Math.sin(angle) * distance;
                const shards = 2 + Math.floor(rnd() * 3);
                for(let s = 0; s < shards; s++) {
                    this.crystals.push({
                        x: cx + (rnd() - 0.5) * 0.12,
                        y: cy + (rnd() - 0.5) * 0.12,
                        size: 0.035 + rnd() * 0.05,
                        angle: rnd() * Math.PI,
                        color: parseColor(__WEBPACK_IMPORTED_MODULE_0__world_materials__["b" /* default */][id].color),
                        phase: rnd() * Math.PI * 2
                    });
                }
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

        // Dent the outline and leave a fresh, pale scar where the hit landed.
        const hitAngle = Math.atan2(hitY - this.y, hitX - this.x) - this.angle;
        this.dent(hitAngle, 1 - 0.06 * Math.min(1, damage), 0.55);
        this.addScar(hitAngle, damage);

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

    addScar(localAngle, damage) {
        const last = this.scars[this.scars.length - 1];
        if(last && Math.abs(last.angle - localAngle) < 0.25) {
            last.size = Math.min(0.3, last.size + 0.01 * damage);
            last.fresh = 1;
            return;
        }
        this.scars.push({ angle: localAngle, size: 0.08 + 0.02 * damage, fresh: 1 });
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

    dent(localAngle, factor, minimum) {
        const step = Math.PI * 2 / this.shape.length;
        this.shape.forEach(point => {
            let diff = Math.abs(point.angle - localAngle) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff > step * 1.5) return;
            // Neighbouring points dent less, so the crater is rounded.
            const weight = 1 - diff / (step * 1.5);
            point.factor = Math.max(minimum, point.factor * (1 - (1 - factor) * weight));
        });
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
        for(let i = -2; i <= 2; i++) this.dent(localAngle + i * 0.3, 0.8, 0.55);
        this.addScar(localAngle, 6);

        return fragment;
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
        this.shape.forEach(p => {
            let diff = Math.abs(p.angle - contact) % (Math.PI * 2);
            if(diff > Math.PI) diff = Math.PI * 2 - diff;
            if(diff < 0.9) {
                const w = Math.cos(diff / 0.9 * Math.PI / 2);
                p.factor = Math.min(1.08, p.factor + bulge * w * w);
            } else if(diff < 1.4) {
                p.factor = Math.max(0.6, p.factor - bulge * 0.25);
            }
        });

        // Carry over some of the guest's surface features near the seam.
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
        this.scars.forEach(scar => { if(scar.fresh > 0) scar.fresh -= dt * 0.25; });
    }

    // Very faint halo whose reach scales with mass, hinting at the gravity well.
    drawGravityWell(ctx) {
        const reach = this.radius * 3;
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.9, this.x, this.y, reach);
        gradient.addColorStop(0, 'rgba(140, 170, 220, 0.05)');
        gradient.addColorStop(1, 'rgba(140, 170, 220, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, reach, 0, Math.PI * 2);
        ctx.fill();
    }

    outline(ctx, r) {
        ctx.beginPath();
        this.shape.forEach((p, i) => {
            const x = Math.cos(p.angle) * r * p.factor;
            const y = Math.sin(p.angle) * r * p.factor;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
    }

    draw(ctx, time) {
        const r = this.radius * this.renderScale;
        if(r < 0.5) return;
        const base = this.baseColor;

        // Light direction in the asteroid's rotating frame.
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);
        const lx = LIGHT_X * cos - LIGHT_Y * sin;
        const ly = LIGHT_X * sin + LIGHT_Y * cos;

        ctx.save();
        ctx.globalAlpha = this.renderAlpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Soft dark rim so the rock separates from the background.
        this.outline(ctx, r);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.fillStyle = rgb(shade(base, 0.35));
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body shading: lit on the light side, falling off into shadow.
        const body = ctx.createRadialGradient(lx * r * 0.45, ly * r * 0.45, r * 0.05, 0, 0, r * 1.05);
        body.addColorStop(0, rgb(shade(base, this.flash > 0 ? 2 : 1.45)));
        body.addColorStop(0.45, rgb(shade(base, 0.95)));
        body.addColorStop(1, rgb(shade(base, 0.28)));
        ctx.fillStyle = body;
        ctx.fill();

        ctx.save();
        this.outline(ctx, r);
        ctx.clip();

        // Craters: dark bowl with a lit far rim and a shadowed near rim.
        this.craters.forEach(c => {
            const cx = c.x * r;
            const cy = c.y * r;
            const cr = c.r * r;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(c.tilt);
            ctx.scale(1, c.squash);
            ctx.fillStyle = rgb(shade(base, 0.55), 0.55);
            ctx.beginPath();
            ctx.arc(0, 0, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.lineWidth = Math.max(0.8, cr * 0.18);
            ctx.strokeStyle = rgb(shade(base, 1.6), 0.45);
            ctx.beginPath();
            const rimAngle = Math.atan2(-ly, -lx);
            ctx.ellipse(cx, cy, cr, cr * c.squash, c.tilt, rimAngle - 1.1 - c.tilt, rimAngle + 1.1 - c.tilt);
            ctx.stroke();
            ctx.strokeStyle = rgb(shade(base, 0.25), 0.55);
            ctx.beginPath();
            ctx.ellipse(cx, cy, cr, cr * c.squash, c.tilt, rimAngle + Math.PI - 1.1 - c.tilt, rimAngle + Math.PI + 1.1 - c.tilt);
            ctx.stroke();
        });

        // Cracks.
        ctx.strokeStyle = rgb(shade(base, 0.3), 0.7);
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

        // Fresh impact scars: pale, freshly exposed rock that weathers over time.
        this.scars.forEach(scar => {
            const sx = Math.cos(scar.angle) * r * 0.72;
            const sy = Math.sin(scar.angle) * r * 0.72;
            const sr = scar.size * r;
            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
            g.addColorStop(0, rgb(shade(base, 1.9), 0.25 + 0.5 * Math.max(0, scar.fresh)));
            g.addColorStop(1, rgb(shade(base, 1.2), 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        });

        // Mineral crystals catch the light and glint as the asteroid turns.
        const t = time || 0;
        this.crystals.forEach(c => {
            const x = c.x * r;
            const y = c.y * r;
            const s = Math.max(1, c.size * r);
            const glint = 0.55 + 0.45 * Math.max(0, Math.sin(t * 2 + c.phase + this.angle * 3));
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(c.angle);
            ctx.fillStyle = rgb(shade(c.color, 0.55));
            ctx.beginPath();
            ctx.moveTo(s, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s, 0); ctx.lineTo(0, -s * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = rgb(c.color, glint);
            ctx.beginPath();
            ctx.moveTo(s * 0.8, 0); ctx.lineTo(0, -s * 0.5); ctx.lineTo(-s * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Terminator: darken the side facing away from the light.
        const terminator = ctx.createLinearGradient(lx * r, ly * r, -lx * r, -ly * r);
        terminator.addColorStop(0, 'rgba(0, 0, 0, 0)');
        terminator.addColorStop(0.55, 'rgba(0, 0, 0, 0.05)');
        terminator.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = terminator;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();

        // Rim light on the lit edge.
        this.outline(ctx, r);
        ctx.lineWidth = Math.max(1, r * 0.03);
        const rim = ctx.createLinearGradient(lx * r, ly * r, -lx * r * 0.2, -ly * r * 0.2);
        rim.addColorStop(0, rgb(shade(base, 2), 0.6));
        rim.addColorStop(1, rgb(shade(base, 2), 0));
        ctx.strokeStyle = rim;
        ctx.stroke();

        ctx.restore();
    }
}

/* harmony default export */ __webpack_exports__["c"] = (Rock);


/***/ }),
/* 8 */
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
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scripts_gameboard_gameboard__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__scripts_shipyard_shipyard__ = __webpack_require__(8);
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
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_ship_ship__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_rock_rock__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_ore_ore__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__audio_audio__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__world_materials__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__world_sectors__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__world_station__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__shipyard_profile__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__shipyard_shipyard__ = __webpack_require__(8);













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
const shieldButton = document.getElementById('shieldButton');
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
    const shieldState = ship.maxShield <= 0 ? 'none' : (ship.shieldsEnabled ? (ship.shieldUp ? 'up' : 'depleted') : 'down');
    if(hud.shieldState !== shieldState) {
        hud.shieldState = shieldState;
        shieldButton.className = 'shield-button ' + shieldState;
        shieldButton.textContent = {
            none: 'No shields', up: 'Shields: UP (H)', depleted: 'Shields: DEPLETED', down: 'Shields: DOWN (H)'
        }[shieldState];
    }
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
    if(Math.random() < Math.min(1, damage * 0.6)) {
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, hitX, hitY, rock.vx + outX * 25, rock.vy + outY * 25, 1, {
            minSpeed: 5, maxSpeed: 30, minLife: 0.8, maxLife: 1.6, size: 6, color: '170,160,150', dust: true, alpha: 0.25
        });
    }

    if(result.fragment) {
        state.newRocks.push(result.fragment);
        const midX = (rock.x + result.fragment.x) / 2;
        const midY = (rock.y + result.fragment.y) / 2;
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, midX, midY,
            rock.vx, rock.vy, 16, { minSpeed: 30, maxSpeed: 130, minLife: 0.3, maxLife: 0.8, size: 2.5, color: '220,220,230' });
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, midX, midY, rock.vx, rock.vy, 8, {
            minSpeed: 10, maxSpeed: 50, minLife: 1, maxLife: 2, size: 8, color: '170,160,150', dust: true, alpha: 0.22
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
            if(rock.dead) continue;
            const dx = bullet.x - rock.x;
            const dy = bullet.y - rock.y;
            if(dx * dx + dy * dy > rock.radius * rock.radius) continue;

            bullet.dead = true;
            // Projectiles carry momentum and nudge the rock.
            rock.vx += bullet.vx * bullet.mass / rock.mass;
            rock.vy += bullet.vy * bullet.mass / rock.mass;
            hitRock(rock, bullet.damage, bullet.x, bullet.y);

            if(bullet.kind === 'plasma') {
                // Staff blast: fiery splash that also scorches nearby rocks.
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, bullet.x, bullet.y, rock.vx, rock.vy, 14, {
                    minSpeed: 30, maxSpeed: 160, minLife: 0.2, maxLife: 0.5, size: 3, color: '255,170,60'
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
    __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.2, missile.vy * 0.2, drone ? 16 : 30, {
        minSpeed: 40, maxSpeed: missile.blast * 3 + 60, minLife: 0.2, maxLife: 0.6, size: drone ? 2.5 : 3,
        color: drone ? '255,230,150' : '255,160,80'
    });
    if(!drone) {
        __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, missile.x, missile.y, missile.vx * 0.1, missile.vy * 0.1, 6, {
            minSpeed: 10, maxSpeed: 40, minLife: 1, maxLife: 1.8, size: 10, color: '150,140,130', dust: true, alpha: 0.2
        });
    }
    if(drone) __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].droneImpact();
    else __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].missileExplosion();

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
        const center = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(ship, rock);
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
            const d = Object(__WEBPACK_IMPORTED_MODULE_6__physics_physics__["a" /* delta */])(c, rock);
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
            const contact = ship.shieldContact(ore.x, ore.y, ore.radius);
            if(contact) {
                ore.dead = true;
                ship.absorbOre(contact.x, contact.y);
                __WEBPACK_IMPORTED_MODULE_2__components_particle_particle__["a" /* default */].burst(state.particles, contact.x, contact.y, ship.vx, ship.vy, 5, {
                    minSpeed: 20, maxSpeed: 90, minLife: 0.15, maxLife: 0.35, size: 2, color: __WEBPACK_IMPORTED_MODULE_7__world_materials__["b" /* default */][ore.material].color
                });
                __WEBPACK_IMPORTED_MODULE_5__audio_audio__["a" /* default */].oreZap();
                if(state.shieldHintTimer <= 0) {
                    state.shieldHintTimer = 8;
                    banner('Shields up: ore burns up! Lower shields (H) to collect.', 2.5);
                }
            }
            return;
        }

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
    state.beamHits.forEach(hit => {
        hit.rock.vx += hit.dirX * 900 * hit.damage / hit.rock.mass;
        hit.rock.vy += hit.dirY * 900 * hit.damage / hit.rock.mass;
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

// Weapon readiness: heat for miniguns, recharge for beams, reload for launchers.
const drawWeaponPanel = () => {
    const weapons = state.ship.weaponStatus();
    if(!weapons.length) return;
    const left = 16;
    const rowHeight = 22;
    const top = __WEBPACK_IMPORTED_MODULE_6__physics_physics__["c" /* world */].height - 16 - weapons.length * rowHeight - 18;

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
    // Merging guests are drawn first so they sink beneath their host.
    visibleRocks.forEach(rock => { if(rock.merging && rock.merging.guest === rock) rock.draw(ctx, time); });
    visibleRocks.forEach(rock => { if(!(rock.merging && rock.merging.guest === rock)) rock.draw(ctx, time); });
    state.particles.forEach(particle => { if(particle.dust && isVisible(particle.x, particle.y, 20)) particle.draw(ctx); });
    state.ores.forEach(ore => { if(isVisible(ore.x, ore.y, 10)) ore.draw(ctx, time); });
    drawTargeting(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.particles.forEach(particle => { if(!particle.dust && isVisible(particle.x, particle.y, 10)) particle.draw(ctx); });
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
    drawWeaponPanel();
    drawDockPrompt();
    if(!state.paused) drawCrosshair();
    drawBanner();
};

// ---------------------------------------------------------------- loop & menus

const freeze = (frozen) => {
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].reset();
    __WEBPACK_IMPORTED_MODULE_4__components_ship_handlers__["b" /* input */].enabled = !frozen;
    document.body.classList.toggle('playing', !frozen);
    shieldButton.style.display = state && !frozen ? '' : 'none';
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
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bullet_bullet__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__missile_missile__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__shipyard_modules__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__physics_physics__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__audio_audio__ = __webpack_require__(6);








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

// Distance along a ray to the first asteroid it hits.
const raycastRocks = (x, y, dirX, dirY, range, rocks) => {
    let best = null;
    let bestDistance = range;
    rocks.forEach(rock => {
        if(rock.dead) return;
        const mx = rock.x - x;
        const my = rock.y - y;
        const along = mx * dirX + my * dirY;
        if(along < -rock.radius) return;
        const closestSq = mx * mx + my * my - along * along;
        const r = rock.radius * 0.92;
        if(closestSq > r * r) return;
        const hit = Math.max(0, along - Math.sqrt(r * r - closestSq));
        if(hit < bestDistance) {
            bestDistance = hit;
            best = rock;
        }
    });
    return { rock: best, distance: bestDistance };
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
        if(this.shieldsEnabled) __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].shieldUp();
        else __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].shieldDown();
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
        this.shieldImpact(worldX, worldY, 0.35);
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
                let d = Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(p, target);
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

        // Each round adds enough heat to outpace cooling, so sustained fire
        // overheats after `heatShots` rounds.
        turret.heat += 1 / stats.heatShots + HEAT_COOLING / stats.fireRate;
        if(turret.heat >= 1) {
            turret.heat = 1;
            turret.overheated = true;
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].overheat();
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
        this.vx -= dirX * RECOIL * 2 / this.stats.mass;
        this.vy -= dirY * RECOIL * 2 / this.stats.mass;
        turret.flash = 0.08;
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].staffShot();
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
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].missileLaunch();
    }

    // Ancient drones: a fan of self-guided drones that hunt asteroids on their own.
    fireDrones(launcher, input, world) {
        const stats = launcher.module.stats;
        const p = this.localToWorld(launcher.module.slot.x, launcher.module.slot.y);
        const target = this.missileLock || this.nearestRock(input.aimX, input.aimY, world.rocks, 400);
        const aimAt = target ? Object(__WEBPACK_IMPORTED_MODULE_5__physics_physics__["a" /* delta */])(p, target) : { x: input.aimX - p.x, y: input.aimY - p.y };
        const base = Math.atan2(aimAt.y, aimAt.x);

        for(let i = 0; i < stats.count; i++) {
            const angle = base + (i - (stats.count - 1) / 2) * 0.45;
            world.missiles.push(new __WEBPACK_IMPORTED_MODULE_1__missile_missile__["a" /* default */]({
                kind: 'drone',
                x: p.x,
                y: p.y,
                vx: this.vx + Math.cos(angle) * 160,
                vy: this.vy + Math.sin(angle) * 160,
                angle: angle,
                damage: stats.damage,
                blast: 14,
                target: target,
                homing: 7,
                launchDelay: i * 0.06
            }));
        }
        launcher.cooldown = stats.cooldown;
        __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].droneLaunch();
    }

    // Readiness of each weapon group for the HUD: 1 = ready.
    weaponStatus() {
        const groups = {};
        this.turrets.concat(this.launchers).forEach(w => {
            const def = __WEBPACK_IMPORTED_MODULE_4__shipyard_modules__["c" /* default */][w.kind];
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
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].shieldHit();
        }

        if(remaining > 0) {
            this.hp -= remaining;
            this.hullFlash = 0.15;
            this.explode(particles, 10 + Math.round(remaining / 2));
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].hullHit();
        }

        if(this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.explode(particles, 40 + this.radius * 2);
            __WEBPACK_IMPORTED_MODULE_6__audio_audio__["a" /* default */].explosion(1);
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
        const flicker = () => 0.8 + Math.random() * 0.4;
        const jetScale = this.hullDef.jetScale || 1;
        const jetOuter = 'rgba(170, 210, 255, 0.85)';
        const jetInner = 'rgba(255, 255, 255, 0.95)';
        const exhaust = this.hullDef.exhaust || '255,150,60';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 18);

        this.engines.forEach(engine => {
            const size = engine.size;

            // Nozzle glow, pulsing even when idle.
            const glowRadius = (2.5 + pulse + t.main * 3) * size * 1.6;
            const glow = ctx.createRadialGradient(engine.x, engine.y, 0, engine.x, engine.y, glowRadius);
            glow.addColorStop(0, 'rgba(' + exhaust + ', ' + (0.55 + t.main * 0.45) + ')');
            glow.addColorStop(1, 'rgba(' + exhaust + ', 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(engine.x, engine.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Plume straight out of the nozzle, as wide as the nozzle.
            const length = t.main * (14 + Math.random() * 8) * size * 1.4;
            const plume = ctx.createLinearGradient(engine.x, engine.y, engine.x - length, engine.y);
            plume.addColorStop(0, 'rgba(255, 235, 190, 0.95)');
            plume.addColorStop(0.4, 'rgba(' + exhaust + ', 0.8)');
            plume.addColorStop(1, 'rgba(' + exhaust + ', 0)');
            this.drawFlame(ctx, engine.x, engine.y, -1, 0, length, 2.6 * size * flicker(), plume, 'rgba(255, 255, 235, 0.9)');
        });

        // Manoeuvring jets on the hull edges: retro, strafe and attitude control.
        const jets = this.jetList;
        Object.keys(jets).forEach(key => {
            if(t[key] < 0.02) return;
            const length = t[key] * 7 * jetScale;
            jets[key].forEach(jet => {
                this.drawFlame(ctx, jet[0], jet[1], jet[2], jet[3], length * flicker(), 1.3 * jetScale, jetOuter, jetInner);
            });
        });

        ctx.restore();
    }

    // Hexagon lattice for the shield surface, cached per hull.
    shieldLattice(radius) {
        const key = Math.round(radius);
        if(this.latticeKey === key) return this.lattice;
        const path = new Path2D();
        const size = 7;
        const w = size * Math.sqrt(3);
        for(let row = -Math.ceil(radius / (size * 1.5)); row <= Math.ceil(radius / (size * 1.5)); row++) {
            for(let col = -Math.ceil(radius / w) - 1; col <= Math.ceil(radius / w) + 1; col++) {
                const cx = col * w + (row % 2 ? w / 2 : 0);
                const cy = row * size * 1.5;
                if(cx * cx + cy * cy > (radius + size) * (radius + size)) continue;
                for(let i = 0; i < 6; i++) {
                    const a1 = Math.PI / 6 + i * Math.PI / 3;
                    const a2 = a1 + Math.PI / 3;
                    path.moveTo(cx + Math.cos(a1) * size, cy + Math.sin(a1) * size);
                    path.lineTo(cx + Math.cos(a2) * size, cy + Math.sin(a2) * size);
                }
            }
        }
        this.latticeKey = key;
        this.lattice = path;
        return path;
    }

    drawShield(ctx) {
        const level = this.shieldLevel;
        if(this.maxShield <= 0 || level < 0.01) return;

        const s = Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["e" /* shieldFor */])(this.hullDef);
        const color = this.hullDef.shieldColor || '120,210,255';
        const strength = Math.max(0.15, this.shield / this.maxShield);
        // Bubble expands outwards when powering up and collapses when lowered.
        const grow = 0.7 + 0.3 * (1 - Math.pow(1 - level, 3));
        const rx = s.rx * grow;
        const squash = s.ry / s.rx;
        const flash = Math.max(0, this.shieldFlash) * 3;
        const t = this.time;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(1, squash);   // draw the ellipse as a circle in squashed space

        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        const body = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
        body.addColorStop(0, 'rgba(' + color + ', 0)');
        body.addColorStop(0.8, 'rgba(' + color + ', ' + (0.05 * level * strength) + ')');
        body.addColorStop(1, 'rgba(' + color + ', ' + Math.min(0.5, (0.2 + flash * 0.3) * level * strength) + ')');
        ctx.fillStyle = body;
        ctx.fill();

        ctx.save();
        ctx.clip();

        // Lattice with a bright scan band sweeping across it.
        const sweep = Math.sin(t * 1.3) * rx;
        const band = ctx.createLinearGradient(sweep - rx * 0.5, -rx, sweep + rx * 0.5, rx);
        band.addColorStop(0, 'rgba(' + color + ', ' + (0.03 * level) + ')');
        band.addColorStop(0.5, 'rgba(' + color + ', ' + ((0.16 + flash * 0.3) * level * strength) + ')');
        band.addColorStop(1, 'rgba(' + color + ', ' + (0.03 * level) + ')');
        ctx.strokeStyle = band;
        ctx.lineWidth = 0.6;
        ctx.stroke(this.shieldLattice(rx));

        // Impact ripples: a hot flare at the hit point and a ring spreading across the bubble.
        ctx.globalCompositeOperation = 'lighter';
        this.shieldImpacts.forEach(impact => {
            const ix = impact.x * grow;
            const iy = impact.y * grow / squash;
            const age = 1 - impact.life;
            const flare = ctx.createRadialGradient(ix, iy, 0, ix, iy, 10 + 30 * impact.strength);
            flare.addColorStop(0, 'rgba(255, 255, 255, ' + (0.8 * impact.life * impact.strength) + ')');
            flare.addColorStop(0.3, 'rgba(' + color + ', ' + (0.5 * impact.life) + ')');
            flare.addColorStop(1, 'rgba(' + color + ', 0)');
            ctx.fillStyle = flare;
            ctx.fillRect(ix - 50, iy - 50, 100, 100);

            ctx.strokeStyle = 'rgba(' + color + ', ' + (0.7 * impact.life) + ')';
            ctx.lineWidth = 2 * impact.life + 0.5;
            ctx.beginPath();
            ctx.arc(ix, iy, 4 + age * rx * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.restore();

        // Rim.
        const shimmer = 0.75 + 0.25 * Math.sin(t * 3);
        ctx.strokeStyle = 'rgba(' + color + ', ' + Math.min(1, (0.3 + flash) * shimmer * level * (0.4 + 0.6 * strength)) + ')';
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.stroke();
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
            if(beam.hit) {
                const glow = ctx.createRadialGradient(beam.x2, beam.y2, 0, beam.x2, beam.y2, 16);
                glow.addColorStop(0, 'rgba(220, 240, 255, 0.9)');
                glow.addColorStop(1, 'rgba(120, 190, 255, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(beam.x2, beam.y2, 16, 0, Math.PI * 2);
                ctx.fill();
            }
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
        Object(__WEBPACK_IMPORTED_MODULE_3__shipyard_hulls__["c" /* drawHullArt */])(ctx, this.hullDef, { color: this.hullFlash > 0 ? '255,120,120' : undefined });

        this.stats.modules.forEach(module => {
            if(TURRET_TYPES.indexOf(module.type) !== -1) return;
            ctx.save();
            ctx.translate(module.slot.x, module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_4__shipyard_modules__["d" /* drawModule */])(ctx, module.type, module.level, { scale: u });
            ctx.restore();
        });

        this.turrets.forEach(turret => {
            ctx.save();
            ctx.translate(turret.module.slot.x, turret.module.slot.y);
            Object(__WEBPACK_IMPORTED_MODULE_4__shipyard_modules__["d" /* drawModule */])(ctx, turret.kind, turret.module.level, {
                scale: u,
                aim: turret.aim - this.angle,
                heat: turret.kind === 'minigun' ? turret.heat : 0
            });
            if(turret.flash > 0) {
                const tip = 9 * u;
                const color = turret.kind === 'staff' ? '255, 190, 90' : '255, 230, 150';
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
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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
        this.mass = this.kind === 'plasma' ? 30 : 4;
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
            // Elongated glowing bolt with a hot core.
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const dx = this.vx / speed;
            const dy = this.vy / speed;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;
            [[9, 'rgba(255, 120, 30, 0.25)', 16], [5, 'rgba(255, 170, 60, 0.7)', 12], [2.2, 'rgba(255, 245, 210, 0.95)', 8]].forEach(layer => {
                ctx.lineWidth = layer[0];
                ctx.strokeStyle = layer[1];
                ctx.beginPath();
                ctx.moveTo(this.x - dx * layer[2], this.y - dy * layer[2]);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            });
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
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__particle_particle__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__physics_physics__ = __webpack_require__(2);



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
                const d = Object(__WEBPACK_IMPORTED_MODULE_1__physics_physics__["a" /* delta */])(this, this.target);
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

        if(this.kind === 'drone') {
            // Golden squid-like drone with a pulsing glow.
            const pulse = 0.7 + 0.3 * Math.sin(this.time * 20);
            ctx.globalCompositeOperation = 'lighter';
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
            glow.addColorStop(0, 'rgba(255, 240, 180, ' + pulse + ')');
            glow.addColorStop(1, 'rgba(255, 200, 80, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
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
/* 14 */
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
/* 15 */
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
        if(event.target && event.target.closest && event.target.closest('button')) return;
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
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_rock_rock__ = __webpack_require__(7);
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
// Home base at the centre of the map: an Atlantis-style six-armed city-ship.
// Fly inside the docking ring and press B to dock with the shipyard.

const STATION = {
    x: 0,
    y: 0,
    dockRadius: 400,
    maxDockSpeed: 140,
    spin: 0.012
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
const drawArm = (ctx, main, time, index) => {
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

    // Window lights along the pier, twinkling slowly.
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 160, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 210, 120, 0.9)';
    for(let x = 90; x < length; x += 11) {
        const on = Math.sin(time * 0.7 + x * 0.37 + index * 1.7) > -0.3;
        if(!on) continue;
        ctx.fillRect(x, -half * 0.75, 2, 2);
        ctx.fillRect(x + 4, half * 0.7, 2, 2);
    }
    ctx.restore();
};

const drawStation = (ctx, time, canDock) => {
    ctx.save();
    ctx.translate(STATION.x, STATION.y);

    // Docking ring.
    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = canDock ? 'rgba(140, 255, 160, 0.6)' : 'rgba(140, 180, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, STATION.dockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint city shield dome.
    const dome = ctx.createRadialGradient(0, 0, 200, 0, 0, 380);
    dome.addColorStop(0, 'rgba(120, 190, 255, 0)');
    dome.addColorStop(0.9, 'rgba(120, 190, 255, 0.05)');
    dome.addColorStop(1, 'rgba(120, 190, 255, 0.12)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(0, 0, 380, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * STATION.spin);
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
        drawArm(ctx, i % 2 === 0, time, i);
        ctx.restore();
    }

    // Central hub: layered hexagons, the star-shaped gate room and the central tower.
    poly(ctx, hexagon(92, Math.PI / 6));
    poly(ctx, hexagon(70, 0));
    poly(ctx, hexagon(48, Math.PI / 6));
    const star = hexagon(40, 0);
    line(ctx, star[0][0], star[0][1], star[2][0], star[2][1]);
    line(ctx, star[2][0], star[2][1], star[4][0], star[4][1]);
    line(ctx, star[4][0], star[4][1], star[0][0], star[0][1]);
    line(ctx, star[1][0], star[1][1], star[3][0], star[3][1]);
    line(ctx, star[3][0], star[3][1], star[5][0], star[5][1]);
    line(ctx, star[5][0], star[5][1], star[1][0], star[1][1]);
    for(let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        line(ctx, Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 92, Math.sin(a) * 92);
    }

    // Gate room glow.
    ctx.shadowBlur = 0;
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    const gate = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
    gate.addColorStop(0, 'rgba(160, 220, 255, ' + (0.8 * pulse) + ')');
    gate.addColorStop(1, 'rgba(80, 150, 255, 0)');
    ctx.fillStyle = gate;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Beacons on the main pier tips.
    const blink = Math.sin(time * 4) > 0;
    ctx.shadowBlur = 12;
    for(let i = 0; i < 6; i += 2) {
        const angle = i * Math.PI / 3 - Math.PI / 2;
        const color = blink ? (canDock ? '140,255,160' : '255,120,100') : '80,90,110';
        ctx.fillStyle = 'rgb(' + color + ')';
        ctx.shadowColor = 'rgb(' + color + ')';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 372, Math.sin(angle) * 372, 4, 0, Math.PI * 2);
        ctx.fill();
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
exports.push([module.i, "html, body {\n    background-color: #000;\n    margin: 0;\n    overflow: hidden;\n}\n\n.gameboard {\n    position: relative;\n}\n\ncanvas {\n    position: fixed;\n    top: 0;\n    left: 0;\n    background-color: rgba(0, 0, 0, 0);\n}\n\nbody.playing canvas {\n    cursor: none;\n}\n\n.info {\n    position: absolute;\n    margin-top: 5px;\n    margin-left: 5px;\n    z-index: 5;\n    pointer-events: none;\n    user-select: none;\n}\n\n.info p {\n    margin: 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n}\n\n.menu {\n    position: absolute;\n    margin-left: auto;\n    margin-right: auto;\n    top: 25vh;\n    min-height: 250px;\n    padding-bottom: 20px;\n    z-index: 10;\n    user-select: none;\n    left: 0;\n    right: 0;\n    margin: 0 auto !important;\n    text-align: center;\n\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n\n    background-color: rgba(0, 0, 0, 0.5);\n}\n\n.menu h1 {\n    margin-top: 50px; \n}\n\n.menu h2 {\n    margin: 0;\n}\n\n.menu-message {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.menu h4 {\n    margin: 0;\n    margin-top: 10px;\n}\n\n.menu h2:hover {\n    color: #fff;\n    cursor: pointer;\n}\n.menu-action {\n    display: inline-block;\n    padding: 2px 10px;\n}\n\n.menu h2.menu-action {\n    display: block;\n    margin: 4px 0;\n}\n\n.menu-credits {\n    margin: 0 0 10px;\n    min-height: 1em;\n}\n\n.pause-menu {\n    visibility: hidden;\n    min-height: 0;\n}\n\n.pause-menu h1 {\n    margin-top: 30px;\n}\n\n/* ---------------------------------------------------------------- HUD bars */\n\n.hud-bar-row {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    margin: 2px 0;\n    text-shadow: 0px 0px 4px rgba(255, 255, 255, 1);\n    font-size: 13px;\n}\n\n.hud-bar-label {\n    width: 52px;\n}\n\n.hud-bar {\n    width: 140px;\n    height: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.7);\n    box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);\n    background: rgba(0, 0, 0, 0.4);\n}\n\n.hud-bar-fill {\n    height: 100%;\n    width: 100%;\n    transition: width 0.15s linear;\n}\n\n.hud-bar.hull .hud-bar-fill {\n    background: #f4c46a;\n}\n\n.hud-bar.shield .hud-bar-fill {\n    background: #78d2ff;\n}\n\n.hud-bar-text {\n    font-size: 11px;\n}\n\n/* ---------------------------------------------------------------- Shipyard */\n\n.shipyard {\n    position: fixed;\n    inset: 0;\n    z-index: 20;\n    display: none;\n    flex-direction: column;\n    color: #dfe9ff;\n    background: rgba(2, 6, 16, 0.96);\n    user-select: none;\n}\n\n.shipyard.open {\n    display: flex;\n}\n\n.shipyard canvas {\n    position: static;\n}\n\n.shipyard-header {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    padding: 10px 20px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.25);\n}\n\n.shipyard-header h1 {\n    margin: 0;\n    font-size: 26px;\n    text-shadow: 0 0 8px rgba(140, 180, 255, 0.9);\n}\n\n.shipyard-credits {\n    flex: 1;\n    font-size: 18px;\n    color: #ffe08a;\n    text-shadow: 0 0 6px rgba(255, 200, 100, 0.7);\n}\n\n.shipyard-body {\n    flex: 1;\n    display: grid;\n    grid-template-columns: 260px 1fr 300px;\n    grid-template-rows: minmax(0, 1fr);\n    gap: 12px;\n    padding: 12px;\n    min-height: 0;\n}\n\n.shipyard-panel {\n    border: 1px solid rgba(140, 180, 255, 0.25);\n    background: rgba(10, 20, 40, 0.55);\n    padding: 10px;\n    overflow-y: auto;\n    min-height: 0;\n}\n\n.shipyard-panel h3 {\n    margin: 4px 0 8px;\n    font-size: 14px;\n    letter-spacing: 1px;\n    color: #9fc0ff;\n}\n\n.hull-cards {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-card {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 6px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    opacity: 0.75;\n}\n\n.hull-card.owned {\n    opacity: 1;\n}\n\n.hull-card.active {\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.35);\n    opacity: 1;\n}\n\n.hull-thumb {\n    flex: none;\n}\n\n.hull-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    min-width: 0;\n}\n\n.hull-name {\n    font-family: Bungee, sans-serif;\n    font-size: 15px;\n}\n\n.hull-class,\n.hull-meta {\n    color: #9fb2d8;\n    margin-bottom: 3px;\n}\n\n.hull-state {\n    color: #8cffa0;\n    font-family: Bungee, sans-serif;\n}\n\n.hull-view {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.hull-title .title-name {\n    display: block;\n    font-size: 20px;\n}\n\n.hull-title .title-desc {\n    display: block;\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n}\n\n.hull-canvas-wrap {\n    flex: 1;\n    min-height: 200px;\n    position: relative;\n    border: 1px solid rgba(140, 180, 255, 0.15);\n}\n\n.hull-canvas {\n    position: absolute !important;\n    top: 0;\n    left: 0;\n}\n\n.shipyard-hint {\n    font-family: sans-serif;\n    font-size: 12px;\n    color: #9fb2d8;\n    text-align: center;\n}\n\n.ship-stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 6px;\n}\n\n.stat {\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    padding: 4px 6px;\n}\n\n.stat-label {\n    display: block;\n    font-family: sans-serif;\n    font-size: 10px;\n    color: #9fb2d8;\n    text-transform: uppercase;\n}\n\n.stat-value {\n    font-size: 14px;\n}\n\n.module-palette {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n\n.module-item {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n    padding: 5px;\n    border: 1px solid rgba(140, 180, 255, 0.2);\n    cursor: grab;\n    touch-action: none;\n}\n\n.module-item:hover {\n    border-color: rgba(200, 220, 255, 0.6);\n}\n\n.module-item.armed {\n    border-color: rgba(140, 255, 160, 0.9);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.4);\n}\n\n.module-item.unaffordable {\n    opacity: 0.45;\n}\n\n.module-icon {\n    flex: none;\n}\n\n.module-info {\n    font-family: sans-serif;\n    font-size: 11px;\n    color: #9fb2d8;\n    min-width: 0;\n}\n\n.module-name {\n    font-family: Bungee, sans-serif;\n    font-size: 12px;\n    color: #dfe9ff;\n}\n\n.module-price {\n    color: #ffe08a;\n    margin-top: 2px;\n}\n\n.inspector {\n    font-family: sans-serif;\n    font-size: 12px;\n}\n\n.inspector p {\n    margin: 4px 0;\n}\n\n.inspector .muted {\n    color: #9fb2d8;\n}\n\n.inspector-name {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n}\n\n.inspector-stats {\n    margin: 4px 0;\n}\n\n.inspector-next {\n    color: #9fb2d8;\n    margin-bottom: 8px;\n}\n\n.inspector-actions {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.sy-button {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #dfe9ff;\n    background: rgba(40, 70, 130, 0.5);\n    border: 1px solid rgba(140, 180, 255, 0.6);\n    padding: 6px 14px;\n    cursor: pointer;\n}\n\n.sy-button:hover:not(:disabled) {\n    background: rgba(60, 100, 180, 0.7);\n    box-shadow: 0 0 8px rgba(140, 180, 255, 0.5);\n}\n\n.sy-button:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n.sy-button.small {\n    font-size: 11px;\n    padding: 3px 8px;\n}\n\n.sy-button.primary {\n    border-color: rgba(140, 255, 160, 0.8);\n    background: rgba(40, 110, 60, 0.5);\n}\n\n.sy-button.buy {\n    border-color: rgba(255, 220, 130, 0.8);\n    background: rgba(110, 90, 30, 0.5);\n}\n\n.sy-button.danger {\n    border-color: rgba(255, 130, 110, 0.7);\n    background: rgba(110, 40, 30, 0.5);\n}\n\n.shipyard-message {\n    position: absolute;\n    bottom: 24px;\n    left: 50%;\n    transform: translateX(-50%);\n    padding: 8px 16px;\n    border: 1px solid rgba(140, 180, 255, 0.5);\n    background: rgba(10, 20, 40, 0.95);\n    opacity: 0;\n    transition: opacity 0.2s;\n    pointer-events: none;\n}\n\n.shipyard-message.visible {\n    opacity: 1;\n}\n\n.drag-ghost {\n    position: fixed !important;\n    z-index: 30;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .shipyard-body {\n        grid-template-columns: 1fr;\n        grid-template-rows: none;\n        overflow-y: auto;\n    }\n\n    .hull-canvas-wrap {\n        min-height: 260px;\n    }\n\n    .ship-stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n\n.hud-bar.cargo .hud-bar-fill {\n    background: #c8aaff;\n}\n\n.menu-tip {\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n/* ---------------------------------------------------------------- Shipyard tabs & market */\n\n.shipyard-tabs {\n    display: flex;\n    gap: 4px;\n}\n\n.sy-tab {\n    font-family: Bungee, sans-serif;\n    font-size: 14px;\n    color: #9fb2d8;\n    background: transparent;\n    border: 1px solid rgba(140, 180, 255, 0.3);\n    padding: 5px 14px;\n    cursor: pointer;\n}\n\n.sy-tab.active {\n    color: #dfe9ff;\n    border-color: rgba(140, 255, 160, 0.8);\n    box-shadow: 0 0 8px rgba(140, 255, 160, 0.3);\n}\n\n.shipyard-market {\n    flex: 1;\n    padding: 12px;\n    min-height: 0;\n    overflow-y: auto;\n}\n\n.market-panel {\n    max-width: 720px;\n    margin: 0 auto;\n    font-family: sans-serif;\n    font-size: 13px;\n}\n\n.market-panel .muted {\n    color: #9fb2d8;\n}\n\n.market-warning {\n    color: #ffc98a;\n}\n\n.market-section {\n    margin-top: 20px !important;\n}\n\n.market-table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 10px 0 14px;\n}\n\n.market-table th {\n    text-align: left;\n    font-family: Bungee, sans-serif;\n    font-weight: normal;\n    font-size: 11px;\n    color: #9fc0ff;\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.3);\n}\n\n.market-table td {\n    padding: 6px;\n    border-bottom: 1px solid rgba(140, 180, 255, 0.1);\n}\n\n.market-table tr.empty td {\n    color: #6c7a99;\n}\n\n.material-name {\n    font-family: Bungee, sans-serif;\n}\n\n.swatch {\n    display: inline-block;\n    width: 10px;\n    height: 10px;\n    margin-right: 8px;\n    transform: rotate(45deg);\n}\n\n/* ---------------------------------------------------------------- Shield toggle */\n\n.shield-button {\n    position: fixed;\n    top: 12px;\n    left: 50%;\n    transform: translateX(-50%);\n    z-index: 6;\n    font-family: Bungee, sans-serif;\n    font-size: 13px;\n    padding: 6px 16px;\n    color: #dff4ff;\n    background: rgba(10, 30, 60, 0.75);\n    border: 1px solid rgba(120, 210, 255, 0.8);\n    box-shadow: 0 0 10px rgba(120, 210, 255, 0.45);\n    cursor: pointer;\n}\n\n.shield-button.down {\n    color: #ffd9a0;\n    border-color: rgba(255, 190, 110, 0.8);\n    box-shadow: 0 0 10px rgba(255, 170, 80, 0.35);\n}\n\n.shield-button.depleted {\n    color: #ff9c8a;\n    border-color: rgba(255, 110, 90, 0.8);\n    box-shadow: none;\n}\n\n.shield-button.none {\n    opacity: 0.5;\n}\n", ""]);

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